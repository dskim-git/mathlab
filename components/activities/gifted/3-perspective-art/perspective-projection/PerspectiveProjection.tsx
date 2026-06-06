"use client";

// 실제 사물과 그림 속 사물의 관계식 탐구.
//
// 원본: c:/git-math/math/activities/gifted/perspective_projection.py (2352줄).
//
// 본 이식판은 탭 1~3 까지 구현. 탭 4 (아르놀피니 적용 — 그림 측정 도구 + 3D 갤러리
// + 4단계 진행 UI + 역공식 계산) 는 별도 세션에서 작업 예정 (placeholder 표시).
//
// 조건:
//   * 눈 높이 H = 22 cm (수평면 기준)
//   * 화면(그림) 까지 거리 D = 28 cm
//   * 실제 점 A(a, b) — 수평면 위, a = 좌우 (cm, ±60), b = 깊이 (cm, 1~100)
//   * 화면 속 점 A′(a′, b′) — 닮음 직각삼각형으로 유도.
//
// 공식 (탐구활동 4):
//   a′ = D a / (b + D) = 28 a / (b + 28)
//   b′ = H b / (b + D) = 22 b / (b + 28)
//
// 역공식 (탐구활동 5, b′ < H 일 때):
//   a = H a′ / (H − b′) = 22 a′ / (22 − b′)
//   b = D b′ / (H − b′) = 28 b′ / (22 − b′)

import { useCallback, useEffect, useRef, useState } from "react";
import ArnolfiniApplication from "./ArnolfiniApplication";

const H = 22; // 눈 높이 (cm)
const D = 28; // 화면까지 거리 (cm)

type Pt = { x: number; y: number };

function project(a: number, b: number): { ap: number; bp: number } {
  const denom = b + D;
  return { ap: (D * a) / denom, bp: (H * b) / denom };
}

function inverse(ap: number, bp: number): { a: number; b: number } | null {
  const den = H - bp;
  if (Math.abs(den) < 0.001) return null;
  return { a: (H * ap) / den, b: (D * bp) / den };
}

// ─── 캔버스 헬퍼 ──────────────────────────────────────────
type SetupResult = { ctx: CanvasRenderingContext2D; w: number; h: number } | null;

