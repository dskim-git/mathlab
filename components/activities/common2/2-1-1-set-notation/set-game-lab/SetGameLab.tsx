"use client";

import { useEffect, useId, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import {
  ATTR_STATE_TEXT,
  BOARDS,
  COLOR_HEX,
  COLOR_NAMES,
  COUNT_NAMES,
  ADD_CARDS,
  DECK81,
  QUIZZES,
  SHADE_NAMES,
  SHAPE_NAMES,
  SQUIGGLE_D,
  START_CARDS,
  THIRDS,
  attrState,
  dec3,
  dec4,
  enc3,
  findAllSets,
  isSet,
  shuffle,
  thirdSym,
  type Board,
  type Quiz,
  type Sym,
  type ThirdPuzzle,
} from "./data";

// ─── 성찰 (활동 고유 질문 3개 · 공통 마무리 질문은 자동 부착) ────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "set_rule",
    prompt:
      "'합'이 되는 규칙을 자신의 말로 정리해 보세요. 그리고 세 장 중 '두 장만 같은' 속성이 하나라도 있으면 왜 합이 될 수 없는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 모양·색깔·개수 세 속성 각각에 대하여 세 장이 모두 같거나 모두 달라야 한다. 두 장만 같다는 것은 '모두 같다'도 아니고 '모두 다르다'도 아닌 어중간한 경우라서 규칙에서 빠져 있다. 그래서 한 속성이라도 두 장만 같으면 나머지 두 속성이 아무리 좋아도 합이 아니다.",
  },
  {
    id: "third_unique",
    prompt:
      "탭②에서 두 장이 주어지면 합이 되는 나머지 한 장이 언제나 딱 하나였어요. 왜 항상 하나로 정해지는지 속성 하나를 예로 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 색깔 하나만 보면, 두 장이 같은 색이면 세 번째도 반드시 그 색이어야 하고(모두 같아야 하므로), 두 장이 다른 색이면 세 번째는 남은 한 색일 수밖에 없다(모두 달라야 하므로). 어느 경우든 답이 하나뿐이고, 모양·개수도 마찬가지이므로 세 번째 카드는 언제나 딱 하나로 정해진다.",
  },
  {
    id: "count_cards",
    prompt:
      "탭①∼③의 카드는 27장인데 탭④의 보드게임 카드는 81장이었어요. 각각 왜 그 수가 되는지 곱셈으로 설명하고, 무늬가 하나 더 늘면 카드는 몇 장이 될지도 말해 보세요.",
    kind: "text",
    placeholder:
      "예: 모양 3가지 × 색깔 3가지 × 개수 3가지 = 27장이고, 여기에 무늬 3가지가 더해지면 3 × 3 × 3 × 3 = 81장이 된다. 속성이 하나 늘 때마다 카드 수가 3배가 되므로, 속성이 다섯 개가 되면 3⁵ = 243장이 된다.",
  },
];

// ══════════════════════════════════════════════════════════════
// 카드 그리기
// ══════════════════════════════════════════════════════════════
const CARD_W = 300;
const CARD_H = 200;
const SYM_SCALE = 0.62;
const SYM_W = 100 * SYM_SCALE;
const SYM_GAP = 14;

function Shape({ a, pid }: { a: Sym; pid: string }) {
  const col = COLOR_HEX[a.c];
  const fill = a.h === 0 ? col : a.h === 1 ? `url(#${pid})` : "none";
  if (a.s === 0) return <rect x={17} y={0} width={66} height={200} rx={33} fill={fill} stroke={col} strokeWidth={6} />;
  if (a.s === 1) return <path d={SQUIGGLE_D} fill={fill} stroke={col} strokeWidth={6} />;
  return <polygon points="50,0 83,100 50,200 17,100" fill={fill} stroke={col} strokeWidth={6} />;
}

type CardState = "idle" | "sel" | "good" | "bad" | "done" | "hint";

const CARD_RING: Record<CardState, string> = {
  idle: "border-white/15",
  sel: "border-cyan-400 ring-2 ring-cyan-400/50",
  good: "border-emerald-400 ring-2 ring-emerald-400/60",
  bad: "border-rose-500 ring-2 ring-rose-500/60",
  done: "border-emerald-400/40 opacity-45",
  hint: "border-amber-400 ring-2 ring-amber-400/60",
};

