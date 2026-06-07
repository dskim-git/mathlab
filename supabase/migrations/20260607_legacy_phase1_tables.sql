-- 20260607_legacy_phase1_tables.sql
-- 레거시(구앱 Streamlit + Google Sheets) 이식 Phase 1 — 신설 테이블 4개 + profiles 컬럼 1개.
--
-- 추가되는 스키마:
--   1) profiles.must_change_password  — 임시 비번(11111111) 발급 후 첫 로그인 강제 변경 플래그
--   2) legacy_reflections             — 구앱 활동 성찰 보존 (활동마다 컬럼 동적이라 JSONB payload 단일)
--   3) surveys                        — 사전/사후 설문 정의 (옛 + 새 공용)
--   4) survey_responses               — 설문 응답 (옛 + 새 공용, is_legacy 플래그)
--   5) legacy_users_audit             — 이식 추적 (운영 끝나면 drop 가능)
--
-- RLS 요약:
--   legacy_reflections : 본인 SELECT / 담당 교사 SELECT / 관리자 ALL
--   surveys            : 모든 authenticated SELECT (활성 필터는 앱) / 관리자 ALL
--   survey_responses   : 본인 INSERT·SELECT·UPDATE / 담당 교사 SELECT / 관리자 ALL
--   legacy_users_audit : 관리자만
--
-- 적용:  Supabase SQL editor 에서 BEGIN~COMMIT 한 번에 실행 후 마지막 두 SELECT 로 검증.
-- 의존:  public.is_admin() / public.teacher_has_class(grade, class_number)  헬퍼 (이미 존재).
-- ────────────────────────────────────────────────────────────────────────

begin;

-- ════════════════════════════════════════════════════════════
-- 1) profiles.must_change_password
-- ════════════════════════════════════════════════════════════
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- ════════════════════════════════════════════════════════════
-- 2) legacy_reflections — 구앱 활동 성찰 보존
-- ════════════════════════════════════════════════════════════
create table if not exists public.legacy_reflections (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.students(id) on delete cascade,
  source_subject    text,             -- '공통수학' / '확률과통계' 등 (옛 구분, free text)
  activity_label    text not null,    -- 옛 탭명 (예: '다항식의정리', '비밀번호탐색기')
  payload           jsonb not null,   -- {timestamp, 문제1, 답1, ..., 새롭게알게된점, 느낀점, ...}
  legacy_created_at timestamptz,      -- 옛 제출시각 (있으면)
  imported_at       timestamptz not null default now()
);

create index if not exists legacy_reflections_student_idx
  on public.legacy_reflections (student_id, legacy_created_at desc);
create index if not exists legacy_reflections_activity_idx
  on public.legacy_reflections (activity_label);

alter table public.legacy_reflections enable row level security;

drop policy if exists legacy_reflections_owner_select on public.legacy_reflections;
create policy legacy_reflections_owner_select on public.legacy_reflections
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = legacy_reflections.student_id
        and s.profile_id = auth.uid()
    )
  );

drop policy if exists legacy_reflections_teacher_select on public.legacy_reflections;
create policy legacy_reflections_teacher_select on public.legacy_reflections
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = legacy_reflections.student_id
        and public.teacher_has_class(s.grade, s.class_number)
    )
  );

drop policy if exists legacy_reflections_admin_all on public.legacy_reflections;
create policy legacy_reflections_admin_all on public.legacy_reflections
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- 3) surveys — 사전/사후 설문 정의
-- ════════════════════════════════════════════════════════════
create table if not exists public.surveys (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,     -- 'pre_survey_2026' / 'post_survey_2026' 등
  title        text not null,
  description  text,
  kind         text,                     -- 'pre' / 'post' / 'other'
  questions    jsonb not null,           -- [{id, prompt, kind:'text'|'select'|'scale', options?}, ...]
  is_active    boolean not null default false, -- 관리자 on/off 토글
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.set_surveys_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists surveys_set_updated_at on public.surveys;
create trigger surveys_set_updated_at
  before update on public.surveys
  for each row execute function public.set_surveys_updated_at();

alter table public.surveys enable row level security;

drop policy if exists surveys_select on public.surveys;
create policy surveys_select on public.surveys
  for select to authenticated
  using (true);  -- 활성 필터는 앱 측 — 관리자가 미리보기·편집을 위해 모든 행 SELECT 필요

drop policy if exists surveys_admin_all on public.surveys;
create policy surveys_admin_all on public.surveys
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- 4) survey_responses — 설문 응답 (옛 + 새 공용)
-- ════════════════════════════════════════════════════════════
create table if not exists public.survey_responses (
  id                uuid primary key default gen_random_uuid(),
  survey_id         uuid not null references public.surveys(id) on delete cascade,
  student_id        uuid not null references public.students(id) on delete cascade,
  answers           jsonb not null,             -- {questionId: answer, ...}
  is_legacy         boolean not null default false,
  legacy_created_at timestamptz,                -- 옛 제출시각 (있으면)
  created_at        timestamptz not null default now(),
  unique (survey_id, student_id)                -- 1 설문 × 1 학생 = 1 응답
);

