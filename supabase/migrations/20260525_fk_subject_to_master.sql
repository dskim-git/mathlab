-- 20260525_fk_subject_to_master.sql
-- 과목 텍스트 드리프트 원천 차단: subject 텍스트 컬럼들을 subjects(name) 마스터에 FK로 묶는다.
--
-- 배경: activities.subject / activity_responses.subject / teacher_permissions.subject 는
--   각각 마스터 과목명(subjects.name)을 "값 복사"한 text 컬럼이라, 서로 글자가 어긋나면
--   RLS 엄격매칭(teacher_has_class_subject)이 조용히 깨진다. FK로 묶어 원천 차단한다.
--
-- 전제(20260525 audit 으로 확인):
--   * subjects.name 에 UNIQUE 제약(subjects_name_key) 존재 → text FK 참조 가능.
--   * 세 테이블의 모든 비-NULL subject 값이 마스터('확률과 통계')와 일치, 위반행 0.
--     (activities 1건, activity_responses 6건, teacher_permissions 3건 — 전부 in_master=true)
--   * 따라서 FK 추가 시 검증 실패 없음(테이블도 소량이라 잠금은 순간).
--
-- 옵션:
--   ON UPDATE CASCADE  — 관리자가 마스터 과목명을 바꾸면 세 컬럼에 자동 전파 → 영구 정합.
--   ON DELETE RESTRICT — 사용 중인 과목은 삭제 차단(데이터 보호).
--
-- NOT NULL 은 의도적으로 넣지 않는다:
--   * activities.subject / activity_responses.subject 는 nullable 이고, 특히 응답의 NULL subject 는
--     RLS 예외(담당 학급 교사면 보임) 설계에 쓰인다. FK 는 NULL 을 검사하지 않으므로 그대로 둔다.
--
-- 범위 밖: sessions.subject(보조기능·optional)는 이번에 묶지 않는다.

alter table public.activities
  add constraint activities_subject_fkey
  foreign key (subject) references public.subjects(name)
  on update cascade on delete restrict;

alter table public.activity_responses
  add constraint activity_responses_subject_fkey
  foreign key (subject) references public.subjects(name)
  on update cascade on delete restrict;

alter table public.teacher_permissions
  add constraint teacher_permissions_subject_fkey
  foreign key (subject) references public.subjects(name)
  on update cascade on delete restrict;

-- ── 검증용 (적용 후 실행해 확인) ─────────────────────────────────
-- select conname, conrelid::regclass as tbl, pg_get_constraintdef(oid) as def
-- from pg_constraint
-- where conname in ('activities_subject_fkey',
--                   'activity_responses_subject_fkey',
--                   'teacher_permissions_subject_fkey')
-- order by conname;
-- 기대: 3행, 각각 FOREIGN KEY (subject) REFERENCES subjects(name) ON UPDATE CASCADE ON DELETE RESTRICT

-- ── ROLLBACK (되돌리기) ───────────────────────────────────────
-- alter table public.teacher_permissions drop constraint if exists teacher_permissions_subject_fkey;
-- alter table public.activity_responses  drop constraint if exists activity_responses_subject_fkey;
-- alter table public.activities          drop constraint if exists activities_subject_fkey;
