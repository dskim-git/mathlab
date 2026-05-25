-- 20260525_rls_phase5_sessions_activities_responses.sql
-- Phase 5: sessions / activities / 레거시 responses 의 anon "쓰기" 구멍을 닫는다.
--
-- 배경(라이브 audit 2026-05-25): 이 세 테이블은 anon 에게 쓰기까지 열려 있었다.
--   sessions: anon INSERT/UPDATE/DELETE, activities: anon UPDATE, responses: anon ALL.
-- anon 키는 클라이언트 번들에 노출되므로 누구나 PostgREST 로 세션을 삭제하거나 활동
-- 콘텐츠를 덮어쓰거나 레거시 응답을 읽을 수 있었다 → 실질적 취약점.
--
-- 정당한 쓰기는 전부 "승인된 교사/관리자"(클라이언트, 인증). 읽기는 입장 화면(anon 서버)과
-- 학생 홈(activities 제목 조인)이 필요하므로 SELECT 는 공개 유지하고 쓰기만 staff 로 제한한다.

-- 승인된 교사/관리자인가.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'approved'
      and role in ('teacher', 'admin')
  );
$$;

grant execute on function public.is_staff() to authenticated;

-- ── sessions: 읽기 공개 유지, 쓰기는 staff ────────────────────
alter table public.sessions enable row level security;  -- 멱등
-- "Allow public read sessions"(anon+auth SELECT)는 그대로 둔다(입장 화면이 join_code로 조회).
drop policy if exists "Allow public insert sessions" on public.sessions;
drop policy if exists "Allow public update sessions" on public.sessions;
drop policy if exists "Allow public delete sessions" on public.sessions;

drop policy if exists "staff writes sessions" on public.sessions;
create policy "staff writes sessions"
  on public.sessions for insert to authenticated
  with check ( public.is_staff() );

drop policy if exists "staff updates sessions" on public.sessions;
create policy "staff updates sessions"
  on public.sessions for update to authenticated
  using ( public.is_staff() ) with check ( public.is_staff() );

drop policy if exists "staff deletes sessions" on public.sessions;
create policy "staff deletes sessions"
  on public.sessions for delete to authenticated
  using ( public.is_staff() );

-- ── activities: 읽기 공개 유지, 수정은 staff (생성/삭제는 막음) ──
alter table public.activities enable row level security;  -- 멱등
-- "Allow public read activities"(anon+auth SELECT)는 그대로 둔다(입장·학생홈 조인).
drop policy if exists "Allow public update activities" on public.activities;

drop policy if exists "staff updates activities" on public.activities;
create policy "staff updates activities"
  on public.activities for update to authenticated
  using ( public.is_staff() ) with check ( public.is_staff() );
-- INSERT/DELETE 정책은 두지 않는다 → 앱 경로 없음(활동은 SQL/시드로 관리). 필요 시 추후 admin 정책 추가.

-- ── responses(레거시): anon 전면 회수, staff DELETE(세션 정리) + 관리자 전체 ──
alter table public.responses enable row level security;  -- 멱등
drop policy if exists "Allow public read responses" on public.responses;
drop policy if exists "Allow public insert responses" on public.responses;
drop policy if exists "Allow public delete responses" on public.responses;

-- 교사: 세션 삭제 시 레거시 응답 정리(SessionDeleteButton)
drop policy if exists "staff deletes responses" on public.responses;
create policy "staff deletes responses"
  on public.responses for delete to authenticated
  using ( public.is_staff() );

-- 관리자: 전체(보존/정리/조회)
drop policy if exists "admin all responses" on public.responses;
create policy "admin all responses"
  on public.responses for all to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- ──────────────────────────────────────────────────────────────
-- ROLLBACK (dev 개방으로 복귀)
-- ──────────────────────────────────────────────────────────────
-- drop policy if exists "staff writes sessions" on public.sessions;
-- drop policy if exists "staff updates sessions" on public.sessions;
-- drop policy if exists "staff deletes sessions" on public.sessions;
-- create policy "Allow public insert sessions" on public.sessions for insert to anon, authenticated with check (true);
-- create policy "Allow public update sessions" on public.sessions for update to anon, authenticated using (true) with check (true);
-- create policy "Allow public delete sessions" on public.sessions for delete to anon, authenticated using (true);
-- drop policy if exists "staff updates activities" on public.activities;
-- create policy "Allow public update activities" on public.activities for update to anon, authenticated using (true) with check (true);
-- drop policy if exists "staff deletes responses" on public.responses;
-- drop policy if exists "admin all responses" on public.responses;
-- create policy "Allow public read responses" on public.responses for select to anon, authenticated using (true);
-- create policy "Allow public insert responses" on public.responses for insert to anon, authenticated with check (true);
-- create policy "Allow public delete responses" on public.responses for delete to anon, authenticated using (true);
