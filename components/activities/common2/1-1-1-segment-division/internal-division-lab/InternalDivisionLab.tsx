"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "ratio_effect",
    prompt:
      "수직선 탭에서 m:n 비율을 여러 가지로 바꿔 보며, 내분점 P의 위치가 m과 n에 따라 어떻게 달라지는지(예: m이 커지면 P가 A와 B 중 어느 점에 가까워지는지) 관찰한 것을 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: m이 커질수록 AP가 길어져 P가 B에 가까워졌고, m=n일 때는 P가 정확히 AB의 중점이 되었다.",
  },
  {
    id: "formula_meaning",
    prompt:
      "내분점 공식 x = (m·x₂ + n·x₁) / (m+n) 에서 x₂에는 m이, x₁에는 n이 곱해집니다. 그 이유를 AP : PB = m : n 과 연결지어 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: P가 A에서 먼 쪽(B쪽)으로 m만큼 치우치므로 B의 좌표 x₂에 m의 가중치가 붙고, 반대로 x₁에는 n이 붙어 가까운 쪽일수록 반대편 비율로 가중된다.",
  },
  {
    id: "golden_link",
    prompt:
      "황금비 탭에서 ‘내분비를 피보나치 수로 잡을수록 황금분할점에 가까워진다’는 것을 확인했습니다. 내분(비율로 점을 나누는 것)과 황금비가 어떻게 연결되는지 설명하고, 황금비가 쓰인 실생활 예를 하나 들어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 황금분할점은 AP:PB가 약 1.618:1 이 되는 내분점이고, 피보나치 8:5, 13:8 로 내분하면 그 점에 점점 가까워졌다. 명함이나 신용카드의 가로세로 비가 황금비에 가깝다.",
  },
];

// ─── 공용 유틸 ────────────────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2; // 1.6180339887…
const INV_PHI = 1 / PHI; // 0.6180339887… (A에서 잰 황금분할점 비율)

