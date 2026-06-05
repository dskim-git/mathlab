"use client";

import { useState, type ReactNode } from "react";

// ─── 인라인 스타일 헬퍼 (원본의 .hl/.ce/.cl/.cf 매핑) ────────
const HL = ({ children }: { children: ReactNode }) => (
  <span className="font-bold text-amber-300">{children}</span>
);
const CE = ({ children }: { children: ReactNode }) => (
  <span className="font-bold text-emerald-300">{children}</span>
);
const CL = ({ children }: { children: ReactNode }) => (
  <span className="font-bold text-cyan-300">{children}</span>
);
const CF = ({ children }: { children: ReactNode }) => (
  <span className="text-slate-500">{children}</span>
);
const Note = ({ children }: { children: ReactNode }) => (
  <div className="mt-1 text-[11px] leading-snug text-slate-500">{children}</div>
);

// ─── SVG 도형 헬퍼 ──────────────────────────────────────────
const W = 340;
const H = 260;

function FullLine({ x1, y1, x2, y2, color, width = 2.5 }: {
  x1: number; y1: number; x2: number; y2: number; color: string; width?: number;
}) {
  // 두 점을 지나는 직선을 viewBox 밖까지 연장 (SVG 가 알아서 클립)
  const dx = x2 - x1;
  const dy = y2 - y1;
  const T = 2000;
  return (
    <line
      x1={x1 - dx * T}
      y1={y1 - dy * T}
      x2={x1 + dx * T}
      y2={y1 + dy * T}
      stroke={color}
      strokeWidth={width}
    />
  );
}

function Dot({ x, y, color, label, lx, ly, lc }: {
  x: number; y: number; color: string; label?: string; lx?: number; ly?: number; lc?: string;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={4} fill={color} stroke="#0f172a" strokeWidth={1} />
      {label ? (
        <text x={lx ?? x + 5} y={ly ?? y - 4} fill={lc ?? color} fontSize={13} fontWeight={700}>
          {label}
        </text>
      ) : null}
    </g>
  );
}

function ToolLabel({ text, x, y, color }: { text: string; x: number; y: number; color: string }) {
  return (
    <text x={x} y={y} fill={color} fontSize={11} fontWeight={700}>
      {text}
    </text>
  );
}

// 공통: 색 토큰
const C_FREE = "#94a3b8"; // 시드(주어진) 점/선
const C_SEED_DARK = "#475569"; // 시드 직선
const C_E1 = "#3b82f6"; // 첫 원 (blue)
const C_E2 = "#a78bfa"; // 두 번째 원 (violet)
const C_E3 = "#f472b6"; // 세 번째 원 (pink)
const C_DOT = "#fbbf24"; // 작도 결과 점 (amber)
const C_FREE_PT = "#7dd3fc"; // 자유 선택 점 (sky)
const C_LINE = "#34d399"; // 결과 직선 (emerald) — 최종 결과 강조

// ─── 도구 ① 수직이등분선 (3E) ────────────────────────────
function Scene0({ step }: { step: number }) {
  const Ax = W * 0.28, Ay = H * 0.62;
  const Bx = W * 0.72, By = H * 0.62;
  const mx = (Ax + Bx) / 2, my = Ay;
  const R = (Bx - Ax) * 0.62;
  const d = Bx - Ax;
  const h = Math.sqrt(R * R - (d / 2) * (d / 2));
  return (
    <>
      {/* 시드: 선분 AB + 점 A·B */}
      <line x1={Ax - 20} y1={Ay} x2={Bx + 20} y2={By} stroke={C_SEED_DARK} strokeWidth={1.5} />
      <Dot x={Ax} y={Ay} color={C_FREE} label="A" lx={Ax - 14} ly={Ay + 4} lc={C_FREE} />
      <Dot x={Bx} y={By} color={C_FREE} label="B" lx={Bx + 6} ly={By + 4} lc={C_FREE} />
      {step >= 1 && (
        <circle cx={Ax} cy={Ay} r={R} fill="none" stroke={C_E1} strokeWidth={1.5} />
      )}
      {step >= 2 && (
        <>
          <circle cx={Bx} cy={By} r={R} fill="none" stroke={C_E2} strokeWidth={1.5} />
          <Dot x={mx} y={my - h} color={C_DOT} label="P" lx={mx + 5} ly={my - h - 4} lc={C_DOT} />
          <Dot x={mx} y={my + h} color={C_DOT} label="Q" lx={mx + 5} ly={my + h + 14} lc={C_DOT} />
        </>
      )}
      {step >= 3 && (
        <>
          <FullLine x1={mx} y1={my - h} x2={mx} y2={my + h} color={C_LINE} />
          <ToolLabel text="수직이등분선" x={mx + 6} y={my - 10} color={C_LINE} />
        </>
      )}
    </>
  );
}

