# MathLab 개발 진행 메모: 세션 관리 및 콘텐츠 블록 편집

작성일: 2026-05-22  
관련 프로젝트: MathLab 수학 웹앱 리뉴얼  
관련 레포지토리: `dskim-git/mathlab`  
배포 주소: `https://mathelab.vercel.app/`

---

## 1. 메모 목적

이 문서는 최근 구현한 기능을 개발 문서에 보완 기록하기 위한 진행 메모이다.

최근 작업에서는 다음 기능을 구현하고 웹앱 배포 환경에서 정상 작동을 확인했다.

```text
1. 활동 콘텐츠 블록 구조
2. DB 기반 콘텐츠 블록 로딩
3. 교사용 콘텐츠 블록 JSON 편집 화면
4. 한국 시간 기준 표시
5. 세션별 응답 수 표시
6. 세션 삭제 기능
```

---

## 2. 현재 구현 완료 기능 요약

### 2.1 활동 콘텐츠 블록 구조

기존 Streamlit 앱에서 사용하던 수업 자료 구성을 새 MathLab에서는 콘텐츠 블록 단위로 관리한다.

현재 지원하는 블록 유형:

```text
text_instruction
canva_embed
youtube_embed
google_drive_file
external_embed
interactive_activity
```

현재 학생 활동 화면은 다음 구조를 사용한다.

```text
상단: 수업 블록 목차
아래: 선택한 콘텐츠 블록을 전체 폭으로 표시
```

초기에는 좌측 목차형 UI를 실험했으나, Canva PPT, PDF, 외부 사이트의 가독성이 떨어져 상단 가로 목차형으로 변경했다.

---

### 2.2 DB 기반 콘텐츠 블록 로딩

`activities` 테이블에 `content_blocks` JSONB 컬럼을 추가했다.

현재 학생 활동 화면은 다음 순서로 콘텐츠 블록을 불러온다.

```text
1. activities.content_blocks 값이 있고 배열 길이가 1 이상이면 DB 블록 사용
2. content_blocks가 없거나 비어 있으면 getActivityBlocksForSlug(activitySlug) fallback 사용
```

이 구조 덕분에 활동 자료 URL이나 블록 순서를 수정할 때 매번 코드를 수정하지 않고, DB의 `content_blocks`만 수정해도 학생 화면에 반영할 수 있다.

---

### 2.3 실제 수업 자료 임베딩 테스트

`probability-simulator` 활동에 실제 자료를 넣어 테스트했다.

테스트한 자료:

```text
Canva PPT
YouTube 영상
Google Drive PDF
외부 사이트
확률 시뮬레이터 미니활동
```

확인 결과:

```text
- 로컬 개발 서버에서 정상 표시
- Vercel 배포 웹앱에서 정상 표시
- YouTube는 16:9 비율을 유지하도록 별도 처리
- Canva, PDF, 외부 사이트는 넓은 화면에서 보기 좋도록 전체 폭 임베딩 유지
- 확률 시뮬레이터 실행 및 성찰 제출 정상 작동
```

---

## 3. 교사용 콘텐츠 블록 편집 기능

### 3.1 구현 화면

```text
/teacher/activities
/teacher/activities/[activityId]/blocks
```

### 3.2 기능

`/teacher/activities`에서는 등록된 활동 목록을 확인할 수 있다.

표시 정보:

```text
활동명
slug
과목
활동 유형
콘텐츠 블록 수
생성 시각
블록 편집 링크
```

`/teacher/activities/[activityId]/blocks`에서는 해당 활동의 `content_blocks` JSON을 직접 편집할 수 있다.

지원 기능:

```text
JSON 확인
JSON 수정
JSON 정리
JSON 문법 검증
배열 형태 검증
저장
저장 후 학생 활동 화면 반영
```

### 3.3 현재 방식의 의미

현재 편집기는 친절한 블록별 폼 편집기가 아니라 JSON 직접 편집기이다.

이 방식을 먼저 선택한 이유:

```text
- 빠르게 구현 가능
- Supabase Table Editor를 직접 열지 않아도 됨
- 실제 수업 자료 구성을 앱 안에서 수정 가능
- 이후 블록별 폼 편집기로 발전시키기 쉬움
```

향후 발전 방향:

```text
- 블록 유형 선택 UI
- 블록 추가/삭제 버튼
- 드래그 앤 드롭 순서 변경
- Canva/YouTube/PDF/외부 사이트별 전용 입력 폼
- JSON 직접 편집 모드는 고급 모드로 유지
```

---

## 4. 한국 시간 기준 표시

### 4.1 결정한 원칙

DB에는 Supabase/Postgres의 `timestamptz`를 그대로 사용한다. 즉, 저장은 UTC 기준으로 안전하게 유지한다.

사용자에게 보여줄 때는 항상 한국 시간 기준으로 변환한다.

```text
저장: timestamptz / now()
표시: Asia/Seoul 기준
```

### 4.2 구현 방식

공통 유틸 파일을 만들었다.

```text
lib/dateTime.ts
```

주요 함수:

```text
formatKoreanDateTime
formatKoreanDateTimeWithSeconds
```

적용한 위치:

```text
/teacher 최근 수업 세션 생성 시각
/teacher/activities 활동 생성 시각
/teacher/sessions/[sessionId] 세션 생성 시각
/teacher/sessions/[sessionId] 학생 응답 제출 시각
CSV 다운로드의 제출 시각
```

### 4.3 주의사항

Supabase Table Editor에서 보이는 시간은 UTC처럼 보일 수 있다. 이것은 DB 저장 방식의 문제라기보다 표시 기준의 차이다.

