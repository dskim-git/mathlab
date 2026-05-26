-- 20260526_session_owner.sql
-- 세션 소유자(created_by) 추가 — "그 세션을 연 교사" 권한 enforce 용.
--
-- 배경: sessions 에는 생성 교사 정보가 없었다(teacher_name 은 자유 텍스트, 신원 아님).
--   세션별 블록 편집/상태·삭제를 '만든 교사 + 관리자'로 제한하려면 소유자 식별이 필요.
--
-- created_by: profiles.id(= auth.uid())을 가리킨다. 기본값 auth.uid() 이라 교사 브라우저에서
--   세션을 INSERT 할 때 만든 사람으로 자동 기록된다(SessionCreateForm 코드 변경 불필요).
--   기존 세션(3행)은 컬럼 추가 시점 auth.uid()=null → created_by=null(소유자 없음 = 관리자만 편집).
--
-- 안전성: 추가형 nullable 컬럼. 기존 동작 불변(아직 어떤 코드/RLS도 참조 안 함; RLS는 후속 파일에서).

alter table public.sessions
  add column if not exists created_by uuid references public.profiles(id) default auth.uid();

-- ── 검증 (적용 후) ──
-- select column_name, data_type, column_default
-- from information_schema.columns
-- where table_schema='public' and table_name='sessions' and column_name='created_by';

-- ── ROLLBACK ──
-- alter table public.sessions drop column if exists created_by;
