-- 20260524_auth_phase1.sql
-- H-1 (Phase 1): Supabase Auth 토대 — auth.users ↔ profiles 자동 연결
--
-- 전제(확정 사항):
--  - 모든 계정은 "아이디(login_id) + 비밀번호"로 로그인한다.
--  - 앱은 아이디를 단일 도메인 합성 이메일({login_id}@<도메인>)로 매핑해 Supabase Auth를 쓴다.
--  - 교사도 실제 이메일이 아니라 가입 시 입력한 아이디를 쓴다.
--  - profiles.id = auth.users.id (auth.uid()) 로 일치시킨다.
--  - 자기 가입(self-signup)으로는 절대 admin 이 되거나 곧장 승인(approved)될 수 없다(항상 pending).
--  - RLS 강화는 Phase 3로 미룬다(지금은 개방 유지).

-- 1) auth.users 가 생기면 public.profiles 행을 자동 생성하는 트리거 함수
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_login_id text := nullif(trim(new.raw_user_meta_data->>'login_id'), '');
  meta_name     text := coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), '이름 미입력');
  meta_role     text := new.raw_user_meta_data->>'role';
  safe_role     text;
begin
  -- 가입자가 스스로 admin 이 되는 것을 차단한다. 허용 역할만 인정하고, 그 외에는 general.
  safe_role := case
    when meta_role in ('teacher', 'student', 'general') then meta_role
    else 'general'
  end;

  insert into public.profiles (id, login_id, name, role, status, email)
  values (
    new.id,                               -- profiles.id = auth.uid()
    coalesce(meta_login_id, new.email),   -- 아이디 (없으면 이메일로 폴백: 대시보드 직접 생성 계정 등)
    meta_name,
    safe_role,
    'pending',                            -- 항상 승인 대기로 시작
    new.email                             -- 합성 이메일 보관 (디버깅/조회용)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 2) 트리거 연결 (재실행 안전하게 drop 후 create)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
