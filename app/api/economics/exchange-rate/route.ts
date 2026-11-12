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
const SERIES_START = "2014-12-31";

type RateSeries = { dates: string[]; rates: Record<string, (number | null)[]> };

function makeSeries(points: Array<{ date: string; rates: Record<string, number | null> }>): RateSeries {
  return {
    dates: points.map((point) => point.date),
    rates: Object.fromEntries(CODES.map((code) => [code, points.map((point) => point.rates[code] ?? null)])),
  };
}

function toKrwSeries(raw: Record<string, Record<string, number>>) {
  const points = Object.entries(raw)
    .map(([date, rates]) => ({
      date,
      rates: Object.fromEntries(CODES.map((code) => {
        const eurKrw = rates.KRW;
        const perEur = code === "EUR" ? 1 : rates[code];
        const value = eurKrw && perEur ? eurKrw / perEur : null;
        return [code, value == null ? null : Math.round(value * 100) / 100];
      })) as Record<string, number | null>,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const daily = points.slice(-180);
  const groupBy = (sliceLength: number): RateSeries => {
    const grouped = new Map<string, (typeof points)[number]>();
    for (const point of points) grouped.set(point.date.slice(0, sliceLength), point);
    return makeSeries([...grouped.values()]);
  };
  return { daily: makeSeries(daily), monthly: groupBy(7), yearly: groupBy(4) };
}

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

export async function GET(req: Request) {
  try {
    if (new URL(req.url).searchParams.get("history") === "1") {
      const symbols = ["KRW", ...CODES.filter((code) => code !== "EUR")].join(",");
      const url = `https://api.frankfurter.dev/v1/${SERIES_START}..?base=EUR&symbols=${symbols}`;
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
      if (!res.ok) throw new Error(`frankfurter history ${res.status}`);
      const json = await res.json();
      const series = toKrwSeries(json?.rates || {});
      if (!series.daily.dates.length) throw new Error("no exchange-rate history");
      return NextResponse.json(
        { ok: true, date: json.end_date || series.daily.dates.at(-1), series },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const url = `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW,${CODES.join(",")}`;
    const [res, oil] = await Promise.all([
      fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" }),
      fetchOil(),
    ]);
    if (!res.ok) throw new Error(`frankfurter ${res.status}`);
    const json = await res.json();
    // base=EUR 응답의 rates 에는 기준통화 EUR 자신이 빠져 있으므로 1 로 채워 준다.
    const rates = { EUR: 1, ...json?.rates };
    if (!rates?.KRW) throw new Error("no KRW");
    const krw: Record<string, number> = {};
    for (const c of CODES) if (rates[c]) krw[c] = Math.round((rates.KRW / rates[c]) * 100) / 100;
    return NextResponse.json({ ok: true, date: json.date, krw, oil });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 502 });
  }
}
