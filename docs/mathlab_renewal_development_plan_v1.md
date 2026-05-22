# MathLab 수학 웹앱 리뉴얼 개발 문서 v1

작성일: 2026-05-20  
새 레포지토리: `dskim-git/mathlab`  
기존 참고 레포지토리: `dskim-git/math`  
개발 방향: 기존 Streamlit 기반 수학 수업 웹앱을 Next.js + Supabase + Vercel 기반으로 새로 구축

---

## 1. 프로젝트 목표

이 프로젝트의 목표는 기존 Streamlit 기반 MathLab 앱을 그대로 복사하는 것이 아니라, 기존 앱에서 검증된 수학 수업 활동 구조를 바탕으로 더 안정적이고 확장 가능한 새 웹앱을 만드는 것이다.

새 앱에서 가장 중요하게 해결할 문제는 다음과 같다.

1. 학생 40~50명 이상이 동시에 접속해도 안정적으로 작동해야 한다.
2. 학생 응답이 빠르게 저장되고 교사가 바로 확인할 수 있어야 한다.
3. Google Sheets를 메인 데이터베이스처럼 쓰는 구조에서 벗어나야 한다.
4. 활동을 모듈 단위로 추가할 수 있어야 한다.
5. 장기적으로 학생 활동 기록을 피드백과 생활기록부 참고자료로 활용할 수 있어야 한다.
6. 최종적으로 각 미니활동에서 수집한 학생 성찰 자료와 활동 결과를 바탕으로 생성형 AI가 세특 참고 문구 초안을 작성하고, 교사가 검토·수정해 활용할 수 있는 구조를 만든다.

---

## 2. 기술 스택

새 앱은 다음 기술 스택을 기준으로 개발한다.

```text
프론트엔드 / 풀스택 프레임워크: Next.js
언어: TypeScript
스타일링: Tailwind CSS
데이터베이스: Supabase Postgres
백엔드 기능: Supabase API / Next.js Server Actions 또는 Route Handlers
배포: Vercel
개발 환경: VS Code
코드 관리: GitHub
```

MVP 단계에서는 Python 서버를 따로 두지 않는다. 확률 시뮬레이션 정도는 TypeScript로 구현한다. 나중에 SymPy, 복잡한 수치 계산, 기존 Python 코드 재사용이 꼭 필요한 활동이 생기면 FastAPI 서버를 별도로 검토한다.

AI 세특 문구 생성 기능은 MVP 이후 단계에서 구현한다. 이 기능은 학생 응답 데이터가 일정량 누적되고, 교사용 대시보드에서 응답을 안정적으로 조회할 수 있게 된 뒤에 붙인다. 초기에는 생성형 AI API를 바로 연결하지 않고, 학생 활동 기록을 잘 구조화해 저장하는 것부터 우선한다.

---

## 3. 기존 앱 분석 요약

기존 앱은 `home.py`를 중심으로 작동하는 Streamlit 기반 수학 수업 플랫폼이다.

기존 앱의 특징은 다음과 같다.

- `home.py`가 로그인, 회원가입, 권한, 라우팅, 활동 탐색, 화면 구성을 대부분 담당한다.
- 활동은 `activities/<subject>` 폴더 아래에 과목별로 분리되어 있다.
- 각 활동 파일은 대체로 `META`와 `render()` 함수를 가진다.
- 학생 응답과 성찰 기록은 Google Sheets 또는 Google Apps Script와 연결되어 있다.
- 인증과 권한 관리는 `auth_utils.py`를 중심으로 Google Sheets를 사용자 DB처럼 사용한다.
- 성찰 기록은 `reflection_utils.py`를 통해 활동별 응답을 저장하고 교사별 시트로 라우팅한다.

기존 구조에서 유지할 개념은 다음과 같다.

- 과목별 활동 분류
- 활동별 제목과 설명을 담는 메타데이터 구조
- 활동 단위 모듈화
- 학생 성찰 기록
- 그래프와 시뮬레이션 중심 수업
- 교사용 응답 확인 화면
- 학생 활동 기록을 피드백과 생활기록부 참고자료로 발전시키는 방향

기존 구조에서 새 앱으로 그대로 가져오지 않을 것은 다음과 같다.

