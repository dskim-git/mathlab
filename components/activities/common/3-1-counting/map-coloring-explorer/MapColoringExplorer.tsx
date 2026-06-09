"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { geoAlbersUsa, geoMercator, geoPath } from "d3-geo";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "branching_cases",
    prompt:
      "탭 ① (4 영역 원, 4 색 사용 가능 시 84 가지) 와 같이 영역을 A → B → C → D 순서로 칠하다 보면 C 단계에서 ‘C = A 인 경우’ 와 ‘C ≠ A 인 경우’ 로 갈라져 두 경우의 수를 더해야 합니다. 왜 이렇게 ‘경우를 나누고 → 더하는’ 과정이 필요한지, 어느 단계에서 곱 (곱의 법칙) 으로는 부족해지는지 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: A·B 단계까지는 ‘바로 앞 영역과만 다르면 된다’ 라서 곱셈으로 4 × 3 = 12 가지를 얻을 수 있다. 그런데 D 는 A 와 C 모두와 인접하므로 ‘D 의 선택지 수’ 가 C 의 값에 따라 달라진다. (C = A 면 D 는 A 만 피하면 됨 → 3 가지, C ≠ A 면 D 는 A 와 C 둘 다 피해야 함 → 2 가지) 두 경우는 동시에 일어날 수 없으므로 (배반), 각 경우 안에서 곱셈으로 세어 합의 법칙으로 합쳐야 한다.",
  },
  {
    id: "four_color_theorem",
    prompt:
      "탭 ⑤ 의 F1·F2·F3·F4 처럼 네 영역이 서로 모두 인접한 지도는 반드시 4 색이 필요합니다. ‘평면 지도라면 어떤 모양이든 4 색이면 충분하다’ 라는 4 색 정리가 보장하는 것은 무엇이고, 1·2·3 색만으로 충분한 지도와 반드시 4 색이 필요한 지도는 어떻게 구별할 수 있을까요?",
    kind: "text",
    placeholder:
      "예: 4 색 정리는 ‘평면 지도라면 영역이 아무리 많고 모양이 복잡해도 — 4 색이 모자란 경우는 존재하지 않는다’ 를 보장한다. 인접 관계를 그래프로 그렸을 때 (영역=점, 인접=선) 평면 그래프이기만 하면 채색수가 ≤ 4. 1 색만 필요한 지도 = 영역이 1 개뿐인 지도. 2 색은 인접 그래프가 ‘이분 그래프’ 인 경우 (예: 체스판). 3 색이면 충분한 지도도 많지만, F1·F2·F3·F4 처럼 ‘서로 모두 인접한 영역이 4 개 이상 있으면 (K₄ 부분그래프)’ 4 색이 반드시 필요하다.",
  },
];

// ─── 인접 데이터 ───────────────────────────────────────────
// (한 쪽만 적혀 있어도 symmetrize 로 양방향 자동 보강)
const ADJ_0: Record<string, string[]> = {
  A: ["B", "D"],
  B: ["A", "C"],
  C: ["B", "D"],
  D: ["A", "C"],
};
const ADJ_1: Record<string, string[]> = {
  A: ["B", "C", "E"],
  B: ["A", "C", "D", "E"],
  C: ["A", "B", "D"],
  D: ["B", "C"],
  E: ["A", "B"],
};
const ADJ_SEOUL: Record<string, string[]> = {
  도봉: ["강북", "노원"],
  노원: ["도봉", "강북", "성북", "중랑"],
  강북: ["도봉", "노원", "성북", "은평", "서대문", "종로"],
  성북: ["강북", "노원", "중랑", "동대문", "종로"],
  중랑: ["노원", "성북", "동대문", "광진"],
  은평: ["강북", "서대문", "마포", "종로"],
  서대문: ["강북", "은평", "종로", "마포", "용산", "중구"],
  종로: ["성북", "서대문", "동대문", "중구", "용산", "강북", "은평"],
  중구: ["종로", "동대문", "성동", "용산", "서대문"],
  동대문: ["성북", "중랑", "광진", "종로", "중구", "성동"],
  광진: ["중랑", "동대문", "성동", "강동"],
  마포: ["은평", "서대문", "용산", "영등포", "강서", "중구"],
  용산: ["서대문", "종로", "중구", "마포", "동작", "영등포", "서초"],
  성동: ["동대문", "광진", "강동", "중구", "서초"],
  강동: ["광진", "성동", "강남", "송파"],
  강서: ["마포", "양천", "영등포"],
  양천: ["강서", "영등포", "구로"],
  영등포: ["강서", "양천", "마포", "용산", "동작", "구로"],
  구로: ["양천", "영등포", "금천", "동작", "관악"],
  동작: ["영등포", "용산", "서초", "관악", "구로", "금천"],
  금천: ["구로", "관악", "동작"],
  관악: ["금천", "동작", "서초"],
  서초: ["동작", "관악", "강남", "성동", "용산"],
  강남: ["서초", "성동", "강동", "송파"],
  송파: ["강남", "강동"],
};
const ADJ_USA: Record<string, string[]> = {
  AL: ["FL", "GA", "MS", "TN"],
  AK: [],
  AZ: ["CA", "CO", "NM", "NV", "UT"],
  AR: ["LA", "MO", "MS", "OK", "TN", "TX"],
  CA: ["AZ", "NV", "OR"],
  CO: ["AZ", "KS", "NE", "NM", "OK", "UT", "WY"],
  CT: ["MA", "NY", "RI"],
  DE: ["MD", "NJ", "PA"],
  FL: ["AL", "GA"],
  GA: ["AL", "FL", "NC", "SC", "TN"],
  HI: [],
  ID: ["MT", "NV", "OR", "UT", "WA", "WY"],
  IL: ["IA", "IN", "KY", "MO", "WI"],
  IN: ["IL", "KY", "MI", "OH"],
  IA: ["IL", "MN", "MO", "NE", "SD", "WI"],
  KS: ["CO", "MO", "NE", "OK"],
  KY: ["IL", "IN", "MO", "OH", "TN", "VA", "WV"],
  LA: ["AR", "MS", "TX"],
  ME: ["NH"],
  MD: ["DE", "PA", "VA", "WV"],
  MA: ["CT", "NH", "NY", "RI", "VT"],
  MI: ["IN", "OH", "WI"],
  MN: ["IA", "ND", "SD", "WI"],
  MS: ["AL", "AR", "LA", "TN"],
  MO: ["AR", "IA", "IL", "KS", "KY", "NE", "OK", "TN"],
  MT: ["ID", "ND", "SD", "WY"],
  NE: ["CO", "IA", "KS", "MO", "SD", "WY"],
  NV: ["AZ", "CA", "ID", "OR", "UT"],
  NH: ["MA", "ME", "VT"],
  NJ: ["DE", "NY", "PA"],
  NM: ["AZ", "CO", "OK", "TX", "UT"],
  NY: ["CT", "MA", "NJ", "PA", "VT"],
  NC: ["GA", "SC", "TN", "VA"],
  ND: ["MN", "MT", "SD"],
  OH: ["IN", "KY", "MI", "PA", "WV"],
  OK: ["AR", "CO", "KS", "MO", "NM", "TX"],
  OR: ["CA", "ID", "NV", "WA"],
  PA: ["DE", "MD", "NJ", "NY", "OH", "WV"],
  RI: ["CT", "MA"],
  SC: ["GA", "NC"],
  SD: ["IA", "MN", "MT", "ND", "NE", "WY"],
  TN: ["AL", "AR", "GA", "KY", "MS", "MO", "NC", "VA"],
  TX: ["AR", "LA", "NM", "OK"],
  UT: ["AZ", "CO", "ID", "NV", "NM", "WY"],
  VT: ["MA", "NH", "NY"],
  VA: ["KY", "MD", "NC", "TN", "WV"],
  WA: ["ID", "OR"],
  WV: ["KY", "MD", "OH", "PA", "VA"],
  WI: ["IA", "IL", "MI", "MN"],
  WY: ["CO", "ID", "MT", "NE", "SD", "UT"],
};
const ADJ_4: Record<string, string[]> = {
  F1: ["F2", "F3", "F4"],
  F2: ["F1", "F3", "F4"],
  F3: ["F1", "F2", "F4"],
  F4: ["F1", "F2", "F3"],
};
const STATE_NAME: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};
const STATE_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME).map(([abbr, name]) => [name, abbr]),
);

