"use client";

// 영재 단원 ③ (사진과 그림을 활용한 시선) 6활동이 공유하는 측정·작도 캔버스.
//
// 참고 패턴: https://github.com/dskim-git/measure (Streamlit + HTML5 Canvas 측정 앱).
//
// 도구 3종:
//   * 선분 (line) — 두 점 클릭 → 거리 측정. 결과 패널에 #N + 길이(px/cm).
//   * 직선 (ray)  — 두 점 클릭 → 화면 끝까지 연장된 무한 직선 (점선). 소실점 탐색용.
//   * 지우개 (erase) — 선 호버 시 강조, 클릭 시 삭제.
//
// 좌표계:
//   * world (px, py) = 이미지 로컬 (사진 좌상단 = 0,0). 모든 측정 저장.
//   * canvas (cx, cy) = 표시 픽셀.
//   * 변환: cx = (px + margins.L) * zoom, cy = (py + margins.T) * zoom.
//
// 자동 확장: 가장자리 EDGE_THRESHOLD px 이내 클릭 → 그 방향으로 EXPAND_CHUNK 만큼 확장.
//   margins 는 world 단위라 (chunk px / zoom) 만큼 더함. wrap scrollLeft/Top 도 보정해
//   학생 시점에선 사진이 같은 자리에 있는 듯 보임.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToolKey = "line" | "ray" | "erase";

export type MeasureItem = {
  key: string;
  src: string;
};

type Pt = { x: number; y: number };

type Measurement = {
  id: number;
  type: "line" | "ray";
  color: string;
  thick: number;
  p1: Pt;
  p2: Pt;
};

type Margins = { L: number; T: number; R: number; B: number };

type PerImage = {
  measurements: Measurement[];
  nextId: number;
  margins: Margins;
  zoom: number;
};

const COLORS = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#38bdf8", "#a78bfa", "#f8fafc"];
const INITIAL_MARGIN = 400;
const EDGE_THRESHOLD = 60;
const EXPAND_CHUNK = 300;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const ZOOM_DEFAULT = 1;
const DPI_DEFAULT = 96;

