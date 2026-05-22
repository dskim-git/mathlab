# 활동 콘텐츠 블록 설계 메모

작성일: 2026-05-22  
관련 프로젝트: MathLab 수학 웹앱 리뉴얼  
관련 문서: `docs/mathlab_renewal_development_plan_v1.md`

---

## 1. 메모 목적

기존 Streamlit 기반 수학 수업 웹앱에서 자주 사용하던 수업 구성 요소를 새 Next.js 기반 MathLab에서도 재사용 가능한 형태로 설계하기 위한 메모이다.

기존 수업에서 자주 사용한 구성 요소는 다음과 같다.

```text
1. Canva를 이용한 수업 진행용 PPT
2. 미니활동
3. 동영상, 특히 YouTube 영상
4. 외부 사이트 임베딩
5. Google Drive 파일 임베딩, 특히 PDF 임베딩
```

앞으로 기존 활동을 새 앱으로 이식할 때, 각 활동을 단일 컴포넌트로만 만들지 않고 여러 콘텐츠 블록을 조합하는 방식도 고려한다.

---

## 2. 핵심 설계 방향

새 MathLab의 활동은 크게 두 층으로 나눈다.

```text
활동 Activity
→ 여러 콘텐츠 블록 Content Block의 조합
```

예시:

```text
확률 시뮬레이터 활동
- 안내 텍스트 블록
- Canva PPT 임베딩 블록
- YouTube 설명 영상 블록
- 확률 시뮬레이터 미니활동 블록
- 성찰 입력 블록
```

이 구조를 사용하면 수업 하나를 단순한 앱 기능이 아니라 수업 흐름 전체로 구성할 수 있다.

---

## 3. 콘텐츠 블록 유형

### 3.1 Canva PPT 블록

목적:

```text
수업 진행용 PPT 또는 안내 자료를 앱 화면 안에 보여준다.
```

예상 사용:

```text
- 수업 도입 자료
- 활동 안내 슬라이드
- 교사가 만든 Canva 발표자료
- 학생이 참고할 설명 자료
```

필요한 데이터:

```ts
{
  type: "canva_embed",
  title: "활동 안내 PPT",
  embedUrl: "https://www.canva.com/design/.../view?embed",
  height: 600
}
```

주의:

```text
Canva 공유 설정이 임베딩 가능하도록 열려 있어야 한다.
```

---

### 3.2 미니활동 블록

목적:

```text
학생이 직접 조작하거나 응답을 제출하는 활동 컴포넌트를 표시한다.
```

예상 사용:

```text
- 확률 시뮬레이터
- 계산기
- 통계 시뮬레이터
- 그래프 탐구 활동
- 실험형 수학 활동
```

필요한 데이터:

```ts
{
  type: "interactive_activity",
  activitySlug: "probability-simulator",
  reflectionType: "simple"
}
```

주의:

```text
미니활동 블록은 responses 테이블 저장과 연결될 수 있다.
간단 성찰형 / 심화 성찰형 여부를 활동 메타데이터와 함께 관리한다.
```

---

### 3.3 동영상 블록

목적:

```text
YouTube 등 외부 동영상을 수업 화면 안에 보여준다.
```

예상 사용:

```text
- 개념 설명 영상
- 실험 도입 영상
- 역사적 배경 영상
- 수학적 현상 관찰 영상
```

필요한 데이터:

```ts
{
  type: "youtube_embed",
  title: "이항분포 개념 영상",
  videoUrl: "https://www.youtube.com/watch?v=...",
  embedUrl: "https://www.youtube.com/embed/..."
}
```

주의:

```text
YouTube watch URL을 iframe용 embed URL로 변환하는 유틸 함수가 필요할 수 있다.
```

---

### 3.4 외부 사이트 임베딩 블록

목적:

```text
GeoGebra, Desmos, 외부 시뮬레이터, 학교 자료 사이트 등을 iframe으로 보여준다.
```

예상 사용:

```text
- GeoGebra applet
- Desmos 그래프
- 외부 수학 시뮬레이터
- 수업용 웹페이지
```

필요한 데이터:

```ts
{
  type: "external_embed",
  title: "GeoGebra 탐구 자료",
  url: "https://www.geogebra.org/...",
  height: 600
}
```

주의:

```text
모든 외부 사이트가 iframe 임베딩을 허용하는 것은 아니다.
X-Frame-Options 또는 Content-Security-Policy 때문에 임베딩이 막힐 수 있다.
임베딩이 안 되는 경우 새 창으로 열기 버튼을 제공한다.
```

---

### 3.5 Google Drive 파일 임베딩 블록

