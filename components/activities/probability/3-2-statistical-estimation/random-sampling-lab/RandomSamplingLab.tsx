"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 ─────────────────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "random_sampling_meaning",
    prompt:
      "이 활동에서 ‘임의추출(무작위추출)’이란 어떻게 표본을 뽑는 것이라고 정의할 수 있을지, 자신의 말로 적어 보세요.",
    kind: "text",
    placeholder: "예: 모집단의 모든 대상이 똑같은 확률로 뽑힐 수 있도록, 의도가 개입되지 않게 뽑는 것.",
  },
  {
    id: "efficient_method",
    prompt:
      "4가지 방법(제비뽑기·난수주사위·난수표·엑셀) 중 모집단이 클 때 가장 효율적인 방법은 무엇이고, 그 이유는?",
    kind: "text",
    placeholder: "예: 엑셀(RANDBETWEEN). 수천~수만 명도 한 번에 빠르게 뽑을 수 있고, 자동 채우기로 표본 수 확장이 쉽다.",
  },
  {
    id: "out_of_range_handling",
    prompt:
      "난수주사위·난수표에서 모집단 범위를 벗어난 번호나 중복 번호가 나오면 어떻게 처리해야 하고, 왜 그래야 할까요?",
    kind: "text",
    placeholder: "예: 다시 뽑는다. 그렇지 않으면 일부 번호의 뽑힐 확률이 달라져 ‘모두에게 같은 확률’이라는 임의추출의 정의가 깨진다.",
  },
];

// ─── 메인 ─────────────────────────────────────────────────
type TabKey = "lots" | "dice" | "table" | "excel";