function fmtNum(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : String(n);
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

/** 정수 분수 num/den 을 기약분수 문자열로. den>0 가정. */
function fractionText(num: number, den: number): string {
  const g = gcd(num, den);
  const nn = num / g;
  const dd = den / g;
  if (dd === 1) return `${fmtNum(nn)}`;
  return `${fmtNum(nn)}/${dd}`;
}

function range(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── 메인 ─────────────────────────────────────────────────────
type Tab = "line" | "golden";

export default function InternalDivisionLab() {
  const [tab, setTab] = useState<Tab>("line");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">📐 선분의 내분과 황금비</h3>
        <p className="mt-2 leading-7 text-slate-300">
          수직선 위에서 선분을 <b className="text-cyan-200">m : n</b> 으로 나누는{" "}
          <b className="text-emerald-200">내분점</b>이 어떻게 정해지는지 직접 조작해 보고,
          그 개념이 <b className="text-amber-200">황금비</b>와 어떻게 이어지는지 탐구해 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "line"} onClick={() => setTab("line")}>
          ① 수직선 위의 내분 (시뮬)
        </TabButton>
        <TabButton active={tab === "golden"} onClick={() => setTab("golden")}>
          ② 내분과 황금비 ✨
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "line" ? <NumberLineDivisionTab /> : null}
        {tab === "golden" ? <GoldenRatioTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
        (active
          ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 탭 ① 수직선 내분 시뮬 ────────────────────────────────────
const NL = {
  MINV: -9,
  MAXV: 9,
  LEFT: 40,
  UNIT: 20,
  LINE_Y: 150,
  VB_W: 440,
  VB_H: 210,
};
function nlX(v: number): number {
  return NL.LEFT + (v - NL.MINV) * NL.UNIT;
}

function NumberLineDivisionTab() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ax, setAx] = useState(-4);
  const [bx, setBx] = useState(8);
  const [m, setM] = useState(3);
  const [n, setN] = useState(1);
  const [dragging, setDragging] = useState<null | "A" | "B">(null);

  useEffect(() => {
    if (!dragging) return;
    function clientToVal(clientX: number): number | null {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const sx = (clientX - rect.left) * (NL.VB_W / rect.width);
      const v = Math.round((sx - NL.LEFT) / NL.UNIT + NL.MINV);
      return clamp(v, NL.MINV, NL.MAXV);
    }
    function move(e: PointerEvent) {
      e.preventDefault();
      const v = clientToVal(e.clientX);
      if (v === null) return;
      if (dragging === "A") setAx(v);
      else setBx(v);
    }
    function up() {
      setDragging(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging]);

  const den = m + n;
  const num = m * bx + n * ax; // = m·x₂ + n·x₁
  const pVal = num / den;
  const isMid = m === n;

  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.06] to-sky-500/[0.04] p-4">
      <p className="text-sm text-slate-300">
        💡 점 <b className="text-cyan-200">A(x₁)</b>·<b className="text-amber-200">B(x₂)</b> 를
        끌고, 아래 슬라이더로 비 <b className="text-white">m : n</b> 을 바꿔 보세요. 선분 AB를 m
        : n 으로 내분하는 점 <b className="text-emerald-200">P</b> 가 어떻게 움직이는지 살펴보세요.
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${NL.VB_W} ${NL.VB_H}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label="수직선 위의 선분의 내분"
        >
          {/* 눈금 */}
          {range(NL.MINV, NL.MAXV).map((v) => (
            <g key={v}>
              <line
                x1={nlX(v)}
                y1={NL.LINE_Y - 5}
                x2={nlX(v)}
                y2={NL.LINE_Y + 5}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1}
              />
              <text
                x={nlX(v)}
                y={NL.LINE_Y + 20}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[9px]"
              >
                {v}
              </text>
            </g>
          ))}

          {/* 축 */}
          <line
            x1={nlX(NL.MINV)}
            y1={NL.LINE_Y}
            x2={nlX(NL.MAXV)}
            y2={NL.LINE_Y}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={2}
          />
          {/* AB 선분 강조 */}
          <line
            x1={nlX(ax)}
            y1={NL.LINE_Y}
            x2={nlX(bx)}
            y2={NL.LINE_Y}
            stroke="#64748b"
            strokeWidth={4}
          />

          {/* AP 호 (m) · PB 호 (n) */}
          <path
            d={`M ${nlX(ax)} ${NL.LINE_Y - 4} Q ${(nlX(ax) + nlX(pVal)) / 2} ${NL.LINE_Y - 32} ${nlX(pVal)} ${NL.LINE_Y - 4}`}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <path
            d={`M ${nlX(pVal)} ${NL.LINE_Y - 4} Q ${(nlX(pVal) + nlX(bx)) / 2} ${NL.LINE_Y - 32} ${nlX(bx)} ${NL.LINE_Y - 4}`}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <text
            x={(nlX(ax) + nlX(pVal)) / 2}
            y={NL.LINE_Y - 36}
            textAnchor="middle"
            className="fill-cyan-200 font-mono text-[13px] font-bold"
          >
            {m}
          </text>
          <text
            x={(nlX(pVal) + nlX(bx)) / 2}
            y={NL.LINE_Y - 36}
            textAnchor="middle"
            className="fill-amber-200 font-mono text-[13px] font-bold"
          >
            {n}
          </text>

          {/* 점 P */}
          <circle
            cx={nlX(pVal)}
            cy={NL.LINE_Y}
            r={6}
            fill="#34d399"
            stroke="#0f172a"
            strokeWidth={2}
            className="animate-pulse"
          />
          <text
            x={nlX(pVal)}
            y={NL.LINE_Y + 34}
            textAnchor="middle"
            className="fill-emerald-200 font-mono text-[10px] font-bold"
          >
            P
          </text>

          {/* 점 A, B (드래그) */}
          <LineDragPoint
            cx={nlX(ax)}
            color="#22d3ee"
            label="A"
            sub={`x₁=${fmtNum(ax)}`}
            onDown={() => setDragging("A")}
          />
          <LineDragPoint
            cx={nlX(bx)}
            color="#fbbf24"
            label="B"
            sub={`x₂=${fmtNum(bx)}`}
            onDown={() => setDragging("B")}
          />
        </svg>
      </div>

      {/* 슬라이더 m, n */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RatioSlider
          label="m (A→P 쪽 비)"
          value={m}
          onChange={setM}
          accent="accent-cyan-400"
          valueClass="text-cyan-200"
        />
        <RatioSlider
          label="n (P→B 쪽 비)"
          value={n}
          onChange={setN}
          accent="accent-amber-400"
          valueClass="text-amber-200"
        />
      </div>

      {/* 유도 패널 */}
      <div className="mt-3 rounded-xl border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-4 py-3">
        <p className="font-mono text-sm text-slate-200">
          AP : PB = <b className="text-cyan-200">{m}</b> :{" "}
          <b className="text-amber-200">{n}</b>
        </p>
        <p className="mt-2 font-mono text-sm text-slate-300">
          x = (m·x₂ + n·x₁) / (m + n) = ({m}·{fmtNum(bx)} + {n}·{fmtNum(ax)}) / ({m} + {n})
        </p>
        <p className="mt-2 font-mono text-sm text-slate-300">
          = {num} / {den} ={" "}
          <b className="text-white">{fractionText(num, den)}</b>{" "}
          <span className="text-slate-400">(≈ {pVal.toFixed(2)})</span>
        </p>
        <p className="mt-2 font-mono text-base font-bold text-emerald-200">
          ∴ 내분점 P의 좌표 = {fractionText(num, den)}
        </p>
        {isMid ? (
          <p className="mt-2 rounded-lg border border-violet-400/40 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-100">
            ✨ m = n 이므로 P는 선분 AB의 <b>중점</b>이에요! (중점 = 1 : 1 내분)
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LineDragPoint({
  cx,
  color,
  label,
  sub,
  onDown,
}: {
  cx: number;
  color: string;
  label: string;
  sub: string;
  onDown: () => void;
}) {
  return (
    <g
      className="cursor-grab touch-none"
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
    >
      <circle cx={cx} cy={NL.LINE_Y} r={16} fill="transparent" />
      <circle cx={cx} cy={NL.LINE_Y} r={7} fill={color} stroke="#0f172a" strokeWidth={2} />
      <text
        x={cx}
        y={NL.LINE_Y - 46}
        textAnchor="middle"
        className="fill-white text-[13px] font-bold"
      >
        {label}
      </text>
      <text
        x={cx}
        y={NL.LINE_Y + 48}
        textAnchor="middle"
        className="fill-slate-300 font-mono text-[10px]"
      >
        {sub}
      </text>
    </g>
  );
}

function RatioSlider({
  label,
  value,
  onChange,
  accent,
  valueClass,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accent: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <span className={"font-mono text-lg font-bold " + valueClass}>{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={9}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className={"mt-1 h-2 w-full cursor-pointer " + accent}
      />
    </div>
  );
}

// ─── 탭 ② 내분과 황금비 ──────────────────────────────────────
function GoldenRatioTab() {
  return (
    <div className="space-y-4">
      {/* 정의 카드 */}
      <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/[0.08] to-yellow-500/[0.04] p-4">
        <p className="text-sm font-bold text-amber-200">✨ 황금비란?</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          선분 AB 위의 점 P가{" "}
          <b className="text-amber-100">
            AB : (긴 쪽) = (긴 쪽) : (짧은 쪽)
          </b>{" "}
          을 만족하도록 나눌 때, 그 비를 <b className="text-amber-100">황금비</b> 라 하고
          기호 φ 로 씁니다.
        </p>
        <p className="mt-2 text-center font-mono text-base font-bold text-amber-100">
          φ = (1 + √5) / 2 ≈ 1.618
        </p>
        <p className="mt-2 text-sm text-slate-300">
          즉 황금분할점은 <b className="text-amber-100">긴 쪽 : 짧은 쪽 = φ : 1</b> 로
          내분한 점이에요. A에서 재면 전체의 약{" "}
          <b className="text-amber-100">0.618</b> 지점이죠.
        </p>
      </div>

      <GoldenChallenge />
      <FibonacciExplorer />

      <GoldenGallery />
    </div>
  );
}

// ── 실생활 갤러리 (카드 클릭 → 황금비 구조 다이어그램) ──
type GalleryItem = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  detail: string;
  diagram: () => React.ReactElement;
};

const GALLERY: GalleryItem[] = [
  {
    id: "card",
    emoji: "🪪",
    title: "신용카드·명함",
    desc: "가로:세로가 약 1.6:1",
    detail:
      "가로와 세로의 비가 황금비(약 1.618:1)에 가까운 ‘황금사각형’이에요. 짧은 변만큼 정사각형을 잘라내도 남는 직사각형이 다시 같은 비율이 되는 성질이 있어요.",
    diagram: CardDiagram,
  },
  {
    id: "parthenon",
    emoji: "🏛️",
    title: "파르테논 신전",
    desc: "정면 비율이 황금비에 가깝다",
    detail:
      "신전 정면을 감싸는 직사각형의 가로:세로가 황금비에 가깝고, 지붕과 기둥의 위치도 황금분할 지점(약 0.618)에 놓였다고 알려져 있어요.",
    diagram: ParthenonDiagram,
  },
  {
    id: "nautilus",
    emoji: "🐚",
    title: "앵무조개 껍데기",
    desc: "황금나선을 닮은 성장",
    detail:
      "껍데기가 자라며 그리는 곡선이 황금사각형에서 만들어지는 ‘황금나선’과 닮았어요. 한 바퀴 돌 때마다 크기가 황금비(φ)배씩 커지는 나선이에요.",
    diagram: NautilusDiagram,
  },
  {
    id: "sunflower",
    emoji: "🌻",
    title: "해바라기 씨",
    desc: "황금각으로 촘촘히 배열",
    detail:
      "씨앗이 바로 앞 씨앗보다 약 137.5°(황금각)씩 돌아가며 배열돼 빈틈없이 촘촘하게 채워져요. 황금각은 한 바퀴(360°)를 황금비로 나눈 각이에요.",
    diagram: SunflowerDiagram,
  },
];

function GoldenGallery() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = GALLERY.find((g) => g.id === openId) ?? null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="text-sm font-bold text-slate-200">
        🌍 우리 주변의 황금비{" "}
        <span className="font-normal text-slate-400">— 카드를 눌러 보세요</span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GALLERY.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setOpenId((cur) => (cur === g.id ? null : g.id))}
            className={
              "rounded-xl border p-2 text-center transition hover:-translate-y-0.5 " +
              (openId === g.id
                ? "border-amber-400/60 bg-amber-400/15 ring-2 ring-amber-300/50"
                : "border-amber-400/20 bg-amber-400/[0.06] hover:bg-amber-400/12")
            }
          >
            <div className="text-2xl">{g.emoji}</div>
            <p className="mt-1 text-xs font-bold text-amber-100">{g.title}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-slate-400">{g.desc}</p>
          </button>
        ))}
      </div>

      {open ? (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-slate-950/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-amber-100">
              {open.emoji} {open.title}
            </p>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              aria-label="닫기"
              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300 hover:bg-white/10"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 flex justify-center">
            <div className="w-full max-w-sm">{open.diagram()}</div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{open.detail}</p>
        </div>
      ) : null}
    </div>
  );
}

