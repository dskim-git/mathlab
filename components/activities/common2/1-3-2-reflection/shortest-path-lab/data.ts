// 대칭이동과 최단 거리 — 활동 데이터
//
//  ① 직선 l 의 같은 쪽에 두 점 A, B 가 있을 때, l 위의 점 P 에 대하여
//     AP + PB 를 가장 작게 하는 P 를 찾는 문제.
//     B 의 l 에 대한 대칭점을 B′ 이라 하면 l 이 BB′ 을 수직이등분하므로
//        PB = PB′   ⇒   AP + PB = AP + PB′
//     세 점 A, P, B′ 에 대해 삼각부등식 AB′ ≤ AP + PB′ 이 성립하고,
//     등호는 P 가 선분 AB′ 위에 있을 때(곧 A, P, B′ 이 일직선일 때) 성립한다.
//        ⇒ 최솟값은 AB′,  최소 지점은 선분 AB′ 과 l 의 교점
//
//  ② 거울(직선)이 x축·y축·임의의 가로선·세로선인 실생활 문제로 확장한다.
//
//  ③ 거울 벽 두 개(아래 벽 y = 0, 왼쪽 벽 x = 0)에 차례로 반사시키는 문제.
//     출발점 S 를 아래 벽에 비춘 S′(Sx, −Sy) 과
//     목표점 T 를 왼쪽 벽에 비춘 T′(−Tx, Ty) 을 잡으면,
//     선분 S′T′ 이 두 벽과 만나는 곳이 바로 두 반사점 A, B 이다.
//        A = ((Sx·Ty − Tx·Sy)/(Sy + Ty),  0)      … S′T′ 과 y = 0 의 교점
//        B = (0,  (Sx·Ty − Tx·Sy)/(Sx + Tx))      … S′T′ 과 x = 0 의 교점
//     또 SA = S′A, BT = BT′ 이므로
//        (전체 이동 거리) = SA + AB + BT = S′A + AB + BT′ = S′T′
//                        = √{(Sx + Tx)² + (Sy + Ty)²}

export type Pt = { x: number; y: number };

// ─── 조판 ─────────────────────────────────────────────────────
export function ptTex(p: Pt): string {
  return `(${p.x}, ${p.y})`;
}
export function nz(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r < 0 ? `−${Math.abs(r)}` : String(r);
}
export function fmt(v: number, k = 2): string {
  const s = v.toFixed(k);
  return s.startsWith("-") ? `−${s.slice(1)}` : s;
}
/** KaTeX 안에 넣을 수 (ASCII 하이픈, 소수 둘째 자리, -0 방지) */
export function tn(v: number): string {
  const r = Math.round(v * 100) / 100;
  return String(Object.is(r, -0) || r === 0 ? 0 : r);
}
export function dist(p: Pt, q: Pt): number {
  return Math.hypot(p.x - q.x, p.y - q.y);
}

// ─── 거울(직선) ───────────────────────────────────────────────
/** "h" 는 가로선 y = k, "v" 는 세로선 x = k */
export type MirrorKind = "h" | "v";
export type Mirror = { kind: MirrorKind; k: number };

