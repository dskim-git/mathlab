"use client";

import { useMemo, useState } from "react";
import Quiz, { type QuizItem } from "@/components/activities/Quiz";
import ReflectionForm from "@/components/activities/ReflectionForm";
import { useCountUp } from "@/lib/activities/anim";
import type { ReflectionQuestion } from "@/lib/activities/reflection";
import WorldMap from "./WorldMap";
import { BG_CLASS, COLORS, FLAGS, type ColorKey } from "./data";

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// 다중집합(같은 것이 있는 순열)의 서로 다른 배열 생성.
function distinctArrangements(items: ColorKey[], cap = 200): ColorKey[][] {
  const counts: Partial<Record<ColorKey, number>> = {};
  items.forEach((c) => (counts[c] = (counts[c] ?? 0) + 1));
  const keys = Object.keys(counts) as ColorKey[];
  const out: ColorKey[][] = [];
  const cur: ColorKey[] = [];
  const rec = () => {
    if (out.length >= cap) return;
    if (cur.length === items.length) {
      out.push([...cur]);
      return;
    }
    for (const k of keys) {
      if ((counts[k] ?? 0) > 0) {
        counts[k]! -= 1;
        cur.push(k);
        rec();
        cur.pop();
        counts[k]! += 1;
      }
    }
  };
  rec();
  return out;
}

/* 색 띠 깃발(세로 줄무늬). */
function StripeFlag({ colors, size = "md" }: { colors: ColorKey[]; size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "lg" ? "h-14 w-24" : size === "sm" ? "h-8 w-14" : "h-11 w-[72px]";
  return (
    <div className={`flex ${dim} overflow-hidden rounded-md border border-white/15 shadow`}>
      {colors.map((c, i) => (
        <div key={i} className={`flex-1 ${BG_CLASS[c]}`} />
      ))}
    </div>
  );
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "repeat_effect",
    prompt:
      "같은 색을 1개에서 2개로 늘리면 서로 다른 깃발의 수는 어떻게 변하나요? 공식 n!/(p!q!r!)과 연결해 설명해 보세요.",
    kind: "text",
    placeholder: "예: 같은 색이 늘면 분모가 커져서 …",
  },
];

const QUIZ: QuizItem[] = [
  {
    q: "파랑·흰색·빨강을 각각 1개씩 사용하여 3칸짜리 가로 줄무늬 삼색기를 만들 때, 서로 다른 경우는 몇 가지인지 구하시오.",
    answer: "6",
    hint: "서로 다른 3가지 색을 일렬로 나열하는 순열입니다.",
    solution: "3! = 6가지입니다.",
  },
  {
    q: "파랑 1개, 빨강 2개를 사용하여 3칸짜리 삼색기를 만들 때, 서로 다른 경우는 몇 가지인지 구하시오.",
    answer: "3",
    hint: "같은 것이 있는 순열 n!/(p!q!) 를 사용하세요.",
    solution: "3! / (1!·2!) = 3가지 (파·빨·빨, 빨·파·빨, 빨·빨·파).",
  },
  {
    q: "파랑 1개, 흰색 2개, 빨강 1개를 모두 사용하여 4칸짜리 가로 줄무늬 국기를 만들 때, 서로 다른 경우는 모두 몇 가지인지 구하시오.",
    answer: "12",
    hint: "전체 4개 중 흰색이 2개 같으므로 4!/(1!·2!·1!).",
    solution: "4! / (1!·2!·1!) = 12가지입니다.",
  },
];

type GalleryLayout = "v" | "h" | "all";
const ACT_BUILD: ColorKey[] = ["b", "w", "r"];

