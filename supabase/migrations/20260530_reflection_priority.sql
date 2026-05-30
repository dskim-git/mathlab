-- 20260530_reflection_priority.sql
-- 학생이 자기 성찰 기록을 "생기부 후보"로 별표/우선순위 매기는 테이블.
-- 각 활동 응답(activity_responses) 에 하나의 우선순위 행이 매칭된다.
--
-- 사용처:
--  - 학생: /student/reflections 에서 본인 성찰에 별표·우선순위·코멘트
--  - 교사: 담당 학급 학생의 성찰 열람 시 별표/순위 같이 표시 (Step 7 이후)
--  - AI 세특 작성: 우선순위 높은 성찰을 입력 컨텍스트로 (Step 8 이후)
--
-- RLS: 학생 본인 ALL / 교사 = teacher_has_class(grade, class) SELECT / 관리자 ALL
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  select policyname, cmd from pg_policies where tablename='reflection_priority' order by policyname;

create table if not exists public.reflection_priority (
  id                    uuid primary key default gen_random_uuid(),
  activity_response_id  uuid not null unique
                          references public.activity_responses(id) on delete cascade,
  student_id            uuid not null references public.students(id) on delete cascade,
  marked                boolean not null default false,     -- 생기부 후보 체크(별표)
  priority_rank         integer,                            -- 1=최고, 2, 3 ... NULL=순위 미설정
  comment               text not null default '',           -- 학생 메모(왜 중요한지)
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists reflection_priority_student_idx
  on public.reflection_priority (student_id);
create index if not exists reflection_priority_marked_idx
  on public.reflection_priority (student_id, marked);

alter table public.reflection_priority enable row level security;

-- 학생 본인 ALL
drop policy if exists reflection_priority_owner_all on public.reflection_priority;
create policy reflection_priority_owner_all on public.reflection_priority
  for all to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = reflection_priority.student_id
        and s.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = reflection_priority.student_id
        and s.profile_id = auth.uid()
    )
  );

-- 교사: 담당 학급(과목+학년+반) 학생의 우선순위 SELECT
drop policy if exists reflection_priority_teacher_class_select on public.reflection_priority;
create policy reflection_priority_teacher_class_select on public.reflection_priority
  for select to authenticated
  using (
    exists (
      select 1
      from public.students s
      join public.activity_responses ar on ar.id = reflection_priority.activity_response_id
      where s.id = reflection_priority.student_id
        and public.teacher_has_class_subject(s.grade, s.class_number, ar.subject)
    )
  );

-- 관리자 ALL
drop policy if exists reflection_priority_admin_all on public.reflection_priority;
create policy reflection_priority_admin_all on public.reflection_priority
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- updated_at 자동 갱신
create or replace function public.set_reflection_priority_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reflection_priority_set_updated_at on public.reflection_priority;
create trigger reflection_priority_set_updated_at
  before update on public.reflection_priority
  for each row execute function public.set_reflection_priority_updated_at();
