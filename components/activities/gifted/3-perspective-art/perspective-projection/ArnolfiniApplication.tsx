"use client";

// 아르놀피니 적용 — perspective_projection 활동의 4번째 탭 (별도 컴포넌트로 분리).
//
// 원본: c:/git-math/math/activities/gifted/perspective_projection.py (1568~2317줄 = 아르놀피니 탭).
// 자산: public/activities/arnolfini/arnolfini.jpg
//
// 4단계 progressive disclosure:
//   STEP 1 — 그림에서 a′·b′ 측정 (📍 발 클릭 / ✏️ 직선 / 📐 자 도구)
//   STEP 2 — 3D 갤러리 장면 (드래그 회전 + 휠 줌 + 더블클릭 초기화)
//   STEP 3 — 변수 색깔 설명 (정적)
//   STEP 4 — 역공식 계산기 (a′·b′ → a·b), 3D 자동 업데이트
//
// 그림 실제 크기: 60×82.2 cm. 관찰자 눈 높이(그림 아랫단 기준) H=77.8 cm, 그림까지
// 수평 거리 D=150 cm.

import { useCallback, useEffect, useRef, useState } from "react";

const PAINT_W_CM = 60.0;
const PAINT_H_CM = 82.2;
const PAINT_FLOOR = 82.2; // 그림 아랫단 바닥 높이 (cm)
const H_EYE = 77.8; // 눈 높이 (그림 아랫단 기준)
const D_EYE = 150.0; // 그림까지 수평 거리
const OBS_EYE_Z = PAINT_FLOOR + H_EYE; // 바닥 기준 눈 높이 = 160
const OBS_HEIGHT = 170.0;

const AZ0 = 0.5;
const EL0 = 0.3;
const ZM0 = 2.4;

type Pt = { x: number; y: number };
type Tool = "mark" | "line" | "ruler";
type Stroke = { type: "line"; color: string; thick: number; pts: Pt[] };
type Ruler = { x1: number; y1: number; x2: number; y2: number; color: string };
type RulerDrag =
  | { type: "new"; x1: number; y1: number }
  | {
      type: "ep1" | "ep2" | "body";
      idx: number;
      ox: number;
      oy: number;
      ox1: number;
      oy1: number;
      ox2: number;
      oy2: number;
    };

const TOOL_COLORS = ["#ef4444", "#facc15", "#22c55e", "#38bdf8", "#f8fafc"];

function dist2(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}
function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1) return dist2(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return dist2(px, py, ax + t * dx, ay + t * dy);
}
function hitStroke(st: Stroke, x: number, y: number): boolean {
  const r = Math.max(8, st.thick / 2 + 5);
  if (!st.pts || st.pts.length < 2) return false;
  const last = st.pts[st.pts.length - 1];
  return distToSeg(x, y, st.pts[0].x, st.pts[0].y, last.x, last.y) <= r;
}

