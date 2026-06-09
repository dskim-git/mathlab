# MathLab

> 고등학교 수학 수업을 위한 학생 참여형 웹앱. 학생이 직접 조작하는 인터랙티브 미니활동과 누적되는 성찰 기록을 통해 수학적 탐구 경험을 쌓고, 교사는 그 흔적을 활용해 평가·세특·피드백에 연결합니다.

```text
Production:  https://mathelab.vercel.app
Stack:       Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase
Repository:  github.com/dskim-git/mathlab
```

---

## 한눈에 보기

| 영역 | 현황 |
|---|---|
| 활동 컴포넌트 | **141개** (공통수학 52 · 확률과 통계 66 · 영재 22 · 기타 1) |
| 교과 단원 | 9개 교과 · `curriculum_units` 트리로 관리 |
| 인증 | 학생 / 교사 / 관리자 / 일반인 4역할, Supabase Auth + RLS |
| DB 마이그레이션 | 69개 (`supabase/migrations/`) |
| 배포 | Vercel Hobby (자동 배포, `main` 푸시 시) |
| 부하 검증 | 40 동시접속 시 p95 < 1.5s (Vercel 엣지), 로그인 burst < 2.5s |

---

## 배경

이 프로젝트는 기존 Streamlit 기반 수학 수업 앱의 **renewal** 입니다. Streamlit은 빠른 프로토타이핑엔 좋았지만 다음 한계가 있었습니다.

- 세션 상태가 서버 메모리에 묶여 동시 접속·새로고침에 약함
- 인증·역할 분리가 어색 (실제 학교 운영 모델과 안 맞음)
- 활동을 페이지가 아니라 "세션"으로 묶어야 해서 학생 활동의 누적 기록이 자연스럽지 않음

MathLab은 **학생 로그인 기반의 누적 활동·성찰 플랫폼**으로 방향을 다시 잡아 Next.js·Supabase 위에 다시 만들고 있습니다.

---

## 주요 기능

### 학생
- 학교 학번(연도+학년+반+번호)으로 로그인 → `/student/home`
- 교과별 단원 트리에서 미니활동 선택 (`/learn`)
- 활동 진행 → 결과·성찰 자동 저장
- 본인 학습 기록·성장 그래프 (`/student/growth`, `/student/records`)
- 수업 후 설문 응답 (`/student/surveys`)

### 교사
- 본인 학교·담당 학급 학생 관리 (`/teacher/students`)
- 진도표(주간·월간·12주 슬라이딩) 작성·관리 (`/teacher/progress`)
- 수업 차시별 블록 편집 (`/teacher/lesson-blocks`)
- 학생 성찰·응답 열람 + 피드백 작성
- AI 세특 초안 생성 보조 (`/teacher/sebteuk`)

### 관리자
- 사용자·역할·승인 관리, 학교/학년/반 로스터 일괄 등록
- 교과 접근 권한 부여 (`/admin/access`)
- 커리큘럼 트리 + 단원별 기본 블록 편집 (`/admin/curriculum`)
- 설문·통계·AI 사용량 대시보드

### 비로그인 공개 활동
- `/public/activity/<slug>` 로 누구나 활동 1개 체험 가능 (성찰 저장은 OFF)
- `noindex` 설정으로 검색 노출 차단

---

## 활동 카탈로그

활동은 `components/activities/registry.ts` 의 단일 레지스트리에 등록되고, `ACTIVITY_REGISTRY[slug]` 로 동적 로딩됩니다. 카테고리·단원별 폴더 구조:

```text
components/activities/
  common/                              # 공통수학 (52)
    1-1-polynomials/                   #   다항식의 연산
    1-2-remainder-factorize/           #   나머지정리·인수분해
    2-1-complex-numbers/               #   복소수와 이차방정식
    2-2-quadratic-function/            #   이차함수
    2-3-equation-inequality/           #   방정식·부등식
    3-1-counting/                      #   경우의 수
    4-1-matrix/                        #   행렬
  probability/                         # 확률과 통계 (66)
    1-1-permutations-combinations/     #   순열·조합
    1-2-binomial-theorem/              #   이항정리
    2-1-prob-concept/                  #   확률의 뜻
    2-2-conditional-prob/              #   조건부확률
    3-1-prob-distribution/             #   확률분포
    3-2-statistical-estimation/        #   통계적 추정
    X-extracurricular/                 #   심화·과외
  gifted/                              # 영재 단원 ①②③④ (22)
    1-primes/
    2-sierpinski-chaos/
    3-perspective-art/
    4-euclidea/
  ProbabilitySimulator.tsx             # 레거시(Streamlit 시절 이식 1호)
  resultRenderer.tsx                   # 활동 결과 공통 렌더러
  registry.ts                          # 단일 등록처
```