// ── 다이어그램: 황금사각형 (카드·명함) ──
function CardDiagram() {
  const x0 = 22;
  const y0 = 28;
  const W = 216;
  const H = Math.round(W / PHI); // ≈134
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  const splits: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let rx = x0;
  let ry = y0;
  let rw = W;
  let rh = H;
  for (let k = 0; k < 6; k++) {
    rects.push({ x: rx, y: ry, w: rw, h: rh });
    if (rw >= rh) {
      const s = rh;
      splits.push({ x1: rx + s, y1: ry, x2: rx + s, y2: ry + rh });
      rx += s;
      rw -= s;
    } else {
      const s = rw;
      splits.push({ x1: rx, y1: ry + s, x2: rx + rw, y2: ry + s });
      ry += s;
      rh -= s;
    }
    if (rw < 3 || rh < 3) break;
  }
  return (
    <svg viewBox="0 0 260 184" className="w-full" role="img" aria-label="황금사각형 도해">
      <rect x={x0} y={y0} width={H} height={H} fill="rgba(251,191,36,0.10)" />
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={i === 0 ? 2 : 1}
          strokeOpacity={Math.max(0.3, 1 - i * 0.13)}
        />
      ))}
      {splits.map((s, i) => (
        <line
          key={i}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="#fbbf24"
          strokeWidth={1}
          strokeOpacity={0.45}
        />
      ))}
      <text
        x={x0 + W / 2}
        y={y0 - 10}
        textAnchor="middle"
        className="fill-amber-200 font-mono text-[11px] font-bold"
      >
        1.618
      </text>
      <text
        x={x0 - 10}
        y={y0 + H / 2}
        textAnchor="middle"
        transform={`rotate(-90 ${x0 - 10} ${y0 + H / 2})`}
        className="fill-amber-200 font-mono text-[11px] font-bold"
      >
        1
      </text>
      <text
        x={x0 + H / 2}
        y={y0 + H / 2 + 4}
        textAnchor="middle"
        className="fill-amber-100/70 text-[9px]"
      >
        정사각형
      </text>
    </svg>
  );
}

