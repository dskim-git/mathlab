"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { SEBTEUK_MODELS } from "@/lib/ai/sebteukPrompt";

type TeacherRow = {
  id: string; // teachers.id
  profile_id: string;
  ai_sebteuk_enabled: boolean;
  allowed_sebteuk_models: string[] | null;
  profiles: {
    name: string | null;
    login_id: string | null;
    status: string | null;
  } | null;
};

type Props = {
  accentText: string;
};

export function AiSebteukToggleList({ accentText }: Props) {
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("teachers")
      .select(
        "id, profile_id, ai_sebteuk_enabled, allowed_sebteuk_models, profiles ( name, login_id, status )"
      )
      .order("id");
    if (error) setErrorMessage(error.message);
    setRows((data ?? []) as unknown as TeacherRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleEnabled(row: TeacherRow) {
    setBusyId(row.id);
    setErrorMessage("");
    const next = !row.ai_sebteuk_enabled;
    const { error } = await supabase
      .from("teachers")
      .update({ ai_sebteuk_enabled: next })
      .eq("id", row.id);
    if (error) {
      setErrorMessage(error.message);
      setBusyId(null);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, ai_sebteuk_enabled: next } : r
      )
    );
    setBusyId(null);
  }

  async function saveAllowedModels(row: TeacherRow, value: string[] | null) {
    setBusyId(row.id);
    setErrorMessage("");
    const { error } = await supabase
      .from("teachers")
      .update({ allowed_sebteuk_models: value })
      .eq("id", row.id);
    if (error) {
      setErrorMessage(error.message);
      setBusyId(null);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, allowed_sebteuk_models: value } : r
      )
    );
    setBusyId(null);
  }

  async function toggleModel(row: TeacherRow, modelId: string) {
    // null이면 글로벌 따름 — 토글 시작하면 현재 글로벌 전체로 시드 후 변경
    let cur: string[];
    if (row.allowed_sebteuk_models == null) {
      cur = SEBTEUK_MODELS.map((m) => m.id);
    } else {
      cur = [...row.allowed_sebteuk_models];
    }
    const idx = cur.indexOf(modelId);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.push(modelId);
    await saveAllowedModels(row, cur);
  }

  async function resetToGlobal(row: TeacherRow) {
    await saveAllowedModels(row, null);
  }

  const approved = rows.filter((r) => r.profiles?.status === "approved");
  const enabledCount = approved.filter((r) => r.ai_sebteuk_enabled).length;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">
            🤖 AI세특 사용 권한 ({enabledCount}/{approved.length} 활성)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            교사별 사용 권한 토글 + 사용 가능 모델 개별 제한. "글로벌 따름" 상태
            (회색)면 위 모델 허용 목록을 그대로 따릅니다.
          </p>
        </div>
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

      {approved.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-sm text-slate-400">
          승인된 교사가 없습니다.
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {approved.map((row) => {
            const on = row.ai_sebteuk_enabled;
            const isBusy = busyId === row.id;
            const isOpen = openId === row.id;
            const followsGlobal = row.allowed_sebteuk_models == null;
            const allowedSet = new Set(
              row.allowed_sebteuk_models ??
                SEBTEUK_MODELS.map((m) => m.id)
            );
            return (
              <li
                key={row.id}
                className="rounded-lg border border-white/5 bg-slate-950/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {row.profiles?.name ?? "(이름 없음)"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {row.profiles?.login_id ?? ""}
                      {!followsGlobal ? (
                        <span className={`ml-2 ${accentText}`}>
                          · 개별 모델 {row.allowed_sebteuk_models?.length ?? 0}개
                        </span>
                      ) : (
                        <span className="ml-2 text-slate-500">
                          · 모델 = 글로벌 따름
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenId((cur) => (cur === row.id ? null : row.id))
                      }
                      className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                    >
                      {isOpen ? "닫기" : "모델 설정"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleEnabled(row)}
                      disabled={isBusy}
                      aria-label={
                        on ? "AI세특 권한 해제" : "AI세특 권한 부여"
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
                        on
                          ? `bg-emerald-300/15 ${accentText} border border-emerald-300/30`
                          : "border border-white/15 bg-slate-900 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {isBusy ? "..." : on ? "✓ 활성" : "비활성"}
                    </button>
                  </div>
                </div>

                {isOpen ? (
                  <div className="border-t border-white/5 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-300">
                        이 교사가 사용 가능한 모델
                      </p>
                      <button
                        type="button"
                        onClick={() => resetToGlobal(row)}
                        disabled={isBusy || followsGlobal}
                        className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-white/10 disabled:opacity-60"
                      >
                        글로벌 따름으로
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {SEBTEUK_MODELS.map((m) => {
                        const allowed = followsGlobal
                          ? null
                          : allowedSet.has(m.id);
                        return (
                          <li key={m.id}>
                            <label className="flex items-center gap-2 rounded border border-white/5 bg-slate-900/60 px-2 py-1 text-xs">
                              <input
                                type="checkbox"
                                disabled={isBusy}
                                checked={allowed === null ? true : allowed}
                                onChange={() => toggleModel(row, m.id)}
                                className="h-3 w-3"
                              />
                              <span
                                className={
                                  allowed === false
                                    ? "text-slate-500 line-through"
                                    : "text-slate-200"
                                }
                              >
                                {m.label}
                              </span>
                              {followsGlobal ? (
                                <span className="ml-auto text-[10px] text-slate-500">
                                  글로벌
                                </span>
                              ) : null}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 text-[10px] text-slate-500">
                      ※ 실제 사용 = 글로벌 허용 ∩ 교사 허용. 글로벌에서 끈 모델은
                      여기서 켜도 사용 불가.
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-amber-200">
        ⚠️ AI세특 활성화 시 Claude API 비용이 시스템에 청구됩니다. 신뢰할 수
        있는 교사에게만, 필요한 모델만 허용하세요.
      </p>
    </section>
  );
}
