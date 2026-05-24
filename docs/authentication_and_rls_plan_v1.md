# MathLab 정식 인증 · RLS 전환 설계 계획 (H)

작성일: 2026-05-24
관련 프로젝트: MathLab 수학 웹앱 리뉴얼
관련 레포지토리: `dskim-git/mathlab`
배포 주소: `https://mathelab.vercel.app/`

> 이 문서는 구현 전 **방향 합의용 설계 메모**다. 실제 구현은 이 문서의 결정을 확정한 뒤 작은 단계(H-1, H-2 …)로 진행한다.

---

## 1. 문서 목적

현재 MathLab의 로그인/권한은 **임시(MVP) 구조**다. 실제 학생 데이터를 운영하기 전에 정식 인증과 DB 차원의 접근 제어(RLS)로 전환해야 한다. 이 문서는 그 전환의 결정 사항과 단계 계획을 정리한다.

---

## 2. 현재 상태 요약 (Phase 0)

- **학생 로그인**: 학번(예: `202620202`)을 입력 → `students`/`profiles` 조회 → 승인된 학생이면 `localStorage(mathlab_student)`에 저장. **비밀번호 없음.**
- **교사 로그인**: 로그인 ID 입력 → `profiles(role=teacher, approved)` + `teachers` 조회 → `localStorage(mathlab_teacher)` 저장. **비밀번호 없음.**
- **접근 제어**: 교사 페이지는 `app/teacher/layout.tsx`에서 localStorage 기준 **클라이언트 게이트**(소프트 게이트). 서버는 요청자가 누구인지 모른다.
- **RLS**: `activity_responses`는 RLS 비활성(Unrestricted). `profiles`/`students`/`teachers`/`teacher_permissions` 등은 RLS 활성이지만 anon SELECT 정책으로 열려 있음. 앱은 anon 키로 접속.

### 현재의 두 가지 보안 구멍

1. **비밀번호 부재**: ID만 알면 누구나 해당 사용자로 로그인 가능.
2. **DB 직접 접근 가능**: anon 키로 PostgREST/Supabase API에 직접 접근하면 앱을 우회해 데이터를 읽거나 변경할 수 있음(RLS가 사실상 열려 있으므로).

---

## 3. 목표 (전환 후 상태)

```text
- 학생/교사/관리자는 비밀번호(또는 안전한 인증)로 로그인한다.
- DB가 "지금 요청자가 누구인지"를 안다 (JWT 기반).
- RLS로 서버(DB) 차원에서 접근을 강제한다:
  - 학생: 본인 기록만 읽기/쓰기
  - 교사: 담당(권한 범위) 학급의 기록만 읽기
  - 관리자: 전체 관리
- 앱을 우회한 anon 직접 접근으로는 의미 있는 데이터를 얻을 수 없다.
```

---

## 4. 핵심 결정 1 — 인증 메커니즘

### 옵션 비교

| 옵션 | 설명 | RLS 강제 | 난이도 | 비고 |
|---|---|---|---|---|
| **A. Supabase Auth** | 이메일+비밀번호(또는 매직링크)로 Supabase Auth 사용. JWT 발급 → RLS에서 `auth.uid()` 사용 가능 | ✅ 가능 | 높음 | 표준·정석. 학생 이메일 문제 해결 필요 |
| B. 자체 비밀번호 | `profiles`에 비밀번호 해시 저장, 앱에서 검증 + 자체 세션 | ❌ DB는 신원 모름 | 중 | RLS 강제 어려움. 앱 우회 막지 못함 |
| C. ID 조회 유지 | 현행 유지 | ❌ | 낮음 | 보안 미흡, 운영 부적합 |

### 권장: **A. Supabase Auth**

DB 차원 RLS 강제가 목표이므로 JWT를 발급하는 Supabase Auth가 정석이다. B/C는 RLS를 제대로 걸 수 없어 "앱 우회 직접 접근"을 막지 못한다.

> 기존 Streamlit 앱은 비밀번호 해시를 자체 저장하는 방식(옵션 B 계열)이었다. 새 구조에서는 **Supabase Auth가 비밀번호 해시를 안전하게 관리**하므로 직접 해시 저장이 불필요하다. 학생 이메일 미수집 원칙은 합성 이메일(5장)로 그대로 지킬 수 있다(합성 이메일 = 시스템 내부 식별자, 학생에게 수집한 개인정보가 아님). 기존 회원 구조의 구체 반영은 **13장** 참고.

