"use client";

// 소실점 찾기 — 사진/그림 위에 직선을 그어 1점·2점·3점 투시의 소실점을 찾는 활동.
//
// 원본: c:/git-math/math/activities/gifted/vanishing_point_draw.py
// 자산: public/activities/vanishing-point/{pt1,pt2,pt3,athens,lastsupper,jungdong,parthenon}
//
// 측정·작도 UI 는 단원 ③ 공용 MeasureCanvas 가 담당. 이 컴포넌트는
//   * 카테고리(개념/실습) + 이미지 탭
//   * 활동 안내
//   * 이미지별 힌트·정답
// 만 담당. 소실점은 거리가 아니라 방향이라 도구는 직선·지우개 만 활성화.

import { useState } from "react";
import MeasureCanvas, {
  type MeasureItem,
} from "@/components/activities/gifted/3-perspective-art/_shared/MeasureCanvas";

type CatKey = "concept" | "practice";

type Item = MeasureItem & {
  label: string;
  shortLabel: string;
  hint: string;
  answer: string;
};

const ITEMS: Record<CatKey, Item[]> = {
  concept: [
    {
      key: "p1",
      src: "/activities/vanishing-point/pt1.jpg",
      label: "1점 투시 (평행선 원근법)",
      shortLabel: "1점 투시",
      hint: "소실점이 1개입니다. 깊이 방향의 평행선(도로, 레일, 복도 등)을 연장하면 화면 안의 한 점으로 모입니다. 빨간 직선으로 수렴 방향을 그어보세요.",
      answer:
        "✅ 소실점 1개. 수평선(지평선) 위에 위치하며 모든 깊이 방향 선이 그 한 점으로 수렴합니다. 집중감이 강해 도로·복도·기찻길 장면에서 자주 쓰이며, 1점 투시에서는 시심(V)과 소실점이 일치합니다.",
    },
    {
      key: "p2",
      src: "/activities/vanishing-point/pt2.jpg",
      label: "2점 투시 (사선 원근법)",
      shortLabel: "2점 투시",
      hint: "소실점이 2개입니다. 건물 왼쪽 면의 선들과 오른쪽 면의 선들이 각각 다른 방향으로 수렴합니다. 두 가지 색으로 구분해 그어보세요.",
      answer:
        "✅ 소실점 2개. 수평선의 양쪽에 각 하나씩 위치합니다. 건물 모서리를 측면에서 볼 때 왼쪽 면 → 왼쪽 소실점, 오른쪽 면 → 오른쪽 소실점으로 각각 수렴합니다. 웅장한 건물 표현에 많이 쓰입니다.",
    },
    {
      key: "p3",
      src: "/activities/vanishing-point/pt3.jpg",
      label: "3점 투시 (공간 원근법)",
      shortLabel: "3점 투시",
      hint: "소실점이 3개입니다. 좌·우·위(또는 아래) 세 방향으로 선이 모입니다. 세 가지 색으로 각 방향의 선을 구분해 그어보세요.",
      answer:
        "✅ 소실점 3개. 좌우 소실점 2개 + 수직 방향 소실점 1개(위 또는 아래). 높은 건물을 올려다보거나 내려다볼 때 수직선도 수렴하면서 3번째 소실점이 생깁니다. 초고층 빌딩 표현에 사용됩니다.",
    },
  ],
  practice: [
    {
      key: "athens",
      src: "/activities/vanishing-point/athens.png",
      label: "아테네 학당 (라파엘로, 1509–1511)",
      shortLabel: "아테네 학당",
      hint: "아치형 천장, 바닥 타일, 벽면의 선들을 따라 직선을 그어보세요. 몇 점 투시일까요?",
      answer:
        "✅ 1점 투시. 소실점은 1개로 플라톤·아리스토텔레스가 서 있는 중앙에 위치합니다. 라파엘로가 시선이 두 철학자에게 자연스럽게 집중되도록 의도적으로 설계한 구성입니다.",
    },
    {
      key: "lastsupper",
      src: "/activities/vanishing-point/lastsupper.png",
      label: "최후의 만찬 (레오나르도 다빈치, 1495–1498)",
      shortLabel: "최후의 만찬",
      hint: "천장의 격자 구조, 벽의 수평선, 창문 틀 선들을 연장해 보세요. 어느 점으로 모이나요?",
      answer:
        "✅ 1점 투시. 소실점은 1개로 예수 그리스도의 얼굴 뒤에 정확히 위치합니다. 다빈치가 수학적 원근법을 활용해 모든 시선이 예수에게 집중되도록 구성했습니다.",
    },
    {
      key: "jungdong",
      src: "/activities/vanishing-point/jungdong.png",
      label: "전주 정동성당",
      shortLabel: "전주 정동성당",
      hint: "성당 기둥·지붕의 수평 선(빨강)과 탑의 수직 선(초록)을 각각 다른 색으로 그어보세요.",
      answer:
        "✅ 2~3점 투시. 성당 벽면 수평선 → 좌·우 소실점(2개), 탑의 수직 선들 → 위쪽 소실점(1개) 추가. 카메라 앵글에 따라 2점 또는 3점 투시로 해석할 수 있습니다.",
    },
    {
      key: "parthenon",
      src: "/activities/vanishing-point/parthenon.png",
      label: "파르테논 신전 (그리스 아테네)",
      shortLabel: "파르테논 신전",
      hint: "지붕 처마의 사선, 기둥 상단·하단의 수평선들을 연장해 보세요. 소실점은 몇 개인가요?",
      answer:
        "✅ 2점 투시. 신전 왼쪽 측면 선들 → 왼쪽 소실점, 정면(기둥열) 선들 → 오른쪽 소실점. 소실점 2개가 화면 바깥 멀리 위치해 매우 완만하게 수렴합니다.",
    },
  ],
};

