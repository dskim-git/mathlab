-- 20260527_activity_scores.sql
-- 미니활동 "도전 모드" 점수/랭킹 저장소 (범용).
--
-- 배경: 레거시 Streamlit 활동(binomial_coeff_viz 등)의 도전 모드는 점수를
--   구글시트에 적재해 학번별 최고점 랭킹을 보여줬다. 새 앱에선 이를 Supabase 로 옮긴다.
--   activity_slug 로 구분하므로 이후 galton_board / morra_game 등 다른 게임 활동도 재사용한다.
--
-- 설계 원칙(라이브 audit 2026-05-27 기준):
--   - 표시·집계용 필드(display_name/학년/반/번호)는 activity_responses 와 동일하게 비정규화 저장.
--     → 랭킹 표시에 profiles/students 조인이 불필요하고, 그 테이블 RLS 와 얽히지 않는다(재귀 회피).
--   - 제출/조회는 SECURITY DEFINER RPC 로만 한다(기존 is_admin/teacher_has_class_subject 와 동일 패턴):
--       submit_activity_score(...)  : 클라는 slug/난이도/점수만 보내고, 신원(학생 행·이름·학급)은
--                                     서버가 auth.uid() 로 직접 채운다 → 이름/학급 위조 불가.
--       activity_leaderboard(slug)  : 학생별 최고점 Top N "투영"만 반환(전체 공개 랭킹).
--   - 따라서 테이블 RLS 는 직접 접근(본인 기록 조회·교사 담당 학급·관리자)만 다룬다.
--     일반 클라의 직접 INSERT/UPDATE/DELETE 는 정책을 두지 않아 차단된다(오직 정의자 RPC 만 기록).
--
-- 전제 헬퍼: public.is_admin(), public.teacher_has_class_subject(grade,class,subject)
--   — 20260525_rls_phase3c1_activity_responses.sql 에서 생성됨.

-- ──────────────────────────────────────────────────────────────
-- 1) 테이블
-- ──────────────────────────────────────────────────────────────
create table if not exists public.activity_scores (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null references public.students(id) on delete cascade,

  -- 새 앱 미니활동 슬러그 = "<streamlit_subject_folder>/<slug>"
  activity_slug text not null,
  subject text,                       -- 교사 담당 범위 조회용(없으면 학급 단위로 노출)
  difficulty text,                    -- 활동별 의미('easy'|'mid'|'hard' 등)

  score integer not null check (score >= 0),

  -- 제출 당시 기준 비정규화(이후 학생 정보가 바뀌어도 기록 보존)
  display_name text not null,
  school_year integer,
  grade integer,
  class_number integer,
  student_number integer,

  meta jsonb not null default '{}'::jsonb,   -- 정답/오답/콤보 등 부가 통계

  created_at timestamptz not null default now()
);

create index if not exists idx_activity_scores_slug_score
  on public.activity_scores (activity_slug, score desc);

create index if not exists idx_activity_scores_student
  on public.activity_scores (student_id);

create index if not exists idx_activity_scores_class_scope
  on public.activity_scores (subject, grade, class_number);

-- ──────────────────────────────────────────────────────────────
-- 2) RLS (직접 접근만 — 기록은 아래 SECURITY DEFINER RPC 가 담당)
-- ──────────────────────────────────────────────────────────────
alter table public.activity_scores enable row level security;

-- 학생: 본인 기록 읽기(개인 히스토리)
drop policy if exists "student reads own activity_scores" on public.activity_scores;
create policy "student reads own activity_scores"
  on public.activity_scores for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = activity_scores.student_id
        and s.profile_id = auth.uid()
    )
  );

-- 교사: 담당 (subject, grade, class) 범위 읽기 (subject NULL 이면 학급 단위 노출)
drop policy if exists "teacher reads scoped activity_scores" on public.activity_scores;
create policy "teacher reads scoped activity_scores"
  on public.activity_scores for select to authenticated
  using ( public.teacher_has_class_subject(grade, class_number, subject) );

-- 관리자: 전체
drop policy if exists "admin all activity_scores" on public.activity_scores;
create policy "admin all activity_scores"
  on public.activity_scores for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- (의도적으로 비관리자용 INSERT/UPDATE/DELETE 정책 없음 → 정의자 RPC 만 기록 가능)

-- ──────────────────────────────────────────────────────────────
-- 3) 점수 제출 RPC (신원은 서버가 auth.uid() 로 채움)
-- ──────────────────────────────────────────────────────────────
create or replace function public.submit_activity_score(
  p_activity_slug text,
  p_subject       text,
  p_difficulty    text,
  p_score         integer,
  p_meta          jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_student public.students%rowtype;
  v_name    text;
  v_id      uuid;
begin
  if p_score is null or p_score < 0 then
    raise exception 'invalid score';
  end if;

  select s.* into v_student
  from public.students s
  where s.profile_id = auth.uid();

  if not found then
    raise exception 'not a student';   -- 학생만 랭킹에 기록
  end if;

  select pr.name into v_name from public.profiles pr where pr.id = auth.uid();

  insert into public.activity_scores (
    student_id, activity_slug, subject, difficulty, score,
    display_name, school_year, grade, class_number, student_number, meta
  ) values (
    v_student.id, p_activity_slug, p_subject, p_difficulty, p_score,
    coalesce(v_name, '학생'), v_student.school_year, v_student.grade,
    v_student.class_number, v_student.student_number, coalesce(p_meta, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- 4) 랭킹 조회 RPC (학생별 최고점 Top N — 전체 공개 투영)
-- ──────────────────────────────────────────────────────────────
create or replace function public.activity_leaderboard(
  p_activity_slug text,
  p_limit         integer default 20
)
returns table (
  rank           bigint,
  display_name   text,
  grade          integer,
  class_number   integer,
  best_score     integer,
  best_difficulty text,
  is_me          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with best as (
    select distinct on (s.student_id)
      s.student_id, s.display_name, s.grade, s.class_number, s.score, s.difficulty
    from public.activity_scores s
    where s.activity_slug = p_activity_slug
    order by s.student_id, s.score desc, s.created_at asc
  )
  select
    row_number() over (order by b.score desc, b.display_name asc) as rank,
    b.display_name,
    b.grade,
    b.class_number,
    b.score      as best_score,
    b.difficulty as best_difficulty,
    exists (
      select 1 from public.students me
      where me.id = b.student_id and me.profile_id = auth.uid()
    ) as is_me
  from best b
  order by b.score desc, b.display_name asc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.submit_activity_score(text, text, text, integer, jsonb) to authenticated;
grant execute on function public.activity_leaderboard(text, integer) to authenticated;

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (문제 시 SQL 에디터에서 이 블록만 실행)
-- ──────────────────────────────────────────────────────────────
-- drop function if exists public.activity_leaderboard(text, integer);
-- drop function if exists public.submit_activity_score(text, text, text, integer, jsonb);
-- drop policy if exists "student reads own activity_scores"   on public.activity_scores;
-- drop policy if exists "teacher reads scoped activity_scores" on public.activity_scores;
-- drop policy if exists "admin all activity_scores"           on public.activity_scores;
-- drop table if exists public.activity_scores;
