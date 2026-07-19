import { NextResponse } from "next/server";

/**
 * GET /api/economics/exchange-rate
 * 환율 미니활동(경제수학) 탭① "최신 환율" 하이브리드용 프록시.
 * Frankfurter(유럽중앙은행 ECB 참조환율, 무료)에서 base=EUR 로 받아 KRW-per-통화 계산.
 * 반환: { ok, date, krw: { USD: 1485.3, ... }, oil: 81.78 | null }  (통화 1단위 = ? 원, 유가 $/배럴)
 * 실패 시 502 → 클라이언트는 내장 스냅샷 유지.
 */

export const dynamic = "force-dynamic";

const CODES = ["USD", "CNY", "JPY", "EUR", "GBP", "AUD", "CAD", "CHF", "HKD", "SGD"];

async function fetchOil(): Promise<number | null> {
  try {
    const r = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/CL=F?range=1d&interval=1d", { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
    if (!r.ok) return null;
    const p = (await r.json())?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof p === "number" ? Math.round(p * 100) / 100 : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const url = `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW,${CODES.join(",")}`;
    const [res, oil] = await Promise.all([
      fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }),
      fetchOil(),
    ]);
    if (!res.ok) throw new Error(`frankfurter ${res.status}`);
    const json = await res.json();
    const rates = json?.rates;
    if (!rates?.KRW) throw new Error("no KRW");
    const krw: Record<string, number> = {};
    for (const c of CODES) if (rates[c]) krw[c] = Math.round((rates.KRW / rates[c]) * 100) / 100;
    return NextResponse.json({ ok: true, date: json.date, krw, oil });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 502 });
  }
}
