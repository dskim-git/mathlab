"use client";

// 거리점과 화가까지의 실제 거리.
//
// 세 작품(파르테논 / 베르메르 회화의 알레고리 / 산타 마리아 노벨라)에서
// 소실점·거리점을 찾고, 선분(자) 도구로 거리를 재어 실제 거리를 유추.
//
// 원본: c:/git-math/math/activities/gifted/measuring_point_distance.py
// 자산: public/activities/measuring-distance/{parthenon,vermeer,stmaria}
//
// 측정 UI 는 공용 MeasureCanvas (선분·직선·지우개). 작품별 단계 안내 + 계산기는
// 이 컴포넌트가 담당. 작품 전환 시 MeasureCanvas selectedKey 가 바뀌므로 측정
// 상태는 작품별 자동 분리.

import { useState, type ReactNode } from "react";
import MeasureCanvas, {
  type MeasureItem,
} from "@/components/activities/gifted/3-perspective-art/_shared/MeasureCanvas";

type CalcInput = {
  id: string;
  label: string;
  defaultValue?: number;
  placeholder?: string;
};

type Artwork = {
  key: string;
  shortLabel: string;
  src: string;
  title: string;
  steps: ReactNode[];
  calc: {
    title: string;
    inputs: CalcInput[];
    compute: (vals: Record<string, number>) => { ok: true; node: ReactNode } | { ok: false; msg: string };
  };
};

