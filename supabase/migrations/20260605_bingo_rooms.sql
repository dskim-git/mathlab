-- bingo_rooms: 영재 단원 4 작도 빙고 게임의 방.
--
-- 모델: 학급별 방을 기본으로, 방 코드로도 접속 가능한 하이브리드.
--   - 교사(방장)가 자기 학급용 방 생성 → 자동 6자 영숫자 코드 발급, grade·class_number 기록.
--   - 학생: 자기 학급의 활성 방 자동 입장 / 또는 방 코드 직접 입력으로 진입.
--   - 같은 학급의 활성 방은 동시 1개만 유지 (새 방 만들면 기존 = ended).
--
-- 상태: state JSONB = { probs: {1..25: {L,E,V,owner}}, ... }
--   - 방장(교사)만 update. 학생은 read-only.
--   - Supabase Realtime(postgres_changes) 로 UPDATE 감지 → 학생 화면 자동 갱신.
--
-- RLS 요약:
--   SELECT: 인증된 모두 (방 코드는 입력으로만 노출 — 추측 어려움. 실시간 빙고 특성상 단순화)
--   INSERT: 교사·관리자, created_by 본인
--   UPDATE: 방장(created_by) OR 관리자
--   DELETE: 방장 OR 관리자
--
-- 적용:  Supabase SQL 에디터에서 그대로 실행.
-- 검증:  select policyname, cmd from pg_policies where tablename='bingo_rooms' order by policyname;

create table if not exists public.bingo_rooms (
  id              uuid primary key default gen_random_uuid(),
  room_code       text not null unique,
  created_by      uuid not null references public.profiles(id) on delete cascade,
  grade           int,
  class_number    int,
  status          text not null default 'active' check (status in ('active','ended')),
  state           jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists bingo_rooms_room_code_idx
  on public.bingo_rooms (room_code);
create index if not exists bingo_rooms_class_active_idx
  on public.bingo_rooms (grade, class_number, status);
create index if not exists bingo_rooms_created_by_idx
  on public.bingo_rooms (created_by);

alter table public.bingo_rooms enable row level security;

-- SELECT: 인증된 모두 (방 코드는 사용자 입력으로만 알 수 있어 사실상 접근 통제됨)
drop policy if exists bingo_rooms_select on public.bingo_rooms;
create policy bingo_rooms_select on public.bingo_rooms
  for select to authenticated
  using (true);

-- INSERT: 교사·관리자만, created_by 본인
drop policy if exists bingo_rooms_insert on public.bingo_rooms;
create policy bingo_rooms_insert on public.bingo_rooms
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.role = 'teacher'
          and p.status = 'approved'
      )
    )
  );

-- UPDATE: 방장(created_by) 또는 관리자
drop policy if exists bingo_rooms_update on public.bingo_rooms;
create policy bingo_rooms_update on public.bingo_rooms
  for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

-- DELETE: 방장 또는 관리자
drop policy if exists bingo_rooms_delete on public.bingo_rooms;
create policy bingo_rooms_delete on public.bingo_rooms
  for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- updated_at 자동 갱신 (state 변경 시 추적용)
create or replace function public.set_bingo_rooms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bingo_rooms_set_updated_at on public.bingo_rooms;
create trigger bingo_rooms_set_updated_at
  before update on public.bingo_rooms
  for each row execute function public.set_bingo_rooms_updated_at();

-- Realtime publication 에 등록 (이미 있으면 무시)
do $$
begin
  alter publication supabase_realtime add table public.bingo_rooms;
exception when duplicate_object then null;
when others then null;
end;
$$;
