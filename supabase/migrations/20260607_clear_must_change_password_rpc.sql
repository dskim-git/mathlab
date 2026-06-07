-- 20260607_clear_must_change_password_rpc.sql
-- 본인이 must_change_password=true → false 로 풀어주는 SECURITY DEFINER RPC.
--
-- 배경:
--   profiles RLS 정책상 본인 UPDATE 가 없다(관리자/교사 SELECT 만 있음).
--   임시 비번 변경 후 must_change_password 만 풀어야 하는데, 본인 일반 UPDATE
--   정책을 열면 role/status 등도 자유 변경 가능해 권한 탈취 위험.
--   → 정확히 그 한 컬럼만 풀어주는 RPC 로 한정.

create or replace function public.clear_must_change_password()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set must_change_password = false
  where id = auth.uid();
$$;

grant execute on function public.clear_must_change_password() to authenticated;

-- 검증:
--   select proname, prosecdef from pg_proc where proname = 'clear_must_change_password';
--   기대: prosecdef = true (SECURITY DEFINER)
