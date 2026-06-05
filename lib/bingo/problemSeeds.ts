// 빙고 25문제의 시드(주어진 도형) + 정답 검증.
//
// 시드/검증은 ConstructionBoard 의 Board·Seed 형식을 그대로 사용.
// 본 라운드(C-3) 에선 1번 문제만 시범 구현 — 나머지는 후속 라운드에서 점진적 추가.

import type {
  Seed,
  Board,
  Pt,
} from "@/components/activities/gifted/4-euclidea/euclidea-warmup/ConstructionBoard";

const EPS_TARGET = 10; // 정답 점 일치 판정 임계 (px)

export type ProblemSpec = {
  num: number;
  /** 짧은 제목 — 모달 상단·작도 화면 헤더용. */
  title: string;
  /** 1~2문장 설명 — 작도 화면에서 설명 패널. */
  description: string;
  /** ConstructionBoard 초기 시드 (주어진 점·선·원). */
  seed: Seed;
  /** 조건 V — 정답 변형의 개수. */
  variantCount: number;
  /** board 받아 학생이 찾은 변형 인덱스 배열 반환. 길이 = 현재까지 발견한 변형 개수. */
  findVariants: (board: Board) => number[];
};

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// ─── 문제 1: 세 꼭짓점을 통한 평행사변형 (4L 8E 3V) ────────────
// 주어진 3 점 A, B, C 로 평행사변형의 4번째 꼭짓점 D 를 작도.
// 어느 쌍이 대각선인지에 따라 3가지 위치:
//   D1 = B + C - A  (A 의 반대편 — AD 가 대각선)
//   D2 = A + C - B  (B 의 반대편)
//   D3 = A + B - C  (C 의 반대편)
const PROBLEM_1_SEED: Seed = {
  points: [
    { id: "A", x: 430, y: 140, label: "A" },
    { id: "B", x: 460, y: 290, label: "B" },
    { id: "C", x: 200, y: 270, label: "C" },
  ],
  lines: [],
  circles: [],
};

function findVariants1(board: Board): number[] {
  const A = board.points.find((p) => p.id === "A");
  const B = board.points.find((p) => p.id === "B");
  const C = board.points.find((p) => p.id === "C");
  if (!A || !B || !C) return [];
  const targets = [
    { x: B.x + C.x - A.x, y: B.y + C.y - A.y },
    { x: A.x + C.x - B.x, y: A.y + C.y - B.y },
    { x: A.x + B.x - C.x, y: A.y + B.y - C.y },
  ];
  const seedIds = new Set(["A", "B", "C"]);
  const found = new Set<number>();
  for (const p of board.points as Pt[]) {
    if (p.hidden) continue;
    if (seedIds.has(p.id)) continue;
    targets.forEach((t, i) => {
      if (dist(p, t) < EPS_TARGET) found.add(i);
    });
  }
  return Array.from(found).sort();
}

// ─── 문제 2: 정사각형 내 원 (3L 5E) ────────────────────────
// 정사각형 ABCD 가 주어진 상태에서 내접하는 원을 작도.
// 정답 1개 — 중심 = 정사각형 중심, 반지름 = 변 길이 / 2.
// 시드: 변 길이 200 의 정사각형, viewBox(640x420) 중앙 부근.
const PROBLEM_2_SEED: Seed = {
  points: [
    { id: "A", x: 220, y: 110 },
    { id: "B", x: 420, y: 110 },
    { id: "C", x: 420, y: 310 },
    { id: "D", x: 220, y: 310 },
  ],
  lines: [
    { id: "AB", a: "A", b: "B" },
    { id: "BC", a: "B", b: "C" },
    { id: "CD", a: "C", b: "D" },
    { id: "DA", a: "D", b: "A" },
  ],
  circles: [],
};

const EPS_CIRCLE_CENTER = 6;
const EPS_CIRCLE_RADIUS = 6;

function findVariants2(board: Board): number[] {
  const A = board.points.find((p) => p.id === "A");
  const B = board.points.find((p) => p.id === "B");
  const C = board.points.find((p) => p.id === "C");
  if (!A || !B || !C) return [];
  // 정사각형 중심 = 대각선 AC 의 중점
  const center = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
  const targetR = dist(A, B) / 2;
  for (const cr of board.circles) {
    const cc = board.points.find((p) => p.id === cr.center);
    const ct = board.points.find((p) => p.id === cr.through);
    if (!cc || !ct) continue;
    const r = dist(cc, ct);
    if (dist(cc, center) < EPS_CIRCLE_CENTER && Math.abs(r - targetR) < EPS_CIRCLE_RADIUS) {
      return [0];
    }
  }
  return [];
}