목적:

```text
Google Drive에 올린 PDF, 학습지, 참고자료를 앱 안에 보여준다.
```

예상 사용:

```text
- PDF 학습지
- 활동 안내서
- 읽기 자료
- 교사용 또는 학생용 참고 문서
```

필요한 데이터:

```ts
{
  type: "google_drive_file",
  title: "활동 학습지 PDF",
  fileUrl: "https://drive.google.com/file/d/.../view?usp=sharing",
  embedUrl: "https://drive.google.com/file/d/.../preview",
  height: 700
}
```

주의:

```text
Google Drive 파일 공유 권한이 '링크가 있는 사용자 보기 가능'으로 열려 있어야 한다.
PDF는 보통 /preview URL을 iframe에 넣으면 임베딩 가능하다.
```

---

## 4. 활동 데이터 구조 후보

장기적으로 activities 테이블 또는 별도 activity_content_blocks 테이블에 콘텐츠 블록 정보를 저장할 수 있다.

### 4.1 activities 테이블에 JSONB로 저장하는 방식

간단한 구조:

```json
{
  "blocks": [
    {
      "type": "canva_embed",
      "title": "수업 안내 PPT",
      "embedUrl": "https://www.canva.com/design/.../view?embed",
      "height": 600
    },
    {
      "type": "youtube_embed",
      "title": "개념 설명 영상",
      "embedUrl": "https://www.youtube.com/embed/...",
      "height": 420
    },
    {
      "type": "interactive_activity",
      "activitySlug": "probability-simulator",
      "reflectionType": "simple"
    },
    {
      "type": "google_drive_file",
      "title": "활동지 PDF",
      "embedUrl": "https://drive.google.com/file/d/.../preview",
      "height": 700
    }
  ]
}
```

장점:

```text
- 구조가 단순하다.
- MVP 이후 빠르게 확장하기 좋다.
- 활동별 콘텐츠 순서를 배열로 관리하기 쉽다.
```

단점:

```text
- 블록별 검색이나 통계 분석은 어렵다.
```

### 4.2 별도 테이블로 분리하는 방식

후속 단계에서 다음 테이블을 검토할 수 있다.

```sql
create table activity_content_blocks (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  block_type text not null,
  title text,
  content jsonb,
  sort_order integer default 0,
  created_at timestamptz default now()
);
```

장점:

```text
- 블록별 관리가 쉽다.
- 활동 편집기 기능을 만들기 좋다.
- 콘텐츠 순서 변경, 블록 추가/삭제가 자연스럽다.
```

단점:

```text
- 초기 구현이 조금 복잡해진다.
```

---

## 5. 현재 추천 방식

현재 단계에서는 바로 DB 구조를 크게 바꾸기보다, 코드 레벨에서 먼저 콘텐츠 블록 컴포넌트를 만든다.

추천 순서:

```text
1. 공통 EmbedFrame 컴포넌트 만들기
2. YouTubeEmbed 컴포넌트 만들기
3. GoogleDriveEmbed 컴포넌트 만들기
4. ExternalEmbed 컴포넌트 만들기
5. CanvaEmbed 컴포넌트 만들기
6. 활동 slug별 interactive activity router 만들기
7. 이후 DB에 activity content blocks 구조 도입 검토
```

---

## 6. 활동 렌더링 구조 후보

나중에는 다음과 같은 구조를 목표로 한다.

```tsx
<ActivityRenderer
  activity={activity}
  session={session}
  student={student}
/>
```

내부에서는 활동 slug 또는 block type에 따라 적절한 컴포넌트를 표시한다.

```text
block.type = "canva_embed"
→ CanvaEmbed

block.type = "youtube_embed"
→ YouTubeEmbed

block.type = "external_embed"
→ ExternalEmbed

block.type = "google_drive_file"
→ GoogleDriveEmbed

block.type = "interactive_activity"
→ ProbabilitySimulator 또는 다른 미니활동 컴포넌트
```

---

## 7. 현재 결론

기존 Streamlit 앱의 활동 구성 요소는 단순한 미니활동만이 아니라, 수업 진행 자료와 외부 자료 임베딩이 함께 결합된 구조였다.

따라서 새 MathLab도 다음 원칙을 따른다.

```text
활동 = 미니활동 컴포넌트 1개
```

로만 보지 않고,

```text
활동 = 여러 콘텐츠 블록의 조합
```

으로 설계한다.

이렇게 해야 Canva PPT, YouTube, 외부 사이트, Google Drive PDF, 학생 참여형 미니활동을 하나의 수업 흐름 안에서 자연스럽게 배치할 수 있다.
