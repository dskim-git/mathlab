"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🔮 베이즈 정리 탐구  (5 tabs)
   1) 쿠키 상자  — 사전→사후 업데이트 직관
   2) 진단 키트  — 100,000명 분할표 + 4확률 + 감염병 참고표
   3) 스팸 필터  — 10키워드 체크 + 나이브 베이즈(로그 우도)
   4) 도핑 검사  — 1,000명 (200점 시각화) + 분할표 + 핵심 결과
   5) 반복 검사  — 1차→2차→3차 자동 시뮬 + 신뢰도 차트
   ────────────────────────────────────────────────────────────── */

// ============================================================
// 공통 유틸 / 컴포넌트
// ============================================================

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}
function fmtP(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** SVG 진행바 (스택형 가능). value 0~100, fill hex.
 *  라벨은 호출부에서 주변 HTML 텍스트로 표시(글자 왜곡·inline style 회피). */
function StackBarSVG({
  segments, heightClass = "h-[22px]",
}: { segments: { value: number; fill: string }[]; heightClass?: string }) {
  // 누적 시작점은 prefix sum (재할당 없이 한 번에).
  const widths = segments.map((s) => clamp(s.value, 0, 100));
  const starts = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div className={`relative w-full overflow-hidden rounded-md bg-white/[0.07] ${heightClass}`}>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
        {segments.map((s, i) => (
          <rect key={i} x={starts[i]} y={0} width={widths[i]} height={24} fill={s.fill} className="transition-all duration-500" />
        ))}
      </svg>
    </div>
  );
}

function Slider({
  id, label, valueText, min, max, step = 1, value, onChange, accent = "cyan",
}: {
  id: string; label: string; valueText: string;
  min: number; max: number; step?: number; value: number;
  onChange: (n: number) => void;
  accent?: "cyan" | "amber" | "violet" | "teal" | "rose";
}) {
  const accentCls =
    accent === "amber" ? "accent-amber-400" :
    accent === "violet" ? "accent-violet-400" :
    accent === "teal" ? "accent-teal-400" :
    accent === "rose" ? "accent-rose-400" :
    "accent-cyan-400";
  const valTone =
    accent === "amber" ? "text-amber-300" :
    accent === "violet" ? "text-violet-300" :
    accent === "teal" ? "text-teal-300" :
    accent === "rose" ? "text-rose-300" :
    "text-cyan-300";
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className={`font-mono text-sm font-bold ${valTone}`}>{valueText}</span>
      </label>
      <input
        id={id}
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className={`w-full ${accentCls}`}
      />
    </div>
  );
}

// ============================================================
// 탭 1 — 🍪 쿠키 상자
// ============================================================