- Streamlit `session_state` 중심 흐름
- Google Sheets를 메인 DB로 쓰는 구조
- 하나의 파일에 로그인, 라우팅, 권한, 화면 구성이 몰린 구조
- 복잡한 회원가입 / 승인 / 권한 체계를 MVP부터 구현하는 방식
- 교사별 Google Sheet 자동 라우팅을 MVP부터 구현하는 방식

---

## 4. 새 앱의 핵심 수업 흐름

새 앱의 기본 수업 흐름은 다음과 같다.

```text
교사가 활동 세션 생성
→ 입장 코드 발급
→ 학생이 입장 코드로 접속
→ 이름 / 학번 또는 번호 입력
→ 활동 수행
→ 결과와 생각 제출
→ Supabase에 저장
→ 교사가 대시보드에서 응답 확인
```

이 흐름이 안정적으로 작동하면 기존 Streamlit 앱의 여러 활동을 하나씩 이식한다.

장기적으로는 아래 흐름까지 확장한다.

```text
미니활동별 학생 성찰 기록 누적
→ 학생별·활동별 학습 흔적 조회
→ 교사가 필요한 활동 기록 선택
→ 생성형 AI가 세특 참고 문구 초안 생성
→ 교사가 사실 여부와 표현을 검토·수정
→ 최종 문구를 학교 기록 업무에 참고
```

이때 AI가 생성한 문장은 자동 확정 결과가 아니라, 반드시 교사가 검토하고 수정하는 초안으로 취급한다.

---

## 5. MVP 범위

MVP의 목표는 다음 질문에 답하는 것이다.

```text
Next.js + Supabase + Vercel 구조에서 학생 40~50명이 동시에 접속해
확률 시뮬레이터 활동을 수행하고,
응답을 저장한 뒤,
교사가 대시보드에서 확인할 수 있는가?
```

### MVP에 포함할 기능

#### 학생 화면

- 입장 코드 입력
- 이름 / 학번 또는 번호 입력
- 확률 시뮬레이터 활동 수행
- 시뮬레이션 결과 그래프 확인
- 결과 해석 또는 느낀 점 입력
- 제출 완료 화면

#### 교사 화면

- 활동 세션 생성
- 입장 코드 확인
- 세션별 제출 현황 확인
- 학생별 응답 목록 확인
- CSV 다운로드

#### 데이터베이스

- `activities`
- `sessions`
- `responses`

### MVP에서 제외할 기능

- 학생 회원가입
- 관리자 승인
- 과목별 상세 권한
- Google Sheets 자동 연동
- 교사별 시트 라우팅
- 전체 기존 활동 일괄 이식
- AI 피드백 자동 생성
- 세특 문구 자동 생성

---

## 6. 기능별 이식 우선순위

| 우선순위 | 기능 | 새 앱 이식 판단 |
|---|---|---|
| 1 | 확률 시뮬레이터 | MVP 첫 활동으로 구현 |
| 2 | 학생 응답 저장 | Supabase `responses` 테이블로 구현 |
| 3 | 교사용 응답 확인 | 새 대시보드로 구현 |
| 4 | 입장 코드 기반 참여 | 새 앱의 핵심 진입 방식 |
| 5 | 계산기 | 저장 필요가 적으므로 후순위 |
| 6 | 확률과통계 미니 활동 | 수업 활용도 높은 것부터 선별 이식 |
| 7 | 공통수학 미니 활동 | 단원별로 선별 이식 |
| 8 | 학생별 활동 기록 누적 | responses 데이터를 학생별·활동별로 조회할 수 있게 확장 |
| 9 | 로그인 / 회원가입 전체 | Supabase Auth 또는 교사 로그인으로 나중에 재설계 |
| 10 | Google Sheets 권한 관리 | MVP에서는 제외 |
| 11 | 설문 연구 기능 | 연구 단계에서 별도 모듈로 이식 |
| 12 | 교사별 성찰 시트 라우팅 | 초기에는 Supabase 조회 + CSV 다운로드로 대체 |
| 13 | AI 기반 세특 참고 문구 생성 | 충분한 활동 기록과 교사용 검토 화면이 갖춰진 뒤 구현 |

