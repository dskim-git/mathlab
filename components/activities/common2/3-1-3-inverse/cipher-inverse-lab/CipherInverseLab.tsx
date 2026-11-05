"use client";

import { useState } from "react";
import { motion } from "motion/react";
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
  affEnc,
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
        "rounded-xl border-2 px-4 py-2.5 text-base font-bold transition " +
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
            "h-10 min-w-[2.5rem] rounded-lg border-2 px-2 font-mono text-base font-bold transition " +
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
      <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-base font-bold text-slate-300">
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
      className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2.5 text-lg font-bold text-cyan-100 transition hover:bg-cyan-400/25"
    >
      {label}
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange, accent = "accent-cyan-400", show }: { label: React.ReactNode; value: number; min: number; max: number; step: number; onChange: (v: number) => void; accent?: string; show?: string }) {
  return (
    <label className="block text-base font-bold text-slate-300">
      <span className="inline-flex items-center gap-1.5">
        {label} <span className="font-mono text-lg text-slate-100">{show ?? value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={"mt-0.5 w-full " + accent} />
    </label>
  );
}

const ABC = ["①", "②", "③", "④"];

function GoalList({ goals, seen }: { goals: string[]; seen: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
      <p className="text-base font-bold text-slate-400">해 볼 것 세 가지</p>
      <div className="mt-1 space-y-1 text-base leading-7">
        {goals.map((g, i) => (
          <p key={g} className={seen.includes(String(i)) ? "text-emerald-200" : "text-slate-400"}>
            {seen.includes(String(i)) ? "✓" : "○"} {g}
          </p>
        ))}
      </div>
    </div>
  );
}

/** dim: 지금까지 푼 글자와 맞지 않아 지워진 보기 (흐리게 + 가운데 줄) */
function TextChoices({ items, pick, answer, onPick, dim }: { items: string[]; pick: number | undefined; answer: number; onPick: (i: number) => void; dim?: boolean[] }) {
  const right = pick === answer;
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map((s, i) => {
        const good = pick === i && i === answer;
        const badPick = pick === i && i !== answer;
        const out = Boolean(dim?.[i]) && !good && !badPick;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(i)}
            disabled={right}
            className={
              "rounded-xl border-2 px-3 py-3 font-mono text-2xl font-bold tracking-wider transition disabled:cursor-default " +
              (good
                ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                : badPick
                  ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                  : out
                    ? "border-white/5 bg-white/[0.02] text-slate-600 line-through opacity-50"
                    : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
            }
          >
            <span className="mr-1.5 text-lg text-slate-400">{ABC[i]}</span>
            {s}
          </button>
        );
      })}
    </div>
  );
}

function Verdict({ right, why, hint }: { right: boolean; why: string; hint: string }) {
  return right ? (
    <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-base leading-7 text-emerald-100">✅ {why}</p>
  ) : (
    <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-base leading-7 text-rose-100">❌ {hint}</p>
  );
}

/**
 * 글자를 한 칸씩 늘어놓은 줄.
 * 칸의 값이 바뀌면 그 칸만 카드처럼 뒤집히며 새로 나타난다(key 에 값을 넣어 다시 그린다).
 * delay 로 줄마다 늦게 시작하면 위에서 아래로 차례로 바뀌는 흐름이 보인다.
 */
