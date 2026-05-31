"use client";

import type { ComponentType } from "react";

/**
 * 활동별 "본인 결과" 렌더러. 학생 활동 기록 페이지에서 raw JSON 대신
 * 활동마다 의미 있는 시각화로 본인 결과를 보여주기 위한 인프라.
 *
 * - 등록되지 않은 슬러그는 RawJsonResult 가 reflection_data / response_data 의
 *   키-값을 그대로 보여준다 (활동 60+개를 한 번에 다 만들지 않아도 빈 화면 X).
 * - 활동별 시각화가 필요해지면 ACTIVITY_RESULT_RENDERERS 에 컴포넌트를 등록한다.
 */
export type ActivityResultProps = {
  responseData: Record<string, unknown> | null;
  reflectionData: Record<string, unknown> | null;
};

// ── Fallback: raw JSON 펼쳐보기 ──────────────────────────────
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function valueText(v: unknown): string {
  if (v == null) return "-";
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? v.toLocaleString("ko-KR")
      : v.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
  }
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "예" : "아니오";
  if (Array.isArray(v))
    return v.length === 0 ? "(빈 배열)" : `[${v.length}개]`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function RawJsonResult({ responseData, reflectionData }: ActivityResultProps) {
  const dataEntries = isPlainObject(responseData)
    ? Object.entries(responseData)
    : [];
  // reflection_data 안의 reflection 본문은 외부에서 따로 표시(중복 X).
  const reflEntries = isPlainObject(reflectionData)
    ? Object.entries(reflectionData).filter(([k]) => k !== "reflection")
    : [];

  if (dataEntries.length === 0 && reflEntries.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        저장된 결과 데이터가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {dataEntries.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-slate-400">활동 결과</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {dataEntries.map(([k, v]) => (
              <div
                key={k}
                className="rounded-lg border border-white/10 bg-slate-900/60 p-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                  {k}
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-cyan-200">
                  {valueText(v)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {reflEntries.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-slate-400">성찰 부가 정보</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {reflEntries.map(([k, v]) => {
              // 새 형식: { prompt, answer } — prompt 를 한국어 라벨로.
              // 옛 형식(string): 영어 id 그대로 라벨, 값은 문자열.
              const isStructured =
                isPlainObject(v) && typeof v.prompt === "string";
              const label = isStructured
                ? (v as { prompt: string }).prompt
                : k;
              const valueRaw = isStructured
                ? (v as { answer?: unknown }).answer ?? ""
                : v;
              return (
                <div
                  key={k}
                  className="rounded-lg border border-white/10 bg-slate-900/60 p-3"
                >
                  <p
                    className={
                      isStructured
                        ? "text-xs text-slate-400"
                        : "text-[10px] uppercase tracking-wider text-slate-400"
                    }
                  >
                    {label}
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-200 whitespace-pre-wrap">
                    {valueText(valueRaw)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── 활동별 커스텀 렌더러 매핑 ────────────────────────────────
// 활동별로 자체 렌더러가 만들어지는 대로 여기에 추가한다.
// 키는 activity_slug (registry.ts의 ACTIVITY_REGISTRY 와 같은 식별자).
export const ACTIVITY_RESULT_RENDERERS: Record<
  string,
  ComponentType<ActivityResultProps>
> = {
  // 예시) "probability_new/mini/galton_board": GaltonBoardResult,
};

/**
 * 슬러그 → 결과 렌더러. 없으면 RawJsonResult fallback.
 */
export function getResultRenderer(
  activitySlug: string | null | undefined
): ComponentType<ActivityResultProps> {
  if (activitySlug && ACTIVITY_RESULT_RENDERERS[activitySlug]) {
    return ACTIVITY_RESULT_RENDERERS[activitySlug];
  }
  return RawJsonResult;
}
