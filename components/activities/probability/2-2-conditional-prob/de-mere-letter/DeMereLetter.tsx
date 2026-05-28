"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   ✉️ 드 메레의 편지 — 챕터 스토리텔링 (5 chapters)
   CH1 편지 도착(봉투 봉인→열림→타이핑)
   CH2 게임 현장 재현(3게임 자동 진행 애니→중단→슬라이더 추측)
   CH3 나머지 게임 시뮬(한 번/몬테카를로)
   CH4 파스칼의 답장(5단계 풀이 + 트리 + 추측↔정답 비교)
   CH5 에필로그(독립사건/역사적 의의)
   ────────────────────────────────────────────────────────────── */

const TOTAL_PRIZE = 64;
// CH2 추측을 CH4에서 비교하기 위해 상위에서 공유
type SharedState = { guessA: number; setGuessA: (n: number) => void };

// ============================================================
// CH1 — 편지 도착
// ============================================================

type Seg = { t: string; d: number; gold?: boolean };
const SEGS: Seg[] = [
  { t: "파스칼, 나는 심각한 문제에 봉착했네. ", d: 28 },
  { t: "실력이 비슷한 A와 B가 각각 32 피스톨을 걸고 게임을 했네. ", d: 22, gold: true },
  { t: "총 5번의 게임을 하는데 3번을 먼저 이긴 사람이 64 피스톨을 모두 가지기로 했지. ", d: 22 },
  { t: "그런데 A가 2번, B가 1번을 이긴 상황에서 ", d: 35, gold: true },
  { t: "일이 생겨 게임을 그만둘 수밖에 없었네.\n\n", d: 30 },
  { t: "여기서 문제가 생겼다네. ", d: 35 },
  { t: "다시 돈을 반씩 나누자니 두 번이나 이긴 A가 너무 억울할 것 같고, ", d: 22 },
  { t: "A에게 64 피스톨을 다 주면 B가 남은 두 번을 모두 이길 수도 있으니 이 방법 역시 공평하지 않은 듯하네. ", d: 18 },
  { t: "어떻게 이 돈을 분배하는 것이 좋겠나?", d: 28, gold: true },
];

// ── CH1 영상 시퀀스 (Scene 0~6) ──────────────────────────────
// 0: 대기 (▶ 재생 버튼)
// 1: 책상 + 종이 + 깃펜 등장
// 2: 깃펜이 종이 위에서 글씨를 씀 (3줄)
// 3: 종이가 접혀 봉투로 들어감
// 4: 빨간 봉인이 찍힘
// 5: 봉투가 화면 중앙으로 도착
// 6: 봉투 위로 편지지가 펼쳐지며 본문이 타이핑됨 (영상 안에서 끝까지 진행)
type LetterScene = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const SCENE_DELAYS: Record<LetterScene, number> = {
  0: 0,
  1: 600,
  2: 2600,
  3: 1200,
  4: 700,
  5: 1100,
  6: 900, // 봉투 → 양피지 펼침 애니
};