---

## 7. Supabase 데이터베이스 초안

### 7.1 activities 테이블

```sql
create table activities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  subject text,
  activity_type text,
  created_at timestamptz default now()
);
```

### 7.2 sessions 테이블

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id),
  title text not null,
  join_code text unique not null,
  teacher_name text,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

### 7.3 responses 테이블

```sql
create table responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  student_name text not null,
  student_number text,
  result jsonb,
  reflection text,
  created_at timestamptz default now()
);
```

`responses.result` 예시:

```json
{
  "mode": "coin",
  "n": 30,
  "repeats": 3000,
  "p": 0.5,
  "observedMean": 15.1,
  "expectedMean": 15,
  "distribution": [0, 0, 1, 3, 7]
}
```

### 7.4 장기 확장: AI 세특 문구 생성을 위한 데이터 구조

MVP에서는 `responses` 테이블만 사용한다. 다만 장기적으로는 학생별 활동 기록과 AI 생성 결과를 분리해 관리하는 것이 좋다.

후속 단계에서 고려할 테이블은 다음과 같다.

```sql
-- 학생별 활동 기록을 요약하거나 교사가 선택한 기록을 모아두는 테이블 후보
create table student_activity_summaries (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  student_number text,
  subject text,
  summary jsonb,
  teacher_note text,
  created_at timestamptz default now()
);

-- AI가 생성한 세특 참고 문구 초안과 교사 수정본을 저장하는 테이블 후보
create table ai_record_drafts (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  student_number text,
  subject text,
  source_response_ids uuid[],
  ai_draft text,
  teacher_revision text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

중요 원칙:

- AI 생성 문구는 최종 기록이 아니라 교사용 초안이다.
- 학생 활동 데이터에 근거한 문장만 생성하도록 한다.
- 교사가 source response를 확인할 수 있어야 한다.
- 생성 문구에는 과장, 추정, 확인되지 않은 태도가 들어가지 않도록 한다.
- 최종 사용 여부는 교사가 판단한다.

---

## 8. 추천 파일 구조

```text
mathlab/
  docs/
    mathlab_renewal_development_plan_v1.md
  app/
    page.tsx
    join/
      page.tsx
    student/
      session/[joinCode]/
        page.tsx
    teacher/
      page.tsx
      sessions/
        page.tsx
      sessions/[sessionId]/
        page.tsx
  components/
    layout/
      Header.tsx
      PageContainer.tsx
    activities/
      ProbabilitySimulator.tsx
    teacher/
      ResponseTable.tsx
      SessionCreateForm.tsx
  lib/
    supabase/
      client.ts
      server.ts
    activities/
      probability.ts
    utils/
      joinCode.ts
  types/
    activity.ts
    session.ts
    response.ts
  supabase/
    schema.sql
  .env.local.example
  README.md
```

---

## 9. 확률 시뮬레이터 MVP 설계

기존 Streamlit 앱의 `binomial_simulator.py` 기능을 참고하되, 새 앱에서는 TypeScript 기반 React 컴포넌트로 다시 만든다.

### 입력값

- 실험 종류
  - 동전 던지기
  - 주사위 특정 눈
  - 성공확률 직접 입력
- 1회 실험 시행 수 `n`
- 반복 횟수 `repeats`
- 성공확률 `p`

### 출력값

- 성공 횟수 분포 그래프
- 시뮬레이션 평균
- 이론 평균 `np`
- 학생의 결과 해석 또는 느낀 점

### 구현 방식

- 난수 시뮬레이션은 TypeScript 함수로 구현한다.
- 이항분포 이론값도 TypeScript 함수로 구현한다.
- 그래프는 Recharts 또는 Plotly.js 중 하나를 사용한다.
- MVP에서는 구현이 단순한 Recharts를 우선 검토한다.

---

## 10. AI 세특 참고 문구 생성 기능 설계 방향

이 기능은 장기 목표이며, MVP 이후 단계에서 구현한다. 목적은 학생이 각 미니활동에서 남긴 결과와 성찰 기록을 바탕으로 교사가 생활기록부 세부능력 및 특기사항 참고 문구를 작성할 때 활용할 수 있는 초안을 생성하는 것이다.

### 10.1 기본 흐름

```text
학생이 미니활동 수행
→ 결과와 성찰 기록 제출
→ responses 테이블에 저장
→ 교사가 학생별 활동 기록 조회
→ 교사가 특정 활동 기록 선택
→ AI가 근거 기반 세특 참고 문구 초안 생성
→ 교사가 수정·삭제·보완
→ 최종 참고 문구로 활용
```

### 10.2 화면 설계 후보

```text
/teacher/students
- 학생별 활동 기록 목록

