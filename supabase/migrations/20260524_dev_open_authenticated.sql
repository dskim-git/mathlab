-- 20260524_dev_open_authenticated.sql
-- H-1 임시(dev) 정책: 로그인(authenticated) 상태에서도 기존 anon 개방 정책처럼 읽게 한다.
--
-- 배경: 기존 dev 개방 SELECT 정책은 anon 역할만 커버한다. 교사/관리자가
-- signInWithPassword 로 로그인하면 요청 권한이 authenticated 로 바뀌어,
-- anon 전용 정책으로는 profiles/teachers/students 등을 읽지 못해 빈 결과가 된다.
-- (로그인 직후 "프로필 정보를 찾을 수 없습니다" 증상의 원인)
--
-- 여기서는 authenticated 에게도 SELECT 를 여는 permissive 정책을 "추가"한다.
-- 기존 anon 정책은 그대로 둔다(여러 permissive 정책은 OR로 합쳐진다).
-- 주의: 이는 Phase 1 임시 개방이다. RLS 본격 강화(Phase 3)에서 이 정책들을 회수/교체한다.

drop policy if exists "dev authenticated read profiles" on public.profiles;
create policy "dev authenticated read profiles"
  on public.profiles for select to authenticated using (true);

drop policy if exists "dev authenticated read students" on public.students;
create policy "dev authenticated read students"
  on public.students for select to authenticated using (true);

drop policy if exists "dev authenticated read teachers" on public.teachers;
create policy "dev authenticated read teachers"
  on public.teachers for select to authenticated using (true);

drop policy if exists "dev authenticated read teacher_permissions" on public.teacher_permissions;
create policy "dev authenticated read teacher_permissions"
  on public.teacher_permissions for select to authenticated using (true);
