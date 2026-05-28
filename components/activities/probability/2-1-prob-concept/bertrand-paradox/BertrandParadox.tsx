"use client";

import { useEffect, useRef, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ── 상수 ──
const MR = 115, MCX = 160, MCY = 160, MSIDE = MR * Math.sqrt(3);
const SR = 72, SCX = 77, SCY = 77, SSIDE = SR * Math.sqrt(3);

type Pt = [number, number];
type MData = { a1: number; a2: number; mx: number; ang: number; d: number };

function initData(m: number): MData {
  if (m === 0) return { a1: Math.random() * 2 * Math.PI, a2: Math.random() * 2 * Math.PI, mx: 0, ang: 0, d: 0 };
  if (m === 1) return { a1: 0, a2: 0, mx: (Math.random() * 2 - 1) * MR, ang: 0, d: 0 };
  return { a1: 0, a2: 0, mx: 0, ang: Math.random() * 2 * Math.PI, d: MR * Math.sqrt(Math.random()) };
}

// ── 단계 텍스트 ──
const STEPS: { t: string; x: string; f: string }[][] = [
  [
    { t: "원 그리기", x: "반지름 R인 원을 그립니다.\n빨간 점선은 내접원(반지름 R/2)입니다.\n\n목표: 내접 정삼각형의 한 변(길이 R√3)보다\n긴 현을 그을 확률은?", f: "P(현 길이 > R√3) = ?" },
    { t: "점 A 선택 → 정삼각형 결정", x: "원 위의 점 A를 균일하게 선택합니다.\nA를 한 꼭짓점으로 하는 정삼각형을 그립니다.\n나머지 두 꼭짓점 B₁, B₂가 결정됩니다.", f: "A에서 B₁, B₂까지 거리 = R√3 (정삼각형 한 변)" },
    { t: "긴 현이 되는 조건", x: "B가 호 B₁B₂ (A를 포함하지 않는 초록 호) 안에 있으면\n현 AB의 길이 > R√3이 됩니다!\n\n이 '유리한 호'는 원 전체(360°)의 1/3 = 120°입니다.", f: "유리한 호(초록) = 120° = 전체의 1/3" },
    { t: "점 B 선택 → 현 완성", x: "B를 원 위에서 균일하게 선택합니다.\nB가 초록 호 안에 있으면 → 긴 현 🔴\nB가 초록 호 밖에 있으면 → 짧은 현 ⚫", f: "B가 유리한 호 안  ⟺  긴 현" },
    { t: "확률 계산", x: "B는 원 위 어디에나 균일하게 선택됩니다.\n유리한 호(초록, 1) : 불리한 호(회색, 1+1) = 1 : 2\n\n따라서 확률 = 1/(1+2) = 1/3", f: "P₁ = 120° / 360° = 1/3 ≈ 0.333" },
  ],
  [
    { t: "원 그리기", x: "반지름 R인 원을 그립니다.\n빨간 점선은 내접원(반지름 R/2)입니다.\n\n목표: 내접 정삼각형의 한 변(길이 R√3)보다\n긴 현을 그을 확률은?", f: "P(현 길이 > R√3) = ?" },
    { t: "지름 P-Q 그리기", x: "원의 중심을 지나는 지름 P-Q를 그립니다.\n이 지름 위에서 점 M을 균일하게 선택할 것입니다.", f: "지름의 길이 = 2R" },
    { t: "경계 현 그리기 (삼각형의 변)", x: "P를 꼭짓점으로 하는 내접 정삼각형과\nQ를 꼭짓점으로 하는 내접 정삼각형을 그립니다.\n\n두 삼각형의 맞은편 변은 지름과 수직이며,\n각각 중심으로부터 R/2 거리에 위치합니다.\n\n→ 두 변 사이(녹색 구간): 긴 현 · 두 변 바깥(회색 구간): 짧은 현", f: "두 경계 현의 길이 = R√3 (내접 정삼각형의 변 길이)" },
    { t: "점 M 선택 → 현 완성", x: "지름 P-Q 위에서 점 M을 균일하게 선택합니다.\nM에서 지름과 수직인 현을 그립니다.\n\n• M이 두 변 사이(녹색 구간)에 있으면 → 긴 현 🔴\n• M이 두 변 바깥(회색 구간)에 있으면 → 짧은 현 ⚫", f: "M이 녹색 구간 내  ⟺  긴 현" },
    { t: "확률 계산", x: "지름 P-Q의 전체 길이 = 2R\n두 경계 변 사이(녹색 구간)의 길이 = R\n\n따라서 확률 = 녹색 구간 / 전체 지름 = R / 2R", f: "P₂ = R / 2R = 1/2 = 0.500" },
  ],
  [
    { t: "원과 내접 정삼각형", x: "같은 원입니다. 이번엔 원 내부의 점으로 현을 정의합니다.", f: "P(현 길이 > R√3) = ?" },
    { t: "원 내부 점 M 선택", x: "원 내부에서 점 M을 면적에 대해 균일하게 선택합니다.\n어느 넓이 영역이나 동일한 확률을 가집니다.\n(단순히 r을 균일하게 뽑으면 안 됩니다!)", f: "M ~ 원판 위 면적 균일 분포" },
    { t: "현 완성 + 조건 확인", x: "M을 중점으로 하는 현을 그립니다 (OM에 수직).\n현의 길이 = 2√(R²−|OM|²)\n\n긴 현 조건: |OM| < R/2  →  M이 내접원 안!", f: "|OM| < R/2  ⟺  현 길이 > R√3" },
    { t: "확률 계산", x: "M이 원판 전체에 균일하므로,\n확률 = 내접원 넓이 / 원 넓이 = 넓이의 비율!", f: "P₃ = π(R/2)² / πR² = 1/4 = 0.250" },
  ],
];
const MAXSTEP = [5, 5, 4];

// ── 그리기 헬퍼 ──
function drawBase(ctx: CanvasRenderingContext2D, r: number) {
  ctx.fillStyle = "#0b1220"; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save(); ctx.translate(r === MR ? MCX : SCX, r === MR ? MCY : SCY);
  ctx.setLineDash([4, 4]); ctx.strokeStyle = "rgba(239,68,68,0.38)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, r / 2, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]); ctx.strokeStyle = "rgba(226,232,240,0.6)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.stroke();
  ctx.restore();
}
function hexRgb(h: string) { return `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`; }
function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  ctx.fillStyle = `rgba(${hexRgb(col)},0.22)`; ctx.beginPath(); ctx.arc(x, y, r * 2.3, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
}
function lbl(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, col: string) {
  ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const w = ctx.measureText(text).width + 6;
  ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(x - w / 2, y - 7, w, 14);
  ctx.fillStyle = col; ctx.fillText(text, x, y);
}
function radOff(p: Pt, axis: number) { const len = Math.hypot(p[0], p[1]) || 1; return (p[axis] / len) * 17; }

function drawM0(ctx: CanvasRenderingContext2D, step: number, data: MData) {
  const { a1, a2 } = data;
  const p1: Pt = [MR * Math.cos(a1), MR * Math.sin(a1)], p2: Pt = [MR * Math.cos(a2), MR * Math.sin(a2)];
  const isLong = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) > MSIDE;
  const v1a = a1 + 2 * Math.PI / 3, v2a = a1 + 4 * Math.PI / 3;
  const tv1: Pt = [MR * Math.cos(v1a), MR * Math.sin(v1a)], tv2: Pt = [MR * Math.cos(v2a), MR * Math.sin(v2a)];
  drawBase(ctx, MR); ctx.save(); ctx.translate(MCX, MCY);
  if (step >= 2) {
    ctx.strokeStyle = "rgba(99,102,241,0.6)"; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(tv1[0], tv1[1]); ctx.lineTo(tv2[0], tv2[1]); ctx.closePath(); ctx.stroke();
    glow(ctx, tv1[0], tv1[1], 4, "#818cf8"); glow(ctx, tv2[0], tv2[1], 4, "#818cf8");
    lbl(ctx, tv1[0] + radOff(tv1, 0), tv1[1] + radOff(tv1, 1), "B₁", "#a5b4fc");
    lbl(ctx, tv2[0] + radOff(tv2, 0), tv2[1] + radOff(tv2, 1), "B₂", "#a5b4fc");
    glow(ctx, p1[0], p1[1], 6, "#fbbf24");
    lbl(ctx, p1[0] + radOff(p1, 0), p1[1] + radOff(p1, 1), "A", "#fbbf24");
  }
  if (step >= 3) {
    ctx.strokeStyle = "rgba(52,211,153,0.9)"; ctx.lineWidth = 6; ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(0, 0, MR, v1a, v2a); ctx.stroke();
    const mAng = a1 + Math.PI;
    ctx.fillStyle = "#34d399"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("유리한 호", (MR + 20) * Math.cos(mAng), (MR + 20) * Math.sin(mAng));
    ctx.fillText("(120°)", (MR + 20) * Math.cos(mAng), (MR + 20) * Math.sin(mAng) + 13);
  }
  if (step >= 4) {
    glow(ctx, p2[0], p2[1], 6, isLong ? "#ef4444" : "#94a3b8");
    lbl(ctx, p2[0] + radOff(p2, 0), p2[1] + radOff(p2, 1), "B", isLong ? "#fca5a5" : "#94a3b8");
    ctx.strokeStyle = isLong ? "rgba(239,68,68,0.22)" : "rgba(148,163,184,0.18)"; ctx.lineWidth = 7; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    ctx.strokeStyle = isLong ? "#ef4444" : "#94a3b8"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    ctx.fillStyle = isLong ? "#ef4444" : "#94a3b8"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(isLong ? "✓ 긴 현!" : "✗ 짧은 현", 0, MR + 18);
  }
  if (step >= 5) {
    const arcR = MR * 0.36;
    ctx.strokeStyle = "rgba(148,163,184,0.45)"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, arcR, a1, v1a); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, arcR, v2a, a1 + 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = "rgba(52,211,153,0.75)"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, arcR, v1a, v2a); ctx.stroke();
    ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#6ee7b7"; ctx.fillText("1", (arcR + 13) * Math.cos(a1 + Math.PI), (arcR + 13) * Math.sin(a1 + Math.PI));
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("1", (arcR + 13) * Math.cos(a1 + Math.PI / 3), (arcR + 13) * Math.sin(a1 + Math.PI / 3));
    ctx.fillText("1", (arcR + 13) * Math.cos(a1 + 5 * Math.PI / 3), (arcR + 13) * Math.sin(a1 + 5 * Math.PI / 3));
  }
  ctx.restore();
}