function Card({
  a,
  state = "idle",
  onClick,
  label,
}: {
  a: Sym;
  state?: CardState;
  onClick?: () => void;
  label?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const n = a.n + 1;
  const total = n * SYM_W + (n - 1) * SYM_GAP;
  const x0 = CARD_W / 2 - total / 2;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={"relative block w-full overflow-hidden rounded-xl border-2 transition " + CARD_RING[state] + (onClick ? " hover:brightness-105" : "")}
    >
      <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} className="block w-full select-none" role="img" aria-label={label ?? `${COUNT_NAMES[a.n]} ${COLOR_NAMES[a.c]} ${SHAPE_NAMES[a.s]}`}>
        <defs>
          {COLOR_HEX.map((hx, i) => (
            <pattern key={i} id={`${uid}p${i}`} patternUnits="userSpaceOnUse" width={100} height={17}>
              <rect x={0} y={0} width={100} height={8} fill={hx} />
            </pattern>
          ))}
        </defs>
        <rect x={1.5} y={1.5} width={CARD_W - 3} height={CARD_H - 3} rx={16} fill="#f2f2ee" stroke="#d6dad3" strokeWidth={3} />
        <rect x={14} y={14} width={CARD_W - 28} height={CARD_H - 28} rx={10} fill="none" stroke="#f5a623" strokeWidth={7} />
        {Array.from({ length: n }, (_, i) => (
          <g key={i} transform={`translate(${x0 + i * (SYM_W + SYM_GAP)}, ${CARD_H / 2 - 100 * SYM_SCALE}) scale(${SYM_SCALE})`}>
            <Shape a={a} pid={`${uid}p${a.c}`} />
          </g>
        ))}
      </svg>
    </Tag>
  );
}