// ── 다이어그램: 파르테논 신전 (황금틀) ──
function ParthenonDiagram() {
  const cols = [42, 74, 106, 138, 170, 202];
  return (
    <svg viewBox="0 0 260 180" className="w-full" role="img" aria-label="파르테논 신전 황금비 도해">
      {/* 기단 */}
      <rect x={30} y={140} width={200} height={12} fill="#64748b" />
      {/* 기둥 */}
      {cols.map((cx) => (
        <rect key={cx} x={cx - 5} y={98} width={10} height={42} fill="#94a3b8" />
      ))}
      {/* 엔타블러처 */}
      <rect x={32} y={88} width={196} height={10} fill="#cbd5e1" />
      {/* 페디먼트(삼각지붕) */}
      <path d="M 32 88 L 130 52 L 228 88 Z" fill="#e2e8f0" />
      {/* 황금 직사각형 틀 */}
      <rect
        x={30}
        y={52}
        width={200}
        height={100}
        fill="none"
        stroke="#facc15"
        strokeWidth={2}
        strokeDasharray="5 3"
      />
      {/* 황금분할 세로선 (0.618) */}
      <line
        x1={30 + Math.round(0.618 * 200)}
        y1={52}
        x2={30 + Math.round(0.618 * 200)}
        y2={152}
        stroke="#facc15"
        strokeWidth={1.5}
        strokeDasharray="3 3"
        strokeOpacity={0.7}
      />
      <text x={130} y={44} textAnchor="middle" className="fill-yellow-300 font-mono text-[10px] font-bold">
        가로 : 세로 ≈ 1.618 : 1
      </text>
    </svg>
  );
}