function drawM1(ctx: CanvasRenderingContext2D, step: number, data: MData) {
  const { mx } = data;
  const isLong = Math.abs(mx) < MR / 2;
  const h = MR * Math.sqrt(3) / 2;
  const half = Math.sqrt(Math.max(0, MR * MR - mx * mx));
  drawBase(ctx, MR); ctx.save(); ctx.translate(MCX, MCY);
  if (step >= 2) {
    ctx.strokeStyle = "rgba(248,113,113,0.7)"; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(-MR, 0); ctx.lineTo(MR, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(MR, 0); ctx.lineTo(MR - 10, -5); ctx.moveTo(MR, 0); ctx.lineTo(MR - 10, 5); ctx.stroke();
    glow(ctx, -MR, 0, 5, "#fbbf24"); glow(ctx, MR, 0, 5, "#fbbf24");
    lbl(ctx, -MR - 16, 0, "P", "#fbbf24"); lbl(ctx, MR + 16, 0, "Q", "#fbbf24");
  }
  if (step >= 3) {
    ctx.strokeStyle = "rgba(99,102,241,0.32)"; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(-MR, 0); ctx.lineTo(MR / 2, h); ctx.lineTo(MR / 2, -h); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(MR, 0); ctx.lineTo(-MR / 2, h); ctx.lineTo(-MR / 2, -h); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(6,182,212,0.9)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-MR / 2, -h); ctx.lineTo(-MR / 2, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(MR / 2, -h); ctx.lineTo(MR / 2, h); ctx.stroke();
    ctx.strokeStyle = "rgba(148,163,184,0.65)"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-MR, 0); ctx.lineTo(-MR / 2, 0); ctx.stroke();
    ctx.strokeStyle = "rgba(52,211,153,0.85)"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-MR / 2, 0); ctx.lineTo(MR / 2, 0); ctx.stroke();
    ctx.strokeStyle = "rgba(148,163,184,0.65)"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(MR / 2, 0); ctx.lineTo(MR, 0); ctx.stroke();
    ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#6ee7b7"; ctx.fillText("R (1/2)", 0, 15);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("R/2", -MR * 0.75, 15); ctx.fillText("R/2", MR * 0.75, 15);
    ctx.fillStyle = "#67e8f9"; ctx.font = "9px sans-serif";
    ctx.fillText("R/2", -MR / 2, -h - 9); ctx.fillText("R/2", MR / 2, -h - 9);
  }
  if (step >= 4) {
    ctx.strokeStyle = isLong ? "rgba(239,68,68,0.22)" : "rgba(148,163,184,0.18)"; ctx.lineWidth = 7; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(mx, -half); ctx.lineTo(mx, half); ctx.stroke();
    ctx.strokeStyle = isLong ? "#ef4444" : "#94a3b8"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(mx, -half); ctx.lineTo(mx, half); ctx.stroke();
    const s = 8;
    ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx + s, 0); ctx.lineTo(mx + s, s); ctx.lineTo(mx, s); ctx.stroke();
    glow(ctx, mx, 0, 6, "#06b6d4");
    lbl(ctx, mx + (mx > 0 ? 14 : -14), -15, "M", "#67e8f9");
    ctx.fillStyle = isLong ? "#ef4444" : "#94a3b8"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(isLong ? "✓ 중간 구간 → 긴 현!" : "✗ 바깥 구간 → 짧은 현", 0, MR + 18);
  }
  if (step >= 5) {
    const barY = MR * 0.82, bW = MR * 0.82;
    ctx.strokeStyle = "rgba(148,163,184,0.55)"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-bW, -barY); ctx.lineTo(-bW / 2, -barY); ctx.stroke();
    ctx.strokeStyle = "rgba(52,211,153,0.8)";
    ctx.beginPath(); ctx.moveTo(-bW / 2, -barY); ctx.lineTo(bW / 2, -barY); ctx.stroke();
    ctx.strokeStyle = "rgba(148,163,184,0.55)";
    ctx.beginPath(); ctx.moveTo(bW / 2, -barY); ctx.lineTo(bW, -barY); ctx.stroke();
    ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#6ee7b7"; ctx.fillText("1/2", 0, -barY - 11);
    ctx.fillStyle = "#94a3b8"; ctx.fillText("1/4", -bW * 0.75, -barY - 11); ctx.fillText("1/4", bW * 0.75, -barY - 11);
  }
  ctx.restore();
}

