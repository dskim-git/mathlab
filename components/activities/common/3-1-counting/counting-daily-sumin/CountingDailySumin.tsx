"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

// ─── 성찰 (탐색 2개) ───────────────────────────────────────
const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "sum_vs_product",
    prompt:
      "ⓐ ‘버스 3 + 지하철 2 = 5 가지’ (합의 법칙) 와 ⓒ ‘셔츠 5 × 바지 2 = 10 가지’ (곱의 법칙) 는 서로 더하는지 곱하는지가 다릅니다. 두 상황의 결정적 차이는 무엇인가요? 새로운 일상 사례로 ‘이건 합 / 이건 곱’ 의 예를 하나씩 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: ⓐ 는 ‘버스를 타거나, 지하철을 타거나’ — 두 선택이 동시에 일어날 수 없으므로 (둘 중 하나만 일어남) 더한다. ⓒ 는 ‘셔츠도 입고, 바지도 입어야’ — 두 선택이 모두 함께 일어나므로 곱한다. 새 예: ‘점심으로 한식 4 가지 OR 양식 3 가지 중 한 끼’ = 4+3 (합) / ‘위로는 모자 3 종, 아래로는 신발 5 종 풀세트’ = 3×5 (곱).",
  },
  {
    id: "perm_vs_comb",
    prompt:
      "ⓑ ‘스탬프 8 곳 중 4 곳을 순서대로 방문’ → P(8, 4) = 1680 과 ⓓ ‘할 일 6 가지 중 꼭 해야 하는 3 가지를 고르기’ → C(6, 3) = 20 은 같은 ‘여러 개에서 몇 개 고른다’ 인데 답의 크기가 크게 다릅니다. 왜 그런가요? 새로운 일상 사례로 ‘이건 순열 / 이건 조합’ 의 예를 하나씩 들어 설명해 보세요.",
    kind: "text",
    placeholder:
      "예: ⓑ 는 ‘어느 곳을 + 어느 순서로’ 까지 모두 다른 결과로 친다 → 같은 4 곳을 골라도 방문 순서가 4! = 24 가지로 달라지므로 답이 4! 배 크다. ⓓ 는 ‘어느 일을’ 만 결정 → 순서 무관. 새 예: ‘마라톤 시상식 1·2·3 등 정하기 (8 명 중)’ = P(8,3) 순열 / ‘소모임 대표 3 명 선발 (8 명 중)’ = C(8,3) 조합. 순서 정보가 결과를 바꾸느냐가 기준.",
  },
];

// ─── 데이터 ────────────────────────────────────────────────
const BUSES = [
  { icon: "🚌", label: "1번 버스" },
  { icon: "🚎", label: "2번 버스" },
  { icon: "🚐", label: "3번 버스" },
];
const SUBWAYS = [
  { icon: "🚇", label: "A호선" },
  { icon: "🚊", label: "B호선" },
];

const PLACES = [
  { icon: "🌸", name: "벚꽃길" },
  { icon: "🏛️", name: "역사관" },
  { icon: "🎠", name: "놀이터" },
  { icon: "🦋", name: "나비원" },
  { icon: "⛲", name: "분수대" },
  { icon: "☕", name: "카페" },
  { icon: "🌿", name: "허브정원" },
  { icon: "🎡", name: "전망대" },
];

const SHIRTS = [
  { icon: "👕", name: "민트 셔츠" },
  { icon: "🩱", name: "스트라이프" },
  { icon: "🎽", name: "스포티" },
  { icon: "👔", name: "체크 셔츠" },
  { icon: "🥼", name: "자켓" },
];
const PANTS = [
  { icon: "👖", name: "청바지" },
  { icon: "🩳", name: "면바지" },
];

const TODOS = [
  { icon: "📖", name: "영어 단어 30개 외우기" },
  { icon: "🔢", name: "경우의 수 복습" },
  { icon: "🏃", name: "아침 10분 달리기" },
  { icon: "📚", name: "책 2권 읽기" },
  { icon: "😴", name: "12시 전에 잠자기" },
  { icon: "📋", name: "체험 보고서 쓰기" },
];