// ─── 도구 ② 수선 — 선 밖의 점 (3E) ─────────────────────
function Scene1({ step }: { step: number }) {
  const lY = H * 0.58;
  const Px = W * 0.58, Py = H * 0.18;
  const Ax = W * 0.22, Ay = lY;
  const rA = Math.hypot(Px - Ax, Py - Ay);
  const Bx = Ax + rA, By = lY;
  const rB = Math.hypot(Px - Bx, Py - By);
  const Ppx = Px;
  const Ppy = 2 * lY - Py;
  return (
    <>
      <line x1={10} y1={lY} x2={W - 10} y2={lY} stroke={C_SEED_DARK} strokeWidth={1.5} />
      <ToolLabel text="ℓ" x={W - 16} y={lY + 4} color={C_FREE} />
      <Dot x={Px} y={Py} color={C_FREE} label="P" lx={Px + 5} ly={Py - 4} lc={C_FREE} />
      {step >= 1 && (
        <>
          <circle cx={Ax} cy={Ay} r={rA} fill="none" stroke={C_E1} strokeWidth={1.5} />
          <Dot x={Ax} y={Ay} color={C_DOT} label="A" lx={Ax - 14} ly={Ay - 6} lc={C_DOT} />
          <Dot x={Bx} y={By} color={C_DOT} label="B" lx={Bx + 5} ly={By - 6} lc={C_DOT} />
        </>
      )}
      {step >= 2 && (
        <>
          <circle cx={Bx} cy={By} r={rB} fill="none" stroke={C_E2} strokeWidth={1.5} />
          {Ppy <= H + 5 && (
            <Dot
              x={Ppx}
              y={Math.min(Ppy, H - 4)}
              color={C_DOT}
              label="P′"
              lx={Ppx + 5}
              ly={Math.min(Ppy + 14, H - 2)}
              lc={C_DOT}
            />
          )}
        </>
      )}
      {step >= 3 && (
        <>
          <FullLine x1={Px} y1={Py} x2={Ppx} y2={Ppy} color={C_LINE} />
          <ToolLabel text="수선" x={Px + 6} y={lY + 18} color={C_LINE} />
        </>
      )}
    </>
  );
}

// ─── 도구 ③ 수선 — 선 위의 점 (탈레스 정리, 3E) ─────────
function Scene2({ step }: { step: number }) {
  const lY = H * 0.7;
  const Px = W * 0.45, Py = lY;
  const Qx = W * 0.28, Qy = H * 0.45;
  const r = Math.hypot(Px - Qx, Py - Qy);
  const Rx = 2 * Qx - Px, Ry = lY;
  const Sx = Px, Sy = 2 * Qy - lY;
  return (
    <>
      <line x1={10} y1={lY} x2={W - 10} y2={lY} stroke={C_SEED_DARK} strokeWidth={1.5} />
      <ToolLabel text="ℓ" x={W - 16} y={lY + 4} color={C_FREE} />
      <Dot x={Px} y={Py} color={C_FREE} label="P" lx={Px + 5} ly={Py + 12} lc={C_FREE} />
      {step >= 1 && (
        <>
          <Dot x={Qx} y={Qy} color={C_FREE_PT} label="Q" lx={Qx - 14} ly={Qy - 2} lc={C_FREE_PT} />
          <circle cx={Qx} cy={Qy} r={r} fill="none" stroke={C_E1} strokeWidth={1.5} />
          <Dot x={Rx} y={Ry} color={C_DOT} label="R" lx={Rx - 14} ly={Ry + 14} lc={C_DOT} />
        </>
      )}
      {step >= 2 && (
        <>
          <FullLine x1={Rx} y1={Ry} x2={Qx} y2={Qy} color={C_E2} width={1.8} />
          <Dot x={Sx} y={Sy} color={C_DOT} label="S" lx={Sx + 5} ly={Sy - 4} lc={C_DOT} />
        </>
      )}
      {step >= 3 && (
        <>
          <FullLine x1={Sx} y1={Sy} x2={Px} y2={Py} color={C_LINE} />
          <ToolLabel text="수선" x={Px + 6} y={lY - 18} color={C_LINE} />
        </>
      )}
    </>
  );
}