---

## 5. 핵심 결정 2 — 학생은 이메일이 없다

Supabase Auth는 기본이 이메일 기반인데, 학생은 학번(`202620202`)으로 로그인한다.

### 옵션

- **A. 합성 이메일** (권장): 학번을 이메일로 매핑. 예) `202620202@students.mathlab.local`
  - 학생은 화면에서 학번만 입력 → 앱이 내부적으로 합성 이메일 + 비밀번호로 Auth 처리.
  - 도메인은 실제로 메일을 받지 않는 placeholder(이메일 확인 비활성화 설정 필요).
- B. 매직링크/OTP: 학생 이메일이 없으므로 부적합.
- C. 학생만 자체 인증 + 교사/관리자만 Supabase Auth: 혼합 구조라 RLS 설계가 복잡해짐. 비권장.

### 권장: **A. 합성 이메일** (이메일 확인 off)

> 결정 필요: 합성 이메일 도메인(예: `students.mathlab.local`), 학생 비밀번호 초기 정책(아래 7장).

#### 5.1 확정 (2026-05-24): 교사도 아이디 기반 합성 이메일

- **교사도 실제 이메일을 쓰지 않는다.** 교사는 가입 시 **본인이 정한 아이디(login_id)** + 비밀번호를 입력하고, 그 아이디로 로그인한다. (4장의 "교사는 이메일 보유" 가정을 이 결정이 대체한다.)
- 즉 **모든 역할(교사·학생·관리자)이 "아이디 + 비밀번호"로 로그인**하고, 앱이 내부적으로 `아이디 → 합성 이메일`로 매핑해 Supabase Auth를 사용한다.
- **합성 이메일 도메인은 단일 도메인**으로 둔다: `{login_id}@<도메인>`. 현재 기본값 **`mathlab.app`**.
  - 이유: 로그인 화면에서는 사용자가 **아이디만** 입력하므로, 매핑 함수가 역할을 몰라도 이메일을 만들 수 있어야 한다. 도메인을 역할별로 나누면 로그인 시 역할을 먼저 알아야 해서 깨진다.
  - `profiles.login_id`가 전역 unique이므로 합성 이메일도 충돌하지 않는다(학생 학번 vs 교사 아이디 포함).
  - 도메인 값은 앱 환경변수(`NEXT_PUBLIC_SYNTH_EMAIL_DOMAIN`)로 두어 교체를 쉽게 한다. 매핑 함수는 가입/로그인이 **동일 함수**를 공유한다.
  - ⚠️ **주의(실측 2026-05-24)**: Supabase Auth는 `.local`·`.test`·`.example` 같은 **예약 TLD를 invalid 이메일로 거부**한다(`Email address "...@mathlab.local" is invalid`). 실제 메일을 보내지 않더라도 형식상 유효한 일반 TLD(`.app` 등)를 써야 한다. → 그래서 초안의 `students.mathlab.local` 예시 대신 `mathlab.app`을 채택.
- 교사 아이디 형식은 레거시 일반인 규칙을 계승: `^[a-zA-Z0-9_]{4,20}$` (합성 이메일이 유효 형식이 되도록).

---

## 6. auth.users ↔ profiles 연결

현재 `profiles.id`는 `gen_random_uuid()` 기본값이며 Auth와 무관하다. 전환 시 연결이 필요하다.

### 옵션

- **A. `profiles.id = auth.users.id` 일치** (권장): 신규 가입 시 Auth 사용자 id를 그대로 profiles.id로 사용. RLS에서 `auth.uid() = profiles.id`로 간단히 매칭.
- B. `profiles.auth_user_id` 컬럼 추가: 기존 profiles.id는 유지하고 매핑 컬럼만 추가. 기존 데이터 보존에 유리하나 정책이 한 단계 더 복잡.

> 기존 `students.profile_id`, `teachers.profile_id`, `activity_responses.student_id` 등 외래키가 이미 profiles/students를 참조하므로, **A를 택할 경우 기존 행의 profiles.id를 Auth uid로 맞추는 마이그레이션**이 필요하다. 데이터가 적은 현 시점이 전환 적기.

---

## 7. 기존 계정 비밀번호 처리

기존 profiles에는 비밀번호가 없다. 전환 시:

- A. 관리자가 임시 비밀번호 발급 → 최초 로그인 시 변경
- B. 최초 로그인 시 학생이 직접 비밀번호 설정(학번 + 추가 확인 정보로 본인 확인)
- C. 일괄 기본 비밀번호 후 강제 변경

> 결정 필요. 학교 현장 운영 편의를 고려해 선택(보통 A 또는 C가 현실적).

---

## 8. RLS 정책 설계 초안

전제: Auth 도입 후 `auth.uid()`로 현재 사용자의 profiles.id를 알 수 있다(6장 옵션 A 기준). 역할은 `profiles.role`.

| 테이블 | 학생 | 교사 | 관리자 |
|---|---|---|---|
| `profiles` | 본인 행 SELECT | 본인 행 SELECT | 전체 |
| `students` | 본인 행 SELECT | 담당 범위 학생 SELECT | 전체 |
| `teachers` | ✕ | 본인 행 SELECT | 전체 |
| `teacher_permissions` | ✕ | 본인 권한 SELECT | 전체 |
| `activities` | SELECT(공개) | SELECT | 전체 |
| `sessions` | 활성 세션 SELECT(입장용) | 본인 세션 관리 | 전체 |
| `activity_responses` | 본인(student_id) SELECT/INSERT | 담당 범위 SELECT | 전체 |
| `responses`(레거시) | ✕(신규 차단) | ✕ | 전체(보존/정리용) |

### 핵심 정책 예시 (의사 SQL)

```sql
-- 학생: 본인 활동 기록만 읽기
create policy "student reads own activity_responses"
on activity_responses for select
using (
  exists (
    select 1 from students s
    where s.id = activity_responses.student_id
      and s.profile_id = auth.uid()
  )
);

-- 학생: 본인 활동 기록만 쓰기 (student_id가 본인일 때만)
create policy "student inserts own activity_responses"
on activity_responses for insert
with check (
  exists (
    select 1 from students s
    where s.id = activity_responses.student_id
      and s.profile_id = auth.uid()
  )
);

-- 교사: 담당(과목·학년·반) 범위만 읽기
create policy "teacher reads scoped activity_responses"
on activity_responses for select
using (
  exists (
    select 1
    from teachers t
    join teacher_permissions tp on tp.teacher_id = t.id
    where t.profile_id = auth.uid()
      and tp.grade = activity_responses.grade
      and tp.class_number = activity_responses.class_number
      and (tp.subject is not distinct from activity_responses.subject
           or activity_responses.subject is null)
  )
);
```

> 과목 매칭 규칙(엄격/느슨), 관리자 판별 방식(`profiles.role = 'admin'`을 RLS에서 어떻게 안전하게 참조할지) 등은 구현 시 세부 확정.

---

## 9. 단계별 전환 계획 (앱을 깨지 않도록)

```text
Phase 0 (현재): localStorage 소프트 인증 + RLS 개방
Phase 1: Supabase Auth 도입 — 교사부터 (이메일 보유)
   - Auth 사용자 ↔ profiles 연결, 교사 로그인을 Auth 기반으로 교체
   - 단, RLS는 아직 개방 유지 (화면 안 깨지게)
Phase 2: 학생 Auth — 합성 이메일 방식 도입, 학생 로그인 교체
Phase 3: RLS를 테이블 단위로 점진 강화 + 각 단계 동작 검증
   - activity_responses → students → profiles → teacher_permissions 순 권장
Phase 4: localStorage 소프트 게이트 의존 제거, 서버 세션 기반으로 정리
Phase 5: 레거시 responses 정리/아카이브, 최종 점검
```

각 Phase는 다시 작은 단위(H-1, H-2 …)로 쪼개 구현·검증·커밋한다.

---

## 10. 확정이 필요한 결정 목록

1. 인증 메커니즘: **Supabase Auth (권장)** 확정?
2. 학생 인증: **합성 이메일 방식** 확정? 도메인은? (예: `students.mathlab.local`)
3. profiles ↔ auth.users 연결: **profiles.id = auth.uid()** 확정? 기존 데이터 마이그레이션 동의?
4. 기존 계정 비밀번호 초기화 정책: A/B/C 중 선택
5. 과목 단위 권한 매칭: 엄격(과목 일치 필수) vs 느슨(학년·반만)
6. 관리자 계정: 누가/어떻게 admin이 되는가 (최초 admin 부트스트랩 방법)
7. 승인제(명렬표 + 관리자 승인) **유지 여부** — 권장: 유지 (13.4)
8. 명렬표(`student_roster`) 데이터 적재 방법 (관리자 CSV 업로드 등)
9. 일반인 **그룹 권한 모델**(groups/group_permissions) 도입 여부 (13.5)
10. 가입 시 관리자 알림 방식: 이메일 vs 대시보드 "승인 대기" 목록
11. 비밀번호: **Supabase Auth에 위임**(직접 해시 저장 안 함) 확정?