// 색상 토큰 (4 존)
type Zone = "a" | "b" | "c" | "d";
const TOK: Record<
  Zone,
  {
    chipBg: string;
    chipText: string;
    chipBorder: string;
    badgeBg: string;
    panelBorder: string;
    panelGlow: string;
    title: string;
  }
> = {
  a: {
    chipBg: "bg-amber-300/15",
    chipText: "text-amber-200",
    chipBorder: "border-amber-300/45",
    badgeBg: "bg-amber-500 text-white",
    panelBorder: "border-amber-300/45",
    panelGlow: "shadow-amber-500/20",
    title: "합의 법칙",
  },
  b: {
    chipBg: "bg-emerald-400/15",
    chipText: "text-emerald-200",
    chipBorder: "border-emerald-300/45",
    badgeBg: "bg-emerald-500 text-white",
    panelBorder: "border-emerald-300/45",
    panelGlow: "shadow-emerald-500/20",
    title: "순열",
  },
  c: {
    chipBg: "bg-violet-400/15",
    chipText: "text-violet-200",
    chipBorder: "border-violet-300/45",
    badgeBg: "bg-violet-500 text-white",
    panelBorder: "border-violet-300/45",
    panelGlow: "shadow-violet-500/20",
    title: "곱의 법칙",
  },
  d: {
    chipBg: "bg-rose-400/15",
    chipText: "text-rose-200",
    chipBorder: "border-rose-300/45",
    badgeBg: "bg-rose-500 text-white",
    panelBorder: "border-rose-300/45",
    panelGlow: "shadow-rose-500/20",
    title: "조합",
  },
};

