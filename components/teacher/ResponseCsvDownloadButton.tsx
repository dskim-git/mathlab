"use client";

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

type StudentResponse = {
  id: string;
  student_name: string;
  student_number: string | null;
  result: ResponseResult | null;
  reflection: string | null;
  created_at: string | null;
};

type ResponseCsvDownloadButtonProps = {
  sessionTitle: string;
  joinCode: string;
  responses: StudentResponse[];
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

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

function createCsvContent(responses: StudentResponse[]) {
  const headers = [
    "제출시각",
    "학생이름",
    "학번",
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
    formatDateTime(response.created_at),
    response.student_name,
    response.student_number ?? "",
    response.result?.modeLabel ?? "",
    response.result?.n ?? "",
    response.result?.repeats ?? "",
    response.result?.p ?? "",
    response.result?.observedMean ?? "",
    response.result?.expectedMean ?? "",
    response.result?.observedVariance ?? "",
    response.result?.expectedVariance ?? "",
    getInterpretationTypeLabel(response.result?.interpretationType),
    response.reflection ?? "",
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
    const blob = new Blob([`\uFEFF${csvContent}`], {
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