// ─── 문제 3: 해시 (2L 4E 2V) ────────────────────────────────
// 두 쌍의 평행선 (각 쌍 내부 간격이 같음) + 외부에 점 P. 학생이 P 를 지나는 직선을
// 그어 — 그 직선이 쌍 A 의 두 평행선 사이에서 잘리는 segment 길이가 쌍 B 의
// 두 평행선 사이에서 잘리는 segment 길이와 같으면 정답.
const PROBLEM_3_SEED: Seed = {
  points: [
    // 평행선 쌍 A — 기울기 -0.4, 두 직선 y절편 차 80.
    { id: "a1a", x: 80, y: 320, hidden: true },
    { id: "a1b", x: 480, y: 160, hidden: true },
    { id: "a2a", x: 80, y: 240, hidden: true },
    { id: "a2b", x: 480, y: 80, hidden: true },
    // 평행선 쌍 B — 기울기 +0.4, 두 직선 y절편 차 80.
    { id: "b1a", x: 80, y: 100, hidden: true },
    { id: "b1b", x: 480, y: 260, hidden: true },
    { id: "b2a", x: 80, y: 180, hidden: true },
    { id: "b2b", x: 480, y: 340, hidden: true },
    // 주어진 점 — # 영역 우측 가까운 외부 (학생 직선이 어느 방향이든 4 평행선과 만나게).
    { id: "P", x: 500, y: 210, label: "P" },
  ],
  lines: [
    // 시드 평행선은 모두 무한 직선 — extend: true 로 화면 끝까지 시각화 (zoom 무관).
    { id: "A1", a: "a1a", b: "a1b", extend: true },
    { id: "A2", a: "a2a", b: "a2b", extend: true },
    { id: "B1", a: "b1a", b: "b1b", extend: true },
    { id: "B2", a: "b2a", b: "b2b", extend: true },
  ],
  circles: [],
};

const PROBLEM_3_SEED_LINE_IDS = new Set(["A1", "A2", "B1", "B2"]);
const EPS_ON_LINE = 2;
const EPS_HASH = 8;

function lineLineIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number },
): { x: number; y: number } | null {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;
  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / denom;
  return { x: p1.x + t * dx1, y: p1.y + t * dy1 };
}

function isPointOnLine(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cross = Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx);
  return cross / len < EPS_ON_LINE;
}

function findVariants3(board: Board): number[] {
  const P = board.points.find((p) => p.id === "P");
  if (!P) return [];
  const A1 = board.lines.find((l) => l.id === "A1");
  const A2 = board.lines.find((l) => l.id === "A2");
  const B1 = board.lines.find((l) => l.id === "B1");
  const B2 = board.lines.find((l) => l.id === "B2");
  if (!A1 || !A2 || !B1 || !B2) return [];

  function endpoints(ln: { a: string; b: string }) {
    const a = board.points.find((p) => p.id === ln.a)!;
    const b = board.points.find((p) => p.id === ln.b)!;
    return { a, b };
  }
  const a1e = endpoints(A1);
  const a2e = endpoints(A2);
  const b1e = endpoints(B1);
  const b2e = endpoints(B2);

  const studentLines = board.lines.filter((l) => !PROBLEM_3_SEED_LINE_IDS.has(l.id));
  const found: number[] = [];

  studentLines.forEach((line, idx) => {
    const lp1 = board.points.find((p) => p.id === line.a);
    const lp2 = board.points.find((p) => p.id === line.b);
    if (!lp1 || !lp2) return;
    if (!isPointOnLine(P, lp1, lp2)) return;

    const iA1 = lineLineIntersect(lp1, lp2, a1e.a, a1e.b);
    const iA2 = lineLineIntersect(lp1, lp2, a2e.a, a2e.b);
    const iB1 = lineLineIntersect(lp1, lp2, b1e.a, b1e.b);
    const iB2 = lineLineIntersect(lp1, lp2, b2e.a, b2e.b);
    if (!iA1 || !iA2 || !iB1 || !iB2) return;

    const dA = dist(iA1, iA2); // 쌍 A 사이 segment 길이
    const dB = dist(iB1, iB2); // 쌍 B 사이 segment 길이
    if (Math.abs(dA - dB) < EPS_HASH) {
      found.push(idx);
    }
  });

  return Array.from(new Set(found));
}

