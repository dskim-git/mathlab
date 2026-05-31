-- 20260531_learning_progress.sql
-- 학생/일반인/교사/관리자가 /learn 에서 "마지막으로 본 소단원(잎)" 을 기록해
-- 홈 대시보드의 "이어보기" KPI 에 표시한다.
--
-- 한 (profile_id, subject, unit_key) 당 한 행. 같은 잎을 다시 열면 last_seen_at 만 갱신(upsert).
-- 표시용으로 unit_title 도 함께 저장(curriculum_units 의 label 캐시; 단원명 바뀌어도 마지막 본 시점 기준).
--
-- RLS: 본인 ALL + 관리자 ALL. 다른 사용자의 진도는 보이지 않음(교사 진도 노출은 별도 검토).
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:  select column_name, data_type from information_schema.columns
--           where table_schema='public' and table_name='learning_progress';
--        select policyname, cmd from pg_policies
--           where tablename='learning_progress' order by policyname;

create table if not exists public.learning_progress (
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  subject      text not null references public.subjects(name) on update cascade on delete restrict,
  unit_key     text not null,
  unit_title   text not null,
  last_seen_at timestamptz not null default now(),
  primary key (profile_id, subject, unit_key)
);

create index if not exists learning_progress_profile_lastseen_idx
  on public.learning_progress (profile_id, last_seen_at desc);

alter table public.learning_progress enable row level security;

-- 본인 ALL
drop policy if exists learning_progress_owner_all on public.learning_progress;
create policy learning_progress_owner_all on public.learning_progress
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- 관리자 ALL
drop policy if exists learning_progress_admin_all on public.learning_progress;
create policy learning_progress_admin_all on public.learning_progress
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 빠른 audit
-- select count(*) as rows from public.learning_progress;
-- select profile_id, subject, unit_title, last_seen_at
--   from public.learning_progress order by last_seen_at desc limit 10;
