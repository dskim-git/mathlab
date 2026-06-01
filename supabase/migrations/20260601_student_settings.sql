-- 20260601_student_settings.sql
-- 학생 본인 설정 — 1차에서는 주간 목표(weekly_goal). 후속 항목(테마/알림 선호도 등) 은 컬럼 추가.
--
-- PK = profile_id 라 학생 본인 1행만. NULL 이면 GamificationCard 가 기본값(5) 사용.
-- RLS: 본인 ALL + 관리자 ALL. 학생/일반/교사 모두 자기 행만 보임.
-- (다른 역할은 게이미피케이션이 없지만 향후 확장을 위해 student_settings 가 아닌 user_settings 이름으로 시작.)
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:
--   select column_name, data_type from information_schema.columns
--     where table_schema='public' and table_name='user_settings' order by ordinal_position;
--   select policyname, cmd from pg_policies
--     where tablename='user_settings' order by policyname;

create table if not exists public.user_settings (
  profile_id  uuid primary key references public.profiles(id) on delete cascade,
  weekly_goal integer check (weekly_goal is null or (weekly_goal between 1 and 30)),
  updated_at  timestamptz not null default now()
);

alter table public.user_settings enable row level security;

-- 본인 ALL
drop policy if exists user_settings_owner_all on public.user_settings;
create policy user_settings_owner_all on public.user_settings
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- 관리자 ALL
drop policy if exists user_settings_admin_all on public.user_settings;
create policy user_settings_admin_all on public.user_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- updated_at 자동 갱신
create or replace function public.set_user_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_user_settings_updated_at();
