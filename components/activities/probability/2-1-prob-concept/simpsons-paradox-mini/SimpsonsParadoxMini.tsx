"use client";

import { useMemo, useState } from "react";
import ReflectionForm from "@/components/activities/ReflectionForm";
import type { ReflectionQuestion } from "@/lib/activities/reflection";

/* ──────────────────────────────────────────────────────────────
   🔀 심프슨의 역설  (3 tabs)
   1) 야구 투수 — 단계적 공개 + 예측 투표
   2) 다양한 예시 — 학과 입학률(남vs여) + 신약 임상(A vs B)
   3) 나만의 역설 만들기 — 인터랙티브 슬라이더 챌린지
   ────────────────────────────────────────────────────────────── */

// ============================================================
// 공통 보조
// ============================================================

function pct(num: number, den: number): number {
  return den === 0 ? 0 : (num / den) * 100;
}
function fmt(p: number, digits = 2): string {
  return p.toFixed(digits) + "%";
}

/** 진행 막대 — SVG 바(가로 늘림 OK) + HTML 라벨 오버레이(글자 왜곡 방지).
 *  value 0~100(%), fill hex, heightClass 로 높이 조절. */
function BarSVG({
  value, fill, label, heightClass = "h-[22px]",
}: { value: number; fill: string; label?: string; heightClass?: string }) {
  const w = Math.max(0, Math.min(100, value));
  return (
    <div className={`relative w-full overflow-hidden rounded-md bg-white/[0.07] ${heightClass}`}>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="block h-full w-full" aria-hidden="true">
        <rect x={0} y={0} width={w} height={24} fill={fill} className="transition-all duration-500" />
      </svg>
      {label ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-end pr-2 text-[11px] font-bold text-white">
          {label}
        </span>
      ) : null}
    </div>
  );
}

// ============================================================
// 탭 1 — ⚾ 야구 투수 (단계적 공개)
// ============================================================

type BaseballPhase = 0 | 1 | 2 | 3; // s0=전반기 / s1=후반기+예측 / s2=대기 / s3=결과

const BASEBALL = {
  first: { a: { w: 5, l: 2 }, b: { w: 3, l: 1 } },
  second: { a: { w: 4, l: 3 }, b: { w: 7, l: 5 } },
};
const BA_FIRST_A = pct(BASEBALL.first.a.w, BASEBALL.first.a.w + BASEBALL.first.a.l);   // 71.43
const BA_FIRST_B = pct(BASEBALL.first.b.w, BASEBALL.first.b.w + BASEBALL.first.b.l);   // 75.00
const BA_SECOND_A = pct(BASEBALL.second.a.w, BASEBALL.second.a.w + BASEBALL.second.a.l); // 57.14
const BA_SECOND_B = pct(BASEBALL.second.b.w, BASEBALL.second.b.w + BASEBALL.second.b.l); // 58.33
const BA_TOTAL_A_W = BASEBALL.first.a.w + BASEBALL.second.a.w; // 9
const BA_TOTAL_A_L = BASEBALL.first.a.l + BASEBALL.second.a.l; // 5
const BA_TOTAL_B_W = BASEBALL.first.b.w + BASEBALL.second.b.w; // 10
const BA_TOTAL_B_L = BASEBALL.first.b.l + BASEBALL.second.b.l; // 6
const BA_TOTAL_A = pct(BA_TOTAL_A_W, BA_TOTAL_A_W + BA_TOTAL_A_L); // 64.29
const BA_TOTAL_B = pct(BA_TOTAL_B_W, BA_TOTAL_B_W + BA_TOTAL_B_L); // 62.50

const COLOR_A = "#a78bfa"; // violet-400
const COLOR_B = "#22d3ee"; // cyan-400

