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
};
