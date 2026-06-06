"use client";

// 대사들 — 숨겨진 해골 찾기 (아나모르포시스 시뮬레이션).
//
// 원본: c:/git-math/math/activities/gifted/ambassadors_skull.py
// 자산: public/activities/ambassadors-skull/ambassadors.jpg
//
// 두 탭:
//   * 🎨 시뮬레이션 — 메인 캔버스(슬라이스 240단 원근 투영) + 미니맵(위에서 본 관람 위치)
//     + 각도/속도 슬라이더, 자동 이동, 해골 힌트, 초기화. 63° 이상 첫 도달 시 발견 팝업.
//   * 📐 수학 원리 — 아나모르포시스 설명 + cos θ 압축 공식 + 인터랙티브 cos 계산기.
//
// RAF 두 개: animation (각도 왕복) + hint pulse (해골 점선 알파 진동). 둘 다 ref 로 최신
// 상태 읽음. setAngle → 재렌더 → renderScene 호출 (useEffect on [angle, showHint, ...]).

import { useEffect, useRef, useState } from "react";

const D = 5.0; // 관람객-그림 거리 (그림 너비 단위)
const SLICES = 240; // 수직 슬라이스 개수
const MAX_ANGLE = 76;

type StatusRange = readonly [number, number, string];
const STATUS_MSGS: readonly StatusRange[] = [
  [0, 0, "정면에서는 그림 하단에 이상한 대각선 얼룩처럼 보이는 부분이 있습니다. 슬라이더를 오른쪽으로 밀어 측면에서 감상해보세요!"],
  [1, 34, "비스듬한 각도에서 바라보고 있습니다. 그림 하단의 이상한 모양을 집중해서 보세요. 무엇처럼 보이기 시작하나요?"],
  [35, 59, "반쯤 측면에서 보고 있습니다. 가로로 납작했던 모양이 점점 어떤 형체로 바뀌고 있나요?"],
  [60, MAX_ANGLE, "💀 충분한 측면 각도입니다. 해골의 형체가 보이기 시작했나요? 홀바인이 1533년에 숨겨놓은 비밀입니다!"],
];

function statusMessage(a: number): string {
  for (const [lo, hi, txt] of STATUS_MSGS) {
    if (a >= lo && a <= hi) return txt;
  }
  return "";
}

function angleDisplay(a: number): string {
  const r = Math.round(a);
  if (r === 0) return "👁 정면 (0°)";
  if (r < 60) return `👁 ${r}° 각도에서 감상 중`;
  return `🔍 ${r}° 측면 감상 중`;
}