function drawM2(ctx: CanvasRenderingContext2D, step: number, data: MData) {
  const { ang, d } = data;
  const mid: Pt = [d * Math.cos(ang), d * Math.sin(ang)];
  const half = Math.sqrt(Math.max(0, MR * MR - d * d));
  const dx = -Math.sin(ang), dy = Math.cos(ang);
  const p1: Pt = [mid[0] + dx * half, mid[1] + dy * half], p2: Pt = [mid[0] - dx * half, mid[1] - dy * half];
  const isLong = d < MR / 2;
  drawBase(ctx, MR); ctx.save(); ctx.translate(MCX, MCY);
  if (step >= 2) {
    ctx.fillStyle = "rgba(52,211,153,0.04)"; ctx.beginPath(); ctx.arc(0, 0, MR, 0, 2 * Math.PI); ctx.fill();
    glow(ctx, mid[0], mid[1], 6, "#34d399"); lbl(ctx, mid[0] + 12, mid[1] - 12, "M", "#6ee7b7");
    ctx.strokeStyle = "rgba(52,211,153,0.32)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(mid[0], mid[1]); ctx.stroke(); ctx.setLineDash([]);
  }
  if (step >= 3) {
    ctx.strokeStyle = isLong ? "rgba(239,68,68,0.22)" : "rgba(148,163,184,0.18)"; ctx.lineWidth = 7; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    ctx.strokeStyle = isLong ? "#ef4444" : "#94a3b8"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    if (d > 8) {
      const s = 8, nx = Math.cos(ang), ny = Math.sin(ang);
      ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mid[0] + nx * s, mid[1] + ny * s); ctx.lineTo(mid[0] + nx * s + dx * s, mid[1] + ny * s + dy * s); ctx.lineTo(mid[0] + dx * s, mid[1] + dy * s); ctx.stroke();
    }
    ctx.strokeStyle = isLong ? "rgba(239,68,68,0.75)" : "rgba(148,163,184,0.5)"; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(0, 0, MR / 2, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
    if (isLong) { ctx.fillStyle = "rgba(239,68,68,0.07)"; ctx.beginPath(); ctx.arc(0, 0, MR / 2, 0, 2 * Math.PI); ctx.fill(); }
  }
  if (step >= 4) {
    ctx.fillStyle = isLong ? "#ef4444" : "#94a3b8"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(isLong ? "✓ |OM| < R/2 → 긴 현!" : "✗ |OM| ≥ R/2 → 짧은 현", 0, MR + 18);
  }
  ctx.restore();
}

