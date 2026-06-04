"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "cipher_invertibility",
    prompt:
      "암호화 식 B = A + M 과 해독식 A = B − M 은 서로 ‘역연산’ 입니다. 이 사실이 왜 ‘열쇠행렬 M 을 모르면 해독할 수 없다’ 라는 보안성을 만드는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 행렬 덧셈에는 역연산 (뺄셈) 이 존재하므로, B 만 알아도 M 을 알면 A = B − M 으로 복원할 수 있다. 그러나 M 을 모르면 B 의 각 성분에 어떤 값이 더해졌는지 알 수 없으므로 A 를 복원할 수 없다. 즉 M 이 ‘열쇠’ 역할을 한다 — 같은 B 라도 다른 M 으로 만들면 완전히 다른 A 가 나온다. 같은 방향의 다른 비유: 더하기 5 와 빼기 5 가 짝을 이루듯, 행렬 +M 과 −M 이 짝을 이뤄야만 원래대로 돌아온다.",
  },
  {
    id: "challenge_strategy",
    prompt:
      "도전 탭의 5 문제 중 가장 어려웠던 챌린지를 골라, 해독 과정에서 무엇이 헷갈렸는지 + 음수 처리나 1 ~ 26 범위 확인 등 어떻게 검증했는지 자신만의 전략을 적어 보세요.",
    kind: "text",
    placeholder:
      "예: ‘COOL’ 도전이 가장 어려웠다. M = [[5, −7], [−2, 4]] 에서 (1, 2) 성분이 −7 이라 B − M = B + 7 이 되어 일순간 ‘B 의 값이 작아져야 하나?’ 헷갈렸다. 전략: M 의 부호를 미리 적어두고 ‘− (음수) = + (양수)’ 변환을 항상 먼저 해서 부호 실수를 줄였다. 또 계산 결과가 1 ~ 26 을 벗어나면 (예: 0 이나 30) 그건 잘못 계산했다는 신호 — 알파벳에 없는 번호 이므로 다시 검산.",
  },
];

// ─── 데이터 ────────────────────────────────────────────────
// 열쇠행렬 (고정)
const M: number[][] = [
  [5, -7],
  [-2, 4],
];

const CHALLENGES = ["HOME", "GIFT", "MOON", "COOL", "LION"];

// ─── 헬퍼 ─────────────────────────────────────────────────
function mAdd(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}
function mSub(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}
function n2l(n: number): string {
  return n >= 1 && n <= 26 ? String.fromCharCode(64 + n) : "?";
}
function mat2word(m: number[][]): string {
  return [m[0][0], m[0][1], m[1][0], m[1][1]].map(n2l).join("");
}
function isValidWord(m: number[][]): boolean {
  return [m[0][0], m[0][1], m[1][0], m[1][1]].every((n) => n >= 1 && n <= 26);
}
function word2mat(word: string): number[][] {
  const nums = word.split("").map((c) => c.charCodeAt(0) - 64);
  return [
    [nums[0], nums[1]],
    [nums[2], nums[3]],
  ];
}

// ─── 메인 ─────────────────────────────────────────────────
type Tab = "pri" | "enc" | "dec" | "chall";

