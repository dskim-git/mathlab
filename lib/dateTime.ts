export const KOREA_TIME_ZONE = "Asia/Seoul";

type EmptyFallback = "-" | "";

export function formatKoreanDateTime(
  value: string | null | undefined,
  emptyFallback: EmptyFallback = "-"
) {
  if (!value) {
    return emptyFallback;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatKoreanDateTimeWithSeconds(
  value: string | null | undefined,
  emptyFallback: EmptyFallback = "-"
) {
  if (!value) {
    return emptyFallback;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}