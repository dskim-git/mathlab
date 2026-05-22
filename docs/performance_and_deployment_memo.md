# 성능 및 배포 환경 메모

작성일: 2026-05-22  
관련 프로젝트: MathLab 수학 웹앱 리뉴얼  
관련 문서: `docs/mathlab_renewal_development_plan_v1.md`

---

## 1. 메모 목적

MathLab은 로컬 개발 환경과 Vercel 배포 환경에서 체감 속도가 다를 수 있다. 특히 교사용 화면은 Supabase 최신 데이터를 매번 확인해야 하므로, 로컬보다 Vercel에서 약간 느리게 느껴질 수 있다.

이 문서는 현재 MVP 단계에서 확인한 성능 특성과 이후 최적화 방향을 기록하기 위한 메모이다.

---

## 2. 현재 체감 차이

로컬 개발 환경에서는 Next.js 서버가 교사 PC에서 바로 실행되므로 화면 반응이 빠르다.

Vercel 배포 환경에서는 다음 흐름을 거친다.

```text
브라우저
→ Vercel 서버
→ Supabase 데이터베이스
→ Vercel 서버
→ 브라우저 화면 표시
```

따라서 교사용 대시보드나 학생 응답 확인 화면은 로컬보다 약간 느리게 느껴질 수 있다.

---

## 3. 현재 일부러 적용한 설정

교사용 화면은 최신 데이터를 보는 것이 중요하므로 다음 설정을 사용한다.

```ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

적용 대상 예시:

```text
app/teacher/page.tsx
app/teacher/sessions/[sessionId]/page.tsx
```

이 설정의 의미는 다음과 같다.

```text
정적 캐시 화면을 보여주지 않고,
요청할 때마다 Supabase에서 최신 데이터를 다시 조회한다.
```

장점:

```text
- 세션 종료 / 다시 열기 결과가 바로 반영된다.
- 응답 삭제 결과가 바로 반영된다.
- 학생 제출 현황을 최신 상태로 볼 수 있다.
```

단점:

```text
- 캐시된 화면보다 로딩이 느릴 수 있다.
- Vercel과 Supabase 사이의 네트워크 왕복 시간이 체감될 수 있다.
```

현재 MVP 단계에서는 속도보다 최신 데이터 반영을 우선한다.

---

## 4. 현재 성능상 괜찮은 부분

확률 시뮬레이터의 계산은 대부분 학생 브라우저에서 실행된다.

```text
학생이 n, repeats, p 설정
→ 브라우저에서 난수 시뮬레이션 계산
→ 그래프 표시
```

따라서 학생 40~50명이 동시에 시뮬레이션을 실행하더라도, 서버가 모든 계산을 담당하는 구조는 아니다.

서버와 DB를 사용하는 주요 순간은 다음과 같다.

```text
1. 학생이 입장 코드로 세션을 조회할 때
2. 학생이 성찰을 제출해 responses에 저장할 때
3. 교사가 응답 목록을 조회할 때
4. 교사가 세션 종료 / 다시 열기 / 응답 삭제를 실행할 때
```

---

## 5. 나중에 느려질 수 있는 부분

응답 수가 많아지면 다음 화면이 느려질 수 있다.

```text
/teacher/sessions/[sessionId]
```

현재는 특정 세션의 모든 응답을 한 번에 조회한다. 수업 테스트 단계에서는 괜찮지만, 한 세션에 응답이 수백 개 이상 쌓이거나 재제출 기록이 많아지면 로딩 시간이 늘어날 수 있다.

---

## 6. 후속 최적화 후보

응답 수가 많아지거나 실제 수업에서 속도가 문제 되면 다음 순서로 개선한다.

```text
1. 교사용 화면에 로딩 UI 추가
2. responses 조회에 페이지네이션 추가
3. 최신 제출만 보기 / 전체 제출 보기 필터 추가
4. responses 테이블에 자주 조회하는 컬럼 기준 index 추가
5. CSV 다운로드는 필요 시 전체 응답을 별도 요청으로 생성
6. 교사용 목록에서 응답 수만 먼저 보여주고 상세 응답은 나중에 로드
7. Supabase 쿼리 최적화
```

---

## 7. 인덱스 후보

나중에 응답 조회가 느려지면 다음 인덱스를 검토한다.

```sql
create index responses_session_id_created_at_idx
on responses (session_id, created_at desc);
```

세션 목록 조회가 느려지면 다음 인덱스를 검토한다.

```sql
create index sessions_created_at_idx
on sessions (created_at desc);

create index sessions_join_code_idx
on sessions (join_code);
```

현재 MVP 초기 단계에서는 반드시 필요하지 않다.

---

## 8. 현재 결론

현재 Vercel 웹앱이 로컬보다 약간 느리게 느껴지는 것은 자연스러운 현상이다.

```text
로컬 환경:
- 내 컴퓨터에서 바로 실행
- 네트워크 왕복이 적음

Vercel 환경:
- Vercel 서버와 Supabase DB를 왕복
- force-dynamic 설정으로 최신 데이터를 매번 조회
```

MVP 단계에서는 최신 데이터 반영과 기능 안정성을 우선한다. 성능 최적화는 실제 수업 테스트 후 병목이 확인되면 진행한다.