export default function MatrixCipherExplorer() {
  const [tab, setTab] = useState<Tab>("pri");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🔐 행렬 암호 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          행렬의 <b className="text-cyan-300">덧셈 · 뺄셈</b> 이 서로 역연산임을
          이용해 단어를 암호화 · 해독하는 시저 암호의 행렬 버전을 탐구해 봅시다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <TabBtn active={tab === "pri"} onClick={() => setTab("pri")}>
          📖 원리
        </TabBtn>
        <TabBtn active={tab === "enc"} onClick={() => setTab("enc")}>
          ✏️ 암호 만들기
        </TabBtn>
        <TabBtn active={tab === "dec"} onClick={() => setTab("dec")}>
          🔓 해독하기
        </TabBtn>
        <TabBtn active={tab === "chall"} onClick={() => setTab("chall")}>
          🎯 도전!
        </TabBtn>
      </div>

      <div className={tab === "pri" ? "mt-5" : "mt-5 hidden"}>
        <PrinciplePanel onNext={() => setTab("enc")} />
      </div>
      <div className={tab === "enc" ? "mt-5" : "mt-5 hidden"}>
        <EncodePanel />
      </div>
      <div className={tab === "dec" ? "mt-5" : "mt-5 hidden"}>
        <DecodePanel />
      </div>
      <div className={tab === "chall" ? "mt-5" : "mt-5 hidden"}>
        <ChallengePanel />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2.5 text-center text-[11px] font-bold transition sm:text-xs " +
        (active
          ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/25"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 UI ──────────────────────────────────────────────
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">{children}</div>
  );
}
function CardTitle({ children }: { children: ReactNode }) {
  return <p className="text-sm font-extrabold text-cyan-200">{children}</p>;
}
function HintBox({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2 text-xs leading-7 text-slate-200">
      {children}
    </p>
  );
}
function WarnBox({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-rose-400/45 bg-rose-400/15 px-3 py-2 text-sm font-bold text-rose-100">
      {children}
    </p>
  );
}
function OkBox({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-emerald-400/45 bg-emerald-400/15 px-3 py-2 text-sm font-bold text-emerald-100">
      {children}
    </p>
  );
}