// ─── 문제 4: 사각형 절단 (3L 3E) ────────────────────────────
// 사각형(직사각형) + 외부 점 P. P 를 지나고 사각형을 등면적으로 분할하는 직선.
// 정답: 사각형 중심(대각선 교점)을 지나는 직선만이 등면적 분할.
const PROBLEM_4_SEED: Seed = {
  points: [
    { id: "A", x: 200, y: 210 },
    { id: "B", x: 440, y: 210 },
    { id: "C", x: 440, y: 330 },
    { id: "D", x: 200, y: 330 },
    { id: "P", x: 430, y: 110, label: "P" },
  ],
  lines: [
    { id: "AB", a: "A", b: "B" },
    { id: "BC", a: "B", b: "C" },
    { id: "CD", a: "C", b: "D" },
    { id: "DA", a: "D", b: "A" },
  ],
  circles: [],
};

const PROBLEM_4_SEED_LINE_IDS = new Set(["AB", "BC", "CD", "DA"]);

function findVariants4(board: Board): number[] {
  const P = board.points.find((p) => p.id === "P");
  const A = board.points.find((p) => p.id === "A");
  const C = board.points.find((p) => p.id === "C");
  if (!P || !A || !C) return [];
  // 사각형 중심 = 대각선 AC 의 중점
  const center = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
  const studentLines = board.lines.filter((l) => !PROBLEM_4_SEED_LINE_IDS.has(l.id));
  for (const line of studentLines) {
    const lp1 = board.points.find((p) => p.id === line.a);
    const lp2 = board.points.find((p) => p.id === line.b);
    if (!lp1 || !lp2) continue;
    if (isPointOnLine(P, lp1, lp2) && isPointOnLine(center, lp1, lp2)) {
      return [0];
    }
  }
  return [];
}

// ─── 문제 5: 마름모 (5L 7E 4V) ──────────────────────────────
// 시드 변 AB 가 주어진 상태. 그 변을 한 변으로 하고 한 꼭짓점이 45° 인 마름모.
// 4 변형 = ∠A=45° 두 방향 + ∠B=45° 두 방향. 학생이 작도한 4번째 꼭짓점 D 의
// 위치가 그 변형의 정답 좌표와 일치하면 발견.
const PROBLEM_5_SEED: Seed = {
  points: [
    { id: "A", x: 250, y: 230 },
    { id: "B", x: 430, y: 230 },
  ],
  lines: [{ id: "AB", a: "A", b: "B" }],
  circles: [],
};

const EPS_RHOMBUS = 8;

function findVariants5(board: Board): number[] {
  const A = board.points.find((p) => p.id === "A");
  const B = board.points.find((p) => p.id === "B");
  if (!A || !B) return [];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const s = Math.SQRT1_2;
  // 마름모의 4번째 꼭짓점 D 의 4 가지 위치 (시드와 인접한 꼭짓점):
  //   0: ∠A=45°, D = A + R(+45°)·(B-A)
  //   1: ∠A=45°, D = A + R(-45°)·(B-A)
  //   2: ∠B=45°, D 가 A 의 반대편 위 — A + Rot(B->A)·R(-45°) 위치
  //   3: ∠B=45°, 반대 방향
  const targets = [
    { x: A.x + (dx - dy) * s, y: A.y + (dx + dy) * s },
    { x: A.x + (dx + dy) * s, y: A.y + (-dx + dy) * s },
    { x: A.x - (dx + dy) * s, y: A.y + (dx - dy) * s },
    { x: A.x - (dx - dy) * s, y: A.y - (dx + dy) * s },
  ];
  const seedIds = new Set(["A", "B"]);
  const found = new Set<number>();
  for (const p of board.points) {
    if (p.hidden) continue;
    if (seedIds.has(p.id)) continue;
    targets.forEach((t, i) => {
      if (dist(p, t) < EPS_RHOMBUS) found.add(i);
    });
  }
  return Array.from(found).sort();
}