function CookieTab() {
  const [priorSlider, setPriorSlider] = useState(50); // 10~90
  const [evidence, setEvidence] = useState<"C" | "S" | null>(null);

  const pA = priorSlider / 100;
  const pB = 1 - pA;

  // 우도 — 상자A: 초콜릿 90% 딸기 10% / 상자B: 초콜릿 20% 딸기 80%
  function bayes(ev: "C" | "S") {
    const pEA = ev === "C" ? 0.9 : 0.1;
    const pEB = ev === "C" ? 0.2 : 0.8;
    const num = pEA * pA;
    const den = pEA * pA + pEB * pB;
    const post = den > 0 ? num / den : 0;
    return { pEA, pEB, num, den, post, postB: 1 - post };
  }

  const result = evidence ? bayes(evidence) : null;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-400/15 to-orange-500/10 p-4 text-center">
        <h4 className="text-lg font-bold text-amber-300">🍪 쿠키 상자와 베이즈 정리</h4>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          눈을 감고 두 상자 중 하나에서 쿠키를 꺼냈어요.
          <br />
          꺼낸 쿠키 종류로 <b className="text-amber-300">&ldquo;어느 상자일 확률&rdquo;</b>을 업데이트해 봐요!
        </p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-amber-300">📦 두 상자의 쿠키 구성</h5>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <BoxCard color="A" name="상자 A" cookies={Array.from({ length: 10 }, (_, i) => (i < 9 ? "🍫" : "🍓"))} statText="🍫 초콜릿 90% · 🍓 딸기 10%" />
          <BoxCard color="B" name="상자 B" cookies={Array.from({ length: 10 }, (_, i) => (i < 2 ? "🍫" : "🍓"))} statText="🍫 초콜릿 20% · 🍓 딸기 80%" />
        </div>
        <div className="mt-3 rounded-lg border border-violet-400/30 bg-violet-400/[0.08] p-3 text-xs leading-7 text-violet-100">
          <b className="text-amber-300">베이즈 정리</b>란? &ldquo;새로운 사실(꺼낸 쿠키)을 알았을 때, 내 생각(상자A일 확률)을 합리적으로 업데이트하는 방법&rdquo;
          <br />
          → <b className="text-amber-300">사전확률</b>(관찰 전) + <b className="text-amber-300">새로운 증거</b> = <b className="text-amber-300">사후확률</b>(관찰 후)
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-amber-300">🎲 Step 1 — 사전확률 (어느 상자를 뽑을 확률?)</h5>
        <p className="mt-1 text-xs text-slate-400">슬라이더로 상자 A를 선택할 확률을 조절해 보세요. (기본 : 50%씩 동일)</p>
        <input
          type="range" min={10} max={90} step={5} value={priorSlider}
          onChange={(e) => { setPriorSlider(Number(e.target.value)); setEvidence(null); }}
          aria-label="P(상자A) 사전확률 슬라이더"
          className="mt-2 w-full accent-amber-400"
        />
        <StackBarSVG
          heightClass="h-[28px]"
          segments={[
            { value: pA * 100, fill: "rgba(59,130,246,0.65)" },
            { value: pB * 100, fill: "rgba(249,115,22,0.65)" },
          ]}
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className="font-bold text-blue-300">P(상자A) = {pA.toFixed(2)}</span>
          <span className="font-bold text-orange-300">P(상자B) = {pB.toFixed(2)}</span>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-amber-300">🔍 Step 2 — 증거 관찰 (꺼낸 쿠키는?)</h5>
        <p className="mt-1 text-xs text-slate-400">쿠키 종류를 선택하면 베이즈 정리로 확률을 업데이트할게요!</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEvidence("C")}
            className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
              evidence === "C"
                ? "border-amber-400 bg-amber-400/45 text-amber-100"
                : "border-amber-400/40 bg-amber-700/20 text-amber-200 hover:bg-amber-700/35"
            }`}
          >
            🍫 초콜릿 쿠키
          </button>
          <button
            type="button"
            onClick={() => setEvidence("S")}
            className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
              evidence === "S"
                ? "border-rose-400 bg-rose-400/45 text-rose-100"
                : "border-rose-400/40 bg-rose-700/20 text-rose-200 hover:bg-rose-700/35"
            }`}
          >
            🍓 딸기 쿠키
          </button>
        </div>
      </section>

      {result ? (
        <section className="animate-[fadein_0.4s_ease] rounded-xl border border-violet-400/35 bg-violet-400/[0.07] p-4">
          <h5 className="text-sm font-bold text-violet-300">
            📊 {evidence === "C" ? "🍫 초콜릿" : "🍓 딸기"} 쿠키를 꺼냈을 때!
          </h5>

          <div className="mt-3 grid grid-cols-[1fr_28px_1fr] items-center gap-2">
            <div>
              <div className="mb-1 text-center text-[10px] font-bold text-slate-500">⬅ 사전확률 (관찰 전)</div>
              <StackBarSVG
                heightClass="h-[40px]"
                segments={[
                  { value: pA * 100, fill: "rgba(59,130,246,0.55)" },
                  { value: pB * 100, fill: "rgba(249,115,22,0.55)" },
                ]}
              />
              <div className="mt-1 flex justify-between text-[11px]">
                <span className="text-blue-300">상자A {fmtP(pA)}</span>
                <span className="text-orange-300">상자B {fmtP(pB)}</span>
              </div>
            </div>
            <div className="text-center text-2xl text-violet-300">→</div>
            <div>
              <div className="mb-1 text-center text-[10px] font-bold text-slate-500">사후확률 (관찰 후) ➡</div>
              <StackBarSVG
                heightClass="h-[40px]"
                segments={[
                  { value: result.post * 100, fill: "rgba(59,130,246,0.55)" },
                  { value: result.postB * 100, fill: "rgba(249,115,22,0.55)" },
                ]}
              />
              <div className="mt-1 flex justify-between text-[11px]">
                <span className="text-blue-300">상자A {fmtP(result.post)}</span>
                <span className="text-orange-300">상자B {fmtP(result.postB)}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-amber-400/25 bg-black/30 px-3 py-2.5 font-mono text-[11px] leading-6 text-amber-100">
            P(상자A | {evidence === "C" ? "초콜릿" : "딸기"}) =
            <br />
            &nbsp;&nbsp; P({evidence === "C" ? "초콜릿" : "딸기"}|상자A) × P(상자A)
            <br />
            ──────────────────────────────────────────
            <br />
            &nbsp;&nbsp; P({evidence === "C" ? "초콜릿" : "딸기"}|상자A)×P(상자A) + P({evidence === "C" ? "초콜릿" : "딸기"}|상자B)×P(상자B)
            <br />
            <br />
            = {result.pEA.toFixed(2)} × {pA.toFixed(2)}
            <br />
            ────────────────────────────
            <br />
            &nbsp;&nbsp; {result.pEA.toFixed(2)}×{pA.toFixed(2)} + {result.pEB.toFixed(2)}×{pB.toFixed(2)}
            <br />
            <br />
            = {result.num.toFixed(4)} / {result.den.toFixed(4)} = <span className="text-lg font-bold text-emerald-300">{fmtP(result.post)}</span>
          </div>

          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.07] p-3 text-xs leading-6 text-emerald-200">
            {evidence === "C" ? "🍫" : "🍓"} {evidence === "C"
              ? "초콜릿 쿠키가 나왔어요! 상자A의 초콜릿 비율(90%)이 상자B(20%)보다 훨씬 높으니, 상자A일 가능성이"
              : "딸기 쿠키가 나왔어요! 상자B의 딸기 비율(80%)이 상자A(10%)보다 훨씬 높으니, 상자A일 가능성이"}{" "}
            <strong>{result.post > pA ? "높아졌어요 ↑" : result.post < pA ? "낮아졌어요 ↓" : "그대로예요"}</strong>
            <br />
            사전확률 {fmtP(pA)} → 사후확률 <strong>{fmtP(result.post)}</strong>
            <br />
            <br />
            💡 슬라이더로 사전확률을 바꿔봐요! 사전확률이 달라지면 사후확률도 달라지나요?
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BoxCard({ color, name, cookies, statText }: { color: "A" | "B"; name: string; cookies: string[]; statText: string }) {
  const cls = color === "A"
    ? "border-blue-400/40 bg-blue-400/10"
    : "border-orange-400/40 bg-orange-400/10";
  const nameCls = color === "A" ? "text-blue-300" : "text-orange-300";
  return (
    <div className={`rounded-xl border-2 p-3 text-center ${cls}`}>
      <div className={`text-base font-bold ${nameCls}`}>{name}</div>
      <div className="mt-2 flex flex-wrap justify-center gap-1 text-lg">
        {cookies.map((c, i) => <span key={i}>{c}</span>)}
      </div>
      <div className="mt-2 text-xs text-slate-400">{statText}</div>
    </div>
  );
}

// ============================================================
// 탭 2 — 🧪 진단 키트
// ============================================================

type Diag2x2 = { tp: number; fn: number; fp: number; tn: number; inf: number; cln: number; tpos: number; tneg: number; N: number };
function diag2x2(N: number, rate: number, sens: number, spec: number): Diag2x2 {
  const inf = Math.round(N * rate);
  const cln = N - inf;
  const tp = Math.round(inf * sens);
  const fn = inf - tp;
  const tn = Math.round(cln * spec);
  const fp = cln - tn;
  return { tp, fn, fp, tn, inf, cln, tpos: tp + fp, tneg: fn + tn, N };
}

const DISEASES: { name: string; period: string; rate: string; sv: number }[] = [
  { name: "결핵 (TB)",            period: "매년",              rate: "0.04%",   sv: 1 },
  { name: "홍역 (Measles)",       period: "2019년",            rate: "0.001%",  sv: 1 },
  { name: "메르스 (MERS)",        period: "2015년 5~7월",      rate: "0.001%",  sv: 1 },
  { name: "수두 (Varicella)",     period: "매년 봄·가을",      rate: "0.16%",   sv: 2 },
  { name: "백일해 (Pertussis)",   period: "매년 봄",           rate: "0.05%",   sv: 1 },
  { name: "계절 독감 (Influenza)", period: "매년 12~2월",       rate: "0.5~2%",  sv: 10 },
  { name: "신종플루 (H1N1)",      period: "2009~2010년",       rate: "~1.5%",   sv: 15 },
  { name: "코로나19 초기",        period: "2020년",            rate: "~0.1%",   sv: 1 },
  { name: "코로나19 델타",        period: "2021년 하반기",     rate: "0.3~0.5%", sv: 4 },
  { name: "코로나19 오미크론",    period: "2022년 3월",        rate: "3~5%",    sv: 35 },
];

function DiagnosticTab() {
  const [slRate, setSlRate] = useState(5);   // 1~50 (단위 0.1%) → 0.5%
  const [slSens, setSlSens] = useState(95);
  const [slSpec, setSlSpec] = useState(99);

  const rate = slRate / 1000;
  const sens = slSens / 100;
  const spec = slSpec / 100;
  const N = 100000;
  const t = useMemo(() => diag2x2(N, rate, sens, spec), [N, rate, sens, spec]);

  const pA = t.inf / N;
  const pB = t.tpos / N;
  const pAgivenB = t.tpos > 0 ? t.tp / t.tpos : 0;
  const pBgivenA = sens;
  const bayesCheck = pB > 0 ? (pBgivenA * pA) / pB : 0;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-teal-400/35 bg-gradient-to-r from-teal-500/15 to-cyan-500/10 p-4 text-center">
        <h4 className="text-lg font-bold text-teal-300">🧪 진단 키트 결과 속 조건부확률</h4>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          교과서 62p 문제 — 슬라이더를 조절해 감염률과 검사 정확도가 결과에 어떤 영향을 주는지 탐구해 봐요!
        </p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-teal-300">⚙️ 매개변수 설정 (기준 : 100,000명 검사)</h5>
        <div className="mt-2 rounded-md bg-black/25 p-3 text-xs leading-7 text-slate-400">
          <b className="text-slate-200">문제 상황</b> : 일반인 1000명 중 5명꼴로 감염되는 바이러스의 진단 키트.
          <br />
          이 키트는 <b className="text-slate-200">감염자를 양성</b>으로 판정할 확률 <b className="text-slate-200">0.95</b>,{" "}
          <b className="text-slate-200">비감염자를 음성</b>으로 판정할 확률 <b className="text-slate-200">0.99</b>.
        </div>
        <div className="mt-3 space-y-2.5">
          <Slider id="dt-rate" label="감염률" valueText={`${(rate * 100).toFixed(1)}%`} min={1} max={50} value={slRate} onChange={setSlRate} accent="teal" />
          <Slider id="dt-sens" label="민감도 P(양성|감염)" valueText={`${slSens}%`} min={50} max={99} value={slSens} onChange={setSlSens} accent="teal" />
          <Slider id="dt-spec" label="특이도 P(음성|비감염)" valueText={`${slSpec}%`} min={50} max={99} value={slSpec} onChange={setSlSpec} accent="teal" />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-teal-300">📋 분할표 (100,000명 기준)</h5>
        <div className="mt-2 overflow-x-auto">
          <DiagTable
            headerTone="teal"
            rowLabelInf="감염자" rowLabelCln="비감염자"
            tp={t.tp} fn={t.fn} inf={t.inf}
            fp={t.fp} tn={t.tn} cln={t.cln}
            tpos={t.tpos} tneg={t.tneg} N={N}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          * 하이라이트(노란색) = 감염자이면서 양성 판정 / 빨간색 강조 = 전체 양성 판정자
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-teal-300">📊 조건부확률 계산 결과</h5>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <CalcCard label="P(A) = P(감염)" value={fmtP(pA, 2)} tone="blue" />
          <CalcCard label="P(B) = P(양성 판정)" value={fmtP(pB, 2)} tone="orange" />
          <CalcCard label="P(A|B) = P(감염|양성)" value={fmtP(pAgivenB, 2)} tone="violet" highlight />
          <CalcCard label="P(B|A) = P(양성|감염) = 민감도" value={fmtP(pBgivenA, 2)} tone="red" highlight />
        </div>
        {pAgivenB < 0.5 ? (
          <div className="mt-3 rounded-lg border border-red-400/35 bg-red-400/10 p-3 text-xs leading-6 text-red-200">
            ⚠️ <strong>놀라운 결과!</strong> 양성 판정을 받아도 실제로 감염됐을 확률이 <b>{fmtP(pAgivenB, 2)}</b> 밖에 안 돼요!
            <br />
            이유 : 감염률({fmtP(pA, 2)})이 낮아 비감염자가 훨씬 많고, 그 중 일부({fmt(t.fp)}명)가 양성으로 잘못 판정돼요.
            <br />
            💡 감염률 슬라이더를 높이면 P(감염|양성)도 높아지는지 확인해 봐요!
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.07] p-3 text-xs leading-6 text-emerald-200">
            ✅ 양성 판정 시 실제 감염 확률 {fmtP(pAgivenB, 2)}. 감염률이 충분히 높으면 검사 결과를 더 신뢰할 수 있어요!
            <br />
            💡 감염률 슬라이더를 다시 낮춰보면 어떻게 달라지나요?
          </div>
        )}
        <div className="mt-2 text-[11px] text-slate-500">
          베이즈 정리 검증 : P(A|B) = P(B|A)×P(A) / P(B) = {fmtP(pBgivenA, 2)}×{fmtP(pA, 2)} / {fmtP(pB, 2)} = {fmtP(bayesCheck, 2)}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-sky-300">📋 국내 주요 감염병 감염률 참고표</h5>
        <p className="mt-1 text-xs text-slate-400">항목을 클릭하면 감염률 슬라이더에 자동 적용됩니다.</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border-b border-white/10 bg-sky-400/15 px-2 py-1.5 text-left font-semibold text-sky-300">감염병</th>
                <th className="border-b border-white/10 bg-sky-400/15 px-2 py-1.5 text-center font-semibold text-sky-300">유행 시기</th>
                <th className="border-b border-white/10 bg-sky-400/15 px-2 py-1.5 text-right font-semibold text-sky-300">감염률 (추정)</th>
                <th className="border-b border-white/10 bg-sky-400/15 px-2 py-1.5 text-right font-semibold text-sky-300">적용값</th>
              </tr>
            </thead>
            <tbody>
              {DISEASES.map((d, i) => (
                <tr
                  key={i}
                  onClick={() => setSlRate(d.sv)}
                  className={`cursor-pointer transition ${i % 2 === 1 ? "bg-white/[0.02]" : ""} hover:bg-sky-400/15`}
                >
                  <td className="border-b border-white/5 px-2 py-1.5 text-slate-200">{d.name}</td>
                  <td className="border-b border-white/5 px-2 py-1.5 text-center text-slate-400">{d.period}</td>
                  <td className="border-b border-white/5 px-2 py-1.5 text-right text-amber-300">{d.rate}</td>
                  <td className="border-b border-white/5 px-2 py-1.5 text-right text-emerald-300">{(d.sv / 10).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DiagTable({
  headerTone, rowLabelInf, rowLabelCln,
  tp, fn, inf, fp, tn, cln, tpos, tneg, N,
}: {
  headerTone: "teal" | "orange";
  rowLabelInf: string; rowLabelCln: string;
  tp: number; fn: number; inf: number;
  fp: number; tn: number; cln: number;
  tpos: number; tneg: number; N: number;
}) {
  const thBg = headerTone === "teal" ? "bg-teal-400/15 text-teal-300" : "bg-orange-400/15 text-orange-300";
  const cell = "border border-white/12 px-2 py-1.5 text-center text-sm";
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className={`border border-white/12 px-2 py-1.5 text-xs font-semibold ${thBg}`}>구분</th>
          <th className={`border border-white/12 px-2 py-1.5 text-xs font-semibold ${thBg}`}>양성 판정</th>
          <th className={`border border-white/12 px-2 py-1.5 text-xs font-semibold ${thBg}`}>음성 판정</th>
          <th className={`border border-white/12 px-2 py-1.5 text-xs font-semibold ${thBg}`}>합계</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className={`${cell} font-bold text-slate-400`}>{rowLabelInf}</td>
          <td className={`${cell} bg-amber-400/15 font-bold text-amber-300`}>{fmt(tp)}</td>
          <td className={cell}>{fmt(fn)}</td>
          <td className={`${cell} bg-white/[0.05] font-bold`}>{fmt(inf)}</td>
        </tr>
        <tr>
          <td className={`${cell} font-bold text-slate-400`}>{rowLabelCln}</td>
          <td className={cell}>{fmt(fp)}</td>
          <td className={cell}>{fmt(tn)}</td>
          <td className={`${cell} bg-white/[0.05] font-bold`}>{fmt(cln)}</td>
        </tr>
        <tr>
          <td className={`${cell} font-bold text-slate-100`}>합계</td>
          <td className={`${cell} bg-red-400/15 font-bold text-red-200`}>{fmt(tpos)}</td>
          <td className={`${cell} bg-white/[0.05] font-bold`}>{fmt(tneg)}</td>
          <td className={`${cell} bg-white/[0.05] font-bold`}>{fmt(N)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function CalcCard({
  label, value, tone, highlight,
}: { label: string; value: string; tone: "blue" | "orange" | "violet" | "red"; highlight?: boolean }) {
  const valTone =
    tone === "blue" ? "text-blue-300"
    : tone === "orange" ? "text-orange-300"
    : tone === "violet" ? "text-violet-300"
    : "text-red-300";
  const border =
    tone === "blue" ? "border-blue-400/30 bg-blue-400/[0.06]"
    : tone === "orange" ? "border-orange-400/30 bg-orange-400/[0.06]"
    : tone === "violet" ? "border-violet-400/30 bg-violet-400/[0.06]"
    : "border-red-400/40 bg-red-400/[0.08]";
  return (
    <div className={`rounded-lg border ${highlight ? "border-2" : ""} p-3 text-center ${border}`}>
      <div className="font-mono text-[11px] text-slate-400">{label}</div>
      <div className={`mt-0.5 font-mono ${highlight ? "text-xl" : "text-lg"} font-bold ${valTone}`}>{value}</div>
    </div>
  );
}

// ============================================================
// 탭 3 — 📧 스팸 필터 (나이브 베이즈)
// ============================================================

type Keyword = { w: string; e: string; ps: number; ph: number };
const KWS: Keyword[] = [
  { w: "무료",   e: "free",     ps: 0.80, ph: 0.05 },
  { w: "당첨",   e: "winner",   ps: 0.70, ph: 0.02 },
  { w: "긴급",   e: "urgent",   ps: 0.60, ph: 0.10 },
  { w: "광고",   e: "ad",       ps: 0.65, ph: 0.15 },
  { w: "할인",   e: "discount", ps: 0.50, ph: 0.25 },
  { w: "이벤트", e: "event",    ps: 0.55, ph: 0.20 },
  { w: "회의",   e: "meeting",  ps: 0.05, ph: 0.40 },
  { w: "숙제",   e: "homework", ps: 0.01, ph: 0.35 },
  { w: "성적",   e: "grade",    ps: 0.02, ph: 0.30 },
  { w: "친구",   e: "friend",   ps: 0.03, ph: 0.45 },
];
const PRIOR_SPAM = 0.40;

function SpamTab() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  function toggle(i: number) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  const selectedIdxs = Object.entries(checked).filter(([, v]) => v).map(([k]) => Number(k));
  const selected = selectedIdxs.map((i) => KWS[i]);

  // 나이브 베이즈 (로그 우도)
  const { pSpam } = useMemo(() => {
    let lS = Math.log(PRIOR_SPAM);
    let lH = Math.log(1 - PRIOR_SPAM);
    selected.forEach((k) => {
      lS += Math.log(k.ps);
      lH += Math.log(k.ph);
    });
    const maxL = Math.max(lS, lH);
    const eS = Math.exp(lS - maxL);
    const eH = Math.exp(lH - maxL);
    return { pSpam: eS / (eS + eH) };
  }, [selected]);

  const pct = (pSpam * 100).toFixed(1);
  const meterColor = pSpam > 0.8 ? "#ef4444" : pSpam > 0.5 ? "#f59e0b" : "#34d399";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-indigo-500/10 p-4 text-center">
        <h4 className="text-lg font-bold text-violet-300">📧 스팸 필터와 베이즈 정리</h4>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          이메일의 단어들을 분석해 스팸 여부를 판단해 봐요!
          <br />
          단어를 클릭해 이메일에 포함됐는지 체크하면 스팸 확률이 업데이트됩니다.
        </p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-violet-300">⚙️ 설정 — 나이브 베이즈 스팸 필터</h5>
        <div className="mt-2 rounded-md bg-black/25 p-3 text-xs leading-7 text-slate-400">
          <b className="text-slate-200">상황</b> : 받은 이메일 중 평균 <b className="text-slate-200">40%가 스팸</b>이에요.
          <br />
          아래 단어들이 스팸 메일과 정상 메일에 얼마나 자주 나타나는지 통계가 있어요.
          <br />
          이 이메일에 포함된 단어를 체크하면, 스팸일 확률이 계산됩니다!
        </div>
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {KWS.map((k, i) => {
            const isChecked = !!checked[i];
            const isSpam = k.ps > k.ph;
            const cls = !isChecked
              ? "border-white/12 bg-white/[0.04] hover:border-white/25 hover:bg-white/10"
              : isSpam
              ? "border-red-400/55 bg-red-400/15"
              : "border-emerald-400/45 bg-emerald-400/[0.10]";
            const spamW = Math.round(k.ps * 100);
            const hamW = Math.round(k.ph * 100);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={`rounded-lg border-2 p-2.5 text-left transition ${cls}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border-2 text-[10px] font-bold text-white ${
                      isChecked
                        ? isSpam ? "border-red-500 bg-red-500" : "border-emerald-500 bg-emerald-500"
                        : "border-white/30"
                    }`}
                  >
                    {isChecked ? "✓" : ""}
                  </span>
                  <span className="text-sm font-bold text-slate-100">{k.w}</span>
                  <span className="text-[10px] text-slate-500">({k.e})</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {isSpam ? "🚨 스팸에 자주 등장" : "✅ 정상 메일에 자주 등장"}
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1.5">
                  <div>
                    <div className="text-[9px] text-red-300">스팸 {spamW}%</div>
                    <StackBarSVG heightClass="h-[6px]" segments={[{ value: spamW, fill: "#ef4444" }]} />
                  </div>
                  <div>
                    <div className="text-[9px] text-emerald-300">정상 {hamW}%</div>
                    <StackBarSVG heightClass="h-[6px]" segments={[{ value: hamW, fill: "#34d399" }]} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">👆 단어 카드를 클릭해서 이메일에 포함된 단어를 선택하세요.</p>
      </section>

      <section className="rounded-xl border border-violet-400/35 bg-violet-400/[0.07] p-4">
        <h5 className="text-sm font-bold text-violet-300">📊 스팸 확률 미터</h5>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
          <span>스팸 확률</span>
          <span className="font-mono text-lg font-bold text-slate-100">{pct}%</span>
        </div>
        <StackBarSVG
          heightClass="h-[22px]"
          segments={[{ value: pSpam * 100, fill: meterColor }]}
        />
        <div
          className={`mt-3 rounded-lg border-2 px-3 py-2.5 text-center text-sm font-bold ${
            selected.length === 0
              ? "border-white/12 bg-white/[0.04] text-slate-400"
              : pSpam > 0.8
              ? "border-red-400/55 bg-red-400/20 text-red-200"
              : pSpam > 0.5
              ? "border-amber-400/55 bg-amber-400/20 text-amber-200"
              : "border-emerald-400/45 bg-emerald-400/[0.15] text-emerald-200"
          }`}
        >
          {selected.length === 0 ? "단어를 선택해 봐요!"
            : pSpam > 0.8 ? `🚨 스팸 의심! (${pct}%)`
            : pSpam > 0.5 ? `⚠️ 스팸 가능성 있음 (${pct}%)`
            : `✅ 정상 메일 가능성 높음 (${pct}%)`}
        </div>

        <div className="mt-3 rounded-lg border border-violet-400/20 bg-black/30 p-3 font-mono text-[11px] leading-6 text-violet-200">
          P(스팸) = {PRIOR_SPAM.toFixed(2)} (사전확률)
          {selected.length === 0 ? <><br />선택된 단어 없음 → 사전확률 그대로</> : null}
          {selected.map((k, i) => (
            <div key={i}>
              P(&apos;{k.w}&apos;|스팸) = {k.ps.toFixed(2)}, P(&apos;{k.w}&apos;|정상) = {k.ph.toFixed(2)}
            </div>
          ))}
          {selected.length > 0 ? (
            <>
              → 나이브 베이즈 계산
              <br />
              사후확률 P(스팸|단어들) ≈ <b className="text-emerald-300">{pct}%</b>
            </>
          ) : null}
        </div>

        {selected.length > 0 ? (
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.07] p-3 text-xs leading-6 text-emerald-200">
            {pSpam > 0.8
              ? "🚨 선택한 단어들이 스팸에서 많이 나타나는 패턴이에요! 스팸 필터가 이 메일을 해당으로 분류할 거예요."
              : pSpam > 0.5
              ? "⚠️ 스팸 단어도 있지만 정상 메일에도 나타날 수 있는 단어도 함께 있어요. 추가 단서가 필요해요."
              : "✅ 정상 메일에 자주 나타나는 단어들이에요! 스팸 필터가 이 메일을 통과시킬 거예요."}
            <br />
            <br />
            💡 단어를 하나씩 체크하면서 확률이 어떻게 바뀌는지 확인해 보세요! (나이브 베이즈 필터는 각 단어가 <b>독립적으로</b> 스팸 여부에 영향을 준다고 가정해요.)
          </div>
        ) : null}
      </section>
    </div>
  );
}

// ============================================================
// 탭 4 — 🏃 도핑 검사
// ============================================================

function DopingTab() {
  const [slDop, setSlDop] = useState(20);   // 1~100 (단위 0.1%) → 2.0%
  const [slSens, setSlSens] = useState(99); // 70~99
  const [slSpec, setSlSpec] = useState(95);

  const dopRate = slDop / 1000;
  const sens = slSens / 100;
  const spec = slSpec / 100;
  const N = 1000;
  const t = useMemo(() => diag2x2(N, dopRate, sens, spec), [N, dopRate, sens, spec]);
  const pDgivenPos = t.tpos > 0 ? t.tp / t.tpos : 0;

  // 사람 점 시각화 (200개 비례)
  const showDots = 200;
  const scale = showDots / N;
  const dotsTp = Math.round(t.tp * scale);
  const dotsFp = Math.round(t.fp * scale);
  const dotsFn = Math.round(t.fn * scale);
  const dotsTn = showDots - dotsTp - dotsFp - dotsFn;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-orange-400/35 bg-gradient-to-r from-orange-500/15 to-red-500/10 p-4 text-center">
        <h4 className="text-lg font-bold text-orange-300">🏃 스포츠 도핑 검사와 베이즈 정리</h4>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          양성 판정을 받은 선수가 실제로 도핑을 했을 확률은 얼마일까요?
          <br />
          진단 키트 문제와 비교하며 베이즈 정리의 핵심 원리를 탐구해 봐요!
        </p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-orange-300">⚙️ 도핑 검사 설정 (기준 : 1,000명 선수)</h5>
        <div className="mt-2 rounded-md bg-black/25 p-3 text-xs leading-7 text-slate-400">
          <b className="text-slate-200">상황</b> : 국제 스포츠 대회에 1,000명의 선수가 참가했어요.
          이 중 일부가 금지 약물을 복용했을 수 있어요.
          <br />
          도핑 검사는 매우 정확하지만 완벽하지는 않아요. 양성 판정을 받은 선수가 정말로 도핑을 했을 확률은 얼마일까요?
        </div>
        <div className="mt-3 space-y-2.5">
          <Slider id="dp-dop" label="도핑 비율" valueText={`${(dopRate * 100).toFixed(1)}%`} min={1} max={100} value={slDop} onChange={setSlDop} accent="rose" />
          <Slider id="dp-sens" label="민감도 P(양성|도핑)" valueText={`${slSens}%`} min={70} max={99} value={slSens} onChange={setSlSens} accent="rose" />
          <Slider id="dp-spec" label="특이도 P(음성|클린)" valueText={`${slSpec}%`} min={70} max={99} value={slSpec} onChange={setSlSpec} accent="rose" />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-orange-300">👥 1,000명 선수 시각화 (점 200개 비례 표시)</h5>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          <LegendChip kind="tp">도핑 + 양성 (TP)</LegendChip>
          <LegendChip kind="fp">클린 + 양성 (FP)</LegendChip>
          <LegendChip kind="fn">도핑 + 음성 (FN)</LegendChip>
          <LegendChip kind="tn">클린 + 음성 (TN)</LegendChip>
        </div>
        <div className="mt-2 flex flex-wrap gap-1 rounded-md bg-black/25 p-2">
          {Array.from({ length: dotsTp }).map((_, i) => <Dot key={`tp-${i}`} kind="tp" />)}
          {Array.from({ length: dotsFp }).map((_, i) => <Dot key={`fp-${i}`} kind="fp" />)}
          {Array.from({ length: dotsFn }).map((_, i) => <Dot key={`fn-${i}`} kind="fn" />)}
          {Array.from({ length: dotsTn }).map((_, i) => <Dot key={`tn-${i}`} kind="tn" />)}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-orange-300">📋 분할표 (1,000명 기준)</h5>
        <div className="mt-2 overflow-x-auto">
          <DiagTable
            headerTone="orange"
            rowLabelInf="도핑 선수" rowLabelCln="클린 선수"
            tp={t.tp} fn={t.fn} inf={t.inf}
            fp={t.fp} tn={t.tn} cln={t.cln}
            tpos={t.tpos} tneg={t.tneg} N={N}
          />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-orange-300">🎯 핵심 결과: P(도핑 | 양성 판정) = ?</h5>
        <div
          className={`mt-2 rounded-xl border-2 p-4 text-center transition ${
            pDgivenPos < 0.5
              ? "border-red-400/40 bg-red-400/15"
              : "border-emerald-400/40 bg-emerald-400/[0.10]"
          }`}
        >
          <div className={`font-mono text-3xl font-bold ${pDgivenPos < 0.5 ? "text-red-300" : "text-emerald-300"}`}>
            {fmtP(pDgivenPos, 1)}
          </div>
          <div className="mt-1 text-xs text-slate-400">양성 판정을 받은 선수가 실제로 도핑했을 확률</div>
        </div>

        {pDgivenPos < 0.3 ? (
          <div className="mt-3 rounded-lg border border-red-400/35 bg-red-400/10 p-3 text-xs leading-6 text-red-200">
            ⚠️ <strong>충격적인 결과!</strong> 양성 판정을 받은 {fmt(t.tpos)}명 중 실제 도핑 선수는 {fmt(t.tp)}명({fmtP(pDgivenPos, 1)})뿐!
            <br />
            나머지 {fmt(t.fp)}명은 클린한데도 양성으로 잘못 판정된 선수예요 (거짓 양성).
            <br />
            💡 도핑 비율 슬라이더를 올려 보세요! 기저 확률이 높아질수록 결과가 어떻게 달라지나요?
          </div>
        ) : pDgivenPos < 0.7 ? (
          <div className="mt-3 rounded-lg border border-amber-400/35 bg-amber-400/10 p-3 text-xs leading-6 text-amber-200">
            ⚠️ 양성 판정자 중 도핑 확률 {fmtP(pDgivenPos, 1)}. 아직 절반 정도만 실제 도핑 선수예요.
            <br />
            검사 정확도가 높아도 기저 확률(도핑 비율)이 낮으면 거짓 양성이 많이 나와요.
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.07] p-3 text-xs leading-6 text-emerald-200">
            ✅ 도핑 비율이 충분히 높아 양성 판정의 신뢰도가 {fmtP(pDgivenPos, 1)} 로 높아요!
            <br />
            사전확률(도핑 비율)이 결과에 얼마나 큰 영향을 미치는지 보이나요?
          </div>
        )}

        <div className="mt-3 rounded-lg border border-violet-400/25 bg-violet-400/[0.07] p-3 text-xs leading-6 text-violet-200">
          💡 <strong>진단 키트 탭과 비교해 봐요!</strong>
          <br />
          진단 키트(감염률 0.5%, 민감도 95%, 특이도 99%)와 이 도핑 검사를 비교하면, 공통점이 보이나요?
          <strong className="text-violet-100"> 낮은 기저 확률(사전확률)</strong>이 결과에 결정적인 역할을 해요.
        </div>
      </section>
    </div>
  );
}

// 4분류(TP/FP/FN/TN) 범례 칩 — 같은 톤을 Dot 과 공유.
function LegendChip({ kind, children }: { kind: "tp" | "fp" | "fn" | "tn"; children: React.ReactNode }) {
  const dotCls =
    kind === "tp" ? "bg-red-500 border-red-600"
    : kind === "fp" ? "bg-orange-500/70 border-orange-500"
    : kind === "fn" ? "bg-red-900/60 border-red-800"
    : "bg-white/[0.09] border-white/20";
  const txtCls =
    kind === "tp" ? "text-red-200"
    : kind === "fp" ? "text-orange-200"
    : kind === "fn" ? "text-red-200"
    : "text-slate-400";
  return (
    <span className={`flex items-center gap-1 ${txtCls}`}>
      <span className={`inline-block h-3 w-3 rounded-sm border ${dotCls}`} />
      {children}
    </span>
  );
}

function Dot({ kind }: { kind: "tp" | "fp" | "fn" | "tn" }) {
  const cls =
    kind === "tp" ? "bg-red-500 border-red-600"
    : kind === "fp" ? "bg-orange-500/70 border-orange-500"
    : kind === "fn" ? "bg-red-900/60 border-red-800"
    : "bg-white/[0.09] border-white/15";
  return <span className={`inline-block h-3.5 w-3.5 rounded-sm border-2 ${cls}`} />;
}

// ============================================================
// 탭 5 — 🔄 반복 검사의 신뢰도
// ============================================================

type Round = { nInf: number; nNotInf: number; nTotal: number; tp: number; fn: number; fp: number; tn: number; totalPos: number; pInfPos: number };

function calcRound(nInf: number, nNotInf: number, sens: number, spec: number): Round {
  const tp = nInf * sens;
  const fn = nInf * (1 - sens);
  const fp = nNotInf * (1 - spec);
  const tn = nNotInf * spec;
  const totalPos = tp + fp;
  return {
    nInf, nNotInf, nTotal: nInf + nNotInf,
    tp, fn, fp, tn, totalPos,
    pInfPos: totalPos > 0 ? tp / totalPos : 0,
  };
}

function fmtRound(n: number): string {
  if (n < 0.1) return n.toFixed(2);
  if (n < 10) return n.toFixed(1);
  return Math.round(n).toLocaleString();
}

function probColor(p: number): string {
  if (p < 0.3) return "#ef4444";
  if (p < 0.6) return "#f59e0b";
  if (p < 0.85) return "#22c55e";
  return "#10b981";
}

// probColor 와 동일 단계의 Tailwind text 클래스 (HTML 라벨용; SVG는 fill 어트리뷰트로 직접).
function probColorClass(p: number): string {
  if (p < 0.3) return "text-red-500";
  if (p < 0.6) return "text-amber-500";
  if (p < 0.85) return "text-green-500";
  return "text-emerald-500";
}

function RepeatTab() {
  const [slRate, setSlRate] = useState(10); // 1~50 (단위 0.1%) → 1.0%
  const [slSens, setSlSens] = useState(95);
  const [slSpec, setSlSpec] = useState(95);

  const rate = slRate / 1000;
  const sens = slSens / 100;
  const spec = slSpec / 100;
  const N0 = 10000;

  const { rounds, effR2 } = useMemo(() => {
    const inf0 = N0 * rate;
    const notInf0 = N0 * (1 - rate);
    const r1 = calcRound(inf0, notInf0, sens, spec);
    const r2 = calcRound(r1.tp, r1.fp, sens, spec);
    const r3 = calcRound(r2.tp, r2.fp, sens, spec);
    const effR2v = r1.totalPos > 0 ? r1.tp / r1.totalPos : 0;
    return { rounds: [r1, r2, r3], effR2: effR2v };
  }, [rate, sens, spec]);

  const probs = rounds.map((r) => r.pInfPos);
  const p1 = probs[0], p2 = probs[1], p3 = probs[2];

  let insightText: React.ReactNode;
  if (p3 > 0.9) {
    insightText = (
      <>
        <b className="text-emerald-400">✓ 3차 검사까지 모두 양성이면 실제 감염 확률 {fmtP(p3, 1)}!</b>
        <br />
        1차만 보면 {fmtP(p1, 1)}에 불과했지만, 양성자만 추려서 재검사를 반복하면 실제 감염자가 확연히 걸러집니다.
      </>
    );
  } else if (p3 > 0.5) {
    insightText = (
      <>
        <b className="text-emerald-300">📈 {fmtP(p1, 1)} → {fmtP(p2, 1)} → {fmtP(p3, 1)}</b> — 반복할수록 신뢰도가 올라가요!
        <br />
        2차 검사 대상은 1차 양성자뿐이라, 그 집단의 실효 감염률이 {fmtP(effR2, 1)}로 급상승합니다.
      </>
    );
  } else {
    insightText = (
      <>
        <b className="text-amber-300">⚠ 감염률이 매우 낮거나 검사 성능이 부족하면</b> 3차 반복 후에도 신뢰도가 낮을 수 있어요.
        <br />
        감염률이나 민감도·특이도 슬라이더를 조정해 보세요!
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-indigo-500/10 p-4 text-center">
        <h4 className="text-lg font-bold text-violet-300">🔄 반복 검사의 신뢰도</h4>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          1차 검사 양성자만 골라 2차·3차를 반복하면 왜 결과를 점점 더 신뢰할 수 있게 될까요?
        </p>
        <p className="mt-1 text-xs text-amber-300">💡 핵심 : 양성 판정자 집단의 &lsquo;실효 감염률&rsquo;이 매 검사마다 높아집니다.</p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-violet-300">⚙ 검사 조건 설정</h5>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Slider id="rt-rate" label="감염률" valueText={`${(rate * 100).toFixed(1)}%`} min={1} max={50} value={slRate} onChange={setSlRate} accent="violet" />
          <Slider id="rt-sens" label="민감도(진양성률)" valueText={`${slSens}%`} min={50} max={100} value={slSens} onChange={setSlSens} accent="violet" />
          <Slider id="rt-spec" label="특이도(진음성률)" valueText={`${slSpec}%`} min={50} max={100} value={slSpec} onChange={setSlSpec} accent="violet" />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">👥 시작 인원 : <b className="text-sky-300">10,000명</b> 기준으로 계산합니다.</p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-violet-300">📋 반복 검사 시뮬레이션</h5>
        <div className="mt-2 space-y-2">
          {rounds.map((r, i) => (
            <div key={i}>
              {i > 0 ? (
                <div className="py-1 text-center text-xs text-slate-500">
                  ↓ 양성 판정자 {fmtRound(rounds[i - 1].totalPos)}명만 {i + 1}차 재검사
                </div>
              ) : null}
              <RoundCard r={r} idx={i} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-violet-300">📊 검사 횟수별 신뢰도 비교</h5>
        <div className="mt-3 flex h-[140px] items-end gap-3 px-1">
          {probs.map((p, i) => {
            const lbl = i === 0 ? "1차 양성" : i === 1 ? "1·2차 양성" : "1·2·3차 양성";
            const color = probColor(p);
            const hPx = Math.max(p * 110, 3);
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <svg viewBox="0 0 100 110" preserveAspectRatio="none" className="block h-[110px] w-full" aria-hidden="true">
                    <rect x={0} y={110 - hPx} width={100} height={hPx} fill={color} className="transition-all duration-500" />
                  </svg>
                </div>
                <div className={`text-sm font-bold ${probColorClass(p)}`}>{fmtP(p, 1)}</div>
                <div className="text-[10px] text-slate-400">{lbl}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-lg bg-black/25 p-3 text-xs leading-7 text-slate-300">
          {insightText}
          <br />
          <span className="text-[11px] text-slate-500">
            핵심 원리 : 반복 검사를 거칠수록 한 집단의 위양성자(비감염자)가 계속 걸러집니다. 결국, 남아 있는 양성자 집단이 더 신뢰할 만해집니다.
          </span>
        </div>
      </section>
    </div>
  );
}

function RoundCard({ r, idx }: { r: Round; idx: number }) {
  const titles = ["1차 검사", "2차 검사", "3차 검사"];
  const condLabels = [
    "P(감염 | 1차 양성)",
    "P(감염 | 1·2차 양성)",
    "P(감염 | 1·2·3차 양성)",
  ];
  const borderTone =
    idx === 0 ? "border-l-[3px] border-l-indigo-500 bg-indigo-500/[0.06]"
    : idx === 1 ? "border-l-[3px] border-l-violet-500 bg-violet-500/[0.06]"
    : "border-l-[3px] border-l-fuchsia-500 bg-fuchsia-500/[0.06]";
  const titleTone =
    idx === 0 ? "text-indigo-300" : idx === 1 ? "text-violet-300" : "text-fuchsia-300";
  const effRate = r.nTotal > 0 ? r.nInf / r.nTotal : 0;
  const posTPpct = r.totalPos > 0 ? (r.tp / r.totalPos) * 100 : 0;
  const compInfPct = r.nTotal > 0 ? (r.nInf / r.nTotal) * 100 : 0;
  const pc = probColor(r.pInfPos);

  return (
    <div className={`rounded-xl p-3 ${borderTone}`}>
      <div className="flex items-start justify-between">
        <span className={`text-sm font-bold ${titleTone}`}>{titles[idx]}</span>
        <span className="text-right text-[11px] text-slate-400 leading-5">
          {idx === 0 ? "초기 감염률" : "실효 감염률"}: <b className="text-amber-300">{fmtP(effRate, 1)}</b>{idx > 0 ? " ↑↑" : ""}
          <br />
          대상 {fmtRound(r.nTotal)}명
        </span>
      </div>

      <div className="mt-2 grid grid-cols-[64px_1fr_130px] items-center gap-2">
        <span className="text-[10px] text-slate-400 leading-4">구성<br />(감염/비감염)</span>
        <StackBarSVG
          heightClass="h-[18px]"
          segments={[
            { value: compInfPct, fill: "#10b981" },
            { value: 100 - compInfPct, fill: "#334155" },
          ]}
        />
        <span className="text-[10px] leading-4 text-emerald-300">
          ■ 감염 {fmtRound(r.nInf)}명<br />
          <span className="text-slate-500">■ 비감염 {fmtRound(r.nNotInf)}명</span>
        </span>
      </div>

      <div className="mt-1.5 grid grid-cols-[64px_1fr_130px] items-center gap-2">
        <span className="text-[10px] text-slate-400 leading-4">
          양성 판정<br />{fmtRound(r.totalPos)}명
        </span>
        <StackBarSVG
          heightClass="h-[18px]"
          segments={[
            { value: posTPpct, fill: "#22c55e" },
            { value: 100 - posTPpct, fill: "#ef4444" },
          ]}
        />
        <span className="text-[10px] leading-4 text-emerald-300">
          ■ 진양성 {fmtRound(r.tp)}명<br />
          <span className="text-red-300">■ 위양성 {fmtRound(r.fp)}명</span>
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3 rounded-lg bg-black/30 px-3 py-2">
        <div className="flex-1 text-[11px] leading-5 text-slate-400">
          {condLabels[idx]}<br />
          <b className="text-slate-100">= {fmtRound(r.tp)} / {fmtRound(r.totalPos)}</b>
        </div>
        <div className="h-[8px] w-[70px] overflow-hidden rounded-full bg-white/10">
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
            <rect x={0} y={0} width={Math.min(r.pInfPos * 100, 100)} height={8} fill={pc} className="transition-all duration-500" />
          </svg>
        </div>
        <div className={`min-w-[60px] text-right text-lg font-bold ${probColorClass(r.pInfPos)}`}>
          {fmtP(r.pInfPos, 1)}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 메인
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "prior_posterior",
    kind: "text",
    prompt: "쿠키 상자 활동에서 ‘사전확률’과 ‘사후확률’이 무엇인지 자신의 말로 설명해 보세요. 새로운 단서(증거)가 확률을 어떻게 바꿨나요?",
    placeholder: "상자를 뽑기 전에는 A일 확률이 50%였는데, 딸기 쿠키가 나오자...",
  },
  {
    id: "diag_surprise",
    kind: "text",
    prompt: "진단 키트의 정확도가 95%~99%인데도 양성 판정자 중 실제 감염 확률이 낮을 수 있습니다. 왜 이런 일이 생기는지 설명해 보세요.",
    placeholder: "감염률 자체가 낮으면 비감염자가 훨씬 많기 때문에...",
  },
  {
    id: "common_principle",
    kind: "text",
    prompt: "진단키트·스팸필터·도핑검사에서 공통으로 나타나는 베이즈 정리의 원리를 정리해 보세요.",
    placeholder: "세 가지 모두 검사 전 확률(사전확률)에 검사 결과(가능도)를 반영해서...",
  },
  {
    id: "daily_example",
    kind: "text",
    prompt: "베이즈 정리가 활용될 수 있는 다른 실생활 사례를 하나 떠올리고, 사전확률·새로운 증거·사후확률에 해당하는 것이 무엇인지 적어 보세요.",
    placeholder: "예) 친구가 거짓말을 하는지 판단할 때 — 사전확률은 평소 거짓말 빈도...",
  },
];

type TabKey = "cookie" | "diag" | "spam" | "doping" | "repeat";

export default function BayesTheoremMini() {
  const [tab, setTab] = useState<TabKey>("cookie");
  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`@keyframes fadein {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 조건부확률</p>
        <h3 className="mt-2 text-2xl font-bold">🔮 베이즈 정리 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          쿠키 상자 · 진단 키트 · 스팸 필터 · 도핑 검사 · 반복 검사 다섯 가지 상황으로 베이즈 정리의 핵심 —{" "}
          <b className="text-amber-200">&ldquo;새로운 증거로 확률을 합리적으로 업데이트하기&rdquo;</b>를 탐구해 봐요!
        </p>
        <div className="mt-3 inline-block rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-200">
          P(A|B) = P(B|A) × P(A) / P(B)
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "cookie", "bg-amber-300")} onClick={() => setTab("cookie")}>🍪 쿠키 상자</button>
        <button type="button" className={tabBtn(tab === "diag", "bg-teal-300")} onClick={() => setTab("diag")}>🧪 진단 키트</button>
        <button type="button" className={tabBtn(tab === "spam", "bg-violet-300")} onClick={() => setTab("spam")}>📧 스팸 필터</button>
        <button type="button" className={tabBtn(tab === "doping", "bg-orange-300")} onClick={() => setTab("doping")}>🏃 도핑 검사</button>
        <button type="button" className={tabBtn(tab === "repeat", "bg-fuchsia-300")} onClick={() => setTab("repeat")}>🔄 반복 검사</button>
      </div>

      <div className="mt-5">
        {tab === "cookie" ? <CookieTab /> :
         tab === "diag"   ? <DiagnosticTab /> :
         tab === "spam"   ? <SpamTab /> :
         tab === "doping" ? <DopingTab /> :
                            <RepeatTab />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
