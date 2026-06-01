"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "pattern_predict",
    prompt:
      "(a+b)², (a+b+c)², (a+b+c+d)² 의 전개에서 제곱항·교차항의 개수가 어떻게 늘어났는지 관찰한 패턴을 적고, 그 패턴으로 n=5 일 때를 어떻게 예측했는지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 제곱항은 변수와 같은 수(n개)만큼 생기고, 교차항은 서로 다른 두 변수를 짝짓는 수, 즉 C(n,2)=n(n−1)/2 만큼 나온다. n=5면 5개+10쌍=총 15항.",
  },
  {
    id: "pascal_meaning",
    prompt:
      "(a+b)ⁿ 의 계수가 이항 전개 계수 삼각형(파스칼 삼각형)의 n번째 행과 같은 까닭, 또는 aⁿ−bⁿ 인수분해의 괄호 안에 들어가는 항들이 일정한 규칙을 따르는 까닭 중 한 가지를 골라 자신의 말로 정리해 보세요.",
    kind: "text",
    placeholder:
      "예: (a+b)ⁿ을 풀어 쓰면 각 항은 a와 b를 n번에서 골라 곱한 결과이므로, aᵏbⁿ⁻ᵏ가 나오는 가짓수가 곧 nCk이고, 이것이 파스칼 삼각형의 n행 값과 같다.",
  },
];

type Stage = 1 | 2 | 3;
type Feedback = { tone: "ok" | "ng" | "hint" | null; message: string };
const EMPTY_FB: Feedback = { tone: null, message: "" };

const SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
function sup(n: number) {
  return String(n)
    .split("")
    .map((c) => SUP[Number(c)] ?? c)
    .join("");
}

