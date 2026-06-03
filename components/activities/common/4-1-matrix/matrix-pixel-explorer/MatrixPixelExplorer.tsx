"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "pixel_matrix_correspondence",
    prompt:
      "8×8 흑백 사진과 8행 8열 행렬은 ‘(i, j) 픽셀의 밝기값 = (i, j) 성분’ 으로 정확히 대응합니다. 탭 ② 에서 직접 그린 ❤️ 또는 😊 패턴 하나를 골라, 그림의 어떤 특징이 행렬의 어떤 패턴 (특정 행/열에 0 이 몰림, 대각선이 같은 값 등) 으로 나타나는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: ❤️ 하트. 가운데 (3·4 행) 가 가장 넓게 0 (검정) 으로 채워져 있고, 행이 위·아래로 갈수록 0 의 폭이 좁아진다. 행렬에서도 3·4 행은 0 이 거의 8 개 연속이고, 6·7 행은 가운데 2 개만 0. 즉 ‘좌우 대칭 모양’ 이 ‘각 행의 0 분포가 가운데 기준 대칭’ 으로 그대로 나타난다.",
  },
  {
    id: "matrix_as_image_ops",
    prompt:
      "컬러 사진은 R · G · B 세 개 행렬로 분해됩니다 (탭 ③). 그리고 사진 보정 (밝기 +, 색상 반전, 좌우 대칭 등) 은 행렬 성분에 수학 연산을 적용하는 것입니다 (탭 ④). 이 두 사실을 종합해 ‘컴퓨터가 사진을 처리하는 것은 결국 행렬을 다루는 것이다’ 라는 명제를 자신의 말로 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: 컬러 사진의 모든 정보는 R·G·B 세 개 행렬에 숫자로 들어 있다. 따라서 사진을 ‘본다’ 는 것은 세 행렬의 값을 픽셀 색으로 그린 것이고, 사진을 ‘바꾼다’ 는 것은 세 행렬의 각 성분에 같은 규칙으로 연산을 적용하는 것이다. 예) 밝기 +80 = 모든 성분에 80 을 더하기 (스칼라 덧셈), 색상 반전 = 모든 성분을 (255 − 값) 으로 바꾸기, 좌우 대칭 = j 열 성분을 (n+1−j) 열 성분과 교환. 결국 사진 편집기는 ‘행렬 연산기’.",
  },
];

// ─── 데이터 ────────────────────────────────────────────────
// 8×8 하트 (탭 ①)
const IMG_HEART: number[][] = [
  [235, 235, 235, 235, 235, 235, 235, 235],
  [235, 30, 30, 235, 30, 30, 235, 235],
  [30, 30, 30, 30, 30, 30, 30, 235],
  [30, 30, 30, 30, 30, 30, 30, 30],
  [235, 30, 30, 30, 30, 30, 30, 235],
  [235, 235, 30, 30, 30, 30, 235, 235],
  [235, 235, 235, 30, 30, 235, 235, 235],
  [235, 235, 235, 235, 235, 235, 235, 235],
];

// 그리기용 6단계 밝기
const LEVELS = [255, 200, 150, 100, 50, 0];

// 6×6 컬러 (노을 그라디언트)
const CIMG: [number, number, number][][] = [
  [[230, 90, 50], [210, 100, 60], [180, 120, 80], [150, 140, 120], [100, 130, 180], [70, 100, 220]],
  [[220, 100, 55], [200, 110, 65], [170, 130, 85], [140, 150, 125], [90, 140, 185], [65, 110, 225]],
  [[205, 115, 65], [185, 125, 75], [160, 140, 95], [130, 160, 135], [85, 150, 195], [60, 120, 230]],
  [[185, 128, 75], [165, 138, 85], [145, 152, 108], [120, 165, 145], [80, 160, 200], [55, 132, 235]],
  [[165, 138, 88], [148, 148, 98], [130, 162, 118], [110, 172, 158], [75, 168, 208], [50, 142, 240]],
  [[145, 148, 98], [130, 158, 108], [115, 168, 128], [95, 178, 168], [70, 172, 215], [45, 152, 245]],
];

