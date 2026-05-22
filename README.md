# MathLab

MathLab은 수학 수업에서 사용할 수 있는 학생 참여형 웹앱입니다. 기존 Streamlit 기반 수학 수업 앱을 참고하되, 새 프로젝트에서는 Next.js, Supabase, Vercel 기반으로 더 안정적이고 확장 가능한 구조를 목표로 개발합니다.

현재 배포 주소:

```text
https://mathelab.vercel.app/
```

---

## 1. 현재 구현 상태

현재 MVP 1차 흐름은 다음까지 구현되어 있습니다.

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

### 교사용 기능

- `/teacher` 교사용 대시보드
- 활동 목록 조회
- 수업 세션 생성
- 입장 코드 자동 발급
- 최근 수업 세션 목록 확인
- 세션별 학생 응답 확인
- 학생 응답 CSV 다운로드

### 학생용 기능

- `/join` 입장 코드 입력
- 학생 이름 / 학번 또는 번호 입력
- `/student/session/[joinCode]` 활동 페이지 입장
- 확률 시뮬레이터 실행
- 평균, 분산, 분포표 확인
- Recharts 기반 성공 횟수 분포 그래프 확인
- 결과 해석 관점 선택
- 성찰 작성 및 제출

### 데이터 저장

Supabase Postgres를 사용하며 현재 핵심 테이블은 다음과 같습니다.

```text
activities
sessions
responses
```

---

## 2. 기술 스택

```text
Framework: Next.js App Router
Language: TypeScript
Styling: Tailwind CSS
Database: Supabase Postgres
Chart: Recharts
Deployment: Vercel
Development: VS Code
Repository: GitHub
```

---

## 3. 주요 폴더 구조

```text
mathlab/
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
    activities/
      probability.ts
    supabase/
      client.ts
    utils/
      joinCode.ts
  docs/
    mathlab_renewal_development_plan_v1.md
    activity_reflection_design_memo.md
```

---

## 4. 로컬 개발 방법

### 4.1 패키지 설치

```bash
npm install
```

### 4.2 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 Supabase 정보를 넣습니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`.env.local`은 GitHub에 올리지 않습니다.

### 4.3 개발 서버 실행

```bash
npm run dev
```

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:3000
```

### 4.4 빌드 검사

Vercel 배포 전에 로컬에서 반드시 확인합니다.

```bash
npm run build
```

`npm run dev`에서는 정상이어도 `npm run build`에서 TypeScript 오류가 발견될 수 있습니다.

---

## 5. 주요 화면

```text
/
- 홈 화면

/join
- 학생 입장 코드 입력 화면

/student/session/[joinCode]
- 학생 활동 화면
- 현재는 확률 시뮬레이터 표시

/teacher
- 교사용 대시보드
- 수업 세션 생성
- 최근 세션 목록 확인

/teacher/sessions/[sessionId]
- 세션별 학생 응답 확인
- CSV 다운로드
```

---

## 6. 현재 MVP에서 의도적으로 단순화한 부분

현재 단계에서는 빠른 수업 테스트와 구조 검증을 위해 다음 기능은 아직 단순화되어 있습니다.

```text
교사 로그인 없음
학생 회원가입 없음
세션 종료 기능 없음
중복 제출 제한 없음
응답 삭제 기능 없음
세부 권한 관리 없음
AI 세특 문구 생성 기능 없음
```

이 기능들은 MVP 기본 흐름이 안정화된 뒤 단계적으로 추가합니다.

---

## 7. 성찰 유형 설계 방향

앞으로 미니활동은 성찰 입력 방식에 따라 두 유형으로 설계합니다.

```text
간단 성찰형
- 해석 관점 1개 선택
- 성찰 1개 작성
- 짧은 수업 활동용

심화 성찰형
- 여러 성찰 문항에 각각 답변
- 탐구형 활동 / 세특 참고자료용
```

현재 확률 시뮬레이터는 간단 성찰형입니다.

자세한 설계는 아래 문서를 기준으로 합니다.

```text
docs/activity_reflection_design_memo.md
```

---

## 8. 장기 목표

MathLab의 장기 목표는 단순한 활동 웹앱이 아니라, 학생의 수학적 탐구 과정과 성찰 기록을 수집하고 교사가 수업 기록으로 활용할 수 있는 플랫폼을 만드는 것입니다.

장기 흐름은 다음과 같습니다.

```text
미니활동별 학생 결과와 성찰 수집
→ 학생별·활동별 학습 흔적 누적
→ 교사가 활동 기록 확인
→ 생성형 AI가 세특 참고 문구 초안 생성
→ 교사가 검토·수정 후 활용
```

AI가 생성한 문구는 최종 문구가 아니라 교사용 초안으로 취급합니다.

---

## 9. 다음 개발 후보

우선순위가 높은 다음 작업은 다음과 같습니다.

```text
1. 세션 종료 기능
2. 학생 중복 제출 방지 또는 재제출 정책 정리
3. 교사용 세션 상세 화면 개선
4. 응답 삭제 또는 관리 기능
5. 활동 템플릿 구조화
6. 기존 Streamlit 미니활동 순차 이식
7. 학생별 활동 기록 모아보기
8. AI 세특 참고 문구 생성 준비
```

---

## 10. 참고 문서

```text
docs/mathlab_renewal_development_plan_v1.md
- 전체 개발 계획과 단계별 설계

docs/activity_reflection_design_memo.md
- 간단 성찰형 / 심화 성찰형 활동 설계 원칙
```
