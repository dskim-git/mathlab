"use client";

// 등간격 사물 → 화폭에서 조화수열.
//
// 원본: c:/git-math/math/activities/gifted/harmonic_perspective.py (1878줄).
//
// 3 탭:
//   * 🎯 시뮬레이션 — OP/OB₁/gap/H 슬라이더 + 측면도 + 화폭 + PQ/PR/PS 결과 + 역수 등차
//     확인 + N그루 챌린지 (조화수열 분모는 OB_n = OB₁ + (n-1)·gap)
//   * 🔬 증명 — a/b/c/x 슬라이더 + 닮음 삼각형 측면도 + 공식 카드 4개 + 분모 등차열 + 4단계
//     증명 + 조화평균 검증 ax/(a+b+c) = HM(①', ③')
//   * 🖼 페인팅 — 그리스도의 채찍질(피에로 델라 프란체스카) 위에서 자 도구로 격자 간격
//     측정 + 조화수열 확인기 (입력값들이 조화수열인지 자동 판별)
//
// 페인팅 탭은 단원 ③ 공용 MeasureCanvas 재활용 + 조화수열 확인기 패널 추가.

import { useEffect, useMemo, useRef, useState } from "react";
import MeasureCanvas, {
  type MeasureItem,
} from "@/components/activities/gifted/3-perspective-art/_shared/MeasureCanvas";

type Tab = "sim" | "proof" | "paint";

const COLORS = [
  "#f472b6",
  "#a78bfa",
  "#60a5fa",
  "#34d399",
  "#fb923c",
  "#facc15",
  "#e879f9",
  "#38bdf8",
  "#4ade80",
  "#f97316",
];

const PROOF_COLORS = ["#f472b6", "#a78bfa", "#60a5fa", "#34d399"];
const PROOF_LABELS = ["①", "②", "③", "④"];

