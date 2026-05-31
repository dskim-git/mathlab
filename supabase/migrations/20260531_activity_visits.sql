-- 20260531_activity_visits.sql
-- 학생이 미니활동 페이지에 진입할 때마다 1행 INSERT.
-- 목적:
--   (1) 학생 본인 동선 추적 ("내 활동" 이력 화면 = 시뮬레이션 방문 시간순)
--   (2) 관리자/교사 집계 ("어떤 활동이 가장 많이 수행됐는지" — 자료 개발 참고)
--
-- 매 마운트 = 1행. 짧은 시간 안에 다른 단원 다녀와도 각각 행으로 쌓는다(자연스러움).
-- 단원 단위 마지막 본 위치 추적은 별도 learning_progress 가 담당(중복 없음).
-- RLS:
--   본인 SELECT/INSERT, 관리자 ALL, 교사 SELECT(담당 학년·반 학생).
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:  select column_name, data_type from information_schema.columns
--           where table_schema='public' and table_name='activity_visits' order by ordinal_position;
--        select policyname, cmd from pg_policies
--           where tablename='activity_visits' order by policyname;

create table if not exists public.activity_visits (
  id            bigserial primary key,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  activity_slug text not null,
  -- /learn 컨텍스트에서 전달된 교과명. 집계 쿼리 단순화용(slug prefix 의존 회피).
  subject       text,
  visited_at    timestamptz not null default now()
);

create index if not exists activity_visits_profile_visited_idx
  on public.activity_visits (profile_id, visited_at desc);

create index if not exists activity_visits_slug_idx
  on public.activity_visits (activity_slug);

create index if not exists activity_visits_subject_slug_idx
  on public.activity_visits (subject, activity_slug);

alter table public.activity_visits enable row level security;

-- 본인 SELECT
drop policy if exists activity_visits_owner_select on public.activity_visits;
create policy activity_visits_owner_select on public.activity_visits
  for select to authenticated
  using (profile_id = auth.uid());

-- 본인 INSERT
drop policy if exists activity_visits_owner_insert on public.activity_visits;
create policy activity_visits_owner_insert on public.activity_visits
  for insert to authenticated
  with check (profile_id = auth.uid());

-- 관리자 ALL (집계·조회·정리)
drop policy if exists activity_visits_admin_all on public.activity_visits;
create policy activity_visits_admin_all on public.activity_visits
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 교사 SELECT — 자기 담당 학급 학생의 방문만 (subject 무관, 학년·반만 매칭).
-- teacher_has_class(grade, class) 헬퍼는 activity_responses 등에서 이미 사용 중.
drop policy if exists activity_visits_teacher_class_select on public.activity_visits;
create policy activity_visits_teacher_class_select on public.activity_visits
  for select to authenticated
  using (
    exists (
      select 1
        from public.students s
       where s.profile_id = activity_visits.profile_id
         and public.teacher_has_class(s.grade, s.class_number)
    )
  );

-- 빠른 audit
-- select count(*) as rows from public.activity_visits;
-- select activity_slug, count(*) as visits
--   from public.activity_visits group by activity_slug order by visits desc limit 20;
