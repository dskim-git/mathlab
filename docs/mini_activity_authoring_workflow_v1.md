# 미니활동 신규 제작 워크플로 v1

작성일: 2026-07-13
적용 대상: **공통수학2**처럼 원본 Streamlit 활동이 없어 **캔바 수업자료 기준으로 새로 만드는** 미니활동.
(원본 Streamlit 활동을 옮기는 "이식"은 `docs/activity_porting_guide_v1.md` 를 따른다. 이 문서는 그 위에
사용자가 2026-07-13 에 확정한 **성찰·활동개요·UI 통일** 규칙을 더한 것이다.)

관련: `docs/activity_porting_guide_v1.md`, 자동메모리 `activity-reflection-policy`, `block-title-policy`,
`activity-folder-structure`, `mathlab-current-progress`.

---

## 0. 사용자 지시 (2026-07-13, 이 문서의 근거)

> 활동을 하나씩 추가할 때마다, 공통수학1·확률과통계 미니활동들처럼:
> 1. 활동을 다 한 뒤 **그 활동과 관련된 성찰 질문을 최소 3개 정도** 만든다.
> 2. **활동개요**(관리자 모드 `/admin/overviews` 에서 보이는 것)도 함께 작성한다.
> 3. 활동의 **전체적인 UI·느낌을 기존 활동들과 비슷하게** 만든다.
> 4. 매번 이 방식을 잊지 않도록 문서로 남긴다(= 이 문서).

새 자리·목표·형태는 사용자가 요청 시 알려준다. Claude 는 아래 체크리스트대로 만들고 작은 단계로 확정받는다.

---

## 1. 매 활동 체크리스트 (빠짐없이)

새 미니활동 1개 = 아래 6곳을 모두 갱신해야 완성이다.

| # | 파일/위치 | 할 일 |
|---|---|---|
| 1 | `components/activities/common2/<중단원>/<활동>/<Component>.tsx` | 활동 React 컴포넌트(+ 하단 `ReflectionForm`) |
| 2 | `components/activities/registry.ts` | `import` + `ACTIVITY_REGISTRY` 에 `slug → 컴포넌트` |
| 3 | `lib/activities/activityTitles.ts` | `SHORT_ACTIVITY_TITLE` 에 `slug → 짧은 한국어 제목` |
| 4 | `lib/activities/activityCatalog.ts` | `ACTIVITY_CATALOG` 해당 교과·단원 그룹에 slug 추가(에디터 드롭다운 노출) |
| 5 | `supabase/migrations/*_activity_overviews_seed_common2.sql` (신규/누적) | `activity_overviews` 에 `slug → 개요` upsert. **라이브 SQL 실행은 사용자가** 직접 |
| 6 | 컴포넌트 내부 `REFLECTION_QUESTIONS` | 활동 고유 성찰 질문 **최소 3개** |

> 2~4 를 한 번이라도 빠뜨리면: 활동이 '준비 중'으로 뜨거나(2), 이력·통계 제목이 슬러그로 뜨거나(3),
> 에디터 드롭다운에 안 보인다(4). 항상 함께 갱신.

빌드 확인 → 작은 단계로 사용자 확정 → 브랜치 커밋 → `main --no-ff` 머지 + push(Vercel 배포).

---

## 2. 슬러그·폴더·제목 규칙

- **슬러그**: `common2/mini/<snake_case_slug>` (공통수학1 이 `common/mini/...` 인 것과 대응. 원본 `common2/lessons/_units.py` 의 `subject:"common2"` 와 일치).
- **폴더**: `components/activities/common2/<중단원>/<활동>/` — 중단원 폴더명은 `1-1-polynomials` 식 kebab(공통수학1 관례 따름). 파일 1개가 기본, 크면 폴더에 data/sub 컴포넌트 분리.
- **컴포넌트/파일명**: PascalCase (예: `PolyAddSubGame.tsx`).
- **짧은 제목**: 제목에 `"미니:"` 붙이지 않는다(타입 배지가 이미 표시 — `block-title-policy`). 짧고 내용이 드러나게.

---

## 3. 성찰 질문 정책 (이 문서에서 갱신됨)