/** 아직 정해지지 않은 카드 자리 */
function BlankCard({ text = "?" }: { text?: string }) {
  return (
    <div className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-white/25 bg-white/5" style={{ aspectRatio: "3 / 2" }}>
      <span className="text-3xl font-extrabold text-slate-600">{text}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 공용 UI
// ══════════════════════════════════════════════════════════════
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl border-2 px-4 py-2 text-sm font-bold transition " +
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

/** 세 장의 속성별 판정 줄 */
function AttrRow({ name, vals, names }: { name: string; vals: number[]; names: string[] }) {
  const st = attrState(vals);
  const good = st !== 2;
  return (
    <div className={"flex items-center gap-2 rounded-lg px-3 py-1.5 " + (good ? "bg-emerald-400/12" : "bg-rose-400/12")}>
      <span className="w-9 shrink-0 text-[11px] font-bold text-slate-300">{name}</span>
      <span className="flex-1 truncate text-[11px] text-slate-400">{vals.map((v) => names[v]).join(" · ")}</span>
      <span className={"shrink-0 text-[11px] font-bold " + (good ? "text-emerald-200" : "text-rose-200")}>
        {good ? "✓" : "✗"} {ATTR_STATE_TEXT[st]}
      </span>
    </div>
  );
}

function RuleStrip() {
  return (
    <div className="grid gap-1.5 sm:grid-cols-3">
      {[
        { k: "모양", josa: "이" },
        { k: "색깔", josa: "이" },
        { k: "개수", josa: "가" },
      ].map((x, i) => (
        <p key={x.k} className="rounded-lg bg-black/25 px-3 py-2 text-center text-[11px] leading-5 text-slate-300">
          <b className={["text-sky-200", "text-violet-200", "text-amber-200"][i]}>{x.k}</b>
          {x.josa} <b className="text-white">모두 같거나 모두 다르다</b>
        </p>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
type Tab = "rule" | "third" | "find" | "game";

export default function SetGameLab() {
  const [tab, setTab] = useState<Tab>("rule");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학2</p>
        <h3 className="mt-2 text-2xl font-bold">🃏 SET 카드 놀이</h3>
        <p className="mt-2 leading-7 text-slate-300">
          세 장의 카드가 <b className="text-amber-200">&lsquo;합&rsquo;</b>이 되려면 <b className="text-white">모든 속성이 모두 같거나 모두 달라야</b> 해요. 규칙을 익히고, 숨은 합을 남김없이
          찾아내고, 마지막에는 <b className="text-emerald-200">보드게임</b>까지 해 봅시다!
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabButton active={tab === "rule"} onClick={() => setTab("rule")}>
          ① 합의 규칙 📏
        </TabButton>
        <TabButton active={tab === "third"} onClick={() => setTab("third")}>
          ② 세 번째 카드 🧩
        </TabButton>
        <TabButton active={tab === "find"} onClick={() => setTab("find")}>
          ③ 합 모두 찾기 🎯
        </TabButton>
        <TabButton active={tab === "game"} onClick={() => setTab("game")}>
          ④ SET 보드게임 🎮
        </TabButton>
      </div>

      <div className="mt-4">
        {tab === "rule" ? <RuleTab /> : null}
        {tab === "third" ? <ThirdTab /> : null}
        {tab === "find" ? <FindTab /> : null}
        {tab === "game" ? <GameTab /> : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ① 합의 규칙
// ══════════════════════════════════════════════════════════════
function RuleTab() {
  const [qi, setQi] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const q = QUIZZES[qi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <p className="text-sm font-bold text-slate-100">📏 세 장이 &lsquo;합&rsquo;이 되는 조건</p>
        <div className="mt-2">
          <RuleStrip />
        </div>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          🗂️ 카드 27장 모두 보기 {showAll ? "닫기" : "열기"}
        </button>
        {showAll ? <AllCards /> : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🔍 이 세 장은 합일까요?</p>
          <Chips ids={QUIZZES.map((x) => x.id)} cur={qi} done={done} onPick={setQi} />
        </div>
      </div>

      <QuizOne
        key={q.id}
        q={q}
        last={qi === QUIZZES.length - 1}
        onDone={() => setDone((s) => (s.includes(q.id) ? s : [...s, q.id]))}
        onNext={() => setQi((i) => Math.min(QUIZZES.length - 1, i + 1))}
      />

      {done.length === QUIZZES.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 여섯 문제를 모두 맞혔어요!</p>
          <p className="mt-1.5 text-[12px] leading-6 text-slate-300">
            한 속성이라도 <b className="text-rose-200">두 장만 같으면</b> 합이 아니에요. 세 속성을 <b className="text-white">빠짐없이</b> 확인하는 습관을 들여요.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function AllCards() {
  return (
    <div className="mt-2 space-y-2">
      <div className="overflow-x-auto overflow-y-hidden py-1">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[3rem_repeat(9,1fr)] gap-1">
            <div />
            {SHAPE_NAMES.map((s) => (
              <div key={s} className="col-span-3 rounded-md bg-white/10 py-1 text-center text-[11px] font-bold text-slate-200">
                {s}
              </div>
            ))}
            <div className="text-right text-[10px] font-bold text-slate-500">색깔 ▸</div>
            {SHAPE_NAMES.map((s) =>
              COLOR_NAMES.map((c, ci) => (
                <div key={`${s}${c}`} className="rounded-md py-0.5 text-center text-[10px] font-bold" style={{ background: `${COLOR_HEX[ci]}33`, color: "#e2e8f0" }}>
                  {c}
                </div>
              )),
            )}
            {[0, 1, 2].map((n) => (
              <div key={n} className="contents">
                <div className="flex items-center justify-end pr-1 text-[11px] font-bold text-slate-400">{COUNT_NAMES[n]}</div>
                {[0, 1, 2].map((s) => [0, 1, 2].map((c) => <Card key={`${s}${c}${n}`} a={{ s, c, n, h: 0 }} />))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] text-slate-300">
        모양 <b className="text-white">3</b>가지 × 색깔 <b className="text-white">3</b>가지 × 개수 <b className="text-white">3</b>가지 ={" "}
        <b className="text-amber-200">27장</b>
      </p>
    </div>
  );
}

function QuizOne({ q, last, onDone, onNext }: { q: Quiz; last: boolean; onDone: () => void; onNext: () => void }) {
  const [pick, setPick] = useState<boolean | null>(null);
  const cards = q.cards.map(dec3);
  const yes = isSet(cards[0], cards[1], cards[2]);
  const ok = pick !== null && pick === yes;
  const wrong = pick !== null && pick !== yes;

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  return (
    <div className="space-y-3">
      <div
        className={
          "rounded-2xl border-2 p-3 transition " +
          (ok ? (yes ? "border-emerald-400/55 bg-emerald-400/[0.10]" : "border-rose-400/50 bg-rose-400/[0.08]") : "border-white/10 bg-white/5")
        }
      >
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2">
          {cards.map((a, i) => (
            <Card key={i} a={a} state={ok ? (yes ? "good" : "bad") : "idle"} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-cyan-400/35 bg-cyan-400/[0.07] p-4">
          <p className="text-sm font-bold text-cyan-100">이 세 장은 합인가요?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[true, false].map((v) => {
              const on = pick === v;
              const good = pick !== null && v === yes;
              const bad = on && v !== yes;
              return (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setPick(v)}
                  disabled={ok}
                  className={
                    "rounded-xl border-2 px-3 py-3 text-sm font-bold transition disabled:cursor-default " +
                    (good
                      ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                      : bad
                        ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  {v ? "⭕ 합이다" : "❌ 합이 아니다"}
                </button>
              );
            })}
          </div>
          {wrong ? <p className="mt-2 text-center text-[11px] font-bold text-rose-200">다시 생각해 보세요 — 세 속성을 하나씩 짚어 볼까요?</p> : null}
        </div>

        <div className="space-y-2">
          {ok ? (
            <>
              <div className="space-y-1">
                <AttrRow name="모양" vals={cards.map((a) => a.s)} names={SHAPE_NAMES} />
                <AttrRow name="색깔" vals={cards.map((a) => a.c)} names={COLOR_NAMES} />
                <AttrRow name="개수" vals={cards.map((a) => a.n)} names={COUNT_NAMES} />
              </div>
              <p className={"rounded-lg px-3 py-2 text-[12px] leading-6 " + (yes ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100")}>
                {yes ? "✅ " : "❌ "}
                {q.tip}
              </p>
              {!last ? (
                <button
                  type="button"
                  onClick={onNext}
                  className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
                >
                  다음 문제 ▶
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex h-full min-h-[9rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center">
              <p className="text-[12px] leading-6 text-slate-500">
                맞히면 <b className="text-slate-300">모양 · 색깔 · 개수</b>가
                <br />
                각각 어떤 상태인지 보여 줘요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ② 세 번째 카드
// ══════════════════════════════════════════════════════════════
function ThirdTab() {
  const [ti, setTi] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const t = THIRDS[ti];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🧩 합이 되도록 나머지 한 장을 만들어 보세요</p>
          <Chips ids={THIRDS.map((x) => x.id)} cur={ti} done={done} onPick={setTi} />
        </div>
        <div className="mt-2">
          <RuleStrip />
        </div>
      </div>

      <ThirdOne
        key={t.id}
        t={t}
        last={ti === THIRDS.length - 1}
        onDone={() => setDone((s) => (s.includes(t.id) ? s : [...s, t.id]))}
        onNext={() => setTi((i) => Math.min(THIRDS.length - 1, i + 1))}
      />

      {done.length === THIRDS.length ? (
        <div className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 p-4 text-center">
          <p className="text-sm font-extrabold text-emerald-100">🎉 다섯 문제를 모두 만들었어요!</p>
          <p className="mt-1.5 text-[12px] leading-6 text-slate-300">
            두 장이 정해지면 합이 되는 나머지 한 장은 <b className="text-amber-200">언제나 딱 한 장</b>이에요.
            <br />
            속성마다 <b className="text-white">둘이 같으면 그대로, 둘이 다르면 남은 하나</b> — 그래서 답이 하나로 정해집니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ThirdOne({ t, last, onDone, onNext }: { t: ThirdPuzzle; last: boolean; onDone: () => void; onNext: () => void }) {
  const [s, setS] = useState<number | null>(null);
  const [c, setC] = useState<number | null>(null);
  const [n, setN] = useState<number | null>(null);
  const [showTip, setShowTip] = useState(false);

  const pair = t.pair.map(dec3);
  const ans = thirdSym(pair[0], pair[1]);
  const full = s !== null && c !== null && n !== null;
  const mine: Sym | null = full ? { s, c, n, h: 0 } : null;
  const ok = mine !== null && enc3(mine) === enc3(ans);

  const doneRef = useRef(false);
  useEffect(() => {
    if (ok && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  const rows: { key: "s" | "c" | "n"; name: string; names: string[]; val: number | null; set: (v: number) => void }[] = [
    { key: "s", name: "모양", names: SHAPE_NAMES, val: s, set: setS },
    { key: "c", name: "색깔", names: COLOR_NAMES, val: c, set: setC },
    { key: "n", name: "개수", names: COUNT_NAMES, val: n, set: setN },
  ];

  return (
    <div className="space-y-3">
      <div className={"rounded-2xl border-2 p-3 transition " + (ok ? "border-emerald-400/55 bg-emerald-400/[0.10]" : "border-white/10 bg-white/5")}>
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2">
          {pair.map((a, i) => (
            <Card key={i} a={a} state={ok ? "good" : "idle"} />
          ))}
          {mine ? <Card a={mine} state={ok ? "good" : "sel"} /> : <BlankCard />}
        </div>
        <p className={"mt-2 text-center text-[12px] font-bold " + (ok ? "text-emerald-200" : full ? "text-rose-200" : "text-slate-400")}>
          {ok ? "✅ 합이 되었어요!" : full ? "아직 합이 아니에요 — 어긋난 속성을 고쳐 보세요" : "아래에서 모양 · 색깔 · 개수를 골라 세 번째 카드를 만드세요"}
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          {rows.map((r) => (
            <div key={r.key}>
              <p className="text-[11px] font-bold text-slate-400">{r.name}</p>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {r.names.map((label, i) => {
                  const on = r.val === i;
                  const good = full && on && ans[r.key] === i;
                  const bad = full && on && ans[r.key] !== i;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => r.set(i)}
                      disabled={ok}
                      className={
                        "rounded-lg border-2 px-1 py-2 text-[12px] font-bold whitespace-nowrap transition disabled:cursor-default " +
                        (good
                          ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-100"
                          : bad
                            ? "border-rose-400/70 bg-rose-400/20 text-rose-100"
                            : on
                              ? "border-cyan-400/70 bg-cyan-400/20 text-cyan-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {mine ? (
            <div className="space-y-1">
              <AttrRow name="모양" vals={[pair[0].s, pair[1].s, mine.s]} names={SHAPE_NAMES} />
              <AttrRow name="색깔" vals={[pair[0].c, pair[1].c, mine.c]} names={COLOR_NAMES} />
              <AttrRow name="개수" vals={[pair[0].n, pair[1].n, mine.n]} names={COUNT_NAMES} />
            </div>
          ) : (
            <div className="flex min-h-[6rem] items-center justify-center rounded-2xl border border-dashed border-white/15 px-4 text-center">
              <p className="text-[12px] leading-6 text-slate-500">세 속성을 모두 고르면 판정이 나와요</p>
            </div>
          )}
          {ok ? (
            <>
              <p className="rounded-lg bg-emerald-400/12 px-3 py-2 text-[12px] leading-6 text-emerald-100">💡 {t.tip}</p>
              {!last ? (
                <button
                  type="button"
                  onClick={onNext}
                  className="w-full rounded-xl border-2 border-cyan-400/55 bg-cyan-400/15 px-3 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/25"
                >
                  다음 문제 ▶
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowTip((v) => !v)}
                className="w-full rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/20"
              >
                💡 힌트 {showTip ? "닫기" : "보기"}
              </button>
              {showTip ? <p className="rounded-lg bg-amber-400/12 px-3 py-2 text-[12px] leading-6 text-amber-100">{t.tip}</p> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ③ 합 모두 찾기
// ══════════════════════════════════════════════════════════════
function FindTab() {
  const [bi, setBi] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const b = BOARDS[bi];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-100">🎯 9장 속에 숨은 합을 남김없이 찾으세요</p>
          <Chips ids={BOARDS.map((x) => x.id)} cur={bi} done={done} onPick={setBi} />
        </div>
        <p className="mt-2 rounded-lg bg-black/25 px-3 py-2 text-[11px] leading-5 text-slate-300">
          카드를 <b className="text-white">세 장</b> 고르면 바로 판정해요. 합이면 초록으로 기록되고, 아니면 잠깐 빨갛게 표시된 뒤 선택이 풀립니다.
        </p>
      </div>

      <FindOne key={b.id} b={b} onDone={() => setDone((s) => (s.includes(b.id) ? s : [...s, b.id]))} />
    </div>
  );
}

function FindOne({ b, onDone }: { b: Board; onDone: () => void }) {
  const cards = b.cards.map(dec3);
  const allSets = findAllSets(cards);
  const [sel, setSel] = useState<number[]>([]);
  const [bad, setBad] = useState(false);
  const [found, setFound] = useState<number[][]>([]);
  const [hint, setHint] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);

  const cleared = found.length === allSets.length;

  const doneRef = useRef(false);
  useEffect(() => {
    if (cleared && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  });

  useEffect(() => {
    if (!bad) return;
    const id = window.setTimeout(() => {
      setBad(false);
      setSel([]);
    }, 800);
    return () => window.clearTimeout(id);
  }, [bad]);

  const key = (t: number[]) => [...t].sort((x, y) => x - y).join(",");
  const foundKeys = found.map(key);
  const usedIdx = new Set(found.flat());

  function tap(i: number) {
    if (bad || cleared) return;
    setHint(null);
    const next = sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i];
    if (next.length < 3) {
      setSel(next);
      return;
    }
    if (isSet(cards[next[0]], cards[next[1]], cards[next[2]]) && !foundKeys.includes(key(next))) {
      setFound((f) => [...f, next]);
      setSel([]);
    } else {
      setSel(next);
      setBad(true);
    }
  }

  function askHint() {
    const rest = allSets.filter((t) => !foundKeys.includes(key(t)));
    if (!rest.length) return;
    setHint(rest[0][0]);
    setSel([]);
  }

  function stateOf(i: number): CardState {
    if (sel.includes(i)) return bad ? "bad" : "sel";
    if (hint === i) return "hint";
    if (usedIdx.has(i)) return "good";
    return "idle";
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={"rounded-2xl border-2 p-3 transition " + (cleared ? "border-emerald-400/55 bg-emerald-400/[0.10]" : "border-white/10 bg-white/5")}>
        <div className="grid grid-cols-3 gap-2">
          {cards.map((a, i) => (
            <Card key={i} a={a} state={stateOf(i)} onClick={() => tap(i)} />
          ))}
        </div>
        <p className={"mt-2 text-center text-sm font-extrabold " + (cleared ? "text-emerald-200" : "text-slate-300")}>
          {cleared ? "🎉 합을 모두 찾았어요!" : `찾은 합 ${found.length} / ${allSets.length}`}
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-[11px] font-bold text-slate-400">✅ 찾아낸 합</p>
          {found.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-white/15 px-3 py-5 text-center text-[11px] text-slate-500">아직 없어요 — 카드 세 장을 골라 보세요</p>
          ) : (
            <div className="mt-2 space-y-2">
              {found.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center font-mono text-[11px] font-bold text-emerald-300">{i + 1}</span>
                  <div className="grid flex-1 grid-cols-3 gap-1.5">
                    {t.map((x) => (
                      <Card key={x} a={cards[x]} state="good" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!cleared ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={askHint}
              className="rounded-xl border border-amber-400/45 bg-amber-400/10 px-3 py-2 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/20"
            >
              💡 카드 한 장 알려주기
            </button>
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
            >
              👀 남은 합 {reveal ? "숨기기" : "보기"}
            </button>
          </div>
        ) : (
          <p className="rounded-2xl border-2 border-emerald-400/50 bg-emerald-400/12 px-4 py-3 text-center text-[12px] leading-6 text-emerald-100">
            9장 가운데 세 장을 고르는 방법은 <b className="text-white">84가지</b>인데 그중 합은 <b className="text-white">{allSets.length}가지</b>뿐이었어요.
          </p>
        )}

        {reveal && !cleared ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3">
            <p className="text-[11px] font-bold text-slate-400">아직 못 찾은 합</p>
            {allSets
              .filter((t) => !foundKeys.includes(key(t)))
              .map((t, i) => (
                <div key={i} className="grid grid-cols-3 gap-1.5 opacity-80">
                  {t.map((x) => (
                    <Card key={x} a={cards[x]} />
                  ))}
                </div>
              ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 ④ SET 보드게임 (81장)
// ══════════════════════════════════════════════════════════════
function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function GameTab() {
  const [deck, setDeck] = useState<number[] | null>(null);
  const [board, setBoard] = useState<number[]>([]);
  const [sel, setSel] = useState<number[]>([]);
  const [bad, setBad] = useState(false);
  const [taken, setTaken] = useState<number[][]>([]);
  const [miss, setMiss] = useState(0);
  const [hints, setHints] = useState(0);
  const [hint, setHint] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [sec, setSec] = useState(0);

  const started = deck !== null;
  const boardSyms = board.map(dec4);
  const sets = findAllSets(boardSyms, true);
  const over = started && deck.length === 0 && sets.length === 0;

  useEffect(() => {
    if (!started || over) return;
    const id = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [started, over]);

  useEffect(() => {
    if (!bad) return;
    const id = window.setTimeout(() => {
      setBad(false);
      setSel([]);
    }, 800);
    return () => window.clearTimeout(id);
  }, [bad]);

  function start() {
    const d = shuffle(DECK81);
    setBoard(d.slice(0, START_CARDS));
    setDeck(d.slice(START_CARDS));
    setSel([]);
    setTaken([]);
    setMiss(0);
    setHints(0);
    setHint(null);
    setMsg(null);
    setSec(0);
    setBad(false);
  }

  function tap(i: number) {
    if (!started || bad || over) return;
    setHint(null);
    setMsg(null);
    const next = sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i];
    if (next.length < 3) {
      setSel(next);
      return;
    }
    const three = next.map((x) => boardSyms[x]);
    if (!isSet(three[0], three[1], three[2], true)) {
      setSel(next);
      setBad(true);
      setMiss((m) => m + 1);
      return;
    }
    const keep = board.filter((_, x) => !next.includes(x));
    let nd = deck;
    let nb = keep;
    if (keep.length < START_CARDS && nd.length > 0) {
      nb = keep.concat(nd.slice(0, ADD_CARDS));
      nd = nd.slice(ADD_CARDS);
    }
    setTaken((t) => [...t, next.map((x) => board[x])]);
    setBoard(nb);
    setDeck(nd);
    setSel([]);
  }

  function addThree() {
    if (!started || over) return;
    setHint(null);
    if (sets.length > 0) {
      setMsg("아직 합이 남아 있어요! 더 찾아보세요.");
      setMiss((m) => m + 1);
      return;
    }
    if (deck.length === 0) {
      setMsg("남은 카드가 없어요.");
      return;
    }
    setBoard((b) => b.concat(deck.slice(0, ADD_CARDS)));
    setDeck((d) => (d ? d.slice(ADD_CARDS) : d));
    setMsg("합이 없어 3장을 더 펼쳤어요.");
    setSel([]);
  }

  function askHint() {
    if (!sets.length) {
      setMsg("지금 펼쳐진 카드에는 합이 없어요 — 3장 더 펼치세요.");
      return;
    }
    setHint(sets[0][0]);
    setHints((h) => h + 1);
    setSel([]);
    setMsg(null);
  }

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-sm font-bold text-slate-100">🎮 보드게임 SET — 네 번째 속성 &lsquo;무늬&rsquo;가 더해져요</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {SHADE_NAMES.map((label, h) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/25 p-2">
                <Card a={{ s: 0, c: 0, n: 1, h }} />
                <p className="mt-1.5 text-center text-[11px] font-bold text-slate-300">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-black/25 px-3 py-2 text-center text-[12px] text-slate-300">
            모양 <b className="text-white">3</b> × 색깔 <b className="text-white">3</b> × 개수 <b className="text-white">3</b> × 무늬 <b className="text-white">3</b> ={" "}
            <b className="text-amber-200">81장</b> · 네 속성이 <b className="text-white">모두</b> 조건을 지켜야 합이에요
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <p className="text-sm font-bold text-slate-100">📜 놀이 방법</p>
          <ol className="mt-2 space-y-1.5">
            {[
              `카드 ${START_CARDS}장을 펼칩니다.`,
              "합을 찾으면 세 장을 눌러 가져갑니다. 빈자리는 새 카드로 채워요.",
              `펼쳐진 카드에 합이 전혀 없으면 ${ADD_CARDS}장을 더 펼칩니다.`,
              "카드를 다 쓰고 더 이상 합이 없으면 끝 — 모은 합이 많을수록 좋아요!",
            ].map((s, i) => (
              <li key={i} className="flex gap-2 rounded-lg bg-black/25 px-3 py-2 text-[12px] leading-6 text-slate-300">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[11px] font-bold text-slate-200">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <button
          type="button"
          onClick={start}
          className="w-full rounded-xl border-2 border-emerald-400/60 bg-emerald-400/15 px-3 py-3 text-base font-extrabold text-emerald-100 transition hover:bg-emerald-400/25"
        >
          ▶ 게임 시작
        </button>
      </div>
    );
  }

  function stateOf(i: number): CardState {
    if (sel.includes(i)) return bad ? "bad" : "sel";
    if (hint === i) return "hint";
    return "idle";
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          { k: "모은 합", v: `${taken.length}`, c: "text-emerald-200" },
          { k: "남은 카드", v: `${deck.length}`, c: "text-sky-200" },
          { k: "실수", v: `${miss}`, c: "text-rose-200" },
          { k: "시간", v: fmt(sec), c: "text-amber-200" },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-400">{x.k}</p>
            <p className={"font-mono text-lg font-extrabold " + x.c}>{x.v}</p>
          </div>
        ))}
      </div>

      {over ? (
        <div className="rounded-2xl border-2 border-emerald-400/55 bg-emerald-400/12 p-4 text-center">
          <p className="text-base font-extrabold text-emerald-100">🎉 게임 끝!</p>
          <p className="mt-1 text-[12px] leading-6 text-slate-200">
            합을 <b className="text-white">{taken.length}개</b> 모았어요 · 걸린 시간 <b className="text-white">{fmt(sec)}</b> · 실수 {miss}번 · 힌트 {hints}번
            <br />
            남은 {board.length}장으로는 더 이상 합을 만들 수 없어요.
          </p>
        </div>
      ) : null}

      <div className={"rounded-2xl border-2 p-3 transition " + (over ? "border-emerald-400/40 bg-emerald-400/[0.07]" : "border-white/10 bg-white/5")}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {boardSyms.map((a, i) => (
            <Card key={`${board[i]}-${i}`} a={a} state={stateOf(i)} onClick={() => tap(i)} />
          ))}
        </div>
      </div>

      {msg ? <p className="rounded-lg bg-amber-400/12 px-3 py-2 text-center text-[12px] font-bold text-amber-100">{msg}</p> : null}

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={addThree}
          disabled={over}
          className="rounded-xl border-2 border-sky-400/50 bg-sky-400/12 px-2 py-2 text-[12px] font-bold text-sky-100 transition hover:bg-sky-400/22 disabled:opacity-40"
        >
          ➕ 3장 더 펼치기
        </button>
        <button
          type="button"
          onClick={askHint}
          disabled={over}
          className="rounded-xl border border-amber-400/45 bg-amber-400/10 px-2 py-2 text-[12px] font-bold text-amber-100 transition hover:bg-amber-400/20 disabled:opacity-40"
        >
          💡 힌트 ({hints})
        </button>
        <button
          type="button"
          onClick={start}
          className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-[12px] font-bold text-slate-300 transition hover:bg-white/10"
        >
          ↺ 새 게임
        </button>
      </div>

      {taken.length ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
          <p className="text-[11px] font-bold text-slate-400">🏆 모은 합 {taken.length}개</p>
          <div className="mt-2 space-y-1.5">
            {taken
              .slice()
              .reverse()
              .slice(0, 5)
              .map((t, i) => (
                <div key={taken.length - i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center font-mono text-[11px] font-bold text-emerald-300">{taken.length - i}</span>
                  <div className="grid flex-1 grid-cols-3 gap-1.5">
                    {t.map((k) => (
                      <Card key={k} a={dec4(k)} state="good" />
                    ))}
                  </div>
                </div>
              ))}
          </div>
          {taken.length > 5 ? <p className="mt-1.5 text-center text-[11px] text-slate-500">최근 5개만 보여 줘요</p> : null}
        </div>
      ) : null}
    </div>
  );
}