function setupCanvas(
  cvs: HTMLCanvasElement | null,
  dispW: number,
  dispH: number,
): { ctx: CanvasRenderingContext2D; w: number; h: number } | null {
  if (!cvs || dispW <= 0) return null;
  const ctx = cvs.getContext("2d");
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  cvs.width = Math.round(dispW * dpr);
  cvs.height = Math.round(dispH * dpr);
  cvs.style.width = `${dispW}px`;
  cvs.style.height = `${dispH}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: dispW, h: dispH };
}

export default function HarmonicPerspective() {
  const [tab, setTab] = useState<Tab>("sim");

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100 sm:p-6">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">
          🌳 등간격 사물 → 화폭에서 조화수열
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          실제 공간에서 등간격으로 놓인 사물을 화폭에 담으면 화폭에서의 투영 높이가 조화수열을
          이루는 원리를 탐구합니다.
        </p>
      </header>

      <details className="mb-4 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-200">💡 활동 안내</summary>
        <ul className="mt-2 space-y-1 text-slate-400">
          <li>
            🎯 <b>시뮬레이션</b> 탭: 슬라이더로 거리·간격·높이를 바꿔가며 화폭 투영 PQ/PR/PS
            가 어떻게 변하는지, 역수가 등차수열을 이루는지 확인.
          </li>
          <li>
            🔬 <b>증명</b> 탭: 닮음 삼각형을 통해 P_n = ax/(a+b+(n-1)c) 공식 유도, 분모가
            등차수열이므로 P_n은 조화수열.
          </li>
          <li>
            🖼 <b>페인팅</b> 탭: 피에로 델라 프란체스카의 「그리스도의 채찍질」 그림에서 자
            도구로 천장·바닥 격자 간격을 측정하고, 조화수열 확인기로 검증.
          </li>
        </ul>
      </details>

      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            { key: "sim", label: "🎯 시뮬레이션" },
            { key: "proof", label: "🔬 증명" },
            { key: "paint", label: "🖼 페인팅 (그리스도의 채찍질)" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
              tab === t.key
                ? "border-amber-400 bg-amber-700 text-amber-50"
                : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: tab === "sim" ? "block" : "none" }}>
        <SimulationTab />
      </div>
      <div style={{ display: tab === "proof" ? "block" : "none" }}>
        <ProofTab />
      </div>
      <div style={{ display: tab === "paint" ? "block" : "none" }}>
        <PaintingTab />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
//  TAB 1 — Simulation
// ════════════════════════════════════════════════════
function SimulationTab() {
  const [OP, setOP] = useState(100);
  const [OB1, setOB1] = useState(200);
  const [gap, setGap] = useState(100);
  const [H, setH] = useState(80);
  const [N, setN] = useState(3);

  // OP < OB1 가드
  const safeOP = Math.min(OP, OB1 - 10);

  const diagRef = useRef<HTMLCanvasElement>(null);
  const painterRef = useRef<HTMLCanvasElement>(null);
  const diagWrapRef = useRef<HTMLDivElement>(null);
  const painterWrapRef = useRef<HTMLDivElement>(null);
  const [diagW, setDiagW] = useState(0);
  const [painterW, setPainterW] = useState(0);

  useEffect(() => {
    const el = diagWrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setDiagW(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const el = painterWrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setPainterW(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 다이어그램 그리기
  useEffect(() => {
    drawSimDiagram(diagRef.current, diagW, safeOP, OB1, gap, H);
  }, [diagW, safeOP, OB1, gap, H]);

  useEffect(() => {
    drawSimPainter(painterRef.current, painterW, safeOP, OB1, gap, H);
  }, [painterW, safeOP, OB1, gap, H]);

  // 계산
  const OBs = [OB1, OB1 + gap, OB1 + 2 * gap];
  const projs = OBs.map((OBi) => (H * safeOP) / OBi);
  const invs = projs.map((p) => 1 / p);
  const diffs = [invs[1] - invs[0], invs[2] - invs[1]];
  const isArith = Math.abs(diffs[0] - diffs[1]) < 1e-9;

  const NProjs = useMemo(
    () => Array.from({ length: N }, (_, i) => (H * safeOP) / (OB1 + i * gap)),
    [N, safeOP, OB1, gap, H],
  );

  return (
    <div>
      <div className="mb-3 rounded-lg border-l-4 border-amber-400 bg-slate-900 px-3.5 py-2 text-xs leading-relaxed text-slate-300">
        실제 공간에서 <b className="text-amber-300">등간격(등차수열)</b>으로 서 있는 나무들을
        정면에서 화폭에 담으면, 화폭 위의 나무 높이들은{" "}
        <b className="text-rose-400">조화수열</b>을 이룹니다.
      </div>

      {/* 슬라이더 */}
      <div className="mb-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <SliderRow
            label="화폭까지 거리 (OP)"
            value={safeOP}
            min={40}
            max={180}
            step={2}
            onChange={setOP}
          />
          <SliderRow
            label="첫 번째 나무까지 거리 (OB₁)"
            value={OB1}
            min={120}
            max={320}
            step={5}
            onChange={setOB1}
          />
          <SliderRow
            label="나무 사이 간격 (등차)"
            value={gap}
            min={40}
            max={200}
            step={5}
            onChange={setGap}
          />
          <SliderRow
            label="나무 실제 높이 (AB)"
            value={H}
            min={30}
            max={140}
            step={5}
            onChange={setH}
          />
        </div>
      </div>

      {/* 다이어그램 */}
      <div
        ref={diagWrapRef}
        className="relative mb-3 overflow-hidden rounded-xl border border-blue-900/40 bg-[#0d1b2a]"
      >
        <div className="absolute left-3 top-2 z-10 text-[11px] font-bold text-slate-500">
          기하학적 도식 (측면도)
        </div>
        <canvas ref={diagRef} className="block" />
      </div>

      {/* PQ PR PS 결과 */}
      <div className="mb-3 grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-blue-900/40 bg-slate-900 px-3 py-2.5 text-center"
          >
            <div className="text-[10px] text-slate-500">
              {["첫 번째 투영 PQ", "두 번째 투영 PR", "세 번째 투영 PS"][i]}
            </div>
            <div className="text-xl font-extrabold" style={{ color: COLORS[i] }}>
              {projs[i].toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500">
              = PQ × {(OB1 / OBs[i]).toFixed(3)} (OB₁/OB{i + 1})
            </div>
          </div>
        ))}
      </div>

      {/* 조화수열 확인 */}
      <div className="mb-3 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3">
        <div className="mb-2 text-xs font-extrabold text-sky-300">
          📊 조화수열 확인 — 역수가 등차수열을 이루는지 보자
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invs.map((inv, i) => (
            <span key={i} className="contents">
              {i > 0 ? (
                <span className="flex-shrink-0 text-center text-xs text-slate-500">
                  <span className={`block text-[10px] font-bold ${isArith ? "text-emerald-400" : "text-amber-300"}`}>
                    +{diffs[i - 1].toFixed(4)}
                  </span>
                  →
                </span>
              ) : null}
              <div
                className="min-w-[100px] rounded-md border border-slate-600 bg-slate-950 px-3 py-1.5 text-center"
                style={{ borderColor: COLORS[i] }}
              >
                <div className="text-[10px]" style={{ color: COLORS[i] }}>
                  1/{["PQ", "PR", "PS"][i]}
                </div>
                <div className="text-sm font-extrabold" style={{ color: COLORS[i] }}>
                  {inv.toFixed(4)}
                </div>
              </div>
            </span>
          ))}
        </div>
        <div className="mt-2 rounded-md border border-blue-900/40 bg-slate-950 px-3 py-2 text-xs leading-relaxed text-slate-400">
          {isArith ? (
            <>
              <span className="font-bold text-emerald-400">
                ✅ 공차 = {diffs[0].toFixed(4)}
              </span>{" "}
              로 역수들이 등차수열 →{" "}
              <span className="font-bold text-emerald-400">PQ, PR, PS 는 조화수열!</span>
              <br />
              <span className="text-sky-300">
                공식: P_n = <b>A₁B₁ × OP / OB_n</b> 이므로, OB_n 이 등차수열이면 1/P_n 도 등차수열
              </span>
            </>
          ) : (
            <span className="text-amber-300">
              역수 차이: {diffs[0].toFixed(6)} vs {diffs[1].toFixed(6)} — 부동소수점 오차 확인
            </span>
          )}
        </div>
      </div>

      {/* 화폭에서의 모습 */}
      <div
        ref={painterWrapRef}
        className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-slate-900"
      >
        <div className="px-3.5 pt-2 text-xs font-extrabold text-sky-300">🖼️ 화폭에서의 모습</div>
        <div className="px-3.5 pb-2 text-[11px] text-slate-500">
          화폭 위에 투영된 나무 높이 — 실제 나무는 같은 높이, 화폭에서는 점점 작아짐
        </div>
        <canvas ref={painterRef} className="block" />
      </div>

      {/* N그루 챌린지 */}
      <div className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-3">
        <div className="mb-2 text-xs font-extrabold text-fuchsia-300">
          🌳 나무가 n그루라면? — 조화수열 확장
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="text-xs text-sky-300">나무 수 n =</label>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={N}
            onChange={(e) => setN(Number(e.target.value))}
            className="h-1.5 max-w-[260px] flex-1 accent-fuchsia-400"
            aria-label="나무 수"
          />
          <span className="min-w-[20px] text-sm font-extrabold text-amber-300">{N}</span>
          <span className="text-[11px] text-slate-500">그루</span>
        </div>
        <div className="flex h-[120px] items-end gap-1.5 px-1">
          {NProjs.map((p, i) => {
            const max = NProjs[0];
            const barH = max > 0 ? (p / max) * 100 : 0;
            const hue = Math.round(210 + i * (330 / N));
            return (
              <div key={i} className="flex flex-1 flex-col items-center">
                <div className="mb-0.5 text-[10px] text-slate-400">{p.toFixed(1)}</div>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${barH}px`,
                    background: `hsl(${hue}, 70%, 55%)`,
                  }}
                />
                <div className="mt-0.5 text-[10px] text-slate-500">P{i + 1}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-md border border-blue-900/40 bg-slate-950 px-3 py-2 text-xs leading-relaxed text-slate-400">
          <span className="font-bold text-fuchsia-300">
            P_n = A₁B₁ × OP / OB_n = {(H * safeOP).toFixed(0)} / ({OB1} + {gap}(n−1))
          </span>
          <br />
          역수: 1/P_n = ({OB1} + {gap}(n−1)) / {(H * safeOP).toFixed(0)} — 공차{" "}
          <b className="text-amber-300">{(gap / (H * safeOP)).toFixed(5)}</b> 인 등차수열 ✅
        </div>
      </div>
    </div>
  );
}

