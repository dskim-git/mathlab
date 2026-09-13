"use client";

import { useState } from "react";
import Katex from "@/components/activities/Katex";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  AFF,
  AFF_CHOICES,
  AFF_GOALS,
  AFF_TASKS,
  AFF_WORDS,
  ALPHA,
  CAESAR_TASKS,
  DEC_TASKS,
  DIAL,
  LIN_FNS,
  VIG_KEYS,
  VIG_TASKS,
  VIG_WORDS,
  WORDS,
  affEncWord,
  affHits,
  caesarDec,
  caesarEnc,
  gcd,
  idxOf,
  invMod26,
  letterAt,
  linDec,
  linEnc,
  numOf,
  shiftsOf,
  vigDec,
  vigEnc,
  type AffTask,
  type CaesarTask,
  type DecTask,
  type LinFn,
  type VigTask,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "cipher_is_inverse",
    prompt:
      "암호를 만드는 일과 푸는 일이 함수와 역함수의 관계라는 것을 활동에서 본 예를 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 글자를 번호로 바꾼 뒤 f(x) = 3x − 2 를 씌우는 것이 암호화이고, 받은 수에 f⁻¹(x) = (x+2)/3 을 씌워 번호로 되돌린 뒤 글자로 읽는 것이 복호화다. 카이사르 암호에서는 k 칸 미는 것이 f, k 칸 당기는 것이 f⁻¹ 이었다. 결국 암호를 푼다는 것은 역함수를 씌우는 일이다.",
  },
  {
    id: "why_one_to_one",
    prompt:
      "아핀 암호에서 a 를 아무 수나 쓸 수 없는 까닭을 일대일대응과 역함수의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 26 = 2 × 13 이라 a 가 짝수이거나 13 의 배수이면 서로 다른 글자가 같은 암호로 몰린다. a = 2 이면 A 와 N 이 같은 글자가 되고 a = 13 이면 스물여섯 글자가 두 가지로 뭉친다. 일대일대응이 아니면 역함수가 없으므로 받은 사람이 어느 글자였는지 가릴 수 없어 암호로 쓸 수 없다.",
  },
  {
    id: "vigenere_strength",
    prompt:
      "비즈네르 암호가 카이사르 암호보다 풀기 어려운 까닭과, 그래도 열쇳말을 알면 쉽게 풀리는 까닭을 함께 써 보세요.",
    kind: "text",
    placeholder:
      "예: 카이사르는 모든 자리에 같은 함수를 씌우지만 비즈네르는 자리마다 미는 칸 수가 달라 같은 글자가 다른 암호로 바뀐다. HELLO 의 두 L 이 E 와 S 로 갈라졌다. 그래서 글자의 빈도로 추측하기 어렵다. 다만 열쇳말을 알면 자리마다 그만큼 당기는 역함수를 씌우면 되므로 곧바로 풀린다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
type Tab = "linear" | "caesar" | "affine" | "vigenere";

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition " +
        (active ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
      }
    >
      {children}
    </button>
  );
}

function Chips({ ids, cur, done, onPick }: { ids: string[]; cur: number; done: string[]; onPick: (i: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(i)}
          className={
            "h-8 min-w-[2rem] rounded-lg border-2 px-1.5 font-mono text-xs font-bold transition " +
            (i === cur
              ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100"
              : done.includes(id)
                ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10")
          }
        >
          {done.includes(id) && i !== cur ? "✓" : i + 1}
        </button>
      ))}
      <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-300">
        {done.length} / {ids.length}
      </span>
    </div>
  );
}

function NextBtn({ onClick, label = "다음 문제 ▶" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
    >
      {label}
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange, accent = "accent-cyan-400", show }: { label: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent?: string; show?: string }) {
  return (
    <label className="block text-[11px] font-bold text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        {label} <span className="font-mono text-[13px] text-slate-100">{show ?? value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={"mt-0.5 w-full " + accent} />
    </label>
  );
}

const ABC = ["①", "②", "③", "④"];