export default function AmbassadorsSkull() {
  const [tab, setTab] = useState<"sim" | "math">("sim");
  const [angle, setAngle] = useState(0);
  const [speed, setSpeed] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [discovered, setDiscovered] = useState(false);
  const [showDisco, setShowDisco] = useState(false);
  const [cosAngle, setCosAngle] = useState(75);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [canvasW, setCanvasW] = useState(800);

  const mainCvsRef = useRef<HTMLCanvasElement>(null);
  const mmCvsRef = useRef<HTMLCanvasElement>(null);
  const mainViewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // RAF 루프에서 최신 상태 읽기용 refs.
  const angleRef = useRef(0);
  const speedRef = useRef(3);
  const showHintRef = useRef(false);
  const animDirRef = useRef(1);
  const rafIdRef = useRef<number | null>(null);
  const hintRafIdRef = useRef<number | null>(null);
  const hintPhaseRef = useRef(0);

  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    showHintRef.current = showHint;
  }, [showHint]);

  // ─── 이미지 로드 ──────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      setImgFailed(true);
    };
    img.src = "/activities/ambassadors-skull/ambassadors.jpg";
  }, []);

  // ─── 컨테이너 크기 추적 ──────────────────────────────────
  // 한 눈에 들어오도록 캔버스를 컨테이너 폭의 70% 로 축소. 부모는
  // flex items-center justify-center 라 자동 가운데 정렬.
  useEffect(() => {
    const el = mainViewRef.current;
    if (!el) return;
    const update = () => {
      const w = Math.round((el.clientWidth - 2) * 0.7);
      if (w > 0) setCanvasW(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── 캔버스 크기 동기화 ──────────────────────────────────
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !imgLoaded) return;
    const cvs = mainCvsRef.current;
    if (!cvs) return;
    const aspect = img.naturalHeight / img.naturalWidth;
    const h = Math.round(canvasW * aspect);
    cvs.width = canvasW;
    cvs.height = h;
    cvs.style.width = `${canvasW}px`;
    cvs.style.height = `${h}px`;
  }, [canvasW, imgLoaded]);

  // ─── 메인 씬 렌더 (refs 에서 angle/showHint/phase 읽음) ──
  function renderScene() {
    const img = imgRef.current;
    const cvs = mainCvsRef.current;
    if (!img || !imgLoaded || !cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const θ_deg = angleRef.current;
    const θ = (θ_deg * Math.PI) / 180;
    const sinT = Math.sin(θ);
    const cosT = Math.cos(θ);
    const cW = cvs.width;
    const cH = cvs.height;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const aspect = imgH / imgW;

    // 어두운 갤러리 배경
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, cW, cH);

    // 바닥 그라데이션
    const grad = ctx.createLinearGradient(0, cH * 0.85, 0, cH);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cW, cH);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // ─── 슬라이스 기반 원근 투영 ───
    for (let i = 0; i < SLICES; i++) {
      const x0 = i / SLICES - 0.5;
      const x1 = (i + 1) / SLICES - 0.5;
      const xMid = (x0 + x1) / 2;
      const d0 = D - x0 * sinT;
      const d1 = D - x1 * sinT;
      const dMid = D - xMid * sinT;
      const sx0 = (D * x0 * cosT) / d0;
      const sx1 = (D * x1 * cosT) / d1;
      const destX = cW / 2 + sx0 * cW;
      const destW = Math.max(0.5, (sx1 - sx0) * cW);
      const destH = (cH * D) / dMid;
      const destY = (cH - destH) / 2;
      const srcX = Math.round((i / SLICES) * imgW);
      const srcW = Math.max(1, Math.round(((i + 1) / SLICES) * imgW) - srcX);
      ctx.drawImage(img, srcX, 0, srcW, imgH, destX, destY, destW + 0.5, destH);
    }

    // ─── 해골 힌트 오버레이 ───
    if (showHintRef.current) {
      // 그림 비율 좌표(0~1)에서 정의한 해골 사각 영역.
      const skull = [
        { fx: 0.18, fy: 0.79 },
        { fx: 0.72, fy: 0.79 },
        { fx: 0.72, fy: 0.93 },
        { fx: 0.18, fy: 0.93 },
      ];
      const pts = skull.map(({ fx, fy }) => {
        const x_w = fx - 0.5;
        const y_w = (fy - 0.5) * aspect;
        const depth = D - x_w * sinT;
        const sx = (D * x_w * cosT) / depth;
        const sy = (D * y_w) / depth;
        return {
          x: cW / 2 + sx * cW,
          y: cH / 2 + (sy / aspect) * cH,
        };
      });
      const alpha = 0.55 + 0.4 * Math.sin(hintPhaseRef.current);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = Math.max(2, cW * 0.0035);
      ctx.setLineDash([9, 6]);
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${Math.max(11, cW * 0.02)}px 'Segoe UI', sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("← 해골 영역", pts[1].x + 6, pts[1].y + 4);
      ctx.restore();
    }
  }

  // ─── 미니맵 (위에서 본 관람 위치) ────────────────────────
  function drawMinimap() {
    const cvs = mmCvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const mW = cvs.width;
    const mH = cvs.height;
    const θ_deg = angleRef.current;
    const θ = (θ_deg * Math.PI) / 180;
    const cx = mW / 2;
    const py = 22;
    const R = 72;
    const pw = 80;

    ctx.clearRect(0, 0, mW, mH);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, mW, mH);

    // 관람 경로 호
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, py, R, 0, Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // 각도 부채꼴
    if (θ_deg > 0) {
      ctx.fillStyle = "rgba(139,92,246,0.12)";
      ctx.beginPath();
      ctx.moveTo(cx, py);
      ctx.arc(cx, py, R, Math.PI / 2, Math.PI / 2 + θ);
      ctx.closePath();
      ctx.fill();
    }

    // 그림 벽
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - pw, py);
    ctx.lineTo(cx + pw, py);
    ctx.stroke();
    ctx.lineCap = "butt";

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 9px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("그림", cx, py - 8);

    // 시선 (관람객 → 그림 중심)
    const vx = cx + R * Math.sin(θ);
    const vy = py + R * Math.cos(θ);
    ctx.strokeStyle = "#7dd3fc";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(cx, py);
    ctx.stroke();
    ctx.setLineDash([]);

    // 관람객 점
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(vx, vy, 6, 0, Math.PI * 2);
    ctx.fill();

    // 시선 방향선
    const eyeAngle = Math.atan2(cx - vx, py - vy);
    const ex = vx + 12 * Math.sin(eyeAngle);
    const ey = vy + 12 * Math.cos(eyeAngle);
    ctx.strokeStyle = "#f43f5e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // 관람객 라벨
    const offRight = vx >= cx;
    ctx.fillStyle = "#f43f5e";
    ctx.font = "9px Segoe UI, sans-serif";
    ctx.textAlign = offRight ? "left" : "right";
    ctx.fillText("관람객", vx + (offRight ? 10 : -10), vy + (vy > py + 30 ? 14 : -6));

    // 각도 라벨
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 12px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(Math.round(θ_deg) + "°", mW / 2, mH - 6);
  }

  // ─── 재렌더 트리거 ────────────────────────────────────────
  useEffect(() => {
    renderScene();
    drawMinimap();
    // renderScene/drawMinimap 는 ref 만 읽으므로 deps 에 넣을 필요 없음.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, showHint, imgLoaded, canvasW]);

  // ─── 발견 트리거 ──────────────────────────────────────────
  useEffect(() => {
    if (angle >= 63 && !discovered) {
      setDiscovered(true);
      setShowDisco(true);
    }
  }, [angle, discovered]);

  // ─── 자동 이동 (RAF) ──────────────────────────────────────
  useEffect(() => {
    if (!animating) return;
    function step() {
      let next = angleRef.current + animDirRef.current * speedRef.current * 0.18;
      if (next >= MAX_ANGLE) {
        next = MAX_ANGLE;
        animDirRef.current = -1;
      }
      if (next <= 0) {
        next = 0;
        animDirRef.current = 1;
      }
      setAngle(next);
      rafIdRef.current = requestAnimationFrame(step);
    }
    step();
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [animating]);

  // ─── 힌트 펄스 (RAF) ──────────────────────────────────────
  useEffect(() => {
    if (!showHint) return;
    function loop() {
      hintPhaseRef.current += 0.07;
      renderScene();
      hintRafIdRef.current = requestAnimationFrame(loop);
    }
    loop();
    return () => {
      if (hintRafIdRef.current !== null) cancelAnimationFrame(hintRafIdRef.current);
      hintRafIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHint]);

  function handleReset() {
    setAnimating(false);
    setAngle(0);
    setDiscovered(false);
    setShowDisco(false);
  }

  // ─── cos 계산기 ────────────────────────────────────────────
  const cosV = Math.cos((cosAngle * Math.PI) / 180);
  const ratio = cosV < 0.005 ? "∞" : (1 / cosV).toFixed(3);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100 sm:p-6">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">💀 대사들 — 숨겨진 해골 찾기</h2>
        <p className="mt-1 text-sm text-slate-400">
          홀바인의 「대사들」에 담긴 아나모르포시스 해골을 보는 각도를 바꿔가며 직접
          발견해봅니다.
        </p>
      </header>

      <details className="mb-4 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-200">💡 활동 안내</summary>
        <ul className="mt-2 space-y-1 text-slate-400">
          <li>
            <b>시뮬레이션</b> 탭에서 슬라이더를 오른쪽으로 밀어 측면에서 그림을 감상해보세요.
          </li>
          <li>그림은 고정되어 있고, <b>관람객이 오른쪽으로 이동</b>하는 것을 시뮬레이션합니다.</li>
          <li><b>위에서 본 관람 위치</b> 미니맵으로 현재 관람 위치를 확인하세요.</li>
          <li><b>자동 이동</b>: 정면↔측면을 자동으로 왕복합니다.</li>
          <li><b>해골 힌트</b>: 그림에서 해골이 있는 영역을 표시합니다.</li>
          <li><b>수학 원리</b> 탭에서 cos θ 압축 공식을 직접 계산해볼 수 있습니다.</li>
        </ul>
      </details>

      {/* 탭 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            { key: "sim" as const, label: "🎨 시뮬레이션" },
            { key: "math" as const, label: "📐 수학 원리" },
          ]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
              tab === t.key
                ? "border-violet-400 bg-violet-700 text-violet-50"
                : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 시뮬레이션 패널 — 탭 전환 시 mount 유지(display 만 변경)로 ResizeObserver 안정 */}
      <div style={{ display: tab === "sim" ? "block" : "none" }}>
        <div className="mb-2 flex flex-col gap-2.5 sm:flex-row sm:items-start">
          <div
            ref={mainViewRef}
            className="relative flex min-h-[200px] flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-900"
          >
            {imgFailed ? (
              <div className="p-10 text-sm text-slate-500">이미지를 불러올 수 없습니다.</div>
            ) : !imgLoaded ? (
              <div className="p-10 text-sm text-slate-500">이미지 불러오는 중…</div>
            ) : null}
            <canvas
              ref={mainCvsRef}
              className="block max-w-full"
              style={{ display: imgLoaded ? "block" : "none" }}
            />
          </div>
          <div className="flex-shrink-0 rounded-lg border border-white/10 bg-slate-900/60 px-1.5 py-2 sm:w-[152px]">
            <canvas
              ref={mmCvsRef}
              width={140}
              height={120}
              className="mx-auto block"
            />
            <div className="mt-1 text-center text-[10px] font-semibold text-slate-500">
              위에서 본 관람 위치
            </div>
          </div>
        </div>

        {/* 컨트롤 */}
        <div className="mb-2 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3">
          <div className="mb-2 text-center text-base font-extrabold text-violet-300">
            {angleDisplay(angle)}
          </div>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500">정면 👁</span>
            <input
              type="range"
              min={0}
              max={MAX_ANGLE}
              value={angle}
              step={1}
              onChange={(e) => {
                if (animating) setAnimating(false);
                setAngle(Number(e.target.value));
              }}
              className="h-1.5 flex-1 accent-violet-500"
              aria-label="관람 각도"
            />
            <span className="text-[11px] text-slate-500">측면 👁</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAnimating((v) => !v)}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold transition ${
                animating
                  ? "border-violet-400 bg-violet-900 text-violet-100"
                  : "border-slate-600 bg-slate-900 text-slate-400 hover:border-violet-400 hover:text-violet-200"
              }`}
            >
              {animating ? "⏸ 멈추기" : "▶ 자동 이동"}
            </button>
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold transition ${
                showHint
                  ? "border-amber-400 bg-amber-900 text-amber-100"
                  : "border-slate-600 bg-slate-900 text-slate-400 hover:border-amber-400 hover:text-amber-200"
              }`}
            >
              💀 해골 힌트
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:border-rose-400 hover:text-rose-200"
            >
              ↺ 초기화
            </button>
          </div>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500">🐢 느리게</span>
            <input
              type="range"
              min={1}
              max={10}
              value={speed}
              step={1}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="h-1.5 flex-1 accent-violet-500"
              aria-label="자동 이동 속도"
            />
            <span className="text-[11px] text-slate-500">빠르게 🐇</span>
          </div>
        </div>

        {/* 상태 메시지 */}
        <div
          className={`rounded-lg border-l-4 px-3.5 py-2.5 text-xs leading-relaxed transition-colors ${
            angle >= 60
              ? "border-amber-500 bg-slate-900 text-amber-200"
              : "border-violet-600 bg-slate-900 text-slate-400"
          }`}
        >
          {statusMessage(angle)}
        </div>
      </div>

      {/* 수학 원리 패널 */}
      <div style={{ display: tab === "math" ? "block" : "none" }}>
        <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
          <section className="mb-4">
            <h3 className="mb-1.5 text-sm font-extrabold text-violet-300">
              🎭 아나모르포시스(Anamorphosis)란?
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              특정 각도로 바라볼 때만 올바른 형상이 드러나도록{" "}
              <span className="font-bold text-amber-300">의도적으로 왜곡된 그림</span>을 말합니다.
              「대사들」의 해골은 그림을 오른쪽에서 비스듬히 바라보아야 비로소 해골로 보입니다.
              정면에서 보면 그저 이상한 대각선 얼룩처럼 보입니다.
            </p>
          </section>

          <section className="mb-4">
            <h3 className="mb-1.5 text-sm font-extrabold text-violet-300">📐 원근 압축의 수학</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              관람객이 수직 정면에서 각도 <span className="font-bold text-amber-300">θ</span>만큼
              비껴서 볼 때, 그림의 수평 방향은{" "}
              <span className="font-bold text-amber-300">cos θ</span> 배로 압축되어 보입니다.
            </p>
            <Formula text="보이는 너비 = 실제 너비 × cos θ" />
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              따라서 화가가 측면 θ 각도에서 정상으로 보이게 하려면, 가로를{" "}
              <span className="font-bold text-amber-300">1 / cos θ</span> 배로 늘려 그려야 합니다.
            </p>
            <Formula text="필요 늘림 배율 = 1 / cos θ" />
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              「대사들」에서 해골이 제대로 보이는 각도는 약{" "}
              <span className="font-bold text-amber-300">θ ≈ 75°</span> 입니다:
            </p>
            <Formula>
              1 / cos 75° ≈ 1 / 0.259 ≈{" "}
              <span className="font-bold text-amber-300">3.86 배</span>
            </Formula>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              홀바인은 실제 해골 너비의 약{" "}
              <span className="font-bold text-amber-300">3.86 배</span>로 가로 방향만 잡아늘려
              납작한 타원 형태로 그려 넣었습니다. 75° 측면에서 보면 그 압축이 상쇄되어 정상적인
              해골 모양으로 보이는 것입니다.
            </p>

            {/* cos 계산기 */}
            <div className="mt-3 rounded-lg border border-slate-600 bg-slate-900/60 px-3.5 py-3">
              <div className="mb-2 text-sm font-bold text-teal-300">🔢 직접 계산해보기</div>
              <div className="mb-1.5 flex items-center gap-2.5">
                <label
                  htmlFor="ambassadors-cos-slider"
                  className="min-w-[44px] text-xs text-slate-500"
                >
                  각도 θ
                </label>
                <input
                  id="ambassadors-cos-slider"
                  type="range"
                  min={0}
                  max={89}
                  value={cosAngle}
                  step={1}
                  onChange={(e) => setCosAngle(Number(e.target.value))}
                  className="h-1.5 flex-1 accent-teal-400"
                />
                <span className="min-w-[28px] text-xs text-slate-200">{cosAngle}°</span>
              </div>
              <div className="rounded-md bg-slate-950 px-3 py-1.5 text-xs">
                cos {cosAngle}° ≈{" "}
                <b className="text-sky-300">{cosV.toFixed(4)}</b> &nbsp;→&nbsp; 1 / cos {cosAngle}°
                ≈ <b className="text-amber-300">{ratio}</b> 배
              </div>
            </div>
          </section>

          <section className="mb-4">
            <h3 className="mb-1.5 text-sm font-extrabold text-violet-300">
              🤔 홀바인은 왜 해골을 숨겼을까?
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              이 그림은 1533년 두 명의 프랑스 외교관을 그린 초상화입니다. 권력·부·지식의 상징물로
              가득한 화폭 속에 <span className="font-bold text-amber-300">죽음의 상징인 해골</span>
              을 숨겨 "아무리 높은 권력자도 결국 죽음은 피할 수 없다"는 메시지를 담았다고
              해석됩니다. 이는{" "}
              <span className="font-bold text-amber-300">메멘토 모리(Memento Mori)</span> 사상을
              반영한 것입니다.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 text-sm font-extrabold text-violet-300">🖼 작품 정보</h3>
            <p className="text-sm leading-relaxed text-slate-400">
              <b className="text-slate-200">한스 홀바인 (Hans Holbein the Younger)</b>, 「대사들 The
              Ambassadors」, 1533
              <br />
              유화 · 207 × 209.5 cm · 런던 내셔널 갤러리 소장
              <br />
              좌: 장 드 댕트빌 / 우: 조르주 드 셀브
            </p>
          </section>
        </div>
      </div>

      {/* 발견 팝업 */}
      {showDisco ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDisco(false);
          }}
        >
          <div className="max-w-md rounded-2xl border-2 border-amber-500 bg-slate-900 p-6 text-center shadow-2xl">
            <div className="text-5xl">💀</div>
            <h3 className="mt-2 text-lg font-extrabold text-amber-200">해골을 발견했습니다!</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              홀바인은 죽음의 상징인 해골을 아나모르포시스 기법으로 숨겨두었습니다.
              <br />
              그림 오른쪽 <b className="text-amber-300">약 75° 측면</b>에서만 볼 수 있도록 가로
              방향으로 <b className="text-amber-300">약 3.86 배</b> 늘려 그린 것입니다!
            </p>
            <button
              type="button"
              onClick={() => setShowDisco(false)}
              className="mt-4 rounded-md bg-amber-500 px-6 py-2 text-sm font-extrabold text-slate-950 transition hover:bg-amber-400"
            >
              확인 ✓
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Formula({ text, children }: { text?: string; children?: React.ReactNode }) {
  return (
    <div className="my-1.5 rounded-md border border-slate-600 bg-slate-800 px-3.5 py-2 text-center font-mono text-sm text-sky-300">
      {text ?? children}
    </div>
  );
}