// ─── 도구 ④ 각의 이등분선 (4E) ───────────────────────────
function circleIntersectOuter(
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  ref: { x: number; y: number },
  r: number,
): { x: number; y: number } | null {
  const mx = (c1.x + c2.x) / 2, my = (c1.y + c2.y) / 2;
  const dd = Math.hypot(c2.x - c1.x, c2.y - c1.y) / 2;
  if (r <= dd) return null;
  const hh = Math.sqrt(r * r - dd * dd);
  const len = Math.hypot(c2.x - c1.x, c2.y - c1.y);
  const nx = -(c2.y - c1.y) / len;
  const ny = (c2.x - c1.x) / len;
  const p1 = { x: mx + nx * hh, y: my + ny * hh };
  const p2 = { x: mx - nx * hh, y: my - ny * hh };
  const d1 = (p1.x - ref.x) ** 2 + (p1.y - ref.y) ** 2;
  const d2 = (p2.x - ref.x) ** 2 + (p2.y - ref.y) ** 2;
  return d1 > d2 ? p1 : p2;
}

function Scene3({ step }: { step: number }) {
  const O = { x: W * 0.22, y: H * 0.7 };
  const e1 = { x: W * 0.95, y: H * 0.7 };
  const e2 = { x: W * 0.55, y: H * 0.08 };
  const d1 = { x: e1.x - O.x, y: e1.y - O.y };
  const d2 = { x: e2.x - O.x, y: e2.y - O.y };
  const l1 = Math.hypot(d1.x, d1.y), l2 = Math.hypot(d2.x, d2.y);
  const u1 = { x: d1.x / l1, y: d1.y / l1 };
  const u2 = { x: d2.x / l2, y: d2.y / l2 };
  const R0 = W * 0.22;
  const A = { x: O.x + u1.x * R0, y: O.y + u1.y * R0 };
  const B = { x: O.x + u2.x * R0, y: O.y + u2.y * R0 };
  const R2 = R0 * 0.65;
  const P = step >= 3 ? circleIntersectOuter(A, B, O, R2) : null;
  return (
    <>
      <line x1={O.x} y1={O.y} x2={e1.x} y2={e1.y} stroke={C_SEED_DARK} strokeWidth={1.5} />
      <line x1={O.x} y1={O.y} x2={e2.x} y2={e2.y} stroke={C_SEED_DARK} strokeWidth={1.5} />
      <Dot x={O.x} y={O.y} color={C_FREE} label="O" lx={O.x - 16} ly={O.y + 4} lc={C_FREE} />
      {step >= 1 && (
        <>
          <circle cx={O.x} cy={O.y} r={R0} fill="none" stroke={C_E1} strokeWidth={1.5} />
          <Dot x={A.x} y={A.y} color={C_DOT} label="A" lx={A.x + 5} ly={A.y + 4} lc={C_DOT} />
          <Dot x={B.x} y={B.y} color={C_DOT} label="B" lx={B.x - 14} ly={B.y - 4} lc={C_DOT} />
        </>
      )}
      {step >= 2 && (
        <circle cx={A.x} cy={A.y} r={R2} fill="none" stroke={C_E2} strokeWidth={1.5} />
      )}
      {step >= 3 && (
        <>
          <circle cx={B.x} cy={B.y} r={R2} fill="none" stroke={C_E3} strokeWidth={1.5} />
          {P && <Dot x={P.x} y={P.y} color={C_DOT} label="P" lx={P.x + 5} ly={P.y - 4} lc={C_DOT} />}
        </>
      )}
      {step >= 4 && P && (
        <>
          <FullLine x1={O.x} y1={O.y} x2={P.x} y2={P.y} color={C_LINE} />
          {(() => {
            const dv = { x: P.x - O.x, y: P.y - O.y };
            const dl = Math.hypot(dv.x, dv.y);
            return (
              <ToolLabel
                text="이등분선"
                x={O.x + (dv.x / dl) * 80 + 4}
                y={O.y + (dv.y / dl) * 80 - 4}
                color={C_LINE}
              />
            );
          })()}
        </>
      )}
    </>
  );
}