export default function PolyMulExpand() {
  const [stage, setStage] = useState<Stage>(1);
  const [done, setDone] = useState<Record<Stage, boolean>>({ 1: false, 2: false, 3: false });
  const [score, setScore] = useState(0);

  const completedCount = (Object.values(done) as boolean[]).filter(Boolean).length;
  const progressPct = Math.round((completedCount / 3) * 100);

  function markDone(s: Stage, addedPoints: number) {
    setDone((d) => {
      if (d[s]) return d;
      return { ...d, [s]: true };
    });
    setScore((sc) => (done[s] ? sc : sc + addedPoints));
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      {/* ─── 헤더 ─── */}
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학</p>
        <h3 className="mt-2 text-2xl font-bold">🧮 곱셈 공식 확장 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          변수 개수 <b className="text-cyan-200">n</b>을 늘려가며 곱셈 공식의 패턴을 직접
          발견하고, 더 일반적인 형태로 확장해 보세요. 세 스테이지를 모두 완료하면 마무리됩니다.
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
          {completedCount} / 3 · 점수 {score}
        </span>
      </div>

      {/* ─── 스테이지 탭 ─── */}
      <div className="mt-4 flex flex-wrap gap-2">
        {([1, 2, 3] as Stage[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStage(s)}
            className={
              "flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
              (done[s]
                ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                : stage === s
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
            }
          >
            {done[s] ? "✓ " : ""}
            {s === 1
              ? "① 합의 제곱 확장"
              : s === 2
              ? "② 이항 전개 계수"
              : "③ 차의 공식 패턴"}
          </button>
        ))}
      </div>

      {/* ─── 스테이지 본문 ─── */}
      <div className="mt-4">
        {stage === 1 ? (
          <StageOne onComplete={() => markDone(1, 30)} />
        ) : stage === 2 ? (
          <StageTwo onComplete={() => markDone(2, 30)} />
        ) : (
          <StageThree onComplete={() => markDone(3, 40)} />
        )}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── Stage 1 ─────────────────────────────────────────────
function StageOne({ onComplete }: { onComplete: () => void }) {
  const [maxN, setMaxN] = useState(2); // 2,3,4 단계 노출
  const [m1, setM1] = useState("");
  const [m2, setM2] = useState("");
  const [m3, setM3] = useState("");
  const [check, setCheck] = useState<{ a?: boolean; b?: boolean; c?: boolean }>({});
  const [fb, setFb] = useState<Feedback>(EMPTY_FB);
  const [solved, setSolved] = useState(false);

  const ROWS: {
    n: number;
    label: string;
    sq: string;
    cross: string;
    sqCount: number;
    crossCount: number;
  }[] = [
    { n: 2, label: "(a+b)²", sq: "a² + b²", cross: "2ab", sqCount: 2, crossCount: 1 },
    {
      n: 3,
      label: "(a+b+c)²",
      sq: "a² + b² + c²",
      cross: "2ab + 2bc + 2ca",
      sqCount: 3,
      crossCount: 3,
    },
    {
      n: 4,
      label: "(a+b+c+d)²",
      sq: "a² + b² + c² + d²",
      cross: "2ab + 2ac + 2ad + 2bc + 2bd + 2cd",
      sqCount: 4,
      crossCount: 6,
    },
  ];

  const visibleRows = ROWS.filter((r) => r.n <= maxN);
  const showMission = maxN >= 4;

  function handleCheck() {
    const ok1 = m1.trim() === "5";
    const ok2 = m2.trim() === "10";
    const ok3 = m3.trim() === "15";
    setCheck({ a: ok1, b: ok2, c: ok3 });
    if (ok1 && ok2 && ok3) {
      setFb({
        tone: "ok",
        message: "🎉 정답! n=5: 제곱항 5개 + 교차항 10쌍 = 총 15항 ✨",
      });
      if (!solved) {
        setSolved(true);
        onComplete();
      }
    } else {
      setFb({
        tone: "ng",
        message:
          "❌ 힌트: 제곱항은 n개, 교차항은 서로 다른 두 변수를 고른 가짓수 C(n,2)=n(n−1)/2 쌍이에요.",
      });
    }
  }

  function handleReset() {
    setM1("");
    setM2("");
    setM3("");
    setCheck({});
    setFb(EMPTY_FB);
  }

  return (
    <div className="space-y-4">
      <Card title="🔢 (변수 합)의 제곱 — 변수 개수 n을 늘려가며 탐구" tone="cyan">
        <p className="text-sm text-slate-400">
          버튼을 눌러 n을 늘리고, 전개식이 어떻게 달라지는지 확인하세요.
        </p>
      </Card>

      <div className="space-y-2">
        {visibleRows.map((r) => (
          <div
            key={r.n}
            className="flex flex-wrap items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <span className="min-w-[100px] font-mono text-base font-extrabold text-cyan-200">
              {r.label}
            </span>
            <span className="text-slate-400">=</span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="font-mono text-sm text-sky-200">{r.sq}</p>
              <p className="font-mono text-sm text-violet-200">+ {r.cross}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-sky-400/45 bg-sky-400/10 px-2.5 py-0.5 text-xs font-bold text-sky-200">
                  ■ 제곱항 {r.sqCount}개
                </span>
                <span className="rounded-full border border-violet-400/45 bg-violet-400/10 px-2.5 py-0.5 text-xs font-bold text-violet-200">
                  ◆ 교차항 {r.crossCount}쌍
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {maxN < 4 ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setMaxN((n) => (n + 1) as 2 | 3 | 4)}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
          >
            ➕ n={maxN + 1} 확인하기
          </button>
        </div>
      ) : null}

      <Card title="📊 발견한 패턴" tone="slate">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {["변수 수 n", "제곱항", "교차항(이중곱)", "전체 항 수"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b border-white/10 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide text-cyan-300"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r, i) => (
                <tr
                  key={r.n}
                  className={
                    i > 0
                      ? "bg-cyan-400/[0.05] font-bold text-cyan-100"
                      : "text-slate-300"
                  }
                >
                  <td className="border-b border-white/5 px-3 py-2 font-mono">{r.n}</td>
                  <td className="border-b border-white/5 px-3 py-2 font-mono">
                    {r.sqCount}
                  </td>
                  <td className="border-b border-white/5 px-3 py-2 font-mono">
                    {r.crossCount}
                  </td>
                  <td className="border-b border-white/5 px-3 py-2 font-mono">
                    {r.sqCount + r.crossCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showMission ? (
        <Card title="🎯 미션: n=5 일 때를 예측하세요" tone="violet">
          <p className="mb-3 text-sm text-slate-300">
            (a+b+c+d+e)² 의 전개식 — 발견한 패턴으로 n=5 의 경우를 예측해 보세요.
          </p>
          <div className="flex flex-wrap gap-4">
            <MissionInput
              label="제곱항의 수 (□² 꼴)"
              value={m1}
              onChange={setM1}
              status={check.a}
              suffix="개"
            />
            <MissionInput
              label="교차항의 수 (이중곱 쌍)"
              value={m2}
              onChange={setM2}
              status={check.b}
              suffix="쌍"
            />
            <MissionInput
              label="전체 항의 수"
              value={m3}
              onChange={setM3}
              status={check.c}
              suffix="개"
            />
          </div>
          <FeedbackLine fb={fb} className="mt-3" />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCheck}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              ✅ 확인
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              ↻ 초기화
            </button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

// ─── Stage 2 ─────────────────────────────────────────────
const PASCAL: number[][] = [
  [1],
  [1, 1],
  [1, 2, 1],
  [1, 3, 3, 1],
  [1, 4, 6, 4, 1],
  [1, 5, 10, 10, 5, 1],
  [1, 6, 15, 20, 15, 6, 1],
];

function StageTwo({ onComplete }: { onComplete: () => void }) {
  const [rowsShown, setRowsShown] = useState(3); // n=0,1,2 시작
  const [coefs, setCoefs] = useState<string[]>(["", "", "", "", ""]);
  const [check, setCheck] = useState<(boolean | null)[]>([null, null, null, null, null]);
  const [fb, setFb] = useState<Feedback>(EMPTY_FB);
  const [solved, setSolved] = useState(false);
  const ANS = ["1", "4", "6", "4", "1"];

  function handleAddRow() {
    if (rowsShown < PASCAL.length) setRowsShown((n) => n + 1);
  }

  function handleCheck() {
    const next = coefs.map((v, i) => v.trim() === ANS[i]);
    setCheck(next);
    if (next.every(Boolean)) {
      setFb({
        tone: "ok",
        message: "🎉 정답! (a+b)⁴ = a⁴ + 4a³b + 6a²b² + 4ab³ + b⁴ ✨",
      });
      if (!solved) {
        setSolved(true);
        onComplete();
      }
    } else {
      setFb({
        tone: "ng",
        message: "❌ 이항 전개 계수 n=4 행: 1 4 6 4 1 을 다시 살펴보세요.",
      });
    }
  }

  function handleReset() {
    setCoefs(["", "", "", "", ""]);
    setCheck([null, null, null, null, null]);
    setFb(EMPTY_FB);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="📐 이항 전개 계수 삼각형" tone="cyan">
        <p className="mb-3 text-sm text-slate-400">
          (a+b)ⁿ 전개식의 <b className="text-cyan-200">계수</b>가 이항 전개 계수 삼각형의
          n번째 행과 일치합니다. 행을 추가하며 확인하세요.
        </p>
        <div className="flex flex-col items-center gap-1.5">
          {PASCAL.slice(0, rowsShown).map((row, n) => (
            <div key={n} className="flex items-center gap-1.5">
              <span className="w-20 text-right font-mono text-xs text-slate-500">
                (a+b){sup(n)}
              </span>
              {row.map((v, i) => (
                <span
                  key={i}
                  className={
                    "inline-flex h-8 min-w-[36px] items-center justify-center rounded-md border px-2 font-mono text-sm font-bold tabular-nums " +
                    (n === rowsShown - 1
                      ? "animate-[pulse_1.2s_ease-out_1] border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                      : "border-white/10 bg-white/5 text-slate-200")
                  }
                >
                  {v}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddRow}
            disabled={rowsShown >= PASCAL.length}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-cyan-500/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            ➕ 다음 행 추가
          </button>
          <span className="font-mono text-xs text-slate-400">
            현재 n=0 … {rowsShown - 1}
          </span>
        </div>
      </Card>

      <Card title="🎯 미션: (a+b)⁴ 의 계수를 입력하세요" tone="violet">
        <p className="mb-3 font-mono text-sm text-slate-300">
          (a+b)⁴ = □a⁴ + □a³b + □a²b² + □ab³ + □b⁴
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {ANS.map((_, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 ? <span className="font-mono text-base text-slate-500">+</span> : null}
              <CoefBox
                value={coefs[i]}
                status={check[i] ?? undefined}
                onChange={(v) =>
                  setCoefs((arr) => arr.map((x, k) => (k === i ? v : x)))
                }
              />
              <span className="font-mono text-sm font-bold text-slate-200">
                {i === 0
                  ? "a⁴"
                  : i === 1
                  ? "a³b"
                  : i === 2
                  ? "a²b²"
                  : i === 3
                  ? "ab³"
                  : "b⁴"}
              </span>
            </span>
          ))}
        </div>
        <FeedbackLine fb={fb} className="mt-3" />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleCheck}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
          >
            ✅ 정답 확인
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
          >
            ↻ 초기화
          </button>
        </div>

        {solved ? (
          <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
            <p className="font-bold">📐 일반 공식 (이항정리 미리보기)</p>
            <p className="mt-1 font-mono text-xs">
              (a+b)ⁿ = C(n,0)aⁿ + C(n,1)aⁿ⁻¹b + ⋯ + C(n,n)bⁿ
            </p>
            <p className="mt-1 text-xs text-emerald-200/80">
              C(n,k)= n!⁄(k!(n−k)!) 는 이항계수이며 파스칼 삼각형의 각 원소와 같다.
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

// ─── Stage 3 ─────────────────────────────────────────────
function StageThree({ onComplete }: { onComplete: () => void }) {
  const [maxN, setMaxN] = useState(2);
  const [pool, setPool] = useState<string[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const [check, setCheck] = useState<(boolean | null)[]>([null, null, null, null, null]);
  const [fb, setFb] = useState<Feedback>(EMPTY_FB);
  const [solved, setSolved] = useState(false);

  const ROWS = [
    { n: 2, label: "a² − b²", factor: "(a+b)", desc: "괄호 안 2항 · 차수 합 = 1" },
    {
      n: 3,
      label: "a³ − b³",
      factor: "(a² + ab + b²)",
      desc: "괄호 안 3항 · 차수 합 = 2",
    },
    {
      n: 4,
      label: "a⁴ − b⁴",
      factor: "(a³ + a²b + ab² + b³)",
      desc: "괄호 안 4항 · 차수 합 = 3",
    },
  ];
  const visibleRows = ROWS.filter((r) => r.n <= maxN);

  const CORRECT = ["a⁴", "a³b", "a²b²", "ab³", "b⁴"];
  const POOL_ITEMS = ["a⁴", "a³b", "a²b²", "ab³", "b⁴", "a³b²", "a²b³"];

  const seedRef = useRef(false);
  useEffect(() => {
    if (maxN >= 4 && !seedRef.current) {
      seedRef.current = true;
      const shuffled = [...POOL_ITEMS].sort(() => Math.random() - 0.5);
      setPool(shuffled);
    }
  }, [maxN]);

  function clickPoolItem(item: string) {
    if (pool.indexOf(item) < 0) return;
    const firstEmpty = slots.findIndex((s) => s === null);
    if (firstEmpty < 0) return;
    setSlots((s) => s.map((v, i) => (i === firstEmpty ? item : v)));
    setPool((p) => p.filter((x) => x !== item));
    setFb(EMPTY_FB);
    setCheck([null, null, null, null, null]);
  }

  function clickSlot(idx: number) {
    const item = slots[idx];
    if (!item) return;
    setSlots((s) => s.map((v, i) => (i === idx ? null : v)));
    setPool((p) => [...p, item]);
    setFb(EMPTY_FB);
    setCheck([null, null, null, null, null]);
  }

  function handleCheck() {
    const next = slots.map((s, i) => s === CORRECT[i]);
    setCheck(next);
    if (next.every(Boolean)) {
      setFb({
        tone: "ok",
        message: "🎉 정답! (a−b)(a⁴+a³b+a²b²+ab³+b⁴) = a⁵−b⁵ ✨",
      });
      if (!solved) {
        setSolved(true);
        onComplete();
      }
    } else {
      setFb({
        tone: "ng",
        message: "❌ 슬롯을 다시 살펴보세요. 차수 내림차순으로 배치해야 합니다.",
      });
    }
  }

  function handleReset() {
    setSlots([null, null, null, null, null]);
    setCheck([null, null, null, null, null]);
    const shuffled = [...POOL_ITEMS].sort(() => Math.random() - 0.5);
    setPool(shuffled);
    setFb(EMPTY_FB);
  }

  const allFilled = slots.every((s) => s !== null);

  return (
    <div className="space-y-4">
      <Card title="➖ aⁿ − bⁿ 인수분해 — n을 늘려가며 탐구" tone="cyan">
        <p className="text-sm text-slate-400">
          n이 커질수록 (a−b) 뒤에 오는 인수의 모양이 어떻게 확장되는지 확인하세요.
        </p>
      </Card>

      <div className="space-y-2">
        {visibleRows.map((r) => (
          <div
            key={r.n}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <span className="font-mono text-base font-extrabold text-rose-300">
              {r.label}
            </span>
            <span className="text-slate-400">=</span>
            <span className="font-mono text-base font-bold text-slate-300">(a−b)</span>
            <span className="font-mono text-base font-bold text-violet-200">
              {r.factor}
            </span>
            <span className="ml-auto rounded-full border border-violet-400/45 bg-violet-400/10 px-2.5 py-0.5 text-xs font-bold text-violet-200">
              {r.desc}
            </span>
          </div>
        ))}
      </div>

      {maxN < 4 ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setMaxN((n) => (n + 1) as 3 | 4)}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
          >
            ➕ n={maxN + 1} 확인하기
          </button>
        </div>
      ) : null}

      <Card title="💡 패턴 정리" tone="slate">
        <p className="font-mono text-sm leading-7 text-slate-300">
          aⁿ − bⁿ = (a−b)( aⁿ⁻¹ + aⁿ⁻²b + ⋯ + abⁿ⁻² + bⁿ⁻¹ )
        </p>
        <p className="mt-1 text-xs text-slate-400">
          → 괄호 안: <b className="text-violet-200">a</b> 지수 ↓, <b className="text-violet-200">b</b> 지수 ↑, 각 항의 차수 합 = n−1.
        </p>
      </Card>

      {maxN >= 4 ? (
        <Card title="🎯 미션: (a−b)( ? + ? + ? + ? + ? ) = a⁵ − b⁵" tone="violet">
          <p className="mb-3 text-sm text-slate-300">
            아래 카드 중 올바른 항을 <b className="text-violet-200">차수 내림차순</b>으로
            클릭하여 5개 슬롯을 채우세요. 슬롯을 클릭하면 다시 빠집니다.
          </p>

          {/* 카드 풀 */}
          <div className="mb-3 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-slate-900/40 p-3">
            {pool.length === 0 ? (
              <span className="px-1 text-xs italic text-slate-500">
                모든 카드를 배치했습니다.
              </span>
            ) : (
              pool.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => clickPoolItem(item)}
                  className="rounded-lg border-2 border-violet-400/45 bg-violet-400/15 px-3 py-1.5 font-mono text-sm font-bold text-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-400/25"
                >
                  {item}
                </button>
              ))
            )}
          </div>

          {/* 슬롯 라인 */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <span className="font-mono text-base font-bold text-slate-300">(a−b)</span>
            <span className="font-mono text-base font-bold text-slate-400">(</span>
            {slots.map((item, i) => {
              const cls =
                check[i] === true
                  ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
                  : check[i] === false
                  ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
                  : item
                  ? "border-violet-400/55 bg-violet-400/15 text-violet-100"
                  : "border-dashed border-white/20 bg-white/[0.03] text-slate-500";
              return (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 ? (
                    <span className="font-mono text-base text-slate-500">+</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => clickSlot(i)}
                    className={`min-w-[56px] rounded-lg border-2 px-2 py-1.5 font-mono text-sm font-bold transition ${cls}`}
                    title={item ? "클릭해서 빼기" : "카드를 골라 채우기"}
                  >
                    {item ?? "?"}
                  </button>
                </span>
              );
            })}
            <span className="font-mono text-base font-bold text-slate-400">)</span>
            <span className="font-mono text-base text-slate-400">= a⁵ − b⁵</span>
          </div>

          <FeedbackLine fb={fb} className="mt-3" />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCheck}
              disabled={!allFilled}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              ✅ 확인
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10"
            >
              ↻ 초기화
            </button>
          </div>

          {solved ? (
            <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              <p className="font-bold">📐 일반 공식</p>
              <p className="mt-1 font-mono text-xs">
                aⁿ − bⁿ = (a − b)( aⁿ⁻¹ + aⁿ⁻²b + ⋯ + abⁿ⁻² + bⁿ⁻¹ )
              </p>
              <p className="mt-1 text-xs text-emerald-200/80">
                n이 홀수이면 (a+b)(aⁿ⁻¹ − aⁿ⁻²b + ⋯ + bⁿ⁻¹) = aⁿ + bⁿ 도 성립.
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

// ─── 공용 UI ─────────────────────────────────────────────
function Card({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "cyan" | "violet" | "slate";
  children: React.ReactNode;
}) {
  const cls =
    tone === "cyan"
      ? "border-cyan-400/30 bg-cyan-400/[0.04]"
      : tone === "violet"
      ? "border-violet-400/35 bg-violet-400/[0.05]"
      : "border-white/10 bg-white/5";
  const titleCls =
    tone === "cyan"
      ? "text-cyan-300"
      : tone === "violet"
      ? "text-violet-200"
      : "text-slate-300";
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${titleCls}`}>
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

function FeedbackLine({ fb, className = "" }: { fb: Feedback; className?: string }) {
  if (!fb.message) return null;
  const cls =
    fb.tone === "ok"
      ? "text-emerald-300"
      : fb.tone === "ng"
      ? "text-rose-300"
      : fb.tone === "hint"
      ? "text-amber-200"
      : "text-slate-200";
  return <p className={`text-sm font-bold ${cls} ${className}`}>{fb.message}</p>;
}

function MissionInput({
  label,
  value,
  onChange,
  status,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  status?: boolean;
  suffix: string;
}) {
  const okCls =
    status === true
      ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
      : status === false
      ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
      : "border-white/15 bg-slate-900/40 text-slate-100";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="flex items-center gap-2">
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="?"
          className={`w-16 rounded-lg border-2 px-2 py-1.5 text-center font-mono text-lg font-bold outline-none transition focus:ring-2 focus:ring-cyan-400/40 ${okCls}`}
        />
        <span className="font-mono text-sm font-bold text-slate-200">{suffix}</span>
      </span>
    </label>
  );
}

function CoefBox({
  value,
  status,
  onChange,
}: {
  value: string;
  status?: boolean | null;
  onChange: (v: string) => void;
}) {
  const okCls =
    status === true
      ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100"
      : status === false
      ? "border-rose-400/70 bg-rose-400/15 text-rose-100"
      : "border-white/15 bg-slate-900/40 text-slate-100";
  return (
    <input
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="?"
      className={`w-12 rounded-lg border-2 px-1 py-1 text-center font-mono text-base font-bold outline-none transition focus:ring-2 focus:ring-cyan-400/40 ${okCls}`}
    />
  );
}