// ─── 문제 6: 원에 내접하는 정사각형 (6L 7E) ─────────────────
// 원 + 원 위 점 P 시드. P 가 정사각형 한 꼭짓점이 되도록 내접 정사각형 작도.
// 다른 세 꼭짓점 = P 를 원 중심 기준 90°/180°/270° 회전 위치 — 3 점 모두 발견시 V=1.
const PROBLEM_6_CX = 320;
const PROBLEM_6_CY = 220;
const PROBLEM_6_SEED: Seed = {
  points: [
    { id: "O", x: PROBLEM_6_CX, y: PROBLEM_6_CY, label: "O" },
    { id: "P", x: PROBLEM_6_CX + 120, y: PROBLEM_6_CY, label: "P" },
  ],
  lines: [],
  circles: [{ id: "given", center: "O", through: "P" }],
};

const EPS_INSCRIBED = 8;

function findVariants6(board: Board): number[] {
  const O = board.points.find((p) => p.id === "O");
  const P = board.points.find((p) => p.id === "P");
  if (!O || !P) return [];
  const dx = P.x - O.x;
  const dy = P.y - O.y;
  // P 의 O 기준 90° (시계반대), 180°, 270° 회전 좌표 — 정사각형 다른 세 꼭짓점.
  const targets = [
    { x: O.x - dy, y: O.y + dx },
    { x: O.x - dx, y: O.y - dy },
    { x: O.x + dy, y: O.y - dx },
  ];
  const seedIds = new Set(["O", "P"]);
  let count = 0;
  for (const t of targets) {
    const matched = board.points.some((p) => {
      if (p.hidden) return false;
      if (seedIds.has(p.id)) return false;
      return dist(p, t) < EPS_INSCRIBED;
    });
    if (matched) count++;
  }
  return count === 3 ? [0] : [];
}

// ─── 문제 7: 사각형의 중심 (4L 10E) ─────────────────────────
// 일반 사각형 ABCD. 대각선 AC 의 중점 M1, 대각선 BD 의 중점 M2,
// 선분 M1M2 의 중점 P 가 정답.
const PROBLEM_7_SEED: Seed = {
  points: [
    { id: "A", x: 200, y: 130 },
    { id: "B", x: 440, y: 100 },
    { id: "C", x: 480, y: 290 },
    { id: "D", x: 180, y: 330 },
  ],
  lines: [
    { id: "AB", a: "A", b: "B" },
    { id: "BC", a: "B", b: "C" },
    { id: "CD", a: "C", b: "D" },
    { id: "DA", a: "D", b: "A" },
  ],
  circles: [],
};

function findVariants7(board: Board): number[] {
  const A = board.points.find((p) => p.id === "A");
  const B = board.points.find((p) => p.id === "B");
  const C = board.points.find((p) => p.id === "C");
  const D = board.points.find((p) => p.id === "D");
  if (!A || !B || !C || !D) return [];
  const M1 = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
  const M2 = { x: (B.x + D.x) / 2, y: (B.y + D.y) / 2 };
  const P = { x: (M1.x + M2.x) / 2, y: (M1.y + M2.y) / 2 };
  const seedIds = new Set(["A", "B", "C", "D"]);
  for (const p of board.points) {
    if (p.hidden) continue;
    if (seedIds.has(p.id)) continue;
    if (dist(p, P) < 8) return [0];
  }
  return [];
}

// ─── 문제 8: 점을 지나 직선에 접하는 원 (3L 6E) ──────────────
// 시드: 직선 ℓ + 직선 위 접점 T + 직선 밖 점 P.
// 목표: T 에서 ℓ 에 접하고 P 를 지나는 원.
// 중심 = T 에서 ℓ 에 수직인 선 ∩ TP 의 수직이등분선.
const PROBLEM_8_SEED: Seed = {
  points: [
    { id: "L1", x: 60, y: 280, hidden: true },
    { id: "L2", x: 560, y: 280, hidden: true },
    { id: "T", x: 320, y: 280, label: "T" },
    { id: "P", x: 460, y: 110, label: "P" },
  ],
  lines: [{ id: "ell", a: "L1", b: "L2", extend: true }],
  circles: [],
};

