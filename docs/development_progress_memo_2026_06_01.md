# MathLab 개발 진행 메모: 대시보드 리뉴얼 + 폴리시 + 진도표 확장

작성일: 2026-06-01
관련 프로젝트: MathLab 수학 웹앱 리뉴얼
관련 레포지토리: `dskim-git/mathlab`
배포 주소: `https://mathelab.vercel.app/`
시작 시점 HEAD: `fc411c6` (대시보드 리뉴얼 Step 1~8 머지 직후)

---

## 1. 메모 목적

`development_progress_memo_2026_05_22.md` 이후 진행한 추가 작업을 정리한다.
공통수학 활동 이식 단계로 넘어가기 전, 대시보드 보강 · 알림 · AI세특 메모 · 단원 관리 · 진도표 확장 등을 마무리한 상태를 기록한다.

---

## 2. 이번 라운드에서 추가로 구현된 기능

### 2.1 학생 게이미피케이션 + 주간 목표 본인 설정
- 새 테이블 `user_settings (profile_id PK, weekly_goal int CHECK 1..30, updated_at)`
- 마이그레이션: `supabase/migrations/20260601_student_settings.sql`
- `components/student/GamificationCard.tsx` 에 인라인 편집 UI(1~30) + upsert(`onConflict=profile_id`)
- 기본값은 5, 학생이 직접 자신의 한 주 목표 횟수를 정한다.

### 2.2 알림함 (NotificationBell + /notifications)
- 새 테이블 `notifications` + 3개 트리거(SECURITY DEFINER, INSERT 정책 불필요)
  - `notify_feedback_received` — 학생/일반 건의 → 관리자에게
  - `notify_feedback_replied` — 관리자 답변 → 작성자에게
  - `notify_response_locked` — 응답 잠금 → 학생에게
- 마이그레이션: `supabase/migrations/20260601_notifications.sql`
- `components/notifications/NotificationBell.tsx` — 30초 폴링, unread 배지, 역할별 라우팅
- `components/notifications/NotificationsList.tsx` — 페이지네이션(50개), 필터(all/unread), per-item read 토글
- 4역할 공유 라우트: `app/notifications/layout.tsx` + `app/notifications/page.tsx`

### 2.3 학생 성장 그래프 (/student/growth)
- 12주 활동량 막대 차트 + 90일 누적 곡선
- `app/student/growth/page.tsx`
- SVG 막대(폭은 width 속성) + HTML 라벨(`grid-cols-12`) 분리 — preserveAspectRatio 늘림으로 인한 텍스트 압축 회피

### 2.4 일반인 홈 리뉴얼 (/general)
- `app/general/page.tsx` 전체 교체
- Hero amber 그라데이션 + 교과 칩 그리드
- KPI 4: 접근 교과/누적 활동/이번 주 활동/이어보기(learning_progress 최신)
- 최근 활동 미리보기(activity_visits 최근 3)

### 2.5 AI세특 — 교사 비공개 메모
- 새 테이블 `teacher_student_notes (teacher_profile_id, student_id) PK, note text`
  - RLS: 본인 + admin 만, 학생은 볼 수 없음(private)
- 마이그레이션: `supabase/migrations/20260601_teacher_student_notes.sql`
- `components/teacher/sebteuk/SebteukWorkflow.tsx` — 학생 선택 시 노트 로드, amber 메모 패널, 변경 추적
- `app/api/teacher/sebteuk/generate/route.ts` — `teacherNote` 를 user 메시지 prepend 로 추가 (system prompt 캐시는 보존)

### 2.6 단원 관리자 UI
- `app/admin/curriculum/page.tsx`
- `app/admin/curriculum/[unitId]/blocks/page.tsx`
- `components/admin/CurriculumEditor.tsx`
- 교과 칩 → 캐스케이드 행(대/중/소단원). `+ 추가 / ✏️ 이름 변경 / ↑↓ 이동 / ✕ 삭제`
- `nextUnitKey()` 가 `1-1-3` 패턴 자동 생성
- 활동 슬러그 드롭다운은 `ACTIVITY_CATALOG` 의 `<optgroup>` 사용(`lib/activities/activityCatalog.ts`)

### 2.7 관리자 — 점수 정정/삭제 (master-detail)
- `app/admin/scores/page.tsx`
- Master: 점수 기록 활동 카드 그리드(슬러그별 카운트·최고점·최근)
- Detail: 선택 활동의 점수 표(학생별 정렬 + 행 ✕ 삭제)
- 정책 `admin all activity_scores` 로 SELECT/DELETE 허용

### 2.8 관리자 — 활동 행 CRUD
- `app/admin/activities/page.tsx`
- `activities` 행 신규 INSERT + 목록 + ✕ 삭제 + `블록 편집` 링크
- 슬러그 중복(23505) 친절 에러 메시지
- 운영 빈도 낮음 — 1회용이 아니라 공유 템플릿

