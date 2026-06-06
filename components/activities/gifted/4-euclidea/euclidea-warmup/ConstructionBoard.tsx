"use client";

import { useMemo, useRef, useState } from "react";

// ─── 기하 모델 ────────────────────────────────────────────────
export type Pt = {
  id: string;
  x: number;
  y: number;
  given?: boolean;
  label?: string;
  /** 학생에게 표시하지 않음 (정답 검증용 좌표 보관). 클릭 불가. */
  hidden?: boolean;
  /** 라벨 위치 오프셋. 기본 (dx=8, dy=-8) — 점 오른쪽 위. */
  labelOffset?: { dx: number; dy: number };
};
export type Ln = {
  id: string;
  a: string;
  b: string;
  /**
   * 시드 line 의 시각화 — true 면 무한 직선 (viewBox 양쪽 끝까지 연장),
   * false 또는 undefined 면 두 점 사이 segment. 학생 작도 line 은 항상 무한 직선.
   */
  extend?: boolean;
  /**
   * 시드 line 의 시각화 — true 면 반직선 (점 a 가 끝점, a→b 방향으로만 연장).
   * extend 와 동시에 true 면 extend 가 우선.
   */
  ray?: boolean;
};
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
  | "pan"
  | "erase";

// 도구가 받는 입력 항목 — 점 또는 직선.
type PickKind = "point" | "line";
type Picked = { kind: PickKind; id: string };

// 도구별 입력 시그니처 — 점 N개·선 M개 모이면 발화.
function inputSpec(tool: Tool): { points: number; lines: number } {
  switch (tool) {
    case "line":
    case "circle":
    case "perpBisector":
      return { points: 2, lines: 0 };
    case "angleBisector":
      return { points: 3, lines: 0 };
    case "perpLine":
    case "parallel":
      return { points: 1, lines: 1 };
    default:
      return { points: 0, lines: 0 }; // SVG/마우스 핸들러 처리
  }
}

function isReady(tool: Tool, picked: Picked[]): boolean {
  const spec = inputSpec(tool);
  const pts = picked.filter((x) => x.kind === "point").length;
  const lns = picked.filter((x) => x.kind === "line").length;
  return pts >= spec.points && lns >= spec.lines;
}

