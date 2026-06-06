"use client";

// 성삼위일체 — 인물 사이의 실제 거리 추정.
//
// 원본: c:/git-math/math/activities/gifted/trinity_distance.py
// 자산: public/activities/trinity/{trinity.jpg, trinity3d.jpg}
//
// 마사초의 「성삼위일체」 원작(317×667 cm)과 1점 투시 분석 다이어그램을 나란히 놓고
// 각자 선분 도구로 px 측정 후, 변환기로 실제 cm 환산.
//
// 측정·도구 UI 는 단원 ③ 공용 MeasureCanvas 가 담당 (선분·직선·지우개). 이 컴포넌트는
// 두 그림 배치 + 변환기 + 활동 안내 만 담당. 원본의 텍스트·자유선·자(전용 자도구) 는
// 학습 핵심이 아니라 제외 — 측정·환산이 본질.

import { useMemo, useState } from "react";
import MeasureCanvas, {
  type MeasureItem,
} from "@/components/activities/gifted/3-perspective-art/_shared/MeasureCanvas";

const PAINT_W_CM = 317;
const PAINT_H_CM = 667;

const ORIGINAL: MeasureItem[] = [
  { key: "trinity", src: "/activities/trinity/trinity.jpg" },
];
const DIAGRAM: MeasureItem[] = [
  { key: "diagram", src: "/activities/trinity/trinity3d.jpg" },
];

type Dir = "w" | "h";