각 활동은 자기 단원 폴더 안에서 독립된 컴포넌트로 살고, 슬러그(예: `probability_new/3-1-prob-distribution/binomial_graph_sim`)로 참조됩니다.

---

## 기술 스택

```text
Framework       Next.js 16 (App Router, RSC)
Runtime         React 19
Language        TypeScript 5
Styling         Tailwind CSS v4
DB / Auth       Supabase (Postgres + Auth + RLS + Realtime)
Charting        Recharts · 자체 SVG 컴포넌트
Math            KaTeX
Animation       Motion (framer-motion 후속)
Geo             d3-geo · topojson-client
Linting         ESLint 9
Deploy          Vercel
```

`@supabase/ssr` 의 `createBrowserClient` / `createServerClient` 로 쿠키 기반 세션을 유지하며, 모든 데이터 접근은 PostgREST(HTTPS REST)를 거칩니다. 클라이언트가 Postgres에 직접 TCP 연결하지 않아 연결 풀 고갈 위험이 구조적으로 없습니다.

---

## 아키텍처 핵심 결정

**1. 학번 → 합성 이메일 매핑**
모든 역할이 "아이디 + 비밀번호"로 로그인하고, 앱 내부에서 아이디를 단일 도메인의 합성 이메일(`{loginId}@mathlab.app`)로 매핑해 Supabase Auth를 사용합니다. 학생은 학번을 그대로 아이디로 씁니다.

**2. RLS 우선 보안**
모든 테이블에 Row Level Security를 켜고 `auth.uid()` 기반 정책으로 접근을 제한합니다. service_role 키는 서버 측 admin 작업에만 쓰고, 호출 직전에 별도로 "현재 요청자가 관리자인지" 검증합니다.

**3. timestamptz는 UTC, 표시는 KST**
DB는 표준대로 UTC로 저장하고, 표시는 `lib/dateTime.ts` 의 `formatKoreanDateTime` 헬퍼가 `Asia/Seoul` 로 변환합니다. 서버 사이드 날짜 계산(`progressDates.ts`)은 Vercel 환경변수 `TZ=Asia/Seoul` 에 의존합니다.

**4. 활동 컴포넌트는 자기 책임**
활동마다 자기 UI·상태·시뮬레이션 로직을 캡슐화하고, 성찰 저장만 공용 `ReflectionForm` 으로 위임합니다. 새 활동 추가는 폴더 생성 + 레지스트리 한 줄 추가로 끝납니다.

---

## 프로젝트 구조

```text
mathlab/
  app/                          # Next.js App Router
    admin/                      #   /admin/* — 관리자
    teacher/                    #   /teacher/* — 교사
    student/                    #   /student/* — 학생
    general/                    #   /general/* — 일반인
    learn/                      #   /learn — 단원 탐색
    public/activity/[...slug]/  #   비로그인 공개 활동
    api/                        #   서버 라우트 (admin·teacher 보조)
  components/
    activities/                 # 미니활동 141개 + registry
    activity-renderer/          # 활동 호스트(성찰 포함)
    admin/ teacher/ student/    # 역할별 페이지 컴포넌트
    learn/                      # 단원 탐색 UI
    ui/                         # 공용 디자인 시스템
  lib/
    auth/                       # credentials, requireUser
    supabase/                   # client / server / admin
    activities/                 # activityBlocks, reflection, activityTitles
    curriculum/                 # accessibleSubjects, lessonOverrides
    dashboard/                  # progressDates 등
    dateTime.ts                 # KST 표시 헬퍼
  supabase/
    migrations/                 # 69개 SQL 마이그레이션
  scripts/import/               # 옛 데이터 import 스크립트
  docs/                         # 설계 메모·개발 기록
```

---

## 로컬 개발

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수

루트에 `.env.local` 생성:

```env
# Supabase 프로젝트 Settings → API 에서 값을 복사해 채워주세요.
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret>   # 서버 admin 라우트용. 절대 클라이언트에 노출 금지

# 선택
NEXT_PUBLIC_SYNTH_EMAIL_DOMAIN=mathlab.app             # 기본값 같으면 생략 가능
ANTHROPIC_API_KEY=<your-anthropic-api-key>             # AI 세특 기능 사용 시
```