function neededLabel(tool: Tool, picked: Picked[]): string {
  const spec = inputSpec(tool);
  const ptsHave = picked.filter((x) => x.kind === "point").length;
  const lnsHave = picked.filter((x) => x.kind === "line").length;
  const ptsNeed = spec.points - ptsHave;
  const lnsNeed = spec.lines - lnsHave;
  const parts: string[] = [];
  if (ptsNeed > 0) parts.push(`점 ${ptsNeed}개`);
  if (lnsNeed > 0) parts.push(`선 ${lnsNeed}개`);
  return parts.join(" + ");
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
  const [pending, setPending] = useState<Picked[]>([]); // 선택된 점/선 큐
  const [hover, setHover] = useState<string | null>(null);
  // 손바닥 도구로 작도판을 이동했을 때의 viewBox 오프셋.
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  // 확대/축소 — 1 = 기본, 작으면 확대, 크면 축소.
  const [zoomScale, setZoomScale] = useState(1);
  const [panDrag, setPanDrag] = useState<
    | { startX: number; startY: number; baseX: number; baseY: number; rect: DOMRect }
    | null
  >(null);

  // pinch zoom + multi-touch 추적
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<
    | {
        startDist: number;
        baseScale: number;
        rect: DOMRect;
        cx: number; // viewBox 좌표상 핀치 중심 (시작 시점 고정)
        cy: number;
      }
    | null
  >(null);

  const vbW = width * zoomScale;
  const vbH = height * zoomScale;

  function zoomBy(factor: number) {
    const cx = viewOffset.x + vbW / 2;
    const cy = viewOffset.y + vbH / 2;
    const newScale = Math.max(0.2, Math.min(5, zoomScale * factor));
    setViewOffset({
      x: cx - (width * newScale) / 2,
      y: cy - (height * newScale) / 2,
    });
    setZoomScale(newScale);
  }

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

  // 지우개 도구: 클릭한 점·선·원만 삭제.
  // - 점이 시드(given) 또는 hidden(도구가 만든 내부 점) 이면 삭제 X.
  // - 점을 삭제하면 그 점을 참조하는 선·원도 함께 삭제.
  function eraseElement(kind: "point" | "line" | "circle", id: string) {
    if (kind === "point") {
      const p = board.points.find((x) => x.id === id);
      if (!p || p.given || p.hidden) return;
      const next: Board = {
        ...board,
        points: board.points.filter((x) => x.id !== id),
        lines: board.lines.filter((l) => l.a !== id && l.b !== id),
        circles: board.circles.filter((c) => c.center !== id && c.through !== id),
      };
      commit(next);
    } else if (kind === "line") {
      const next: Board = { ...board, lines: board.lines.filter((l) => l.id !== id) };
      commit(next);
    } else {
      const next: Board = { ...board, circles: board.circles.filter((c) => c.id !== id) };
      commit(next);
    }
  }

  function reset() {
    setBoard(initial);
    setHistory([]);
    setPending([]);
    setHover(null);
    setViewOffset({ x: 0, y: 0 });
    setZoomScale(1);
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
    // 현재 보이는 viewBox 영역 안인지 확인
    if (
      snapped.x < viewOffset.x ||
      snapped.x > viewOffset.x + vbW ||
      snapped.y < viewOffset.y ||
      snapped.y > viewOffset.y + vbH
    )
      return;
    const { board: nb } = addPoint(board, snapped);
    if (nb === board) return; // 기존 점과 EPS 내라 변화 없음
    commit(nb);
  }

  function pickPoint(id: string) {
    if (tool === "point" || tool === "pan") return; // SVG/마우스 핸들러가 처리
    if (tool === "erase") {
      eraseElement("point", id);
      return;
    }
    const p = board.points.find((pp) => pp.id === id);
    if (!p || p.hidden) return;
    addPick({ kind: "point", id });
  }

  function pickLine(id: string) {
    if (tool === "erase") {
      eraseElement("line", id);
      return;
    }
    if (tool !== "perpLine" && tool !== "parallel") return;
    addPick({ kind: "line", id });
  }

  function pickCircle(id: string) {
    if (tool === "erase") eraseElement("circle", id);
    // 원은 작도 도구의 직접 입력 대상 아님 — erase 에서만 활용.
  }

  // pending 큐에 새 항목 push. 시그니처(점N+선M) 충족되면 발화.
  function addPick(item: Picked) {
    const next = [...pending, item];
    if (!isReady(tool, next)) {
      setPending(next);
      return;
    }
    fireTool(next);
  }

  function fireTool(picks: Picked[]) {
    const pts = picks.filter((x) => x.kind === "point");
    const lns = picks.filter((x) => x.kind === "line");
    let newBoard: Board = board;

    if (tool === "line") {
      const [pa, pb] = pts.map((x) => board.points.find((p) => p.id === x.id)!);
      const [a, b] = pts.map((x) => x.id);
      if (a === b) {
        setPending([]);
        return;
      }
      const dup = board.lines.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a));
      if (!dup) {
        const lid = nextId("L", new Set(board.lines.map((l) => l.id)));
        newBoard = {
          ...board,
          lines: [...board.lines, { id: lid, a, b }],
          events: board.events + 1,
        };
        newBoard = addIntersections(newBoard, "line", pa, pb);
      }
    } else if (tool === "circle") {
      const [pa, pb] = pts.map((x) => board.points.find((p) => p.id === x.id)!);
      const [a, b] = pts.map((x) => x.id);
      if (a === b) {
        setPending([]);
        return;
      }
      const dup = board.circles.some((c) => c.center === a && c.through === b);
      if (!dup) {
        const cid = nextId("C", new Set(board.circles.map((c) => c.id)));
        newBoard = {
          ...board,
          circles: [...board.circles, { id: cid, center: a, through: b }],
          events: board.events + 1,
        };
        newBoard = addIntersections(newBoard, "circle", pa, pb);
      }
    } else if (tool === "perpBisector") {
      const [pa, pb] = pts.map((x) => board.points.find((p) => p.id === x.id)!);
      if (pts[0].id === pts[1].id) {
        setPending([]);
        return;
      }
      const M = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy) || 1;
      const N = { x: M.x - (dy / len) * 100, y: M.y + (dx / len) * 100 };
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
        events: board.events + 3,
      };
      newBoard = addIntersections(newBoard, "line", M, N);
    } else if (tool === "perpLine") {
      // 점 + 선 → 점을 지나고 선에 수직인 직선 (1L 3E)
      const ppt = board.points.find((p) => p.id === pts[0].id)!;
      const ln = board.lines.find((l) => l.id === lns[0].id);
      if (!ln) {
        setPending([]);
        return;
      }
      const lp1 = board.points.find((p) => p.id === ln.a)!;
      const lp2 = board.points.find((p) => p.id === ln.b)!;
      const dx = lp2.x - lp1.x;
      const dy = lp2.y - lp1.y;
      const len = Math.hypot(dx, dy) || 1;
      const M = { x: ppt.x, y: ppt.y };
      const N = { x: ppt.x - (dy / len) * 100, y: ppt.y + (dx / len) * 100 };
      const idTaken = new Set(board.points.map((p) => p.id));
      const nId = nextId("N", idTaken);
      const lid = nextId("L", new Set(board.lines.map((l) => l.id)));
      newBoard = {
        ...board,
        points: [...board.points, { id: nId, x: N.x, y: N.y, hidden: true }],
        lines: [...board.lines, { id: lid, a: pts[0].id, b: nId }],
        events: board.events + 3,
      };
      newBoard = addIntersections(newBoard, "line", M, N);
    } else if (tool === "parallel") {
      // 점 + 선 → 점을 지나고 선에 평행한 직선 (1L 4E)
      const ppt = board.points.find((p) => p.id === pts[0].id)!;
      const ln = board.lines.find((l) => l.id === lns[0].id);
      if (!ln) {
        setPending([]);
        return;
      }
      const lp1 = board.points.find((p) => p.id === ln.a)!;
      const lp2 = board.points.find((p) => p.id === ln.b)!;
      const dx = lp2.x - lp1.x;
      const dy = lp2.y - lp1.y;
      const len = Math.hypot(dx, dy) || 1;
      const M = { x: ppt.x, y: ppt.y };
      const N = { x: ppt.x + (dx / len) * 100, y: ppt.y + (dy / len) * 100 };
      const idTaken = new Set(board.points.map((p) => p.id));
      const nId = nextId("N", idTaken);
      const lid = nextId("L", new Set(board.lines.map((l) => l.id)));
      newBoard = {
        ...board,
        points: [...board.points, { id: nId, x: N.x, y: N.y, hidden: true }],
        lines: [...board.lines, { id: lid, a: pts[0].id, b: nId }],
        events: board.events + 4,
      };
      newBoard = addIntersections(newBoard, "line", M, N);
    } else if (tool === "angleBisector") {
      // A, B, C 순서 클릭 — 꼭짓점은 가운데 B. ∠ABC 의 이등분선.
      const A = board.points.find((p) => p.id === pts[0].id)!;
      const B = board.points.find((p) => p.id === pts[1].id)!;
      const C = board.points.find((p) => p.id === pts[2].id)!;
      const dxA = A.x - B.x;
      const dyA = A.y - B.y;
      const dxC = C.x - B.x;
      const dyC = C.y - B.y;
      const lenA = Math.hypot(dxA, dyA) || 1;
      const lenC = Math.hypot(dxC, dyC) || 1;
      const ux = dxA / lenA + dxC / lenC;
      const uy = dyA / lenA + dyC / lenC;
      if (Math.hypot(ux, uy) > 1e-6) {
        const M = { x: B.x, y: B.y };
        const N = { x: B.x + ux * 100, y: B.y + uy * 100 };
        const idTaken = new Set(board.points.map((p) => p.id));
        const nId = nextId("N", idTaken);
        const lid = nextId("L", new Set(board.lines.map((l) => l.id)));
        newBoard = {
          ...board,
          points: [...board.points, { id: nId, x: N.x, y: N.y, hidden: true }],
          lines: [...board.lines, { id: lid, a: pts[1].id, b: nId }],
          events: board.events + 4,
        };
        newBoard = addIntersections(newBoard, "line", M, N);
      }
    }
    commit(newBoard);
    setPending([]);
  }

  // 직선을 viewBox(zoom 반영) 끝까지 연장한 두 끝점 계산.
  function lineSegment(a: V, b: V): { x1: number; y1: number; x2: number; y2: number } {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // viewBox 크기·zoom 기준 충분히 큰 T — 어느 zoom·offset 에서도 화면 끝까지.
    const T = Math.max(vbW, vbH) * 8;
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

  // 반직선 — a 가 끝점, a→b 방향으로만 viewBox 끝까지 연장.
  function raySegment(a: V, b: V): { x1: number; y1: number; x2: number; y2: number } {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const T = Math.max(vbW, vbH) * 8;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return {
      x1: a.x,
      y1: a.y,
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
        {allowedTools.includes("erase") ? (
          <button
            type="button"
            onClick={() => {
              setTool("erase");
              setPending([]);
            }}
            className={
              "rounded-md px-3 py-1.5 text-sm font-semibold transition " +
              (tool === "erase"
                ? "bg-rose-500/25 text-rose-200 ring-1 ring-rose-400/50"
                : "bg-slate-800 text-slate-400 ring-1 ring-white/10 hover:text-slate-200")
            }
            title="지우개: 특정 점·선·원을 클릭해 삭제"
          >
            🧹 지우개
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
            onClick={() => zoomBy(0.8)}
            disabled={zoomScale <= 0.2}
            className="rounded-md border border-white/15 bg-slate-800 px-2.5 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-default disabled:opacity-30"
            title="확대"
          >
            🔍+
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1.25)}
            disabled={zoomScale >= 5}
            className="rounded-md border border-white/15 bg-slate-800 px-2.5 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-default disabled:opacity-30"
            title="축소"
          >
            🔍−
          </button>
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
          ? "두 점을 차례로 클릭하면 직선이 그려져요 (1L 1E)."
          : tool === "circle"
          ? "첫 점이 중심, 둘째 점이 원 위를 지납니다 (1L 1E)."
          : tool === "perpBisector"
          ? "두 점 사이의 수직이등분선이 그려져요 (1L 3E)."
          : tool === "perpLine"
          ? "점 하나와 직선 하나를 클릭하면, 그 점을 지나고 직선에 수직인 직선이 그려져요 (1L 3E)."
          : tool === "parallel"
          ? "점 하나와 직선 하나를 클릭하면, 그 점을 지나고 직선과 평행한 직선이 그려져요 (1L 4E)."
          : tool === "angleBisector"
          ? "A → B → C 순서로 점을 클릭하면 가운데 B 가 꼭짓점인 ∠ABC 의 이등분선이 그려져요 (1L 4E)."
          : tool === "erase"
          ? "지우고 싶은 점·직선·원을 클릭하면 삭제됩니다 (시드는 보호)."
          : "작도판을 드래그해 화면을 이동합니다 (작도 안 함)."}
        {pending.length > 0 && !isReady(tool, pending) ? (
          <span className="ml-2 text-amber-300">· 더 클릭해야 할 항목: {neededLabel(tool, pending)}</span>
        ) : null}
      </p>

      {solvedBadge ? <div className="mb-2">{solvedBadge}</div> : null}

      <svg
        viewBox={`${viewOffset.x} ${viewOffset.y} ${vbW} ${vbH}`}
        className={
          "block w-full select-none rounded-lg border border-white/10 bg-slate-950 " +
          (tool === "pan"
            ? panDrag
              ? "cursor-grabbing"
              : "cursor-grab"
            : tool === "erase"
            ? "cursor-cell"
            : tool === "point"
            ? "cursor-crosshair"
            : "")
        }
        onClick={handleSvgClick}
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          // 마우스 우클릭 / 보조 버튼 무시.
          if (e.pointerType === "mouse" && e.button !== 0) return;
          pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* 무시 */
          }
          // 두 손가락 → pinch zoom 시작 (도구 무관, pan 우선 종료).
          if (pointersRef.current.size === 2) {
            setPanDrag(null);
            const ps = Array.from(pointersRef.current.values());
            const ddx = ps[1].x - ps[0].x;
            const ddy = ps[1].y - ps[0].y;
            const startDist = Math.hypot(ddx, ddy) || 1;
            const rect = e.currentTarget.getBoundingClientRect();
            const midClientX = (ps[0].x + ps[1].x) / 2;
            const midClientY = (ps[0].y + ps[1].y) / 2;
            const sx = vbW / rect.width;
            const sy = vbH / rect.height;
            pinchRef.current = {
              startDist,
              baseScale: zoomScale,
              rect,
              cx: viewOffset.x + (midClientX - rect.left) * sx,
              cy: viewOffset.y + (midClientY - rect.top) * sy,
            };
          } else if (tool === "pan" && pointersRef.current.size === 1) {
            const rect = e.currentTarget.getBoundingClientRect();
            setPanDrag({
              startX: e.clientX,
              startY: e.clientY,
              baseX: viewOffset.x,
              baseY: viewOffset.y,
              rect,
            });
          }
        }}
        onPointerMove={(e) => {
          if (!pointersRef.current.has(e.pointerId)) return;
          pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          // pinch zoom 진행 중.
          if (pointersRef.current.size === 2 && pinchRef.current) {
            const ps = Array.from(pointersRef.current.values());
            const dx = ps[1].x - ps[0].x;
            const dy = ps[1].y - ps[0].y;
            const dist = Math.hypot(dx, dy) || 1;
            // 손가락 멀어지면 ratio<1 → newScale < baseScale → viewBox 축소 = 확대.
            const ratio = pinchRef.current.startDist / dist;
            const newScale = Math.max(0.2, Math.min(5, pinchRef.current.baseScale * ratio));
            const newW = width * newScale;
            const newH = height * newScale;
            const midClientX = (ps[0].x + ps[1].x) / 2;
            const midClientY = (ps[0].y + ps[1].y) / 2;
            const sx = newW / pinchRef.current.rect.width;
            const sy = newH / pinchRef.current.rect.height;
            setZoomScale(newScale);
            setViewOffset({
              x: pinchRef.current.cx - (midClientX - pinchRef.current.rect.left) * sx,
              y: pinchRef.current.cy - (midClientY - pinchRef.current.rect.top) * sy,
            });
            return;
          }
          // pan 도구 single-pointer 드래그.
          if (panDrag) {
            const scaleX = vbW / panDrag.rect.width;
            const scaleY = vbH / panDrag.rect.height;
            const dx = (e.clientX - panDrag.startX) * scaleX;
            const dy = (e.clientY - panDrag.startY) * scaleY;
            setViewOffset({ x: panDrag.baseX - dx, y: panDrag.baseY - dy });
          }
        }}
        onPointerUp={(e) => {
          pointersRef.current.delete(e.pointerId);
          if (pointersRef.current.size < 2) pinchRef.current = null;
          if (pointersRef.current.size === 0) setPanDrag(null);
        }}
        onPointerCancel={(e) => {
          pointersRef.current.delete(e.pointerId);
          if (pointersRef.current.size < 2) pinchRef.current = null;
          if (pointersRef.current.size === 0) setPanDrag(null);
        }}
        role="img"
        aria-label="작도판"
      >
        {/* 직선 — 시드 line 은 두 점 사이 segment 로만 시각화(정사각형 등이 깔끔하게 보이게).
            학생 작도 line 은 무한 연장. 도구·자동 교점·snap 은 모두 무한 직선 기준. */}
        {board.lines.map((l) => {
          const a = board.points.find((p) => p.id === l.a)!;
          const b = board.points.find((p) => p.id === l.b)!;
          const isSeed = seed.lines.some((sl) => sl.id === l.id);
          // 시드 line: extend=true 면 무한 직선, ray=true 면 반직선(a 끝점), 아니면 segment.
          // 학생 작도 line 은 항상 무한 직선.
          let seg: { x1: number; y1: number; x2: number; y2: number };
          if (!isSeed || l.extend) {
            seg = lineSegment(a, b);
          } else if (l.ray) {
            seg = raySegment(a, b);
          } else {
            seg = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
          }
          const isPicked = pending.some((x) => x.kind === "line" && x.id === l.id);
          const isClickable = tool === "erase" || tool === "perpLine" || tool === "parallel";
          return (
            <g key={l.id}>
              <line
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={isPicked ? "#fbbf24" : isSeed ? "#cbd5e1" : "#67e8f9"}
                strokeWidth={isPicked ? 2.5 : isSeed ? 1.8 : 1.8}
                strokeOpacity={1}
              />
              {isClickable ? (
                <line
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke="transparent"
                  strokeWidth={14}
                  onClick={(e) => {
                    e.stopPropagation();
                    pickLine(l.id);
                  }}
                  style={{ cursor: "pointer", pointerEvents: "stroke" }}
                />
              ) : null}
            </g>
          );
        })}
        {/* 원 */}
        {board.circles.map((c) => {
          const cc = board.points.find((p) => p.id === c.center)!;
          const ct = board.points.find((p) => p.id === c.through)!;
          const r = distance(cc, ct);
          const isSeed = seed.circles.some((sc) => sc.id === c.id);
          const isClickable = tool === "erase";
          return (
            <g key={c.id}>
              <circle
                cx={cc.x}
                cy={cc.y}
                r={r}
                fill="none"
                stroke={isSeed ? "#94a3b8" : "#c4b5fd"}
                strokeWidth={isSeed ? 1.5 : 1.8}
                strokeOpacity={isSeed ? 0.7 : 0.95}
              />
              {isClickable ? (
                <circle
                  cx={cc.x}
                  cy={cc.y}
                  r={r}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  onClick={(e) => {
                    e.stopPropagation();
                    pickCircle(c.id);
                  }}
                  style={{ cursor: "pointer", pointerEvents: "stroke" }}
                />
              ) : null}
            </g>
          );
        })}
        {/* 점 */}
        {board.points.map((p) => {
          if (p.hidden) return null;
          const isPending = pending.some((x) => x.kind === "point" && x.id === p.id);
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
                <text
                  x={p.x + (p.labelOffset?.dx ?? 8)}
                  y={p.y + (p.labelOffset?.dy ?? -8)}
                  fill="#e2e8f0"
                  fontSize={13}
                  fontWeight={700}
                  pointerEvents="none"
                >
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
