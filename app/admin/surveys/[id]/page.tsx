"use client";

// /admin/surveys/[id] — 관리자 전용 설문 상세 페이지.
// 두 탭: (1) 미리보기 — 학생/일반인이 보는 응답 폼 재현(readonly)
//        (2) 분석 — 항목별 응답 분포(학생·일반인 구분) + 차트.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Question = {
  id: string;
  prompt: string;
  kind?: "text" | "select" | "scale";
  options?: string[];
};

type Survey = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: string | null;
  questions: Question[];
  is_active: boolean;
};

type ResponseRow = {
  id: string;
  answers: Record<string, string>;
  respondent_kind: string | null;
  legacy_created_at: string | null;
  created_at: string;
};

type Tab = "preview" | "analysis";

export default function AdminSurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const theme = getRoleTheme("admin");
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("preview");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [sRes, rRes] = await Promise.all([
      supabase
        .from("surveys")
        .select("id, slug, title, description, kind, questions, is_active")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("survey_responses")
        .select("id, answers, respondent_kind, legacy_created_at, created_at")
        .eq("survey_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (sRes.error) setError(sRes.error.message);
    if (rRes.error) setError((e) => e || rRes.error!.message);
    setSurvey(sRes.data as Survey | null);
    setResponses((rRes.data ?? []) as ResponseRow[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-slate-400">불러오는 중...</p>;
  }
  if (!survey) {
    return (
      <Alert tone="error">
        설문을 찾을 수 없습니다. <Link href="/admin/surveys">목록으로</Link>
      </Alert>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${theme.accentText}`}>설문</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {survey.title}
          </h1>
          <p className="mt-1 text-xs font-mono text-slate-500">{survey.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              survey.is_active
                ? "rounded-full bg-emerald-300/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200"
                : "rounded-full bg-slate-700/40 px-2 py-0.5 text-[11px] font-semibold text-slate-400"
            }
          >
            {survey.is_active ? "ON" : "OFF"}
          </span>
          {survey.kind ? (
            <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
              {survey.kind}
            </span>
          ) : null}
          <Link href="/admin/surveys">
            <Button variant="neutral" size="sm">
              ← 목록
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Alert tone="error" className="mb-3">
          {error}
        </Alert>
      ) : null}

      {/* 탭 */}
      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={
            tab === "preview"
              ? "rounded-full bg-cyan-300 px-4 py-1.5 text-sm font-semibold text-slate-950"
              : "rounded-full border border-white/15 px-4 py-1.5 text-sm text-slate-300 hover:bg-white/10"
          }
        >
          👁 미리보기
        </button>
        <button
          type="button"
          onClick={() => setTab("analysis")}
          className={
            tab === "analysis"
              ? "rounded-full bg-cyan-300 px-4 py-1.5 text-sm font-semibold text-slate-950"
              : "rounded-full border border-white/15 px-4 py-1.5 text-sm text-slate-300 hover:bg-white/10"
          }
        >
          📊 항목별 분석 ({responses.length}건)
        </button>
      </div>

      {tab === "preview" ? (
        <SurveyPreview survey={survey} />
      ) : (
        <SurveyAnalysis survey={survey} responses={responses} />
      )}
    </>
  );
}

/** 학생/일반인이 보는 응답 폼 — readonly. SurveyAnswerPanel 의 SurveyForm 유사. */
function SurveyPreview({ survey }: { survey: Survey }) {
  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-white">{survey.title}</h2>
      {survey.description ? (
        <p className="mt-1 text-sm text-slate-400">{survey.description}</p>
      ) : null}
      <p className="mt-2 rounded border border-amber-300/30 bg-amber-300/5 p-2 text-xs text-amber-100">
        ℹ 학생/일반인이 보는 화면 그대로의 미리보기. 입력은 비활성(저장되지
        않음).
      </p>
      <form className="mt-5 space-y-5">
        {survey.questions.map((q, idx) => (
          <div key={q.id}>
            <label className="block text-sm font-semibold text-slate-200">
              {idx + 1}. {q.prompt}
            </label>
            {q.kind === "select" && q.options ? (
              <select
                disabled
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-500 opacity-60"
              >
                <option>선택해 주세요</option>
                {q.options.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            ) : q.kind === "scale" ? (
              <div className="mt-2 flex flex-wrap gap-2 opacity-60">
                {[
                  "1 (매우 그렇지 않다)",
                  "2 (그렇지 않다)",
                  "3 (보통이다)",
                  "4 (그렇다)",
                  "5 (매우 그렇다)",
                ].map((l) => (
                  <span
                    key={l}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-300"
                  >
                    {l}
                  </span>
                ))}
              </div>
            ) : (
              <textarea
                disabled
                rows={3}
                placeholder="(학생이 자유 입력)"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-500 opacity-60"
              />
            )}
          </div>
        ))}
        <div className="flex justify-end">
          <Button variant="primary" size="sm" disabled>
            제출 (미리보기 — 비활성)
          </Button>
        </div>
      </form>
    </Card>
  );
}

const KIND_COLORS: Record<string, string> = {
  student: "#6ee7b7",
  general: "#fcd34d",
  other: "#94a3b8",
};

/** 항목별 분석 — 척도 질문은 1~5 분포 막대, 자유텍스트는 응답 목록. */
function SurveyAnalysis({
  survey,
  responses,
}: {
  survey: Survey;
  responses: ResponseRow[];
}) {
  // 응답자 역할별 카운트
  const kindCounts = useMemo(() => {
    const c = { student: 0, general: 0, other: 0 };
    for (const r of responses) {
      if (r.respondent_kind === "student") c.student++;
      else if (r.respondent_kind === "general") c.general++;
      else c.other++;
    }
    return c;
  }, [responses]);

  return (
    <div className="space-y-4">
      {/* 응답자 분포 KPI */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-slate-400">응답자 구성</p>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <span className="text-white">
            총 <span className="text-cyan-200 font-bold">{responses.length}</span>건
          </span>
          <span className="text-emerald-300">
            학생 <span className="font-bold">{kindCounts.student}</span>
          </span>
          <span className="text-amber-300">
            일반인 <span className="font-bold">{kindCounts.general}</span>
          </span>
          {kindCounts.other > 0 ? (
            <span className="text-slate-400">
              기타 <span className="font-bold">{kindCounts.other}</span>
            </span>
          ) : null}
        </div>
      </Card>

      {responses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
          아직 응답이 없습니다.
        </p>
      ) : (
        survey.questions.map((q, idx) => (
          <QuestionAnalysisCard
            key={q.id}
            index={idx}
            question={q}
            responses={responses}
          />
        ))
      )}
    </div>
  );
}

function QuestionAnalysisCard({
  index,
  question,
  responses,
}: {
  index: number;
  question: Question;
  responses: ResponseRow[];
}) {
  const kind = question.kind ?? inferKind(question, responses);

  // 응답값 추출 (학생/일반인 별)
  const values = useMemo(() => {
    return responses
      .map((r) => ({
        kind: r.respondent_kind ?? "other",
        value: String(r.answers?.[question.id] ?? "").trim(),
      }))
      .filter((v) => v.value !== "");
  }, [responses, question.id]);

  if (values.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-semibold text-white">
          {index + 1}. {question.prompt}
        </p>
        <p className="mt-1 text-xs text-slate-500">응답 없음</p>
      </Card>
    );
  }

  // 척도(scale) — 1~5 분포 막대(학생/일반인 stack 또는 grouped)
  if (kind === "scale") {
    const buckets = ["1", "2", "3", "4", "5"];
    const data = buckets.map((b) => {
      const studentN = values.filter(
        (v) => v.kind === "student" && extractScale(v.value) === b
      ).length;
      const generalN = values.filter(
        (v) => v.kind === "general" && extractScale(v.value) === b
      ).length;
      const otherN = values.filter(
        (v) => v.kind === "other" && extractScale(v.value) === b
      ).length;
      return { score: b, 학생: studentN, 일반인: generalN, 기타: otherN };
    });

    return (
      <Card className="p-4">
        <p className="text-sm font-semibold text-white">
          {index + 1}. {question.prompt}
        </p>
        <p className="mt-1 text-xs text-slate-500">응답 {values.length}건 (1~5 척도)</p>
        <div className="mt-3 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis
                dataKey="score"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={{ stroke: "rgba(255,255,255,0.1)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="학생" stackId="a" fill={KIND_COLORS.student} />
              <Bar dataKey="일반인" stackId="a" fill={KIND_COLORS.general} />
              <Bar dataKey="기타" stackId="a" fill={KIND_COLORS.other} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  }

  // select — 옵션별 카운트 막대
  if (kind === "select" || question.options) {
    const opts = question.options ?? Array.from(new Set(values.map((v) => v.value)));
    const data = opts.map((o) => {
      const studentN = values.filter((v) => v.kind === "student" && v.value === o).length;
      const generalN = values.filter((v) => v.kind === "general" && v.value === o).length;
      const otherN = values.filter((v) => v.kind === "other" && v.value === o).length;
      return { option: o, 학생: studentN, 일반인: generalN, 기타: otherN };
    });
    return (
      <Card className="p-4">
        <p className="text-sm font-semibold text-white">
          {index + 1}. {question.prompt}
        </p>
        <p className="mt-1 text-xs text-slate-500">응답 {values.length}건 (선택)</p>
        <div className="mt-3 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.1)" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
              <YAxis type="category" dataKey="option" width={160} tick={{ fill: "#cbd5e1", fontSize: 11 }} tickLine={{ stroke: "rgba(255,255,255,0.1)" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="학생" stackId="a" fill={KIND_COLORS.student} />
              <Bar dataKey="일반인" stackId="a" fill={KIND_COLORS.general} />
              <Bar dataKey="기타" stackId="a" fill={KIND_COLORS.other} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  }

  // text(자유 입력) — 응답 목록 펼침
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-white">
        {index + 1}. {question.prompt}
      </p>
      <p className="mt-1 text-xs text-slate-500">응답 {values.length}건 (자유 텍스트)</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-cyan-300 hover:underline">
          응답 펼치기
        </summary>
        <ul className="mt-3 space-y-2 text-xs">
          {values.map((v, i) => {
            const colorClass =
              v.kind === "student"
                ? "border-emerald-300/30 text-emerald-100"
                : v.kind === "general"
                ? "border-amber-300/30 text-amber-100"
                : "border-white/10 text-slate-300";
            return (
              <li
                key={i}
                className={`rounded border bg-slate-950/60 p-2 ${colorClass}`}
              >
                <span className="mr-1 text-[10px] font-semibold opacity-70">
                  [{v.kind}]
                </span>
                <span className="whitespace-pre-wrap">{v.value}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </Card>
  );
}

/** 척도 답 "3 - 보통이다" 또는 "3" 등에서 숫자만. */
function extractScale(raw: string): string {
  const m = raw.trim().match(/^([1-5])/);
  return m ? m[1] : "";
}

/** 질문 kind 가 없으면 응답값으로 추정. */
function inferKind(_q: Question, responses: ResponseRow[]): "scale" | "select" | "text" {
  // 응답값이 1~5 또는 "1 - ..." 형식이 다수면 scale.
  const samples: string[] = [];
  for (const r of responses) {
    for (const v of Object.values(r.answers ?? {})) {
      if (samples.length >= 20) break;
      samples.push(String(v));
    }
  }
  if (samples.length > 0 && samples.every((s) => /^[1-5]( - .+)?$/.test(s.trim()))) {
    return "scale";
  }
  return "text";
}
