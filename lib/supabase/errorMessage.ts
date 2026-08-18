// Supabase(PostgREST) 오류는 Error 인스턴스가 아니라 평범한 객체
// { message, details, hint, code } 다. 그래서 `err instanceof Error ? err.message : String(err)`
// 로 처리하면 화면에 "[object Object]" 만 뜨고 원인을 알 수 없다.
// DB 오류는 details/hint/code 에 진짜 단서가 있으므로 함께 붙여 보여준다.
export function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;

  if (err && typeof err === "object") {
    const e = err as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts = [e.message, e.details, e.hint].filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0
    );
    const code = typeof e.code === "string" && e.code ? ` [${e.code}]` : "";
    if (parts.length > 0) return parts.join(" — ") + code;
    try {
      return JSON.stringify(err);
    } catch {
      // 순환 참조 등 — 아래 기본값으로 떨어진다
    }
  }

  return String(err);
}
