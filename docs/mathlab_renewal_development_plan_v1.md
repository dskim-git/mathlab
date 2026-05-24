# MathLab 수학 웹앱 리뉴얼 개발 문서 v1

작성일: 2026-05-20  
최근 업데이트: 2026-05-24  
새 레포지토리: `dskim-git/mathlab`  
기존 참고 레포지토리: `dskim-git/math`  
배포 주소: `https://mathelab.vercel.app/`  
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
6. 최종적으로 각 미니활동에서 수집한 학생 성찰 자료와 활동 결과를 바탕으로 생성형 AI가 세특 문구 초안을 작성하고, 교사가 검토·수정해 활용할 수 있는 구조를 만든다.

---

## 2. 현재 구현 상태

2026-05-22 기준으로 MVP 1차 흐름은 다음까지 구현되었다.

```text
교사가 수업 세션 생성
→ 입장 코드 발급
→ 학생이 입장 코드로 참여
→ 확률 시뮬레이터 활동 수행
→ 결과 해석 및 성찰 제출
→ Supabase responses 테이블 저장
→ 교사가 세션별 학생 응답 확인
→ CSV 다운로드
```

### 2.1 구현 완료 기능

#### 교사용

- `/teacher` 교사용 대시보드
- Supabase `activities` 테이블 조회
- 수업 세션 생성
- 입장 코드 자동 발급
- 최근 수업 세션 목록 확인
- `/teacher/sessions/[sessionId]` 세션별 학생 응답 확인
- 학생 응답 CSV 다운로드

#### 학생용

- `/join` 입장 코드 입력
- 학생 이름 / 학번 또는 번호 입력
- `/student/session/[joinCode]` 활동 페이지 입장
- 확률 시뮬레이터 실행
- 평균, 분산, 성공 횟수 분포표 확인
- Recharts 기반 성공 횟수 분포 그래프 확인
- 결과 해석 관점 선택
- 성찰 작성 및 제출

#### 데이터베이스

- `activities` 테이블 사용
- `sessions` 테이블 사용
- `responses` 테이블 사용
- 확률 시뮬레이터 결과를 `responses.result` JSONB에 구조화하여 저장
- 학생 성찰을 `responses.reflection`에 저장

---

## 3. 기술 스택

새 앱은 다음 기술 스택을 기준으로 개발한다.

```text
프론트엔드 / 풀스택 프레임워크: Next.js App Router
언어: TypeScript
스타일링: Tailwind CSS
데이터베이스: Supabase Postgres
차트: Recharts
백엔드 기능: Supabase API / Next.js Server Actions 또는 Route Handlers
배포: Vercel
개발 환경: VS Code
코드 관리: GitHub
```

MVP 단계에서는 Python 서버를 따로 두지 않는다. 확률 시뮬레이션 정도는 TypeScript로 구현한다. 나중에 SymPy, 복잡한 수치 계산, 기존 Python 코드 재사용이 꼭 필요한 활동이 생기면 FastAPI 서버를 별도로 검토한다.

AI 세특 문구 생성 기능은 MVP 이후 단계에서 구현한다. 이 기능은 학생 응답 데이터가 일정량 누적되고, 교사용 대시보드에서 응답을 안정적으로 조회할 수 있게 된 뒤에 붙인다. 초기에는 생성형 AI API를 바로 연결하지 않고, 학생 활동 기록을 잘 구조화해 저장하는 것부터 우선한다.

---

## 4. 기존 앱 분석 요약

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

## 5. 새 앱의 핵심 수업 흐름

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

## 6. MVP 범위

MVP의 목표는 다음 질문에 답하는 것이다.

```text
Next.js + Supabase + Vercel 구조에서 학생 40~50명이 동시에 접속해
확률 시뮬레이터 활동을 수행하고,
응답을 저장한 뒤,
교사가 대시보드에서 확인할 수 있는가?
```

### MVP에 포함한 기능

#### 학생 화면

- 입장 코드 입력
- 이름 / 학번 또는 번호 입력
- 확률 시뮬레이터 활동 수행
- 시뮬레이션 결과 그래프 확인
- 결과 해석 또는 느낀 점 입력
- 응답 제출

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

### MVP에서 아직 제외한 기능

- 학생 회원가입
- 교사 로그인
- 관리자 승인
- 과목별 상세 권한
- Google Sheets 자동 연동
- 교사별 시트 라우팅
- 전체 기존 활동 일괄 이식
- AI 피드백 자동 생성
- 세특 문구 자동 생성
- 세션 종료 기능
- 중복 제출 제한
- 응답 삭제 기능