---

## 11. 위험 및 주의

- **데이터 마이그레이션**: profiles.id를 Auth uid로 맞추면 students/teachers/activity_responses의 외래키 정합성을 함께 옮겨야 한다. 데이터가 적은 지금이 적기.
- **점진 적용 필수**: RLS를 한 번에 강하게 걸면 현재 동작하는 화면이 즉시 깨진다. 반드시 테이블 단위로 정책 추가 → 검증 → 다음 테이블 순으로.
- **anon 정책 회수**: RLS 강화 단계에서, 그동안 열어둔 `dev anon select` 정책들과 `activity_responses`의 RLS off 상태를 회수/교체해야 한다.
- **배포 환경 동시 고려**: Vercel 배포본도 같은 Supabase를 보므로, 인증/RLS 변경은 배포 영향까지 함께 검토.

---

## 12. 다음 단계

1. 위 10장 결정 목록을 확정한다.
2. 확정 후 Phase 1(교사 Supabase Auth)부터 H-1로 착수한다.
3. 각 단계는 작은 단위 구현 → 로컬 검증 → (기능 묶음 단위) 커밋으로 진행한다.

---

## 13. 기존 Streamlit 회원·로그인 구조 반영

기존 Streamlit 앱(`dskim-git/math`)의 회원/로그인 구조를 정리하고, 새 MathLab(Supabase Auth + RLS)으로 어떻게 옮길지 설계한다.

### 13.1 기존 구조 요약 (원본 코드 `dskim-git/math` 확인 결과)

저장소는 **Google Sheets**(gspread, 서비스계정, 300초 캐시). 핵심 모듈은 `auth_utils.py`, `pages/97_회원관리.py`.

핵심 시트/컬럼:

| 시트 | 컬럼 |
|---|---|
| 학생 | 학번, 이름, 아이디, 해시비밀번호, 학년, 승인상태, 가입일, 마지막로그인 |
| 일반인 | 이름, 아이디, 사용목적, 해시비밀번호, 그룹, 승인상태, 가입일, 마지막로그인 |
| 수강생명단(명렬표) | 학번, 이름, 반/학급 (+ 과목·반 메타) |
| 학년권한 | 학년 → 허용과목 |
| 그룹권한 | 그룹명 → 허용과목 |
| 그룹수업권한 | 그룹명, 교과 → 허용수업(영재 단원 등 세부) |
| 계정잠금 | 아이디, 실패횟수, 최근실패시각, 잠금상태 |

**인증/비밀번호**
- bcrypt 해시(`hash_password`/`verify_password`). 비번 정책: **8자 이상 + 숫자 1개 이상**(`check_password_policy`).
- **계정 잠금**: 로그인 5회 실패 시 잠금(`계정잠금` 시트), 관리자 `reset_lockout`로 해제.

**학생 회원가입(`register_student`)**
- 입력: 학번, 이름, 비밀번호(+확인), 학년
- 아이디 자동 생성: `f"{년도}{학번}"` (예: 2026 + 학번)
- **명렬표(수강생명단) 검증**(`verify_roster_student`): 학번+이름 일치 확인. 명렬표 형식 2종(세로/가로) 지원. 반 컬럼 없으면 학번에서 학년·반 도출(`_class_from_num`: 첫자리=학년, 2~3자리=반).
- **이메일 미수집** (미성년자 개인정보 최소 수집)

**일반인 회원가입(`register_general`)**
- 입력: 이름, 아이디(`^[a-zA-Z0-9_]{4,20}$`), 비밀번호(+확인), 사용목적
- 명렬표 검증 없음

**승인/상태**
- 상태: 대기 → 승인 / 거부 (`승인상태`). 미승인 시 로그인 불가(`authenticate`가 pending 반환).
- 관리자 `update_user_status`로 전환. 비번: 본인 변경(`change_own_password`) / 관리자 재설정(`reset_user_password`).