function findVariants8(board: Board): number[] {
  const T = board.points.find((p) => p.id === "T");
  const P = board.points.find((p) => p.id === "P");
  const L1 = board.points.find((p) => p.id === "L1");
  const L2 = board.points.find((p) => p.id === "L2");
  if (!T || !P || !L1 || !L2) return [];
  // ℓ 방향
  const lx = L2.x - L1.x;
  const ly = L2.y - L1.y;
  const llen = Math.hypot(lx, ly) || 1;
  // ℓ 의 T 에서의 수선 방향(법선) (-ly, lx)/llen
  const nx = -ly / llen;
  const ny = lx / llen;
  // 중심 C = T + t * (nx, ny). |C - P| = |C - T| = |t|.
  // |C - P|² = |t|² 풀면 t = ((P - T) · (P - T)) / (2 (P - T) · n).
  const tx = P.x - T.x;
  const ty = P.y - T.y;
  const denom = 2 * (tx * nx + ty * ny);
  if (Math.abs(denom) < 1e-9) return [];
  const t = (tx * tx + ty * ty) / denom;
  const C = { x: T.x + t * nx, y: T.y + t * ny };
  const r = Math.abs(t);
  for (const cr of board.circles) {
    const cc = board.points.find((p) => p.id === cr.center);
    const ct = board.points.find((p) => p.id === cr.through);
    if (!cc || !ct) continue;
    const cR = dist(cc, ct);
    if (dist(cc, C) < 8 && Math.abs(cR - r) < 8) return [0];
  }
  return [];
}

// ─── 문제 9: 45° (2L 5E 2V) ────────────────────────────────
// 시드 변 AB 의 끝점 A 를 꼭짓점으로 하여 45° 각을 작도. 두 방향(위/아래) = V=2.
const PROBLEM_9_SEED: Seed = {
  points: [
    { id: "A", x: 240, y: 220 },
    { id: "B", x: 440, y: 220 },
  ],
  lines: [{ id: "AB", a: "A", b: "B" }],
  circles: [],
};

function findVariants9(board: Board): number[] {
  const A = board.points.find((p) => p.id === "A");
  const B = board.points.find((p) => p.id === "B");
  if (!A || !B) return [];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const s = Math.SQRT1_2;
  // 두 정답 방향 (단위벡터)
  const d1x = (s * (dx - dy)) / len;
  const d1y = (s * (dx + dy)) / len;
  const d2x = (s * (dx + dy)) / len;
  const d2y = (s * (-dx + dy)) / len;

  const studentLines = board.lines.filter((l) => l.id !== "AB");
  const found = new Set<number>();
  for (const line of studentLines) {
    const lp1 = board.points.find((p) => p.id === line.a);
    const lp2 = board.points.find((p) => p.id === line.b);
    if (!lp1 || !lp2) continue;
    if (!isPointOnLine(A, lp1, lp2)) continue;
    const lDx = lp2.x - lp1.x;
    const lDy = lp2.y - lp1.y;
    const lLen = Math.hypot(lDx, lDy) || 1;
    const ux = lDx / lLen;
    const uy = lDy / lLen;
    const c1 = Math.abs(ux * d1x + uy * d1y);
    const c2 = Math.abs(ux * d2x + uy * d2y);
    if (c1 > 0.995) found.add(0);
    if (c2 > 0.995) found.add(1);
  }
  return Array.from(found).sort();
}

// ─── 문제 10: 외접 정사각형 (6L 11E) ────────────────────────
// 시드: 원(O, r) + 직선 ℓ (원 외부). 원에 외접하고 두 변이 ℓ 과 평행한 정사각형.
// 정사각형 변 길이 = 2r. 4 꼭짓점 위치 미리 계산 후 학생 점 매칭.
const PROBLEM_10_R = 70;
const PROBLEM_10_OX = 320;
const PROBLEM_10_OY = 200;
const PROBLEM_10_SEED: Seed = {
  points: [
    { id: "O", x: PROBLEM_10_OX, y: PROBLEM_10_OY, label: "O" },
    { id: "Onb", x: PROBLEM_10_OX + PROBLEM_10_R, y: PROBLEM_10_OY, hidden: true },
    { id: "L1", x: 60, y: 360, hidden: true },
    { id: "L2", x: 560, y: 360, hidden: true },
  ],
  lines: [{ id: "ell", a: "L1", b: "L2", extend: true }],
  circles: [{ id: "given", center: "O", through: "Onb" }],
};

