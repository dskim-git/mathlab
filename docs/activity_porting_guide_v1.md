# 미니활동 이식 가이드 v1 (Streamlit → 새 앱)

작성일: 2026-05-27
관련: `docs/mathlab_renewal_development_plan_v1.md`, `docs/activity_reflection_design_memo.md`

기존 Streamlit 앱(`dskim-git/math`, 로컬 `C:/git-math/math`)의 미니활동을 새 Next.js 앱으로
이식할 때 따르는 원칙과 기술 패턴을 정리한다.

---

## 1. 이식 원칙 (가장 중요 — 사용자 지시)

> **원본 활동의 지향점·목표, 그리고 한 활동에 들어 있는 여러 탭(화면)을 그대로 유지한다.
> 기능을 임의로 축소하지 않는다.** 그 위에서:
> - 기능적으로 **개선할 부분이 있으면 보완**하고,
> - **이미지·애니메이션을 더 추가**해 보기 좋게 만들고,
> - **UI/UX를 개선**해 가독성을 높인다.

구체:
- 원본이 **여러 탭**으로 구성돼 있으면 **모든 탭과 기능을 그대로** 재현한다(탭 누락 금지).
- 원본의 인터랙션(슬라이더, 직접 배치/입력, 무작위 예시, 전체 목록, 퀴즈 등)을 빠짐없이 옮긴다.
- 복잡한 시각화(세계지도·3D/정육면체·격자 경로·다이아몬드 등)도 **React/SVG로 완전 재작성**한다.
  필요하면 라이브러리를 추가한다(예: 지도는 `d3-geo` + `topojson-client`).
- 단순 HTML 임베드 재사용이 아니라, **새 앱 디자인(다크 slate-950 + cyan/amber 액센트)에 맞는 React**로 만든다.
- 앞단원일수록 원본 완성도가 낮은 편 → **앞단원 활동은 UI·디자인을 특히 더 개선**한다.

⚠️ 과거 실수: 삼색기(세계지도+갤러리 누락)·정육면체(경로 그림을 공식으로 대체)를 단순화했다가
사용자 지적으로 전 기능을 복원함. **"동작이 같아 보여도 탭/기능을 빼면 안 된다."**

---

## 2. 기술 패턴 (이미 구축됨)

- **활동 레지스트리**: `components/activities/registry.ts` — `activitySlug → React 컴포넌트` 맵.
  활동 슬러그는 임포트된 `"<streamlit_folder>/<slug>"` 형식(예: `probability_new/mini/galton_board`).
  미등록 슬러그는 `ActivityRenderer`가 '준비 중'으로 표시.
- **공용 컴포넌트**: `components/activities/ReflectionForm.tsx`(성찰), `components/activities/Quiz.tsx`(확인문제, 클라 채점).
- **성찰 스키마**: `lib/activities/reflection.ts` — `withCommonReflection`(활동 고유질문 + 공통 '느낀점' 질문 자동 부착).
- **애니메이션 유틸**: `lib/activities/anim.ts` — `useCountUp`(카운트업), `sup`(지수 위첨자).
- **인라인 스타일 금지**(IDE 경고): 동적 팔레트 색은 **정적 Tailwind 클래스 맵**(예 `bg-[#hex]`)으로,
  SVG 위 동적 요소는 **SVG 속성**(fill/stroke/x/y) 또는 **`<foreignObject>`**(입력칸 등)로 처리.
- 한 활동 = `components/activities/<activity>/<Component>.tsx` 1개(필요시 폴더에 data/sub 컴포넌트 분리).

## 3. 성찰(reflection) 정책

- 모든 활동에 **공통 마무리 질문 "이번 활동에서 새롭게 알게 된 점과 느낀 점"**이 자동 부착(ReflectionForm).
- 활동 **고유 질문**은 그 활동 내용에 관한 것(일반적 '느낀점' 금지). 분량:
  - 퀴즈·게임·문제풀이: **1개**
  - 개념 탐색·시각화: **1~2개**
  - 시뮬레이션·실험: **2~3개**
- 고유 질문 문구는 **Claude가 제안 → 사용자가 검토·확정**.
- (성찰 **저장**을 Supabase activity_responses에 연결하는 배선은 별도 단계 #3 — 현재 ReflectionForm 제출은 안내만.)

## 4. 작업 방식

- 원본 위치: `C:/git-math/math/activities/<subject>/mini/<slug>.py` (탭/로직/퀴즈 정답을 정독 후 재작성).
- **확률과통계 단원 순서대로** 이식. 대형 다탭(700~1000줄)은 한 턴에 1개씩, 작은 건 묶어서.
- 작은 단계 → `npm run build` 통과 확인 → 브랜치 커밋 → main 머지(`--no-ff`) + push(= Vercel 배포).
- DB 변경이 필요하면 audit-first + 마이그레이션 기록 + 라이브 SQL은 사용자가 직접.

---

## 5. 진행 현황 (요약 — 자세한 건 자동메모리 `mathlab-current-progress`)

- 인프라(curriculum_units 단원계층 + /learn 교과 탐색 + 교과 접근 권한) 완료, 확률과통계·공통수학1 단원 임포트 완료.
- **확률과통계 1-1 (순열과 조합) 활동 전부 완료**:
  - 1-1-1 여러 가지 순열: rep_perm_password / rep_perm_morse / rep_perm_tiles / rep_perm_dice / tricolor_flag_perm / cube_path_perm / word_diamond_perm
  - 1-1-2 중복조합: rep_comb_stars_bars / poly_expand_term_count / function_count_lab
- **다음: 1-2 이항정리** — binomial_coeff_viz, binomial_theorem_apply, galton_board, pascal_triangle_properties, polygon_count_circles, pascal_fractal, morra_game → 1-3(대단원 평가=pdf) → 대단원 [2]확률 → [3]통계.