function BaseballTab() {
  const [phase, setPhase] = useState<BaseballPhase>(0);
  const [vote, setVote] = useState<"A" | "B" | null>(null);

  function castVote(c: "A" | "B") {
    if (vote) return;
    setVote(c);
    setPhase(2);
  }
  function reset() {
    setPhase(0);
    setVote(null);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-violet-700/10 p-4 text-center">
        <h4 className="text-lg font-bold text-violet-300">⚾ 야구 투수 A vs B — 직관에 도전!</h4>
        <p className="mt-1 text-sm leading-6 text-slate-300">
          전반기에도, 후반기에도 투수 B가 더 높은 승률을 기록했습니다.
          <br />
          그렇다면 시즌 전체에서는 누가 더 잘한 투수일까요?
        </p>
      </div>

      <ProgressDots count={4} current={phase} />

      {/* Step 1: 전반기 */}
      <StepCard active={phase === 0} title="📊 Step 1 — 전반기 성적">
        <BaseballTable rows={["first"]} />
        <div className="mt-2 space-y-1.5">
          <BarRow label="투수 A" labelColor="text-violet-300" value={BA_FIRST_A} fill={COLOR_A} />
          <BarRow label="투수 B" labelColor="text-cyan-300"   value={BA_FIRST_B} fill={COLOR_B} />
        </div>
        <p className="mt-2 text-center text-xs">
          <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1.5">
            <span className="text-slate-400">전반기 :</span>
            <strong className="text-cyan-300">투수 B 우세</strong>
            <span className="text-slate-500">(+{(BA_FIRST_B - BA_FIRST_A).toFixed(2)}%p)</span>
          </span>
        </p>
        {phase === 0 ? (
          <div className="mt-3 text-center">
            <NextBtn onClick={() => setPhase(1)}>후반기 성적 보기 →</NextBtn>
          </div>
        ) : null}
      </StepCard>

      {/* Step 2: 후반기 + 예측 */}
      {phase >= 1 ? (
        <StepCard active={phase === 1} title="📊 Step 2 — 후반기 성적">
          <BaseballTable rows={["first", "second"]} />
          <div className="mt-2 text-[11px] text-slate-500">후반기 승률 비교</div>
          <div className="mt-1 space-y-1.5">
            <BarRow label="투수 A" labelColor="text-violet-300" value={BA_SECOND_A} fill={COLOR_A} />
            <BarRow label="투수 B" labelColor="text-cyan-300"   value={BA_SECOND_B} fill={COLOR_B} />
          </div>
          <p className="mt-2 text-center text-xs">
            <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-1.5">
              <span className="text-slate-400">후반기도 :</span>
              <strong className="text-cyan-300">투수 B 우세</strong>
              <span className="text-slate-500">(+{(BA_SECOND_B - BA_SECOND_A).toFixed(2)}%p)</span>
            </span>
          </p>

          {phase === 1 ? (
            <div className="mt-4 text-center">
              <p className="mb-2 text-sm font-bold text-slate-100">
                🤔 그렇다면 시즌 전체에서는 누가 더 높은 승률일까요?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <VoteBtn color="violet" onClick={() => castVote("A")}>투수 A가 더 높을 것 같다!</VoteBtn>
                <VoteBtn color="cyan"   onClick={() => castVote("B")}>투수 B가 더 높을 것 같다!</VoteBtn>
              </div>
            </div>
          ) : null}
        </StepCard>
      ) : null}

      {/* Step 3: 예측 후 대기 */}
      {phase >= 2 ? (
        <StepCard active={phase === 2}>
          <div className="py-1 text-center">
            <p className="text-sm text-slate-100">
              여러분의 예측: <strong className="text-amber-300">투수 {vote ?? "?"}</strong>가 전체에서 더 높다!
            </p>
            <p className="mt-1 text-xs text-slate-400">과연 예측이 맞을까요? 전체 시즌 성적을 확인해 봅시다!</p>
            {phase === 2 ? (
              <div className="mt-3">
                <NextBtn onClick={() => setPhase(3)} big>🎬 전체 시즌 결과 공개!</NextBtn>
              </div>
            ) : null}
          </div>
        </StepCard>
      ) : null}

      {/* Step 4: 결과 공개 */}
      {phase >= 3 ? (
        <StepCard active={phase === 3} title="🎯 Step 4 — 전체 시즌 최종 성적">
          <BaseballTable rows={["first", "second", "total"]} />

          <div className="mt-3 rounded-xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-400/15 to-amber-500/10 p-3 text-center">
            <h5 className="text-base font-bold text-amber-300">
              😱 반전! 시즌 전체에서는 <span className="text-emerald-300">투수 A</span>가 더 높다!
            </h5>
            <p className="mt-1 text-xs leading-6 text-slate-200">
              전반기·후반기 모두 B가 우세였는데, 시즌 전체에서는 A의 승률이 더 높습니다!
              <br />
              ({fmt(BA_TOTAL_A)} {">"} {fmt(BA_TOTAL_B)})
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ResultBox name="투수 A" rate={fmt(BA_TOTAL_A)} sub={`${BA_TOTAL_A_W}승 ${BA_TOTAL_A_L}패`} badge="🏆 전체 시즌 1위" winner colorName="emerald" />
            <span className="px-1 text-lg text-slate-500">vs</span>
            <ResultBox name="투수 B" rate={fmt(BA_TOTAL_B)} sub={`${BA_TOTAL_B_W}승 ${BA_TOTAL_B_L}패`} badge="전반기·후반기 1위" colorName="cyan" />
          </div>

          <div className="mt-3 rounded-r-xl border-l-4 border-violet-400 bg-white/[0.03] p-3">
            <h5 className="text-sm font-bold text-violet-300">💡 왜 이런 역설이 생길까요? — 가중치의 마법</h5>
            <p className="mt-1 text-xs leading-6 text-slate-300">
              핵심은 <strong className="text-slate-100">그룹별 경기 수(가중치)가 서로 다르기 때문</strong>입니다.
            </p>
            <ul className="mt-1 list-disc pl-5 text-xs leading-6 text-slate-300">
              <li>투수 A: <span className="text-violet-300">전반기 7경기</span>(고승률 구간) + 후반기 7경기 → 균등하게 분배</li>
              <li>투수 B: 전반기 4경기 + <span className="text-cyan-300">후반기 12경기</span>(저승률 구간) → 저승률 구간 집중</li>
            </ul>
            <p className="mt-2 text-xs leading-6 text-slate-300">
              B는 승률이 낮은 후반기에 훨씬 많이 등판해 전체 승률이 끌어내려졌습니다. 이것이{" "}
              <strong className="text-amber-300">심프슨의 역설</strong>입니다!
            </p>
          </div>

          <div className="mt-3 rounded-lg border border-white/10 bg-black/35 p-3 text-center font-mono text-xs leading-7 text-amber-100">
            b/a {">"} d/c &nbsp;&nbsp;이고&nbsp;&nbsp; f/e {">"} h/g &nbsp;&nbsp;이어도
            <br />
            <span className="text-red-300">(b+f)/(a+e) {">"} (d+h)/(c+g) 가 항상 성립하지는 않는다!</span>
          </div>

          <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-400/[0.08] p-3 text-xs leading-6 text-slate-300">
            <strong className="text-violet-300">심프슨의 역설 (Simpson&apos;s Paradox)</strong>
            <br />
            1951년 영국 통계학자 에드워드 심프슨이 논문으로 정리한 역설.
            각 부분 집단에서 성립하는 통계적 경향이 전체 집단에서는 역전될 수 있는 현상입니다.
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
            >
              ↺ 처음부터
            </button>
          </div>
        </StepCard>
      ) : null}
    </div>
  );
}

