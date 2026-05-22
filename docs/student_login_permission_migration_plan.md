# MathLab 개발 방향 재조정: 학생 로그인, 교사 권한, 데이터 이전 계획

작성일: 2026-05-23  
관련 프로젝트: MathLab 수학 웹앱 리뉴얼  
관련 레포지토리: `dskim-git/mathlab`  
배포 주소: `https://mathelab.vercel.app/`

---

## 1. 문서 목적

이 문서는 MathLab 리뉴얼 프로젝트의 개발 방향을 재조정하기 위한 기준 문서이다.

초기 MVP에서는 입장 코드 기반 수업 세션을 중심으로 개발했다. 하지만 기존 Streamlit 앱의 핵심 구조와 최종 목표를 다시 검토한 결과, MathLab의 장기적 중심축은 다음과 같이 정리한다.

```text
MathLab의 핵심은 세션 중심 앱이 아니라,
학생 로그인 기반 수학 활동 기록·성찰 관리 앱이다.
```

세션 기능은 완전히 버릴 기능이 아니라, 특정 수업 시간에 활동을 묶어 운영하기 위한 보조 기능으로 유지한다.

---

## 2. 최종 개발 방향

최종 MathLab은 다음 구조를 목표로 한다.

```text
학생 로그인
→ 과목 선택
→ 대단원 선택
→ 중단원 선택
→ 소단원 선택
→ 활동 수행
→ 활동 결과 및 성찰 저장
→ 학생별 누적 활동 기록 관리
→ 교사 권한에 따른 학급별 성찰 조회
→ 장기적으로 AI 세특 초안 생성
```

즉, 최종 핵심 데이터는 다음 세 가지이다.

```text
1. 누가 했는가: student_id
2. 어떤 활동을 했는가: activity_id
3. 어떤 기록을 남겼는가: activity_response / reflection
```

---

## 3. 기존 Streamlit 앱에서 유지할 핵심 철학

기존 Streamlit 앱은 Google Sheets를 데이터베이스처럼 사용했으며, 다음 구조를 가지고 있었다.

```text
학생 계정
일반인 계정
교사 권한
학년 권한
그룹 권한
그룹 수업 권한
수강생 명단
교사 설정
계정 잠금
성찰 기록
진도표 관리
통계 관리
학생 계정 관리
```

새 MathLab에서는 이를 Supabase 기반으로 재구성한다.

---

## 4. 학생 로그인 구조

기존 앱에서는 학생이 자기 아이디로 로그인했다.

아이디 규칙은 다음 방향을 유지한다.

```text
학생 로그인 ID = 입학/학년도 또는 기준 연도 + 학번
예: 2026 + 20202
```

학생 ID를 보면 학년, 반, 번호를 추출할 수 있어야 한다.

예시:

```text
20202
→ 2학년 2반 2번
```

새 앱에서는 학생 로그인 후, 학생이 제출한 활동 결과와 성찰이 자동으로 해당 학생에게 연결되도록 한다.

학생이 매번 이름과 번호를 입력하는 구조는 최종 구조가 아니다. 현재 MVP의 이름/번호 입력 방식은 임시 구조로 본다.

---

## 5. 교사 로그인 및 권한 구조

교사는 일반인 계정으로 가입한다.

관리자는 일반인 계정 중 특정 사용자에게 교사 권한을 부여한다.

교사 권한은 단순한 `teacher` 역할만으로 끝나지 않고, 다음 범위를 포함해야 한다.

```text
교사가 볼 수 있는 교과목
교사가 담당하는 학년
교사가 담당하는 반
교사가 관리할 수 있는 성찰 기록 범위
교사가 관리할 수 있는 진도표 범위
```

예시:

```text
교사 A
- 과목: 확률과 통계
- 학년: 2학년
- 반: 1반, 2반

교사 B
- 과목: 공통수학
- 학년: 1학년
- 반: 3반, 4반
```

교사 A는 2학년 1반, 2반의 확률과 통계 활동 기록만 볼 수 있어야 한다. 다른 교과목이나 다른 반의 기록은 볼 수 없어야 한다.

---

## 6. 관리자 기능 방향

관리자 계정은 다음 기능을 가져야 한다.

```text
학생 계정 관리
일반인 계정 관리
교사 권한 부여
교사별 과목 권한 설정
교사별 담당 학년/반 설정
수강생 명단 관리
진도표 관리 권한 설정
성찰 기록 조회 범위 설정
계정 잠금 및 승인 관리
```

초기에는 모든 관리자 기능을 한 번에 만들지 않는다. 우선 학생 로그인과 교사 권한의 최소 구조부터 만든다.

---

## 7. 세션 기능의 역할 재정의

초기 MVP에서는 세션이 중심이었다.

```text
교사가 세션 생성
→ 입장 코드 발급
→ 학생이 입장 코드로 참여
→ 응답 저장
→ 교사가 세션별 응답 확인
```

하지만 최종 구조에서는 세션을 보조 개념으로 본다.

```text
activity
= 활동 템플릿
= 확률 시뮬레이터, 통계 포스터, 그래프 탐구 등

student
= 학생 주체
= 로그인 ID로 식별

activity_response
= 학생이 활동을 수행한 결과와 성찰
= 세특 생성의 핵심 원자료

session
= 특정 날짜, 특정 반, 특정 수업 시간에 활동을 열어둔 묶음
= 있으면 편리하지만 필수 중심축은 아님
```

따라서 응답 데이터 구조는 다음을 허용해야 한다.

```text
session_id가 있는 응답
→ 특정 수업 시간에 세션을 통해 제출한 응답

session_id가 없는 응답
→ 학생이 로그인해서 직접 활동한 누적 응답
```

