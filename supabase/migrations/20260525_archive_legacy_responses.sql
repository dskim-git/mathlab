-- 20260525_archive_legacy_responses.sql
-- 레거시 responses 테이블 아카이브: 익명-세션 시절 MVP 응답(12행)을 정적 스냅샷으로 보존.
--
-- 배경: 새 데이터는 activity_responses 로 이관 완료(G단계). responses 는 읽기/insert 0,
--   유일한 코드 연결이던 SessionDeleteButton 의 청소 delete 도 제거함(이 커밋).
-- audit(2026-05-25): rows=12, distinct_sessions=3, 고아 0, 이 테이블을 참조하는 FK 없음.
--   제약: responses_pkey(id), responses_session_id_fkey → sessions(id) ON DELETE CASCADE.
--
-- 조치:
--   1) responses → responses_archive 로 rename (활성 스키마/API 표면에서 분리, 데이터 보존).
--   2) session FK 제거 — rename만 하면 세션 삭제 시 ON DELETE CASCADE 가 보존하려던 기록까지
--      지워버리므로, FK를 끊어 sessions 와 무관한 정적 스냅샷으로 만든다.
--
-- 배포 순서(중요): 코드에서 responses 참조 제거분이 prod 에 배포된 뒤 이 SQL 을 적용한다.
--   (구버전 코드가 살아있는 동안 rename 하면 세션삭제가 깨짐.)
-- 참고: RLS 정책(Phase 5: staff DELETE + admin all)은 rename 과 함께 따라온다. 완전 동결을
--   원하면 staff DELETE 정책 제거 등 추가 잠금 가능(이번엔 미적용).
-- 나중에 완전 폐기 시: drop table public.responses_archive;

alter table public.responses rename to responses_archive;

alter table public.responses_archive
  drop constraint responses_session_id_fkey;

-- ── 검증용 (적용 후 실행) ─────────────────────────────────────
-- select to_regclass('public.responses')          as old_name,   -- 기대: NULL(빈칸)
--        to_regclass('public.responses_archive')  as new_name;   -- 기대: public.responses_archive
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint where conrelid='public.responses_archive'::regclass;  -- session FK 없어야 함
-- select count(*) from public.responses_archive;  -- 기대: 12

-- ── ROLLBACK (되돌리기) ───────────────────────────────────────
-- alter table public.responses_archive rename to responses;
-- alter table public.responses
--   add constraint responses_session_id_fkey
--   foreign key (session_id) references public.sessions(id) on delete cascade;
