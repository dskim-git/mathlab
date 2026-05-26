-- 20260526_edit_perms_rls.sql
-- 블록 편집 권한 강화: 세션=소유자(생성 교사)+관리자 / 활동 템플릿=관리자 전용.
-- 선행: 20260526_session_owner.sql (sessions.created_by 추가).
-- 적용 순서: UI 게이트 코드 배포 후 이 RLS 적용(UI에서 막힌 뒤 DB에서 잠그기).
--
-- 주의(행 단위 RLS): sessions UPDATE 제한은 블록편집뿐 아니라 상태토글·삭제에도 함께 적용된다
--   → 교사는 '자기 세션만' 관리(관리자는 전체). 기존 created_by=null 세션은 관리자만.

-- 1) sessions UPDATE: is_staff() → 소유자 또는 관리자.
drop policy if exists "staff updates sessions" on public.sessions;
create policy "owner or admin updates sessions"
  on public.sessions for update to authenticated
  using (is_admin() or created_by = auth.uid())
  with check (is_admin() or created_by = auth.uid());

-- 2) sessions DELETE: is_staff() → 소유자 또는 관리자.
drop policy if exists "staff deletes sessions" on public.sessions;
create policy "owner or admin deletes sessions"
  on public.sessions for delete to authenticated
  using (is_admin() or created_by = auth.uid());

-- 3) activities UPDATE: is_staff() → 관리자 전용(공유 템플릿).
drop policy if exists "staff updates activities" on public.activities;
create policy "admin updates activities"
  on public.activities for update to authenticated
  using (is_admin())
  with check (is_admin());

-- 그대로 유지: sessions INSERT("staff writes sessions", is_staff) / SELECT(public),
--   activities SELECT(public), activities INSERT·DELETE(잠김).

-- ── 검증 (적용 후) ──
-- select tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname='public' and tablename in ('sessions','activities')
-- order by tablename, cmd, policyname;

-- ── ROLLBACK ──
-- drop policy if exists "owner or admin updates sessions" on public.sessions;
-- create policy "staff updates sessions" on public.sessions for update to authenticated
--   using (is_staff()) with check (is_staff());
-- drop policy if exists "owner or admin deletes sessions" on public.sessions;
-- create policy "staff deletes sessions" on public.sessions for delete to authenticated
--   using (is_staff());
-- drop policy if exists "admin updates activities" on public.activities;
-- create policy "staff updates activities" on public.activities for update to authenticated
--   using (is_staff()) with check (is_staff());
