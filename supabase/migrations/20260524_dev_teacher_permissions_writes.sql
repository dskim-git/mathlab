-- 20260524_dev_teacher_permissions_writes.sql
-- H-1 임시(dev) 정책: 관리자가 교사 담당 학급(teacher_permissions)을 추가/삭제할 수 있게 한다.
--
-- 관리자 화면(/admin/teachers)에서 로그인한 관리자(authenticated)가
--   - teacher_permissions INSERT (담당 학급 부여)
--   - teacher_permissions DELETE (담당 학급 회수)
-- 한다. SELECT 는 이미 20260524_dev_open_authenticated.sql 에서 열어 두었다.
--
-- 주의: 지금은 "로그인한 누구나" 쓸 수 있는 임시 개방이다(Phase 1).
-- RLS 본격 강화(Phase 3)에서 "관리자(role=admin)만" 으로 좁혀 교체한다.

drop policy if exists "dev authenticated insert teacher_permissions" on public.teacher_permissions;
create policy "dev authenticated insert teacher_permissions"
  on public.teacher_permissions for insert to authenticated with check (true);

drop policy if exists "dev authenticated delete teacher_permissions" on public.teacher_permissions;
create policy "dev authenticated delete teacher_permissions"
  on public.teacher_permissions for delete to authenticated using (true);