// 6×6 보정 실험 (알파벳 F)
const PROC6: number[][] = [
  [220, 220, 220, 220, 220, 20],
  [220, 20, 20, 20, 20, 20],
  [220, 220, 220, 220, 20, 20],
  [220, 20, 20, 20, 20, 20],
  [220, 20, 20, 20, 20, 20],
  [220, 20, 20, 20, 20, 20],
];

// ❤️ / 😊 프리셋
const HEART_FILL: number[][] = [
  [255, 255, 255, 255, 255, 255, 255, 255],
  [255, 0, 0, 255, 0, 0, 255, 255],
  [0, 0, 0, 0, 0, 0, 0, 255],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [255, 0, 0, 0, 0, 0, 0, 255],
  [255, 255, 0, 0, 0, 0, 255, 255],
  [255, 255, 255, 0, 0, 255, 255, 255],
  [255, 255, 255, 255, 255, 255, 255, 255],
];
const SMILEY_FILL: number[][] = [
  [255, 255, 0, 0, 0, 0, 255, 255],
  [255, 0, 200, 200, 200, 200, 0, 255],
  [0, 200, 0, 200, 200, 0, 200, 0],
  [0, 200, 200, 200, 200, 200, 200, 0],
  [0, 200, 0, 200, 200, 0, 200, 0],
  [0, 200, 200, 0, 0, 200, 200, 0],
  [255, 0, 200, 200, 200, 200, 0, 255],
  [255, 255, 0, 0, 0, 0, 255, 255],
];
const EMPTY_8x8: number[][] = Array.from({ length: 8 }, () => Array(8).fill(255));

// ─── 메인 ─────────────────────────────────────────────────
type MainTab = 0 | 1 | 2 | 3;

export default function MatrixPixelExplorer() {
  const [tab, setTab] = useState<MainTab>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">📷 사진 속 행렬 탐험</h3>
        <p className="mt-2 leading-7 text-slate-300">
          컴퓨터는 사진을 어떻게 저장할까요? 픽셀과 행렬의 1 : 1 대응부터 컬러 채널
          분해, 사진 보정까지 — 모두 <b className="text-cyan-300">행렬</b> 의 세계로
          연결돼 있습니다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MainTabBtn active={tab === 0} onClick={() => setTab(0)}>📷 픽셀 &amp; 행렬</MainTabBtn>
        <MainTabBtn active={tab === 1} onClick={() => setTab(1)}>🎨 흑백 그리기</MainTabBtn>
        <MainTabBtn active={tab === 2} onClick={() => setTab(2)}>🌈 컬러의 비밀</MainTabBtn>
        <MainTabBtn active={tab === 3} onClick={() => setTab(3)}>🔧 사진 보정 실험실</MainTabBtn>
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <PixelTab />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <DrawTab />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <ColorTab />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <ProcessTab />
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

function MainTabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-xl px-3 py-2.5 text-center text-[11px] font-bold transition sm:text-xs " +
        (active
          ? "bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-500/25"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-cyan-200")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 UI ──────────────────────────────────────────────
function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">{children}</div>
  );
}
function CardTitle({ children }: { children: ReactNode }) {
  return <p className="text-sm font-extrabold text-cyan-200">{children}</p>;
}
function Desc({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs leading-7 text-slate-300">{children}</p>;
}
function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="ml-1 inline-flex items-center rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-200">
      {children}
    </span>
  );
}
function HL({ children }: { children: ReactNode }) {
  return <b className="text-amber-300">{children}</b>;
}
function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2 text-xs leading-7 text-slate-200">
      {children}
    </div>
  );
}

