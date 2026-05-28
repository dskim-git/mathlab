"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

type SpeedKey = 1 | 2 | 3;
const SPEED_MS: Record<SpeedKey, number> = { 1: 600, 2: 180, 3: 30 };
const SPEED_BATCH: Record<SpeedKey, number> = { 1: 1, 2: 1, 3: 10 };
const SPEED_LABEL: Record<SpeedKey, string> = { 1: "🐢 느리게", 2: "🚶 보통", 3: "🐇 빠르게" };

type TrialOut = { label: string; isHit: boolean };
type TabCfg = {
  key: string;
  events: { value: string; label: string }[];
  mathProb: (ev: string) => { p: number; str: string };
  trial: (ev: string) => TrialOut;
  flip: string; // 최신 결과 reveal 애니메이션 클래스
  unit: string;
};

type Data = {
  total: number; hit: number; history: number[];
  snapshots: Record<number, { hit: number; ratio: number }>;
  log: TrialOut[]; last: TrialOut | null;
};
const EMPTY: Data = { total: 0, hit: 0, history: [], snapshots: {}, log: [], last: null };

// ── 수렴 그래프(canvas) ──
function ConvChart({ history, mathProb }: { history: number[]; mathProb: number }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cvsRef = useRef<HTMLCanvasElement | null>(null);
  const [w, setW] = useState(420);
  useEffect(() => {
    const m = () => { if (wrapRef.current) setW(wrapRef.current.clientWidth); };
    m(); window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, []);
  useEffect(() => {
    const cvs = cvsRef.current; const ctx = cvs?.getContext("2d");
    if (!cvs || !ctx) return;
    const H = 220; cvs.width = w; cvs.height = H;
    ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, w, H);
    const pad = { l: 42, r: 16, t: 14, b: 32 };
    const gW = w - pad.l - pad.r, gH = H - pad.t - pad.b;
    const maxX = Math.max(1000, history.length);

    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
    [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach((v) => {
      const y = pad.t + gH * (1 - v);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + gW, y); ctx.stroke();
      ctx.fillStyle = "#475569"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(v.toFixed(1), pad.l - 4, y + 3.5);
    });
    ctx.fillStyle = "#475569"; ctx.textAlign = "center"; ctx.font = "10px sans-serif";
    [0.2, 0.4, 0.6, 0.8, 1].forEach((f) => ctx.fillText(String(Math.round(maxX * f)), pad.l + gW * f, H - pad.b + 14));
    ctx.fillText("횟수", w / 2, H - 2);

    const mpY = pad.t + gH * (1 - mathProb);
    ctx.strokeStyle = "rgba(239,68,68,.7)"; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, mpY); ctx.lineTo(pad.l + gW, mpY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f87171"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`p=${mathProb.toFixed(3)}`, pad.l + 4, mpY - 4);

    if (history.length >= 2) {
      ctx.strokeStyle = "rgba(52,211,153,.9)"; ctx.lineWidth = 1.8;
      ctx.beginPath();
      history.forEach((v, i) => {
        const x = pad.l + ((i + 1) / maxX) * gW;
        const y = pad.t + gH * (1 - Math.min(Math.max(v, 0), 1));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      const lv = history[history.length - 1];
      const lx = pad.l + (history.length / maxX) * gW;
      const ly = pad.t + gH * (1 - Math.min(Math.max(lv, 0), 1));
      ctx.fillStyle = "#34d399"; ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
    }
    // 범례
    ctx.font = "10px sans-serif"; ctx.textAlign = "left";
    ctx.fillStyle = "rgba(52,211,153,.9)"; ctx.fillRect(pad.l + 8, pad.t + 4, 14, 3);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("상대도수", pad.l + 26, pad.t + 8);
    ctx.fillStyle = "rgba(239,68,68,.7)"; ctx.fillRect(pad.l + 92, pad.t + 4, 14, 3);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("수학적 확률", pad.l + 110, pad.t + 8);
  }, [history, mathProb, w]);
  return <div ref={wrapRef}><canvas ref={cvsRef} className="block h-[220px] w-full rounded-lg border border-white/8" /></div>;
}

// ── 공용 시뮬 탭 ──
function SimTab({ cfg }: { cfg: TabCfg }) {
  const [ev, setEv] = useState(cfg.events[0].value);
  const [data, setData] = useState<Data>(EMPTY);
  const [speed, setSpeed] = useState<SpeedKey>(2);
  const [auto, setAuto] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRef = useRef(false);
  const totalRef = useRef(0);
  const evRef = useRef(ev);
  const speedRef = useRef(speed);
  useEffect(() => { totalRef.current = data.total; }, [data.total]);
  useEffect(() => { evRef.current = ev; }, [ev]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const { p: mathProb, str: mathStr } = cfg.mathProb(ev) ?? { p: 0, str: "—" };

  function applyTrials(n: number, cap?: number) {
    setData((prev) => {
      let { total, hit } = prev;
      const history = prev.history.slice();
      const snapshots = { ...prev.snapshots };
      let log = prev.log.slice();
      let last = prev.last;
      for (let i = 0; i < n; i++) {
        if (cap && total >= cap) break;
        const t = cfg.trial(evRef.current);
        total++; if (t.isHit) hit++;
        const ratio = hit / total;
        history.push(ratio);
        if (total % 100 === 0 && total <= 1000) snapshots[total] = { hit, ratio };
        log.unshift(t); last = t;
      }
      if (log.length > 120) log = log.slice(0, 120);
      return { total, hit, history, snapshots, log, last };
    });
  }

  function stopAuto() {
    autoRef.current = false; setAuto(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }
  function toggleAuto() {
    if (autoRef.current) { stopAuto(); return; }
    if (totalRef.current >= 1000) return;
    autoRef.current = true; setAuto(true);
    const tick = () => {
      if (!autoRef.current) return;
      if (totalRef.current >= 1000) { stopAuto(); return; }
      applyTrials(SPEED_BATCH[speedRef.current], 1000);
    };
    timerRef.current = setInterval(tick, SPEED_MS[speedRef.current]);
  }
  // 속도 변경 시 자동 실행 재시작
  function changeSpeed(s: SpeedKey) {
    setSpeed(s);
    if (autoRef.current && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (!autoRef.current) return;
        if (totalRef.current >= 1000) { stopAuto(); return; }
        applyTrials(SPEED_BATCH[s], 1000);
      }, SPEED_MS[s]);
    }
  }
  function reset() {
    stopAuto();
    setData(EMPTY);
  }
  function selectEv(v: string) {
    stopAuto();
    setEv(v);
    setData(EMPTY);
  }

  const ratio = data.total > 0 ? data.hit / data.total : 0;
  const diff = data.total > 0 ? Math.abs(ratio - mathProb) : null;
  const diffColor = diff === null ? "text-amber-300" : diff < 0.02 ? "text-emerald-300" : diff < 0.05 ? "text-amber-300" : "text-red-300";
  const converged = data.total >= 500 && diff !== null && diff < 0.02;

  const runBtn = "rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-45";
  const speedBtn = (a: boolean) => a ? "rounded-md border border-amber-400/40 bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-200" : "rounded-md border border-white/12 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:bg-white/10";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={`${cfg.key}-ev`} className="text-sm text-slate-400">사건 선택:</label>
          <select id={`${cfg.key}-ev`} value={ev} onChange={(e) => selectEv(e.target.value)}
            className="min-w-[140px] flex-1 rounded-md border border-white/15 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/40">
            {cfg.events.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-400/15 px-3 py-1.5 text-sm">
          수학적 확률: <b className="text-indigo-300">{mathStr}</b>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className={runBtn} onClick={() => applyTrials(1)} disabled={auto}>1번</button>
          <button type="button" className={runBtn} onClick={() => applyTrials(10)} disabled={auto}>10번</button>
          <button type="button" className={runBtn} onClick={() => applyTrials(100)} disabled={auto}>100번</button>
          <button type="button" onClick={toggleAuto}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold text-white transition hover:brightness-110 ${auto ? "bg-red-500" : "bg-indigo-600"}`}>
            {auto ? "⏹ 정지" : "▶ 자동(1000)"}
          </button>
          <button type="button" onClick={reset}
            className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/20">초기화</button>
          <span className="ml-1 flex items-center gap-1.5">
            <span className="text-xs text-slate-500">속도</span>
            {([1, 2, 3] as SpeedKey[]).map((s) => (
              <button key={s} type="button" className={speedBtn(speed === s)} onClick={() => changeSpeed(s)}>{SPEED_LABEL[s]}</button>
            ))}
          </span>
        </div>

        {/* 최신 결과 (플립 애니메이션) */}
        <div className="mt-3 flex h-[64px] items-center justify-center [perspective:600px]">
          {data.last ? (
            <div key={data.total} className={`text-3xl font-black ${cfg.flip} ${data.last.isHit ? "text-emerald-300" : "text-red-400"}`}>
              {data.last.label} {data.last.isHit ? "✅" : "❌"}
            </div>
          ) : (
            <span className="text-2xl text-slate-600">－</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat val={data.total} lbl="전체 횟수" />
          <Stat val={data.hit} lbl="사건 발생" />
          <Stat val={ratio.toFixed(3)} lbl="상대도수(통계적 확률)" />
          <Stat val={diff === null ? "—" : diff.toFixed(3)} lbl="수학적 확률과 차이" tone={diffColor} />
        </div>

        {converged ? (
          <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-center text-sm text-amber-300">📈 상대도수가 수학적 확률에 매우 가까워졌어요!</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
        <p className="text-sm font-bold text-lime-300">📊 상대도수 변화 그래프</p>
        <div className="mt-2"><ConvChart history={data.history} mathProb={mathProb} /></div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
        <p className="text-sm font-bold text-lime-300">📋 구간별 결과 표 (100번 단위)</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-xs">
            <thead>
              <tr className="text-emerald-200">
                <th className="border-b border-emerald-400/20 px-1 py-1.5 text-left">횟수</th>
                {Array.from({ length: 10 }, (_, i) => (i + 1) * 100).map((c) => (
                  <th key={c} className="border-b border-emerald-400/20 px-1 py-1.5">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-white/5 px-1 py-1 text-left text-slate-400">사건 발생</td>
                {Array.from({ length: 10 }, (_, i) => (i + 1) * 100).map((c) => (
                  <td key={c} className="border-b border-white/5 px-1 py-1 text-center text-slate-200">{data.snapshots[c]?.hit ?? "—"}</td>
                ))}
              </tr>
              <tr>
                <td className="border-b border-white/5 px-1 py-1 text-left text-slate-400">상대도수</td>
                {Array.from({ length: 10 }, (_, i) => (i + 1) * 100).map((c) => (
                  <td key={c} className="border-b border-white/5 px-1 py-1 text-center text-amber-300">{data.snapshots[c] ? data.snapshots[c].ratio.toFixed(3) : "—"}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
        <p className="text-sm font-bold text-lime-300">📜 개별 결과 로그 <span className="text-xs font-normal text-slate-500">(최근 {Math.min(data.log.length, 100)}개)</span></p>
        <div className="mt-2 flex max-h-32 flex-wrap gap-1 overflow-y-auto">
          {data.log.slice(0, 100).map((it, i) => (
            <span key={i} className={`rounded-full border px-2 py-0.5 text-xs ${it.isHit ? "border-emerald-400/20 bg-emerald-400/15 text-emerald-200" : "border-white/8 bg-white/[0.04] text-slate-500"}`}>{it.label}</span>
          ))}
          {data.log.length === 0 ? <span className="py-3 text-sm text-slate-500">실행하면 결과가 쌓입니다.</span> : null}
        </div>
      </div>
    </div>
  );
}

function Stat({ val, lbl, tone = "text-emerald-300" }: { val: number | string; lbl: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/9 bg-white/[0.04] p-2.5 text-center">
      <div className={`text-xl font-black ${tone}`}>{val}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{lbl}</div>
    </div>
  );
}

// ── 탭 설정 ──
const COIN: TabCfg = {
  key: "coin", flip: "animate-[coinFlip_0.45s_ease]", unit: "번",
  events: [{ value: "head", label: "앞면 (H)" }, { value: "tail", label: "뒷면 (T)" }],
  mathProb: () => ({ p: 0.5, str: "1/2 = 0.500" }),
  trial: (ev) => { const r = Math.random() < 0.5 ? "head" : "tail"; return { label: r === "head" ? "앞 🪙" : "뒤 🪙", isHit: r === ev }; },
};
const DICE: TabCfg = {
  key: "dice", flip: "animate-[diceTumble_0.45s_ease]", unit: "번",
  events: [
    ...[1, 2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: `눈이 ${d}` })),
    { value: "even", label: "짝수 (2,4,6)" }, { value: "odd", label: "홀수 (1,3,5)" },
    { value: "lte3", label: "3 이하 (1,2,3)" }, { value: "gte4", label: "4 이상 (4,5,6)" },
  ],
  mathProb: (ev) => (["even", "odd", "lte3", "gte4"].includes(ev) ? { p: 0.5, str: "3/6 = 1/2 = 0.500" } : { p: 1 / 6, str: "1/6 ≈ 0.167" }),
  trial: (ev) => {
    const r = Math.floor(Math.random() * 6) + 1;
    const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    let isHit: boolean;
    if (ev === "even") isHit = r % 2 === 0;
    else if (ev === "odd") isHit = r % 2 === 1;
    else if (ev === "lte3") isHit = r <= 3;
    else if (ev === "gte4") isHit = r >= 4;
    else isHit = String(r) === ev;
    return { label: `${faces[r - 1]} ${r}`, isHit };
  },
};
const CARD: TabCfg = {
  key: "card", flip: "animate-[cardFlip_0.4s_ease]", unit: "번",
  events: [
    { value: "heart", label: "하트 ♥ (13장)" }, { value: "spade", label: "스페이드 ♠ (13장)" },
    { value: "diamond", label: "다이아 ♦ (13장)" }, { value: "club", label: "클럽 ♣ (13장)" },
    { value: "red", label: "빨강 ♥♦ (26장)" }, { value: "black", label: "검정 ♠♣ (26장)" },
    { value: "ace", label: "에이스 A (4장)" }, { value: "face", label: "J/Q/K (12장)" },
  ],
  mathProb: (ev) => {
    const m: Record<string, { p: number; str: string }> = {
      heart: { p: 13 / 52, str: "13/52 = 1/4 = 0.250" }, spade: { p: 13 / 52, str: "13/52 = 1/4 = 0.250" },
      diamond: { p: 13 / 52, str: "13/52 = 1/4 = 0.250" }, club: { p: 13 / 52, str: "13/52 = 1/4 = 0.250" },
      red: { p: 26 / 52, str: "26/52 = 1/2 = 0.500" }, black: { p: 26 / 52, str: "26/52 = 1/2 = 0.500" },
      ace: { p: 4 / 52, str: "4/52 = 1/13 ≈ 0.077" }, face: { p: 12 / 52, str: "12/52 ≈ 0.231" },
    };
    return m[ev];
  },
  trial: (ev) => {
    const suits = ["♥", "♦", "♠", "♣"]; const vals = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const si = Math.floor(Math.random() * 4), vi = Math.floor(Math.random() * 13);
    let isHit: boolean;
    if (ev === "heart") isHit = si === 0;
    else if (ev === "diamond") isHit = si === 1;
    else if (ev === "spade") isHit = si === 2;
    else if (ev === "club") isHit = si === 3;
    else if (ev === "red") isHit = si <= 1;
    else if (ev === "black") isHit = si >= 2;
    else if (ev === "ace") isHit = vi === 0;
    else isHit = vi >= 10;
    return { label: `${suits[si]}${vals[vi]}`, isHit };
  },
};

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "compare_math",
    prompt: "1000번 실험에서 얻은 통계적 확률과 수학적 확률을 비교해 보세요. 차이가 났다면 왜 그런지, 횟수를 늘리면 어떻게 되는지 설명해 보세요.",
    kind: "text",
  },
  {
    id: "law_large_numbers",
    prompt: "시행 횟수를 늘릴수록 상대도수가 수학적 확률에 가까워지는 ‘큰 수의 법칙’을, 세 시행(동전·주사위·카드) 중 어디서 가장 잘 확인했는지 적어 보세요.",
    kind: "text",
  },
  {
    id: "why_statistical",
    prompt: "수학적 확률로도 구할 수 있는데, 통계적 확률(실험)을 사용하는 것이 왜 의미 있을까요?",
    kind: "text",
  },
];

type TabKey = "coin" | "dice" | "card";

export default function StatProbExperiment() {
  const [tab, setTab] = useState<TabKey>("coin");
  const tabBtn = (active: boolean) =>
    active ? "rounded-lg bg-emerald-400 px-3 py-2 text-sm font-bold text-slate-950"
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률</p>
        <h3 className="mt-2 text-2xl font-bold">🔬 통계적 확률 실험실</h3>
        <p className="mt-2 leading-7 text-slate-300">
          동전·주사위·카드 시행을 반복하며 <b className="text-emerald-300">상대도수(통계적 확률)</b>가 <b className="text-indigo-300">수학적 확률</b>에 가까워지는 <b>큰 수의 법칙</b>을 직접 확인해 보세요.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "coin")} onClick={() => setTab("coin")}>🪙 동전</button>
        <button type="button" className={tabBtn(tab === "dice")} onClick={() => setTab("dice")}>🎲 주사위</button>
        <button type="button" className={tabBtn(tab === "card")} onClick={() => setTab("card")}>🃏 카드</button>
      </div>

      <div className="mt-4">
        {/* key 로 탭별 독립 인스턴스 강제(전환 시 event 상태가 섞이지 않도록) */}
        {tab === "coin" ? <SimTab key="coin" cfg={COIN} /> : tab === "dice" ? <SimTab key="dice" cfg={DICE} /> : <SimTab key="card" cfg={CARD} />}
      </div>

      <a href="https://tong.kostat.go.kr/tongramy_web/main.do?menuSn=163#" target="_blank" rel="noopener noreferrer"
        className="mt-4 block rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-center text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20">
        📊 통계청 ‘통그라미’로 더 탐구하기 ↗
      </a>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