- **활동 고유 질문 최소 3개** (2026-07-13 사용자 지시로 상향. 기존 "게임 1 / 탐색 1~2 / 시뮬 2~3" 하한을 대체).
- 고유 질문은 **그 활동 내용에 관한 것**(일반적 '느낀점' 금지 — 느낀점은 공통 질문이 담당).
  - 개념을 자기 말로 정리 / 활동 중 관찰한 규칙·패턴 / 판별·전략의 근거 / 반례·예외 상황 등.
- 공통 마무리 질문("새롭게 알게 된 점·느낀 점" 등)은 `withCommonReflection` 이 블록의 `reflectionType`(simple/deep)에 따라 **자동 부착** — 코드에서 따로 넣지 않는다.
- 문구는 **Claude 초안 → 사용자 확정**.
- 구현: 컴포넌트 상단에 `const REFLECTION_QUESTIONS: ReflectionQuestion[] = [...]`, 하단에 `<ReflectionForm questions={REFLECTION_QUESTIONS} />`.
  각 질문은 `{ id, prompt, kind: "text"|"select", placeholder?, options? }`. `id` 는 활동 내 유일한 snake_case(성찰 저장 키가 됨).

예시(고유 3개 + 공통 자동):
```tsx
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  { id: "core_idea",   prompt: "…이 활동에서 발견한 핵심 규칙을 자신의 말로 정리해 보세요.", kind: "text",
    placeholder: "예: …" },
  { id: "why_works",   prompt: "…가 왜 그렇게 되는지 근거를 설명해 보세요.",              kind: "text" },
  { id: "edge_case",   prompt: "…이 성립하지 않거나 달라지는 경우가 있다면 적어 보세요.",   kind: "text" },
];
```

---

## 4. 활동개요 (activity_overviews)

- **무엇**: 활동이 학생에게 무엇을 시키고 어떤 개념을 다루는지 한국어 **1~3문장**. 교사·AI 세특이 참고(성찰이 부실할 때 활동 내용 근거로 보완).
- **저장**: `public.activity_overviews(slug PK, overview)`. 관리자만 쓰기(RLS), 인증 사용자 읽기.
  마이그레이션 시드로 기록하고, 관리자 화면 `/admin/overviews` 에서 사후 수정 가능.
- **작성 규칙**: 제목·교과·단원은 코드가 단일 출처라 개요엔 넣지 않는다. "~하는 활동." 으로 끝맺는 서술.
- **DB 변경 절차**: audit-first → 마이그레이션 파일에 upsert 기록 → **라이브 SQL 실행은 사용자가** (기존 패턴).
  공통수학2 는 `20260623_activity_overviews_seed_common2.sql` 같은 누적 시드 파일에 모아 upsert(재실행 멱등).

시드 문법(기존 파일 관례 — `$s$`/`$ov$` 달러 인용으로 따옴표·특수문자 안전):
```sql
insert into public.activity_overviews (slug, overview, updated_at) values
  ($s$common2/mini/<slug>$s$, $ov$…무엇을 시키고 어떤 개념을 다루는지 1~3문장.…$ov$, now())
on conflict (slug) do update set overview = excluded.overview, updated_at = now();
```

---

## 5. UI 관례 (기존 활동과 통일)

기준 예시: `components/activities/common/1-2-remainder-factorize/identity-game/IdentityGame.tsx`.

- **셸**: `<section className="rounded-2xl border border-white/10 bg-slate-950 p-6">` … 맨 아래 `<ReflectionForm …/>`.
- **헤더**: 작은 배지 `미니활동 · 공통수학2`(예: `text-sm font-semibold text-<accent>-300`) → `h3`(이모지 + 제목, `text-2xl font-bold`) → 1~2줄 설명(`leading-7 text-slate-300`).
- **팔레트**: 다크 slate-950 배경 + 교과/활동별 액센트(cyan/amber/violet/emerald/rose 등). 강조 텍스트는 `text-<c>-200/300`, 카드/패널은 `border-<c>-400/30~55 bg-<c>-400/[0.06~0.15]`.
- **인라인 스타일 금지**(IDE 경고): 동적 색은 **정적 Tailwind 클래스 맵**, SVG 위 동적 요소는 **SVG 속성** 또는 `<foreignObject>`.
- **구성요소 재사용**: 진행바/점수/카드/결과표/요약 패널/‘다시하기’ 버튼 등 기존 관례 따라 `rounded-xl`·`border`·`bg-.../[0.08]` 조합. 수식은 `components/activities/Katex.tsx`, 확인문제는 `Quiz.tsx`.
- **탭 여러 개**면 모든 탭·기능 유지(축소 금지 — 이식 가이드 원칙 동일).
- **표기**: 모평균 `m`, 표본평균 `X̄` 등 자동메모리 표기 규칙 준수(공통수학2 엔 대개 무관하나 확인).

