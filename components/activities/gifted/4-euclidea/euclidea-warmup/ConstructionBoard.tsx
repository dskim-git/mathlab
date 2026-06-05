"use client";

import { useMemo, useState } from "react";

// ─── 기하 모델 ────────────────────────────────────────────────
export type Pt = {
  id: string;
  x: number;
  y: number;
  given?: boolean;
  label?: string;
  /** 학생에게 표시하지 않음 (정답 검증용 좌표 보관). 클릭 불가. */
  hidden?: boolean;
};
export type Ln = { id: string; a: string; b: string }; // 두 점 ID 로 정의된 무한 직선
export type Cr = { id: string; center: string; through: string }; // 중심 + 원 위 한 점

export type Seed = { points: Pt[]; lines: Ln[]; circles: Cr[] };

const EPS = 1.5; // 동일 점 판정 픽셀 임계
type V = { x: number; y: number };

function distance(p: V, q: V) {
  return Math.hypot(p.x - q.x, p.y - q.y);
}

// ─── 교점 계산 ────────────────────────────────────────────────
function lineLine(p1: V, p2: V, p3: V, p4: V): V | null {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;
  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
  return { x: p1.x + t * dx1, y: p1.y + t * dy1 };
}

function lineCircle(p1: V, p2: V, c: V, r: number): V[] {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - c.x;
  const fy = p1.y - c.y;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const cc = fx * fx + fy * fy - r * r;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return [];
  const sd = Math.sqrt(disc);
  const t1 = (-b - sd) / (2 * a);
  const t2 = (-b + sd) / (2 * a);
  const out: V[] = [{ x: p1.x + t1 * dx, y: p1.y + t1 * dy }];
  if (disc > 1e-9) out.push({ x: p1.x + t2 * dx, y: p1.y + t2 * dy });
  return out;
}

function circleCircle(c1: V, r1: number, c2: V, r2: number): V[] {
  const d = distance(c1, c2);
  if (d < 1e-9) return [];
  if (d > r1 + r2 + 1e-6) return [];
  if (d < Math.abs(r1 - r2) - 1e-6) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const hsq = r1 * r1 - a * a;
  const h = hsq < 0 ? 0 : Math.sqrt(hsq);
  const px = c1.x + (a * (c2.x - c1.x)) / d;
  const py = c1.y + (a * (c2.y - c1.y)) / d;
  const ex = (-(c2.y - c1.y) * h) / d;
  const ey = ((c2.x - c1.x) * h) / d;
  const out: V[] = [{ x: px + ex, y: py + ey }];
  if (h > 1e-9) out.push({ x: px - ex, y: py - ey });
  return out;
}

// ─── 보드 상태 ────────────────────────────────────────────────
type Tool =
  | "point"
  | "line"
  | "circle"
  | "perpBisector"
  | "perpLine"
  | "parallel"
  | "angleBisector"
  | "pan";

// 3점 입력이 필요한 도구 — 직선 정의 2점 + 추가 1점.
function inputCount(tool: Tool): number {
  if (tool === "perpLine" || tool === "parallel" || tool === "angleBisector") return 3;
  if (tool === "point" || tool === "pan") return 0; // SVG/마우스 핸들러가 처리
  return 2;
}

// 빈 공간/도형 위 클릭으로 점을 추가하기 위한 보조 — 가까운 객체로 snap
const SNAP_PX = 10;

function projectOnLine(v: V, p1: V, p2: V): V {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) return { x: p1.x, y: p1.y };
  const t = ((v.x - p1.x) * dx + (v.y - p1.y) * dy) / len2;
  return { x: p1.x + t * dx, y: p1.y + t * dy };
}

function projectOnCircle(v: V, c: V, r: number): V {
  const dx = v.x - c.x;
  const dy = v.y - c.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: c.x + (dx / len) * r, y: c.y + (dy / len) * r };
}

type Board = {
  points: Pt[];
  lines: Ln[];
  circles: Cr[];
  /** 학생이 도구를 사용한 동작의 총 횟수 (E 값). */
  events: number;
};