---

## 7. 기능별 이식 우선순위

| 우선순위 | 기능 | 새 앱 이식 판단 |
|---|---|---|
| 1 | 확률 시뮬레이터 | MVP 첫 활동으로 구현 완료 |
| 2 | 학생 응답 저장 | Supabase `responses` 테이블로 구현 완료 |
| 3 | 교사용 응답 확인 | 새 대시보드로 구현 완료 |
| 4 | CSV 다운로드 | 세션별 응답 다운로드 구현 완료 |
| 5 | 입장 코드 기반 참여 | 새 앱의 핵심 진입 방식으로 구현 완료 |
| 6 | 세션 종료 기능 | 다음 개발 후보 |
| 7 | 중복 제출 방지 / 재제출 정책 | 다음 개발 후보 |
| 8 | 계산기 | 저장 필요가 적으므로 후순위 |
| 9 | 확률과통계 미니 활동 | 수업 활용도 높은 것부터 선별 이식 |
| 10 | 공통수학 미니 활동 | 단원별로 선별 이식 |
| 11 | 학생별 활동 기록 누적 | responses 데이터를 학생별·활동별로 조회할 수 있게 확장 |
| 12 | 로그인 / 회원가입 전체 | Supabase Auth 또는 교사 로그인으로 나중에 재설계 |
| 13 | Google Sheets 권한 관리 | MVP에서는 제외 |
| 14 | 설문 연구 기능 | 연구 단계에서 별도 모듈로 이식 |
| 15 | AI 기반 세특 참고 문구 생성 | 충분한 활동 기록과 교사용 검토 화면이 갖춰진 뒤 구현 |

---

## 8. Supabase 데이터베이스 초안

### 8.1 activities 테이블

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

### 8.2 sessions 테이블

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

### 8.3 responses 테이블

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
  "activitySlug": "probability-simulator",
  "mode": "coin",
  "modeLabel": "동전 던지기",
  "n": 30,
  "repeats": 3000,
  "p": 0.5,
  "observedMean": 15.1,
  "expectedMean": 15,
  "observedVariance": 7.4,
  "expectedVariance": 7.5,
  "interpretationType": "theory_comparison",
  "distribution": []
}
```

### 8.4 현재 RLS 정책 메모

현재 MVP 테스트 단계에서는 학생이 별도 로그인 없이 응답을 제출할 수 있어야 하므로 `responses` 테이블에 anon insert/select 정책을 허용했다.

현재 정책의 목적:

```text
학생이 입장 코드 기반으로 응답 제출 가능
교사용 화면에서 응답 조회 가능
빠른 MVP 검증 가능
```

주의:

```text
운영 단계에서는 이 정책을 그대로 두면 안 된다.
교사 로그인, 세션 권한, 응답 조회 권한을 도입한 뒤 RLS를 강화해야 한다.
```

---

## 9. 장기 확장: AI 세특 문구 생성을 위한 데이터 구조

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

## 10. 추천 파일 구조

```text
mathlab/
  docs/
    mathlab_renewal_development_plan_v1.md
    activity_reflection_design_memo.md
  app/
    page.tsx
    join/
      page.tsx
    student/
      session/[joinCode]/
        page.tsx
    teacher/
      page.tsx
      sessions/[sessionId]/
        page.tsx
  components/
    activities/
      ProbabilitySimulator.tsx
    teacher/
      ResponseCsvDownloadButton.tsx
      SessionCreateForm.tsx
  lib/
    supabase/
      client.ts
    activities/
      probability.ts
    utils/
      joinCode.ts
  README.md
```

---

## 11. 확률 시뮬레이터 MVP 설계

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
- 성공 횟수 분포표
- 시뮬레이션 평균
- 이론 평균 `np`
- 시뮬레이션 분산
- 이론 분산 `np(1-p)`
- 학생의 결과 해석 또는 느낀 점

### 구현 방식

- 난수 시뮬레이션은 TypeScript 함수로 구현한다.
- 이항분포 이론값도 TypeScript 함수로 구현한다.
- 그래프는 Recharts의 `ComposedChart`를 사용한다.
- 막대그래프는 시뮬레이션 상대도수를 나타낸다.
- 선그래프는 이론적인 이항분포 확률을 나타낸다.

---

## 12. 활동 성찰 유형 설계 방향

앞으로 미니활동은 성찰 입력 방식에 따라 두 유형으로 설계한다.

```text
간단 성찰형
- 해석 관점 1개 선택
- 성찰 1개 작성
- 짧은 수업 활동용

