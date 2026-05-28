"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🚪 몬티홀 시뮬레이터  (3 tabs)
   1) 🎯 기본 (3문 / 1차)
   2) 🔢 확장 (n문 / k차, n=3~10, k=1~n-2)
   3) 📐 수학적 원리 (단계별 빈칸 + 확장 공식 유도)
   ────────────────────────────────────────────────────────────── */

// ============================================================
// 공통 유틸 / 컴포넌트
// ============================================================

function ri(n: number): number {
  return Math.floor(Math.random() * n);
}
function fmtP(v: number, d = 1): string {
  return `${(v * 100).toFixed(d)}%`;
}

// 한 라운드 시뮬: 결과는 승리(true)/패배(false)
function runOne(numDoors: number, numCars: number, switchStrategy: boolean): boolean {
  const cars = new Set<number>();
  while (cars.size < numCars) cars.add(ri(numDoors));
  const choice = ri(numDoors);
  let reveal = -1;
  for (let j = 0; j < numDoors; j++) {
    if (!cars.has(j) && j !== choice) { reveal = j; break; }
  }
  if (reveal < 0) return cars.has(choice);
  let final = choice;
  if (switchStrategy) {
    const cands: number[] = [];
    for (let j = 0; j < numDoors; j++) {
      if (j !== choice && j !== reveal) cands.push(j);
    }
    final = cands[ri(cands.length)];
  }
  return cars.has(final);
}

// 이론값 — 유지 / 교체
function theory(n: number, k: number): { stay: number; sw: number } {
  return { stay: k / n, sw: (k * (n - 1)) / (n * (n - 2)) };
}

// ============================================================
// 문 SVG (이모지 기반, PNG 자산 의존 제거)
// ============================================================

type DoorState = {
  index: number;
  isCar: boolean;
  open: boolean;       // 공개됨(염소 노출 or 최종 결과 노출)
  chosen: boolean;     // 현재 사용자 선택 표시
  final: boolean;      // 최종 선택 (phase 2)
  isRevealed: boolean; // 몬티가 연 문
  showAll: boolean;    // 모든 문 공개(phase 2)
  width: number;
  height: number;
  fontSize: number;
  onClick?: () => void;
};

function Door({ index, isCar, open, chosen, final, isRevealed, showAll, width, height, fontSize, onClick }: DoorState) {
  // viewBox 좌표(100×145) 안에서 그리고, 컨테이너가 픽셀 폭/높이를 결정.
  // 호출부에서 width:height ≈ 100:145 비율 유지하므로 default preserveAspectRatio (왜곡 없음).
  const VBW = 100;
  const VBH = 145;
  const uid = useId();
  const gradClosedId = `door-c-${uid}`;
  const gradOpenId = `door-o-${uid}`;

  const borderTone = final
    ? "ring-2 ring-amber-300 outline outline-2 outline-amber-400 rounded-t-lg"
    : chosen
    ? "ring-2 ring-emerald-300 outline outline-2 outline-emerald-400 rounded-t-lg"
    : "";
  const cursorCls = onClick ? "cursor-pointer hover:-translate-y-1 hover:scale-105 transition" : "";

  const knobR = 4.5;
  const knobCx = 88;
  const knobCy = VBH / 2;

  const emojiFs = Math.round(VBW * 0.5);
  const badgeY = final ? VBH - 24 : VBH - 12;
  const finalY = showAll ? VBH - 28 : VBH - 12;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        onClick={onClick}
        className={`block ${cursorCls} ${borderTone}`}
        aria-label={onClick ? `문 ${index + 1} 선택` : undefined}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${VBW} ${VBH}`}
          className="block drop-shadow-[2px_4px_8px_rgba(0,0,0,0.35)]"
          aria-label={open ? (isCar ? "자동차 문" : "염소 문") : `문 ${index + 1}`}
        >
          <defs>
            <linearGradient id={gradClosedId} x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#c8932a" />
              <stop offset="100%" stopColor="#7a4a10" />
            </linearGradient>
            <linearGradient id={gradOpenId} x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#f8f0e3" />
              <stop offset="100%" stopColor="#e8d5b0" />
            </linearGradient>
          </defs>
          {/* 문판 (둥근 윗모서리) */}
          <rect
            x={1.5} y={1.5} width={VBW - 3} height={VBH - 3}
            rx={6} ry={6}
            fill={`url(#${open ? gradOpenId : gradClosedId})`}
            stroke="#5c3409"
            strokeWidth={2}
          />
          {/* 내부 테두리 */}
          <rect x={5} y={5} width={VBW - 10} height={VBH - 10} rx={4} ry={4} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

          {/* 닫혔을 때: 번호 + 손잡이 */}
          {!open ? (
            <>
              <text
                x={VBW / 2} y={VBH / 2}
                textAnchor="middle" dominantBaseline="central"
                fontWeight={900} fontSize={fontSize}
                fill="rgba(255,255,255,0.25)"
              >
                {index + 1}
              </text>
              <circle cx={knobCx} cy={knobCy} r={knobR} fill="#e8b87a" stroke="#7a4a10" strokeWidth={1.2} />
            </>
          ) : null}

          {/* 열렸을 때: 이모지 (SVG text — viewBox 비율 유지로 왜곡 없음) */}
          {open ? (
            <text
              x={VBW / 2} y={VBH / 2}
              textAnchor="middle" dominantBaseline="central"
              fontSize={emojiFs}
            >
              {isCar ? "🚗" : "🐐"}
            </text>
          ) : null}

          {/* 배지 (몬티 공개 / 최종 결과) */}
          {(showAll || (isRevealed && open)) ? (
            <g>
              <rect
                x={VBW / 2 - 12} y={badgeY - 7} width={24} height={11}
                rx={5} ry={5}
                fill={isCar && !isRevealed ? "#d3f9d8" : "#ffe8cc"}
                stroke={isCar && !isRevealed ? "#1e6e32" : "#b34700"}
                strokeWidth={0.6}
              />
              <text
                x={VBW / 2} y={badgeY - 1}
                textAnchor="middle" dominantBaseline="central"
                fontSize={8} fontWeight={800}
                fill={isCar && !isRevealed ? "#1e6e32" : "#b34700"}
              >
                {isCar && !isRevealed ? "🚗" : "🐐"}
              </text>
            </g>
          ) : null}

          {/* 최종 선택 화살표 */}
          {final ? (
            <g>
              <rect
                x={VBW / 2 - 10} y={finalY - 7} width={20} height={11}
                rx={5} ry={5}
                fill="#ffe066" stroke="#7a5800" strokeWidth={0.5}
              />
              <text
                x={VBW / 2} y={finalY - 1}
                textAnchor="middle" dominantBaseline="central"
                fontSize={8} fontWeight={800} fill="#7a5800"
              >
                👉
              </text>
            </g>
          ) : null}
        </svg>
      </div>
      <div className="rounded-full bg-slate-800/80 px-2 py-px text-[11px] font-bold text-slate-200">
        문 {index + 1}
      </div>
    </div>
  );
}

