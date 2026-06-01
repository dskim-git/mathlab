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
  /** 마감 시각. NOT NULL = 학생이 더 이상 수정 못 함. */
  locked_at?: string | null;
  /** 학년·반(조회 쿼리에 같이 가져오는 경우). 마감 일괄 처리에 필요. */
  grade?: number | null;
  class_number?: number | null;
};

export { formatKoreanDateTime };

export function previewText(text: string, max = 90) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function getInterpretationLabel(value?: string) {
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

export function formatNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return value.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
}

/** 펼친 상세(해석 관점 / 결과 요약 / 전체 성찰). 데스크톱 표 행과 모바일 카드가 공유한다. */
export function RecordDetail({ row }: { row: TeacherRecordRowData }) {
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
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-slate-400">해석 관점</p>
        <p className="mt-1 text-sm text-slate-200">
          {getInterpretationLabel(row.reflection_data?.interpretationType)}
        </p>
      </div>

      {hasResultData ? (
        <div>
          <p className="text-xs font-semibold text-slate-400">결과 요약</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-white/10 bg-slate-900 p-3"
              >
                <p className="text-[11px] text-slate-400">{stat.label}</p>
                <p className="mt-1 text-sm font-semibold text-cyan-200">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-semibold text-slate-400">전체 성찰</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-200">
          {reflection || "성찰 내용 없음"}
        </p>
      </div>
    </div>
  );
}
