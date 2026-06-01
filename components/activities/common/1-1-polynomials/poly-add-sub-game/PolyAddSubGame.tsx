"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 데이터 ─────────────────────────────────────────────────
type Term = { d: number; c: number };
type Problem = {
  label: string;
  op: "+" | "−";
  a: Term[];
  b: Term[];
};

const PROBLEMS: Problem[] = [
  {
    label: "① 덧셈 (3차)",
    op: "+",
    a: [{ d: 1, c: -2 }, { d: 3, c: 1 }, { d: 0, c: 1 }, { d: 2, c: 3 }],
    b: [{ d: 2, c: -1 }, { d: 3, c: 2 }, { d: 1, c: 4 }, { d: 0, c: 2 }],
  },
  {
    label: "② 뺄셈 (3차)",
    op: "−",
    a: [{ d: 0, c: -1 }, { d: 2, c: 5 }, { d: 3, c: 4 }, { d: 1, c: 3 }],
    b: [{ d: 1, c: 2 }, { d: 3, c: 1 }, { d: 2, c: -3 }, { d: 0, c: -4 }],
  },
  {
    label: "③ 덧셈 — 일부 항 소거 (3차)",
    op: "+",
    a: [{ d: 3, c: 2 }, { d: 0, c: 3 }, { d: 2, c: -1 }],
    b: [{ d: 1, c: 2 }, { d: 2, c: 1 }, { d: 0, c: -3 }],
  },
  {
    label: "④ 뺄셈 (4차)",
    op: "−",
    a: [{ d: 2, c: 2 }, { d: 4, c: 3 }, { d: 1, c: -1 }, { d: 0, c: 6 }],
    b: [{ d: 4, c: 1 }, { d: 2, c: -3 }, { d: 1, c: 2 }, { d: 0, c: -4 }],
  },
  {
    label: "⑤ 덧셈 — 짝 없는 항 포함 (4차)",
    op: "+",
    a: [{ d: 4, c: 2 }, { d: 0, c: 1 }, { d: 2, c: -4 }],
    b: [{ d: 2, c: 2 }, { d: 3, c: 3 }, { d: 1, c: -3 }, { d: 0, c: 5 }],
  },
  {
    label: "⑥ 뺄셈 (4차) — 일부 항 소거",
    op: "−",
    a: [{ d: 4, c: 2 }, { d: 3, c: -1 }, { d: 2, c: 3 }, { d: 0, c: 4 }],
    b: [{ d: 4, c: 2 }, { d: 1, c: 2 }, { d: 2, c: 1 }, { d: 0, c: -2 }],
  },
  {
    label: "⑦ 뺄셈 — 전항 소거",
    op: "−",
    a: [{ d: 2, c: 3 }, { d: 1, c: 2 }, { d: 0, c: -5 }],
    b: [{ d: 1, c: 2 }, { d: 2, c: 3 }, { d: 0, c: -5 }],
  },
];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "like_terms",
    prompt:
      "두 다항식의 덧셈·뺄셈을 할 때 왜 ‘같은 차수의 항끼리만’ 모아서 계산해야 하는지, 그리고 뺄셈일 때 두 번째 다항식의 부호가 어떻게 바뀌는지 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: x²와 x는 서로 다른 양이라 더할 수 없고, 차수가 같아야 같은 종류로 묶을 수 있다. 뺄셈에서는 B의 모든 항에 (−1)을 곱한 셈이 되므로 부호가 모두 반대가 된다.",
  },
];

// ─── 유틸 ───────────────────────────────────────────────────
const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
function sup(n: number) {
  return String(n)
    .split("")
    .map((c) => SUP[Number(c)] ?? c)
    .join("");
}
function varStr(d: number) {
  return d === 0 ? "" : d === 1 ? "x" : `x${sup(d)}`;
}
function termText(c: number, d: number, withLeadingSign: boolean): string {
  if (c === 0) return "0";
  const abs = Math.abs(c);
  const sign = c < 0 ? "−" : withLeadingSign ? "+" : "";
  const num = abs === 1 && d > 0 ? "" : String(abs);
  return `${sign}${num}${varStr(d)}`;
}
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DEG_NAMES = ["상수항", "일차항", "이차항", "삼차항", "사차항", "오차항"];