/** 한쪽만 적혀 있는 인접 관계를 양방향으로 자동 보강. */
function symmetrize(adj: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};
  for (const k of Object.keys(adj)) out[k] = new Set();
  for (const [a, list] of Object.entries(adj)) {
    for (const b of list) {
      if (!out[a]) out[a] = new Set();
      if (!out[b]) out[b] = new Set();
      out[a].add(b);
      out[b].add(a);
    }
  }
  const result: Record<string, string[]> = {};
  for (const [k, s] of Object.entries(out)) {
    result[k] = [...s].sort();
  }
  return result;
}

const ADJ = {
  t0: symmetrize(ADJ_0),
  t1: symmetrize(ADJ_1),
  seoul: symmetrize(ADJ_SEOUL),
  usa: symmetrize(ADJ_USA),
  t4: symmetrize(ADJ_4),
} as const;

// ─── 팔레트 ────────────────────────────────────────────────
const COLORS = [
  "#ef4444", // 0 빨강
  "#22c55e", // 1 초록
  "#3b82f6", // 2 파랑
  "#facc15", // 3 노랑
  "#a855f7", // 4 보라
  "#fb923c", // 5 주황
  "#ec4899", // 6 분홍
  "#94a3b8", // 7 회색
];
const CNAMES = ["빨강", "초록", "파랑", "노랑", "보라", "주황", "분홍", "회색"];
const DEFAULT_FILL = "#2a2a55";

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 155;
}

// ─── 인접 충돌 검사 ────────────────────────────────────────
type Coloring = Record<string, number>;

function findConflicts(adj: Record<string, string[]>, cs: Coloring): Set<string> {
  const bad = new Set<string>();
  for (const [r, nb] of Object.entries(adj)) {
    for (const n of nb) {
      if (cs[r] !== undefined && cs[n] !== undefined && cs[r] === cs[n]) {
        bad.add(r);
        bad.add(n);
      }
    }
  }
  return bad;
}

function allColored(adj: Record<string, string[]>, cs: Coloring): boolean {
  return Object.keys(adj).every((r) => cs[r] !== undefined);
}

/** 백트래킹으로 평면 그래프 색칠 — nColors 가 부족하면 null. */
function autoColorGraph(
  adj: Record<string, string[]>,
  nColors: number,
): Coloring | null {
  const regions = Object.keys(adj);
  // 휴리스틱: 이웃 많은 영역부터 (충돌 가능성 큰 곳 우선)
  regions.sort((a, b) => adj[b].length - adj[a].length);
  const result: Coloring = {};
  function solve(i: number): boolean {
    if (i === regions.length) return true;
    const r = regions[i];
    for (let c = 0; c < nColors; c++) {
      let ok = true;
      for (const n of adj[r]) {
        if (result[n] === c) {
          ok = false;
          break;
        }
      }
      if (ok) {
        result[r] = c;
        if (solve(i + 1)) return true;
        delete result[r];
      }
    }
    return false;
  }
  if (solve(0)) return result;
  return null;
}

// ─── 메인 ─────────────────────────────────────────────────
type Tab = 0 | 1 | 2 | 3 | 4;

export default function MapColoringExplorer() {
  const [tab, setTab] = useState<Tab>(0);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">🗺️ 지도 색칠 경우의 수</h3>
        <p className="mt-2 leading-7 text-slate-300">
          ‘인접한 영역은 서로 다른 색’ 규칙 아래에서 지도를 색칠해 보며{" "}
          <b className="text-violet-300">경우의 수</b> 와{" "}
          <b className="text-amber-300">4 색 정리</b> 를 탐구합니다.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <MainTabBtn active={tab === 0} onClick={() => setTab(0)}>
          🔵 4 영역 원
        </MainTabBtn>
        <MainTabBtn active={tab === 1} onClick={() => setTab(1)}>
          ⬠ 5 영역 도형
        </MainTabBtn>
        <MainTabBtn active={tab === 2} onClick={() => setTab(2)}>
          🏙️ 서울 25 구
        </MainTabBtn>
        <MainTabBtn active={tab === 3} onClick={() => setTab(3)}>
          🇺🇸 미국 50 주
        </MainTabBtn>
        <MainTabBtn active={tab === 4} onClick={() => setTab(4)}>
          🎨 4 색 정리
        </MainTabBtn>
      </div>

      <div className={tab === 0 ? "mt-5" : "mt-5 hidden"}>
        <CircleTab />
      </div>
      <div className={tab === 1 ? "mt-5" : "mt-5 hidden"}>
        <FigureTab />
      </div>
      <div className={tab === 2 ? "mt-5" : "mt-5 hidden"}>
        <SeoulTab />
      </div>
      <div className={tab === 3 ? "mt-5" : "mt-5 hidden"}>
        <UsaTab />
      </div>
      <div className={tab === 4 ? "mt-5" : "mt-5 hidden"}>
        <TheoremTab />
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
        "rounded-full px-3 py-2 text-center text-[11px] font-bold transition sm:text-xs " +
        (active
          ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/25"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-violet-200")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 UI ──────────────────────────────────────────────
function TitleBar({ head, sub }: { head: ReactNode; sub: ReactNode }) {
  return (
    <div className="rounded-r-xl border-l-4 border-violet-400/70 bg-gradient-to-r from-violet-500/15 via-cyan-500/10 to-transparent px-4 py-3">
      <p className="text-base font-extrabold text-violet-100">{head}</p>
      <p className="mt-0.5 text-xs leading-7 text-slate-300">{sub}</p>
    </div>
  );
}

type PaletteProps = {
  nColors: number;
  sel: number; // -1 = 지우개
  onPick: (idx: number) => void;
};

function Palette({ nColors, sel, onPick }: PaletteProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
      {Array.from({ length: nColors }, (_, i) => {
        const isOn = sel === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            aria-label={CNAMES[i]}
            title={CNAMES[i]}
            className={
              "h-10 w-10 rounded-full border-2 transition " +
              (isOn ? "scale-110 border-white ring-2 ring-white/30" : "border-white/30 hover:scale-105")
            }
            style={{ background: COLORS[i] }}
          />
        );
      })}
      <button
        type="button"
        onClick={() => onPick(-1)}
        aria-label="지우기"
        title="지우기"
        className={
          "ml-1 flex h-10 w-10 items-center justify-center rounded-full border-2 text-base transition " +
          (sel === -1
            ? "scale-110 border-white bg-white/20 ring-2 ring-white/30"
            : "border-white/30 bg-white/5 hover:scale-105")
        }
      >
        🧹
      </button>
    </div>
  );
}