function ChapterLetter({ onDone }: { onDone: () => void }) {
  const [scene, setScene] = useState<LetterScene>(0);
  const [startTyping, setStartTyping] = useState(false);

  // 타이핑 부분 상태
  const [segIdx, setSegIdx] = useState(0);
  const [chIdx, setChIdx] = useState(0);
  const [tokens, setTokens] = useState<{ ch: string; gold: boolean; br?: boolean }[]>([]);
  const [done, setDone] = useState(false);
  const doneNotifiedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  // ▶ 재생 → 장면 자동 진행
  function play() {
    setScene(1);
  }
  useEffect(() => {
    if (scene === 0 || scene >= 6) return;
    const next = (scene + 1) as LetterScene;
    const t = window.setTimeout(() => {
      setScene(next);
      if (next === 6) {
        window.setTimeout(() => setStartTyping(true), 600);
      }
    }, SCENE_DELAYS[next]);
    return () => window.clearTimeout(t);
  }, [scene]);

  // state-driven 타이핑 — onDone 은 ref 로 분리
  useEffect(() => {
    if (!startTyping) return;
    if (segIdx >= SEGS.length) {
      if (!doneNotifiedRef.current) {
        doneNotifiedRef.current = true;
        setDone(true);
        onDoneRef.current();
      }
      return;
    }
    const seg = SEGS[segIdx];
    if (chIdx < seg.t.length) {
      const ch = seg.t[chIdx];
      const t = window.setTimeout(() => {
        setTokens((prev) => [...prev, ch === "\n" ? { ch: "", gold: false, br: true } : { ch, gold: !!seg.gold }]);
        setChIdx((c) => c + 1);
      }, seg.d);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      setSegIdx((s) => s + 1);
      setChIdx(0);
    }, 60);
    return () => window.clearTimeout(t);
  }, [startTyping, segIdx, chIdx]);

  function replay() {
    setScene(0);
    setStartTyping(false);
    setSegIdx(0); setChIdx(0); setTokens([]); setDone(false);
    doneNotifiedRef.current = false;
    window.setTimeout(() => setScene(1), 50);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/15 to-amber-700/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-base font-bold text-amber-300">CH 1 · 파리, 1654년 여름</h4>
            <p className="mt-1 text-sm text-slate-300">
              <b className="text-amber-300">드 메레 백작</b>의 책상에서 편지가 만들어져 파스칼에게 도착합니다.
            </p>
          </div>
          {/* 컨트롤 — 영상 컨테이너 밖(헤더 안)에 배치해 항상 노출 */}
          <div className="flex flex-shrink-0 gap-2">
            {scene === 0 ? (
              <button
                type="button"
                onClick={play}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-400"
              >
                ▶ 재생
              </button>
            ) : null}
            {scene > 0 && scene < 6 ? (
              <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200">
                ⏵ 재생 중…
              </span>
            ) : null}
            {scene === 6 ? (
              <button
                type="button"
                onClick={replay}
                className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-400/20"
              >
                ⟲ 다시 재생
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-amber-800/40 bg-gradient-to-b from-amber-950/40 via-stone-950 to-amber-950/40">
        {/* 영상 스테이지 — Scene 6에서 높이 자동 확장 */}
        <LetterStage scene={scene}>
          {/* Scene 6: 봉투 위로 양피지가 펼쳐지며 본문 타이핑이 영상 안에서 진행 */}
          <AnimatePresence>
            {scene >= 6 ? (
              <motion.div
                key="paper-open"
                initial={{
                  opacity: 0,
                  scale: 0.18,
                  y: 60,
                  rotate: -8,
                }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.85, ease: [0.34, 1.28, 0.64, 1] }}
                className="absolute left-1/2 top-1/2 w-[90%] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-amber-700/60 bg-gradient-to-b from-amber-100/95 via-amber-50/95 to-amber-100/90 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.5)]"
              >
                <p className="text-right text-sm italic text-amber-800/80">파리, 1654년 여름 — 드 메레가 파스칼에게</p>
                <div className="mt-3 text-2xl leading-[1.6] text-stone-800">
                  {tokens.map((tok, i) =>
                    tok.br ? <br key={i} />
                      : tok.gold ? <span key={i} className="font-bold text-amber-700">{tok.ch}</span>
                      : <span key={i}>{tok.ch}</span>
                  )}
                  {!done ? <span className="inline-block h-[1em] w-[3px] animate-[blink_0.8s_infinite] bg-stone-800 align-text-bottom" /> : null}
                </div>
                {done ? <p className="mt-4 text-right text-base italic text-amber-700">— 드 메레 (de Méré) 백작</p> : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </LetterStage>
      </div>
    </div>
  );
}

// ── CH1 영상 스테이지 ──
function LetterStage({ scene, children }: { scene: LetterScene; children?: React.ReactNode }) {
  const VBW = 640;
  const VBH = 280;

  // 종이 위치 (Scene 1·2·3에서 사용)
  const paperX = 200, paperY = 80;
  const paperW = 240, paperH = 160;

  // 깃펜 — Scene 2 동안 글씨 쓰는 위치
  // 3줄 — 각 줄의 좌표
  const inkLines = [
    { y: paperY + 50, x1: paperX + 24, x2: paperX + paperW - 24 },
    { y: paperY + 80, x1: paperX + 24, x2: paperX + paperW - 50 },
    { y: paperY + 110, x1: paperX + 24, x2: paperX + paperW - 70 },
  ];

  // Scene 6에서 컨테이너 높이 확장 (편지지가 영상 안에 펼쳐짐)
  return (
    <motion.div
      className="relative"
      animate={{ height: scene >= 6 ? 620 : 360 }}
      transition={{ duration: 0.85, ease: [0.34, 1.28, 0.64, 1] }}
      style={{ minHeight: 360 }}
    >
      <svg viewBox={`0 0 ${VBW} ${VBH}`} className="absolute inset-x-0 top-0 block w-full" aria-hidden="true">
        {/* 책상 (항상 보임) */}
        <defs>
          <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3e2723" />
            <stop offset="100%" stopColor="#1b0f0a" />
          </linearGradient>
          <radialGradient id="candleGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={0} y={VBH - 60} width={VBW} height={60} fill="url(#deskGrad)" />
        {/* 촛불 */}
        <circle cx={70} cy={VBH - 110} r={60} fill="url(#candleGlow)" />
        <rect x={64} y={VBH - 100} width={12} height={40} fill="#fef3c7" stroke="#a16207" strokeWidth={1} />
        <motion.path
          d="M70 -140 Q66 -150 70 -160 Q74 -150 70 -140 Z"
          transform={`translate(0 ${VBH})`}
          fill="#fbbf24"
          animate={{ scaleY: [1, 1.15, 1], scaleX: [1, 0.9, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "70px " + (VBH - 100) + "px" }}
        />

        {/* 종이 (Scene 1~3) */}
        <AnimatePresence>
          {(scene === 1 || scene === 2 || scene === 3) ? (
            <motion.g
              key="paper"
              initial={{ opacity: 0, y: 30, scale: 0.85 }}
              animate={{
                opacity: 1, y: 0, scale: 1,
                // Scene 3에서 접힘 효과
                ...(scene === 3 ? { scaleY: 0.15, y: 80 } : {}),
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: scene === 3 ? 1.1 : 0.5, ease: "easeOut" }}
              style={{ transformOrigin: `${paperX + paperW / 2}px ${paperY + paperH / 2}px` }}
            >
              <rect x={paperX} y={paperY} width={paperW} height={paperH} fill="#fef3c7" stroke="#a16207" strokeWidth={1.5} rx={3} />
              {/* 잉크 줄 (Scene 2부터 그려짐) */}
              {scene >= 2 ? inkLines.map((ln, i) => (
                <motion.line
                  key={i}
                  x1={ln.x1} y1={ln.y} x2={ln.x1} y2={ln.y}
                  stroke="#1f1611" strokeWidth={2.5} strokeLinecap="round"
                  animate={{ x2: ln.x2 }}
                  transition={{ duration: 0.7, delay: i * 0.55, ease: "linear" }}
                />
              )) : null}
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* 깃펜 (Scene 1·2) */}
        <AnimatePresence>
          {(scene === 1 || scene === 2) ? (
            <motion.g
              key="quill"
              initial={{ opacity: 0, x: -40, y: -20 }}
              animate={
                scene === 1
                  ? { opacity: 1, x: 0, y: 0 }
                  : {
                      // Scene 2: 줄별로 좌→우 휩쓸기
                      opacity: 1,
                      x: [-30, 0, -30, 0, -30, 0],
                      y: [-50, -50, -20, -20, 10, 10],
                    }
              }
              transition={
                scene === 1
                  ? { duration: 0.5, ease: "easeOut" }
                  : { duration: 1.65, times: [0, 0.33, 0.34, 0.66, 0.67, 1], ease: "linear" }
              }
            >
              {/* 펜 깃털 (위→아래) */}
              <polygon
                points={`${paperX + paperW + 10},${paperY + 40} ${paperX + paperW - 20},${paperY - 30} ${paperX + paperW + 30},${paperY - 50}`}
                fill="#e5e7eb"
                stroke="#475569"
                strokeWidth={0.8}
              />
              {/* 펜대 */}
              <line
                x1={paperX + paperW + 10} y1={paperY + 40}
                x2={paperX + paperW - 30} y2={paperY + 110}
                stroke="#78350f" strokeWidth={2.5}
              />
              {/* 펜촉 */}
              <polygon
                points={`${paperX + paperW - 33},${paperY + 108} ${paperX + paperW - 27},${paperY + 108} ${paperX + paperW - 30},${paperY + 116}`}
                fill="#1f1611"
              />
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* 봉투 (Scene 3 끝~Scene 6) — Scene 6에서는 편지지가 위에 덮으므로 안 보임 */}
        <AnimatePresence>
          {(scene === 4 || scene === 5 || scene === 6) ? (
            <motion.g
              key="envelope"
              initial={{ opacity: 0, x: paperX, y: paperY + paperH - 20, scale: 0.8, rotate: 0 }}
              animate={
                scene === 4
                  ? { opacity: 1, x: paperX, y: paperY + paperH - 20, scale: 1, rotate: 0 }
                  : scene === 5
                  // 봉투가 화면 중앙으로 등장(약간 회전)
                  ? { opacity: 1, x: (VBW - paperW) / 2, y: VBH / 2 - 30, scale: 1.05, rotate: -3 }
                  // Scene 6에서는 페이드아웃 (편지지가 위로 덮음)
                  : { opacity: 0, scale: 1.2 }
              }
              transition={
                scene === 4
                  ? { duration: 0.5, ease: "easeOut" }
                  : scene === 5
                  ? { duration: 1.0, ease: [0.32, 0, 0.4, 1] }
                  : { duration: 0.5, ease: "easeIn" }
              }
            >
              <rect x={0} y={0} width={paperW} height={70} rx={3} fill="#e8c87a" stroke="#78350f" strokeWidth={1.5} />
              {/* 닫힌 윗 플랩 */}
              <polygon points={`0,0 ${paperW / 2},50 ${paperW},0`} fill="#c8943a" stroke="#78350f" strokeWidth={1.5} />
              {/* 봉인 — Scene 4에서 쾅! */}
              {scene >= 4 ? (
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ transformOrigin: `${paperW / 2}px 42px` }}
                >
                  <circle cx={paperW / 2} cy={42} r={16} fill="#b71c1c" stroke="#7f0000" strokeWidth={1.5} />
                  <text x={paperW / 2} y={42} fontSize={13} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#fff">P</text>
                </motion.g>
              ) : null}
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* 봉투가 도착하는 모션 라인 (Scene 5) */}
        {scene === 5 ? (
          <motion.path
            d={`M ${VBW + 50} ${paperY - 20} Q ${VBW / 2 + 100} ${paperY - 60} ${(VBW - paperW) / 2 + paperW / 2} ${VBH / 2}`}
            fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.55 }}
            transition={{ duration: 0.9 }}
          />
        ) : null}

        {/* 시작 안내 (Scene 0) */}
        {scene === 0 ? (
          <g>
            <text x={VBW / 2} y={VBH / 2 - 12} fontSize={16} fontWeight={700} textAnchor="middle" fill="#fbbf24">
              1654년, 어느 백작의 책상
            </text>
            <text x={VBW / 2} y={VBH / 2 + 12} fontSize={11} textAnchor="middle" fill="#94a3b8">
              ▶ 재생을 눌러 편지가 만들어지는 과정을 보세요
            </text>
          </g>
        ) : null}
      </svg>

      {/* Scene 6: 양피지 편지지가 펼쳐지며 본문 타이핑 (자식 렌더) */}
      {children}
    </motion.div>
  );
}

// ============================================================
// CH2 — 게임 현장 재현 (자동 3게임 진행 → 중단 → 슬라이더 추측)
// ============================================================

type GameResult = "A" | "B";
const GAMES_BEFORE_STOP: GameResult[] = ["A", "A", "B"]; // 시나리오: A 2승, B 1승

// ── CH2 영상 시퀀스 (Scene 0~5) ──
// 0: 대기
// 1: 두 캐릭터 등장 + 점수판 초기화
// 2: 게임 1 — A 승
// 3: 게임 2 — A 승
// 4: 게임 3 — B 승
// 5: 중단! (흔들림 + 어둠 + ⚠️)
type GameScene = 0 | 1 | 2 | 3 | 4 | 5;
const GAME_SCENE_DELAYS: Record<GameScene, number> = {
  0: 0,
  1: 800,   // 캐릭터 등장
  2: 2400,  // 1게임 진행
  3: 2400,  // 2게임 진행
  4: 2400,  // 3게임 진행
  5: 1100,  // 중단 연출
};

function ChapterGame({ shared, onDone }: { shared: SharedState; onDone: () => void }) {
  const [scene, setScene] = useState<GameScene>(0);
  const doneNotifiedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  function play() {
    setScene(1);
  }
  function replay() {
    setScene(0);
    doneNotifiedRef.current = false;
    window.setTimeout(() => setScene(1), 50);
  }

  useEffect(() => {
    if (scene === 0 || scene >= 5) {
      if (scene === 5 && !doneNotifiedRef.current) {
        doneNotifiedRef.current = true;
        onDoneRef.current();
      }
      return;
    }
    const next = (scene + 1) as GameScene;
    const t = window.setTimeout(() => setScene(next), GAME_SCENE_DELAYS[next]);
    return () => window.clearTimeout(t);
  }, [scene]);

  // revealed: 점수판에 반영된 게임 수 (0~3)
  const revealed = scene <= 1 ? 0 : Math.min(3, scene - 1); // scene 2 후 = 1게임 결과 반영
  const winsA = GAMES_BEFORE_STOP.slice(0, revealed).filter((g) => g === "A").length;
  const winsB = GAMES_BEFORE_STOP.slice(0, revealed).filter((g) => g === "B").length;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-blue-400/35 bg-gradient-to-r from-blue-500/15 to-indigo-500/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-base font-bold text-blue-300">CH 2 · 게임 현장 — 도대체 무슨 일이?</h4>
            <p className="mt-1 text-sm text-slate-300">
              <b className="text-amber-300">먼저 3승</b>한 사람이 <b className="text-amber-300">64 피스톨</b>을 가져가는 게임. 사건을 재현해 봅시다.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            {scene === 0 ? (
              <button
                type="button"
                onClick={play}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
              >
                ▶ 재생
              </button>
            ) : null}
            {scene > 0 && scene < 5 ? (
              <span className="rounded-md border border-blue-400/40 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-200">
                ⏵ 재생 중…
              </span>
            ) : null}
            {scene === 5 ? (
              <button
                type="button"
                onClick={replay}
                className="rounded-lg border border-blue-400/40 bg-blue-400/10 px-4 py-2 text-sm font-bold text-blue-200 transition hover:bg-blue-400/20"
              >
                ⟲ 다시 재생
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 영상 스테이지 + 점수판(오버레이) */}
      <div className="overflow-hidden rounded-2xl border border-blue-800/40 bg-gradient-to-b from-slate-900/60 via-stone-950 to-slate-900/60">
        <GameStage scene={scene} winsA={winsA} winsB={winsB} />
      </div>

      {scene === 5 ? (
        <>
          {/* 분배 후보 */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-300">
            <p className="font-bold text-amber-300">💰 어떻게 나누는 게 공평할까?</p>
            <ul className="mt-1 space-y-1">
              <li>🤔 <b className="text-orange-300">방법 1 : 반반</b> — 각자 32 피스톨 <span className="text-red-300 text-xs">→ A가 억울하지 않을까?</span></li>
              <li>🤔 <b className="text-blue-300">방법 2 : A에게 전부</b> — A가 64 피스톨 <span className="text-red-300 text-xs">→ B에게 불공평하지 않을까?</span></li>
            </ul>
          </div>

          {/* 추측 슬라이더 */}
          <div className="rounded-xl border border-amber-400/35 bg-amber-400/[0.06] p-4">
            <p className="text-center text-sm text-slate-300">
              🎯 당신이 생각하는 <b className="text-amber-300">A의 공평한 몫</b>은?
              <span className="ml-2 text-[11px] text-slate-500">(나중에 파스칼의 답과 비교됩니다)</span>
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range" min={0} max={TOTAL_PRIZE} step={1} value={shared.guessA}
                onChange={(e) => shared.setGuessA(Number(e.target.value))}
                aria-label="A의 몫 추측"
                className="flex-1 accent-amber-400"
              />
              <div className="font-mono text-sm whitespace-nowrap">
                <span className="font-bold text-blue-300">A : <span className="text-base">{shared.guessA}</span></span>
                <span className="mx-2 text-slate-500">|</span>
                <span className="font-bold text-orange-300">B : <span className="text-base">{TOTAL_PRIZE - shared.guessA}</span></span>
                <span className="ml-1 text-[11px] text-slate-500">피스톨</span>
              </div>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-500">📌 다음 챕터에서 게임이 진짜로 계속됐다면 어땠을지 시뮬레이션해 봅니다.</p>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ── CH2 영상 스테이지 ──
function GameStage({ scene, winsA, winsB }: { scene: GameScene; winsA: number; winsB: number }) {
  const VBW = 640;
  const VBH = 320;

  // 캐릭터 좌표
  const charY = 200;
  const charAX = 140;
  const charBX = 500;

  // 동전 던지기 — Scene 2/3/4에서 작동
  // 게임 번호별 던지는 사람(thrower)과 결과(winner)
  const gameMap: Record<number, { thrower: "A" | "B"; winner: "A" | "B" }> = {
    2: { thrower: "A", winner: "A" },
    3: { thrower: "B", winner: "A" },
    4: { thrower: "A", winner: "B" },
  };
  const cur = gameMap[scene];
  const throwerX = cur?.thrower === "A" ? charAX : charBX;
  const winnerX = cur?.winner === "A" ? charAX : charBX;

  // 동전 던지기 키프레임: 던지는 사람 손 → 포물선 정점 → 결과 캐릭터로
  const coinFromX = throwerX;
  const coinToX = winnerX;

  // 중단 효과
  const showStopFlash = scene === 5;

  return (
    <motion.div
      className="relative"
      animate={{
        x: showStopFlash ? [0, -8, 8, -6, 6, 0] : 0,
      }}
      transition={
        showStopFlash
          ? { duration: 0.55, ease: "easeOut" }
          : { duration: 0.2 }
      }
      style={{ minHeight: 320 }}
    >
      <svg viewBox={`0 0 ${VBW} ${VBH}`} className="block w-full" aria-hidden="true">
        {/* 배경 */}
        <defs>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="tableTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={VBW} height={VBH} fill="url(#floor)" />
        {/* 도박 테이블 */}
        <ellipse cx={VBW / 2} cy={250} rx={220} ry={28} fill="url(#tableTop)" opacity={0.85} />
        <ellipse cx={VBW / 2} cy={252} rx={220} ry={26} fill="#3b0a0a" />

        {/* 캐릭터 등장 (Scene 1+) */}
        <AnimatePresence>
          {scene >= 1 ? (
            <>
              <motion.g
                key="charA"
                initial={{ opacity: 0, x: -40, scale: 0.85 }}
                animate={{
                  opacity: 1, x: 0, scale: 1,
                  // 던질 때 살짝 위로 들썩
                  y: cur?.thrower === "A" ? [0, -8, 0] : 0,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Character x={charAX} y={charY} color="A" name="A" />
              </motion.g>
              <motion.g
                key="charB"
                initial={{ opacity: 0, x: 40, scale: 0.85 }}
                animate={{
                  opacity: 1, x: 0, scale: 1,
                  y: cur?.thrower === "B" ? [0, -8, 0] : 0,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <Character x={charBX} y={charY} color="B" name="B" />
              </motion.g>
            </>
          ) : null}
        </AnimatePresence>

        {/* 점수판 — 영상 상단 좌우 */}
        {scene >= 1 ? (
          <>
            <ScoreBadgeSVG x={70} y={60} name="A" wins={winsA} color="#60a5fa" />
            <ScoreBadgeSVG x={VBW - 70} y={60} name="B" wins={winsB} color="#fb923c" align="right" />
          </>
        ) : null}

        {/* 동전 — Scene 2/3/4 */}
        <AnimatePresence>
          {cur ? (
            <motion.g
              key={`coin-${scene}`}
              initial={{ x: coinFromX, y: charY - 30, scale: 0.4, opacity: 0 }}
              animate={{
                x: [coinFromX, (coinFromX + coinToX) / 2, coinToX],
                y: [charY - 30, 60, charY - 30],
                scale: [0.4, 1.4, 1],
                opacity: [0, 1, 1],
                rotate: [0, 720, 1440],
              }}
              transition={{ duration: 1.8, ease: "easeInOut", times: [0, 0.5, 1] }}
            >
              <circle cx={0} cy={0} r={18} fill="#fcd34d" stroke="#92400e" strokeWidth={2} />
              <text x={0} y={0} fontSize={14} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#92400e">
                ⚜
              </text>
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* 결과 라벨 — Scene 2/3/4 끝에 등장 */}
        <AnimatePresence>
          {cur ? (
            <motion.g
              key={`label-${scene}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.5 }}
            >
              <rect
                x={winnerX - 38} y={charY - 90} width={76} height={28} rx={14}
                fill={cur.winner === "A" ? "#1d4ed8" : "#ea580c"}
                stroke="#fff" strokeWidth={1.5}
              />
              <text
                x={winnerX} y={charY - 76}
                fontSize={13} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#fff"
              >
                {cur.winner} 승!
              </text>
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* Scene 0 안내 */}
        {scene === 0 ? (
          <g>
            <text x={VBW / 2} y={VBH / 2 - 10} fontSize={16} fontWeight={700} textAnchor="middle" fill="#60a5fa">
              파리의 어느 도박장에서
            </text>
            <text x={VBW / 2} y={VBH / 2 + 14} fontSize={11} textAnchor="middle" fill="#94a3b8">
              ▶ 재생을 눌러 사건을 재현하세요
            </text>
          </g>
        ) : null}
      </svg>

      {/* Scene 5: 중단 오버레이 */}
      <AnimatePresence>
        {scene === 5 ? (
          <motion.div
            key="stopOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-red-950/55 backdrop-blur-[1px]"
          >
            <motion.div
              initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="rounded-2xl border-2 border-red-400 bg-red-900/85 px-8 py-5 text-center shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
            >
              <p className="text-3xl">⚠️</p>
              <p className="mt-1 text-lg font-black text-red-100">갑작스러운 사정으로</p>
              <p className="text-lg font-black text-red-100">게임이 중단되었습니다!</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

// 단순 캐릭터 픽토그램 (머리 원 + 옷)
function Character({ x, y, color, name }: { x: number; y: number; color: "A" | "B"; name: string }) {
  const palette = color === "A"
    ? { skin: "#fde68a", cloak: "#1d4ed8", cuff: "#fbbf24", hat: "#7c3aed" }
    : { skin: "#fde68a", cloak: "#ea580c", cuff: "#fbbf24", hat: "#0e7490" };

  return (
    <g transform={`translate(${x} ${y})`}>
      {/* 그림자 */}
      <ellipse cx={0} cy={56} rx={30} ry={4} fill="#000" opacity={0.4} />
      {/* 망토/옷 */}
      <path
        d="M -32 52 Q -28 8 -22 -20 L 22 -20 Q 28 8 32 52 Z"
        fill={palette.cloak}
        stroke="#0f172a" strokeWidth={1.5}
      />
      {/* 칼라/장식 */}
      <path d="M -22 -20 Q 0 -12 22 -20 L 18 -8 Q 0 -2 -18 -8 Z" fill={palette.cuff} stroke="#0f172a" strokeWidth={1} />
      {/* 머리 */}
      <circle cx={0} cy={-40} r={22} fill={palette.skin} stroke="#92400e" strokeWidth={1.5} />
      {/* 모자 */}
      <path d="M -25 -50 Q 0 -75 25 -50 Q 18 -56 -18 -56 Z" fill={palette.hat} stroke="#0f172a" strokeWidth={1.5} />
      <ellipse cx={0} cy={-50} rx={28} ry={3} fill={palette.hat} stroke="#0f172a" strokeWidth={1} />
      {/* 눈·입 */}
      <circle cx={-7} cy={-42} r={1.6} fill="#1f1611" />
      <circle cx={7} cy={-42} r={1.6} fill="#1f1611" />
      <path d="M -5 -32 Q 0 -29 5 -32" fill="none" stroke="#1f1611" strokeWidth={1.3} strokeLinecap="round" />
      {/* 팔(짧게) */}
      <line x1={-22} y1={-10} x2={-30} y2={20} stroke={palette.cloak} strokeWidth={6} strokeLinecap="round" />
      <line x1={22} y1={-10} x2={30} y2={20} stroke={palette.cloak} strokeWidth={6} strokeLinecap="round" />
      {/* 이름표 */}
      <rect x={-14} y={64} width={28} height={16} rx={8} fill="#0f172a" stroke={color === "A" ? "#60a5fa" : "#fb923c"} strokeWidth={1.5} />
      <text x={0} y={72} fontSize={11} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill={color === "A" ? "#bfdbfe" : "#fed7aa"}>
        {name}
      </text>
    </g>
  );
}

// 영상 안 점수 배지 (3승까지 dots)
function ScoreBadgeSVG({ x, y, name, wins, color, align }: { x: number; y: number; name: string; wins: number; color: string; align?: "right" }) {
  const w = 100, h = 56;
  const ox = align === "right" ? x - w : x;
  return (
    <g transform={`translate(${ox} ${y - h / 2})`}>
      <rect x={0} y={0} width={w} height={h} rx={10} fill="rgba(15,23,42,0.7)" stroke={color} strokeWidth={1.5} />
      <text x={10} y={16} fontSize={11} fontWeight={900} fill={color}>{name}</text>
      <text x={w - 10} y={20} fontSize={22} fontWeight={900} textAnchor="end" fill={color}>{wins}</text>
      {/* 3승 dots */}
      <g transform="translate(10 32)">
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={i * 14}
            cy={6}
            r={5}
            fill={i < wins ? color : "rgba(255,255,255,0.07)"}
            stroke={color}
            strokeWidth={1.5}
          />
        ))}
      </g>
    </g>
  );
}

// (CH2 영상 스타일 도입으로 기존 PlayerCard/GameCoin 컴포넌트는 GameStage·ScoreBadgeSVG 로 대체됨)

// ============================================================
// CH3 — 나머지 게임 시뮬레이션
// ============================================================

type SimRound = { g4: GameResult; g5: GameResult | null; winner: GameResult };
function simOneRound(): SimRound {
  const g4: GameResult = Math.random() < 0.5 ? "A" : "B";
  if (g4 === "A") return { g4, g5: null, winner: "A" };
  const g5: GameResult = Math.random() < 0.5 ? "A" : "B";
  return { g4, g5, winner: g5 };
}

function ChapterSim({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState<SimRound | null>(null);
  const [stage, setStage] = useState<"idle" | "f4" | "f5" | "done">("idle");
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ tot: 0, a: 0, b: 0 });
  const doneOnceRef = useRef(false);

  async function sleep(ms: number) { return new Promise<void>((r) => window.setTimeout(r, ms)); }

  async function runOne() {
    if (running) return;
    setRunning(true);
    const r = simOneRound();
    setRound(r);
    setStage("f4");
    await sleep(750);
    if (r.g4 === "A") {
      setStage("done");
    } else {
      setStage("f5");
      await sleep(750);
      setStage("done");
    }
    setStats((p) => ({
      tot: p.tot + 1,
      a: p.a + (r.winner === "A" ? 1 : 0),
      b: p.b + (r.winner === "B" ? 1 : 0),
    }));
    if (!doneOnceRef.current) {
      doneOnceRef.current = true;
      onDone();
    }
    setRunning(false);
  }

  function runMonte(n: number) {
    let a = 0, b = 0;
    for (let i = 0; i < n; i++) {
      const r = simOneRound();
      if (r.winner === "A") a++; else b++;
    }
    setStats((p) => ({ tot: p.tot + n, a: p.a + a, b: p.b + b }));
    if (!doneOnceRef.current) {
      doneOnceRef.current = true;
      onDone();
    }
  }

  function reset() {
    setRound(null);
    setStage("idle");
    setStats({ tot: 0, a: 0, b: 0 });
  }

  const apct = stats.tot > 0 ? (stats.a / stats.tot) * 100 : 0;
  const bpct = stats.tot > 0 ? (stats.b / stats.tot) * 100 : 0;

  // 4·5 게임 결과 표시
  const g4Result: GameResult | "skip" | null =
    stage === "idle" ? null
    : stage === "f4" ? null
    : round?.g4 ?? null;
  const g5Result: GameResult | "skip" | null =
    stage === "idle" ? null
    : stage === "f4" ? null
    : round?.g4 === "A" ? "skip"
    : stage === "f5" ? null
    : round?.g5 ?? null;

  let finalBadge: React.ReactNode = null;
  if (stage === "done" && round) {
    if (round.g4 === "A") {
      finalBadge = (
        <div className="rounded-xl border border-blue-400/55 bg-blue-400/15 px-4 py-2 text-center text-sm font-bold text-blue-200">
          🎉 A 최종 승리! (3승 1패)
        </div>
      );
    } else if (round.g5 === "A") {
      finalBadge = (
        <div className="rounded-xl border border-blue-400/55 bg-blue-400/15 px-4 py-2 text-center text-sm font-bold text-blue-200">
          🎉 A 최종 승리! (3승 2패)
        </div>
      );
    } else {
      finalBadge = (
        <div className="rounded-xl border border-orange-400/55 bg-orange-400/15 px-4 py-2 text-center text-sm font-bold text-orange-200">
          🎊 B 역전 승리! (2승 3패)
        </div>
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-emerald-400/35 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 p-4 text-center">
        <h4 className="text-base font-bold text-emerald-300">CH 3 · 만약 게임이 계속되었다면?</h4>
        <p className="mt-1 text-sm text-slate-300">
          각 게임에서 A·B가 이길 확률은 동일하게 <b className="text-amber-300">1/2</b>.
          <br />
          <span className="text-blue-300">A는 1승</span>만 더, <span className="text-orange-300">B는 2승</span>이 필요합니다.
        </p>
      </div>

      {/* 한 번 실행 시각화 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-center text-[11px] uppercase tracking-wider text-slate-500">한 번 시뮬레이션</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <GameCoinTagged label="4번째 게임" result={g4Result} flipping={stage === "f4"} />
          <span className="text-xl text-slate-500">→</span>
          <GameCoinTagged label="5번째 게임" result={g5Result} flipping={stage === "f5"} />
          <span className="text-xl text-slate-500">→</span>
          <GameCoinTagged label="최종 승자" result={stage === "done" ? round?.winner ?? null : null} crown />
        </div>
        <div className="mt-3 min-h-[36px]">{finalBadge}</div>
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={runOne}
            disabled={running}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-700 px-5 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            🎲 한 번 실행
          </button>
        </div>
      </section>

      {/* 몬테카를로 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-center text-[11px] uppercase tracking-wider text-slate-500">몬테카를로 시뮬레이션</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatBox label="총 횟수" value={stats.tot} tone="slate" />
          <StatBox label="A 최종 승리" value={stats.a} tone="blue" />
          <StatBox label="B 최종 승리" value={stats.b} tone="orange" />
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-300">A 승률 <b>{stats.tot > 0 ? `${apct.toFixed(1)}%` : "—"}</b></span>
            <span className="text-orange-300">B 승률 <b>{stats.tot > 0 ? `${bpct.toFixed(1)}%` : "—"}</b></span>
          </div>
          <div className="relative mt-1 h-6 overflow-hidden rounded-full bg-white/[0.06]">
            <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
              <defs>
                <linearGradient id="dm-ga" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1565c0" />
                  <stop offset="100%" stopColor="#42a5f5" />
                </linearGradient>
                <linearGradient id="dm-gb" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d84315" />
                  <stop offset="100%" stopColor="#ff7043" />
                </linearGradient>
              </defs>
              <rect x={0} y={0} width={apct} height={24} fill="url(#dm-ga)" className="transition-all duration-700" />
              <rect x={apct} y={0} width={bpct} height={24} fill="url(#dm-gb)" className="transition-all duration-700" />
              {/* 이론값 75% 마커 */}
              <line x1={75} x2={75} y1={0} y2={24} stroke="rgba(255,255,255,0.65)" strokeDasharray="2 2" strokeWidth={0.8} />
            </svg>
          </div>
          <p className="text-right text-[10px] text-slate-500">│ 이론값 A = 75%</p>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {[100, 1000, 10000].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => runMonte(n)}
              className="rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
            >
              ▶ {n.toLocaleString()}번
            </button>
          ))}
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-200 transition hover:bg-red-400/20"
          >
            ↺ 초기화
          </button>
        </div>
      </section>
    </div>
  );
}

function GameCoinTagged({ label, result, flipping, crown }: { label: string; result: GameResult | "skip" | null; flipping?: boolean; crown?: boolean }) {
  const big = crown;
  const sz = big ? "h-20 w-20" : "h-16 w-16";
  let body: React.ReactNode = label;
  let cls = "border-white/20 bg-white/[0.05] text-slate-500";
  if (result === "A") {
    cls = "border-blue-400 bg-blue-400/20 text-blue-200 shadow-[0_0_18px_rgba(96,165,250,0.35)]";
    body = crown ? "🏆 A" : "A 승!";
  } else if (result === "B") {
    cls = "border-orange-400 bg-orange-400/20 text-orange-200 shadow-[0_0_18px_rgba(251,146,60,0.35)]";
    body = crown ? "🏆 B" : "B 승!";
  } else if (result === "skip") {
    cls = "border-white/12 bg-white/[0.02] text-slate-700";
    body = "불필요";
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex ${sz} items-center justify-center rounded-full border-[3px] text-xs font-bold transition ${cls} ${flipping ? "animate-[coinSpin_0.7s_ease-in-out]" : ""}`}
      >
        {body}
      </div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone: "slate" | "blue" | "orange" }) {
  const t =
    tone === "blue" ? "text-blue-300"
    : tone === "orange" ? "text-orange-300"
    : "text-slate-200";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-center">
      <div className={`text-2xl font-black tabular-nums ${t}`}>{value.toLocaleString()}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

// ============================================================
// CH4 — 파스칼의 답장 (5단계 + 트리 + 추측↔정답 비교)
// ============================================================

// ── CH4 영상 시퀀스 (Scene 0~4) ──
type PascalScene = 0 | 1 | 2 | 3 | 4;
const PASCAL_SCENE_DELAYS: Record<PascalScene, number> = {
  0: 0,
  1: 1000,  // 파스칼 책상에 등장
  2: 3800,  // 트리 자라남
  3: 1800,  // 확률 강조
  4: 2200,  // 동전 굴러감
};

function ChapterPascal({ shared, onDone }: { shared: SharedState; onDone: () => void }) {
  const [scene, setScene] = useState<PascalScene>(0);
  const [stepVisible, setStepVisible] = useState(0);
  const doneNotifiedRef = useRef(false);
  // onDone 인라인 함수를 ref에 보관 → effect deps 에서 제외해 매 리렌더 재실행 방지
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  function play() { setScene(1); }
  function replay() {
    setScene(0);
    setStepVisible(0);
    doneNotifiedRef.current = false;
    window.setTimeout(() => setScene(1), 50);
  }

  // Scene 자동 진행
  useEffect(() => {
    if (scene === 0 || scene >= 4) return;
    const next = (scene + 1) as PascalScene;
    const t = window.setTimeout(() => setScene(next), PASCAL_SCENE_DELAYS[next]);
    return () => window.clearTimeout(t);
  }, [scene]);

  // Scene 4 진입 시 5단계 풀이 reveal 시작 — scene 만 deps, stepVisible 변동에 재실행되지 않게
  useEffect(() => {
    if (scene !== 4) return;
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setStepVisible(i);
      if (i >= 5) {
        window.clearInterval(id);
        if (!doneNotifiedRef.current) {
          doneNotifiedRef.current = true;
          onDoneRef.current();
        }
      }
    }, 700);
    return () => window.clearInterval(id);
  }, [scene]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-indigo-500/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-base font-bold text-violet-300">CH 4 · 파스칼의 답장</h4>
            <p className="mt-1 text-sm text-slate-300">
              <b className="text-violet-200">파스칼</b>이 게임을 끝까지 계속한다고 가정하고, 분기 트리로 64 피스톨을 갈라 봅니다.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            {scene === 0 ? (
              <button
                type="button"
                onClick={play}
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-400"
              >
                ▶ 재생
              </button>
            ) : null}
            {scene > 0 && scene < 4 ? (
              <span className="rounded-md border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-200">
                ⏵ 재생 중…
              </span>
            ) : null}
            {scene === 4 ? (
              <button
                type="button"
                onClick={replay}
                className="rounded-lg border border-violet-400/40 bg-violet-400/10 px-4 py-2 text-sm font-bold text-violet-200 transition hover:bg-violet-400/20"
              >
                ⟲ 다시 재생
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 영상 스테이지 */}
      <div className="overflow-hidden rounded-2xl border border-violet-800/40 bg-gradient-to-b from-indigo-950/60 via-stone-950 to-indigo-950/60">
        <PascalStage scene={scene} />
      </div>

      {/* 영상 끝난 후 5단계 풀이 카드가 자동 reveal */}
      {scene >= 4 ? (
        <>
          <PascalStep n={1} title="게임을 끝까지 한다고 가정하자" visible={stepVisible >= 1}>
            남은 최대 2번의 게임(4번째, 5번째)을 <b className="text-amber-300">모두 진행</b>한다고 가정합니다.
            <br />
            실제로는 먼저 3승 달성 시 끝나지만, 계산 편의를 위해 2번 모두 치른다고 봅니다.
            <br />
            <span className="text-[11px] text-slate-500">※ 영상에서 자라난 분기 트리가 그 가정의 시각화입니다.</span>
          </PascalStep>

          <PascalStep n={2} title="4번째 게임 결과 분석" visible={stepVisible >= 2}>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-blue-400/35 bg-blue-400/[0.08] p-3 text-xs leading-7">
                <p className="font-bold text-blue-300">🏆 A 승 (확률 ½)</p>
                A : 3승 달성 → A가 64 피스톨 전부 가져감
              </div>
              <div className="rounded-md border border-orange-400/35 bg-orange-400/[0.08] p-3 text-xs leading-7">
                <p className="font-bold text-orange-300">🎮 B 승 (확률 ½)</p>
                A : 2승, B : 2승 → 동점! 5번째 게임으로
              </div>
            </div>
            <div className="mt-2 rounded-md border border-amber-300/35 bg-amber-300/[0.08] p-2.5 text-xs leading-6 text-amber-200">
              💡 각 게임의 결과는 서로 <b>독립</b>입니다. 이전 게임 결과가 다음 게임에 영향을 주지 않아요!
            </div>
          </PascalStep>

          <PascalStep n={3} title="A는 4번째 게임 결과와 무관하게 32 피스톨은 확정" visible={stepVisible >= 3}>
            4번째 게임에서 어떤 결과가 나오든 :
            <ul className="mt-1 ml-1 space-y-0.5 text-sm">
              <li><span className="text-blue-300">• A 승리 → A 64, B 0 피스톨</span></li>
              <li><span className="text-orange-300">• B 승리 → 동점 → 32 피스톨씩 나눠야 공평</span></li>
            </ul>
            <p className="mt-2 text-amber-300">∴ A는 확정적으로 <b>최소 32 피스톨</b>을 받습니다.</p>
          </PascalStep>

          <PascalStep n={4} title="남은 32 피스톨은 5번째 게임의 기댓값으로 분배" visible={stepVisible >= 4}>
            남은 32 피스톨은 5번째 게임 승자가 가져갑니다.
            <br />
            둘의 실력이 같으므로 각자 ½ 확률 → 32를 반반 나눔.
            <div className="mt-2 text-sm">
              <p className="text-blue-300">A의 추가 몫 : 32 × ½ = <b>16 피스톨</b></p>
              <p className="text-orange-300">B의 추가 몫 : 32 × ½ = <b>16 피스톨</b></p>
            </div>
          </PascalStep>

          <PascalStep n={5} title="최종 답 — 공평한 상금 분배" visible={stepVisible >= 5}>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <PrizeCard name="A" amt={48} probTxt="A 최종 승리 확률 = 3/4" detail="32(확정) + 16(5번째 기댓값)" tone="A" />
              <PrizeCard name="B" amt={16} probTxt="B 최종 승리 확률 = 1/4" detail="0(확정) + 16(5번째 기댓값)" tone="B" />
            </div>
            <div className="mt-2 rounded-md border border-amber-300/35 bg-amber-300/[0.08] p-3 text-center text-xs leading-7 text-amber-200">
              64 × <b className="text-blue-300">3/4</b> = <b className="text-blue-300">48</b> 피스톨 (A의 몫)
              &nbsp;|&nbsp;
              64 × <b className="text-orange-300">1/4</b> = <b className="text-orange-300">16</b> 피스톨 (B의 몫)
              <br />
              <br />
              🔑 각 게임이 <b>독립 사건</b>이기 때문에
              <br />
              P(B가 남은 2게임 모두 승) = P(B승) × P(B승) = ½ × ½ = <b>1/4</b>
            </div>

            {/* 사용자 추측 vs 정답 비교 */}
            <GuessVsAnswer userA={shared.guessA} />
          </PascalStep>
        </>
      ) : null}
    </div>
  );
}

function PascalStep({ n, title, visible, children }: { n: number | string; title: string; visible: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-xl border border-amber-300/25 bg-amber-300/[0.04] p-4 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-xs font-black text-slate-950">
          {n}
        </span>
        {title}
      </div>
      <div className="mt-2 pl-9 text-xs leading-7 text-slate-300">{children}</div>
    </div>
  );
}

function PrizeCard({ name, amt, probTxt, detail, tone }: { name: string; amt: number; probTxt: string; detail: string; tone: "A" | "B" }) {
  const t = tone === "A"
    ? { border: "border-blue-400/55 bg-gradient-to-br from-blue-500/25 to-blue-700/10", amt: "text-blue-300", prob: "text-blue-200" }
    : { border: "border-orange-400/55 bg-gradient-to-br from-orange-500/25 to-orange-700/10", amt: "text-orange-300", prob: "text-orange-200" };
  return (
    <div className={`rounded-xl border-2 p-4 text-center ${t.border}`}>
      <p className="text-lg font-black text-white">{name}</p>
      <p className={`my-1 text-4xl font-black ${t.amt}`}>{amt}</p>
      <p className="text-xs text-slate-400">피스톨</p>
      <p className={`mt-2 text-[11px] leading-6 ${t.prob}`}>
        {detail}
        <br />
        {probTxt}
      </p>
    </div>
  );
}

function GuessVsAnswer({ userA }: { userA: number }) {
  const correct = 48;
  const diff = userA - correct;
  const tone =
    diff === 0 ? { cls: "border-emerald-400/45 bg-emerald-400/15 text-emerald-200", msg: "🎯 정확히 맞췄어요!" }
    : Math.abs(diff) <= 4 ? { cls: "border-amber-400/45 bg-amber-400/15 text-amber-200", msg: `🔥 거의 정답! 정답과 ${Math.abs(diff)} 차이` }
    : { cls: "border-slate-400/30 bg-slate-400/[0.12] text-slate-300", msg: `당신의 추측은 정답과 ${Math.abs(diff)} 만큼 ${diff > 0 ? "더 많" : "더 적"}았어요` };
  return (
    <div className={`mt-3 rounded-lg border-2 p-3 text-center text-xs leading-7 ${tone.cls}`}>
      <p className="font-bold">📊 당신의 추측 vs 파스칼의 정답</p>
      <p className="mt-1">
        당신은 A에게 <b>{userA}</b> 피스톨을 주려 했어요. (B에게는 {TOTAL_PRIZE - userA})
        <br />
        파스칼의 답 : <b>A = 48 / B = 16</b>
      </p>
      <p className="mt-1 text-sm">{tone.msg}</p>
    </div>
  );
}

// ── CH4 영상 스테이지 ──
function PascalStage({ scene }: { scene: PascalScene }) {
  const VBW = 720;
  const VBH = 380;

  // 분기 트리 좌표 (Scene 2~3)
  const treeRootX = 360, treeRootY = 70;
  // 1단계 분기 잎(좌=A승 = A 즉결, 우=B승 = 동점)
  const lv1AX = 230, lv1AY = 170;
  const lv1BX = 490, lv1BY = 170;
  // 2단계 분기 잎(B승 → A 또는 B)
  const lv2AX = 430, lv2AY = 280;
  const lv2BX = 600, lv2BY = 280;

  const PA = "rgba(96,165,250,0.4)";
  const PB = "rgba(251,146,60,0.4)";

  return (
    <div className="relative min-h-[380px]">
      <svg viewBox={`0 0 ${VBW} ${VBH}`} className="block w-full" aria-hidden="true">
        {/* 배경 */}
        <defs>
          <linearGradient id="pascalFloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0a0f24" />
          </linearGradient>
          <radialGradient id="pascalLamp" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={VBW} height={VBH} fill="url(#pascalFloor)" />

        {/* Scene 0 안내 */}
        {scene === 0 ? (
          <g>
            <text x={VBW / 2} y={VBH / 2 - 10} fontSize={16} fontWeight={700} textAnchor="middle" fill="#c4b5fd">
              파스칼의 서재에서
            </text>
            <text x={VBW / 2} y={VBH / 2 + 14} fontSize={11} textAnchor="middle" fill="#94a3b8">
              ▶ 재생을 눌러 풀이를 따라가 보세요
            </text>
          </g>
        ) : null}

        {/* Scene 1: 파스칼 책상 — 깃펜 + 종이 + 캐릭터 */}
        <AnimatePresence>
          {scene === 1 ? (
            <motion.g
              key="pascalDesk"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* 책상 */}
              <rect x={0} y={VBH - 60} width={VBW} height={60} fill="#3b2412" />
              {/* 램프 */}
              <circle cx={120} cy={VBH - 110} r={70} fill="url(#pascalLamp)" />
              <rect x={110} y={VBH - 110} width={20} height={50} fill="#fef3c7" stroke="#a16207" strokeWidth={1.5} />
              {/* 종이 — 책상 중앙 */}
              <motion.g
                initial={{ opacity: 0, y: 30, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.34, 1.28, 0.64, 1] }}
              >
                <rect x={300} y={170} width={300} height={170} fill="#fef3c7" stroke="#a16207" strokeWidth={1.5} rx={3} />
                <text x={450} y={205} fontSize={14} fontWeight={700} textAnchor="middle" fill="#92400e">파스칼의 풀이</text>
              </motion.g>
              {/* 깃펜 */}
              <motion.g
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <polygon points={`625,180 605,140 645,130`} fill="#e5e7eb" stroke="#475569" strokeWidth={0.8} />
                <line x1={625} y1={180} x2={595} y2={250} stroke="#78350f" strokeWidth={2.5} />
                <polygon points={`592,247 599,247 595,256`} fill="#1f1611" />
              </motion.g>
              {/* 파스칼 캐릭터 (좌측) */}
              <motion.g
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <Character x={120} y={250} color="A" name="P" />
              </motion.g>
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* Scene 2~3: 분기 트리 자라남 */}
        <AnimatePresence>
          {scene === 2 || scene === 3 ? (
            <motion.g
              key="tree"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* 종이 배경 (확대) */}
              <rect x={60} y={20} width={VBW - 120} height={VBH - 40} fill="#fef3c7" stroke="#a16207" strokeWidth={1.5} rx={6} opacity={0.96} />
              {/* 제목 */}
              <text x={VBW / 2} y={45} fontSize={13} fontWeight={700} textAnchor="middle" fill="#7c2d12">
                남은 두 게임의 분기 트리
              </text>

              {/* Root 노드 (즉시) */}
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{ transformOrigin: `${treeRootX}px ${treeRootY}px` }}
              >
                <circle cx={treeRootX} cy={treeRootY} r={22} fill="rgba(252,211,77,0.4)" stroke="#a16207" strokeWidth={2} />
                <text x={treeRootX} y={treeRootY} fontSize={11} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#7c2d12">
                  A:2 B:1
                </text>
              </motion.g>

              {/* 1단계 가지: A승(왼쪽) */}
              <motion.line
                x1={treeRootX} y1={treeRootY + 22} x2={treeRootX} y2={treeRootY + 22}
                stroke={PA} strokeWidth={2.5}
                animate={{ x2: lv1AX, y2: lv1AY - 22 }}
                transition={{ duration: 0.7, delay: 0.7 }}
              />
              <motion.text
                x={(treeRootX + lv1AX) / 2 - 30} y={(treeRootY + lv1AY) / 2}
                fontSize={11} fontWeight={700} fill="#1e3a8a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.4 }}
              >
                A승 (½)
              </motion.text>
              {/* 1단계 가지: B승(오른쪽) */}
              <motion.line
                x1={treeRootX} y1={treeRootY + 22} x2={treeRootX} y2={treeRootY + 22}
                stroke={PB} strokeWidth={2.5}
                animate={{ x2: lv1BX, y2: lv1BY - 22 }}
                transition={{ duration: 0.7, delay: 0.7 }}
              />
              <motion.text
                x={(treeRootX + lv1BX) / 2 + 20} y={(treeRootY + lv1BY) / 2}
                fontSize={11} fontWeight={700} fill="#9a3412"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.4 }}
              >
                B승 (½)
              </motion.text>

              {/* 1단계 잎 — A 즉결 / 동점 */}
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.5 }}
                style={{ transformOrigin: `${lv1AX}px ${lv1AY}px` }}
              >
                <circle cx={lv1AX} cy={lv1AY} r={20} fill="rgba(96,165,250,0.3)" stroke="#1d4ed8" strokeWidth={2} />
                <text x={lv1AX} y={lv1AY - 3} fontSize={10} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#1e3a8a">
                  A 승
                </text>
                <text x={lv1AX} y={lv1AY + 9} fontSize={9} textAnchor="middle" dominantBaseline="central" fill="#1e3a8a">
                  (3:1)
                </text>
              </motion.g>
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.5 }}
                style={{ transformOrigin: `${lv1BX}px ${lv1BY}px` }}
              >
                <circle cx={lv1BX} cy={lv1BY} r={20} fill="rgba(251,146,60,0.3)" stroke="#c2410c" strokeWidth={2} />
                <text x={lv1BX} y={lv1BY - 3} fontSize={10} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#9a3412">
                  A:2 B:2
                </text>
                <text x={lv1BX} y={lv1BY + 9} fontSize={9} textAnchor="middle" dominantBaseline="central" fill="#9a3412">
                  동점
                </text>
              </motion.g>

              {/* 2단계 가지 — 동점에서 A승/B승 */}
              <motion.line
                x1={lv1BX} y1={lv1BY + 20} x2={lv1BX} y2={lv1BY + 20}
                stroke={PA} strokeWidth={2}
                animate={{ x2: lv2AX, y2: lv2AY - 20 }}
                transition={{ duration: 0.6, delay: 2.0 }}
              />
              <motion.text
                x={(lv1BX + lv2AX) / 2 - 26} y={(lv1BY + lv2AY) / 2 + 8}
                fontSize={10} fontWeight={700} fill="#1e3a8a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.3, duration: 0.3 }}
              >
                A승 (½)
              </motion.text>
              <motion.line
                x1={lv1BX} y1={lv1BY + 20} x2={lv1BX} y2={lv1BY + 20}
                stroke={PB} strokeWidth={2}
                animate={{ x2: lv2BX, y2: lv2BY - 20 }}
                transition={{ duration: 0.6, delay: 2.0 }}
              />
              <motion.text
                x={(lv1BX + lv2BX) / 2 + 14} y={(lv1BY + lv2BY) / 2 + 8}
                fontSize={10} fontWeight={700} fill="#9a3412"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.3, duration: 0.3 }}
              >
                B승 (½)
              </motion.text>

              {/* 2단계 잎 — A 또는 B */}
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 2.7 }}
                style={{ transformOrigin: `${lv2AX}px ${lv2AY}px` }}
              >
                <circle cx={lv2AX} cy={lv2AY} r={18} fill="rgba(96,165,250,0.3)" stroke="#1d4ed8" strokeWidth={2} />
                <text x={lv2AX} y={lv2AY} fontSize={10} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#1e3a8a">
                  A 승
                </text>
              </motion.g>
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 2.7 }}
                style={{ transformOrigin: `${lv2BX}px ${lv2BY}px` }}
              >
                <circle cx={lv2BX} cy={lv2BY} r={18} fill="rgba(251,146,60,0.3)" stroke="#c2410c" strokeWidth={2} />
                <text x={lv2BX} y={lv2BY} fontSize={10} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#9a3412">
                  B 승
                </text>
              </motion.g>

              {/* Scene 3: 확률 라벨 강조(pulse) */}
              {scene === 3 ? (
                <>
                  <motion.g
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                    transition={{ duration: 0.8, repeat: 1 }}
                    style={{ transformOrigin: `${lv1AX}px ${lv1AY + 40}px` }}
                  >
                    <rect x={lv1AX - 26} y={lv1AY + 28} width={52} height={20} rx={6} fill="#1d4ed8" />
                    <text x={lv1AX} y={lv1AY + 38} fontSize={11} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#fff">
                      P = ½
                    </text>
                  </motion.g>
                  <motion.g
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, repeat: 1 }}
                    style={{ transformOrigin: `${lv2AX}px ${lv2AY + 40}px` }}
                  >
                    <rect x={lv2AX - 26} y={lv2AY + 28} width={52} height={20} rx={6} fill="#1d4ed8" />
                    <text x={lv2AX} y={lv2AY + 38} fontSize={11} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#fff">
                      P = ¼
                    </text>
                  </motion.g>
                  <motion.g
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, repeat: 1 }}
                    style={{ transformOrigin: `${lv2BX}px ${lv2BY + 40}px` }}
                  >
                    <rect x={lv2BX - 26} y={lv2BY + 28} width={52} height={20} rx={6} fill="#c2410c" />
                    <text x={lv2BX} y={lv2BY + 38} fontSize={11} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#fff">
                      P = ¼
                    </text>
                  </motion.g>
                </>
              ) : null}
            </motion.g>
          ) : null}
        </AnimatePresence>

        {/* Scene 4: 동전 굴러감 (64 → A 48 + B 16) */}
        <AnimatePresence>
          {scene === 4 ? (
            <motion.g
              key="coinSplit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* 좌측: A의 몫 48 */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.4 }}
              >
                <rect x={90} y={300} width={170} height={40} rx={10} fill="#1d4ed8" />
                <text x={175} y={325} fontSize={16} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#fff">
                  A · 48 피스톨
                </text>
              </motion.g>
              {/* 우측: B의 몫 16 */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.4 }}
              >
                <rect x={460} y={300} width={170} height={40} rx={10} fill="#c2410c" />
                <text x={545} y={325} fontSize={16} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#fff">
                  B · 16 피스톨
                </text>
              </motion.g>

              {/* 동전 64개가 양쪽으로 굴러감 — A쪽 48개, B쪽 16개 */}
              {Array.from({ length: 16 }, (_, i) => {
                const goesA = i < 12; // 16개 중 12개를 A 쪽 (비율 75:25)
                const startX = VBW / 2;
                const startY = 100 + Math.floor(i / 8) * 20 + (i % 2) * 6;
                const endX = goesA ? 100 + (i % 6) * 26 : 470 + (i % 4) * 36;
                const endY = goesA ? 240 + Math.floor(i / 6) * 18 : 240 + Math.floor(i / 4) * 18;
                return (
                  <motion.g
                    key={i}
                    initial={{ x: startX, y: startY, opacity: 0, scale: 0.5 }}
                    animate={{
                      x: [startX, (startX + endX) / 2, endX],
                      y: [startY, 130, endY],
                      opacity: [0, 1, 1],
                      scale: [0.5, 1.1, 1],
                      rotate: [0, 360, 720],
                    }}
                    transition={{ duration: 1.1, delay: i * 0.05, ease: "easeOut" }}
                  >
                    <circle cx={0} cy={0} r={12} fill="#fcd34d" stroke="#92400e" strokeWidth={1.5} />
                    <text x={0} y={0} fontSize={9} fontWeight={900} textAnchor="middle" dominantBaseline="central" fill="#92400e">⚜</text>
                  </motion.g>
                );
              })}

              {/* 최종 확률 라벨 */}
              <motion.text
                x={175} y={350} fontSize={11} textAnchor="middle" fill="#bfdbfe"
                initial={{ opacity: 0, y: 360 }}
                animate={{ opacity: 1, y: 350 }}
                transition={{ delay: 1.7, duration: 0.4 }}
              >
                P(A 최종 승) = 3/4
              </motion.text>
              <motion.text
                x={545} y={350} fontSize={11} textAnchor="middle" fill="#fed7aa"
                initial={{ opacity: 0, y: 360 }}
                animate={{ opacity: 1, y: 350 }}
                transition={{ delay: 1.7, duration: 0.4 }}
              >
                P(B 최종 승) = 1/4
              </motion.text>

              {/* 중앙 안내 */}
              <motion.text
                x={VBW / 2} y={42} fontSize={14} fontWeight={700} textAnchor="middle" fill="#fde68a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                64 피스톨이 갈라집니다
              </motion.text>
            </motion.g>
          ) : null}
        </AnimatePresence>
      </svg>
    </div>
  );
}