export default function RandomSamplingLab() {
  const [tab, setTab] = useState<TabKey>("lots");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 임의추출 방법 시뮬레이션</h3>
        <p className="mt-2 leading-7 text-slate-300">
          표본을 임의추출(무작위추출)하는 4가지 대표적 방법 —{" "}
          <b className="text-amber-300">제비뽑기 · 난수주사위 · 난수표 · 컴퓨터 프로그램(엑셀)</b> — 을 직접 체험합니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <TabBtn active={tab === "lots"} tone="amber" onClick={() => setTab("lots")}>🎟️ 제비뽑기</TabBtn>
        <TabBtn active={tab === "dice"} tone="violet" onClick={() => setTab("dice")}>🎲 난수주사위</TabBtn>
        <TabBtn active={tab === "table"} tone="cyan" onClick={() => setTab("table")}>📋 난수표</TabBtn>
        <TabBtn active={tab === "excel"} tone="emerald" onClick={() => setTab("excel")}>💻 엑셀로 추출</TabBtn>
      </div>

      <div className={tab === "lots" ? "mt-4" : "mt-4 hidden"}>
        <LotsTab />
      </div>
      <div className={tab === "dice" ? "mt-4" : "mt-4 hidden"}>
        <DiceTab />
      </div>
      <div className={tab === "table" ? "mt-4" : "mt-4 hidden"}>
        <TableTab />
      </div>
      <div className={tab === "excel" ? "mt-4" : "mt-4 hidden"}>
        <ExcelTab />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function TabBtn({
  active, tone, onClick, children,
}: { active: boolean; tone: "amber" | "violet" | "cyan" | "emerald"; onClick: () => void; children: React.ReactNode }) {
  const activeCls =
    tone === "amber" ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
    : tone === "violet" ? "border-violet-400/50 bg-violet-400/15 text-violet-200"
    : tone === "cyan" ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
    : "border-emerald-400/50 bg-emerald-400/15 text-emerald-200";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? `rounded-xl border ${activeCls} px-4 py-2 text-sm font-bold`
          : "rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-400 hover:bg-white/10"
      }
    >
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 1: 제비뽑기
// ═════════════════════════════════════════════════════════

function LotsTab() {
  const [N, setN] = useState(30);
  const [K, setK] = useState(5);
  const [pool, setPool] = useState<number[]>(() => Array.from({ length: 30 }, (_, i) => i + 1));
  const [drawn, setDrawn] = useState<number[]>([]);
  const [shaking, setShaking] = useState(false);
  const [drawing, setDrawing] = useState(false);

  function changeN(next: number) {
    setN(next);
    setPool(Array.from({ length: next }, (_, i) => i + 1));
    setDrawn([]);
    setShaking(false);
  }
  function changeK(next: number) {
    setK(next);
    setDrawn([]);
  }
  function reset() {
    setPool(Array.from({ length: N }, (_, i) => i + 1));
    setDrawn([]);
    setShaking(false);
  }
  function shake() {
    setShaking(true);
    window.setTimeout(() => setShaking(false), 1700);
  }
  function drawOne() {
    if (drawing || drawn.length >= K || pool.length === 0) return;
    setDrawing(true);
    setShaking(true);
    window.setTimeout(() => {
      setShaking(false);
      const idx = Math.floor(Math.random() * pool.length);
      const picked = pool[idx];
      setPool((arr) => arr.filter((_, i) => i !== idx));
      setDrawn((arr) => [...arr, picked]);
      setDrawing(false);
    }, 650);
  }

  const done = drawn.length >= K;

  return (
    <div className="space-y-3">
      {/* 컨트롤 */}
      <div className="flex flex-wrap justify-center gap-3 rounded-2xl border border-indigo-400/30 bg-slate-900/50 p-4">
        <RangeRow label="👥 모집단 크기 (학생 수)" suffix="명" value={N} min={10} max={50} step={1} onChange={changeN} tone="amber" />
        <RangeRow label="🎯 표본 크기 (뽑을 인원)" suffix="명" value={K} min={2} max={10} step={1} onChange={changeK} tone="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* 통 */}
        <div className="rounded-2xl border-2 border-dashed border-amber-400/50 bg-slate-900/55 p-4 text-center">
          <p className="text-base font-bold text-amber-100">📦 번호가 적힌 쪽지가 든 통</p>
          <div className="my-4 flex h-[230px] items-end justify-center">
            <Jar shaking={shaking} slipsCount={Math.min(pool.length, 30)} />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <ActionBtn tone="sec" onClick={shake} disabled={shaking || drawing}>🌀 통 흔들기</ActionBtn>
            <ActionBtn tone="amber" onClick={drawOne} disabled={done || drawing}>✋ 한 장 뽑기</ActionBtn>
          </div>
        </div>

        {/* 결과 */}
        <div className="rounded-2xl border-2 border-emerald-400/35 bg-slate-900/55 p-4">
          <p className="text-center text-base font-bold text-emerald-200">🏆 뽑힌 번호 (표본)</p>
          {drawn.length === 0 ? (
            <p className="my-12 text-center text-sm text-slate-500">아직 뽑힌 번호가 없어요.<br />통을 흔들고 쪽지를 뽑아 보세요!</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {drawn.map((n, i) => (
                <div
                  key={i}
                  className="animate-[popRes_0.5s_cubic-bezier(0.34,1.56,0.64,1)] rounded-xl border-2 border-emerald-400/40 bg-emerald-400/12 px-2 py-3 text-center"
                >
                  <p className="text-[10px] font-extrabold text-emerald-300">{i + 1}번째</p>
                  <p className="mt-1 font-mono text-2xl font-black text-amber-100">{String(n).padStart(2, "0")}</p>
                </div>
              ))}
            </div>
          )}
          {done ? (
            <div className="mt-4 animate-[popRes_0.5s_ease] rounded-xl border-2 border-emerald-400 bg-emerald-400/18 px-4 py-3 text-center text-base font-extrabold text-emerald-200">
              🎉 {K}명 표본 추출 완료!
            </div>
          ) : null}
          <div className="mt-4 flex justify-center">
            <ActionBtn tone="sec" onClick={reset}>🔄 다시 시작</ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Jar({ shaking, slipsCount }: { shaking: boolean; slipsCount: number }) {
  const slips = Array.from({ length: slipsCount }, (_, i) => i);
  return (
    <div className={`relative h-[230px] w-[200px] ${shaking ? "animate-[shakeIt_0.4s_ease-in-out_4]" : ""}`}>
      {/* 입구 */}
      <div className="absolute left-1/2 top-[30px] z-10 h-[18px] w-[175px] -translate-x-1/2 rounded-[50%] border-[3px] border-indigo-300/95 bg-[#1e1b4b]" />
      {/* 몸체 */}
      <div className="absolute left-1/2 top-[35px] h-[195px] w-[170px] -translate-x-1/2 overflow-hidden rounded-[6px_6px_60px_60px/6px_6px_30px_30px] border-[3px] border-indigo-300/80 bg-gradient-to-b from-indigo-300/25 to-indigo-500/40 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.25),inset_10px_0_20px_rgba(255,255,255,0.12)]">
        <div className="absolute inset-x-[10px] bottom-[14px] top-[25px] flex flex-wrap items-end justify-center gap-[3px]">
          {slips.map((i) => (
            <span
              key={i}
              className="inline-block h-[18px] w-[14px] animate-[wiggle_1.8s_ease-in-out_infinite] rounded-sm bg-amber-100 shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 2: 난수주사위
// ═════════════════════════════════════════════════════════

type DiceLog = { n: number; st: "ok" | "dup" | "over" };
const DICE_POP = 300;
const DICE_TARGET = 5;

function DiceTab() {
  const [drawn, setDrawn] = useState<number[]>([]);
  const [history, setHistory] = useState<DiceLog[]>([]);
  const [rolling, setRolling] = useState(false);
  const [digits, setDigits] = useState<[string, string, string]>(["?", "?", "?"]);
  const [combined, setCombined] = useState<string>("___");
  const [status, setStatus] = useState<{ tone: "idle" | "ok" | "bad"; msg: string }>({ tone: "idle", msg: "주사위를 굴려보세요!" });
  const [autoRunning, setAutoRunning] = useState(false);

  const flickerRef = useRef<number | null>(null);
  const autoRef = useRef<number | null>(null);
  const aliveRef = useRef(true);
  // setInterval 콜백의 stale closure를 피하려고 최신값을 ref로 추적
  const drawnRef = useRef<number[]>([]);
  const rollingRef = useRef(false);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (flickerRef.current !== null) window.clearInterval(flickerRef.current);
      if (autoRef.current !== null) window.clearInterval(autoRef.current);
    };
  }, []);

  const done = drawn.length >= DICE_TARGET;

  function setRollingBoth(v: boolean) {
    rollingRef.current = v;
    setRolling(v);
  }

  function stopAuto() {
    if (autoRef.current !== null) {
      window.clearInterval(autoRef.current);
      autoRef.current = null;
    }
    setAutoRunning(false);
  }

  function rollOnce() {
    if (rollingRef.current || drawnRef.current.length >= DICE_TARGET) return;
    setRollingBoth(true);

    // 깜빡임 애니메이션
    flickerRef.current = window.setInterval(() => {
      setDigits([
        String(Math.floor(Math.random() * 10)),
        String(Math.floor(Math.random() * 10)),
        String(Math.floor(Math.random() * 10)),
      ]);
    }, 80);

    window.setTimeout(() => {
      if (flickerRef.current !== null) {
        window.clearInterval(flickerRef.current);
        flickerRef.current = null;
      }
      const d1 = Math.floor(Math.random() * 10);
      const d2 = Math.floor(Math.random() * 10);
      const d3 = Math.floor(Math.random() * 10);
      setDigits([String(d1), String(d2), String(d3)]);
      const num = d1 * 100 + d2 * 10 + d3;
      setCombined(String(num).padStart(3, "0"));

      const cur = drawnRef.current;
      let st: DiceLog["st"];
      if (num >= DICE_POP) {
        st = "over";
        setStatus({ tone: "bad", msg: `❌ ${String(num).padStart(3, "0")}번 → 300명 범위(0~299) 밖! 다시 굴려요` });
      } else if (cur.includes(num)) {
        st = "dup";
        setStatus({ tone: "bad", msg: `⚠️ ${String(num).padStart(3, "0")}번 → 이미 뽑힌 번호! 다시 굴려요` });
      } else {
        st = "ok";
        const nextDrawn = [...cur, num];
        drawnRef.current = nextDrawn;
        setDrawn(nextDrawn);
        setStatus({ tone: "ok", msg: `✅ ${String(num).padStart(3, "0")}번 채택! (${nextDrawn.length}/${DICE_TARGET})` });
      }
      setHistory((prev) => [...prev, { n: num, st }]);
      setRollingBoth(false);

      // 목표 인원을 채우면 자동 모드 정지
      if (drawnRef.current.length >= DICE_TARGET) stopAuto();
    }, 700);
  }

  function startAuto() {
    if (autoRef.current !== null || drawnRef.current.length >= DICE_TARGET) return;
    setAutoRunning(true);
    rollOnce();
    autoRef.current = window.setInterval(() => {
      if (!aliveRef.current) return;
      if (drawnRef.current.length >= DICE_TARGET) {
        stopAuto();
        return;
      }
      if (!rollingRef.current) rollOnce();
    }, 850);
  }

  function reset() {
    stopAuto();
    if (flickerRef.current !== null) {
      window.clearInterval(flickerRef.current);
      flickerRef.current = null;
    }
    drawnRef.current = [];
    setRollingBoth(false);
    setDrawn([]);
    setHistory([]);
    setDigits(["?", "?", "?"]);
    setCombined("___");
    setStatus({ tone: "idle", msg: "주사위를 굴려보세요!" });
  }

  const statusCls =
    status.tone === "ok" ? "border-emerald-500 bg-emerald-500/18 text-emerald-200"
    : status.tone === "bad" ? "border-rose-500 bg-rose-500/16 text-rose-200"
    : "border-slate-500/40 bg-slate-500/15 text-slate-200";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-violet-400/35 bg-slate-900/55 p-5 text-center">
        <p className="text-base leading-7 text-amber-100">
          📌 <b className="text-xl text-amber-300">{DICE_POP}명</b>의 학생 중에서{" "}
          <b className="text-xl text-amber-300">{DICE_TARGET}명</b>을 임의추출하기
        </p>
        <p className="mt-1 text-sm text-slate-300">→ 0~299 범위의 번호만 유효 · 중복 번호는 제외</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-violet-400/40 bg-slate-900/55 p-5 text-center">
        <div className="flex flex-wrap justify-center gap-4">
          {(["violet", "amber", "emerald"] as const).map((c, i) => (
            <Die key={i} color={c} value={digits[i]} rolling={rolling} />
          ))}
        </div>
        <p className="mt-4 text-xl font-extrabold text-amber-100">
          → 결과:{" "}
          <span className="inline-block min-w-[200px] font-mono text-4xl font-black tracking-[6px] text-amber-300 drop-shadow-[0_4px_12px_rgba(251,191,36,0.4)]">
            {combined}
          </span>
        </p>
        <p className={`mx-auto mt-3 inline-block min-h-[38px] rounded-lg border-2 px-4 py-2 text-base font-extrabold ${statusCls}`}>
          {status.msg}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <ActionBtn tone="violet" onClick={rollOnce} disabled={rolling || done}>🎲 주사위 굴리기</ActionBtn>
          <ActionBtn tone="sec" onClick={startAuto} disabled={rolling || done || autoRunning}>⚡ 5명 모두 자동 추출</ActionBtn>
          <ActionBtn tone="sec" onClick={reset}>🔄 다시 시작</ActionBtn>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-indigo-400/30 bg-slate-900/55 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-base font-extrabold text-indigo-300">📜 추출 기록</p>
          <span className="rounded-md border border-amber-400/35 bg-amber-400/12 px-3 py-1 text-sm font-extrabold text-amber-300">
            {drawn.length}/{DICE_TARGET}명 추출 · 총 {history.length}회 시행
          </span>
        </div>
        {history.length > 0 ? (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {history.map((h, i) => {
              const cls = h.st === "ok" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                : h.st === "dup" ? "border-amber-400/50 bg-amber-400/10 text-amber-300 line-through opacity-70"
                : "border-rose-400/50 bg-rose-400/10 text-rose-300 line-through opacity-70";
              return (
                <div key={i} className={`animate-[popRes_0.35s_cubic-bezier(0.34,1.56,0.64,1)] rounded-xl border-2 py-2 text-center font-mono text-lg font-black ${cls}`}>
                  {String(h.n).padStart(3, "0")}
                </div>
              );
            })}
          </div>
        ) : null}
        {done ? (
          <div className="mt-4 animate-[popRes_0.5s_ease] rounded-xl border-2 border-emerald-400 bg-emerald-400/18 px-4 py-3 text-center">
            <p className="text-base font-extrabold text-emerald-200">🏆 최종 표본 5명</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {drawn.map((n, i) => (
                <span key={i} className="rounded-lg border-2 border-emerald-500 bg-emerald-500/25 px-4 py-2 font-mono text-xl font-black text-amber-100">
                  {String(n).padStart(3, "0")}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Die({ color, value, rolling }: { color: "violet" | "amber" | "emerald"; value: string; rolling: boolean }) {
  // CSS clip-path/그라디언트가 일부 전자칠판 브라우저에서 렌더되지 않아 SVG로 그림
  const [c1, c2] =
    color === "violet" ? ["#8b5cf6", "#6d28d9"]
    : color === "amber" ? ["#f97316", "#c2410c"]
    : ["#10b981", "#047857"];
  const gid = `die_${color}`;
  return (
    <div className={`relative h-[130px] w-[130px] ${rolling ? "animate-[rollDie_0.6s_linear_infinite]" : ""}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]" role="img" aria-label={`주사위 ${value}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c1} />
            <stop offset="1" stopColor={c2} />
          </linearGradient>
        </defs>
        <polygon points="50,2 95,25 95,75 50,98 5,75 5,25" fill={`url(#${gid})`} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
        <text
          x="50"
          y="52"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="46"
          fontWeight="900"
          fill="#ffffff"
          className={`font-mono ${rolling ? "animate-[flicker_0.08s_linear_infinite]" : ""}`}
          style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.7))" }}
        >
          {value}
        </text>
      </svg>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 3: 난수표
// ═════════════════════════════════════════════════════════

const TBL_ROWS = 6;
const TBL_CELLS = 8;
const TBL_DCOLS = TBL_CELLS * 2; // 16 digits per row
const TBL_POP = 50;
const TBL_TARGET = 5;
type Dir = "h" | "v";

type DigitCell = { st: "" | "start" | "ok" | "dup" | "over" };

function TableTab() {
  const [grid, setGrid] = useState<number[][]>(() => genGrid());
  const [direction, setDirection] = useState<Dir>("h");
  const [startIdx, setStartIdx] = useState(-1);
  const [readPos, setReadPos] = useState(-1);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [cellStates, setCellStates] = useState<DigitCell[][]>(() => emptyStates());
  const [status, setStatus] = useState<{ tone: "idle" | "ok" | "bad"; msg: string }>({ tone: "idle", msg: "시작 숫자를 클릭하세요!" });
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef<number | null>(null);
  // setInterval 콜백의 stale closure를 피하려고 최신값을 ref로 추적
  const readPosRef = useRef(-1);
  const drawnRef = useRef<number[]>([]);

  useEffect(() => () => {
    if (autoRef.current !== null) window.clearInterval(autoRef.current);
  }, []);

  const sequence = useMemo(() => buildSequence(direction), [direction]);
  const done = drawn.length >= TBL_TARGET;
  const locked = startIdx >= 0;

  function pickStart(r: number, dc: number) {
    if (locked) return;
    const idx = sequence.findIndex((s) => s.r === r && s.dc === dc);
    if (idx < 0) return;
    setStartIdx(idx);
    readPosRef.current = idx;
    setReadPos(idx);
    setCellStates((prev) => {
      const next = prev.map((row) => row.slice());
      next[r][dc] = { st: "start" };
      return next;
    });
    setStatus({ tone: "idle", msg: `🎯 시작점: 행 ${r + 1}의 디지트 "${grid[r][dc]}"에서 출발 — "다음 수 읽기" 버튼을 누르세요` });
  }

  function readNextPair() {
    const rp = readPosRef.current;
    if (drawnRef.current.length >= TBL_TARGET || rp < 0) return;
    if (rp + 1 >= sequence.length) {
      setStatus({ tone: "bad", msg: "⚠️ 표 끝까지 도달했어요. 다시 시작하거나 시작점을 바꿔보세요." });
      stopAuto();
      return;
    }
    const a = sequence[rp];
    const b = sequence[rp + 1];
    const num = grid[a.r][a.dc] * 10 + grid[b.r][b.dc];

    const cur = drawnRef.current;
    let st: DigitCell["st"];
    if (num >= 1 && num <= TBL_POP) {
      if (cur.includes(num)) {
        st = "dup";
      } else {
        st = "ok";
        const nextDrawn = [...cur, num];
        drawnRef.current = nextDrawn;
        setDrawn(nextDrawn);
      }
    } else {
      st = "over";
    }

    setCellStates((prev) => {
      const next = prev.map((row) => row.slice());
      next[a.r][a.dc] = { st };
      next[b.r][b.dc] = { st };
      return next;
    });
    readPosRef.current = rp + 2;
    setReadPos(rp + 2);

    const ns = String(num).padStart(2, "0");
    if (st === "ok") {
      setStatus({ tone: "ok", msg: `✅ ${ns}번 채택! (${drawnRef.current.length}/${TBL_TARGET})` });
    } else if (st === "dup") {
      setStatus({ tone: "bad", msg: `⚠️ ${ns}번 → 이미 뽑힌 번호! 다음으로` });
    } else {
      setStatus({ tone: "bad", msg: `❌ ${ns}번 → 1~50 범위 밖! 다음으로` });
    }

    if (drawnRef.current.length >= TBL_TARGET) stopAuto();
  }

  function startAuto() {
    if (autoRef.current !== null || drawnRef.current.length >= TBL_TARGET || readPosRef.current < 0) return;
    setAutoRunning(true);
    readNextPair();
    autoRef.current = window.setInterval(() => {
      if (drawnRef.current.length >= TBL_TARGET) {
        stopAuto();
        return;
      }
      readNextPair();
    }, 650);
  }
  function stopAuto() {
    if (autoRef.current !== null) {
      window.clearInterval(autoRef.current);
      autoRef.current = null;
      setAutoRunning(false);
    }
  }

  function reset(regen: boolean) {
    stopAuto();
    if (regen) setGrid(genGrid());
    readPosRef.current = -1;
    drawnRef.current = [];
    setStartIdx(-1);
    setReadPos(-1);
    setDrawn([]);
    setCellStates(emptyStates());
    setStatus({ tone: "idle", msg: "시작 숫자를 클릭하세요!" });
  }

  function changeDir(d: Dir) {
    if (locked) return;
    setDirection(d);
  }

  const statusCls =
    status.tone === "ok" ? "border-emerald-500 bg-emerald-500/18 text-emerald-200"
    : status.tone === "bad" ? "border-rose-500 bg-rose-500/16 text-rose-200"
    : "border-indigo-400/35 bg-slate-900/65 text-slate-200";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-cyan-400/35 bg-slate-900/55 p-5 text-center">
        <p className="text-base leading-7 text-amber-100">
          📌 <b className="text-xl text-cyan-300">{TBL_POP}명</b>의 학생 중에서{" "}
          <b className="text-xl text-cyan-300">{TBL_TARGET}명</b>을 임의추출하기
        </p>
        <p className="mt-1 text-sm text-slate-300">→ 01~50 범위만 채택 · 중복은 제외 · 51 이상·00은 건너뛰기</p>
      </div>

      <div className="rounded-r-xl border-l-4 border-indigo-500 bg-indigo-500/10 px-5 py-3 text-sm leading-7 text-indigo-100">
        💡 <b className="text-amber-100">사용법</b>
        <br />① 방향(➡️ 가로 또는 ⬇️ 세로)을 먼저 선택
        <br />② 표에서 <b>시작 숫자</b>(어떤 칸의 십의자리 또는 일의자리)를 클릭
        <br />③ 그 숫자부터 정해진 방향으로 <b>두 자리씩 묶어</b> 표본 5명을 모아요
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <DirBtn active={direction === "h"} disabled={locked} onClick={() => changeDir("h")}>➡️ 가로 방향</DirBtn>
        <DirBtn active={direction === "v"} disabled={locked} onClick={() => changeDir("v")}>⬇️ 세로 방향</DirBtn>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        {/* 표 */}
        <div className="overflow-x-auto rounded-xl border-[3px] border-indigo-400/40 bg-slate-100 p-4 text-slate-900 shadow-[0_6px_22px_rgba(0,0,0,0.35)]">
          <p className="mb-2 text-right text-xs font-extrabold tracking-[0.15em] text-slate-500">난 수 표</p>
          <table className="mx-auto border-separate border-spacing-x-2 border-spacing-y-1 font-mono">
            <tbody>
              {Array.from({ length: TBL_ROWS }).map((_, r) => (
                <tr key={r}>
                  {Array.from({ length: TBL_CELLS }).map((_, cc) => {
                    const dc1 = cc * 2, dc2 = cc * 2 + 1;
                    return (
                      <td key={cc} className="p-0">
                        <span className="inline-flex gap-0.5 rounded-md bg-indigo-500/[0.06] p-0.5">
                          <DigitBtn r={r} dc={dc1} digit={grid[r][dc1]} state={cellStates[r][dc1].st} onClick={pickStart} locked={locked} />
                          <DigitBtn r={r} dc={dc2} digit={grid[r][dc2]} state={cellStates[r][dc2].st} onClick={pickStart} locked={locked} />
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 사이드 */}
        <div className="space-y-3">
          <div className={`rounded-xl border-2 px-4 py-3 text-center text-base font-extrabold ${statusCls}`}>
            {status.msg}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <ActionBtn tone="cyan" onClick={readNextPair} disabled={!locked || done}>▶️ 다음 수 읽기</ActionBtn>
            <ActionBtn tone="sec" onClick={startAuto} disabled={!locked || done || autoRunning}>⚡ 자동 진행</ActionBtn>
            <ActionBtn tone="sec" onClick={() => reset(true)}>🔄 다시 시작</ActionBtn>
          </div>

          <div className="rounded-xl border-2 border-emerald-400/35 bg-slate-900/55 p-4">
            <p className="text-center text-sm font-extrabold text-emerald-300">🏆 뽑힌 번호 ({drawn.length}/{TBL_TARGET})</p>
            {drawn.length === 0 ? (
              <p className="my-5 text-center text-sm text-slate-500">아직 뽑힌 번호가 없어요</p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {drawn.map((n, i) => (
                  <div key={i} className="animate-[popRes_0.4s_ease] rounded-xl border-2 border-emerald-500 bg-emerald-400/15 px-2 py-2 text-center font-mono text-xl font-black text-amber-100">
                    {String(n).padStart(2, "0")}
                  </div>
                ))}
              </div>
            )}
            {done ? (
              <div className="mt-3 animate-[popRes_0.4s_ease] rounded-xl border-2 border-emerald-400 bg-emerald-400/18 px-4 py-3 text-center text-base font-extrabold text-emerald-200">
                🎉 5명 표본 추출 완료!
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function genGrid(): number[][] {
  return Array.from({ length: TBL_ROWS }, () =>
    Array.from({ length: TBL_DCOLS }, () => Math.floor(Math.random() * 10))
  );
}
function emptyStates(): DigitCell[][] {
  return Array.from({ length: TBL_ROWS }, () =>
    Array.from({ length: TBL_DCOLS }, () => ({ st: "" as const }))
  );
}
function buildSequence(dir: Dir): { r: number; dc: number }[] {
  const seq: { r: number; dc: number }[] = [];
  if (dir === "h") {
    for (let r = 0; r < TBL_ROWS; r++) for (let dc = 0; dc < TBL_DCOLS; dc++) seq.push({ r, dc });
  } else {
    for (let dc = 0; dc < TBL_DCOLS; dc++) for (let r = 0; r < TBL_ROWS; r++) seq.push({ r, dc });
  }
  return seq;
}

function DigitBtn({
  r, dc, digit, state, onClick, locked,
}: {
  r: number; dc: number; digit: number;
  state: DigitCell["st"];
  onClick: (r: number, dc: number) => void;
  locked: boolean;
}) {
  const cls =
    state === "start" ? "bg-yellow-300 text-amber-950 shadow-[inset_0_0_0_2px_#a16207]"
    : state === "ok" ? "bg-emerald-600 text-white shadow-[inset_0_0_0_2px_#065f46]"
    : state === "dup" ? "bg-amber-400 text-amber-950 shadow-[inset_0_0_0_2px_#a16207]"
    : state === "over" ? "bg-rose-600 text-white shadow-[inset_0_0_0_2px_#9f1239]"
    : locked ? "text-slate-800"
    : "text-slate-800 cursor-pointer hover:scale-110 hover:bg-indigo-500/[0.18]";
  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onClick(r, dc)}
      className={`inline-block w-9 select-none appearance-none rounded border-0 px-0 py-1.5 text-center text-xl font-black transition ${cls}`}
    >
      {digit}
    </button>
  );
}

function DirBtn({ active, disabled, onClick, children }: { active: boolean; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        active
          ? "rounded-xl border-2 border-cyan-400 bg-cyan-400/30 px-4 py-2 text-sm font-extrabold text-white shadow-[0_0_18px_rgba(34,211,238,0.4)]"
          : "rounded-xl border-2 border-cyan-400/40 bg-cyan-400/[0.08] px-4 py-2 text-sm font-extrabold text-cyan-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
      }
    >
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════
// 탭 4: 엑셀
// ═════════════════════════════════════════════════════════

const EX_COLS = ["A", "B", "C", "D", "E"] as const;
const EX_ROWS = 15;
const EX_TARGET = 10;
const EX_POP = 500;

type Cell = { value: number; formula: string };
type Cells = Record<string, Cell>;

function ExcelTab() {
  const [cells, setCells] = useState<Cells>({});
  const [selected, setSelected] = useState<string>("A1");
  const [input, setInput] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [highlightCells, setHighlightCells] = useState<Set<string>>(new Set());
  const typingRef = useRef<number | null>(null);
  const fillRef = useRef<number | null>(null);
  const toastRef = useRef<number | null>(null);
  const highlightRef = useRef<Map<string, number>>(new Map());

  useEffect(() => () => {
    if (typingRef.current !== null) window.clearInterval(typingRef.current);
    if (fillRef.current !== null) window.clearInterval(fillRef.current);
    if (toastRef.current !== null) window.clearTimeout(toastRef.current);
    highlightRef.current.forEach((id) => window.clearTimeout(id));
  }, []);

  function selectCell(k: string) {
    setSelected(k);
    const c = cells[k];
    setInput(c ? c.formula || String(c.value) : "");
  }

  function show(msg: string) {
    setToast(msg);
    if (toastRef.current !== null) window.clearTimeout(toastRef.current);
    toastRef.current = window.setTimeout(() => setToast(null), 2400);
  }

  function flashHighlight(k: string) {
    setHighlightCells((prev) => new Set(prev).add(k));
    const prev = highlightRef.current.get(k);
    if (prev !== undefined) window.clearTimeout(prev);
    const id = window.setTimeout(() => {
      setHighlightCells((s) => {
        const n = new Set(s);
        n.delete(k);
        return n;
      });
      highlightRef.current.delete(k);
    }, 500);
    highlightRef.current.set(k, id);
  }

  function evalAndSet(k: string, raw: string) {
    const f = raw.trim();
    if (!f) {
      setCells((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
      return;
    }
    if (/^=randbetween/i.test(f)) {
      const m = f.match(/=RANDBETWEEN\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/i);
      if (m) {
        const lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
        const v = Math.floor(Math.random() * (hi - lo + 1)) + lo;
        setCells((prev) => ({ ...prev, [k]: { value: v, formula: f } }));
        flashHighlight(k);
        show(`✅ ${k}에 수식 입력! 결과: ${v}`);
        return;
      }
      show("⚠️ 수식 형식을 확인해 주세요: =RANDBETWEEN(1,500)");
      return;
    }
    if (!Number.isNaN(Number(f))) {
      setCells((prev) => ({ ...prev, [k]: { value: Number(f), formula: "" } }));
      flashHighlight(k);
      return;
    }
    show("⚠️ 수식 형식을 확인해 주세요: =RANDBETWEEN(1,500)");
  }

  function btnFormula() {
    selectCell("A1");
    const text = "=RANDBETWEEN(1,500)";
    let i = 0;
    setInput("");
    if (typingRef.current !== null) window.clearInterval(typingRef.current);
    typingRef.current = window.setInterval(() => {
      i += 1;
      setInput(text.slice(0, i));
      if (i >= text.length) {
        if (typingRef.current !== null) window.clearInterval(typingRef.current);
        typingRef.current = null;
        window.setTimeout(() => evalAndSet("A1", text), 220);
      }
    }, 40);
  }

  function btnFill() {
    const cur = cells[selected];
    if (!cur || !cur.formula) {
      show("⚠️ 먼저 A1에 수식을 입력해 주세요!");
      return;
    }
    const m = /^([A-E])(\d+)$/.exec(selected);
    if (!m) return;
    const col = m[1] as typeof EX_COLS[number];
    const startRow = parseInt(m[2], 10);
    const endRow = startRow + (EX_TARGET - 1);
    let i = startRow + 1;
    if (fillRef.current !== null) window.clearInterval(fillRef.current);
    fillRef.current = window.setInterval(() => {
      if (i > endRow) {
        if (fillRef.current !== null) window.clearInterval(fillRef.current);
        fillRef.current = null;
        show(`✅ ${col}${startRow}~${col}${endRow}까지 자동 채우기 완료!`);
        return;
      }
      const k = `${col}${i}`;
      const m2 = cur.formula.match(/=RANDBETWEEN\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/i);
      if (m2) {
        const lo = parseInt(m2[1], 10), hi = parseInt(m2[2], 10);
        const v = Math.floor(Math.random() * (hi - lo + 1)) + lo;
        setCells((prev) => ({ ...prev, [k]: { value: v, formula: cur.formula } }));
        flashHighlight(k);
      }
      i += 1;
    }, 200);
  }

  function btnRecalc() {
    setCells((prev) => {
      const next: Cells = {};
      for (const [k, c] of Object.entries(prev)) {
        if (c.formula && /=randbetween/i.test(c.formula)) {
          const m = c.formula.match(/=RANDBETWEEN\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/i);
          if (m) {
            const lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
            next[k] = { value: Math.floor(Math.random() * (hi - lo + 1)) + lo, formula: c.formula };
            continue;
          }
        }
        next[k] = c;
      }
      return next;
    });
    show("🔄 모든 RANDBETWEEN 셀이 재계산됐어요!");
  }

  function btnReset() {
    if (fillRef.current !== null) { window.clearInterval(fillRef.current); fillRef.current = null; }
    if (typingRef.current !== null) { window.clearInterval(typingRef.current); typingRef.current = null; }
    setCells({});
    setSelected("A1");
    setInput("");
    show("🗑️ 새 워크시트로 초기화됐어요");
  }

  // A1~A10 결과 집계
  const aVals: number[] = [];
  for (let r = 1; r <= EX_TARGET; r++) {
    const c = cells[`A${r}`];
    if (c && typeof c.value === "number") aVals.push(c.value);
  }
  const aSum = aVals.reduce((a, b) => a + b, 0);
  const aAvg = aVals.length > 0 ? aSum / aVals.length : 0;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-emerald-400/35 bg-slate-900/55 p-4 text-center">
        <p className="text-base leading-7 text-amber-100">
          📌 어느 전시회에 입장한 <b className="text-xl text-emerald-300">{EX_POP}명</b>의 관객 중에서{" "}
          <b className="text-xl text-emerald-300">{EX_TARGET}명</b>을 임의추출하기
        </p>
      </div>

      <div className="rounded-r-xl border-l-4 border-emerald-500 bg-emerald-500/[0.08] px-5 py-3 text-sm leading-8 text-emerald-100">
        <Step n={1} /> 셀 <b className="text-amber-100">A1</b>을 클릭한다.
        <br />
        <Step n={2} /> 수식 입력줄에 <b className="text-amber-100">=RANDBETWEEN(1,500)</b> 을 입력하고 Enter (또는 <b>‘수식 입력’</b> 버튼)
        <br />
        <Step n={3} /> <b>‘자동 채우기’</b> 버튼으로 A10까지 채워요
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <ActionBtn tone="emerald" onClick={btnFormula}>📝 A1에 수식 입력</ActionBtn>
        <ActionBtn tone="amber" onClick={btnFill}>⬇️ A10까지 자동 채우기</ActionBtn>
        <ActionBtn tone="sec" onClick={btnRecalc}>🔄 F9 (재계산)</ActionBtn>
        <ActionBtn tone="sec" onClick={btnReset}>🗑️ 새 워크시트</ActionBtn>
      </div>

      {/* Excel UI */}
      <div className="overflow-hidden rounded-lg border border-slate-400 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3 bg-emerald-700 px-4 py-2 text-white">
          <span className="text-lg">📊</span>
          <span className="text-sm font-bold">Microsoft Excel - 임의추출.xlsx</span>
          <div className="ml-auto flex gap-0 text-xs font-bold">
            <span className="rounded-t-sm bg-white px-3 py-1 text-emerald-700">홈</span>
            <span className="rounded-t-sm bg-white/15 px-3 py-1">삽입</span>
            <span className="rounded-t-sm bg-white/15 px-3 py-1">수식</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 border-b border-slate-300 bg-white px-3 py-1.5">
          <div className="min-w-[62px] rounded-sm border border-slate-400 bg-slate-100 px-3 py-1 text-center text-sm font-semibold text-slate-900">
            {selected}
          </div>
          <span className="px-1 text-base italic text-slate-500">𝑓𝑥</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); evalAndSet(selected, input); } }}
            placeholder="셀을 선택하고 수식을 입력하세요"
            className="flex-1 border border-slate-300 bg-white px-2 py-1 text-base text-slate-900 outline-none focus:border-emerald-600 focus-visible:ring-1 focus-visible:ring-emerald-600/50"
          />
        </div>
        <div className="max-h-[420px] overflow-auto bg-white">
          <table className="border-collapse text-sm text-slate-900">
            <thead>
              <tr>
                <th aria-label="행 번호" className="sticky left-0 top-0 z-20 w-10 border border-slate-300 bg-slate-100 px-1 py-0.5 font-semibold text-slate-600" />
                {EX_COLS.map((c) => (
                  <th key={c} className="sticky top-0 z-10 min-w-[78px] border border-slate-300 bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: EX_ROWS }, (_, i) => i + 1).map((r) => (
                <tr key={r}>
                  <td className="sticky left-0 z-10 w-10 border border-slate-300 bg-slate-100 px-1 py-0.5 text-center font-semibold text-slate-600">
                    {r}
                  </td>
                  {EX_COLS.map((c) => {
                    const k = `${c}${r}`;
                    const isSel = k === selected;
                    const hi = highlightCells.has(k);
                    const cls = isSel
                      ? "border-2 border-emerald-700 bg-white shadow-[inset_0_0_0_1px_#217346]"
                      : "border border-slate-300 bg-white";
                    const hiCls = hi ? "animate-[exHighlight_0.5s_ease]" : "";
                    return (
                      <td
                        key={c}
                        onClick={() => selectCell(k)}
                        className={`h-6 min-w-[78px] cursor-cell px-1.5 text-right font-mono tabular-nums ${cls} ${hiCls}`}
                      >
                        {cells[k]?.value ?? ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-slate-300 bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
          <span>준비</span>
          <span className="font-bold text-emerald-700">
            평균: {aVals.length ? aAvg.toFixed(1) : "—"} &nbsp;|&nbsp; 개수: {aVals.length} &nbsp;|&nbsp; 합계: {aSum}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-emerald-400/35 bg-slate-900/55 p-4">
        <p className="text-center text-base font-extrabold text-emerald-200">🏆 추출된 표본 (셀 A1 ~ A10)</p>
        {aVals.length === 0 ? (
          <p className="my-5 text-center text-sm text-slate-500">아직 데이터가 없어요. 위에서 수식을 입력해 보세요!</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {aVals.map((v, i) => (
              <div key={i} className="animate-[popRes_0.4s_ease] rounded-xl border-2 border-emerald-500 bg-emerald-400/15 px-2 py-2 text-center font-mono text-xl font-black text-amber-100">
                {v}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[999] -translate-x-1/2 animate-[slideUp_0.35s_ease] rounded-xl border-2 border-amber-400 bg-slate-900/95 px-5 py-3 text-base font-extrabold text-amber-100 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-extrabold text-slate-900">
      {n}
    </span>
  );
}

// ═════════════════════════════════════════════════════════
// 공용 컴포넌트
// ═════════════════════════════════════════════════════════

function RangeRow({
  label, suffix, value, min, max, step, onChange, tone,
}: {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  tone: "amber" | "violet" | "cyan" | "emerald";
}) {
  const id = useId();
  const accent =
    tone === "amber" ? "accent-amber-500"
    : tone === "violet" ? "accent-violet-500"
    : tone === "cyan" ? "accent-cyan-500"
    : "accent-emerald-500";
  return (
    <div className="flex min-w-[210px] flex-col items-center gap-1.5">
      <label htmlFor={id} className="text-sm font-extrabold text-indigo-200">
        {label}: <span key={value} className="animate-[pulseR_0.3s_ease] font-mono text-2xl font-black text-amber-300">{value}</span>{suffix}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-1.5 w-full cursor-pointer rounded-full ${accent} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40`}
      />
    </div>
  );
}

function ActionBtn({
  tone, onClick, disabled = false, children,
}: { tone: "amber" | "violet" | "cyan" | "emerald" | "sec"; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  const cls =
    tone === "amber" ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 shadow-[0_4px_14px_rgba(251,191,36,0.4)]"
    : tone === "violet" ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-[0_4px_14px_rgba(168,85,247,0.4)]"
    : tone === "cyan" ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_4px_14px_rgba(34,211,238,0.4)]"
    : tone === "emerald" ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.4)]"
    : "border-2 border-indigo-400/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition hover:brightness-110 disabled:cursor-default disabled:opacity-40 disabled:shadow-none ${cls}`}
    >
      {children}
    </button>
  );
}
