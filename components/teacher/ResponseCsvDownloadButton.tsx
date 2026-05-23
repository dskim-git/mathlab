"use client";

import { formatKoreanDateTime } from "@/lib/dateTime";

type ResponseResult = {
  activitySlug?: string;
  mode?: string;
  modeLabel?: string;
  n?: number;
  repeats?: number;
  p?: number;
  observedMean?: number;
  expectedMean?: number;
  observedVariance?: number;
  expectedVariance?: number;
  interpretationType?: string;
};

export type SessionResponseRow = {
  id: string;
  created_at: string | null;
  student_code: string | null;
  student_number: number | null;
  grade: number | null;
  class_number: number | null;
  response_data: ResponseResult | null;
  reflection_data: {
    reflection?: string;
  } | null;
  students: {
    profiles: {
      name: string | null;
    } | null;
  } | null;
};

type ResponseCsvDownloadButtonProps = {
  sessionTitle: string;
  joinCode: string;
  responses: SessionResponseRow[];
};

function getInterpretationTypeLabel(value: string | undefined) {
  if (value === "theory_comparison") {
    return "이론값 비교";
  }

  if (value === "large_number_law") {
    return "큰 수의 법칙";
  }

  if (value === "distribution_shape") {
    return "분포 모양";
  }

  if (value === "personal_question") {
    return "추가 궁금증";
  }

  return "";
}

function escapeCsvCell(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  const escapedValue = stringValue.replaceAll('"', '""');

  return `"${escapedValue}"`;
}

function createCsvContent(responses: SessionResponseRow[]) {
  const headers = [
    "제출시각",
    "이름",
    "학번",
    "학년",
    "반",
    "번호",
    "실험종류",
    "시행수 n",
    "반복횟수",
    "성공확률 p",
    "시뮬레이션 평균",
    "이론 평균",
    "시뮬레이션 분산",
    "이론 분산",
    "해석 관점",
    "성찰 내용",
  ];

  const rows = responses.map((response) => [
    formatKoreanDateTime(response.created_at, ""),
    response.students?.profiles?.name ?? "",
    response.student_code ?? "",
    response.grade ?? "",
    response.class_number ?? "",
    response.student_number ?? "",
    response.response_data?.modeLabel ?? "",
    response.response_data?.n ?? "",
    response.response_data?.repeats ?? "",
    response.response_data?.p ?? "",
    response.response_data?.observedMean ?? "",
    response.response_data?.expectedMean ?? "",
    response.response_data?.observedVariance ?? "",
    response.response_data?.expectedVariance ?? "",
    getInterpretationTypeLabel(response.response_data?.interpretationType),
    response.reflection_data?.reflection ?? "",
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

function createSafeFileName(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

export default function ResponseCsvDownloadButton({
  sessionTitle,
  joinCode,
  responses,
}: ResponseCsvDownloadButtonProps) {
  function handleDownload() {
    const csvContent = createCsvContent(responses);

    // Excel에서 한글이 깨지지 않도록 UTF-8 BOM 추가
    const blob = new Blob([`﻿${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const safeSessionTitle = createSafeFileName(sessionTitle);
    const fileName = `mathlab_${safeSessionTitle}_${joinCode}_responses.csv`;

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={responses.length === 0}
      className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      CSV 다운로드
    </button>
  );
}
