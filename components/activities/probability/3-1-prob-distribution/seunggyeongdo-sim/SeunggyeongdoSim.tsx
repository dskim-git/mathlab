"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

// ───────────────────────── 데이터 ─────────────────────────

type Face = { name: string; val: number };
const FACES: Face[] = [
  { name: "도", val: 1 },
  { name: "개", val: 2 },
  { name: "걸", val: 3 },
  { name: "윷", val: 4 },
  { name: "모", val: 5 },
];

// X = 두 윤목 합. 경우의 수 cnt = 5 - |x - 6|, 합 25.
type DistRow = { x: number; cnt: number };
const DIST: DistRow[] = Array.from({ length: 9 }, (_, i) => {
  const x = i + 2;
  return { x, cnt: 5 - Math.abs(x - 6) };
});

const E_X = 6;
const V_X = 4;
const SIGMA = 2;

const SIM_NS = [100, 500, 1000, 5000, 10000];

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "rv_meaning",
    prompt:
      "이 활동의 확률변수 X는 무엇이고, 가능한 값의 범위는 얼마인지 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder: "예: X는 윤목을 두 번 던져 나온 눈금의 합이고, 가능한 값은 2부터 10까지의 자연수다.",
  },
  {
    id: "expectation_meaning",
    prompt:
      "계산한 E(X)=6이 승경도 게임에서 어떤 의미를 갖는지, V(X)=4·σ(X)=2와 함께 풀어 설명해 보세요.",
    kind: "text",
    placeholder: "예: 윤목을 두 번 던지면 평균적으로 합이 6이고, 결과가 평균에서 약 ±2 정도 흔들린다.",
  },
  {
    id: "simulation_insight",
    prompt:
      "시뮬레이션 횟수를 늘릴수록 표본평균·분산이 이론값에 가까워지는 까닭을, 직접 해본 결과를 근거로 적어 보세요.",
    kind: "text",
    placeholder: "예: 100번에선 차이가 컸지만 10,000번에선 평균이 5.99처럼 6에 매우 가까웠다. 시행이 많아지면 우연이 평균되어 사라지기 때문이다.",
  },
];

// ───────────────────────── 메인 ─────────────────────────

type TabKey = "intro" | "yun" | "calc" | "sim" | "play";

export default function SeunggyeongdoSim() {
  const [tab, setTab] = useState<TabKey>("intro");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "intro", label: "🏛️ 승경도란?" },
    { key: "yun", label: "🪵 윤목 던지기" },
    { key: "calc", label: "📊 확률분포·계산" },
    { key: "sim", label: "🔬 시뮬레이션" },
    { key: "play", label: "🎮 직접 해보기" },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 통계</p>
        <h3 className="mt-2 text-2xl font-bold">🎲 승경도 윤목 — 이산확률변수의 기댓값과 분산</h3>
        <p className="mt-2 leading-7 text-slate-300">
          조선시대 전통 보드게임 <b className="text-amber-300">승경도</b>의{" "}
          <b className="text-amber-300">윤목</b>으로 확률변수 X의 <b>기댓값 E(X)</b>와{" "}
          <b>분산 V(X)</b>를 탐구합니다. 탭을 순서대로 살펴보세요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950"
                : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭들을 모두 마운트해 상태 보존(윤목 로그·플레이판 진행 등) */}
      <div className={tab === "intro" ? "mt-5" : "mt-5 hidden"}>
        <IntroTab />
      </div>
      <div className={tab === "yun" ? "mt-5" : "mt-5 hidden"}>
        <YunTab />
      </div>
      <div className={tab === "calc" ? "mt-5" : "mt-5 hidden"}>
        <CalcTab />
      </div>
      <div className={tab === "sim" ? "mt-5" : "mt-5 hidden"}>
        <SimTab />
      </div>
      <div className={tab === "play" ? "mt-5" : "mt-5 hidden"}>
        <PlayTab />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ───────────────────────── 탭 1: 소개 ─────────────────────────

function IntroTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-orange-700/5 p-5 text-center">
        <span className="inline-block rounded-full border border-amber-400/35 bg-amber-400/15 px-3 py-0.5 text-xs font-semibold text-amber-200">
          🏛️ 조선시대 전통 보드게임
        </span>
        <h4 className="mt-2 text-2xl font-black text-amber-200">승경도(陞卿圖) 놀이</h4>
        <p className="mt-1 text-sm text-slate-300">
          관직에 오르는 꿈을 키우는 조선의 보드게임. 이산확률변수와 기댓값을 탐구해 봅시다.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🗺️ 승경도 게임판 구조</p>
        <p className="mt-1 text-sm text-slate-400">
          중앙엔 정1품부터 종9품까지의 <b className="text-slate-200">내직(궁궐 관직)</b>이 등급순으로,
          사방에는 8도의 <b className="text-slate-200">외직(지방 관직)</b>이, 한쪽에는 강등·유배·사약의{" "}
          <b className="text-slate-200">벌칙 구역</b>이 배치됩니다.
        </p>
        <div className="mt-4">
          <SeunggyeongdoBoardSVG />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          ※ 실제 승경도판은 약 1m × 1.5m 종이에 150~300여 칸이 빼곡합니다. 본 그림은 영역 구조 이해용 단순화.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">📷 실제 승경도 사진</p>
        <p className="mt-1 text-sm text-slate-400">
          아래는 보존되어 있는 실제 승경도판 사진입니다. 위 도식과 비교해 보면 영역 구조가 어떻게 실제 종이판에
          빼곡히 표현되는지 확인할 수 있어요.
        </p>
        <figure className="mt-3 overflow-hidden rounded-xl border border-amber-400/20 bg-slate-900/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/activities/seunggyeongdo/board.png"
            alt="실제 승경도(陞卿圖) 게임판 — 관직명이 빼곡히 적힌 종이판"
            className="block w-full"
            loading="lazy"
          />
          <figcaption className="px-3 py-2 text-xs italic text-slate-400">
            실제 승경도(陞卿圖) 게임판 — 관직명이 빼곡히 적힌 종이판
          </figcaption>
        </figure>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <HistoryCard icon="📜" title="역사적 배경">
          조선시대 양반가 자제들이 <b className="text-amber-200">복잡한 관직 체계</b>를 놀이로 익히며
          관직에 오르는 꿈을 키우는 교육용 보드게임입니다.
        </HistoryCard>
        <HistoryCard icon="✍️" title="창안자">
          <b className="text-amber-200">하륜</b>이 창안했다는 기록이 《용재총화》에 전합니다.
          종경도·승정도라고도 불립니다.
        </HistoryCard>
        <HistoryCard icon="📋" title="게임판 구성">
          폭 1m × 길이 1.5m 종이에 <b className="text-amber-200">150~300여 칸</b>이 있고 각 칸에
          관직명이 적혀 있습니다.
        </HistoryCard>
        <HistoryCard icon="🏆" title="승리 조건">
          <b className="text-amber-200">영의정·봉조하</b>(문과)나 <b className="text-amber-200">도원수</b>(무과)에
          먼저 도달해 퇴직하면 이깁니다.
        </HistoryCard>
      </div>

      <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-5">
        <p className="text-base font-bold text-cyan-200">📐 이 활동의 수학적 탐구</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          승경도에서는 <b className="text-amber-300">윤목</b>(특수 주사위)을 던져 나온 눈금만큼 이동합니다.
          이 활동의 <b className="text-cyan-200">확률변수 X</b>를 다음과 같이 정의합니다:
        </p>
        <div className="mt-3 rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-center font-mono text-base text-amber-200">
          X = 윤목을 두 번 던져 나오는 눈금의 합
        </div>
        <p className="mt-3 text-sm text-slate-300">
          X의 가능한 값: <b className="text-amber-300">2, 3, 4, 5, 6, 7, 8, 9, 10</b>. 탭을 순서대로 탐구하며{" "}
          E(X)와 V(X)를 구해 보세요!
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-bold text-slate-300">📚 참고문헌</p>
        <p className="mt-1 text-xs text-slate-500">
          이 활동의 승경도 게임판·윤목·진행 규칙은 다음 자료를 참고했습니다.
        </p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {REFERENCES.map((r) => (
            <li key={r.href}>
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 underline-offset-2 transition hover:text-cyan-200 hover:underline"
              >
                {r.title}
              </a>
              <span className="ml-2 text-xs text-slate-500">— {r.source}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const REFERENCES: { title: string; source: string; href: string }[] = [
  { title: "승경도", source: "위키백과", href: "https://ko.wikipedia.org/wiki/%EC%8A%B9%EA%B2%BD%EB%8F%84" },
  { title: "승경도놀이", source: "한국민속대백과사전(국립민속박물관)", href: "https://folkency.nfm.go.kr/kr/topic/detail/4383" },
  { title: "예를 갖추어 노는 양반놀이, 승경도(陞卿圖)", source: "국가유산청 월간 국가유산사랑", href: "https://www.cha.go.kr/cop/bbs/selectBoardArticle.do?nttId=23115&bbsId=BBSMSTR_1008&pageUnit=0&mn=NS_01_09_01" },
  { title: "승경도놀이(陞卿圖놀이)", source: "한국민족문화대백과사전", href: "https://encykorea.aks.ac.kr/Article/E0032155" },
];

function HistoryCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-2xl">{icon}</p>
      <p className="mt-1 text-sm font-bold text-amber-200">{title}</p>
      <p className="mt-1.5 text-sm leading-6 text-slate-400">{children}</p>
    </div>
  );
}

// ── 게임판 SVG (정적 시각화) ──
// 사료 기반: 중앙=내직, 사방=외직, 우상단=벌칙, 좌측=시작 5종.
function SeunggyeongdoBoardSVG() {
  // viewBox 800 × 500
  // 중앙 격자: 정1~정3품(영의정 강조) — 3×3
  const ranks: { code: string; name: string; tone: "top" | "mid" | "low" }[] = [
    { code: "정1품", name: "영의정", tone: "top" },
    { code: "정1품", name: "좌의정", tone: "top" },
    { code: "정1품", name: "우의정", tone: "top" },
    { code: "종1품", name: "찬성", tone: "mid" },
    { code: "정2품", name: "판서", tone: "mid" },
    { code: "종2품", name: "참판", tone: "mid" },
    { code: "정3품", name: "참의", tone: "low" },
    { code: "종3품", name: "집의", tone: "low" },
    { code: "정4품", name: "장령", tone: "low" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-2">
      <svg viewBox="0 0 800 500" className="block w-full" role="img" aria-label="승경도 게임판 영역 구조">
        <defs>
          <linearGradient id="sgd-center" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(251,191,36,0.18)" />
            <stop offset="100%" stopColor="rgba(180,83,9,0.10)" />
          </linearGradient>
          <linearGradient id="sgd-outer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,197,94,0.10)" />
            <stop offset="100%" stopColor="rgba(20,83,45,0.06)" />
          </linearGradient>
          <linearGradient id="sgd-punish" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(248,113,113,0.18)" />
            <stop offset="100%" stopColor="rgba(127,29,29,0.10)" />
          </linearGradient>
        </defs>

        {/* 외곽 종이판 */}
        <rect x={4} y={4} width={792} height={492} rx={14} fill="rgba(120,53,15,0.05)" stroke="rgba(251,191,36,0.25)" strokeWidth={2} />

        {/* ─── 외직(사방) — 8도 ─── */}
        {/* 북(상단) */}
        <BoardRegion x={170} y={28} w={460} h={56} fill="url(#sgd-outer)" stroke="rgba(34,197,94,0.45)" label="외직 (북) · 함경 · 평안" labels={["함경 감영", "평안 감영"]} />
        {/* 남(하단) */}
        <BoardRegion x={170} y={416} w={460} h={56} fill="url(#sgd-outer)" stroke="rgba(34,197,94,0.45)" label="외직 (남) · 전라 · 경상" labels={["전라 감영", "경상 감영"]} />
        {/* 서(좌측) */}
        <BoardRegion x={28} y={100} w={120} h={300} fill="url(#sgd-outer)" stroke="rgba(34,197,94,0.45)" label="외직 (서)" labels={["황해 감영", "평안 부", "안주 목사"]} vertical />
        {/* 동(우측) */}
        <BoardRegion x={652} y={100} w={120} h={180} fill="url(#sgd-outer)" stroke="rgba(34,197,94,0.45)" label="외직 (동)" labels={["강원 감영", "춘천 부", "원주 목사"]} vertical />

        {/* ─── 벌칙 구역 (우상단 안쪽) ─── */}
        <BoardRegion x={652} y={296} w={120} h={104} fill="url(#sgd-punish)" stroke="rgba(248,113,113,0.55)" label="⚠️ 벌칙" labels={["파직", "유배", "사약"]} vertical />

        {/* ─── 중앙 내직 (3×3 격자) ─── */}
        <rect x={170} y={100} width={460} height={300} rx={10} fill="url(#sgd-center)" stroke="rgba(251,191,36,0.5)" strokeWidth={2} />
        <text x={400} y={122} textAnchor="middle" className="fill-amber-200" fontSize={13} fontWeight={700}>
          내직 (중앙) · 정1품 ~ 정4품
        </text>

        {ranks.map((r, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const cellW = 145, cellH = 80;
          const x = 180 + col * (cellW + 4);
          const y = 138 + row * (cellH + 4);
          const tone =
            r.tone === "top" ? { fill: "rgba(251,191,36,0.18)", stroke: "rgba(251,191,36,0.7)", text: "fill-amber-100" }
            : r.tone === "mid" ? { fill: "rgba(251,191,36,0.08)", stroke: "rgba(251,191,36,0.35)", text: "fill-amber-200" }
            : { fill: "rgba(255,255,255,0.04)", stroke: "rgba(255,255,255,0.18)", text: "fill-slate-200" };
          const isTop = r.name === "영의정";
          return (
            <g key={`${r.code}-${r.name}`}>
              <rect x={x} y={y} width={cellW} height={cellH} rx={6} fill={tone.fill} stroke={tone.stroke} strokeWidth={isTop ? 2.5 : 1} />
              {isTop ? <rect x={x + 2} y={y + 2} width={cellW - 4} height={cellH - 4} rx={5} fill="none" stroke="rgba(34,211,238,0.6)" strokeDasharray="4 3" /> : null}
              <text x={x + cellW / 2} y={y + 28} textAnchor="middle" className="fill-slate-500" fontSize={11}>{r.code}</text>
              <text x={x + cellW / 2} y={y + 52} textAnchor="middle" className={tone.text} fontSize={18} fontWeight={800}>{r.name}</text>
              {isTop ? <text x={x + cellW / 2} y={y + 70} textAnchor="middle" className="fill-cyan-300" fontSize={10} fontWeight={700}>🏆 도착(문과)</text> : null}
            </g>
          );
        })}

        {/* ─── 시작 5종 배지 (좌측 상단 라벨) ─── */}
        <g transform="translate(28, 28)">
          <rect x={0} y={0} width={120} height={62} rx={8} fill="rgba(99,102,241,0.10)" stroke="rgba(165,180,252,0.45)" />
          <text x={60} y={18} textAnchor="middle" className="fill-indigo-200" fontSize={11} fontWeight={700}>출신 (시작)</text>
          <text x={60} y={36} textAnchor="middle" className="fill-slate-300" fontSize={10}>은일 · 문과</text>
          <text x={60} y={50} textAnchor="middle" className="fill-slate-300" fontSize={10}>무과 · 남행 · 유학</text>
        </g>
      </svg>
    </div>
  );
}

function BoardRegion({
  x, y, w, h, fill, stroke, label, labels, vertical = false,
}: {
  x: number; y: number; w: number; h: number; fill: string; stroke: string; label: string; labels: string[]; vertical?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 16} textAnchor="middle" className="fill-slate-300" fontSize={11} fontWeight={700}>
        {label}
      </text>
      {vertical
        ? labels.map((t, i) => (
            <text key={t} x={x + w / 2} y={y + 36 + i * 16} textAnchor="middle" className="fill-slate-400" fontSize={10}>
              {t}
            </text>
          ))
        : (
          <g>
            {labels.map((t, i) => (
              <text key={t} x={x + (w / (labels.length + 1)) * (i + 1)} y={y + h - 12} textAnchor="middle" className="fill-slate-400" fontSize={10}>
                {t}
              </text>
            ))}
          </g>
        )}
    </g>
  );
}

// ───────────────────────── 탭 2: 윤목 던지기 ─────────────────────────

type RollLog = { f1: Face; f2: Face; sum: number };

function YunTab() {
  const [current, setCurrent] = useState<RollLog | null>(null);
  const [logs, setLogs] = useState<RollLog[]>([]);
  const [rolling, setRolling] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current !== null) window.clearInterval(timerRef.current); }, []);

  function roll() {
    if (rolling) return;
    setRolling(true);
    let elapsed = 0;
    timerRef.current = window.setInterval(() => {
      const f1 = FACES[Math.floor(Math.random() * 5)];
      const f2 = FACES[Math.floor(Math.random() * 5)];
      setCurrent({ f1, f2, sum: f1.val + f2.val });
      elapsed += 60;
      if (elapsed > 640) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        const r1 = FACES[Math.floor(Math.random() * 5)];
        const r2 = FACES[Math.floor(Math.random() * 5)];
        const final = { f1: r1, f2: r2, sum: r1.val + r2.val };
        setCurrent(final);
        setLogs((prev) => [final, ...prev].slice(0, 24));
        setRolling(false);
      }
    }, 60);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🪵 윤목(輪木)이란?</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <figure className="overflow-hidden rounded-xl border border-amber-400/25 bg-slate-900/60 sm:w-72 sm:flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/activities/seunggyeongdo/yunmok.png"
              alt="윤목(輪木) — 5면으로 깎은 승경도 전용 주사위"
              className="block w-full"
              loading="lazy"
            />
            <figcaption className="px-3 py-2 text-xs italic text-slate-400">
              윤목(輪木) — 5면으로 깎은 승경도 전용 주사위
            </figcaption>
          </figure>
          <p className="text-sm leading-7 text-slate-300">
            <b className="text-amber-200">윤목</b>은 한 뼘 길이, 두께 약 3cm의 나무를 <b className="text-amber-200">5면</b>으로
            깎아 만든 승경도 전용 주사위입니다. 던지면 한 모서리가 위로 올라와 그 눈금을 읽으며, 각 눈금이 나올 확률은 모두{" "}
            <b className="text-cyan-200">1/5</b>로 같습니다. 윤목은 중국의 승관도에는 없는{" "}
            <b className="text-amber-200">한국 고유의 주사위</b>입니다.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🎲 윤목의 5개 면</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {FACES.map((f) => (
            <div key={f.name} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center transition hover:border-amber-400/40 hover:bg-amber-400/5">
              <p className="text-2xl font-black text-amber-300">{f.name}</p>
              <div className="my-1.5 flex h-2 items-center justify-center gap-1">
                {Array.from({ length: f.val }).map((_, i) => (
                  <span key={i} className="block h-1.5 w-1.5 rounded-full bg-amber-200" />
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-300">눈금 {f.val}</p>
              <p className="text-[10px] text-slate-500">P = 1/5</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">
          각 눈금 확률: P = <span className="font-bold text-amber-300">1/5</span> = 0.2
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🎯 윤목 두 번 던지기</p>
        <p className="mt-1 text-sm text-slate-400">버튼을 눌러 윤목을 두 번 던지고 합 X를 관찰하세요.</p>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={roll}
            disabled={rolling}
            className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 px-8 py-3 text-base font-bold text-amber-50 shadow-md transition hover:from-amber-500 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🎲 윤목 던지기!
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <DiceResult label="1번째 윤목" face={current?.f1 ?? null} lit={!rolling && !!current} />
          <span className="text-2xl font-black text-slate-600">+</span>
          <DiceResult label="2번째 윤목" face={current?.f2 ?? null} lit={!rolling && !!current} />
          <span className="text-2xl font-black text-slate-600">=</span>
          <div className={`rounded-xl border-2 px-5 py-3 text-center transition ${!rolling && current ? "border-indigo-400/60 bg-indigo-400/15 shadow-[0_0_22px_rgba(99,102,241,0.3)]" : "border-indigo-400/30 bg-indigo-500/5"}`}>
            <p className="text-xs font-semibold text-slate-400">X (합)</p>
            <p className="text-3xl font-black text-indigo-200">{current ? current.sum : "—"}</p>
            <p className="mt-0.5 text-[10px] text-slate-500">{current ? `(${current.f1.name}+${current.f2.name})` : ""}</p>
          </div>
        </div>

        <div className="mt-4 flex max-h-20 flex-wrap gap-1 overflow-y-auto rounded-lg bg-white/[0.02] p-2">
          {logs.length === 0 ? (
            <span className="text-xs text-slate-500">아직 기록이 없습니다.</span>
          ) : (
            logs.map((l, i) => (
              <span
                key={i}
                className={`rounded-md border px-2 py-0.5 font-mono text-xs ${i === 0 ? "border-amber-400/40 bg-amber-400/15 text-amber-100" : "border-white/10 bg-white/[0.05] text-slate-300"}`}
              >
                {l.f1.name}+{l.f2.name}={l.sum}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DiceResult({ label, face, lit }: { label: string; face: Face | null; lit: boolean }) {
  return (
    <div className={`rounded-xl border-2 px-5 py-3 text-center transition ${lit ? "border-amber-400/55 bg-amber-400/15" : "border-white/10 bg-white/[0.04]"}`}>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="text-3xl font-black text-amber-300">{face?.name ?? "—"}</p>
      <p className="text-[11px] text-slate-400">{face ? `눈금 ${face.val}` : ""}</p>
    </div>
  );
}

// ───────────────────────── 탭 3: 확률분포 & 계산 ─────────────────────────

function CalcTab() {
  const [revealed, setRevealed] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => { timers.current.forEach((id) => window.clearTimeout(id)); }, []);

  const STEPS = [
    { t: "① X의 범위", b: "최솟값=1+1=2, 최댓값=5+5=10. 전체 경우의 수: 5×5=25", f: "X ∈ {2, 3, …, 10}" },
    { t: "② E(X) = Σ x·P(X=x)", b: "분자: 2·1+3·2+4·3+5·4+6·5+7·4+8·3+9·2+10·1", f: "= (2+6+12+20+30+28+24+18+10)/25 = 150/25 = 6" },
    { t: "③ E(X²) = Σ x²·P(X=x)", b: "분자: 4·1+9·2+16·3+25·4+36·5+49·4+64·3+81·2+100·1", f: "= (4+18+48+100+180+196+192+162+100)/25 = 1000/25 = 40" },
    { t: "④ V(X) = E(X²) − [E(X)]²", b: "분산 공식 적용", f: "= 40 − 6² = 40 − 36 = 4" },
    { t: "⑤ σ(X) = √V(X)", b: "표준편차 계산", f: "= √4 = 2" },
    { t: "⑥ 해석", b: "윤목을 두 번 던지면 평균 합은 6이고, 표준편차는 2입니다.", f: "E(X)=6,  V(X)=4,  σ(X)=2" },
  ];

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    STEPS.forEach((_, i) => {
      const id = window.setTimeout(() => setVisibleSteps(i + 1), i * 280);
      timers.current.push(id);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">📊 확률변수 X의 확률분포표</p>
        <p className="mt-1 text-sm text-slate-400">
          전체 경우의 수: <b className="text-amber-200">5 × 5 = 25</b>가지
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-white/10 bg-amber-400/10 px-2 py-1.5 text-amber-200">X</th>
                {DIST.map((d) => (
                  <th key={d.x} className="border border-white/10 bg-amber-400/10 px-2 py-1.5 text-amber-200">{d.x}</th>
                ))}
                <th className="border border-white/10 bg-amber-400/10 px-2 py-1.5 text-amber-200">합계</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center font-mono text-slate-200">경우의 수</td>
                {DIST.map((d) => (
                  <td key={d.x} className="border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center font-mono text-slate-200">{d.cnt}</td>
                ))}
                <td className="border border-white/10 bg-indigo-400/15 px-2 py-1.5 text-center font-mono font-bold text-indigo-200">25</td>
              </tr>
              <tr>
                <td className="border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center font-mono text-slate-200">P(X=x)</td>
                {DIST.map((d) => (
                  <td key={d.x} className="border border-white/10 bg-white/[0.04] px-2 py-1.5 text-center font-mono text-slate-200">{d.cnt}/25</td>
                ))}
                <td className="border border-white/10 bg-indigo-400/15 px-2 py-1.5 text-center font-mono font-bold text-indigo-200">1</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <DistChartSVG />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🔢 E(X)와 V(X) 구하기</p>
        {!revealed ? (
          <button
            type="button"
            onClick={reveal}
            className="mt-3 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-5 py-2 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/25"
          >
            📐 단계별 계산 보기
          </button>
        ) : null}

        <div className="mt-3 space-y-2">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`rounded-r-lg border-l-4 border-indigo-400/55 bg-white/[0.03] px-3 py-2.5 text-sm leading-6 transition ${
                i < visibleSteps ? "translate-x-0 opacity-100" : "-translate-x-1.5 opacity-0"
              }`}
            >
              <span className="font-bold text-amber-300">{s.t}</span>
              <span className="ml-2 text-slate-400">{s.b}</span>
              <span className="mt-1 block font-mono text-indigo-200">{s.f}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatBox lbl="기댓값 E(X)" val={revealed ? String(E_X) : "?"} sub="Σ x·P(X=x)" pop={visibleSteps >= STEPS.length} />
          <StatBox lbl="분산 V(X)" val={revealed ? String(V_X) : "?"} sub="E(X²)−[E(X)]²" pop={visibleSteps >= STEPS.length} />
          <StatBox lbl="표준편차 σ(X)" val={revealed ? String(SIGMA) : "?"} sub="√V(X)" pop={visibleSteps >= STEPS.length} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ lbl, val, sub, pop }: { lbl: string; val: string; sub: string; pop: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-3 text-center transition ${pop ? "border-amber-400/45 bg-amber-400/12" : "border-white/10 bg-white/[0.04]"}`}>
      <p className="text-[11px] font-semibold tracking-wider text-slate-500">{lbl}</p>
      <p className="mt-1 font-mono text-2xl font-black text-amber-300">{val}</p>
      <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

// 분포 막대 SVG.
function DistChartSVG() {
  const W = 600, H = 200, PL = 36, PR = 12, PT = 14, PB = 30;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const maxP = 0.22;
  const barW = innerW / DIST.length;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-label="X의 확률분포">
        {/* 가로 그리드 */}
        {[0, 0.05, 0.1, 0.15, 0.2].map((p) => {
          const y = PT + innerH - (p / maxP) * innerH;
          return (
            <g key={p}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" />
              <text x={PL - 6} y={y + 3} textAnchor="end" className="fill-slate-500" fontSize={9}>
                {(p * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
        {/* 막대 */}
        {DIST.map((d, i) => {
          const p = d.cnt / 25;
          const h = (p / maxP) * innerH;
          const x = PL + i * barW + barW * 0.12;
          const bw = barW * 0.76;
          const y = PT + innerH - h;
          const isPeak = d.x === E_X;
          return (
            <g key={d.x}>
              <rect
                x={x}
                y={y}
                width={bw}
                height={h}
                rx={3}
                fill={isPeak ? "rgba(251,191,36,0.75)" : "rgba(99,102,241,0.55)"}
                stroke={isPeak ? "rgba(251,191,36,1)" : "rgba(99,102,241,0.85)"}
                strokeWidth={1.5}
              />
              <text x={x + bw / 2} y={y - 3} textAnchor="middle" className={isPeak ? "fill-amber-200" : "fill-indigo-200"} fontSize={9.5} fontWeight={700}>
                {d.cnt}/25
              </text>
              <text x={x + bw / 2} y={H - 10} textAnchor="middle" className="fill-slate-400" fontSize={10}>
                X={d.x}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ───────────────────────── 탭 4: 시뮬레이션 ─────────────────────────

function SimTab() {
  const [n, setN] = useState(500);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ mean: number; vari: number; std: number; freq: number[] } | null>(null);
  const [running, setRunning] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); }, []);

  function run() {
    if (running) return;
    setRunning(true);
    setProgress(0);
    // 이전 결과는 유지하다가 새 결과가 준비되면 덮어씀(그래프 깜빡임 방지).
    const total = n;
    const freq = new Array(9).fill(0);
    let sum = 0, sumSq = 0, done = 0;

    const step = () => {
      const chunk = Math.min(500, total - done);
      for (let i = 0; i < chunk; i++) {
        const v1 = FACES[Math.floor(Math.random() * 5)].val;
        const v2 = FACES[Math.floor(Math.random() * 5)].val;
        const s = v1 + v2;
        freq[s - 2] += 1;
        sum += s;
        sumSq += s * s;
      }
      done += chunk;
      setProgress(Math.round((done / total) * 100));
      if (done < total) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        const mean = sum / total;
        const vari = sumSq / total - mean * mean;
        const std = Math.sqrt(Math.max(0, vari));
        setResult({ mean, vari, std, freq });
        setRunning(false);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function tone(value: number, target: number, tol: number): "g" | "y" | "r" {
    const d = Math.abs(value - target);
    if (d <= tol * 0.5) return "g";
    if (d <= tol * 1.5) return "y";
    return "r";
  }
  const toneCls = { g: "text-emerald-300", y: "text-amber-300", r: "text-rose-300" } as const;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">🔬 몬테카를로 시뮬레이션</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          시행을 많이 하면 표본평균·분산이 이론값(<b>E(X)=6, V(X)=4</b>)에 가까워지는지 확인해 봅시다.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {SIM_NS.map((nv) => (
              <button
                key={nv}
                type="button"
                onClick={() => setN(nv)}
                disabled={running}
                className={
                  n === nv
                    ? "rounded-lg border border-amber-400/50 bg-amber-400/15 px-3 py-1.5 text-xs font-bold text-amber-200"
                    : "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10"
                }
              >
                {nv.toLocaleString()}회
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-bold text-emerald-50 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ▶ 실행
          </button>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <svg viewBox="0 0 100 1.5" preserveAspectRatio="none" className="block h-full w-full">
            <rect x={0} y={0} width={progress} height={1.5} className="fill-emerald-400 transition-all" />
          </svg>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { lbl: "표본 평균", val: result?.mean, target: E_X, tol: 0.3 },
            { lbl: "표본 분산", val: result?.vari, target: V_X, tol: 0.5 },
            { lbl: "표본 표준편차", val: result?.std, target: SIGMA, tol: 0.3 },
          ].map((m) => (
            <div key={m.lbl} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
              <p className="text-[11px] font-semibold text-slate-400">{m.lbl}</p>
              <p className={`mt-1 font-mono text-xl font-black ${m.val === undefined ? "text-slate-600" : toneCls[tone(m.val, m.target, m.tol)]}`}>
                {m.val === undefined ? "—" : m.val.toFixed(3)}
              </p>
              <p className="text-[10px] text-slate-500">이론: {m.target}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-base font-bold text-amber-300">📈 시뮬레이션 vs 이론값 비교</p>
        <div className="mt-3">
          <SimChartSVG freq={result?.freq} n={result ? n : undefined} />
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          {result
            ? "초록 막대: 시뮬레이션 비율  |  노란 선: 이론 확률"
            : "▶ 실행 버튼을 누르면 시뮬 막대가 채워집니다 (현재는 이론 확률만 표시)"}
        </p>
      </div>
    </div>
  );
}

function SimChartSVG({ freq, n }: { freq?: number[]; n?: number }) {
  const W = 600, H = 220, PL = 36, PR = 12, PT = 14, PB = 30;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const maxP = 0.24;
  const barW = innerW / DIST.length;

  const points = DIST.map((d, i) => {
    const p = d.cnt / 25;
    const cx = PL + i * barW + barW / 2;
    const cy = PT + innerH - (p / maxP) * innerH;
    return { cx, cy };
  });
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx} ${p.cy}`).join(" ");

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-label="시뮬레이션 vs 이론 막대그래프">
        {[0, 0.06, 0.12, 0.18, 0.24].map((p) => {
          const y = PT + innerH - (p / maxP) * innerH;
          return (
            <g key={p}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={PL - 6} y={y + 3} textAnchor="end" className="fill-slate-500" fontSize={9}>
                {(p * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
        {DIST.map((d, i) => {
          const hasData = freq !== undefined && n !== undefined && n > 0;
          const sp = hasData ? freq[i] / n : 0;
          const h = (sp / maxP) * innerH;
          const x = PL + i * barW + barW * 0.18;
          const bw = barW * 0.64;
          const y = PT + innerH - h;
          return (
            <g key={d.x}>
              {hasData && h > 0.5 ? (
                <rect x={x} y={y} width={bw} height={h} rx={3} fill="rgba(52,211,153,0.55)" stroke="rgba(52,211,153,0.85)" strokeWidth={1.4} />
              ) : null}
              <text x={x + bw / 2} y={H - 10} textAnchor="middle" className="fill-slate-400" fontSize={10}>
                X={d.x}
              </text>
            </g>
          );
        })}
        {/* 이론 라인 */}
        <path d={pathD} fill="none" stroke="rgba(251,191,36,0.95)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={3.2} fill="rgba(251,191,36,1)" />
        ))}
      </svg>
    </div>
  );
}

// ───────────────────────── 탭 5: 직접 해보기 (간이판) ─────────────────────────
// 단순 트랙(시작 → 외직·내직 → 영의정). 강등/유배/사약 함정 일부 포함.

type CellType = "start" | "outer" | "inner" | "high" | "goal" | "demote" | "exile" | "death";
type Cell = { idx: number; label: string; type: CellType; sub?: string };

const TRACK: Cell[] = [
  { idx: 0, label: "출발 (문과 출신)", type: "start", sub: "여기서 시작" },
  { idx: 1, label: "외직 · 황해", type: "outer", sub: "지방관" },
  { idx: 2, label: "외직 · 충청", type: "outer", sub: "지방관" },
  { idx: 3, label: "외직 · 전라", type: "outer", sub: "지방관" },
  { idx: 4, label: "⚠️ 강등", type: "demote", sub: "−3칸" },
  { idx: 5, label: "정9품 · 정자", type: "inner", sub: "9등급" },
  { idx: 6, label: "정8품 · 박사", type: "inner", sub: "8등급" },
  { idx: 7, label: "정7품 · 봉사", type: "inner", sub: "7등급" },
  { idx: 8, label: "⚠️ 유배", type: "exile", sub: "한 턴 쉼" },
  { idx: 9, label: "정6품 · 좌랑", type: "inner", sub: "6등급" },
  { idx: 10, label: "정5품 · 정랑", type: "inner", sub: "5등급" },
  { idx: 11, label: "정4품 · 장령", type: "inner", sub: "4등급" },
  { idx: 12, label: "정3품 · 참의", type: "inner", sub: "3등급" },
  { idx: 13, label: "⚠️ 사약", type: "death", sub: "게임 종료" },
  { idx: 14, label: "종2품 · 참판", type: "high", sub: "2등급" },
  { idx: 15, label: "정2품 · 판서", type: "high", sub: "2등급" },
  { idx: 16, label: "종1품 · 찬성", type: "high", sub: "1등급" },
  { idx: 17, label: "정1품 · 좌의정", type: "high", sub: "1등급" },
  { idx: 18, label: "정1품 · 우의정", type: "high", sub: "1등급" },
  { idx: 19, label: "🏆 영의정", type: "goal", sub: "도착·승리" },
];

const GOAL_IDX = TRACK.length - 1;

type PlayState = {
  pos: number;
  rolls: number;
  skipNext: boolean;
  ended: "win" | "death" | null;
  lastRoll: RollLog | null;
  history: { roll: RollLog; from: number; to: number; effect?: string }[];
};

function initialPlayState(): PlayState {
  return { pos: 0, rolls: 0, skipNext: false, ended: null, lastRoll: null, history: [] };
}

const MOVE_STEP_MS = 240;       // 한 칸 전진/후진 간격
const DEMOTE_PAUSE_MS = 480;    // 강등 칸 도착 후 잠시 강조

function PlayTab() {
  const [state, setState] = useState<PlayState>(initialPlayState);
  const [rolling, setRolling] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [movingDir, setMovingDir] = useState<"forward" | "back" | null>(null);
  const [spinFaces, setSpinFaces] = useState<{ f1: Face; f2: Face } | null>(null);
  const timerRef = useRef<number | null>(null);
  const aliveRef = useRef(true);

  // Strict Mode 의 mount→cleanup→remount 시 ref 가 false 로 굳지 않도록 setup 에서 명시 초기화.
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  function reset() {
    if (animating || rolling) return;
    setState(initialPlayState());
    setSpinFaces(null);
    setMovingDir(null);
  }

  function roll() {
    if (rolling || animating || state.ended) return;

    if (state.skipNext) {
      setState((s) => ({
        ...s,
        skipNext: false,
        history: [
          ...s.history,
          { roll: { f1: { name: "—", val: 0 }, f2: { name: "—", val: 0 }, sum: 0 }, from: s.pos, to: s.pos, effect: "🚷 유배 해제 — 이번 턴 쉼" },
        ],
      }));
      return;
    }

    setRolling(true);
    let elapsed = 0;
    timerRef.current = window.setInterval(() => {
      const f1 = FACES[Math.floor(Math.random() * 5)];
      const f2 = FACES[Math.floor(Math.random() * 5)];
      setSpinFaces({ f1, f2 });
      elapsed += 60;
      if (elapsed > 640) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        const r1 = FACES[Math.floor(Math.random() * 5)];
        const r2 = FACES[Math.floor(Math.random() * 5)];
        const sum = r1.val + r2.val;
        setSpinFaces({ f1: r1, f2: r2 });
        setRolling(false);
        void performTurn({ f1: r1, f2: r2, sum });
      }
    }, 60);
  }

  // 칸 단위 이동 애니메이션(전진 → 함정 효과 → 후진).
  async function performTurn(rollResult: RollLog) {
    setAnimating(true);
    setMovingDir("forward");

    try {
      const startPos = state.pos;
      const target = Math.min(GOAL_IDX, startPos + rollResult.sum);

      for (let p = startPos + 1; p <= target; p++) {
        await sleep(MOVE_STEP_MS);
        if (!aliveRef.current) return;
        setState((s) => ({ ...s, pos: p }));
      }

      const cell = TRACK[target];
      let finalPos = target;
      let effect: string | undefined;
      let ended: "win" | "death" | null = null;
      let skipNext = false;

      if (cell.type === "demote") {
        const back = Math.min(3, target);
        effect = `⚠️ 강등! ${target} → ${target - back} (−${back}칸)`;
        await sleep(DEMOTE_PAUSE_MS);
        if (!aliveRef.current) return;
        setMovingDir("back");
        for (let i = 0; i < back; i++) {
          await sleep(MOVE_STEP_MS);
          if (!aliveRef.current) return;
          finalPos -= 1;
          setState((s) => ({ ...s, pos: finalPos }));
        }
      } else if (cell.type === "exile") {
        effect = "⚠️ 유배! 다음 턴 쉼";
        skipNext = true;
      } else if (cell.type === "death") {
        effect = "💀 사약 — 게임 종료";
        ended = "death";
      } else if (cell.type === "goal" || finalPos === GOAL_IDX) {
        effect = "🏆 영의정 도착 — 승리!";
        ended = "win";
      }

      setState((s) => ({
        ...s,
        pos: finalPos,
        rolls: s.rolls + 1,
        skipNext,
        ended,
        lastRoll: rollResult,
        history: [...s.history, { roll: rollResult, from: startPos, to: finalPos, effect }],
      }));
    } finally {
      // 예외/조기 return 에도 버튼이 잠기지 않도록.
      if (aliveRef.current) {
        setMovingDir(null);
        setAnimating(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
        <p className="text-sm leading-6 text-amber-100">
          🎮 <b>간이 승경도</b>입니다. 실제 승경도판(150~300칸)은 분기·특수 규칙이 매우 많아 학습용으로 단순화했습니다.
          <b className="text-amber-200"> 윤목을 두 번 던져 합만큼 이동</b>하며, 강등·유배·사약 같은 함정이 일부 들어 있습니다.
          영의정에 도달하면 승리예요.
        </p>
      </div>

      {/* 보드 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <PlayBoardSVG pos={state.pos} movingDir={movingDir} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-4">
          <LegendDot color="bg-cyan-400" label="시작" />
          <LegendDot color="bg-emerald-400" label="외직(지방)" />
          <LegendDot color="bg-amber-400" label="내직" />
          <LegendDot color="bg-rose-400" label="함정·종료" />
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-200">
              현재 위치: <span className="font-mono text-amber-200">#{state.pos} · {TRACK[state.pos].label}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              굴린 횟수: <b className="text-cyan-200">{state.rolls}</b>회
              {state.skipNext ? <span className="ml-2 text-amber-200">· 다음 턴 쉼</span> : null}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={roll}
              disabled={rolling || animating || !!state.ended}
              className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 px-5 py-2.5 text-sm font-bold text-amber-50 transition hover:from-amber-500 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {animating
                ? movingDir === "back" ? "↩️ 뒤로 이동 중..." : "➡️ 이동 중..."
                : state.skipNext ? "🚷 유배 해제 (쉼)" : "🎲 윤목 던지기"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={rolling || animating}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              🔄 초기화
            </button>
          </div>
        </div>

        {/* 마지막 굴림 표시 */}
        {spinFaces ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <DiceResult label="1번째" face={spinFaces.f1} lit={!rolling} />
            <span className="text-2xl font-black text-slate-600">+</span>
            <DiceResult label="2번째" face={spinFaces.f2} lit={!rolling} />
            <span className="text-2xl font-black text-slate-600">=</span>
            <div className={`rounded-xl border-2 px-5 py-3 text-center transition ${!rolling ? "border-indigo-400/60 bg-indigo-400/15" : "border-indigo-400/30 bg-indigo-500/5"}`}>
              <p className="text-xs font-semibold text-slate-400">이동 칸</p>
              <p className="text-3xl font-black text-indigo-200">{spinFaces.f1.val + spinFaces.f2.val}</p>
            </div>
          </div>
        ) : null}

        {state.ended ? (
          <div
            className={`mt-4 rounded-xl border p-4 text-center ${
              state.ended === "win"
                ? "border-amber-400/50 bg-amber-400/10 text-amber-100"
                : "border-rose-400/50 bg-rose-400/10 text-rose-100"
            }`}
          >
            <p className="text-2xl">{state.ended === "win" ? "🏆 영의정 도달!" : "💀 사약 — 게임 종료"}</p>
            <p className="mt-1 text-sm">
              총 <b>{state.rolls}</b>번 윤목을 굴렸습니다.
              {state.ended === "win" ? " 윤목 두 번 던진 평균은 6이므로 이론상 약 " + Math.ceil(GOAL_IDX / 6) + "번이 최소 기대치입니다." : " 다시 도전해 보세요."}
            </p>
          </div>
        ) : null}
      </div>

      {/* 진행 로그 */}
      {state.history.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-bold text-amber-300">📜 진행 기록</p>
          <ol className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
            {state.history.map((h, i) => (
              <li key={i} className="flex items-start gap-2 rounded-md bg-white/[0.03] px-2 py-1.5">
                <span className="w-7 font-mono text-slate-500">#{i + 1}</span>
                <span className="flex-1 text-slate-300">
                  {h.roll.sum > 0 ? (
                    <>
                      <span className="font-mono text-amber-200">{h.roll.f1.name}+{h.roll.f2.name}={h.roll.sum}</span>
                      <span className="ml-2 text-slate-500">{h.from} → {h.to}</span>
                    </>
                  ) : (
                    <span className="text-slate-400">(쉼)</span>
                  )}
                  {h.effect ? <span className="ml-2 text-rose-300">{h.effect}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

// 간이 보드 SVG: TRACK 을 격자형(5칸 × 4줄)으로 배치, 말 위치 표시.
function PlayBoardSVG({ pos, movingDir }: { pos: number; movingDir: "forward" | "back" | null }) {
  const COLS = 5;
  const W = 720;
  const H = 420;
  const cellW = (W - 40) / COLS;
  const cellH = 80;

  // 사행(boustrophedon) 배치: 짝수 행은 왼→오, 홀수 행은 오→왼.
  const positions = TRACK.map((_, i) => {
    const row = Math.floor(i / COLS);
    const colRaw = i % COLS;
    const col = row % 2 === 0 ? colRaw : COLS - 1 - colRaw;
    return { x: 20 + col * cellW, y: 20 + row * (cellH + 12) };
  });

  function fillFor(type: CellType): { fill: string; stroke: string; text: string } {
    if (type === "start") return { fill: "rgba(34,211,238,0.18)", stroke: "rgba(34,211,238,0.7)", text: "fill-cyan-100" };
    if (type === "outer") return { fill: "rgba(34,197,94,0.12)", stroke: "rgba(34,197,94,0.55)", text: "fill-emerald-100" };
    if (type === "inner") return { fill: "rgba(251,191,36,0.10)", stroke: "rgba(251,191,36,0.45)", text: "fill-amber-100" };
    if (type === "high") return { fill: "rgba(251,191,36,0.20)", stroke: "rgba(251,191,36,0.75)", text: "fill-amber-50" };
    if (type === "goal") return { fill: "rgba(251,191,36,0.32)", stroke: "rgba(34,211,238,0.85)", text: "fill-amber-50" };
    if (type === "demote") return { fill: "rgba(248,113,113,0.15)", stroke: "rgba(248,113,113,0.6)", text: "fill-rose-100" };
    if (type === "exile") return { fill: "rgba(248,113,113,0.18)", stroke: "rgba(248,113,113,0.6)", text: "fill-rose-100" };
    return { fill: "rgba(127,29,29,0.32)", stroke: "rgba(248,113,113,0.85)", text: "fill-rose-50" };
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-label="간이 승경도 보드">
        {/* 경로 라인 */}
        {positions.slice(0, -1).map((p, i) => {
          const next = positions[i + 1];
          const cx1 = p.x + cellW / 2, cy1 = p.y + cellH / 2;
          const cx2 = next.x + cellW / 2, cy2 = next.y + cellH / 2;
          return <line key={i} x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke="rgba(255,255,255,0.06)" strokeWidth={2} />;
        })}
        {/* 칸 */}
        {TRACK.map((c, i) => {
          const p = positions[i];
          const t = fillFor(c.type);
          const isHere = i === pos;
          return (
            <g key={c.idx}>
              <rect
                x={p.x}
                y={p.y}
                width={cellW - 6}
                height={cellH}
                rx={8}
                fill={t.fill}
                stroke={isHere ? "rgba(34,211,238,1)" : t.stroke}
                strokeWidth={isHere ? 3 : 1.5}
              />
              <text x={p.x + 8} y={p.y + 14} className="fill-slate-500" fontSize={9} fontWeight={700}>#{c.idx}</text>
              <text x={p.x + (cellW - 6) / 2} y={p.y + 38} textAnchor="middle" className={t.text} fontSize={12} fontWeight={800}>
                {c.label}
              </text>
              {c.sub ? (
                <text x={p.x + (cellW - 6) / 2} y={p.y + 56} textAnchor="middle" className="fill-slate-400" fontSize={10}>
                  {c.sub}
                </text>
              ) : null}
              {/* 말 */}
              {isHere ? (
                <g>
                  <circle
                    cx={p.x + (cellW - 6) - 14}
                    cy={p.y + cellH - 14}
                    r={11}
                    fill={movingDir === "back" ? "rgba(248,113,113,1)" : "rgba(34,211,238,1)"}
                    stroke="rgba(255,255,255,0.95)"
                    strokeWidth={2.2}
                  />
                  <text x={p.x + (cellW - 6) - 14} y={p.y + cellH - 10} textAnchor="middle" className="fill-slate-950" fontSize={10} fontWeight={900}>●</text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