const DRAWFN = [drawM0, drawM1, drawM2];

function genChord(m: number) {
  let p1: Pt, p2: Pt, mid: Pt;
  if (m === 0) {
    const a1 = Math.random() * 2 * Math.PI, a2 = Math.random() * 2 * Math.PI;
    p1 = [SR * Math.cos(a1), SR * Math.sin(a1)]; p2 = [SR * Math.cos(a2), SR * Math.sin(a2)];
    mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  } else {
    const ang = Math.random() * 2 * Math.PI;
    const d = m === 1 ? Math.random() * SR : SR * Math.sqrt(Math.random());
    mid = [d * Math.cos(ang), d * Math.sin(ang)];
    const half = Math.sqrt(Math.max(0, SR * SR - d * d));
    const dx = -Math.sin(ang), dy = Math.cos(ang);
    p1 = [mid[0] + dx * half, mid[1] + dy * half]; p2 = [mid[0] - dx * half, mid[1] - dy * half];
  }
  const isLong = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) > SSIDE;
  return { p1, p2, mid, isLong };
}
type Chord = ReturnType<typeof genChord>;

// ── 방법 패널 ──
const METHOD_META = [
  { name: "🟣 방법 1 — 원호 균일 (두 점)", color: "text-violet-300" },
  { name: "🔵 방법 2 — 지름 균일 선택", color: "text-cyan-300" },
  { name: "🟢 방법 3 — 면적 균일 (원 내부 점)", color: "text-emerald-300" },
];
function MethodPanel({ m }: { m: number }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<MData>(() => initData(m));
  const cvsRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = cvsRef.current?.getContext("2d");
    if (ctx) DRAWFN[m](ctx, step, data);
  }, [m, step, data]);
  const s = STEPS[m][step - 1];
  const nbtn = "rounded-md border border-violet-400/30 bg-violet-400/20 px-3 py-1 text-xs font-semibold text-violet-200 transition hover:bg-violet-400/35 disabled:opacity-35";
  return (
    <div className="space-y-2">
      <canvas ref={cvsRef} width={320} height={320} className="mx-auto block h-auto w-full max-w-[320px] rounded-lg" />
      <div className="flex items-center justify-center gap-2">
        <button type="button" className={nbtn} disabled={step <= 1} onClick={() => setStep((v) => Math.max(1, v - 1))}>← 이전</button>
        <span className="min-w-[44px] text-center text-xs text-slate-500">{step} / {MAXSTEP[m]}</span>
        <button type="button" className={nbtn} disabled={step >= MAXSTEP[m]} onClick={() => setStep((v) => Math.min(MAXSTEP[m], v + 1))}>다음 →</button>
        <button type="button" className="rounded-md border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/30" onClick={() => { setData(initData(m)); setStep(1); }}>🔀 새로 시도</button>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <p className={`text-sm font-bold ${METHOD_META[m].color}`}>{s.t}</p>
        <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-400">{s.x}</p>
        <p className="mt-2 rounded-md bg-black/35 px-3 py-1.5 text-center text-sm text-violet-200">{s.f}</p>
      </div>
    </div>
  );
}