**권한(일반인/교사)**
- 학년권한: 학년별 허용 과목(학생용)
- 그룹권한: 그룹별 허용 과목
- 그룹수업권한: 그룹+교과별 허용 단원(세부)
- ⭐ **교사 = 별도 역할이 아니라 특정 그룹(`MATH_TEACHER_GROUP` = "휘문고 수학과")에 속한 일반인.** 교사 설정(`과목설정`)에 과목별 담당 `{grades:[], classes:[], sheet_id}` 지정 → 담당 학급/과목 관리·승인 권한(`get_teacher_managed_classes`, `is_math_teacher`).

### 13.2 새 구조로의 반영(매핑)

| 기존(Streamlit) | 새 구조(Supabase) |
|---|---|
| 비번 해시 자체 저장 | **Supabase Auth가 해시 관리** (직접 저장 안 함) |
| 학생 이메일 미수집 | **합성 이메일**(시스템 내부 식별자)로 Auth 처리, 학생은 학번+비번만 입력 |
| 아이디 = 2026+학번 | 동일 유지 (`parseStudentLoginId`가 이미 처리) → 합성 이메일로 매핑 |
| 명렬표 인증 | **`student_roster` 테이블** 신설, 가입 시 이름+학번 매칭 |
| 관리자 승인제 | `profiles.status`(pending/approved/rejected/locked) 활용, 승인 전 로그인 차단(앱+RLS) |
| 가입 시 관리자 이메일 알림 | DB 트리거+Edge Function 이메일 또는 관리자 대시보드 "승인 대기" 목록 |
| 비번 본인변경/관리자 재설정 | Auth `updateUser`(본인) + Admin API/관리자 화면(재설정) |
| 일반인 그룹 권한 | **`groups` / `group_members` / `group_permissions`** 신설 |

### 13.3 역할 모델 정리

**원본 확인 결과 핵심**: 기존 앱에는 별도 "교사" 역할이 없었다. **교사 = 특정 그룹(휘문고 수학과)에 속한 일반인**이고, 담당 범위는 `과목설정`(`{과목: {grades, classes}}`)으로 지정됐다. 즉 원본은 사실상 **(나) 그룹/권한 기반** 모델이다.

- 새 앱은 이미 `profiles.role ∈ {admin, teacher, student, general}` + `teacher_permissions(teacher_id, subject, grade, class_number)`를 도입했고, 이는 원본의 `과목설정`을 **정규화한 형태**에 해당한다.
- 정합 방향(택1, 결정 필요):
  - **(가) 새 앱 유지**: 권한 받은 일반인을 `teacher` 역할로 승격 + `teacher_permissions`로 범위 지정. 더 명시적·단순. (권장 시작점)
  - (나) 원본 충실: `general` + `groups/group_permissions`로 그룹 단위 운영. 다수 일반인을 그룹으로 일괄 관리하기 유리.
- **권장**: (가)로 시작(이미 구현됨). 그룹 단위 일괄 운영이 실제로 필요해지면 (나)의 `groups`를 추가 도입. 학생의 학년별 과목 접근(원본 `학년권한`)은 별도 규칙으로 둔다.

### 13.4 승인제 유지 여부 (질문에 대한 답)

**권장: 유지.**
- 미성년 학생 보호 + "우리 학교 학생 / 아는 교사·일반인만" 통제라는 목적에 부합한다.
- 명렬표 매칭 + 관리자 승인은 강한 보안 자세이며, 공개 가입형보다 안전하다.
- 운영 부담(수동 승인)을 줄이는 절충안:
  - 명렬표와 정확히 일치하는 학생은 **자동 승인** 옵션 제공(관리자 설정).
  - 일반인/교사는 사람이 적으므로 수동 승인 유지.
- 알림은 이메일 의존을 줄이고 **관리자 대시보드의 "승인 대기" 목록**을 기본으로, 이메일은 보조로 두는 것을 권장(이메일 발송 인프라 의존도↓).

### 13.5 신설/변경 테이블 초안 (원본 시트 → Supabase 매핑)

