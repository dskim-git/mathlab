-- 20260526_session_content_blocks.sql
-- 세션별 콘텐츠 블록 덮어쓰기.
--
-- 목적: activities.content_blocks 는 '공유 템플릿(후보 자료)'으로 두고, 각 교사가
--   자기 세션에서 블록 순서·취사선택을 자기 방식대로 커스터마이즈할 수 있게 한다.
--   → 같은 활동이라도 교사마다 다른 구성으로 수업 가능(다른 교사엔 영향 없음).
--
-- 렌더 해석 우선순위(코드): sessions.content_blocks → activities.content_blocks → 코드 fallback.
--
-- 안전성:
--   - 추가형 nullable 컬럼. 기존 세션(3행)은 null → 활동 블록으로 fallback 되어 동작 불변.
--   - RLS 변경 불필요: sessions 는 이미 public SELECT(학생 입장 읽기) +
--     staff UPDATE/INSERT/DELETE(is_staff()) 정책이 있어, 승인 교사가 자기 세션의
--     content_blocks 를 수정하고 학생이 읽는 것이 모두 허용된다.
--   - audit(2026-05-26): sessions.content_blocks 컬럼 없음(추가 예정), 세션 3행.

alter table public.sessions
  add column if not exists content_blocks jsonb;

-- ── 검증 (적용 후 실행) ─────────────────────────────────────
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'sessions'
--   and column_name = 'content_blocks';   -- 기대: content_blocks | jsonb

-- ── ROLLBACK (되돌리기) ───────────────────────────────────────
-- alter table public.sessions drop column if exists content_blocks;
