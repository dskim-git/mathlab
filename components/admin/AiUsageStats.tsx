"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { SEBTEUK_MODELS } from "@/lib/ai/sebteukPrompt";

type UsageRow = {
  id: string;
  teacher_id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  created_at: string;
  profiles: {
    name: string | null;
    login_id: string | null;
  } | null;
};

const USD_TO_KRW = 1400;

function modelPricing(model: string) {
  return SEBTEUK_MODELS.find((m) => m.id === model);
}

// (input + cache_write*1.25 + cache_read*0.1) * inRate + output * outRate, /1M = USD
function rowCostUsd(row: UsageRow): number {
  const p = modelPricing(row.model);
  if (!p) return 0;
  return (
    (row.input_tokens * p.pricingIn +
      row.cache_write_tokens * p.pricingIn * 1.25 +
      row.cache_read_tokens * p.pricingIn * 0.1 +
      row.output_tokens * p.pricingOut) /
    1_000_000
  );
}

function fmtNum(n: number) {
  return n.toLocaleString("ko-KR");
}
function fmtUsd(n: number) {
  return `$${n.toFixed(4)}`;
}
function fmtKrw(n: number) {
  return `₩${Math.round(n * USD_TO_KRW).toLocaleString("ko-KR")}`;
}
function fmtDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

type Props = {
  accentText: string;
};

type PerTeacher = {
  teacher_id: string;
  name: string;
  loginId: string;
  calls: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
};

export function AiUsageStats({ accentText }: Props) {
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("ai_usage_log")
      .select(
        "id, teacher_id, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, created_at, profiles ( name, login_id )"
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) setErrorMessage(error.message);
    setRows((data ?? []) as unknown as UsageRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    let calls = rows.length;
    let input = 0;
    let output = 0;
    let cacheRead = 0;
    let cacheWrite = 0;
    let cost = 0;
    rows.forEach((r) => {
      input += r.input_tokens;
      output += r.output_tokens;
      cacheRead += r.cache_read_tokens;
      cacheWrite += r.cache_write_tokens;
      cost += rowCostUsd(r);
    });
    return { calls, input, output, cacheRead, cacheWrite, cost };
  }, [rows]);

  const perTeacher = useMemo<PerTeacher[]>(() => {
    const map = new Map<string, PerTeacher>();
    rows.forEach((r) => {
      let bucket = map.get(r.teacher_id);
      if (!bucket) {
        bucket = {
          teacher_id: r.teacher_id,
          name: r.profiles?.name ?? "(이름 없음)",
          loginId: r.profiles?.login_id ?? "",
          calls: 0,
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          cost: 0,
        };
        map.set(r.teacher_id, bucket);
      }
      bucket.calls += 1;
      bucket.input += r.input_tokens;
      bucket.output += r.output_tokens;
      bucket.cacheRead += r.cache_read_tokens;
      bucket.cacheWrite += r.cache_write_tokens;
      bucket.cost += rowCostUsd(r);
    });
    return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
  }, [rows]);

  return (
    <div className="space-y-4">
      {/* 전체 누적 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">🤖 AI 사용 — 전체 누적</h2>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "..." : "새로고침"}
          </button>
        </div>

        {errorMessage ? (
          <Alert tone="error" className="mt-3">
            {errorMessage}
          </Alert>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <p className="text-[11px] text-slate-400">호출 횟수</p>
            <p className={`mt-1 text-xl font-bold ${accentText}`}>
              {fmtNum(totals.calls)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <p className="text-[11px] text-slate-400">입력 토큰</p>
            <p className="mt-1 text-xl font-bold text-cyan-200">
              {fmtNum(totals.input)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              + 캐시 쓰기 {fmtNum(totals.cacheWrite)} / 읽기 {fmtNum(totals.cacheRead)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <p className="text-[11px] text-slate-400">출력 토큰</p>
            <p className="mt-1 text-xl font-bold text-emerald-200">
              {fmtNum(totals.output)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-3">
            <p className="text-[11px] text-amber-200">누적 비용 (추정)</p>
            <p className="mt-1 text-xl font-bold text-amber-200">
              {fmtUsd(totals.cost)}
            </p>
            <p className="mt-0.5 text-[10px] text-amber-300/80">
              ≈ {fmtKrw(totals.cost)} (1USD={USD_TO_KRW}원)
            </p>
          </div>
        </div>
      </section>

      {/* 교사별 사용량 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <h2 className="text-base font-bold">
          🧑‍🏫 교사별 누적 ({perTeacher.length}명)
        </h2>
        {perTeacher.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            아직 AI 호출 기록이 없습니다.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                  <th className="py-2 pr-3">교사</th>
                  <th className="py-2 pr-3 text-right">호출</th>
                  <th className="py-2 pr-3 text-right">입력</th>
                  <th className="py-2 pr-3 text-right">출력</th>
                  <th className="py-2 pr-3 text-right">캐시 쓰기/읽기</th>
                  <th className="py-2 pr-3 text-right">비용 (USD)</th>
                  <th className="py-2 pr-3 text-right">비용 (₩)</th>
                </tr>
              </thead>
              <tbody>
                {perTeacher.map((t) => (
                  <tr
                    key={t.teacher_id}
                    className="border-b border-white/5 text-slate-300"
                  >
                    <td className="py-2 pr-3">
                      <div className="font-semibold text-white">{t.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {t.loginId}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right">{fmtNum(t.calls)}</td>
                    <td className="py-2 pr-3 text-right text-cyan-200">
                      {fmtNum(t.input)}
                    </td>
                    <td className="py-2 pr-3 text-right text-emerald-200">
                      {fmtNum(t.output)}
                    </td>
                    <td className="py-2 pr-3 text-right text-slate-400">
                      {fmtNum(t.cacheWrite)} / {fmtNum(t.cacheRead)}
                    </td>
                    <td className="py-2 pr-3 text-right text-amber-200">
                      {fmtUsd(t.cost)}
                    </td>
                    <td className="py-2 pr-3 text-right text-amber-200">
                      {fmtKrw(t.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 최근 호출 로그 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <h2 className="text-base font-bold">최근 호출 (최대 50건)</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">호출 기록이 없습니다.</p>
        ) : (
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
            {rows.slice(0, 50).map((r) => {
              const cost = rowCostUsd(r);
              return (
                <li
                  key={r.id}
                  className="rounded-lg border border-white/5 bg-slate-950/60 p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-white">
                      {r.profiles?.name ?? "(이름 없음)"}{" "}
                      <span className="text-slate-400">
                        {r.profiles?.login_id ? `(${r.profiles.login_id})` : ""}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      {fmtDateTime(r.created_at)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                    <span className={accentText}>{r.model}</span>
                    <span>
                      입력 {fmtNum(r.input_tokens)} · 출력{" "}
                      {fmtNum(r.output_tokens)}
                    </span>
                    <span className="text-slate-500">
                      캐시 W{fmtNum(r.cache_write_tokens)} / R
                      {fmtNum(r.cache_read_tokens)}
                    </span>
                    <span className="ml-auto font-semibold text-amber-200">
                      {fmtUsd(cost)} ≈ {fmtKrw(cost)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