// scale: 콘텐츠를 디스플레이상 확대 표시할 때 사용. 캔버스 디스플레이 크기는 dispW × dispH
// (컨테이너 폭에 꽉, 가로 스크롤 없음). 그리기 좌표계는 (dispW/scale) × (dispH/scale) 으로
// 작게 잡혀, setTransform 의 scale 배 확대를 거쳐 디스플레이에 매핑. 폰트·선굵기·우측 뱃지
// 위치(w-138 같은) 모두 작은 좌표계 기준이라 자동으로 컨테이너 안쪽에 배치됨.
function setupCanvas(
  cvs: HTMLCanvasElement | null,
  dispW: number,
  dispH: number,
  scale: number = 1,
): SetupResult {
  if (!cvs || dispW <= 0) return null;
  const ctx = cvs.getContext("2d");
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  cvs.width = Math.round(dispW * dpr);
  cvs.height = Math.round(dispH * dpr);
  cvs.style.width = `${dispW}px`;
  cvs.style.height = `${dispH}px`;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  return { ctx, w: dispW / scale, h: dispH / scale };
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function dimH(
  c: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  lbl: string,
  col: string,
) {
  c.save();
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.beginPath();
  c.moveTo(x1, y);
  c.lineTo(x2, y);
  c.stroke();
  c.setLineDash([]);
  const mx = (x1 + x2) / 2;
  c.font = "bold 11px sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  const tw = c.measureText(lbl).width + 6;
  c.fillStyle = "#060f1e";
  c.fillRect(mx - tw / 2, y - 7, tw, 14);
  c.fillStyle = col;
  c.fillText(lbl, mx, y);
  c.restore();
}

function dimV(
  c: CanvasRenderingContext2D,
  x: number,
  y1: number,
  y2: number,
  lbl: string,
  col: string,
  side: "left" | "right",
) {
  c.save();
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.beginPath();
  c.moveTo(x, y1);
  c.lineTo(x, y2);
  c.stroke();
  c.setLineDash([]);
  const my = (y1 + y2) / 2;
  c.font = "bold 11px sans-serif";
  c.textAlign = side === "left" ? "right" : "left";
  c.textBaseline = "middle";
  c.fillStyle = "#060f1e";
  const tw = c.measureText(lbl).width + 6;
  if (side === "left") c.fillRect(x - tw - 2, my - 7, tw, 14);
  else c.fillRect(x + 2, my - 7, tw, 14);
  c.fillStyle = col;
  c.fillText(lbl, side === "left" ? x - 4 : x + 4, my);
  c.restore();
}

function dot(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  col: string,
  lbl?: string,
  lx?: number,
  ly?: number,
) {
  c.save();
  c.fillStyle = col;
  c.beginPath();
  c.arc(x, y, 6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#fff";
  c.shadowColor = col;
  c.shadowBlur = 8;
  c.beginPath();
  c.arc(x, y, 3, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;
  if (lbl) {
    c.fillStyle = col;
    c.font = "bold 13px sans-serif";
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.fillText(lbl, lx ?? x + 9, ly ?? y);
  }
  c.restore();
}

// ─── 시뮬레이션 — 옆에서 본 단면 ──────────────────────────
function drawSide(
  cvs: HTMLCanvasElement | null,
  dispW: number,
  a: number,
  b: number,
  scale: number = 1,
) {
  const setup = setupCanvas(cvs, dispW, 220, scale);
  if (!setup) return;
  const { ctx, w, h } = setup;
  const { bp } = project(a, b);

  const X_SCREEN = w * 0.35;
  const X_EYE = X_SCREEN - D * 3.2;
  const X_A = X_SCREEN + b * 3.2;
  const Y_GND = h * 0.72;
  const Y_EYE = Y_GND - H * 3.2;
  const Y_Ap = Y_GND - bp * 3.2;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0a1628";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 11px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("옆에서 본 단면 (b′ 유도)", 10, 16);

  // 바닥
  ctx.strokeStyle = "#1e40af";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(0, Y_GND);
  ctx.lineTo(w, Y_GND);
  ctx.stroke();
  ctx.setLineDash([]);

  // 화면
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(X_SCREEN, Y_GND - H * 3.8);
  ctx.lineTo(X_SCREEN, Y_GND + 10);
  ctx.stroke();
  ctx.fillStyle = "#a78bfa";
  ctx.font = "bold 11px Segoe UI, sans-serif";
  ctx.fillText("화면", X_SCREEN + 5, Y_GND - H * 3.8 + 14);

  // 치수 — D
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(X_EYE, Y_GND + 12);
  ctx.lineTo(X_SCREEN, Y_GND + 12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#64748b";
  ctx.font = "10px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("28", (X_EYE + X_SCREEN) / 2, Y_GND + 24);

  // 치수 — b
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(X_SCREEN, Y_GND + 12);
  ctx.lineTo(X_A, Y_GND + 12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(`b=${b}`, (X_SCREEN + X_A) / 2, Y_GND + 24);
  ctx.textAlign = "left";

  // 치수 — H
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(X_EYE - 12, Y_GND);
  ctx.lineTo(X_EYE - 12, Y_EYE);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#64748b";
  ctx.font = "10px Segoe UI, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("22", X_EYE - 14, (Y_GND + Y_EYE) / 2 + 4);
  ctx.textAlign = "left";

  // b′ 치수
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X_SCREEN + 10, Y_GND);
  ctx.lineTo(X_SCREEN + 10, Y_Ap);
  ctx.stroke();
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 10px Segoe UI, sans-serif";
  ctx.fillText(`b'=${bp.toFixed(1)}`, X_SCREEN + 13, (Y_GND + Y_Ap) / 2 + 4);

  // 큰 삼각형 채움
  ctx.fillStyle = "rgba(34,197,94,0.07)";
  ctx.beginPath();
  ctx.moveTo(X_EYE, Y_EYE);
  ctx.lineTo(X_EYE, Y_GND);
  ctx.lineTo(X_A, Y_GND);
  ctx.closePath();
  ctx.fill();

  // 광선 E→A
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(X_EYE, Y_EYE);
  ctx.lineTo(X_A, Y_GND);
  ctx.stroke();
  ctx.setLineDash([]);

  // 작은 삼각형 채움
  ctx.fillStyle = "rgba(250,204,21,0.1)";
  ctx.beginPath();
  ctx.moveTo(X_EYE, Y_EYE);
  ctx.lineTo(X_SCREEN, Y_Ap);
  ctx.lineTo(X_SCREEN, Y_GND);
  ctx.lineTo(X_EYE, Y_GND);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(X_EYE, Y_GND - 6, 6, 6);

  // 눈 E
  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.arc(X_EYE, Y_EYE, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px Segoe UI, sans-serif";
  ctx.fillText("E", X_EYE + 10, Y_EYE + 4);

  // A
  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.arc(X_A, Y_GND, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4ade80";
  ctx.fillText("A", X_A + 8, Y_GND - 4);

  // A′
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(X_SCREEN, Y_Ap, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f59e0b";
  ctx.fillText("A'", X_SCREEN + 8, Y_Ap - 4);
}

// ─── 시뮬레이션 — 위에서 본 평면 ──────────────────────────
function drawTop(
  cvs: HTMLCanvasElement | null,
  dispW: number,
  a: number,
  b: number,
  scale: number = 1,
) {
  // dispH 200 → 260: a 슬라이더 ±60 범위에서 A 점이 위/아래 잘리지 않도록 세로 공간 충분히 확보.
  const setup = setupCanvas(cvs, dispW, 260, scale);
  if (!setup) return;
  const { ctx, w, h } = setup;
  const { ap } = project(a, b);

  const CY = h / 2;
  const X_SCREEN = w * 0.35;
  const X_EYE = X_SCREEN - D * 3.2;
  const X_A = X_SCREEN + b * 3.2;
  // scaleA 를 동적으로 — a 가 ±60 이어도 캔버스 위·아래 안 잘리도록.
  const scaleA = Math.min(3.0, (CY - 24) / 60);
  const Y_A = CY - a * scaleA;
  const Y_Ap = CY - ap * scaleA;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0a1628";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 11px Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("위에서 본 평면 (a′ 유도)", 10, 16);

  // 중심축
  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(0, CY);
  ctx.lineTo(w, CY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 화면
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(X_SCREEN, 10);
  ctx.lineTo(X_SCREEN, h - 10);
  ctx.stroke();
  ctx.fillStyle = "#a78bfa";
  ctx.font = "bold 11px Segoe UI, sans-serif";
  ctx.fillText("화면", X_SCREEN + 5, 20);

  // 치수
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(X_EYE, h - 14);
  ctx.lineTo(X_SCREEN, h - 14);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#64748b";
  ctx.font = "10px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("28", (X_EYE + X_SCREEN) / 2, h - 4);

  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(X_SCREEN, h - 14);
  ctx.lineTo(X_A, h - 14);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(`b=${b}`, (X_SCREEN + X_A) / 2, h - 4);
  ctx.textAlign = "left";

  if (Math.abs(a) > 2) {
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X_A + 10, CY);
    ctx.lineTo(X_A + 10, Y_A);
    ctx.stroke();
    ctx.fillStyle = "#4ade80";
    ctx.font = "10px Segoe UI, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`a=${a}`, X_A + 8, (CY + Y_A) / 2 + 4);
    ctx.textAlign = "left";
  }

  if (Math.abs(ap) > 1) {
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X_SCREEN - 10, CY);
    ctx.lineTo(X_SCREEN - 10, Y_Ap);
    ctx.stroke();
    ctx.fillStyle = "#fbbf24";
    ctx.font = "10px Segoe UI, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`a'=${ap.toFixed(1)}`, X_SCREEN - 12, (CY + Y_Ap) / 2 + 4);
    ctx.textAlign = "left";
  }

  // 큰 삼각형
  ctx.fillStyle = "rgba(34,197,94,0.07)";
  ctx.beginPath();
  ctx.moveTo(X_EYE, CY);
  ctx.lineTo(X_A, CY);
  ctx.lineTo(X_A, Y_A);
  ctx.closePath();
  ctx.fill();

  // 광선 E→A
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(X_EYE, CY);
  ctx.lineTo(X_A, Y_A);
  ctx.stroke();
  ctx.setLineDash([]);

  // 작은 삼각형
  ctx.fillStyle = "rgba(250,204,21,0.1)";
  ctx.beginPath();
  ctx.moveTo(X_EYE, CY);
  ctx.lineTo(X_SCREEN, Y_Ap);
  ctx.lineTo(X_SCREEN, CY);
  ctx.closePath();
  ctx.fill();

  // 눈
  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.arc(X_EYE, CY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px Segoe UI, sans-serif";
  ctx.fillText("E", X_EYE + 10, CY + 4);

  // A
  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.arc(X_A, Y_A, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4ade80";
  ctx.fillText("A", X_A + 8, Y_A - 4);

  // A′
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(X_SCREEN, Y_Ap, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f59e0b";
  ctx.fillText("A'", X_SCREEN + 8, Y_Ap - 4);
}

// ─── 탐구활동 4 — Setup 다이어그램 (등각) ─────────────────
function drawDiagSetup(cvs: HTMLCanvasElement | null, dispW: number, scale: number = 1) {
  // dispH 170 → 240: 등각 그림의 최상단(눈 E, 화면 윗변)이 잘리지 않도록 세로 확보.
  const setup = setupCanvas(cvs, dispW, 240, scale);
  if (!setup) return;
  const { ctx: c, w, h } = setup;
  c.fillStyle = "#060f1e";
  c.fillRect(0, 0, w, h);

  const ox = w * 0.25;
  // oy 0.78 → 0.85: 그림 원점을 아래로 내려 위쪽 콘텐츠(E 점, 화면 윗변, 화면 라벨) 공간 확보.
  const oy = h * 0.85;
  const pxU: Pt = { x: 3.2, y: -1.6 };
  const vxU: Pt = { x: 0, y: -4.0 };
  const axU: Pt = { x: 3.2, y: 0 };
  const Dsc = 14;
  const Hsc = H * 0.9;
  const bsc = 24;
  const asc = 15;

  function pt(d_: number, a_: number, v_: number): Pt {
    return { x: ox + d_ * pxU.x + a_ * axU.x + v_ * vxU.x, y: oy + d_ * pxU.y + a_ * axU.y + v_ * vxU.y };
  }

  // 바닥
  c.save();
  c.fillStyle = "rgba(14,116,144,0.13)";
  c.strokeStyle = "#164e63";
  c.lineWidth = 1;
  const g0 = pt(0, 0, 0);
  const g1 = pt(bsc + Dsc, 0, 0);
  const g2 = pt(bsc + Dsc, asc * 2, 0);
  const g3 = pt(0, asc * 2, 0);
  c.beginPath();
  c.moveTo(g0.x, g0.y);
  c.lineTo(g1.x, g1.y);
  c.lineTo(g2.x, g2.y);
  c.lineTo(g3.x, g3.y);
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();

  // 화면
  c.save();
  c.fillStyle = "rgba(109,40,217,0.18)";
  c.strokeStyle = "#7c3aed";
  c.lineWidth = 2;
  const s0 = pt(Dsc, 0, 0);
  const s1 = pt(Dsc, asc * 2, 0);
  const s2 = pt(Dsc, asc * 2, Hsc * 1.1);
  const s3 = pt(Dsc, 0, Hsc * 1.1);
  c.beginPath();
  c.moveTo(s0.x, s0.y);
  c.lineTo(s1.x, s1.y);
  c.lineTo(s2.x, s2.y);
  c.lineTo(s3.x, s3.y);
  c.closePath();
  c.fill();
  c.stroke();
  const sm = pt(Dsc, asc, Hsc * 1.15);
  c.fillStyle = "#a78bfa";
  c.font = "bold 11px sans-serif";
  c.textAlign = "center";
  c.fillText("화면(그림)", sm.x, sm.y - 5);
  c.restore();

  // 축
  c.save();
  c.strokeStyle = "#22d3ee";
  c.lineWidth = 1.2;
  const ax0 = pt(Dsc, 0, 0);
  const ax1 = pt(Dsc, asc * 2, 0);
  c.beginPath();
  c.moveTo(ax0.x, ax0.y);
  c.lineTo(ax1.x, ax1.y);
  c.stroke();
  const axM = pt(Dsc, asc * 2 + 1, 0);
  c.fillStyle = "#22d3ee";
  c.font = "bold 10px sans-serif";
  c.textAlign = "left";
  c.fillText("x축(a)", axM.x + 2, axM.y);
  c.restore();

  c.save();
  c.strokeStyle = "#22d3ee";
  c.lineWidth = 1.2;
  const ay0 = pt(Dsc, asc, 0);
  const ay1 = pt(Dsc + bsc, asc, 0);
  c.beginPath();
  c.moveTo(ay0.x, ay0.y);
  c.lineTo(ay1.x, ay1.y);
  c.stroke();
  const ayM = pt(Dsc + bsc + 1, asc, 0);
  c.fillStyle = "#22d3ee";
  c.fillText("y축(b)", ayM.x, ayM.y);
  c.restore();

  // 22
  c.save();
  c.strokeStyle = "#f87171";
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  const hB = pt(Dsc, 0, 0);
  const hT = pt(Dsc, 0, Hsc);
  c.beginPath();
  c.moveTo(hB.x - 8, hB.y);
  c.lineTo(hT.x - 8, hT.y);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = "#f87171";
  c.font = "bold 11px sans-serif";
  c.textAlign = "center";
  c.fillText("22", (hB.x + hT.x) / 2 - 18, (hB.y + hT.y) / 2);
  c.restore();

  // 28
  c.save();
  c.strokeStyle = "#f87171";
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  const dAp = pt(0, asc, 0);
  const dBp = pt(Dsc, asc, 0);
  c.beginPath();
  c.moveTo(dAp.x, dAp.y + 12);
  c.lineTo(dBp.x, dBp.y + 12);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = "#f87171";
  c.font = "bold 11px sans-serif";
  c.fillText("28", (dAp.x + dBp.x) / 2, (dAp.y + dBp.y) / 2 + 22);
  c.restore();

  // A
  const pA = pt(Dsc + bsc, asc, 0);
  dot(c, pA.x, pA.y, "#4ade80", "A(a,b)", pA.x + 8, pA.y - 4);

  // b 치수
  c.save();
  c.strokeStyle = "#4ade80";
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  const bA = pt(Dsc, asc, 0);
  const bB = pt(Dsc + bsc, asc, 0);
  c.beginPath();
  c.moveTo(bA.x, bA.y + 12);
  c.lineTo(bB.x, bB.y + 12);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = "#4ade80";
  c.font = "bold 11px sans-serif";
  c.fillText("b", (bA.x + bB.x) / 2, (bA.y + bB.y) / 2 + 22);
  c.restore();

  // A′
  const bp_ov = (H * bsc) / (bsc + Dsc);
  const pAp = pt(Dsc, asc, bp_ov);
  dot(c, pAp.x, pAp.y, "#f59e0b", "A'(a',b')", pAp.x + 8, pAp.y - 4);

  // 광선
  c.save();
  const pE = pt(0, asc, Hsc);
  c.strokeStyle = "rgba(125,211,252,0.5)";
  c.lineWidth = 1.5;
  c.setLineDash([5, 4]);
  c.beginPath();
  c.moveTo(pE.x, pE.y);
  c.lineTo(pA.x, pA.y);
  c.stroke();
  c.setLineDash([]);
  c.restore();

  dot(c, pE.x, pE.y, "#f43f5e", "E", pE.x - 20, pE.y - 6);
}

// ─── 탐구활동 4 — 측면 닮음 삼각형 (b′ 유도) ─────────────
function drawDiag4b(cvs: HTMLCanvasElement | null, dispW: number, scale: number = 1) {
  // dispH 210 → 260: 우측 상단 공식 뱃지 + 메인 다이어그램이 충돌 없이 모두 들어가도록.
  const setup = setupCanvas(cvs, dispW, 260, scale);
  if (!setup) return;
  const { ctx: c, w, h } = setup;
  c.fillStyle = "#060f1e";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#334155";
  c.font = "bold 11px sans-serif";
  c.textAlign = "left";
  c.fillText("옆에서 본 단면 (b′ 유도) — 대표값 b=28", 10, 16);

  // 공식 뱃지를 우측 상단(제목 영역 우측)에 먼저 그림 — 이전엔 다이어그램 우측 가운데에 있어
  // 메인 그림 위치와 충돌. 위로 빼면서 메인 다이어그램은 그 아래·캔버스 가운데 정렬 가능.
  const badgeW = 142;
  const badgeH = 44;
  const badgeX = w - badgeW - 8;
  const badgeY = 24;
  c.save();
  c.fillStyle = "rgba(251,191,36,0.13)";
  c.strokeStyle = "#fbbf24";
  c.lineWidth = 1;
  rr(c, badgeX, badgeY, badgeW, badgeH, 7);
  c.fill();
  c.stroke();
  c.fillStyle = "#fcd34d";
  c.font = "bold 11px sans-serif";
  c.textAlign = "center";
  c.fillText("b′/22 = b/(b+28)", badgeX + badgeW / 2, badgeY + 17);
  c.fillStyle = "#f59e0b";
  c.font = "bold 12px sans-serif";
  c.fillText("b′ = 22b/(b+28)", badgeX + badgeW / 2, badgeY + 35);
  c.textAlign = "left";
  c.restore();

  // 메인 다이어그램 — 공식 뱃지 아래로 시작, 캔버스 폭에 가운데 정렬.
  const Y_TOP = badgeY + badgeH + 14;
  const Y_GND = h - 38;
  const LM = 30;
  const RM = 30;
  const diagW = w - LM - RM;
  const diagH = Y_GND - Y_TOP;
  const S = Math.min(diagW / 62, diagH / 24);
  const contentW = 56 * S;
  const XEf = LM + (diagW - contentW) / 2;
  const XScr = XEf + D * S;
  const XA = XScr + 28 * S;
  const YE = Y_GND - H * S;
  const YAp = Y_GND - ((H * 28) / (28 + D)) * S;

  // 바닥
  c.strokeStyle = "#1e3a5f";
  c.lineWidth = 1.5;
  c.setLineDash([7, 4]);
  c.beginPath();
  c.moveTo(LM - 15, Y_GND);
  c.lineTo(w - 10, Y_GND);
  c.stroke();
  c.setLineDash([]);

  // 화면
  c.strokeStyle = "#7c3aed";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(XScr, Y_GND + 8);
  c.lineTo(XScr, YE - 18);
  c.stroke();
  c.fillStyle = "#a78bfa";
  c.font = "bold 11px sans-serif";
  c.textAlign = "center";
  c.fillText("화면", XScr, YE - 22);
  c.textAlign = "left";

  // 큰 삼각형 (초록)
  c.save();
  c.fillStyle = "rgba(34,197,94,0.12)";
  c.strokeStyle = "rgba(34,197,94,0.55)";
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(XEf, Y_GND);
  c.lineTo(XEf, YE);
  c.lineTo(XA, Y_GND);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = "rgba(34,197,94,0.7)";
  c.lineWidth = 1.2;
  c.strokeRect(XEf, Y_GND - 9, 9, 9);
  c.fillStyle = "rgba(34,197,94,0.8)";
  c.font = "10px sans-serif";
  c.fillText("큰 △", XEf + 8, Y_GND - 15);
  c.restore();

  // 작은 삼각형 (앰버)
  c.save();
  c.fillStyle = "rgba(251,191,36,0.18)";
  c.strokeStyle = "rgba(251,191,36,0.7)";
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(XScr, Y_GND);
  c.lineTo(XScr, YAp);
  c.lineTo(XA, Y_GND);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = "rgba(251,191,36,0.8)";
  c.lineWidth = 1.2;
  c.strokeRect(XScr - 9, Y_GND - 9, 9, 9);
  c.fillStyle = "rgba(251,191,36,0.9)";
  c.font = "10px sans-serif";
  c.textAlign = "right";
  c.fillText("작은 △", XScr - 2, (Y_GND + YAp) / 2 - 4);
  c.textAlign = "left";
  c.restore();

  // 광선
  c.strokeStyle = "rgba(125,211,252,0.4)";
  c.lineWidth = 1.5;
  c.setLineDash([6, 4]);
  c.beginPath();
  c.moveTo(XEf, YE);
  c.lineTo(XA, Y_GND);
  c.stroke();
  c.setLineDash([]);

  dimV(c, XEf - 16, Y_GND, YE, "22", "#f87171", "left");
  dimH(c, XEf, XScr, Y_GND + 18, "28", "#94a3b8");
  dimH(c, XScr, XA, Y_GND + 18, "b", "#4ade80");
  dimV(c, XScr + 16, Y_GND, YAp, "b'  ", "#f59e0b", "right");

  dot(c, XEf, YE, "#f43f5e", "E", XEf - 18, YE - 8);
  dot(c, XA, Y_GND, "#4ade80", "A(a,b)", XA + 8, Y_GND - 6);
  dot(c, XScr, YAp, "#f59e0b", "A'(a',b')", XScr + 8, YAp - 8);
}

// ─── 탐구활동 4 — 평면 닮음 삼각형 (a′ 유도) ─────────────
function drawDiag4a(cvs: HTMLCanvasElement | null, dispW: number, scale: number = 1) {
  // dispH 195 → 270: 우측 상단 공식 뱃지 + 위/아래 대칭 메인 다이어그램 수용.
  const setup = setupCanvas(cvs, dispW, 270, scale);
  if (!setup) return;
  const { ctx: c, w, h } = setup;
  c.fillStyle = "#060f1e";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#334155";
  c.font = "bold 11px sans-serif";
  c.textAlign = "left";
  c.fillText("위에서 본 평면 (a′ 유도) — 대표값 b=28, a=20", 10, 16);

  // 공식 뱃지를 우측 상단(제목 영역 우측)에 먼저 그림.
  const badgeW = 142;
  const badgeH = 44;
  const badgeX = w - badgeW - 8;
  const badgeY = 22;
  c.save();
  c.fillStyle = "rgba(251,191,36,0.13)";
  c.strokeStyle = "#fbbf24";
  c.lineWidth = 1;
  rr(c, badgeX, badgeY, badgeW, badgeH, 7);
  c.fill();
  c.stroke();
  c.fillStyle = "#fcd34d";
  c.font = "bold 11px sans-serif";
  c.textAlign = "center";
  c.fillText("a′/a = 28/(b+28)", badgeX + badgeW / 2, badgeY + 17);
  c.fillStyle = "#f59e0b";
  c.font = "bold 12px sans-serif";
  c.fillText("a′ = 28a/(b+28)", badgeX + badgeW / 2, badgeY + 35);
  c.textAlign = "left";
  c.restore();

  // 메인 다이어그램 — 공식 뱃지 아래·캔버스 가로 가운데 정렬.
  // 평면도라 CY 기준 위/아래 대칭 필요 (a 차원 표시는 CY 위쪽으로 a*S 만큼).
  const Y_TOP = badgeY + badgeH + 14;
  const Y_BOT = h - 25;
  const CY = (Y_TOP + Y_BOT) / 2;
  const LM = 30;
  const RM = 30;
  const diagW = w - LM - RM;
  const halfH = CY - Y_TOP;
  const S = Math.min(diagW / 62, halfH / 22);
  const contentW = 56 * S;
  const XE = LM + (diagW - contentW) / 2;
  const XScr = XE + D * S;
  const XA = XScr + 28 * S;
  const a_rep = 20;
  const ap_rep = (D * a_rep) / (28 + D);
  const YA = CY - a_rep * S;
  const YAp = CY - ap_rep * S;

  // 중심축
  c.strokeStyle = "#1e3a5f";
  c.lineWidth = 1;
  c.setLineDash([5, 4]);
  c.beginPath();
  c.moveTo(LM - 10, CY);
  c.lineTo(w - 10, CY);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = "#334155";
  c.font = "10px sans-serif";
  c.fillText("중심축", w - 42, CY - 4);

  // 화면 — Y_TOP ~ Y_BOT 범위로 (공식 뱃지 아래부터 dimension 위까지).
  c.strokeStyle = "#7c3aed";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(XScr, Y_TOP);
  c.lineTo(XScr, Y_BOT);
  c.stroke();
  c.fillStyle = "#a78bfa";
  c.font = "bold 11px sans-serif";
  c.textAlign = "center";
  c.fillText("화면", XScr, Y_TOP - 6);
  c.textAlign = "left";

  // 큰 삼각형
  c.save();
  c.fillStyle = "rgba(34,197,94,0.12)";
  c.strokeStyle = "rgba(34,197,94,0.55)";
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(XE, CY);
  c.lineTo(XA, CY);
  c.lineTo(XA, YA);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = "rgba(34,197,94,0.7)";
  c.lineWidth = 1.2;
  c.strokeRect(XA - 9, CY - 9, 9, 9);
  c.fillStyle = "rgba(34,197,94,0.8)";
  c.font = "10px sans-serif";
  c.fillText("큰 △", (XE + XScr) / 2 - 10, CY - 8);
  c.restore();

  // 작은 삼각형
  c.save();
  c.fillStyle = "rgba(251,191,36,0.18)";
  c.strokeStyle = "rgba(251,191,36,0.7)";
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(XE, CY);
  c.lineTo(XScr, CY);
  c.lineTo(XScr, YAp);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = "rgba(251,191,36,0.8)";
  c.lineWidth = 1.2;
  c.strokeRect(XScr, CY, 9, -9);
  c.fillStyle = "rgba(251,191,36,0.9)";
  c.font = "10px sans-serif";
  c.fillText("작은 △", XScr + 4, (CY + YAp) / 2 - 4);
  c.restore();

  // 광선
  c.strokeStyle = "rgba(125,211,252,0.4)";
  c.lineWidth = 1.5;
  c.setLineDash([6, 4]);
  c.beginPath();
  c.moveTo(XE, CY);
  c.lineTo(XA, YA);
  c.stroke();
  c.setLineDash([]);

  dimH(c, XE, XScr, h - 22, "28", "#94a3b8");
  dimH(c, XScr, XA, h - 22, "b", "#4ade80");
  dimV(c, XA + 16, CY, YA, "a", "#4ade80", "right");
  dimV(c, XScr - 16, CY, YAp, "a'", "#f59e0b", "left");

  dot(c, XE, CY, "#f43f5e", "E", XE - 18, CY - 8);
  dot(c, XA, YA, "#4ade80", "A(a,b)", XA + 8, YA - 6);
  dot(c, XScr, YAp, "#f59e0b", "A'(a',b')", XScr + 8, YAp - 8);
}

// ─── 탐구활동 5 — 역방향 도식 ─────────────────────────────
function drawDiag5(cvs: HTMLCanvasElement | null, dispW: number, scale: number = 1) {
  // dispH 195 → 270: 우측 상단 역공식 뱃지 + 메인 다이어그램 충돌 없이 수용.
  const setup = setupCanvas(cvs, dispW, 270, scale);
  if (!setup) return;
  const { ctx: c, w, h } = setup;
  c.fillStyle = "#060f1e";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#334155";
  c.font = "bold 11px sans-serif";
  c.textAlign = "left";
  c.fillText("역방향 탐구: A'(a',b') 를 알 때 A(a,b) 구하기", 10, 16);

  // 역공식 뱃지 — 우측 상단으로 (제목 영역 우측).
  const badgeW = 155;
  const badgeH = 54;
  const badgeX = w - badgeW - 8;
  const badgeY = 24;
  c.save();
  c.fillStyle = "rgba(74,222,128,0.1)";
  c.strokeStyle = "#16a34a";
  c.lineWidth = 1;
  rr(c, badgeX, badgeY, badgeW, badgeH, 8);
  c.fill();
  c.stroke();
  c.fillStyle = "#86efac";
  c.font = "bold 11px sans-serif";
  c.textAlign = "center";
  c.fillText("역공식", badgeX + badgeW / 2, badgeY + 14);
  c.fillStyle = "#4ade80";
  c.fillText("b = 28b'/(22−b')", badgeX + badgeW / 2, badgeY + 31);
  c.fillText("a = 22a'/(22−b')", badgeX + badgeW / 2, badgeY + 47);
  c.textAlign = "left";
  c.restore();

  // 메인 다이어그램 — 역공식 뱃지 아래·캔버스 가운데 정렬.
  const Y_TOP = badgeY + badgeH + 14;
  const Y_GND = h - 38;
  const LM = 30;
  const RM = 30;
  const diagW = w - LM - RM;
  const diagH = Y_GND - Y_TOP;
  const S = Math.min(diagW / 62, diagH / 24);
  const contentW = 56 * S;
  const XEf = LM + (diagW - contentW) / 2;
  const XScr = XEf + D * S;
  const XA = XScr + 28 * S;
  const YE = Y_GND - H * S;
  const YAp = Y_GND - ((H * 28) / (28 + D)) * S;

  // 바닥
  c.strokeStyle = "#1e3a5f";
  c.lineWidth = 1.5;
  c.setLineDash([7, 4]);
  c.beginPath();
  c.moveTo(LM - 15, Y_GND);
  c.lineTo(w - 10, Y_GND);
  c.stroke();
  c.setLineDash([]);

  // 화면
  c.strokeStyle = "#7c3aed";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(XScr, Y_GND + 8);
  c.lineTo(XScr, YE - 18);
  c.stroke();
  c.fillStyle = "#a78bfa";
  c.font = "bold 11px sans-serif";
  c.textAlign = "center";
  c.fillText("화면", XScr, YE - 22);
  c.textAlign = "left";

  // 흐릿한 삼각형들
  c.save();
  c.fillStyle = "rgba(100,116,139,0.06)";
  c.strokeStyle = "rgba(100,116,139,0.3)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(XScr, Y_GND);
  c.lineTo(XScr, YAp);
  c.lineTo(XA, Y_GND);
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();
  c.save();
  c.fillStyle = "rgba(100,116,139,0.05)";
  c.strokeStyle = "rgba(100,116,139,0.2)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(XEf, Y_GND);
  c.lineTo(XEf, YE);
  c.lineTo(XA, Y_GND);
  c.closePath();
  c.fill();
  c.stroke();
  c.restore();

  // 광선 (희미)
  c.strokeStyle = "rgba(125,211,252,0.25)";
  c.lineWidth = 1.5;
  c.setLineDash([6, 4]);
  c.beginPath();
  c.moveTo(XEf, YE);
  c.lineTo(XA, Y_GND);
  c.stroke();
  c.setLineDash([]);

  // 치수 — 알고있는 것 (b′) 강조
  dimV(c, XScr + 16, Y_GND, YAp, "b' (알고 있음)", "#f59e0b", "right");
  // 미지 b
  dimH(c, XScr, XA, Y_GND + 18, "b = ?", "#4ade80");
  dimV(c, XEf - 16, Y_GND, YE, "22", "#f87171", "left");
  dimH(c, XEf, XScr, Y_GND + 34, "28", "#94a3b8");

  dot(c, XEf, YE, "#f43f5e", "E", XEf - 18, YE - 8);

  // A′ 강조
  c.save();
  c.shadowColor = "#f59e0b";
  c.shadowBlur = 14;
  dot(c, XScr, YAp, "#f59e0b", "A'(a',b')  ← 알고 있음", XScr + 8, YAp - 8);
  c.restore();

  // A 미지
  c.save();
  c.strokeStyle = "#4ade80";
  c.lineWidth = 1.5;
  c.setLineDash([4, 3]);
  c.beginPath();
  c.arc(XA, Y_GND, 10, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = "rgba(74,222,128,0.2)";
  c.beginPath();
  c.arc(XA, Y_GND, 10, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#86efac";
  c.font = "bold 13px sans-serif";
  c.fillText("A(a,b)  ← 구해야 함", XA + 14, Y_GND - 6);
  c.restore();

}

// ─── 퀴즈 헬퍼 ─────────────────────────────────────────────
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type QuizFb = { kind: "ok" | "wrong"; msg: string } | null;

// ════════════════════════════════════════════════════════════
//  Main component
// ════════════════════════════════════════════════════════════
type TabKey = "sim" | "ex4" | "ex5" | "arno";

export default function PerspectiveProjection() {
  const [tab, setTab] = useState<TabKey>("sim");
  const [a, setA] = useState(30);
  const [b, setB] = useState(28);

  const sideRef = useRef<HTMLCanvasElement>(null);
  const sideWrapRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLCanvasElement>(null);
  const topWrapRef = useRef<HTMLDivElement>(null);
  const diagSetupRef = useRef<HTMLCanvasElement>(null);
  const diagSetupWrapRef = useRef<HTMLDivElement>(null);
  const diag4bRef = useRef<HTMLCanvasElement>(null);
  const diag4bWrapRef = useRef<HTMLDivElement>(null);
  const diag4aRef = useRef<HTMLCanvasElement>(null);
  const diag4aWrapRef = useRef<HTMLDivElement>(null);
  const diag5Ref = useRef<HTMLCanvasElement>(null);
  const diag5WrapRef = useRef<HTMLDivElement>(null);

  const [sideW, setSideW] = useState(0);
  const [topW, setTopW] = useState(0);
  const [diagSetupW, setDiagSetupW] = useState(0);
  const [diag4bW, setDiag4bW] = useState(0);
  const [diag4aW, setDiag4aW] = useState(0);
  const [diag5W, setDiag5W] = useState(0);

  function makeResizeEffect(
    wrapRef: React.RefObject<HTMLDivElement | null>,
    setter: (n: number) => void,
  ) {
    return () => {
      const el = wrapRef.current;
      if (!el) return;
      const update = () => {
        const w = el.clientWidth;
        if (w > 0) setter(w);
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    };
  }

  useEffect(makeResizeEffect(sideWrapRef, setSideW), []);
  useEffect(makeResizeEffect(topWrapRef, setTopW), []);
  useEffect(makeResizeEffect(diagSetupWrapRef, setDiagSetupW), []);
  useEffect(makeResizeEffect(diag4bWrapRef, setDiag4bW), []);
  useEffect(makeResizeEffect(diag4aWrapRef, setDiag4aW), []);
  useEffect(makeResizeEffect(diag5WrapRef, setDiag5W), []);

  // 모든 다이어그램·시뮬레이션 캔버스는 동일 scale 로 확대 표시. setupCanvas 가 그리기 좌표계를
  // 작게 잡고 디스플레이를 컨테이너 폭에 꽉 채우므로 가로 스크롤 발생 X. 폰트·선굵기·우측 뱃지
  // 위치까지 자동으로 비례 축소되어 가시 영역 안에 자연스럽게 배치됨.
  const RENDER_SCALE = 1.5;

  // 시뮬레이션 redraw
  useEffect(() => {
    drawSide(sideRef.current, sideW, a, b, RENDER_SCALE);
  }, [sideW, a, b]);
  useEffect(() => {
    drawTop(topRef.current, topW, a, b, RENDER_SCALE);
  }, [topW, a, b]);

  // 탐구4 정적 다이어그램
  useEffect(() => {
    drawDiagSetup(diagSetupRef.current, diagSetupW, RENDER_SCALE);
  }, [diagSetupW]);
  useEffect(() => {
    drawDiag4b(diag4bRef.current, diag4bW, RENDER_SCALE);
  }, [diag4bW]);
  useEffect(() => {
    drawDiag4a(diag4aRef.current, diag4aW, RENDER_SCALE);
  }, [diag4aW]);

  // 탐구5 정적 다이어그램
  useEffect(() => {
    drawDiag5(diag5Ref.current, diag5W, RENDER_SCALE);
  }, [diag5W]);

  const proj = project(a, b);

  // ─── 탐구4 퀴즈 ────────────────────────────────────────
  const [q4, setQ4] = useState({ a: 0, b: 0 });
  const [q4Ap, setQ4Ap] = useState("");
  const [q4Bp, setQ4Bp] = useState("");
  const [q4Fb, setQ4Fb] = useState<QuizFb>(null);
  function newQ4() {
    setQ4({ a: randInt(-40, 40), b: randInt(10, 70) });
    setQ4Ap("");
    setQ4Bp("");
    setQ4Fb(null);
  }
  useEffect(() => {
    newQ4();
  }, []);
  function checkQ4() {
    const userAp = parseFloat(q4Ap);
    const userBp = parseFloat(q4Bp);
    if (Number.isNaN(userAp) || Number.isNaN(userBp)) {
      setQ4Fb({ kind: "wrong", msg: "숫자를 입력하세요!" });
      return;
    }
    const { ap, bp } = project(q4.a, q4.b);
    const ok = Math.abs(userAp - ap) < 0.1 && Math.abs(userBp - bp) < 0.1;
    if (ok) {
      setQ4Fb({ kind: "ok", msg: `✅ 정답! a′ = ${ap.toFixed(2)}, b′ = ${bp.toFixed(2)}` });
    } else {
      setQ4Fb({
        kind: "wrong",
        msg: `❌ 다시 도전! 공식: a′ = 28a/(b+28), b′ = 22b/(b+28)\n정답: a′ ≈ ${ap.toFixed(
          2,
        )}, b′ ≈ ${bp.toFixed(2)}`,
      });
    }
  }

  // ─── 탐구5 퀴즈 ────────────────────────────────────────
  const [q5, setQ5] = useState({ ap: 0, bp: 0 });
  const [q5A, setQ5A] = useState("");
  const [q5B, setQ5B] = useState("");
  const [q5Fb, setQ5Fb] = useState<QuizFb>(null);
  function newQ5() {
    const ra = randInt(-40, 40);
    const rb = randInt(10, 70);
    const { ap, bp } = project(ra, rb);
    setQ5({ ap: Math.round(ap * 10) / 10, bp: Math.round(bp * 10) / 10 });
    setQ5A("");
    setQ5B("");
    setQ5Fb(null);
  }
  useEffect(() => {
    newQ5();
  }, []);
  function checkQ5() {
    const userA = parseFloat(q5A);
    const userB = parseFloat(q5B);
    if (Number.isNaN(userA) || Number.isNaN(userB)) {
      setQ5Fb({ kind: "wrong", msg: "숫자를 입력하세요!" });
      return;
    }
    const res = inverse(q5.ap, q5.bp);
    if (!res) return;
    const ok = Math.abs(userA - res.a) < 0.2 && Math.abs(userB - res.b) < 0.2;
    if (ok) {
      setQ5Fb({ kind: "ok", msg: `✅ 정답! a = ${res.a.toFixed(2)}, b = ${res.b.toFixed(2)}` });
    } else {
      setQ5Fb({
        kind: "wrong",
        msg: `❌ 다시 도전! 공식: a = 22a′/(22−b′), b = 28b′/(22−b′)\n정답: a ≈ ${res.a.toFixed(
          2,
        )}, b ≈ ${res.b.toFixed(2)}`,
      });
    }
  }

  // ─── 탐구5 실시간 계산기 ────────────────────────────────
  const [calcAp, setCalcAp] = useState("14");
  const [calcBp, setCalcBp] = useState("11");
  const calcOut = (() => {
    const apN = parseFloat(calcAp);
    const bpN = parseFloat(calcBp);
    if (Number.isNaN(apN) || Number.isNaN(bpN)) return { kind: "info" as const, msg: "값을 입력하세요." };
    if (bpN >= H)
      return { kind: "warn" as const, msg: `b′는 ${H}보다 작아야 합니다! (b′ ≥ ${H}이면 b → ∞)` };
    const res = inverse(apN, bpN);
    if (!res) return { kind: "info" as const, msg: "계산 불가" };
    const back = project(res.a, res.b);
    return {
      kind: "result" as const,
      apN,
      bpN,
      resA: res.a,
      resB: res.b,
      checkAp: back.ap,
      checkBp: back.bp,
    };
  })();

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-4 text-slate-100 sm:p-6">
      <header className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">📐 실제 사물과 그림 속 사물의 관계식</h2>
        <p className="mt-1 text-sm text-slate-400">
          눈(E) 높이 H=22cm, 화면까지 거리 D=28cm 조건에서 실제 좌표 A(a,b) 와 화면 좌표 A′(a′,b′)
          사이의 관계식을 단계별로 탐구합니다.
        </p>
      </header>

      <details className="mb-4 rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-200">💡 활동 안내</summary>
        <ul className="mt-2 space-y-1 text-slate-400">
          <li>
            <b>🎯 시뮬레이션</b> — 슬라이더로 실제 점 A 의 위치를 바꿔보며 화면 속 투영 A′ 가
            어떻게 변하는지 옆모습·평면도로 관찰합니다.
          </li>
          <li>
            <b>📐 탐구활동 4</b> — 옆·위 단면에서 <b>닮음 직각삼각형</b> 두 쌍을 찾아 비례식으로
            관계식 a′ = 28a/(b+28), b′ = 22b/(b+28) 을 유도합니다.
          </li>
          <li>
            <b>🔄 탐구활동 5</b> — 같은 비례식을 반대 방향으로 풀어 화면 좌표에서 실제 좌표를
            역산하는 공식 a = 22a′/(22−b′), b = 28b′/(22−b′) 를 도출하고, 직접 입력해 계산해
            봅니다.
          </li>
          <li>
            <b>🖼 아르놀피니 적용</b> — 그림 측정 도구 + 3D 갤러리는 별도 세션에서 작업 예정.
          </li>
        </ul>
      </details>

      {/* 탭 */}
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            { key: "sim", label: "🎯 시뮬레이션" },
            { key: "ex4", label: "📐 탐구활동 4" },
            { key: "ex5", label: "🔄 탐구활동 5" },
            { key: "arno", label: "🖼 아르놀피니 적용" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
              tab === t.key
                ? "border-sky-400 bg-sky-700 text-cyan-50"
                : "border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── 탭 1: 시뮬레이션 ───────────────────────────── */}
      <div style={{ display: tab === "sim" ? "block" : "none" }}>
        <div
          ref={sideWrapRef}
          className="mb-2.5 overflow-hidden rounded-xl border border-blue-900/40 bg-slate-900"
        >
          <canvas ref={sideRef} className="block" />
        </div>
        <div
          ref={topWrapRef}
          className="mb-2.5 overflow-hidden rounded-xl border border-blue-900/40 bg-slate-900"
        >
          <canvas ref={topRef} className="block" />
        </div>

        <div className="mb-2.5 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3">
          <div className="mb-2 text-xs font-extrabold text-sky-300">🕹 실제 점 A 의 위치 조절</div>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="min-w-[64px] text-xs text-slate-500">a (좌우)</span>
            <input
              type="range"
              min={-60}
              max={60}
              value={a}
              step={1}
              onChange={(e) => setA(Number(e.target.value))}
              className="h-1.5 flex-1 accent-sky-400"
              aria-label="a 좌우"
            />
            <span className="min-w-[34px] text-right text-sm font-extrabold text-fuchsia-300">{a}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="min-w-[64px] text-xs text-slate-500">b (깊이)</span>
            <input
              type="range"
              min={1}
              max={100}
              value={b}
              step={1}
              onChange={(e) => setB(Number(e.target.value))}
              className="h-1.5 flex-1 accent-sky-400"
              aria-label="b 깊이"
            />
            <span className="min-w-[34px] text-right text-sm font-extrabold text-fuchsia-300">{b}</span>
          </div>
        </div>

        <div className="mb-2.5 flex flex-wrap gap-2.5">
          <div className="flex-1 min-w-[140px] rounded-xl border border-blue-900/40 bg-slate-900 px-3.5 py-2.5 text-center">
            <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500">실제 점 A</div>
            <div className="text-lg font-extrabold text-emerald-400">
              ({a}, {b})
            </div>
          </div>
          <div className="flex-1 min-w-[140px] rounded-xl border border-blue-900/40 bg-slate-900 px-3.5 py-2.5 text-center">
            <div className="mb-1 text-[10px] font-bold tracking-wider text-slate-500">화면 속 점 A′</div>
            <div className="text-lg font-extrabold text-amber-400">
              ({proj.ap.toFixed(2)}, {proj.bp.toFixed(2)})
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-900/40 bg-slate-900 px-3.5 py-2.5 text-[12px] text-slate-500">
          ↑ <b className="text-emerald-400">초록 점</b>은 실제 사물 A(a,b),{" "}
          <b className="text-amber-400">노란 점</b>은 화면 속 A′(a′,b′) 입니다. 슬라이더로 A를
          움직여 투영 위치가 어떻게 바뀌는지 확인하세요.
        </div>
      </div>

      {/* ─── 탭 2: 탐구활동 4 ──────────────────────────── */}
      <div style={{ display: tab === "ex4" ? "block" : "none" }}>
        <StepCard num="상황 설명">
          <div ref={diagSetupWrapRef} className="mb-2 overflow-hidden rounded-lg border border-blue-900/40 bg-slate-900">
            <canvas ref={diagSetupRef} className="block" />
          </div>
          <LegendRow
            items={[
              { color: "#f43f5e", label: "눈 E" },
              { color: "#4ade80", label: "실제 점 A(a,b)" },
              { color: "#f59e0b", label: "화면 속 A′(a′,b′)" },
              { color: "#a78bfa", label: "화면(그림)", square: true },
            ]}
          />
          <p className="text-[13px] leading-relaxed text-slate-400">
            눈(E)은 수평면으로부터 <Hl color="r">높이 22cm</Hl> 위에 있고, 화면(그림)으로부터{" "}
            <Hl color="r">28cm</Hl> 떨어진 위치에서 바라봅니다.
            <br />
            수평면 위의 점 <Hl color="g">A(a, b)</Hl> 는 화면에 <Hl color="y">A′(a′, b′)</Hl> 로
            투영됩니다.
          </p>
        </StepCard>

        <StepCard num="STEP 1 — 옆에서 본 단면 (b′ 구하기)">
          <div ref={diag4bWrapRef} className="mb-2 overflow-hidden rounded-lg border border-blue-900/40 bg-slate-900">
            <canvas ref={diag4bRef} className="block" />
          </div>
          <p className="text-[13px] leading-relaxed text-slate-400">
            위 그림처럼 <b>옆에서 본 단면</b>에서 꼭짓점 A를 공유하는{" "}
            <Hl color="y">닮음인 직각삼각형</Hl> 두 개를 찾을 수 있습니다.
            <br />
            <br />
            <span className="text-emerald-400">■</span> <b>큰 삼각형</b>: 밑변 = b + 28, 높이 = 22
            (직각: E발밑)
            <br />
            <span className="text-amber-400">■</span> <b>작은 삼각형</b>: 밑변 = b, 높이 = b′ (직각:
            화면·바닥 교점)
          </p>
          <Formula text="b′ / 22 = b / (b + 28)" />
          <p className="text-[13px] text-slate-400">따라서:</p>
          <Formula text="b′ = 22b / (b + 28)" color="amber" />
        </StepCard>

        <StepCard num="STEP 2 — 위에서 본 평면 (a′ 구하기)">
          <div ref={diag4aWrapRef} className="mb-2 overflow-hidden rounded-lg border border-blue-900/40 bg-slate-900">
            <canvas ref={diag4aRef} className="block" />
          </div>
          <p className="text-[13px] leading-relaxed text-slate-400">
            위 그림처럼 <b>위에서 본 평면</b>에서 꼭짓점 E를 공유하는{" "}
            <Hl color="y">닮음인 직각삼각형</Hl> 두 개를 찾을 수 있습니다.
            <br />
            <br />
            <span className="text-emerald-400">■</span> <b>큰 삼각형</b>: 밑변 = b + 28, 높이 = a
            (직각: A발밑)
            <br />
            <span className="text-amber-400">■</span> <b>작은 삼각형</b>: 밑변 = 28, 높이 = a′ (직각:
            화면·중심축 교점)
          </p>
          <Formula text="a′ / a = 28 / (b + 28)" />
          <p className="text-[13px] text-slate-400">따라서:</p>
          <Formula text="a′ = 28a / (b + 28)" color="amber" />
        </StepCard>

        <StepCard num="STEP 3 — 관계식 정리">
          <p className="text-[13px] leading-relaxed text-slate-400">
            실제 점 <Hl color="g">A(a, b)</Hl> → 화면 속 점 <Hl color="y">A′(a′, b′)</Hl>:
          </p>
          <div className="my-2 rounded-md border border-slate-600 bg-slate-800 px-3.5 py-3 text-center font-mono text-sm leading-loose text-sky-300">
            a′ = 28a / (b + 28)
            <br />
            b′ = 22b / (b + 28)
          </div>
        </StepCard>

        {/* 퀴즈 */}
        <div className="rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-3">
          <div className="mb-2 text-xs font-extrabold text-sky-300">
            🧩 확인 문제 — A(a,b) 를 직접 넣어봐요
          </div>
          <p className="mb-2 text-[13px] leading-relaxed text-slate-300">
            눈의 높이 = 22, 화면까지 거리 = 28 일 때,
            <br />
            실제 점 A(<Hl color="g">{q4.a}</Hl>, <Hl color="g">{q4.b}</Hl>)의 화면 좌표 A′(a′, b′)
            를 구하세요.
          </p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">a′ =</span>
            <input
              type="number"
              value={q4Ap}
              onChange={(e) => setQ4Ap(e.target.value)}
              step={0.01}
              placeholder="소수점 2자리"
              className="w-24 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-400"
              aria-label="a' 정답"
            />
            <span className="text-xs text-slate-400">b′ =</span>
            <input
              type="number"
              value={q4Bp}
              onChange={(e) => setQ4Bp(e.target.value)}
              step={0.01}
              placeholder="소수점 2자리"
              className="w-24 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-400"
              aria-label="b' 정답"
            />
            <button
              type="button"
              onClick={checkQ4}
              className="rounded-md border border-sky-500 bg-sky-900 px-3 py-1 text-xs font-bold text-sky-100 transition hover:bg-sky-800"
            >
              확인
            </button>
            <button
              type="button"
              onClick={newQ4}
              className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-bold text-slate-400 transition hover:border-slate-500"
            >
              새 문제
            </button>
          </div>
          {q4Fb ? <QuizFbBox fb={q4Fb} /> : null}
        </div>
      </div>

      {/* ─── 탭 3: 탐구활동 5 ──────────────────────────── */}
      <div style={{ display: tab === "ex5" ? "block" : "none" }}>
        <StepCard num="목표">
          <div ref={diag5WrapRef} className="mb-2 overflow-hidden rounded-lg border border-blue-900/40 bg-slate-900">
            <canvas ref={diag5Ref} className="block" />
          </div>
          <LegendRow
            items={[
              { color: "#f59e0b", label: "알고 있는 것: A′(a′,b′) — 화면의 좌표" },
              { color: "#4ade80", label: "구하는 것: A(a,b) — 실제 좌표" },
            ]}
          />
          <p className="text-[13px] leading-relaxed text-slate-400">
            탐구활동 4에서 구한 공식을 <b>역으로</b> 풀어,
            <br />
            화면 좌표 <Hl color="y">A′(a′, b′)</Hl> 로부터 실제 좌표 <Hl color="g">A(a, b)</Hl> 를
            구해봅니다.
          </p>
        </StepCard>

        <StepCard num="STEP 1 — b′ 에서 b 구하기">
          <p className="text-[13px] leading-relaxed text-slate-400">탐구활동 4의 결과:</p>
          <Formula text="b′ / 22 = b / (b + 28)" />
          <p className="text-[13px] text-slate-400">
            양변을 교차 곱하면: <Hl color="y">b′</Hl>(b + 28) = 22b
          </p>
          <Formula text="b′ · b + 28b′ = 22b" />
          <p className="text-[13px] text-slate-400">b 를 한쪽으로 모으면: 22b − b′·b = 28b′</p>
          <Formula text="(22 − b′) · b = 28b′" />
          <p className="text-[13px] text-slate-400">따라서:</p>
          <Formula text="b = 28b′ / (22 − b′)" color="green" />
        </StepCard>

        <StepCard num="STEP 2 — a′ 에서 a 구하기">
          <p className="text-[13px] leading-relaxed text-slate-400">
            탐구활동 4의 결과: a′ = 28a / (b + 28)
            <br />
            <br />
            STEP 1에서 b + 28 = 28b′/(22 − b′) + 28 을 계산하면:
          </p>
          <Formula text="b + 28 = (28b′ + 28(22 − b′)) / (22 − b′) = 28·22 / (22 − b′)" />
          <p className="text-[13px] text-slate-400">따라서 a = a′·(b + 28) / 28 이므로:</p>
          <Formula text="a = 22a′ / (22 − b′)" color="green" />
        </StepCard>

        <StepCard num="STEP 3 — 역관계식 정리">
          <p className="text-[13px] leading-relaxed text-slate-400">
            화면 속 점 <Hl color="y">A′(a′, b′)</Hl> → 실제 점 <Hl color="g">A(a, b)</Hl>:
          </p>
          <div className="my-2 rounded-md border border-slate-600 bg-slate-800 px-3.5 py-3 text-center font-mono text-sm leading-loose text-sky-300">
            a = 22a′ / (22 − b′)
            <br />
            b = 28b′ / (22 − b′)
          </div>
          <p className="text-[11px] text-slate-500">
            단, b′ &lt; 22 이어야 합니다. (b′ = 22 이면 b → ∞, 즉 무한히 먼 곳)
          </p>
        </StepCard>

        {/* 실시간 계산기 */}
        <div className="mb-2.5 rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3">
          <div className="mb-2 text-xs font-extrabold text-sky-300">
            🔢 역공식 계산기 — 화면 좌표를 넣으면 실제 좌표가!
          </div>
          <div className="mb-2 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">
              <div className="mb-1 text-[11px] text-slate-500">a′ (화면 x)</div>
              <input
                type="number"
                value={calcAp}
                onChange={(e) => setCalcAp(e.target.value)}
                step={0.1}
                className="w-full rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-400"
                aria-label="a' 입력"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <div className="mb-1 text-[11px] text-slate-500">b′ (화면 y, &lt; 22)</div>
              <input
                type="number"
                value={calcBp}
                onChange={(e) => setCalcBp(e.target.value)}
                step={0.1}
                className="w-full rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-sky-400"
                aria-label="b' 입력"
              />
            </div>
          </div>
          <div className="rounded-xl border border-blue-900/40 bg-slate-950 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-400">
            {calcOut.kind === "info" ? (
              calcOut.msg
            ) : calcOut.kind === "warn" ? (
              <span className="text-rose-400">{calcOut.msg}</span>
            ) : (
              <>
                a′ = <b className="text-emerald-400">{calcOut.apN}</b>, b′ ={" "}
                <b className="text-emerald-400">{calcOut.bpN}</b> 일 때,
                <br />
                실제 a = <b className="text-emerald-400">{calcOut.resA.toFixed(3)}</b>,&nbsp; b ={" "}
                <b className="text-emerald-400">{calcOut.resB.toFixed(3)}</b>
                <br />
                <span className="text-[11px] text-slate-500">
                  검증: 다시 투영하면 a′≈{calcOut.checkAp.toFixed(2)}, b′≈
                  {calcOut.checkBp.toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 퀴즈 */}
        <div className="rounded-xl border border-slate-600 bg-slate-900 px-3.5 py-3">
          <div className="mb-2 text-xs font-extrabold text-sky-300">
            🧩 확인 문제 — A′(a′,b′) 에서 A(a,b) 를 구하세요
          </div>
          <p className="mb-2 text-[13px] leading-relaxed text-slate-300">
            화면 좌표 A′(<Hl color="y">{q5.ap.toFixed(1)}</Hl>, <Hl color="y">{q5.bp.toFixed(1)}</Hl>
            )에 해당하는
            <br />
            실제 좌표 A(a, b) 를 구하세요.
          </p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">a =</span>
            <input
              type="number"
              value={q5A}
              onChange={(e) => setQ5A(e.target.value)}
              step={0.01}
              placeholder="소수점 2자리"
              className="w-24 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-400"
              aria-label="a 정답"
            />
            <span className="text-xs text-slate-400">b =</span>
            <input
              type="number"
              value={q5B}
              onChange={(e) => setQ5B(e.target.value)}
              step={0.01}
              placeholder="소수점 2자리"
              className="w-24 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-400"
              aria-label="b 정답"
            />
            <button
              type="button"
              onClick={checkQ5}
              className="rounded-md border border-sky-500 bg-sky-900 px-3 py-1 text-xs font-bold text-sky-100 transition hover:bg-sky-800"
            >
              확인
            </button>
            <button
              type="button"
              onClick={newQ5}
              className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1 text-xs font-bold text-slate-400 transition hover:border-slate-500"
            >
              새 문제
            </button>
          </div>
          {q5Fb ? <QuizFbBox fb={q5Fb} /> : null}
        </div>
      </div>

      {/* ─── 탭 4: 아르놀피니 적용 ────────────────────── */}
      <div style={{ display: tab === "arno" ? "block" : "none" }}>
        <ArnolfiniApplication />
      </div>
    </div>
  );
}

// ─── 작은 컴포넌트들 ──────────────────────────────────────
function StepCard({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 rounded-xl border border-blue-900/40 bg-slate-900 px-3.5 py-3">
      <span className="mb-2 inline-block rounded-md bg-sky-900 px-2 py-0.5 text-[11px] font-extrabold text-sky-200">
        {num}
      </span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Formula({ text, color }: { text: string; color?: "amber" | "green" }) {
  const colorCls =
    color === "amber" ? "text-amber-400" : color === "green" ? "text-emerald-400" : "text-sky-300";
  return (
    <div
      className={`my-1.5 rounded-md border border-slate-600 bg-slate-800 px-3.5 py-2 text-center font-mono text-sm ${colorCls}`}
    >
      {text}
    </div>
  );
}

function Hl({ color, children }: { color: "g" | "y" | "p" | "r"; children: React.ReactNode }) {
  const cls =
    color === "g"
      ? "text-emerald-400 font-bold"
      : color === "y"
        ? "text-amber-400 font-bold"
        : color === "p"
          ? "text-fuchsia-300 font-bold"
          : "text-rose-400 font-bold";
  return <span className={cls}>{children}</span>;
}

function LegendRow({
  items,
}: {
  items: { color: string; label: string; square?: boolean }[];
}) {
  return (
    <div className="mb-2 flex flex-wrap gap-3 text-xs text-slate-400">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span
            className={`block h-2.5 w-2.5 flex-shrink-0 ${it.square ? "rounded-sm" : "rounded-full"}`}
            style={{ background: it.color }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function QuizFbBox({ fb }: { fb: NonNullable<QuizFb> }) {
  return (
    <div
      className={`mt-1 whitespace-pre-line rounded-md border px-2.5 py-1.5 text-xs leading-relaxed ${
        fb.kind === "ok"
          ? "border-emerald-600 bg-emerald-950 text-emerald-200"
          : "border-rose-600 bg-rose-950 text-rose-200"
      }`}
    >
      {fb.msg}
    </div>
  );
}