// ─── 도구 ⑤ 평행선 (4E) ────────────────────────────────
function Scene4({ step }: { step: number }) {
  const lY = H * 0.7;
  const Px = W * 0.5, Py = H * 0.25;
  const Qx = W * 0.22, Qy = lY;
  const r = Math.hypot(Px - Qx, Py - Qy);
  const Ax = Qx + r, Ay = lY;
  const Dx = Px + r, Dy = Py;
  return (
    <>
      <line x1={10} y1={lY} x2={W - 10} y2={lY} stroke={C_SEED_DARK} strokeWidth={1.5} />
      <ToolLabel text="ℓ" x={W - 16} y={lY + 4} color={C_FREE} />
      <Dot x={Px} y={Py} color={C_FREE} label="P" lx={Px - 14} ly={Py} lc={C_FREE} />
      {step >= 1 && (
        <>
          <Dot x={Qx} y={Qy} color={C_FREE_PT} label="Q" lx={Qx - 14} ly={Qy + 14} lc={C_FREE_PT} />
          <circle cx={Qx} cy={Qy} r={r} fill="none" stroke={C_E1} strokeWidth={1.5} />
          <Dot x={Ax} y={Ay} color={C_DOT} label="A" lx={Ax + 5} ly={Ay - 6} lc={C_DOT} />
        </>
      )}
      {step >= 2 && (
        <circle cx={Px} cy={Py} r={r} fill="none" stroke={C_E2} strokeWidth={1.5} />
      )}
      {step >= 3 && (
        <>
          <circle cx={Ax} cy={Ay} r={r} fill="none" stroke={C_E3} strokeWidth={1.5} />
          <Dot x={Dx} y={Dy} color={C_DOT} label="D" lx={Dx + 5} ly={Dy - 4} lc={C_DOT} />
        </>
      )}
      {step >= 4 && (
        <>
          <FullLine x1={Px} y1={Py} x2={Dx} y2={Dy} color={C_LINE} />
          <ToolLabel text="평행선" x={(Px + Dx) / 2} y={Py - 10} color={C_LINE} />
        </>
      )}
    </>
  );
}

// ─── 도구 메타 + 단계별 안내 텍스트 ──────────────────────
type Tool = {
  id: string;
  label: string;
  totalE: number;
  Scene: (props: { step: number }) => ReactNode;
  steps: ReactNode[];
};