// (정적 ProbTreeSVG 는 CH4 영상 스테이지 PascalStage 의 자라나는 트리로 대체됨)

// ============================================================
// CH5 — 에필로그
// ============================================================

function ChapterEpilogue() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/15 to-orange-500/10 p-4 text-center">
        <h4 className="text-base font-bold text-amber-300">CH 5 · 에필로그</h4>
        <p className="mt-1 text-sm text-slate-300">두 사람의 편지 왕래가 끝났을 때, 수학의 새로운 분야가 태어나 있었습니다.</p>
      </div>

      <section className="rounded-xl border border-blue-400/30 bg-blue-400/[0.06] p-4">
        <p className="text-sm font-bold text-blue-300">📊 확률 계산 요약</p>
        <div className="mt-2 text-xs leading-7 text-slate-200">
          B가 최종 승리하려면 4번째 <b>AND</b> 5번째 게임을 모두 이겨야 합니다.
          <br />
          각 게임은 서로 <b className="text-amber-300">독립</b>이므로 :
          <div className="mt-2 inline-block rounded-md bg-black/30 px-3 py-1 font-mono text-sm">
            P(B 최종 승) = P(B, 4게임) × P(B, 5게임) = ½ × ½ = <b className="text-amber-300">1/4</b>
          </div>
          <br />
          <div className="mt-2 inline-block rounded-md bg-black/30 px-3 py-1 font-mono text-sm">
            P(A 최종 승) = 1 − 1/4 = <b className="text-amber-300">3/4</b>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-300/35 bg-amber-300/[0.06] p-4">
        <p className="text-sm font-bold text-amber-300">🔑 왜 독립 사건인가?</p>
        <p className="mt-2 text-xs leading-7 text-slate-200">
          각 게임에서의 승패는 이전 게임 결과와 <b className="text-amber-300">무관</b>합니다.
          <br />
          &ldquo;4번째 게임에서 B가 이겼다&rdquo;는 사건이 &ldquo;5번째 게임에서 B가 이길&rdquo; 확률에 영향을 주지 <b className="text-amber-300">않습니다</b>.
          <br />
          → 두 사건은 <b className="text-amber-300">독립(independent)</b>!
        </p>
      </section>

      <section className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4">
        <p className="text-sm font-bold text-emerald-300">📜 역사적 의의</p>
        <p className="mt-2 text-xs leading-7 text-slate-200">
          이 편지 왕래(드 메레 ↔ 파스칼 ↔ 페르마)가 수학에서 <b className="text-emerald-300">확률론</b>의 출발점이 되었습니다.
          <br />
          기댓값·확률 개념이 최초로 수학적으로 정립되었어요.
          <br />
          <span className="text-[11px] text-slate-500">▸ 도박 문제에서 시작된 이 수학이 오늘날 통계, AI, 금융, 보험 등 모든 분야에 활용됩니다.</span>
        </p>
      </section>
    </div>
  );
}