function CellRow({ items, tone, label, delay = 0, hl }: { items: (string | number)[]; tone: string; label: string; delay?: number; hl?: number[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-right text-base font-bold text-slate-400">{label}</span>
      <div className="flex flex-wrap gap-1.5 [perspective:600px]">
        {items.map((v, i) => {
          const blank = v === " " || v === "";
          const lit = hl?.includes(i);
          return (
            <motion.span
              key={`${i}:${v}`}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ delay: delay + i * 0.03, duration: 0.3, ease: "easeOut" }}
              className={
                "inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg px-2 font-mono text-xl font-bold " +
                (blank ? "border border-dashed border-white/15 bg-transparent text-transparent" : tone) +
                (lit ? " ring-2 ring-violet-300 ring-offset-2 ring-offset-slate-950" : "")
              }
            >
              {blank ? "·" : v}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

/** 줄 사이의 ↓ 설명 — 위 줄이 바뀐 뒤 잠깐 있다 나타나 흐름을 보여 준다 */
function FlowArrow({ k, delay, tone, children }: { k: string; delay: number; tone: string; children: React.ReactNode }) {
  return (
    <motion.p
      key={k}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className={"pl-[4.5rem] text-lg font-bold " + tone}
    >
      {children}
    </motion.p>
  );
}

/** 열쇠 칸 수를 한 칸씩 돌리는 단추 — 26 을 넘으면 처음으로 돌아간다 */
function KStepper({ k, onK }: { k: number; onK: (v: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <button
        type="button"
        onClick={() => onK((k + 25) % 26)}
        className="rounded-xl border-2 border-pink-400/40 bg-pink-400/10 px-3 py-2 text-lg font-bold text-pink-100 transition hover:bg-pink-400/20"
      >
        ◀ 한 칸 당기기
      </button>
      <button
        type="button"
        onClick={() => onK((k + 1) % 26)}
        className="rounded-xl border-2 border-pink-400/40 bg-pink-400/10 px-3 py-2 text-lg font-bold text-pink-100 transition hover:bg-pink-400/20"
      >
        한 칸 밀기 ▶
      </button>
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
            className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 font-mono text-lg font-bold text-slate-200 transition hover:bg-white/15 active:scale-90"
          >
            {ch}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={onSpace} className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-base font-bold text-slate-300 transition hover:bg-white/10">
          빈칸
        </button>
        <button type="button" onClick={onBack} className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-base font-bold text-slate-300 transition hover:bg-white/10">
          ← 지우기
        </button>
        <button type="button" onClick={onClear} className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-base font-bold text-slate-300 transition hover:bg-white/10">
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
        <p className="text-lg font-semibold text-cyan-300">미니활동 · 공통수학2</p>
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
// ─── 해독 기계 ──────────────────────────────────────────────
// f(x) = ax + b 는 「× a 를 먼저, + b 를 나중에」 한다.
// 그래서 f⁻¹ 은 나중에 한 「+ b」 부터 되돌리고(− b), 그다음 「× a」 를 되돌린다(÷ a).
// 학생은 네 단추(+|b|, −|b|, ×a, ÷a) 중에서 되돌리는 차례대로 두 번 고르고,
// 나온 번호를 글자판에서 찾아 누른다. 손 계산 대신 「무엇을 어떤 차례로 되돌리나」에 집중하게 한다.
type Op = "plus" | "minus" | "mul" | "div";
const OPS: Op[] = ["plus", "minus", "mul", "div"];

function opLabel(op: Op, fn: LinFn): string {
  const b = Math.abs(fn.b);
  if (op === "plus") return `+ ${b}`;
  if (op === "minus") return `− ${b}`;
  if (op === "mul") return `× ${fn.a}`;
  return `÷ ${fn.a}`;
}

/** 되돌리는 올바른 차례 — b 가 음수이면 더해서, 양수이면 빼서 되돌린다 */
function undoSeq(fn: LinFn): [Op, Op] {
  return [fn.b < 0 ? "plus" : "minus", "div"];
}

/** 틀린 단추를 골랐을 때의 말 */
function opHint(op: Op, stage: number, fn: LinFn): string {
  const fwdB = fn.b < 0 ? `− ${Math.abs(fn.b)}` : `+ ${fn.b}`;
  const undoB = fn.b < 0 ? `+ ${Math.abs(fn.b)}` : `− ${fn.b}`;
  if (stage === 0) {
    if (op === "div") return `f 는 × ${fn.a} 를 먼저, ${fwdB} 를 나중에 했어요. 나중에 한 일부터 되돌려야 해요.`;
    if (op === "mul") return `곱하면 더 커져요. 되돌리려면 반대로 해야 합니다. 먼저 ${fwdB} 부터 되돌려 보세요.`;
    return `${fwdB} 를 되돌리려면 반대로 ${undoB} 해야 해요.`;
  }
  if (op === "mul") return `× ${fn.a} 를 되돌리려면 반대로 ÷ ${fn.a} 해야 해요.`;
  return `${fwdB} 는 이미 되돌렸어요. 이제 × ${fn.a} 를 되돌릴 차례예요.`;
}

/** 기계 안의 값 상자 */
function ValBox({ v, tone, label }: { v: string | number | null; tone: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm font-bold text-slate-400">{label}</span>
      <motion.span
        key={String(v)}
        initial={v === null ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 16 }}
        className={
          "inline-flex h-14 min-w-[3.5rem] items-center justify-center rounded-xl border-2 px-2 font-mono text-3xl font-extrabold " +
          (v === null ? "border-dashed border-white/20 bg-transparent text-slate-600" : tone)
        }
      >
        {v === null ? "?" : v}
      </motion.span>
    </div>
  );
}

/** 값 상자 사이의 연산 자리 — 고른 단추가 들어간다 */
function OpSlot({ text }: { text: string | null }) {
  return (
    <div className="flex flex-col items-center pt-5">
      <span className={"rounded-lg px-2 py-0.5 font-mono text-lg font-bold " + (text ? "bg-pink-400/20 text-pink-100" : "text-slate-600")}>{text ?? "　"}</span>
      <span className="text-2xl leading-5 text-slate-400">→</span>
    </div>
  );
}

/** 번호 → 글자 찾기 판 (A = 1 … Z = 26) */
function LetterBoard({ active, onPick, flash }: { active: boolean; onPick: (i: number) => void; flash: number | null }) {
  return (
    <div className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1">
      {[...ALPHA].map((ch, i) => (
        <motion.button
          key={flash === i ? `${ch}-bad` : ch}
          type="button"
          onClick={() => onPick(i)}
          disabled={!active}
          initial={false}
          animate={flash === i ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
          className={
            "flex flex-col items-center rounded-lg border py-1 font-bold leading-none transition disabled:cursor-default " +
            (flash === i
              ? "border-rose-400/60 bg-rose-400/20 text-rose-100"
              : active
                ? "border-white/15 bg-white/5 text-slate-100 hover:bg-cyan-400/20"
                : "border-white/5 bg-white/[0.02] text-slate-400")
          }
        >
          <span className="font-mono text-lg">{ch}</span>
          <span className="mt-0.5 text-sm text-slate-400">{i + 1}</span>
        </motion.button>
      ))}
    </div>
  );
}

function DecCard({ q, fn, pick, onPick }: { q: DecTask; fn: LinFn; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === q.answer;
  const nums = q.code.map((v) => linDec(v, fn));
  const seq = undoSeq(fn);

  const [letters, setLetters] = useState<(string | null)[]>(() => q.code.map(() => null));
  const [cur, setCur] = useState(0);
  const [stage, setStage] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [flash, setFlash] = useState<number | null>(null);

  const shown = right ? nums.map((n) => ALPHA[n - 1]) : letters;
  const doneAll = shown.every((v) => v !== null);
  const v0 = q.code[cur];
  const v1 = v0 - fn.b;
  const v2 = nums[cur];
  const dim = q.choices.map((w) => shown.some((ch, j) => ch !== null && w[j] !== ch));

  const go = (i: number) => {
    setCur(i);
    setStage(0);
    setMsg(null);
    setFlash(null);
  };

  const pickOp = (op: Op) => {
    if (stage >= 2) return;
    if (op === seq[stage]) {
      setStage(stage + 1);
      setMsg(null);
    } else {
      setMsg(opHint(op, stage, fn));
    }
  };

  const pickLetter = (i: number) => {
    if (stage < 2) return;
    if (i + 1 !== v2) {
      setFlash(i);
      setMsg(`${ALPHA[i]} 는 ${i + 1} 번째 글자예요. ${v2} 번째 글자를 찾아보세요.`);
      return;
    }
    const next = letters.map((v, j) => (j === cur ? ALPHA[i] : v));
    setLetters(next);
    setFlash(null);
    setMsg(null);
    const after = next.findIndex((v) => v === null);
    if (after >= 0) {
      setCur(after);
      setStage(0);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <p className="flex flex-wrap items-baseline gap-2 text-lg text-slate-200">
          <span className="font-bold text-pink-200">쓸 열쇠</span>
          <span className="text-xl">
            <Katex expr={fn.invTex} />
          </span>
        </p>

        {/* 암호 칸 — 눌러서 풀 칸을 고른다. 아래는 푼 글자 */}
        <div className="flex items-start gap-2">
          <span className="w-16 shrink-0 pt-3 text-right text-base font-bold text-slate-400">암호</span>
          <div className="flex flex-wrap gap-2">
            {q.code.map((v, i) => {
              const on = !right && !doneAll && i === cur;
              const got = shown[i];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  disabled={right}
                  className={
                    "flex w-16 flex-col items-center gap-1 rounded-xl border-2 p-1.5 transition disabled:cursor-default " +
                    (on ? "border-cyan-400/70 bg-cyan-400/10" : "border-transparent hover:bg-white/5")
                  }
                >
                  <span className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-amber-400/15 font-mono text-xl font-bold text-amber-100">{v}</span>
                  <motion.span
                    key={got ?? "none"}
                    initial={got ? { rotateX: -90, opacity: 0 } : false}
                    animate={{ rotateX: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={
                      "inline-flex h-11 w-full items-center justify-center rounded-lg font-mono text-2xl font-extrabold " +
                      (got ? "bg-emerald-400/20 text-emerald-100" : "border border-dashed border-white/15 text-slate-600")
                    }
                  >
                    {got ?? "?"}
                  </motion.span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 해독 기계 */}
        {!right && !doneAll ? (
          <div className="space-y-2.5 rounded-xl border-2 border-cyan-400/30 bg-cyan-400/[0.05] p-3">
            <p className="text-lg font-bold text-cyan-100">🔧 해독 기계 — {cur + 1} 번째 칸</p>
            <div className="flex flex-wrap items-start justify-center gap-2">
              <ValBox v={v0} label="암호" tone="border-amber-400/50 bg-amber-400/15 text-amber-100" />
              <OpSlot text={stage >= 1 ? opLabel(seq[0], fn) : null} />
              <ValBox v={stage >= 1 ? v1 : null} label="한 번 되돌림" tone="border-pink-400/50 bg-pink-400/15 text-pink-100" />
              <OpSlot text={stage >= 2 ? opLabel(seq[1], fn) : null} />
              <ValBox v={stage >= 2 ? v2 : null} label="번호" tone="border-white/30 bg-white/10 text-slate-100" />
            </div>

            {stage < 2 ? (
              <>
                <p className="text-center text-lg font-bold text-slate-200">{stage === 0 ? "먼저 무엇을 할까요?" : "그다음에는?"}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {OPS.map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => pickOp(op)}
                      className="rounded-xl border-2 border-pink-400/40 bg-pink-400/10 py-2.5 font-mono text-2xl font-extrabold text-pink-100 transition hover:bg-pink-400/25 active:scale-95"
                    >
                      {opLabel(op, fn)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-lg font-bold text-emerald-100">
                👇 <span className="font-mono text-2xl">{v2}</span> 번째 글자를 아래 판에서 눌러요
              </p>
            )}

            {msg ? <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-base leading-7 text-amber-100">💡 {msg}</p> : null}

            <LetterBoard active={stage >= 2} onPick={pickLetter} flash={flash} />
          </div>
        ) : null}

        {!right && doneAll ? (
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="rounded-lg bg-emerald-400/15 px-3 py-2 text-center text-xl font-extrabold text-emerald-100"
          >
            🎉 해독 완료! 아래에서 같은 말을 골라 보세요
          </motion.p>
        ) : null}
      </div>

      <p className="text-lg font-bold text-slate-100">이 암호가 가리키는 말은?</p>
      <p className="-mt-2 text-base text-slate-400">글자를 하나씩 풀 때마다 맞지 않는 보기가 지워져요. 다 풀기 전에 골라도 됩니다.</p>
      <TextChoices items={q.choices} pick={pick} answer={q.answer} onPick={onPick} dim={dim} />
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
        <p className="text-lg font-bold text-slate-100">🔢 글자를 수로 바꿔 암호를 만들어요</p>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-base leading-8 text-slate-300">
          📖 알파벳은 수가 아니므로 <Katex expr="A=1,\ B=2,\ \dots,\ Z=26" /> 으로 보고 함수를 씌웁니다. 빈칸은 띄어쓰기예요.
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {LIN_FNS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setFi(i)}
              className={
                "rounded-lg border-2 px-3 py-2 text-lg font-bold transition " +
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
                "rounded-lg border-2 px-3 py-2 font-mono text-lg font-bold tracking-wide transition " +
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
              <FlowArrow k={`b1${fi}`} delay={0.2} tone="text-pink-200">
                ↓ <Katex expr={fn.invTex} /> 를 씌우면
              </FlowArrow>
              <CellRow items={chars.map((ch, i) => (ch === " " ? " " : nums[i]))} tone="bg-white/10 text-slate-100" label="번호" delay={0.3} />
              <FlowArrow k="b2" delay={0.5} tone="text-slate-300">
                ↓ 번호를 글자로
              </FlowArrow>
              <CellRow items={chars} tone="bg-emerald-400/15 text-emerald-100" label="글자" delay={0.6} />
            </>
          ) : (
            <>
              <CellRow items={chars} tone="bg-emerald-400/15 text-emerald-100" label="글자" />
              <FlowArrow k="f1" delay={0.2} tone="text-slate-300">
                ↓ 글자를 번호로
              </FlowArrow>
              <CellRow items={chars.map((ch, i) => (ch === " " ? " " : nums[i]))} tone="bg-white/10 text-slate-100" label="번호" delay={0.3} />
              <FlowArrow k={`f2${fi}`} delay={0.5} tone="text-sky-200">
                ↓ <Katex expr={fn.tex} /> 를 씌우면
              </FlowArrow>
              <CellRow items={codes} tone="bg-amber-400/15 text-amber-100" label="암호" delay={0.6} />
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setBack((v) => !v)}
          className={
            "mt-2 w-full rounded-xl border-2 px-3 py-3 text-xl font-bold transition " +
            (back ? "border-sky-400/55 bg-sky-400/15 text-sky-100 hover:bg-sky-400/25" : "border-pink-400/55 bg-pink-400/15 text-pink-100 hover:bg-pink-400/25")
          }
        >
          {back ? "🔒 다시 암호로 만들기" : "🔓 역함수로 되돌리기"}
        </button>

        <div className="mt-2">
          <p className="mb-1 text-base font-bold text-slate-400">직접 말을 만들어 보세요</p>
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
          <p className="text-lg font-bold text-slate-100">🔓 암호를 풀어 보기</p>
          <Chips ids={DEC_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <DecCard key={q.id} q={q} fn={qFn} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < DEC_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === DEC_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-lg font-extrabold text-emerald-100">🎉 네 암호를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-base leading-7 text-slate-300">
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
function Dial({ k, spin, sel, onPick }: { k: number; spin: number; sel: number | null; onPick: (i: number) => void }) {
  const { size, cx, cy, rOut, rMid, rIn, tOut, tIn } = DIAL;
  const step = 360 / 26;
  const pos = (r: number, i: number) => {
    const th = ((i * 360) / 26 - 90) * (Math.PI / 180);
    return [cx + r * Math.cos(th), cy + r * Math.sin(th)];
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block w-full max-w-[400px] select-none" role="img" aria-label="카이사르 암호 다이얼">
        <circle cx={cx} cy={cy} r={rOut} fill="none" stroke="rgba(226,232,240,0.25)" strokeWidth={1.4} />
        <circle cx={cx} cy={cy} r={rMid} fill="rgba(255,255,255,0.03)" stroke="rgba(226,232,240,0.25)" strokeWidth={1.4} />
        <circle cx={cx} cy={cy} r={rIn} fill="rgba(244,114,182,0.06)" stroke="rgba(244,114,182,0.35)" strokeWidth={1.4} />

        {/* 바깥 고리 — 원래 글자 (눌러서 고른다) */}
        {[...ALPHA].map((ch, i) => {
          const [x, y] = pos(tOut, i);
          const on = sel === i;
          return (
            <g key={`o${ch}`} className="cursor-pointer" onPointerDown={(e) => { e.preventDefault(); onPick(i); }}>
              <circle cx={x} cy={y} r={11} fill={on ? "rgba(56,189,248,0.3)" : "transparent"} stroke={on ? "#38bdf8" : "transparent"} strokeWidth={1.6} />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={"text-[15px] font-bold " + (on ? "fill-sky-100" : "fill-slate-200")}>
                {ch}
              </text>
            </g>
          );
        })}

        {/* 안쪽 고리에서 고른 글자의 짝이 올 자리 */}
        {sel !== null ? (() => {
          const [x, y] = pos(tIn, sel);
          return <circle cx={x} cy={y} r={11} fill="rgba(244,114,182,0.28)" stroke="#f472b6" strokeWidth={1.6} />;
        })() : null}

        {/* 안쪽 고리 — k 칸 돌린 글자. spin 은 누적 칸 수라 25→0 으로 넘어갈 때도 한 칸만 돈다 */}
        <motion.g initial={false} animate={{ rotate: -spin * step }} transition={{ type: "spring", stiffness: 140, damping: 18 }}>
          {/* 회전 중심을 다이얼 중심에 맞추려고 고리 전체를 감싸는 보이지 않는 원 */}
          <circle cx={cx} cy={cy} r={rMid} fill="none" stroke="none" />
          {[...ALPHA].map((ch, i) => {
            const [x, y] = pos(tIn, i);
            return (
              <motion.text
                key={`i${ch}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                initial={false}
                animate={{ rotate: spin * step }}
                transition={{ type: "spring", stiffness: 140, damping: 18 }}
                className="fill-pink-200 text-[14px] font-bold"
              >
                {ch}
              </motion.text>
            );
          })}
        </motion.g>

        {/* 고른 자리에 잇는 선 */}
        {sel !== null ? (() => {
          const [x1, y1] = pos(rMid - 2, sel);
          const [x2, y2] = pos(rIn + 2, sel);
          return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f472b6" strokeWidth={2.2} />;
        })() : null}

        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-slate-100 text-[22px] font-extrabold">
          {k} 칸
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" className="fill-slate-400 text-[13px] font-bold">
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
        <p className="pl-[4.5rem] text-lg font-bold text-pink-200">↓ {k} 칸 당기면</p>
        <CellRow items={[...guess]} tone={solved ? "bg-emerald-400/15 text-emerald-100" : "bg-white/10 text-slate-200"} label="풀이" />
      </div>
      <Slider label={<Katex expr="k" />} value={k} min={0} max={25} step={1} onChange={onK} accent="accent-pink-400" show={`${k} 칸`} />
      <KStepper k={k} onK={onK} />
      <motion.p
        key={solved ? "yes" : "no"}
        initial={solved ? { scale: 0.7, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 14 }}
        className={"rounded-lg px-3 py-2 text-center font-extrabold " + (solved ? "bg-emerald-400/15 text-2xl text-emerald-100" : "bg-white/5 text-lg text-slate-300")}
      >
        {solved ? "🎉 찾았어요!" : "말이 될 때까지 한 칸씩 돌려 보세요"}
      </motion.p>
      {solved ? <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-base leading-7 text-emerald-100">✅ {q.why}</p> : null}
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

  // 다이얼이 돈 누적 칸 수 — 가까운 쪽으로 돌게 해서 25 → 0 에서 한 바퀴를 거꾸로 돌지 않게 한다
  const [spin, setSpin] = useState(3);
  const turnTo = (nk: number) => {
    const d = ((((nk - k) % 26) + 26 + 13) % 26) - 13;
    setSpin((s) => s + d);
    setK(nk);
  };

  const enc = caesarEnc(word, k);
  const q = CAESAR_TASKS[qi];
  const qk = kMap[q.id] ?? 0;
  const solved = caesarDec(q.cipher, qk) === q.plain;
  const doneIds = CAESAR_TASKS.filter((t) => caesarDec(t.cipher, kMap[t.id] ?? 0) === t.plain).map((t) => t.id);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-lg font-bold text-slate-100">🎡 알파벳 고리를 돌려 보세요</p>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-base leading-8 text-slate-300">
          📖 스물여섯 글자를 한 바퀴 도는 고리로 보면 <Katex expr="f(x)=(x+k) \bmod 26" /> 이에요. 되돌리는 일은 <Katex expr="k" /> 칸 당기는 것입니다.
        </p>

        <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <Dial k={k} spin={spin} sel={sel} onPick={setSel} />
            <p className="text-center text-base font-bold text-slate-400">바깥 글자를 누르면 짝이 이어져요</p>
          </div>
          <div className="space-y-2">
            <Slider label={<Katex expr="k" />} value={k} min={0} max={25} step={1} onChange={turnTo} accent="accent-pink-400" show={`${k} 칸`} />
            <KStepper k={k} onK={turnTo} />
            {sel !== null ? (
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-black/25 px-3 py-2 text-center text-xl leading-9 text-slate-100">
                <Katex expr={`\\text{${ALPHA[sel]}} \\;\\longrightarrow\\; \\text{${letterAt(sel + k)}}`} />
              </p>
            ) : null}
            <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
              <CellRow items={[...word]} tone="bg-emerald-400/15 text-emerald-100" label="원래 말" />
              <CellRow items={[...enc]} tone="bg-amber-400/15 text-amber-100" label="암호" />
            </div>
            {k === 13 ? (
              <p className="rounded-lg bg-violet-400/10 px-3 py-2 text-base leading-7 text-violet-100">
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
          <p className="text-lg font-bold text-slate-100">🕵️ 열쇠를 모를 때 풀어 보기</p>
          <Chips ids={CAESAR_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <p className="mt-1 text-base leading-8 text-slate-300">
          칸 수를 모르는 암호예요. 스물여섯 가지뿐이니 하나씩 돌려 보면 반드시 찾을 수 있습니다.
        </p>
        <div className="mt-2">
          <CaesarCard q={q} k={qk} onK={(v) => setKMap((m) => ({ ...m, [q.id]: v }))} solved={solved} />
        </div>
        {!solved ? (
          <div className="mt-2">
            {tips.includes(q.id) ? (
              <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-base leading-7 text-amber-100">💡 {q.hint}</p>
            ) : (
              <button
                type="button"
                onClick={() => setTips((t) => [...t, q.id])}
                className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-base font-bold text-amber-100 transition hover:bg-amber-400/20"
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
          <p className="text-center text-lg font-extrabold text-emerald-100">🎉 네 암호를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-base leading-7 text-slate-300">
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
      <p className="overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-center text-2xl font-bold leading-9 text-slate-100">
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
                "rounded-xl border-2 px-3 py-3 text-lg font-bold transition disabled:cursor-default " +
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
          <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-base leading-7 text-slate-300">
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
  // 암호 글자마다 그 글자로 바뀐 원래 글자들 (A 부터 차례로)
  const sources: string[][] = Array.from({ length: 26 }, () => []);
  for (let x = 0; x < 26; x++) sources[affEnc(x, a, b)].push(ALPHA[x]);
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
        <p className="text-lg font-bold text-slate-100">⚠️ 곱하는 수를 아무거나 쓸 수 있을까?</p>
        <p className="mt-1 overflow-x-auto overflow-y-hidden py-1 text-center text-xl leading-8 text-slate-100">
          <Katex expr="f(x) = (ax + b) \bmod 26" />
        </p>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Slider label={<Katex expr="a" />} value={a} min={AFF.aMin} max={AFF.aMax} step={1} onChange={(v) => { setA(v); note(v); }} accent="accent-sky-400" />
          <Slider label={<Katex expr="b" />} value={b} min={AFF.bMin} max={AFF.bMax} step={1} onChange={setB} accent="accent-pink-400" />
        </div>

        <div className="mt-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
          <p className="text-lg font-bold text-slate-200">암호 글자마다 몇 글자가 몰렸을까요?</p>
          <p className="text-base text-slate-400">
            위에 쌓인 작은 칸이 그 암호 글자로 바뀐 <b className="text-slate-200">원래 글자</b>예요. 한 칸에 여러 글자가 쌓이면 받은 사람은 어느 글자였는지 가릴 수 없습니다.
          </p>
          {/* 암호 글자마다 그 글자로 바뀐 원래 글자를 쌓는다 — a·b 가 바뀌면 다시 떨어져 쌓인다 */}
          <div className="mt-2 grid grid-cols-[repeat(13,minmax(0,1fr))] items-end gap-x-1 gap-y-3 lg:grid-cols-[repeat(26,minmax(0,1fr))]">
            {hits.map((cnt, i) => {
              const tone = cnt === 1 ? "emerald" : cnt === 0 ? "none" : "rose";
              return (
                <div key={ALPHA[i]} className="flex flex-col items-center gap-0.5">
                  <div className="flex w-full flex-col-reverse items-center gap-0.5">
                    {sources[i].map((src, s) => (
                      <motion.span
                        key={`${a}:${b}:${src}`}
                        initial={{ y: -16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.02 * i + 0.05 * s, duration: 0.22 }}
                        className={
                          "flex h-6 w-full max-w-[2.25rem] items-center justify-center rounded font-mono text-[15px] font-bold leading-none " +
                          (tone === "emerald" ? "bg-emerald-400/25 text-emerald-50" : "bg-rose-400/35 text-rose-50")
                        }
                      >
                        {src}
                      </motion.span>
                    ))}
                  </div>
                  <span className="text-sm leading-none text-slate-500">↓</span>
                  <motion.span
                    key={`${a}:${cnt}`}
                    initial={cnt > 1 ? { x: 0 } : false}
                    animate={cnt > 1 ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
                    transition={{ duration: 0.4, delay: 0.02 * i }}
                    className={
                      "flex h-12 w-full max-w-[2.5rem] flex-col items-center justify-center rounded-lg border font-mono font-bold leading-none " +
                      (tone === "emerald"
                        ? "border-emerald-400/40 bg-emerald-400/12 text-emerald-100"
                        : tone === "none"
                          ? "border-white/10 bg-white/5 text-slate-500"
                          : "border-rose-400/60 bg-rose-400/20 text-rose-100")
                    }
                  >
                    <span className="text-lg">{ALPHA[i]}</span>
                    <span className="mt-0.5 text-sm opacity-80">{cnt}</span>
                  </motion.span>
                </div>
              );
            })}
          </div>
          <p className={"mt-2 rounded-lg px-3 py-2 text-center text-lg font-extrabold " + (okA ? "bg-emerald-400/15 text-emerald-100" : "bg-rose-400/15 text-rose-100")}>
            {okA ? "🎉 스물여섯 글자가 저마다 다른 곳으로 가요 — 풀 수 있습니다" : `⚠️ 서로 다른 암호 글자가 ${distinct} 가지뿐이에요 — 풀 수 없습니다`}
          </p>
          <p className="mt-1.5 rounded-lg bg-black/25 px-3 py-2 text-center text-base leading-7 text-slate-300">
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
                    "rounded-lg border-2 px-3 py-2 font-mono text-lg font-bold tracking-wide transition " +
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
              <p className="overflow-x-auto overflow-y-hidden rounded-lg bg-pink-400/10 px-3 py-2 text-center text-xl leading-9 text-pink-100">
                <Katex expr={`f^{-1}(x) = ${ai}(x - ${b}) \\bmod 26`} />
              </p>
            ) : (
              <p className="rounded-lg bg-rose-400/10 px-3 py-2 text-base leading-7 text-rose-100">
                ⚠️ 되돌릴 방법이 없어요. 암호 글자 하나에 원래 글자가 여럿 걸려 어느 쪽인지 가릴 수 없습니다.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <GoalList goals={AFF_GOALS} seen={seen} />
            <p className="rounded-lg bg-violet-400/10 px-3 py-2 text-base leading-7 text-violet-100">
              🔍 26 을 두 수의 곱으로 쓰면 <Katex expr="26 = 2 \times 13" /> 이에요. 그래서 <Katex expr="a" /> 가 짝수이거나 13 의 배수이면 글자가 몰립니다. 쓸 수 있는 <Katex expr="a" /> 는 열두 개뿐이에요.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-bold text-slate-100">🔎 이 열쇠를 쓸 수 있을까?</p>
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
          <p className="text-center text-lg font-extrabold text-emerald-100">🎉 여섯 열쇠를 모두 가려냈어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-base leading-7 text-slate-300">
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
/** 열쇳말을 되풀이해 원래 말의 자리마다 붙인 줄 (빈칸은 건너뛴다) */
function keyRowOf(text: string, kw: string): string[] {
  let j = 0;
  return [...text].map((ch) => {
    if (ch === " ") return " ";
    const v = kw[j % kw.length];
    j += 1;
    return v;
  });
}

/**
 * 원래 말 · 열쇳말 · 밀 칸 · 암호 네 줄.
 * done 칸까지 암호를 채우고, hl 자리에 테두리를 두른다(지금 보는 자리 또는 같은 글자 짝).
 */
function VigTable({ plain, keyword: kw, done, hl }: { plain: string; keyword: string; done: number; hl?: number[] }) {
  const chars = [...plain];
  const sh = shiftsOf(plain, kw);
  const cipher = [...vigEnc(plain, kw)];
  return (
    <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
      <CellRow items={chars} tone="bg-emerald-400/15 text-emerald-100" label="원래 말" hl={hl} />
      <CellRow items={keyRowOf(plain, kw)} tone="bg-violet-400/15 text-violet-100" label="열쇳말" delay={0.15} hl={hl} />
      <CellRow items={sh.map((v) => (v < 0 ? " " : v))} tone="bg-white/10 text-slate-200" label="밀 칸" delay={0.3} />
      <CellRow items={cipher.map((c, i) => (i < done ? c : "?"))} tone="bg-amber-400/15 text-amber-100" label="암호" hl={hl} />
    </div>
  );
}

/**
 * 비즈네르 표 (26 × 26) — r 번째 줄은 알파벳을 r 칸 민 카이사르 암호다.
 * 줄 머리 = 열쇳말 글자(미는 칸 수), 칸 머리 = 원래 글자, 만나는 칸 = 암호 글자.
 *  · usedRows: 열쇳말에 들어 있는 줄 (옅은 보라)
 *  · row / col: 지금 보는 자리의 열쇳말 줄(진한 보라)과 원래 글자 칸(초록)
 *  · reveal: 아직 모르는 글자를 보여 줄지 — 누르기 전에는 ? 로 감춘다
 *  · mode "enc": 원래 글자(칸 머리)를 알고 만나는 칸(암호)을 찾는다 → 만나는 칸을 감춘다
 *    mode "dec": 줄에서 암호 글자를 찾고 그 칸 머리(원래 글자)를 읽는다 → 칸 머리를 감춘다
 */
function VigSquare({ usedRows, row, col, reveal, mode = "enc" }: { usedRows: number[]; row: number; col: number; reveal: boolean; mode?: "enc" | "dec" }) {
  const rows = Array.from({ length: 26 }, (_, r) => r);
  const hideCell = mode === "enc" && !reveal;
  const hideHead = mode === "dec" && !reveal;
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-white/10 bg-black/25 p-2">
      <div className="grid min-w-[640px] grid-cols-[repeat(27,minmax(0,1fr))] gap-px font-mono text-sm font-bold">
        {/* 칸 머리 — 원래 글자 */}
        <div className="flex h-7 items-center justify-center rounded-sm text-xs text-slate-500">＼</div>
        {[...ALPHA].map((ch, c) =>
          c === col ? (
            <motion.div
              key={`h${ch}_${hideHead ? "n" : "y"}`}
              initial={mode === "dec" && reveal ? { scale: 0.4 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 14 }}
              className="relative z-10 flex h-7 items-center justify-center rounded-sm bg-emerald-400 text-base font-extrabold text-slate-950 ring-2 ring-emerald-200"
            >
              {hideHead ? "?" : ch}
            </motion.div>
          ) : (
            <div key={`h${ch}`} className="flex h-7 items-center justify-center rounded-sm bg-emerald-400/10 text-emerald-200">
              {ch}
            </div>
          ),
        )}

        {rows.map((r) => {
          const used = usedRows.includes(r);
          const isRow = r === row;
          return [
            <div
              key={`r${r}`}
              className={
                "flex h-6 items-center justify-center rounded-sm " +
                (isRow ? "bg-violet-400 text-slate-950" : used ? "bg-violet-400/30 text-violet-100" : "bg-white/5 text-slate-400")
              }
            >
              {ALPHA[r]}
            </div>,
            ...[...ALPHA].map((_, c) => {
              const ch = letterAt(r + c);
              if (isRow && c === col) {
                return (
                  <motion.div
                    key={`c${r}_${c}_${hideCell ? "n" : "y"}`}
                    initial={mode === "enc" && reveal ? { scale: 0.4 } : false}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 14 }}
                    className="relative z-10 flex h-6 items-center justify-center rounded-sm bg-amber-400 text-base font-extrabold text-slate-950 ring-2 ring-amber-200"
                  >
                    {hideCell ? "?" : ch}
                  </motion.div>
                );
              }
              return (
                <div
                  key={`c${r}_${c}`}
                  className={
                    "flex h-6 items-center justify-center rounded-sm " +
                    (isRow
                      ? c < col
                        ? "bg-violet-400/35 text-violet-50"
                        : "bg-violet-400/20 text-violet-100"
                      : c === col
                        ? r < row
                          ? "bg-emerald-400/30 text-emerald-50"
                          : "bg-emerald-400/15 text-emerald-100"
                        : used
                          ? "bg-violet-400/[0.07] text-slate-300"
                          : "text-slate-600")
                  }
                >
                  {ch}
                </div>
              );
            }),
          ];
        })}
      </div>
    </div>
  );
}

/** 접었다 펼 수 있는 상자 — 비즈네르 표처럼 긴 참고 자료를 담는다 */
function FoldBox({ title, note, defaultOpen, children }: { title: string; note?: React.ReactNode; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-1.5 rounded-xl border border-white/10 bg-slate-900/40 p-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left transition hover:bg-white/5"
      >
        <span className="text-lg font-bold text-slate-100">{title}</span>
        <span className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-base font-bold text-slate-200">{open ? "▲ 접기" : "▼ 펼치기"}</span>
      </button>
      {open ? (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-1.5">
          {note ? <div className="text-base leading-7 text-slate-400">{note}</div> : null}
          {children}
        </motion.div>
      ) : null}
    </div>
  );
}

/** 지금 자리를 색 배지로 풀어 쓴 한 줄 */
function Badge({ tone, children }: { tone: "emerald" | "violet" | "amber"; children: React.ReactNode }) {
  const cls = { emerald: "bg-emerald-400", violet: "bg-violet-400", amber: "bg-amber-400" }[tone];
  return <span className={"rounded-md px-2 font-mono text-xl font-extrabold text-slate-950 " + cls}>{children}</span>;
}

/**
 * 비즈네르 풀기 문제 — 표에서 「열쇳말 줄에서 암호 글자를 찾고 → 그 칸 머리의 원래 글자를 읽는」 일을
 * 한 자리씩 해 본다. 풀린 글자에 맞지 않는 보기는 흐려진다.
 */
function VigCard({ q, pick, onPick }: { q: VigTask; pick: number | undefined; onPick: (i: number) => void }) {
  const right = pick === q.answer;
  const sh = shiftsOf(q.cipher, q.key);
  const plain = vigDec(q.cipher, q.key);
  const n = q.cipher.length;

  const [cur, setCur] = useState(0);
  const [done, setDone] = useState(0);
  const filled = right || done > cur;
  const all = right || done >= n;
  const row = sh[cur] < 0 ? 0 : sh[cur];
  const col = idxOf(plain[cur]);
  const usedRows = [...new Set([...q.key].map((ch) => idxOf(ch)))];
  const solved = [...plain].map((ch, i) => (right || i < done ? ch : "?"));
  const dim = q.choices.map((w) => solved.some((ch, j) => ch !== "?" && w[j] !== ch));

  const reset = () => {
    setCur(0);
    setDone(0);
  };
  const stepOn = () => {
    if (!filled) setDone(cur + 1);
    else if (cur < n - 1) setCur(cur + 1);
    else reset();
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-3">
        <p className="flex flex-wrap items-center gap-1.5 text-lg text-slate-300">
          <span className="font-bold text-violet-200">열쇳말</span>
          <span className="rounded-lg bg-violet-400/15 px-2 py-0.5 font-mono text-xl font-bold tracking-widest text-violet-100">{q.key}</span>
        </p>
        <CellRow items={[...q.cipher]} tone="bg-amber-400/15 text-amber-100" label="암호" hl={all ? undefined : [cur]} />
        <CellRow items={keyRowOf(q.cipher, q.key)} tone="bg-violet-400/15 text-violet-100" label="열쇳말" hl={all ? undefined : [cur]} />
        <CellRow items={sh.map((v) => (v < 0 ? " " : v))} tone="bg-white/10 text-slate-200" label="당길 칸" />
        <CellRow items={solved} tone="bg-emerald-400/15 text-emerald-100" label="풀이" hl={all ? undefined : [cur]} />
      </div>

      {!right ? (
        <>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-black/25 px-3 py-2.5 text-lg text-slate-200">
            <span className="font-bold text-slate-400">{cur + 1} 번째 자리 ·</span>
            <span>열쇳말</span>
            <Badge tone="violet">{ALPHA[row]}</Badge>
            <span>의 가로줄에서 암호</span>
            <Badge tone="amber">{q.cipher[cur]}</Badge>
            <span>를 찾아 맨 위로 올라가면 →</span>
            <Badge tone="emerald">{filled ? plain[cur] : "?"}</Badge>
          </p>
          <div className="grid gap-1.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <button
              type="button"
              onClick={stepOn}
              className={
                "rounded-xl border-2 px-3 py-3 text-xl font-bold transition " +
                (!filled ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25" : "border-cyan-400/55 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25")
              }
            >
              {!filled ? `🔓 ${q.cipher[cur]} 를 되돌리기` : cur < n - 1 ? "다음 글자 ▶" : "↺ 처음부터"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (all) {
                  reset();
                } else {
                  setDone(n);
                  setCur(n - 1);
                }
              }}
              className="rounded-xl border-2 border-white/15 bg-white/5 px-3 py-3 text-lg font-bold text-slate-300 transition hover:bg-white/10"
            >
              {all ? "↺ 처음부터" : "⏩ 한꺼번에"}
            </button>
          </div>
          <FoldBox
            title="📋 비즈네르 표로 풀기"
            defaultOpen={false}
            note={
              <>
                거꾸로 읽으면 돼요. <b className="text-violet-200">열쇳말 글자의 줄</b>에서 <b className="text-amber-200">암호 글자</b>를 찾고, 그 칸에서 맨 위로 올라가 <b className="text-emerald-200">원래 글자</b>를 읽습니다.
              </>
            }
          >
            <VigSquare usedRows={usedRows} row={row} col={col} reveal={filled} mode="dec" />
          </FoldBox>
        </>
      ) : null}

      <p className="text-lg font-bold text-slate-100">자리마다 그만큼 당기면 어떤 말이 될까요?</p>
      <p className="-mt-1 text-base text-slate-400">글자를 하나씩 풀 때마다 맞지 않는 보기가 지워져요. 다 풀기 전에 골라도 됩니다.</p>
      <TextChoices items={q.choices} pick={pick} answer={q.answer} onPick={onPick} dim={dim} />
      {pick !== undefined ? <Verdict right={right} why={q.why} hint={q.choiceWhy[pick]} /> : null}
    </div>
  );
}

function VigenereTab() {
  const [ki, setKi] = useState(0);
  const [wi, setWi] = useState(0);
  // cur: 지금 보는 자리, done: 암호를 채운 칸 수 — 한 자리마다 「표에서 찾기 → 채우기」 두 걸음
  const [cur, setCur] = useState(0);
  const [done, setDone] = useState(0);
  const [qi, setQi] = useState(0);
  const [pick, setPick] = useState<Record<string, number>>({});

  const kw = VIG_KEYS[ki];
  const word = VIG_WORDS[wi];
  const cipher = vigEnc(word, kw);
  const n = word.length;
  const all = done >= n;
  const shifts = shiftsOf(word, kw);
  const usedRows = [...new Set([...kw].map((ch) => idxOf(ch)))];
  const row = shifts[cur] < 0 ? 0 : shifts[cur];
  const col = idxOf(word[cur]);
  const filled = done > cur;

  const reset = () => {
    setCur(0);
    setDone(0);
  };
  const stepOn = () => {
    if (!filled) setDone(cur + 1);
    else if (cur < n - 1) setCur(cur + 1);
    else reset();
  };

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
        <p className="text-lg font-bold text-slate-100">🔑 자리마다 다른 칸을 밀어요</p>
        <p className="mt-1 rounded-lg bg-black/25 px-3 py-2 text-base leading-8 text-slate-300">
          📖 열쇳말의 글자가 미는 칸 수를 정해요. <Katex expr="A=0,\ B=1,\ \dots" /> 로 보고 열쇳말을 되풀이해 붙입니다. 자리마다 <b className="text-slate-300">다른 함수</b>를 씌우는 셈이에요.
        </p>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-base font-bold text-violet-200">열쇳말</p>
            <div className="flex flex-wrap gap-1.5">
              {VIG_KEYS.map((v, i) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setKi(i); reset(); }}
                  className={
                    "rounded-lg border-2 px-3 py-2 font-mono text-lg font-bold tracking-widest transition " +
                    (i === ki ? "border-violet-400/60 bg-violet-400/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-base font-bold text-emerald-200">보낼 말</p>
            <div className="flex flex-wrap gap-1.5">
              {VIG_WORDS.map((v, i) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setWi(i); reset(); }}
                  className={
                    "rounded-lg border-2 px-3 py-2 font-mono text-lg font-bold tracking-wide transition " +
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
          <VigTable plain={word} keyword={kw} done={done} hl={all ? (twin ?? undefined) : [cur]} />
        </div>

        {/* 지금 자리의 설명 — 원래 글자 칸과 열쇳말 줄이 만나는 칸이 암호 */}
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-black/25 px-3 py-2.5 text-lg text-slate-200">
          <span className="font-bold text-slate-400">{cur + 1} 번째 자리 ·</span>
          <span>원래 글자</span>
          <span className="rounded-md bg-emerald-400 px-2 font-mono text-xl font-extrabold text-slate-950">{word[cur]}</span>
          <span>의 세로줄과 열쇳말</span>
          <span className="rounded-md bg-violet-400 px-2 font-mono text-xl font-extrabold text-slate-950">{ALPHA[row]}</span>
          <span>의 가로줄({row} 칸 밀기)이 만나는 칸 →</span>
          <span className="rounded-md bg-amber-400 px-2 font-mono text-xl font-extrabold text-slate-950">{filled ? cipher[cur] : "?"}</span>
        </p>

        <div className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <button
            type="button"
            onClick={stepOn}
            className={
              "rounded-xl border-2 px-3 py-3 text-xl font-bold transition " +
              (!filled ? "border-amber-400/55 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25" : "border-cyan-400/55 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25")
            }
          >
            {!filled ? `🔒 ${word[cur]} 를 암호로 바꾸기` : cur < n - 1 ? "다음 글자 ▶" : "↺ 처음부터"}
          </button>
          <button
            type="button"
            onClick={() => { if (all) { reset(); } else { setDone(n); setCur(n - 1); } }}
            className="rounded-xl border-2 border-white/15 bg-white/5 px-3 py-3 text-lg font-bold text-slate-300 transition hover:bg-white/10"
          >
            {all ? "↺ 처음부터" : "⏩ 한꺼번에"}
          </button>
        </div>

        <div className="mt-2">
          <FoldBox
            title="📋 비즈네르 표"
            defaultOpen
            note={
              <>
                줄마다 알파벳을 한 칸씩 더 민 카이사르 암호예요. <b className="text-violet-200">열쇳말 글자의 줄</b>에서 <b className="text-emerald-200">원래 글자의 칸</b>을 찾으면 그 자리가 암호입니다. 옅은 보라 줄은 이번 열쇳말 <span className="font-mono text-violet-200">{kw}</span> 에 쓰이는 줄이에요.
              </>
            }
          >
            <VigSquare usedRows={usedRows} row={row} col={col} reveal={filled} />
          </FoldBox>
        </div>

        {all && twin ? (
          <p className="mt-2 rounded-lg bg-violet-400/10 px-3 py-2 text-base leading-7 text-violet-100">
            🔍 원래 말의 <span className="font-mono font-bold text-white">{chars[twin[0]]}</span> 가 자리에 따라{" "}
            <span className="font-mono font-bold text-white">{cipher[twin[0]]}</span> 와{" "}
            <span className="font-mono font-bold text-white">{cipher[twin[1]]}</span> 로 달라졌어요. 같은 글자가 다른 암호가 되니 빈도를 세어 짐작하기가 훨씬 어렵습니다.
          </p>
        ) : null}
        {all && !twin ? (
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-base leading-8 text-slate-300">
            🔍 열쇳말이나 보낼 말을 바꾸면 같은 글자가 다른 암호로 바뀌는 모습을 볼 수 있어요.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-bold text-slate-100">🗝️ 열쇳말을 알고 풀어 보기</p>
          <Chips ids={VIG_TASKS.map((t) => t.id)} cur={qi} done={doneIds} onPick={setQi} />
        </div>
        <div className="mt-2">
          <VigCard key={q.id} q={q} pick={pick[q.id]} onPick={(i) => setPick((m) => ({ ...m, [q.id]: i }))} />
        </div>
        {cleared && qi < VIG_TASKS.length - 1 ? (
          <div className="mt-2">
            <NextBtn onClick={() => setQi((k) => k + 1)} />
          </div>
        ) : null}
      </div>

      {doneIds.length === VIG_TASKS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4">
          <p className="text-center text-lg font-extrabold text-emerald-100">🎉 세 암호를 모두 풀었어요!</p>
          <p className="mt-2 rounded-lg bg-black/25 px-3 py-2.5 text-center text-base leading-7 text-slate-300">
            자리마다 다른 함수를 씌워도 <b className="text-white">자리마다 그 역함수를 씌우면</b> 그대로 되돌아와요. 암호가 아무리 복잡해져도 푸는 열쇠는 언제나 역함수입니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