function roundRectPath(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

export default function ArnolfiniApplication() {
  // ── 4단계 진행 ────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── STEP 1: 측정 상태 ────────────────────────────────
  const [tool, setTool] = useState<Tool>("mark");
  const [color, setColor] = useState("#ef4444");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [rulers, setRulers] = useState<Ruler[]>([]);
  const [mark, setMark] = useState<Pt | null>(null);
  const [ap, setAp] = useState<number | null>(null);
  const [bp, setBp] = useState<number | null>(null);
  const [selectedRuler, setSelectedRuler] = useState<number>(-1);

  // ── STEP 4: 계산기 ─────────────────────────────────
  const [calcApInput, setCalcApInput] = useState("");
  const [calcBpInput, setCalcBpInput] = useState("");
  const [calcResult, setCalcResult] = useState<{ a: number; b: number; ap: number; bp: number } | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // ── 캔버스 1 (그림) refs ──────────────────────────
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [outerW, setOuterW] = useState(0);
  const imgPlacementRef = useRef({ imgX: 0, imgY: 0, imgW: 0, imgH: 0 });

  // 드로잉 상태 refs (실시간 mutation)
  const drawingRef = useRef(false);
  const sxRef = useRef(0);
  const syRef = useRef(0);
  const rulerDragRef = useRef<RulerDrag | null>(null);

  // ── 캔버스 2 (3D) refs ─────────────────────────────
  const cvs3DRef = useRef<HTMLCanvasElement>(null);
  const outer3DRef = useRef<HTMLDivElement>(null);
  const [outer3DW, setOuter3DW] = useState(0);
  const [s3d, setS3d] = useState({ az: AZ0, el: EL0, zoom: ZM0 });
  const drag3DRef = useRef(false);
  const lx3DRef = useRef(0);
  const ly3DRef = useRef(0);

  // ─── 이미지 로드 ──────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.onerror = () => {
      // ignore — 캔버스가 placeholder 보임
    };
    img.src = "/activities/arnolfini/arnolfini.jpg";
  }, []);

  // ─── 그림 캔버스 outer 크기 추적 ──────────────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setOuterW(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── 3D 캔버스 outer 크기 추적 ──────────────────
  useEffect(() => {
    if (step < 2) return;
    const el = outer3DRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setOuter3DW(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);

  // ─── 캔버스 크기 + 그림 배치 ─────────────────────
  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs || outerW <= 0) return;
    const W = outerW;
    const maxW = Math.min(W, 520);
    const img = imgRef.current;
    let imgW: number;
    let imgH: number;
    if (img && imgLoaded) {
      const sc = maxW / img.naturalWidth;
      imgW = Math.round(img.naturalWidth * sc);
      imgH = Math.round(img.naturalHeight * sc);
    } else {
      imgW = maxW;
      imgH = Math.round((maxW * PAINT_H_CM) / PAINT_W_CM);
    }
    const imgX = Math.max(0, Math.round((W - imgW) / 2));
    const imgY = 0;
    imgPlacementRef.current = { imgX, imgY, imgW, imgH };

    const dpr = window.devicePixelRatio || 1;
    cvs.width = Math.round(W * dpr);
    cvs.height = Math.round(imgH * dpr);
    cvs.style.width = `${W}px`;
    cvs.style.height = `${imgH}px`;
    const ctx = cvs.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [outerW, imgLoaded]);

  // ─── 좌표 변환 ─────────────────────────────────────
  function screenToCm(px: number, py: number): { ax: number; ay: number } {
    const { imgX, imgY, imgW, imgH } = imgPlacementRef.current;
    const ax = ((px - imgX) / imgW) * PAINT_W_CM;
    const ay = PAINT_H_CM - ((py - imgY) / imgH) * PAINT_H_CM;
    return { ax, ay };
  }
  function pxPerCm(): number {
    return imgPlacementRef.current.imgW / PAINT_W_CM;
  }

  // ─── 그리기 헬퍼 ──────────────────────────────────
  function drawStrokeOn(ctx: CanvasRenderingContext2D, st: Stroke) {
    if (!st.pts || st.pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = st.color;
    ctx.lineWidth = st.thick;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(st.pts[0].x, st.pts[0].y);
    const last = st.pts[st.pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawRulerOn(ctx: CanvasRenderingContext2D, r: Ruler, selected: boolean) {
    const dx = r.x2 - r.x1;
    const dy = r.y2 - r.y1;
    const len = Math.hypot(dx, dy);
    if (len < 3) return;
    const ppc = pxPerCm();
    const lenCm = len / ppc;
    const angle = Math.atan2(dy, dx);
    const col = r.color || "#fbbf24";
    ctx.save();
    ctx.translate(r.x1, r.y1);
    ctx.rotate(angle);

    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 6;
    ctx.lineCap = "square";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.stroke();

    for (const tx of [0, len]) {
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tx, -11);
      ctx.lineTo(tx, 11);
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, -11);
      ctx.lineTo(tx, 11);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    const tickCm = lenCm > 20 ? 5 : lenCm > 8 ? 2 : 1;
    for (let t = 0; t <= lenCm + 0.01; t += tickCm) {
      const tx2 = t * ppc;
      const h2 = t % (tickCm * 2) === 0 ? 8 : 5;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx2, 0);
      ctx.lineTo(tx2, h2);
      ctx.stroke();
    }

    ctx.save();
    const flip = Math.abs(angle) > Math.PI / 2;
    ctx.translate(len / 2, 0);
    if (flip) ctx.rotate(Math.PI);
    const label = `${lenCm.toFixed(1)} cm`;
    ctx.font = "bold 13px sans-serif";
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    roundRectPath(ctx, -tw / 2 - 5, -28, tw + 10, 18, 4);
    ctx.fill();
    ctx.fillStyle = col;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, 0, -13);
    ctx.restore();
    ctx.restore();

    for (const [x, y] of [
      [r.x1, r.y1],
      [r.x2, r.y2],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = selected ? "#f97316" : col;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  function drawMarkOn(
    ctx: CanvasRenderingContext2D,
    mx: number,
    my: number,
    cx: number,
    by: number,
    apVal: number | null,
    bpVal: number | null,
  ) {
    const { imgX, imgY, imgW, imgH } = imgPlacementRef.current;
    ctx.save();
    // 십자선 (그림 안쪽 폭만)
    ctx.strokeStyle = "rgba(167,139,250,0.7)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(mx, imgY);
    ctx.lineTo(mx, imgY + imgH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(imgX, my);
    ctx.lineTo(imgX + imgW, my);
    ctx.stroke();
    ctx.setLineDash([]);

    // a′ 표시 — 가운데 세로선 ↔ mark 수평거리
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, my + 12);
    ctx.lineTo(mx, my + 12);
    ctx.stroke();

    // b′ 표시 — 아랫단 ↔ mark 수직거리
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx + 12, by - 4);
    ctx.lineTo(mx + 12, my);
    ctx.stroke();
    ctx.restore();

    // 점
    ctx.save();
    ctx.shadowColor = "#a78bfa";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#a78bfa";
    ctx.beginPath();
    ctx.arc(mx, my, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 라벨
    if (apVal !== null && bpVal !== null) {
      ctx.save();
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(`a'=${apVal.toFixed(1)}cm`, Math.min(cx, mx) + 4, my + 25);
      ctx.fillStyle = "#4ade80";
      ctx.fillText(`b'=${bpVal.toFixed(1)}cm`, mx + 16, (my + by) / 2);
      ctx.restore();
    }
  }

  // ─── 캔버스 메인 redraw ────────────────────────────
  const redraw = useCallback(
    (previewStroke?: Stroke | null, previewRuler?: Ruler | null) => {
      const cvs = cvsRef.current;
      if (!cvs || outerW <= 0) return;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;
      const { imgX, imgY, imgW, imgH } = imgPlacementRef.current;
      const W = outerW;

      ctx.clearRect(0, 0, W, imgH);
      ctx.fillStyle = "#0a0f1a";
      ctx.fillRect(0, 0, W, imgH);

      if (imgLoaded && imgRef.current) {
        ctx.drawImage(imgRef.current, imgX, imgY, imgW, imgH);
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(imgX, imgY, imgW, imgH);
        ctx.fillStyle = "#475569";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("아르놀피니 그림 로드 중…", imgX + imgW / 2, imgY + imgH / 2);
        ctx.textAlign = "left";
      }

      // 그림 테두리
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(imgX, imgY, imgW, imgH);
      ctx.setLineDash([]);

      // 좌표축
      const cx = imgX + imgW / 2;
      ctx.strokeStyle = "rgba(250,204,21,0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, imgY + 4);
      ctx.lineTo(cx, imgY + imgH - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(250,204,21,0.8)";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("x축(a방향)", cx, imgY + 12);
      ctx.textAlign = "left";

      const by = imgY + imgH;
      ctx.strokeStyle = "rgba(74,222,128,0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(imgX + 4, by - 4);
      ctx.lineTo(imgX + imgW - 4, by - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(74,222,128,0.8)";
      ctx.fillText("y축(b방향)→아랫단", imgX + 4, by - 7);

      // Strokes
      for (const st of strokes) drawStrokeOn(ctx, st);
      if (previewStroke) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        drawStrokeOn(ctx, previewStroke);
        ctx.restore();
      }

      // Rulers
      rulers.forEach((r, i) => drawRulerOn(ctx, r, i === selectedRuler));
      if (previewRuler) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        drawRulerOn(ctx, previewRuler, false);
        ctx.restore();
      }

      // Mark
      if (mark) drawMarkOn(ctx, mark.x, mark.y, cx, by, ap, bp);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [outerW, imgLoaded, strokes, rulers, mark, ap, bp, selectedRuler],
  );

  useEffect(() => {
    redraw();
  }, [redraw]);

  // ─── 이벤트: 포인터 좌표 (CSS 픽셀 = 그리기 좌표) ──
  function pxCoords(e: React.PointerEvent<HTMLCanvasElement>): Pt {
    const cvs = cvsRef.current!;
    const r = cvs.getBoundingClientRect();
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top,
    };
  }

  // ─── ruler hit-test ────────────────────────────────
  function hitRuler(x: number, y: number): { idx: number; type: "ep1" | "ep2" | "body" } | null {
    for (let i = rulers.length - 1; i >= 0; i--) {
      const r = rulers[i];
      if (dist2(x, y, r.x1, r.y1) < 10) return { idx: i, type: "ep1" };
      if (dist2(x, y, r.x2, r.y2) < 10) return { idx: i, type: "ep2" };
      if (distToSeg(x, y, r.x1, r.y1, r.x2, r.y2) < 8) return { idx: i, type: "body" };
    }
    return null;
  }

  // ─── 포인터 다운 ───────────────────────────────────
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const { x, y } = pxCoords(e);
    const { imgX, imgY, imgW, imgH } = imgPlacementRef.current;

    if (tool === "mark") {
      if (x >= imgX && x <= imgX + imgW && y >= imgY && y <= imgY + imgH) {
        setMark({ x, y });
        const { ax, ay } = screenToCm(x, y);
        const newAp = Math.abs(ax - PAINT_W_CM / 2);
        const newBp = Math.max(0, ay);
        setAp(newAp);
        setBp(newBp);
        // STEP 4 계산기 입력에도 자동 반영
        setCalcApInput(newAp.toFixed(2));
        setCalcBpInput(newBp.toFixed(2));
      }
      return;
    }

    if (tool === "ruler") {
      const hit = hitRuler(x, y);
      if (hit) {
        setSelectedRuler(hit.idx);
        const r = rulers[hit.idx];
        rulerDragRef.current = {
          type: hit.type,
          idx: hit.idx,
          ox: x,
          oy: y,
          ox1: r.x1,
          oy1: r.y1,
          ox2: r.x2,
          oy2: r.y2,
        };
      } else {
        setSelectedRuler(-1);
        rulerDragRef.current = { type: "new", x1: x, y1: y };
      }
      cvsRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    // line
    setSelectedRuler(-1);
    drawingRef.current = true;
    sxRef.current = x;
    syRef.current = y;
    cvsRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = pxCoords(e);

    if (tool === "ruler") {
      const drag = rulerDragRef.current;
      if (drag) {
        if (drag.type === "new") {
          redraw(null, { x1: drag.x1, y1: drag.y1, x2: x, y2: y, color });
        } else {
          const dx = x - drag.ox;
          const dy = y - drag.oy;
          setRulers((prev) =>
            prev.map((r, i) => {
              if (i !== drag.idx) return r;
              if (drag.type === "ep1") return { ...r, x1: drag.ox1 + dx, y1: drag.oy1 + dy };
              if (drag.type === "ep2") return { ...r, x2: drag.ox2 + dx, y2: drag.oy2 + dy };
              return {
                ...r,
                x1: drag.ox1 + dx,
                y1: drag.oy1 + dy,
                x2: drag.ox2 + dx,
                y2: drag.oy2 + dy,
              };
            }),
          );
        }
      } else {
        const hit = hitRuler(x, y);
        const cvs = cvsRef.current;
        if (cvs) cvs.style.cursor = hit ? (hit.type.startsWith("ep") ? "grab" : "move") : "crosshair";
      }
      return;
    }

    if (!drawingRef.current) return;
    if (tool === "line") {
      redraw({
        type: "line",
        color,
        thick: 2,
        pts: [
          { x: sxRef.current, y: syRef.current },
          { x, y },
        ],
      });
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = pxCoords(e);

    if (tool === "ruler") {
      const drag = rulerDragRef.current;
      if (drag) {
        if (drag.type === "new" && dist2(drag.x1, drag.y1, x, y) > 10) {
          setRulers((prev) => {
            const next = [...prev, { x1: drag.x1, y1: drag.y1, x2: x, y2: y, color }];
            setSelectedRuler(next.length - 1);
            return next;
          });
        }
        rulerDragRef.current = null;
      }
      return;
    }

    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (tool === "line") {
      const dx = x - sxRef.current;
      const dy = y - syRef.current;
      if (dx * dx + dy * dy > 25) {
        setStrokes((prev) => [
          ...prev,
          {
            type: "line",
            color,
            thick: 2,
            pts: [
              { x: sxRef.current, y: syRef.current },
              { x, y },
            ],
          },
        ]);
      } else {
        redraw();
      }
    }
  }

  function onContextMenu(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const { x, y } = pxCoords(e as unknown as React.PointerEvent<HTMLCanvasElement>);
    if (tool === "ruler") {
      const hit = hitRuler(x, y);
      if (hit) {
        setRulers((prev) => prev.filter((_, i) => i !== hit.idx));
        if (selectedRuler === hit.idx) setSelectedRuler(-1);
        else if (selectedRuler > hit.idx) setSelectedRuler(selectedRuler - 1);
      }
    }
  }

  function undo() {
    if (tool === "ruler" && rulers.length) {
      setRulers((prev) => prev.slice(0, -1));
      setSelectedRuler(-1);
    } else if (strokes.length) {
      setStrokes((prev) => prev.slice(0, -1));
    }
  }

  function clearAll() {
    setStrokes([]);
    setRulers([]);
    setSelectedRuler(-1);
    setMark(null);
    setAp(null);
    setBp(null);
    setCalcResult(null);
    setCalcError(null);
  }

  // ════════════════════════════════════════════════════
  //  3D 갤러리
  // ════════════════════════════════════════════════════
  // 3D 좌표 → 화면 좌표 (직교 투영 + az/el 회전)
  function p3(
    a_cm: number,
    b_cm: number,
    z_cm: number,
    W: number,
    H: number,
    state: { az: number; el: number; zoom: number },
  ): Pt {
    const ca = Math.cos(state.az);
    const sa = Math.sin(state.az);
    const rx = a_cm * ca - b_cm * sa;
    const ry = a_cm * sa + b_cm * ca;
    const ce = Math.cos(state.el);
    const se = Math.sin(state.el);
    const rz = z_cm * ce + ry * se;
    return {
      x: W * 0.44 + rx * state.zoom,
      y: H * 0.7 - rz * state.zoom,
    };
  }

  const draw3D = useCallback(() => {
    const cvs = cvs3DRef.current;
    if (!cvs || outer3DW <= 0) return;
    // 안전장치: cos(az)≤0 면 좌우 반전 → 기본 시점 복원
    let state = s3d;
    if (Math.cos(state.az) <= 0) {
      state = { ...state, az: AZ0 };
    }
    const W = outer3DW;
    const H = Math.max(320, Math.round(W * 0.58));
    const dpr = window.devicePixelRatio || 1;
    cvs.width = Math.round(W * dpr);
    cvs.height = Math.round(H * dpr);
    cvs.style.width = `${W}px`;
    cvs.style.height = `${H}px`;
    const c = cvs.getContext("2d");
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pw = PAINT_W_CM / 2;

    c.fillStyle = "#060f1e";
    c.fillRect(0, 0, W, H);

    function seg(
      ax: number,
      ab: number,
      az: number,
      bx: number,
      bb: number,
      bz: number,
      col: string,
      lw?: number,
      dash?: number[],
    ) {
      const p = p3(ax, ab, az, W, H, state);
      const q = p3(bx, bb, bz, W, H, state);
      c!.save();
      c!.strokeStyle = col;
      c!.lineWidth = lw ?? 1;
      if (dash) c!.setLineDash(dash);
      c!.beginPath();
      c!.moveTo(p.x, p.y);
      c!.lineTo(q.x, q.y);
      c!.stroke();
      c!.setLineDash([]);
      c!.restore();
    }
    function dot3(
      ax: number,
      ab: number,
      az: number,
      col: string,
      r: number,
      lbl?: string,
      lo?: [number, number],
    ) {
      const p = p3(ax, ab, az, W, H, state);
      c!.save();
      c!.shadowColor = col;
      c!.shadowBlur = 12;
      c!.fillStyle = col;
      c!.beginPath();
      c!.arc(p.x, p.y, r, 0, Math.PI * 2);
      c!.fill();
      c!.fillStyle = "#fff";
      c!.shadowBlur = 0;
      c!.beginPath();
      c!.arc(p.x, p.y, r * 0.38, 0, Math.PI * 2);
      c!.fill();
      if (lbl) {
        c!.fillStyle = col;
        c!.font = "bold 10px sans-serif";
        c!.fillText(lbl, p.x + (lo ? lo[0] : 9), p.y + (lo ? lo[1] : -5));
      }
      c!.restore();
    }

    // 바닥 그리드
    c.save();
    const gPts = [
      p3(-70, -D_EYE * 1.1, 0, W, H, state),
      p3(70, -D_EYE * 1.1, 0, W, H, state),
      p3(70, 100, 0, W, H, state),
      p3(-70, 100, 0, W, H, state),
    ];
    c.fillStyle = "rgba(14,116,144,0.14)";
    c.strokeStyle = "#164e63";
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(gPts[0].x, gPts[0].y);
    for (let i = 1; i < gPts.length; i++) c.lineTo(gPts[i].x, gPts[i].y);
    c.closePath();
    c.fill();
    c.stroke();
    for (let a = -60; a <= 60; a += 20) seg(a, -D_EYE * 1.1, 0, a, 100, 0, "rgba(14,116,144,0.25)", 0.5);
    for (let b = -D_EYE * 1.1; b <= 100; b += 30)
      seg(-70, b, 0, 70, b, 0, "rgba(14,116,144,0.25)", 0.5);
    c.restore();

    // 벽
    const wallW = 95;
    const wallTop = 215;
    const wTL = p3(-wallW, 0, wallTop, W, H, state);
    const wTR = p3(wallW, 0, wallTop, W, H, state);
    const wBL = p3(-wallW, 0, 0, W, H, state);
    const wBR = p3(wallW, 0, 0, W, H, state);
    c.save();
    c.fillStyle = "rgba(75, 58, 44, 0.38)";
    c.strokeStyle = "rgba(100, 78, 58, 0.5)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(wTL.x, wTL.y);
    c.lineTo(wTR.x, wTR.y);
    c.lineTo(wBR.x, wBR.y);
    c.lineTo(wBL.x, wBL.y);
    c.closePath();
    c.fill();
    c.stroke();
    const wallLbl = p3(-wallW + 4, 0, wallTop - 8, W, H, state);
    c.fillStyle = "rgba(100,78,58,0.8)";
    c.font = "9px sans-serif";
    c.fillText("벽", wallLbl.x, wallLbl.y);
    c.restore();

    // 그림
    const pBL = p3(-pw, 0, PAINT_FLOOR, W, H, state);
    const pBR = p3(pw, 0, PAINT_FLOOR, W, H, state);
    const pTL = p3(-pw, 0, PAINT_FLOOR + PAINT_H_CM, W, H, state);
    const pTR = p3(pw, 0, PAINT_FLOOR + PAINT_H_CM, W, H, state);

    if (imgRef.current && imgLoaded) {
      const iW = imgRef.current.naturalWidth;
      const iH = imgRef.current.naturalHeight;
      const ta = (pTR.x - pTL.x) / iW;
      const tb = (pTR.y - pTL.y) / iW;
      const tc = (pBL.x - pTL.x) / iH;
      const td = (pBL.y - pTL.y) / iH;
      c.save();
      c.globalAlpha = 0.9;
      c.transform(ta, tb, tc, td, pTL.x, pTL.y);
      c.drawImage(imgRef.current, 0, 0, iW, iH);
      c.restore();
    } else {
      c.save();
      c.fillStyle = "rgba(120,80,50,0.45)";
      c.beginPath();
      c.moveTo(pTL.x, pTL.y);
      c.lineTo(pTR.x, pTR.y);
      c.lineTo(pBR.x, pBR.y);
      c.lineTo(pBL.x, pBL.y);
      c.closePath();
      c.fill();
      c.restore();
    }
    // 액자
    c.save();
    c.strokeStyle = "#7c3aed";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(pTL.x, pTL.y);
    c.lineTo(pTR.x, pTR.y);
    c.lineTo(pBR.x, pBR.y);
    c.lineTo(pBL.x, pBL.y);
    c.closePath();
    c.stroke();
    c.restore();
    seg(0, 0, PAINT_FLOOR, 0, 0, PAINT_FLOOR + PAINT_H_CM, "rgba(250,204,21,0.45)", 1, [4, 3]);

    const topCtr = p3(0, 0, PAINT_FLOOR + PAINT_H_CM + 6, W, H, state);
    c.save();
    c.fillStyle = "#a78bfa";
    c.font = "bold 10px sans-serif";
    c.textAlign = "center";
    c.fillText("아르놀피니 부부 (60×82.2 cm)", topCtr.x, topCtr.y);
    c.textAlign = "left";
    c.restore();

    // 관찰자
    const obsB = -D_EYE;
    const obsFootP = p3(0, obsB, 0, W, H, state);
    const obsEyeP = p3(0, obsB, OBS_EYE_Z, W, H, state);
    const obsHeadP = p3(0, obsB, OBS_HEIGHT, W, H, state);
    c.save();
    c.fillStyle = "rgba(200,70,40,0.6)";
    c.beginPath();
    c.ellipse(obsFootP.x, obsFootP.y, 12, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(200,70,40,0.85)";
    if (obsHeadP.y < obsFootP.y) {
      const bT = obsHeadP.y + 8;
      const bB = obsFootP.y;
      if (bB > bT) c.fillRect(obsEyeP.x - 7, bT, 14, bB - bT);
    }
    c.beginPath();
    c.arc(obsHeadP.x, obsHeadP.y - 5, 8, 0, Math.PI * 2);
    c.fillStyle = "rgba(220,90,50,0.9)";
    c.fill();
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(obsEyeP.x + 3, obsEyeP.y, 2.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fca5a5";
    c.font = "bold 10px sans-serif";
    c.textAlign = "center";
    c.fillText("관찰자 (170cm)", obsHeadP.x, obsHeadP.y - 18);
    c.textAlign = "left";
    c.restore();

    // STEP 2+: 그림 뒤 Mr.아르놀피니 유령
    if (step >= 2) {
      const gB = calcResult ? calcResult.b : 35;
      const gA = calcResult ? -calcResult.a : -10;
      const gFoot = p3(gA, gB, 0, W, H, state);
      const gHead = p3(gA, gB, OBS_HEIGHT, W, H, state);
      c.save();
      c.globalAlpha = 0.45;
      c.fillStyle = "#93c5fd";
      c.beginPath();
      c.ellipse(gFoot.x, gFoot.y, 10, 3, 0, 0, Math.PI * 2);
      c.fill();
      if (gHead.y < gFoot.y) {
        const bT = gHead.y + 8;
        const bB = gFoot.y;
        if (bB > bT) c.fillRect(gFoot.x - 6, bT, 12, bB - bT);
      }
      c.beginPath();
      c.arc(gHead.x, gHead.y - 4, 7, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 0.7;
      c.font = "bold 10px sans-serif";
      c.textAlign = "center";
      c.fillText("Mr.아르놀피니", gHead.x, gHead.y - 16);
      c.textAlign = "left";
      c.restore();
    }

    // STEP 3+: H/D/a′/b′ 치수
    if (step >= 3 && ap !== null && bp !== null) {
      const apZ = PAINT_FLOOR + bp;
      // A′
      dot3(-ap, 0, apZ, "#f59e0b", 8, "A′", [-36, -5]);

      // H 치수
      const hBot = p3(-(pw + 8), 0, PAINT_FLOOR, W, H, state);
      const hTop = p3(-(pw + 8), 0, OBS_EYE_Z, W, H, state);
      c.save();
      c.strokeStyle = "#f87171";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(hBot.x, hBot.y);
      c.lineTo(hTop.x, hTop.y);
      c.stroke();
      const hMid = p3(-(pw + 8), 0, (PAINT_FLOOR + OBS_EYE_Z) / 2, W, H, state);
      c.fillStyle = "#f87171";
      c.font = "bold 11px sans-serif";
      c.textAlign = "right";
      c.fillText("H=77.8cm", hMid.x - 4, hMid.y + 4);
      c.textAlign = "left";
      c.restore();

      // D 치수
      const dObs = p3(0, obsB, OBS_EYE_Z, W, H, state);
      const dPnt = p3(0, 0, OBS_EYE_Z, W, H, state);
      c.save();
      c.strokeStyle = "#93c5fd";
      c.lineWidth = 2;
      c.setLineDash([5, 3]);
      c.beginPath();
      c.moveTo(dObs.x, dObs.y);
      c.lineTo(dPnt.x, dPnt.y);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = "#93c5fd";
      c.font = "bold 11px sans-serif";
      c.textAlign = "center";
      c.fillText("D=150cm", (dObs.x + dPnt.x) / 2, (dObs.y + dPnt.y) / 2 - 8);
      c.textAlign = "left";
      c.restore();

      // a′
      const cx0 = p3(0, 0, apZ, W, H, state);
      const ap2 = p3(-ap, 0, apZ, W, H, state);
      c.save();
      c.strokeStyle = "#f59e0b";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx0.x, cx0.y);
      c.lineTo(ap2.x, ap2.y);
      c.stroke();
      c.fillStyle = "#f59e0b";
      c.font = "bold 10px sans-serif";
      c.textAlign = "center";
      c.fillText(`a′=${ap.toFixed(1)}cm`, (cx0.x + ap2.x) / 2, (cx0.y + ap2.y) / 2 - 7);
      c.textAlign = "left";
      c.restore();

      // b′
      const bBot0 = p3(-ap, 0, PAINT_FLOOR, W, H, state);
      const bTop0 = p3(-ap, 0, apZ, W, H, state);
      c.save();
      c.strokeStyle = "#4ade80";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(bBot0.x, bBot0.y);
      c.lineTo(bTop0.x, bTop0.y);
      c.stroke();
      c.fillStyle = "#4ade80";
      c.font = "bold 10px sans-serif";
      c.fillText(`b′=${bp.toFixed(1)}cm`, bTop0.x - 58, (bBot0.y + bTop0.y) / 2);
      c.restore();
    }

    // STEP 4+: A점 + 치수
    if (step >= 4 && calcResult) {
      const { a: calcA, b: calcB } = calcResult;
      dot3(
        -calcA,
        calcB,
        0,
        "#60a5fa",
        9,
        `A(${calcA.toFixed(1)},${calcB.toFixed(1)})`,
        [-60, -4],
      );

      const bS = p3(-calcA, 0, 0, W, H, state);
      const bE = p3(-calcA, calcB, 0, W, H, state);
      const bMd = p3(-calcA, calcB / 2, 0, W, H, state);
      c.save();
      c.strokeStyle = "#a78bfa";
      c.lineWidth = 2;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.moveTo(bS.x, bS.y + 10);
      c.lineTo(bE.x, bE.y + 10);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = "#a78bfa";
      c.font = "bold 10px sans-serif";
      c.textAlign = "center";
      c.fillText(`b=${calcB.toFixed(1)}cm`, bMd.x, bMd.y + 22);
      c.textAlign = "left";
      c.restore();

      const aS2 = p3(0, calcB, 0, W, H, state);
      const aE2 = p3(-calcA, calcB, 0, W, H, state);
      const aMd2 = p3(-calcA / 2, calcB, 0, W, H, state);
      c.save();
      c.strokeStyle = "#60a5fa";
      c.lineWidth = 2;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.moveTo(aS2.x, aS2.y - 10);
      c.lineTo(aE2.x, aE2.y - 10);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = "#60a5fa";
      c.font = "bold 10px sans-serif";
      c.textAlign = "center";
      c.fillText(`a=${calcA.toFixed(1)}cm`, aMd2.x, aMd2.y - 14);
      c.textAlign = "left";
      c.restore();

      // 시선 + 밑변
      const eyePt = p3(0, obsB, OBS_EYE_Z, W, H, state);
      const apPt = p3(-(ap ?? 0), 0, PAINT_FLOOR + (bp ?? 0), W, H, state);
      c.save();
      c.strokeStyle = "rgba(250,204,21,0.70)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(eyePt.x, eyePt.y);
      c.lineTo(apPt.x, apPt.y);
      c.stroke();
      c.restore();

      const baseL = p3(-calcA, obsB, PAINT_FLOOR, W, H, state);
      const baseR = p3(-calcA, calcB, PAINT_FLOOR, W, H, state);
      c.save();
      c.strokeStyle = "#f87171";
      c.lineWidth = 2;
      c.setLineDash([6, 3]);
      c.beginPath();
      c.moveTo(baseL.x, baseL.y);
      c.lineTo(baseR.x, baseR.y);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = "#f87171";
      c.font = "bold 10px sans-serif";
      c.textAlign = "center";
      c.fillText(
        `b+D=${(calcB + D_EYE).toFixed(1)}cm`,
        (baseL.x + baseR.x) / 2,
        (baseL.y + baseR.y) / 2 - 7,
      );
      c.textAlign = "left";
      c.restore();
    }

    // 범례
    c.save();
    c.fillStyle = "#334155";
    c.font = "10px sans-serif";
    c.fillText("H=77.8 cm  D=150 cm  |  드래그:회전  스크롤:확대  더블클릭:초기화", 8, 14);
    c.restore();
  }, [outer3DW, s3d, step, ap, bp, calcResult, imgLoaded]);

  useEffect(() => {
    if (step >= 2) {
      draw3D();
    }
  }, [draw3D, step]);

  // ─── 3D 이벤트 ─────────────────────────────────────
  function on3DPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drag3DRef.current = true;
    lx3DRef.current = e.clientX;
    ly3DRef.current = e.clientY;
    cvs3DRef.current?.setPointerCapture(e.pointerId);
  }
  function on3DPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag3DRef.current) return;
    const dx = e.clientX - lx3DRef.current;
    const dy = e.clientY - ly3DRef.current;
    setS3d((prev) => ({
      ...prev,
      az: Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, prev.az + dx * 0.007)),
      el: Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, prev.el - dy * 0.007)),
    }));
    lx3DRef.current = e.clientX;
    ly3DRef.current = e.clientY;
  }
  function on3DPointerUp() {
    drag3DRef.current = false;
  }
  function on3DWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    setS3d((prev) => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(12, prev.zoom - e.deltaY * 0.004)),
    }));
  }
  function on3DDoubleClick() {
    setS3d({ az: AZ0, el: EL0, zoom: ZM0 });
  }

  // ─── STEP 진행 ─────────────────────────────────────
  function goToStep(n: number) {
    setStep(n);
    if (n === 2) {
      // STEP 2 진입 시 기본 시점 복원
      setS3d({ az: AZ0, el: EL0, zoom: ZM0 });
    }
  }

  // ─── STEP 4: 계산기 ─────────────────────────────────
  function runCalc() {
    const apN = parseFloat(calcApInput);
    const bpN = parseFloat(calcBpInput);
    if (Number.isNaN(apN) || Number.isNaN(bpN)) {
      setCalcError("a′와 b′ 값을 입력하세요.");
      setCalcResult(null);
      return;
    }
    if (bpN >= H_EYE) {
      setCalcError(`b′는 H(${H_EYE})보다 작아야 합니다.`);
      setCalcResult(null);
      return;
    }
    const b = (D_EYE * bpN) / (H_EYE - bpN);
    const a = (H_EYE * apN) / (H_EYE - bpN);
    setCalcError(null);
    setCalcResult({ a, b, ap: apN, bp: bpN });
    // 측정값(STEP 3 표시용)도 업데이트
    setAp(apN);
    setBp(bpN);
  }

  // ════════════════════════════════════════════════════
  //  JSX
  // ════════════════════════════════════════════════════
  return (
    <div>
      {/* 배경 설명 */}
      <div className="mb-3 rounded-xl border border-blue-900/40 bg-slate-900 px-4 py-3">
        <span className="mb-2 inline-block rounded-md bg-sky-900 px-2 py-0.5 text-[11px] font-extrabold text-sky-200">
          배경 설명
        </span>
        <div className="mt-1 text-sm leading-relaxed text-slate-300">
          <b>아르놀피니 부부의 초상</b> (얀 판 에이크, 1434), 실제 크기{" "}
          <b className="text-rose-400">82.2 × 60 cm</b>.
          <br />
          관찰자 눈 높이 <b className="text-rose-400">H = 77.8 cm</b> (그림 아랫단 기준), 그림까지
          수평 거리 <b className="text-rose-400">D = 150 cm</b>.
          <br />4 단계 활동으로 <b className="text-emerald-400">Mr. 아르놀피니의 실제 위치</b>를
          계산해봅시다!
        </div>
      </div>

      {/* 4단계 진행 바 */}
      <StepBar step={step} onJump={(n) => n <= step && goToStep(n)} />

      {/* STEP 1 — 측정 */}
      <section className="mb-3">
        <StepCard num="STEP 1 — 그림에서 a′, b′ 측정하기">
          <p className="mb-3 text-sm leading-relaxed text-slate-300">
            그림의 실제 크기는 <b className="text-rose-400">82.2 cm × 60 cm</b>입니다.
            <br />
            <b className="text-fuchsia-300">📍 발 클릭</b> 도구로 Mr. 아르놀피니의 <b>발 위치를
            클릭</b>하세요.
            <br />
            <span className="text-amber-400">■ a′</span> = 그림 <b>가운데 세로선</b>에서 발까지{" "}
            <b>수평 거리</b> (cm)
            <br />
            <span className="text-emerald-400">■ b′</span> = 그림 <b>아랫단</b>에서 발까지{" "}
            <b>수직 거리</b> (cm)
            <br />
            <span className="text-[11px] text-slate-500">
              📐 자 도구로 cm 거리를 직접 측정하거나, ✏️ 직선으로 보조선을 그을 수도 있습니다.
            </span>
          </p>

          {/* 도구 바 */}
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2">
            <button
              type="button"
              onClick={() => setTool("mark")}
              className={`rounded-md border px-2.5 py-1 text-xs font-bold transition ${
                tool === "mark"
                  ? "border-violet-400 bg-violet-900 text-violet-100"
                  : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500"
              }`}
            >
              📍 발 클릭
            </button>
            <button
              type="button"
              onClick={() => setTool("line")}
              className={`rounded-md border px-2.5 py-1 text-xs font-bold transition ${
                tool === "line"
                  ? "border-blue-500 bg-blue-950 text-blue-200"
                  : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500"
              }`}
            >
              ✏️ 직선
            </button>
            <button
              type="button"
              onClick={() => setTool("ruler")}
              className={`rounded-md border px-2.5 py-1 text-xs font-bold transition ${
                tool === "ruler"
                  ? "border-blue-500 bg-blue-950 text-blue-200"
                  : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500"
              }`}
            >
              📐 자 (cm)
            </button>
            <span className="h-6 w-px bg-slate-700" />
            <span className="text-xs text-slate-500">색</span>
            {TOOL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`색상 ${c}`}
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={`h-5 w-5 rounded transition ${
                  color === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                }`}
              />
            ))}
            <span className="h-6 w-px bg-slate-700" />
            <button
              type="button"
              onClick={undo}
              className="rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-400 transition hover:border-rose-400 hover:text-rose-200"
            >
              ↩ 되돌리기
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-400 transition hover:border-rose-400 hover:text-rose-200"
            >
              🗑 전체삭제
            </button>
          </div>

          {/* 도구 별 안내 */}
          {tool === "mark" ? (
            <div className="mb-2 rounded-md border-l-2 border-violet-500 bg-violet-950/40 px-3 py-1.5 text-xs text-violet-200">
              📍 <b>발 클릭</b>: 그림 안에서 Mr. 아르놀피니의 발 위치를 클릭하면 a′, b′가 자동
              계산됩니다.
            </div>
          ) : tool === "ruler" ? (
            <div className="mb-2 rounded-md border-l-2 border-blue-500 bg-blue-950/40 px-3 py-1.5 text-xs text-blue-200">
              📐 <b>자 도구</b>: 드래그로 자를 놓고 끝점을 조정. 그림 실제 크기(60×82.2 cm) 기준 cm
              값 표시. 우클릭으로 삭제.
            </div>
          ) : null}

          {/* 그림 캔버스 */}
          <div
            ref={outerRef}
            className="mb-2 overflow-hidden rounded-lg border border-white/10 bg-slate-950"
          >
            <canvas
              ref={cvsRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onContextMenu={onContextMenu}
              className="block touch-none"
              style={{ cursor: "crosshair" }}
            />
          </div>

          {/* a'/b' 결과 박스 */}
          <div className="mb-2 flex flex-wrap gap-2.5">
            <div className="flex-1 min-w-[160px] rounded-xl border border-blue-900/40 bg-slate-900 px-3 py-2 text-center">
              <div className="mb-1 text-[10px] font-bold text-slate-500">
                a′ — 가운데 세로선에서 발까지 수평 거리 (cm)
              </div>
              <div className="text-lg font-extrabold text-amber-400">
                {ap !== null ? `${ap.toFixed(2)} cm` : "— 발을 클릭하세요"}
              </div>
            </div>
            <div className="flex-1 min-w-[160px] rounded-xl border border-blue-900/40 bg-slate-900 px-3 py-2 text-center">
              <div className="mb-1 text-[10px] font-bold text-slate-500">
                b′ — 아랫단에서 발까지 수직 거리 (cm)
              </div>
              <div className="text-lg font-extrabold text-emerald-400">
                {bp !== null ? `${bp.toFixed(2)} cm` : "— 발을 클릭하세요"}
              </div>
            </div>
          </div>

          {/* 다음 단계 버튼 */}
          <button
            type="button"
            disabled={ap === null || bp === null}
            onClick={() => goToStep(2)}
            className={`block w-full rounded-lg border px-3 py-2.5 text-sm font-extrabold transition ${
              ap !== null && bp !== null
                ? "border-sky-400 bg-sky-700 text-sky-50 hover:bg-sky-600"
                : "cursor-not-allowed border-slate-600 bg-slate-800 text-slate-500"
            }`}
          >
            {ap !== null && bp !== null
              ? "측정 완료 ✓  →  STEP 2: 3D 갤러리 장면 보기"
              : "발 위치를 먼저 표시하세요 (📍 클릭 후 활성화)"}
          </button>
        </StepCard>
      </section>

      {/* STEP 2 — 3D 갤러리 */}
      {step >= 2 ? (
        <section className="mb-3">
          <StepCard num="STEP 2 — 3D 갤러리 장면">
            <p className="mb-2 text-sm leading-relaxed text-slate-300">
              그림이 벽에 걸려 있고 관찰자가 앞에서 바라보고 있습니다.
              <br />
              Mr. 아르놀피니는 <b className="text-amber-400">그림 뒤</b>에 서 있습니다 — 마치{" "}
              <b>창문 너머</b>를 포착한 것처럼요!
              <br />
              <span className="text-[11px] text-slate-500">
                🖱 드래그: 회전 · 스크롤: 확대·축소 · 더블클릭: 초기화
              </span>
            </p>
            <div
              ref={outer3DRef}
              className="mb-2 overflow-hidden rounded-lg border border-blue-900/40 bg-[#060f1e]"
            >
              <canvas
                ref={cvs3DRef}
                onPointerDown={on3DPointerDown}
                onPointerMove={on3DPointerMove}
                onPointerUp={on3DPointerUp}
                onPointerCancel={on3DPointerUp}
                onWheel={on3DWheel}
                onDoubleClick={on3DDoubleClick}
                className="block touch-none"
                style={{ cursor: drag3DRef.current ? "grabbing" : "grab" }}
              />
            </div>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="block w-full rounded-lg border border-sky-400 bg-sky-700 px-3 py-2.5 text-sm font-extrabold text-sky-50 transition hover:bg-sky-600"
            >
              다음: 변수 확인하기 →
            </button>
          </StepCard>
        </section>
      ) : null}

      {/* STEP 3 — 변수 색 설명 */}
      {step >= 3 ? (
        <section className="mb-3">
          <StepCard num="STEP 3 — 3D 장면에서 변수 확인">
            <div className="mb-2 text-sm leading-relaxed text-slate-300">
              3D 장면에서 각 변수가 어디에 해당하는지 확인하세요.
              <br />
              <VarLine col="#f87171" label="H = 77.8 cm" desc="관찰자 눈 높이 (그림 아랫단 기준)" />
              <VarLine col="#93c5fd" label="D = 150 cm" desc="관찰자 눈에서 그림까지 수평 거리" />
              <VarLine
                col="#f59e0b"
                label="a′"
                desc="그림 가운데 세로선에서 발 위치까지 수평 거리 (그림에서 측정)"
              />
              <VarLine
                col="#4ade80"
                label="b′"
                desc="그림 아랫단에서 발 위치까지 수직 거리 (그림에서 측정)"
              />
              <VarLine col="#60a5fa" label="a" desc="실제 공간에서 중심 세로선으로부터의 수평 거리 (구하는 값)" />
              <VarLine col="#a78bfa" label="b" desc="실제 공간에서 그림에서 아르놀피니까지의 거리 (구하는 값)" />
            </div>
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="block w-full rounded-lg border border-sky-400 bg-sky-700 px-3 py-2.5 text-sm font-extrabold text-sky-50 transition hover:bg-sky-600"
            >
              다음: 역공식으로 계산하기 →
            </button>
          </StepCard>
        </section>
      ) : null}

      {/* STEP 4 — 계산기 */}
      {step >= 4 ? (
        <section className="mb-3">
          <StepCard num="STEP 4 — 역공식으로 실제 위치 계산">
            <p className="mb-3 text-sm leading-relaxed text-slate-300">
              STEP 1에서 측정한 <span className="font-bold text-amber-400">a′</span>,{" "}
              <span className="font-bold text-emerald-400">b′</span>를 역공식에 대입하면 Mr.
              아르놀피니의 실제 위치{" "}
              <span className="font-bold text-blue-400">A(a, b)</span>를 구할 수 있습니다!
            </p>

            <div className="mb-3 rounded-xl border border-blue-900/40 bg-blue-950/30 px-4 py-3 leading-relaxed">
              <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                역공식 (탐구활동 5 결과)
              </div>
              <div className="font-mono text-sm text-sky-200">
                b = <span className="font-extrabold text-amber-300">D · b′</span> / (
                <span className="font-extrabold text-amber-300">H − b′</span>) ={" "}
                150 · b′ / (77.8 − b′)
              </div>
              <div className="font-mono text-sm text-sky-200">
                a = <span className="font-extrabold text-amber-300">H · a′</span> / (
                <span className="font-extrabold text-amber-300">H − b′</span>) ={" "}
                77.8 · a′ / (77.8 − b′)
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                H = 77.8 cm (눈 높이, 그림 아랫단 기준) | D = 150 cm (그림까지 수평 거리)
              </div>
            </div>

            <div className="rounded-xl border border-teal-500/40 bg-emerald-950/40 p-4">
              <div className="mb-2 text-sm font-extrabold text-emerald-300">
                🧮 계산기 (STEP 1 측정값이 자동 입력됩니다)
              </div>
              <div className="mb-2">
                <label className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
                  <span className="sm:flex-1">a′ = 가운데선에서 발까지 수평 거리 (cm)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.1}
                    value={calcApInput}
                    onChange={(e) => setCalcApInput(e.target.value)}
                    placeholder="예: 11.5"
                    className="w-28 rounded-md border border-teal-500/50 bg-emerald-950 px-2 py-1 text-right text-xs text-emerald-100 outline-none focus:border-emerald-300"
                  />
                </label>
              </div>
              <div className="mb-3">
                <label className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-200">
                  <span className="sm:flex-1">b′ = 아랫단에서 발까지 수직 거리 (cm)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.1}
                    value={calcBpInput}
                    onChange={(e) => setCalcBpInput(e.target.value)}
                    placeholder="예: 12.7"
                    className="w-28 rounded-md border border-teal-500/50 bg-emerald-950 px-2 py-1 text-right text-xs text-emerald-100 outline-none focus:border-emerald-300"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={runCalc}
                className="rounded-md border border-teal-400 bg-emerald-800 px-4 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-700"
              >
                계산하기 → 3D 업데이트
              </button>
              {calcError ? (
                <div className="mt-3 rounded-md border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-xs text-rose-200">
                  ⚠️ {calcError}
                </div>
              ) : null}
              {calcResult ? (
                <div className="mt-3 rounded-md border border-emerald-400/40 bg-emerald-900/40 p-3 text-xs leading-relaxed text-emerald-100">
                  <div>
                    측정값: a′ = <b>{calcResult.ap.toFixed(2)} cm</b>,&nbsp; b′ ={" "}
                    <b>{calcResult.bp.toFixed(2)} cm</b>
                  </div>
                  <div className="mt-1">
                    <b>
                      b = 150 × {calcResult.bp.toFixed(2)} / (77.8 − {calcResult.bp.toFixed(2)}) ={" "}
                      <span className="text-base text-amber-300">{calcResult.b.toFixed(1)} cm</span>
                    </b>
                  </div>
                  <div className="mt-1">
                    <b>
                      a = 77.8 × {calcResult.ap.toFixed(2)} / (77.8 − {calcResult.bp.toFixed(2)}) ={" "}
                      <span className="text-base text-amber-300">{calcResult.a.toFixed(1)} cm</span>
                    </b>
                  </div>
                  <div className="mt-2 text-emerald-200">
                    ⬆ 위의 3D 장면을 확인하세요! Mr. 아르놀피니는 그림 기준{" "}
                    <b className="text-amber-300">뒤로 약 {calcResult.b.toFixed(1)} cm</b>,
                    옆으로 <b className="text-amber-300">약 {calcResult.a.toFixed(1)} cm</b>{" "}
                    위치입니다! 🎨
                  </div>
                </div>
              ) : null}
            </div>
          </StepCard>
        </section>
      ) : null}
    </div>
  );
}