즉, `session_id`는 nullable이어야 한다.

---

## 8. 현재 세션 기능의 의미

현재까지 만든 세션 기능은 버릴 기능이 아니다. 다음 기초 기능을 검증했다는 점에서 의미가 있다.

```text
Supabase 연결
활동 생성 및 조회
학생 응답 저장
교사용 응답 확인
CSV 다운로드
응답 수 표시
세션 상태 변경
세션 삭제
Vercel 배포 흐름
한국 시간 표시
콘텐츠 블록 기반 학생 활동 화면
```

하지만 앞으로는 세션 기능을 계속 고도화하기보다, 학생 로그인 기반 구조를 우선 구현한다.

---

## 9. 권장 Supabase 테이블 구조 초안

향후 Supabase에서는 다음 테이블 구조를 검토한다.

```text
profiles
- id
- login_id
- name
- role: admin / teacher / student / general
- status: pending / approved / rejected
- created_at
- last_login_at

students
- id
- profile_id
- school_year
- student_code
- grade
- class_number
- student_number

teachers
- id
- profile_id
- email
- teacher_group

teacher_subject_permissions
- id
- teacher_id
- subject_id
- grade
- class_number

subjects
- id
- key
- title

curriculum_units
- id
- subject_id
- parent_id
- level: big / middle / small
- title
- order_index

activities
- id
- subject_id
- unit_id
- slug
- title
- activity_type
- reflection_type
- content_blocks

activity_responses
- id
- activity_id
- student_id
- teacher_id nullable
- session_id nullable
- response_data
- reflection_data
- created_at

class_sessions
- id
- activity_id
- teacher_id
- subject_id
- grade
- class_number
- join_code
- status
- created_at
```

---

## 10. 기존 Google Sheets 데이터 이전 가능성

기존 Google Sheets에 저장된 데이터는 Supabase로 이전할 수 있다.

이전 대상은 크게 두 종류이다.

```text
1. 회원 정보
   - 학생 계정
   - 일반인 계정
   - 교사 권한
   - 학년/반/과목 권한
   - 계정 승인 상태

2. 활동 및 성찰 기록
   - 학생 학번
   - 이름
   - 활동명
   - 제출 시각
   - 미니활동별 응답
   - 성찰 답변
```

단, 그대로 복사하는 것이 아니라 새 Supabase 테이블 구조에 맞게 변환해야 한다.

---

## 11. Google Sheets → Supabase 마이그레이션 방향

권장 방식은 Python 스크립트를 이용한 이전이다.

```text
1. Google Sheets 데이터를 CSV로 다운로드하거나 Google Sheets API로 읽기
2. pandas로 데이터 정리
3. 학생 ID, 학년, 반, 번호 파싱
4. 기존 활동명과 새 activities.slug 매핑
5. profiles / students / teachers / permissions 테이블로 변환
6. 기존 성찰 기록을 activity_responses로 변환
7. 샘플 10~20개만 먼저 테스트 이전
8. 화면에서 조회 확인
9. 전체 데이터 이전
```

비밀번호 이전은 별도 검토가 필요하다.

```text
A. 기존 비밀번호를 그대로 이식하지 않고 최초 로그인 시 재설정
B. 임시 비밀번호 발급 후 변경
C. Supabase Auth 사용자로 새로 생성
D. 기존 자체 해시 로그인 방식을 임시 유지
```

장기적으로는 Supabase Auth 또는 이에 준하는 안전한 인증 구조를 사용하는 것이 바람직하다.

---

## 12. 재조정된 개발 우선순위

앞으로의 우선순위는 다음과 같이 조정한다.

```text
1. 학생/교사/관리자/일반인 계정 구조 설계
2. Supabase 테이블 설계: profiles, students, teachers, permissions
3. 학생 로그인 ID 규칙 확정 및 파싱 함수 구현
4. 학생 로그인 화면 만들기
5. 로그인한 학생 정보로 활동 응답과 성찰 저장
6. activity_responses 구조 정비
7. 교사 계정 승인 및 권한 테이블 만들기
8. 교사가 담당 과목·학년·반의 성찰만 볼 수 있게 제한
9. 학생별 활동 기록 모아보기
10. 기존 Google Sheets 데이터 샘플 마이그레이션
11. 과목 → 대단원 → 중단원 → 소단원 탐색 구조 구현
12. 교사용 진도표 관리 및 학생 관리 기능 확장
13. AI 세특 초안 생성 기능으로 확장
```

---

## 13. 단기 작업 계획

새 채팅 또는 다음 개발 단계에서는 다음 순서로 진행한다.

```text
1. 현재 세션 필터 기능 커밋 및 push 정리
2. Supabase에 profiles / students / teachers 관련 SQL 초안 작성
3. 학생 ID 파싱 함수 설계
4. 학생 로그인 화면 1차 구현
5. 기존 responses 저장 구조와 새 activity_responses 구조 비교
6. 학생 로그인 기반 제출 저장으로 전환
```

---

## 14. 현재 결론

MathLab의 최종 방향은 다음과 같다.

```text
학생 로그인 기반 누적 수학 활동 기록 앱
+ 교사 권한 기반 학급별 성찰 관리 앱
+ 콘텐츠 블록 기반 수업 활동 플랫폼
+ 장기적으로 AI 세특 초안 생성 도구
```

세션은 이 구조의 중심이 아니라, 특정 수업 시간에 활동을 묶어 실행하기 위한 보조 기능이다.

따라서 앞으로는 세션 기능의 세부 개선보다 학생 로그인, 교사 권한, 성찰 기록, 기존 데이터 이전 구조를 우선 개발한다.