function nextId(prefix: string, taken: Set<string>) {
  let i = 1;
  while (taken.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}

// 점 중복 제거: 기존과 EPS 내면 기존 ID 반환, 아니면 새 점 등록.
// hidden 점은 매칭에서 제외 — 학생 작도가 그것에 흡수되면 검증/클릭이 막힘.
function addPoint(board: Board, v: V): { board: Board; id: string } {
  for (const p of board.points) {
    if (p.hidden) continue;
    if (distance(p, v) < EPS) return { board, id: p.id };
  }
  const id = nextId("P", new Set(board.points.map((p) => p.id)));
  return {
    board: { ...board, points: [...board.points, { id, x: v.x, y: v.y }] },
    id,
  };
}

// 새 직선/원에 대해 기존 모든 객체와의 교점을 점으로 등록
function addIntersections(
  board: Board,
  kind: "line" | "circle",
  a: V,
  b: V,
): Board {
  let cur = board;
  // 기존 직선과 교차
  for (const ln of board.lines) {
    const lp1 = board.points.find((p) => p.id === ln.a)!;
    const lp2 = board.points.find((p) => p.id === ln.b)!;
    if (kind === "line") {
      const pt = lineLine(a, b, lp1, lp2);
      if (pt) cur = addPoint(cur, pt).board;
    } else {
      const r = distance(a, b);
      for (const pt of lineCircle(lp1, lp2, a, r)) cur = addPoint(cur, pt).board;
    }
  }
  // 기존 원과 교차
  for (const cr of board.circles) {
    const cc = board.points.find((p) => p.id === cr.center)!;
    const ct = board.points.find((p) => p.id === cr.through)!;
    const r2 = distance(cc, ct);
    if (kind === "line") {
      for (const pt of lineCircle(a, b, cc, r2)) cur = addPoint(cur, pt).board;
    } else {
      const r1 = distance(a, b);
      for (const pt of circleCircle(a, r1, cc, r2)) cur = addPoint(cur, pt).board;
    }
  }
  return cur;
}

// ─── 컴포넌트 ─────────────────────────────────────────────────
type Props = {
  seed: Seed;
  width?: number;
  height?: number;
  /** 작도가 갱신될 때마다 호출 — 정답 검증용. */
  onChange?: (board: Board) => void;
  /** 상단 정답 상태 배지. */
  solvedBadge?: React.ReactNode;
  /** 허용 도구 — 기본 ["line","circle"]. 예: 컴퍼스 전용이면 ["circle"]. */
  allowedTools?: Tool[];
};

export default function ConstructionBoard({
  seed,
  width = 640,
  height = 420,
  onChange,
  solvedBadge,
  allowedTools = ["line", "circle"],
}: Props) {
  const initial: Board = useMemo(
    () => ({
      points: seed.points.map((p) => ({ ...p, given: true })),
      lines: [...seed.lines],
      circles: [...seed.circles],
      events: 0,
    }),
    [seed],
  );

  const [board, setBoard] = useState<Board>(initial);
  const [history, setHistory] = useState<Board[]>([]);
  const [tool, setTool] = useState<Tool>(allowedTools[0] ?? "line");
  const [pending, setPending] = useState<string[]>([]); // 선택된 점 ID 큐
  const [hover, setHover] = useState<string | null>(null);
  // 손바닥 도구로 작도판을 이동했을 때의 viewBox 오프셋.
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [panDrag, setPanDrag] = useState<
    | { startX: number; startY: number; baseX: number; baseY: number; rect: DOMRect }
    | null
  >(null);

  // board 변경 커밋 — 이전 board 를 history 에 push 후 새 board 적용.
  function commit(next: Board) {
    if (next === board) return;
    setHistory((h) => [...h, board]);
    setBoard(next);
    onChange?.(next);
  }

  function undo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setBoard(prev);
      onChange?.(prev);
      setPending([]);
      return h.slice(0, -1);
    });
  }

  function clearAll() {
    setHistory((h) => (board === initial ? h : [...h, board]));
    setBoard(initial);
    setPending([]);
    onChange?.(initial);
  }

  function reset() {
    setBoard(initial);
    setHistory([]);
    setPending([]);
    setHover(null);
    setViewOffset({ x: 0, y: 0 });
  }

  // 가까운 객체(직선/원) 위로 좌표 snap — 임계 SNAP_PX 안이면 객체 위로 끌어당김
  function snapToObjects(v: V): V {
    let bestD = SNAP_PX;
    let snapped: V = v;
    for (const ln of board.lines) {
      const lp1 = board.points.find((p) => p.id === ln.a)!;
      const lp2 = board.points.find((p) => p.id === ln.b)!;
      const proj = projectOnLine(v, lp1, lp2);
      const d = distance(v, proj);
      if (d < bestD) {
        bestD = d;
        snapped = proj;
      }
    }
    for (const cr of board.circles) {
      const cc = board.points.find((p) => p.id === cr.center)!;
      const ct = board.points.find((p) => p.id === cr.through)!;
      const r = distance(cc, ct);
      const proj = projectOnCircle(v, cc, r);
      const d = distance(v, proj);
      if (d < bestD) {
        bestD = d;
        snapped = proj;
      }
    }
    return snapped;
  }

  // 점 도구: SVG 빈 공간 또는 도형 위 클릭으로 점 추가 (0L 0E)
  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (tool !== "point") return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const t = pt.matrixTransform(ctm.inverse());
    const snapped = snapToObjects({ x: t.x, y: t.y });
    if (snapped.x < 0 || snapped.x > width || snapped.y < 0 || snapped.y > height) return;
    const { board: nb } = addPoint(board, snapped);
    if (nb === board) return; // 기존 점과 EPS 내라 변화 없음
    commit(nb);
  }

  function pickPoint(id: string) {
    if (tool === "point") return; // 점 도구 활성 시 점 클릭은 무시 (svg 핸들러가 처리)
    const p = board.points.find((pp) => pp.id === id);
    if (!p || p.hidden) return; // 숨김 점은 선택 불가
    const nextPending = [...pending, id];
    const needed = inputCount(tool);
    if (nextPending.length < needed) {
      setPending(nextPending);
      return;
    }
    // 중복 입력 방지 (같은 점 두 번)
    if (new Set(nextPending).size !== nextPending.length) {
      setPending([]);
      return;
    }
    const [a, b, c] = nextPending;
    const pa = board.points.find((p) => p.id === a)!;
    const pb = board.points.find((p) => p.id === b)!;
    const pc = c ? board.points.find((p) => p.id === c)! : null;
    let newBoard: Board = board;
    if (tool === "line") {
      // 동일 직선 중복 방지
      const dup = board.lines.some(
        (l) => (l.a === a && l.b === b) || (l.a === b && l.b === a),
      );
      if (!dup) {
        const lid = nextId("L", new Set(board.lines.map((l) => l.id)));
        newBoard = {
          ...board,
          lines: [...board.lines, { id: lid, a, b }],
          events: board.events + 1, // 선 도구 = 1E
        };
        newBoard = addIntersections(newBoard, "line", pa, pb);
      }
    } else if (tool === "circle") {
      const dup = board.circles.some(
        (c) => c.center === a && c.through === b,
      );
      if (!dup) {
        const cid = nextId("C", new Set(board.circles.map((c) => c.id)));
        newBoard = {
          ...board,
          circles: [...board.circles, { id: cid, center: a, through: b }],
          events: board.events + 1, // 원 도구 = 1E
        };
        newBoard = addIntersections(newBoard, "circle", pa, pb);
      }
    } else if (tool === "perpBisector") {
      // 수직이등분선 도구 (1L 3E): PQ 중점을 지나고 PQ 에 수직인 직선 1개를 결과로.
      // 내부적으로 두 hidden 점 M, N 으로 line(M, N) 등록. M·N 은 보이지 않지만 line 표시는 됨.
      const M = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const N = { x: M.x + nx * 100, y: M.y + ny * 100 };
      const idTaken = new Set(board.points.map((p) => p.id));
      const mId = nextId("M", idTaken);
      idTaken.add(mId);
      const nId = nextId("N", idTaken);
      const lid = nextId("L", new Set(board.lines.map((l) => l.id)));
      newBoard = {
        ...board,
        points: [
          ...board.points,
          { id: mId, x: M.x, y: M.y, hidden: true },
          { id: nId, x: N.x, y: N.y, hidden: true },
        ],
        lines: [...board.lines, { id: lid, a: mId, b: nId }],
        events: board.events + 3, // 수직이등분선 도구 = 3E
      };
      newBoard = addIntersections(newBoard, "line", M, N);
    } else if (tool === "perpLine" && pc) {
      // 수선 도구 (1L 3E): 직선 ab 위 두 점 + 평면 위 점 c → c 를 지나고 ab 에 수직인 직선.
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const M = { x: pc.x, y: pc.y };
      const N = { x: pc.x + nx * 100, y: pc.y + ny * 100 };
      const idTaken = new Set(board.points.map((p) => p.id));
      const nId = nextId("N", idTaken);
      const lid = nextId("L", new Set(board.lines.map((l) => l.id)));
      newBoard = {
        ...board,
        points: [...board.points, { id: nId, x: N.x, y: N.y, hidden: true }],
        // 직선 = c (visible) + N (hidden) — c 가 visible 이라 후속 작도에 재사용 가능
        lines: [...board.lines, { id: lid, a: c, b: nId }],
        events: board.events + 3, // 수선 도구 = 3E
      };
      newBoard = addIntersections(newBoard, "line", M, N);
    } else if (tool === "parallel" && pc) {
      // 평행선 도구 (1L 4E): 직선 ab 위 두 점 + 평면 위 점 c → c 를 지나고 ab 와 평행한 직선.
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const M = { x: pc.x, y: pc.y };
      const N = { x: pc.x + ux * 100, y: pc.y + uy * 100 };
      const idTaken = new Set(board.points.map((p) => p.id));
      const nId = nextId("N", idTaken);
      const lid = nextId("L", new Set(board.lines.map((l) => l.id)));
      newBoard = {
        ...board,
        points: [...board.points, { id: nId, x: N.x, y: N.y, hidden: true }],
        lines: [...board.lines, { id: lid, a: c, b: nId }],
        events: board.events + 4, // 평행선 도구 = 4E
      };
      newBoard = addIntersections(newBoard, "line", M, N);
    } else if (tool === "angleBisector" && pc) {
      // 각의 이등분선 도구 (1L 4E): 꼭짓점 a, 변 위 점 b, 다른 변 위 점 c → 각 bac 의 이등분선.
      const dxA = pb.x - pa.x;
      const dyA = pb.y - pa.y;
      const dxB = pc.x - pa.x;
      const dyB = pc.y - pa.y;
      const lenA = Math.hypot(dxA, dyA) || 1;
      const lenB = Math.hypot(dxB, dyB) || 1;
      const ux = dxA / lenA + dxB / lenB;
      const uy = dyA / lenA + dyB / lenB;
      // 두 단위벡터가 정반대(180°) 면 합이 0 — 이등분선 미정. 안전상 무시.
      if (Math.hypot(ux, uy) > 1e-6) {
        const M = { x: pa.x, y: pa.y };
        const N = { x: pa.x + ux * 100, y: pa.y + uy * 100 };
        const idTaken = new Set(board.points.map((p) => p.id));
        const nId = nextId("N", idTaken);
        const lid = nextId("L", new Set(board.lines.map((l) => l.id)));
        newBoard = {
          ...board,
          points: [...board.points, { id: nId, x: N.x, y: N.y, hidden: true }],
          lines: [...board.lines, { id: lid, a, b: nId }],
          events: board.events + 4, // 각 이등분선 도구 = 4E
        };
        newBoard = addIntersections(newBoard, "line", M, N);
      }
    }
    commit(newBoard);
    setPending([]);
  }

  // 직선을 viewBox 끝까지 연장한 두 끝점 계산
  function lineSegment(a: V, b: V): { x1: number; y1: number; x2: number; y2: number } {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // 매우 큰 t 로 양쪽 연장
    const T = Math.max(width, height) * 4;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return {
      x1: a.x - ux * T,
      y1: a.y - uy * T,
      x2: a.x + ux * T,
      y2: a.y + uy * T,
    };
  }

  // L = 학생이 작도한 결과 도형(선+원) 총 개수, E = 학생이 사용한 도구 동작 수.
  const lCount =
    board.lines.length - seed.lines.length + (board.circles.length - seed.circles.length);
  const eCount = board.events;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {allowedTools.includes("point") ? (
          <button
            type="button"
            onClick={() => {
              setTool("point");
              setPending([]);
            }}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition " +
              (tool === "point"
                ? "bg-amber-500/25 text-amber-200 ring-1 ring-amber-400/50"
                : "bg-slate-800 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
            }
            title="점 찍기: 빈 공간 또는 도형 위 (0L 0E)"
          >
            📍 점
          </button>
        ) : null}
        {allowedTools.includes("line") ? (
          <button
            type="button"
            onClick={() => {
              setTool("line");
              setPending([]);
            }}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition " +
              (tool === "line"
                ? "bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/50"
                : "bg-slate-800 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
            }
            title="자: 두 점을 잇는 직선 (1L 1E)"
          >
            ✏️ 선 (자)
          </button>
        ) : null}
        {allowedTools.includes("circle") ? (
          <button
            type="button"
            onClick={() => {
              setTool("circle");
              setPending([]);
            }}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition " +
              (tool === "circle"
                ? "bg-violet-500/25 text-violet-200 ring-1 ring-violet-400/50"
                : "bg-slate-800 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
            }
            title="컴퍼스: 첫 점 중심, 둘째 점을 지나는 원 (1L 1E)"
          >
            ⭕ 원 (컴퍼스)
          </button>
        ) : null}
        {allowedTools.includes("perpBisector") ? (
          <button
            type="button"
            onClick={() => {
              setTool("perpBisector");
              setPending([]);
            }}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition " +
              (tool === "perpBisector"
                ? "bg-fuchsia-500/25 text-fuchsia-200 ring-1 ring-fuchsia-400/50"
                : "bg-slate-800 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
            }
            title="수직이등분선: 두 점 사이의 수직이등분선 (1L 3E)"
          >
            📏 수직이등분선
          </button>
        ) : null}
        {allowedTools.includes("perpLine") ? (
          <button
            type="button"
            onClick={() => {
              setTool("perpLine");
              setPending([]);
            }}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition " +
              (tool === "perpLine"
                ? "bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/50"
                : "bg-slate-800 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
            }
            title="수선: 직선 위 두 점 + 평면 위 한 점 (1L 3E)"
          >
            ⊥ 수선
          </button>
        ) : null}
        {allowedTools.includes("parallel") ? (
          <button
            type="button"
            onClick={() => {
              setTool("parallel");
              setPending([]);
            }}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition " +
              (tool === "parallel"
                ? "bg-teal-500/25 text-teal-200 ring-1 ring-teal-400/50"
                : "bg-slate-800 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
            }
            title="평행선: 직선 위 두 점 + 평면 위 한 점 (1L 4E)"
          >
            ∥ 평행선
          </button>
        ) : null}
        {allowedTools.includes("angleBisector") ? (
          <button
            type="button"
            onClick={() => {
              setTool("angleBisector");
              setPending([]);
            }}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition " +
              (tool === "angleBisector"
                ? "bg-orange-500/25 text-orange-200 ring-1 ring-orange-400/50"
                : "bg-slate-800 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
            }
            title="각의 이등분선: 꼭짓점 → 한 변 위 점 → 다른 변 위 점 (1L 4E)"
          >
            ∠ 각이등분선
          </button>
        ) : null}
        {allowedTools.includes("pan") ? (
          <button
            type="button"
            onClick={() => {
              setTool("pan");
              setPending([]);
            }}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition " +
              (tool === "pan"
                ? "bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/50"
                : "bg-slate-800 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
            }
            title="손바닥: 작도판을 드래그해 이동 (작도 안 함)"
          >
            ✋ 손바닥
          </button>
        ) : null}

        <span className="ml-3 text-xs font-semibold text-slate-400">
          사용:{" "}
          <span className="text-cyan-300">{lCount}L</span>
          <span className="mx-1 text-slate-600">·</span>
          <span className="text-violet-300">{eCount}E</span>
        </span>

        <span className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            className="rounded-md border border-white/15 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-default disabled:opacity-30"
            title="실행취소 — 마지막 작도 한 단계 되돌리기"
          >
            ↶ 실행취소
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25"
            title="지우기 — 학생이 작도한 모든 도형 삭제 (시드는 유지)"
          >
            🧹 지우기
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25"
            title="초기화 — 작도 + 화면 위치 모두 처음으로"
          >
            ↺ 초기화
          </button>
        </span>
      </div>

      <p className="mb-3 text-xs text-slate-400">
        {tool === "point"
          ? "빈 공간 또는 도형 위를 클릭하면 점이 생겨요 (도형 근처는 자동 정렬)."
          : tool === "line"
          ? "두 점을 차례로 클릭하면 직선이 그려져요."
          : tool === "circle"
          ? "첫 점이 중심, 둘째 점이 원 위를 지납니다."
          : tool === "perpBisector"
          ? "두 점 사이의 수직이등분선이 그려져요 (1L 3E)."
          : tool === "perpLine"
          ? "직선의 두 점을 차례로 클릭한 뒤, 수선이 통과할 점을 클릭하세요 (1L 3E)."
          : tool === "parallel"
          ? "직선의 두 점을 차례로 클릭한 뒤, 평행선이 통과할 점을 클릭하세요 (1L 4E)."
          : tool === "angleBisector"
          ? "각의 꼭짓점을 클릭한 뒤, 한 변 위 점 → 다른 변 위 점을 순서대로 클릭하세요 (1L 4E)."
          : "작도판을 드래그해 화면을 이동합니다 (작도 안 함)."}
        {pending.length > 0 && pending.length < inputCount(tool) ? (
          <span className="ml-2 text-amber-300">
            · {pending.length}개 선택됨 — {inputCount(tool) - pending.length}개 더 클릭하세요
          </span>
        ) : null}
      </p>

      {solvedBadge ? <div className="mb-2">{solvedBadge}</div> : null}

      <svg
        viewBox={`${viewOffset.x} ${viewOffset.y} ${width} ${height}`}
        className={
          "block w-full select-none rounded-lg border border-white/10 bg-slate-950 " +
          (tool === "pan"
            ? panDrag
              ? "cursor-grabbing"
              : "cursor-grab"
            : tool === "point"
            ? "cursor-crosshair"
            : "")
        }
        onClick={handleSvgClick}
        onMouseDown={(e) => {
          if (tool !== "pan") return;
          const rect = e.currentTarget.getBoundingClientRect();
          setPanDrag({
            startX: e.clientX,
            startY: e.clientY,
            baseX: viewOffset.x,
            baseY: viewOffset.y,
            rect,
          });
        }}
        onMouseMove={(e) => {
          if (!panDrag) return;
          const scaleX = width / panDrag.rect.width;
          const scaleY = height / panDrag.rect.height;
          const dx = (e.clientX - panDrag.startX) * scaleX;
          const dy = (e.clientY - panDrag.startY) * scaleY;
          setViewOffset({ x: panDrag.baseX - dx, y: panDrag.baseY - dy });
        }}
        onMouseUp={() => setPanDrag(null)}
        onMouseLeave={() => setPanDrag(null)}
        role="img"
        aria-label="작도판"
      >
        {/* 직선 */}
        {board.lines.map((l) => {
          const a = board.points.find((p) => p.id === l.a)!;
          const b = board.points.find((p) => p.id === l.b)!;
          const seg = lineSegment(a, b);
          const isSeed = seed.lines.some((sl) => sl.id === l.id);
          return (
            <line
              key={l.id}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={isSeed ? "#94a3b8" : "#67e8f9"}
              strokeWidth={isSeed ? 1.5 : 1.8}
              strokeOpacity={isSeed ? 0.7 : 0.95}
            />
          );
        })}
        {/* 원 */}
        {board.circles.map((c) => {
          const cc = board.points.find((p) => p.id === c.center)!;
          const ct = board.points.find((p) => p.id === c.through)!;
          const r = distance(cc, ct);
          const isSeed = seed.circles.some((sc) => sc.id === c.id);
          return (
            <circle
              key={c.id}
              cx={cc.x}
              cy={cc.y}
              r={r}
              fill="none"
              stroke={isSeed ? "#94a3b8" : "#c4b5fd"}
              strokeWidth={isSeed ? 1.5 : 1.8}
              strokeOpacity={isSeed ? 0.7 : 0.95}
            />
          );
        })}
        {/* 점 */}
        {board.points.map((p) => {
          if (p.hidden) return null;
          const isPending = pending.includes(p.id);
          const isHover = hover === p.id;
          const isGiven = p.given;
          const r = isHover || isPending ? 6 : isGiven ? 5 : 3.5;
          const fill = isPending
            ? "#fbbf24"
            : isGiven
            ? "#e2e8f0"
            : "#34d399";
          return (
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={r + 6}
                fill="transparent"
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => pickPoint(p.id)}
                style={{ cursor: "pointer" }}
              />
              <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke="#0f172a" strokeWidth={1.5} pointerEvents="none" />
              {p.label ? (
                <text x={p.x + 8} y={p.y - 8} fill="#e2e8f0" fontSize={13} fontWeight={700} pointerEvents="none">
                  {p.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 외부에서 점 ID → 좌표 조회 헬퍼 ──────────────────────────
export function pointById(board: { points: Pt[] }, id: string): V | null {
  const p = board.points.find((pp) => pp.id === id);
  return p ? { x: p.x, y: p.y } : null;
}

export { distance };
export type { Board };
