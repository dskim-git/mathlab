// 무리함수의 활용 — 활동 데이터
//
//  [스키드 마크] 달리던 자동차가 급정지할 때 도로에 남는 타이어 자국이다.
//        마찰로 운동에너지가 모두 사라진다고 보면 ½mv² = μmgd 이므로 v = √(2μgd) 다.
//        속력을 km/h, 길이를 m 로 쓰면 상수가 2 × 9.8 × 3.6² ≈ 254 가 되어
//        v = √(254 × (스키드 마크의 길이) × (도로의 마찰 계수)) 로 쓴다.
//        마찰 계수 μ 는 마른 아스팔트 0.8, 젖은 아스팔트 0.5, 눈길 0.2, 빙판 0.1 쯤이다.
//        길이가 네 배가 되어야 속력이 두 배가 되고, 거꾸로 같은 속력이라도
//        빙판에서는 마른 길보다 여덟 배 긴 자국이 남는다(0.8 ÷ 0.1 = 8).
//
//  [보퍼트 풍력 계급] 풍속 x km/h 를 0 부터 12 까지의 계급으로 바꾸는 식이 B = 1.5√(x+12.8) − 5.4 다.
//        계급은 이 값을 넘지 않는 가장 큰 정수로 잡는다.
//        거꾸로 계급 B 가 되는 가장 느린 풍속은 x = ((B+5.4)/1.5)² − 12.8 이다.
//        계급이 한 단계 오를 때마다 필요한 풍속의 증가폭이 5.2, 6.1, 7.0, … 처럼 점점 커지는데,
//        무리함수가 뒤로 갈수록 완만해지기 때문이다.
//
//  [쓰나미의 속력] 파장이 수심보다 훨씬 긴 파도(천해파)의 속력은 수심 d 만으로 정해져 v = √(gd) 다.
//        m/s 를 km/h 로 바꾸면 v = 3.6√(9.8d) 이다.
//        수심 4000 m 인 깊은 바다에서는 시속 700 km 가 넘어 제트 여객기에 맞먹지만,
//        해안에 가까워 수심이 얕아지면 느려진다. 앞이 느려지고 뒤가 따라붙으므로 파고가 높아진다.
//
//  [거꾸로 풀기] 세 식은 모두 y = A√(x + C) + D 꼴이라 역함수가 제곱함수다.
//        x = ((y − D)/A)² − C 로 되돌리면 속력에서 스키드 길이를, 계급에서 풍속을,
//        쓰나미의 속력에서 수심을 구할 수 있다.

export const DATA_NOTE =
  "스키드 마크 공식의 상수 254 는 중력가속도 9.8 m/s² 와 km/h 환산에서 나온 값이고, 노면의 마찰 계수는 교통사고 조사에서 흔히 쓰는 대푯값입니다(실제 사고 감정에서는 노면·타이어·제동 방식에 따라 달라집니다). 보퍼트 풍력 계급의 명칭과 육상 상태는 기상청 기준이며, 계급 환산식은 풍속(km/h)에 대한 근사식입니다. 쓰나미의 속력은 파장이 수심보다 훨씬 긴 파도에 쓰는 천해파 공식 v = √(gd) 를 km/h 로 바꾼 것입니다.";

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

// ══════════════════════════════════════════════════════════════
// 좌표평면과 곡선
// ══════════════════════════════════════════════════════════════

export const PLOT = { w: 340, h: 250, left: 56, right: 326, top: 22, bottom: 196 };

export type Pt = { x: number; y: number };
export type PlotBox = { xMax: number; yMin: number; yMax: number; xTicks: number[]; yTicks: number[]; xName: string; yName: string };

export function px(box: PlotBox, x: number): number {
  return PLOT.left + (x / box.xMax) * (PLOT.right - PLOT.left);
}
export function py(box: PlotBox, y: number): number {
  return PLOT.bottom - ((y - box.yMin) / (box.yMax - box.yMin)) * (PLOT.bottom - PLOT.top);
}

/**
 * y = A√(x + C) + D 를 칸 안에서만 잘라 표본으로 뽑는다.
 * v = √(x + C) ≥ 0 로 두면 y = A·v + D 가 v 에 대해 일차라서
 * v 를 고르게 훑으면 y 가 고르게 훑어지고, 칸의 네 변이 주는 제약도 v 구간 하나로 합쳐진다.
 */