// ============================================================
// 게임 패널 (Tab 1·2 공용 핵심 로직)
// ============================================================

type GameStats = { sWin: number; sTot: number; wWin: number; wTot: number };
const EMPTY_STATS: GameStats = { sWin: 0, sTot: 0, wWin: 0, wTot: 0 };

type Phase = 0 | 1 | 2; // 0=문 선택 / 1=몬티 공개 후 / 2=결과

function initialCars(numDoors: number, numCars: number): number[] {
  const arr: number[] = [];
  while (arr.length < numCars) {
    const c = ri(numDoors);
    if (!arr.includes(c)) arr.push(c);
  }
  return arr;
}

function useMontyGame(numDoors: number, numCars: number) {
  const [phase, setPhase] = useState<Phase>(0);
  const [cars, setCars] = useState<number[]>(() => initialCars(numDoors, numCars));
  const [chosen, setChosen] = useState<number>(-1);
  const [reveal, setReveal] = useState<number>(-1);
  const [didSwitch, setDidSwitch] = useState<boolean>(false);
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);

  // 한 판 다시 시작 (numDoors/numCars 변경은 부모에서 key remount 로 처리)
  const reset = useCallback(() => {
    setCars(initialCars(numDoors, numCars));
    setChosen(-1);
    setReveal(-1);
    setDidSwitch(false);
    setPhase(0);
  }, [numDoors, numCars]);

  function choose(i: number) {
    if (phase !== 0) return;
    let rev = -1;
    for (let j = 0; j < numDoors; j++) {
      if (!cars.includes(j) && j !== i) { rev = j; break; }
    }
    if (rev < 0) { reset(); return; }
    setChosen(i);
    setReveal(rev);
    setPhase(1);
  }

  function decide(sw: boolean) {
    if (phase !== 1) return;
    let finalChoice = chosen;
    if (sw) {
      const cands: number[] = [];
      for (let j = 0; j < numDoors; j++) {
        if (j !== chosen && j !== reveal) cands.push(j);
      }
      finalChoice = cands[ri(cands.length)];
    }
    const won = cars.includes(finalChoice);
    setChosen(finalChoice);
    setDidSwitch(sw);
    setPhase(2);
    setStats((p) => {
      if (sw) return { ...p, wTot: p.wTot + 1, wWin: p.wWin + (won ? 1 : 0) };
      return { ...p, sTot: p.sTot + 1, sWin: p.sWin + (won ? 1 : 0) };
    });
  }

  function batch(n: number, sw: boolean) {
    let wins = 0;
    for (let i = 0; i < n; i++) if (runOne(numDoors, numCars, sw)) wins++;
    setStats((p) => sw
      ? { ...p, wTot: p.wTot + n, wWin: p.wWin + wins }
      : { ...p, sTot: p.sTot + n, sWin: p.sWin + wins });
  }

  // 자동 시뮬에서 이미 시행한 결과를 통계에만 합산 (중복 시행 회피).
  function addStats(wins: number, total: number, sw: boolean) {
    setStats((p) => sw
      ? { ...p, wTot: p.wTot + total, wWin: p.wWin + wins }
      : { ...p, sTot: p.sTot + total, sWin: p.sWin + wins });
  }

  function clearStats() {
    setStats(EMPTY_STATS);
  }

  return { phase, cars, chosen, reveal, didSwitch, stats, choose, decide, reset, batch, addStats, clearStats };
}

function getDoorDim(n: number): { w: number; h: number; fs: number } {
  // 행의 가용 폭(약 700px) 기준 분배
  const avail = 700 - (n - 1) * 8;
  const w = Math.min(140, Math.max(50, Math.floor(avail / n)));
  const h = Math.round(w * 1.45);
  const fs = Math.max(12, Math.min(38, Math.round(w * 0.3)));
  return { w, h, fs };
}