심화 성찰형
- 여러 성찰 문항에 각각 답변
- 탐구형 활동 / 세특 참고자료용
```

현재 확률 시뮬레이터는 간단 성찰형으로 구현되어 있다.

상세 설계는 아래 문서를 따른다.

```text
docs/activity_reflection_design_memo.md
```

---

## 13. AI 세특 참고 문구 생성 기능 설계 방향

이 기능은 장기 목표이며, MVP 이후 단계에서 구현한다. 목적은 학생이 각 미니활동에서 남긴 결과와 성찰 기록을 바탕으로 교사가 생활기록부 세부능력 및 특기사항 참고 문구를 작성할 때 활용할 수 있는 초안을 생성하는 것이다.

### 13.1 기본 흐름

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

### 13.2 화면 설계 후보

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

### 13.3 AI 문구 생성 원칙

- 학생이 실제로 제출한 활동 결과와 성찰 내용을 근거로 한다.
- 근거가 없는 태도, 인성, 역량을 임의로 만들어내지 않는다.
- 과장된 표현보다 구체적인 활동과 관찰 가능한 학습 행동을 중심으로 작성한다.
- AI 결과는 최종 문구가 아니라 교사용 초안이다.
- 교사가 반드시 검토하고 수정해야 한다.
- 학생 개인정보와 민감정보를 다룰 수 있으므로 API 키, 접근 권한, 데이터 보관 정책을 신중하게 설계한다.

### 13.4 지금 단계에서 미리 반영할 점

지금 당장 AI 기능을 구현하지는 않는다. 대신 앞으로 AI 문구 생성을 쉽게 붙일 수 있도록 학생 응답 데이터를 구조화해서 저장한다.

따라서 `responses.result`에는 단순 계산 결과만 넣지 말고, 활동별 핵심 값과 학생 선택 값을 가능한 한 명확한 JSON 구조로 저장한다. `responses.reflection`에는 자유 서술형 성찰을 저장한다.

---

## 14. 개발 단계별 계획

### Phase 1. 새 프로젝트 기본 틀 만들기

상태: 완료

- 새 GitHub repo 사용
- Next.js 프로젝트 생성
- Vercel 배포 확인

---

### Phase 2. Supabase 프로젝트 연결

상태: 완료

- Supabase 프로젝트 생성
- DB 테이블 생성
- `.env.local` 연결
- Next.js에서 Supabase client 사용

---

### Phase 3. 교사용 세션 생성

상태: 완료

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

상태: 완료

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

상태: 완료

구현 파일:

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

상태: 완료

저장 대상:

```text
responses.session_id
responses.student_name
responses.student_number
responses.result
responses.reflection
```

장기적인 AI 세특 문구 생성을 고려해 `responses.result`에는 활동별 핵심 변수와 학생 선택값을 구조화된 JSON으로 저장한다.

---

### Phase 7. 교사용 응답 대시보드

상태: 완료

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

### Phase 8. 세션 관리 안정화

상태: 다음 개발 후보

목표:

- 교사가 세션을 종료할 수 있게 한다.
- 종료된 세션은 학생이 더 이상 입장하지 못하게 한다.
- 교사용 세션 목록에서 진행 중 / 종료 상태를 명확하게 표시한다.

---

### Phase 9. 중복 제출 방지 또는 재제출 정책

상태: 다음 개발 후보

검토할 정책:

```text
1. 같은 세션에서 같은 이름/학번은 한 번만 제출 가능
2. 여러 번 제출 가능하되 가장 최근 응답을 대표 응답으로 표시
3. 교사가 세션별로 제출 정책을 선택
```

MVP 이후에는 실제 수업 운영 방식을 고려해 결정한다.

---

### Phase 10. 학생별 활동 기록 모아보기

상태: 후속 개발

목표:

- 교사가 특정 학생의 여러 미니활동 성찰 기록을 모아서 볼 수 있게 한다.

기능:

- 학생 이름 / 학번 기준 검색
- 활동별 제출 기록 모아보기
- 활동 제목, 제출 시각, 결과 요약, 성찰 내용 확인
- 세특 참고 문구 생성에 사용할 기록 선택

---

### Phase 11. AI 세특 참고 문구 초안 생성

상태: 장기 개발

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

## 15. AI 코딩 도구 사용 원칙

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

코드를 수정할 때는 가능하면 부분 코드보다 전체 파일 단위로 교체하는 방식이 초보 개발자에게 안전하다. 수정 후에는 항상 아래 순서로 확인한다.

```bash
npm run dev
npm run build
git status
git add .
git commit -m "작업 내용"
git push
```

---

## 16. 바로 다음 작업 후보

현재 기능을 정리한 뒤 다음 작업은 안정화 기능부터 진행한다.

추천 순서:

```text
1. 세션 종료 기능
2. 종료된 세션 학생 입장 차단
3. 중복 제출 방지 또는 재제출 정책 결정
4. 교사용 세션 상세 화면 개선
5. 응답 삭제 또는 관리 기능
6. 기존 Streamlit 미니활동 순차 이식 준비
```

---

## 17. 현재 결론

새 앱 개발은 `dskim-git/mathlab`에서 진행한다.

기존 `dskim-git/math`는 현재 사용 중인 Streamlit 앱을 유지하고 참고하는 용도로 둔다.

리뉴얼 전략은 다음과 같다.

```text
기존 앱 전체 복제 X
→ 핵심 수업 흐름 추출 O
→ 확률 시뮬레이터 MVP 구현 O
→ Supabase 응답 저장 O
→ 교사용 대시보드 O
→ CSV 다운로드 O
→ 학생별 활동 기록 누적 O
→ AI 세특 참고 문구 초안 생성 O
→ 안정화 후 활동별 순차 이식 O
```

이 문서를 기준으로 이후 개발을 이어간다.

---

## 18. UI 디자인 방침과 반응형 지원 (2026-05-24 추가)

> 이 섹션은 "전체 UI/디자인은 언제 하나"와 "반응형(PC/태블릿/모바일) 지원" 요구를 명시한다. 인증·RLS 전환(H) 진행 중에 합의된 방침이다.

### 18.1 반응형 지원 방침

이 앱은 **PC(데스크톱) 사용이 기본**이지만, **태블릿과 모바일(스마트폰)에서도 사용 가능하도록 반응형(responsive)** 으로 만든다.

사용 환경 우선순위:

```text
1순위 PC      : 교사 대시보드 · 학급별 조회 · CSV 등 정보량 많은 화면
2순위 태블릿  : 수업 중 학생의 활동 수행
3순위 모바일  : 학생 로그인 · 성찰 제출 · 본인 활동 기록 조회 등 가벼운 동작
```

작성 원칙:

- Tailwind 반응형 유틸리티(`sm:` `md:` `lg:` `xl:`) 기반 **모바일 우선(mobile-first)** 으로 작성한다.
- 고정 px 너비를 지양하고 `max-w-*` + `w-full` 패턴을 쓴다. 가로 스크롤이 생기지 않게 한다.
- **새로 만드는 화면은 처음부터 모바일에서 깨지지 않는 베이스라인**을 지킨다(터치 타깃 충분히 크게, 표는 가로 스크롤 또는 카드형으로 대체).
- 정보량이 많은 교사 표/대시보드는 모바일에서 카드·접기 형태로 단순화한다.
- 기준 breakpoint는 Tailwind 기본값을 따른다: `sm 640 / md 768 / lg 1024 / xl 1280`.

### 18.2 본격 디자인(UI 통일) 시점

전체적인 비주얼 디자인(색·타이포·간격 통일, 공통 컴포넌트화 = 디자인 시스템)은 **인증·RLS 전환(H)으로 화면 구성이 확정된 뒤** 별도 단계에서 진행한다.

이유:

- 지금은 로그인·가입·승인 대시보드·학생 홈 등 화면이 계속 추가·변경되는 중이다. 지금 정교한 디자인을 입히면 곧 버려진다.
- 화면 세트와 정보 구조가 안정된 뒤 한 번에 통일하는 편이 효율적이다.

권장 시점:

```text
H Phase 4(localStorage 소프트 게이트 제거 · 서버 세션 정리)까지 끝나
주요 화면 세트가 고정된 직후
→ 별도 단계 "I. 디자인 시스템 · 반응형 정리" 로 진행한다.

그 전까지는 18.1의 반응형 베이스라인만 지키며 기능 개발에 집중한다(디자인 부채를 작게 유지).
```

단계 "I" 작업 후보:

- 공통 디자인 토큰(색·여백·타이포)과 공통 컴포넌트(버튼·입력·카드) 정리
- 화면별 반응형 레이아웃 점검(PC·태블릿·모바일 실제 기기/뷰포트 확인)
- 접근성 점검(명도 대비, 키보드 포커스, 터치 타깃 크기)

> 요약: **반응형은 지금부터 베이스라인으로 항상 지키고, 본격적인 디자인 통일은 H(인증·RLS)가 끝나 화면이 고정된 후 단계 I에서 한다.**