export function sqrtSamples(A: number, C: number, D: number, box: PlotBox, n = 220): Pt[] {
  let lo = Math.sqrt(Math.max(0, C));
  let hi = Math.sqrt(Math.max(0, box.xMax + C));
  lo = Math.max(lo, Math.max(0, (box.yMin - D) / A));
  hi = Math.min(hi, (box.yMax - D) / A);
  if (!(hi > lo + 1e-12)) return [];
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const v = lo + ((hi - lo) * i) / n;
    out.push({ x: v * v - C, y: A * v + D });
  }
  return out;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 스키드 마크 수사대
// ══════════════════════════════════════════════════════════════

export const SKID_K = 254;

export type Road = { id: string; name: string; mu: number; color: string };

export const ROADS: Road[] = [
  { id: "dry", name: "마른 아스팔트", mu: 0.8, color: "#94a3b8" },
  { id: "wet", name: "젖은 아스팔트", mu: 0.5, color: "#38bdf8" },
  { id: "snow", name: "눈길", mu: 0.2, color: "#e2e8f0" },
  { id: "ice", name: "빙판", mu: 0.1, color: "#67e8f9" },
];

export const SKID_D = { min: 5, max: 60, step: 1, init: 20 };
export const LIMITS = [50, 60, 80];

export function skidSpeed(d: number, mu: number): number {
  return Math.sqrt(SKID_K * d * mu);
}
/** 거꾸로 — 속력에서 스키드 마크의 길이 */
export function skidLength(v: number, mu: number): number {
  return (v * v) / (SKID_K * mu);
}

export const SKID_BOX: PlotBox = {
  xMax: 60,
  yMin: 0,
  yMax: 130,
  xTicks: [10, 20, 30, 40, 50, 60],
  yTicks: [25, 50, 75, 100, 125],
  xName: "스키드 마크 (m)",
  yName: "속력 (km/h)",
};

export const SKID_GOALS = [
  "노면을 젖은 아스팔트로 바꿔 같은 자국이 더 느린 속력을 뜻하는 것 보기",
  "빙판을 골라 곡선이 크게 내려앉는 것 보기",
  "스키드 마크를 네 배로 늘려 속력이 두 배가 되는 것 보기",
];

export type Quiz = {
  id: string;
  prompt: string;
  choices: Piece[][];
  answer: number;
  choiceWhy: string[];
  why: string;
};

