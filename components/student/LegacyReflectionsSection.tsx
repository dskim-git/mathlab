"use client";

// 옛 Streamlit 앱에서 이식한 성찰(legacy_reflections) 표시 섹션.
// /student/reflections 페이지 상단에 한 줄 임포트로 들어간다. (/teacher 학생 상세에도 재사용 가능)
//
// 옛 형식 보존: payload 안의 모든 키·값을 그대로 표시.
// RLS: 본인 SELECT 정책으로 자기 행만 받음. 데이터 없으면 섹션 자체 숨김.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { REFLECTION_LABELS } from "@/lib/legacy/reflectionLabels";

type LegacyRow = {
  id: string;
  source_subject: string | null;
  activity_label: string;
  payload: Record<string, unknown>;
  legacy_created_at: string | null;
};

export function LegacyReflectionsSection({
  studentId,
  accentText,
}: {
  studentId: string | null;
  accentText: string;
}) {
  const [rows, setRows] = useState<LegacyRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("legacy_reflections")
        .select("id, source_subject, activity_label, payload, legacy_created_at")
        .eq("student_id", studentId)
        .order("legacy_created_at", { ascending: false, nullsFirst: false });
      if (!active) return;
      setRows((data ?? []) as LegacyRow[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [studentId]);

  if (!studentId) return null;
  if (loading) {
    return (
      <p className="mb-6 text-sm text-slate-400">옛 성찰 불러오는 중...</p>
    );
  }
  if (rows.length === 0) return null; // 데이터 없으면 섹션 통째로 숨김

  return (
    <section className="mb-8 rounded-2xl border border-amber-300/25 bg-amber-300/[0.04] p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className={`text-base font-bold ${accentText}`}>
            📜 이전 성찰 (옛 앱 이식)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            기존 Streamlit 앱에서 작성한 성찰 {rows.length}건 — 옛 형식 그대로
            보존. 클릭으로 펼쳐 보세요.
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <details
            key={r.id}
            className="rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 transition open:bg-slate-950"
          >
            <summary className="cursor-pointer text-sm marker:text-slate-500">
              <span className="font-semibold text-white">{r.activity_label}</span>
              {r.source_subject ? (
                <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                  {r.source_subject}
                </span>
              ) : null}
              {r.legacy_created_at ? (
                <span className="ml-2 text-[11px] text-slate-500">
                  {new Date(r.legacy_created_at).toLocaleString("ko-KR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              ) : null}
            </summary>
            <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3 text-xs">
              {Object.entries(r.payload).map(([k, v]) => {
                const value = String(v ?? "").trim();
                if (!value) return null;
                // 활동별 매핑된 진짜 질문 텍스트가 있으면 그것으로, 없으면 컬럼명 그대로.
                const label =
                  REFLECTION_LABELS[r.activity_label]?.[k] ?? k;
                return (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {label}
                    </span>
                    <span className="whitespace-pre-wrap text-slate-100">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