const ARTWORKS: Artwork[] = [
  // ─── 파르테논 ─────────────────────────────────────────────
  {
    key: "parthenon",
    shortLabel: "파르테논 신전",
    src: "/activities/measuring-distance/parthenon.png",
    title: "파르테논 신전 (그리스 아테네)",
    steps: [
      <>
        <b>📐 직선 도구</b>로 파르테논 신전의 처마선·기둥 상단 수평선 등을 연장해{" "}
        <b>좌측·우측 소실점</b>을 찾으세요. 빨간 선은 왼쪽 방향, 노란 선은 오른쪽 방향으로
        구분해 그으면 좋습니다.
        <br />
        <em className="text-slate-500">
          소실점은 사진 밖 좌우 여백에 위치합니다 — 가장자리 가까이 클릭하면 캔버스가
          자동으로 확장됩니다.
        </em>
      </>,
      <>
        <b>📏 선분 도구</b>로 <b>좌측 소실점 ↔ 우측 소실점</b> 사이 거리를 재세요. 두 점을
        클릭하면 선분 위에 길이(px)가 표시되고 결과 패널에도 누적됩니다.
      </>,
      <>
        선분 도구로 <b>기둥의 높이</b>(기둥 상단 → 하단)도 재세요. 파르테논 신전 기둥의
        실제 높이는 약 <b>11 m</b>입니다.
      </>,
      <>
        아래 <b>계산기</b>에 측정값을 입력하면 사진작가 ↔ 신전 사이의 실제 거리가
        계산됩니다.
        <br />
        <em className="text-slate-500">
          원리: 좌/우 소실점 사이 거리의 ½ = 시점(화가) ↔ 화면 거리. 기둥 축척으로 환산.
        </em>
      </>,
    ],
    calc: {
      title: "🧮 사진작가 ↔ 신전 거리 계산",
      inputs: [
        { id: "vpDist", label: "좌측 소실점 ↔ 우측 소실점 거리 (px)", placeholder: "선분으로 측정" },
        { id: "colH", label: "기둥 높이 (px)", placeholder: "선분으로 측정" },
        { id: "colReal", label: "기둥 실제 높이 (m)", defaultValue: 11 },
      ],
      compute: ({ vpDist, colH, colReal }) => {
        if (!vpDist || !colH || vpDist <= 0 || colH <= 0) {
          return { ok: false, msg: "소실점 간 거리와 기둥 높이를 자(선분)로 재서 입력해주세요." };
        }
        const eyePx = vpDist / 2;
        const real = colReal || 11;
        const mPerPx = real / colH;
        const realDist = eyePx * mPerPx;
        return {
          ok: true,
          node: (
            <ul className="space-y-1">
              <li>• 좌 ↔ 우 소실점 거리: <b>{vpDist.toFixed(1)} px</b></li>
              <li>• 시점 ↔ 화면 거리 (½ × VP): <b>{eyePx.toFixed(1)} px</b></li>
              <li>• 축척: {real} m ÷ {colH.toFixed(1)} px = <b>{mPerPx.toFixed(4)} m/px</b></li>
              <li>• 사진작가 ↔ 신전 실제 거리 = {eyePx.toFixed(1)} × {mPerPx.toFixed(4)}</li>
              <li className="mt-2 text-base">
                ≈ <b className="text-emerald-300">{realDist.toFixed(1)} m</b>
              </li>
            </ul>
          ),
        };
      },
    },
  },

  // ─── 베르메르 ─────────────────────────────────────────────
  {
    key: "vermeer",
    shortLabel: "베르메르 회화의 알레고리",
    src: "/activities/measuring-distance/vermeer.jpg",
    title: "회화의 알레고리 (얀 베르메르, 1666)",
    steps: [
      <>
        <b>📐 직선 도구</b>로 그림 속 바닥 타일의 격자선을 연장해 <b>시심 V(소실점)</b>를
        찾으세요. V는 그림 안쪽, 수평선 위에 있습니다.
      </>,
      <>
        <b>📐 직선 도구</b>로 바닥 타일의 <b>대각선</b>을 연장해 <b>거리점 D</b>를 찾으세요.
        D는 V와 같은 수평선 위이며 그림 오른쪽 밖에 있습니다.
        <br />
        <em className="text-slate-500">
          가장자리 가까이 클릭하면 그 방향으로 캔버스가 확장됩니다.
        </em>
      </>,
      <>
        <b>📏 선분 도구</b>로 <b>시심 V ↔ 거리점 D</b> 사이의 거리를 재세요. 이 거리가
        그림을 그릴 당시 화가 눈과 캔버스 사이의 거리에 해당합니다.
      </>,
      <>
        <b>📏 선분 도구</b>로 그림 속 <b>여성의 키</b>(발끝 → 정수리)를 재세요. 여성의 실제
        키를 <b>160 cm</b>로 가정합니다.
      </>,
      <>
        아래 <b>계산기</b>에 측정값을 입력하면 화가 ↔ 그림 사이의 실제 거리가 계산됩니다.
        <br />
        <em className="text-slate-500">
          원리: V↔D 거리(px) × (실제 키 ÷ 여성 키 px) = 화가 거리(cm).
        </em>
      </>,
    ],
    calc: {
      title: "🧮 화가 ↔ 그림 거리 계산",
      inputs: [
        { id: "vd", label: "시심 V ↔ 거리점 D 거리 (px)", placeholder: "선분으로 측정" },
        { id: "womanPx", label: "그림 속 여성의 키 (px)", placeholder: "선분으로 측정" },
        { id: "womanReal", label: "여성의 실제 키 (cm)", defaultValue: 160 },
      ],
      compute: ({ vd, womanPx, womanReal }) => {
        if (!vd || !womanPx || vd <= 0 || womanPx <= 0) {
          return { ok: false, msg: "V↔D 거리와 여성의 키를 자(선분)로 재서 입력해주세요." };
        }
        const real = womanReal || 160;
        const cmPerPx = real / womanPx;
        const realDist = vd * cmPerPx;
        return {
          ok: true,
          node: (
            <ul className="space-y-1">
              <li>• V ↔ D 거리: <b>{vd.toFixed(1)} px</b></li>
              <li>• 여성의 키: {womanPx.toFixed(1)} px → 실제 {real} cm</li>
              <li>• 축척: {real} cm ÷ {womanPx.toFixed(1)} px = <b>{cmPerPx.toFixed(4)} cm/px</b></li>
              <li>• 화가 ↔ 그림 실제 거리 = {vd.toFixed(1)} × {cmPerPx.toFixed(4)}</li>
              <li className="mt-2 text-base">
                ≈ <b className="text-emerald-300">{realDist.toFixed(1)} cm</b>
                <span className="ml-2 text-slate-400">(약 {(realDist / 100).toFixed(2)} m)</span>
              </li>
            </ul>
          ),
        };
      },
    },
  },

  // ─── 산타 마리아 ──────────────────────────────────────────
  {
    key: "stmaria",
    shortLabel: "산타 마리아 노벨라",
    src: "/activities/measuring-distance/stmaria.jpg",
    title: "산타 마리아 노벨라 (피렌체)",
    steps: [
      <>
        <b>📐 직선 도구</b>로 기둥·아치·바닥선 등을 연장해 <b>소실점 V</b>를 찾으세요.
        정면을 향한 회랑의 중앙 수평선 위에 있습니다.
      </>,
      <>
        <b>📐 직선 도구</b>로 바닥 타일의 <b>대각선</b>을 연장해 <b>거리점 D</b>를 찾으세요.
        D는 V와 같은 수평선 위, V에서 좌측 또는 우측으로 떨어진 곳에 있습니다.
      </>,
      <>
        <b>📏 선분 도구</b>로 <b>소실점 V ↔ 거리점 D</b> 사이의 거리를 재세요.
      </>,
      <>
        <b>📏 선분 도구</b>로 <b>기둥의 높이</b>(기둥 하단 → 상단 아치 시작점)를 재세요. 산타
        마리아 노벨라 기둥의 실제 높이는 약 <b>9 m</b>입니다.
      </>,
      <>
        아래 <b>계산기</b>에 측정값을 입력하면 사진작가 ↔ 내부 사이의 실제 거리가
        계산됩니다.
      </>,
    ],
    calc: {
      title: "🧮 사진작가 ↔ 내부 거리 계산",
      inputs: [
        { id: "vd", label: "소실점 V ↔ 거리점 D 거리 (px)", placeholder: "선분으로 측정" },
        { id: "colH", label: "기둥 높이 (px)", placeholder: "선분으로 측정" },
        { id: "colReal", label: "기둥 실제 높이 (m)", defaultValue: 9 },
      ],
      compute: ({ vd, colH, colReal }) => {
        if (!vd || !colH || vd <= 0 || colH <= 0) {
          return { ok: false, msg: "V↔D 거리와 기둥 높이를 자(선분)로 재서 입력해주세요." };
        }
        const real = colReal || 9;
        const mPerPx = real / colH;
        const realDist = vd * mPerPx;
        return {
          ok: true,
          node: (
            <ul className="space-y-1">
              <li>• V ↔ D 거리: <b>{vd.toFixed(1)} px</b></li>
              <li>• 기둥 높이: {colH.toFixed(1)} px → 실제 {real} m</li>
              <li>• 축척: {real} m ÷ {colH.toFixed(1)} px = <b>{mPerPx.toFixed(5)} m/px</b></li>
              <li>• 사진작가 ↔ 내부 실제 거리 = {vd.toFixed(1)} × {mPerPx.toFixed(5)}</li>
              <li className="mt-2 text-base">
                ≈ <b className="text-emerald-300">{realDist.toFixed(2)} m</b>
              </li>
            </ul>
          ),
        };
      },
    },
  },
];

