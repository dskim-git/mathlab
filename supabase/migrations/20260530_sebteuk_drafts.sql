-- 20260530_sebteuk_drafts.sql
-- AI세특 초안 저장 테이블 + 이중 잠금 RLS.
-- INSERT 시 teachers.ai_sebteuk_enabled = true 인 교사만 통과(가드 = 페이지 + RLS).
--
-- 적용:  Supabase SQL 에디터에서 실행.
-- 검증:  select policyname, cmd from pg_policies where tablename='sebteuk_drafts' order by policyname;

create table if not exists public.sebteuk_drafts (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid not null references public.profiles(id) on delete cascade,
  student_id    uuid not null references public.students(id) on delete cascade,
  school_year   integer not null,
  body          text not null default '',
  ai_model      text,
  ai_usage      jsonb,
  status        text not null default 'draft'
                  check (status in ('draft', 'finalized')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  finalized_at  timestamptz
);

create index if not exists sebteuk_drafts_teacher_idx
  on public.sebteuk_drafts (teacher_id, school_year);
create index if not exists sebteuk_drafts_student_idx
  on public.sebteuk_drafts (student_id, school_year);

alter table public.sebteuk_drafts enable row level security;

-- 교사: 자기 행 SELECT/UPDATE/DELETE
drop policy if exists sebteuk_drafts_teacher_select on public.sebteuk_drafts;
create policy sebteuk_drafts_teacher_select on public.sebteuk_drafts
  for select to authenticated
  using (teacher_id = auth.uid());

drop policy if exists sebteuk_drafts_teacher_update on public.sebteuk_drafts;
create policy sebteuk_drafts_teacher_update on public.sebteuk_drafts
  for update to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists sebteuk_drafts_teacher_delete on public.sebteuk_drafts;
create policy sebteuk_drafts_teacher_delete on public.sebteuk_drafts
  for delete to authenticated
  using (teacher_id = auth.uid());

-- INSERT 이중 잠금: 본인 + ai_sebteuk_enabled=true 인 교사 OR 관리자
drop policy if exists sebteuk_drafts_teacher_insert on public.sebteuk_drafts;
create policy sebteuk_drafts_teacher_insert on public.sebteuk_drafts
  for insert to authenticated
  with check (
    (
      teacher_id = auth.uid()
      and exists (
        select 1 from public.teachers t
        where t.profile_id = auth.uid()
          and t.ai_sebteuk_enabled = true
      )
    )
    or public.is_admin()
  );

-- 관리자: 전체 ALL
drop policy if exists sebteuk_drafts_admin_all on public.sebteuk_drafts;
create policy sebteuk_drafts_admin_all on public.sebteuk_drafts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- updated_at 자동 갱신
create or replace function public.set_sebteuk_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sebteuk_drafts_set_updated_at on public.sebteuk_drafts;
create trigger sebteuk_drafts_set_updated_at
  before update on public.sebteuk_drafts
  for each row execute function public.set_sebteuk_drafts_updated_at();
