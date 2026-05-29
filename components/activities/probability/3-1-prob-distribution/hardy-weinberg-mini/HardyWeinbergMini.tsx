"use client";

import { useId, useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 헬퍼 ─────────────────────────────────────────────────
function fmt2(x: number) {
  return (Math.round(x * 100) / 100).toFixed(2);
}
function fmt3(x: number) {
  return (Math.round(x * 1000) / 1000).toFixed(3);
}

// 시드 기반 셔플이 필요하면 추후 교체. 여기선 한 번 계산 후 캐시.
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "ratio_from_binomial",
    prompt:
      "R 유전자 빈도가 p일 때 RR, RW, WW의 비율(p², 2pq, q²)이 이항분포 (p+q)² 의 전개와 어떻게 연결되는지 설명해 보세요.",
    kind: "text",
    placeholder: "예: (p+q)² = p² + 2pq + q². 한 자손이 두 부모로부터 받는 두 대립유전자의 조합을 베르누이 시행 2회로 보면, R이 0개·1개·2개 나올 확률이 곧 WW·RW·RR의 비율과 같다.",
  },
  {
    id: "freq_preserved_and_break",
    prompt:
      "다음 세대에서 R 빈도가 여전히 p가 되는 과정을 식으로 설명하고, 하디-바인베르크 법칙이 성립하지 않는 조건을 1~2개 들어 보세요.",
    kind: "text",
    placeholder: "예: P(R) = p²·1 + 2pq·(1/2) + q²·0 = p²+pq = p(p+q) = p. 자연선택·돌연변이·소규모 집단의 유전적 부동·짝짓기 비무작위·이주가 있으면 법칙이 깨진다.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
export default function HardyWeinbergMini() {
  const [pPct, setPPct] = useState(60);
  const p = pPct / 100;
  const q = 1 - p;

  const rr = p * p, rw = 2 * p * q, ww = q * q;
  const pq = p * q;

  // 다음 세대 R, W (이론상 p, q)
  const nextR = rr + pq; // = p(p+q) = p
  const nextW = ww + pq; // = q(p+q) = q

  // 꽃밭 — p가 바뀔 때만 다시 생성(useMemo).
  const garden = useMemo(() => {
    const total = 100;
    const rrN = Math.round(p * p * total);
    const rwN = Math.round(2 * p * q * total);
    const wwN = total - rrN - rwN;
    const arr: string[] = [
      ...Array(rrN).fill("🌺"),
      ...Array(rwN).fill("🌸"),
      ...Array(wwN).fill("🌼"),
    ];
    shuffleInPlace(arr);
    return { arr, rrN, rwN, wwN };
  }, [p, q]);

  // 다세대 시뮬레이션 토글
  const [multiGen, setMultiGen] = useState<number[] | null>(null);
  function runMultiGen() {
    const gens: number[] = [];
    let cur = p;
    for (let i = 0; i < 10; i++) {
      gens.push(Number(cur.toFixed(4)));
      const cq = 1 - cur;
      cur = cur * cur + cur * cq; // = p (항상)
    }
    setMultiGen(gens);
  }

  // p 변경 시 다세대 결과 초기화 — 핸들러에서 직접 처리(setState-in-effect 회피)
  function changeP(next: number) {
    setPPct(next);
    setMultiGen(null);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">🌺 하디-바인베르크 법칙 탐구</h3>
        <p className="mt-2 leading-7 text-slate-300">
          분꽃 유전자 빈도는 세대가 바뀌어도 변할까? <b className="text-amber-300">이항분포 (p+q)²</b>로
          유전자형 비율을 구하고, 다음 세대에서 R 빈도가 그대로 유지됨을 직접 확인해 보세요.
        </p>
      </div>

      {/* ① 유전자 카드 */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <GeneCard tone="rr" emoji="🌺" type="RR" color="빨간색" formula={`p² = ${fmt3(rr)}`} />
        <GeneCard tone="rw" emoji="🌸" type="RW" color="분홍색" formula={`2pq = ${fmt3(rw)}`} />
        <GeneCard tone="ww" emoji="🌼" type="WW" color="흰색" formula={`q² = ${fmt3(ww)}`} />
      </div>

      {/* ② 슬라이더 + 유전자형 비율 막대 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-violet-300">🎛️ R 유전자 빈도 p 설정해보기</p>
        <PSlider pPct={pPct} p={p} q={q} onChange={changeP} />
        <GenotypeBar rr={rr} rw={rw} ww={ww} />
        <p className="mt-2 text-center text-[11px] text-slate-500">
          (p + q)² = p²·RR + 2pq·RW + q²·WW
        </p>
      </div>

      {/* ③ 꽃밭 시각화 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-violet-300">🌱 꽃밭 시각화 (100그루)</p>
        <div className="mt-3 flex min-h-[68px] flex-wrap justify-center gap-0.5 rounded-xl bg-slate-900/50 p-2 text-base leading-none">
          {garden.arr.map((em, i) => (
            <span key={i} className="inline-block animate-[fadeIn_0.35s_ease_both] cursor-default text-[15px] transition hover:scale-[1.4]">
              {em}
            </span>
          ))}
        </div>
        <p className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-slate-400">
          <span>🌺 RR <b className="text-rose-300">{garden.rrN}그루</b></span>
          <span>🌸 RW <b className="text-pink-300">{garden.rwN}그루</b></span>
          <span>🌼 WW <b className="text-emerald-300">{garden.wwN}그루</b></span>
        </p>
      </div>

      {/* ④ 퍼넷 사각형 + 계산 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-violet-300">🔬 교배 분석 — 다음 세대 유전자 빈도는?</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(220px,1fr)_1.2fr]">
          <PunnettSquare p={p} q={q} />
          <CalcBox p={p} q={q} nextR={nextR} nextW={nextW} />
        </div>
      </div>

      {/* ⑤ 세대 전후 빈도 비교 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-violet-300">📊 세대 전후 유전자 빈도 비교</p>
        <FreqCompare p={p} q={q} nextR={nextR} nextW={nextW} />
        <div className="mt-3 animate-[glowAmber_2s_ease-in-out_infinite] rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-7 text-amber-100">
          <b className="text-amber-200">🎉 발견!</b> p = <b className="text-rose-300">{fmt2(p)}</b> 로 시작하면
          다음 세대도 R 빈도 = <b className="text-rose-300">{fmt2(nextR)}</b>, W 빈도 ={" "}
          <b className="text-emerald-300">{fmt2(nextW)}</b><br />
          <b className="text-amber-200">p값을 어떻게 바꿔도 빈도가 그대로!</b> → 이것이 하디-바인베르크 법칙입니다.
        </div>
      </div>

      {/* ⑥ 다세대 시뮬레이션 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-violet-300">🔄 여러 세대 반복 — 빈도가 진짜 유지될까?</p>
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={runMultiGen}
            className="rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-2 text-sm font-bold text-slate-900 transition hover:brightness-110"
          >
            ▶ 10세대 시뮬레이션!
          </button>
        </div>
        {multiGen ? (
          <>
            <p className="mt-3 text-center text-xs text-slate-400">각 세대의 R 유전자 빈도</p>
            <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
              {multiGen.map((gp, i) => (
                <div
                  key={i}
                  className="min-w-[42px] flex-1 animate-[fadeIn_0.4s_ease_both] rounded-lg border border-white/10 bg-white/[0.06] px-1 py-2 text-center"
                >
                  <p className="font-mono text-sm font-bold text-rose-300">{gp.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-500">{i + 1}세대</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-7 text-amber-100">
              <b className="text-amber-200">📌 결론!</b> p = {fmt2(p)} 로 시작해도{" "}
              <b className="text-amber-200">10세대 내내 R 유전자 빈도가 {fmt2(p)} 로 유지!</b>
              <br />
              유전적 평형 상태에서는 세대를 거듭해도 유전자 빈도가 변하지 않습니다.
            </div>
          </>
        ) : null}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 유전자 카드 ──────────────────────────────────────────
function GeneCard({
  tone, emoji, type, color, formula,
}: { tone: "rr" | "rw" | "ww"; emoji: string; type: string; color: string; formula: string }) {
  const cls = tone === "rr" ? { box: "border-rose-400/45 bg-rose-400/10", text: "text-rose-300" }
            : tone === "rw" ? { box: "border-pink-400/45 bg-pink-400/10", text: "text-pink-300" }
            : { box: "border-emerald-400/45 bg-emerald-400/10", text: "text-emerald-300" };
  return (
    <div className={`rounded-xl border-2 px-2 py-2.5 text-center transition hover:-translate-y-0.5 ${cls.box}`}>
      <p className="text-2xl">{emoji}</p>
      <p className={`mt-0.5 text-base font-extrabold ${cls.text}`}>{type}</p>
      <p className="text-xs text-slate-400">{color}</p>
      <p key={formula} className="mt-0.5 animate-[pulseR_0.3s_ease] font-mono text-xs text-slate-300">{formula}</p>
    </div>
  );
}

// ─── p 슬라이더 ───────────────────────────────────────────
function PSlider({
  pPct, p, q, onChange,
}: { pPct: number; p: number; q: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className="mt-3 flex items-center gap-3">
      <span className="min-w-[78px] rounded-md bg-rose-400/20 px-2 py-1 text-center font-mono text-sm font-bold text-rose-300">
        R {fmt2(p)}
      </span>
      <input
        id={id}
        aria-label="R 유전자 빈도 p"
        type="range"
        min={5}
        max={95}
        step={5}
        value={pPct}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer accent-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
      />
      <span className="min-w-[78px] rounded-md bg-emerald-400/20 px-2 py-1 text-center font-mono text-sm font-bold text-emerald-300">
        W {fmt2(q)}
      </span>
    </div>
  );
}

// ─── 유전자형 비율 막대 (SVG, 인라인 style 회피) ──────────
function GenotypeBar({ rr, rw, ww }: { rr: number; rw: number; ww: number }) {
  // 100 폭 viewBox 로 비율 그대로 그림. rect 의 width 가 어트리뷰트라 인라인 style 0.
  const segs = [
    { w: rr * 100, fill: "rgba(239,68,68,0.7)", label: "RR" },
    { w: rw * 100, fill: "rgba(236,72,153,0.65)", label: "RW" },
    { w: ww * 100, fill: "rgba(34,197,94,0.6)", label: "WW" },
  ];
  let x = 0;
  return (
    <div className="mt-3 overflow-hidden rounded-lg">
      <svg viewBox="0 0 100 5" preserveAspectRatio="none" className="block h-6 w-full" aria-label="유전자형 비율 막대">
        {segs.map((s) => {
          const seg = (
            <g key={s.label}>
              <rect x={x} y={0} width={s.w} height={5} fill={s.fill} />
              {s.w > 8 ? (
                <text x={x + s.w / 2} y={3.3} textAnchor="middle" fontSize={2.4} fontWeight={700} fill="rgba(255,255,255,0.85)">
                  {s.label}
                </text>
              ) : null}
            </g>
          );
          x += s.w;
          return seg;
        })}
      </svg>
    </div>
  );
}

// ─── 퍼넷 사각형 ──────────────────────────────────────────
function PunnettSquare({ p, q }: { p: number; q: number }) {
  const pq = p * q;
  return (
    <div>
      <p className="mb-1 text-center text-xs text-slate-400">퍼넷 사각형</p>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-white/10 bg-white/[0.08] px-2 py-2 text-slate-300">×</th>
            <th className="border border-white/10 bg-white/[0.08] px-2 py-2 text-slate-300">🌺 R <span className="text-rose-300">(p)</span></th>
            <th className="border border-white/10 bg-white/[0.08] px-2 py-2 text-slate-300">🌼 W <span className="text-emerald-300">(q)</span></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-white/10 bg-white/[0.08] px-2 py-2 text-slate-300">🌺 R <span className="text-rose-300">(p)</span></td>
            <td className="border border-white/10 bg-rose-400/15 px-2 py-2 text-center text-rose-300">
              🌺 RR<br /><span className="text-[10px] text-slate-400">p² = {fmt3(p * p)}</span>
            </td>
            <td className="border border-white/10 bg-pink-400/15 px-2 py-2 text-center text-pink-300">
              🌸 RW<br /><span className="text-[10px] text-slate-400">pq = {fmt3(pq)}</span>
            </td>
          </tr>
          <tr>
            <td className="border border-white/10 bg-white/[0.08] px-2 py-2 text-slate-300">🌼 W <span className="text-emerald-300">(q)</span></td>
            <td className="border border-white/10 bg-pink-400/15 px-2 py-2 text-center text-pink-300">
              🌸 WR<br /><span className="text-[10px] text-slate-400">pq = {fmt3(pq)}</span>
            </td>
            <td className="border border-white/10 bg-emerald-400/15 px-2 py-2 text-center text-emerald-300">
              🌼 WW<br /><span className="text-[10px] text-slate-400">q² = {fmt3(q * q)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── 계산 박스 ────────────────────────────────────────────
function CalcBox({ p, q, nextR, nextW }: { p: number; q: number; nextR: number; nextW: number }) {
  return (
    <div className="rounded-xl border border-indigo-400/30 bg-indigo-400/[0.08] p-4 text-sm leading-7">
      <p className="text-xs text-slate-400">R 유전자 빈도 (다음 세대)</p>
      <p className="font-mono text-violet-300">RR 기여: p² = {fmt3(p * p)}</p>
      <p className="font-mono text-violet-300">RW 절반: pq = {fmt3(p * q)}</p>
      <p className="mt-1 border-t border-dashed border-amber-300/30 pt-2 font-mono text-amber-200">
        = {fmt3(nextR)} = p(p+q) = <b className="text-rose-300">{fmt2(p)}</b> ✅
      </p>
      <hr className="my-2 border-white/10" />
      <p className="text-xs text-slate-400">W 유전자 빈도 (다음 세대)</p>
      <p className="font-mono text-violet-300">WW 기여: q² = {fmt3(q * q)}</p>
      <p className="font-mono text-violet-300">WR 절반: pq = {fmt3(p * q)}</p>
      <p className="mt-1 border-t border-dashed border-amber-300/30 pt-2 font-mono text-amber-200">
        = {fmt3(nextW)} = q(p+q) = <b className="text-emerald-300">{fmt2(q)}</b> ✅
      </p>
    </div>
  );
}

// ─── 세대 전후 빈도 비교 ──────────────────────────────────
function FreqCompare({
  p, q, nextR, nextW,
}: { p: number; q: number; nextR: number; nextW: number }) {
  return (
    <div className="mt-3 flex items-stretch gap-2">
      <FreqColumn title="현재 세대" rVal={p} wVal={q} />
      <div className="flex items-center justify-center px-1 text-2xl font-bold text-emerald-400">=</div>
      <FreqColumn title="다음 세대" rVal={nextR} wVal={nextW} />
    </div>
  );
}
function FreqColumn({ title, rVal, wVal }: { title: string; rVal: number; wVal: number }) {
  return (
    <div className="flex-1">
      <p className="mb-2 text-center text-xs font-semibold text-slate-400">{title}</p>
      <FreqBar label="R" val={rVal} tone="r" />
      <FreqBar label="W" val={wVal} tone="w" />
    </div>
  );
}
function FreqBar({ label, val, tone }: { label: string; val: number; tone: "r" | "w" }) {
  // SVG 로 비율 막대(인라인 style 회피).
  const fill = tone === "r" ? "url(#fbR)" : "url(#fbW)";
  const valColor = tone === "r" ? "text-rose-300" : "text-emerald-300";
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="w-7 text-xs text-slate-400">{label}</span>
      <div className="flex-1 overflow-hidden rounded-lg bg-white/[0.08]">
        <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="block h-4 w-full">
          <defs>
            <linearGradient id="fbR" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#dc2626" />
              <stop offset="1" stopColor="#f87171" />
            </linearGradient>
            <linearGradient id="fbW" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#16a34a" />
              <stop offset="1" stopColor="#86efac" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={Math.max(0, Math.min(100, val * 100))} height={4} fill={fill} />
        </svg>
      </div>
      <span className={`w-9 text-right font-mono text-xs ${valColor}`}>{fmt2(val)}</span>
    </div>
  );
}