// ============================================================
// 메인 — 챕터 dots + 탭
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "b_win_prob",
    kind: "text",
    prompt: "게임 중단 시점(A:2승, B:1승)에서 B가 남은 게임을 연속으로 이겨 최종 승리할 확률을 구하고, 각 게임 결과가 독립 사건인 이유를 설명해 보세요.",
    placeholder: "P(B가 4게임 이김) = 1/2, P(B가 5게임 이김) = 1/2, 두 사건은 독립이므로...",
  },
  {
    id: "a_win_prob",
    kind: "text",
    prompt: "중단 시점에서 A가 최종 승리할 확률을 구해 보세요. (여사건을 이용하거나 경우를 직접 나열해도 됩니다.)",
    placeholder: "A가 이기는 경우 : ① 4게임에서 A 승, ② 4게임에서 B 승 + 5게임에서 A 승...",
  },
  {
    id: "pascal_fair",
    kind: "text",
    prompt: "파스칼의 분배 방식(A:48, B:16)이 공평하다고 생각하나요? 확률을 근거로 자신의 생각을 설명해 보세요.",
    placeholder: "A의 최종 승리 확률 3/4이므로 64의 3/4인 48 피스톨이 A의 몫...",
  },
  {
    id: "indep_core",
    kind: "text",
    prompt: "이 문제에서 ‘독립 사건’이 왜 핵심 개념인지 설명해 보세요. 만약 각 게임 결과가 독립이 아니었다면 어떻게 달라질까요?",
    placeholder: "각 게임 결과가 이전 게임에 영향을 받는다면 P(B가 2연승)을 단순히 1/2 × 1/2로 계산할 수 없어서...",
  },
];

