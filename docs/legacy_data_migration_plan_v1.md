# 레거시 데이터 이식 계획 v1

> 작성일: 2026-06-07
> 작성 맥락: 새 MathLab 앱이 인증·콘텐츠·활동·통계까지 기능 안정화 완료(main HEAD=2087ea5). 기존 Streamlit + Google Sheets 기반 앱에서 누적된 회원·성찰·사전/사후 설문 데이터를 새 앱으로 이식.

---

## 1. 배경 · 목표

### 1.1 기존 앱
- Streamlit 기반 (`dskim-git/math` 리포지토리)
- 데이터 저장: **Google Sheets** (auth_utils.py / reflection_utils.py 등에서 시트 직접 read/write)
- 활동·성찰 기록은 시트 여러 개(활동별·교사별 라우팅)

### 1.2 새 앱
- Next.js + Supabase Postgres + Vercel
- 인증: Supabase Auth (GoTrue), bcrypt 해시 자체 관리
- 성찰: `activity_responses` 테이블 + 새 질문 구조

### 1.3 이식 목표
| 대상 | 결정 |
|---|---|
| 회원 정보 (ID·이름·역할·학반) | **이식** — profiles + students/teachers |
| 비밀번호 | **이식 안 함** — 사용자가 새 앱에서 신규 가입(명렬표 자동 매칭) 또는 관리자가 임시 비번 발급 |
| 활동 성찰 기록 | **별도 보관** — 새 질문과 구조가 달라 그대로 못 합침. `legacy_reflections` 테이블에 옛 질문+답변 그대로 |
| 사전/사후 설문 | **신규 모듈** — `surveys` + `survey_responses` 테이블 신설. 옛 데이터 이식 + 새 응답도 같은 공간에 누적. 관리자가 학생 노출 on/off 토글. |

### 1.4 비-목표
- 기존 시트의 모든 컬럼을 그대로 복제하지 않는다 — 새 앱이 활용할 정보만 추출.
- 옛 성찰을 새 `activity_responses` 와 섞어 넣지 않는다 — 구조 차이로 인한 데이터 오염 회피.

---

## 2. 데이터 모델 — 신설 테이블

### 2.1 `legacy_reflections` — 옛 활동 성찰 보존
```sql
create table legacy_reflections (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  activity_label text not null,      -- 옛 활동 이름 (자유 텍스트, 슬러그 매핑 X)
  question      text not null,       -- 옛 질문 그대로
  answer        text,                -- 학생 답변 (빈 답 허용)
  source_subject text,               -- 옛 교과 (선택)
  legacy_created_at timestamptz,     -- 옛 작성 시점
  imported_at   timestamptz default now()
);

create index legacy_reflections_student_idx
  on legacy_reflections (student_id, legacy_created_at desc);
```

**RLS:** 본인 SELECT / 교사 = teacher_has_class 학생만 / 관리자 ALL. 쓰기는 관리자 only (이식용).

**UI 노출:**
- `/student/reflections` 페이지에 "이전 성찰" 탭 추가 — 옛 형식 그대로 조회
- `/teacher/students/[id]` 학생 상세 페이지(있다면)에도 합산 표시
- **AI 세특 작성 시** `sebteuk_drafts` 입력 구성 함수가 `activity_responses` + `legacy_reflections` 둘 다 합쳐 모델에 전달

