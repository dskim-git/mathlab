"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ORD_CASES,
  ORD_XS,
  PROBLEMS,
  SORT_QS,
  SORT_WRAP,
  TRANSFORMS,
  fmt,
  ordCaseOf,
  rankOf,
  sameRank,
  type OrdCase,
  type PStep,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "two_kinds",
    prompt:
      "서수적 효용함수와 기수적 효용함수의 차이를 친구에게 설명한다면 어떻게 말할지, 내 일상의 예를 하나 들어 적어 보세요.",
    kind: "text",
    placeholder:
      "예: 급식 반찬 중에 뭘 제일 좋아하는지 순서만 말하면 서수적이고, 각 반찬에 10점 만점으로 점수를 매기면 기수적이다.",
  },
  {
    id: "invariance",
    prompt:
      "효용 값에 2를 곱하거나 10을 더해도 선호도 순위는 그대로였어요. 왜 그런지, 그리고 반대로 순위가 뒤집히는 변환은 어떤 것이었는지 적어 보세요.",
    kind: "text",
    placeholder:
      "예: U가 커질 때 함께 커지는 변환이면 큰 것은 계속 크게 남아 순서가 그대로다. 부호를 바꾸거나 20에서 빼면 큰 값이 작아져서 순위가 뒤집힌다.",
  },
  {
    id: "enough",
    prompt:
      "소비자 이론에서는 서수적 효용함수만으로도 충분한 경우가 많았어요. 반대로 크기까지 꼭 알아야 하는 상황은 어떤 때인지 예를 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 무엇을 살지 고르는 데는 순서만 있으면 되지만, 한 개 더 살 때 만족이 얼마나 늘어나는지(한계효용)를 따지려면 크기가 필요하다.",
  },
];

type Tab = "concept" | "transform" | "sort" | "problem";