function GoalList({ goals, seen }: { goals: string[]; seen: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-[11px] font-bold text-slate-400">해 볼 것 세 가지</p>
      <div className="mt-1 space-y-1 text-[12px] leading-6">
        {goals.map((g, i) => (
          <p key={g} className={seen.includes(String(i)) ? "text-emerald-200" : "text-slate-400"}>
            {seen.includes(String(i)) ? "✓" : "○"} {g}
          </p>
        ))}
      </div>
    </div>
  );
}

function TextChoices({ items, pick, answer, onPick }: { items: string[]; pick: number | undefined; answer: number; onPick: (i: number) => void }) {
  const right = pick === answer;
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((s, i) => {
        const good = pick === i && i === answer;
        const badPick = pick === i && i !== answer;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "rounded-xl border-2 px-2.5 py-2 font-mono text-[15px] font-bold tracking-wider transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : badPick
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="mr-1 text-[11px] text-slate-400">{ABC[i]}</span>
            {s}
          </button>
        );
      })}
    </div>
  );
}

function Verdict({ right, why, hint }: { right: boolean; why: string; hint: string }) {
  return right ? (
    <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {why}</p>
  ) : (
    <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">❌ {hint}</p>
  );
}

/** 글자를 한 칸씩 늘어놓은 줄 */
function CellRow({ items, tone, label }: { items: (string | number)[]; tone: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-12 shrink-0 text-right text-[10px] font-bold text-slate-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.map((v, i) => (
          <span
            key={i}
            className={
              "inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-1.5 font-mono text-[13px] font-bold " +
              (v === " " || v === "" ? "border border-dashed border-white/15 bg-transparent text-transparent" : tone)
            }
          >
            {v === " " || v === "" ? "·" : v}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 알파벳 단추판 */
function KeyPad({ onAdd, onSpace, onBack, onClear }: { onAdd: (ch: string) => void; onSpace: () => void; onBack: () => void; onClear: () => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {[...ALPHA].map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => onAdd(ch)}
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 font-mono text-[13px] font-bold text-slate-200 transition hover:bg-white/15"
          >
            {ch}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={onSpace} className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
          빈칸
        </button>
        <button type="button" onClick={onBack} className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
          ← 지우기
        </button>
        <button type="button" onClick={onClear} className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
          ↺ 모두 지우기
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function CipherInverseLab() {
  const [tab, setTab] = useState<Tab>("linear");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🔐 역함수와 암호</h3>
        <p className="mt-2 leading-7 text-slate-300">
          암호를 만드는 일이 <b className="text-sky-200">함수</b>라면 푸는 일은 <b className="text-pink-200">역함수</b>입니다. 직접 암호를 만들고 풀어 보며 그 까닭을 느껴 보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "linear"} onClick={() => setTab("linear")}>
          ① 일차함수 암호기 🔢
        </TabButton>
        <TabButton active={tab === "caesar"} onClick={() => setTab("caesar")}>
          ② 카이사르 암호 🎡
        </TabButton>
        <TabButton active={tab === "affine"} onClick={() => setTab("affine")}>
          ③ 아핀 암호와 일대일대응 ⚠️
        </TabButton>
        <TabButton active={tab === "vigenere"} onClick={() => setTab("vigenere")}>
          ④ 비즈네르 암호 🔑
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "linear" ? <LinearTab /> : null}
        {tab === "caesar" ? <CaesarTab /> : null}
        {tab === "affine" ? <AffineTab /> : null}
        {tab === "vigenere" ? <VigenereTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 일차함수 암호기
// ══════════════════════════════════════════════════════════════
function DecCard({ q, fn, pick, onPick }: { q: DecTask; fn: LinFn; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === q.answer;
  const nums = q.code.map((v) => linDec(v, fn));
  return (
    <div className="space-y-2">
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <p className="flex flex-wrap items-baseline gap-1.5 text-[12px] text-slate-300">
          <span className="font-bold text-pink-200">쓸 열쇠</span>
          <Katex expr={fn.invTex} />
        </p>
        <CellRow items={q.code} tone="bg-amber-400/15 text-amber-100" label="암호" />
        {right ? <CellRow items={nums} tone="bg-white/10 text-slate-100" label="번호" /> : null}
        {right ? <CellRow items={nums.map((n) => ALPHA[n - 1])} tone="bg-emerald-400/15 text-emerald-100" label="글자" /> : null}
      </div>
      <p className="text-[13px] font-bold text-slate-100">이 암호가 가리키는 말은?</p>
      <TextChoices items={q.choices} pick={pick} answer={q.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={right} why={q.why} hint={q.choiceWhy[pick]} /> : null}
    </div>
  );
}

function LinearTab() {
  const [fi, setFi] = useState(0);
  const [word, setWord] = useState("MATH IS FUN");
  const [back, setBack] = useState(false);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const fn = LIN_FNS[fi];
  const chars = [...word];
  const nums = chars.map((ch) => numOf(ch));
  const codes = chars.map((ch, i) => (ch === " " ? " " : linEnc(nums[i], fn)));

  const q = DEC_TASKS[qi];
  const qFn = LIN_FNS.find((v) => v.id === q.fnId) ?? LIN_FNS[0];
  const doneIds = DEC_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔢 글자를 수로 바꿔 암호를 만들어요</p>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          📖 알파벳은 수가 아니므로 <Katex expr="A=1,\ B=2,\ \dots,\ Z=26" /> 으로 보고 함수를 씌웁니다. 빈칸은 띄어쓰기예요.
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {LIN_FNS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setFi(i)}
              className={
                "rounded-lg border-2 px-2.5 py-1.5 text-[13px] font-bold transition " +
                (i === fi ? "border-sky-400/70 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              <Katex expr={v.tex} />
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {WORDS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWord(w)}
              className={
                "rounded-lg border px-2.5 py-1.5 font-mono text-[12px] font-bold tracking-wide transition " +
                (w === word ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
              }
            >
              {w}
            </button>
          ))}
        </div>

        <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
          {back ? (
            <>
              <CellRow items={codes} tone="bg-amber-400/15 text-amber-100" label="암호" />
              <p className="pl-14 text-[11px] font-bold text-pink-200">
                ↓ <Katex expr={fn.invTex} /> 를 씌우면
              </p>
              <CellRow items={chars.map((ch, i) => (ch === " " ? " " : nums[i]))} tone="bg-white/10 text-slate-100" label="번호" />
              <p className="pl-14 text-[11px] font-bold text-slate-400">↓ 번호를 글자로</p>
              <CellRow items={chars} tone="bg-emerald-400/15 text-emerald-100" label="글자" />
            </>
          ) : (
            <>
              <CellRow items={chars} tone="bg-emerald-400/15 text-emerald-100" label="글자" />
              <p className="pl-14 text-[11px] font-bold text-slate-400">↓ 글자를 번호로</p>
              <CellRow items={chars.map((ch, i) => (ch === " " ? " " : nums[i]))} tone="bg-white/10 text-slate-100" label="번호" />
              <p className="pl-14 text-[11px] font-bold text-sky-200">
                ↓ <Katex expr={fn.tex} /> 를 씌우면
              </p>
              <CellRow items={codes} tone="bg-amber-400/15 text-amber-100" label="암호" />
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setBack((v) => !v)}
          className={
            "mt-2 w-full rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition " +
            (back ? "border-sky-400/55 bg-sky-400/15 text-sky-100 hover:bg-sky-400/25" : "border-pink-400/55 bg-pink-400/15 text-pink-100 hover:bg-pink-400/25")
          }
        >
          {back ? "🔒 다시 암호로 만들기" : "🔓 역함수로 되돌리기"}
        </button>

        <div className="mt-2">
          <p className="mb-1 text-[11px] font-bold text-slate-400">직접 말을 만들어 보세요</p>
          <KeyPad
            onAdd={(ch) => setWord((w) => (w.length >= 12 ? w : w + ch))}
            onSpace={() => setWord((w) => (w.length >= 12 || w.endsWith(" ") || w.length === 0 ? w : w + " "))}
            onBack={() => setWord((w) => w.slice(0, -1))}
            onClear={() => setWord("")}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔓 암호를 풀어 보기</p>
          <Chips ids={DEC_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <DecCard q={q} fn={qFn} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < DEC_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === DEC_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 암호를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            암호를 만드는 열쇠가 <Katex expr="f" /> 라면 푸는 열쇠는 <Katex expr="f^{-1}" /> 이에요. <b className="text-white">열쇠를 모르면 풀 수 없고, 알면 그대로 되돌릴 수 있습니다.</b>
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 카이사르 암호
// ══════════════════════════════════════════════════════════════
function Dial({ k, sel }: { k: number; sel: number | null }) {
  const { size, cx, cy, rOut, rMid, rIn, tOut, tIn } = DIAL;
  const step = 360 / 26;
  const pos = (r: number, i: number) => {
    const th = ((i * 360) / 26 - 90) * (Math.PI / 180);
    return [cx + r * Math.cos(th), cy + r * Math.sin(th)];
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block w-full max-w-[300px] select-none" role="img" aria-label="카이사르 암호 다이얼">
        <circle cx={cx} cy={cy} r={rOut} fill="none" stroke="rgba(226,232,240,0.25)" strokeWidth={1.4} />
        <circle cx={cx} cy={cy} r={rMid} fill="rgba(255,255,255,0.03)" stroke="rgba(226,232,240,0.25)" strokeWidth={1.4} />
        <circle cx={cx} cy={cy} r={rIn} fill="rgba(244,114,182,0.06)" stroke="rgba(244,114,182,0.35)" strokeWidth={1.4} />

        {/* 바깥 고리 — 원래 글자 */}
        {[...ALPHA].map((ch, i) => {
          const [x, y] = pos(tOut, i);
          const on = sel === i;
          return (
            <g key={`o${ch}`}>
              {on ? <circle cx={x} cy={y} r={10} fill="rgba(56,189,248,0.3)" stroke="#38bdf8" strokeWidth={1.6} /> : null}
              <text x={x} y={y + 4} textAnchor="middle" className={"text-[11px] font-bold " + (on ? "fill-sky-100" : "fill-slate-300")}>
                {ch}
              </text>
            </g>
          );
        })}

        {/* 안쪽 고리 — k 칸 돌린 글자 */}
        <g transform={`rotate(${-k * step} ${cx} ${cy})`}>
          {[...ALPHA].map((ch, i) => {
            const [x, y] = pos(tIn, i);
            return (
              <text
                key={`i${ch}`}
                x={x}
                y={y + 4}
                textAnchor="middle"
                transform={`rotate(${k * step} ${x} ${y})`}
                className="fill-pink-200 text-[11px] font-bold"
              >
                {ch}
              </text>
            );
          })}
        </g>

        {/* 고른 자리에 잇는 선 */}
        {sel !== null ? (
          <g>
            {(() => {
              const [x1, y1] = pos(rMid - 4, sel);
              const [x2, y2] = pos(rIn + 4, sel);
              return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f472b6" strokeWidth={2.2} />;
            })()}
          </g>
        ) : null}

        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">
          {k} 칸
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-500 text-[9px] font-bold">
          밀기
        </text>
      </svg>
    </div>
  );
}

function CaesarCard({ q, k, onK, solved }: { q: CaesarTask; k: number; onK: (v: number) => void; solved: boolean }) {
  const guess = caesarDec(q.cipher, k);
  return (
    <div className="space-y-2">
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <CellRow items={[...q.cipher]} tone="bg-amber-400/15 text-amber-100" label="암호" />
        <p className="pl-14 text-[11px] font-bold text-pink-200">↓ {k} 칸 당기면</p>
        <CellRow items={[...guess]} tone={solved ? "bg-emerald-400/15 text-emerald-100" : "bg-white/10 text-slate-200"} label="풀이" />
      </div>
      <Slider label={<Katex expr="k" />} value={k} min={0} max={25} step={1} onChange={onK} accent="accent-pink-400" show={`${k} 칸`} />
      <p className={"rounded-lg px-3 py-2 text-center text-[13px] font-extrabold " + (solved ? "bg-emerald-400/15 text-emerald-100" : "bg-white/5 text-slate-300")}>
        {solved ? "🎉 찾았어요!" : "말이 될 때까지 다이얼을 돌려 보세요"}
      </p>
      {solved ? <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">✅ {q.why}</p> : null}
    </div>
  );
}

function CaesarTab() {
  const [k, setK] = useState(3);
  const [sel, setSel] = useState<number | null>(0);
  const [word, setWord] = useState("SECRET");
  const [qi, setQi] = useState(0);
  const [kMap, setKMap] = useState<Record<string, number>>({});
  const [tips, setTips] = useState<string[]>([]);

  const enc = caesarEnc(word, k);
  const q = CAESAR_TASKS[qi];
  const qk = kMap[q.id] ?? 0;
  const solved = caesarDec(q.cipher, qk) === q.plain;
  const doneIds = CAESAR_TASKS.filter((t) => caesarDec(t.cipher, kMap[t.id] ?? 0) === t.plain).map((t) => t.id);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🎡 알파벳 고리를 돌려 보세요</p>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          📖 스물여섯 글자를 한 바퀴 도는 고리로 보면 <Katex expr="f(x)=(x+k) \bmod 26" /> 이에요. 되돌리는 일은 <Katex expr="k" /> 칸 당기는 것입니다.
        </p>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <Dial k={k} sel={sel} />
          <div className="space-y-2">
            <Slider label={<Katex expr="k" />} value={k} min={0} max={25} step={1} onChange={setK} accent="accent-pink-400" show={`${k} 칸`} />
            <div className="flex flex-wrap gap-1">
              {[...ALPHA].map((ch, i) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setSel(i)}
                  className={
                    "h-7 w-7 rounded-md border font-mono text-[11px] font-bold transition " +
                    (sel === i ? "border-sky-400/70 bg-sky-400/20 text-sky-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/15")
                  }
                >
                  {ch}
                </button>
              ))}
            </div>
            {sel !== null ? (
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-center text-[15px] leading-8 text-slate-100">
                <Katex expr={`\\text{${ALPHA[sel]}} \\;\\longrightarrow\\; \\text{${letterAt(sel + k)}}`} />
              </p>
            ) : null}
            <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <CellRow items={[...word]} tone="bg-emerald-400/15 text-emerald-100" label="원래 말" />
              <CellRow items={[...enc]} tone="bg-amber-400/15 text-amber-100" label="암호" />
            </div>
            {k === 13 ? (
              <p className="rounded-lg bg-violet-400/10 px-3 py-2 text-[12px] leading-6 text-violet-100">
                🔍 열세 칸을 밀면 두 번 씌웠을 때 제자리로 와요. 역함수가 자기 자신인 드문 암호입니다.
              </p>
            ) : null}
            <KeyPad
              onAdd={(ch) => setWord((w) => (w.length >= 10 ? w : w + ch))}
              onSpace={() => setWord((w) => (w.length >= 10 || w.endsWith(" ") || w.length === 0 ? w : w + " "))}
              onBack={() => setWord((w) => w.slice(0, -1))}
              onClear={() => setWord("")}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🕵️ 열쇠를 모를 때 풀어 보기</p>
          <Chips ids={CAESAR_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <p className="mt-1 text-[12px] leading-6 text-slate-400">
          칸 수를 모르는 암호예요. 스물여섯 가지뿐이니 하나씩 돌려 보면 반드시 찾을 수 있습니다.
        </p>
        <div className="mt-2">
          <CaesarCard q={q} k={qk} onK={(v) => setKMap((m) => ({ ...m, [q.id]: v }))} solved={solved} />
        </div>
        {!solved ? (
          <div className="mt-2">
            {tips.includes(q.id) ? (
              <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-[12px] leading-6 text-amber-100">💡 {q.hint}</p>
            ) : (
              <button
                type="button"
                onClick={() => setTips((t) => [...t, q.id])}
                className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-100 transition hover:bg-amber-400/20"
              >
                💡 힌트
              </button>
            )}
          </div>
        ) : null}
        {solved && qi < CAESAR_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k2) => k2 + 1)} label="다음 암호 ▶" />
          </div>
        ) : null}
      </div>

      {doneIds.length === CAESAR_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 네 암호를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            카이사르 암호는 열쇠가 <b className="text-white">스물여섯 가지뿐</b>이라 하나씩 돌려 보면 풀립니다. 그래서 오늘날에는 쓰지 않아요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 아핀 암호와 일대일대응
// ══════════════════════════════════════════════════════════════
function AffCard({ q, pick, onPick }: { q: AffTask; pick: number | undefined; onPick: (i: number) => void }) {
  const answer = q.ok ? 0 : 1;
  const right = pick === answer;
  const hits = affHits(q.a, 0);
  const distinct = hits.filter((v) => v > 0).length;
  return (
    <div className="space-y-2">
      <p className="overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center text-[17px] font-bold leading-9 text-slate-100">
        <Katex expr={`f(x) = (${q.a}x + b) \\bmod 26`} />
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {AFF_CHOICES.map((s, i) => {
          const good = pick === i && i === answer;
          const badPick = pick === i && i !== answer;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onPick(i)}
              disabled={right}
              className={
                "rounded-xl border-2 px-2.5 py-2.5 text-[13px] font-bold transition disabled:cursor-default " +
                (good
                  ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                  : badPick
                    ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              {s}
            </button>
          );
        })}
      </div>
      {pick !== undefined ? (
        <div className="space-y-1.5">
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <Katex expr={`\\gcd(${q.a},\\ 26) = ${gcd(q.a, 26)}`} /> · 서로 다른 암호 글자 {distinct} 가지
          </p>
          <Verdict right={right} why={q.why} hint={q.choiceWhy[pick]} />
        </div>
      ) : null}
    </div>
  );
}

function AffineTab() {
  const [a, setA] = useState(AFF.aInit);
  const [b, setB] = useState(AFF.bInit);
  const [wi, setWi] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const hits = affHits(a, b);
  const okA = gcd(a, 26) === 1;
  const distinct = hits.filter((v) => v > 0).length;
  const word = AFF_WORDS[wi];
  const enc = affEncWord(word, a, b);
  const ai = invMod26(a);

  const note = (na: number) => {
    setSeen((s) => {
      const set = new Set(s);
      if (gcd(na, 26) === 1) set.add("0");
      if (na % 2 === 0) set.add("1");
      if (na === 13) set.add("2");
      return [...set];
    });
  };

  const q = AFF_TASKS[qi];
  const doneIds = AFF_TASKS.filter((t) => pick[t.id] === (t.ok ? 0 : 1)).map((t) => t.id);
  const cleared = pick[q.id] === (q.ok ? 0 : 1);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">⚠️ 곱하는 수를 아무거나 쓸 수 있을까?</p>
        <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-center text-[15px] leading-8 text-slate-100">
          <Katex expr="f(x) = (ax + b) \bmod 26" />
        </p>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Slider label={<Katex expr="a" />} value={a} min={AFF.aMin} max={AFF.aMax} step={1} onChange={(v) => { setA(v); note(v); }} accent="accent-sky-400" />
          <Slider label={<Katex expr="b" />} value={b} min={AFF.bMin} max={AFF.bMax} step={1} onChange={setB} accent="accent-pink-400" />
        </div>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
          <p className="text-[11px] font-bold text-slate-400">암호 글자마다 몇 글자가 몰렸을까요?</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {hits.map((cnt, i) => (
              <span
                key={ALPHA[i]}
                className={
                  "inline-flex h-8 w-8 flex-col items-center justify-center rounded-lg border font-mono text-[11px] font-bold leading-none " +
                  (cnt === 1
                    ? "border-emerald-400/40 bg-emerald-400/12 text-emerald-100"
                    : cnt === 0
                      ? "border-white/10 bg-white/5 text-slate-600"
                      : "border-rose-400/60 bg-rose-400/20 text-rose-100")
                }
              >
                <span>{ALPHA[i]}</span>
                <span className="mt-0.5 text-[8px] opacity-70">{cnt}</span>
              </span>
            ))}
          </div>
          <p className={"mt-2 rounded-lg px-3 py-2 text-center text-[13px] font-extrabold " + (okA ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100")}>
            {okA ? "🎉 스물여섯 글자가 저마다 다른 곳으로 가요 — 풀 수 있습니다" : `⚠️ 서로 다른 암호 글자가 ${distinct} 가지뿐이에요 — 풀 수 없습니다`}
          </p>
          <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] leading-6 text-slate-300">
            <Katex expr={`\\gcd(${a},\\ 26) = ${gcd(a, 26)}`} />
            {okA ? " · 서로소라 일대일대응" : " · 서로소가 아니라 글자가 몰림"}
          </p>
        </div>

        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {AFF_WORDS.map((w, i) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWi(i)}
                  className={
                    "rounded-lg border px-2.5 py-1.5 font-mono text-[12px] font-bold tracking-wide transition " +
                    (i === wi ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <CellRow items={[...word]} tone="bg-emerald-400/15 text-emerald-100" label="원래 말" />
              <CellRow items={[...enc]} tone={okA ? "bg-amber-400/15 text-amber-100" : "bg-rose-400/15 text-rose-100"} label="암호" />
              {okA && ai !== null ? (
                <CellRow items={[...enc].map((ch) => letterAt(ai * (idxOf(ch) - b)))} tone="bg-sky-400/15 text-sky-100" label="되돌림" />
              ) : null}
            </div>
            {okA && ai !== null ? (
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-pink-400/10 px-3 py-2 text-center text-[13px] leading-8 text-pink-100">
                <Katex expr={`f^{-1}(x) = ${ai}(x - ${b}) \\bmod 26`} />
              </p>
            ) : (
              <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-[12px] leading-6 text-rose-100">
                ⚠️ 되돌릴 방법이 없어요. 암호 글자 하나에 원래 글자가 여럿 걸려 어느 쪽인지 가릴 수 없습니다.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <GoalList goals={AFF_GOALS} seen={seen} />
            <p className="rounded-lg bg-violet-400/10 px-3 py-2 text-[12px] leading-6 text-violet-100">
              🔍 26 을 두 수의 곱으로 쓰면 <Katex expr="26 = 2 \times 13" /> 이에요. 그래서 <Katex expr="a" /> 가 짝수이거나 13 의 배수이면 글자가 몰립니다. 쓸 수 있는 <Katex expr="a" /> 는 열두 개뿐이에요.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔎 이 열쇠를 쓸 수 있을까?</p>
          <Chips ids={AFF_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <AffCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < AFF_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === AFF_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 여섯 열쇠를 모두 가려냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            암호가 되려면 <b className="text-white">반드시 일대일대응</b>이어야 해요. 역함수가 없으면 받은 사람도 풀 수 없으니까요. 수학의 조건이 그대로 암호의 조건이 됩니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ 비즈네르 암호
// ══════════════════════════════════════════════════════════════
function VigTable({ plain, keyword: kw, showCipher }: { plain: string; keyword: string; showCipher: boolean }) {
  const chars = [...plain];
  const sh = shiftsOf(plain, kw);
  const cipher = vigEnc(plain, kw);
  let j = 0;
  const keyRow = chars.map((ch) => {
    if (ch === " ") return " ";
    const v = kw[j % kw.length];
    j += 1;
    return v;
  });
  return (
    <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
      <CellRow items={chars} tone="bg-emerald-400/15 text-emerald-100" label="원래 말" />
      <CellRow items={keyRow} tone="bg-violet-400/15 text-violet-100" label="열쇳말" />
      <CellRow items={sh.map((v) => (v < 0 ? " " : v))} tone="bg-white/10 text-slate-200" label="밀 칸" />
      {showCipher ? <CellRow items={[...cipher]} tone="bg-amber-400/15 text-amber-100" label="암호" /> : null}
    </div>
  );
}

function VigCard({ q, pick, onPick }: { q: VigTask; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === q.answer;
  const sh = shiftsOf(q.cipher, q.key);
  let j = 0;
  const keyRow = [...q.cipher].map((ch) => {
    if (ch === " ") return " ";
    const v = q.key[j % q.key.length];
    j += 1;
    return v;
  });
  return (
    <div className="space-y-2">
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <p className="flex flex-wrap items-center gap-1.5 text-[12px] text-slate-300">
          <span className="font-bold text-violet-200">열쇳말</span>
          <span className="rounded-lg bg-violet-400/15 px-2 py-0.5 font-mono text-[13px] font-bold tracking-widest text-violet-100">{q.key}</span>
        </p>
        <CellRow items={[...q.cipher]} tone="bg-amber-400/15 text-amber-100" label="암호" />
        <CellRow items={keyRow} tone="bg-violet-400/15 text-violet-100" label="열쇳말" />
        <CellRow items={sh.map((v) => (v < 0 ? " " : v))} tone="bg-white/10 text-slate-200" label="당길 칸" />
        {right ? <CellRow items={[...vigDec(q.cipher, q.key)]} tone="bg-emerald-400/15 text-emerald-100" label="풀이" /> : null}
      </div>
      <p className="text-[13px] font-bold text-slate-100">자리마다 그만큼 당기면 어떤 말이 될까요?</p>
      <TextChoices items={q.choices} pick={pick} answer={q.answer} onPick={onPick} />
      {pick !== undefined ? <Verdict right={right} why={q.why} hint={q.choiceWhy[pick]} /> : null}
    </div>
  );
}

function VigenereTab() {
  const [ki, setKi] = useState(0);
  const [wi, setWi] = useState(0);
  const [show, setShow] = useState(false);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const kw = VIG_KEYS[ki];
  const word = VIG_WORDS[wi];
  const cipher = vigEnc(word, kw);

  // 같은 글자가 다른 암호로 바뀌는 자리 찾기
  const chars = [...word];
  let twin: [number, number] | null = null;
  for (let i = 0; i < chars.length && !twin; i++) {
    for (let j = i + 1; j < chars.length; j++) {
      if (chars[i] !== " " && chars[i] === chars[j] && cipher[i] !== cipher[j]) {
        twin = [i, j];
        break;
      }
    }
  }

  const q = VIG_TASKS[qi];
  const doneIds = VIG_TASKS.filter((t) => pick[t.id] === t.answer).map((t) => t.id);
  const cleared = pick[q.id] === q.answer;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">🔑 자리마다 다른 칸을 밀어요</p>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-6 text-slate-400">
          📖 열쇳말의 글자가 미는 칸 수를 정해요. <Katex expr="A=0,\ B=1,\ \dots" /> 로 보고 열쇳말을 되풀이해 붙입니다. 자리마다 <b className="text-slate-300">다른 함수</b>를 씌우는 셈이에요.
        </p>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-bold text-violet-200">열쇳말</p>
            <div className="flex flex-wrap gap-1.5">
              {VIG_KEYS.map((v, i) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setKi(i)}
                  className={
                    "rounded-lg border px-2.5 py-1.5 font-mono text-[12px] font-bold tracking-widest transition " +
                    (i === ki ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold text-emerald-200">보낼 말</p>
            <div className="flex flex-wrap gap-1.5">
              {VIG_WORDS.map((v, i) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setWi(i)}
                  className={
                    "rounded-lg border px-2.5 py-1.5 font-mono text-[12px] font-bold tracking-wide transition " +
                    (i === wi ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2">
          <VigTable plain={word} keyword={kw} showCipher={show} />
        </div>

        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className={
            "mt-2 w-full rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition " +
            (show ? "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10" : "border-amber-400/55 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25")
          }
        >
          {show ? "↺ 암호 감추기" : "🔒 암호로 만들기"}
        </button>

        {show && twin ? (
          <p className="mt-2 rounded-lg bg-violet-400/10 px-3 py-2 text-[12px] leading-6 text-violet-100">
            🔍 원래 말의 <span className="font-mono font-bold text-white">{chars[twin[0]]}</span> 가 자리에 따라{" "}
            <span className="font-mono font-bold text-white">{cipher[twin[0]]}</span> 와{" "}
            <span className="font-mono font-bold text-white">{cipher[twin[1]]}</span> 로 달라졌어요. 같은 글자가 다른 암호가 되니 빈도를 세어 짐작하기가 훨씬 어렵습니다.
          </p>
        ) : null}
        {show && !twin ? (
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-400">
            🔍 열쇳말이나 보낼 말을 바꾸면 같은 글자가 다른 암호로 바뀌는 모습을 볼 수 있어요.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🗝️ 열쇳말을 알고 풀어 보기</p>
          <Chips ids={VIG_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <VigCard q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < VIG_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === VIG_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-sm font-extrabold text-emerald-100">🎉 세 암호를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-[12px] leading-7 text-slate-300">
            자리마다 다른 함수를 씌워도 <b className="text-white">자리마다 그 역함수를 씌우면</b> 그대로 되돌아와요. 암호가 아무리 복잡해져도 푸는 열쇠는 언제나 역함수입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
