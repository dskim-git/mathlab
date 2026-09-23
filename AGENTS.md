# MathLab — 에이전트 작업 지침

수학 수업용 웹앱 **MathLab**(repo `dskim-git/mathlab`, 배포 https://mathelab.vercel.app/)의
코딩 에이전트용 문서. 여기 있는 규칙은 이 저장소에서 일할 때의 기본값이며, 사용자가 다르게
지시하면 그 지시가 우선한다.

상세 배경은 `docs/` 에 있다(§9 문서 지도). 이 문서는 **매번 지켜야 할 것**만 모은다.

---

## 1. 프로젝트가 무엇인가

교사(사용자) 한 명이 직접 운영하는 학교 수학 수업 플랫폼이다. 옛 Streamlit + Google Sheets
앱을 Next.js + Supabase 로 리뉴얼했다.

핵심 방향은 **세션(입장코드) 중심 → 학생 로그인 기반 누적 기록 앱**이다.

- 학생은 **학번으로 로그인**해서 교육과정을 따라가며 **미니활동**을 하고 **성찰**을 남긴다.
- 기록은 `student_id` 밑에 **누적**된다. 세션(`session_id`)은 nullable 한 보조 기능이다.
- 최종 목적지: 누적된 활동 결과·성찰을 근거로 **AI가 세특(과목별 세부능력 및 특기사항)
  문구 초안**을 만들고 교사가 검토·수정한다. 그래서 "성찰을 구조화해서 모은다"가
  이 앱의 거의 모든 설계 결정을 지배한다.
- 규모 전제: 한 반 40~50명 동시 접속. 무거운 클라이언트 연산·N+1 쿼리를 피한다.

---

## 2. 작업 방식 (가장 중요)

사용자는 모든 변경을 **자기 환경에서 직접 확인하면서** 진행한다. 다음 루프를 지킨다.

1. **작은 단계 하나만** 구현한다. 여러 기능을 한 번에 몰아 넣지 않는다.
2. 무엇을 왜 했는지 **한국어로 짧게** 설명한다.
3. 사용자가 **로컬에서 무엇을 확인하면 되는지** 구체적으로 알려준다
   (`npm run dev` 후 어느 화면, Supabase 어느 테이블·컬럼).
4. **다음 단계 후보**를 한 줄로 제시하고 **멈춰서 기다린다.**
5. "문제 없다 / 다음 진행해줘" 확인을 받은 뒤에 다음 단계로 간다.
6. **커밋·푸시는 기능 단위 체크포인트에서** 한다(마이크로 단계마다 커밋하지 않는다).
   사용자가 "커밋해"라고 하기 전에는 커밋하지 않는다.

### 코드를 고친 뒤 항상

```bash
npm run build     # 또는 npx tsc --noEmit — 통과가 기본 조건
```

빌드가 깨진 채로 "다 됐다"고 보고하지 않는다.

### 커밋·배포

- 작업은 **브랜치**에서 → `main` 에 **`--no-ff` 머지** → `git push origin main`.
- `main` 푸시 = **Vercel 자동 배포**(= 학생들이 바로 보는 운영 환경). 항상 그 무게로 다룬다.
- 커밋 메시지는 한국어, `feat(<교과/영역>): …` / `fix(<영역>): …` 관례를 따른다.

### DB 변경은 audit-first

1. 먼저 **현재 상태를 조회해서 확인**한다(추측 금지).
2. 변경은 **`supabase/migrations/<날짜>_<이름>.sql` 파일로 기록**한다. 멱등하게 쓴다
   (`on conflict do update`, `if not exists`).
3. **운영 DB에 SQL을 실행하는 것은 사용자 몫**이다(Supabase Studio SQL editor).
   에이전트가 임의로 운영 데이터를 바꾸지 않는다. 필요하면 파일과 실행 절차를 주고 멈춘다.
4. 진단 목적의 **읽기 조회**는 해도 된다. `.env.local` 의 `SUPABASE_SERVICE_ROLE_KEY` 로
   임시 스크립트를 만들어 조회했다면 **쓰고 나서 지운다**(저장소에 남기지 않는다).

---

## 3. 기술 스택과 구조

- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**, Node 22, 배포는 Vercel.
- **Supabase**(Postgres + Auth + RLS). 스키마 변경은 `supabase/migrations/` 에 날짜순 누적.
- 수식 `katex`, 차트 `recharts`, 지도 `d3-geo` + `topojson-client`, 애니메이션 `motion`.

```
app/               App Router. 역할별로 갈라진다.
  admin/           관리자 — 명렬표·수업·회원·교육과정·활동개요·세특·설정 등
  teacher/         교사 — 기록·진도·세특·수업블록·세션
  student/         학생 — 홈·활동·기록·성찰·성장·설문
  general/         일반인(연수·외부) 계정
  learn/           교육과정 탐색(학생이 활동에 들어가는 주 경로)
  api/             Route Handler(서버 전용: service_role, AI 호출, 외부 API 프록시)
components/
  activities/        미니활동 컴포넌트 + registry.ts + 공용(Katex/Quiz/ReflectionForm 등)
  activity-renderer/ 수업 블록 렌더러(활동·자료·문제 블록을 화면에 배치)
  content-blocks/    블록 편집기
  ui/                공용 UI 프리미티브(Button/Card/Alert/TextField …)
lib/
  supabase/        client(브라우저) / server(쿠키 세션) / admin(service_role, 서버 전용)
  auth/            requireStudent · requireTeacher · requireGeneral · requireUser 가드
  activities/      registry 보조(제목·카탈로그·성찰·제출·점수)
  courses/ curriculum/ settings/ …
supabase/migrations/  DB 스키마·시드의 단일 기록처
docs/                 설계 문서·진행 메모
```

Supabase 클라이언트 3종을 **용도대로** 쓴다.

| 파일 | 권한 | 쓰는 곳 |
|---|---|---|
| `lib/supabase/client.ts` | anon + 로그인 세션(쿠키) | 클라이언트 컴포넌트 |
| `lib/supabase/server.ts` | 요청자 신원(RLS 적용) | 서버 컴포넌트·Server Action |
| `lib/supabase/admin.ts` | **service_role, RLS 우회** | Route Handler 전용. 호출 직전 **요청자가 관리자인지 반드시 검증** |

---

## 4. 도메인 모델 — 헷갈리기 쉬운 것들

### 학번과 계정

- 학번은 `학년 + 반(2자리) + 번호(2자리)` = `20602`(2학년 6반 2번).
- 로그인 아이디는 `학년도 + 학번` = `202620602`, Auth 는 **합성 이메일**
  `202620602@mathlab.app` 로 매핑한다(`lib/auth/credentials.ts`). 실제 메일은 보내지 않는다.
- 학생 가입은 **명렬표(`student_roster`) 의 학번·이름과 일치할 때만** 통과하고 자동 승인된다.
  교사·일반인은 `pending` 으로 시작해 관리자가 승인한다.
- 계정 생성은 `auth.users` INSERT 트리거(`handle_new_auth_user`)가 `profiles`/`students` 를 만든다.

### 수업(courses)이 담당·수강의 정본

```
courses         (school_year, semester, subject, name, [grade, class_number])
course_teachers (course_id, profile_id)
course_students (course_id, student_code, school_year, student_id NULL 허용)
```

- 정규 수업과 선택 수업이 같은 모델이다. 권한 판정은 언제나 **`course_students` 명단**으로 한다
  (`grade`/`class_number` 는 표시·일괄배정용 힌트).
- **편성은 학번 기준**이라 아직 가입하지 않은 학생도 미리 넣는다(`student_id` NULL = 미가입 대기).
  학생이 가입하는 순간 트리거가 연결한다.
- RLS 판정의 중심은 `course_teacher_of_record(student_id, subject, school_year, semester)`.
- 진도표(`progress_tracker` 등)도 `course_id` 가 키다 — 앱은 `course_id` 만 보내면 된다.

### 기록은 (학년도 · 학기 · 교과) 3축

- `students.profile_id` 가 unique 라 **학년이 올라가도 `student_id` 는 그대로**다.
  `student_id` 만으로 조회하면 1학기 기록이 2학기 화면에 섞인다.
- `activity_responses` / `legacy_reflections` / `survey_responses` / `sebteuk_drafts` 에
  `school_year`·`semester`·`subject` 가 있다. **교사 화면의 새 조회는 반드시 3축으로 좁힌다**
  — 상세 패널뿐 아니라 **목록의 건수 배지**도 같은 범위로(어긋난 적 있음).
- 새 응답의 학년도·학기는 **DB 트리거**가 `app_settings` 를 보고 채운다. 클라이언트가 보내지 않는다.
  학기가 바뀌면 사용자가 `/admin/settings` 에서 바꾼다.
- `subject IS NULL` = "교과 무관 자료" — 어느 교과 화면에서도 보이되 기본 선택은 아니다.
- 학생 본인 화면은 scope 없이 전체를 보여준다.

---

## 5. 미니활동 — 이 저장소의 주된 작업

미니활동은 **캔바 수업자료를 기준으로 새로 만든다.**
(옛 Streamlit 활동 이식은 이미 전부 끝났다. `docs/activity_porting_guide_v1.md` 는 그때의
기록일 뿐 새 작업의 지침이 아니다 — 새로 만들 때는 아래 규칙만 따른다.)

### 5.1 활동 1개 = 6곳을 모두 갱신해야 완성

| # | 위치 | 할 일 |
|---|---|---|
| 1 | `components/activities/<교과>/<중단원>/<활동>/<Comp>.tsx` | 활동 컴포넌트 + 하단 `ReflectionForm` |
| 2 | `components/activities/registry.ts` | `import` + `ACTIVITY_REGISTRY` 에 `slug → 컴포넌트` |
| 3 | `lib/activities/activityTitles.ts` | `SHORT_ACTIVITY_TITLE` 에 `slug → 짧은 한국어 제목` |
| 4 | `lib/activities/activityCatalog.ts` | 해당 교과·단원 그룹에 slug 추가(블록 편집기 드롭다운) |
| 5 | `supabase/migrations/*_activity_overviews_seed_<교과>.sql` | `activity_overviews` upsert(**라이브 실행은 사용자**) |
| 6 | 컴포넌트 안 `REFLECTION_QUESTIONS` | 활동 고유 성찰 질문 |

빠뜨리면: 2 → 활동이 "준비 중"으로 뜸 / 3 → 기록·통계에 슬러그가 그대로 노출 /
4 → 편집기 드롭다운에 안 보임.

- **슬러그**: `<교과키>/mini/<snake_case>` (`common/mini/…`, `common2/mini/…`,
  `probability_new/mini/…`, `economics/mini/…`).
- **폴더**: `components/activities/<교과>/<중단원 kebab>/<활동 kebab>/<Comp>.tsx`.
  공용 파일과 `registry.ts` 는 `components/activities/` 루트에 둔다.
- **제목**: `"미니:"` 접두어 금지(타입 배지가 이미 표시). 길면 `SHORT_ACTIVITY_TITLE` 로 짧게.
  DB 의 원본 제목은 건드리지 않고 **표시 단계**(`ActivityRenderer.displayBlockTitle`)에서 정리한다.

### 5.2 요청은 이 형식으로 온다 (자리 / 내용 / 형태)

사용자는 대체로 아래 3단 구조로 제작을 요청한다. 세부는 활동마다 다르지만 뼈대는 같다.

```text
1) 자리 : <교과>의 <소단원 번호·이름>에 있는 "<캔바 자료 제목>" 캔바의 앞/뒷쪽
2) 내용 : <무엇에 대한 미니활동인지 한 줄>
          첫번째 탭은 … 문제를 활동으로 구성해줘.
          두번째 탭은 … 활동으로 구성해줘.
          세번째 탭은 … / 네번째 탭은 …
          (전제·제약: 예시를 많이 / 일상생활 사례로 / 이미지로 올린 예시는 제외 /
           교과서 페이지는 넣지 말 것 / 재미있는 활동이 있으면 탭을 더 추가해도 좋음)
3) 활동 형태 : 시뮬레이션·조작형 / 게임 / 개념 탐색·시각화, 가독성 우선
```

세 가지 중 빠진 것이 있으면 **만들기 전에 물어본다.** 특히 **자리**와 **탭 구성**은 추측하지 않는다.
캔바 슬라이드·업로드 이미지의 내용은 에이전트가 직접 볼 수 없으므로, 필요한 설명은 요청에서 받는다.

### 5.3 제작 원칙 (요청에 안 적혀 있어도 항상 적용)

- **요청한 탭은 전부 만든다.** 비슷해 보인다고 합치거나 빼지 않는다. 재미있는 확장 탭은 더해도 좋다.
- **예시를 넉넉히.** 한 탭에 문제 하나로 끝내지 말고 여러 사례·난이도를 담는다.
- **일상생활 사례로 개념을 이해시킨다.** 순수 수학 예시만으로 채우지 않는다.
- **수업에서 이미 다룬 예(사용자가 올린 이미지 속 예)는 쓰지 않는다.** 항상 새 예시를 만든다.
- **교과서 페이지는 인용하지 않는다.** (외부 통계·데이터를 쓴 경우의 `📌` 출처 표기는 §5.7 규칙을 따른다.)
- **글보다 조작과 시각화.** 긴 설명 문단 대신 슬라이더·드래그·클릭·단계 실행 같은
  직접 조작, 그리고 그림·도식·애니메이션으로 보여준다. 설명은 짧게 곁들인다.
- **가독성 우선.** 한 화면에 정보를 쏟지 말고 단계·카드·패널로 나눈다.
- 활동에 쓰는 **수치와 정답은 반드시 검산**한다(필요하면 node 로 계산해 확인).

### 5.4 성찰(reflection)

- 공통 마무리 질문("새롭게 알게 된 점과 느낀 점" 등)은 `withCommonReflection` 이
  블록의 `reflectionType`(simple/deep)에 따라 **자동 부착**한다. **코드에 직접 넣지 않는다.**
- 활동 **고유 질문은 최소 3개**, 그 활동 내용에 관한 것으로 쓴다(일반적 '느낀점' 금지 —
  개념을 자기 말로 정리 / 활동에서 관찰한 규칙·패턴 / 전략의 근거 / 예외·반례 등).
- 질문 문구는 **에이전트가 초안 → 사용자가 확정**한다.
- 구현: 상단 `const REFLECTION_QUESTIONS: ReflectionQuestion[] = [...]`
  (`{ id, prompt, kind: "text"|"select", placeholder?, options? }`, `id` 는 활동 내 유일한
  snake_case = 저장 키), 하단 `<ReflectionForm questions={REFLECTION_QUESTIONS} />`.
- 제출은 `lib/activities/submitReflection.ts` → `activity_responses` 에 **매번 새 행**으로 쌓인다.
- **예외: 영재(gifted) 활동은 성찰 폼을 만들지 않는다.** `ReflectionForm` 호출 자체를 생략한다.

### 5.5 활동개요(activity_overviews)

- 활동이 학생에게 **무엇을 시키고 어떤 개념을 다루는지** 한국어 1~3문장. `~하는 활동.` 으로 끝맺는다.
- 제목·교과·단원은 코드가 단일 출처이므로 개요에 넣지 않는다.
- AI 세특이 성찰이 부실할 때 근거로 삼는다. 관리자 화면 `/admin/overviews` 에서 수정 가능.
- 시드는 교과별 누적 파일에 `$s$`/`$ov$` 달러 인용으로 upsert(재실행 멱등).

### 5.6 UI 관례 (기존 활동과 통일)

기준 예시: `components/activities/common/1-2-remainder-factorize/identity-game/IdentityGame.tsx`.

- 셸: `<section className="rounded-2xl border border-white/10 bg-slate-950 p-6">` … 맨 아래 성찰 폼.
- 헤더: 작은 배지(`미니활동 · <교과>`) → 이모지 + 제목 `h3 text-2xl font-bold` → 1~2줄 설명.
- 팔레트: 다크 slate-950 + 활동별 액센트(cyan/amber/violet/emerald/rose). 강조 `text-<c>-200/300`,
  패널 `border-<c>-400/30~55 bg-<c>-400/[0.06~0.15]`, 카드 `rounded-xl`.
- **인라인 스타일 금지**: 동적 색은 **정적 Tailwind 클래스 맵**으로, SVG 위 동적 요소는
  **SVG 속성**이나 `<foreignObject>` 로 처리한다.
- 수식은 `components/activities/Katex.tsx`, 확인문제는 `Quiz.tsx` 를 쓴다.
- 영재 단원 ③(사진·시선) 측정 활동은 공용
  `components/activities/gifted/3-perspective-art/_shared/MeasureCanvas.tsx` 를 쓴다.

### 5.7 표기 규칙

- **모평균은 `m`** (`μ` 를 쓰지 않는다; 조사도 `μ를→m을`, `μ가→m이`, `μ로→m으로`).
- **표본평균은 `X̄` 유니코드 그대로.** `<Xb />` 컴포넌트나 `fillXBar` 같은 헬퍼를 만들지 않는다.
- `σ`, `σ²`, `z_{α/2}` 등은 그대로 둔다.
- 하단 `📌 {DATA_NOTE}`(출처·기준 시점)는 **외부 데이터·통계·법령·시장 수치를 쓴 활동에만** 넣는다.
  공식·정의만 다루는 순수 수학 활동에는 상수도 만들지 않는다.

### 5.8 다 만든 뒤

빌드 통과 → 사용자에게 **슬러그**와 확인할 화면을 알려준다.
수업 블록 배치(편집기에서 원하는 자리에 activity 블록 삽입)와 개요 시드 SQL의
**라이브 실행은 사용자가** 한다. 성찰 문구·활동개요 초안은 사용자 확정을 받는다.

---

## 6. Supabase · Auth 함정 모음

- **RLS 를 먼저 의심한다.** 앱에서 0행이 오는데 SQL editor 에서는 보이면 거의 항상 정책 문제다.
  앱이 새 테이블을 읽기 시작하면 그 역할이 읽을 수 있는 정책을 함께 만든다.
- **학번을 바꿀 때 `auth.users.email` 만 UPDATE 하면 안 된다.** Supabase 는 이메일을
  `auth.users.email` 과 `auth.identities.identity_data->>'email'` **두 군데**에 두고,
  가입 중복 검사(GoTrue `IsDuplicatedEmail`)는 **identities** 를 본다. 한쪽만 고치면
  "그 학번으로 가입 불가 + 관리 화면엔 아무 계정도 안 보임" 상태가 된다
  (실제 사고와 복구 SQL: `supabase/migrations/20260923_fix_demo_identity_email.sql`).
  `auth.identities.email` 은 generated column 이라 `identity_data` 를 고쳐야 한다.
- 회원 삭제는 `profiles` DELETE(자식 CASCADE) + `auth.admin.deleteUser` **둘 다** 해야 한다
  (`app/api/admin/delete-member`). 한쪽만 지우면 잔재가 남는다.
- 사용자에게 보여주는 **오류 문구에 추측을 덧붙이지 않는다.** 원인별로 갈라 쓰고, 모르면 원문을 보여준다
  — "이미 가입된 학번일 수 있습니다" 한 줄의 추측이 실제로 원인 파악을 크게 늦췄다.

---

## 7. 하지 말 것

- 운영 DB에 임의로 쓰기(마이그레이션 파일로 남기고 사용자에게 넘긴다).
- 요청받은 탭·기능을 합치거나 빼기, 조작·시각화를 설명 글이나 공식·표로 대체하기.
- 수업에서 이미 다룬 예시 재사용, 교과서 페이지 인용.
- 제목에 `"미니:"` 붙이기, 성찰 고유 질문에 '느낀점' 쓰기, 순수 수학 활동에 DATA_NOTE 넣기.
- 인라인 `style={{…}}` 로 동적 색 넣기.
- 여러 기능을 한 번에 구현하고 한꺼번에 보고하기.
- 확인 없이 커밋·푸시하기(= 바로 배포된다).
- 빌드 실패 상태로 완료 보고하기.

---

## 8. 자주 쓰는 명령

```bash
npm run dev                 # 로컬 확인 (사용자가 직접 띄우는 경우가 많다)
npm run build               # 배포 전 필수
npx tsc --noEmit            # 타입만 빠르게
npm run lint
```

---

## 9. 문서 지도 (`docs/`)

| 문서 | 언제 읽나 |
|---|---|
| `mathlab_renewal_development_plan_v1.md` | 전체 목표·단계·DB 초안·AI 세특 설계 |
| `mini_activity_authoring_workflow_v1.md` | 활동 제작 절차 원문(6단계 체크리스트·교과별 관례) |
| `activity_reflection_design_memo.md` | 성찰 유형(simple/deep) 설계 |
| `activity_content_blocks_design_memo.md` | 수업 블록 구조·편집기 |
| `authentication_and_rls_plan_v1.md` | 인증·역할·RLS 설계 |
| `student_login_permission_migration_plan.md` | 학생 로그인 전환·권한 이행 |
| `classroom_ui_navigation_design_memo.md`, `dashboard_redesign_plan_v1.md` | 화면·내비게이션 |
| `legacy_data_migration_plan_v1.md` | 옛 데이터 이관 |
| `performance_and_deployment_memo.md` | 성능·배포 |

---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
