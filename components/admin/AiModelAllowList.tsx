"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SEBTEUK_MODELS } from "@/lib/ai/sebteukPrompt";
import {
  getEnabledSebteukModels,
  setEnabledSebteukModels,
} from "@/lib/ai/enabledModels";

type Props = {
  accentText: string;
};

export function AiModelAllowList({ accentText }: Props) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setSavedOk(false);
    const ids = await getEnabledSebteukModels(supabase);
    setEnabled(new Set(ids));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(modelId: string) {
    setSavedOk(false);
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setErrorMessage("");
    setSavedOk(false);
    const res = await setEnabledSebteukModels(supabase, Array.from(enabled));
    if (!res.ok) {
      setErrorMessage(res.error);
    } else {
      setSavedOk(true);
    }
    setSaving(false);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">
            🎛 AI 세특 — 허용 모델
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            교사가 세특 작성에서 사용할 수 있는 Claude 모델을 제한합니다.
            드롭다운에 이 목록만 노출됩니다.
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
      {savedOk ? (
        <Alert tone="success" className="mt-3">
          허용 모델이 저장되었습니다.
        </Alert>
      ) : null}

      <ul className="mt-4 space-y-2">
        {SEBTEUK_MODELS.map((m) => {
          const on = enabled.has(m.id);
          return (
            <li
              key={m.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-950/60 p-3 ${
                on
                  ? "border-emerald-300/30"
                  : "border-white/5"
              }`}
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(m.id)}
                  className="h-4 w-4"
                />
                <span>
                  <span className={`font-semibold ${on ? accentText : "text-white"}`}>
                    {m.label}
                  </span>
                  <span className="ml-2 text-[11px] text-slate-500">
                    입력 ${m.pricingIn} / 출력 ${m.pricingOut} (per 1M tok)
                  </span>
                </span>
              </label>
              <code className="text-[10px] text-slate-500">{m.id}</code>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-center justify-end">
        <Button onClick={save} disabled={saving || enabled.size === 0}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>

      <p className="mt-3 text-[11px] text-amber-200">
        ⚠️ 최소 1개 모델은 허용되어야 합니다. AI세특 기능 자체를 꺼두려면 교사
        개별 토글(상단)을 사용하세요.
      </p>
    </section>
  );
}