/teacher/students/[studentId]
- 특정 학생의 활동 기록 모아보기
- 활동별 결과, 성찰, 제출 시각 확인
- 세특 후보로 사용할 기록 선택

/teacher/records/new
- 선택한 활동 기록을 바탕으로 AI 문구 생성
- 생성된 초안 확인
- 교사 수정본 저장
```

### 10.3 AI 문구 생성 원칙

- 학생이 실제로 제출한 활동 결과와 성찰 내용을 근거로 한다.
- 근거가 없는 태도, 인성, 역량을 임의로 만들어내지 않는다.
- 과장된 표현보다 구체적인 활동과 관찰 가능한 학습 행동을 중심으로 작성한다.
- AI 결과는 최종 문구가 아니라 교사용 초안이다.
- 교사가 반드시 검토하고 수정해야 한다.
- 학생 개인정보와 민감정보를 다룰 수 있으므로 API 키, 접근 권한, 데이터 보관 정책을 신중하게 설계한다.

### 10.4 지금 단계에서 미리 반영할 점

지금 당장 AI 기능을 구현하지는 않는다. 대신 앞으로 AI 문구 생성을 쉽게 붙일 수 있도록 학생 응답 데이터를 구조화해서 저장한다.

따라서 `responses.result`에는 단순 계산 결과만 넣지 말고, 활동별 핵심 값과 학생 선택 값을 가능한 한 명확한 JSON 구조로 저장한다. `responses.reflection`에는 자유 서술형 성찰을 저장한다.

예시:

```json
{
  "activitySlug": "probability-simulator",
  "mode": "coin",
  "n": 30,
  "repeats": 3000,
  "p": 0.5,
  "observedMean": 15.1,
  "expectedMean": 15,
  "studentInterpretationType": "theory_comparison"
}
```

---

## 11. 개발 단계별 계획

### Phase 1. 새 프로젝트 기본 틀 만들기

목표:

- 새 GitHub repo 사용
- Next.js 프로젝트 생성
- 첫 실행 확인

명령어:

```bash
npx create-next-app@latest mathlab
cd mathlab
npm run dev
```

권장 선택:

```text
TypeScript: Yes
ESLint: Yes
Tailwind CSS: Yes
src directory: Yes
App Router: Yes
Turbopack: Yes 또는 기본값
Import alias: 기본값 사용
```

주의: 이미 GitHub에서 `mathlab` repo를 만들었으므로, 실제 작업은 clone 후 현재 폴더에 Next.js를 생성하는 방식으로 진행한다.

---

### Phase 2. Supabase 프로젝트 연결

목표:

- Supabase 프로젝트 생성
- DB 테이블 생성
- `.env.local` 연결
- Next.js에서 Supabase client 사용

산출물:

- `supabase/schema.sql`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`

---

### Phase 3. 교사용 세션 생성

목표:

- 교사가 활동 세션을 생성한다.
- 입장 코드가 자동 생성된다.

구현 화면:

```text
/teacher
```

기능:

- 세션 제목 입력
- 활동 선택
- 입장 코드 자동 생성
- Supabase `sessions`에 저장
- 생성된 입장 코드 표시

---

### Phase 4. 학생 입장

목표:

- 학생이 입장 코드로 활동에 들어간다.

구현 화면:

```text
/join
/student/session/[joinCode]
```

기능:

- 입장 코드 입력
- 유효한 세션인지 확인
- 이름 / 학번 입력
- 활동 화면 표시

---

### Phase 5. 확률 시뮬레이터 구현

목표:

- 학생이 확률 시뮬레이션을 실행하고 결과를 확인한다.

구현 파일 후보:

```text
components/activities/ProbabilitySimulator.tsx
lib/activities/probability.ts
```

