import { NextResponse } from "next/server";

/**
 * GET /api/economics/stock-index
 * 주가지수 미니활동(경제수학) 하이브리드 새로고침용 프록시.
 * 야후 파이낸스 API 는 브라우저에서 CORS 로 막히므로 서버에서 대신 호출한다.
 *
 *  · (기본) 4개 지수 현재가:        /api/economics/stock-index
 *  · 종목 시가총액(탭② 새로고침): /api/economics/stock-index?tickers=005930.KS,000660.KS,...
 *
 * 실패 시 502 → 클라이언트는 내장 스냅샷 유지.
 */

export const dynamic = "force-dynamic"; // 네트워크 호출 → 캐시 금지

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const YAHOO_API = "https://query2.finance.yahoo.com";

const INDEX_SYMBOLS: Record<string, string> = {
  kospi: "%5EKS11",
  kosdaq: "%5EKQ11",
  kospi200: "%5EKS200",
  nasdaq: "%5EIXIC",
};

type IndexQuote = { price: number | null; prevClose: number | null; time: number | null };
type Cap = { price: number | null; mcap: number | null };
type SeriesPoint = { date: string; close: number };

async function fetchIndexHistory(sym: string) {
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - 10 * 365 * 24 * 60 * 60;
  const url = `${YAHOO_API}/v8/finance/chart/${sym}?period1=${period1}&period2=${period2}&interval=1d&_=${Date.now()}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`${sym} history -> ${res.status}`);
  const result = (await res.json())?.chart?.result?.[0];
  if (!result) throw new Error(`${sym} -> no history`);

  const timestamps: number[] = result.timestamp || [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
  const timezone = result.meta?.exchangeTimezoneName || "UTC";
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const points: SeriesPoint[] = timestamps.flatMap((timestamp, i) => {
    const close = closes[i];
    if (typeof close !== "number" || !Number.isFinite(close)) return [];
    return [{ date: dateFormatter.format(new Date(timestamp * 1000)), close }];
  });
  const current = result.meta?.regularMarketPrice;
  const currentTime = result.meta?.regularMarketTime;
  if (typeof current === "number" && typeof currentTime === "number") {
    const date = dateFormatter.format(new Date(currentTime * 1000));
    const last = points[points.length - 1];
    if (last?.date === date) last.close = current;
    else points.push({ date, close: current });
  }

  const monthly = new Map<string, SeriesPoint>();
  const yearly = new Map<string, SeriesPoint>();
  for (const point of points) {
    monthly.set(point.date.slice(0, 7), { date: point.date.slice(0, 7), close: point.close });
    yearly.set(point.date.slice(0, 4), { date: point.date.slice(0, 4), close: point.close });
  }
  const latestDate = points[points.length - 1]?.date || "";
  const dailyStart = new Date();
  dailyStart.setMonth(dailyStart.getMonth() - 6);
  const daily = points.filter((point) => point.date >= dailyStart.toISOString().slice(0, 10));
  return {
    price: typeof current === "number" ? current : null,
    prevClose: typeof result.meta?.chartPreviousClose === "number" ? result.meta.chartPreviousClose : null,
    time: typeof currentTime === "number" ? currentTime : null,
    asOf: latestDate,
    series: { yearly: [...yearly.values()], monthly: [...monthly.values()], daily },
  };
}

// ── 지수 현재가(차트 API meta — 크럼 불필요) ──
async function fetchIndexQuote(sym: string): Promise<IndexQuote> {
  const url = `${YAHOO_API}/v8/finance/chart/${sym}?range=1d&interval=1d&_=${Date.now()}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`${sym} -> ${res.status}`);
  const meta = (await res.json())?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`${sym} -> no meta`);
  return {
    price: typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : null,
    prevClose:
      typeof meta.chartPreviousClose === "number"
        ? meta.chartPreviousClose
        : typeof meta.previousClose === "number"
          ? meta.previousClose
          : null,
    time: typeof meta.regularMarketTime === "number" ? meta.regularMarketTime : null,
  };
}

// ── 개별 종목 시가총액(v7 quote — 크럼 필요) ──
async function getCookieCrumb(): Promise<{ cookie: string; crumb: string }> {
  const r1 = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA } }).catch(() => null);
  const raw = (r1 && r1.headers.get("set-cookie")) || "";
  const cookie = raw.split(";")[0];
  const r2 = await fetch(`${YAHOO_API}/v1/test/getcrumb`, {
    headers: { "User-Agent": UA, Cookie: cookie },
  });
  const crumb = await r2.text();
  if (!crumb || crumb.includes("<")) throw new Error("crumb 획득 실패");
  return { cookie, crumb };
}

async function fetchCaps(tickers: string[]): Promise<Record<string, Cap>> {
  const { cookie, crumb } = await getCookieCrumb();
  const out: Record<string, Cap> = {};
  for (let i = 0; i < tickers.length; i += 15) {
    const batch = tickers.slice(i, i + 15);
    const url = `${YAHOO_API}/v7/finance/quote?symbols=${encodeURIComponent(
      batch.join(",")
    )}&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Cookie: cookie }, cache: "no-store" });
    if (!res.ok) throw new Error(`quote -> ${res.status}`);
    for (const q of (await res.json())?.quoteResponse?.result || []) {
      out[q.symbol] = {
        price: typeof q.regularMarketPrice === "number" ? q.regularMarketPrice : null,
        mcap: typeof q.marketCap === "number" ? q.marketCap : null,
      };
    }
  }
  return out;
}

export async function GET(req: Request) {
  const tickersParam = new URL(req.url).searchParams.get("tickers");
  try {
    if (tickersParam) {
      const tickers = tickersParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 40);
      const caps = await fetchCaps(tickers);
      const kospiQuote = await fetchIndexQuote(INDEX_SYMBOLS.kospi).catch(() => null);
      return NextResponse.json({ ok: true, fetchedAt: Date.now(), caps, kospiQuote });
    }
    const entries = await Promise.all(
      Object.entries(INDEX_SYMBOLS).map(async ([key, sym]) => {
        try {
          return [key, await fetchIndexHistory(sym)] as const;
        } catch (historyError) {
          const quote = await fetchIndexQuote(sym);
          return [key, { ...quote, asOf: quote.time ? new Date(quote.time * 1000).toISOString().slice(0, 10) : null, series: null, historyError: historyError instanceof Error ? historyError.message : "history failed" }] as const;
        }
      })
    );
    return NextResponse.json({ ok: true, fetchedAt: Date.now(), quotes: Object.fromEntries(entries) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 502 }
    );
  }
}