### 2.9 진도표 확장 (/teacher/progress) — 이번 라운드 마지막
- `lib/dashboard/progressDates.ts` 에 함수 추가:
  - `buildWeekRangeDays(now, weekOffset, count)` — 1~4 주 윈도우
  - `buildMonthDays(year, month)` — 월별 보기(주차 그룹)
- `app/teacher/progress/page.tsx` 가 새 URL 파라미터 처리:
  - `?w=offset` (기존)
  - `?weeks=N` (1~4, 기본 2)
  - `?view=month&m=YYYY-MM`
- UI: 보기 토글(주간/월간) + 주간일 때 기간 칩(1/2/3/4주) + 주간/월간별 이동 컨트롤

### 2.10 사이드바 메뉴 정리
- `lib/dashboard/menus.ts`
- 관리자: 홈 → 회원관리 → 설정 → **교과 학습 관리** → 단원 관리 → 활동 행 관리 → 교과 권한 → 건의사항 → 통계 → 점수 관리 → 공지 작성
- 학생: 홈 / 교과 학습 / 내 활동 / 내 성찰 / 내 성장 / 건의 / 내 정보
- 교사: 홈 / 교과 학습 / 진도표 / 응답 기록 / 수업활동 편집 / AI세특 / 건의 / 내 정보
- `ROUTE_LABELS` 다수 추가(브레드크럼 정합성)

---

## 3. 활동 이식 진척

기준: 2026-06-01

| 교과 | 원본(개) | 이식(개) | 비고 |
|---|---|---|---|
| 확률과통계 | 임포트 완료 (35노드/121블록) | 모두 이식 완료 ✅ | (교육과정 외) 다각형 변 위 배열·대칭까지 포함 |
| 공통수학1 | 54개 (`activities/common/mini`) | **1개** (`perm_comb_growth_race`) | **53개 남음 ← 다음 라운드 시작점** |
| 영재수학 | 약 30개 (`activities/gifted`) | 0개 | 데이터 모델 설계 필요 |
| 기타(미적1·2 등) | 미정 | 0개 | 우선순위 낮음 |

### 활동 이식 패턴(확률과통계에서 확립)
- 폴더 구조: `components/activities/<교과>/<중단원>/<활동>/`
- 공용: 루트의 `registry.ts` + `ActivityContext` + `ReflectionForm` + `Quiz`
- 성찰 정책: `[[activity-reflection-policy]]` — 공통 "느낀점" 1 + 활동별 고유(게임 1 / 탐색 1~2 / 시뮬 2~3)
- 표기 정책:
  - 모평균: μ → 영문 `m`(조사도 받침 규칙 함께 변환)
  - 표본평균: `X̄` 유니코드 그대로(별도 컴포넌트·헬퍼 만들지 않음)
- 제목: "미니:" 금지(타입 배지가 이미 표시), 긴 제목은 `displayBlockTitle`/`SHORT_ACTIVITY_TITLE` 에서 짧게 표시

### 영재수학 — 결정 보류 항목
- subject 키를 `영재수학` 으로 잡고 기존 `curriculum_units` 트리에 임포트할지, 별도 라우트로 분리할지
- 정규 차/단원 구조가 아니라 주제별이라 1수준 트리(가상 "대단원" 1개)로 평탄화하는 안이 유력하지만, 다음 라운드 시작 시 확정 필요
- 임포트 스크립트 작성 필요 (참고: `scripts/import_curriculum.py`, 원본 `math/activities/gifted/lessons/_units.py`)

---

## 4. 남은 작업 (우선순위 순)

1. **공통수학1 활동 이식** — 53개. 이번 라운드의 핵심 큰 덩어리.
   - 단원 순서 유지, 한 번에 여러 개씩, 레지스트리 + 공용 ReflectionForm/Quiz, 원본 개념 유지 + 새 앱 디자인
   - 성찰 문구는 Claude 제안 → 사용자 확정 패턴
2. **영재수학 활동 이식** — 약 30개. 데이터 모델 확정 후.
3. 활동별 결과 렌더러 후속 (C 후속) — 게임 점수 차트 등 맞춤 시각화
4. 진도표↔세션 1클릭 — 의미·시나리오 재검토 후 가치 판단 (보류 중)
5. `curriculum_units` RLS 강화 (비긴급)

---

## 5. 작업 패턴 메모 (다음 라운드용)

- 작은 단위로 진행 → 사용자 로컬 확인 → 다음 단계. push 는 체크포인트에서만.
- 활동 이식 1회 단위 = 1~수 개. 컴포넌트 + registry 등록 + 단원 블록 매핑까지 한 흐름.
- DB 변경 동반 시 `supabase/migrations/YYYYMMDD_*.sql` 로 분리.
- 인라인 스타일 금지 — 동적 폭은 SVG 속성 / Tailwind 그리드 활용.
- 빈 `<th>` 는 `<th scope="col"><span className="sr-only">...</span></th>` 패턴.
- PostgREST 임베딩 모호성 해소 — `students(profiles!profile_id(...))` FK 힌트 명시.
