// 용어의 정의와 증명, 정리 — 활동 데이터
//
//  [정의]      용어의 뜻을 명확하게 정한 문장
//  [무정의 용어] 정의 없이 쓰는 용어. 정의에도 용어가 쓰이므로 무정의 용어가 없으면
//              용어가 서로를 가리키며 끝없이 돌게 된다(순환 정의).
//  [공리(공준)] 증명 없이 자명한 진리로 받아들이는 기본 명제
//  [증명]      이미 알려진 사실이나 성질을 이용해 어떤 명제가 참(또는 거짓)임을
//              논리적으로 밝히는 과정
//  [정리]      참으로 증명된 명제 가운데 기본이 되거나 자주 쓰이는 것
//
//  증명은 명제를 가정과 결론으로 나눈 뒤, 정의·공리·기본 성질·이미 증명된 정리를
//  써서 가정에서 결론을 이끌어내는 일이다. 증명하려는 결론 자체를 중간에 끌어다 쓰면
//  순환 논증이 되어 증명이 되지 않는다.

/** 문장 조각 — 한글은 pre·post 로, 식은 tex 로 나눠 담는다(KaTeX 안에 한글을 넣지 않기 위해). */
export type Piece = { pre?: string; tex?: string; post?: string };

export function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 수학의 탑 — 용어 분류
// ══════════════════════════════════════════════════════════════
export type Layer = "undef" | "axiom" | "def" | "theorem";

export const LAYERS: Layer[] = ["theorem", "def", "axiom", "undef"];

export const LAYER_META: Record<Layer, { label: string; emoji: string; blurb: string; tone: string; ring: string; soft: string }> = {
  undef: {
    label: "무정의 용어",
    emoji: "🧱",
    blurb: "정의 없이 그대로 쓰는 말",
    tone: "text-slate-100",
    ring: "border-slate-400/55",
    soft: "bg-slate-400/12",
  },
  axiom: {
    label: "공리 (공준)",
    emoji: "🪨",
    blurb: "증명 없이 참으로 받아들이는 기본 명제",
    tone: "text-amber-100",
    ring: "border-amber-400/55",
    soft: "bg-amber-400/12",
  },
  def: {
    label: "정의",
    emoji: "📐",
    blurb: "용어의 뜻을 명확하게 정한 문장",
    tone: "text-sky-100",
    ring: "border-sky-400/55",
    soft: "bg-sky-400/12",
  },
  theorem: {
    label: "정리",
    emoji: "🏆",
    blurb: "증명을 거쳐 참이 된, 자주 쓰이는 명제",
    tone: "text-emerald-100",
    ring: "border-emerald-400/55",
    soft: "bg-emerald-400/12",
  },
};

export type TermCard = {
  id: string;
  text: Piece[];
  layer: Layer;
  why: string;
};