// ─── 기하 헬퍼 ─────────────────────────────────────────────
function distToSeg(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function clipLineToRect(p1: Pt, p2: Pt, w: number, h: number): [Pt, Pt] | null {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return null;
  let tmin = -Infinity;
  let tmax = Infinity;
  if (Math.abs(dx) > 1e-9) {
    const tx1 = -p1.x / dx;
    const tx2 = (w - p1.x) / dx;
    tmin = Math.max(tmin, Math.min(tx1, tx2));
    tmax = Math.min(tmax, Math.max(tx1, tx2));
  } else if (p1.x < 0 || p1.x > w) {
    return null;
  }
  if (Math.abs(dy) > 1e-9) {
    const ty1 = -p1.y / dy;
    const ty2 = (h - p1.y) / dy;
    tmin = Math.max(tmin, Math.min(ty1, ty2));
    tmax = Math.min(tmax, Math.max(ty1, ty2));
  } else if (p1.y < 0 || p1.y > h) {
    return null;
  }
  if (tmin >= tmax) return null;
  return [
    { x: p1.x + tmin * dx, y: p1.y + tmin * dy },
    { x: p1.x + tmax * dx, y: p1.y + tmax * dy },
  ];
}

function lengthPx(p1: Pt, p2: Pt): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

const DEFAULT_PER: PerImage = {
  measurements: [],
  nextId: 1,
  margins: { L: INITIAL_MARGIN, T: INITIAL_MARGIN, R: INITIAL_MARGIN, B: INITIAL_MARGIN },
  zoom: ZOOM_DEFAULT,
};

export type MeasureCanvasProps = {
  items: MeasureItem[];
  selectedKey: string;
  /** 기본 ["line","ray","erase"]. 활동에 따라 일부만. */
  enabledTools?: ToolKey[];
  /** 기본 true. line 도구 미포함 활동도 직선 개수는 표시. */
  showResultPanel?: boolean;
  /** 기본 "px". line 도구 없으면 무시. */
  defaultUnit?: "px" | "cm";
  /** cm 환산용 DPI. 기본 96. */
  dpi?: number;
  /** 그림 사방 초기 여백 (world 단위). 기본 400 — 소실점 찾기 같이 사진 밖 연장이
   *  필요한 활동용. 측정만 하는 활동(거리·격자 측정 등)은 80~120 정도가 적합. */
  initialMargin?: number;
  /** 결과 패널 하단에 추가로 렌더할 활동별 콘텐츠 (정답 토글 등). */
  extraPanelContent?: ReactNode;
};

export default function MeasureCanvas({
  items,
  selectedKey,
  enabledTools = ["line", "ray", "erase"],
  showResultPanel = true,
  defaultUnit = "px",
  dpi = DPI_DEFAULT,
  initialMargin = INITIAL_MARGIN,
  extraPanelContent,
}: MeasureCanvasProps) {
  const [tool, setTool] = useState<ToolKey>(() => enabledTools[0] ?? "line");
  const [color, setColor] = useState("#ef4444");
  const [thick, setThick] = useState(3);
  const [unit, setUnit] = useState<"px" | "cm">(defaultUnit);
  const [firstPoint, setFirstPoint] = useState<Pt | null>(null);
  const [previewCursor, setPreviewCursor] = useState<Pt | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [statusCursor, setStatusCursor] = useState<Pt | null>(null);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [perImage, setPerImage] = useState<Record<string, PerImage>>(() => {
    const o: Record<string, PerImage> = {};
    for (const it of items) {
      o[it.key] = {
        measurements: [],
        nextId: 1,
        margins: { L: initialMargin, T: initialMargin, R: initialMargin, B: initialMargin },
        zoom: ZOOM_DEFAULT,
      };
    }
    return o;
  });

  // 추가된 selectedKey가 perImage에 없으면 채움.
  useEffect(() => {
    setPerImage((prev) => {
      if (prev[selectedKey]) return prev;
      return {
        ...prev,
        [selectedKey]: {
          measurements: [],
          nextId: 1,
          margins: { L: initialMargin, T: initialMargin, R: initialMargin, B: initialMargin },
          zoom: ZOOM_DEFAULT,
        },
      };
    });
  }, [selectedKey, initialMargin]);

  const cur: PerImage = perImage[selectedKey] ?? DEFAULT_PER;
  const margins = cur.margins;
  const zoom = cur.zoom;
  const measurements = cur.measurements;

  const cvsRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const bgRef = useRef<HTMLImageElement | null>(null);
  const imgSizeRef = useRef({ W: 920, H: 518 });
  // 다음 canvas-dims effect 가 적용할 추가 스크롤 (확장으로 시각 위치 유지).
  const pendingScrollRef = useRef({ dL: 0, dT: 0 });
  const needCenterRef = useRef(false);

  // ─── 이미지 로드 ──────────────────────────────────────────
  useEffect(() => {
    const it = items.find((x) => x.key === selectedKey);
    if (!it) return;
    let cancelled = false;
    setFirstPoint(null);
    setPreviewCursor(null);
    setHoveredId(null);

    const load = () =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const cached = imgCacheRef.current.get(it.key);
        if (cached) {
          resolve(cached);
          return;
        }
        const img = new Image();
        img.onload = () => {
          imgCacheRef.current.set(it.key, img);
          resolve(img);
        };
        img.onerror = () => resolve(null);
        img.src = it.src;
      });

    load().then((img) => {
      if (cancelled) return;
      bgRef.current = img;
      let W = 920;
      let H = 518;
      if (img) {
        const isPortrait = img.naturalHeight > img.naturalWidth;
        const dispW = isPortrait ? 460 : 920;
        const scale = dispW / img.naturalWidth;
        W = dispW;
        H = Math.round(img.naturalHeight * scale);
      }
      imgSizeRef.current = { W, H };
      needCenterRef.current = true;
      setCanvasVersion((v) => v + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedKey, items]);

  // ─── 캔버스 크기 갱신 + 스크롤 보정 ───────────────────────
  useEffect(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const { W, H } = imgSizeRef.current;
    const newW = Math.round((margins.L + W + margins.R) * zoom);
    const newH = Math.round((margins.T + H + margins.B) * zoom);
    cvs.width = newW;
    cvs.height = newH;
    cvs.style.width = `${newW}px`;
    cvs.style.height = `${newH}px`;

    const wrap = wrapRef.current;
    if (wrap) {
      const { dL, dT } = pendingScrollRef.current;
      if (dL || dT) {
        wrap.scrollLeft += dL;
        wrap.scrollTop += dT;
        pendingScrollRef.current = { dL: 0, dT: 0 };
      }
      if (needCenterRef.current) {
        needCenterRef.current = false;
        wrap.scrollLeft = Math.max(0, (newW - wrap.clientWidth) / 2);
        wrap.scrollTop = Math.max(0, (newH - wrap.clientHeight) / 2);
      }
    }
  }, [margins, zoom, canvasVersion]);

  // ─── 한 measurement 그리기 ────────────────────────────────
  const drawMeasurement = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      m: Measurement,
      L: number,
      T: number,
      z: number,
      cvsW: number,
      cvsH: number,
      isHover: boolean,
    ) => {
      const p1c = { x: (m.p1.x + L) * z, y: (m.p1.y + T) * z };
      const p2c = { x: (m.p2.x + L) * z, y: (m.p2.y + T) * z };
      const thickPx = isHover ? m.thick + 3 : m.thick;

      ctx.save();
      ctx.strokeStyle = m.color;
      ctx.lineWidth = thickPx;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (m.type === "ray") {
        ctx.setLineDash([10, 6]);
        const ext = clipLineToRect(p1c, p2c, cvsW, cvsH);
        if (ext) {
          ctx.beginPath();
          ctx.moveTo(ext[0].x, ext[0].y);
          ctx.lineTo(ext[1].x, ext[1].y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      } else {
        ctx.beginPath();
        ctx.moveTo(p1c.x, p1c.y);
        ctx.lineTo(p2c.x, p2c.y);
        ctx.stroke();
      }

      // anchor 점 두 개 (어디 클릭했는지 표시)
      ctx.fillStyle = m.color;
      for (const p of [p1c, p2c]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(3, m.thick / 2 + 1), 0, Math.PI * 2);
        ctx.fill();
      }

      // 라벨 (#N) — 두 점 중점 위쪽에 표시
      const mid = { x: (p1c.x + p2c.x) / 2, y: (p1c.y + p2c.y) / 2 };
      ctx.font = "bold 13px Segoe UI, Noto Sans KR, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // 선분(line)은 라벨에 길이도 표시 — 학생이 캔버스에서 바로 확인 가능.
      let text = `#${m.id}`;
      if (m.type === "line") {
        const lenP = Math.hypot(m.p2.x - m.p1.x, m.p2.y - m.p1.y);
        const lenStr =
          unit === "cm" ? `${(lenP / (dpi / 2.54)).toFixed(2)} cm` : `${lenP.toFixed(1)} px`;
        text += ` · ${lenStr}`;
      }
      const tw = ctx.measureText(text).width;
      const pillW = tw + 12;
      const pillH = 18;
      ctx.fillStyle = "rgba(15,23,42,0.88)";
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 1.5;
      roundRectPath(ctx, mid.x - pillW / 2, mid.y - pillH / 2 - 20, pillW, pillH, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = m.color;
      ctx.fillText(text, mid.x, mid.y - 20);
      ctx.restore();
    },
    [unit, dpi],
  );

  // ─── 전체 redraw ──────────────────────────────────────────
  const draw = useCallback(() => {
    const cvs = cvsRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const { W, H } = imgSizeRef.current;
    const { L, T } = margins;
    const z = zoom;

    ctx.fillStyle = "#070c18";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    // 격자
    ctx.save();
    ctx.strokeStyle = "rgba(51,65,85,0.4)";
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < cvs.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cvs.height);
      ctx.stroke();
    }
    for (let y = 0; y < cvs.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cvs.width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 이미지
    const imgX = L * z;
    const imgY = T * z;
    const imgW = W * z;
    const imgH = H * z;
    if (bgRef.current) {
      ctx.drawImage(bgRef.current, imgX, imgY, imgW, imgH);
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(imgX, imgY, imgW, imgH);
      ctx.fillStyle = "#475569";
      ctx.font = "bold 20px Segoe UI";
      ctx.textAlign = "center";
      ctx.fillText("이미지를 불러올 수 없습니다", imgX + imgW / 2, imgY + imgH / 2);
      ctx.textAlign = "left";
    }
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.strokeRect(imgX, imgY, imgW, imgH);

    // 측정 결과
    for (const m of measurements) {
      drawMeasurement(ctx, m, L, T, z, cvs.width, cvs.height, m.id === hoveredId);
    }

    // 미리보기 — 첫 점 있고 도구가 line/ray 일 때 커서로 임시 도형.
    if (firstPoint && previewCursor && (tool === "line" || tool === "ray")) {
      ctx.globalAlpha = 0.55;
      drawMeasurement(
        ctx,
        {
          id: 0,
          type: tool,
          color,
          thick,
          p1: firstPoint,
          p2: previewCursor,
        },
        L,
        T,
        z,
        cvs.width,
        cvs.height,
        false,
      );
      ctx.globalAlpha = 1;
    }

    // 첫 점 마커 (원 + 십자선)
    if (firstPoint) {
      const cp = { x: (firstPoint.x + L) * z, y: (firstPoint.y + T) * z };
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cp.x - 14, cp.y);
      ctx.lineTo(cp.x - 4, cp.y);
      ctx.moveTo(cp.x + 4, cp.y);
      ctx.lineTo(cp.x + 14, cp.y);
      ctx.moveTo(cp.x, cp.y - 14);
      ctx.lineTo(cp.x, cp.y - 4);
      ctx.moveTo(cp.x, cp.y + 4);
      ctx.lineTo(cp.x, cp.y + 14);
      ctx.stroke();
      ctx.restore();
    }
  }, [margins, zoom, measurements, firstPoint, previewCursor, tool, color, thick, hoveredId, drawMeasurement]);

  useEffect(() => {
    draw();
  }, [draw, canvasVersion]);

  // ─── 가장자리 인접 클릭 시 자동 확장 ─────────────────────
  const maybeExpand = useCallback(
    (cx: number, cy: number) => {
      const cvs = cvsRef.current;
      if (!cvs) return;
      let dL = 0;
      let dT = 0;
      let dR = 0;
      let dB = 0;
      if (cx < EDGE_THRESHOLD) dL = EXPAND_CHUNK;
      if (cy < EDGE_THRESHOLD) dT = EXPAND_CHUNK;
      if (cx > cvs.width - EDGE_THRESHOLD) dR = EXPAND_CHUNK;
      if (cy > cvs.height - EDGE_THRESHOLD) dB = EXPAND_CHUNK;
      if (!(dL || dT || dR || dB)) return;
      pendingScrollRef.current.dL += dL;
      pendingScrollRef.current.dT += dT;
      const z = zoom;
      setPerImage((p) => {
        const c = p[selectedKey];
        if (!c) return p;
        return {
          ...p,
          [selectedKey]: {
            ...c,
            margins: {
              L: c.margins.L + dL / z,
              T: c.margins.T + dT / z,
              R: c.margins.R + dR / z,
              B: c.margins.B + dB / z,
            },
          },
        };
      });
    },
    [selectedKey, zoom],
  );

  // ─── 좌표 변환 ────────────────────────────────────────────
  function pxCoords(e: { clientX: number; clientY: number }): Pt {
    const cvs = cvsRef.current!;
    const r = cvs.getBoundingClientRect();
    const sx = cvs.width / r.width;
    const sy = cvs.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }

  function canvasToWorld(cx: number, cy: number): Pt {
    return { x: cx / zoom - margins.L, y: cy / zoom - margins.T };
  }

  // ─── hit-test ─────────────────────────────────────────────
  const findHit = useCallback(
    (wx: number, wy: number): Measurement | null => {
      const cvs = cvsRef.current;
      if (!cvs) return null;
      const cx = (wx + margins.L) * zoom;
      const cy = (wy + margins.T) * zoom;
      for (let i = measurements.length - 1; i >= 0; i--) {
        const m = measurements[i];
        const p1c = { x: (m.p1.x + margins.L) * zoom, y: (m.p1.y + margins.T) * zoom };
        const p2c = { x: (m.p2.x + margins.L) * zoom, y: (m.p2.y + margins.T) * zoom };
        const r = Math.max(8, m.thick / 2 + 5);
        if (m.type === "ray") {
          const ext = clipLineToRect(p1c, p2c, cvs.width, cvs.height);
          if (!ext) continue;
          if (distToSeg(cx, cy, ext[0].x, ext[0].y, ext[1].x, ext[1].y) <= r) return m;
        } else if (distToSeg(cx, cy, p1c.x, p1c.y, p2c.x, p2c.y) <= r) {
          return m;
        }
      }
      return null;
    },
    [measurements, margins, zoom],
  );

  // ─── 이벤트 ───────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.button !== undefined && e.button !== 0) return; // 좌클릭만
    e.preventDefault();
    const { x: cx, y: cy } = pxCoords(e);
    maybeExpand(cx, cy);
    const w = canvasToWorld(cx, cy);

    if (tool === "erase") {
      const hit = findHit(w.x, w.y);
      if (hit) {
        setPerImage((p) => {
          const c = p[selectedKey];
          if (!c) return p;
          return {
            ...p,
            [selectedKey]: {
              ...c,
              measurements: c.measurements.filter((m) => m.id !== hit.id),
            },
          };
        });
      }
      return;
    }

    // line / ray
    if (!firstPoint) {
      setFirstPoint(w);
      setPreviewCursor(w);
    } else {
      const dx = w.x - firstPoint.x;
      const dy = w.y - firstPoint.y;
      // 첫 점과 너무 가까우면 무시 (오클릭 방지)
      const minDistWorld = 5 / zoom;
      if (dx * dx + dy * dy < minDistWorld * minDistWorld) return;
      const second = w;
      setPerImage((p) => {
        const c = p[selectedKey];
        if (!c) return p;
        return {
          ...p,
          [selectedKey]: {
            ...c,
            measurements: [
              ...c.measurements,
              {
                id: c.nextId,
                type: tool === "line" ? "line" : "ray",
                color,
                thick,
                p1: firstPoint,
                p2: second,
              },
            ],
            nextId: c.nextId + 1,
          },
        };
      });
      setFirstPoint(null);
      setPreviewCursor(null);
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x: cx, y: cy } = pxCoords(e);
    const w = canvasToWorld(cx, cy);
    setStatusCursor(w);

    if ((tool === "line" || tool === "ray") && firstPoint) {
      setPreviewCursor(w);
    }

    if (tool === "erase") {
      const hit = findHit(w.x, w.y);
      setHoveredId(hit ? hit.id : null);
    } else if (hoveredId !== null) {
      setHoveredId(null);
    }
  }

  function onPointerLeave() {
    setStatusCursor(null);
    if (tool === "erase") setHoveredId(null);
    if (tool === "line" || tool === "ray") setPreviewCursor(null);
  }

  function onContextMenu(e: React.MouseEvent<HTMLCanvasElement>) {
    if (firstPoint) {
      e.preventDefault();
      setFirstPoint(null);
      setPreviewCursor(null);
    }
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * factor));
    setZoomCur(newZoom);
  }

  function setZoomCur(z: number) {
    setPerImage((p) => {
      const c = p[selectedKey];
      if (!c) return p;
      return { ...p, [selectedKey]: { ...c, zoom: z } };
    });
  }

  function zoomFit() {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const { W, H } = imgSizeRef.current;
    const availW = wrap.clientWidth - 20;
    const availH = wrap.clientHeight - 20;
    const totalW = margins.L + W + margins.R;
    const totalH = margins.T + H + margins.B;
    const z = Math.min(availW / totalW, availH / totalH);
    setZoomCur(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)));
  }

  // ESC 첫 점 취소.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && firstPoint) {
        setFirstPoint(null);
        setPreviewCursor(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [firstPoint]);

  // 도구 바꾸면 첫 점 자동 취소.
  useEffect(() => {
    setFirstPoint(null);
    setPreviewCursor(null);
  }, [tool]);

  function undo() {
    setPerImage((p) => {
      const c = p[selectedKey];
      if (!c || c.measurements.length === 0) return p;
      return { ...p, [selectedKey]: { ...c, measurements: c.measurements.slice(0, -1) } };
    });
  }

  function clearAll() {
    setPerImage((p) => {
      const c = p[selectedKey];
      if (!c) return p;
      return { ...p, [selectedKey]: { ...c, measurements: [] } };
    });
    setFirstPoint(null);
    setPreviewCursor(null);
  }

  function expandAllAround() {
    pendingScrollRef.current.dL += EXPAND_CHUNK;
    pendingScrollRef.current.dT += EXPAND_CHUNK;
    const z = zoom;
    setPerImage((p) => {
      const c = p[selectedKey];
      if (!c) return p;
      return {
        ...p,
        [selectedKey]: {
          ...c,
          margins: {
            L: c.margins.L + EXPAND_CHUNK / z,
            T: c.margins.T + EXPAND_CHUNK / z,
            R: c.margins.R + EXPAND_CHUNK / z,
            B: c.margins.B + EXPAND_CHUNK / z,
          },
        },
      };
    });
  }

  // 결과 패널 — 선분만 길이 표시 (직선은 무한이라 길이 의미 X)
  const lineMs = useMemo(() => measurements.filter((m) => m.type === "line"), [measurements]);
  const rayMs = useMemo(() => measurements.filter((m) => m.type === "ray"), [measurements]);
  const lenPxArr = useMemo(() => lineMs.map((m) => lengthPx(m.p1, m.p2)), [lineMs]);
  const sumPx = lenPxArr.reduce((s, x) => s + x, 0);
  const meanPx = lenPxArr.length ? sumPx / lenPxArr.length : 0;

  function formatLen(px: number): string {
    if (unit === "cm") {
      const cm = px / (dpi / 2.54);
      return `${cm.toFixed(2)} cm`;
    }
    return `${px.toFixed(1)} px`;
  }

  const statusCursorStr = statusCursor
    ? `(${Math.round(statusCursor.x)}, ${Math.round(statusCursor.y)})`
    : "—";

  const toolNameKr =
    tool === "line" ? "선분" : tool === "ray" ? "직선" : "지우개";

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2">
        <div className="flex items-center gap-1">
          {enabledTools.includes("line") && (
            <ToolBtn active={tool === "line"} onClick={() => setTool("line")} label="📏 선분" />
          )}
          {enabledTools.includes("ray") && (
            <ToolBtn active={tool === "ray"} onClick={() => setTool("ray")} label="📐 직선" />
          )}
          {enabledTools.includes("erase") && (
            <ToolBtn active={tool === "erase"} onClick={() => setTool("erase")} label="🧹 지우개" />
          )}
        </div>
        <span className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">색</span>
          {COLORS.map((c) => (
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
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-6 w-7 cursor-pointer rounded border-none bg-transparent p-0"
            title="직접 색상 선택"
            aria-label="직접 색상 선택"
          />
        </div>
        <span className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">두께</span>
          <input
            type="range"
            min={1}
            max={12}
            value={thick}
            onChange={(e) => setThick(Number(e.target.value))}
            className="w-20 accent-teal-400"
            title="선 두께"
            aria-label="선 두께"
          />
          <span className="min-w-[14px] text-xs font-bold text-teal-300">{thick}</span>
        </div>
        <span className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">줌</span>
          <button
            type="button"
            onClick={() => setZoomCur(Math.max(ZOOM_MIN, zoom / 1.15))}
            className="rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-xs font-bold text-slate-300 hover:border-teal-400"
            title="축소"
            aria-label="축소"
          >
            －
          </button>
          <span className="min-w-[44px] text-center text-xs font-bold text-teal-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomCur(Math.min(ZOOM_MAX, zoom * 1.15))}
            className="rounded border border-slate-600 bg-slate-900 px-1.5 py-0.5 text-xs font-bold text-slate-300 hover:border-teal-400"
            title="확대"
            aria-label="확대"
          >
            ＋
          </button>
          <button
            type="button"
            onClick={zoomFit}
            className="rounded border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs font-bold text-slate-300 hover:border-teal-400"
          >
            맞춤
          </button>
          <button
            type="button"
            onClick={() => setZoomCur(1)}
            className="rounded border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs font-bold text-slate-300 hover:border-teal-400"
          >
            100%
          </button>
        </div>
        {enabledTools.includes("line") ? (
          <>
            <span className="h-6 w-px bg-slate-700" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">단위</span>
              <button
                type="button"
                onClick={() => setUnit("px")}
                className={`rounded border px-2 py-0.5 text-xs font-bold ${
                  unit === "px"
                    ? "border-blue-500 bg-blue-950 text-blue-200"
                    : "border-slate-600 bg-slate-900 text-slate-400"
                }`}
              >
                px
              </button>
              <button
                type="button"
                onClick={() => setUnit("cm")}
                className={`rounded border px-2 py-0.5 text-xs font-bold ${
                  unit === "cm"
                    ? "border-blue-500 bg-blue-950 text-blue-200"
                    : "border-slate-600 bg-slate-900 text-slate-400"
                }`}
              >
                cm
              </button>
            </div>
          </>
        ) : null}
        <span className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-1">
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
            🗑 모두 지우기
          </button>
          <button
            type="button"
            onClick={expandAllAround}
            title="사방으로 캔버스 확장"
            className="rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-400 transition hover:border-teal-400 hover:text-teal-200"
          >
            🔍 사방 확장
          </button>
        </div>
      </div>

      <p className="mb-2 text-[11px] text-slate-500">
        💡{" "}
        {tool === "erase"
          ? "지우려는 선을 클릭하세요 (호버 시 두꺼워짐)."
          : "두 점을 차례로 클릭하세요 (ESC·우클릭 = 첫 점 취소)."}{" "}
        · 가장자리 가까이 클릭 = 캔버스 자동 확장 · Ctrl+휠 = 줌
      </p>

      {/* Canvas + Result Panel */}
      <div className={`grid gap-2 ${showResultPanel ? "lg:grid-cols-[1fr_220px]" : ""}`}>
        <div
          ref={wrapRef}
          className="relative overflow-auto rounded-lg border border-white/10 bg-slate-900"
          style={{ maxHeight: "min(70vh, 720px)" }}
        >
          <canvas
            ref={cvsRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onContextMenu={onContextMenu}
            onWheel={onWheel}
            className="block touch-none"
            style={{ cursor: tool === "erase" ? "pointer" : "crosshair" }}
          />
        </div>

        {showResultPanel ? (
          <aside className="space-y-2 rounded-lg border border-white/10 bg-slate-900/60 p-3">
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              📋 측정 결과
            </div>
            {enabledTools.includes("line") ? (
              <div className="space-y-1.5">
                {lineMs.length === 0 ? (
                  <div className="text-xs text-slate-500">
                    선분 도구로 두 점을 클릭하면 거리가 측정됩니다.
                  </div>
                ) : (
                  lineMs.map((m, i) => (
                    <div
                      key={m.id}
                      onMouseEnter={() => setHoveredId(m.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`flex items-center justify-between rounded-md border px-2 py-1 text-xs transition ${
                        hoveredId === m.id
                          ? "border-amber-400 bg-amber-900/40"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: m.color }}>
                          #{m.id}
                        </span>
                        <span className="text-slate-400">선분</span>
                      </div>
                      <span className="font-mono font-bold text-teal-300">
                        {formatLen(lenPxArr[i])}
                      </span>
                    </div>
                  ))
                )}
                {lineMs.length >= 2 ? (
                  <div className="mt-2 space-y-1 border-t border-slate-700 pt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">합계</span>
                      <span className="font-mono font-bold text-teal-300">{formatLen(sumPx)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">평균</span>
                      <span className="font-mono font-bold text-teal-300">{formatLen(meanPx)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {rayMs.length > 0 ? (
              <div className="mt-2 space-y-1.5 border-t border-slate-700 pt-2">
                <div className="text-[11px] font-semibold text-purple-300">📐 직선 (소실점 보조)</div>
                {rayMs.map((m) => (
                  <div
                    key={m.id}
                    onMouseEnter={() => setHoveredId(m.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs transition ${
                      hoveredId === m.id
                        ? "border-amber-400 bg-amber-900/40"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    <span className="font-bold" style={{ color: m.color }}>
                      #{m.id}
                    </span>
                    <span className="text-slate-400">직선</span>
                  </div>
                ))}
              </div>
            ) : null}

            {extraPanelContent ? (
              <div className="mt-2 border-t border-slate-700 pt-2">{extraPanelContent}</div>
            ) : null}
          </aside>
        ) : null}
      </div>

      {/* Status bar */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-white/10 bg-slate-900/60 px-3 py-1.5 text-[11px] text-slate-500">
        <div>
          위치 <span className="font-mono text-slate-300">{statusCursorStr}</span>
        </div>
        <div>
          도구 <span className="font-semibold text-slate-300">{toolNameKr}</span>
          {firstPoint ? (
            <span className="ml-2 text-amber-300">· 첫 점 찍힘 — 두 번째 점 클릭 대기</span>
          ) : null}
        </div>
        <div>
          측정 <span className="font-semibold text-slate-300">{measurements.length}개</span>
          {enabledTools.includes("line") ? (
            <span className="ml-2 text-slate-500">
              (선분 {lineMs.length} · 직선 {rayMs.length})
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-bold transition ${
        active
          ? "border-amber-400 bg-amber-900 text-amber-100"
          : "border-slate-600 bg-slate-900 text-slate-400 hover:border-slate-500"
      }`}
    >
      {label}
    </button>
  );
}