MathLab 웹앱과 CSV 다운로드에서는 한국 시간으로 표시되도록 처리한다.

---

## 5. 세션별 응답 수 표시

### 5.1 구현 위치

```text
/teacher 최근 수업 세션 목록
```

### 5.2 기능

최근 수업 세션 목록에 `응답 수` 열을 추가했다.

표시 예:

```text
0개
3개
40개
```

응답 수가 1개 이상인 경우 눈에 잘 띄도록 강조 표시한다.

### 5.3 목적

세션 삭제 전에 해당 세션에 학생 응답이 있는지 바로 확인할 수 있도록 하기 위함이다.

삭제 판단에 도움이 되는 정보:

```text
응답이 없는 테스트 세션인지
실제 학생 응답이 저장된 세션인지
삭제하면 몇 개의 응답이 함께 지워지는지
```

---

## 6. 세션 삭제 기능

### 6.1 구현 위치

```text
/teacher 최근 수업 세션 목록
```

### 6.2 기능

각 세션 행에 `세션 삭제` 버튼을 추가했다.

삭제 동작:

```text
1. 삭제 버튼 클릭
2. 첫 번째 확인창 표시
3. 두 번째 확인창 표시
4. 해당 세션의 responses 먼저 삭제
5. sessions에서 해당 세션 삭제
6. 교사용 대시보드 새로고침
```

삭제 확인창에는 다음 정보가 포함된다.

```text
세션 제목
입장 코드
저장된 학생 응답 수
응답도 함께 삭제된다는 경고
되돌릴 수 없다는 경고
```

### 6.3 주의사항

현재는 MVP 테스트 단계이므로 RLS 정책을 넓게 열어 두었다.

현재 필요한 정책:

```sql
sessions delete 허용
responses delete 허용
```

운영 단계에서는 반드시 교사 로그인과 권한을 붙인 뒤 다음처럼 제한해야 한다.

```text
교사 본인이 만든 세션만 삭제 가능
학생 응답 삭제는 해당 세션을 소유한 교사만 가능
삭제 로그 또는 복구 정책 검토
```

---

## 7. 현재 MVP 상태 업데이트

현재 MVP는 다음 흐름까지 작동한다.

```text
교사가 수업 세션 생성
→ 입장 코드 발급
→ 학생이 입장 코드로 참여
→ 콘텐츠 블록 기반 수업 화면 확인
→ 확률 시뮬레이터 활동 수행
→ 결과 해석 및 성찰 제출
→ Supabase responses 테이블 저장
→ 교사가 세션별 학생 응답 확인
→ CSV 다운로드
→ 최근 세션 목록에서 응답 수 확인
→ 필요 없는 세션 삭제
```

또한 교사는 다음 흐름도 사용할 수 있다.

```text
활동 콘텐츠 블록 관리 화면 접속
→ 특정 활동 선택
→ content_blocks JSON 편집
→ 저장
→ 학생 활동 화면에 반영
```

---

## 8. 관련 파일

최근 기능과 관련된 주요 파일:

```text
lib/dateTime.ts
lib/activities/activityBlocks.ts
components/activity-renderer/ActivityRenderer.tsx
components/content-blocks/CanvaEmbed.tsx
components/content-blocks/YouTubeEmbed.tsx
components/content-blocks/GoogleDriveEmbed.tsx
components/content-blocks/ExternalEmbed.tsx
components/content-blocks/EmbedFrame.tsx
components/teacher/ActivityBlocksJsonEditor.tsx
components/teacher/ResponseCsvDownloadButton.tsx
components/teacher/SessionCreateForm.tsx
components/teacher/SessionStatusButton.tsx
components/teacher/SessionDeleteButton.tsx
app/teacher/page.tsx
app/teacher/activities/page.tsx
app/teacher/activities/[activityId]/blocks/page.tsx
app/teacher/sessions/[sessionId]/page.tsx
app/student/session/[joinCode]/page.tsx
```

---

## 9. 다음 개발 후보

### 9.1 단기 후보

```text
1. 교사용 활동 블록 편집기를 JSON 편집기에서 폼 편집기로 개선
2. content_blocks 예시 템플릿 제공
3. 세션 목록 필터링: 진행 중 / 종료 / 응답 있음 / 응답 없음
4. 세션 삭제 대신 보관 처리 기능 검토
5. 학생별 활동 기록 모아보기
```

### 9.2 중기 후보

```text
1. 과목 / 대단원 / 중단원 / 소단원 메타데이터 설계
2. 활동별 성찰 유형 관리: 간단 성찰형 / 심화 성찰형
3. 미니활동 추가 이식
4. 교사용 프레젠테이션 모드와 학생용 참여 모드 분리
5. 학생별 응답 검색 및 누적 기록 보기
```

### 9.3 장기 후보

```text
1. 교사 로그인
2. 세션 소유자 기반 권한 관리
3. 학생별 활동 기록 기반 AI 세특 초안 생성
4. AI 초안과 원본 응답 연결
5. 교사 수정본 저장 및 관리
```

---

## 10. 현재 결론

MathLab는 이제 단순한 확률 시뮬레이터 테스트 앱이 아니라, 다음 구조를 갖춘 수업 운영용 MVP로 확장되었다.

```text
수업 세션 생성
학생 입장
콘텐츠 블록 기반 활동 화면
학생 응답 저장
교사용 응답 확인
CSV 다운로드
세션 관리
활동 콘텐츠 블록 편집
```

다음 단계에서는 기능을 더 늘리기보다, 교사용 편집 편의성과 활동 구조의 확장성을 높이는 방향으로 진행하는 것이 좋다.
