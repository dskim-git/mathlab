"use client";

import { useState } from "react";
import { formatKoreanDateTime } from "@/lib/dateTime";

export type TeacherRecordRowData = {
  id: string;
  student_code: string | null;
  student_number: number | null;
  subject: string | null;
  activity_slug: string | null;
  reflection_data: {
    interpretationType?: string;
    reflection?: string;
  } | null;
  response_data: {
    modeLabel?: string;
    n?: number;
    repeats?: number;
    p?: number;
    observedMean?: number;
    expectedMean?: number;
    observedVariance?: number;
    expectedVariance?: number;
  } | null;
  created_at: string | null;
  activities: {
    title: string | null;
  } | null;
  students: {
    profiles: {
      name: string | null;
    } | null;
  } | null;
};

const COLUMN_COUNT = 6;

function previewText(text: string, max = 90) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function getInterpretationLabel(value?: string) {
  switch (value) {
    case "theory_comparison":
      return "시뮬레이션 결과와 이론값 비교";
    case "large_number_law":
      return "반복 횟수와 큰 수의 법칙 관점";
    case "distribution_shape":
      return "성공 횟수 분포 모양 관찰";
    case "personal_question":
      return "스스로 생긴 궁금증";
    default:
      return value ?? "-";
  }
}

function formatNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return value.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
}

export default function TeacherRecordRow({
  row,
}: {
  row: TeacherRecordRowData;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const data = row.response_data;
  const reflection = row.reflection_data?.reflection?.trim() ?? "";
  const hasResultData = data != null && Object.keys(data).length > 0;

  const stats = [
    { label: "실험 종류", value: data?.modeLabel ?? "-" },
    { label: "시행 수 n", value: formatNumber(data?.n) },
    { label: "반복 횟수", value: formatNumber(data?.repeats) },
    { label: "성공확률 p", value: formatNumber(data?.p) },
    { label: "시뮬레이션 평균", value: formatNumber(data?.observedMean) },
    { label: "이론 평균 np", value: formatNumber(data?.expectedMean) },
    { label: "시뮬레이션 분산", value: formatNumber(data?.observedVariance) },
    { label: "이론 분산", value: formatNumber(data?.expectedVariance) },
  ];

  return (
    <>
      <tr
        onClick={() => setIsExpanded((current) => !current)}
        className="cursor-pointer border-b border-white/5 align-top text-slate-300 transition hover:bg-white/5"
      >
        <td className="py-4 pr-4 font-semibold text-white">
          {row.students?.profiles?.name ?? "-"}
        </td>

        <td className="py-4 pr-4 text-slate-300">
          {row.student_code ?? row.student_number ?? "-"}
        </td>

        <td className="py-4 pr-4">
          {row.activities?.title ?? row.activity_slug ?? "-"}
        </td>

        <td className="py-4 pr-4">{row.subject ?? "-"}</td>

        <td className="py-4 pr-4 whitespace-nowrap">
          {formatKoreanDateTime(row.created_at)}
        </td>

        <td className="py-4 pr-4 text-slate-400">
          <span>{reflection ? previewText(reflection) : "-"}</span>
          <span className="ml-2 text-cyan-300">
            {isExpanded ? "▴ 접기" : "▾ 자세히"}
          </span>
        </td>
      </tr>

      {isExpanded ? (
        <tr className="border-b border-white/10 bg-slate-950/60">
          <td colSpan={COLUMN_COUNT} className="px-4 py-5">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  해석 관점
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {getInterpretationLabel(row.reflection_data?.interpretationType)}
                </p>
              </div>

              {hasResultData ? (
                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    결과 요약
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-white/10 bg-slate-900 p-3"
                      >
                        <p className="text-[11px] text-slate-400">
                          {stat.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-cyan-200">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-xs font-semibold text-slate-400">
                  전체 성찰
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                  {reflection || "성찰 내용 없음"}
                </p>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