function findVariants10(board: Board): number[] {
  const O = board.points.find((p) => p.id === "O");
  const Onb = board.points.find((p) => p.id === "Onb");
  const L1 = board.points.find((p) => p.id === "L1");
  const L2 = board.points.find((p) => p.id === "L2");
  if (!O || !Onb || !L1 || !L2) return [];
  const r = dist(O, Onb);
  // ℓ 의 단위 방향 u 와 법선 n
  const lx = L2.x - L1.x;
  const ly = L2.y - L1.y;
  const llen = Math.hypot(lx, ly) || 1;
  const ux = lx / llen;
  const uy = ly / llen;
  const nx = -uy;
  const ny = ux;
  // 정답 정사각형 4 꼭짓점 = O ± r*u ± r*n
  const corners = [
    { x: O.x + r * ux + r * nx, y: O.y + r * uy + r * ny },
    { x: O.x + r * ux - r * nx, y: O.y + r * uy - r * ny },
    { x: O.x - r * ux + r * nx, y: O.y - r * uy + r * ny },
    { x: O.x - r * ux - r * nx, y: O.y - r * uy - r * ny },
  ];
  const seedIds = new Set(["O", "Onb", "L1", "L2"]);
  let foundCount = 0;
  for (const c of corners) {
    const matched = board.points.some((p) => {
      if (p.hidden) return false;
      if (seedIds.has(p.id)) return false;
      return dist(p, c) < 8;
    });
    if (matched) foundCount++;
  }
  return foundCount === 4 ? [0] : [];
}

// ─── 문제 11: 정사각형 내 정사각형 (6L 7E) ──────────────────
// 시드: 정사각형 ABCD + 변 AB 위 임의 점 P. P 가 꼭짓점인 내접 정사각형.
// 변 a 길이의 정사각형 안, |AP|=t 인 점 P 에서 시작 → Q on BC, R on CD, S on DA
//   각 |BQ|=t, |CR|=t, |DS|=t. 정답 3 점 위치 미리 계산.
const PROBLEM_11_S = 200;
const PROBLEM_11_AX = 200;
const PROBLEM_11_AY = 110;
const PROBLEM_11_PT = 70; // |AP|
const PROBLEM_11_SEED: Seed = {
  points: [
    { id: "A", x: PROBLEM_11_AX, y: PROBLEM_11_AY },
    { id: "B", x: PROBLEM_11_AX + PROBLEM_11_S, y: PROBLEM_11_AY },
    { id: "C", x: PROBLEM_11_AX + PROBLEM_11_S, y: PROBLEM_11_AY + PROBLEM_11_S },
    { id: "D", x: PROBLEM_11_AX, y: PROBLEM_11_AY + PROBLEM_11_S },
    { id: "P", x: PROBLEM_11_AX + PROBLEM_11_PT, y: PROBLEM_11_AY, label: "P" },
  ],
  lines: [
    { id: "AB", a: "A", b: "B" },
    { id: "BC", a: "B", b: "C" },
    { id: "CD", a: "C", b: "D" },
    { id: "DA", a: "D", b: "A" },
  ],
  circles: [],
};

function findVariants11(board: Board): number[] {
  const A = board.points.find((p) => p.id === "A");
  const B = board.points.find((p) => p.id === "B");
  const C = board.points.find((p) => p.id === "C");
  const D = board.points.find((p) => p.id === "D");
  const P = board.points.find((p) => p.id === "P");
  if (!A || !B || !C || !D || !P) return [];
  const t = dist(A, P);
  // BC 방향 단위벡터 등
  function pointAlong(from: { x: number; y: number }, to: { x: number; y: number }, d: number) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: from.x + (dx / len) * d, y: from.y + (dy / len) * d };
  }
  const Q = pointAlong(B, C, t);
  const R = pointAlong(C, D, t);
  const S = pointAlong(D, A, t);
  const seedIds = new Set(["A", "B", "C", "D", "P"]);
  let count = 0;
  for (const target of [Q, R, S]) {
    const matched = board.points.some((p) => {
      if (p.hidden) return false;
      if (seedIds.has(p.id)) return false;
      return dist(p, target) < 8;
    });
    if (matched) count++;
  }
  return count === 3 ? [0] : [];
}