---

## 6. 사용자에게 요청받을 때 확인할 것

매 요청에서 사용자가 주는(또는 Claude 가 물어볼) 3가지:
1. **자리** — 어느 대단원/중단원/소단원, 어느 블록 앞뒤(예: 중단원 마무리 문제 앞).
2. **목표·개념** — 캔바 슬라이드 내용은 Claude 가 직접 못 보므로 한두 줄 설명.
3. **형태** — 게임 / 개념 탐색·시각화 / 시뮬레이션 (없으면 Claude 가 제안).

Claude 는: 컴포넌트 + 성찰 3개 초안 + 활동개요 초안을 만들고 → 빌드 통과 → 슬러그를 알려주면 사용자가
에디터에서 **원하는 자리**에 activity 블록으로 삽입. 성찰 문구·개요는 사용자 확정 후 확정.

---

## 7. 다른 신규 교과에도 동일 적용 (경제수학 등)

이 워크플로(6단계)는 **교과 무관하게 동일**하다. 신규 교과를 만들 때 **교과마다 달라지는 건 4가지**뿐이며,
첫 활동에서 관례를 정하고 이후 재사용한다:

| 항목 | 공통수학2 | 경제수학(신규 예시) |
|---|---|---|
| 슬러그 접두사 | `common2/mini/<slug>` | `economics/mini/<slug>` |
| 컴포넌트 폴더 | `components/activities/common2/<중단원>/<활동>/` | `components/activities/economics/<중단원>/<활동>/` |
| catalog 그룹 subject | `"공통수학2"` | `"경제수학"` |
| 개요 시드 파일 | `supabase/migrations/20260713_activity_overviews_seed_common2.sql` | `..._seed_economics.sql`(신규 파일) |

- 신규 교과는 대개 **활동 0개**에서 시작(경제수학도 2026-07-13 기준 0개, 커리큘럼·subject는 존재). 슬러그는
  아직 커리큘럼에 활동 블록이 없으므로 **우리가 정하고**(catalog↔registry↔블록 에디터만 일치하면 됨), 이후 고정.
- 원본 커리큘럼 참고: `C:/git-math/math/activities/<subject>/lessons/_units.py`(경제수학=`economics_math`). 캔바 내용은
  Claude 가 직접 못 보므로 자리·목표는 요청 시 받는다.
- 한 세션에서 여러 교과를 번갈아 만들어도 무방(각 요청이 교과를 명시).

## 8. 진행 현황

- **공통수학2**: 미니활동 4개 완료·배포(2026-07-13, main `e652f9a`) — 두 점 사이의 거리 / 선분의 내분과 황금비 /
  무게중심과 내분 / 블록 밀기와 조화급수. 모두 catalog "1-1 평면좌표·선분의 내분" 그룹. 소단원 블록 배치·개요 라이브 SQL은 사용자 몫.
- **경제수학**: 미니활동 **1개** 제작 — 주가지수 탐험(`economics/mini/stock_index_lab`), catalog "1-1 생활 속 경제지표" 그룹.
  첫 활동으로 4가지 관례 확정(슬러그 `economics/mini/…` · 폴더 `components/activities/economics/…` · subject `"경제수학"` · 시드 `20260718_activity_overviews_seed_economics.sql`).
  실측 데이터(Yahoo Finance) 내장 + **하이브리드 라이브 새로고침** 첫 사례 — 프록시 라우트 `app/api/economics/stock-index`(CORS 우회, 지수 현재가·종목 시가총액). 소단원 블록 배치·개요 라이브 SQL은 사용자 몫.