기능:

- 실험 종류 선택
- `n`, `repeats`, `p` 조절
- 시뮬레이션 실행
- 그래프 표시
- 결과 데이터 반환

---

### Phase 6. 응답 제출

목표:

- 학생 결과와 성찰을 Supabase에 저장한다.

저장 대상:

```text
responses.session_id
responses.student_name
responses.student_number
responses.result
responses.reflection
```

이때 장기적인 AI 세특 문구 생성을 고려해 `responses.result`에는 활동별 핵심 변수와 학생 선택값을 구조화된 JSON으로 저장한다.

---

### Phase 7. 교사용 응답 대시보드

목표:

- 교사가 학생 응답을 확인한다.

구현 화면:

```text
/teacher/sessions/[sessionId]
```

기능:

- 제출 수 확인
- 학생별 응답 목록
- 결과 요약
- reflection 확인
- CSV 다운로드

---

### Phase 8. 학생별 활동 기록 모아보기

목표:

- 교사가 특정 학생의 여러 미니활동 성찰 기록을 모아서 볼 수 있게 한다.

기능:

- 학생 이름 / 학번 기준 검색
- 활동별 제출 기록 모아보기
- 활동 제목, 제출 시각, 결과 요약, 성찰 내용 확인
- 세특 참고 문구 생성에 사용할 기록 선택

---

### Phase 9. AI 세특 참고 문구 초안 생성

목표:

- 학생별 활동 기록을 바탕으로 생성형 AI가 세특 참고 문구 초안을 만든다.

기능:

- 교사가 사용할 활동 기록 선택
- AI 문구 생성 요청
- 초안 표시
- 교사 수정본 저장
- 원본 활동 기록과 생성 문구 연결

구현 시점:

- 여러 미니활동 이식 후
- responses 데이터가 충분히 쌓인 후
- 교사용 응답 대시보드가 안정화된 후

---

## 12. AI 코딩 도구 사용 원칙

VS Code에서 Copilot, Claude Code, Codex류 도구를 사용할 때는 작업을 작게 나누어 지시한다.

좋은 지시 예시:

```text
Next.js App Router와 TypeScript를 사용하는 프로젝트야.
Supabase의 sessions 테이블에서 수업 세션 목록을 불러와
/teacher/sessions 페이지에 카드 형태로 보여주는 코드를 작성해줘.
파일을 새로 만들거나 수정할 때는 전체 코드를 보여줘.
```

피해야 할 지시 예시:

```text
기존 Streamlit 앱을 Next.js로 다 바꿔줘.
```

작업 단위는 다음처럼 나눈다.

```text
1. DB 스키마 작성
2. Supabase client 작성
3. 세션 생성 form 작성
4. 세션 목록 page 작성
5. 학생 join page 작성
6. 확률 시뮬레이터 component 작성
7. responses insert 작성
8. teacher dashboard 작성
9. 학생별 활동 기록 모아보기
10. AI 세특 참고 문구 생성
```

---

## 13. 바로 다음 작업

현재 구현 흐름상 다음 작업은 확률 시뮬레이터를 학생 세션 페이지에 연결하는 것이다.

1. `lib/activities/probability.ts` 생성
2. `components/activities/ProbabilitySimulator.tsx` 생성
3. `/student/session/[joinCode]` 페이지에 시뮬레이터 삽입
4. 학생 reflection 입력 영역 추가
5. `responses` 테이블에 제출 저장

---

## 14. 현재 결론

새 앱 개발은 `dskim-git/mathlab`에서 진행한다.

기존 `dskim-git/math`는 현재 사용 중인 Streamlit 앱을 유지하고 참고하는 용도로 둔다.

리뉴얼 전략은 다음과 같다.

```text
기존 앱 전체 복제 X
→ 핵심 수업 흐름 추출 O
→ 확률 시뮬레이터 MVP 구현 O
→ Supabase 응답 저장 O
→ 교사용 대시보드 O
→ 학생별 활동 기록 누적 O
→ AI 세특 참고 문구 초안 생성 O
→ 안정화 후 활동별 순차 이식 O
```

이 문서를 기준으로 이후 개발을 이어간다.