// ─── 시뮬레이션 다이어그램 ───────────────────────────
function drawSimDiagram(
  cvs: HTMLCanvasElement | null,
  W: number,
  OP: number,
  OB1: number,
  gap: number,
  H: number,
) {
  const setup = setupCanvas(cvs, W, 300);
  if (!setup) return;
  const { ctx, w, h: CH } = setup;

  const N = 3;
  const OBs = Array.from({ length: N }, (_, i) => OB1 + i * gap);
  const OBmax = OBs[N - 1];
  const sceneW = OBmax * 1.12;
  const sceneH = H * 1.9;
  const padL = 32;
  const padR = 16;
  const padB = 36;
  const padT = 28;
  const drawW = w - padL - padR;
  const drawH = CH - padT - padB;
  const sc = Math.min(drawW / sceneW, drawH / sceneH);

  const toX = (x: number) => padL + x * sc;
  const toY = (y: number) => CH - padB - y * sc;
  const gndY = toY(0);

  ctx.clearRect(0, 0, w, CH);
  ctx.fillStyle = "#0d1b2a";
  ctx.fillRect(0, 0, w, CH);

  // 격자
  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 1;
  for (let yi = 0; yi <= sceneH; yi += Math.round(sceneH / 4)) {
    const cy = toY(yi);
    ctx.beginPath();
    ctx.moveTo(padL, cy);
    ctx.lineTo(w - padR, cy);
    ctx.stroke();
  }

  // 바닥선
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, gndY);
  ctx.lineTo(w - padR, gndY);
  ctx.stroke();

  // 화폭 (P 위치)
  const px = toX(OP);
  const cvTop = toY(H * 1.7);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px, gndY + 6);
  ctx.lineTo(px, cvTop);
  ctx.stroke();
  ctx.fillStyle = "rgba(56,189,248,0.07)";
  ctx.fillRect(px - 1, cvTop, 3, gndY - cvTop + 6);
  ctx.fillStyle = "#7dd3fc";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("P", px, gndY + 22);
  ctx.fillText("화폭", px, cvTop - 8);

  // 나무들
  OBs.forEach((OBi, i) => {
    const tx = toX(OBi);
    const th = H * sc;
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tx, gndY);
    ctx.lineTo(tx, toY(H));
    ctx.stroke();
    const cr = Math.max(7, th * 0.18);
    const cyTop = toY(H) - cr * 0.3;
    ctx.fillStyle = ["#16a34a", "#15803d", "#14532d"][i];
    ctx.strokeStyle = ["#4ade80", "#86efac", "#bbf7d0"][i];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(tx, cyTop, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`A${i + 1}`, tx, cyTop - cr - 4);
    ctx.fillStyle = "#64748b";
    ctx.fillText(`B${i + 1}`, tx, gndY + 22);
  });

  // 투영선
  const projLabels = ["Q", "R", "S"];
  OBs.forEach((OBi, i) => {
    const proj = (H * OP) / OBi;
    const tx = toX(OBi);
    const ty = toY(H);
    const projY = toY(proj);

    ctx.strokeStyle = COLORS[i];
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COLORS[i];
    ctx.beginPath();
    ctx.arc(px, projY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS[i];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, gndY);
    ctx.lineTo(px, projY);
    ctx.stroke();

    ctx.fillStyle = COLORS[i];
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(projLabels[i], px + 7, projY + 4);
  });

  // 눈 O
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(toX(0), toY(0), 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("O", toX(0), toY(0) + 22);
  ctx.font = "16px sans-serif";
  ctx.fillText("👁", toX(0), toY(0) - 10);
}