const TOOLS: Tool[] = [
  {
    id: "perpBisector",
    label: "수직이등분선",
    totalE: 3,
    Scene: Scene0,
    steps: [
      <><HL>① E1</HL> — A를 중심으로, AB 길이보다 긴 반지름의 <CE>원</CE>을 그립니다.</>,
      <><HL>② E2</HL> — B를 중심으로, <b>같은 반지름</b>의 <CE>원</CE>을 그립니다. 두 원의 교점을 P, Q라 합니다.</>,
      <>
        <HL>③ E3</HL> — 교점 P, Q를 잇는 <CL>직선</CL>을 그립니다.
        <div className="mt-2">✅ 이것이 AB의 <b>수직이등분선</b>입니다!</div>
        <div className="mt-2 text-emerald-300">
          <CE>원 2개</CE> + <CL>직선 1개</CL> = <b>3E</b>
        </div>
      </>,
    ],
  },
  {
    id: "perpOutside",
    label: "수선 (선 밖의 점)",
    totalE: 3,
    Scene: Scene1,
    steps: [
      <>
        <CF>점 A를 ℓ 위에 자유롭게 잡습니다 (0E).</CF>
        <div className="mt-2">
          <HL>① E1</HL> — A를 중심으로 반지름 AP인 <CE>원</CE>을 그립니다. ℓ과의 교점(A 기준 반대편)을 B라 합니다.
        </div>
        <Note>원이 ℓ과 만나는 두 점은 A에서 같은 거리에 있습니다.</Note>
      </>,
      <>
        <HL>② E2</HL> — B를 중심으로 반지름 BP인 <CE>원</CE>을 그립니다.
        <div className="mt-1">두 원(A 중심, B 중심)의 교점은 P와 P′입니다.</div>
        <Note>A, B 모두 P와 P′에서 등거리 → A, B가 PP′의 수직이등분선 위에 있음</Note>
      </>,
      <>
        <HL>③ E3</HL> — P와 P′을 잇는 <CL>직선</CL>을 그립니다.
        <div className="mt-2">✅ PP′ ⊥ ℓ</div>
        <div className="mt-2 text-emerald-300">
          <CE>원 2개</CE> + <CL>직선 1개</CL> = <b>3E</b>
        </div>
      </>,
    ],
  },
  {
    id: "perpOnLine",
    label: "수선 (선 위의 점)",
    totalE: 3,
    Scene: Scene2,
    steps: [
      <>
        <CF>직선 밖의 임의의 점 Q를 자유롭게 잡습니다 (0E).</CF>
        <div className="mt-2">
          <HL>① E1</HL> — Q를 중심으로 P를 지나는 <CE>원</CE>을 그립니다. 원이 직선 ℓ과 만나는 다른 점을 R이라 합니다.
        </div>
      </>,
      <>
        <HL>② E2</HL> — R과 Q(원의 중심)를 잇는 <CL>직선</CL>을 그립니다. 이 직선이 원과 만나는 다른 점을 S라 합니다.
        <Note>R과 S는 원의 지름 양 끝점 (QR = QS = 반지름이므로 RS는 지름)</Note>
      </>,
      <>
        <HL>③ E3</HL> — S와 P를 잇는 <CL>직선</CL>을 그립니다.
        <div className="mt-2">✅ SP ⊥ ℓ</div>
        <Note>탈레스 정리: 지름 RS에 대한 원주각 ∠RPS = 90° ∴ SP ⊥ PR, 즉 SP ⊥ ℓ</Note>
        <div className="mt-2 text-emerald-300">
          <CE>원 1개</CE> + <CL>직선 2개</CL> = <b>3E</b>
        </div>
      </>,
    ],
  },
  {
    id: "angleBisector",
    label: "각의 이등분선",
    totalE: 4,
    Scene: Scene3,
    steps: [
      <><HL>① E1</HL> — 꼭짓점 O를 중심으로 <CE>원</CE>을 그립니다. 두 변과의 교점을 A, B라 합니다.</>,
      <><HL>② E2</HL> — A를 중심으로 <CE>원</CE>을 그립니다.</>,
      <><HL>③ E3</HL> — B를 중심으로 <b>같은 반지름</b>의 <CE>원</CE>을 그립니다. 두 원의 교점을 P라 합니다.</>,
      <>
        <HL>④ E4</HL> — O와 P를 잇는 <CL>직선(반직선)</CL>을 그립니다.
        <div className="mt-2">✅ 이것이 <b>각의 이등분선</b>입니다!</div>
        <div className="mt-2 text-emerald-300">
          <CE>원 3개</CE> + <CL>직선 1개</CL> = <b>4E</b>
        </div>
      </>,
    ],
  },
  {
    id: "parallel",
    label: "평행선",
    totalE: 4,
    Scene: Scene4,
    steps: [
      <>
        <CF>ℓ 위의 점 Q를 자유롭게 잡습니다 (0E).</CF>
        <div className="mt-2">
          <HL>① E1</HL> — Q를 중심으로 반지름 QP인 <CE>원</CE>을 그립니다. ℓ과의 교점을 A라 합니다. (QA = QP = r)
        </div>
      </>,
      <><HL>② E2</HL> — P를 중심으로 <b>같은 반지름 r</b>인 <CE>원</CE>을 그립니다.</>,
      <>
        <HL>③ E3</HL> — A를 중심으로 <b>같은 반지름 r</b>인 <CE>원</CE>을 그립니다. 원 P와 원 A의 교점을 D라 합니다.
        <Note>QAPD는 평행사변형: QA ∥ PD이고 |QA|=|PD|=r</Note>
      </>,
      <>
        <HL>④ E4</HL> — P와 D를 잇는 <CL>직선</CL>을 그립니다.
        <div className="mt-2">✅ PD ∥ ℓ</div>
        <div className="mt-2 text-emerald-300">
          <CE>원 3개</CE> + <CL>직선 1개</CL> = <b>4E</b>
        </div>
      </>,
    ],
  },
];