```text
student_roster              -- 원본 "수강생명단"
- id, school_year, grade, class_number, student_number, student_code, name
- (unique: school_year + student_code)
- 반 없으면 student_code에서 학년·반 도출(_class_from_num과 동일 규칙)

profiles                    -- 원본 "학생" + "일반인" 통합
- 비밀번호 컬럼 없음 (Supabase Auth가 해시 관리)
- status: pending/approved/rejected/locked (원본 승인상태 + 잠금상태 통합)
- 일반인: purpose(사용목적) 컬럼 추가 검토

teacher_permissions (기존)   -- 원본 교사 "과목설정"
- (teacher_id, subject, grade, class_number)

grade_subject_permissions   -- 원본 "학년권한" (학생 학년별 과목 접근, 관리자 설정)
- (school_year, grade, subject) → 허용  / 관리자 화면에서 편집

groups / group_members / group_permissions   -- 원본 "그룹권한"/"그룹수업권한"
- 13.3에서 (나) 채택 시 도입 (그룹 → 허용과목/허용단원)

[로그인 보안] 계정 잠금          -- 원본 "계정잠금"
- Supabase Auth 기본 rate-limit 활용, 또는 별도 fail_count 테이블(실패횟수/잠금상태)
```

> 비밀번호 정책(8자+숫자)·계정 잠금(5회 실패)은 원본 정책을 그대로 계승한다. 비번 해시는 Supabase Auth에 위임하므로 `해시비밀번호` 컬럼은 두지 않는다.

### 13.6 회원가입 화면 설계

- **학생 가입 폼**: 학번 / 이름 / 비밀번호 / 비밀번호 확인
  - 제출 시: 명렬표 매칭 검증 → 합성 이메일 생성 → Auth 가입(status=pending) → (자동/수동) 승인
- **일반인 가입 폼**: 이름 / 아이디 / 비밀번호 / 비밀번호 확인 / 사용목적
  - 제출 시: Auth 가입(status=pending) → 관리자 승인 → (필요 시) 교사 승격/그룹 배정
- **공통**: 승인 전 로그인 차단, 비밀번호 본인 변경 화면, 관리자 재설정 기능

### 13.7 구현 순서 반영 (Phase 보강)

```text
Phase 1 (교사/관리자 Auth):
  - 관리자 부트스트랩, 교사 Supabase Auth 로그인, profiles 연결
  - 관리자 "승인 대기" 대시보드(가입 승인/거부)
Phase 2 (학생 Auth + 명렬표):
  - student_roster 적재(관리자 업로드)
  - 학생 회원가입(명렬표 매칭) + 합성 이메일 Auth + (자동/수동)승인
  - 학생 로그인을 Auth 기반으로 교체
Phase 2.5 (일반인/그룹):
  - 일반인 가입(사용목적) + 그룹/권한(선택: 13.3 결정에 따라)
Phase 3 이후: RLS 점진 강화 (9장과 동일)
공통: 비밀번호 본인변경/관리자 재설정 화면
```

> 참고: 위 13.1은 원본 레포(`dskim-git/math`)의 `auth_utils.py`/`pages/97_회원관리.py`를 직접 확인해 작성했다.

### 13.8 확정 역할 모델 (2026-05-24 확인)

최종 합의된 역할/접근 모델:

| 역할 | 접근 범위 | 메커니즘 |
|---|---|---|
| **교사** | 담당 교과목 + 담당 학급의 활동·기록 | `teacher_permissions(subject, grade, class_number)` — 관리자 설정 |
| **학생** | 배정 교과목 활동 열람·성찰 제출 + **본인 기록만** 조회 | (1) 학년 단위 교과목 허용(관리자 설정) + (2) RLS: `activity_responses.student_id = 본인` |
| **일반인** | 그룹별 허용 교과목/활동 (추후) | `groups`/`group_permissions` (나중 도입) |
| **관리자** | 전체 회원·승인·권한·명렬표 관리 | `role = admin` |

**학생 교과목 접근 = 학년 단위 + 관리자 설정 (확정)**
- 원본 `학년권한`(학년 → 허용과목)을 계승하되, **관리자가 각 학년에서 접근 가능한 교과목을 설정·수정**할 수 있게 한다.
- 테이블: `grade_subject_permissions(school_year, grade, subject)` — 관리자 화면에서 편집.
- 선택과목별 학생 개인 차이는 추후 **학생 개인 단위(B)** 로 확장 가능.

→ 이로써 H 설계의 역할/접근 모델 확정. 다음은 **Phase 1**부터 구현 착수.