// ─── 메인 ─────────────────────────────────────────────────
export default function CountingDailySumin() {
  const [openZone, setOpenZone] = useState<Zone | null>(null);
  const [opened, setOpened] = useState<Record<Zone, boolean>>({
    a: false,
    b: false,
    c: false,
    d: false,
  });
  const panelRefs = {
    a: useRef<HTMLDivElement>(null),
    b: useRef<HTMLDivElement>(null),
    c: useRef<HTMLDivElement>(null),
    d: useRef<HTMLDivElement>(null),
  };

  function toggleZone(z: Zone) {
    if (openZone === z) {
      setOpenZone(null);
      return;
    }
    setOpenZone(z);
    setOpened((p) => ({ ...p, [z]: true }));
    // 패널 스크롤
    setTimeout(() => {
      panelRefs[z].current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 공통수학1</p>
        <h3 className="mt-2 text-2xl font-bold">📱 경우의 수로 바라본 하루</h3>
        <p className="mt-2 leading-7 text-slate-300">
          수민이의 하루 일기 속에서 경우의 수를 찾아봅시다. 형광펜으로 표시된 부분{" "}
          <ZoneChip zone="a">ⓐ</ZoneChip> <ZoneChip zone="b">ⓑ</ZoneChip>{" "}
          <ZoneChip zone="c">ⓒ</ZoneChip> <ZoneChip zone="d">ⓓ</ZoneChip> 를 클릭하면
          문제 패널이 열려요.
        </p>
      </div>

      {/* 태블릿 */}
      <Tablet
        onZone={toggleZone}
        openZone={openZone}
      />

      {/* 패널 영역 */}
      <div className="mt-5 space-y-3">
        <div ref={panelRefs.a}>
          <PanelA open={openZone === "a"} />
        </div>
        <div ref={panelRefs.b}>
          <PanelB open={openZone === "b"} />
        </div>
        <div ref={panelRefs.c}>
          <PanelC open={openZone === "c"} />
        </div>
        <div ref={panelRefs.d}>
          <PanelD open={openZone === "d"} />
        </div>
      </div>

      {/* 요약 */}
      <Summary opened={opened} />

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}

// ─── 태블릿 ───────────────────────────────────────────────
function Tablet({
  onZone,
  openZone,
}: {
  onZone: (z: Zone) => void;
  openZone: Zone | null;
}) {
  return (
    <div className="mt-5 rounded-2xl border-4 border-slate-700 bg-slate-900 p-3 shadow-2xl">
      {/* 상단바 */}
      <div className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] text-slate-300">
        <span>오전 10:30 · ○월 ○일 ○요일</span>
        <span>📶 100% 🔋</span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-stone-300 p-3 text-slate-800 lg:grid-cols-[260px_1fr]">
        {/* 좌: 캘린더 + Todo */}
        <div className="rounded-xl bg-stone-100 p-3 shadow-sm">
          <p className="text-center text-base font-bold text-slate-700">5 May</p>
          <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[11px]">
            {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
              <div
                key={d}
                className={
                  "py-1 font-bold " +
                  (i === 0 ? "text-rose-500" : i === 6 ? "text-sky-500" : "text-slate-600")
                }
              >
                {d}
              </div>
            ))}
            {/* 1: 금, 2: 토 (5일 시작이 금요일 가정으로 원본 따름) */}
            <Cell />
            <Cell />
            <Cell />
            <Cell />
            <Cell />
            <Cell>1</Cell>
            <Cell color="sat">2</Cell>
            <Cell color="sun">4</Cell>
            <Cell>5</Cell>
            <Cell>6</Cell>
            <Cell>7</Cell>
            <Cell>8</Cell>
            <Cell>9</Cell>
            <Cell color="sat">10</Cell>
            <Cell color="sun">11</Cell>
            <Cell>12</Cell>
            <Cell>13</Cell>
            <Cell>14</Cell>
            <Cell>15</Cell>
            <Cell>16</Cell>
            <Cell color="sat">17</Cell>
            <Cell color="sun">18</Cell>
            <Cell>19</Cell>
            <Cell>20</Cell>
            <Cell>21</Cell>
            <Cell>22</Cell>
            <Cell>23</Cell>
            <Cell color="sat">24</Cell>
            <Cell color="sun">25</Cell>
            <Cell>26</Cell>
            <Cell>27</Cell>
            <Cell>28</Cell>
            <Cell>29</Cell>
            <Cell today>30</Cell>
            <Cell color="sat">31</Cell>
          </div>

          <p className="mt-3 text-sm font-extrabold text-emerald-700">To Do List</p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-slate-700">
            {TODOS.map((t, i) => (
              <li key={i}>
                <span className="mr-1 text-emerald-500">✓</span>
                {t.name}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">할 일이 많으니까</p>
          <Hilite
            zone="d"
            onClick={() => onZone("d")}
            active={openZone === "d"}
            className="mt-1 block w-full text-left"
          >
            ⓓ 이 중에서 꼭 해야 하는 일을 3 개 골라서 별표를 해 놓자!
          </Hilite>
        </div>

        {/* 우: 일기 */}
        <div className="rounded-xl bg-stone-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 rounded-lg bg-amber-100/70 px-3 py-2">
            <span className="text-2xl">🌞</span>
            <span className="text-sm font-extrabold text-amber-700">
              Good
              <br />
              Morning
            </span>
          </div>
          <p className="mt-3 text-sm leading-8 text-slate-700">
            내일은 현장 학습! 담임 선생님께서 공원 안내소로 늦지 않게 오라고 하셨다.
            찾아보니{" "}
            <Hilite
              zone="a"
              onClick={() => onZone("a")}
              active={openZone === "a"}
            >
              ⓐ 우리 집에서 공원까지 바로 가는 버스 노선이 3 개 있고, 지하철 노선도 2 개
              있네. 뭐 타고 갈까?
            </Hilite>
            <br />
            <br />이 공원은{" "}
            <Hilite
              zone="b"
              onClick={() => onZone("b")}
              active={openZone === "b"}
            >
              ⓑ 8 개의 스탬프 찍는 곳이 있다고 한다. 선생님께서 모둠별로 4 곳을 정해서
              방문하고 순서대로 스탬프를 찍어와야 한다고 하셨다.
            </Hilite>{" "}
            우리 모둠은 아직 안 정했는데, 모둠장에게 연락해서 어디를 어떤 순서로 같이
            이야기해 봐야겠다.
            <br />
            <br />
            내일 친구들이랑 만날 생각하니 기대된다. 멋지게 꾸미고 가야지!{" "}
            <Hilite
              zone="c"
              onClick={() => onZone("c")}
              active={openZone === "c"}
            >
              ⓒ 내일은 어떻게 입고 나갈까? 상의는 셔츠 5 종류 중에 하나 입으면 되고, 바지는
              청바지 · 면바지 둘 중에서 하나를 고르면 될 것 같은데?
            </Hilite>{" "}
            🧥👖
          </p>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-slate-400">
        💡 색칠된 부분 (<ZoneChip zone="a">ⓐ</ZoneChip>{" "}
        <ZoneChip zone="b">ⓑ</ZoneChip> <ZoneChip zone="c">ⓒ</ZoneChip>{" "}
        <ZoneChip zone="d">ⓓ</ZoneChip>) 을 클릭하면 해당 문제 패널이 펼쳐집니다.
      </p>
    </div>
  );
}

function Cell({
  children,
  color,
  today,
}: {
  children?: ReactNode;
  color?: "sun" | "sat";
  today?: boolean;
}) {
  if (today)
    return (
      <div className="flex items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 py-1 text-[12px] font-extrabold text-white shadow">
        {children}
      </div>
    );
  return (
    <div
      className={
        "py-1 " +
        (color === "sun"
          ? "text-rose-500"
          : color === "sat"
            ? "text-sky-500"
            : "text-slate-600")
      }
    >
      {children}
    </div>
  );
}

function ZoneChip({ zone, children }: { zone: Zone; children: ReactNode }) {
  const t = TOK[zone];
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${t.chipBg} ${t.chipText} ${t.chipBorder}`}
    >
      {children}
    </span>
  );
}

function Hilite({
  zone,
  onClick,
  active,
  children,
  className,
}: {
  zone: Zone;
  onClick: () => void;
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  // 라이트 톤(태블릿 흰 화면 안)
  const palette: Record<Zone, string> = {
    a: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300 ring-amber-300",
    b: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300 ring-emerald-300",
    c: "bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-300 ring-violet-300",
    d: "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-300 ring-rose-300",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "cursor-pointer rounded-md border-b-2 px-1 py-0.5 text-left font-bold transition " +
        palette[zone] +
        (active ? " ring-2" : "") +
        (className ? " " + className : "")
      }
    >
      {children}
    </button>
  );
}

// ─── 공용 패널 컨테이너 ─────────────────────────────────────
function PanelShell({
  zone,
  badge,
  title,
  open,
  children,
}: {
  zone: Zone;
  badge: string;
  title: ReactNode;
  open: boolean;
  children: ReactNode;
}) {
  if (!open) return null;
  const t = TOK[zone];
  return (
    <div
      className={`rounded-2xl border-2 ${t.panelBorder} bg-slate-900/70 p-5 shadow-xl ${t.panelGlow}`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-base font-extrabold ${t.badgeBg}`}
        >
          {badge}
        </span>
        <p className="text-base font-extrabold text-slate-100">{title}</p>
        <span
          className={`ml-auto rounded-md border px-2 py-0.5 text-[11px] font-bold ${t.chipBg} ${t.chipText} ${t.chipBorder}`}
        >
          {t.title}
        </span>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function ResultBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-300/45 bg-amber-400/[0.08] px-3 py-3 text-center text-sm leading-7 text-amber-50">
      {children}
    </div>
  );
}

function HintRow({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-cyan-400/30 bg-cyan-400/[0.07] px-3 py-2 text-center text-xs text-cyan-100">
      {children}
    </p>
  );
}

function ActionBar({
  onSolToggle,
  showSol,
  onReset,
}: {
  onSolToggle: () => void;
  showSol: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2 pt-1">
      <button
        type="button"
        onClick={onSolToggle}
        className="rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
      >
        📐 {showSol ? "풀이 닫기" : "풀이 보기"}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
      >
        ↺ 초기화
      </button>
    </div>
  );
}

function SolBox({ children, show }: { children: ReactNode; show: boolean }) {
  if (!show) return null;
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/60 p-3">
      {children}
    </div>
  );
}