export function mirrorTex(m: Mirror): string {
  return m.kind === "h" ? `y = ${m.k}` : `x = ${m.k}`;
}
export function reflectPt(p: Pt, m: Mirror): Pt {
  return m.kind === "h" ? { x: p.x, y: 2 * m.k - p.y } : { x: 2 * m.k - p.x, y: p.y };
}
/** 선분 A→B′ 이 거울과 만나는 점 = 최소 지점 */
export function meetPoint(A: Pt, R: Pt, m: Mirror): Pt {
  if (m.kind === "h") {
    const t = (m.k - A.y) / (R.y - A.y);
    return { x: A.x + t * (R.x - A.x), y: m.k };
  }
  const t = (m.k - A.x) / (R.x - A.x);
  return { x: m.k, y: A.y + t * (R.y - A.y) };
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 최단 경로의 원리
// ══════════════════════════════════════════════════════════════
export const LAB_A: Pt = { x: -4, y: 3 };
export const LAB_B: Pt = { x: 5, y: 2 };
/** 실험실의 거울은 x축 */
export const LAB_MIRROR: Mirror = { kind: "h", k: 0 };

export const PROOF_STEPS: { tex: string; note: string }[] = [
  { tex: "\\overline{PB} = \\overline{PB'}", note: "거울이 BB′ 을 수직이등분하니까" },
  { tex: "\\overline{AP} + \\overline{PB} = \\overline{AP} + \\overline{PB'}", note: "그대로 바꿔 쓸 수 있어요" },
  { tex: "\\overline{AB'} \\le \\overline{AP} + \\overline{PB'}", note: "삼각형의 두 변의 합은 나머지 한 변보다 길어요" },
  { tex: "\\overline{AP} + \\overline{PB} \\ge \\overline{AB'}", note: "그래서 최솟값은 AB′ — 셋이 일직선일 때!" },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 실생활 최단 거리 문제 (반사 1회)
// ══════════════════════════════════════════════════════════════
export type MinQ = {
  id: string;
  emoji: string;
  title: string;
  story: string;
  /** 두 지점 이름 */
  nameA: string;
  nameB: string;
  /** 거울(길·강·벽)의 이름 */
  lineName: string;
  m: Mirror;
  A: Pt;
  B: Pt;
  /** B 의 대칭점 */
  R: Pt;
  /** 최소 지점 */
  P: Pt;
  /** 최솟값 (문제는 모두 정수가 되도록 골랐다) */
  min: number;
  unit: string;
  /** 화면 범위 */
  half: number;
};

function mkMin(
  id: string,
  emoji: string,
  title: string,
  story: string,
  nameA: string,
  nameB: string,
  lineName: string,
  m: Mirror,
  A: Pt,
  B: Pt,
  unit: string,
  half: number,
): MinQ {
  const R = reflectPt(B, m);
  return { id, emoji, title, story, nameA, nameB, lineName, m, A, B, R, P: meetPoint(A, R, m), min: dist(A, R), unit, half };
}

export const MIN_QS: MinQ[] = [
  mkMin(
    "m1",
    "🚲",
    "자전거 정비소 자리 정하기",
    "동서로 곧게 뻗은 자전거 도로 위에 정비소를 세우려고 해요. 두 아파트에서 정비소까지의 거리의 합이 가장 짧아지려면?",
    "해모아 아파트",
    "달가온 아파트",
    "자전거 도로",
    { kind: "h", k: 0 },
    { x: 1, y: 4 },
    { x: 7, y: 4 },
    "km",
    9,
  ),
  mkMin(
    "m2",
    "🚌",
    "마을버스 정류장 자리",
    "큰길가에 마을버스 정류장을 하나 세웁니다. 학교와 도서관에서 정류장까지의 거리의 합을 가장 짧게 하려면 어디에 세울까요?",
    "학교",
    "도서관",
    "큰길",
    { kind: "h", k: 0 },
    { x: 0, y: 4 },
    { x: 9, y: 8 },
    "km",
    12,
  ),
  mkMin(
    "m3",
    "🔌",
    "전기차 충전소 자리",
    "남북으로 곧게 난 고속도로 옆에 충전소를 세웁니다. 두 마을에서 충전소까지의 거리의 합이 가장 짧은 자리는?",
    "별빛 마을",
    "노을 마을",
    "고속도로",
    { kind: "v", k: 0 },
    { x: 4, y: 1 },
    { x: 4, y: 7 },
    "km",
    9,
  ),
  mkMin(
    "m4",
    "💧",
    "산불 급수 지점",
    "소방 헬기가 강에서 물을 채운 뒤 두 감시탑을 차례로 들릅니다. 강 위의 어느 지점에서 물을 채워야 전체 이동 거리가 가장 짧을까요?",
    "동쪽 감시탑",
    "서쪽 감시탑",
    "강",
    { kind: "h", k: 2 },
    { x: 1, y: 6 },
    { x: 7, y: 6 },
    "km",
    9,
  ),
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 거울 벽 두 개에 차례로 반사 (반사 2회)
// ══════════════════════════════════════════════════════════════
export type Room = {
  id: string;
  emoji: string;
  title: string;
  story: string;
  nameS: string;
  nameT: string;
  /** 방의 가로·세로 */
  W: number;
  H: number;
  S: Pt;
  T: Pt;
  /** 아래쪽 거울에 닿는 점 */
  A: Pt;
  /** 왼쪽 거울에 닿는 점 */
  B: Pt;
  /** 전체 이동 거리 */
  total: number;
  unit: string;
};

function mkRoom(
  id: string,
  emoji: string,
  title: string,
  story: string,
  nameS: string,
  nameT: string,
  W: number,
  H: number,
  S: Pt,
  T: Pt,
  unit: string,
): Room {
  // A 는 S 에서 T″(−Tx, −Ty) 로 가는 직선이 y = 0 과 만나는 점
  const ax = (S.x * T.y - T.x * S.y) / (S.y + T.y);
  const by = (T.y * ax) / (T.x + ax);
  return { id, emoji, title, story, nameS, nameT, W, H, S, T, A: { x: ax, y: 0 }, B: { x: 0, y: by }, total: Math.hypot(S.x + T.x, S.y + T.y), unit };
}

export const ROOMS: Room[] = [
  mkRoom(
    "r1",
    "🔦",
    "레이저 보안 장치",
    "두 벽이 거울인 방이에요. 발신기에서 쏜 레이저가 아래 거울과 왼쪽 거울에 한 번씩 튕겨 수신기에 닿게 하려면 어디를 겨눠야 할까요?",
    "발신기",
    "수신기",
    14,
    10,
    { x: 12, y: 3 },
    { x: 4, y: 9 },
    "m",
  ),
  mkRoom(
    "r2",
    "🏓",
    "벽치기 연습",
    "공을 아래 벽과 왼쪽 벽에 한 번씩 맞힌 뒤 짝의 라켓에 정확히 보내려고 합니다. 첫 번째로 맞힐 자리는 어디일까요?",
    "나",
    "짝",
    24,
    16,
    { x: 20, y: 6 },
    { x: 4, y: 12 },
    "m",
  ),
  mkRoom(
    "r3",
    "📡",
    "전파 중계",
    "전파가 두 반사판에 한 번씩 반사되어 안테나에 닿아야 합니다. 아래 반사판의 어느 지점을 향해 쏘아야 할까요?",
    "송신탑",
    "안테나",
    40,
    20,
    { x: 32, y: 12 },
    { x: 8, y: 18 },
    "m",
  ),
];

/**
 * S 에서 아래 거울의 점 A(a, 0) 을 향해 쏘았을 때의 경로.
 * 아래 거울에서 한 번, 왼쪽 거울에서 한 번 반사한다.
 */
export function tracePath(S: Pt, a: number): { A: Pt; B: Pt | null; yAtX: (x: number) => number | null } {
  const A = { x: a, y: 0 };
  if (a >= S.x - 1e-9) return { A, B: null, yAtX: () => null };
  const by = (S.y * a) / (S.x - a);
  const B = { x: 0, y: by };
  // 왼쪽 거울에서 반사한 뒤의 방향은 (S.x − a, S.y)
  const slope = S.y / (S.x - a);
  return { A, B, yAtX: (x: number) => by + slope * x };
}