const ALL_ITEMS: MeasureItem[] = [...ITEMS.concept, ...ITEMS.practice].map((it) => ({
  key: it.key,
  src: it.src,
}));

export default function VanishingPointDraw() {
  const [cat, setCat] = useState<CatKey>("concept");
  const [idx, setIdx] = useState(0);
  const [showAns, setShowAns] = useState(false);

  const cur = ITEMS[cat][idx];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100 sm:p-6">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">🎨 소실점 찾기</h2>
        <p className="mt-1 text-sm text-slate-400">
          사진과 그림 위에 직선을 그어 1점·2점·3점 투시의 소실점을 직접 찾아봅니다.
        </p>
      </header>

      <details className="mb-4 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-200">💡 활동 안내</summary>
        <ul className="mt-2 space-y-1 text-slate-400">
          <li>
            <b>개념 학습</b> 탭에서 1점·2점·3점 투시 예시 그림에 직선을 그어 소실점을 확인합니다.
          </li>
          <li>
            <b>소실점 찾기 실습</b> 탭에서 유명 작품·건물 사진에서 소실점을 직접 찾아봅니다.
          </li>
          <li>
            📐 <b>직선</b>: 두 점을 차례로 클릭하면 그 두 점을 지나는 직선이 화면 끝까지
            점선으로 연장됩니다 (소실점이 사진 밖에 있어도 보임). ESC·우클릭 = 첫 점 취소.
          </li>
          <li>
            🧹 <b>지우개</b>: 지우려는 선 위에 마우스를 올리면 강조되며, 클릭하면 삭제됩니다.
          </li>
          <li>
            🔍 사진 가장자리 가까이 클릭하면 그 방향으로 캔버스가 자동 확장됩니다. 줌은
            툴바 또는 Ctrl+휠.
          </li>
          <li>색상·두께를 바꿔가며 방향이 다른 선을 색으로 구분해 그어보세요.</li>
        </ul>
      </details>

      {/* 카테고리 탭 */}
      <div className="mb-2 flex flex-wrap gap-2">
        {(
          [
            { key: "concept", label: "📐 개념 학습 (1·2·3점 투시)" },
            { key: "practice", label: "🔍 소실점 찾기 실습" },
          ] as const
        ).map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setCat(c.key);
              setIdx(0);
              setShowAns(false);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
              cat === c.key
                ? "border-teal-400 bg-teal-700 text-cyan-50"
                : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 이미지 탭 */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ITEMS[cat].map((it, i) => (
          <button
            key={it.key}
            type="button"
            onClick={() => {
              setIdx(i);
              setShowAns(false);
            }}
            className={`rounded-md border px-3 py-1 text-xs font-bold transition ${
              idx === i
                ? "border-blue-500 bg-blue-950 text-blue-200"
                : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
            }`}
          >
            {it.shortLabel}
          </button>
        ))}
      </div>

      {/* 측정 캔버스 — 직선·지우개만 활성 */}
      <MeasureCanvas
        items={ALL_ITEMS}
        selectedKey={cur.key}
        enabledTools={["ray", "erase"]}
        showResultPanel={true}
        extraPanelContent={
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
              💡 힌트
            </div>
            <div className="text-xs leading-relaxed text-slate-400">{cur.hint}</div>
            <button
              type="button"
              onClick={() => setShowAns((v) => !v)}
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-300 transition hover:border-teal-400 hover:text-teal-200"
            >
              💡 {showAns ? "정답 숨기기" : "정답 확인하기"}
            </button>
            {showAns ? (
              <div className="rounded-lg border border-teal-500 bg-emerald-950 px-2.5 py-2 text-xs leading-relaxed text-emerald-200">
                {cur.answer}
              </div>
            ) : null}
          </div>
        }
      />

      {/* 현재 이미지 라벨 — 캔버스 아래 추가 정보 */}
      <div className="mt-3 rounded-lg border-l-4 border-blue-500 bg-slate-900 px-3.5 py-2">
        <div className="text-sm font-bold text-blue-300">{cur.label}</div>
      </div>
    </div>
  );
}