const ALL_ITEMS: MeasureItem[] = ARTWORKS.map((a) => ({ key: a.key, src: a.src }));

export default function MeasuringPointDistance() {
  const [idx, setIdx] = useState(0);
  const cur = ARTWORKS[idx];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100 sm:p-6">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">📐 거리점과 화가까지의 실제 거리</h2>
        <p className="mt-1 text-sm text-slate-400">
          세 작품에서 소실점과 거리점을 찾고, 자(선분) 도구로 거리를 재어 실제 촬영·제작
          거리를 유추합니다.
        </p>
      </header>

      <details className="mb-4 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-200">💡 활동 안내</summary>
        <ul className="mt-2 space-y-1 text-slate-400">
          <li>
            📐 <b>직선 도구</b>로 사진 속 평행선들을 연장해 <b>소실점 V</b>·<b>거리점 D</b>를
            찾습니다. 무한 직선이라 점선으로 화면 끝까지 연장돼요.
          </li>
          <li>
            📏 <b>선분 도구</b>로 기준 거리를 픽셀로 측정합니다. 라벨에 길이가, 옆 결과
            패널에도 누적됩니다. ESC·우클릭으로 첫 점 취소.
          </li>
          <li>
            🧹 <b>지우개</b>로 잘못 그은 선을 지웁니다.
          </li>
          <li>
            🔍 가장자리 가까이 클릭하면 그 방향으로 캔버스가 자동 확장 — V·D 가 사진 밖에
            있어도 찾을 수 있어요. 줌은 툴바 또는 Ctrl+휠.
          </li>
          <li>아래 작품별 단계 안내를 따라가며 계산기에 값을 입력해 실제 거리를 환산합니다.</li>
        </ul>
      </details>

      {/* 작품 탭 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {ARTWORKS.map((a, i) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setIdx(i)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
              idx === i
                ? "border-teal-400 bg-teal-700 text-cyan-50"
                : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
            }`}
          >
            {a.shortLabel}
          </button>
        ))}
      </div>

      {/* 작품 제목 */}
      <div className="mb-3 rounded-lg border-l-4 border-blue-500 bg-slate-900 px-3.5 py-2">
        <div className="text-sm font-bold text-blue-300">{cur.title}</div>
      </div>

      {/* MeasureCanvas */}
      <MeasureCanvas
        items={ALL_ITEMS}
        selectedKey={cur.key}
        enabledTools={["line", "ray", "erase"]}
        showResultPanel={true}
        defaultUnit="px"
      />

      {/* 단계 안내 (Steps Panel) */}
      <details className="mt-4 rounded-xl border border-blue-500/30 bg-slate-900/60" open>
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-bold text-blue-300">
          🔍 {cur.shortLabel} — 단계별 안내
        </summary>
        <ol className="space-y-3 px-4 pb-4 pt-2">
          {cur.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-extrabold text-blue-200">
                {i + 1}
              </div>
              <div className="text-xs leading-relaxed text-slate-300">{step}</div>
            </li>
          ))}
        </ol>
      </details>

      {/* 계산기 — key 로 작품 변경 시 자동 재마운트 → 입력값·결과 리셋 */}
      <CalcPanel key={cur.key} artwork={cur} />
    </div>
  );
}