// ─── 작은 컴포넌트들 ───────────────────────────────────
function StepBar({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  const labels = ["📐 그림 측정", "🌐 3D 장면", "📌 변수 확인", "🧮 역공식 계산"];
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center">
        {[1, 2, 3, 4].map((n, i) => (
          <div key={n} className="contents">
            <button
              type="button"
              onClick={() => onJump(n)}
              disabled={n > step}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold transition ${
                n < step
                  ? "border-emerald-400 bg-emerald-600 text-white"
                  : n === step
                    ? "border-sky-400 bg-sky-700 text-sky-50"
                    : "border-slate-600 bg-slate-800 text-slate-500"
              } ${n <= step ? "cursor-pointer" : "cursor-not-allowed"}`}
              aria-label={`STEP ${n}`}
            >
              {n < step ? "✓" : n}
            </button>
            {i < 3 ? (
              <div className={`h-0.5 flex-1 transition ${n < step ? "bg-emerald-600" : "bg-slate-700"}`} />
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex justify-between px-1 text-[10px] text-slate-500">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function StepCard({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-blue-900/40 bg-slate-900 px-3.5 py-3">
      <span className="mb-2 inline-block rounded-md bg-sky-900 px-2 py-0.5 text-[11px] font-extrabold text-sky-200">
        {num}
      </span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function VarLine({ col, label, desc }: { col: string; label: string; desc: string }) {
  return (
    <div className="flex gap-2 leading-relaxed">
      <span className="font-bold" style={{ color: col }}>
        ■ <b>{label}</b>
      </span>
      <span className="text-slate-400">: {desc}</span>
    </div>
  );
}
