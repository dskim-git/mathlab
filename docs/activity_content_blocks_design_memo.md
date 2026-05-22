# 활동 콘텐츠 블록 설계 메모

작성일: 2026-05-22  
최근 업데이트: 2026-05-22  
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
- Google Drive PDF 활동지 블록
- 외부 사이트 임베딩 블록
- 확률 시뮬레이터 미니활동 블록
```

이 구조를 사용하면 수업 하나를 단순한 앱 기능이 아니라 수업 흐름 전체로 구성할 수 있다.

---

## 3. 콘텐츠 블록 유형

### 3.1 안내 텍스트 블록

목적:

```text
학생에게 활동 목적, 진행 순서, 주의 사항을 안내한다.
```

필요한 데이터:

```ts
{
  type: "text_instruction",
  title: "활동 안내",
  description: "이 활동의 전체 흐름입니다.",
  content: {
    body: "학생에게 보여줄 안내 문장"
  }
}
```

---

### 3.2 Canva PPT 블록

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
  description: "Canva 수업 자료입니다.",
  content: {
    embedUrl: "https://www.canva.com/design/.../view?embed",
    externalUrl: "https://www.canva.com/design/.../view?embed",
    height: 650
  }
}
```

주의:

```text
Canva 공유 설정이 임베딩 가능하도록 열려 있어야 한다.
```

---

### 3.3 미니활동 블록

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
  title: "확률 시뮬레이터",
  description: "이항분포를 탐구합니다.",
  content: {
    activitySlug: "probability-simulator",
    reflectionType: "simple"
  }
}
```

주의:

```text
미니활동 블록은 responses 테이블 저장과 연결될 수 있다.
간단 성찰형 / 심화 성찰형 여부를 활동 메타데이터와 함께 관리한다.
```

---

### 3.4 동영상 블록

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
  title: "개념 설명 영상",
  description: "관련 개념을 설명하는 영상입니다.",
  content: {
    videoUrl: "https://www.youtube.com/watch?v=...",
    embedUrl: "https://www.youtube.com/embed/...",
    height: 420
  }
}
```

주의:

```text
YouTube는 영상 비율이 중요하므로 16:9 비율을 유지한다.
다른 임베딩처럼 전체 폭 고정 높이로 처리하면 화면이 지나치게 가로로 길어질 수 있다.
```

---

### 3.5 외부 사이트 임베딩 블록

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
  description: "외부 사이트 자료입니다.",
  content: {
    url: "https://www.geogebra.org/...",
    height: 700
  }
}
```

주의:

```text
모든 외부 사이트가 iframe 임베딩을 허용하는 것은 아니다.
X-Frame-Options 또는 Content-Security-Policy 때문에 임베딩이 막힐 수 있다.
임베딩이 안 되는 경우 새 창으로 열기 버튼을 제공한다.
```

---

### 3.6 Google Drive 파일 임베딩 블록

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
  description: "Google Drive PDF 자료입니다.",
  content: {
    fileUrl: "https://drive.google.com/file/d/.../view?usp=sharing",
    embedUrl: "https://drive.google.com/file/d/.../preview",
    height: 720
  }
}
```

주의:

```text
Google Drive 파일 공유 권한이 '링크가 있는 사용자 보기 가능'으로 열려 있어야 한다.
PDF는 보통 /preview URL을 iframe에 넣으면 임베딩 가능하다.
```

---

## 4. 현재 구현 상태

현재는 `activities` 테이블에 `content_blocks` JSONB 컬럼을 추가하여 활동별 콘텐츠 블록을 DB에서 관리하는 1차 구조를 적용했다.

```sql
alter table public.activities
add column if not exists content_blocks jsonb;
```

학생 활동 화면은 다음 순서로 블록을 결정한다.

```text
1. activities.content_blocks 값이 있고 배열 길이가 1 이상이면 DB 블록 사용
2. content_blocks가 비어 있으면 getActivityBlocksForSlug(activitySlug) fallback 사용
```

현재 `probability-simulator` 활동에는 다음 블록을 DB에 저장해 테스트했다.

```text
1. 활동 안내
2. Canva PPT
3. YouTube 영상
4. Google Drive PDF
5. 외부 사이트
6. 확률 시뮬레이터
```

테스트 결과:

```text
- 로컬 개발 서버에서 정상 작동
- Vercel 배포 웹앱에서 정상 작동
- Canva PPT 정상 표시
- YouTube 영상 정상 표시
- Google Drive PDF 정상 표시
- 외부 사이트 정상 표시
- 확률 시뮬레이터 실행 및 성찰 제출 정상 작동
```

---

## 5. 활동 데이터 구조

현재 적용한 방식은 `activities.content_blocks`에 배열 형태의 JSONB를 저장하는 방식이다.