// ── 다이어그램: 앵무조개 (황금나선) ──
function NautilusDiagram() {
  const cx = 150;
  const cy = 72;
  const pts: string[] = [];
  for (let i = 0; i <= 90; i++) {
    const ang = i * 0.18; // rad
    const r = 2.4 * Math.pow(PHI, ang / (Math.PI / 2));
    if (r > 120) break;
    const x = cx - r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const d = "M " + pts.join(" L ");
  return (
    <svg viewBox="0 0 240 190" className="w-full" role="img" aria-label="황금나선 도해">
      <path d={d} fill="none" stroke="#fbbf24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={2.5} fill="#facc15" />
      <text x={120} y={182} textAnchor="middle" className="fill-amber-200 text-[10px] font-bold">
        한 바퀴마다 크기가 φ배씩 커지는 황금나선
      </text>
    </svg>
  );
}

// ── 다이어그램: 해바라기 씨 (황금각 137.5°) ──
function SunflowerDiagram() {
  const cx = 100;
  const cy = 96;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈2.39996 rad = 137.5°
  const dots: { x: number; y: number; r: number; fill: string }[] = [];
  const N = 150;
  for (let i = 1; i <= N; i++) {
    const ang = i * GOLDEN_ANGLE;
    const rad = 6.4 * Math.sqrt(i);
    const x = cx + rad * Math.cos(ang);
    const y = cy + rad * Math.sin(ang);
    const t = i / N;
    const g = Math.round(191 - t * 120);
    dots.push({ x, y, r: 2.6, fill: `rgb(251, ${g}, 36)` });
  }
  return (
    <svg viewBox="0 0 200 200" className="w-full" role="img" aria-label="해바라기 황금각 배열 도해">
      {dots.map((dpt, i) => (
        <circle key={i} cx={dpt.x} cy={dpt.y} r={dpt.r} fill={dpt.fill} />
      ))}
      <text x={100} y={193} textAnchor="middle" className="fill-amber-200 text-[10px] font-bold">
        황금각 137.5°씩 돌며 촘촘히 배열
      </text>
    </svg>
  );
}

// ── 황금분할 눈대중 챌린지 ──
type Round = { emoji: string; name: string; barW: number };
const ROUNDS: Round[] = [
  { emoji: "📏", name: "직선", barW: 320 },
  { emoji: "🪪", name: "명함 카드", barW: 280 },
  { emoji: "🖼️", name: "미술 액자", barW: 300 },
];

function accuracyOf(t: number): number {
  return Math.max(0, Math.round(100 - Math.abs(t - INV_PHI) * 250));
}

function GoldenChallenge() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [t, setT] = useState(0.5);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);

  const finished = roundIdx >= ROUNDS.length;
  const round = finished ? ROUNDS[ROUNDS.length - 1] : ROUNDS[roundIdx];
  const barX0 = 40;
  const barW = round.barW;
  const VB_W = barW + 80;
  const VB_H = 100;
  const barY = 46;

  useEffect(() => {
    if (!dragging || revealed) return;
    function clientToT(clientX: number): number | null {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const sx = (clientX - rect.left) * (VB_W / rect.width);
      return clamp((sx - barX0) / barW, 0, 1);
    }
    function move(e: PointerEvent) {
      e.preventDefault();
      const nt = clientToT(e.clientX);
      if (nt !== null) setT(nt);
    }
    function up() {
      setDragging(false);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, revealed, VB_W, barW]);

  if (finished) {
    const avg =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    return (
      <div className="rounded-2xl border-2 border-amber-400/45 bg-gradient-to-br from-amber-500/15 to-yellow-500/10 p-5 text-center">
        <p className="text-3xl">👑</p>
        <p className="mt-2 text-xl font-extrabold text-amber-100">챌린지 완료!</p>
        <p className="mt-2 font-mono text-lg font-bold text-amber-100">
          평균 정확도: {avg}%
        </p>
        <p className="mt-3 text-sm text-amber-50/90">
          눈으로 찾은 ‘가장 아름다운 분할’이 바로 황금분할(약 0.618 지점)에 가까웠나요? 이제 이
          점을 내분비로 정확히 만들어 봅시다. ↓
        </p>
        <button
          type="button"
          onClick={() => {
            setRoundIdx(0);
            setScores([]);
            setT(0.5);
            setRevealed(false);
          }}
          className="mt-4 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 다시 도전
        </button>
      </div>
    );
  }

  const guessX = barX0 + t * barW;
  const goldX = barX0 + INV_PHI * barW;
  const acc = accuracyOf(t);
  const longPct = Math.round(t * 100);
  const shortPct = 100 - longPct;

  function handleCheck() {
    setRevealed(true);
    setScores((s) => [...s, acc]);
  }
  function handleNext() {
    setRoundIdx((i) => i + 1);
    setT(0.5);
    setRevealed(false);
  }

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-amber-200">
          🎯 황금분할 눈대중 챌린지 · {roundIdx + 1} / {ROUNDS.length}
        </p>
        <span className="rounded-full border border-amber-400/45 bg-amber-400/15 px-3 py-1 font-mono text-xs font-bold text-amber-100">
          {round.emoji} {round.name}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-300">
        선을 끌어 <b className="text-amber-100">가장 보기 좋게 나뉜다고 생각하는 지점</b> 에
        놓아 보세요. 어디가 가장 균형 있고 아름다워 보이나요?
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label="황금분할 챌린지 막대"
        >
          {/* 막대 (A~B) */}
          <line x1={barX0} y1={barY} x2={barX0 + barW} y2={barY} stroke="#475569" strokeWidth={10} strokeLinecap="round" />
          {/* 긴 쪽 / 짧은 쪽 색칠 */}
          <line x1={barX0} y1={barY} x2={guessX} y2={barY} stroke="#22d3ee" strokeWidth={10} strokeLinecap="round" />
          <line x1={guessX} y1={barY} x2={barX0 + barW} y2={barY} stroke="#fbbf24" strokeWidth={10} strokeLinecap="round" />

          {/* 끝점 A, B */}
          <text x={barX0} y={barY - 14} textAnchor="middle" className="fill-slate-300 text-[11px] font-bold">A</text>
          <text x={barX0 + barW} y={barY - 14} textAnchor="middle" className="fill-slate-300 text-[11px] font-bold">B</text>

          {/* 황금점 (공개 시) */}
          {revealed ? (
            <g>
              <line x1={goldX} y1={barY - 24} x2={goldX} y2={barY + 24} stroke="#facc15" strokeWidth={2} strokeDasharray="4 3" />
              <text x={goldX} y={barY + 38} textAnchor="middle" className="fill-yellow-300 font-mono text-[10px] font-bold">
                황금점 0.618
              </text>
            </g>
          ) : null}

          {/* 내 추측 선 (드래그 핸들) */}
          <g
            className="cursor-grab touch-none"
            onPointerDown={(e) => {
              if (revealed) return;
              e.preventDefault();
              setDragging(true);
            }}
          >
            <rect x={guessX - 10} y={barY - 26} width={20} height={52} fill="transparent" />
            <line x1={guessX} y1={barY - 22} x2={guessX} y2={barY + 22} stroke="#f8fafc" strokeWidth={2} />
            <circle cx={guessX} cy={barY} r={7} fill="#f8fafc" stroke="#0f172a" strokeWidth={2} />
          </g>
        </svg>
      </div>

      {/* 비율 표시 */}
      <p className="mt-2 text-center font-mono text-xs text-slate-400">
        지금 나눈 비 — 긴 쪽 : 짧은 쪽 ={" "}
        <b className="text-cyan-200">{longPct}</b> :{" "}
        <b className="text-amber-200">{shortPct}</b>
      </p>

      {revealed ? (
        <div className="mt-2 rounded-xl border-2 border-amber-400/50 bg-amber-400/10 px-4 py-3 text-center">
          <p className="font-mono text-base font-bold text-amber-100">정확도 {acc}%</p>
          <p className="mt-1 text-sm text-amber-50">
            {acc >= 95
              ? "👑 완벽에 가까워요! 황금비를 보는 눈이 대단하네요."
              : acc >= 80
                ? "✨ 훌륭해요! 눈대중이 아주 정확합니다."
                : acc >= 60
                  ? "🙂 좋아요! 황금점에 꽤 가까웠어요."
                  : "💪 황금점은 A에서 약 0.618 지점! 다음엔 더 가까이."}
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex justify-center">
        {!revealed ? (
          <button
            type="button"
            onClick={handleCheck}
            className="rounded-xl border-2 border-amber-400/55 bg-amber-400/15 px-6 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-400/25"
          >
            확인! ✨
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-6 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
          >
            {roundIdx + 1 < ROUNDS.length ? "다음 →" : "결과 보기 👑"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── 피보나치 → 황금비 근사 (내분 연결) ──
const FIB_PAIRS: [number, number][] = [
  [2, 1],
  [3, 2],
  [5, 3],
  [8, 5],
  [13, 8],
  [21, 13],
];

function FibonacciExplorer() {
  const [sel, setSel] = useState(3); // 8:5
  const [m, n] = FIB_PAIRS[sel];
  const t = m / (m + n); // A에서 잰 내분점 위치
  const ratio = m / n; // m:n = 긴쪽:짧은쪽 → φ 근사
  const barX0 = 30;
  const barW = 300;
  const VB_W = barW + 60;
  const VB_H = 84;
  const barY = 40;
  const markX = barX0 + t * barW;
  const goldX = barX0 + INV_PHI * barW;

  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-slate-900/40 p-4">
      <p className="text-sm font-bold text-cyan-200">🔗 내분비를 피보나치 수로 잡으면?</p>
      <p className="mt-2 text-sm text-slate-300">
        선분을 <b className="text-white">m : n</b> 으로 내분할 때 m, n 을{" "}
        <b className="text-cyan-100">피보나치 수</b>(1, 2, 3, 5, 8, 13, 21…) 로 고르면, 내분점이
        황금분할점(노란 점선)에 <b className="text-amber-100">점점 가까워집니다.</b>
      </p>

      {/* 피보나치 비 버튼 */}
      <div className="mt-3 flex flex-wrap gap-2">
        {FIB_PAIRS.map(([mm, nn], i) => (
          <button
            key={`${mm}-${nn}`}
            type="button"
            onClick={() => setSel(i)}
            className={
              "rounded-lg border-2 px-3 py-1 font-mono text-sm font-bold transition " +
              (i === sel
                ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {mm}:{nn}
          </button>
        ))}
      </div>

      {/* 내분점 막대 */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full select-none" role="img" aria-label="피보나치 내분점">
          <line x1={barX0} y1={barY} x2={markX} y2={barY} stroke="#22d3ee" strokeWidth={9} strokeLinecap="round" />
          <line x1={markX} y1={barY} x2={barX0 + barW} y2={barY} stroke="#fbbf24" strokeWidth={9} strokeLinecap="round" />
          <text x={barX0} y={barY - 12} textAnchor="middle" className="fill-slate-300 text-[10px] font-bold">A</text>
          <text x={barX0 + barW} y={barY - 12} textAnchor="middle" className="fill-slate-300 text-[10px] font-bold">B</text>
          {/* 황금점 기준선 */}
          <line x1={goldX} y1={barY - 20} x2={goldX} y2={barY + 20} stroke="#facc15" strokeWidth={2} strokeDasharray="4 3" />
          <text x={goldX} y={barY + 32} textAnchor="middle" className="fill-yellow-300 font-mono text-[9px] font-bold">황금점</text>
          {/* 내분점 */}
          <circle cx={markX} cy={barY} r={6} fill="#f8fafc" stroke="#0f172a" strokeWidth={2} />
          <text x={markX} y={barY - 12} textAnchor="middle" className="fill-white font-mono text-[9px] font-bold">P</text>
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
        <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-2 text-center">
          <p className="text-[11px] text-slate-400">m / n</p>
          <p className="text-lg font-bold text-cyan-100">{ratio.toFixed(4)}</p>
        </div>
        <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.06] px-3 py-2 text-center">
          <p className="text-[11px] text-slate-400">황금비 φ 와의 차</p>
          <p className="text-lg font-bold text-amber-100">{Math.abs(ratio - PHI).toFixed(4)}</p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        φ ≈ {PHI.toFixed(4)} · 큰 피보나치 수일수록 m/n 이 φ 에 수렴해요.
      </p>
    </div>
  );
}
