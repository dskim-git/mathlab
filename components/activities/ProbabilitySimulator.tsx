"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  getDefaultProbability,
  getModeLabel,
  ProbabilityMode,
  SimulationResult,
  simulateBinomial,
} from "@/lib/activities/probability";

type ProbabilitySimulatorProps = {
  sessionId: string;
  activitySlug?: string;
  studentName?: string;
  studentNumber?: string;
};

function formatNumber(value: number, digits = 4) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: digits,
  });
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  })}%`;
}

export default function ProbabilitySimulator({
  sessionId,
  activitySlug = "probability-simulator",
  studentName,
  studentNumber,
}: ProbabilitySimulatorProps) {
  const [mode, setMode] = useState<ProbabilityMode>("coin");
  const [n, setN] = useState(30);
  const [repeats, setRepeats] = useState(1000);
  const [p, setP] = useState(0.5);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const [reflection, setReflection] = useState("");
  const [interpretationType, setInterpretationType] = useState(
    "theory_comparison"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const modeDescription = useMemo(() => {
    if (mode === "coin") {
      return "각 시행에서 앞면이 나오면 성공으로 봅니다.";
    }

    if (mode === "dice") {
      return "각 시행에서 정한 특정 눈이 나오면 성공으로 봅니다. 성공확률은 1/6입니다.";
    }

    return "성공확률을 직접 정해서 베르누이 시행을 반복합니다.";
  }, [mode]);

  function handleModeChange(nextMode: ProbabilityMode) {
    setMode(nextMode);
    const nextP = getDefaultProbability(nextMode);
    setP(nextP);
    setResult(null);
    setSubmitMessage("");
    setSubmitError("");
  }

  function handleRunSimulation() {
    const simulationResult = simulateBinomial({
      mode,
      n,
      repeats,
      p,
    });

    setResult(simulationResult);
    setSubmitMessage("");
    setSubmitError("");
  }

  async function handleSubmitResponse() {
    if (!result) {
      setSubmitError("먼저 시뮬레이션을 실행해 주세요.");
      return;
    }

    if (!studentName?.trim()) {
      setSubmitError("학생 이름이 없어 응답을 저장할 수 없습니다.");
      return;
    }

    if (!reflection.trim()) {
      setSubmitError("결과 해석 또는 느낀 점을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitError("");

    const resultPayload = {
      activitySlug,
      mode: result.input.mode,
      modeLabel: getModeLabel(result.input.mode),
      n: result.input.n,
      repeats: result.input.repeats,
      p: result.input.p,
      observedMean: result.observedMean,
      expectedMean: result.expectedMean,
      observedVariance: result.observedVariance,
      expectedVariance: result.expectedVariance,
      interpretationType,
      distribution: result.distribution,
    };

    const { error } = await supabase.from("responses").insert({
      session_id: sessionId,
      student_name: studentName.trim(),
      student_number: studentNumber?.trim() || null,
      result: resultPayload,
      reflection: reflection.trim(),
    });

    setIsSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSubmitMessage("응답이 저장되었습니다.");
  }

  return (
    <section className="mt-8 rounded-2xl border border-cyan-300/40 bg-slate-900 p-6">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-5">
        <p className="text-sm font-semibold text-cyan-300">확률 시뮬레이터</p>
        <h2 className="text-2xl font-bold">이항분포 시뮬레이션 활동</h2>
        <p className="leading-7 text-slate-300">
          같은 시행을 여러 번 반복했을 때 성공 횟수가 어떻게 분포하는지
          실험하고, 이론적인 이항분포와 비교해 봅니다.
        </p>

        {(studentName || studentNumber) && (
          <p className="mt-2 text-sm text-slate-400">
            참여 학생: {studentName || "이름 없음"}
            {studentNumber ? ` / ${studentNumber}` : ""}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div>
          <label
            htmlFor="mode"
            className="block text-sm font-semibold text-slate-200"
          >
            실험 종류
          </label>
          <select
            id="mode"
            value={mode}
            onChange={(event) =>
              handleModeChange(event.target.value as ProbabilityMode)
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
          >
            <option value="coin">동전 던지기</option>
            <option value="dice">주사위 특정 눈</option>
            <option value="custom">성공확률 직접 입력</option>
          </select>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {modeDescription}
          </p>
        </div>

        <div>
          <label
            htmlFor="n"
            className="block text-sm font-semibold text-slate-200"
          >
            한 번의 실험에서 시행 수 n
          </label>
          <input
            id="n"
            type="number"
            min={1}
            max={200}
            value={n}
            onChange={(event) => {
              setN(Number(event.target.value));
              setResult(null);
              setSubmitMessage("");
              setSubmitError("");
            }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
          />
          <p className="mt-2 text-sm text-slate-400">
            예: 동전을 30번 던지는 실험
          </p>
        </div>

        <div>
          <label
            htmlFor="repeats"
            className="block text-sm font-semibold text-slate-200"
          >
            실험 반복 횟수
          </label>
          <input
            id="repeats"
            type="number"
            min={1}
            max={10000}
            value={repeats}
            onChange={(event) => {
              setRepeats(Number(event.target.value));
              setResult(null);
              setSubmitMessage("");
              setSubmitError("");
            }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
          />
          <p className="mt-2 text-sm text-slate-400">
            예: 위 실험을 1000번 반복
          </p>
        </div>

        <div className="lg:col-span-3">
          <label
            htmlFor="p"
            className="block text-sm font-semibold text-slate-200"
          >
            성공확률 p
          </label>
          <input
            id="p"
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={p}
            disabled={mode !== "custom"}
            onChange={(event) => {
              setP(Number(event.target.value));
              setResult(null);
              setSubmitMessage("");
              setSubmitError("");
            }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-2 text-sm text-slate-400">
            현재 선택: {getModeLabel(mode)} / 성공확률 p ={" "}
            {formatNumber(p, 4)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRunSimulation}
        className="mt-6 rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
      >
        시뮬레이션 실행하기
      </button>

      {result ? (
        <section className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">시뮬레이션 평균</p>
              <p className="mt-2 text-2xl font-bold text-cyan-300">
                {formatNumber(result.observedMean)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">이론 평균 np</p>
              <p className="mt-2 text-2xl font-bold text-cyan-300">
                {formatNumber(result.expectedMean)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">시뮬레이션 분산</p>
              <p className="mt-2 text-2xl font-bold text-cyan-300">
                {formatNumber(result.observedVariance)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm text-slate-400">이론 분산 np(1-p)</p>
              <p className="mt-2 text-2xl font-bold text-cyan-300">
                {formatNumber(result.expectedVariance)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
            <h3 className="text-lg font-bold">성공 횟수 분포표</h3>

            <div className="mt-4 max-h-96 overflow-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-slate-300">
                    <th className="py-3 pr-4">성공 횟수</th>
                    <th className="py-3 pr-4">빈도</th>
                    <th className="py-3 pr-4">상대도수</th>
                    <th className="py-3 pr-4">이론확률</th>
                  </tr>
                </thead>
                <tbody>
                  {result.distribution.map((row) => (
                    <tr
                      key={row.successCount}
                      className="border-b border-white/5 text-slate-300"
                    >
                      <td className="py-3 pr-4 font-semibold text-white">
                        {row.successCount}
                      </td>
                      <td className="py-3 pr-4">{row.frequency}</td>
                      <td className="py-3 pr-4">
                        {formatPercent(row.relativeFrequency)}
                      </td>
                      <td className="py-3 pr-4">
                        {formatPercent(row.theoreticalProbability)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-300/30 bg-slate-950 p-5">
            <h3 className="text-lg font-bold">결과 해석 제출</h3>

            <div className="mt-5">
              <label
                htmlFor="interpretation-type"
                className="block text-sm font-semibold text-slate-200"
              >
                해석 관점
              </label>
              <select
                id="interpretation-type"
                value={interpretationType}
                onChange={(event) => setInterpretationType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              >
                <option value="theory_comparison">
                  시뮬레이션 결과와 이론값 비교
                </option>
                <option value="large_number_law">
                  반복 횟수와 큰 수의 법칙 관점
                </option>
                <option value="distribution_shape">
                  성공 횟수 분포 모양 관찰
                </option>
                <option value="personal_question">
                  스스로 생긴 궁금증
                </option>
              </select>
            </div>

            <div className="mt-5">
              <label
                htmlFor="reflection"
                className="block text-sm font-semibold text-slate-200"
              >
                결과 해석 또는 느낀 점
              </label>
              <textarea
                id="reflection"
                value={reflection}
                onChange={(event) => {
                  setReflection(event.target.value);
                  setSubmitMessage("");
                  setSubmitError("");
                }}
                rows={6}
                className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 leading-7 text-white outline-none transition focus:border-cyan-300"
                placeholder="예: 반복 횟수를 늘릴수록 시뮬레이션 평균이 이론 평균 np에 가까워지는 것을 확인했다..."
              />
            </div>

            {submitError ? (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
                {submitError}
              </div>
            ) : null}

            {submitMessage ? (
              <div className="mt-4 rounded-xl border border-green-400/30 bg-green-950/40 p-4 text-sm text-green-200">
                {submitMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSubmitResponse}
              disabled={isSubmitting}
              className="mt-5 rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "제출 중..." : "결과와 성찰 제출하기"}
            </button>
          </div>
        </section>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
          아직 시뮬레이션을 실행하지 않았습니다. 값을 설정한 뒤 실행 버튼을
          눌러 주세요.
        </div>
      )}
    </section>
  );
}