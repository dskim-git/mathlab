-- bingo_rooms Realtime publication 보강.
--
-- 이전 마이그레이션(20260605_bingo_rooms.sql)의 `do $$ begin alter publication ... exception when others then null; end; $$;`
-- 가 silent fail 한 경우 대비. 직접 ADD 하고 결과를 확인.
--
-- 검증:
--   select * from pg_publication_tables
--    where pubname = 'supabase_realtime' and tablename = 'bingo_rooms';
--   -- 1 row 가 나와야 정상.

do $$
begin
  alter publication supabase_realtime add table public.bingo_rooms;
exception when duplicate_object then null;
end;
$$;

-- (참고) Supabase 콘솔에서 Database → Publications → supabase_realtime 에 bingo_rooms 가
-- 체크되어 있어야 클라이언트 postgres_changes 구독이 동작. 위 SQL 이 그 토글과 같음.