function SolStep({ num, children }: { num: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs leading-7 text-slate-200">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/25 text-[11px] font-bold text-violet-200">
        {num}
      </span>
      <div>{children}</div>
    </div>
  );
}

function KeyLaw({ children }: { children: ReactNode }) {
  return <b className="text-amber-300">{children}</b>;
}

// ═══════════════════════════════════════════════════════════
//  PANEL A — 교통수단 (3 + 2 = 5, 합의 법칙)
// ═══════════════════════════════════════════════════════════

function PanelA({ open }: { open: boolean }) {
  const [sel, setSel] = useState<{ type: "bus" | "sub"; idx: number } | null>(null);
  const [showSol, setShowSol] = useState(false);

  function reset() {
    setSel(null);
    setShowSol(false);
  }

  return (
    <PanelShell
      zone="a"
      badge="ⓐ"
      title="집에서 공원까지 가는 교통수단을 고르는 경우의 수"
      open={open}
    >
      <HintRow>버스나 지하철 중 하나를 클릭해보세요! 🚌🚇</HintRow>

      <p className="text-xs font-bold text-amber-300">🚌 버스 노선 (3 가지)</p>
      <div className="grid grid-cols-3 gap-2">
        {BUSES.map((b, i) => {
          const isOn = sel?.type === "bus" && sel.idx === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSel({ type: "bus", idx: i })}
              className={
                "flex h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 text-xs font-bold transition " +
                (isOn
                  ? "border-amber-300/60 bg-amber-300/20 text-amber-100"
                  : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="text-4xl leading-none">{b.icon}</span>
              {b.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs font-bold text-sky-300">🚇 지하철 노선 (2 가지)</p>
      <div className="grid grid-cols-2 gap-2">
        {SUBWAYS.map((s, i) => {
          const isOn = sel?.type === "sub" && sel.idx === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSel({ type: "sub", idx: i })}
              className={
                "flex h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 text-xs font-bold transition " +
                (isOn
                  ? "border-sky-300/60 bg-sky-300/20 text-sky-100"
                  : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="text-4xl leading-none">{s.icon}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      <ResultBox>
        {sel ? (
          <>
            {(sel.type === "bus" ? BUSES : SUBWAYS)[sel.idx].icon}{" "}
            <strong>
              {(sel.type === "bus" ? BUSES : SUBWAYS)[sel.idx].label}
            </strong>{" "}
            을 선택했어요!
            <br />
            <span className="font-mono text-xs">
              버스 3 가지 + 지하철 2 가지 중 하나 →{" "}
            </span>
            <span className="font-mono text-lg font-extrabold text-amber-300">
              5 가지
            </span>
          </>
        ) : (
          <span className="text-slate-400">교통수단을 하나 선택해보세요</span>
        )}
      </ResultBox>

      <ActionBar
        onSolToggle={() => setShowSol((s) => !s)}
        showSol={showSol}
        onReset={reset}
      />

      <SolBox show={showSol}>
        <SolStep num="1">
          버스와 지하철은 <KeyLaw>동시에 탈 수 없어요</KeyLaw> →{" "}
          <KeyLaw>합의 법칙</KeyLaw> 사용!
        </SolStep>
        <SolStep num="2">
          버스 노선 <strong>3 가지</strong>, 지하철 노선 <strong>2 가지</strong>
        </SolStep>
        <SolStep num="3">
          경우의 수 = 3 + 2 ={" "}
          <span className="font-mono text-base font-extrabold text-amber-300">5 가지</span>
        </SolStep>
        <SolStep num="💡">
          <KeyLaw>합의 법칙: A 또는 B 중 하나를 선택 → m + n 가지</KeyLaw>
        </SolStep>
      </SolBox>
    </PanelShell>
  );
}

// ═══════════════════════════════════════════════════════════
//  PANEL B — 스탬프 8 중 4 곳 순서 (P(8,4) = 1680, 순열)
// ═══════════════════════════════════════════════════════════

function PanelB({ open }: { open: boolean }) {
  const [seq, setSeq] = useState<number[]>([]);
  const [showSol, setShowSol] = useState(false);

  function click(i: number) {
    const pos = seq.indexOf(i);
    if (pos >= 0) setSeq(seq.filter((x) => x !== i));
    else if (seq.length < 4) setSeq([...seq, i]);
  }
  function reset() {
    setSeq([]);
    setShowSol(false);
  }

  return (
    <PanelShell
      zone="b"
      badge="ⓑ"
      title="8 곳의 장소 중에서 4 곳을 선택하여 방문하는 순서를 정하는 경우의 수"
      open={open}
    >
      <HintRow>방문할 4 곳을 순서대로 클릭하세요! 순서가 다르면 다른 경우예요 🗺️</HintRow>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PLACES.map((p, i) => {
          const pos = seq.indexOf(i);
          const sel = pos >= 0;
          const dis = !sel && seq.length >= 4;
          return (
            <button
              key={i}
              type="button"
              onClick={() => !dis && click(i)}
              disabled={dis}
              className={
                "relative flex h-28 flex-col items-center justify-center gap-1.5 rounded-lg border-2 text-xs font-bold transition " +
                (sel
                  ? "border-emerald-300/60 bg-emerald-300/20 text-emerald-100"
                  : dis
                    ? "border-white/10 bg-white/[0.02] text-slate-600"
                    : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="text-4xl leading-none">{p.icon}</span>
              {p.name}
              {sel ? (
                <span className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-extrabold text-slate-900">
                  {pos + 1}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <ResultBox>
        {seq.length === 4 ? (
          <>
            {seq.map((i) => `${PLACES[i].icon} ${PLACES[i].name}`).join(" → ")}
            <br />
            <span className="font-mono text-xs">
              P(8, 4) = 8 × 7 × 6 × 5 ={" "}
            </span>
            <span className="font-mono text-lg font-extrabold text-amber-300">
              1680 가지
            </span>{" "}
            중 하나!
          </>
        ) : seq.length > 0 ? (
          <span className="text-slate-300">
            {seq.length} / 4 곳 선택됨 — {4 - seq.length} 곳 더 선택하세요
          </span>
        ) : (
          <span className="text-slate-400">장소를 순서대로 4 곳 클릭해보세요</span>
        )}
      </ResultBox>

      <ActionBar
        onSolToggle={() => setShowSol((s) => !s)}
        showSol={showSol}
        onReset={reset}
      />

      <SolBox show={showSol}>
        <SolStep num="1">
          <KeyLaw>순서가 중요</KeyLaw> 하니까 <KeyLaw>순열 (P)</KeyLaw> 을 씁니다!
        </SolStep>
        <SolStep num="2">
          1 번째 장소 <strong>8 가지</strong> → 2 번째 <strong>7 가지</strong> → 3 번째{" "}
          <strong>6 가지</strong> → 4 번째 <strong>5 가지</strong>
        </SolStep>
        <SolStep num="3">
          P(8, 4) = 8 × 7 × 6 × 5 ={" "}
          <span className="font-mono text-base font-extrabold text-amber-300">
            1680 가지
          </span>
        </SolStep>
        <SolStep num="💡">
          <KeyLaw>순열: n 개 중 r 개를 순서 있게 나열 → P(n, r) = n! ÷ (n − r)!</KeyLaw>
        </SolStep>
      </SolBox>
    </PanelShell>
  );
}

// ═══════════════════════════════════════════════════════════
//  PANEL C — 셔츠 5 × 바지 2 = 10 (곱의 법칙)
// ═══════════════════════════════════════════════════════════

function PanelC({ open }: { open: boolean }) {
  const [sh, setSh] = useState<number | null>(null);
  const [pt, setPt] = useState<number | null>(null);
  const [showSol, setShowSol] = useState(false);

  function reset() {
    setSh(null);
    setPt(null);
    setShowSol(false);
  }

  return (
    <PanelShell
      zone="c"
      badge="ⓒ"
      title="셔츠 5 종류와 바지 2 종류 중에서 각각 하나씩 택하여 입는 경우의 수"
      open={open}
    >
      <HintRow>셔츠 하나, 바지 하나를 골라 오늘의 코디를 완성해보세요! 👗</HintRow>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <div>
          <p className="text-xs font-bold text-violet-300">👕 셔츠 (5 종류)</p>
          <div className="mt-1 grid grid-cols-5 gap-2">
            {SHIRTS.map((s, i) => {
              const isOn = sh === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSh(i)}
                  title={s.name}
                  className={
                    "flex h-20 items-center justify-center rounded-lg border-2 text-4xl transition " +
                    (isOn
                      ? "border-violet-300/60 bg-violet-300/20"
                      : "border-white/15 bg-white/5 hover:bg-white/10")
                  }
                >
                  {s.icon}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-cyan-300">👖 바지 (2 종류)</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {PANTS.map((p, i) => {
              const isOn = pt === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPt(i)}
                  className={
                    "flex h-20 flex-col items-center justify-center gap-1 rounded-lg border-2 text-[11px] font-bold transition " +
                    (isOn
                      ? "border-cyan-300/60 bg-cyan-300/20 text-cyan-100"
                      : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
                  }
                >
                  <span className="text-3xl leading-none">{p.icon}</span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ResultBox>
        {sh !== null && pt !== null ? (
          <>
            {SHIRTS[sh].icon} {SHIRTS[sh].name} &nbsp;+&nbsp; {PANTS[pt].icon}{" "}
            {PANTS[pt].name}
            <br />
            <span className="font-mono text-xs">
              셔츠 5 가지 × 바지 2 가지 ={" "}
            </span>
            <span className="font-mono text-lg font-extrabold text-amber-300">
              10 가지
            </span>{" "}
            코디 중 하나!
          </>
        ) : sh !== null ? (
          <span className="text-slate-300">
            {SHIRTS[sh].icon} 셔츠 선택 완료! 이제 바지를 골라보세요 👖
          </span>
        ) : pt !== null ? (
          <span className="text-slate-300">
            {PANTS[pt].icon} 바지 선택 완료! 이제 셔츠를 골라보세요 👕
          </span>
        ) : (
          <span className="text-slate-400">셔츠와 바지를 각각 하나씩 선택해보세요</span>
        )}
      </ResultBox>

      <ActionBar
        onSolToggle={() => setShowSol((s) => !s)}
        showSol={showSol}
        onReset={reset}
      />

      <SolBox show={showSol}>
        <SolStep num="1">
          셔츠 고르기와 바지 고르기는 <KeyLaw>동시에 일어나요</KeyLaw> →{" "}
          <KeyLaw>곱의 법칙</KeyLaw>!
        </SolStep>
        <SolStep num="2">
          셔츠 <strong>5 가지</strong>, 바지 <strong>2 가지</strong>
        </SolStep>
        <SolStep num="3">
          경우의 수 = 5 × 2 ={" "}
          <span className="font-mono text-base font-extrabold text-amber-300">
            10 가지
          </span>
        </SolStep>
        <SolStep num="💡">
          <KeyLaw>곱의 법칙: A 이고 B 일 때 (둘 다 선택) → m × n 가지</KeyLaw>
        </SolStep>
      </SolBox>
    </PanelShell>
  );
}

// ═══════════════════════════════════════════════════════════
//  PANEL D — 할 일 6 중 3 (C(6,3) = 20, 조합)
// ═══════════════════════════════════════════════════════════

function PanelD({ open }: { open: boolean }) {
  const [sel, setSel] = useState<number[]>([]);
  const [showSol, setShowSol] = useState(false);

  function click(i: number) {
    if (sel.includes(i)) setSel(sel.filter((x) => x !== i));
    else if (sel.length < 3) setSel([...sel, i]);
  }
  function reset() {
    setSel([]);
    setShowSol(false);
  }

  return (
    <PanelShell
      zone="d"
      badge="ⓓ"
      title="할 일 목록 6 가지 중에서 꼭 해야 하는 목록을 3 가지 고르는 경우의 수"
      open={open}
    >
      <HintRow>반드시 해야 할 일 3 가지를 골라보세요! 순서는 상관없어요 ✅</HintRow>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {TODOS.map((t, i) => {
          const isOn = sel.includes(i);
          const dis = !isOn && sel.length >= 3;
          return (
            <button
              key={i}
              type="button"
              onClick={() => !dis && click(i)}
              disabled={dis}
              className={
                "relative flex h-24 flex-col items-center justify-center gap-1.5 rounded-lg border-2 px-2 text-[11px] font-bold transition " +
                (isOn
                  ? "border-rose-300/60 bg-rose-300/20 text-rose-100"
                  : dis
                    ? "border-white/10 bg-white/[0.02] text-slate-600"
                    : "border-white/15 bg-white/5 text-slate-200 hover:bg-white/10")
              }
            >
              <span className="text-4xl leading-none">{t.icon}</span>
              <span className="text-center text-[11px] leading-tight">
                {t.name}
              </span>
              {isOn ? (
                <span className="absolute right-1 top-1 text-sm text-amber-300">★</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <ResultBox>
        {sel.length === 3 ? (
          <>
            {sel.map((i) => `${TODOS[i].icon} ${TODOS[i].name}`).join(", ")}
            <br />
            <span className="font-mono text-xs">C(6, 3) = </span>
            <span className="font-mono text-lg font-extrabold text-amber-300">
              20 가지
            </span>{" "}
            중 하나!
          </>
        ) : sel.length > 0 ? (
          <span className="text-slate-300">
            {sel.length} / 3 개 선택됨 — {3 - sel.length} 개 더 선택하세요
          </span>
        ) : (
          <span className="text-slate-400">할 일 3 가지를 선택해보세요</span>
        )}
      </ResultBox>

      <ActionBar
        onSolToggle={() => setShowSol((s) => !s)}
        showSol={showSol}
        onReset={reset}
      />

      <SolBox show={showSol}>
        <SolStep num="1">
          <KeyLaw>순서 없이 고르기</KeyLaw> 만 하니까 <KeyLaw>조합 (C)</KeyLaw> 을 씁니다!
        </SolStep>
        <SolStep num="2">6 가지 중 3 가지를 순서 없이 선택</SolStep>
        <SolStep num="3">
          C(6, 3) = 6! ÷ (3! × 3!) = 720 ÷ 36 ={" "}
          <span className="font-mono text-base font-extrabold text-amber-300">
            20 가지
          </span>
        </SolStep>
        <SolStep num="💡">
          <KeyLaw>조합: n 개 중 r 개를 순서 없이 선택 → C(n, r) = n! ÷ (r! × (n − r)!)</KeyLaw>
        </SolStep>
      </SolBox>
    </PanelShell>
  );
}

// ─── 요약 ─────────────────────────────────────────────────
function Summary({ opened }: { opened: Record<Zone, boolean> }) {
  const rows: { zone: Zone; lbl: string; ans: string; frm: string }[] = [
    { zone: "a", lbl: "ⓐ 교통수단 선택", ans: "5 가지", frm: "3 + 2 = 5  (합의 법칙)" },
    { zone: "b", lbl: "ⓑ 스탬프 장소 순서", ans: "1680 가지", frm: "P(8, 4) = 8×7×6×5" },
    { zone: "c", lbl: "ⓒ 옷 코디 선택", ans: "10 가지", frm: "5 × 2 = 10  (곱의 법칙)" },
    { zone: "d", lbl: "ⓓ 할 일 고르기", ans: "20 가지", frm: "C(6, 3) = 20" },
  ];
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm font-extrabold text-cyan-300">
        📊 수민이의 하루 — 경우의 수 한눈에 보기
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => {
          const t = TOK[r.zone];
          const done = opened[r.zone];
          return (
            <div
              key={r.zone}
              className={
                "rounded-xl border px-3 py-3 text-center transition " +
                (done
                  ? `${t.panelBorder} ${t.chipBg}`
                  : "border-white/10 bg-white/[0.02] opacity-70")
              }
            >
              <p className={`text-[11px] font-bold ${t.chipText}`}>{r.lbl}</p>
              <p className="mt-1 font-mono text-xl font-extrabold text-amber-300">
                {r.ans}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">{r.frm}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
