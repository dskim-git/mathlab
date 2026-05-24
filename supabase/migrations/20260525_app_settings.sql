-- 20260525_app_settings.sql
-- 앱 전역 설정(key-value). 우선 "현재 학년도"(current_school_year)를 둔다.
-- - 학생 회원가입 시 학번 앞에 붙일 연도(= 로그인 ID 'YYYY+학번'의 YYYY)
-- - 명렬표 업로드 기본 학년도
--
-- 학생 가입은 비로그인(anon) 상태에서 이 값을 읽어야 하므로 anon select 를 허용한다.

create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value)
values ('current_school_year', '2026')
on conflict (key) do nothing;

alter table app_settings enable row level security;

drop policy if exists "anon read app_settings" on app_settings;
create policy "anon read app_settings"
  on app_settings for select to anon using (true);

-- dev 임시: 로그인한 관리자가 설정 읽기/수정. Phase 3에서 admin 전용으로 좁힌다.
drop policy if exists "dev authenticated all app_settings" on app_settings;
create policy "dev authenticated all app_settings"
  on app_settings for all to authenticated using (true) with check (true);