export default function TricolorFlagPerm() {
  const [layout, setLayout] = useState<GalleryLayout>("v");
  const [act, setAct] = useState<1 | 2 | 3>(1);

  // 활동 ① 빌더
  const [selected, setSelected] = useState<ColorKey>("b");
  const [builder, setBuilder] = useState<(ColorKey | null)[]>([null, null, null]);
  const [made, setMade] = useState<string[]>([]);

  // 활동 ② 경우의 수
  const [counts, setCounts] = useState<Record<ColorKey, number>>({
    b: 1, w: 1, r: 1, y: 0, g: 0, k: 0, o: 0, lb: 0,
  });

  const galleryFlags = useMemo(
    () => (layout === "all" ? FLAGS : FLAGS.filter((f) => f.o === layout)),
    [layout]
  );

  const builderFull = builder.every((c) => c !== null);
  const builderDup = builderFull && new Set(builder).size < builder.length;

  function paint(i: number) {
    setBuilder((prev) => {
      const next = prev.map((c, idx) => (idx === i ? selected : c));
      if (next.every((c) => c !== null) && new Set(next).size === next.length) {
        const key = next.join("-");
        setMade((m) => (m.includes(key) ? m : [...m, key]));
      }
      return next;
    });
  }

  const n2 = counts.b + counts.w + counts.r;
  const count2 = useMemo(
    () => (n2 === 0 ? 0 : factorial(n2) / (factorial(counts.b) * factorial(counts.w) * factorial(counts.r))),
    [counts, n2]
  );
  const count2Anim = useCountUp(count2);
  const flags2 = useMemo(() => {
    const items: ColorKey[] = [
      ...Array(counts.b).fill("b"),
      ...Array(counts.w).fill("w"),
      ...Array(counts.r).fill("r"),
    ];
    return items.length === 0 ? [] : distinctArrangements(items);
  }, [counts]);

  const beforeFlags = useMemo(() => distinctArrangements(["b", "w", "r"]), []);
  const afterFlags = useMemo(() => distinctArrangements(["b", "r", "r"]), []);

  function changeCnt(key: "b" | "w" | "r", delta: number) {
    setCounts((prev) => {
      const v = Math.max(0, Math.min(5, prev[key] + delta));
      const next = { ...prev, [key]: v };
      if (next.b + next.w + next.r > 8 || next.b + next.w + next.r < 1) return prev;
      return next;
    });
  }

  const tabBtn = (active: boolean) =>
    active
      ? "rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
      : "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 같은 것이 있는 순열</p>
        <h3 className="mt-2 text-2xl font-bold">🏳️ 삼색기와 같은 것이 있는 순열</h3>
        <p className="mt-2 leading-7 text-slate-300">
          세계의 삼색기를 살펴보고, 같은 색이 섞인 깃발의 서로 다른 배열 수{" "}
          <b className="text-cyan-200">n!/(p!·q!·r!)</b>를 직접 탐구해 봅니다.
        </p>
      </div>

      {/* 세계지도 */}
      <div className="mt-5">
        <p className="mb-2 text-sm font-semibold text-cyan-200">🗺️ 세계의 삼색기 국가</p>
        <WorldMap />
      </div>

      {/* 국가별 갤러리 */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-cyan-200">🏳️ 국가별 삼색기 모음</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={tabBtn(layout === "v")} onClick={() => setLayout("v")}>
            세로 줄무늬
          </button>
          <button type="button" className={tabBtn(layout === "h")} onClick={() => setLayout("h")}>
            가로 줄무늬
          </button>
          <button type="button" className={tabBtn(layout === "all")} onClick={() => setLayout("all")}>
            전체 보기
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {galleryFlags.map((f) => (
            <div
              key={f.code}
              className="w-[104px] rounded-xl border border-white/10 bg-white/5 p-2.5 text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w80/${f.code}.png`}
                alt={f.name}
                loading="lazy"
                className="mx-auto h-auto w-[72px] rounded shadow"
              />
              <div className="mt-2 text-[11px] font-semibold text-slate-200">{f.name}</div>
              <div className="text-[10px] text-slate-500">
                {f.c.map((c) => COLORS[c].short).join("·")} · {f.o === "v" ? "세로" : "가로"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 활동 */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-cyan-200">🎨 삼색기 경우의 수 탐구</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={tabBtn(act === 1)} onClick={() => setAct(1)}>
            ① 직접 만들기
          </button>
          <button type="button" className={tabBtn(act === 2)} onClick={() => setAct(2)}>
            ② 경우의 수 탐구
          </button>
          <button type="button" className={tabBtn(act === 3)} onClick={() => setAct(3)}>
            ③ 흰색→빨간색
          </button>
        </div>

        {/* 활동 ① */}
        {act === 1 ? (
          <div className="mt-4">
            <p className="text-sm text-slate-400">
              파랑·흰색·빨강을 각각 1개씩 써서 만들 수 있는 6가지(3!)를 모두 찾아보세요. 색을 고른
              뒤 칸을 눌러 칠합니다.
            </p>
            <div className="mt-3 flex gap-3">
              {ACT_BUILD.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelected(c)}
                  className={`h-10 w-10 rounded-full border-2 transition ${BG_CLASS[c]} ${
                    selected === c ? "scale-110 border-white" : "border-white/20"
                  }`}
                  aria-label={COLORS[c].name}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                {builder.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => paint(i)}
                    className={`flex h-20 w-14 items-center justify-center rounded-lg border-2 ${
                      c ? `${BG_CLASS[c]} border-transparent` : "border-dashed border-white/25"
                    }`}
                  >
                    {!c ? <span className="text-2xl text-white/20">{i + 1}</span> : null}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setBuilder([null, null, null])}
                className="rounded-lg border border-red-300/40 px-3 py-2 text-sm text-red-200 transition hover:bg-red-300/10"
              >
                ↺ 초기화
              </button>
            </div>
            {builderFull ? (
              <p className={`mt-3 text-sm font-semibold ${builderDup ? "text-amber-300" : "text-emerald-300"}`}>
                {builderDup ? "⚠️ 중복 색이 있는 경우" : "✅ 모두 다른 색 (3! = 6가지 중 하나)"}
              </p>
            ) : null}
            <p className="mt-4 text-sm font-semibold text-cyan-200">✅ 지금까지 찾은 경우</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {made.map((key) => (
                <StripeFlag key={key} colors={key.split("-") as ColorKey[]} />
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {made.length >= 6 ? (
                <span className="font-bold text-emerald-300">🎉 6가지(3!)를 모두 찾았어요!</span>
              ) : (
                `${made.length}/6가지 발견 (전체 3! = 6가지)`
              )}
            </p>
          </div>
        ) : null}

        {/* 활동 ② */}
        {act === 2 ? (
          <div className="mt-4">
            <p className="text-sm text-slate-400">
              각 색의 개수를 바꾸며 같은 것이 있는 순열 n!/(p!q!r!)을 확인해 보세요.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {(["b", "w", "r"] as const).map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2"
                >
                  <span className={`h-5 w-5 rounded border border-white/20 ${BG_CLASS[c]}`} />
                  <span className="text-sm font-semibold text-slate-200">{COLORS[c].name}</span>
                  <button type="button" onClick={() => changeCnt(c, -1)} className="h-6 w-6 rounded border border-white/15 hover:bg-white/10">−</button>
                  <span className="w-4 text-center font-extrabold tabular-nums">{counts[c]}</span>
                  <button type="button" onClick={() => changeCnt(c, 1)} className="h-6 w-6 rounded border border-white/15 hover:bg-white/10">+</button>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 p-5 text-center">
              <div className="text-lg font-bold text-cyan-100">
                {n2}! / ({[counts.b, counts.w, counts.r].filter((x) => x > 0).map((x) => `${x}!`).join("·")}) ={" "}
                {count2.toLocaleString()}
              </div>
              <div className="mt-1 text-3xl font-black text-white tabular-nums">
                {count2Anim.toLocaleString()}
                <span className="ml-1 text-lg font-bold text-slate-400">가지</span>
              </div>
            </div>
            <div className="mt-3 flex max-h-72 flex-wrap gap-2 overflow-y-auto">
              {flags2.map((colors, i) => (
                <StripeFlag key={i} colors={colors} size="sm" />
              ))}
            </div>
          </div>
        ) : null}

        {/* 활동 ③ */}
        {act === 3 ? (
          <div className="mt-4">
            <p className="text-sm text-slate-400">
              파·흰·빨 각 1개로 만든 6가지에서 <b className="text-slate-200">흰색을 빨간색으로 바꾸면</b>{" "}
              서로 다른 경우는 몇 가지가 될까요?
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-sm font-bold text-cyan-200">변환 전: 파·흰·빨 (3! = 6)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {beforeFlags.map((c, i) => (
                    <StripeFlag key={i} colors={c} size="sm" />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                <p className="text-sm font-bold text-cyan-200">변환 후: 파·빨·빨 (3!/2! = 3)</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {afterFlags.map((c, i) => (
                    <StripeFlag key={i} colors={c} size="sm" />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-cyan-300/25 bg-cyan-950/20 p-4 text-center text-cyan-100">
              <b>3! / 2! = 3가지</b> — 같은 색(빨강 2개)이 생기면 그만큼 겹쳐서 줄어듭니다.
            </div>
          </div>
        ) : null}
      </div>

      <Quiz items={QUIZ} />
      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