export default function TrinityDistance() {
  const [dir, setDir] = useState<Dir>("w");
  const [convW, setConvW] = useState("");
  const [convPx, setConvPx] = useState("");
  const [result, setResult] = useState<
    | { kind: "ok"; real: number; baseCm: number; baseLabel: string }
    | { kind: "error"; msg: string }
    | null
  >(null);

  const baseCm = dir === "w" ? PAINT_W_CM : PAINT_H_CM;
  const baseLabel = dir === "w" ? "가로" : "세로";

  const formulaStr = useMemo(
    () => `실제 길이 = 측정값(px) × ${baseCm} ÷ 화면 그림 ${baseLabel}(px)`,
    [baseCm, baseLabel],
  );

  function calc() {
    const W = parseFloat(convW);
    const L = parseFloat(convPx);
    if (!W || !L || W <= 0 || L <= 0) {
      setResult({ kind: "error", msg: "두 입력값(0보다 큰 숫자) 모두 확인해주세요." });
      return;
    }
    const real = (L * baseCm) / W;
    setResult({ kind: "ok", real, baseCm, baseLabel });
  }

  function switchDir(d: Dir) {
    setDir(d);
    setConvW("");
    setResult(null);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100 sm:p-6">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">🖼 성삼위일체 — 인물 사이 거리 추정</h2>
        <p className="mt-1 text-sm text-slate-400">
          마사초(1426~1428)의 「성삼위일체」 원작(317×667 cm)과 1점 투시 분석 다이어그램에서 자
          도구로 직접 측정하고 실제 크기를 환산합니다.
        </p>
      </header>

      <details className="mb-4 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-200">💡 활동 안내</summary>
        <ul className="mt-2 space-y-1 text-slate-400">
          <li>
            📷 <b>왼쪽</b> 캔버스는 원작 사진, 🔬 <b>오른쪽</b>은 1점 투시 분석 다이어그램입니다.
          </li>
          <li>
            📏 <b>선분 도구</b>로 두 점을 클릭해 거리(px)를 측정. 라벨에 길이가 표시되고 결과
            패널에도 누적됩니다.
          </li>
          <li>
            📐 <b>직선 도구</b>로 소실점·시선·바닥선 등을 보조선으로 연장. 🧹 지우개로 잘못
            그은 선 클릭 삭제.
          </li>
          <li>
            🧮 아래 <b>변환기</b>에 화면 그림의 가로(또는 세로) 픽셀과 측정한 선분의 픽셀을
            입력하면 실제 크기(cm)가 환산됩니다.
          </li>
          <li>
            <b>예시</b>: 인물 사이 거리, 인물 키, 기둥 높이 등을 측정해 실제 공간 배치를
            유추해보세요.
          </li>
        </ul>
      </details>

      <div className="mb-3 space-y-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <div className="mb-2 text-sm font-extrabold text-slate-200">
            📷 원본 그림 — 성삼위일체{" "}
            <span className="text-xs text-slate-500">(317 cm × 667 cm)</span>
          </div>
          <MeasureCanvas
            items={ORIGINAL}
            selectedKey="trinity"
            enabledTools={["line", "ray", "erase"]}
            showResultPanel={true}
            defaultUnit="px"
            initialMargin={80}
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <div className="mb-2 text-sm font-extrabold text-slate-200">
            🔬 1점 투시도 분석 다이어그램
          </div>
          <MeasureCanvas
            items={DIAGRAM}
            selectedKey="diagram"
            enabledTools={["line", "ray", "erase"]}
            showResultPanel={true}
            defaultUnit="px"
            initialMargin={80}
          />
        </div>
      </div>

      {/* 변환기 */}
      <div className="rounded-xl border border-teal-500/40 bg-emerald-950/40 p-4">
        <div className="mb-2 text-sm font-extrabold text-emerald-300">📏 실제 크기 환산</div>
        <div className="mb-3 text-xs text-emerald-200">
          원본 작품: 가로 <b className="text-sky-300">{PAINT_W_CM} cm</b> × 세로{" "}
          <b className="text-sky-300">{PAINT_H_CM} cm</b>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => switchDir("w")}
            className={`rounded-md border px-3 py-1.5 text-xs font-bold transition ${
              dir === "w"
                ? "border-sky-500 bg-sky-900 text-sky-100"
                : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
            }`}
          >
            ↔ 가로 기준
          </button>
          <button
            type="button"
            onClick={() => switchDir("h")}
            className={`rounded-md border px-3 py-1.5 text-xs font-bold transition ${
              dir === "h"
                ? "border-sky-500 bg-sky-900 text-sky-100"
                : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
            }`}
          >
            ↕ 세로 기준
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="trinity-conv-w"
              className="text-xs text-emerald-200 sm:flex-1"
            >
              화면 속 그림 <b>{baseLabel}</b> (px) — 측정 기준
            </label>
            <input
              id="trinity-conv-w"
              type="number"
              inputMode="decimal"
              step={1}
              value={convW}
              onChange={(e) => setConvW(e.target.value)}
              placeholder="예: 480"
              className="w-32 rounded-md border border-teal-500/50 bg-emerald-950 px-2 py-1 text-right text-xs text-emerald-100 outline-none focus:border-emerald-300"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="trinity-conv-px"
              className="text-xs text-emerald-200 sm:flex-1"
            >
              측정한 선분 (px) — 결과 패널에서 확인한 값
            </label>
            <input
              id="trinity-conv-px"
              type="number"
              inputMode="decimal"
              step={0.1}
              value={convPx}
              onChange={(e) => setConvPx(e.target.value)}
              placeholder="예: 120"
              className="w-32 rounded-md border border-teal-500/50 bg-emerald-950 px-2 py-1 text-right text-xs text-emerald-100 outline-none focus:border-emerald-300"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={calc}
          className="mt-3 rounded-md border border-teal-400 bg-emerald-800 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-700"
        >
          계산하기 →
        </button>

        {result ? (
          result.kind === "ok" ? (
            <div className="mt-3 rounded-md border border-teal-500 bg-emerald-900/40 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-200">
              <div>
                실제 길이 ={" "}
                <b className="text-base text-amber-300">{result.real.toFixed(1)} cm</b>{" "}
                <span className="text-emerald-300">(≈ {(result.real / 100).toFixed(2)} m)</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                계산: 측정값 {convPx} px × {result.baseCm} cm ÷ {convW} px ={" "}
                {result.real.toFixed(2)} cm
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-rose-500 bg-rose-950/50 px-3.5 py-2 text-xs text-rose-200">
              ⚠️ {result.msg}
            </div>
          )
        ) : null}

        <div className="mt-2 text-[11px] text-slate-500">📐 공식: {formulaStr}</div>
      </div>
    </div>
  );
}