export const TERMS: TermCard[] = [
  { id: "w1", text: [{ pre: "점" }], layer: "undef", why: "「위치만 있고 크기가 없는 것」이라 말해 보아도 「위치」와 「크기」가 다시 설명을 기다려요. 어딘가에서 멈춰야 하기에 점은 정의하지 않고 씁니다." },
  { id: "w2", text: [{ pre: "선" }], layer: "undef", why: "점과 마찬가지로 더 기본이 되는 말이 없어요. 유클리드는 「폭이 없는 길이」라 적었지만 오늘날에는 무정의 용어로 둡니다." },
  { id: "w3", text: [{ pre: "면" }], layer: "undef", why: "점·선·면은 기하의 출발점이 되는 세 가지 무정의 용어예요." },

  {
    id: "d1",
    text: [{ pre: "세 변의 길이가 모두 같은 삼각형을 정삼각형이라고 한다." }],
    layer: "def",
    why: "「정삼각형」이라는 용어의 뜻을 딱 정해 주는 문장이에요. 참·거짓을 따질 대상이 아니라 약속이지요.",
  },
  {
    id: "d2",
    text: [{ pre: "네 변의 길이가 모두 같은 사각형을 마름모라고 한다." }],
    layer: "def",
    why: "「마름모」의 뜻을 정한 문장이에요. 「두 대각선이 수직이다」 같은 것은 정의가 아니라 정의에서 증명되는 성질이랍니다.",
  },
  {
    id: "d3",
    text: [{ pre: "1이 아닌 자연수 중 1과 자기 자신만을 약수로 갖는 수를 소수라고 한다." }],
    layer: "def",
    why: "「소수」의 뜻을 정한 문장이에요. 1을 빼 두었기 때문에 1은 소수가 아니게 됩니다.",
  },
  {
    id: "d4",
    text: [{ pre: "두 정수" }, { tex: "a, b\\ (b \\ne 0)" }, { pre: "에 대하여" }, { tex: "\\dfrac{a}{b}" }, { pre: "꼴로 나타낼 수 있는 수를 유리수라고 한다." }],
    layer: "def",
    why: "「유리수」의 뜻을 정한 문장이에요. 분모가 0이 되지 않게 조건을 붙여 뜻이 흐려지지 않게 했지요.",
  },

  {
    id: "a1",
    text: [{ pre: "서로 다른 두 점을 지나는 직선은 오직 하나뿐이다." }],
    layer: "axiom",
    why: "유클리드 『원론』의 첫 번째 공준이에요. 너무 당연해서 더 기본이 되는 것으로 증명할 수가 없습니다.",
  },
  {
    id: "a2",
    text: [{ pre: "모든 직각의 크기는 서로 같다." }],
    layer: "axiom",
    why: "유클리드의 네 번째 공준이에요. 이것을 받아들여야 도형을 옮겨 비교하는 일이 가능해집니다.",
  },
  {
    id: "a3",
    text: [{ tex: "a = b" }, { pre: "이면" }, { tex: "a + c = b + c" }, { pre: "이다." }],
    layer: "axiom",
    why: "「같은 것에 같은 것을 더하면 여전히 같다」는 유클리드의 공통관념이에요. 등식의 성질도 증명 없이 받아들이는 기본 명제랍니다.",
  },

  {
    id: "t1",
    text: [{ pre: "직각삼각형에서" }, { tex: "a^2 + b^2 = c^2" }, { pre: "이다. (피타고라스의 정리)" }],
    layer: "theorem",
    why: "증명을 거쳐 참이 된 명제예요. 알려진 증명법만 수백 가지가 있습니다.",
  },
  {
    id: "t2",
    text: [{ pre: "맞꼭지각의 크기는 서로 같다." }],
    layer: "theorem",
    why: "평각이 180°라는 사실에서 증명되는 명제예요. 자명해 보여도 증명할 수 있으면 공리가 아니라 정리랍니다.",
  },
  {
    id: "t3",
    text: [{ pre: "삼각형의 세 내각의 크기의 합은" }, { tex: "180^\\circ" }, { pre: "이다." }],
    layer: "theorem",
    why: "평행선의 성질에서 증명돼요. 놀랍게도 이 명제는 유클리드의 다섯 번째 공준(평행선 공준)에 기대고 있습니다.",
  },
];

/** 카드가 처음 놓이는 차례 (무작위를 쓰지 않아 서버 렌더와 어긋나지 않는다) */
export const TERM_ORDER = [6, 0, 10, 3, 8, 12, 1, 4, 9, 7, 2, 11, 5];

// ── 순환 정의 체험 ───────────────────────────────────────────
export type WordNode = {
  id: string;
  word: string;
  /** 정의 문장 — 문자열과 「다른 용어로 가는 고리」가 번갈아 놓인다 */
  parts: (string | { to: string })[];
};

export const WORDS: WordNode[] = [
  { id: "line", word: "선", parts: ["", { to: "point" }, "이 움직인 ", { to: "spot" }] },
  { id: "point", word: "점", parts: ["", { to: "place" }, "만 있고 ", { to: "size" }, "가 없는 것"] },
  { id: "place", word: "위치", parts: ["무엇이 있는 ", { to: "spot" }] },
  { id: "spot", word: "자리", parts: ["무엇이 놓여 있는 ", { to: "place" }] },
  { id: "size", word: "크기", parts: ["", { to: "length" }, "나 넓이 따위의 양"] },
  { id: "length", word: "길이", parts: ["두 ", { to: "point" }, " 사이의 ", { to: "distance" }] },
  { id: "distance", word: "거리", parts: ["두 ", { to: "point" }, " 사이가 떨어진 ", { to: "length" }] },
];

export function wordById(id: string): WordNode {
  return WORDS.find((w) => w.id === id) as WordNode;
}
export function wordLinks(w: WordNode): string[] {
  return w.parts.filter((p): p is { to: string } => typeof p !== "string").map((p) => p.to);
}
export const WORD_START = "line";

// ── 수학사 이야기 ────────────────────────────────────────────
export type Story = { id: string; emoji: string; title: string; when: string; body: string };