function MatrixBracket({ children, n }: { children: ReactNode; n: number }) {
  return (
    <div className="flex items-stretch gap-1">
      <Bracket open n={n} />
      <div>{children}</div>
      <Bracket open={false} n={n} />
    </div>
  );
}
function Bracket({ open, n }: { open: boolean; n: number }) {
  const h = n * 36 + (n - 1) * 2;
  return (
    <svg width={10} height={h} viewBox={`0 0 10 ${h}`} aria-hidden>
      {open ? (
        <path
          d={`M 8 1 L 1 1 L 1 ${h - 1} L 8 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : (
        <path
          d={`M 2 1 L 9 1 L 9 ${h - 1} L 2 ${h - 1}`}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 0 — 픽셀 & 행렬 (8×8 하트, 클릭/스캔)
// ═══════════════════════════════════════════════════════════

function PixelTab() {
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [scanIdx, setScanIdx] = useState<number>(-1); // -1 = idle, 0~63 = current
  const [scanDone, setScanDone] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  function brightLabel(v: number): string {
    if (v < 50) return "검정";
    if (v < 100) return "매우 어두운 회색";
    if (v < 180) return "회색";
    if (v < 240) return "밝은 회색";
    return "흰색";
  }

  function clickPx(r: number, c: number) {
    if (scanIdx >= 0 && scanIdx < 64) return; // 스캔 중에는 무시
    setSel({ r, c });
  }

  function reset() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setScanIdx(-1);
    setScanDone(false);
    setSel(null);
  }

  function scan() {
    if (scanIdx >= 0 && scanIdx < 64) return; // 진행 중이면 무시
    reset();
    setScanIdx(0);
    let i = 0;
    const tick = () => {
      if (i >= 64) {
        setScanIdx(64);
        setScanDone(true);
        timerRef.current = null;
        return;
      }
      setScanIdx(i);
      i++;
      timerRef.current = window.setTimeout(tick, 80);
    };
    tick();
  }

  const scanning = scanIdx >= 0 && scanIdx < 64;
  const scannedSet = useMemo(() => {
    if (scanIdx < 0) return new Set<number>();
    const s = new Set<number>();
    for (let i = 0; i <= Math.min(scanIdx, 63); i++) s.add(i);
    return s;
  }, [scanIdx]);

  const ib = (() => {
    if (scanning && scanIdx >= 0) {
      const r = Math.floor(scanIdx / 8);
      const c = scanIdx % 8;
      const v = IMG_HEART[r][c];
      return (
        <>
          🔍 스캔 중... <HL>({r + 1} 행, {c + 1} 열)</HL> → 밝기:{" "}
          <HL>{v}</HL>
        </>
      );
    }
    if (scanDone) {
      return (
        <>
          ✅ 스캔 완료! <HL>64 개</HL> 의 픽셀 밝기값이 모두 행렬에 저장되었어요.
        </>
      );
    }
    if (sel) {
      const v = IMG_HEART[sel.r][sel.c];
      return (
        <>
          📍 위치: <HL>{sel.r + 1} 행 {sel.c + 1} 열</HL> · 밝기값: <HL>{v}</HL> ·{" "}
          <span
            className="ml-1 inline-block h-3 w-3 rounded-sm align-middle"
            style={{ background: `rgb(${v},${v},${v})`, border: "1px solid #475569" }}
          />{" "}
          <HL>{brightLabel(v)}</HL>
        </>
      );
    }
    return <>← 픽셀을 클릭하면 위치와 밝기값을 확인할 수 있어요!</>;
  })();

  const pct = scanning ? ((scanIdx + 1) / 64) * 100 : scanDone ? 100 : 0;

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>💡 컴퓨터는 사진을 어떻게 저장할까?</CardTitle>
        <Desc>
          흑백 사진의 각 픽셀은 <b>0 (검정) ~ 255 (흰색)</b> 밝기값 하나로 저장돼요. 이
          수들을 직사각형으로 배열하면 바로 <b>행렬</b>! 픽셀을 클릭하거나 스캔
          애니메이션을 눌러보세요.
        </Desc>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-center gap-6">
          <div>
            <p className="mb-1 text-xs font-bold text-slate-300">
              🖼️ 픽셀 이미지 <Badge>8×8</Badge>
            </p>
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: "repeat(8, 32px)" }}
            >
              {IMG_HEART.flatMap((row, r) =>
                row.map((v, c) => {
                  const idx = r * 8 + c;
                  const isSel = sel?.r === r && sel?.c === c;
                  const isScanCur = scanning && scanIdx === idx;
                  const ring = isSel || isScanCur ? "outline outline-2 outline-amber-300" : "";
                  return (
                    <div
                      key={`pc-${r}-${c}`}
                      onClick={() => clickPx(r, c)}
                      className={`h-8 w-8 cursor-pointer rounded-sm transition ${ring}`}
                      style={{ background: `rgb(${v},${v},${v})` }}
                    />
                  );
                }),
              )}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold text-slate-300">
              📊 행렬 <Badge>8 행 8 열</Badge>
            </p>
            <MatrixBracket n={8}>
              <div
                className="grid gap-[2px]"
                style={{ gridTemplateColumns: "repeat(8, 32px)" }}
              >
                {IMG_HEART.flatMap((row, r) =>
                  row.map((v, c) => {
                    const idx = r * 8 + c;
                    const isSel = sel?.r === r && sel?.c === c;
                    const isScanCur = scanning && scanIdx === idx;
                    const isScanned = scannedSet.has(idx);
                    return (
                      <div
                        key={`mc-${r}-${c}`}
                        className={
                          "flex h-9 items-center justify-center rounded-sm border text-[10px] font-mono font-bold transition " +
                          (isSel || isScanCur
                            ? "border-amber-300 bg-amber-300/20 text-amber-100"
                            : isScanned
                              ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-100"
                              : "border-white/10 bg-slate-900 text-slate-400")
                        }
                      >
                        {v}
                      </div>
                    );
                  }),
                )}
              </div>
            </MatrixBracket>
          </div>
        </div>

        <div className="mt-3">
          <InfoBox>{ib}</InfoBox>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={scan}
            disabled={scanning}
            className="rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 disabled:opacity-60"
          >
            {scanning ? "⏳ 스캔 중..." : scanDone ? "▶ 다시 스캔" : "▶ 픽셀 스캔 애니메이션"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            ↺ 초기화
          </button>
        </div>

        <div className="mt-3">
          <InfoBox>
            💡 이미지가 <HL>8 행 × 8 열</HL> 이면 행렬도 <HL>8 행 8 열</HL> · 행렬의{" "}
            <HL>(i, j) 성분</HL> = i 행 j 열 픽셀의 밝기값
          </InfoBox>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 흑백 그리기
// ═══════════════════════════════════════════════════════════

function DrawTab() {
  const [grid, setGrid] = useState<number[][]>(() => EMPTY_8x8.map((row) => [...row]));

  function toggleCell(r: number, c: number) {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      const idx = LEVELS.indexOf(next[r][c]);
      next[r][c] = LEVELS[(idx + 1) % LEVELS.length];
      return next;
    });
  }
  function setPreset(d: number[][]) {
    setGrid(d.map((row) => [...row]));
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>🎨 나만의 흑백 픽셀 아트</CardTitle>
        <Desc>
          격자를 클릭해서 밝기를 바꿔보세요! 오른쪽 <b>행렬이 실시간으로 바뀌는 것</b>
          을 확인하세요.
        </Desc>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-center gap-6">
          <div>
            <p className="mb-1 text-xs font-bold text-slate-300">
              🖌️ 그리기 <Badge>8×8</Badge>
            </p>
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: "repeat(8, 37px)" }}
            >
              {grid.flatMap((row, r) =>
                row.map((v, c) => (
                  <div
                    key={`art-${r}-${c}`}
                    onClick={() => toggleCell(r, c)}
                    className="h-9 w-9 cursor-pointer rounded-sm border border-white/10 transition hover:scale-105"
                    style={{ background: `rgb(${v},${v},${v})` }}
                  />
                )),
              )}
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setPreset(HEART_FILL)}
                className="rounded-full bg-gradient-to-br from-rose-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white"
              >
                ❤️ 하트
              </button>
              <button
                type="button"
                onClick={() => setPreset(SMILEY_FILL)}
                className="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-bold text-white"
              >
                😊 스마일
              </button>
              <button
                type="button"
                onClick={() => setPreset(EMPTY_8x8)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200"
              >
                🗑️ 지우기
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold text-slate-300">
              📊 실시간 행렬 <Badge>8 행 8 열</Badge>
            </p>
            <MatrixBracket n={8}>
              <div
                className="grid gap-[2px]"
                style={{ gridTemplateColumns: "repeat(8, 32px)" }}
              >
                {grid.flatMap((row, r) =>
                  row.map((v, c) => (
                    <div
                      key={`m1-${r}-${c}`}
                      className={
                        "flex h-9 items-center justify-center rounded-sm border text-[10px] font-mono font-bold transition " +
                        (v < 80
                          ? "border-white/5 bg-slate-950 text-slate-500"
                          : v < 180
                            ? "border-white/10 bg-slate-900 text-slate-400"
                            : "border-white/10 bg-slate-900 text-slate-200")
                      }
                    >
                      {v}
                    </div>
                  )),
                )}
              </div>
            </MatrixBracket>
          </div>
        </div>

        <div className="mt-3">
          <InfoBox>
            🎯 <HL>0</HL> = 검정 · <HL>255</HL> = 흰색 · 중간값 = 회색 · 클릭할 때마다
            밝기 단계 변경 (255 → 200 → 150 → 100 → 50 → 0 → 255 ...)
          </InfoBox>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 컬러의 비밀 (R/G/B 채널)
// ═══════════════════════════════════════════════════════════

type Channel = "o" | "r" | "g" | "b";

function ColorTab() {
  const [ch, setCh] = useState<Channel>("o");

  const chLabel: Record<Channel, string> = {
    o: "🌈 원본",
    r: "🔴 R 채널 (빨강)",
    g: "🟢 G 채널 (초록)",
    b: "🔵 B 채널 (파랑)",
  };
  const chInfo: Record<Channel, ReactNode> = {
    o: (
      <>
        원본의 각 픽셀은 R · G · B 세 값을 가져요. 채널 버튼을 눌러 각 성분을
        확인하세요!
      </>
    ),
    r: (
      <>
        <HL>R 채널 행렬</HL>: 빨간색 성분의 세기. 값이 클수록 붉은 빛이 강해요.
      </>
    ),
    g: (
      <>
        <HL>G 채널 행렬</HL>: 초록색 성분의 세기. 값이 클수록 녹색 빛이 강해요.
      </>
    ),
    b: (
      <>
        <HL>B 채널 행렬</HL>: 파란색 성분의 세기. 값이 클수록 파란 빛이 강해요.
      </>
    ),
  };
  const chColor: Record<Channel, string> = {
    o: "#cbd5e1",
    r: "#fca5a5",
    g: "#86efac",
    b: "#93c5fd",
  };

  function pixelBg(rv: number, gv: number, bv: number): string {
    switch (ch) {
      case "o":
        return `rgb(${rv},${gv},${bv})`;
      case "r":
        return `rgb(${rv},0,0)`;
      case "g":
        return `rgb(0,${gv},0)`;
      case "b":
        return `rgb(0,0,${bv})`;
    }
  }
  function chValue(rv: number, gv: number, bv: number): number {
    switch (ch) {
      case "r":
        return rv;
      case "g":
        return gv;
      case "b":
        return bv;
      default:
        return 0;
    }
  }

  const showMatrix = ch !== "o";

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>🌈 컬러 사진 = 행렬 3 개!</CardTitle>
        <Desc>
          컬러 사진의 각 픽셀은 R · G · B 세 채널로 구성돼요. 각 채널은 하나의 행렬로
          저장됩니다!
        </Desc>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-2">
          <ChannelBtn ch="o" cur={ch} onClick={setCh} label="🌈 원본" border="#475569" />
          <ChannelBtn ch="r" cur={ch} onClick={setCh} label="🔴 R 채널" border="#ef4444" />
          <ChannelBtn ch="g" cur={ch} onClick={setCh} label="🟢 G 채널" border="#22c55e" />
          <ChannelBtn ch="b" cur={ch} onClick={setCh} label="🔵 B 채널" border="#3b82f6" />
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-center gap-6">
          <div>
            <p className="mb-1 text-xs font-bold text-slate-300">
              {chLabel[ch]} <Badge>6×6</Badge>
            </p>
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: "repeat(6, 38px)" }}
            >
              {CIMG.flatMap((row, r) =>
                row.map(([rv, gv, bv], c) => (
                  <div
                    key={`cg-${r}-${c}`}
                    className="h-9 w-9 rounded-sm transition"
                    style={{ background: pixelBg(rv, gv, bv) }}
                  />
                )),
              )}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold text-slate-300">📊 행렬</p>
            {showMatrix ? (
              <MatrixBracket n={6}>
                <div
                  className="grid gap-[2px]"
                  style={{ gridTemplateColumns: "repeat(6, 38px)" }}
                >
                  {CIMG.flatMap((row, r) =>
                    row.map(([rv, gv, bv], c) => (
                      <div
                        key={`cm-${r}-${c}`}
                        className="flex h-9 items-center justify-center rounded-sm border border-white/10 bg-slate-900 text-[11px] font-mono font-bold"
                        style={{ color: chColor[ch] }}
                      >
                        {chValue(rv, gv, bv)}
                      </div>
                    )),
                  )}
                </div>
              </MatrixBracket>
            ) : (
              <p className="max-w-[210px] py-2 text-xs text-slate-500">
                ← 채널 버튼을 누르면 행렬이 나타납니다!
              </p>
            )}
          </div>
        </div>

        <div className="mt-3">
          <InfoBox>{chInfo[ch]}</InfoBox>
        </div>
      </Card>

      <Card>
        <CardTitle>🔢 컬러 사진 = R 행렬 + G 행렬 + B 행렬</CardTitle>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <ChannelMini channel="r" />
          <span className="text-xl font-bold text-cyan-300">+</span>
          <ChannelMini channel="g" />
          <span className="text-xl font-bold text-cyan-300">+</span>
          <ChannelMini channel="b" />
          <span className="text-xl font-bold text-cyan-300">=</span>
          <div className="text-center">
            <p className="mb-1 text-[11px] font-bold text-cyan-100">🌈 컬러</p>
            <div
              className="grid gap-[1px]"
              style={{ gridTemplateColumns: "repeat(6, 19px)" }}
            >
              {CIMG.flatMap((row, r) =>
                row.map(([rv, gv, bv], c) => (
                  <div
                    key={`pv-${r}-${c}`}
                    className="h-[19px] w-[19px] rounded-[2px]"
                    style={{ background: `rgb(${rv},${gv},${bv})` }}
                  />
                )),
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <InfoBox>
            📱 <HL>1920×1080</HL> 컬러 사진 → <HL>1080 행 1920 열</HL> 행렬 3 개 → 수{" "}
            <HL>6,220,800 개</HL> 로 저장!
          </InfoBox>
        </div>
      </Card>
    </div>
  );
}

function ChannelBtn({
  ch,
  cur,
  onClick,
  label,
  border,
}: {
  ch: Channel;
  cur: Channel;
  onClick: (c: Channel) => void;
  label: string;
  border: string;
}) {
  const active = cur === ch;
  return (
    <button
      type="button"
      onClick={() => onClick(ch)}
      className={
        "rounded-full px-3 py-1.5 text-xs font-bold transition " +
        (active
          ? "text-white shadow-lg"
          : "border bg-white/5 text-slate-200 hover:bg-white/10")
      }
      style={
        active
          ? { background: border, borderColor: border }
          : { borderColor: border + "70" }
      }
    >
      {label}
    </button>
  );
}

function ChannelMini({ channel }: { channel: "r" | "g" | "b" }) {
  const palette: Record<typeof channel, { lbl: string; col: string; idx: 0 | 1 | 2 }> = {
    r: { lbl: "🔴 R", col: "#fca5a5", idx: 0 },
    g: { lbl: "🟢 G", col: "#86efac", idx: 1 },
    b: { lbl: "🔵 B", col: "#93c5fd", idx: 2 },
  };
  const p = palette[channel];
  return (
    <div className="text-center">
      <p className="mb-1 text-[11px] font-bold" style={{ color: p.col }}>
        {p.lbl}
      </p>
      <div className="rounded-md border border-white/10 bg-slate-900/60 p-1.5">
        <pre
          className="text-[8px] leading-[10px]"
          style={{ color: p.col, fontFamily: "ui-monospace, monospace" }}
        >
          {CIMG.map((row) => row.map((px) => String(px[p.idx]).padStart(3)).join(" "))
            .join("\n")}
        </pre>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 사진 보정 실험실
// ═══════════════════════════════════════════════════════════

type ProcType =
  | "orig"
  | "invert"
  | "flipH"
  | "flipV"
  | "bright+"
  | "bright-"
  | "thresh";

const PROC_DATA: Record<
  ProcType,
  { title: string; eq: string; info: ReactNode }
> = {
  orig: {
    title: "🖼️ 보정 이미지 (원본)",
    eq: "변환 없음  —  a(i, j) = 원본값",
    info: <>원본 이미지입니다. 변환 버튼을 눌러보세요!</>,
  },
  invert: {
    title: "🔄 색상 반전",
    eq: "반전:  a(i, j)  →  255 − a(i, j)",
    info: (
      <>
        <b>색상 반전 (Negative)</b>: 각 성분값을 255 에서 빼요. 밝은 부분 ↔ 어두운 부분이
        뒤바뀝니다! 사진 필름을 인화할 때 쓰이는 원리예요.
      </>
    ),
  },
  flipH: {
    title: "↔️ 좌우 대칭",
    eq: "좌우 대칭:  a(i, j)  →  a(i, n+1−j)",
    info: (
      <>
        <b>좌우 대칭 (Horizontal Flip)</b>: 각 행 안에서 j 열 성분을 (n+1−j) 열 성분과
        바꿔요. 셀카 사진 미러 효과가 이 원리입니다!
      </>
    ),
  },
  flipV: {
    title: "↕️ 상하 대칭",
    eq: "상하 대칭:  a(i, j)  →  a(m+1−i, j)",
    info: (
      <>
        <b>상하 대칭 (Vertical Flip)</b>: i 행 성분을 (m+1−i) 행 성분과 바꿔요. 행 전체를
        위아래로 뒤집는 것입니다!
      </>
    ),
  },
  "bright+": {
    title: "☀️ 밝기 높이기",
    eq: "밝기 +:  a(i, j)  →  min( a(i, j) + 80, 255 )",
    info: (
      <>
        <b>밝기 높이기</b>: 모든 성분에 상수 80 을 더해요 (최대 255). 이것이 바로{" "}
        <b>행렬의 스칼라 덧셈</b> 입니다!
      </>
    ),
  },
  "bright-": {
    title: "🌙 밝기 낮추기",
    eq: "밝기 −:  a(i, j)  →  max( a(i, j) − 80, 0 )",
    info: (
      <>
        <b>밝기 낮추기</b>: 모든 성분에서 상수 80 을 빼요 (최소 0). 행렬에서 상수를
        빼는 것입니다!
      </>
    ),
  },
  thresh: {
    title: "🎯 이진화 (Threshold)",
    eq: "이진화:  a(i, j) ≥ 128  →  255,  그 외  →  0",
    info: (
      <>
        <b>이진화</b>: 128 이상이면 255 (흰색), 미만이면 0 (검정) 으로 바꿔요. QR 코드 ·
        바코드가 이 방식으로 만들어집니다!
      </>
    ),
  },
};

function applyProcessing(data: number[][], type: ProcType): number[][] {
  return data.map((row, r) =>
    row.map((v, c) => {
      switch (type) {
        case "orig":
          return v;
        case "invert":
          return 255 - v;
        case "flipH":
          return data[r][5 - c];
        case "flipV":
          return data[5 - r][c];
        case "bright+":
          return Math.min(v + 80, 255);
        case "bright-":
          return Math.max(v - 80, 0);
        case "thresh":
          return v >= 128 ? 255 : 0;
      }
    }),
  );
}

const PROC_BTNS: { type: ProcType; label: string }[] = [
  { type: "orig", label: "🖼️ 원본" },
  { type: "invert", label: "🔄 색상 반전" },
  { type: "flipH", label: "↔️ 좌우 대칭" },
  { type: "flipV", label: "↕️ 상하 대칭" },
  { type: "bright+", label: "☀️ 밝기 높이기" },
  { type: "bright-", label: "🌙 밝기 낮추기" },
  { type: "thresh", label: "🎯 이진화" },
];

function ProcessTab() {
  const [type, setType] = useState<ProcType>("orig");
  const processed = useMemo(() => applyProcessing(PROC6, type), [type]);
  // 대칭(flip)은 값 자체가 바뀌는 게 아니라 위치만 재배치 → 셀별 변화 비교 의미 없음
  const isFlip = type === "flipH" || type === "flipV";
  const changedCount = useMemo(() => {
    if (isFlip) return -1; // -1 = '재배치' 표시
    let n = 0;
    for (let r = 0; r < 6; r++)
      for (let c = 0; c < 6; c++) if (PROC6[r][c] !== processed[r][c]) n++;
    return n;
  }, [processed, isFlip]);
  const data = PROC_DATA[type];

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle>🔧 행렬로 하는 사진 보정!</CardTitle>
        <Desc>
          사진 보정도 사실은 <b>행렬의 각 성분값을 수학적으로 바꾸는 것</b> 이에요.
          버튼을 눌러 이미지와 행렬이 어떻게 변하는지 확인해보세요!
        </Desc>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-2">
          {PROC_BTNS.map((b) => {
            const active = type === b.type;
            return (
              <button
                key={b.type}
                type="button"
                onClick={() => setType(b.type)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-bold transition " +
                  (active
                    ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/25"
                    : "border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
                }
              >
                {b.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-start justify-center gap-4">
          {/* 원본 이미지 — 항상 왼쪽에 표시 (다른 탭들과 동일) */}
          <div>
            <p className="mb-1 text-xs font-bold text-slate-300">🖼️ 원본 이미지</p>
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: "repeat(6, 35px)" }}
            >
              {PROC6.flatMap((row, r) =>
                row.map((v, c) => (
                  <div
                    key={`og-${r}-${c}`}
                    className="h-[35px] w-[35px] rounded-sm"
                    style={{ background: `rgb(${v},${v},${v})` }}
                  />
                )),
              )}
            </div>
          </div>

          <span className="self-center text-xl font-bold text-cyan-300">→</span>

          {/* 보정 이미지 */}
          <div>
            <p className="mb-1 text-xs font-bold text-slate-300">{data.title}</p>
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: "repeat(6, 35px)" }}
            >
              {processed.flatMap((row, r) =>
                row.map((v, c) => {
                  // 대칭은 셀별 변화 강조 없이 깔끔하게 결과만 표시
                  const changed = !isFlip && v !== PROC6[r][c];
                  return (
                    <div
                      key={`pi-${r}-${c}`}
                      className="h-[35px] w-[35px] rounded-sm transition"
                      style={{
                        background: `rgb(${v},${v},${v})`,
                        border: changed ? "2px solid #f59e0b" : "2px solid transparent",
                      }}
                    />
                  );
                }),
              )}
            </div>
          </div>

          {/* 보정 후 행렬 */}
          <div>
            <p className="mb-1 text-xs font-bold text-slate-300">
              📊 보정 후 행렬{" "}
              <span
                className={
                  "ml-1 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold " +
                  (changedCount === -1
                    ? "border-emerald-400/45 bg-emerald-400/15 text-emerald-200"
                    : changedCount > 0
                      ? "border-violet-400/45 bg-violet-400/15 text-violet-200"
                      : "border-sky-400/30 bg-sky-400/10 text-sky-300")
                }
              >
                {changedCount === -1
                  ? "위치 재배치"
                  : changedCount > 0
                    ? `${changedCount} 개 변화`
                    : "변화 없음"}
              </span>
            </p>
            <MatrixBracket n={6}>
              <div
                className="grid gap-[2px]"
                style={{ gridTemplateColumns: "repeat(6, 35px)" }}
              >
                {processed.flatMap((row, r) =>
                  row.map((v, c) => {
                    const changed = !isFlip && v !== PROC6[r][c];
                    return (
                      <div
                        key={`pmg-${r}-${c}`}
                        className={
                          "flex h-9 items-center justify-center rounded-sm border text-[10px] font-mono font-bold transition " +
                          (changed
                            ? "border-violet-400/55 bg-violet-400/20 text-violet-100"
                            : "border-white/10 bg-slate-900 text-slate-300")
                        }
                      >
                        {v}
                      </div>
                    );
                  }),
                )}
              </div>
            </MatrixBracket>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-center font-mono text-sm font-bold text-amber-100">
          {data.eq}
        </div>
        <div className="mt-2">
          <InfoBox>{data.info}</InfoBox>
        </div>
      </Card>
    </div>
  );
}
