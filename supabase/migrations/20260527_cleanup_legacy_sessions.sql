-- 20260527_cleanup_legacy_sessions.sql
-- 레거시 created_by=null 세션 정리 (created_by 컬럼 도입 20260526_session_owner.sql 이전에 만들어진 3개).
--
-- 배경: 소유자(created_by) 없는 세션 3개는 모두 activity_slug=probability-simulator,
--   title='확률 시뮬레이터 수업'. 2026-05-27 audit 결과:
--     CXDH4X  강선생  응답 0  커스텀블록 X  → 빈 테스트 세션
--     GHVSZK  최선생  응답 0  커스텀블록 X  → 빈 테스트 세션
--     LLFJT2  표선생  응답 6  커스텀블록 O  → 실데이터(표선생=pyopyo의 작업 세션)
--
-- 처리(사용자 결정): 빈 테스트 2개는 삭제, LLFJT2 는 소유자를 pyopyo 로 백필(보존).
--   pyopyo = profiles.id 16b9c3ab-2ca5-4818-97bd-08c8c2e8b0ad (login_id=pyopyo, name=표선생, approved teacher).
--
-- 안전성:
--   - 삭제는 빈 세션 2개로 한정. 가드로 'created_by is null AND 응답 0' 을 함께 걸어,
--     그새 소유자가 생기거나 응답이 붙은 경우엔 삭제되지 않게 한다(0행 영향 = no-op).
--   - activity_responses.session_id 는 ON DELETE SET NULL 이므로, 만약 응답이 있어도 학생 기록은
--     보존된다(다만 본 마이그레이션은 응답 0인 세션만 지운다).
--   - 백필은 LLFJT2 가 아직 created_by is null 일 때만 수행.
--   - 라이브는 SQL 에디터(service_role)에서 실행 → RLS 우회.

-- ── (참고) 적용 전 audit ──
-- select s.id, s.join_code, s.teacher_name, s.is_active, s.created_at,
--        a.slug as activity_slug,
--        (s.content_blocks is not null) as has_session_blocks,
--        count(ar.id) as response_count
-- from sessions s
-- left join activities a on a.id = s.activity_id
-- left join activity_responses ar on ar.session_id = s.id
-- where s.created_by is null
-- group by s.id, a.slug
-- order by s.created_at;

begin;

-- (1) LLFJT2 → pyopyo 소유로 백필 (응답 6 + 커스텀 블록 보존, 표선생이 편집·조회 가능)
update public.sessions
set created_by = '16b9c3ab-2ca5-4818-97bd-08c8c2e8b0ad'
where id = 'cf1eea0c-14ae-41c1-84a5-834f1aada652'
  and created_by is null;

-- (2) 빈 테스트 세션 2개 삭제 (소유자 없음 + 응답 0 인 경우에만)
delete from public.sessions s
where s.id in (
        '9aa2fa14-1718-4b70-94de-9fddce3c3f19',  -- CXDH4X 강선생
        '2475644b-e273-4a0f-8c0c-f80af4439083'   -- GHVSZK 최선생
      )
  and s.created_by is null
  and not exists (
        select 1 from public.activity_responses ar where ar.session_id = s.id
      );

commit;

-- ── 검증 (적용 후) ──
-- 1) 남은 created_by=null 세션 0개 기대:
--    select count(*) from sessions where created_by is null;
-- 2) LLFJT2 소유자 = pyopyo 기대:
--    select id, join_code, created_by from sessions where id = 'cf1eea0c-14ae-41c1-84a5-834f1aada652';
-- 3) 전체 세션 2개 기대(원래 4 - 삭제 2):
--    select count(*) from sessions;

-- ── ROLLBACK ──
-- (a) 백필 되돌리기:
--   update public.sessions set created_by = null
--   where id = 'cf1eea0c-14ae-41c1-84a5-834f1aada652';
-- (b) 삭제한 빈 세션 재생성(원본 값 캡처; content_blocks=null, created_by=null):
--   insert into public.sessions (id, title, join_code, teacher_name, is_active, activity_id, created_at)
--   values
--     ('9aa2fa14-1718-4b70-94de-9fddce3c3f19', '확률 시뮬레이터 수업', 'CXDH4X', '강선생', true,
--        (select id from activities where slug = 'probability-simulator'), '2026-05-22 11:31:38.09245+00'),
--     ('2475644b-e273-4a0f-8c0c-f80af4439083', '확률 시뮬레이터 수업', 'GHVSZK', '최선생', true,
--        (select id from activities where slug = 'probability-simulator'), '2026-05-22 11:46:33.876132+00');