function NColorsRow({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
      <span className="text-slate-300">색 개수</span>
      <input
        type="range"
        min={3}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="flex-1 accent-violet-400"
        aria-label="색 개수"
      />
      <span className="w-9 rounded-md border border-violet-300/40 bg-violet-300 px-1 text-center font-mono text-base font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function StatusBar({
  text,
  kind,
}: {
  text: ReactNode;
  kind: "neutral" | "ok" | "bad";
}) {
  const palette =
    kind === "ok"
      ? "border-emerald-400/55 bg-emerald-400/15 text-emerald-100"
      : kind === "bad"
        ? "border-rose-400/55 bg-rose-400/15 text-rose-100"
        : "border-white/10 bg-white/[0.04] text-slate-300";
  return (
    <p
      className={`rounded-lg border px-3 py-2 text-center text-xs font-bold leading-7 ${palette}`}
    >
      {text}
    </p>
  );
}

function Celebrate({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-amber-300/55 bg-amber-300/15 px-4 py-3 text-center text-sm font-extrabold text-amber-100 shadow-lg shadow-amber-400/20">
      {children}
    </div>
  );
}

function ResetBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
    >
      ↺ 초기화
    </button>
  );
}

function InfoToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
    >
      💡 경우의 수를 어떻게 구할까? {open ? "▴" : "▾"}
    </button>
  );
}

function AutoColorBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-amber-400/25 hover:brightness-110"
    >
      ⚡ 자동 색칠
    </button>
  );
}

function InfoPanel({ open, children }: { open: boolean; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-7 text-slate-200">
      {children}
    </div>
  );
}

// 인접 영역에 같은 색을 칠하면 stroke 가 빨강 + 깜빡임
const badStyle: CSSProperties = {
  stroke: "#ff4444",
  strokeWidth: 3,
  filter: "drop-shadow(0 0 6px rgba(255,68,68,.7))",
};

function regionFill(idx: number | undefined): string {
  return idx === undefined ? DEFAULT_FILL : COLORS[idx];
}

// ═══════════════════════════════════════════════════════════
//  TAB 0 — 4 영역 원
// ═══════════════════════════════════════════════════════════