function StepCard({ active, title, children }: { active: boolean; title?: string; children: React.ReactNode }) {
  return (
    <section
      className={`rounded-xl border p-4 transition-colors ${
        active
          ? "border-violet-400/50 bg-violet-400/[0.06]"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      {title ? <h5 className="mb-2 text-sm font-bold text-violet-300">{title}</h5> : null}
      {children}
    </section>
  );
}

function ProgressDots({ count, current }: { count: number; current: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: count }, (_, i) => {
        const tone =
          i === current ? "bg-violet-400 scale-125"
          : i < current ? "bg-emerald-400"
          : "bg-white/15";
        return <span key={i} className={`inline-block h-2 w-2 rounded-full transition-all ${tone}`} aria-hidden="true" />;
      })}
    </div>
  );
}

function NextBtn({ onClick, children, big }: { onClick: () => void; children: React.ReactNode; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg bg-gradient-to-r from-violet-500 to-violet-700 font-bold text-white transition hover:brightness-110 ${
        big ? "px-6 py-2.5 text-base" : "px-4 py-1.5 text-sm"
      }`}
    >
      {children}
    </button>
  );
}

function VoteBtn({ onClick, color, children }: { onClick: () => void; color: "violet" | "cyan"; children: React.ReactNode }) {
  const cls =
    color === "violet"
      ? "from-violet-500 to-violet-700"
      : "from-cyan-500 to-cyan-700";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg bg-gradient-to-r px-4 py-1.5 text-sm font-bold text-white transition hover:brightness-110 ${cls}`}
    >
      {children}
    </button>
  );
}

function BarRow({ label, labelColor, value, fill }: { label: string; labelColor: string; value: number; fill: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-14 text-xs font-bold ${labelColor}`}>{label}</span>
      <div className="flex-1">
        <BarSVG value={value} fill={fill} label={fmt(value)} />
      </div>
    </div>
  );
}

