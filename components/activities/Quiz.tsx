"use client";

import { useState } from "react";

export type QuizItem = {
  q: string;
  /** 정답(숫자/문자열). 채점은 공백·쉼표 무시 후 문자열 비교. */
  answer: string;
  hint?: string;
  /** 풀이(여러 줄 가능). */
  solution?: string;
};

function normalize(value: string): string {
  return value.trim().replace(/[,\s]/g, "");
}

function QuizRow({ item, index }: { item: QuizItem; index: number }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [showSolution, setShowSolution] = useState(false);

  function check() {
    if (!value.trim()) {
      setResult(null);
      return;
    }
    setResult(normalize(value) === normalize(item.answer));
  }

  return (
    <div className="border-b border-white/10 py-4 last:border-b-0">
      <p className="font-semibold leading-7 text-slate-100">
        <span className="text-cyan-300">문제 {index + 1}.</span> {item.q}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setResult(null);
          }}
          placeholder="답을 입력하세요"
          aria-label={`문제 ${index + 1} 답 입력`}
          className="w-48 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
        />
        <button
          type="button"
          onClick={check}
          className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          채점하기
        </button>
        {item.hint ? (
          <button
            type="button"
            onClick={() => setShowSolution((s) => !s)}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          >
            {showSolution ? "풀이 숨기기" : "힌트·풀이"}
          </button>
        ) : null}
      </div>

      {result === true ? (
        <p className="mt-2 text-sm font-semibold text-emerald-300">✅ 정답입니다!</p>
      ) : null}
      {result === false ? (
        <p className="mt-2 text-sm font-semibold text-red-300">
          ❌ 다시 생각해 보세요.
        </p>
      ) : null}

      {showSolution ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-slate-900 p-4 text-sm leading-7 text-slate-300">
          {item.hint ? (
            <p>
              <span className="font-semibold text-cyan-200">힌트.</span> {item.hint}
            </p>
          ) : null}
          {item.solution ? (
            <p className="mt-2 whitespace-pre-wrap">
              <span className="font-semibold text-cyan-200">풀이.</span>{" "}
              {item.solution}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function Quiz({ items }: { items: QuizItem[] }) {
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-6">
      <p className="text-sm font-semibold text-cyan-300">확인 문제</p>
      <h3 className="mt-2 text-xl font-bold">활동을 바탕으로 풀어 보세요</h3>
      <div className="mt-3">
        {items.map((item, i) => (
          <QuizRow key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