// 차수별 색 토큰 (다크 톤) — sort 게임과 동일 톤
const DEG_TONE: Record<
  number,
  { box: string; text: string; ring: string }
> = {
  0: {
    box: "border-amber-400/45 bg-amber-400/15",
    text: "text-amber-200",
    ring: "ring-amber-400/60",
  },
  1: {
    box: "border-emerald-400/45 bg-emerald-400/15",
    text: "text-emerald-200",
    ring: "ring-emerald-400/60",
  },
  2: {
    box: "border-sky-400/45 bg-sky-400/15",
    text: "text-sky-200",
    ring: "ring-sky-400/60",
  },
  3: {
    box: "border-violet-400/45 bg-violet-400/15",
    text: "text-violet-200",
    ring: "ring-violet-400/60",
  },
  4: {
    box: "border-pink-400/45 bg-pink-400/15",
    text: "text-pink-200",
    ring: "ring-pink-400/60",
  },
  5: {
    box: "border-fuchsia-400/45 bg-fuchsia-400/15",
    text: "text-fuchsia-200",
    ring: "ring-fuchsia-400/60",
  },
};
function degTone(d: number) {
  return DEG_TONE[Math.min(d, 5)] ?? DEG_TONE[5];
}

type Poly = "a" | "b";
type Step = { deg: number; expr: string; coef: number };
type Selected = { poly: Poly; deg: number } | null;
type Feedback = { tone: "info" | "ok" | "ng" | "hint"; message: string } | null;