function CircleTab() {
  const [sel, setSel] = useState(0);
  const [cs, setCs] = useState<Coloring>({});
  const adj = ADJ.t0;
  const bad = useMemo(() => findConflicts(adj, cs), [adj, cs]);
  const done = allColored(adj, cs) && bad.size === 0;
  const ok = bad.size === 0;

  function paint(r: string) {
    setCs((prev) => {
      const next = { ...prev };
      if (sel === -1) delete next[r];
      else next[r] = sel;
      return next;
    });
  }
  function reset() {
    setCs({});
  }

  const regions: { id: string; d: string }[] = [
    { id: "A", d: "M 210,210 L 210,30 A 180,180 0 0,0 30,210 Z" },
    { id: "D", d: "M 210,210 L 390,210 A 180,180 0 0,0 210,30 Z" },
    { id: "B", d: "M 210,210 L 30,210 A 180,180 0 0,0 210,390 Z" },
    { id: "C", d: "M 210,210 L 210,390 A 180,180 0 0,0 390,210 Z" },
  ];

  return (
    <div className="space-y-3">
      <TitleBar
        head={<>🔵 원을 4 가지 색으로 칠하는 경우의 수</>}
        sub={
          <>
            가운데에서 십자로 나뉜 4 영역. 인접한 두 영역이 같은 색이 되지 않게 4 가지
            색으로 칠하는 모든 방법의 수를 따져 봅시다.
          </>
        }
      />

      <Palette nColors={4} sel={sel} onPick={setSel} />
      <StatusBar
        text={
          ok
            ? done
              ? "🎉 완성! 모든 인접 영역이 서로 다른 색입니다!"
              : "🖌️ 색을 고른 뒤 영역을 클릭하여 색칠하세요"
            : "⚠️ 인접한 영역이 같은 색입니다 (빨간 외곽선) — 다시 골라보세요!"
        }
        kind={ok ? (done ? "ok" : "neutral") : "bad"}
      />
      {done ? (
        <Celebrate>🎉 완성! 인접한 영역이 모두 다른 색으로 칠해졌어요! 🎉</Celebrate>
      ) : null}

      <div className="rounded-xl bg-slate-950/60 p-2">
        <svg
          viewBox="0 0 420 420"
          className="mx-auto block w-full max-w-md"
          aria-label="4 영역 원"
        >
          {regions.map((r) => {
            const isBad = bad.has(r.id);
            return (
              <g key={r.id}>
                <path
                  d={r.d}
                  fill={regionFill(cs[r.id])}
                  stroke={isBad ? "#ff4444" : "#ffffff22"}
                  strokeWidth={isBad ? 3 : 1}
                  style={isBad ? { ...badStyle, animation: "blink 0.5s 3" } : undefined}
                  onClick={() => paint(r.id)}
                  className="cursor-pointer transition"
                />
                <text
                  x={LABEL_POS_T0[r.id].x}
                  y={LABEL_POS_T0[r.id].y}
                  textAnchor="middle"
                  fill={
                    cs[r.id] !== undefined
                      ? isLight(COLORS[cs[r.id]])
                        ? "#222"
                        : "#fff"
                      : "#cbd5e1"
                  }
                  fontSize="22"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {r.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-center">
        <ResetBtn onClick={reset} />
      </div>

      <CircleSolution />

      <BlinkKeyframes />
    </div>
  );
}

const LABEL_POS_T0: Record<string, { x: number; y: number }> = {
  A: { x: 130, y: 130 },
  D: { x: 290, y: 130 },
  B: { x: 130, y: 290 },
  C: { x: 290, y: 290 },
};

function CircleSolution() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-extrabold text-cyan-300">
        📐 경우의 수 84 가지가 나오는 풀이 (4 색 사용 시)
      </p>
      <div className="mt-2 space-y-2 text-xs leading-7 text-slate-200">
        <SolStep n={1}>
          <b>영역 A</b> 에 칠할 색: <SolVal>4 가지</SolVal>
        </SolStep>
        <SolStep n={2}>
          <b>영역 B</b> (A 와 인접 → B ≠ A): <SolVal>3 가지</SolVal>
        </SolStep>
        <SolStep n={3}>
          <b>영역 C</b> (B 와 인접 → C ≠ B):
          <div className="mt-1 rounded-lg bg-slate-950/40 p-3">
            ✦ <b>C = A 인 경우</b>: 1 가지 → D (A·C 와 다름, A = C 이므로 D ≠ A):{" "}
            <b>3</b> 가지 → 소계 <SolVal>1 × 3 = 3</SolVal>
            <br />✦ <b>C ≠ A 이고 C ≠ B 인 경우</b>: 2 가지 → D (A 와도 C 와도 다름):{" "}
            <b>2</b> 가지 → 소계 <SolVal>2 × 2 = 4</SolVal>
            <br />C, D 단계 합 (합의 법칙): <SolVal>3 + 4 = 7</SolVal>
          </div>
        </SolStep>
        <SolStep n={4}>
          전체 경우의 수: A · B · (C,D 단계) = 4 × 3 × 7 ={" "}
          <SolVal>84 가지</SolVal>
        </SolStep>
      </div>
    </div>
  );
}

function SolStep({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 border-b border-white/5 pb-2 last:border-0">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-[11px] font-bold text-white">
        {n}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SolVal({ children }: { children: ReactNode }) {
  return <span className="font-mono text-base font-extrabold text-amber-300">{children}</span>;
}

function BlinkKeyframes() {
  return (
    <style>{`
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.45} }
`}</style>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 1 — 5 영역 도형
// ═══════════════════════════════════════════════════════════

function FigureTab() {
  const [sel, setSel] = useState(0);
  const [cs, setCs] = useState<Coloring>({});
  const adj = ADJ.t1;
  const bad = useMemo(() => findConflicts(adj, cs), [adj, cs]);
  const done = allColored(adj, cs) && bad.size === 0;
  const ok = bad.size === 0;

  function paint(r: string) {
    setCs((prev) => {
      const next = { ...prev };
      if (sel === -1) delete next[r];
      else next[r] = sel;
      return next;
    });
  }

  function renderShape(id: string, props: Record<string, unknown>): ReactNode {
    const isBad = bad.has(id);
    const baseProps = {
      fill: regionFill(cs[id]),
      stroke: isBad ? "#ff4444" : "#ffffff22",
      strokeWidth: isBad ? 3 : 1,
      onClick: () => paint(id),
      className: "cursor-pointer transition",
      style: isBad ? { ...badStyle, animation: "blink 0.5s 3" } : undefined,
      ...props,
    };
    if ("d" in props) return <path key={id} {...(baseProps as Record<string, unknown>)} />;
    if ("cx" in props) return <ellipse key={id} {...(baseProps as Record<string, unknown>)} />;
    return <rect key={id} {...(baseProps as Record<string, unknown>)} />;
  }

  return (
    <div className="space-y-3">
      <TitleBar
        head={<>⬠ 5 개의 영역을 색칠하는 경우의 수</>}
        sub={
          <>
            크기와 모양이 다른 5 개 영역 — 인접 관계가 더 복잡합니다. 색을 고르고
            클릭하세요.
          </>
        }
      />

      <Palette nColors={5} sel={sel} onPick={setSel} />
      <StatusBar
        text={
          ok
            ? done
              ? "🎉 완성! 최소 몇 가지 색으로 색칠할 수 있었나요?"
              : "🖌️ 색을 고른 뒤 영역을 클릭하여 색칠하세요"
            : "⚠️ 인접한 영역이 같은 색입니다 (빨간 외곽선) — 다시 골라보세요!"
        }
        kind={ok ? (done ? "ok" : "neutral") : "bad"}
      />
      {done ? <Celebrate>🎉 완성! 최소 몇 가지 색으로 칠할 수 있었나요? 🎉</Celebrate> : null}

      <div className="rounded-xl bg-slate-950/60 p-2">
        <svg
          viewBox="0 0 550 395"
          className="mx-auto block w-full max-w-2xl"
          aria-label="5 영역 도형"
        >
          {renderShape("A", { x: 20, y: 20, width: 165, height: 295, rx: 4 })}
          {renderShape("C", {
            d: "M 185,20 L 530,20 L 530,205 L 185,205 Z M 350,133 A 108,72 0 1,1 350,277 A 108,72 0 1,1 350,133 Z",
            fillRule: "evenodd",
          })}
          {renderShape("B", { x: 185, y: 205, width: 345, height: 110, rx: 4 })}
          {renderShape("D", { cx: 350, cy: 205, rx: 108, ry: 72 })}
          {renderShape("E", { x: 20, y: 315, width: 510, height: 60, rx: 4 })}

          {/* 라벨 (영역별 중심 추정) */}
          <text x={102} y={175} {...labelStyle(cs.A)}>A</text>
          <text x={357} y={110} {...labelStyle(cs.C)}>C</text>
          <text x={357} y={264} {...labelStyle(cs.B)}>B</text>
          <text x={350} y={210} {...labelStyle(cs.D)}>D</text>
          <text x={275} y={350} {...labelStyle(cs.E)}>E</text>
        </svg>
      </div>

      <div className="flex justify-center">
        <ResetBtn onClick={() => setCs({})} />
      </div>

      <p className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2 text-xs leading-7 text-slate-200">
        💡 5 영역이지만 4 색만으로도 가능할까요? 인접 관계를 따져보고 직접 시도해
        봅시다.
      </p>

      <BlinkKeyframes />
    </div>
  );
}

function labelStyle(idx: number | undefined) {
  return {
    textAnchor: "middle" as const,
    fontSize: 22,
    fontWeight: "bold" as const,
    pointerEvents: "none" as const,
    fill:
      idx !== undefined
        ? isLight(COLORS[idx])
          ? "#222"
          : "#fff"
        : "#cbd5e1",
  };
}

// ═══════════════════════════════════════════════════════════
//  TAB 2 — 서울 25 자치구 (d3-geo + fetch)
// ═══════════════════════════════════════════════════════════

const SEOUL_URL =
  "https://cdn.jsdelivr.net/gh/southkorea/seoul-maps@master/kostat/2013/json/seoul_municipalities_geo_simple.json";

// "강남구" → "강남". "중구" (len 2) 는 그대로.
function normalizeSeoulName(name: string): string {
  if (!name) return "";
  if (name.endsWith("구") && name.length > 2) return name.slice(0, -1);
  return name;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoFeature = any;

function SeoulTab() {
  const [sel, setSel] = useState(0);
  const [cs, setCs] = useState<Coloring>({});
  const [nColors, setNColors] = useState(4);
  const [autoMsg, setAutoMsg] = useState<string>("");
  const adj = ADJ.seoul;
  const bad = useMemo(() => findConflicts(adj, cs), [adj, cs]);
  const allDone = allColored(adj, cs);
  const ok = bad.size === 0;
  const done = allDone && ok;

  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [openInfo, setOpenInfo] = useState(false);

  function autoColor() {
    const result = autoColorGraph(adj, nColors);
    if (result) {
      setCs({ ...result });
      const histo: Record<number, number> = {};
      for (const v of Object.values(result)) histo[v] = (histo[v] || 0) + 1;
      const histoStr = Object.entries(histo)
        .sort(([a], [b]) => +a - +b)
        .map(([c, n]) => `${CNAMES[+c]} ${n}`)
        .join(" / ");
      setAutoMsg(`✅ 자동 색칠 완료 — ${histoStr}`);
    } else {
      setAutoMsg(`❌ ${nColors} 색으로는 불가능 — 색 개수를 늘려보세요.`);
    }
  }
  function reset() {
    setCs({});
    setAutoMsg("");
  }

  useEffect(() => {
    let active = true;
    fetch(SEOUL_URL)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setFeatures(data.features || []);
        setStatus("ok");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const W = 540;
  const H = 420;
  const { paths, labels } = useMemo(() => {
    if (features.length === 0) return { paths: [], labels: [] };
    const projection = geoMercator();
    const fc: GeoFeature = { type: "FeatureCollection", features };
    projection.fitSize([W - 8, H - 8], fc);
    const pathGen = geoPath(projection);
    const paths: { rid: string; d: string }[] = [];
    const labels: { rid: string; x: number; y: number }[] = [];
    for (const f of features) {
      const raw =
        f.properties?.SIG_KOR_NM ||
        f.properties?.sig_kor_nm ||
        f.properties?.NAME_2 ||
        f.properties?.name ||
        "";
      const rid = normalizeSeoulName(raw);
      if (!rid || !adj[rid]) continue;
      const d = pathGen(f);
      if (!d) continue;
      paths.push({ rid, d });
      const c = pathGen.centroid(f);
      if (c && !Number.isNaN(c[0])) labels.push({ rid, x: c[0], y: c[1] });
    }
    return { paths, labels };
  }, [features, adj]);

  function paint(r: string) {
    setCs((prev) => {
      const next = { ...prev };
      if (sel === -1) delete next[r];
      else next[r] = sel;
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <TitleBar
        head={<>🏙️ 서울 25 개 자치구 지도 색칠</>}
        sub={
          <>
            실제 서울시 25 개 자치구를 인접 규칙에 맞게 색칠해 봅시다. 색 개수를 줄여
            <b className="text-amber-300"> 최소 몇 가지 색</b> 이면 충분한지도 도전해
            보세요.
          </>
        }
      />

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_auto]">
        <Palette nColors={nColors} sel={sel} onPick={setSel} />
        <NColorsRow value={nColors} onChange={setNColors} max={8} />
      </div>

      <StatusBar
        text={
          ok
            ? allDone
              ? "🎉 완성! 서울 25 개 자치구를 인접 규칙에 맞게 색칠했어요!"
              : `🖌️ 색을 고른 뒤 자치구를 클릭하여 색칠하세요 (${Object.keys(cs).length} / 25)`
            : "⚠️ 인접한 자치구가 같은 색입니다 (빨간 외곽선) — 다시 골라보세요!"
        }
        kind={ok ? (done ? "ok" : "neutral") : "bad"}
      />
      {done ? <Celebrate>🎉 서울 25 개 완성! 🎉</Celebrate> : null}

      <div className="rounded-xl bg-slate-950/80 p-2">
        {status === "loading" ? (
          <p className="py-12 text-center text-sm text-slate-400">
            서울 지도 데이터를 불러오는 중…
          </p>
        ) : status === "error" ? (
          <p className="py-12 text-center text-sm text-rose-300">
            서울 지도 데이터를 불러올 수 없습니다.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mx-auto block w-full max-w-3xl"
            aria-label="서울 25 자치구 지도"
          >
            {paths.map((p) => {
              const isBad = bad.has(p.rid);
              const idx = cs[p.rid];
              const fillColor = regionFill(idx);
              return (
                <path
                  key={p.rid}
                  d={p.d}
                  data-rid={p.rid}
                  data-color-idx={idx ?? -1}
                  stroke={isBad ? "#ff4444" : "#ffffff55"}
                  strokeWidth={isBad ? 2.5 : 0.8}
                  style={{
                    fill: fillColor,
                    fillOpacity: idx !== undefined ? 0.85 : 0.55,
                    ...(isBad
                      ? { ...badStyle, animation: "blink 0.5s 3" }
                      : {}),
                  }}
                  onClick={() => paint(p.rid)}
                  className="cursor-pointer"
                />
              );
            })}
            {labels.map((l) => (
              <text
                key={l.rid}
                x={l.x}
                y={l.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fontWeight="bold"
                fill={
                  cs[l.rid] !== undefined
                    ? isLight(COLORS[cs[l.rid]])
                      ? "#222"
                      : "#fff"
                    : "#e2e8f0"
                }
                pointerEvents="none"
              >
                {l.rid}
              </text>
            ))}
          </svg>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <AutoColorBtn onClick={autoColor} />
        <InfoToggle open={openInfo} onClick={() => setOpenInfo((p) => !p)} />
        <ResetBtn onClick={reset} />
      </div>

      {autoMsg ? (
        <p className="rounded-lg border border-amber-300/45 bg-amber-300/10 px-3 py-2 text-center text-sm font-bold text-amber-100">
          {autoMsg}
        </p>
      ) : null}

      <InfoPanel open={openInfo}>
        <p>
          <b className="text-amber-300">25 개 자치구</b> 의 인접 관계는 평면 그래프
          이므로, <b>4 색 정리</b> 에 의해 <b>4 가지 색</b> 으로 색칠할 수 있음이
          보장됩니다. 하지만 ‘몇 가지 방법으로 칠할 수 있는가’ 는 자치구의 인접 구조에
          따라 매우 큰 수가 됩니다.
        </p>
        <p className="mt-2">
          이런 큰 문제의 정확한 경우의 수는 보통 <b>채색 다항식</b> 또는 컴퓨터로
          계산하지만, 작은 부분 (탭 ① · ②) 처럼 ‘영역별 선택지 → 곱셈 · 경우 분기 →
          덧셈’ 의 패턴이 그대로 적용됩니다.
        </p>
      </InfoPanel>

      <BlinkKeyframes />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  TAB 3 — 미국 50 주 (d3-geo + fetch)
// ═══════════════════════════════════════════════════════════

const USA_URL =
  "https://cdn.jsdelivr.net/gh/python-visualization/folium@main/examples/data/us-states.json";

function UsaTab() {
  // 상태
  const [coloring, setColoring] = useState<Coloring>({});
  const [selColor, setSelColor] = useState(0);
  const [nColors, setNColors] = useState(4);
  const [message, setMessage] = useState("");
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ok" | "error">(
    "loading",
  );
  const [showInfo, setShowInfo] = useState(false);

  // 인접 데이터 (모듈 레벨 상수)
  const adj = ADJ.usa;

  // 충돌 검사
  const conflicts = useMemo(
    () => findConflicts(adj, coloring),
    [adj, coloring],
  );
  const hasConflict = conflicts.size > 0;
  const allFilled = allColored(adj, coloring);
  const isDone = allFilled && !hasConflict;

  // GeoJSON 로드 (mount 1 회)
  useEffect(() => {
    let alive = true;
    fetch(USA_URL)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        setFeatures(data.features ?? []);
        setLoadStatus("ok");
      })
      .catch(() => {
        if (alive) setLoadStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  // SVG 경로·라벨 계산 — geoAlbersUsa (composite, AK/HI 인셋 자동)
  const W = 960;
  const H = 600;
  const geometry = useMemo(() => {
    if (features.length === 0) return [] as USStateGeom[];

    // geoAlbersUsa 의 default scale=1070, translate=[480,250] 은
    // 960x600 viewBox 에 맞게 디자인되어 있음.
    const proj = geoAlbersUsa();
    const pathGen = geoPath(proj);
    const out: USStateGeom[] = [];

    for (const rawFeature of features) {
      const rid = resolveUsRid(rawFeature, adj);
      if (!rid) continue;
      // MultiPolygon 에서 degenerate polygon (collinear 또는 < 3 distinct points) 제거.
      // (folium us-states.json 의 VA 두 번째 polygon 등 — SVG fill 이 폭주하는 원인)
      const f = sanitizeUsFeature(rawFeature);
      const d = pathGen(f);
      if (!d || d.includes("NaN")) continue;
      // 추가 안전망: bounds 가 viewBox 너비/높이를 초과하면 비정상 → 건너뜀.
      const b = pathGen.bounds(f);
      const w = b[1][0] - b[0][0];
      const h = b[1][1] - b[0][1];
      if (!Number.isFinite(w) || !Number.isFinite(h) || w > W * 0.9 || h > H * 0.9) {
        continue;
      }
      const c = pathGen.centroid(f);
      out.push({
        rid,
        d,
        cx: Number.isFinite(c[0]) ? c[0] : 0,
        cy: Number.isFinite(c[1]) ? c[1] : 0,
      });
    }
    return out;
  }, [features, adj]);

  // 클릭 시 색칠
  function handlePaint(rid: string) {
    setColoring((prev) => {
      const next = { ...prev };
      if (selColor === -1) delete next[rid];
      else next[rid] = selColor;
      return next;
    });
  }

  // 자동 색칠
  function handleAutoColor() {
    const result = autoColorGraph(adj, nColors);
    if (!result) {
      setMessage(`❌ ${nColors} 색으로는 불가능 — 색 개수를 늘려보세요.`);
      return;
    }
    setColoring({ ...result });
    const histo: Record<number, number> = {};
    for (const v of Object.values(result)) {
      histo[v] = (histo[v] ?? 0) + 1;
    }
    const histoStr = Object.entries(histo)
      .sort(([a], [b]) => +a - +b)
      .map(([c, n]) => `${CNAMES[+c]} ${n}`)
      .join(" / ");
    setMessage(`✅ 자동 색칠 완료 — ${histoStr}`);
  }

  function handleReset() {
    setColoring({});
    setMessage("");
  }

  return (
    <div className="space-y-3">
      <TitleBar
        head={<>🇺🇸 미국 50 개 주 지도 색칠</>}
        sub={
          <>
            본토 48 개 주 + 하와이 · 알래스카. 인접 규칙에 맞게 색칠해 보고, 가능한
            한 적은 색으로 시도해 보세요.
          </>
        }
      />

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_auto]">
        <Palette nColors={nColors} sel={selColor} onPick={setSelColor} />
        <NColorsRow value={nColors} onChange={setNColors} max={8} />
      </div>

      <StatusBar
        text={
          hasConflict
            ? "⚠️ 인접한 주가 같은 색입니다 (빨간 외곽선) — 다시 골라보세요!"
            : isDone
              ? "🎉 완성! 미국 50 개 주를 인접 규칙에 맞게 색칠했어요!"
              : `🖌️ 색을 고른 뒤 주를 클릭하여 색칠하세요 (${Object.keys(coloring).length} / 50)`
        }
        kind={hasConflict ? "bad" : isDone ? "ok" : "neutral"}
      />
      {isDone && <Celebrate>🎉 미국 50 주 완성! 🎉</Celebrate>}

      <div className="rounded-xl bg-slate-950/80 p-2">
        {loadStatus === "loading" ? (
          <p className="py-12 text-center text-sm text-slate-400">
            미국 지도 데이터를 불러오는 중…
          </p>
        ) : loadStatus === "error" ? (
          <p className="py-12 text-center text-sm text-rose-300">
            미국 지도 데이터를 불러올 수 없습니다.
          </p>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mx-auto block w-full max-w-4xl"
            aria-label="미국 50 주 지도"
          >
            {/* 상태 path: fill 은 attribute 로만 지정, fillOpacity=1 (완전 불투명) */}
            {geometry.map((g) => {
              const idx = coloring[g.rid];
              const colored = idx !== undefined;
              const fillColor = colored ? COLORS[idx] : DEFAULT_FILL;
              const isConflict = conflicts.has(g.rid);
              return (
                <path
                  key={g.rid}
                  d={g.d}
                  fill={fillColor}
                  fillOpacity={colored ? 1 : 0.5}
                  fillRule="evenodd"
                  stroke={isConflict ? "#ff4444" : "#ffffff66"}
                  strokeWidth={isConflict ? 2.5 : 0.8}
                  onClick={() => handlePaint(g.rid)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
            {/* 주 이름 라벨 */}
            {geometry.map((g) => {
              const idx = coloring[g.rid];
              const labelFill =
                idx === undefined
                  ? "#e2e8f0"
                  : isLight(COLORS[idx])
                    ? "#0f172a"
                    : "#fff";
              return (
                <text
                  key={`lbl-${g.rid}`}
                  x={g.cx}
                  y={g.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontWeight="bold"
                  fill={labelFill}
                  pointerEvents="none"
                >
                  {g.rid}
                </text>
              );
            })}
          </svg>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <AutoColorBtn onClick={handleAutoColor} />
        <InfoToggle open={showInfo} onClick={() => setShowInfo((p) => !p)} />
        <ResetBtn onClick={handleReset} />
      </div>

      {message ? (
        <p className="rounded-lg border border-amber-300/45 bg-amber-300/10 px-3 py-2 text-center text-sm font-bold text-amber-100">
          {message}
        </p>
      ) : null}

      <InfoPanel open={showInfo}>
        <p>
          미국 50 개 주의 인접 관계도 평면 그래프이므로{" "}
          <b className="text-amber-300">4 색 정리</b> 에 의해 4 색이면 충분합니다.
          AK · HI 는 본토와 인접하지 않으므로 어떤 색이든 무방.
        </p>
        <p className="mt-2">
          ‘색의 개수 슬라이더’ 를 줄여 3 색으로 시도해 보세요 — 어떤 부분에서 막히는지
          관찰하면 4 색이 왜 필요한지 직관이 생깁니다.
        </p>
      </InfoPanel>
    </div>
  );
}

// ─── UsaTab 보조 ─────────────────────────────────────────
type USStateGeom = { rid: string; d: string; cx: number; cy: number };

function resolveUsRid(
  f: GeoFeature,
  adj: Record<string, string[]>,
): string | null {
  // GeoJSON id 가 2 자리 postal code 면 우선 사용
  if (typeof f.id === "string" && f.id.length === 2 && adj[f.id]) {
    return f.id;
  }
  // 아니면 properties.name 으로 약자 변환
  const name = f.properties?.name ?? f.properties?.NAME ?? "";
  const abbr = STATE_ABBR[name];
  return abbr && adj[abbr] ? abbr : null;
}

/**
 * MultiPolygon 안에 collinear 또는 < 3 distinct point 인 degenerate polygon 을 제거.
 * (folium us-states.json 의 Virginia 두 번째 polygon 처럼 모든 점이 같은 위도에 있는 경우,
 *  geoPath 가 viewBox 전체를 덮는 거대한 fill 영역을 만들어 다른 주를 가린다.)
 */
function sanitizeUsFeature(f: GeoFeature): GeoFeature {
  const geom = f.geometry;
  if (!geom || geom.type !== "MultiPolygon") return f;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polys: any[] = geom.coordinates;
  const good = polys.filter((poly) => {
    const ring = poly?.[0];
    if (!Array.isArray(ring) || ring.length < 4) return false;
    const xs = new Set<number>();
    const ys = new Set<number>();
    for (const pt of ring) {
      if (!Array.isArray(pt) || pt.length < 2) continue;
      xs.add(pt[0]);
      ys.add(pt[1]);
      if (xs.size >= 2 && ys.size >= 2) break; // 일찍 종료
    }
    // 모든 점이 같은 X 또는 같은 Y → 면적 0 → degenerate
    return xs.size >= 2 && ys.size >= 2;
  });
  if (good.length === polys.length) return f;
  return {
    ...f,
    geometry: { type: "MultiPolygon", coordinates: good },
  };
}

// ═══════════════════════════════════════════════════════════
//  TAB 4 — 4 색 정리
// ═══════════════════════════════════════════════════════════

function TheoremTab() {
  const [sel, setSel] = useState(0);
  const [cs, setCs] = useState<Coloring>({});
  const adj = ADJ.t4;
  const bad = useMemo(() => findConflicts(adj, cs), [adj, cs]);
  const ok = bad.size === 0;
  const done = allColored(adj, cs) && ok;
  const [showDemo, setShowDemo] = useState(false);

  function paint(r: string) {
    setCs((prev) => {
      const next = { ...prev };
      if (sel === -1) delete next[r];
      else next[r] = sel;
      return next;
    });
  }

  function autoColor() {
    setCs({ F1: 0, F2: 1, F3: 2, F4: 3 });
  }

  function renderRegion(
    id: string,
    kind: "rect" | "polygon" | "path",
    attrs: Record<string, unknown>,
  ) {
    const isBad = bad.has(id);
    const baseProps = {
      fill: regionFill(cs[id]),
      stroke: isBad ? "#ff4444" : "#ffffff44",
      strokeWidth: isBad ? 3 : 1,
      onClick: () => paint(id),
      className: "cursor-pointer transition",
      style: isBad ? { ...badStyle, animation: "blink 0.5s 3" } : undefined,
      ...attrs,
    };
    if (kind === "path") return <path key={id} {...(baseProps as Record<string, unknown>)} />;
    if (kind === "polygon") return <polygon key={id} {...(baseProps as Record<string, unknown>)} />;
    return <rect key={id} {...(baseProps as Record<string, unknown>)} />;
  }

  return (
    <div className="space-y-3">
      <TitleBar
        head={<>🎨 4 색 정리 (Four Color Theorem)</>}
        sub={
          <>
            평면 위의 어떤 지도도 단 <b className="text-amber-300">4 가지 색</b> 만으로
            인접한 영역을 다르게 칠할 수 있다는 정리입니다.
          </>
        }
      />

      <Card>
        <CardHead>🔑 4 색 정리란?</CardHead>
        <p>
          <b className="text-amber-300">4 색 정리</b> 는 “평면 위에 그려진 어떤 지도에서도, 서로
          인접한 영역이 항상 다른 색이 되도록 칠하기 위해 필요한 최소 색의 수는 4 가지
          이하이다” 라는 정리입니다.
        </p>
        <ul className="mt-2 list-disc pl-5">
          <li>1852 년 프란시스 거스리 (Francis Guthrie) 가 처음 제기.</li>
          <li>120 년 이상 풀리지 않은 난제로, 많은 수학자를 괴롭혔습니다.</li>
          <li>1976 년 아펠 (Appel) 과 하켄 (Haken) 이 컴퓨터를 이용해 최초로 증명.</li>
          <li>
            이는 역사상 최초의{" "}
            <b className="text-cyan-300">컴퓨터 보조 증명</b> 으로 수학계에 큰 논쟁을
            일으켰습니다.
          </li>
        </ul>
      </Card>

      <div className="rounded-xl border-2 border-amber-300/45 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent p-4 text-center">
        🗺️ 어떤 복잡한 지도라도
        <br />
        <span className="font-mono text-2xl font-extrabold text-amber-300">
          단 4 가지 색
        </span>{" "}
        으로 인접한 영역을 서로 다르게 색칠할 수 있습니다.
      </div>

      <Card>
        <CardHead>🧩 4 색이 반드시 필요한 경우</CardHead>
        <p>
          아래 지도는 4 개의 영역이 <b>서로 모두 인접</b> 합니다 (완전 그래프 K₄).
          반드시 4 가지 색이 필요합니다 — 직접 색칠해 보세요!
        </p>
        <p className="mt-2 text-xs text-slate-400">
          🎨 색상을 선택하고 영역을 클릭하여 색칠하세요
        </p>

        <div className="mt-3">
          <Palette nColors={4} sel={sel} onPick={setSel} />
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setCs({})}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            🔄 초기화
          </button>
          <button
            type="button"
            onClick={autoColor}
            className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
          >
            ⚡ 자동 색칠
          </button>
          <button
            type="button"
            onClick={() => setShowDemo((p) => !p)}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            💡 왜 3 색으로 불가능할까?
          </button>
        </div>

        <div className="mt-3">
          <StatusBar
            text={
              ok
                ? done
                  ? "🎉 4 색으로 완성! 이 지도는 3 색으로는 불가능합니다."
                  : "🖌️ 4 개 영역이 서로 모두 인접 — 최소 4 색이 필요합니다!"
                : "⚠️ 인접한 영역이 같은 색입니다 — 다시 골라보세요!"
            }
            kind={ok ? (done ? "ok" : "neutral") : "bad"}
          />
        </div>
        {done ? (
          <div className="mt-2">
            <Celebrate>
              🎉 4 색으로 완성! 이 지도는 3 색으로는 불가능합니다. 4 색 정리를
              체험했어요!
            </Celebrate>
          </div>
        ) : null}

        <div className="mt-3 rounded-xl bg-slate-950/60 p-2">
          <svg
            viewBox="0 0 500 400"
            className="mx-auto block w-full max-w-xl"
            aria-label="K4 평면 지도"
          >
            <rect x={0} y={0} width={500} height={400} fill="#12122a" rx={8} />
            {renderRegion("F4", "path", {
              fillRule: "evenodd",
              d: "M 5,5 L 495,5 L 495,395 L 5,395 Z M 250,35 L 75,365 L 425,365 Z",
            })}
            {renderRegion("F1", "polygon", { points: "250,35 250,220 75,365" })}
            {renderRegion("F2", "polygon", { points: "250,35 425,365 250,220" })}
            {renderRegion("F3", "polygon", { points: "250,220 75,365 425,365" })}
            <polygon
              points="250,35 75,365 425,365"
              fill="none"
              stroke="#7c6fff"
              strokeWidth={2}
              pointerEvents="none"
            />
            <line x1={250} y1={35} x2={250} y2={220} stroke="#7c6fff" strokeWidth={1.5} pointerEvents="none" />
            <line x1={75} y1={365} x2={250} y2={220} stroke="#7c6fff" strokeWidth={1.5} pointerEvents="none" />
            <line x1={425} y1={365} x2={250} y2={220} stroke="#7c6fff" strokeWidth={1.5} pointerEvents="none" />
            <text x={50} y={30} {...labelStyleT4(cs.F4)}>F4</text>
            <text x={185} y={235} {...labelStyleT4(cs.F1)}>F1</text>
            <text x={315} y={235} {...labelStyleT4(cs.F2)}>F2</text>
            <text x={250} y={335} {...labelStyleT4(cs.F3)}>F3</text>
            <text
              x={250}
              y={390}
              textAnchor="middle"
              fontSize={10}
              fill="#7c6fff88"
              pointerEvents="none"
            >
              F1 · F2 · F3 · F4 모두 서로 인접
            </text>
          </svg>
        </div>

        {showDemo ? (
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs leading-7 text-slate-200">
            🔍 <b className="text-amber-300">3 가지 색으로 시도하면?</b>
            <br />
            F1, F2, F3 은 서로 모두 인접하므로 3 가지 다른 색 (예: 빨강 · 청록 · 하늘)
            이 필요합니다.
            <br />
            F4 는 F1 · F2 · F3 모두와 인접하므로 이미 사용된 3 가지 색 이외의 색, 즉{" "}
            <b className="text-rose-300">4 번째 색</b> 이 반드시 필요합니다.
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHead>📊 4 색 정리와 그래프 이론</CardHead>
        <ul className="list-disc pl-5">
          <li>
            지도의 각 영역을 <b>꼭짓점 (vertex)</b>, 인접 관계를 <b>변 (edge)</b> 으로
            나타내면 <b className="text-cyan-300">그래프</b> 가 됩니다.
          </li>
          <li>
            지도 색칠 문제는 그래프의{" "}
            <b className="text-amber-300">채색 수 (chromatic number)</b> 를 구하는
            문제입니다.
          </li>
          <li>4 색 정리는 “평면 그래프의 채색 수는 항상 4 이하” 임을 의미합니다.</li>
          <li>
            3 차원 공간의 지도나 구멍이 있는 면 (토러스) 에서는 더 많은 색이 필요할 수
            있습니다.
          </li>
        </ul>
      </Card>

      <Card>
        <CardHead>🌍 실생활 속의 4 색 정리</CardHead>
        <ul className="list-disc pl-5">
          <li>
            📡 <b>이동통신 주파수 배치</b>: 인접 기지국이 같은 주파수를 쓰지 않도록 최소
            주파수 종류를 결정
          </li>
          <li>📅 <b>시간표 작성</b>: 같은 시간에 같은 자원을 쓰면 안 되는 스케줄링</li>
          <li>🧬 <b>유전자 지도</b>: DNA 서열 분석에서 겹치는 구간 배치</li>
          <li>🎨 <b>인쇄 기술</b>: 인쇄판 수를 최소화하는 색상 배치</li>
        </ul>
      </Card>

      <BlinkKeyframes />
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-200">
      {children}
    </div>
  );
}

function CardHead({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-base font-extrabold text-violet-200">{children}</p>
  );
}

function labelStyleT4(idx: number | undefined) {
  return {
    textAnchor: "middle" as const,
    fontSize: 16,
    fontWeight: "bold" as const,
    pointerEvents: "none" as const,
    fill:
      idx !== undefined
        ? isLight(COLORS[idx])
          ? "#222"
          : "#eef"
        : "#eef",
  };
}
