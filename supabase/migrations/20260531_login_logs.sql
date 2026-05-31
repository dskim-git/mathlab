-- 20260531_login_logs.sql
-- 사용자 일자별 접속 로그.
-- 한 사용자가 같은 날 여러 번 들어와도 1행(unique profile_id+log_date).
-- log_date 는 KST 기준 'YYYY-MM-DD' (앱에서 명시 계산해 넘긴다 — server timezone 의존 회피).
--
-- 사용처:
--   - 관리자 대시보드 KPI "오늘 접속자" = login_logs where log_date=today 카운트
--   - /admin/stats 의 일·주·월·연 접속 통계
--
-- RLS:
--   본인 INSERT/SELECT, 관리자 ALL.
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:
--   select column_name, data_type from information_schema.columns
--     where table_schema='public' and table_name='login_logs' order by ordinal_position;
--   select policyname, cmd from pg_policies
--     where tablename='login_logs' order by policyname;

create table if not exists public.login_logs (
  id          bigserial primary key,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  log_date    date not null,
  logged_at   timestamptz not null default now(),
  unique (profile_id, log_date)
);

create index if not exists login_logs_date_idx
  on public.login_logs (log_date desc);
create index if not exists login_logs_profile_date_idx
  on public.login_logs (profile_id, log_date desc);

alter table public.login_logs enable row level security;

-- 본인 SELECT
drop policy if exists login_logs_owner_select on public.login_logs;
create policy login_logs_owner_select on public.login_logs
  for select to authenticated
  using (profile_id = auth.uid());

-- 본인 INSERT (자기 신원으로만)
drop policy if exists login_logs_owner_insert on public.login_logs;
create policy login_logs_owner_insert on public.login_logs
  for insert to authenticated
  with check (profile_id = auth.uid());

-- 관리자 ALL (집계·조회·정리)
drop policy if exists login_logs_admin_all on public.login_logs;
create policy login_logs_admin_all on public.login_logs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 빠른 audit
-- select count(*) as rows from public.login_logs;
-- select log_date, count(*) from public.login_logs
--   group by log_date order by log_date desc limit 14;
