-- 20260607_survey_responses_profile_id.sql
-- survey_responses 를 학생+일반인 공용으로 — profile_id 추가, student_id nullable 화.
--
-- 배경:
--   초기 Phase 1 마이그는 student_id NOT NULL 로 만들어 일반인 응답 INSERT 불가.
--   설문 대상이 "학생 + 일반인" 으로 확정되어, profile 단위로 일반화.
--
-- 변경:
--   1) profile_id uuid 컬럼 추가 (FK profiles.id ON DELETE CASCADE)
--   2) student_id NOT NULL → nullable (학생 응답에서만 채움)
--   3) UNIQUE (survey_id, student_id) → UNIQUE (survey_id, profile_id)
--   4) RLS 정책 본인 분기 기준을 profile_id 로 단순화
--      교사 SELECT 는 student_id 기반(=학생 응답만, 일반인 응답은 관리자만)
--
-- 적용:  Supabase SQL editor 에서 BEGIN~COMMIT 한 번에 실행 + 마지막 SELECT 로 검증.

begin;

-- 1) profile_id 컬럼 추가
alter table public.survey_responses
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade;

-- 2) student_id NOT NULL 풀기 (이미 비어 있어 안전)
alter table public.survey_responses
  alter column student_id drop not null;

-- 3) 기존 unique 제약 → profile_id 기반으로 교체
--    제약명은 보통 survey_responses_survey_id_student_id_key (postgres 기본).
do $$
declare
  c_name text;
begin
  select conname into c_name
  from pg_constraint
  where conrelid = 'public.survey_responses'::regclass
    and contype = 'u'
    and conname like '%survey_id%student_id%';
  if c_name is not null then
    execute format('alter table public.survey_responses drop constraint %I', c_name);
  end if;
end $$;

alter table public.survey_responses
  add constraint survey_responses_survey_profile_unique
  unique (survey_id, profile_id);

-- 4) RLS 정책 재작성 — 기존 student_id 기반 owner 정책을 profile_id 기반으로.
drop policy if exists survey_responses_owner_insert on public.survey_responses;
create policy survey_responses_owner_insert on public.survey_responses
  for insert to authenticated
  with check (profile_id = auth.uid());

drop policy if exists survey_responses_owner_select on public.survey_responses;
create policy survey_responses_owner_select on public.survey_responses
  for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists survey_responses_owner_update on public.survey_responses;
create policy survey_responses_owner_update on public.survey_responses
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- 교사 SELECT 는 그대로 (학생 응답만 — student_id 가 채워진 행).
-- admin_all 도 그대로.

-- 5) 검증
select column_name, is_nullable, data_type
  from information_schema.columns
  where table_schema='public' and table_name='survey_responses'
    and column_name in ('profile_id','student_id')
  order by column_name;

select conname, contype
  from pg_constraint
  where conrelid = 'public.survey_responses'::regclass
    and contype in ('u','f');

select policyname, cmd
  from pg_policies
  where tablename = 'survey_responses'
  order by policyname;

-- 기대값:
--   profile_id: nullable=YES, uuid  (NOT NULL 은 다음 라운드에 채워진 뒤 적용)
--   student_id: nullable=YES, uuid
--   constraints: survey_responses_survey_profile_unique (u) + 기존 FK 3개 (f)
--   정책 5개: owner_insert/owner_select/owner_update/teacher_select/admin_all

commit;