// ─── 문제 12: 삼각형의 내심 (2L 6E) ─────────────────────────
// 시드: 일반 삼각형 ABC. 내심 I = (a·A + b·B + c·C)/(a+b+c). 학생 점 매칭.
const PROBLEM_12_SEED: Seed = {
  points: [
    { id: "A", x: 200, y: 130 },
    { id: "B", x: 480, y: 200 },
    { id: "C", x: 250, y: 320 },
  ],
  lines: [
    { id: "AB", a: "A", b: "B" },
    { id: "BC", a: "B", b: "C" },
    { id: "CA", a: "C", b: "A" },
  ],
  circles: [],
};

function findVariants12(board: Board): number[] {
  const A = board.points.find((p) => p.id === "A");
  const B = board.points.find((p) => p.id === "B");
  const C = board.points.find((p) => p.id === "C");
  if (!A || !B || !C) return [];
  const a = dist(B, C);
  const b = dist(C, A);
  const c = dist(A, B);
  const sum = a + b + c || 1;
  const I = {
    x: (a * A.x + b * B.x + c * C.x) / sum,
    y: (a * A.y + b * B.y + c * C.y) / sum,
  };
  const seedIds = new Set(["A", "B", "C"]);
  for (const p of board.points) {
    if (p.hidden || seedIds.has(p.id)) continue;
    if (dist(p, I) < 8) return [0];
  }
  return [];
}

// ─── 문제 13: 정사각형의 한 변에 접하는 원 (3L 6E 4V) ──────
// 시드: 정사각형. 4 변 각각 — 한 변의 양 끝점을 지나고 마주보는 변에 접하는 원.
// 4 변형: 변마다 다른 원. 중심은 변의 수직이등분선 위 3s/8 깊이, 반지름 5s/8.
const PROBLEM_13_S = 200;
const PROBLEM_13_AX = 180;
const PROBLEM_13_AY = 110;
const PROBLEM_13_SEED: Seed = {
  points: [
    { id: "A", x: PROBLEM_13_AX, y: PROBLEM_13_AY },
    { id: "B", x: PROBLEM_13_AX + PROBLEM_13_S, y: PROBLEM_13_AY },
    { id: "C", x: PROBLEM_13_AX + PROBLEM_13_S, y: PROBLEM_13_AY + PROBLEM_13_S },
    { id: "D", x: PROBLEM_13_AX, y: PROBLEM_13_AY + PROBLEM_13_S },
  ],
  lines: [
    { id: "AB", a: "A", b: "B" },
    { id: "BC", a: "B", b: "C" },
    { id: "CD", a: "C", b: "D" },
    { id: "DA", a: "D", b: "A" },
  ],
  circles: [],
};

function findVariants13(board: Board): number[] {
  const A = board.points.find((p) => p.id === "A");
  const B = board.points.find((p) => p.id === "B");
  const C = board.points.find((p) => p.id === "C");
  const D = board.points.find((p) => p.id === "D");
  if (!A || !B || !C || !D) return [];
  const s = dist(A, B);
  const h = (3 * s) / 8;
  const r = (5 * s) / 8;
  // 한 변의 중점에서 변에 수직(다음 변 방향) h 만큼 들어간 곳이 중심
  function targetCenter(p1: { x: number; y: number }, p2: { x: number; y: number }, opp: { x: number; y: number }) {
    const M = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    // 마주보는 변 방향 단위벡터
    const oppM = { x: M.x, y: M.y }; // placeholder
    void oppM;
    const dx = opp.x - M.x;
    const dy = opp.y - M.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: M.x + (dx / len) * h, y: M.y + (dy / len) * h };
  }
  // 변 AB 시작 → 마주보는 변의 중점은 CD 의 중점
  const Mcd = { x: (C.x + D.x) / 2, y: (C.y + D.y) / 2 };
  const Mab = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const Mbc = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  const Mda = { x: (D.x + A.x) / 2, y: (D.y + A.y) / 2 };
  const centers = [
    targetCenter(A, B, Mcd),
    targetCenter(B, C, Mda),
    targetCenter(C, D, Mab),
    targetCenter(D, A, Mbc),
  ];
  const found = new Set<number>();
  for (const cr of board.circles) {
    const cc = board.points.find((p) => p.id === cr.center);
    const ct = board.points.find((p) => p.id === cr.through);
    if (!cc || !ct) continue;
    const cR = dist(cc, ct);
    centers.forEach((tc, i) => {
      if (dist(cc, tc) < 8 && Math.abs(cR - r) < 8) found.add(i);
    });
  }
  return Array.from(found).sort();
}

