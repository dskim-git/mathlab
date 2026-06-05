-- study_groups RLS 재귀 수정.
--
-- 원인:
--   study_group_members 의 SELECT 정책이 "같은 그룹 동료" 조회를 위해
--   자기 자신(study_group_members) 을 EXISTS 서브쿼리로 참조했음.
--   PostgreSQL 은 서브쿼리 SELECT 에도 RLS 정책을 적용 → 자기 정책 재귀 발동 →
--   "infinite recursion detected in policy for relation study_group_members".
--   (study_groups / study_group_subjects 정책도 같은 self-recursive 패턴을 트리거.)
--
-- 해결:
--   SECURITY DEFINER 헬퍼 함수 public.is_group_member(group_id) 추가.
--   함수 안에서 study_group_members 를 SELECT 할 때는 owner(postgres) 권한이라
--   RLS 가 bypass 됨 — 재귀 없음. 기존 [[mathlab-current-progress]] phase 3c 의
--   is_admin() / teacher_has_class() 와 동일한 우회 패턴.
--
--   세 테이블의 SELECT 정책을 함수 호출로 교체.
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:
--   select policyname, cmd, qual from pg_policies
--    where tablename like 'study_group%' and cmd = 'SELECT' order by tablename;
--   select * from public.study_groups limit 1;  -- 더 이상 재귀 오류 없어야 함

-- ─────────────────────────────────────────────────────────────
-- 1) SECURITY DEFINER 헬퍼
-- ─────────────────────────────────────────────────────────────

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.study_group_members
    where group_id = p_group_id
      and profile_id = auth.uid()
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2) SELECT 정책 교체 — 함수 호출로 단순화 (재귀 제거)
-- ─────────────────────────────────────────────────────────────

-- study_groups: 관리자 OR 본인이 멤버인 그룹
drop policy if exists study_groups_select on public.study_groups;
create policy study_groups_select on public.study_groups
  for select to authenticated
  using (
    public.is_admin()
    or public.is_group_member(id)
  );

-- study_group_members: 관리자 OR 본인 행 OR 본인이 멤버인 그룹의 동료
drop policy if exists study_group_members_select on public.study_group_members;
create policy study_group_members_select on public.study_group_members
  for select to authenticated
  using (
    public.is_admin()
    or profile_id = auth.uid()
    or public.is_group_member(group_id)
  );

-- study_group_subjects: 관리자 OR 본인이 그 그룹의 멤버
drop policy if exists study_group_subjects_select on public.study_group_subjects;
create policy study_group_subjects_select on public.study_group_subjects
  for select to authenticated
  using (
    public.is_admin()
    or public.is_group_member(group_id)
  );