export default function PolyAddSubGame() {
  const [problemIdx, setProblemIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [aOrder, setAOrder] = useState<Term[]>([]);
  const [bOrder, setBOrder] = useState<Term[]>([]);
  const [usedA, setUsedA] = useState<Set<number>>(new Set());
  const [usedB, setUsedB] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Selected>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [coefInputs, setCoefInputs] = useState<Record<number, string>>({});
  const [coefStatus, setCoefStatus] = useState<Record<number, "ok" | "ng">>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [solved, setSolved] = useState(false);

  const problem = PROBLEMS[problemIdx];

  const allUsed = useMemo(
    () => usedA.size === problem.a.length && usedB.size === problem.b.length,
    [usedA, usedB, problem],
  );

  // 결과 = steps 의 차수별 합계 (0 제외, 차수 내림차순)
  const result = useMemo(() => {
    const sorted = [...steps].sort((s1, s2) => s2.deg - s1.deg);
    return sorted.filter((s) => s.coef !== 0);
  }, [steps]);

  // 문제 변경 → 모두 초기화
  useEffect(() => {
    setAOrder(shuffle(problem.a));
    setBOrder(shuffle(problem.b));
    setUsedA(new Set());
    setUsedB(new Set());
    setSelected(null);
    setSteps([]);
    setCoefInputs({});
    setCoefStatus({});
    setFeedback(null);
    setSolved(false);
  }, [problemIdx, problem]);

  const findTerm = useCallback(
    (poly: Poly, deg: number): Term | undefined =>
      (poly === "a" ? problem.a : problem.b).find((t) => t.d === deg),
    [problem],
  );

  const effectiveCoef = useCallback(
    (poly: Poly, c: number) => (poly === "b" && problem.op === "−" ? -c : c),
    [problem],
  );

  function commitSingle(poly: Poly, deg: number) {
    const t = findTerm(poly, deg);
    if (!t) return;
    const ec = effectiveCoef(poly, t.c);
    const raw = termText(t.c, deg, true);
    const expr = poly === "b" && problem.op === "−" ? `−(${raw})` : raw;
    setSteps((s) => [...s, { deg, expr, coef: ec }]);
    if (poly === "a") setUsedA((u) => new Set(u).add(deg));
    else setUsedB((u) => new Set(u).add(deg));
  }

  function commitPair(deg: number) {
    const tA = findTerm("a", deg);
    const tB = findTerm("b", deg);
    if (!tA || !tB) return;
    const eA = effectiveCoef("a", tA.c);
    const eB = effectiveCoef("b", tB.c);
    const rawA = termText(tA.c, deg, true);
    const rawB = termText(tB.c, deg, true);
    const exprA = rawA;
    const exprB = problem.op === "−" ? `−(${rawB})` : rawB;
    const joiner = exprB.startsWith("−") ? " " : " + ";
    const expr = `${exprA}${joiner}${exprB}`;
    setSteps((s) => [...s, { deg, expr, coef: eA + eB }]);
    setUsedA((u) => new Set(u).add(deg));
    setUsedB((u) => new Set(u).add(deg));
  }

  function onCardClick(poly: Poly, deg: number) {
    const used = poly === "a" ? usedA : usedB;
    if (used.has(deg)) return;

    if (!selected) {
      setSelected({ poly, deg });
      setFeedback({
        tone: "info",
        message: `선택됨: ${DEG_NAMES[Math.min(deg, 5)]}. 같은 차수의 다른 항을 클릭하거나, 짝이 없으면 이 카드를 한 번 더 클릭하세요.`,
      });
      return;
    }

    // 동일 카드 → 단일 처리
    if (selected.poly === poly && selected.deg === deg) {
      commitSingle(poly, deg);
      setSelected(null);
      setFeedback(null);
      return;
    }
    // 다른 다항식 + 같은 차수 → 짝 처리
    if (selected.poly !== poly && selected.deg === deg) {
      commitPair(deg);
      setSelected(null);
      setFeedback(null);
      return;
    }
    // 차수 다름 → 선택 변경 + 경고
    setSelected({ poly, deg });
    setFeedback({
      tone: "ng",
      message: `⚠️ 차수가 다릅니다. 같은 차수의 항끼리만 짝지을 수 있어요. 이제 ${DEG_NAMES[Math.min(deg, 5)]}이 선택되었습니다.`,
    });
  }

  function onAutoMatch() {
    // 짝지을 수 있는 첫 차수
    for (const t of problem.a) {
      if (usedA.has(t.d)) continue;
      const m = problem.b.find((x) => x.d === t.d && !usedB.has(x.d));
      if (m) {
        commitPair(t.d);
        setSelected(null);
        setFeedback(null);
        return;
      }
    }
    // 남은 A 단일
    for (const t of problem.a) {
      if (!usedA.has(t.d)) {
        commitSingle("a", t.d);
        setSelected(null);
        setFeedback(null);
        return;
      }
    }
    // 남은 B 단일
    for (const t of problem.b) {
      if (!usedB.has(t.d)) {
        commitSingle("b", t.d);
        setSelected(null);
        setFeedback(null);
        return;
      }
    }
    setFeedback({ tone: "info", message: "✅ 더 이상 연결할 항이 없습니다." });
  }

  function onReset() {
    setAOrder(shuffle(problem.a));
    setBOrder(shuffle(problem.b));
    setUsedA(new Set());
    setUsedB(new Set());
    setSelected(null);
    setSteps([]);
    setCoefInputs({});
    setCoefStatus({});
    setFeedback(null);
    setSolved(false);
  }

  function onNext() {
    const last = problemIdx === PROBLEMS.length - 1;
    setProblemIdx((i) => (i + 1) % PROBLEMS.length);
    if (last) {
      setFeedback({
        tone: "ok",
        message: "🏆 모든 문제 완료! 처음부터 다시 시작합니다.",
      });
    }
  }

  function onCheck() {
    if (!allUsed) return;
    if (result.length === 0) {
      // 전항 소거 → "0" 입력 기대
      const v = (coefInputs[-1] ?? "").trim();
      if (v === "0") {
        setCoefStatus({ "-1": "ok" });
        setScore((s) => s + 15);
        setSolved(true);
        setFeedback({
          tone: "ok",
          message: "🎉 정답! 모든 동류항이 소거되어 결과는 0입니다. +15점",
        });
      } else {
        setCoefStatus({ "-1": "ng" });
        setFeedback({
          tone: "ng",
          message: "❌ 모든 항이 소거된 경우 결과는 0입니다.",
        });
      }
      return;
    }
    const status: Record<number, "ok" | "ng"> = {};
    let allOk = true;
    for (const s of result) {
      const v = (coefInputs[s.deg] ?? "").trim();
      const n = Number(v);
      const ok = v !== "" && !Number.isNaN(n) && n === s.coef;
      status[s.deg] = ok ? "ok" : "ng";
      if (!ok) allOk = false;
    }
    setCoefStatus(status);
    if (allOk) {
      setScore((sc) => sc + 15);
      setSolved(true);
      setFeedback({ tone: "ok", message: "🎉 정답! 완벽한 계산입니다. +15점" });
    } else {
      setFeedback({
        tone: "ng",
        message: "❌ 빨간 칸을 다시 확인하세요. 음수(−) 부호도 살펴보세요.",
      });
    }
  }

  const progressPct = Math.round((problemIdx / PROBLEMS.length) * 100);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">
          🔗 다항식의 덧셈과 뺄셈 — 동류항 연결 게임
        </h3>
        <p className="mt-2 leading-7 text-slate-300">
          두 다항식 <b className="text-cyan-200">A</b>와 <b className="text-cyan-200">B</b>에서{" "}
          <b className="text-cyan-200">같은 차수의 항</b>(동류항)을 하나씩 클릭하여 짝지어 계산하세요.
          짝이 없는 항은 그 카드를 <b className="text-cyan-200">두 번 클릭</b>하면 단일 항으로
          내려옵니다.
        </p>
      </div>

      {/* ─── 진행 + 점수 ─── */}
      <div className="mt-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-[width] duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="rounded-full border border-cyan-400/45 bg-cyan-400/15 px-4 py-1 font-mono text-sm font-bold text-cyan-100">
          점수 {score}
        </span>
      </div>

      {/* ─── 문제 표시 ─── */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          문제 {problem.label}
        </p>
        <div className="mt-3 grid items-start gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <PolyRow
            label="A"
            terms={aOrder}
            used={usedA}
            selected={selected}
            polyKey="a"
            onClick={onCardClick}
          />
          <div className="self-center font-mono text-3xl font-extrabold text-slate-300">
            {problem.op}
          </div>
          <PolyRow
            label="B"
            terms={bOrder}
            used={usedB}
            selected={selected}
            polyKey="b"
            onClick={onCardClick}
            sign={problem.op === "−" ? "neg" : "pos"}
          />
        </div>
      </div>

      {/* ─── 계산 단계 ─── */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
          📋 계산 단계 (동류항끼리 모아 계산)
        </p>
        {steps.length === 0 ? (
          <p className="text-sm italic text-slate-500">
            아직 연결된 동류항이 없습니다. A와 B에서 같은 차수의 항을 클릭해 보세요.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {[...steps]
              .sort((s1, s2) => s2.deg - s1.deg)
              .map((s, i) => {
                const resStr = termText(s.coef, s.deg, true) || "0";
                return (
                  <li
                    key={`${s.deg}-${i}`}
                    className="flex flex-wrap items-center gap-2 border-b border-dashed border-white/5 pb-1.5 font-mono text-sm last:border-none"
                  >
                    <span
                      className={`min-w-[64px] rounded-md border px-2 py-0.5 text-xs font-bold ${degTone(s.deg).box} ${degTone(s.deg).text}`}
                    >
                      {DEG_NAMES[Math.min(s.deg, 5)]}
                    </span>
                    <span className="text-slate-200">{s.expr}</span>
                    <span className="text-slate-500">=</span>
                    {s.coef === 0 ? (
                      <span className="text-slate-500 line-through">0 (소거)</span>
                    ) : (
                      <span className="font-bold text-cyan-200">{resStr}</span>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </div>

      {/* ─── 결과 + 계수 입력 ─── */}
      {allUsed ? (
        <div className="mt-4 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-400/10 to-violet-400/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            🏆 완성된 다항식
          </p>
          <p className="mt-1 text-center font-mono text-xl font-extrabold text-white">
            {result.length
              ? result.map((s, i) => termText(s.coef, s.deg, i > 0)).join(" ")
              : "0"}
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm font-bold text-slate-200">
              ✏️ 각 항의 <span className="text-cyan-200">계수</span>를 입력하세요
            </p>
            <p className="mt-1 text-xs text-slate-500">
              음수는 − 부호 포함 (예: −3), 계수 1·−1도 정확히 입력하세요.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {result.length === 0 ? (
                <CoefInput
                  deg={-1}
                  varLabel="(전항 소거 → ?)"
                  value={coefInputs[-1] ?? ""}
                  status={coefStatus[-1]}
                  onChange={(v) => setCoefInputs((p) => ({ ...p, [-1]: v }))}
                />
              ) : (
                result.map((s, i) => (
                  <span key={s.deg} className="flex items-center gap-2">
                    {i > 0 ? (
                      <span className="font-mono text-lg font-bold text-slate-400">
                        +
                      </span>
                    ) : null}
                    <CoefInput
                      deg={s.deg}
                      varLabel={varStr(s.deg) || "(상수)"}
                      value={coefInputs[s.deg] ?? ""}
                      status={coefStatus[s.deg]}
                      onChange={(v) =>
                        setCoefInputs((p) => ({ ...p, [s.deg]: v }))
                      }
                    />
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── 피드백 ─── */}
      {feedback ? (
        <p
          className={
            "mt-4 text-center text-sm font-bold " +
            (feedback.tone === "ok"
              ? "text-emerald-300"
              : feedback.tone === "ng"
              ? "text-rose-300"
              : feedback.tone === "hint"
              ? "text-amber-200"
              : "text-slate-300")
          }
        >
          {feedback.message}
        </p>
      ) : null}

      {/* ─── 버튼 ─── */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onAutoMatch}
          disabled={allUsed}
          className="rounded-xl border border-violet-400/50 bg-violet-400/15 px-5 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ⚡ 자동 연결 1개
        </button>
        <button
          type="button"
          onClick={onCheck}
          disabled={!allUsed || solved}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          ✅ 답 확인
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
        >
          ↻ 초기화
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!solved}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          ➡️ 다음 문제
        </button>
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 다항식 한 줄 ───────────────────────────────────────────
function PolyRow({
  label,
  terms,
  used,
  selected,
  polyKey,
  onClick,
  sign = "pos",
}: {
  label: string;
  terms: Term[];
  used: Set<number>;
  selected: Selected;
  polyKey: Poly;
  onClick: (poly: Poly, deg: number) => void;
  sign?: "pos" | "neg";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs font-bold text-slate-200">
          {label}
        </span>
        {sign === "neg" ? (
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300">
            뺄셈: 부호 반대
          </span>
        ) : null}
      </div>
      <div className="flex min-h-[52px] flex-wrap items-center gap-2">
        {terms.map((t, i) => {
          const isSel = selected?.poly === polyKey && selected.deg === t.d;
          const isUsed = used.has(t.d);
          return (
            <TermCard
              key={`${polyKey}-${t.d}`}
              text={termText(t.c, t.d, i > 0)}
              deg={t.d}
              selected={isSel}
              used={isUsed}
              onClick={() => onClick(polyKey, t.d)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── 항 카드 ───────────────────────────────────────────────
function TermCard({
  text,
  deg,
  selected,
  used,
  onClick,
}: {
  text: string;
  deg: number;
  selected: boolean;
  used: boolean;
  onClick: () => void;
}) {
  const t = degTone(deg);
  if (used) {
    return (
      <span className="inline-flex min-w-[64px] cursor-default items-center justify-center rounded-xl border-2 border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-base font-bold text-slate-500 line-through">
        {text}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex min-w-[64px] items-center justify-center rounded-xl border-2 px-3 py-1.5 font-mono text-base font-extrabold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95 " +
        `${t.box} ${t.text}` +
        (selected ? ` ring-4 ${t.ring}` : "")
      }
      title={`${DEG_NAMES[Math.min(deg, 5)]} — 클릭으로 선택/짝짓기`}
    >
      {text}
    </button>
  );
}

// ─── 계수 입력 칸 ──────────────────────────────────────────
function CoefInput({
  deg,
  varLabel,
  value,
  status,
  onChange,
}: {
  deg: number;
  varLabel: string;
  value: string;
  status?: "ok" | "ng";
  onChange: (v: string) => void;
}) {
  const t = degTone(deg);
  const okCls =
    status === "ok"
      ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
      : status === "ng"
      ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
      : `${t.box} ${t.text}`;
  return (
    <span className="inline-flex items-center gap-1">
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="?"
        className={`w-16 rounded-lg border-2 px-2 py-1.5 text-center font-mono text-lg font-bold outline-none transition focus:ring-2 ${okCls}`}
        aria-label={`${DEG_NAMES[Math.min(deg, 5)]} 계수`}
      />
      <span className="font-mono text-lg font-bold text-slate-200">{varLabel}</span>
    </span>
  );
}
