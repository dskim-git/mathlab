-- 20260524_dev_open_authenticated_writes.sql
-- H-1 임시(dev) 정책: 관리자 승인 대시보드 동작에 필요한 authenticated 쓰기 허용.
--
-- 승인 동작은 로그인한 관리자(authenticated)가
--   1) profiles.status 를 approved/rejected 로 UPDATE
--   2) 교사 승인 시 teachers 행을 INSERT
-- 한다. 기존 dev 개방 정책은 anon 위주라 authenticated 쓰기를 커버하지 못한다.
--
-- 주의: 지금은 "로그인한 누구나" 쓸 수 있는 임시 개방이다(Phase 1).
-- RLS 본격 강화(Phase 3)에서 "관리자(role=admin)만" 으로 좁혀 교체한다.

drop policy if exists "dev authenticated update profiles" on public.profiles;
create policy "dev authenticated update profiles"
  on public.profiles for update to authenticated using (true) with check (true);

drop policy if exists "dev authenticated insert teachers" on public.teachers;
create policy "dev authenticated insert teachers"
  on public.teachers for insert to authenticated with check (true);