function MatrixBracket({
  children,
  n,
  cellH = 36,
  gap = 4,
}: {
  children: ReactNode;
  n: number;
  cellH?: number;
  gap?: number;
}) {
  const h = n * cellH + (n - 1) * gap + 4;
  return (
    <span className="inline-flex items-stretch gap-0.5">
      <svg width={9} height={h} viewBox={`0 0 9 ${h}`} aria-hidden>
        <path
          d={`M 7 1 L 1 1 L 1 ${h - 1} L 7 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
      <span>{children}</span>
      <svg width={9} height={h} viewBox={`0 0 9 ${h}`} aria-hidden>
        <path
          d={`M 2 1 L 8 1 L 8 ${h - 1} L 2 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

type MatColor = "blue" | "purple" | "gold" | "green";
const MAT_COLOR: Record<MatColor, string> = {
  blue: "#93c5fd",
  purple: "#c4b5fd",
  gold: "#fbbf24",
  green: "#4ade80",
};

function Mat2x2({
  data,
  color = "blue",
  cellW = 44,
}: {
  data: number[][];
  color?: MatColor;
  cellW?: number;
}) {
  return (
    <MatrixBracket n={2}>
      <span
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(2, ${cellW}px)` }}
      >
        {data.flat().map((v, i) => (
          <span
            key={i}
            className="flex h-9 items-center justify-center rounded-sm border border-white/10 bg-slate-900 font-mono text-sm font-bold"
            style={{ color: MAT_COLOR[color] }}
          >
            {v}
          </span>
        ))}
      </span>
    </MatrixBracket>
  );
}

function EqRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-sm">
      {children}
    </div>
  );
}
function Op({ children }: { children: ReactNode }) {
  return <span className="text-lg font-bold text-slate-400">{children}</span>;
}

// ═══════════════════════════════════════════════════════════
//  TAB 0 — 원리
// ═══════════════════════════════════════════════════════════

function PrinciplePanel({ onNext }: { onNext: () => void }) {
  const [hiIdx, setHiIdx] = useState<number | null>(null);
  const az = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // LOVE 예시 계산
  const word = "LOVE";
  const nums = word.split("").map((c) => c.charCodeAt(0) - 64);
  const A: number[][] = [
    [nums[0], nums[1]],
    [nums[2], nums[3]],
  ];
  const B = mAdd(A, M);

  return (
    <div className="space-y-3">
      {/* 알파벳 대응표 */}
      <Card>
        <CardTitle>🔡 알파벳 ↔ 숫자 대응표</CardTitle>
        <div className="mt-2 grid grid-cols-13 gap-1 sm:grid-cols-13" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
          {az.map((l, i) => (
            <button
              key={l}
              type="button"
              onClick={() => setHiIdx(i)}
              className={
                "flex flex-col items-center justify-center rounded-md border py-1.5 text-[11px] font-bold transition " +
                (hiIdx === i
                  ? "border-amber-300/60 bg-amber-300/15 text-amber-100"
                  : "border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800")
              }
            >
              <span className="text-sm">{l}</span>
              <span className="text-[10px] text-slate-400">{i + 1}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          글자를 클릭하면 해당 번호가 강조됩니다 (A = 1, B = 2, …, Z = 26)
        </p>
      </Card>

      {/* 열쇠행렬 M */}
      <Card>
        <CardTitle>🔑 열쇠행렬 M</CardTitle>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-lg font-extrabold text-amber-300">M =</p>
            <div className="mt-2">
              <Mat2x2 data={M} color="gold" />
            </div>
          </div>
          <div className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm leading-8 text-slate-300">
            📤 <b className="text-sky-300">암호화</b>: B = A + M
            <br />
            📥 <b className="text-pink-300">해독</b>: A = B − M
            <p className="mt-2 text-xs text-slate-500">
              열쇠행렬 M 을 알아야만 해독할 수 있어요!
            </p>
          </div>
        </div>
      </Card>

      {/* LOVE 예시 */}
      <Card>
        <CardTitle>📝 예시: &apos;LOVE&apos; 암호화 단계별 풀이</CardTitle>
        <div className="mt-3 space-y-3">
          <Step n="①" title="'L', 'O', 'V', 'E' → 번호로 변환">
            <div className="flex flex-wrap justify-center gap-2">
              {word.split("").map((c, i) => (
                <CharBadge key={i} letter={c} num={nums[i]} />
              ))}
            </div>
          </Step>
          <Step n="②" title="번호를 2×2 행렬 A 로 배열 (행 순서대로)">
            <EqRow>
              <span>A =</span>
              <Mat2x2 data={A} color="blue" />
              <span className="text-xs text-slate-500">
                (첫행: L, O / 둘째행: V, E)
              </span>
            </EqRow>
          </Step>
          <Step n="③" title="암호 행렬 B = A + M 계산">
            <EqRow>
              <span>B =</span>
              <Mat2x2 data={A} color="blue" />
              <Op>+</Op>
              <Mat2x2 data={M} color="gold" />
              <Op>=</Op>
              <Mat2x2 data={B} color="green" />
            </EqRow>
          </Step>
          <Step n="④" title="해독: A = B − M 으로 복원">
            <EqRow>
              <span>A =</span>
              <Mat2x2 data={B} color="green" />
              <Op>−</Op>
              <Mat2x2 data={M} color="gold" />
              <Op>=</Op>
              <Mat2x2 data={A} color="blue" />
              <span className="font-extrabold text-emerald-300">→ LOVE ✓</span>
            </EqRow>
          </Step>
        </div>
      </Card>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:brightness-110"
        >
          ✏️ 직접 해보기 ▶
        </button>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
      <p className="text-xs font-bold text-cyan-300">
        <span className="mr-1 text-amber-300">{n}</span>
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function CharBadge({ letter, num }: { letter: string; num: number }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-white/10 bg-slate-900 px-3 py-1.5">
      <span className="text-base font-extrabold text-amber-300">{letter}</span>
      <span className="text-xs text-slate-500">↓</span>
      <span className="font-mono text-sm font-bold text-emerald-300">{num}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 암호 만들기
// ═══════════════════════════════════════════════════════════

function EncodePanel() {
  const [input, setInput] = useState("");
  const raw = input.toUpperCase().replace(/[^A-Z]/g, "");
  const isReady = raw.length === 4;

  const nums = isReady
    ? raw.split("").map((c) => c.charCodeAt(0) - 64)
    : [];
  const A: number[][] | null = isReady
    ? [
        [nums[0], nums[1]],
        [nums[2], nums[3]],
      ]
    : null;
  const B = A ? mAdd(A, M) : null;

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>✏️ 나만의 암호 만들기</CardTitle>
        <div className="mt-3 flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400">영어 4 글자 단어를 입력하세요</p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={4}
            placeholder="WORD"
            aria-label="암호화할 단어"
            className="w-48 rounded-md border border-white/15 bg-slate-900 px-3 py-2 text-center text-xl font-extrabold uppercase tracking-widest text-amber-200 [color-scheme:dark]"
          />
          <p className="text-xs text-slate-500">{raw.length} / 4 글자</p>
        </div>

        {isReady && A && B ? (
          <div className="mt-4 space-y-3">
            <Step n="①" title="각 문자 → 번호">
              <div className="flex flex-wrap justify-center gap-2">
                {raw.split("").map((c, i) => (
                  <CharBadge key={i} letter={c} num={nums[i]} />
                ))}
              </div>
            </Step>
            <Step n="②" title="번호 → 2×2 행렬 A">
              <EqRow>
                <span>A =</span>
                <Mat2x2 data={A} color="blue" />
              </EqRow>
            </Step>
            <Step n="③" title="암호 행렬 B = A + M">
              <EqRow>
                <span>B =</span>
                <Mat2x2 data={A} color="blue" />
                <Op>+</Op>
                <Mat2x2 data={M} color="gold" />
                <Op>=</Op>
                <Mat2x2 data={B} color="green" />
              </EqRow>
            </Step>
            <OkBox>
              <b>암호화 완료!</b> &lsquo;{raw}&rsquo; 의 암호 행렬 B = [[{B[0][0]}, {B[0][1]}], [
              {B[1][0]}, {B[1][1]}]]
            </OkBox>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 해독하기
// ═══════════════════════════════════════════════════════════

// 해독 가능한 단어들 (4 글자, A 의 모든 성분이 1~26) → B 자동 계산
const DEC_CANDIDATE_WORDS = [
  "LOVE", // [17, 8, 20, 9]
  "HOME", // [13, 8, 11, 9]
  "GIFT", // [12, 2, 4, 24]
  "BOOK", // [7, 8, 13, 15]
  "FIRE", // [11, 2, 16, 9]
  "MILK", // [18, 2, 10, 15]
  "MOON", // [18, 8, 13, 18]
  "STAR", // [24, 13, -1, 22]
];

const DEC_EXAMPLES: { word: string; B: [number, number, number, number] }[] =
  DEC_CANDIDATE_WORDS.map((w) => {
    const A = word2mat(w);
    const B = mAdd(A, M);
    return { word: w, B: [B[0][0], B[0][1], B[1][0], B[1][1]] };
  });

function DecodePanel() {
  const [b11, setB11] = useState("");
  const [b12, setB12] = useState("");
  const [b21, setB21] = useState("");
  const [b22, setB22] = useState("");
  const [result, setResult] = useState<
    | null
    | { kind: "warn"; text: string }
    | { kind: "ok"; A: number[][]; B: number[][]; word: string }
    | { kind: "outRange"; A: number[][]; B: number[][] }
  >(null);

  function doDecode() {
    const vals = [b11, b12, b21, b22].map((s) => parseInt(s, 10));
    if (vals.some((v) => Number.isNaN(v))) {
      setResult({ kind: "warn", text: "⚠️ 네 칸을 모두 입력해주세요!" });
      return;
    }
    const Bmat: number[][] = [
      [vals[0], vals[1]],
      [vals[2], vals[3]],
    ];
    const Amat = mSub(Bmat, M);
    if (isValidWord(Amat)) {
      setResult({ kind: "ok", A: Amat, B: Bmat, word: mat2word(Amat) });
    } else {
      setResult({ kind: "outRange", A: Amat, B: Bmat });
    }
  }

  function loadCandidate(ex: [number, number, number, number]) {
    setB11(String(ex[0]));
    setB12(String(ex[1]));
    setB21(String(ex[2]));
    setB22(String(ex[3]));
    // 즉시 계산
    const Bmat: number[][] = [
      [ex[0], ex[1]],
      [ex[2], ex[3]],
    ];
    const Amat = mSub(Bmat, M);
    if (isValidWord(Amat)) {
      setResult({ kind: "ok", A: Amat, B: Bmat, word: mat2word(Amat) });
    } else {
      setResult({ kind: "outRange", A: Amat, B: Bmat });
    }
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>🔓 암호 행렬 B → 단어 찾기</CardTitle>
        <HintBox>
          오른쪽 <b className="text-amber-300">해독 가능한 후보</b> 중 하나를 골라
          클릭하거나, 직접 B 의 값을 입력해 보세요. A = B − M 으로 계산해 원래
          단어를 알려드립니다.
        </HintBox>

        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          {/* 왼쪽: B 입력 + 결과 */}
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-slate-400">암호 행렬 B 입력</p>
              <div className="flex items-stretch gap-1">
                <span className="self-stretch text-2xl text-violet-300">[</span>
                <div className="grid grid-cols-2 gap-1.5 py-1">
                  <input
                    type="number"
                    value={b11}
                    onChange={(e) => setB11(e.target.value)}
                    placeholder="b₁₁"
                    aria-label="b 1 1"
                    className="w-16 rounded-md border border-white/15 bg-slate-900 px-1 py-1.5 text-center font-mono text-sm font-bold text-violet-200 [color-scheme:dark]"
                  />
                  <input
                    type="number"
                    value={b12}
                    onChange={(e) => setB12(e.target.value)}
                    placeholder="b₁₂"
                    aria-label="b 1 2"
                    className="w-16 rounded-md border border-white/15 bg-slate-900 px-1 py-1.5 text-center font-mono text-sm font-bold text-violet-200 [color-scheme:dark]"
                  />
                  <input
                    type="number"
                    value={b21}
                    onChange={(e) => setB21(e.target.value)}
                    placeholder="b₂₁"
                    aria-label="b 2 1"
                    className="w-16 rounded-md border border-white/15 bg-slate-900 px-1 py-1.5 text-center font-mono text-sm font-bold text-violet-200 [color-scheme:dark]"
                  />
                  <input
                    type="number"
                    value={b22}
                    onChange={(e) => setB22(e.target.value)}
                    placeholder="b₂₂"
                    aria-label="b 2 2"
                    className="w-16 rounded-md border border-white/15 bg-slate-900 px-1 py-1.5 text-center font-mono text-sm font-bold text-violet-200 [color-scheme:dark]"
                  />
                </div>
                <span className="self-stretch text-2xl text-violet-300">]</span>
              </div>
              <button
                type="button"
                onClick={doDecode}
                className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:brightness-110"
              >
                🔓 해독하기
              </button>
            </div>

            {result ? (
              <div className="space-y-2">
                {result.kind === "warn" ? (
                  <WarnBox>{result.text}</WarnBox>
                ) : (
                  <>
                    <Step n="" title="계산 과정: A = B − M">
                      <EqRow>
                        <span>A =</span>
                        <Mat2x2 data={result.B} color="purple" />
                        <Op>−</Op>
                        <Mat2x2 data={M} color="gold" />
                        <Op>=</Op>
                        <Mat2x2 data={result.A} color="blue" />
                      </EqRow>
                    </Step>
                    {result.kind === "ok" ? (
                      <p className="rounded-xl border-2 border-emerald-400/55 bg-emerald-400/15 px-4 py-4 text-center text-3xl font-extrabold tracking-widest text-emerald-100">
                        🎉 {result.word}
                      </p>
                    ) : (
                      <WarnBox>
                        결과 값이 1 ~ 26 범위를 벗어났습니다. 입력값을 다시
                        확인해주세요.
                        <br />A = [[{result.A[0][0]}, {result.A[0][1]}], [
                        {result.A[1][0]}, {result.A[1][1]}]]
                      </WarnBox>
                    )}
                  </>
                )}
              </div>
            ) : null}
          </div>

          {/* 오른쪽: 해독 가능 후보 */}
          <div className="rounded-xl border border-amber-300/40 bg-amber-300/[0.06] p-3 lg:w-56">
            <p className="text-sm font-extrabold text-amber-200">
              💡 해독 가능한 후보
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              아무 숫자나 넣으면 단어가 안 나와요. 아래 후보를 클릭해 자동 입력
              후 해독해 보세요.
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {DEC_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => loadCandidate(ex.B)}
                  className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-left font-mono text-xs text-slate-200 transition hover:border-amber-300/55 hover:bg-amber-300/10"
                  title={`정답: ${ex.word}`}
                >
                  <span className="block text-[10px] font-bold text-amber-300">
                    후보 {i + 1}
                  </span>
                  <span className="block">
                    B = [[{ex.B[0]}, {ex.B[1]}],
                  </span>
                  <span className="block pl-10">
                    &nbsp;&nbsp;[{ex.B[2]}, {ex.B[3]}]]
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 도전
// ═══════════════════════════════════════════════════════════

function ChallengePanel() {
  const [solved, setSolved] = useState<Set<number>>(new Set());

  function markSolved(idx: number) {
    setSolved((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  }

  const allDone = solved.size === CHALLENGES.length;

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>🎯 암호 해독 챌린지</CardTitle>
        <HintBox>
          암호 행렬 B 를 보고 A = B − M 을 계산해 단어를 맞혀보세요!
        </HintBox>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 rounded-lg border border-white/10 bg-slate-950/60 p-3">
          <p className="text-sm font-bold text-amber-300">🔑 열쇠행렬 M =</p>
          <Mat2x2 data={M} color="gold" />
          <p className="text-xs text-slate-500">→ A = B − M 으로 해독</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {CHALLENGES.map((_, i) => (
            <span
              key={i}
              className={
                "h-3 w-3 rounded-full transition " +
                (solved.has(i)
                  ? "bg-emerald-400 shadow-lg shadow-emerald-400/40"
                  : "bg-white/15")
              }
            />
          ))}
          <p className="ml-2 text-xs font-bold text-slate-400">
            {solved.size} / {CHALLENGES.length} 해결
          </p>
        </div>
      </Card>

      {CHALLENGES.map((word, i) => (
        <ChallengeCard
          key={i}
          idx={i}
          word={word}
          solved={solved.has(i)}
          onSolve={() => markSolved(i)}
        />
      ))}

      {allDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/15 p-5 text-center">
          <div className="text-5xl">🏆</div>
          <p className="mt-2 text-xl font-extrabold text-emerald-100">
            모든 암호 해독 완료!
          </p>
          <p className="mt-1 text-sm text-emerald-50/85">
            행렬 덧셈 · 뺄셈의 달인이 됐어요!
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ChallengeCard({
  idx,
  word,
  solved,
  onSolve,
}: {
  idx: number;
  word: string;
  solved: boolean;
  onSolve: () => void;
}) {
  const A = word2mat(word);
  const B = mAdd(A, M);

  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | "ok" | "ng" | "warn">(null);
  const [showHint, setShowHint] = useState(false);

  function check() {
    const guess = input.toUpperCase().trim();
    if (guess.length !== 4) {
      setResult("warn");
      return;
    }
    if (guess === word) {
      setResult("ok");
      onSolve();
    } else {
      setResult("ng");
    }
  }

  return (
    <div
      className={
        "rounded-xl border bg-white/[0.04] p-4 transition " +
        (solved
          ? "border-emerald-400/45 bg-emerald-400/[0.06]"
          : "border-white/10")
      }
    >
      <p className="text-sm font-extrabold text-violet-200">도전 {idx + 1}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold text-slate-400">암호 행렬 B =</span>
        <Mat2x2 data={B} color="purple" />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        A = B − M 을 계산해 단어를 맞혀보세요!
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && check()}
          maxLength={4}
          placeholder="????"
          disabled={solved}
          aria-label={`도전 ${idx + 1} 답`}
          className="w-32 rounded-md border border-white/15 bg-slate-900 px-3 py-1.5 text-center text-base font-extrabold uppercase tracking-widest text-amber-200 disabled:opacity-50 [color-scheme:dark]"
        />
        <button
          type="button"
          onClick={check}
          disabled={solved}
          className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50"
        >
          확인!
        </button>
        <button
          type="button"
          onClick={() => setShowHint(true)}
          disabled={solved}
          className="rounded-full border border-amber-300/45 bg-amber-300/10 px-4 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-300/20 disabled:opacity-50"
        >
          💡 힌트
        </button>
      </div>

      {result === "ok" ? (
        <OkBox>
          🎉 정답! <b>{input}</b> 맞습니다!
        </OkBox>
      ) : result === "ng" ? (
        <WarnBox>❌ 틀렸어요. 다시 계산해보세요!</WarnBox>
      ) : result === "warn" ? (
        <WarnBox>⚠️ 4 글자를 입력하세요!</WarnBox>
      ) : null}

      {showHint && !solved ? (
        <div className="mt-2 rounded-lg border border-amber-300/35 bg-amber-300/10 p-2 text-xs">
          <p className="text-amber-200">
            힌트: A = <span className="ml-1 inline-block align-middle">
              <Mat2x2 data={A} color="blue" cellW={36} />
            </span>{" "}
            → 각 숫자를 알파벳으로 바꿔보세요!
          </p>
        </div>
      ) : null}
    </div>
  );
}
