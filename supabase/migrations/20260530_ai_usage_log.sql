-- 20260530_ai_usage_log.sql
-- 모든 AI 호출(현재는 세특 작성)의 토큰 사용량 로그.
-- 한 줄 = 한 번의 generate API 호출.
-- 비용은 표시 시점에 모델별 단가로 계산(=DB 비정규화 X).
--
-- 적용:  Supabase SQL 에디터에서 실행.

create table if not exists public.ai_usage_log (
  id                  uuid primary key default gen_random_uuid(),
  teacher_id          uuid not null references public.profiles(id) on delete cascade,
  student_id          uuid references public.students(id) on delete set null,
  feature             text not null default 'sebteuk', -- 향후 다른 AI 기능 추가 대비
  model               text not null,
  input_tokens        integer not null default 0,
  output_tokens       integer not null default 0,
  cache_read_tokens   integer not null default 0,
  cache_write_tokens  integer not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists ai_usage_log_teacher_idx
  on public.ai_usage_log (teacher_id, created_at desc);
create index if not exists ai_usage_log_created_at_idx
  on public.ai_usage_log (created_at desc);

alter table public.ai_usage_log enable row level security;

-- 교사 본인: 자기 행 INSERT/SELECT
drop policy if exists ai_usage_log_teacher_insert on public.ai_usage_log;
create policy ai_usage_log_teacher_insert on public.ai_usage_log
  for insert to authenticated
  with check (teacher_id = auth.uid());

drop policy if exists ai_usage_log_teacher_select on public.ai_usage_log;
create policy ai_usage_log_teacher_select on public.ai_usage_log
  for select to authenticated
  using (teacher_id = auth.uid());

-- 관리자: ALL
drop policy if exists ai_usage_log_admin_all on public.ai_usage_log;
create policy ai_usage_log_admin_all on public.ai_usage_log
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