export const SKID_QUIZ: Quiz[] = [
  {
    id: "s1",
    prompt: "마른 아스팔트(마찰 계수 0.8)에 스키드 마크가 20 m 남았습니다. 브레이크를 밟기 직전의 속력은?",
    choices: [[{ pre: "약 40.6 km/h" }], [{ pre: "약 63.7 km/h" }], [{ pre: "약 80.2 km/h" }], [{ pre: "약 101.6 km/h" }]],
    answer: 1,
    choiceWhy: [
      "254 × 20 × 0.8 을 계산한 뒤 근호를 씌워야 해요.",
      "",
      "마찰 계수 0.8 을 곱하는 것을 잊으면 이런 값이 나옵니다.",
      "근호를 씌우지 않고 254 × 0.4 를 계산한 값이에요.",
    ],
    why: "254 × 20 × 0.8 = 4064 이고 √4064 ≈ 63.7 이므로 약 63.7 km/h 예요.",
  },
  {
    id: "s2",
    prompt: "비가 와서 젖은 아스팔트(마찰 계수 0.5)에 스키드 마크가 45 m 남았습니다. 속력은?",
    choices: [[{ pre: "약 75.6 km/h" }], [{ pre: "약 56.4 km/h" }], [{ pre: "약 106.9 km/h" }], [{ pre: "약 95.6 km/h" }]],
    answer: 0,
    choiceWhy: [
      "",
      "마찰 계수를 0.5 가 아니라 더 작은 값으로 보았어요.",
      "마찰 계수 0.5 를 곱하지 않으면 이런 값이 나옵니다.",
      "마찰 계수를 0.8 로 보면 이런 값이 나와요. 젖은 길은 0.5 입니다.",
    ],
    why: "254 × 45 × 0.5 = 5715 이고 √5715 ≈ 75.6 이므로 약 75.6 km/h 예요. 같은 45 m 라도 마른 길이었다면 95.6 km/h 가 됩니다.",
  },
  {
    id: "s3",
    prompt: "제한속도 60 km/h 인 마른 아스팔트 도로에 스키드 마크가 25 m 남았습니다. 이 차는 과속이었을까요?",
    choices: [
      [{ pre: "속력이 약 71.3 km/h 라 과속이었다" }],
      [{ pre: "속력이 약 56.3 km/h 라 과속이 아니었다" }],
      [{ pre: "속력이 정확히 60 km/h 라 알 수 없다" }],
      [{ pre: "스키드 마크만으로는 속력을 알 수 없다" }],
    ],
    answer: 0,
    choiceWhy: [
      "",
      "254 × 25 × 0.8 = 5080 이고 √5080 은 60 보다 큽니다.",
      "계산해 보면 60 과 같지 않아요.",
      "마찰 계수를 알면 스키드 마크의 길이로 속력을 어림할 수 있어요.",
    ],
    why: "254 × 25 × 0.8 = 5080 이고 √5080 ≈ 71.3 이므로 제한속도 60 km/h 를 넘었어요. 스키드 마크가 과속의 증거가 됩니다.",
  },
  {
    id: "s4",
    prompt: "같은 도로에서 스키드 마크의 길이가 네 배로 길어졌다면 속력은 몇 배였을까요?",
    choices: [[{ pre: "4 배" }], [{ pre: "16 배" }], [{ pre: "2 배" }], [{ pre: "그대로" }]],
    answer: 2,
    choiceWhy: [
      "근호 안이 네 배가 되면 값은 두 배가 돼요.",
      "속력이 네 배가 되려면 길이가 열여섯 배여야 합니다.",
      "",
      "길이가 달라지면 속력도 달라져요.",
    ],
    why: "√(254 × 4d × μ) = 2√(254 d μ) 이므로 속력은 두 배예요. 거꾸로 속력이 두 배면 멈추는 데 네 배의 거리가 필요합니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 보퍼트 풍력 계급
// ══════════════════════════════════════════════════════════════

export const WIND_X = { min: 0, max: 130, step: 1, init: 28 };

export function beaufort(x: number): number {
  return 1.5 * Math.sqrt(x + 12.8) - 5.4;
}
/** 계급 — 0 부터 12 까지 */
export function beaufortLevel(x: number): number {
  return Math.max(0, Math.min(12, Math.floor(beaufort(x))));
}
/** 거꾸로 — 그 계급이 되는 가장 느린 풍속 */
export function windFor(level: number): number {
  return ((level + 5.4) / 1.5) ** 2 - 12.8;
}

export type Beaufort = { level: number; name: string; land: string; color: string };

export const BEAUFORT: Beaufort[] = [
  { level: 0, name: "고요", land: "연기가 수직으로 올라감", color: "#1e3a8a" },
  { level: 1, name: "실바람", land: "연기를 보면 바람의 방향을 알 수 있는 정도", color: "#4c1d95" },
  { level: 2, name: "남실바람", land: "얼굴에 바람이 느껴짐", color: "#6d28d9" },
  { level: 3, name: "산들바람", land: "나뭇잎이 움직이고 깃발이 가볍게 날림", color: "#be185d" },
  { level: 4, name: "건들바람", land: "먼지가 일고 작은 나뭇가지가 흔들림", color: "#dc2626" },
  { level: 5, name: "흔들바람", land: "작은 나무가 흔들리고 강의 잔물결이 일어남", color: "#ea580c" },
  { level: 6, name: "된바람", land: "큰 가지가 흔들리고 우산 받기가 힘듦", color: "#a16207" },
  { level: 7, name: "센바람", land: "큰 나무 전체가 흔들리고 바람을 안고 걷기가 어려움", color: "#4d7c0f" },
  { level: 8, name: "큰바람", land: "작은 나무가 꺾이고 바람을 안고 걸을 수 없음", color: "#15803d" },
  { level: 9, name: "큰센바람", land: "굴뚝이 넘어지고 지붕이 날아감", color: "#0d9488" },
  { level: 10, name: "노대바람", land: "나무가 뿌리째 뽑히고 가옥이 큰 피해", color: "#0284c7" },
  { level: 11, name: "왕바람", land: "이런 현상은 거의 없고 넓은 지역에 피해", color: "#2563eb" },
  { level: 12, name: "싹쓸바람", land: "관측된 예가 거의 없음", color: "#4338ca" },
];

export const WIND_BOX: PlotBox = {
  xMax: 130,
  yMin: -1,
  yMax: 13,
  xTicks: [25, 50, 75, 100, 125],
  yTicks: [2, 4, 6, 8, 10, 12],
  xName: "풍속 (km/h)",
  yName: "풍력 계급",
};

export const WIND_GOALS = [
  "바람을 세게 하여 나무가 크게 휘는 것 보기",
  "계급이 8 이상이 되는 풍속을 찾아보기",
  "계급이 한 단계 오를 때 필요한 풍속의 증가폭이 커지는 것 보기",
];

export const WIND_QUIZ: Quiz[] = [
  {
    id: "w1",
    prompt: "풍속이 28 km/h 일 때 보퍼트 풍력 계급은 몇 급일까요?",
    choices: [[{ pre: "3 급" }], [{ pre: "5 급" }], [{ pre: "4 급" }], [{ pre: "6 급" }]],
    answer: 2,
    choiceWhy: [
      "3 급이 되는 풍속은 18.6 km/h 부터예요. 28 km/h 는 그보다 빠릅니다.",
      "5 급이 되려면 35.3 km/h 는 넘어야 해요.",
      "",
      "6 급이 되려면 45.0 km/h 는 넘어야 합니다.",
    ],
    why: "1.5√(28+12.8) − 5.4 = 1.5 × 6.39 − 5.4 ≈ 4.18 이므로 이를 넘지 않는 가장 큰 정수인 4 급이에요. 먼지가 일고 작은 나뭇가지가 흔들리는 건들바람입니다.",
  },
  {
    id: "w2",
    prompt: "태풍이 다가와 풍속이 75 km/h 가 되었습니다. 몇 급일까요?",
    choices: [[{ pre: "8 급" }], [{ pre: "7 급" }], [{ pre: "10 급" }], [{ pre: "9 급" }]],
    answer: 0,
    choiceWhy: [
      "",
      "7 급이 되는 풍속은 55.5 km/h 부터이고 8 급은 67.0 km/h 부터예요.",
      "10 급이 되려면 92.6 km/h 는 넘어야 합니다.",
      "9 급이 되려면 79.4 km/h 는 넘어야 해요.",
    ],
    why: "1.5√(75+12.8) − 5.4 = 1.5 × 9.37 − 5.4 ≈ 8.66 이므로 8 급이에요. 작은 나무가 꺾이고 바람을 안고 걸을 수 없는 큰바람입니다.",
  },
  {
    id: "w3",
    prompt: "우산을 받기 힘들어지는 6 급이 되려면 풍속이 최소 몇 km/h 여야 할까요?",
    choices: [[{ pre: "약 35.3 km/h" }], [{ pre: "약 45.0 km/h" }], [{ pre: "약 55.5 km/h" }], [{ pre: "약 26.5 km/h" }]],
    answer: 1,
    choiceWhy: [
      "이것은 5 급이 되는 풍속이에요.",
      "",
      "이것은 7 급이 되는 풍속입니다.",
      "이것은 4 급이 되는 풍속이에요.",
    ],
    why: "B = 6 을 넣어 거꾸로 풀면 x = ((6+5.4)/1.5)² − 12.8 = 7.6² − 12.8 = 44.96 이므로 약 45.0 km/h 예요.",
  },
  {
    id: "w4",
    prompt: "계급이 한 단계씩 오를 때 필요한 풍속의 증가폭은 어떻게 될까요?",
    choices: [
      [{ pre: "언제나 일정하다" }],
      [{ pre: "점점 작아진다" }],
      [{ pre: "점점 커진다" }],
      [{ pre: "커졌다 작아졌다 한다" }],
    ],
    answer: 2,
    choiceWhy: [
      "0 급에서 1 급까지는 5.2 km/h 지만 8 급에서 9 급까지는 12.4 km/h 가 필요해요.",
      "슬라이더를 오른쪽으로 밀수록 한 계급을 올리는 데 더 많은 풍속이 필요합니다.",
      "",
      "증가폭은 줄지 않고 계속 늘어납니다.",
    ],
    why: "무리함수는 뒤로 갈수록 완만해지므로 같은 계급 차이를 만들려면 풍속이 점점 더 많이 늘어야 해요. 5.2, 6.1, 7.0, 7.9, … 처럼 커집니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 쓰나미의 속력
// ══════════════════════════════════════════════════════════════

export const SEA_D = { min: 10, max: 5000, step: 10, init: 1000 };

export function tsunamiSpeed(d: number): number {
  return 3.6 * Math.sqrt(9.8 * d);
}
/** 거꾸로 — 속력에서 수심 */
export function tsunamiDepth(v: number): number {
  return (v / 3.6) ** 2 / 9.8;
}

export const SEA_BOX: PlotBox = {
  xMax: 5000,
  yMin: 0,
  yMax: 1000,
  xTicks: [1000, 2000, 3000, 4000, 5000],
  yTicks: [200, 400, 600, 800, 1000],
  xName: "수심 (m)",
  yName: "속력 (km/h)",
};

/** 견줄 만한 속력 */
export const SEA_MARKS = [
  { name: "제트 여객기", v: 900, color: "#f472b6" },
  { name: "고속열차", v: 300, color: "#fbbf24" },
  { name: "자동차", v: 100, color: "#94a3b8" },
];

export const SEA_GOALS = [
  "수심을 가장 깊게 하여 제트 여객기에 가까워지는 것 보기",
  "수심을 얕게 하여 속력이 크게 떨어지는 것 보기",
  "수심을 네 배로 바꾸어 속력이 두 배가 되는 것 보기",
];

export const SEA_QUIZ: Quiz[] = [
  {
    id: "t1",
    prompt: "수심이 4000 m 인 깊은 바다에서 쓰나미의 속력은 얼마쯤일까요?",
    choices: [[{ pre: "약 200 km/h" }], [{ pre: "약 713 km/h" }], [{ pre: "약 356 km/h" }], [{ pre: "약 1400 km/h" }]],
    answer: 1,
    choiceWhy: [
      "이것은 m/s 로 나온 값이에요. km/h 로 바꾸려면 3.6 을 곱해야 합니다.",
      "",
      "이것은 수심 1000 m 일 때의 속력이에요.",
      "9.8 × 4000 에 근호를 씌우지 않으면 이렇게 커집니다.",
    ],
    why: "3.6 × √(9.8 × 4000) = 3.6 × 198.0 ≈ 712.8 이므로 약 713 km/h 예요. 제트 여객기와 맞먹는 빠르기입니다.",
  },
  {
    id: "t2",
    prompt: "수심이 네 배로 깊어지면 쓰나미의 속력은 몇 배가 될까요?",
    choices: [[{ pre: "2 배" }], [{ pre: "4 배" }], [{ pre: "8 배" }], [{ pre: "그대로" }]],
    answer: 0,
    choiceWhy: [
      "",
      "근호 안이 네 배가 되면 값은 두 배가 돼요.",
      "여덟 배가 되려면 수심이 예순네 배여야 합니다.",
      "수심이 깊을수록 빨라집니다.",
    ],
    why: "√(9.8 × 4d) = 2√(9.8 d) 이므로 속력은 두 배가 돼요. 스키드 마크와 똑같은 성질입니다.",
  },
  {
    id: "t3",
    prompt: "쓰나미가 해안에 다가와 수심이 얕아지면 어떻게 될까요?",
    choices: [
      [{ pre: "속력이 빨라지고 파고가 낮아진다" }],
      [{ pre: "속력도 파고도 그대로다" }],
      [{ pre: "속력이 느려지고 파고가 높아진다" }],
      [{ pre: "속력이 느려지고 파고도 낮아진다" }],
    ],
    answer: 2,
    choiceWhy: [
      "수심이 얕아지면 √(9.8d) 가 작아지므로 느려져요.",
      "수심이 속력을 정하므로 그대로일 수 없습니다.",
      "",
      "앞이 느려지면 뒤가 따라붙어 물이 쌓이므로 파고는 오히려 높아져요.",
    ],
    why: "속력이 수심의 제곱근에 비례하므로 얕아지면 느려져요. 앞이 느려진 사이 뒤가 따라붙어 물이 쌓이므로 파고는 반대로 높아집니다. 그래서 먼바다에서는 낮던 파도가 해안에서 거대해집니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 거꾸로 풀기 — 무리함수의 역함수
// ══════════════════════════════════════════════════════════════

export type BackTask = {
  id: string;
  icon: string;
  title: string;
  story: string[];
  fwdTex: string;
  invTex: string;
  invChoices: string[];
  invAnswer: number;
  invWhy: string[];
  invNote: string;
  valChoices: Piece[][];
  valAnswer: number;
  valWhy: string[];
  valNote: string;
  /** 그래프에서 거꾸로 읽기 — 가로선의 높이와 그 자리의 x */
  box: PlotBox;
  A: number;
  C: number;
  D: number;
  readY: number;
  readX: number;
};

export const BACK_TASKS: BackTask[] = [
  {
    id: "r1",
    icon: "🚗",
    title: "스키드 마크의 길이",
    story: ["시속 90 km 로 달리던 자동차가 마른 아스팔트(마찰 계수 0.8)에서 급정지했어요.", "스키드 마크는 몇 m 나 남을까요?"],
    fwdTex: "v=\\sqrt{254df}",
    invTex: "d=\\dfrac{v^2}{254f}",
    invChoices: ["d=\\dfrac{v}{254f}", "d=\\dfrac{v^2}{254f}", "d=\\dfrac{254f}{v^2}", "d=\\sqrt{\\dfrac{v}{254f}}"],
    invAnswer: 1,
    invWhy: [
      "양변을 제곱해야 근호가 벗겨져요. v 가 아니라 v² 입니다.",
      "",
      "분자와 분모가 뒤바뀌었어요.",
      "근호를 없애려고 다시 근호를 씌우면 안 됩니다.",
    ],
    invNote: "양변을 제곱하면 v² = 254df 이므로 d = v²/(254f) 예요.",
    valChoices: [[{ pre: "약 39.9 m" }], [{ pre: "약 31.9 m" }], [{ pre: "약 44.3 m" }], [{ pre: "약 63.8 m" }]],
    valAnswer: 0,
    valWhy: [
      "",
      "마찰 계수를 1 로 보면 이런 값이 나와요.",
      "마찰 계수를 0.72 쯤으로 보면 이런 값이 나옵니다.",
      "마찰 계수 0.8 을 곱하지 않고 반으로 나누면 이런 값이 나와요.",
    ],
    valNote: "90² ÷ (254 × 0.8) = 8100 ÷ 203.2 ≈ 39.9 이므로 약 39.9 m 예요. 승용차 열 대 길이쯤 됩니다.",
    box: {
      xMax: 60,
      yMin: 0,
      yMax: 130,
      xTicks: [10, 20, 30, 40, 50, 60],
      yTicks: [25, 50, 75, 100, 125],
      xName: "스키드 마크 (m)",
      yName: "속력 (km/h)",
    },
    A: Math.sqrt(254 * 0.8),
    C: 0,
    D: 0,
    readY: 90,
    readX: 8100 / (254 * 0.8),
  },
  {
    id: "r2",
    icon: "🌬️",
    title: "8 급이 되는 풍속",
    story: ["작은 나무가 꺾이는 8 급 큰바람이 불려면 바람이 얼마나 세야 할까요?", "계급에서 풍속을 거꾸로 구해 보세요."],
    fwdTex: "B=1.5\\sqrt{x+12.8}-5.4",
    invTex: "x=\\left(\\dfrac{B+5.4}{1.5}\\right)^2-12.8",
    invChoices: [
      "x=\\left(\\dfrac{B-5.4}{1.5}\\right)^2-12.8",
      "x=\\left(\\dfrac{B+5.4}{1.5}\\right)^2+12.8",
      "x=\\dfrac{(B+5.4)^2}{1.5}-12.8",
      "x=\\left(\\dfrac{B+5.4}{1.5}\\right)^2-12.8",
    ],
    invAnswer: 3,
    invWhy: [
      "−5.4 를 넘기면 +5.4 가 돼요. 부호에 주의하세요.",
      "+12.8 을 넘기면 −12.8 이 됩니다.",
      "1.5 로 나눈 뒤에 제곱해야 해요. 제곱한 뒤 나누면 값이 달라집니다.",
      "",
    ],
    invNote: "−5.4 를 넘기고 1.5 로 나눈 뒤 제곱하고 다시 12.8 을 빼면 돼요.",
    valChoices: [[{ pre: "약 55.5 km/h" }], [{ pre: "약 79.4 km/h" }], [{ pre: "약 67.0 km/h" }], [{ pre: "약 92.6 km/h" }]],
    valAnswer: 2,
    valWhy: [
      "이것은 7 급이 되는 풍속이에요.",
      "이것은 9 급이 되는 풍속입니다.",
      "",
      "이것은 10 급이 되는 풍속이에요.",
    ],
    valNote: "((8+5.4)/1.5)² − 12.8 = 8.9333² − 12.8 ≈ 67.0 이므로 약 67.0 km/h 부터가 8 급이에요.",
    box: {
      xMax: 130,
      yMin: -1,
      yMax: 13,
      xTicks: [25, 50, 75, 100, 125],
      yTicks: [2, 4, 6, 8, 10, 12],
      xName: "풍속 (km/h)",
      yName: "풍력 계급",
    },
    A: 1.5,
    C: 12.8,
    D: -5.4,
    readY: 8,
    readX: ((8 + 5.4) / 1.5) ** 2 - 12.8,
  },
  {
    id: "r3",
    icon: "🌊",
    title: "쓰나미가 지나간 바다의 수심",
    story: ["먼바다를 시속 720 km 로 지나가는 쓰나미가 관측되었어요.", "그곳의 수심은 얼마쯤일까요?"],
    fwdTex: "v=3.6\\sqrt{9.8d}",
    invTex: "d=\\dfrac{1}{9.8}\\left(\\dfrac{v}{3.6}\\right)^2",
    invChoices: [
      "d=\\dfrac{1}{9.8}\\left(\\dfrac{v}{3.6}\\right)^2",
      "d=\\dfrac{1}{3.6}\\left(\\dfrac{v}{9.8}\\right)^2",
      "d=9.8\\left(\\dfrac{v}{3.6}\\right)^2",
      "d=\\left(\\dfrac{v}{9.8\\times 3.6}\\right)^2",
    ],
    invAnswer: 0,
    invWhy: [
      "",
      "3.6 과 9.8 의 자리가 뒤바뀌었어요.",
      "9.8 은 곱하는 것이 아니라 나누어야 합니다.",
      "3.6 으로 먼저 나눈 뒤 제곱하고, 그다음에 9.8 로 나누어야 해요.",
    ],
    invNote: "3.6 으로 나누어 m/s 로 되돌린 뒤 제곱하고 9.8 로 나누면 수심이 나와요.",
    valChoices: [[{ pre: "약 2041 m" }], [{ pre: "약 4082 m" }], [{ pre: "약 1020 m" }], [{ pre: "약 8163 m" }]],
    valAnswer: 1,
    valWhy: [
      "제곱한 값을 한 번 더 반으로 나눈 값이에요.",
      "",
      "속력을 반으로 보면 이런 값이 나옵니다.",
      "9.8 로 나누는 것을 잊으면 절반만 나눈 셈이 돼요.",
    ],
    valNote: "720 ÷ 3.6 = 200 m/s 이고 200² ÷ 9.8 ≈ 4082 이므로 약 4082 m 예요. 태평양의 평균 수심쯤 됩니다.",
    box: {
      xMax: 5000,
      yMin: 0,
      yMax: 820,
      xTicks: [1000, 2000, 3000, 4000, 5000],
      yTicks: [200, 400, 600, 800],
      xName: "수심 (m)",
      yName: "속력 (km/h)",
    },
    A: 3.6 * Math.sqrt(9.8),
    C: 0,
    D: 0,
    readY: 720,
    readX: (720 / 3.6) ** 2 / 9.8,
  },
];

export const BACK_CONCEPT: Quiz = {
  id: "rc",
  prompt: "세 가지 모두 거꾸로 풀 때 같은 일이 일어났습니다. 무리함수의 역함수는 어떤 함수일까요?",
  choices: [[{ pre: "또 다른 무리함수" }], [{ pre: "일차함수" }], [{ pre: "유리함수" }], [{ pre: "제곱함수 (이차함수)" }]],
  answer: 3,
  choiceWhy: [
    "근호를 벗기려고 제곱했으므로 근호가 남지 않아요.",
    "제곱한 식이라 x 의 일차식이 아닙니다.",
    "분모에 문자가 생기지 않아요.",
    "",
  ],
  why: "y = A√(x+C) + D 를 x 에 대하여 풀면 x = ((y−D)/A)² − C 라 제곱함수가 돼요. 근호를 벗기려면 제곱해야 하기 때문입니다. 정의역과 치역은 서로 맞바뀝니다.",
};
