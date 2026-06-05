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
};