type ChapterKey = "ch1" | "ch2" | "ch3" | "ch4" | "ch5";
const CHAPTERS: { key: ChapterKey; label: string; emoji: string; color: string }[] = [
  { key: "ch1", label: "편지 도착",   emoji: "✉️", color: "bg-amber-300" },
  { key: "ch2", label: "게임 현장",   emoji: "🎮", color: "bg-blue-300" },
  { key: "ch3", label: "시뮬레이션",  emoji: "🎲", color: "bg-emerald-300" },
  { key: "ch4", label: "파스칼의 답",  emoji: "📜", color: "bg-violet-300" },
  { key: "ch5", label: "에필로그",     emoji: "📜", color: "bg-orange-300" },
];

export default function DeMereLetter() {
  const [ch, setCh] = useState<ChapterKey>("ch1");
  const [completed, setCompleted] = useState<Record<ChapterKey, boolean>>({
    ch1: false, ch2: false, ch3: false, ch4: false, ch5: false,
  });
  const [guessA, setGuessA] = useState<number>(32);

  const shared: SharedState = { guessA, setGuessA };
  const mark = useCallback((k: ChapterKey) => {
    setCompleted((p) => (p[k] ? p : { ...p, [k]: true }));
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`
        @keyframes blink {0%,100%{opacity:1} 50%{opacity:0}}
        @keyframes envHover {0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)}}
        @keyframes unfold {0%{opacity:0;transform:scale(0.92) rotateX(-10deg)} 100%{opacity:1;transform:scale(1) rotateX(0)}}
        @keyframes coinSpin {0%{transform:rotateY(0deg) scale(1)} 50%{transform:rotateY(180deg) scale(0.7)} 100%{transform:rotateY(360deg) scale(1)}}
        @keyframes shakeStop {0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)}}
      `}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 사건의 독립과 종속</p>
        <h3 className="mt-2 text-2xl font-bold">✉️ 드 메레의 편지 — 1654년 파리의 미스터리</h3>
        <p className="mt-2 leading-7 text-slate-300">
          17세기 도박사 드 메레가 파스칼에게 보낸 편지 한 통이 <b className="text-amber-200">확률론을 탄생</b>시켰습니다.
          중단된 게임의 상금을 어떻게 나눠야 공평할까요? 다섯 챕터의 이야기로 함께 풀어 봅시다.
        </p>
      </div>

      {/* 챕터 dots */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {CHAPTERS.map((c, i) => {
          const active = ch === c.key;
          const done = completed[c.key];
          const cls = active
            ? `${c.color} text-slate-950 shadow-[0_0_12px_rgba(252,211,77,0.4)]`
            : done
            ? "border border-emerald-400/45 bg-emerald-400/15 text-emerald-200"
            : "border border-white/15 bg-white/[0.04] text-slate-400 hover:bg-white/10";
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCh(c.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${cls}`}
            >
              <span>{c.emoji}</span>
              <span className="text-[10px] uppercase tracking-wider">CH {i + 1}</span>
              <span>{c.label}</span>
              {done && !active ? <span className="text-[10px]">✓</span> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {ch === "ch1" ? <ChapterLetter onDone={() => mark("ch1")} /> :
         ch === "ch2" ? <ChapterGame shared={shared} onDone={() => mark("ch2")} /> :
         ch === "ch3" ? <ChapterSim onDone={() => mark("ch3")} /> :
         ch === "ch4" ? <ChapterPascal shared={shared} onDone={() => mark("ch4")} /> :
                        <ChapterEpilogueWrap onDone={() => mark("ch5")} />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function ChapterEpilogueWrap({ onDone }: { onDone: () => void }) {
  useEffect(() => { onDone(); }, [onDone]);
  return <ChapterEpilogue />;
}