type BaseballRow = "first" | "second" | "total";
function BaseballTable({ rows }: { rows: BaseballRow[] }) {
  const cell = "border-b border-white/8 px-2 py-1.5 text-center text-sm";
  const th = "bg-violet-400/25 px-2 py-1.5 text-center text-xs font-semibold text-violet-200";
  const winCls = "font-bold text-emerald-300";
  const loseCls = "font-bold text-red-300";
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th rowSpan={2} className={`${th} w-[16%]`}><span className="sr-only">구분</span></th>
            <th colSpan={3} className={th}>투수 A</th>
            <th colSpan={3} className={th}>투수 B</th>
          </tr>
          <tr>
            <th className={th}>승</th><th className={th}>패</th><th className={th}>승률</th>
            <th className={th}>승</th><th className={th}>패</th><th className={th}>승률</th>
          </tr>
        </thead>
        <tbody>
          {rows.includes("first") ? (
            <tr>
              <td className={`${cell} text-slate-300`}>전반기</td>
              <td className={cell}>{BASEBALL.first.a.w}</td>
              <td className={cell}>{BASEBALL.first.a.l}</td>
              <td className={`${cell} ${loseCls}`}>{fmt(BA_FIRST_A)}</td>
              <td className={cell}>{BASEBALL.first.b.w}</td>
              <td className={cell}>{BASEBALL.first.b.l}</td>
              <td className={`${cell} ${winCls}`}>{fmt(BA_FIRST_B)}</td>
            </tr>
          ) : null}
          {rows.includes("second") ? (
            <tr>
              <td className={`${cell} text-slate-300`}>후반기</td>
              <td className={cell}>{BASEBALL.second.a.w}</td>
              <td className={cell}>{BASEBALL.second.a.l}</td>
              <td className={`${cell} ${loseCls}`}>{fmt(BA_SECOND_A)}</td>
              <td className={cell}>{BASEBALL.second.b.w}</td>
              <td className={cell}>{BASEBALL.second.b.l}</td>
              <td className={`${cell} ${winCls}`}>{fmt(BA_SECOND_B)}</td>
            </tr>
          ) : null}
          {rows.includes("total") ? (
            <tr className="bg-violet-400/[0.08]">
              <td className={`${cell} font-bold text-slate-100`}>시즌 전체</td>
              <td className={`${cell} font-bold`}>{BA_TOTAL_A_W}</td>
              <td className={`${cell} font-bold`}>{BA_TOTAL_A_L}</td>
              <td className={`${cell} ${winCls}`}>{fmt(BA_TOTAL_A)}</td>
              <td className={`${cell} font-bold`}>{BA_TOTAL_B_W}</td>
              <td className={`${cell} font-bold`}>{BA_TOTAL_B_L}</td>
              <td className={`${cell} ${loseCls}`}>{fmt(BA_TOTAL_B)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function ResultBox({
  name, rate, sub, badge, winner, colorName,
}: {
  name: string; rate: string; sub: string; badge: string;
  winner?: boolean; colorName: "emerald" | "cyan";
}) {
  const border = winner ? "border-emerald-400/45 bg-emerald-400/[0.1]" : "border-white/10 bg-white/[0.04]";
  const rateCls = winner ? "text-emerald-300" : "text-slate-400";
  const nameCls = colorName === "emerald" ? "text-emerald-300" : "text-cyan-300";
  const badgeCls = winner
    ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-200"
    : "border-cyan-400/30 bg-cyan-400/15 text-cyan-200";
  return (
    <div className={`flex-1 rounded-xl border-2 p-3 text-center ${border}`}>
      <h6 className={`text-sm font-bold ${nameCls}`}>{name}</h6>
      <div className={`my-0.5 font-mono text-2xl font-bold ${rateCls}`}>{rate}</div>
      <div className="text-[11px] text-slate-500">{sub}</div>
      <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeCls}`}>{badge}</span>
    </div>
  );
}

// ============================================================
// 탭 2 — 📚 다양한 예시
// ============================================================

function ExamplesTab() {
  const [reveal1, setReveal1] = useState(false);
  const [reveal2, setReveal2] = useState(false);

  return (
    <div className="space-y-6">
      {/* 예시 1: 학과 입학률 */}
      <section>
        <div className="rounded-2xl border border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-violet-700/10 p-4 text-center">
          <h4 className="text-base font-bold text-violet-300">🎓 예시 1 — 학과별 입학률</h4>
          <p className="mt-1 text-xs leading-6 text-slate-300">
            1973년 캘리포니아 대학 입학 데이터에서 발견된 역설.
            <br />
            학과별로 보면 여학생 입학률이 더 높은데, 전체를 보면?
          </p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th rowSpan={2} className="w-[16%] bg-violet-400/25 px-2 py-1.5 text-xs font-semibold text-violet-200"><span className="sr-only">구분</span></th>
                <th colSpan={3} className="bg-violet-400/25 px-2 py-1.5 text-xs font-semibold text-violet-200">남학생</th>
                <th colSpan={3} className="bg-violet-400/25 px-2 py-1.5 text-xs font-semibold text-violet-200">여학생</th>
              </tr>
              <tr>
                {["합격", "불합격", "합격률", "합격", "불합격", "합격률"].map((h, i) => (
                  <th key={i} className="bg-violet-400/25 px-2 py-1.5 text-xs font-semibold text-violet-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <DeptRow label="학과 A" m={[10, 20]} f={[20, 30]} />
              <DeptRow label="학과 B" m={[50, 20]} f={[30, 10]} />
              {reveal1 ? (
                <tr className="bg-violet-400/[0.08] animate-[fadein_0.4s_ease]">
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold text-slate-100">전체</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold">60</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold">40</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold text-emerald-300">60.00%</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold">50</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold">40</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold text-red-300">55.56%</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-2 space-y-1">
          <BarRow label="남 (학A)" labelColor="text-violet-300" value={pct(10, 30)} fill="#7c3aed" />
          <BarRow label="여 (학A)" labelColor="text-pink-300"   value={pct(20, 50)} fill="#db2777" />
          <BarRow label="남 (학B)" labelColor="text-violet-300" value={pct(50, 70)} fill="#7c3aed" />
          <BarRow label="여 (학B)" labelColor="text-pink-300"   value={pct(30, 40)} fill="#db2777" />
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          학과 A에서도, 학과 B에서도 <strong className="text-pink-300">여학생 합격률</strong>이 더 높습니다.
        </p>

        {!reveal1 ? (
          <div className="mt-3 text-center">
            <p className="mb-2 text-sm font-bold text-slate-100">🤔 그렇다면 전체 합격률은 누가 더 높을까요?</p>
            <NextBtn onClick={() => setReveal1(true)}>전체 결과 공개!</NextBtn>
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-400/15 to-amber-500/10 p-3 text-center animate-[fadein_0.4s_ease]">
              <h5 className="text-sm font-bold text-amber-300">😱 전체에서는 남학생 합격률이 더 높다! (60% {">"} 55.56%)</h5>
              <p className="mt-1 text-xs leading-6 text-slate-200">두 학과 모두에서 여학생이 앞섰는데, 전체 합계에서는 역전!</p>
            </div>
            <div className="mt-2 rounded-r-xl border-l-4 border-violet-400 bg-violet-400/[0.06] p-3 text-xs leading-6 text-slate-300">
              <strong className="text-violet-300">💡 왜 역전될까요?</strong>
              <ul className="mt-1 list-disc pl-5">
                <li>여학생의 <strong className="text-slate-100">90명 중 50명(56%)</strong>이 합격률이 낮은 학과 A에 지원</li>
                <li>남학생의 <strong className="text-slate-100">100명 중 70명(70%)</strong>이 합격률이 높은 학과 B에 지원</li>
                <li>여학생이 더 경쟁이 치열한 학과에 몰렸기 때문에 전체 합격률이 낮아진 것!</li>
              </ul>
              <p className="mt-2">실제로 <strong className="text-slate-100">학과 내 차별은 없지만</strong>, 전체 통계만 보면 차별처럼 보일 수 있습니다.</p>
            </div>
          </>
        )}
      </section>

      <hr className="border-white/8" />

      {/* 예시 2: 신약 임상 */}
      <section>
        <div className="rounded-2xl border border-teal-400/35 bg-gradient-to-r from-teal-500/15 to-teal-700/10 p-4 text-center">
          <h4 className="text-base font-bold text-teal-300">💊 예시 2 — 신약 임상 실험</h4>
          <p className="mt-1 text-xs leading-6 text-slate-300">
            신약 A와 기존 치료법 B의 치료 성공률 비교.
            <br />
            (실제 1986년 신장 결석 치료 연구 데이터를 단순화한 예시)
          </p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th rowSpan={2} className="w-[18%] bg-teal-400/25 px-2 py-1.5 text-xs font-semibold text-teal-200"><span className="sr-only">구분</span></th>
                <th colSpan={3} className="bg-teal-400/25 px-2 py-1.5 text-xs font-semibold text-teal-200">신약 A</th>
                <th colSpan={3} className="bg-teal-400/25 px-2 py-1.5 text-xs font-semibold text-teal-200">기존 치료 B</th>
              </tr>
              <tr>
                {["성공", "실패", "성공률", "성공", "실패", "성공률"].map((h, i) => (
                  <th key={i} className="bg-teal-400/25 px-2 py-1.5 text-xs font-semibold text-teal-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <DrugRow label="경증 환자" sub="소결석" a={[81, 6]} b={[234, 36]} />
              <DrugRow label="중증 환자" sub="대결석" a={[192, 71]} b={[55, 25]} />
              {reveal2 ? (
                <tr className="bg-teal-400/[0.08] animate-[fadein_0.4s_ease]">
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold text-slate-100">전체</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold">273</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold">77</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold text-red-300">78.0%</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold">289</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold">61</td>
                  <td className="border-b border-white/8 px-2 py-1.5 text-center text-sm font-bold text-emerald-300">82.6%</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-2 space-y-1">
          <BarRow label="A (경증)" labelColor="text-cyan-300"    value={pct(81, 87)}   fill="#0891b2" />
          <BarRow label="B (경증)" labelColor="text-emerald-300" value={pct(234, 270)} fill="#059669" />
          <BarRow label="A (중증)" labelColor="text-cyan-300"    value={pct(192, 263)} fill="#0891b2" />
          <BarRow label="B (중증)" labelColor="text-emerald-300" value={pct(55, 80)}   fill="#059669" />
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          경증·중증 모두에서 <strong className="text-teal-300">신약 A</strong>의 성공률이 더 높습니다.
        </p>

        {!reveal2 ? (
          <div className="mt-3 text-center">
            <p className="mb-2 text-sm font-bold text-slate-100">🤔 그렇다면 전체 성공률은 어느 치료법이 더 높을까요?</p>
            <button
              type="button"
              onClick={() => setReveal2(true)}
              className="rounded-lg bg-gradient-to-r from-teal-500 to-teal-700 px-4 py-1.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              전체 결과 공개!
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-xl border-2 border-emerald-400/45 bg-gradient-to-r from-emerald-400/15 to-emerald-500/10 p-3 text-center animate-[fadein_0.4s_ease]">
              <h5 className="text-sm font-bold text-emerald-300">😱 전체에서는 기존 치료 B의 성공률이 더 높다! (82.6% {">"} 78.0%)</h5>
              <p className="mt-1 text-xs leading-6 text-slate-200">경증·중증 모두에서 A가 앞섰는데, 전체 합계에서는 역전!</p>
            </div>
            <div className="mt-2 rounded-r-xl border-l-4 border-teal-400 bg-teal-400/[0.06] p-3 text-xs leading-6 text-slate-300">
              <strong className="text-teal-300">💡 왜 역전될까요?</strong>
              <ul className="mt-1 list-disc pl-5">
                <li>신약 A: <strong className="text-slate-100">350명 중 263명(75%)</strong>이 치료가 어려운 중증 환자</li>
                <li>기존치료 B: <strong className="text-slate-100">350명 중 270명(77%)</strong>이 치료가 쉬운 경증 환자</li>
                <li>의사들이 더 어려운 케이스에 신약을 쓰는 경향이 있어서 생긴 현상!</li>
                <li>중증 환자 비율이 높은 신약 A의 전체 성공률이 자연히 낮아진 것</li>
              </ul>
              <p className="mt-2">이 경우 <strong className="text-slate-100">&ldquo;제3의 변수&rdquo;</strong>(환자 중증도)를 무시하면 신약이 더 나쁜 것처럼 보입니다.</p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function DeptRow({ label, m, f }: { label: string; m: [number, number]; f: [number, number] }) {
  const mRate = pct(m[0], m[0] + m[1]);
  const fRate = pct(f[0], f[0] + f[1]);
  const mTone = mRate > fRate ? "text-emerald-300" : "text-red-300";
  const fTone = fRate > mRate ? "text-emerald-300" : "text-red-300";
  const cell = "border-b border-white/8 px-2 py-1.5 text-center text-sm";
  return (
    <tr>
      <td className={`${cell} text-slate-300`}>{label}</td>
      <td className={cell}>{m[0]}</td>
      <td className={cell}>{m[1]}</td>
      <td className={`${cell} font-bold ${mTone}`}>{fmt(mRate)}</td>
      <td className={cell}>{f[0]}</td>
      <td className={cell}>{f[1]}</td>
      <td className={`${cell} font-bold ${fTone}`}>{fmt(fRate)}</td>
    </tr>
  );
}

function DrugRow({ label, sub, a, b }: { label: string; sub: string; a: [number, number]; b: [number, number] }) {
  const aRate = pct(a[0], a[0] + a[1]);
  const bRate = pct(b[0], b[0] + b[1]);
  const cell = "border-b border-white/8 px-2 py-1.5 text-center text-sm";
  return (
    <tr>
      <td className={`${cell} text-slate-300`}>
        {label}
        <div className="text-[10px] text-slate-500">{sub}</div>
      </td>
      <td className={cell}>{a[0]}</td>
      <td className={cell}>{a[1]}</td>
      <td className={`${cell} font-bold text-emerald-300`}>{fmt(aRate, 1)}</td>
      <td className={cell}>{b[0]}</td>
      <td className={cell}>{b[1]}</td>
      <td className={`${cell} font-bold text-red-300`}>{fmt(bRate, 1)}</td>
    </tr>
  );
}

// ============================================================
// 탭 3 — 🎮 나만의 역설 만들기 (인터랙티브)
// ============================================================

// 고정 승률
const EASY_A = 0.9, EASY_B = 0.8;
const HARD_A = 0.4, HARD_B = 0.3;

function ChallengeTab() {
  const [pA, setPA] = useState(50); // 캐릭터 A의 쉬운 던전 참여 비율 (0~100)
  const [pB, setPB] = useState(50); // 캐릭터 B의 쉬운 던전 참여 비율 (0~100)

  const rA = useMemo(() => EASY_A * (pA / 100) + HARD_A * (1 - pA / 100), [pA]);
  const rB = useMemo(() => EASY_B * (pB / 100) + HARD_B * (1 - pB / 100), [pB]);
  const isParadox = rB > rA;
  const diff = (rA - rB) * 100;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-400/15 to-amber-500/10 p-4 text-center">
        <h4 className="text-base font-bold text-amber-300">🎮 나만의 역설 만들기 챌린지</h4>
        <p className="mt-1 text-xs leading-6 text-slate-300">
          두 게임 캐릭터의 던전 참여 비율을 조절해 심프슨의 역설을 만들어 보세요!
          <br />
          <strong className="text-amber-300">목표 :</strong> 두 그룹 모두에서 A가 이기지만, 전체에서는 B가 이기도록!
        </p>
      </div>

      {/* 고정값 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-violet-300">⚙️ 기본 설정 (고정값)</h5>
        <p className="mt-1 text-xs text-slate-500">두 그룹의 승률은 고정. 캐릭터별 그룹 참여 비율만 조절합니다.</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <DungeonBox tone="violet" title="⚔️ 쉬운 던전 (그룹 1)" a={EASY_A} b={EASY_B} />
          <DungeonBox tone="rose"   title="🐉 어려운 던전 (그룹 2)" a={HARD_A} b={HARD_B} />
        </div>
      </section>

      {/* 슬라이더 */}
      <section className="rounded-xl border border-amber-400/30 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-amber-300">🎚️ 참여 비율 조절 (여기서 바꿔 보세요!)</h5>
        <p className="mt-1 text-xs text-slate-500">각 캐릭터가 전체 전투 중 쉬운 던전에 참여하는 비율</p>

        <RatioSlider
          color="violet"
          label="🟣 캐릭터 A — 쉬운 던전 참여 비율"
          value={pA}
          onChange={setPA}
          inputId="sim-pA"
          colorFill="#7c3aed"
        />
        <RatioSlider
          color="emerald"
          label="🟢 캐릭터 B — 쉬운 던전 참여 비율"
          value={pB}
          onChange={setPB}
          inputId="sim-pB"
          colorFill="#059669"
        />
      </section>

      {/* 결과 */}
      <section className="rounded-xl border border-emerald-400/25 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-emerald-300">📊 전체 승률 결과</h5>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <CharResultBox
            name="캐릭터 A" rate={rA * 100} paradoxLose={isParadox}
            easyVal={90} hardVal={40}
            fillEasy="#6366f1" fillHard="#6366f1"
            participation={`쉬운 ${pA}% + 어려운 ${100 - pA}%`}
          />
          <CharResultBox
            name="캐릭터 B" rate={rB * 100} paradoxLose={false} paradoxWin={isParadox}
            easyVal={80} hardVal={30}
            fillEasy="#059669" fillHard="#059669"
            participation={`쉬운 ${pB}% + 어려운 ${100 - pB}%`}
          />
        </div>

        <div
          className={`mt-3 rounded-xl border p-3 text-center transition ${
            isParadox
              ? "border-amber-400/55 bg-gradient-to-r from-amber-400/15 to-amber-500/10 animate-[pulse_0.8s_ease_3]"
              : "border-white/10 bg-white/[0.04]"
          }`}
        >
          {isParadox ? (
            <>
              <h6 className="text-base font-bold text-amber-300">🎉 심프슨의 역설 달성!</h6>
              <p className="mt-1 text-xs leading-6 text-slate-100">
                <strong>A가 두 그룹 모두에서 이기지만 전체에서는 B가 이깁니다!</strong>
                <br />
                (쉬운: A 90% {">"} B 80% ✓, 어려운: A 40% {">"} B 30% ✓, 전체: A {fmt(rA * 100, 1)} {"<"} B {fmt(rB * 100, 1)} !)
              </p>
            </>
          ) : (
            <>
              <h6 className="text-sm font-bold text-slate-300">⚔️ 현재 : 정상 (역설 없음)</h6>
              <p className="mt-1 text-xs text-slate-500">
                A가 전체에서도 우세 (차이 +{diff.toFixed(1)}%p). 슬라이더를 움직여 역설을 만들어 보세요!
              </p>
            </>
          )}
        </div>
      </section>

      {/* 챌린지 상태 + 힌트 */}
      <section className="rounded-xl border border-violet-400/30 bg-violet-400/[0.06] p-4">
        <h5 className="text-sm font-bold text-violet-300">🏆 챌린지 — 역설을 만들어라!</h5>
        <p className="mt-1 text-xs leading-6 text-slate-300">
          쉬운 던전과 어려운 던전 모두에서 A가 이기지만, 전체 승률에서는 B가 이기도록 슬라이더를 조절해 보세요.
        </p>
        <div
          className={`mt-2 rounded-lg px-3 py-2 text-center text-sm font-bold ${
            isParadox
              ? "border border-emerald-400/45 bg-emerald-400/15 text-emerald-300"
              : "bg-white/[0.05] text-slate-400"
          }`}
        >
          {isParadox
            ? "🏆 챌린지 완성! 심프슨의 역설을 성공적으로 만들었습니다!"
            : "🔒 미완성 — B의 쉬운 던전 비율을 A보다 훨씬 높게 조절해 보세요!"}
        </div>
      </section>

      {/* 현재 수치 표 + 힌트 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <h5 className="text-sm font-bold text-cyan-300">📋 현재 설정 수치 요약</h5>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="bg-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-200"><span className="sr-only">구분</span></th>
                <th colSpan={2} className="bg-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-200">캐릭터 A</th>
                <th colSpan={2} className="bg-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-200">캐릭터 B</th>
              </tr>
              <tr>
                <th className="bg-cyan-400/15 px-2 py-1 text-[11px] text-cyan-200/80"><span className="sr-only">구분</span></th>
                <th className="bg-cyan-400/15 px-2 py-1 text-[11px] text-cyan-200/80">참여비율</th>
                <th className="bg-cyan-400/15 px-2 py-1 text-[11px] text-cyan-200/80">승률</th>
                <th className="bg-cyan-400/15 px-2 py-1 text-[11px] text-cyan-200/80">참여비율</th>
                <th className="bg-cyan-400/15 px-2 py-1 text-[11px] text-cyan-200/80">승률</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-white/8 px-2 py-1.5 text-center">⚔️ 쉬운 던전</td>
                <td className="border-b border-white/8 px-2 py-1.5 text-center">{pA}%</td>
                <td className="border-b border-white/8 px-2 py-1.5 text-center font-bold text-emerald-300">90%</td>
                <td className="border-b border-white/8 px-2 py-1.5 text-center">{pB}%</td>
                <td className="border-b border-white/8 px-2 py-1.5 text-center font-bold text-emerald-300">80%</td>
              </tr>
              <tr>
                <td className="border-b border-white/8 px-2 py-1.5 text-center">🐉 어려운 던전</td>
                <td className="border-b border-white/8 px-2 py-1.5 text-center">{100 - pA}%</td>
                <td className="border-b border-white/8 px-2 py-1.5 text-center font-bold text-emerald-300">40%</td>
                <td className="border-b border-white/8 px-2 py-1.5 text-center">{100 - pB}%</td>
                <td className="border-b border-white/8 px-2 py-1.5 text-center font-bold text-emerald-300">30%</td>
              </tr>
              <tr className="bg-cyan-400/[0.08]">
                <td className="px-2 py-1.5 text-center font-bold text-slate-100">전체</td>
                <td colSpan={2} className={`px-2 py-1.5 text-center font-bold ${rA >= rB ? "text-emerald-300" : "text-red-300"}`}>
                  {fmt(rA * 100, 1)}
                </td>
                <td colSpan={2} className={`px-2 py-1.5 text-center font-bold ${rB > rA ? "text-emerald-300" : "text-red-300"}`}>
                  {fmt(rB * 100, 1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 rounded-r-md border-l-[3px] border-amber-300 bg-white/[0.03] p-3 text-xs leading-6 text-slate-300">
          <strong className="text-amber-300">힌트 :</strong> 역설이 일어나려면 B가 높은 승률 구간(쉬운 던전)에,
          A가 낮은 승률 구간(어려운 던전)에 더 많이 참여해야 합니다.
          <br />
          수학적으로 : <strong className="text-slate-100">B의 쉬운 던전 비율 {">"} A의 쉬운 던전 비율 + 20%p</strong> 일 때 역설이 생깁니다.
        </div>
      </section>
    </div>
  );
}

function DungeonBox({ tone, title, a, b }: { tone: "violet" | "rose"; title: string; a: number; b: number }) {
  const bg = tone === "violet" ? "border-violet-400/35 bg-violet-400/[0.08]" : "border-rose-400/30 bg-rose-400/[0.07]";
  const tt = tone === "violet" ? "text-violet-300" : "text-rose-300";
  return (
    <div className={`rounded-xl border p-3 text-center ${bg}`}>
      <h6 className={`text-sm font-bold ${tt}`}>{title}</h6>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="rounded-md bg-indigo-400/20 px-2 py-0.5 font-bold text-indigo-200">캐릭터 A</span>
        <span className="font-bold text-indigo-200">{(a * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="rounded-md bg-emerald-400/20 px-2 py-0.5 font-bold text-emerald-200">캐릭터 B</span>
        <span className="font-bold text-emerald-200">{(b * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-2 inline-block rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
        → A 항상 우세
      </div>
    </div>
  );
}

function RatioSlider({
  color, label, value, onChange, inputId, colorFill,
}: {
  color: "violet" | "emerald";
  label: string;
  value: number;
  onChange: (n: number) => void;
  inputId: string;
  colorFill: string;
}) {
  const valTone = color === "violet" ? "text-indigo-300" : "text-emerald-300";
  const accent = color === "violet" ? "accent-violet-400" : "accent-emerald-400";
  return (
    <div className="mt-3">
      <label htmlFor={inputId} className="block text-sm text-slate-200">
        {label} : <span className={`font-bold ${valTone}`}>{value}%</span>
      </label>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-[11px] text-slate-500">0%</span>
        <input
          id={inputId}
          type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className={`flex-1 ${accent}`}
        />
        <span className="text-[11px] text-slate-500">100%</span>
      </div>
      {/* 비율 가시 막대 (쉬운/어려운) */}
      <svg viewBox="0 0 100 18" preserveAspectRatio="none" className="mt-1 block h-[18px] w-full overflow-hidden rounded-md" aria-hidden="true">
        <rect x={0} y={0} width={100} height={18} fill="#9f1239" />
        <rect x={0} y={0} width={Math.max(0, Math.min(100, value))} height={18} fill={colorFill} className="transition-all duration-300" />
      </svg>
      <div className="mt-0.5 flex justify-between text-[11px] text-slate-500">
        <span>⚔️ 쉬운 던전 {value}%</span>
        <span>🐉 어려운 던전 {100 - value}%</span>
      </div>
    </div>
  );
}

function CharResultBox({
  name, rate, paradoxLose, paradoxWin,
  easyVal, hardVal, fillEasy, fillHard, participation,
}: {
  name: string; rate: number;
  paradoxLose?: boolean; paradoxWin?: boolean;
  easyVal: number; hardVal: number;
  fillEasy: string; fillHard: string;
  participation: string;
}) {
  const border =
    paradoxLose ? "border-red-400/40 bg-red-400/[0.07]"
    : paradoxWin ? "border-emerald-400/45 bg-emerald-400/[0.1]"
    : "border-white/10 bg-white/[0.04]";
  const rateTone =
    paradoxLose ? "text-red-300"
    : paradoxWin ? "text-emerald-300"
    : "text-slate-200";
  return (
    <div className={`rounded-xl border-2 p-3 text-center ${border}`}>
      <h6 className="text-sm font-bold text-slate-100">{name}</h6>
      <div className={`my-1 font-mono text-2xl font-bold transition-colors ${rateTone}`}>{fmt(rate, 1)}</div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="w-12 text-slate-500">⚔️ 쉬운</span>
          <div className="flex-1"><BarSVG value={easyVal} fill={fillEasy} label={`${easyVal}%`} heightClass="h-[16px]" /></div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="w-12 text-slate-500">🐉 어려운</span>
          <div className="flex-1"><BarSVG value={hardVal} fill={fillHard} label={`${hardVal}%`} heightClass="h-[16px]" /></div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-slate-500">{participation}</div>
    </div>
  );
}

// ============================================================
// 성찰 질문
// ============================================================

const REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    id: "paradox_cause",
    kind: "text",
    prompt: "심프슨의 역설이 발생하는 핵심 이유는 무엇인가요? 야구 예제를 사용해 자신의 말로 설명해 보세요.",
    placeholder: "그룹별 표본 크기(경기 수)의 차이 때문에... 투수 B는 승률이 낮은 후반기에 더 많이 등판했기 때문에...",
  },
  {
    id: "stats_caution",
    kind: "text",
    prompt: "이 역설은 통계 자료를 해석할 때 어떤 점을 조심해야 함을 알려주나요?",
    placeholder: "전체 통계만 보면 안 되고, 숨겨진 제3의 변수(예: 경기 시기, 환자 중증도)를...",
  },
  {
    id: "real_life_example",
    kind: "text",
    prompt: "일상생활에서 심프슨의 역설이 나타날 수 있는 사례를 직접 생각해 보세요.",
    placeholder: "예) 두 학교의 수능 평균 점수 비교 시 학과 구성이 다를 때, 두 병원의 수술 성공률 비교 시...",
  },
  {
    id: "challenge_condition",
    kind: "text",
    prompt: "탐구 3(역설 만들기)에서 심프슨의 역설이 발생하도록 만들기 위한 조건은 무엇이었나요?",
    placeholder: "B가 유리한 그룹(높은 승률 구간)에 훨씬 더 많이 참여할 때...",
  },
];

// ============================================================
// 메인
// ============================================================

type TabKey = "baseball" | "examples" | "challenge";

export default function SimpsonsParadoxMini() {
  const [tab, setTab] = useState<TabKey>("baseball");
  const tabBtn = (active: boolean, color: string) =>
    active
      ? `rounded-lg ${color} px-3 py-2 text-sm font-bold text-slate-950`
      : "rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <style>{`@keyframes fadein {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">미니활동 · 확률의 덧셈정리</p>
        <h3 className="mt-2 text-2xl font-bold">🔀 심프슨의 역설</h3>
        <p className="mt-2 leading-7 text-slate-300">
          부분에서 더 나은 것이 전체에서는 뒤처질 수 있다!{" "}
          <b className="text-amber-200">야구·입학률·의학</b> 세 가지 예시로 직관을 흔드는 심프슨의 역설을 탐구하고,
          나만의 역설도 직접 만들어 봐요.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={tabBtn(tab === "baseball", "bg-violet-300")} onClick={() => setTab("baseball")}>
          ⚾ 탐구 1 · 야구 투수
        </button>
        <button type="button" className={tabBtn(tab === "examples", "bg-teal-300")} onClick={() => setTab("examples")}>
          📚 탐구 2 · 다양한 예시
        </button>
        <button type="button" className={tabBtn(tab === "challenge", "bg-amber-300")} onClick={() => setTab("challenge")}>
          🎮 탐구 3 · 역설 만들기
        </button>
      </div>

      <div className="mt-5">
        {tab === "baseball" ? <BaseballTab /> : tab === "examples" ? <ExamplesTab /> : <ChallengeTab />}
      </div>

      <ReflectionForm questions={REFLECTION_QUESTIONS} />
    </section>
  );
}