function drawSimPainter(
  cvs: HTMLCanvasElement | null,
  W: number,
  OP: number,
  OB1: number,
  gap: number,
  H: number,
) {
  const setup = setupCanvas(cvs, W, 200);
  if (!setup) return;
  const { ctx, w, h: CH } = setup;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, CH * 0.65);
  skyGrad.addColorStop(0, "#1e3a5f");
  skyGrad.addColorStop(1, "#0d2137");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, CH * 0.65);

  ctx.fillStyle = "#1a2e1a";
  ctx.fillRect(0, CH * 0.65, w, CH * 0.35);

  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(0, CH * 0.65);
  ctx.lineTo(w, CH * 0.65);
  ctx.stroke();
  ctx.setLineDash([]);

  const N = 3;
  const OBs = Array.from({ length: N }, (_, i) => OB1 + i * gap);
  const projs = OBs.map((OBi) => (H * OP) / OBi);
  // 슬라이더 변화가 화폭에서도 시각적으로 드러나도록 절대 스케일 사용.
  // 기준: H·OP 최댓값(140·180) + OB₁ 최솟값(120) 조합에서 첫 투영이 화폭 최대 높이에 닿도록.
  // 그러면 H·OP 줄이거나 OB₁ 늘리면 모든 나무가 일제히 작아져 변화가 보임.
  const REF_PQ = (140 * 180) / 120; // ≈ 210
  const maxBarH = CH * 0.55;
  const scale = maxBarH / REF_PQ;
  const xs = [w * 0.2, w * 0.45, w * 0.7];
  const treeColors = [
    ["#16a34a", "#4ade80"],
    ["#15803d", "#86efac"],
    ["#14532d", "#bbf7d0"],
  ];
  const gndY = CH * 0.65;

  projs.forEach((pj, i) => {
    const barH = pj * scale;
    const tx = xs[i];
    const trunkTop = gndY - barH;
    const cr = Math.max(6, barH * 0.22);
    const stripX = 14;
    ctx.fillStyle = COLORS[i] + "55";
    ctx.fillRect(stripX, gndY - barH, 8, barH);
    ctx.fillStyle = COLORS[i];
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(pj.toFixed(1), stripX + 10, gndY - barH + 4);

    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = Math.max(2, barH * 0.07);
    ctx.beginPath();
    ctx.moveTo(tx, gndY);
    ctx.lineTo(tx, trunkTop);
    ctx.stroke();

    ctx.fillStyle = treeColors[i][0];
    ctx.strokeStyle = treeColors[i][1];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(tx, trunkTop - cr * 0.3, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = `${Math.max(9, 11 - i)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`A${i + 1}`, tx, trunkTop - cr - 5);
  });

  // 소실점
  ctx.fillStyle = "rgba(251,191,36,0.5)";
  ctx.beginPath();
  ctx.arc(w * 0.85, gndY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#64748b";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("소실점 →", w * 0.85, gndY - 10);
}

// ════════════════════════════════════════════════════
//  TAB 2 — Proof
// ════════════════════════════════════════════════════
function ProofTab() {
  const [a, setA] = useState(100);
  const [b, setB] = useState(80);
  const [c, setC] = useState(60);
  const [x, setX] = useState(70);

  const diagRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [diagW, setDiagW] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setDiagW(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    drawProofDiagram(diagRef.current, diagW, a, b, c, x);
  }, [diagW, a, b, c, x]);

  const denoms = [0, 1, 2, 3].map((i) => a + b + i * c);
  const vals = denoms.map((d) => (a * x) / d);
  const diffs = [0, 1, 2].map((i) => denoms[i + 1] - denoms[i]);
  const allSame = diffs.every((d) => d === diffs[0]);

  // 조화평균 검증
  const p1 = vals[0];
  const p2 = vals[1];
  const p3 = vals[2];
  const hm = (2 * p1 * p3) / (p1 + p3);

  return (
    <div>
      <div className="mb-3 rounded-lg border-l-4 border-emerald-400 bg-slate-900 px-3.5 py-2 text-xs leading-relaxed text-slate-300">
        <b className="text-emerald-400">공간에서 같은 간격 c, 같은 길이 x</b>로 배치된 선분
        ①②③④를 눈(A)에서 화면에 투영할 때, 화면 위 투영 길이 ①'②'③'④'의{" "}
        <b className="text-rose-400">분모가 등차수열</b>을 이루기 때문에 투영 길이는 <b>조화수열</b>
        이 됩니다.
      </div>

      {/* 슬라이더 */}
      <div className="mb-3 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <SliderRow label="a — 눈(A)에서 화면까지 거리" value={a} min={40} max={200} step={2} onChange={setA} />
          <SliderRow label="b — 화면에서 ①까지 거리" value={b} min={30} max={200} step={2} onChange={setB} />
          <SliderRow label="c — 선분 사이 간격" value={c} min={20} max={150} step={2} onChange={setC} />
          <SliderRow label="x — 선분 길이" value={x} min={20} max={140} step={2} onChange={setX} />
        </div>
      </div>

      {/* 다이어그램 */}
      <div ref={wrapRef} className="mb-3 overflow-hidden rounded-xl border border-blue-900/40 bg-[#0d1b2a]">
        <canvas ref={diagRef} className="block" />
      </div>

      {/* 공식 카드 4개 */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => {
          const bg = [
            "rgba(244,114,182,0.1)",
            "rgba(167,139,250,0.1)",
            "rgba(96,165,250,0.1)",
            "rgba(52,211,153,0.1)",
          ][i];
          const bd = PROOF_COLORS[i];
          const suffix = ["b)", "b+c)", "b+2c)", "b+3c)"][i];
          return (
            <div
              key={i}
              className="rounded-lg border p-2 text-center"
              style={{ background: bg, borderColor: bd }}
            >
              <div className="text-xs font-extrabold" style={{ color: bd }}>
                {PROOF_LABELS[i]}' (n={i + 1})
              </div>
              <div className="font-mono text-[10px] text-slate-400">= ax/(a+{suffix}</div>
              <div className="font-mono text-[10px] text-slate-500">
                = {a}·{x}/{denoms[i]}
              </div>
              <div className="mt-1 text-lg font-extrabold" style={{ color: bd }}>
                {vals[i].toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 분모 분석 */}
      <div className="mb-3 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3">
        <div className="mb-2 text-xs font-extrabold text-sky-300">
          📐 분모를 나열하면 — 등차수열이므로 역수(투영 길이)는 조화수열
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {denoms.map((d, i) => (
            <span key={i} className="contents">
              {i > 0 ? <span className="text-base text-slate-500">+{c} →</span> : null}
              <div className="rounded-md border border-slate-600 bg-slate-950 px-3 py-1.5 text-xs">
                <div className="text-[10px]" style={{ color: COLORS[i] }}>
                  분모 {PROOF_LABELS[i]}'
                </div>
                <div className="font-extrabold" style={{ color: COLORS[i] }}>
                  {d}
                </div>
              </div>
            </span>
          ))}
        </div>
        <div className="mt-2 rounded-md border border-blue-900/40 bg-slate-950 px-3 py-2 text-xs text-slate-400">
          공차: <span className="font-bold text-emerald-400">{diffs[0]}</span>{" "}
          {allSame ? "(등차수열 ✅)" : "—"} | 분자 ax = {a}×{x} ={" "}
          <span className="font-bold text-emerald-400">{a * x}</span> (상수) → 투영 길이는{" "}
          <span className="font-bold text-emerald-400">조화수열</span>
        </div>
      </div>

      {/* 증명 단계 */}
      <details className="mb-3 rounded-xl border border-blue-900/40 bg-slate-900">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-extrabold text-emerald-300">
          🔎 닮음 삼각형으로 공식 유도하기
        </summary>
        <ProofStepBody />
      </details>

      {/* 조화평균 검증 */}
      <div className="rounded-xl border-2 border-violet-600 bg-[#1e0a3c] px-4 py-3">
        <div className="mb-2 text-sm font-extrabold text-violet-200">
          ✅ 조화평균 검증 — 수식으로 확인
        </div>
        <div className="space-y-1.5 rounded-lg border border-violet-800 bg-slate-950 px-3.5 py-2.5 font-mono text-xs leading-relaxed text-violet-300">
          <div>조화평균(①', ③') = 2 ÷ (1/①' + 1/③')</div>
          <div>= 2 ÷ ( (a+b)/ax + (a+b+2c)/ax )</div>
          <div>= 2ax ÷ ( (a+b) + (a+b+2c) )</div>
          <div>= 2ax ÷ (2a+2b+2c)</div>
          <div className="font-sans">
            = <b className="text-emerald-400">ax/(a+b+c) = ②'</b>{" "}
            <span className="text-[10px] text-slate-500">← 슬라이더를 어떻게 바꿔도 항상 성립!</span>
          </div>
        </div>
        <div className="mt-2 rounded-md border border-emerald-600 bg-slate-950 px-3 py-2 text-xs leading-relaxed text-emerald-200">
          수치 확인 (현재 a={a}, b={b}, c={c}, x={x}):
          <br />
          ①'={p1.toFixed(3)}, ②'={p2.toFixed(3)}, ③'={p3.toFixed(3)}
          <br />
          조화평균(①', ③') = 2×{p1.toFixed(3)}×{p3.toFixed(3)}/({p1.toFixed(3)}+{p3.toFixed(3)}) ={" "}
          <span className="font-bold text-emerald-400">{hm.toFixed(3)}</span> ≈ ②' ={" "}
          <span className="font-bold text-emerald-400">{p2.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

function ProofStepBody() {
  return (
    <div className="space-y-3 px-4 pb-4 pt-2">
      <ProofStep n={1} title="△ABC ~ △ADE (AA 닮음)">
        눈(A)에서 화면(BC)과 선분①(DE)을 향한 시선이 동일 직선이므로 공통각 ∠A를 공유.
        <br />
        BC ∥ DE (둘 다 화면과 평행) → 동위각 ∠ABC = ∠ADE
        <br />∴ AA 닮음
      </ProofStep>
      <ProofStep n={2} title="닮음비 a : (a+b) 도출">
        A에서 화면까지 수평 거리 = a | A에서 ① 아래까지 수평 거리 = a+b
        <br />
        <FormulaPill>닮음비 = AC : AE = a : (a+b)</FormulaPill>
      </ProofStep>
      <ProofStep n={3} title="①' = ax/(a+b) 도출">
        <FormulaPill>①' = BC = DE × a/(a+b) = x · a/(a+b) = ax/(a+b)</FormulaPill>
        <br />
        마찬가지로 n번째 선분의 투영:
        <br />
        <FormulaPill>n번째' = ax / (a + b + (n−1)c)</FormulaPill>
      </ProofStep>
      <ProofStep n={4} title="분모 분석">
        분모: a+b, a+b+c, a+b+2c, a+b+3c, …
        <br />→ 첫째항 a+b, 공차 c인 <b className="text-amber-300">등차수열</b>
        <br />→ 분자 ax는 상수, 분모가 등차수열 → 투영 길이는 <b>조화수열</b> ✓
      </ProofStep>
    </div>
  );
}

function ProofStep({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-950 text-sm font-extrabold text-emerald-300">
        {n}
      </div>
      <div className="text-xs leading-relaxed text-slate-400">
        <div className="mb-1 font-bold text-emerald-300">{title}</div>
        {children}
      </div>
    </div>
  );
}

function FormulaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md border border-emerald-700 bg-emerald-950 px-2.5 py-0.5 font-mono text-xs text-emerald-400">
      {children}
    </span>
  );
}

// ─── 증명 다이어그램 ─────────────────────────────────
function drawProofDiagram(
  cvs: HTMLCanvasElement | null,
  W: number,
  a: number,
  b: number,
  c: number,
  x: number,
) {
  const setup = setupCanvas(cvs, W, 320);
  if (!setup) return;
  const { ctx, w, h: CH } = setup;

  const eyeH = Math.max(x * 2.0, 140);
  const padL = 28;
  const padR = 28;
  const padT = 36;
  const padB = 48;
  const sceneW = a + b + 3 * c + a * 0.08;
  const sceneH = eyeH + x * 0.3;
  const sc = Math.min((w - padL - padR) / sceneW, (CH - padT - padB) / sceneH);

  const tX = (sx: number) => w - padR - sx * sc;
  const tY = (sy: number) => CH - padB - sy * sc;
  const floorY = tY(0);
  const Ax = tX(0);
  const Ay = tY(eyeH);
  const ppX = tX(a);
  const objXs = [0, 1, 2, 3].map((i) => tX(a + b + i * c));
  const topY = tY(x);
  const projYs = objXs.map((ox) => {
    const t = (ppX - Ax) / (ox - Ax);
    return Ay + t * (topY - Ay);
  });

  ctx.clearRect(0, 0, w, CH);
  ctx.fillStyle = "#0d1b2a";
  ctx.fillRect(0, 0, w, CH);

  // 격자
  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 0.8;
  for (let gy = padT; gy < CH - padB; gy += 50) {
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(w - padR, gy);
    ctx.stroke();
  }

  // 큰 삼각형 △ADE
  ctx.fillStyle = "rgba(250,204,21,0.07)";
  ctx.strokeStyle = "rgba(250,204,21,0.35)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(Ax, Ay);
  ctx.lineTo(objXs[0], topY);
  ctx.lineTo(objXs[0], floorY);
  ctx.lineTo(Ax, floorY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // 작은 삼각형 △ABC
  ctx.fillStyle = "rgba(56,189,248,0.09)";
  ctx.strokeStyle = "rgba(56,189,248,0.38)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(Ax, Ay);
  ctx.lineTo(ppX, projYs[0]);
  ctx.lineTo(ppX, floorY);
  ctx.lineTo(Ax, floorY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = "italic bold 11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(250,204,21,0.75)";
  ctx.fillText("△ADE", objXs[0] + 5, Ay + 18);
  ctx.fillStyle = "rgba(56,189,248,0.75)";
  ctx.fillText("△ABC", ppX + 6, Ay + 18);

  // 바닥
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padL, floorY);
  ctx.lineTo(w - padR, floorY);
  ctx.stroke();

  // 직각 마커
  function rightAngle(cx: number, cy: number, size = 8) {
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx - size, cy - size);
    ctx.lineTo(cx, cy - size);
    ctx.stroke();
  }
  rightAngle(ppX, floorY);
  rightAngle(objXs[0], floorY);

  // 거리 라벨
  function brace(x1: number, x2: number, y: number, lbl: string, col: string) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    for (const xp of [x1, x2]) {
      ctx.beginPath();
      ctx.moveTo(xp, y - 5);
      ctx.lineTo(xp, y + 5);
      ctx.stroke();
    }
    ctx.fillStyle = col;
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(lbl, (x1 + x2) / 2, y + 15);
  }
  brace(ppX, Ax, floorY + 10, "a", "#7dd3fc");
  brace(tX(a + b), ppX, floorY + 10, "b", "#86efac");
  brace(tX(a + b + c), tX(a + b), floorY + 10, "c", "#fbbf24");
  brace(tX(a + b + 2 * c), tX(a + b + c), floorY + 10, "c", "#fbbf24");
  brace(tX(a + b + 3 * c), tX(a + b + 2 * c), floorY + 10, "c", "#fbbf24");

  // 화면
  const ppTop = Math.min(projYs[0] - 8, Ay + 20);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(ppX, floorY + 4);
  ctx.lineTo(ppX, ppTop);
  ctx.stroke();
  ctx.fillStyle = "rgba(56,189,248,0.08)";
  ctx.fillRect(ppX - 2, ppTop, 4, floorY - ppTop + 4);

  // 선분 ①②③④
  for (const i of [0, 1, 2, 3]) {
    const fx = objXs[i];
    ctx.strokeStyle = PROOF_COLORS[i];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, floorY);
    ctx.lineTo(fx, topY);
    ctx.stroke();
    ctx.fillStyle = PROOF_COLORS[i];
    ctx.beginPath();
    ctx.moveTo(fx, topY - 9);
    ctx.lineTo(fx - 5, topY);
    ctx.lineTo(fx + 5, topY);
    ctx.closePath();
    ctx.fill();
    const lblY = topY - 18;
    ctx.beginPath();
    ctx.arc(fx, lblY - 2, 11, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();
    ctx.strokeStyle = PROOF_COLORS[i];
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = PROOF_COLORS[i];
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(PROOF_LABELS[i], fx, lblY + 2);
  }

  // x 길이 표시
  const xAnnX = objXs[0] + 14;
  ctx.strokeStyle = "rgba(251,191,36,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xAnnX, floorY);
  ctx.lineTo(xAnnX, topY);
  ctx.stroke();
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("x", xAnnX + 4, (floorY + topY) / 2 + 5);

  // 광선
  for (const i of [0, 1, 2, 3]) {
    ctx.strokeStyle = PROOF_COLORS[i] + "99";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(Ax, Ay);
    ctx.lineTo(objXs[i], topY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 화면 위 투영점
  for (const i of [0, 1, 2, 3]) {
    const py = projYs[i];
    ctx.strokeStyle = PROOF_COLORS[i];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ppX, floorY);
    ctx.lineTo(ppX, py);
    ctx.stroke();
    ctx.fillStyle = PROOF_COLORS[i];
    ctx.beginPath();
    ctx.arc(ppX, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${PROOF_LABELS[i]}'`, ppX + 7, py + 4);
  }

  // ①' 크기
  ctx.strokeStyle = "rgba(244,114,182,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ppX - 10, floorY);
  ctx.lineTo(ppX - 10, projYs[0]);
  ctx.stroke();
  ctx.fillStyle = "#f472b6";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("①'", ppX - 12, (floorY + projYs[0]) / 2 + 4);

  // 눈 A
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(Ax, Ay, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("A", Ax, Ay + 3);

  // A→A' 수직선
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(Ax, Ay + 8);
  ctx.lineTo(Ax, floorY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 위치 라벨 (shadow text)
  function txtShadow(txt: string, x: number, y: number, col: string, align: CanvasTextAlign = "center") {
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = align;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillText(txt, x + 1, y + 1);
    ctx.fillStyle = col;
    ctx.fillText(txt, x, y);
  }
  txtShadow("A'", Ax, floorY + 24, "#7dd3fc");
  txtShadow("D", objXs[0], topY - 30, "#facc15");
  txtShadow("E", objXs[0], floorY - 8, "#facc15");
  txtShadow("B", ppX - 8, projYs[0] - 6, "#38bdf8", "right");
  txtShadow("C", ppX - 8, floorY - 8, "#38bdf8", "right");

  // 비율 라벨
  ctx.fillStyle = "rgba(250,204,21,0.8)";
  ctx.font = "italic 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("a+b", (Ax + objXs[0]) / 2, floorY - 6);
  ctx.fillStyle = "rgba(56,189,248,0.8)";
  ctx.fillText("a", (Ax + ppX) / 2, floorY - 6);
}

// ════════════════════════════════════════════════════
//  TAB 3 — Painting
// ════════════════════════════════════════════════════
const PAINTING_ITEMS: MeasureItem[] = [
  { key: "christ", src: "/activities/harmonic/christ.png" },
];

function PaintingTab() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<HarmonicResult | null>(null);
  const [showTile, setShowTile] = useState(false);
  const [showCeil, setShowCeil] = useState(false);

  function check() {
    const vals = input
      .split(/[, ]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (vals.length < 3) {
      setResult({ kind: "error", msg: "값을 최소 3개 이상 쉼표로 구분해 입력하세요." });
      return;
    }
    const invs = vals.map((v) => 1 / v);
    const diffs = invs.slice(1).map((v, i) => v - invs[i]);
    const avg = diffs.reduce((s, x) => s + x, 0) / diffs.length;
    const maxDev = Math.max(...diffs.map((d) => Math.abs(d - avg)));
    const relTol = Math.abs(avg) * 0.05; // 5% 이내
    const isHarm = maxDev <= relTol || maxDev < 1e-4;
    setResult({
      kind: "ok",
      vals,
      invs,
      diffs,
      avg,
      maxDev,
      isHarm,
    });
  }

  return (
    <div>
      <div className="mb-3 rounded-lg border-l-4 border-violet-400 bg-slate-900 px-3.5 py-2 text-xs leading-relaxed text-slate-300">
        🎨 <b>그리스도의 채찍질</b> — 피에로 델라 프란체스카 (~1455)
        <br />
        <span className="text-slate-400">
          자(📐) 도구로 바닥 타일 또는 천장 격자의 간격을 측정하고, 아래 조화수열 확인기로
          검증해보세요.
        </span>
      </div>

      <MeasureCanvas
        items={PAINTING_ITEMS}
        selectedKey="christ"
        enabledTools={["line", "ray", "erase"]}
        showResultPanel={true}
        defaultUnit="px"
        initialMargin={80}
      />

      {/* 단계별 안내 */}
      <details className="mt-4 rounded-xl border border-blue-900/40 bg-slate-900">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-extrabold text-sky-300">
          🔍 단계별 안내
        </summary>
        <ol className="space-y-3 px-4 pb-4 pt-2">
          <li className="flex gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-extrabold text-blue-200">
              1
            </div>
            <div className="text-xs leading-relaxed text-slate-400">
              📏 <b>선분 도구</b>로 측정하고 싶은 곳에서 두 점을 클릭하면 길이(px)가 표시됩니다.
              <br />
              <em className="text-slate-500">📐 직선 도구는 보조선(소실점 탐색) 용도.</em>
            </div>
          </li>
          <li className="flex gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-extrabold text-blue-200">
              2
            </div>
            <div className="text-xs leading-relaxed text-slate-400">
              <b>바닥 타일 간격 측정</b> — 그림 아래쪽 바닥의 사각 타일을 봅니다. 가까운 것부터
              순서대로 4칸의 높이(세로 간격)를 각각 측정하세요.
            </div>
          </li>
          <li className="flex gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-extrabold text-blue-200">
              3
            </div>
            <div className="text-xs leading-relaxed text-slate-400">
              <b>천장 격자 간격 측정</b> — 그림 위쪽 천장의 사각 격자(코퍼)를 보세요. 가까운
              것부터 순서대로 4칸의 높이(세로 간격)를 각각 측정해보세요.
            </div>
          </li>
          <li className="flex gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-extrabold text-blue-200">
              4
            </div>
            <div className="text-xs leading-relaxed text-slate-400">
              아래 <b>조화수열 확인기</b>에 측정한 픽셀값을 쉼표로 구분해 입력하면 조화수열
              여부와 각 역수의 공차를 자동으로 계산합니다.
            </div>
          </li>
        </ol>
      </details>

      {/* 조화수열 확인기 */}
      <div className="mt-4 rounded-xl border border-violet-700 bg-[#0d1b2a] px-4 py-3">
        <div className="mb-2 text-sm font-extrabold text-violet-200">🔢 조화수열 확인기</div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <label className="min-w-[200px] text-xs text-violet-300">
            측정값 (쉼표로 구분, 가까운 것부터)
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: 95, 116, 148   또는   2.3, 2.6, 3"
            className="min-w-[200px] flex-1 rounded-md border border-violet-700 bg-[#1e0a3c] px-2.5 py-1.5 text-xs text-violet-100 outline-none focus:border-violet-400"
          />
          <button
            type="button"
            onClick={check}
            className="rounded-md border border-violet-500 bg-[#2e1065] px-4 py-1.5 text-xs font-bold text-violet-200 transition hover:bg-[#3b0764]"
          >
            확인 →
          </button>
        </div>

        {result ? <HarmonicResultBox result={result} /> : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowTile((v) => !v)}
            className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400 transition hover:border-amber-400 hover:text-amber-200"
          >
            💡 타일 힌트
          </button>
          <button
            type="button"
            onClick={() => setShowCeil((v) => !v)}
            className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-400 transition hover:border-amber-400 hover:text-amber-200"
          >
            💡 천장 힌트
          </button>
        </div>

        {showTile ? (
          <div className="mt-2 rounded-md border border-amber-900 bg-[#1c1c04] px-3.5 py-2.5 text-xs leading-relaxed text-amber-200">
            PPT에서 실측한 바닥 타일 높이:{" "}
            <b className="text-amber-300">3 cm → 2.6 cm → 2.3 cm</b> (가까운 것 → 먼 것)
            <br />
            역수: 1/3 ≈ 0.333, 1/2.6 ≈ 0.385, 1/2.3 ≈ 0.435 — 공차 ≈ 0.051 (등차수열 ✅)
            <br />
            조화평균: 2/(1/2.3 + 1/3) ≈ <b>2.604 ≈ 2.6</b>
          </div>
        ) : null}
        {showCeil ? (
          <div className="mt-2 rounded-md border border-amber-900 bg-[#1c1c04] px-3.5 py-2.5 text-xs leading-relaxed text-amber-200">
            PPT에서 실측한 천장 격자 간격:{" "}
            <b className="text-amber-300">7.75 → 9.5 → 11.75 → 15.25 cm</b> (가까운 것 → 먼 것)
            <br />
            역수: 0.129, 0.105, 0.085, 0.066 — 공차 ≈ 0.021 (등차수열 ✅)
            <br />
            조화평균 체크: 2/(1/7.75+1/11.75) ≈ <b>9.34 ≈ 9.5</b> · 2/(1/9.5+1/15.25) ≈{" "}
            <b>11.71 ≈ 11.75</b>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type HarmonicResult =
  | { kind: "error"; msg: string }
  | {
      kind: "ok";
      vals: number[];
      invs: number[];
      diffs: number[];
      avg: number;
      maxDev: number;
      isHarm: boolean;
    };

function HarmonicResultBox({ result }: { result: HarmonicResult }) {
  if (result.kind === "error") {
    return (
      <div className="mt-2 rounded-md border border-rose-700 bg-rose-950 px-3 py-2 text-xs text-rose-200">
        ⚠️ {result.msg}
      </div>
    );
  }
  const { vals, invs, diffs, avg, maxDev, isHarm } = result;
  return (
    <div className="mt-3 rounded-md border border-violet-700 bg-[#1e0a3c] px-3.5 py-2.5 text-xs leading-relaxed text-violet-200">
      <div className="mb-2">
        {isHarm ? (
          <span className="font-extrabold text-emerald-400">
            ✅ 조화수열입니다! (역수의 공차 평균 ≈ {avg.toFixed(5)}, 최대 편차 {maxDev.toFixed(5)})
          </span>
        ) : (
          <span className="font-extrabold text-amber-300">
            ⚠️ 정확한 조화수열은 아닙니다. (공차 평균 ≈ {avg.toFixed(5)}, 최대 편차{" "}
            {maxDev.toFixed(5)})
          </span>
        )}
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="border border-violet-800 bg-[#2e1065] px-2 py-1 text-violet-300">i</th>
            <th className="border border-violet-800 bg-[#2e1065] px-2 py-1 text-violet-300">값</th>
            <th className="border border-violet-800 bg-[#2e1065] px-2 py-1 text-violet-300">역수</th>
            <th className="border border-violet-800 bg-[#2e1065] px-2 py-1 text-violet-300">공차</th>
          </tr>
        </thead>
        <tbody>
          {vals.map((v, i) => (
            <tr key={i} className={i % 2 === 0 ? "" : "bg-[#1a0a2e]"}>
              <td className="border border-[#2e1065] px-2 py-1 text-center text-slate-200">
                {i + 1}
              </td>
              <td className="border border-[#2e1065] px-2 py-1 text-center text-slate-200">
                {v.toFixed(3)}
              </td>
              <td className="border border-[#2e1065] px-2 py-1 text-center text-slate-200">
                {invs[i].toFixed(5)}
              </td>
              <td className="border border-[#2e1065] px-2 py-1 text-center text-slate-200">
                {i > 0 ? `+${diffs[i - 1].toFixed(5)}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 공용 SliderRow ─────────────────────────────────
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[11px] font-bold text-sky-300">
        <span>{label}</span>
        <span className="text-amber-300">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full accent-sky-400"
        aria-label={label}
      />
    </div>
  );
}