// ─── 메인 컴포넌트 ─────────────────────────────────────────
export default function EuclideaToolSteps() {
  const [activeTool, setActiveTool] = useState(0);
  const [steps, setSteps] = useState<number[]>(() => TOOLS.map(() => 1));

  const tool = TOOLS[activeTool];
  const currentStep = steps[activeTool];
  const maxStep = tool.steps.length;

  function advance(dir: number) {
    setSteps((prev) => {
      const next = [...prev];
      next[activeTool] = Math.max(1, Math.min(maxStep, prev[activeTool] + dir));
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5">
        <h2 className="text-2xl font-bold text-white">📐 작도 도구 — 왜 몇 E일까?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          기본 도구 (선·원) 만으로 자주 쓰는 작도를 어떻게 수행하는지 단계별로 보여드릴게요.
          각 도구가 자·컴퍼스를 <span className="font-semibold text-violet-300">몇 번 사용해야 하는지(E)</span> 직접 확인해 보세요.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {TOOLS.map((t, i) => {
          const on = i === activeTool;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTool(i)}
              className={
                "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-semibold transition " +
                (on
                  ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40"
                  : "bg-slate-900 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
              }
            >
              {t.label}
              <span
                className={
                  "rounded-md border px-1.5 text-[10px] font-extrabold tracking-wide " +
                  (on
                    ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                    : "border-cyan-400/30 bg-slate-950 text-cyan-400")
                }
              >
                {t.totalE}E
              </span>
            </button>
          );
        })}
      </div>

      <section className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
          {/* 캔버스 */}
          <div className="md:max-w-[360px]">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="block w-full rounded-lg border border-white/10 bg-slate-950"
              role="img"
              aria-label={`${tool.label} 작도 단계`}
            >
              <tool.Scene step={currentStep} />
            </svg>
          </div>

          {/* 안내 */}
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              단계 {currentStep} / {maxStep}
            </div>
            <div className="mt-2 min-h-[120px] rounded-lg border border-white/10 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200">
              {tool.steps[currentStep - 1]}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => advance(-1)}
                disabled={currentStep <= 1}
                className="rounded-md border border-white/10 bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-default disabled:opacity-30"
              >
                ◀ 이전
              </button>
              <button
                type="button"
                onClick={() => advance(1)}
                disabled={currentStep >= maxStep}
                className="rounded-md border border-cyan-400/40 bg-cyan-500/20 px-3.5 py-1.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30 disabled:cursor-default disabled:opacity-30"
              >
                다음 ▶
              </button>
              <span className="ml-auto rounded-md border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-xs font-extrabold text-cyan-200">
                총 {tool.totalE}E
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