create index if not exists survey_responses_survey_idx
  on public.survey_responses (survey_id);
create index if not exists survey_responses_student_idx
  on public.survey_responses (student_id);

alter table public.survey_responses enable row level security;

drop policy if exists survey_responses_owner_insert on public.survey_responses;
create policy survey_responses_owner_insert on public.survey_responses
  for insert to authenticated
  with check (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  );

drop policy if exists survey_responses_owner_select on public.survey_responses;
create policy survey_responses_owner_select on public.survey_responses
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = survey_responses.student_id and s.profile_id = auth.uid()
    )
  );

drop policy if exists survey_responses_owner_update on public.survey_responses;
create policy survey_responses_owner_update on public.survey_responses
  for update to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = survey_responses.student_id and s.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  );

drop policy if exists survey_responses_teacher_select on public.survey_responses;
create policy survey_responses_teacher_select on public.survey_responses
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = survey_responses.student_id
        and public.teacher_has_class(s.grade, s.class_number)
    )
  );

drop policy if exists survey_responses_admin_all on public.survey_responses;
create policy survey_responses_admin_all on public.survey_responses
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- 5) legacy_users_audit — 이식 추적 (운영 끝나면 drop 가능)
-- ════════════════════════════════════════════════════════════
create table if not exists public.legacy_users_audit (
  id              uuid primary key default gen_random_uuid(),
  legacy_login_id text,
  legacy_name     text,
  legacy_group    text,                  -- '학생' / '휘문고 수학과' / '영재(260321)' 등
  new_profile_id  uuid references public.profiles(id) on delete set null,
  status          text,                  -- 'imported' / 'matched_existing' / 'skipped' / 'failed'
  note            text,
  imported_at     timestamptz not null default now()
);

create index if not exists legacy_users_audit_login_idx
  on public.legacy_users_audit (legacy_login_id);
create index if not exists legacy_users_audit_status_idx
  on public.legacy_users_audit (status);

alter table public.legacy_users_audit enable row level security;

drop policy if exists legacy_users_audit_admin_all on public.legacy_users_audit;
create policy legacy_users_audit_admin_all on public.legacy_users_audit
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ════════════════════════════════════════════════════════════
-- 6) 검증 — 행 수 + 정책 목록
-- ════════════════════════════════════════════════════════════
select 'profiles.must_change_password(col)' as t,
       count(*)::int as n
  from information_schema.columns
  where table_schema='public' and table_name='profiles' and column_name='must_change_password'
union all select 'legacy_reflections',  count(*)::int from public.legacy_reflections
union all select 'surveys',             count(*)::int from public.surveys
union all select 'survey_responses',    count(*)::int from public.survey_responses
union all select 'legacy_users_audit',  count(*)::int from public.legacy_users_audit;

-- 기대값:
--   profiles.must_change_password(col) = 1
--   legacy_reflections / surveys / survey_responses / legacy_users_audit = 0

-- RLS 정책 목록 (참고):
select tablename, policyname, cmd
from pg_policies
where tablename in ('legacy_reflections','surveys','survey_responses','legacy_users_audit')
order by tablename, policyname;

-- 기대 정책 수:
--   legacy_reflections : 3 (owner_select / teacher_select / admin_all)
--   surveys            : 2 (select / admin_all)
--   survey_responses   : 5 (owner_insert / owner_select / owner_update / teacher_select / admin_all)
--   legacy_users_audit : 1 (admin_all)

commit;

-- ─── 롤백 가이드 ─────────────────────────────────────────────────────────
-- 위 commit; 을 ROLLBACK; 으로 바꿔 실행하면 전체 취소.
-- 일부만 되돌리려면 (테이블 drop):
--   drop table if exists public.legacy_users_audit cascade;
--   drop table if exists public.survey_responses cascade;
--   drop table if exists public.surveys cascade;
--   drop table if exists public.legacy_reflections cascade;
--   drop function if exists public.set_surveys_updated_at();
--   alter table public.profiles drop column if exists must_change_password;
-- ────────────────────────────────────────────────────────────────────────
