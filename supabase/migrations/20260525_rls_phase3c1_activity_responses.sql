-- 20260525_rls_phase3c1_activity_responses.sql
-- Phase 3c-1: activity_responses RLS 본격화 (첫 테이블).
--
-- 전제(라이브 audit 2026-05-25): activity_responses 는 RLS OFF(정책 없음) → 완전 개방.
-- 여기서 RLS 를 켜고 학생/교사/관리자 정책을 만든다.
-- 뒤 단계(students/profiles/teachers/teacher_permissions) 전까지 그 테이블들은 dev-open
-- 으로 남아 있어 교사 조회의 students→profiles 조인이 계속 동작한다.
--
-- 재귀 방지: 정책에서 profiles/teachers 를 직접 EXISTS 하면 그 테이블 RLS 와 얽히므로,
-- 관리자/교사 판별은 SECURITY DEFINER 헬퍼로 RLS 를 우회해 읽는다.

-- ──────────────────────────────────────────────────────────────
-- 1) 헬퍼 함수 (이후 모든 단계에서 공통 사용)
-- ──────────────────────────────────────────────────────────────

-- 현재 사용자가 승인된 관리자인가.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'approved'
  );
$$;

-- 현재 교사가 (subject, grade, class) 담당인가.
-- 응답의 subject 가 NULL 이면 과목 무관하게 그 학급 담당 교사에게 보인다(엄격 매칭의 예외).
create or replace function public.teacher_has_class_subject(
  p_grade integer,
  p_class integer,
  p_subject text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teachers t
    join public.profiles pr on pr.id = t.profile_id
    join public.teacher_permissions tp on tp.teacher_id = t.id
    where t.profile_id = auth.uid()
      and pr.status = 'approved'
      and tp.grade = p_grade
      and tp.class_number = p_class
      and (p_subject is null or tp.subject = p_subject)
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.teacher_has_class_subject(integer, integer, text) to authenticated;

-- ──────────────────────────────────────────────────────────────
-- 2) activity_responses 정책
-- ──────────────────────────────────────────────────────────────

alter table public.activity_responses enable row level security;

-- 학생: 본인(student_id ↔ auth.uid) 기록 읽기
drop policy if exists "student reads own activity_responses" on public.activity_responses;
create policy "student reads own activity_responses"
  on public.activity_responses for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = activity_responses.student_id
        and s.profile_id = auth.uid()
    )
  );

-- 학생: 본인 기록만 쓰기 (3b 에서 student_id 를 세션 본인 값으로 채우므로 통과)
drop policy if exists "student inserts own activity_responses" on public.activity_responses;
create policy "student inserts own activity_responses"
  on public.activity_responses for insert to authenticated
  with check (
    exists (
      select 1 from public.students s
      where s.id = activity_responses.student_id
        and s.profile_id = auth.uid()
    )
  );

-- 교사: 담당 (subject, grade, class) 범위 읽기
drop policy if exists "teacher reads scoped activity_responses" on public.activity_responses;
create policy "teacher reads scoped activity_responses"
  on public.activity_responses for select to authenticated
  using ( public.teacher_has_class_subject(grade, class_number, subject) );

-- 교사: 담당 범위 삭제 (교사 세션 화면의 응답 삭제 버튼 유지)
drop policy if exists "teacher deletes scoped activity_responses" on public.activity_responses;
create policy "teacher deletes scoped activity_responses"
  on public.activity_responses for delete to authenticated
  using ( public.teacher_has_class_subject(grade, class_number, subject) );

-- 관리자: 전체
drop policy if exists "admin all activity_responses" on public.activity_responses;
create policy "admin all activity_responses"
  on public.activity_responses for all to authenticated
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (문제 시 SQL 에디터에서 이 블록만 실행)
-- ──────────────────────────────────────────────────────────────
-- drop policy if exists "student reads own activity_responses"   on public.activity_responses;
-- drop policy if exists "student inserts own activity_responses"  on public.activity_responses;
-- drop policy if exists "teacher reads scoped activity_responses" on public.activity_responses;
-- drop policy if exists "teacher deletes scoped activity_responses" on public.activity_responses;
-- drop policy if exists "admin all activity_responses"            on public.activity_responses;
-- alter table public.activity_responses disable row level security;
-- (헬퍼 is_admin / teacher_has_class_subject 는 두어도 무해)