function CalcPanel({ artwork }: { artwork: Artwork }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const inp of artwork.calc.inputs) {
      o[inp.id] = inp.defaultValue !== undefined ? String(inp.defaultValue) : "";
    }
    return o;
  });
  const [result, setResult] = useState<ReactNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 작품 바뀌면 입력값·결과 리셋.
  // useState 초기값은 첫 렌더에만 사용되므로, artwork.key 변화 추적은 별도 effect 필요.
  // (간단하게 — artwork.key 가 deps 인 useEffect 로 재설정.)
  // 하지만 deps 추적이 React 입장에서 깔끔하지 않으므로 key prop 으로 재마운트 권장.
  // → 이 컴포넌트를 호출하는 곳에서 key={cur.key} 로 마운트 분리. (아래에서 처리)

  function onSubmit() {
    const nums: Record<string, number> = {};
    for (const inp of artwork.calc.inputs) {
      const raw = values[inp.id];
      const n = parseFloat(raw);
      nums[inp.id] = isNaN(n) ? 0 : n;
    }
    const out = artwork.calc.compute(nums);
    if (out.ok) {
      setResult(out.node);
      setError(null);
    } else {
      setResult(null);
      setError(out.msg);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-teal-500/40 bg-emerald-950/40 p-4">
      <div className="mb-3 text-sm font-extrabold text-emerald-300">{artwork.calc.title}</div>
      <div className="space-y-2">
        {artwork.calc.inputs.map((inp) => (
          <div
            key={inp.id}
            className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap"
          >
            <label
              htmlFor={`calc-${artwork.key}-${inp.id}`}
              className="text-xs text-emerald-200 sm:flex-1"
            >
              {inp.label}
            </label>
            <input
              id={`calc-${artwork.key}-${inp.id}`}
              type="number"
              inputMode="decimal"
              value={values[inp.id]}
              placeholder={inp.placeholder ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [inp.id]: e.target.value }))}
              className="w-28 rounded-md border border-teal-500/50 bg-emerald-950 px-2 py-1 text-right text-xs text-emerald-100 outline-none focus:border-emerald-300"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="mt-3 rounded-md border border-teal-400 bg-emerald-800 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-700"
      >
        계산하기 →
      </button>
      {error ? (
        <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-950/50 px-3 py-2 text-xs text-amber-200">
          ⚠️ {error}
        </div>
      ) : null}
      {result ? (
        <div className="mt-3 rounded-md border border-emerald-400/40 bg-emerald-900/40 p-3 text-xs leading-relaxed text-emerald-100">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            계산 과정
          </div>
          {result}
        </div>
      ) : null}
    </div>
  );
}
