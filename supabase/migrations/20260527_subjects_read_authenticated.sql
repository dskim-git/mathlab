-- 20260527_subjects_read_authenticated.sql
-- subjects: 로그인 사용자 SELECT 허용 (교과 탐색 UI가 교과명/순서를 읽어야 함).
--
-- 배경: subjects 는 'admin all'(admin 전용 ALL) 정책뿐이었다. 이제 학생/교사/일반인이
--   /learn 에서 자기 접근 교과를 교육과정 순서(order_index)로 보려면 교과명/순서 읽기가 필요하다.
--   교과명·순서는 비민감(어떤 과목이 있는지)이므로 SELECT 만 전체 개방하고, 쓰기는 admin 유지.
--
-- RLS 정책은 permissive(OR) → SELECT 는 (admin all OR authenticated read) 로 모두 허용되고,
--   INSERT/UPDATE/DELETE 는 여전히 'admin all'(is_admin) 만 통과한다.

alter table public.subjects enable row level security;  -- 멱등

drop policy if exists "authenticated read subjects" on public.subjects;
create policy "authenticated read subjects"
  on public.subjects for select to authenticated
  using ( true );

-- ── 검증 (적용 후) ──
-- select policyname, cmd from pg_policies where tablename='subjects' order by policyname;
--   기대: "admin all subjects"(ALL) + "authenticated read subjects"(SELECT)

-- ── ROLLBACK ──
-- drop policy if exists "authenticated read subjects" on public.subjects;