export const PROBLEM_SEEDS: Record<number, ProblemSpec> = {
  1: {
    num: 1,
    title: "세 꼭짓점을 통한 평행사변형",
    description:
      "4개의 꼭짓점 중 3개의 꼭짓점이 주어진 평행사변형을 작도하세요.",
    seed: PROBLEM_1_SEED,
    variantCount: 3,
    findVariants: findVariants1,
  },
  2: {
    num: 2,
    title: "정사각형 내 원",
    description: "정사각형에 내접하는 원을 작도하세요.",
    seed: PROBLEM_2_SEED,
    variantCount: 1,
    findVariants: findVariants2,
  },
  3: {
    num: 3,
    title: "해시",
    description:
      "두 쌍의 평행선에 의해 선분이 동일한 길이로 절단되도록 주어진 점 P 를 지나는 직선을 작도하세요.",
    seed: PROBLEM_3_SEED,
    variantCount: 2,
    findVariants: findVariants3,
  },
  4: {
    num: 4,
    title: "사각형 절단",
    description: "주어진 점 P 를 지나고 사각형을 등면적으로 분할하는 직선을 작도하세요.",
    seed: PROBLEM_4_SEED,
    variantCount: 1,
    findVariants: findVariants4,
  },
  5: {
    num: 5,
    title: "마름모",
    description: "주어진 변을 한 변으로 하고 한 꼭짓점이 45° 인 마름모를 작도하세요.",
    seed: PROBLEM_5_SEED,
    variantCount: 4,
    findVariants: findVariants5,
  },
  6: {
    num: 6,
    title: "원에 내접하는 정사각형",
    description:
      "원 위의 점 P 가 한 꼭짓점이 되도록 원에 내접하는 정사각형을 작도하세요.",
    seed: PROBLEM_6_SEED,
    variantCount: 1,
    findVariants: findVariants6,
  },
  7: {
    num: 7,
    title: "사각형의 중심",
    description: "사각형의 두 대각선의 중점들을 연결한 선분의 중점을 작도하세요.",
    seed: PROBLEM_7_SEED,
    variantCount: 1,
    findVariants: findVariants7,
  },
  8: {
    num: 8,
    title: "점을 지나 직선에 접하는 원",
    description:
      "직선 밖의 점 P 를 지나고 주어진 직선 위의 점 T 에서 접하는 원을 작도하세요.",
    seed: PROBLEM_8_SEED,
    variantCount: 1,
    findVariants: findVariants8,
  },
  9: {
    num: 9,
    title: "45°",
    description: "주어진 변에서 45° 각도를 작도하세요.",
    seed: PROBLEM_9_SEED,
    variantCount: 2,
    findVariants: findVariants9,
  },
  10: {
    num: 10,
    title: "외접 정사각형",
    description:
      "원에 외접하는 정사각형을 작도하세요. 단 주어진 직선과 두 변은 평행해야 합니다.",
    seed: PROBLEM_10_SEED,
    variantCount: 1,
    findVariants: findVariants10,
  },
  11: {
    num: 11,
    title: "정사각형 내 정사각형",
    description:
      "정사각형의 한 변 위의 점 P 를 꼭짓점으로 하는 정사각형에 내접하는 정사각형을 작도하세요.",
    seed: PROBLEM_11_SEED,
    variantCount: 1,
    findVariants: findVariants11,
  },
  12: {
    num: 12,
    title: "삼각형의 내심",
    description: "주어진 삼각형의 내심을 작도하세요.",
    seed: PROBLEM_12_SEED,
    variantCount: 1,
    findVariants: findVariants12,
  },
  13: {
    num: 13,
    title: "정사각형의 한 변에 접하는 원",
    description:
      "정사각형의 한 변의 양 끝점을 지나고 그 변을 마주보는 변에 접하는 원을 작도하세요.",
    seed: PROBLEM_13_SEED,
    variantCount: 4,
    findVariants: findVariants13,
  },
};
