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
  consent_text: string | null;
};

type ResponseRow = {
  id: string;
  answers: Record<string, string>;
  respondent_kind: string | null;
  legacy_created_at: string | null;
  created_at: string;
  student_id: string | null;
  // 학년별 분석용 비정규화 — fetch 후 채움.
  grade?: number | null;
};

type Tab = "preview" | "analysis" | "compare";

export default function AdminSurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const theme = getRoleTheme("admin");
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  // 사후 설문일 때만 사전 설문 + 응답을 함께 fetch (비교용).
  const [pairSurvey, setPairSurvey] = useState<Survey | null>(null);
  const [pairResponses, setPairResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("preview");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [sRes, rRes, stRes] = await Promise.all([
      supabase
        .from("surveys")
        .select("id, slug, title, description, kind, questions, is_active, consent_text")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("survey_responses")
        .select(
          "id, answers, respondent_kind, legacy_created_at, created_at, student_id"
        )
        .eq("survey_id", id)
        .order("created_at", { ascending: false }),
      // 학년 매핑용 — admin RLS 라 전체 students 가져옴.
      supabase.from("students").select("id, grade"),
    ]);
    if (sRes.error) setError(sRes.error.message);
    if (rRes.error) setError((e) => e || rRes.error!.message);
    if (stRes.error) setError((e) => e || stRes.error!.message);
    setSurvey(sRes.data as Survey | null);
    // student_id → grade 매핑 후 응답에 grade 비정규화.
    const gradeMap = new Map<string, number>();
    for (const s of (stRes.data ?? []) as Array<{ id: string; grade: number }>) {
      gradeMap.set(s.id, s.grade);
    }
    const rows = (rRes.data ?? []) as ResponseRow[];
    for (const r of rows) {
      r.grade = r.student_id ? gradeMap.get(r.student_id) ?? null : null;
    }
    setResponses(rows);

    // 사후(post) 설문이면 대응되는 사전(pre) 설문 + 응답을 함께 fetch.
    // 기준: 같은 kind 정책 그룹 — 우선 'pre' kind 의 가장 최근 설문 1개.
    const cur = sRes.data as Survey | null;
    if (cur?.kind === "post") {
      const { data: preS } = await supabase
        .from("surveys")
        .select("id, slug, title, description, kind, questions, is_active, consent_text")
        .eq("kind", "pre")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPairSurvey(preS as Survey | null);
      if (preS) {
        const { data: preR } = await supabase
          .from("survey_responses")
          .select(
            "id, answers, respondent_kind, legacy_created_at, created_at, student_id"
          )
          .eq("survey_id", (preS as { id: string }).id);
        const preRows = (preR ?? []) as ResponseRow[];
        for (const r of preRows) {
          r.grade = r.student_id ? gradeMap.get(r.student_id) ?? null : null;
        }
        setPairResponses(preRows);
      }
    } else {
      setPairSurvey(null);
      setPairResponses([]);
    }

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
        {survey.kind === "post" && pairSurvey ? (
          <button
            type="button"
            onClick={() => setTab("compare")}
            className={
              tab === "compare"
                ? "rounded-full bg-violet-300 px-4 py-1.5 text-sm font-semibold text-slate-950"
                : "rounded-full border border-violet-300/30 px-4 py-1.5 text-sm text-violet-200 hover:bg-violet-300/10"
            }
          >
            🔁 사전·사후 비교
          </button>
        ) : null}
      </div>

      {tab === "preview" ? (
        <SurveyPreview survey={survey} />
      ) : tab === "analysis" ? (
        <SurveyAnalysis survey={survey} responses={responses} />
      ) : (
        <SurveyCompare
          postSurvey={survey}
          postResponses={responses}
          preSurvey={pairSurvey}
          preResponses={pairResponses}
        />
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

      {/* 동의 안내문 미리보기 — 설정된 경우만 */}
      {survey.consent_text ? (
        <div className="mt-4 rounded-xl border border-violet-300/30 bg-violet-300/5 p-4 text-sm">
          <p className="font-semibold text-violet-200">📋 설문 시작 전 안내</p>
          <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-100">
            {survey.consent_text}
          </p>
          <label className="mt-3 inline-flex cursor-not-allowed items-center gap-2 text-xs text-slate-400 opacity-60">
            <input type="checkbox" disabled className="h-4 w-4" />
            안내 내용을 확인했으며, 설문에 참여합니다.
          </label>
        </div>
      ) : null}

      <form className="mt-5 space-y-5">
        {survey.questions.map((q, idx) => (
          <div key={q.id}>
            <label className="block text-sm font-semibold text-slate-200">
              {idx + 1}. {q.prompt}
            </label>
            {q.kind === "select" && q.options ? (
              <select
                disabled
                aria-label={q.prompt}
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

/** 항목별 분석 — 척도 질문은 1~5 분포 막대 + 평균(전체·학년별), 자유텍스트는 응답 목록. */
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

  // 학년 분포 (학생 응답만)
  const gradeCounts = useMemo(() => {
    const m = new Map<number, number>();
    for (const r of responses) {
      if (r.respondent_kind !== "student") continue;
      if (r.grade == null) continue;
      m.set(r.grade, (m.get(r.grade) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
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
        {gradeCounts.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="text-slate-500">학년 분포:</span>
            {gradeCounts.map(([g, n]) => (
              <span key={g}>
                {g}학년 <span className="font-bold text-cyan-200">{n}</span>
              </span>
            ))}
          </div>
        ) : null}
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

  // 응답값 추출 (학생/일반인/학년 메타 포함)
  const values = useMemo(() => {
    return responses
      .map((r) => ({
        kind: r.respondent_kind ?? "other",
        grade: r.grade ?? null,
        value: String(r.answers?.[question.id] ?? "").trim(),
      }))
      .filter((v) => v.value !== "");
  }, [responses, question.id]);

  // 척도 평균 계산 (전체 + 학년별, 학생만)
  const scaleStats = useMemo(() => {
    if (kind !== "scale") return null;
    const allNums: number[] = [];
    const byGrade = new Map<number, number[]>();
    for (const v of values) {
      const n = Number(extractScale(v.value));
      if (!n) continue;
      allNums.push(n);
      if (v.kind === "student" && v.grade != null) {
        const arr = byGrade.get(v.grade) ?? [];
        arr.push(n);
        byGrade.set(v.grade, arr);
      }
    }
    const avg = (arr: number[]) =>
      arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      total: { avg: avg(allNums), n: allNums.length },
      byGrade: Array.from(byGrade.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([g, arr]) => ({ grade: g, avg: avg(arr), n: arr.length })),
    };
  }, [kind, values]);

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
        <p className="mt-1 text-xs text-slate-500">
          응답 {values.length}건 (1~5 척도)
        </p>
        {scaleStats ? (
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-2 text-xs">
            <span className="font-semibold text-cyan-200">
              전체 평균:{" "}
              {scaleStats.total.avg != null
                ? scaleStats.total.avg.toFixed(2)
                : "-"}
            </span>
            {scaleStats.byGrade.length > 0 ? (
              <>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">학년별 평균:</span>
                {scaleStats.byGrade.map((g) => (
                  <span
                    key={g.grade}
                    className="rounded bg-white/5 px-2 py-0.5 font-mono text-emerald-200"
                  >
                    {g.grade}학년 {g.avg?.toFixed(2)} (n={g.n})
                  </span>
                ))}
              </>
            ) : null}
          </div>
        ) : null}
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

/** 사전·사후 공통 척도 질문 비교 — 평균 변화 + 분포 변화. */
function SurveyCompare({
  postSurvey,
  postResponses,
  preSurvey,
  preResponses,
}: {
  postSurvey: Survey;
  postResponses: ResponseRow[];
  preSurvey: Survey | null;
  preResponses: ResponseRow[];
}) {
  // 공통 질문 (id 일치, 둘 다 scale)
  const commonQuestions = useMemo(() => {
    if (!preSurvey) return [];
    const preIds = new Map(preSurvey.questions.map((q) => [q.id, q]));
    return postSurvey.questions.filter((q) => {
      const pre = preIds.get(q.id);
      if (!pre) return false;
      const preKind = pre.kind ?? "scale";
      const postKind = q.kind ?? "scale";
      return preKind === "scale" && postKind === "scale";
    });
  }, [postSurvey, preSurvey]);

  // 응답자 수 비교
  const counts = useMemo(
    () => ({
      pre: preResponses.filter((r) => r.respondent_kind === "student").length,
      post: postResponses.filter((r) => r.respondent_kind === "student").length,
    }),
    [preResponses, postResponses]
  );

  if (!preSurvey) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
        매칭되는 사전 설문(kind=&apos;pre&apos;)이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-xs font-semibold text-slate-400">비교 대상</p>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
              사전
            </span>{" "}
            <span className="text-white">{preSurvey.title}</span>
            <span className="ml-2 text-xs text-slate-400">
              학생 응답 {counts.pre}건
            </span>
          </div>
          <div>
            <span className="rounded-full bg-violet-300/15 px-2 py-0.5 text-[11px] font-semibold text-violet-200">
              사후
            </span>{" "}
            <span className="text-white">{postSurvey.title}</span>
            <span className="ml-2 text-xs text-slate-400">
              학생 응답 {counts.post}건
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          공통 척도 질문 {commonQuestions.length}개 — 학생 응답만 집계
          (응답자 변경되어도 그룹 평균 비교).
        </p>
      </Card>

      {commonQuestions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-400">
          공통 척도 질문이 없습니다.
        </p>
      ) : (
        commonQuestions.map((q, idx) => (
          <CompareCard
            key={q.id}
            index={idx}
            question={q}
            preResponses={preResponses}
            postResponses={postResponses}
          />
        ))
      )}
    </div>
  );
}

function CompareCard({
  index,
  question,
  preResponses,
  postResponses,
}: {
  index: number;
  question: Question;
  preResponses: ResponseRow[];
  postResponses: ResponseRow[];
}) {
  // 척도 평균/분포 — 학생 응답만.
  const calc = (rows: ResponseRow[]) => {
    const nums: number[] = [];
    const dist = [0, 0, 0, 0, 0]; // 1..5
    for (const r of rows) {
      if (r.respondent_kind !== "student") continue;
      const n = Number(extractScale(String(r.answers?.[question.id] ?? "")));
      if (n >= 1 && n <= 5) {
        nums.push(n);
        dist[n - 1]++;
      }
    }
    const avg =
      nums.length === 0 ? null : nums.reduce((a, b) => a + b, 0) / nums.length;
    return { avg, n: nums.length, dist };
  };
  const pre = calc(preResponses);
  const post = calc(postResponses);
  const delta =
    pre.avg != null && post.avg != null ? post.avg - pre.avg : null;

  // 비교 차트 — 각 점수(1~5)에 사전/사후 두 막대
  const data = [1, 2, 3, 4, 5].map((s) => ({
    score: String(s),
    사전: pre.dist[s - 1],
    사후: post.dist[s - 1],
  }));

  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-white">
        {index + 1}. {question.prompt}
      </p>
      <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg bg-emerald-300/[0.06] p-2">
          <p className="text-[10px] text-slate-400">사전 평균 (n={pre.n})</p>
          <p className="mt-0.5 text-lg font-bold text-emerald-200">
            {pre.avg != null ? pre.avg.toFixed(2) : "-"}
          </p>
        </div>
        <div className="rounded-lg bg-violet-300/[0.06] p-2">
          <p className="text-[10px] text-slate-400">사후 평균 (n={post.n})</p>
          <p className="mt-0.5 text-lg font-bold text-violet-200">
            {post.avg != null ? post.avg.toFixed(2) : "-"}
          </p>
        </div>
        <div
          className={
            delta == null
              ? "rounded-lg bg-white/5 p-2"
              : delta > 0
              ? "rounded-lg bg-cyan-300/[0.08] p-2"
              : delta < 0
              ? "rounded-lg bg-rose-400/[0.06] p-2"
              : "rounded-lg bg-white/5 p-2"
          }
        >
          <p className="text-[10px] text-slate-400">변화 (사후 − 사전)</p>
          <p
            className={
              delta == null
                ? "mt-0.5 text-lg font-bold text-slate-300"
                : delta > 0
                ? "mt-0.5 text-lg font-bold text-cyan-200"
                : delta < 0
                ? "mt-0.5 text-lg font-bold text-rose-300"
                : "mt-0.5 text-lg font-bold text-slate-300"
            }
          >
            {delta == null
              ? "-"
              : `${delta > 0 ? "+" : ""}${delta.toFixed(2)}`}
          </p>
        </div>
      </div>
      <div className="mt-3 h-48 w-full">
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
            <Bar dataKey="사전" fill={KIND_COLORS.student} />
            <Bar dataKey="사후" fill={"#c4b5fd"} />
          </BarChart>
        </ResponsiveContainer>
      </div>
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