export default function OrdinalCardinalLab() {
  const [tab, setTab] = useState<Tab>("concept");
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-emerald-300">미니활동 · 경제수학</p>
        <h3 className="mt-2 text-2xl font-bold">🥇 효용의 순서와 크기</h3>
        <p className="mt-2 leading-7 text-slate-300">
          “나는 A가 제일 좋아”와 “A는 9점이야”는 담고 있는 정보가 달라요. 순서만 알려 주는{" "}
          <b className="text-sky-200">서수적 효용함수</b>와 크기까지 알려 주는{" "}
          <b className="text-amber-200">기수적 효용함수</b>, 무엇이 어떻게 다른지 직접 만져 보며 알아봐요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "concept"} onClick={() => setTab("concept")}>① 순서만? 크기까지?</TabButton>
        <TabButton active={tab === "transform"} onClick={() => setTab("transform")}>② 값을 바꿔도 순위는 그대로?</TabButton>
        <TabButton active={tab === "sort"} onClick={() => setTab("sort")}>③ 순서만으로 답할 수 있을까</TabButton>
        <TabButton active={tab === "problem"} onClick={() => setTab("problem")}>④ 단계별 문제</TabButton>
      </div>

      <div className="mt-4">
        {tab === "concept" ? <ConceptTab /> : null}
        {tab === "transform" ? <TransformTab /> : null}
        {tab === "sort" ? <SortTab /> : null}
        {tab === "problem" ? <ProblemTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3 py-2 text-sm font-bold transition " +
        (active
          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function FormulaLine({ expr, className }: { expr: string; className?: string }) {
  return (
    <div className={"overflow-x-auto overflow-y-hidden py-1 " + (className ?? "")}>
      <Katex expr={expr} display />
    </div>
  );
}

const TONE_ON: Record<string, string> = {
  emerald: "border-emerald-400/60 bg-emerald-400/15",
  sky: "border-sky-400/60 bg-sky-400/15",
  amber: "border-amber-400/60 bg-amber-400/15",
  violet: "border-violet-400/60 bg-violet-400/15",
};

const MEDAL = ["", "🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

// ══════════════════════════════════════════════════════════════
//  탭 ① 순서만? 크기까지?
// ══════════════════════════════════════════════════════════════
function ConceptTab() {
  const [cid, setCid] = useState(ORD_CASES[0].id);
  const c = ordCaseOf(cid);
  const answer = rankOf(c.values);
  const [picks, setPicks] = useState<(number | null)[]>(() => initPicks(ORD_CASES[0]));
  const [graded, setGraded] = useState(false);
  const [reveal, setReveal] = useState(false);

  function initPicks(x: OrdCase): (number | null)[] {
    const ans = rankOf(x.values);
    return ORD_XS.map((_, i) => (i === x.given - 1 ? ans[i] : null));
  }
  function pick(next: OrdCase) {
    setCid(next.id);
    setPicks(initPicks(next));
    setGraded(false);
    setReveal(false);
  }
  function cycle(i: number) {
    if (i === c.given - 1) return;
    setGraded(false);
    setPicks((p) => {
      const n = [...p];
      const cur = n[i];
      n[i] = cur === null ? 1 : cur >= ORD_XS.length ? null : cur + 1;
      return n;
    });
  }

  const allFilled = picks.every((v) => v !== null);
  const correct = picks.filter((v, i) => v === answer[i]).length;
  const done = graded && correct === ORD_XS.length;

  // 순위는 같지만 크기는 다른 다른 자료들
  const alts = [
    { label: "친구 A가 매긴 점수", values: c.values.map((v) => v * 2) },
    { label: "친구 B가 매긴 점수", values: c.values.map((v) => v + 10) },
    { label: "친구 C가 매긴 점수", values: c.values.map((v) => Number((v * v * 0.1).toFixed(1))) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-sky-400/40 bg-sky-400/[0.07] p-4">
          <p className="text-sm font-bold text-sky-200">🥇 서수적 효용함수</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            만족도의 <b className="text-sky-100">순서</b>는 알 수 있으나 만족도의 <b className="text-sky-100">크기</b>는 알
            수 없는 효용함수
          </p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-xs text-slate-300">
            🗣️ “도넛 네 개가 제일 좋고, 그다음이 다섯 개야.”
          </p>
        </div>
        <div className="rounded-2xl border-2 border-amber-400/40 bg-amber-400/[0.07] p-4">
          <p className="text-sm font-bold text-amber-200">🔢 기수적 효용함수</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            순서와 크기를 <b className="text-amber-100">모두</b> 알 수 있는 효용함수
          </p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-xs text-slate-300">
            🗣️ “도넛 네 개는 12점, 다섯 개는 10점이야.”
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {ORD_CASES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pick(m)}
            className={
              "rounded-xl border-2 p-3 text-left transition " +
              (cid === m.id ? TONE_ON[m.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-sm font-bold text-slate-100">
              {m.emoji} {m.name}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{m.story}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-sm font-bold text-slate-200">
          ✍️ {c.emoji} {c.name}의 효용의 크기를 보고 <span className="text-sky-200">선호도 순위</span>를 채워 보세요
        </p>
        <p className="mt-1 text-[11px] text-slate-400">빈칸을 누를 때마다 순위가 1위 → 2위 → … 로 바뀌어요.</p>

        <div className="mt-3 overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[460px] border-collapse text-center text-xs">
            <tbody>
              <tr>
                <th className="border border-white/15 bg-slate-700/50 px-2 py-2 text-left font-bold text-slate-200" />
                <th className="border border-white/15 bg-blue-600/70 px-2 py-2 font-bold text-white">
                  <Katex expr="x" />
                </th>
                {ORD_XS.map((x) => (
                  <th key={x} className="border border-white/15 bg-blue-600/70 px-3 py-2 font-mono font-bold text-white">
                    {x}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border border-white/15 bg-amber-500/20 px-2 py-2 text-left font-bold text-amber-100">
                  기수적 효용함수
                </th>
                <td className="border border-white/15 bg-white/5 px-2 py-2 font-bold text-slate-200">효용의 크기</td>
                {c.values.map((v, i) => (
                  <td key={i} className="border border-white/15 px-3 py-2 font-mono text-base font-bold text-amber-100">
                    {v}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="border border-white/15 bg-sky-500/20 px-2 py-2 text-left font-bold text-sky-100">
                  서수적 효용함수
                </th>
                <td className="border border-white/15 bg-white/5 px-2 py-2 font-bold text-slate-200">선호도 순위</td>
                {picks.map((v, i) => {
                  const locked = i === c.given - 1;
                  const right = graded && v === answer[i];
                  const wrong = graded && v !== answer[i];
                  return (
                    <td key={i} className="border border-white/15 p-1">
                      <button
                        type="button"
                        onClick={() => cycle(i)}
                        disabled={locked || done}
                        className={
                          "h-9 w-full rounded-lg border-2 font-mono text-sm font-bold transition disabled:cursor-default " +
                          (locked
                            ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                            : right
                              ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                              : wrong
                                ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                : v === null
                                  ? "border-white/15 bg-white/5 text-slate-500 hover:bg-white/10"
                                  : "border-sky-400/50 bg-sky-400/15 text-sky-100 hover:bg-sky-400/25")
                        }
                      >
                        {v === null ? "?" : `${v}위`}
                      </button>
                      {graded && !right ? <p className="mt-0.5 text-[10px] text-emerald-200">{answer[i]}위</p> : null}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!allFilled || done}
            onClick={() => setGraded(true)}
            className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25 disabled:opacity-40"
          >
            채점하기
          </button>
          <button
            type="button"
            onClick={() => {
              setPicks(initPicks(c));
              setGraded(false);
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
          >
            ↩️ 다시
          </button>
          {graded ? (
            <span className={"text-xs font-bold " + (done ? "text-emerald-200" : "text-amber-200")}>
              {correct} / {ORD_XS.length} 정답
            </span>
          ) : null}
        </div>

        {done ? (
          <div className="mt-3 rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-3">
            <p className="text-center text-sm font-bold text-emerald-100">🎉 순위를 모두 맞혔어요!</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {ORD_XS.map((x, i) => (
                <span key={x} className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1 text-xs text-slate-200">
                  {MEDAL[answer[i]]} {x}
                  {c.unit} <span className="text-slate-500">({c.values[i]})</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] leading-5 text-slate-300">
              효용의 <b className="text-amber-200">크기</b>를 알면 <b className="text-sky-200">순위</b>는 언제나 뽑아낼 수
              있어요. 기수적 효용함수는 서수적 정보를 이미 품고 있는 셈이죠.
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🤔 그럼 반대로, 순위만 알면 크기도 알 수 있을까?</p>
          <button
            type="button"
            onClick={() => setReveal(!reveal)}
            className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-3 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
          >
            {reveal ? "닫기" : "확인해 보기"}
          </button>
        </div>
        {reveal ? (
          <>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              아래 세 사람은 <b className="text-slate-100">모두 순위가 똑같아요</b>. 그런데 매긴 점수는 제각각이죠.
            </p>
            <div className="mt-2 overflow-x-auto overflow-y-hidden">
              <table className="w-full min-w-[420px] border-collapse text-center text-xs">
                <tbody>
                  <tr>
                    <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">
                      <Katex expr="x" />
                    </th>
                    {ORD_XS.map((x) => (
                      <td key={x} className="border border-white/15 bg-blue-600/50 px-2 py-1.5 font-mono font-bold text-white">
                        {x}
                      </td>
                    ))}
                    <th className="border border-white/15 bg-slate-700/50 px-2 py-1.5 font-bold text-slate-200">순위</th>
                  </tr>
                  {[{ label: `${c.emoji} 원래 값`, values: c.values }, ...alts].map((row) => (
                    <tr key={row.label}>
                      <th className="border border-white/15 bg-white/5 px-2 py-1.5 text-left text-[11px] font-bold text-slate-200">
                        {row.label}
                      </th>
                      {row.values.map((v, i) => (
                        <td key={i} className="border border-white/15 px-2 py-1.5 font-mono text-slate-200">
                          {fmt(v, 1)}
                        </td>
                      ))}
                      <td className="border border-white/15 bg-sky-500/15 px-2 py-1.5 font-mono text-[11px] font-bold text-sky-100">
                        {rankOf(row.values).join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 rounded-lg border-l-4 border-violet-400 bg-violet-400/[0.08] px-3 py-2 text-xs leading-5 text-violet-100">
              순위가 같아도 크기는 이렇게 다를 수 있어요. 그래서 <b>서수적 효용함수만으로는 크기를 알 수 없습니다.</b>{" "}
              (기수적 → 서수적은 되지만, 그 반대는 안 돼요.)
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ② 값을 바꿔도 순위는 그대로?
// ══════════════════════════════════════════════════════════════
const CW = 380,
  CH = 240,
  PL = 44,
  PR = 18,
  PT = 34,
  PB = 34;

function TransformTab() {
  const [cid, setCid] = useState(ORD_CASES[0].id);
  const c = ordCaseOf(cid);
  const [on, setOn] = useState<string[]>(["id", "x2", "sq"]);

  const base = rankOf(c.values);
  const rows = TRANSFORMS.filter((t) => on.includes(t.id)).map((t) => {
    const vals = c.values.map(t.apply);
    return { t, vals, rank: rankOf(vals), same: sameRank(rankOf(vals), base) };
  });

  const X = (i: number) => PL + (i / (ORD_XS.length - 1)) * (CW - PL - PR);
  const Y = (r: number) => CH - PB - r * (CH - PT - PB);
  const norm = (vals: number[]) => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return vals.map((v) => (hi - lo < 1e-12 ? 0.5 : (v - lo) / (hi - lo)));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-200">🔁 효용 값을 통째로 바꿔 보면?</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          효용의 크기에 2를 곱하거나 10을 더하면 값은 완전히 달라져요. 그런데{" "}
          <b className="text-emerald-100">선호도 순위</b>도 달라질까요? 변환을 켜고 꺼 보며 확인해 보세요.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {ORD_CASES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setCid(m.id)}
            className={
              "rounded-xl border-2 px-3 py-2 text-left transition " +
              (cid === m.id ? TONE_ON[m.tone] : "border-white/10 bg-white/5 hover:bg-white/10")
            }
          >
            <p className="text-xs font-bold text-slate-100">
              {m.emoji} {m.name}
            </p>
            <p className="font-mono text-[11px] text-slate-400">{m.values.join(" · ")}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TRANSFORMS.map((t) => {
          const active = on.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setOn(active ? on.filter((v) => v !== t.id) : [...on, t.id])}
              className={
                "flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-[11px] font-bold transition " +
                (active ? "bg-white/10 text-slate-100" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
              }
              style={active ? { borderColor: t.color } : undefined}
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: active ? t.color : "#475569" }} />
              {t.label}
              <span className="text-slate-100">
                <Katex expr={t.tex} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-2">
          <div className="overflow-x-auto overflow-y-hidden">
            <svg viewBox={`0 0 ${CW} ${CH}`} className="h-auto w-full min-w-[320px]" role="img" aria-label="변환한 효용값을 같은 눈금으로 겹쳐 그린 그래프">
              <rect x={0} y={0} width={CW} height={CH} rx={10} fill="#0b1220" />
              {[0, 0.25, 0.5, 0.75, 1].map((r) => (
                <line key={r} x1={PL} y1={Y(r)} x2={CW - PR} y2={Y(r)} stroke="rgba(148,163,184,0.13)" strokeWidth={0.8} />
              ))}
              {ORD_XS.map((x, i) => (
                <g key={x}>
                  <line x1={X(i)} y1={PT} x2={X(i)} y2={CH - PB} stroke="rgba(148,163,184,0.13)" strokeWidth={0.8} />
                  <text x={X(i)} y={CH - PB + 14} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="monospace">
                    {x}
                  </text>
                </g>
              ))}
              {rows.map(({ t, vals }) => {
                const nv = norm(vals);
                return (
                  <g key={t.id}>
                    <polyline
                      points={nv.map((v, i) => `${X(i)},${Y(v)}`).join(" ")}
                      fill="none"
                      stroke={t.color}
                      strokeWidth={2.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={t.dir === "down" ? "6 4" : undefined}
                    />
                    {nv.map((v, i) => (
                      <circle key={i} cx={X(i)} cy={Y(v)} r={3.6} fill={t.color} />
                    ))}
                  </g>
                );
              })}
              <line x1={PL} y1={CH - PB} x2={CW - PR} y2={CH - PB} stroke="#94a3b8" strokeWidth={1.2} />
              <line x1={PL} y1={PT} x2={PL} y2={CH - PB} stroke="#94a3b8" strokeWidth={1.2} />
              <text x={CW - PR} y={CH - PB + 27} textAnchor="end" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                소비량 x ({c.unit})
              </text>
              <text x={10} y={16} textAnchor="start" fill="#cbd5e1" fontSize={10} fontWeight={700}>
                같은 눈금으로 맞춘 효용
              </text>
            </svg>
          </div>
          <p className="px-1 pb-1 text-[10px] leading-4 text-slate-500">
            값의 범위가 저마다 달라 같은 높이로 맞춰 그렸어요. 점선은 순위를 뒤집는 변환이에요.
          </p>
        </div>

        <div className="space-y-2">
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[340px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  <th className="border border-white/15 bg-blue-600/70 px-2 py-1.5 font-bold text-white">
                    <Katex expr="x" />
                  </th>
                  {ORD_XS.map((x) => (
                    <td key={x} className="border border-white/15 bg-blue-600/50 px-2 py-1.5 font-mono font-bold text-white">
                      {x}
                    </td>
                  ))}
                  <th className="border border-white/15 bg-slate-700/50 px-2 py-1.5 text-[10px] font-bold text-slate-200">순위</th>
                </tr>
                {rows.map(({ t, vals, rank, same }) => (
                  <tr key={t.id}>
                    <th className="border border-white/15 bg-white/5 px-2 py-1.5 text-left">
                      <span className="text-slate-100">
                        <Katex expr={t.tex} />
                      </span>
                    </th>
                    {vals.map((v, i) => (
                      <td key={i} className="border border-white/15 px-2 py-1.5 font-mono" style={{ color: t.color }}>
                        {fmt(v, 1)}
                      </td>
                    ))}
                    <td
                      className={
                        "border border-white/15 px-2 py-1.5 font-mono text-[11px] font-bold " +
                        (same ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100")
                      }
                    >
                      {rank.join("·")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5">
            {rows.map(({ t, same }) => (
              <div
                key={t.id}
                className={
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] leading-5 " +
                  (same ? "border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-100" : "border-rose-400/40 bg-rose-400/[0.08] text-rose-100")
                }
              >
                <span className="text-base">{same ? "✅" : "❌"}</span>
                <span className="text-slate-100">
                  <Katex expr={t.tex} />
                </span>
                <span>
                  {same
                    ? "순위 그대로 — 같은 선호를 나타내요"
                    : "순위가 뒤집혔어요 — 다른 선호가 돼 버려요"}
                </span>
              </div>
            ))}
            {rows.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs text-slate-400">
                위에서 변환을 하나 이상 골라 보세요.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2.5 text-[11px] leading-5 text-slate-300">
            💡 <b className="text-amber-200">U가 커질 때 함께 커지는 변환</b>이면 값이 아무리 달라져도 순위는 그대로예요.
            그래서 같은 선호를 나타내는 서수적 효용함수는 <b className="text-amber-200">무수히 많습니다</b>. 반대로 값을
            거꾸로 만드는 변환은 순위를 뒤집어 아예 다른 선호가 돼요.
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ③ 순서만으로 답할 수 있을까
// ══════════════════════════════════════════════════════════════
function SortTab() {
  const [ans, setAns] = useState<Record<string, "order" | "size">>({});
  const solved = SORT_QS.filter((q) => ans[q.id] === q.need).length;
  const allDone = solved === SORT_QS.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🎯 이 질문에 답하려면 무엇이 필요할까?</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-300">
              맞힘 {solved} / {SORT_QS.length}
            </span>
            <button
              type="button"
              onClick={() => setAns({})}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              ↩️ 다시
            </button>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${(solved / SORT_QS.length) * 100}%` }} />
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          <b className="text-sky-200">순서만으로 OK</b> = 서수적 효용함수로 충분 · <b className="text-amber-200">크기까지 필요</b>{" "}
          = 기수적 효용함수가 있어야 함
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {SORT_QS.map((q) => {
          const picked = ans[q.id];
          const right = picked === q.need;
          const wrong = picked !== undefined && !right;
          return (
            <div
              key={q.id}
              className={
                "rounded-xl border p-3 transition " +
                (right ? "border-emerald-400/50 bg-emerald-400/[0.09]" : wrong ? "border-rose-400/50 bg-rose-400/[0.09]" : "border-white/10 bg-white/5")
              }
            >
              <p className="text-xs font-bold leading-5 text-slate-100">
                {q.emoji} {q.q}
              </p>
              {right ? (
                <p className="mt-1.5 text-[11px] leading-5 text-emerald-100">
                  ✅ {q.need === "order" ? "순서만으로 OK" : "크기까지 필요"} — {q.why}
                </p>
              ) : (
                <div className="mt-1.5 flex gap-1.5">
                  <PickBtn
                    on={picked === "order"}
                    wrong={wrong && picked === "order"}
                    tone="sky"
                    onClick={() => setAns((p) => ({ ...p, [q.id]: "order" }))}
                  >
                    🥇 순서만으로 OK
                  </PickBtn>
                  <PickBtn
                    on={picked === "size"}
                    wrong={wrong && picked === "size"}
                    tone="amber"
                    onClick={() => setAns((p) => ({ ...p, [q.id]: "size" }))}
                  >
                    🔢 크기까지 필요
                  </PickBtn>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 열 문제를 모두 분류했어요!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">{SORT_WRAP}</p>
        </div>
      ) : (
        <p className="rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">
          💡 질문에 <b>‘몇 배’, ‘얼마나’, ‘차이’, ‘점수’</b> 같은 말이 들어 있으면 크기가 필요해요. 그냥{" "}
          <b>‘어느 쪽이 더’</b>만 묻는다면 순서로 충분하고요.
        </p>
      )}
    </div>
  );
}

function PickBtn({
  on,
  wrong,
  tone,
  onClick,
  children,
}: {
  on: boolean;
  wrong: boolean;
  tone: "sky" | "amber";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base: Record<string, string> = {
    sky: "border-sky-400/50 bg-sky-400/15 text-sky-100",
    amber: "border-amber-400/50 bg-amber-400/15 text-amber-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex-1 rounded-lg border-2 px-2 py-1.5 text-[11px] font-bold transition " +
        (wrong ? "border-rose-400/70 bg-rose-400/20 text-rose-100" : on ? base[tone] : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
//  탭 ④ 단계별 문제
// ══════════════════════════════════════════════════════════════
type StepState = { text: string; ok: boolean; tries: number; hint: boolean; shown: boolean };
const DEFAULT_STEP: StepState = { text: "", ok: false, tries: 0, hint: false, shown: false };

function ProblemTab() {
  const [pIdx, setPIdx] = useState(0);
  const [state, setState] = useState<Record<string, StepState>>({});
  const prob = PROBLEMS[pIdx];
  const doneCount = PROBLEMS.filter((p) => p.steps.every((s) => state[s.id]?.ok)).length;

  function get(id: string) {
    return state[id] ?? DEFAULT_STEP;
  }
  function update(id: string, patch: Partial<StepState>) {
    setState((p) => ({ ...p, [id]: { ...(p[id] ?? DEFAULT_STEP), ...patch } }));
  }
  function check(step: PStep, override?: string) {
    setState((p) => {
      const cur = p[step.id] ?? DEFAULT_STEP;
      const text = override ?? cur.text;
      const ok =
        step.kind === "number"
          ? (() => {
              const val = Number(text.replace(/[^0-9.-]/g, ""));
              return text.trim() !== "" && Number.isFinite(val) && Math.abs(val - step.answer) <= (step.tol ?? 0.005);
            })()
          : text !== "" && Number(text) === step.answer;
      return { ...p, [step.id]: { ...cur, text, ok, tries: cur.tries + 1 } };
    });
  }

  const firstOpen = prob.steps.findIndex((s) => !get(s.id).ok);
  const probDone = firstOpen === -1;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.06] to-fuchsia-500/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-violet-200">🧩 효용의 순서와 크기 단계별 문제</p>
          <span className="font-mono text-xs text-slate-300">
            완료 {doneCount} / {PROBLEMS.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PROBLEMS.map((p, i) => {
            const done = p.steps.every((s) => state[s.id]?.ok);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPIdx(i)}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition " +
                  (pIdx === i
                    ? "border-violet-400/60 bg-violet-400/20 text-violet-100"
                    : done
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                }
              >
                {done ? "✅ " : ""}
                {p.emoji} {p.title.replace("문제 ", "").replace(" · ", ". ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="text-base font-bold text-slate-100">
          {prob.emoji} {prob.title}
        </p>
        <p className="mt-1.5 text-sm leading-7 text-slate-300">{prob.scenario}</p>
        {prob.tex ? <FormulaLine expr={prob.tex} className="mt-1 text-slate-100" /> : null}
        {prob.table ? (
          <div className="mt-2 overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[320px] border-collapse text-center text-xs">
              <tbody>
                <tr>
                  {prob.table.head.map((h, i) => (
                    <th
                      key={h + i}
                      className={
                        "border border-white/15 px-3 py-1.5 font-bold " +
                        (i === 0 ? "bg-blue-600/70 text-white" : "bg-blue-600/50 font-mono text-white")
                      }
                    >
                      {h}
                    </th>
                  ))}
                </tr>
                {prob.table.rows.map((r) => (
                  <tr key={r[0]}>
                    {r.map((v, i) => (
                      <td
                        key={v + i}
                        className={
                          "border border-white/15 px-3 py-1.5 " +
                          (i === 0 ? "bg-white/5 font-bold text-slate-200" : "font-mono text-amber-100")
                        }
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        {prob.steps.map((step, i) => {
          const ss = get(step.id);
          const locked = i > (firstOpen === -1 ? prob.steps.length - 1 : firstOpen);
          return (
            <div
              key={step.id}
              className={
                "rounded-2xl border p-4 transition " +
                (ss.ok
                  ? "border-emerald-400/40 bg-emerald-400/[0.07]"
                  : locked
                    ? "border-white/5 bg-slate-900/20 opacity-50"
                    : "border-violet-400/35 bg-violet-400/[0.06]")
              }
            >
              <div className="flex items-start gap-2">
                <span
                  className={
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                    (ss.ok ? "bg-emerald-400/25 text-emerald-100" : "bg-white/10 text-slate-300")
                  }
                >
                  {ss.ok ? "✓" : i + 1}
                </span>
                <p className="text-sm font-bold leading-6 text-slate-100">{step.ask}</p>
              </div>

              {locked ? (
                <p className="mt-2 pl-8 text-xs text-slate-500">앞 단계를 먼저 풀어 주세요 🔒</p>
              ) : (
                <div className="mt-2 pl-8">
                  {step.tex ? <FormulaLine expr={step.tex} className="text-slate-100" /> : null}

                  {step.kind === "number" ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        inputMode="text"
                        aria-label={step.ask}
                        value={ss.text}
                        disabled={ss.ok}
                        onChange={(e) => update(step.id, { text: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") check(step);
                        }}
                        placeholder="숫자만 입력"
                        className="w-40 rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-right font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-300 focus-visible:ring-2 focus-visible:ring-violet-300/40 disabled:opacity-60"
                      />
                      <span className="text-sm text-slate-300">{step.suffix}</span>
                      {!ss.ok ? (
                        <button
                          type="button"
                          onClick={() => check(step)}
                          className="rounded-lg border-2 border-violet-400/55 bg-violet-400/15 px-4 py-1.5 text-xs font-bold text-violet-100 transition hover:bg-violet-400/25"
                        >
                          확인
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-col gap-1.5">
                      {step.options.map((opt, oi) => {
                        const chosen = ss.text === String(oi);
                        const right = ss.ok && oi === step.answer;
                        const wrong = chosen && !ss.ok;
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={ss.ok}
                            onClick={() => check(step, String(oi))}
                            className={
                              "rounded-lg border-2 px-3 py-2 text-left text-sm font-bold transition disabled:opacity-80 " +
                              (right
                                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                                : wrong
                                  ? "border-rose-400/60 bg-rose-400/15 text-rose-100"
                                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                            }
                          >
                            {opt.tex ? (
                              <span className="inline-block align-middle">
                                <Katex expr={opt.tex} />
                              </span>
                            ) : (
                              opt.text
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {ss.ok ? (
                    <p className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.08] px-3 py-1.5 text-xs leading-5 text-emerald-100">
                      정답이에요! ✅ {step.explain}
                    </p>
                  ) : ss.tries > 0 ? (
                    <p className="mt-2 rounded-lg border-l-4 border-amber-400 bg-amber-400/[0.08] px-3 py-1.5 text-xs leading-5 text-amber-100">
                      아직 아니에요. {ss.tries >= 2 ? "힌트를 열어 보세요." : "표를 다시 살펴볼까요?"}
                    </p>
                  ) : null}

                  {!ss.ok ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => update(step.id, { hint: !ss.hint })}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
                      >
                        💡 힌트 {ss.hint ? "닫기" : "보기"}
                      </button>
                      {ss.tries >= 3 ? (
                        <button
                          type="button"
                          onClick={() => update(step.id, { shown: true })}
                          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-400 transition hover:bg-white/10"
                        >
                          정답 보기
                        </button>
                      ) : null}
                      {ss.hint ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">{step.hint}</span>
                      ) : null}
                      {ss.shown ? (
                        <span className="rounded-lg bg-black/25 px-2.5 py-1 text-[11px] text-slate-300">
                          정답:{" "}
                          <b className="font-mono text-emerald-200">
                            {step.kind === "number"
                              ? step.answer.toLocaleString("ko-KR") + step.suffix
                              : (step.options[step.answer].text ?? `${step.answer + 1}번`)}
                          </b>{" "}
                          — {step.explain}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {probDone ? (
        <div className="rounded-2xl border-2 border-emerald-400/45 bg-emerald-400/[0.10] p-4 text-center">
          <p className="text-lg font-bold text-emerald-100">🎉 문제 해결!</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-200">{prob.wrapUp}</p>
          {pIdx < PROBLEMS.length - 1 ? (
            <button
              type="button"
              onClick={() => setPIdx(pIdx + 1)}
              className="mt-3 rounded-xl border-2 border-violet-400/55 bg-violet-400/15 px-6 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-400/25"
            >
              다음 문제로 →
            </button>
          ) : doneCount === PROBLEMS.length ? (
            <p className="mt-3 text-sm font-bold text-amber-200">🏅 네 문제를 모두 해결했어요! 효용 순서·크기 마스터 🎓</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