### 2.2 `surveys` — 설문 정의 (사전/사후 등)
```sql
create table surveys (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,    -- 'pre_survey_2026' / 'post_survey_2026' 등
  title         text not null,
  description   text,
  kind          text,                    -- 'pre' / 'post' / 'other'
  questions     jsonb not null,          -- [{id, prompt, kind:'text'|'select'|'scale', options?}, ...]
  is_active     boolean not null default false, -- 관리자 on/off 토글
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

**RLS:** 학생/교사/일반인 SELECT (활성화된 행만) / 관리자 ALL.

### 2.3 `survey_responses` — 설문 응답 (옛 + 새)
```sql
create table survey_responses (
  id           uuid primary key default gen_random_uuid(),
  survey_id    uuid not null references surveys(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  answers      jsonb not null,          -- {questionId: answer, ...}
  is_legacy    boolean not null default false, -- 옛 앱 이식 여부
  legacy_created_at timestamptz,        -- 옛 작성 시점 (있으면)
  created_at   timestamptz default now(),
  unique (survey_id, student_id)        -- 한 설문에 1인 1답
);
```

**RLS:** 본인 INSERT/SELECT / 교사 = 담당 학급 SELECT / 관리자 ALL.

**UI:**
- 학생: `/student/surveys` 신설 — `is_active=true` 설문 리스트 → 클릭하면 응답 페이지. 이미 응답했으면 "응답 완료" 상태 + 본인 답안 조회.
- 관리자: `/admin/surveys` 신설 — 설문 목록·생성·편집·on/off 토글 + 응답 현황(N명/M명).
- AI 세특 입력에도 옵션으로 합산 가능 (학생 성향·사전 인식 등 단서).

### 2.4 (선택) `legacy_users_audit` — 이식 추적 (운영용)
```sql
create table legacy_users_audit (
  id              uuid primary key default gen_random_uuid(),
  legacy_login_id text,                  -- 옛 ID
  new_profile_id  uuid references profiles(id) on delete set null,
  status          text,                  -- 'imported' / 'manual_signup' / 'skipped'
  note            text,
  imported_at     timestamptz default now()
);
```
운영 추적용. 누가 이식됐고 누가 신규 가입인지 한눈에. 작업 종료 후 폐기해도 무방.

---

## 3. 비밀번호 처리 — 최종 권장 흐름

기존 Streamlit이 어떤 해시를 썼는지 무관하게 **새 앱에선 신규 비번 발급**.

### 3.1 학생
1. 옛 학생 명부를 새 앱 `student_roster`에 CSV 업로드 (학번·이름)
2. 학생에게 "새 앱 가입 안내" — 학번+이름+새 비번으로 가입
3. 명렬표 매칭 트리거가 자동 승인 (이미 동작 중)
4. 이전 비번은 폐기. 새 비번을 학생이 직접 설정.

### 3.2 교사
1. 옛 교사 명부 확인 → 새 앱 가입 안내 (자체 가입)
2. 관리자가 승인 + 담당 학급·교과 권한 부여

### 3.3 비번 해시 import 옵션 (참고)
가능하지만 권장 안 함:
- Supabase Admin API: `auth.admin.createUser({ password_hash, ... })`
- GoTrue가 인식하는 형식 (bcrypt `$2b$...`)이어야 — 다르면 통째로 깨짐
- 학생이 옛 비번 그대로 쓰는 것은 보안상 좋지 않음 (학교 환경 비번 약함)
- → **신규 비번 발급이 안전·단순**

---

## 4. 단계별 작업 플랜

### Phase 0. 시트 구조 확인 (사용자 작업)
사용자가 다음 정보를 알려주면 본격 진행:
1. **사용자 시트** 컬럼 (예: 학번, 이름, 학년/반/번호, 역할, 가입일)
2. **성찰 시트** 구조 — 시트가 몇 개? 각 컬럼은? 활동·교사별 라우팅 구조?
3. **설문 시트** (사전/사후 각각) 컬럼 — 질문 목록·응답 행 구조?

→ 이 정보로 import 매핑 정확히 짤 수 있음.

### Phase 1. 신설 테이블 마이그레이션 ⚙️
1. `legacy_reflections` 테이블 + RLS
2. `surveys` 테이블 + RLS
3. `survey_responses` 테이블 + RLS
4. (선택) `legacy_users_audit`

코드 변경 없이 DB만. 작은 마이그레이션 1~3개.

### Phase 2. 설문 모듈 UI 신설 🖥️
1. `/admin/surveys` — 설문 목록·CRUD·on/off 토글·응답 현황
2. `/student/surveys` — 활성화된 설문 응답
3. (선택) 학생 홈 KPI 카드에 "응답 안 한 설문 N개" 알림 추가
4. `/teacher/students/[id]` 또는 `/teacher/records` 에 학생별 설문 응답 열람

기존 ReflectionForm·ActivityRenderer 패턴 재활용 가능.

### Phase 3. 회원 정보 이식 🧑‍💻
1. 시트 → CSV export (사용자)
2. 학생 명렬표 CSV → `/admin/roster` 업로드 (이미 동작)
3. 교사 명단 → 관리자가 수동 안내 or `/admin/members` 페이지에서 일괄 처리 (필요 시 신설)
4. `legacy_users_audit` 기록 (선택)

### Phase 4. 성찰 기록 이식 📝
1. 시트 → CSV export (사용자, 시트별로 분리 가능)
2. import 스크립트(Node.js + supabase-js) 작성 — student 매칭(학번 또는 이름) → `legacy_reflections` INSERT
3. 매칭 안 된 행은 별도 unmatched.csv 로 보존 → 수동 해결
4. `/student/reflections` 에 "이전 성찰" 탭 추가
5. AI 세특 입력 구성 함수 확장 — `legacy_reflections` 합산

### Phase 5. 설문 응답 이식 📊
1. 시트 → CSV export
2. import 스크립트 — survey_id 매칭(slug) + student_id 매칭 → `survey_responses` INSERT (`is_legacy=true`)
3. 새 응답은 자연스럽게 같은 테이블에 누적 (`is_legacy=false`)

### Phase 6. 운영 검증 ✅
1. 학생 한 명으로 옛 성찰·설문 조회 확인
2. 교사가 학생 상세에서 옛·새 데이터 함께 보이는지
3. AI 세특이 옛 데이터를 입력으로 활용하는지
4. 관리자가 설문 on/off 토글 후 학생 화면 갱신 확인

---

## 5. 기술적 고려사항

### 5.1 import 스크립트 위치
- `scripts/import/legacy_*.ts` 폴더 신설
- 실행: `npx tsx scripts/import/legacy_reflections.ts data/reflections.csv`
- service_role 키 사용 (RLS 우회) — `.env.local` 에서 별도 관리
- 결과 요약 + unmatched 행 별도 파일 export

### 5.2 학생 매칭 키
- 1순위: 학번(예: 2학년 6반 02번 → student_code = '20602', school_year + student_code 조합)
- 2순위: 이름 (동명이인 주의 — manual review)
- 매칭 실패 → unmatched 행 보존

### 5.3 시트 컬럼 → DB 컬럼 매핑 표
시트 구조 확인 후 작성. 각 시트마다 매핑표 1개.

### 5.4 시간대
- 옛 데이터의 timestamp 가 KST 인지 UTC 인지 확인 → import 시 명시 변환
- `legacy_created_at` / `legacy_*` 접두 필드들은 모두 timestamptz

### 5.5 데이터 양 추정
- 학생 수: ~수십 명 추정
- 활동 성찰: 학생당 수십~수백 건? (학기 기준)
- 설문: 학생당 1~2건 (사전·사후)
- → 전체 수천~수만 행, supabase 무료 플랜 충분히 수용

---

## 6. 결정 포인트 (사용자 확인 필요)

| # | 항목 | 결정 |
|---|---|---|
| 1 | 비밀번호 — 임시 발급 vs 해시 import | ☐ 임시 발급(권장) / ☐ 해시 import |
| 2 | 옛 학생 중 새 앱 가입 안내 방법 | ☐ 교사가 학생에게 직접 안내 / ☐ 이메일 일괄 발송 (인프라 별건) |
| 3 | 옛 교사 — 자체 가입 vs 관리자 일괄 생성 | ☐ 자체 가입 / ☐ 일괄 생성 |
| 4 | `surveys` 질문 구조 — 옛 설문 그대로 신규 생성? 또는 새 질문으로 재작성? | ☐ 그대로 / ☐ 재작성 |
| 5 | 옛 성찰 — 학생 본인 외에 누구까지 열람? | ☐ 본인만 / ☐ 담당 교사 / ☐ 관리자 (RLS 정책 결정) |
| 6 | `legacy_users_audit` 테이블 만들지 | ☐ 만듬 / ☐ 생략 |

---

## 7. 다음 단계

1. **사용자: 시트 구조 정보 회신** (Phase 0 — 컬럼명 + 예시 한 행씩)
2. **AI: 매핑표 작성** (시트 컬럼 → DB 컬럼)
3. **단계 1 마이그레이션 작성·실행·커밋** (legacy_reflections + surveys + survey_responses)
4. **단계 2 설문 모듈 UI 신설** (관리자 → 학생 순)
5. **단계 3~5 이식 스크립트 작성·실행·검증**
6. **단계 6 운영 검증**

각 단계는 [[step-by-step-confirm-workflow]] 따라 작은 단위 + 사용자 확인.

---

## 부록 A. 관련 파일·메모리
- [[mathlab-current-progress]] — 전체 진행
- [[mathlab-renewal-direction]] — 누적형 방향
- [[activity-reflection-policy]] — 성찰 정책
- `docs/mathlab_renewal_development_plan_v1.md` — 기존 앱 전체 분석
- `docs/dashboard_redesign_plan_v1.md` — 대시보드 4역할

## 부록 B. 위험 · 완화
| 위험 | 완화 |
|---|---|
| 학생 매칭 실패 (학번 형식 변경 등) | unmatched.csv 보존 + 수동 해결 |
| 옛 시트의 깨진 행 (빈 셀, 인코딩 오류) | import 스크립트가 검증 + warn 출력, 통과한 행만 INSERT |
| 비번 import 실패 | 처음부터 신규 발급 권장 — 위험 회피 |
| RLS 오설정으로 다른 학생 데이터 노출 | 각 테이블 RLS 정책 작성 후 본인 외 계정으로 SELECT 시도해 차단 확인 |
| 이중 import (스크립트 두 번 실행) | import 스크립트에 dedupe 키 (student_id + activity_label + question + legacy_created_at) 또는 dry-run 모드 |