// ── 시뮬레이션 패널 ──
const SIM_META = [
  { name: "🟣 방법 1", desc: "두 점 선택", color: "text-violet-300", theo: "이론: 1/3 ≈ 0.333" },
  { name: "🔵 방법 2", desc: "지름 위 점", color: "text-cyan-300", theo: "이론: 1/2 = 0.500" },
  { name: "🟢 방법 3", desc: "원 내부 점", color: "text-emerald-300", theo: "이론: 1/4 = 0.250" },
];
function SimPanel() {
  const [n, setN] = useState(600);
  const [showMid, setShowMid] = useState(false);
  const [anim, setAnim] = useState(false);
  const [probs, setProbs] = useState<{ l: number; t: number }[]>([{ l: 0, t: 0 }, { l: 0, t: 0 }, { l: 0, t: 0 }]);
  const cRefs = [useRef<HTMLCanvasElement | null>(null), useRef<HTMLCanvasElement | null>(null), useRef<HTMLCanvasElement | null>(null)];
  const dataRef = useRef<{ ch: Chord[]; l: number; t: number }[]>([{ ch: [], l: 0, t: 0 }, { ch: [], l: 0, t: 0 }, { ch: [], l: 0, t: 0 }]);
  const animRef = useRef(false);
  const animIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showMidRef = useRef(showMid);
  useEffect(() => { showMidRef.current = showMid; }, [showMid]);
  useEffect(() => () => { if (animIdRef.current) clearTimeout(animIdRef.current); }, []);

  function drawOne(i: number) {
    const ctx = cRefs[i].current?.getContext("2d"); if (!ctx) return;
    const d = dataRef.current[i];
    drawBase(ctx, SR); ctx.save(); ctx.translate(SCX, SCY);
    for (const ch of d.ch) {
      if (showMidRef.current) {
        ctx.fillStyle = ch.isLong ? "rgba(239,68,68,0.75)" : "rgba(148,163,184,0.38)";
        ctx.beginPath(); ctx.arc(ch.mid[0], ch.mid[1], 1.5, 0, 2 * Math.PI); ctx.fill();
      } else {
        ctx.strokeStyle = ch.isLong ? "rgba(239,68,68,0.42)" : "rgba(100,116,139,0.22)"; ctx.lineWidth = 0.7; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(ch.p1[0], ch.p1[1]); ctx.lineTo(ch.p2[0], ch.p2[1]); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function redrawAll() { [0, 1, 2].forEach(drawOne); setProbs(dataRef.current.map((d) => ({ l: d.l, t: d.t }))); }

  function runAll() {
    stopAnim();
    dataRef.current = [{ ch: [], l: 0, t: 0 }, { ch: [], l: 0, t: 0 }, { ch: [], l: 0, t: 0 }];
    for (let j = 0; j < n; j++) for (let i = 0; i < 3; i++) { const ch = genChord(i); dataRef.current[i].ch.push(ch); dataRef.current[i].t++; if (ch.isLong) dataRef.current[i].l++; }
    redrawAll();
  }
  function clearAll() { stopAnim(); dataRef.current = [{ ch: [], l: 0, t: 0 }, { ch: [], l: 0, t: 0 }, { ch: [], l: 0, t: 0 }]; redrawAll(); }
  function stopAnim() { animRef.current = false; setAnim(false); if (animIdRef.current) clearTimeout(animIdRef.current); }
  function toggleAnim() {
    if (animRef.current) { stopAnim(); return; }
    dataRef.current = [{ ch: [], l: 0, t: 0 }, { ch: [], l: 0, t: 0 }, { ch: [], l: 0, t: 0 }];
    animRef.current = true; setAnim(true);
    const maxN = n, batch = Math.max(1, Math.ceil(maxN / 100));
    let step = 0;
    const frame = () => {
      if (!animRef.current) return;
      for (let k = 0; k < batch; k++) { for (let i = 0; i < 3; i++) { const ch = genChord(i); dataRef.current[i].ch.push(ch); dataRef.current[i].t++; if (ch.isLong) dataRef.current[i].l++; } step++; }
      redrawAll();
      if (step < maxN) animIdRef.current = setTimeout(frame, 16); else stopAnim();
    };
    frame();
  }

  // 마운트 시 + 중점 토글 시 재그리기 (redrawAll은 ref만 읽으므로 deps에 넣을 필요 없음)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { redrawAll(); }, [showMid]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-slate-900 p-3">
        <label htmlFor="bp-n" className="text-xs text-slate-400">시행 수</label>
        <input id="bp-n" type="range" min={100} max={2000} step={100} value={n} onChange={(e) => setN(Number(e.target.value))} className="w-24 accent-violet-400" />
        <span className="min-w-[36px] text-xs font-bold text-violet-300">{n}</span>
        <button type="button" onClick={runAll} className="rounded-md border border-violet-400/30 bg-violet-400/20 px-3 py-1 text-xs font-semibold text-violet-200 transition hover:bg-violet-400/35">▶ 실행</button>
        <button type="button" onClick={toggleAnim} className="rounded-md border border-cyan-400/30 bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/30">{anim ? "⏹ 멈추기" : "🎞 애니메이션"}</button>
        <button type="button" onClick={clearAll} className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-400/20">🗑 지우기</button>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400"><input type="checkbox" checked={showMid} onChange={(e) => setShowMid(e.target.checked)} className="accent-violet-400" />중점 보기</label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => {
          const p = probs[i];
          return (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center">
              <h4 className={`text-xs font-bold ${SIM_META[i].color}`}>{SIM_META[i].name}</h4>
              <p className="text-[10px] text-slate-400">{SIM_META[i].desc}</p>
              <canvas ref={cRefs[i]} width={155} height={155} className="mx-auto mt-1 block h-auto w-full rounded" />
              <div className="mt-1 rounded-lg border border-white/8 bg-white/5 p-1.5">
                <div className="text-[10px] text-slate-500">실험 확률</div>
                <div className={`text-sm font-bold ${SIM_META[i].color}`}>{p.t === 0 ? "—" : `${(p.l / p.t).toFixed(3)}`}</div>
                <div className="text-[9px] text-slate-600">{SIM_META[i].theo}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3.5 bg-red-500" />긴 현 (&gt; R√3)</span>
        <span className="flex items-center gap-1"><span className="inline-block h-0.5 w-3.5 bg-slate-500" />짧은 현</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-red-500" />내접원 경계 (R/2)</span>
      </div>
    </div>
  );
}

function SummaryPanel() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-amber-400/22 bg-amber-400/[0.07] p-3.5 text-sm leading-6 text-amber-100">
        <p className="font-bold text-amber-300">⚡ 베르트랑의 역설이란?</p>
        <p className="mt-1">1889년 조제프 베르트랑이 제기한 문제입니다. <b>같은 질문에 세 방법이 모두 수학적으로 올바르지만, 서로 다른 확률을 줍니다.</b> 원인: “무작위”의 정의가 달라지면 확률 공간이 달라집니다. 교훈: <b>확률을 말할 때는 반드시 확률 공간(표본 공간 + 분포)을 명확히 해야 합니다.</b></p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { c: "text-violet-300", h: "🟣 방법 1 — 원호 균일", p: "A 선택 → 정삼각형 결정. B가 ‘유리한 호’(120°) 안이면 긴 현. 120° = 360°의 1/3.", f: "P₁ = 120°/360° = 1/3" },
          { c: "text-cyan-300", h: "🔵 방법 2 — 지름 균일", p: "지름 위 점 M. 두 내접 정삼각형의 변이 지름을 1:2:1로 분할. 중간(=R)이면 긴 현.", f: "P₂ = R / 2R = 1/2" },
          { c: "text-emerald-300", h: "🟢 방법 3 — 면적 균일", p: "원 내부 점을 면적 균일하게 선택. |OM| < R/2이면 긴 현. 중점이 원판 전체 균일.", f: "P₃ = 1/4" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <h4 className={`text-sm font-bold ${s.c}`}>{s.h}</h4>
            <p className="mt-1 text-xs leading-5 text-slate-400">{s.p}</p>
            <p className="mt-1.5 rounded-md bg-black/30 px-2 py-1 text-center text-xs text-violet-200">{s.f}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-violet-400/25 bg-violet-400/10 p-3.5 text-sm leading-6 text-slate-300">
        <p className="font-bold text-violet-300">🔑 핵심 통찰: 중점 분포가 다르다!</p>
        <p className="mt-1">어떤 방법이든 <b>현이 길다 ⟺ 중점이 내접원(반지름 R/2) 안</b>이라는 조건은 같습니다. 차이는 <b>중점이 어떻게 분포하느냐</b>입니다. 시뮬레이션에서 ‘중점 보기’로 확인해 보세요!</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-violet-400/20 px-2.5 py-0.5 text-xs font-bold text-violet-300">방법1 → 가장자리 쏠림</span>
          <span className="rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300">방법2 → 지름 균일</span>
          <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">방법3 → 면적 균일</span>
        </div>
      </div>
    </div>
  );
}

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  { id: "why_diff", prompt: "세 방법에서 확률이 1/3, 1/2, 1/4로 다르게 나온 이유를 ‘무작위’의 정의(어떤 것을 균일하게 뽑는가)와 관련지어 설명해 보세요.", kind: "text" },
  { id: "midpoints", prompt: "시뮬레이션 탭에서 ‘중점 보기’를 켜고 세 방법의 중점 분포를 비교하면 어떤 차이가 보이나요?", kind: "text" },
  { id: "statistical", prompt: "이 역설이 ‘통계적 확률’(실험 방법이 다르면 확률이 달라질 수 있음)과 어떤 관련이 있는지 설명해 보세요.", kind: "text" },
];

type TabKey = "m0" | "m1" | "m2" | "sim" | "sum";
export default function BertrandParadox() {
  const [tab, setTab] = useState<TabKey>("m0");
  const tabBtn = (a: boolean) => a ? "rounded-lg bg-violet-400 px-3 py-2 text-sm font-bold text-slate-950" : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률</p>
        <h3 className="mt-2 text-2xl font-bold">🔮 베르트랑의 역설</h3>
        <p className="mt-2 leading-7 text-slate-300">
          <b>원의 내접 정삼각형 한 변보다 긴 현을 무작위로 그을 확률은?</b> 1/3? 1/2? 1/4? — 셋 모두 맞습니다. <b className="text-violet-300">“무작위”의 정의</b>에 따라 답이 달라집니다!
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "m0")} onClick={() => setTab("m0")}>🟣 방법 1</button>
        <button type="button" className={tabBtn(tab === "m1")} onClick={() => setTab("m1")}>🔵 방법 2</button>
        <button type="button" className={tabBtn(tab === "m2")} onClick={() => setTab("m2")}>🟢 방법 3</button>
        <button type="button" className={tabBtn(tab === "sim")} onClick={() => setTab("sim")}>🎲 시뮬레이션</button>
        <button type="button" className={tabBtn(tab === "sum")} onClick={() => setTab("sum")}>📌 정리</button>
      </div>

      <div className="mt-4">
        {tab === "m0" ? <MethodPanel key="m0" m={0} /> : tab === "m1" ? <MethodPanel key="m1" m={1} /> : tab === "m2" ? <MethodPanel key="m2" m={2} /> : tab === "sim" ? <SimPanel /> : <SummaryPanel />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
