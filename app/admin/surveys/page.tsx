"use client";

// /admin/surveys — 설문 정의 CRUD + 응답 현황(역할별 카운트) + on/off 토글.
// surveys 와 survey_responses 는 admin RLS(ALL) 라 client 에서 직접 조작 가능.
// 질문 구조는 JSONB(자유 형식 [{id, prompt, kind, options?}, ...]) — 텍스트 편집.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

type SurveyRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: string | null;
  questions: unknown;
  is_active: boolean;
  consent_text: string | null;
  created_at: string;
  updated_at: string;
};

type CountRow = { survey_id: string; respondent_kind: string | null };

type CountBucket = { student: number; general: number; other: number; total: number };

function emptyBucket(): CountBucket {
  return { student: 0, general: 0, other: 0, total: 0 };
}

export default function AdminSurveysPage() {
  const theme = getRoleTheme("admin");
  const [rows, setRows] = useState<SurveyRow[]>([]);
  const [counts, setCounts] = useState<Map<string, CountBucket>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 편집/생성 폼 상태
  const [editingId, setEditingId] = useState<string | null>(null); // null=새 설문 / 'id'=편집
  const [formOpen, setFormOpen] = useState(false);
  const [fSlug, setFSlug] = useState("");
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fKind, setFKind] = useState("");
  const [fQuestionsJson, setFQuestionsJson] = useState("[]");
  const [fActive, setFActive] = useState(false);
  const [fConsent, setFConsent] = useState(""); // 비우면 동의 단계 X
  const [formError, setFormError] = useState("");
  const [formBusy, setFormBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [sRes, cRes] = await Promise.all([
      supabase
        .from("surveys")
        .select(
          "id, slug, title, description, kind, questions, is_active, consent_text, created_at, updated_at"
        )
        .order("kind", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("survey_responses").select("survey_id, respondent_kind"),
    ]);
    if (sRes.error) setError(sRes.error.message);
    if (cRes.error) setError((e) => e || cRes.error!.message);
    setRows((sRes.data ?? []) as SurveyRow[]);

    const m = new Map<string, CountBucket>();
    for (const r of (cRes.data ?? []) as CountRow[]) {
      let b = m.get(r.survey_id);
      if (!b) {
        b = emptyBucket();
        m.set(r.survey_id, b);
      }
      b.total += 1;
      if (r.respondent_kind === "student") b.student += 1;
      else if (r.respondent_kind === "general") b.general += 1;
      else b.other += 1;
    }
    setCounts(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setFormOpen(false);
    setFSlug("");
    setFTitle("");
    setFDesc("");
    setFKind("");
    setFQuestionsJson("[]");
    setFActive(false);
    setFConsent("");
    setFormError("");
  }

  function openNew() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(s: SurveyRow) {
    setEditingId(s.id);
    setFormOpen(true);
    setFSlug(s.slug);
    setFTitle(s.title);
    setFDesc(s.description ?? "");
    setFKind(s.kind ?? "");
    setFQuestionsJson(JSON.stringify(s.questions, null, 2));
    setFActive(s.is_active);
    setFConsent(s.consent_text ?? "");
    setFormError("");
  }

  async function saveForm() {
    setFormError("");
    if (!fSlug.trim() || !fTitle.trim()) {
      setFormError("slug 와 title 은 필수입니다.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(fQuestionsJson);
    } catch {
      setFormError("질문 JSON 파싱 실패 — 형식을 확인해 주세요.");
      return;
    }
    if (!Array.isArray(parsed)) {
      setFormError("질문은 배열([])이어야 합니다.");
      return;
    }
    setFormBusy(true);
    const payload = {
      slug: fSlug.trim(),
      title: fTitle.trim(),
      description: fDesc.trim() || null,
      kind: fKind.trim() || null,
      questions: parsed,
      is_active: fActive,
      consent_text: fConsent.trim() || null,
    };
    const res = editingId
      ? await supabase.from("surveys").update(payload).eq("id", editingId)
      : await supabase.from("surveys").insert(payload);
    setFormBusy(false);
    if (res.error) {
      setFormError(`저장 실패: ${res.error.message}`);
      return;
    }
    resetForm();
    await load();
  }

  async function toggleActive(s: SurveyRow) {
    const { error: e } = await supabase
      .from("surveys")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);
    if (e) {
      alert(`토글 실패: ${e.message}`);
      return;
    }
    await load();
  }

  async function deleteSurvey(s: SurveyRow) {
    const ok = window.confirm(
      `[${s.slug}] 설문을 삭제할까요?\n응답이 있다면 함께 삭제됩니다 (cascade).`
    );
    if (!ok) return;
    const { error: e } = await supabase.from("surveys").delete().eq("id", s.id);
    if (e) {
      alert(`삭제 실패: ${e.message}`);
      return;
    }
    await load();
  }

  const totalByKind = useMemo(() => {
    let s = 0,
      g = 0,
      o = 0;
    for (const b of counts.values()) {
      s += b.student;
      g += b.general;
      o += b.other;
    }
    return { student: s, general: g, other: o, total: s + g + o };
  }, [counts]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${theme.accentText}`}>설문</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">설문 관리</h1>
          <p className="mt-1 text-sm text-slate-400">
            사전·사후 설문 정의를 만들고 학생·일반인 노출을 토글합니다. 응답
            현황은 역할별로 카운트됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openNew} variant="primary" size="sm">
            + 새 설문
          </Button>
          <Button onClick={load} variant="neutral" size="sm" disabled={loading}>
            {loading ? "..." : "새로고침"}
          </Button>
        </div>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {/* 전체 응답 KPI */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiBox label="설문 수" value={rows.length} />
        <KpiBox label="총 응답" value={totalByKind.total} valueClass="text-cyan-200" />
        <KpiBox
          label="학생 응답"
          value={totalByKind.student}
          valueClass="text-emerald-200"
        />
        <KpiBox
          label="일반인 응답"
          value={totalByKind.general}
          valueClass="text-amber-200"
        />
      </div>

      {/* 편집/생성 폼 */}
      {formOpen ? (
        <Card className="mb-6 p-5">
          <h2 className="text-base font-bold">
            {editingId ? "설문 편집" : "새 설문 만들기"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <TextField
              id="f-slug"
              label="slug (영문/숫자/언더스코어)"
              value={fSlug}
              onChange={(e) => setFSlug(e.target.value)}
              hint="예: pre_survey_2026"
            />
            <TextField
              id="f-kind"
              label="kind (pre/post/other)"
              value={fKind}
              onChange={(e) => setFKind(e.target.value)}
            />
          </div>
          <div className="mt-3">
            <TextField
              id="f-title"
              label="제목"
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
            />
          </div>
          <div className="mt-3">
            <label
              htmlFor="f-desc"
              className="block text-xs font-semibold text-slate-300"
            >
              설명 (선택)
            </label>
            <textarea
              id="f-desc"
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            />
          </div>
          <div className="mt-3">
            <label
              htmlFor="f-questions"
              className="block text-xs font-semibold text-slate-300"
            >
              질문 JSON (배열) —{" "}
              <span className="text-slate-500">
                {"[{id, prompt, kind:'scale'|'text'|'select', options?}, ...]"}
              </span>
            </label>
            <textarea
              id="f-questions"
              value={fQuestionsJson}
              onChange={(e) => setFQuestionsJson(e.target.value)}
              rows={10}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            />
          </div>
          <div className="mt-3">
            <label
              htmlFor="f-consent"
              className="block text-xs font-semibold text-slate-300"
            >
              개인정보 동의 안내문 (선택) —{" "}
              <span className="text-slate-500">
                비우면 동의 단계 X (응답 폼 바로 노출)
              </span>
            </label>
            <textarea
              id="f-consent"
              value={fConsent}
              onChange={(e) => setFConsent(e.target.value)}
              rows={5}
              placeholder="예: 이 설문은 ... 응답 내용은 수업 연구 목적으로만 활용되며 ..."
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            />
          </div>
          <div className="mt-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={fActive}
                onChange={(e) => setFActive(e.target.checked)}
                className="h-4 w-4"
              />
              학생·일반인에게 노출 (is_active)
            </label>
          </div>
          {formError ? (
            <Alert tone="error" className="mt-3">
              {formError}
            </Alert>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={resetForm} variant="neutral" size="sm">
              취소
            </Button>
            <Button
              onClick={saveForm}
              variant="primary"
              size="sm"
              disabled={formBusy}
            >
              {formBusy ? "저장 중..." : editingId ? "수정 저장" : "새 설문 만들기"}
            </Button>
          </div>
        </Card>
      ) : null}

      {/* 설문 목록 */}
      <section className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
            아직 설문이 없습니다. 우측 상단 "+ 새 설문" 으로 만들어 주세요.
          </p>
        ) : (
          rows.map((s) => {
            const b = counts.get(s.id) ?? emptyBucket();
            return (
              <Card key={s.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          s.is_active
                            ? "rounded-full bg-emerald-300/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200"
                            : "rounded-full bg-slate-700/40 px-2 py-0.5 text-[11px] font-semibold text-slate-400"
                        }
                      >
                        {s.is_active ? "ON" : "OFF"}
                      </span>
                      {s.kind ? (
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                          {s.kind}
                        </span>
                      ) : null}
                      {s.consent_text ? (
                        <span className="rounded bg-violet-300/15 px-2 py-0.5 text-[11px] font-semibold text-violet-200" title="응답 전 개인정보 동의 단계 노출">
                          동의 필수
                        </span>
                      ) : null}
                      <h3 className="text-base font-bold text-white">
                        {s.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-[11px] font-mono text-slate-500">
                      {s.slug}
                    </p>
                    {s.description ? (
                      <p className="mt-1 text-xs text-slate-400">
                        {s.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <span className="text-slate-400">
                        총 <span className="font-bold text-cyan-200">{b.total}</span>건
                      </span>
                      <span className="text-emerald-300/80">
                        학생 {b.student}
                      </span>
                      <span className="text-amber-300/80">
                        일반인 {b.general}
                      </span>
                      {b.other > 0 ? (
                        <span className="text-slate-500">기타 {b.other}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/admin/surveys/${s.id}`}
                      className={buttonClasses("primary", { size: "sm" })}
                      title="미리보기 + 항목별 분석"
                    >
                      📊 보기
                    </Link>
                    <Button
                      onClick={() => toggleActive(s)}
                      variant={s.is_active ? "neutral" : "secondary"}
                      size="sm"
                    >
                      {s.is_active ? "OFF" : "ON"}
                    </Button>
                    <Button
                      onClick={() => openEdit(s)}
                      variant="neutral"
                      size="sm"
                    >
                      편집
                    </Button>
                    <Button
                      onClick={() => deleteSurvey(s)}
                      variant="danger"
                      size="sm"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </section>
    </>
  );
}

function KpiBox({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold sm:text-3xl ${valueClass ?? "text-white"}`}
      >
        {value.toLocaleString("ko-KR")}
      </p>
    </div>
  );
}