> **주의** — 실제 키를 README·이슈·PR·스크린샷에 절대 붙여넣지 마세요. 만약 실수로 노출하면 즉시 키를 회전하세요(Supabase 새 secret 키 발급 / Anthropic 콘솔에서 revoke).

`.env.local` 은 `.gitignore` 됩니다.

### 3. 개발 서버

```bash
npm run dev    # http://localhost:3000
```

### 4. 빌드 검사

배포 전에 반드시 로컬에서 빌드 확인:

```bash
npm run build
```

`npm run dev` 는 통과해도 `npm run build` 에서 TypeScript 엄격 검사로 막힐 수 있습니다.

### 5. 린트

```bash
npm run lint
```

---

## 데이터베이스

스키마는 `supabase/migrations/` 의 SQL 파일들로 관리됩니다 (Supabase CLI가 아니라 Supabase Studio SQL Editor에서 순차 실행). 핵심 테이블 그룹:

```text
Auth/Profile      profiles · students · teachers · admins · school_classes
Curriculum        subjects · curriculum_units · lesson_block_overrides
Activities        activity_visits · activity_responses · reflections
Sessions(legacy)  sessions · session_participants · responses
Surveys           surveys · survey_questions · survey_responses
Records           sebteuk · feedback · login_logs · notices
```

모든 테이블에 RLS 활성화. 정책은 각 마이그레이션의 `CREATE POLICY` 절을 참고.

---

## 배포

- `main` 브랜치 푸시 시 Vercel이 자동 빌드·배포 (~2분).
- 환경변수는 Vercel 대시보드 → Settings → Environment Variables 에서 관리 (Production/Preview/Development 분리).
- 도메인: `mathelab.vercel.app` (Vercel 무료 도메인).

### Vercel 환경변수 권장 설정

```
NEXT_PUBLIC_SUPABASE_URL          (Production·Preview·Development)
NEXT_PUBLIC_SUPABASE_ANON_KEY     (Production·Preview·Development)
SUPABASE_SERVICE_ROLE_KEY         (Production·Preview)  ← 민감
TZ                                 Asia/Seoul (모든 환경)
ANTHROPIC_API_KEY                  (선택, AI 기능 사용 시)
```

---

## 용량·부하 한도 (무료 플랜 기준)

학교 단위 정규수업 가정 시 무료 플랜 한도 안에서 안정적으로 운영 가능한지 측정해뒀습니다.

| 지표 | 한도 | 1수업(40명, 50분) 추정 | 월 가능 수업 |
|---|---|---|---|
| Vercel Fast Data Transfer | 100 GB/월 | ~300 MB | ~330회 |
| Vercel Edge Requests | 1M/월 | ~10K | ~100회 |
| Supabase DB Egress | 5 GB/월 | ~80 MB | ~60회 |
| Supabase Realtime Concurrent | 200 | 최대 40 (빙고 시) | 동시 5수업 OK |

자세한 부하 테스트 결과는 커밋 히스토리와 PR을 참고.

---

## 로드맵

**완료**
- 인증·RLS 기반 4역할 분리 (학생/교사/관리자/일반인)
- 활동 141개 React 이식 (확통·공통수학 118 + 영재 23)
- 단원 트리 + 차시별 블록 편집
- 학생 성찰·활동 결과 누적 저장
- 진도표 (주간·월간·12주, 셀 강조)
- AI 세특 보조 (Claude API 연동)
- 설문 사전·사후 비교 + 동의 단계
- 로그인 burst·동시접속 부하 검증

**다음 후보 (비긴급)**
- 학생 회원가입 흐름 개선 (현재 admin 일괄 등록 위주)
- 학습 성취도 시각화 (성장 그래프 고도화)
- 학교 단위 통계 대시보드
- 모바일 UX 다듬기
- 활동 컴포넌트 deep audit (접근성·a11y, 라벨 가독성)

---

## 기여

이 저장소는 개인 프로젝트(교사 1인)로 운영 중이라 외부 PR은 받지 않지만, 이슈로 버그 제보·의견은 환영합니다.

코드 컨벤션은 `AGENTS.md` 와 `CLAUDE.md` 의 가이드를 따릅니다 (커밋 메시지 한국어, `fix(scope): ...` / `feat(scope): ...` 형식).

---

## 참고 문서

- `docs/` — 설계 메모·개발 기록 모음
- `AGENTS.md` / `CLAUDE.md` — 코드 작업 시 LLM 에이전트 가이드

---

## 라이선스

별도 라이선스 명시 없음. 학교 수업·교육 연구 목적의 비상업적 사용을 전제로 합니다. 다른 용도로 활용하려면 저장소 소유자에게 문의해주세요.