export const STORIES: Story[] = [
  {
    id: "s1",
    emoji: "📜",
    title: "유클리드 『원론』",
    when: "기원전 300년 무렵",
    body: "유클리드는 23개의 정의와 5개의 공준, 5개의 공통관념만을 바닥에 깔고 465개의 명제를 차례로 증명해 나갔어요. 수학을 「몇 개의 약속에서 출발해 쌓아 올리는 건축」으로 만든 첫 번째 책이랍니다. 2000년 넘게 성경 다음으로 많이 읽힌 책이라는 말이 있을 정도예요.",
  },
  {
    id: "s2",
    emoji: "🧭",
    title: "다섯 번째 공준",
    when: "기원전 300년 ~ 1800년대",
    body: "유클리드의 다섯 번째 공준(평행선 공준)은 다른 넷보다 문장이 길고 덜 자명해 보였어요. 수많은 수학자가 이것을 나머지 넷에서 증명하려다 모두 실패했지요. 결국 1800년대에 로바쳅스키와 보여이는 「이 공준이 성립하지 않는 기하」를 만들어도 모순이 생기지 않음을 보였어요. 공리는 증명되는 진리가 아니라 우리가 고르는 출발점이라는 것이 드러난 순간입니다.",
  },
  {
    id: "s3",
    emoji: "🍺",
    title: "힐베르트의 탁자와 맥주잔",
    when: "1899년",
    body: "힐베르트는 『기하학의 기초』에서 점·직선·평면을 정의하지 않고 무정의 용어로 두었어요. 그러고는 이렇게 말했다고 전해집니다 — 「점, 직선, 평면 대신 탁자, 의자, 맥주잔이라고 불러도 아무 문제가 없어야 한다.」 중요한 것은 그 말이 무엇을 가리키느냐가 아니라, 공리가 정해 주는 관계라는 뜻이지요.",
  },
  {
    id: "s4",
    emoji: "🔁",
    title: "사전을 끝까지 따라가면",
    when: "생각해 볼 거리",
    body: "국어사전에서 아무 낱말이나 찾아 그 뜻풀이에 나온 낱말을 다시 찾아보세요. 계속 따라가면 반드시 이미 지나온 낱말로 돌아옵니다. 낱말의 수가 유한하기 때문이에요. 수학도 마찬가지라서, 정의를 멈출 자리 — 무정의 용어 — 를 반드시 두어야 합니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ② 증명법 지도
// ══════════════════════════════════════════════════════════════
export type Family = "direct" | "indirect";
export type ProofKind = "deductive" | "inductive" | "contrapositive" | "contradiction";

export const FAMILY_META: Record<Family, { label: string; emoji: string; blurb: string }> = {
  direct: { label: "직접증명법", emoji: "➡️", blurb: "가정에서 곧바로 결론까지 밀고 나가는 방법" },
  indirect: { label: "간접증명법", emoji: "🔄", blurb: "명제를 그대로 다루지 않고 돌려서 밝히는 방법" },
};

export const KIND_META: Record<ProofKind, { label: string; family: Family; emoji: string; how: string; tone: string; ring: string; soft: string }> = {
  deductive: {
    label: "연역적 증명",
    family: "direct",
    emoji: "🧮",
    how: "정의·공리·이미 증명된 정리에서 출발해 일반적인 문자로 결론까지 이끌어낸다",
    tone: "text-sky-100",
    ring: "border-sky-400/55",
    soft: "bg-sky-400/12",
  },
  inductive: {
    label: "귀납적 증명",
    family: "direct",
    emoji: "🔢",
    how: "해당하는 경우가 유한할 때 하나도 빠짐없이 모두 확인한다",
    tone: "text-cyan-100",
    ring: "border-cyan-400/55",
    soft: "bg-cyan-400/12",
  },
  contrapositive: {
    label: "대우법",
    family: "indirect",
    emoji: "↩️",
    how: "명제 대신 그 대우를 증명한다 (명제와 대우는 참·거짓이 일치하므로)",
    tone: "text-violet-100",
    ring: "border-violet-400/55",
    soft: "bg-violet-400/12",
  },
  contradiction: {
    label: "귀류법",
    family: "indirect",
    emoji: "💥",
    how: "결론을 부정했다고 가정한 뒤 모순을 이끌어내 그 가정이 틀렸음을 보인다",
    tone: "text-rose-100",
    ring: "border-rose-400/55",
    soft: "bg-rose-400/12",
  },
};

export const KIND_ORDER: ProofKind[] = ["deductive", "inductive", "contrapositive", "contradiction"];

export type MethodTask = {
  id: string;
  claim: Piece[];
  /** 증명의 첫 대목 — 어떤 방법인지 알아보게 하는 단서 */
  sketch: Piece[];
  kind: ProofKind;
  why: string;
};

export const METHODS: MethodTask[] = [
  {
    id: "p1",
    claim: [{ pre: "두 홀수의 합은 짝수이다." }],
    sketch: [{ pre: "두 홀수를" }, { tex: "2k-1,\\ 2l-1" }, { pre: "로 놓고 더해 보면" }, { tex: "2(k+l-1)" }, { pre: "이 된다." }],
    kind: "deductive",
    why: "가정을 문자로 나타내 곧바로 결론까지 계산으로 밀고 나갔어요. 대표적인 연역적 증명입니다.",
  },
  {
    id: "p2",
    claim: [{ pre: "10 이하의 자연수 중 소수는 2, 3, 5, 7 네 개뿐이다." }],
    sketch: [{ pre: "1부터 10까지 하나씩 약수를 세어 모두 확인한다." }],
    kind: "inductive",
    why: "따질 경우가 열 가지뿐이라 하나도 빠짐없이 확인할 수 있었어요. 경우가 유한할 때만 쓸 수 있는 방법입니다.",
  },
  {
    id: "p3",
    claim: [{ tex: "n^2" }, { pre: "이 짝수이면" }, { tex: "n" }, { pre: "은 짝수이다." }],
    sketch: [{ pre: "대신" }, { tex: "n" }, { pre: "이 홀수이면" }, { tex: "n^2" }, { pre: "은 홀수임을 보이자." }],
    kind: "contrapositive",
    why: "원래 명제를 놓아 두고 그 대우를 증명했어요. 명제와 대우는 참·거짓이 늘 같으니 이것으로 충분합니다.",
  },
  {
    id: "p4",
    claim: [{ tex: "\\sqrt{2}" }, { pre: "는 무리수이다." }],
    sketch: [{ tex: "\\sqrt{2}" }, { pre: "가 유리수라고 하면 서로소인" }, { tex: "p, q" }, { pre: "로" }, { tex: "\\sqrt{2} = \\dfrac{q}{p}" }, { pre: "라 놓을 수 있는데…" }],
    kind: "contradiction",
    why: "결론을 부정해 놓고 따라가다 「서로소」라는 약속과 부딪혔어요. 모순이 나왔으니 처음 가정이 틀린 것이지요.",
  },
  {
    id: "p5",
    claim: [{ pre: "맞꼭지각의 크기는 서로 같다." }],
    sketch: [{ pre: "평각이" }, { tex: "180^\\circ" }, { pre: "라는 사실에서 두 식을 세워 빼 보자." }],
    kind: "deductive",
    why: "이미 아는 성질(평각)에서 출발해 결론까지 곧바로 이어 갔어요.",
  },
  {
    id: "p6",
    claim: [{ pre: "소수는 무한히 많다." }],
    sketch: [{ pre: "소수가" }, { tex: "p_1, p_2, \\dots, p_n" }, { pre: "뿐이라고 하면" }, { tex: "p_1 p_2 \\cdots p_n + 1" }, { pre: "은 어떤 소수로도 나누어떨어지지 않는다." }],
    kind: "contradiction",
    why: "유클리드가 남긴 유명한 증명이에요. 「유한하다」는 가정을 세웠다가 스스로 무너뜨립니다.",
  },
  {
    id: "p7",
    claim: [{ tex: "ab" }, { pre: "가 홀수이면" }, { tex: "a, b" }, { pre: "는 모두 홀수이다." }],
    sketch: [{ pre: "대신" }, { tex: "a" }, { pre: "또는" }, { tex: "b" }, { pre: "가 짝수이면" }, { tex: "ab" }, { pre: "가 짝수임을 보이자." }],
    kind: "contrapositive",
    why: "「모두 …이다」가 든 결론은 부정하면 「하나라도 …가 아니다」가 되어 다루기 쉬워져요. 대우법이 잘 통하는 꼴입니다.",
  },
  {
    id: "p8",
    claim: [{ pre: "12의 약수는 모두 6개이다." }],
    sketch: [{ pre: "1부터 12까지 나누어떨어지는지 하나씩 확인한다." }],
    kind: "inductive",
    why: "확인할 수가 열두 개뿐이라 전부 세어 볼 수 있었어요.",
  },
  {
    id: "p9",
    claim: [{ pre: "삼각형의 세 내각의 크기의 합은" }, { tex: "180^\\circ" }, { pre: "이다." }],
    sketch: [{ pre: "한 꼭짓점을 지나 맞은편 변에 평행한 직선을 긋고 엇각을 옮긴다." }],
    kind: "deductive",
    why: "평행선의 성질이라는 이미 아는 사실에서 결론을 이끌어냈어요.",
  },
  {
    id: "p10",
    claim: [{ tex: "\\sqrt{2}" }, { pre: "가 무리수일 때" }, { tex: "1 + \\sqrt{2}" }, { pre: "도 무리수이다." }],
    sketch: [{ tex: "1 + \\sqrt{2}" }, { pre: "가 유리수라면" }, { tex: "\\sqrt{2} = (1+\\sqrt{2}) - 1" }, { pre: "도 유리수가 되어야 한다." }],
    kind: "contradiction",
    why: "결론을 부정했더니 이미 참으로 알고 있는 사실과 부딪혔어요. 이것도 모순입니다.",
  },
];

/** 카드가 처음 놓이는 차례 */
export const METHOD_ORDER = [0, 3, 7, 2, 5, 1, 8, 6, 9, 4];

// ══════════════════════════════════════════════════════════════
// 탭 ③ 증명 재료 고르기
// ══════════════════════════════════════════════════════════════
export type MatKind = "given" | "def" | "axiom" | "theorem" | "conclusion" | "false" | "unrelated" | "picture" | "examples";

export const MAT_META: Record<MatKind, { label: string; ok: boolean; emoji: string; why: string }> = {
  given: { label: "가정에 주어진 것", ok: true, emoji: "📌", why: "가정에 적힌 내용은 모두 활용해야 해요." },
  def: { label: "정의", ok: true, emoji: "📐", why: "용어의 뜻을 정한 문장이라 언제든 끌어다 쓸 수 있어요." },
  axiom: { label: "공리·기본 성질", ok: true, emoji: "🪨", why: "증명 없이 받아들이는 기본 명제라 그대로 쓸 수 있어요." },
  theorem: { label: "이미 증명된 정리", ok: true, emoji: "🏆", why: "앞서 증명을 마친 명제라 안심하고 쓸 수 있어요." },
  conclusion: { label: "증명하려는 결론", ok: false, emoji: "🚫", why: "증명하려는 것을 증명 중에 쓰면 제자리를 맴도는 순환 논증이 돼요." },
  false: { label: "거짓인 성질", ok: false, emoji: "❌", why: "옳지 않은 성질에서 나온 결론은 믿을 수 없어요." },
  unrelated: { label: "참이지만 쓸 곳이 없는 것", ok: false, emoji: "🧩", why: "참인 명제이긴 하지만 이 증명에서는 쓸 자리가 없어요." },
  picture: { label: "그림만 보고 짐작한 것", ok: false, emoji: "👀", why: "그림의 모양만으로 섣부른 결론을 내리면 안 돼요." },
  examples: { label: "사례 몇 개", ok: false, emoji: "🎲", why: "몇 가지 예가 맞는다고 모든 경우가 맞는 것은 아니에요." },
};

export type Material = { id: string; text: Piece[]; kind: MatKind };

export type ProofTask = {
  id: string;
  claim: Piece[];
  hypo: Piece[];
  concl: Piece[];
  mats: Material[];
  /** 재료가 처음 놓이는 차례 */
  order: number[];
  note: string;
};

export const PROOFS: ProofTask[] = [
  {
    id: "q1",
    claim: [{ pre: "두 홀수의 합은 짝수이다." }],
    hypo: [{ tex: "m, n" }, { pre: "이 모두 홀수이다" }],
    concl: [{ tex: "m + n" }, { pre: "이 짝수이다" }],
    mats: [
      { id: "q1a", text: [{ pre: "홀수는" }, { tex: "2k - 1" }, { pre: "꼴로 나타낼 수 있다." }], kind: "def" },
      { id: "q1b", text: [{ pre: "정수끼리 더하거나 곱하면 정수이다." }], kind: "axiom" },
      { id: "q1c", text: [{ pre: "짝수는" }, { tex: "2 \\times" }, { pre: "(정수) 꼴이다." }], kind: "def" },
      { id: "q1d", text: [{ tex: "m + n" }, { pre: "은 짝수이다." }], kind: "conclusion" },
      { id: "q1e", text: [{ tex: "1 + 3 = 4,\\ 3 + 3 = 6" }, { pre: "이므로 참이다." }], kind: "examples" },
      { id: "q1f", text: [{ pre: "두 짝수의 합은 짝수이다." }], kind: "unrelated" },
      { id: "q1g", text: [{ pre: "모든 홀수는 소수이다." }], kind: "false" },
    ],
    order: [3, 0, 5, 2, 6, 1, 4],
    note: "가정을 문자로 옮기는 정의, 계산을 받쳐 주는 기본 성질, 결론의 뜻을 정한 정의 — 이 셋이면 증명이 끝나요.",
  },
  {
    id: "q2",
    claim: [{ tex: "n^2" }, { pre: "이 짝수이면" }, { tex: "n" }, { pre: "은 짝수이다." }],
    hypo: [{ tex: "n^2" }, { pre: "이 짝수이다" }],
    concl: [{ tex: "n" }, { pre: "이 짝수이다" }],
    mats: [
      { id: "q2a", text: [{ pre: "명제와 그 대우는 참·거짓이 일치한다." }], kind: "theorem" },
      { id: "q2b", text: [{ pre: "홀수는" }, { tex: "2k + 1" }, { pre: "꼴로 나타낼 수 있다." }], kind: "def" },
      { id: "q2c", text: [{ tex: "(2k+1)^2 = 4k^2 + 4k + 1" }], kind: "axiom" },
      { id: "q2d", text: [{ tex: "n" }, { pre: "이 짝수이므로" }, { tex: "n = 2k" }, { pre: "로 놓자." }], kind: "conclusion" },
      { id: "q2e", text: [{ tex: "n = 4" }, { pre: "일 때" }, { tex: "n^2 = 16" }, { pre: "으로 둘 다 짝수이다." }], kind: "examples" },
      { id: "q2f", text: [{ pre: "모든 자연수는 짝수 아니면 홀수이다." }], kind: "axiom" },
      { id: "q2g", text: [{ pre: "짝수의 제곱은 홀수이다." }], kind: "false" },
    ],
    order: [4, 1, 6, 0, 3, 5, 2],
    note: "대우법으로 갈 때에도 「결론을 먼저 가져다 쓰기」는 금물이에요. q2d 는 증명하려는 것을 출발점으로 삼아 버렸습니다.",
  },
  {
    id: "q3",
    claim: [{ tex: "\\sqrt{2}" }, { pre: "는 무리수이다." }],
    hypo: [{ tex: "\\sqrt{2}" }, { pre: "가 유리수라고 하자 (귀류법의 가정)" }],
    concl: [{ pre: "모순이 생긴다" }],
    mats: [
      { id: "q3a", text: [{ pre: "유리수는 서로소인 두 자연수" }, { tex: "p, q" }, { pre: "로" }, { tex: "\\dfrac{q}{p}" }, { pre: "꼴로 나타낼 수 있다." }], kind: "def" },
      { id: "q3b", text: [{ tex: "a^2" }, { pre: "이 짝수이면" }, { tex: "a" }, { pre: "도 짝수이다." }], kind: "theorem" },
      { id: "q3c", text: [{ pre: "서로소인 두 수는 1 말고는 공약수가 없다." }], kind: "def" },
      { id: "q3d", text: [{ tex: "\\sqrt{2}" }, { pre: "는 무리수이므로 분수로 쓸 수 없다." }], kind: "conclusion" },
      { id: "q3e", text: [{ tex: "\\sqrt{2} = 1.41421\\dots" }, { pre: "로 소수점이 끝나지 않으므로 무리수이다." }], kind: "examples" },
      { id: "q3f", text: [{ pre: "실수는 유리수 아니면 무리수이다." }], kind: "axiom" },
      { id: "q3g", text: [{ pre: "모든 무리수는 제곱하면 자연수가 된다." }], kind: "false" },
    ],
    order: [6, 2, 4, 0, 5, 3, 1],
    note: "계산기로 본 소수점은 증명이 못 돼요. 아무리 길게 적어도 그 뒤가 어떻게 될지는 알 수 없으니까요.",
  },
  {
    id: "q4",
    claim: [{ pre: "이등변삼각형의 두 밑각의 크기는 서로 같다." }],
    hypo: [{ pre: "삼각형" }, { tex: "ABC" }, { pre: "에서" }, { tex: "\\overline{AB} = \\overline{AC}" }],
    concl: [{ tex: "\\angle B = \\angle C" }],
    mats: [
      { id: "q4a", text: [{ tex: "\\angle A" }, { pre: "의 이등분선을 그어 밑변과 만나는 점을" }, { tex: "D" }, { pre: "라 하자." }], kind: "axiom" },
      { id: "q4b", text: [{ pre: "두 변의 길이와 그 끼인각이 각각 같으면 두 삼각형은 합동이다." }], kind: "theorem" },
      { id: "q4c", text: [{ pre: "합동인 두 삼각형의 대응각의 크기는 서로 같다." }], kind: "def" },
      { id: "q4d", text: [{ tex: "\\overline{AB} = \\overline{AC}" }, { pre: "이다." }], kind: "given" },
      { id: "q4e", text: [{ tex: "\\angle B" }, { pre: "와" }, { tex: "\\angle C" }, { pre: "는 같다." }], kind: "conclusion" },
      { id: "q4f", text: [{ pre: "그림에서 두 각이 같아 보인다." }], kind: "picture" },
      { id: "q4g", text: [{ pre: "삼각형의 세 내각의 크기의 합은" }, { tex: "180^\\circ" }, { pre: "이다." }], kind: "unrelated" },
    ],
    order: [5, 3, 1, 6, 0, 4, 2],
    note: "「삼각형의 세 내각의 합」은 참인 정리지만 이 증명에서는 쓸 자리가 없어요. 참이라고 다 쓰는 것이 아니랍니다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 탭 ④ 증명 조각 맞추기
// ══════════════════════════════════════════════════════════════
export type StepTask = {
  id: string;
  emoji: string;
  claim: Piece[];
  kind: ProofKind;
  /** 올바른 차례대로 놓은 조각 */
  steps: Piece[][];
  /** 끼어든 가짜 조각 */
  decoys: { text: Piece[]; why: string }[];
  /** 화면에 흩어 놓는 차례 — 앞쪽이 steps, 뒤쪽이 decoys 인 통합 배열의 순열 */
  scatter: number[];
  tip: string;
  note: string;
};

export const STEPS: StepTask[] = [
  {
    id: "z1",
    emoji: "✖️",
    claim: [{ pre: "맞꼭지각의 크기는 서로 같다." }],
    kind: "deductive",
    steps: [
      [{ tex: "\\angle a" }, { pre: "와" }, { tex: "\\angle b" }, { pre: "는 평각을 이루므로" }, { tex: "\\angle a + \\angle b = 180^\\circ" }],
      [{ tex: "\\angle b" }, { pre: "와" }, { tex: "\\angle c" }, { pre: "도 평각을 이루므로" }, { tex: "\\angle b + \\angle c = 180^\\circ" }],
      [{ pre: "두 식의 좌변끼리 같으므로" }, { tex: "\\angle a + \\angle b = \\angle b + \\angle c" }],
      [{ pre: "양변에서" }, { tex: "\\angle b" }, { pre: "를 빼면" }, { tex: "\\angle a = \\angle c" }],
    ],
    decoys: [
      { text: [{ pre: "그림에서" }, { tex: "\\angle a" }, { pre: "와" }, { tex: "\\angle c" }, { pre: "가 같아 보인다." }], why: "그림의 모양만으로 결론을 내리면 안 돼요." },
      { text: [{ tex: "\\angle a = \\angle c" }, { pre: "이므로 맞꼭지각은 서로 같다." }], why: "증명하려는 결론을 중간에 끌어다 쓰면 순환 논증이 돼요." },
    ],
    scatter: [2, 5, 0, 4, 3, 1],
    tip: "평각을 이루는 두 각의 쌍을 먼저 두 개 찾아 식으로 적어 보세요.",
    note: "두 식에 공통으로 들어 있는 각을 지우는 것이 핵심이에요. 등식의 성질(같은 것에서 같은 것을 빼면 같다)이 그 근거랍니다.",
  },
  {
    id: "z2",
    emoji: "➕",
    claim: [{ pre: "두 홀수의 합은 짝수이다." }],
    kind: "deductive",
    steps: [
      [{ pre: "두 자연수" }, { tex: "m, n" }, { pre: "이 모두 홀수이면" }, { tex: "m = 2k-1,\\ n = 2l-1" }, { pre: "로 놓을 수 있다." }],
      [{ tex: "m + n = (2k-1) + (2l-1) = 2k + 2l - 2" }],
      [{ tex: "= 2(k + l - 1)" }],
      [{ tex: "k + l - 1" }, { pre: "은 정수이므로" }, { tex: "m+n" }, { pre: "은 2의 배수, 곧 짝수이다." }],
    ],
    decoys: [
      { text: [{ tex: "1+1=2,\\ 1+3=4,\\ 3+3=6" }, { pre: "이므로 참이다." }], why: "사례 몇 개를 확인한 것은 증명이 아니에요. 모든 홀수 쌍을 다 확인할 수는 없으니까요." },
      { text: [{ tex: "m + n" }, { pre: "이 짝수이므로" }, { tex: "m+n = 2s" }, { pre: "로 놓자." }], why: "증명하려는 결론을 출발점으로 삼아 버렸어요." },
    ],
    scatter: [4, 1, 0, 5, 3, 2],
    tip: "먼저 「홀수」라는 가정을 문자식으로 옮겨 적는 것부터 시작하세요.",
    note: "가정을 식으로 옮기고 → 계산하고 → 결론의 정의에 맞춰 읽는 세 걸음이 연역적 증명의 기본 틀이에요.",
  },
  {
    id: "z3",
    emoji: "↩️",
    claim: [{ tex: "n^2" }, { pre: "이 짝수이면" }, { tex: "n" }, { pre: "은 짝수이다." }],
    kind: "contrapositive",
    steps: [
      [{ pre: "주어진 명제의 대우인" }, { pre: "「" }, { tex: "n" }, { pre: "이 홀수이면" }, { tex: "n^2" }, { pre: "은 홀수이다」를 증명하자." }],
      [{ tex: "n" }, { pre: "이 홀수이면" }, { tex: "n = 2k+1" }, { pre: "(" }, { tex: "k" }, { pre: "는 0 이상의 정수) 로 놓을 수 있다." }],
      [{ tex: "n^2 = (2k+1)^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1" }],
      [{ tex: "2k^2 + 2k" }, { pre: "는 정수이므로" }, { tex: "n^2" }, { pre: "은 홀수이다." }],
      [{ pre: "대우가 참이므로 원래 명제도 참이다." }],
    ],
    decoys: [
      { text: [{ tex: "n" }, { pre: "이 짝수이므로" }, { tex: "n = 2k" }, { pre: "로 놓자." }], why: "결론을 가정으로 삼아 버렸어요. 대우법에서도 증명하려는 것을 먼저 쓸 수는 없어요." },
      { text: [{ pre: "명제의 역인 「" }, { tex: "n" }, { pre: "이 짝수이면" }, { tex: "n^2" }, { pre: "이 짝수이다」를 증명하자." }], why: "역은 원래 명제와 참·거짓이 관련이 없어요. 증명해야 할 것은 대우랍니다." },
    ],
    scatter: [5, 0, 2, 6, 1, 4, 3],
    tip: "맨 처음에 「무엇을 대신 증명할 것인지」를 밝혀 두어야 해요.",
    note: "대우법은 마지막에 「대우가 참이므로 원래 명제도 참」이라고 매듭을 지어야 증명이 끝납니다.",
  },
  {
    id: "z4",
    emoji: "💥",
    claim: [{ tex: "\\sqrt{2}" }, { pre: "는 무리수이다." }],
    kind: "contradiction",
    steps: [
      [{ tex: "\\sqrt{2}" }, { pre: "가 유리수라고 가정하자." }],
      [{ pre: "그러면 서로소인 두 자연수" }, { tex: "p, q" }, { pre: "에 대하여" }, { tex: "\\sqrt{2} = \\dfrac{q}{p}" }, { pre: "로 놓을 수 있다." }],
      [{ pre: "양변을 제곱하면" }, { tex: "q^2 = 2p^2" }, { pre: "이므로" }, { tex: "q^2" }, { pre: "은 짝수이고, 따라서" }, { tex: "q" }, { pre: "도 짝수이다." }],
      [{ tex: "q = 2r" }, { pre: "로 놓으면" }, { tex: "4r^2 = 2p^2" }, { pre: ", 곧" }, { tex: "p^2 = 2r^2" }, { pre: "이므로" }, { tex: "p" }, { pre: "도 짝수이다." }],
      [{ tex: "p" }, { pre: "와" }, { tex: "q" }, { pre: "가 모두 짝수이므로 서로소라는 것에 모순이다." }],
      [{ pre: "따라서" }, { tex: "\\sqrt{2}" }, { pre: "는 유리수가 아니다. 곧 무리수이다." }],
    ],
    decoys: [
      { text: [{ tex: "\\sqrt{2}" }, { pre: "는 무리수이므로 분수로 나타낼 수 없다." }], why: "증명하려는 결론을 중간에 끌어다 쓰면 순환 논증이 돼요." },
      { text: [{ pre: "계산기로 보면" }, { tex: "\\sqrt{2} = 1.41421356\\dots" }, { pre: "로 끝나지 않는다." }], why: "소수점을 아무리 길게 적어도 그 뒤를 알 수 없어요. 증명이 되지 못합니다." },
    ],
    scatter: [6, 1, 3, 0, 7, 5, 2, 4],
    tip: "귀류법은 「…라고 가정하자」로 시작해서 「모순이다」를 거쳐 「따라서 …이다」로 끝나요.",
    note: "귀류법에서 모순은 대개 처음에 붙여 둔 조건(여기서는 「서로소」)과 부딪히면서 드러납니다.",
  },
];

/** 조각과 가짜 조각을 합친 통합 배열 */
export function allPieces(t: StepTask): { text: Piece[]; idx: number; decoyWhy?: string }[] {
  const out: { text: Piece[]; idx: number; decoyWhy?: string }[] = [];
  t.steps.forEach((s, i) => out.push({ text: s, idx: i }));
  t.decoys.forEach((d, i) => out.push({ text: d.text, idx: t.steps.length + i, decoyWhy: d.why }));
  return out;
}