function GamePanel({
  numDoors, numCars, tabKey, theoryStay, theorySw,
}: {
  numDoors: number; numCars: number; tabKey: "b" | "e";
  theoryStay: number; theorySw: number;
}) {
  const game = useMontyGame(numDoors, numCars);
  const dim = getDoorDim(numDoors);

  // 자동 시뮬레이션 상태
  const [autoData, setAutoData] = useState<{ stay: { n: number; r: number }[]; sw: { n: number; r: number }[] }>({ stay: [], sw: [] });
  const [running, setRunning] = useState<"stay" | "sw" | null>(null);
  const runningRef = useRef<"stay" | "sw" | null>(null);
  useEffect(() => { runningRef.current = running; }, [running]);
  const autoStateRef = useRef({ wins: 0, total: 0 });

  const AUTO_MAX = 500;
  const AUTO_BATCH = 10;
  const AUTO_MS = 55;

  useEffect(() => {
    if (!running) return;
    const sw = running === "sw";
    const tick = window.setInterval(() => {
      let batchWins = 0;
      let cnt = 0;
      for (let i = 0; i < AUTO_BATCH && autoStateRef.current.total < AUTO_MAX; i++) {
        const won = runOne(numDoors, numCars, sw);
        if (won) { batchWins++; autoStateRef.current.wins++; }
        autoStateRef.current.total++;
        cnt++;
      }
      if (cnt === 0) {
        setRunning(null);
        return;
      }
      const w = autoStateRef.current.wins;
      const g = autoStateRef.current.total;
      const newPoint = { n: g, r: w / g };
      setAutoData((prev) => {
        const key = sw ? "sw" : "stay";
        const arr = prev[key];
        const updated = (g <= 100 || g % 5 === 0) ? [...arr, newPoint] : arr;
        return { ...prev, [key]: updated };
      });
      // 이미 시행한 결과만 통계에 합산 (중복 시행 회피).
      game.addStats(batchWins, cnt, sw);
      if (autoStateRef.current.total >= AUTO_MAX) setRunning(null);
    }, AUTO_MS);
    return () => { window.clearInterval(tick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, numDoors, numCars]);

  function startAuto(sw: boolean) {
    stopAuto();
    autoStateRef.current = { wins: 0, total: 0 };
    setAutoData((prev) => ({ ...prev, [sw ? "sw" : "stay"]: [] }));
    setRunning(sw ? "sw" : "stay");
  }
  function stopAuto() {
    setRunning(null);
    runningRef.current = null;
  }
  // numDoors/numCars 변경 시에는 부모(ExtendedTab) 에서 key 로 remount → 별도 effect 불필요.

  const sp = game.stats.sTot > 0 ? (game.stats.sWin / game.stats.sTot) * 100 : 0;
  const wp = game.stats.wTot > 0 ? (game.stats.wWin / game.stats.wTot) * 100 : 0;

  let phaseText: string;
  if (game.phase === 0) phaseText = "아래 문 중 하나를 선택하세요 🚪";
  else if (game.phase === 1) phaseText = `문 ${game.reveal + 1}에 염소가 있네요! — 문 ${game.chosen + 1}을(를) 유지할까요, 교체할까요?`;
  else {
    const carList = game.cars.map((c) => `문 ${c + 1}`).join(", ");
    phaseText = `자동차는 ${carList}에 있었어요!`;
  }

  const won = game.phase === 2 && game.cars.includes(game.chosen);

  return (
    <div className="space-y-3">
      {/* 이론값 배너 (Tab 1만 — Tab 2는 외부에서 표시) */}
      {tabKey === "b" ? (
        <div className="rounded-lg border border-amber-300/50 bg-amber-300/[0.08] px-4 py-2 text-center text-sm text-amber-200">
          📐 이론값 &nbsp;|&nbsp; <strong>유지</strong> = 1/3 ≈ 33.3% &nbsp;&nbsp; <strong>교체</strong> = 2/3 ≈ 66.7%
        </div>
      ) : null}

      {/* Phase 라벨 */}
      <div className="flex min-h-[36px] items-center justify-center rounded-lg bg-cyan-400/15 px-3 py-2 text-center text-sm font-bold text-cyan-200">
        {phaseText}
      </div>

      {/* 문 행 */}
      <div className="flex flex-wrap justify-center gap-2.5">
        {Array.from({ length: numDoors }, (_, i) => {
          const isCar = game.cars.includes(i);
          const open = game.phase === 2 || (game.phase === 1 && i === game.reveal);
          const chosenNow = game.phase < 2 && i === game.chosen;
          const fin = game.phase === 2 && i === game.chosen;
          const onClick = game.phase === 0 ? () => game.choose(i) : undefined;
          return (
            <Door
              key={i}
              index={i}
              isCar={isCar}
              open={open}
              chosen={chosenNow}
              final={fin}
              isRevealed={i === game.reveal}
              showAll={game.phase === 2}
              width={dim.w}
              height={dim.h}
              fontSize={dim.fs}
              onClick={onClick}
            />
          );
        })}
      </div>

      {/* 액션 버튼 */}
      <div className="flex min-h-[48px] flex-wrap items-center justify-center gap-2">
        {game.phase === 1 ? (
          <>
            <button
              type="button"
              onClick={() => game.decide(false)}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              ✋ 유지하기
            </button>
            <button
              type="button"
              onClick={() => game.decide(true)}
              className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              🔄 교체하기
            </button>
          </>
        ) : null}
        {game.phase === 2 ? (
          <button
            type="button"
            onClick={() => game.reset()}
            className="rounded-xl bg-slate-700 px-6 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-slate-600"
          >
            🔁 다시 하기
          </button>
        ) : null}
      </div>

      {/* 결과 배너 */}
      {game.phase === 2 ? (
        <div
          className={`rounded-xl border-2 px-4 py-3 text-center text-base font-bold animate-[fadein_0.3s_ease] ${
            won
              ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-200"
              : "border-red-400/55 bg-red-400/15 text-red-200"
          }`}
        >
          {(game.didSwitch ? "교체" : "유지") + " 전략 — " + (won ? "🎉 자동차를 얻었어요!" : "🐐 아쉽게도 염소네요!")}
        </div>
      ) : null}

      {/* 하단 패널: 통계·일괄 (좌) + 자동 그래프 (우) */}
      <div className="grid gap-3 md:grid-cols-[1fr_320px]">
        {/* 좌측 */}
        <div className="space-y-3">
          <section className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">📊 누적 통계</div>
            <StatRow label="유지" gradFrom="#93c5fd" gradTo="#3b82f6" pct={sp} markerPct={theoryStay * 100} text={`${game.stats.sWin}승 / ${game.stats.sTot}회 (${sp.toFixed(1)}%)`} labelTone="text-blue-300" />
            <StatRow label="교체" gradFrom="#fda4af" gradTo="#f43f5e" pct={wp} markerPct={theorySw * 100} text={`${game.stats.wWin}승 / ${game.stats.wTot}회 (${wp.toFixed(1)}%)`} labelTone="text-rose-300" />
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">⚡ 일괄 시뮬레이션</div>
            <BatchRow label="유지" tone="blue" onClick={(n) => game.batch(n, false)} />
            <BatchRow label="교체" tone="rose" onClick={(n) => game.batch(n, true)} />
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => { game.clearStats(); setAutoData({ stay: [], sw: [] }); stopAuto(); }}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
              >
                ↺ 전체 초기화
              </button>
            </div>
          </section>
        </div>

        {/* 우측: 자동 시뮬 그래프 */}
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">📈 실시간 수렴 그래프</div>
            {running ? <span className="text-[10px] text-amber-300">시뮬레이션 중…</span> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => startAuto(false)}
              disabled={running !== null}
              className="rounded-md border border-blue-400/40 bg-blue-400/15 px-2.5 py-1 text-[11px] font-bold text-blue-200 transition hover:bg-blue-400/30 disabled:opacity-40"
            >
              ▶ 유지 자동 시뮬
            </button>
            <button
              type="button"
              onClick={() => startAuto(true)}
              disabled={running !== null}
              className="rounded-md border border-rose-400/40 bg-rose-400/15 px-2.5 py-1 text-[11px] font-bold text-rose-200 transition hover:bg-rose-400/30 disabled:opacity-40"
            >
              ▶ 교체 자동 시뮬
            </button>
            {running ? (
              <button
                type="button"
                onClick={stopAuto}
                className="rounded-md border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition hover:bg-white/15"
              >
                ■ 정지
              </button>
            ) : null}
          </div>
          <ConvergencePlot data={autoData} theoryStay={theoryStay} theorySw={theorySw} />
          <div className="mt-1.5 flex flex-wrap justify-center gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="inline-block h-[3px] w-4 bg-blue-400" />유지 실험</span>
            <span className="flex items-center gap-1"><span className="inline-block h-[3px] w-4 bg-rose-400" />교체 실험</span>
            <span className="flex items-center gap-1"><span className="inline-block h-0 w-4 border-t-2 border-dashed border-blue-400" />유지 이론</span>
            <span className="flex items-center gap-1"><span className="inline-block h-0 w-4 border-t-2 border-dashed border-rose-400" />교체 이론</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatRow({
  label, gradFrom, gradTo, pct, markerPct, text, labelTone,
}: {
  label: string;
  gradFrom: string; gradTo: string;
  pct: number; markerPct: number; text: string; labelTone: string;
}) {
  const uid = useId();
  const gid = `bar-grad-${uid}`;
  const w = Math.min(pct, 100);
  const mw = Math.min(markerPct, 100);
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className={`w-8 text-center text-xs font-bold ${labelTone}`}>{label}</span>
      <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-white/[0.08]">
        <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={gradFrom} />
              <stop offset="100%" stopColor={gradTo} />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={w} height={24} fill={`url(#${gid})`} className="transition-all duration-500" />
          {/* 이론값 마커 */}
          <line x1={mw} x2={mw} y1={0} y2={24} stroke="rgba(255,255,255,0.55)" strokeWidth={0.6} />
        </svg>
      </div>
      <span className="w-32 text-right font-mono text-[11px] text-slate-300">{text}</span>
    </div>
  );
}

function BatchRow({ label, tone, onClick }: { label: string; tone: "blue" | "rose"; onClick: (n: number) => void }) {
  const cls =
    tone === "blue"
      ? "border-blue-400/40 bg-blue-400/15 text-blue-200 hover:bg-blue-400/30"
      : "border-rose-400/40 bg-rose-400/15 text-rose-200 hover:bg-rose-400/30";
  const labelTone = tone === "blue" ? "text-blue-300" : "text-rose-300";
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className={`w-8 text-center text-xs font-bold ${labelTone}`}>{label}</span>
      <div className="flex flex-wrap gap-1">
        {[100, 1000, 10000].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onClick(n)}
            className={`rounded-md border px-2.5 py-1 text-[11px] font-bold transition ${cls}`}
          >
            {n.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConvergencePlot({
  data, theoryStay, theorySw,
}: {
  data: { stay: { n: number; r: number }[]; sw: { n: number; r: number }[] };
  theoryStay: number; theorySw: number;
}) {
  const W = 320;
  const H = 180;
  const PL = 36, PR = 10, PT = 10, PB = 22;
  const gW = W - PL - PR;
  const gH = H - PT - PB;

  const allPts = useMemo(() => [...data.stay, ...data.sw], [data]);
  const maxN = useMemo(() => {
    const m = allPts.length > 0 ? Math.max(...allPts.map((d) => d.n)) : 50;
    return Math.max(m, 50);
  }, [allPts]);

  function pointsPath(arr: { n: number; r: number }[]): string {
    if (arr.length < 2) return "";
    return arr
      .map((pt, i) => {
        const x = PL + (pt.n / maxN) * gW;
        const y = PT + gH * (1 - pt.r);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }
  const stayPath = pointsPath(data.stay);
  const swPath = pointsPath(data.sw);
  const yStay = PT + gH * (1 - theoryStay);
  const ySw = PT + gH * (1 - theorySw);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block w-full rounded-md bg-slate-950">
      {/* 격자 */}
      {[0, 0.25, 0.5, 0.75, 1].map((p) => {
        const y = PT + gH * (1 - p);
        return (
          <g key={p}>
            <line x1={PL} y1={y} x2={PL + gW} y2={y} stroke="rgba(100,116,139,0.15)" />
            <text x={PL - 3} y={y} fontSize={8} textAnchor="end" dominantBaseline="middle" fill="#94a3b8">
              {Math.round(p * 100)}%
            </text>
          </g>
        );
      })}
      {/* 축 */}
      <line x1={PL} y1={PT} x2={PL} y2={PT + gH} stroke="rgba(100,116,139,0.45)" />
      <line x1={PL} y1={PT + gH} x2={PL + gW} y2={PT + gH} stroke="rgba(100,116,139,0.45)" />
      {/* 이론값 점선 */}
      <line x1={PL} y1={yStay} x2={PL + gW} y2={yStay} stroke="#74c0fc" strokeDasharray="5 4" strokeWidth={1.5} opacity={0.7} />
      <line x1={PL} y1={ySw} x2={PL + gW} y2={ySw} stroke="#ff8787" strokeDasharray="5 4" strokeWidth={1.5} opacity={0.7} />
      {/* 실선 */}
      {stayPath ? <path d={stayPath} fill="none" stroke="#339af0" strokeWidth={2} /> : null}
      {swPath ? <path d={swPath} fill="none" stroke="#fa5252" strokeWidth={2} /> : null}
      {/* 마지막 점 + 라벨 */}
      {data.stay.length > 0 ? (
        <EndDot pt={data.stay[data.stay.length - 1]} color="#339af0" maxN={maxN} PL={PL} PT={PT} gW={gW} gH={gH} />
      ) : null}
      {data.sw.length > 0 ? (
        <EndDot pt={data.sw[data.sw.length - 1]} color="#fa5252" maxN={maxN} PL={PL} PT={PT} gW={gW} gH={gH} />
      ) : null}
      <text x={PL + gW / 2} y={H - 3} fontSize={9} textAnchor="middle" fill="#94a3b8">시뮬레이션 횟수 →</text>
    </svg>
  );
}

function EndDot({
  pt, color, maxN, PL, PT, gW, gH,
}: {
  pt: { n: number; r: number }; color: string; maxN: number;
  PL: number; PT: number; gW: number; gH: number;
}) {
  const x = PL + (pt.n / maxN) * gW;
  const y = PT + gH * (1 - pt.r);
  const anchor = x > PL + gW * 0.7 ? "end" : "start";
  const dx = x > PL + gW * 0.7 ? -7 : 7;
  return (
    <g>
      <circle cx={x} cy={y} r={4} fill={color} />
      <text x={x + dx} y={y - 6} fontSize={10} fontWeight={700} textAnchor={anchor} fill={color}>
        {(pt.r * 100).toFixed(1)}%
      </text>
    </g>
  );
}

// ============================================================
// 탭 1·2 래퍼
// ============================================================

function BasicTab() {
  const th = theory(3, 1);
  return (
    <GamePanel
      key="basic"
      numDoors={3} numCars={1}
      tabKey="b"
      theoryStay={th.stay} theorySw={th.sw}
    />
  );
}

function ExtendedTab() {
  const [n, setN] = useState(3);
  const [k, setK] = useState(1);
  const kMax = Math.max(1, n - 2);
  const safeK = Math.min(k, kMax);
  const th = theory(n, safeK);

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">문의 개수</span>
              <span className="font-mono text-lg font-bold text-cyan-300">{n}개</span>
            </div>
            <input
              type="range" min={3} max={10} value={n}
              onChange={(e) => {
                const v = Number(e.target.value);
                setN(v);
                if (k > v - 2) setK(Math.max(1, v - 2));
              }}
              aria-label="문 개수"
              className="w-full accent-cyan-400"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">자동차 개수</span>
              <span className="font-mono text-lg font-bold text-amber-300">{safeK}대</span>
            </div>
            <input
              type="range" min={1} max={kMax} value={safeK}
              onChange={(e) => setK(Number(e.target.value))}
              aria-label="자동차 개수"
              className="w-full accent-amber-400"
            />
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-amber-300/50 bg-amber-300/[0.08] px-4 py-2 text-center text-sm text-amber-200">
        📐 이론값 (문 {n}개, 자동차 {safeK}대) &nbsp;|&nbsp;{" "}
        <strong>유지</strong> = {safeK}/{n} ≈ {fmtP(th.stay, 1)} &nbsp;&nbsp;{" "}
        <strong>교체</strong> = {safeK}×{n - 1}/({n}×{n - 2}) ≈ {fmtP(th.sw, 1)}
      </div>

      <GamePanel
        key={`ext-${n}-${safeK}`}
        numDoors={n} numCars={safeK}
        tabKey="e"
        theoryStay={th.stay} theorySw={th.sw}
      />
    </div>
  );
}

// ============================================================
// 탭 3 — 수학적 원리 (Part 1·2 빈칸/MCQ)
// ============================================================

type BlankState = { value: string; status: "idle" | "ok" | "ng" };
const EMPTY_BLANK: BlankState = { value: "", status: "idle" };

function BlankInput({
  state, onChange, onCheck, width = "w-12", placeholder,
}: {
  state: BlankState;
  onChange: (v: string) => void;
  onCheck: () => void;
  width?: string;
  placeholder?: string;
}) {
  const borderTone =
    state.status === "ok" ? "border-emerald-400 bg-emerald-400/15 text-emerald-200"
    : state.status === "ng" ? "border-red-400 bg-red-400/15 text-red-200 animate-[shake_0.3s]"
    : "border-cyan-400/60 bg-cyan-400/[0.05] text-cyan-100";
  return (
    <input
      type="text"
      value={state.value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onCheck(); }}
      maxLength={3}
      placeholder={placeholder}
      aria-label="빈칸 답 입력"
      className={`rounded-md border-2 px-2 py-1 text-center font-mono text-sm font-bold outline-none transition focus:ring-2 focus:ring-cyan-300/40 ${width} ${borderTone}`}
    />
  );
}

function CheckBtn({ onClick, tone = "cyan" }: { onClick: () => void; tone?: "cyan" | "emerald" | "rose" }) {
  const cls =
    tone === "emerald" ? "bg-emerald-500 hover:bg-emerald-600"
    : tone === "rose" ? "bg-rose-500 hover:bg-rose-600"
    : "bg-cyan-500 hover:bg-cyan-600";
  return (
    <button type="button" onClick={onClick} className={`rounded-md ${cls} px-2.5 py-1 text-[11px] font-bold text-white transition`}>
      확인
    </button>
  );
}

function FbBadge({ status }: { status: "idle" | "ok" | "ng" }) {
  if (status === "ok") return <span className="text-xs font-bold text-emerald-400">✓ 정답!</span>;
  if (status === "ng") return <span className="text-xs font-bold text-red-400">✗ 다시 생각해 보세요</span>;
  return <span className="text-xs text-slate-500" />;
}

function PrincipleTab() {
  // Part 1 빈칸
  const [p1a, setP1a] = useState<BlankState>(EMPTY_BLANK);
  const [p1b, setP1b] = useState<BlankState>(EMPTY_BLANK);
  const [p3a, setP3a] = useState<BlankState>(EMPTY_BLANK);
  const [p3b, setP3b] = useState<BlankState>(EMPTY_BLANK);
  const [p3c, setP3c] = useState<BlankState>(EMPTY_BLANK);

  // Part 2 빈칸 (예시 5문 2차)
  const [e1a, setE1a] = useState<BlankState>(EMPTY_BLANK);
  const [e1b, setE1b] = useState<BlankState>(EMPTY_BLANK);
  const [e2a, setE2a] = useState<BlankState>(EMPTY_BLANK);
  const [e2b, setE2b] = useState<BlankState>(EMPTY_BLANK);
  const [e2c, setE2c] = useState<BlankState>(EMPTY_BLANK);
  const [e3a, setE3a] = useState<BlankState>(EMPTY_BLANK);
  const [e3b, setE3b] = useState<BlankState>(EMPTY_BLANK);
  const [e3c, setE3c] = useState<BlankState>(EMPTY_BLANK);
  const [e4a, setE4a] = useState<BlankState>(EMPTY_BLANK);
  const [e4b, setE4b] = useState<BlankState>(EMPTY_BLANK);
  const [e4c, setE4c] = useState<BlankState>(EMPTY_BLANK);
  const [e5a, setE5a] = useState<BlankState>(EMPTY_BLANK);
  const [e5b, setE5b] = useState<BlankState>(EMPTY_BLANK);
  const [e5c, setE5c] = useState<BlankState>(EMPTY_BLANK);

  function chk(state: BlankState, set: (s: BlankState) => void, answers: string[]) {
    const v = state.value.trim();
    const ok = answers.includes(v);
    set({ value: v, status: ok ? "ok" : "ng" });
    if (!ok) window.setTimeout(() => set({ value: v, status: "idle" }), 1200);
  }
  function chkPair(
    s1: BlankState, set1: (s: BlankState) => void, ans1: string,
    s2: BlankState, set2: (s: BlankState) => void, ans2: string,
  ) {
    const v1 = s1.value.trim(), v2 = s2.value.trim();
    const ok = v1 === ans1 && v2 === ans2;
    set1({ value: v1, status: v1 === ans1 ? "ok" : "ng" });
    set2({ value: v2, status: v2 === ans2 ? "ok" : "ng" });
    if (!ok) window.setTimeout(() => {
      if (v1 !== ans1) set1({ value: v1, status: "idle" });
      if (v2 !== ans2) set2({ value: v2, status: "idle" });
    }, 1200);
  }
  function reveal(blanks: { state: BlankState; set: (s: BlankState) => void; ans: string }[]) {
    blanks.forEach((b) => b.set({ value: b.ans, status: "ok" }));
  }

  return (
    <div className="space-y-4">
      <style>{`@keyframes shake {0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)}}`}</style>

      {/* PART 1 */}
      <section className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.05] p-4">
        <h4 className="border-b border-cyan-400/30 pb-2 text-sm font-bold text-cyan-300">
          Part 1. 기본 몬티홀 — 단계별 확률 계산 (문 3개, 자동차 1개)
        </h4>

        {/* STEP 1 */}
        <div className="mt-3 rounded-lg border-l-4 border-blue-400 bg-blue-400/[0.06] p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-300">STEP 1</div>
          <p className="text-sm font-bold text-slate-100">처음 선택의 확률</p>
          <p className="mt-1 text-xs text-slate-400">문이 3개이고 자동차는 1대입니다. 임의로 문 하나를 선택할 때 :</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-200">
            P(🚗) =
            <BlankInput state={p1a} onChange={(v) => setP1a({ value: v, status: "idle" })} onCheck={() => chk(p1a, setP1a, ["1"])} />
            / 3
            <CheckBtn onClick={() => chk(p1a, setP1a, ["1"])} />
            <FbBadge status={p1a.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-200">
            P(🐐) =
            <BlankInput state={p1b} onChange={(v) => setP1b({ value: v, status: "idle" })} onCheck={() => chk(p1b, setP1b, ["2"])} />
            / 3
            <CheckBtn onClick={() => chk(p1b, setP1b, ["2"])} />
            <FbBadge status={p1b.status} />
          </div>
          <button
            type="button"
            onClick={() => reveal([
              { state: p1a, set: setP1a, ans: "1" },
              { state: p1b, set: setP1b, ans: "2" },
            ])}
            className="mt-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/10"
          >
            정답 보기
          </button>
        </div>

        {/* STEP 2 */}
        <div className="mt-2 rounded-lg border-l-4 border-blue-400 bg-blue-400/[0.06] p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-300">STEP 2</div>
          <p className="text-sm font-bold text-slate-100">두 가지 경우로 나누어 분석</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-blue-300/40 bg-blue-400/[0.08] p-3 text-xs leading-7 text-slate-200">
              <h5 className="text-sm font-black">경우 A: 처음 선택 = 🚗 <span className="text-[11px] font-normal text-slate-400">(확률 1/3)</span></h5>
              <div>남은 2개 문: 🐐🐐</div>
              <div>몬티가 <strong>🐐 1개</strong> 공개</div>
              <div>남은 1개 문: <strong className="text-red-300">🐐</strong></div>
              <div className="mt-1">유지 → <span className="font-bold text-emerald-300">🚗 승리</span></div>
              <div>교체 → <span className="font-bold text-red-300">🐐 패배</span></div>
            </div>
            <div className="rounded-md border border-rose-300/40 bg-rose-400/[0.08] p-3 text-xs leading-7 text-slate-200">
              <h5 className="text-sm font-black">경우 B: 처음 선택 = 🐐 <span className="text-[11px] font-normal text-slate-400">(확률 2/3)</span></h5>
              <div>남은 2개 문: 🚗🐐</div>
              <div>몬티가 <strong>🐐 1개</strong>만 공개 가능</div>
              <div>남은 1개 문: <strong className="text-emerald-300">🚗</strong></div>
              <div className="mt-1">유지 → <span className="font-bold text-red-300">🐐 패배</span></div>
              <div>교체 → <span className="font-bold text-emerald-300">🚗 승리</span></div>
            </div>
          </div>
          <div className="mt-2 rounded-md border border-amber-300/45 bg-amber-300/[0.10] p-2.5 text-xs leading-6 text-amber-200">
            💡 핵심 : 경우 B에서 몬티는 <strong>반드시 🐐 문만</strong> 열 수 있습니다. 나머지 문에 자동차가 &ldquo;몰립니다&rdquo;!
          </div>
        </div>

        {/* STEP 3 */}
        <div className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.06] p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">STEP 3</div>
          <p className="text-sm font-bold text-slate-100">전략별 승률 계산</p>
          <div className="mt-2 rounded-md border border-cyan-400/30 bg-slate-900/60 p-3 text-sm leading-8 text-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              P(<span className="font-black text-blue-300">유지</span> 전략 승리) = P(경우 A) =
              <BlankInput state={p3a} onChange={(v) => setP3a({ value: v, status: "idle" })} onCheck={() => chk(p3a, setP3a, ["1"])} />
              / 3 ≈ 33.3%
              <CheckBtn onClick={() => chk(p3a, setP3a, ["1"])} tone="emerald" />
              <FbBadge status={p3a.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              P(<span className="font-black text-rose-300">교체</span> 전략 승리) = P(경우 B) × 1 =
              <BlankInput state={p3b} onChange={(v) => setP3b({ value: v, status: "idle" })} onCheck={() => chk(p3b, setP3b, ["2"])} />
              / 3 ≈ 66.7%
              <CheckBtn onClick={() => chk(p3b, setP3b, ["2"])} tone="rose" />
              <FbBadge status={p3b.status} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            → 교체 전략이 유지 전략보다
            <BlankInput state={p3c} onChange={(v) => setP3c({ value: v, status: "idle" })} onCheck={() => chk(p3c, setP3c, ["2"])} width="w-10" />
            배 유리합니다!
            <CheckBtn onClick={() => chk(p3c, setP3c, ["2"])} />
            <FbBadge status={p3c.status} />
          </div>
          <button
            type="button"
            onClick={() => reveal([
              { state: p3a, set: setP3a, ans: "1" },
              { state: p3b, set: setP3b, ans: "2" },
              { state: p3c, set: setP3c, ans: "2" },
            ])}
            className="mt-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/10"
          >
            정답 보기
          </button>
        </div>
      </section>

      {/* PART 2 — 확장 공식 유도 */}
      <section className="rounded-xl border border-violet-400/30 bg-violet-400/[0.05] p-4">
        <h4 className="border-b border-violet-400/30 pb-2 text-sm font-bold text-violet-300">
          Part 2. 확장 몬티홀 — 일반 공식 유도
        </h4>
        <p className="mt-2 text-xs text-slate-400">
          먼저 구체적인 예(5문, 2차)로 계산한 뒤, 일반 공식을 유도합니다.
        </p>

        {/* 예시 — 유지 */}
        <div className="mt-3 rounded-lg border-l-4 border-blue-400 bg-blue-400/[0.06] p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-300">예시 계산 — 문 5개, 자동차 2대</div>
          <p className="text-sm font-bold text-slate-100">유지 전략 승률</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-200">
            P(유지 승리) = (자동차 수) / (전체 문 수) =
            <BlankInput state={e1a} onChange={(v) => setE1a({ value: v, status: "idle" })} onCheck={() => chkPair(e1a, setE1a, "2", e1b, setE1b, "5")} />
            /
            <BlankInput state={e1b} onChange={(v) => setE1b({ value: v, status: "idle" })} onCheck={() => chkPair(e1a, setE1a, "2", e1b, setE1b, "5")} />
            <CheckBtn onClick={() => chkPair(e1a, setE1a, "2", e1b, setE1b, "5")} />
            <FbBadge status={e1a.status === "ok" && e1b.status === "ok" ? "ok" : e1a.status === "ng" || e1b.status === "ng" ? "ng" : "idle"} />
          </div>
        </div>

        {/* 예시 — 교체 분석 */}
        <div className="mt-2 rounded-lg border-l-4 border-blue-400 bg-blue-400/[0.06] p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-300">예시 계산 — 교체 전략 분석</div>
          <p className="text-sm font-bold text-slate-100">경우를 나누어 계산합니다</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-blue-300/40 bg-blue-400/[0.08] p-3 text-xs leading-7 text-slate-200">
              <h5 className="text-sm font-black">처음 선택 = 🚗 <span className="text-[11px] font-normal text-slate-400">(확률 2/5)</span></h5>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                남은 4개: 🚗
                <BlankInput state={e2a} onChange={(v) => setE2a({ value: v, status: "idle" })} onCheck={() => chkPair(e2a, setE2a, "1", e2b, setE2b, "3")} width="w-9" />
                개, 🐐
                <BlankInput state={e2b} onChange={(v) => setE2b({ value: v, status: "idle" })} onCheck={() => chkPair(e2a, setE2a, "1", e2b, setE2b, "3")} width="w-9" />
                개
                <CheckBtn onClick={() => chkPair(e2a, setE2a, "1", e2b, setE2b, "3")} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                몬티 공개 후 남은 3개 중 🚗:
                <BlankInput state={e2c} onChange={(v) => setE2c({ value: v, status: "idle" })} onCheck={() => chk(e2c, setE2c, ["1"])} width="w-9" />
                개
                <CheckBtn onClick={() => chk(e2c, setE2c, ["1"])} />
                <FbBadge status={e2c.status} />
              </div>
              <div className="mt-1">교체 후 승률 = <strong>1/3</strong></div>
            </div>
            <div className="rounded-md border border-rose-300/40 bg-rose-400/[0.08] p-3 text-xs leading-7 text-slate-200">
              <h5 className="text-sm font-black">처음 선택 = 🐐 <span className="text-[11px] font-normal text-slate-400">(확률 3/5)</span></h5>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                남은 4개: 🚗
                <BlankInput state={e3a} onChange={(v) => setE3a({ value: v, status: "idle" })} onCheck={() => chkPair(e3a, setE3a, "2", e3b, setE3b, "2")} width="w-9" />
                개, 🐐
                <BlankInput state={e3b} onChange={(v) => setE3b({ value: v, status: "idle" })} onCheck={() => chkPair(e3a, setE3a, "2", e3b, setE3b, "2")} width="w-9" />
                개
                <CheckBtn onClick={() => chkPair(e3a, setE3a, "2", e3b, setE3b, "2")} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                몬티 공개 후 남은 3개 중 🚗:
                <BlankInput state={e3c} onChange={(v) => setE3c({ value: v, status: "idle" })} onCheck={() => chk(e3c, setE3c, ["2"])} width="w-9" />
                개
                <CheckBtn onClick={() => chk(e3c, setE3c, ["2"])} />
                <FbBadge status={e3c.status} />
              </div>
              <div className="mt-1">교체 후 승률 = <strong>2/3</strong></div>
            </div>
          </div>
        </div>

        {/* 예시 최종 */}
        <div className="mt-2 rounded-lg border-l-4 border-emerald-400 bg-emerald-400/[0.06] p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">예시 최종 계산</div>
          <p className="text-sm font-bold text-slate-100">P(교체 승리) — 빈칸을 채우세요</p>
          <div className="mt-2 rounded-md border border-cyan-400/30 bg-slate-900/60 p-3 text-sm leading-8 text-slate-200">
            P(교체 승리) = 2/5 × 1/3 + 3/5 × 2/3
            <br />
            <span className="flex flex-wrap items-center gap-2">
              =
              <BlankInput state={e4a} onChange={(v) => setE4a({ value: v, status: "idle" })} onCheck={() => chkPair(e4a, setE4a, "2", e4b, setE4b, "6")} />
              / 15 +
              <BlankInput state={e4b} onChange={(v) => setE4b({ value: v, status: "idle" })} onCheck={() => chkPair(e4a, setE4a, "2", e4b, setE4b, "6")} />
              / 15
              <CheckBtn onClick={() => chkPair(e4a, setE4a, "2", e4b, setE4b, "6")} />
            </span>
            <span className="flex flex-wrap items-center gap-2">
              =
              <BlankInput state={e4c} onChange={(v) => setE4c({ value: v, status: "idle" })} onCheck={() => chk(e4c, setE4c, ["8"])} />
              / 15 ≈ 53.3%
              <CheckBtn onClick={() => chk(e4c, setE4c, ["8"])} />
              <FbBadge status={e4c.status} />
            </span>
          </div>
        </div>

        {/* 일반화 + 연습 */}
        <div className="mt-2 rounded-lg border-l-4 border-violet-400 bg-violet-400/[0.06] p-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-violet-300">일반화 — n문, k자동차</div>
          <p className="text-sm font-bold text-slate-100">위 과정을 n, k로 일반화하면 :</p>
          <div className="mt-2 rounded-md border border-cyan-400/30 bg-slate-900/60 p-3 font-mono text-sm leading-8 text-slate-200">
            P(유지 승리) = <span className="font-bold text-blue-300">k / n</span>
            <br />
            <br />
            P(교체 승리)
            <br />
            = <span className="font-bold text-blue-300">k/n</span> × (k−1)/(n−2) + <span className="font-bold text-rose-300">(n−k)/n</span> × k/(n−2)
            <br />
            = k / [n(n−2)] × [(k−1) + (n−k)]
            <br />
            = k / [n(n−2)] × (n−1)
            <br />
            = <span className="font-bold text-emerald-300">k(n−1) / [n(n−2)]</span>
          </div>
          <div className="mt-2 rounded-md border border-amber-300/45 bg-amber-300/[0.10] p-2.5 text-xs leading-6 text-amber-200">
            💡 검증 : n=5, k=2 → 2×4/(5×3) = 8/15 ✓ &nbsp;&nbsp; n=3, k=1 → 1×2/(3×1) = 2/3 ✓
          </div>
          <p className="mt-2 text-sm font-bold text-slate-100">연습 문제 : n=4, k=1일 때 교체 전략의 승률은?</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-200">
            P(교체) = 1 × 3 / (4 × 2) =
            <BlankInput state={e5a} onChange={(v) => setE5a({ value: v, status: "idle" })} onCheck={() => chkPair(e5a, setE5a, "3", e5b, setE5b, "8")} />
            /
            <BlankInput state={e5b} onChange={(v) => setE5b({ value: v, status: "idle" })} onCheck={() => chkPair(e5a, setE5a, "3", e5b, setE5b, "8")} />
            <CheckBtn onClick={() => chkPair(e5a, setE5a, "3", e5b, setE5b, "8")} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-200">
            P(유지) = 1 / 4 =
            <BlankInput state={e5c} onChange={(v) => setE5c({ value: v, status: "idle" })} onCheck={() => chk(e5c, setE5c, ["0.25", "1/4", "25%"])} width="w-16" />
            (소수로)
            <CheckBtn onClick={() => chk(e5c, setE5c, ["0.25", "1/4", "25%"])} />
            <FbBadge status={e5c.status} />
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// 메인
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "switch_advantage",
    kind: "text",
    prompt: "교체 전략이 유지 전략보다 왜 유리한지 자신의 말로 설명하세요. (힌트: 처음 선택이 맞을 확률 1/3, 틀릴 확률 2/3 으로부터)",
    placeholder: "처음에 자동차를 고를 확률이 1/3이고 염소를 고를 확률이 2/3이므로, 교체하면...",
  },
  {
    id: "cond_expression",
    kind: "text",
    prompt: "몬티가 염소 문을 열어준 *이후* 상황을 조건부확률 P(자동차 | 나머지 문) 로 표현해 보세요.",
    placeholder: "처음 선택 문이 자동차일 사건과 아닐 사건으로 나누어...",
  },
  {
    id: "graph_meaning",
    kind: "text",
    prompt: "자동 시뮬레이션 그래프에서 승률이 어떻게 변해갔나요? 처음에 왜 들쭉날쭉하다가 안정될까요? (관련 수학 법칙도 적어 보세요)",
    placeholder: "시행 횟수가 적을 때는 우연 변동이 커서... 대수의 법칙에 의해...",
  },
  {
    id: "ext_findings",
    kind: "text",
    prompt: "확장 탭에서 문·자동차 개수를 바꿔보며 알게 된 점을 적어 보세요. (교체 전략의 이점이 가장 커지는 경우 vs 작아지는 경우)",
    placeholder: "문이 많고 자동차가 1대일수록... 자동차 개수가 늘수록...",
  },
];

type TabKey = "basic" | "ext" | "principle";

export default function MontyHallMini() {
  const [tab, setTab] = useState<TabKey>("basic");
  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`@keyframes fadein {from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)}}`}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 조건부확률</p>
        <h3 className="mt-2 text-2xl font-bold">🚪 몬티홀 시뮬레이터</h3>
        <p className="mt-2 leading-7 text-slate-300">
          유지 vs 교체 — 어느 전략이 더 유리할까요? <b className="text-amber-200">기본(3문)</b>·<b className="text-amber-200">확장(N문)</b> 게임을 직접 해보고, 자동 시뮬과 수학적 유도를 통해 조건부확률의 핵심을 발견합니다.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "basic", "bg-cyan-300")} onClick={() => setTab("basic")}>🎯 기본 몬티홀</button>
        <button type="button" className={tabBtn(tab === "ext", "bg-amber-300")} onClick={() => setTab("ext")}>🔢 확장 몬티홀</button>
        <button type="button" className={tabBtn(tab === "principle", "bg-violet-300")} onClick={() => setTab("principle")}>📐 수학적 원리</button>
      </div>

      <div className="mt-5">
        {tab === "basic" ? <BasicTab /> : tab === "ext" ? <ExtendedTab /> : <PrincipleTab />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