예시:

```json
[
  {
    "id": "probability-intro",
    "type": "text_instruction",
    "title": "활동 안내",
    "description": "이항분포 시뮬레이션 활동의 전체 흐름입니다.",
    "content": {
      "body": "학생에게 보여줄 안내 문장"
    }
  },
  {
    "id": "probability-canva-ppt",
    "type": "canva_embed",
    "title": "수업 진행용 Canva PPT",
    "description": "Canva로 제작한 수업 진행 자료입니다.",
    "content": {
      "embedUrl": "https://www.canva.com/design/.../view?embed",
      "externalUrl": "https://www.canva.com/design/.../view?embed",
      "height": 650
    }
  },
  {
    "id": "probability-simulator",
    "type": "interactive_activity",
    "title": "확률 시뮬레이터",
    "description": "동전, 주사위, 직접 설정한 성공확률로 이항분포를 탐구합니다.",
    "content": {
      "activitySlug": "probability-simulator",
      "reflectionType": "simple"
    }
  }
]
```

장점:

```text
- 구조가 단순하다.
- 활동별 콘텐츠 순서를 배열로 관리하기 쉽다.
- 코드 수정 없이 Supabase에서 수업 자료 URL과 블록 구성을 바꿀 수 있다.
- MVP 이후 빠르게 활동을 늘리기 좋다.
```

단점:

```text
- Supabase Table Editor에서 JSON을 직접 수정해야 하므로 실수 가능성이 있다.
- 블록별 검색이나 통계 분석은 어렵다.
- 교사용 편집 화면이 없으면 실제 운영 편의성이 떨어진다.
```

---

## 6. 별도 테이블 분리 후보

후속 단계에서 다음 테이블을 검토할 수 있다.

```sql
create table activity_content_blocks (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  block_type text not null,
  title text,
  description text,
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
- 특정 유형의 블록만 검색하거나 집계하기 쉽다.
```

단점:

```text
- 초기 구현이 조금 복잡해진다.
- 현재 MVP에서는 JSONB 방식으로도 충분하다.
```

현재 결론:

```text
MVP 및 초기 운영: activities.content_blocks JSONB 방식 사용
활동 편집 기능이 복잡해지면 activity_content_blocks 테이블 분리 검토
```

---

## 7. 활동 렌더링 구조

학생 화면에서는 다음 구조로 렌더링한다.

```tsx
<ActivityRenderer
  blocks={activityBlocks}
  sessionId={sessionData.id}
  studentName={name}
  studentNumber={number}
/>
```

내부에서는 block type에 따라 적절한 컴포넌트를 표시한다.

```text
block.type = "text_instruction"
→ 안내 텍스트 블록

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

## 8. 현재 추천 방식

현재 단계에서는 다음 방향을 유지한다.

```text
1. 활동별 자료 구성은 activities.content_blocks JSONB에 저장한다.
2. 학생 화면은 DB의 content_blocks를 우선 사용한다.
3. DB에 content_blocks가 없으면 코드 fallback을 사용한다.
4. 교사는 당분간 Supabase에서 JSON을 수정할 수 있다.
5. 운영 편의성이 필요해지면 교사용 활동 편집 화면을 만든다.
```

---

## 9. 후속 개발 후보: 교사용 활동 편집 화면

교사가 Supabase Table Editor를 직접 사용하지 않고 웹 화면에서 활동 블록을 편집할 수 있도록 하는 기능을 후속 후보로 둔다.

예상 화면:

```text
/teacher/activities
- 활동 목록 보기

/teacher/activities/[activityId]/blocks
- 특정 활동의 콘텐츠 블록 목록 보기
- 블록 추가
- 블록 수정
- 블록 삭제
- 블록 순서 변경
```

블록 편집 예시:

```text
블록 유형 선택:
- 안내 텍스트
- Canva PPT
- YouTube 영상
- Google Drive PDF
- 외부 사이트
- 미니활동

공통 입력:
- 제목
- 설명
- 높이

유형별 입력:
- Canva: embedUrl, externalUrl
- YouTube: videoUrl 또는 embedUrl
- Google Drive: fileUrl, embedUrl
- External: url
- MiniActivity: activitySlug, reflectionType
```

초기 버전은 JSONB 전체를 한 번에 수정하는 방식으로 구현할 수 있다. 이후 필요하면 블록별 row를 관리하는 별도 테이블 방식으로 전환한다.

---

## 10. 현재 결론

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

현재는 이 구조를 `activities.content_blocks` JSONB로 구현해 1차 테스트를 완료했다. 이렇게 하면 Canva PPT, YouTube, 외부 사이트, Google Drive PDF, 학생 참여형 미니활동을 하나의 수업 흐름 안에서 자연스럽게 배치할 수 있다.
