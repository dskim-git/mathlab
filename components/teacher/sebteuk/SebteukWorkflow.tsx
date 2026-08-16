"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { REFLECTION_LABELS } from "@/lib/legacy/reflectionLabels";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { extractMainReflection, extractAllReflections } from "@/lib/activities/reflection";
import { shortActivityTitle } from "@/lib/activities/activityTitles";
import {
  SEBTEUK_MODELS,
  DEFAULT_SEBTEUK_MODEL,
} from "@/lib/ai/sebteukPrompt";
import { SEMESTER_LABEL, type Semester } from "@/lib/settings/semester";

type StudentLite = {
  id: string;
  grade: number;
  class_number: number;
  student_number: number;
  student_login_id: string;
  profile_id: string;
  profiles: { name: string | null } | null;
};

const STUDENT_COLUMNS =
  "id, grade, class_number, student_number, student_login_id, profile_id, profiles!profile_id ( name )";

// 내가 담당하는 개설 수업. 학년도·학기·교과·수강생이 여기 다 묶여 있다.
type CourseLite = {
  id: string;
  school_year: number;
  semester: number;
  subject: string;
  name: string;
};

type RecordRow = {
  id: string;
  subject: string | null;
  activity_slug: string | null;
  created_at: string;
  reflection_data: Record<string, unknown> | null;
  activities: { title: string | null } | null;
};

type DraftRow = {
  id: string;
  student_id: string;
  body: string;
  ai_model: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
};

type Props = {
  teacherProfileId: string;
  teacherId: string | null;
  isAdmin: boolean;
  schoolYear: number;
  currentSemester: Semester;
  accentText: string;
  enabledModels: string[];
};

// 선택 수업은 학급이 제각각이라 학반을 함께 보여준다.
function studentLabel(s: StudentLite) {
  return `${s.grade}-${s.class_number} ${s.student_number}번 ${
    s.profiles?.name ?? ""
  }`.trim();
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

// isAdmin 은 더 이상 분기에 쓰지 않는다 — 관리자는 courses RLS(admin ALL)로
// 모든 수업이 그대로 조회되므로 목록 자체가 전체가 된다.
export function SebteukWorkflow({
  teacherProfileId,
  schoolYear,
  currentSemester,
  accentText,
  enabledModels,
}: Props) {
  // 허용 모델만 필터
  const allowedModels = SEBTEUK_MODELS.filter((m) =>
    enabledModels.includes(m.id)
  );
  const initialModel =
    enabledModels.includes(DEFAULT_SEBTEUK_MODEL)
      ? DEFAULT_SEBTEUK_MODEL
      : enabledModels[0] ?? DEFAULT_SEBTEUK_MODEL;
  // 작성 범위 = 내가 맡은 "수업" 하나.
  // 수업 하나에 학년도·학기·교과·수강생이 모두 묶여 있으므로 축을 따로 고를 필요가 없다.
  // (예전에는 학기와 교과를 각각 골라서 서로 겉돌았다.)
  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [selCourseId, setSelCourseId] = useState<string>("");
  const selCourse = courses.find((c) => c.id === selCourseId) ?? null;
  const selYear = selCourse?.school_year ?? schoolYear;
  const selSemester = (selCourse?.semester ?? currentSemester) as Semester;
  const selSubject = selCourse?.subject ?? "";

  // 학생 선택
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [selStudentId, setSelStudentId] = useState<string>("");
  const [studentsLoading, setStudentsLoading] = useState(false);

  // 학생 활동 기록 + 별표 성찰
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [recordsLoading, setRecordsLoading] = useState(false);
  // 교사가 AI 입력에 포함할 항목 선택
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 활동 슬러그 → 활동 개요(activity_overviews). 학생과 무관해 1회만 로드.
  // 성찰이 부실해도 활동의 실제 내용을 근거로 보완하도록 AI 입력에 함께 보낸다.
  const [overviews, setOverviews] = useState<Record<string, string>>({});

  // AI 생성 컨트롤
  const [model, setModel] = useState<string>(initialModel);
  const [targetBytes, setTargetBytes] = useState<number>(1500);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  // 초안 body (편집 가능)
  const [body, setBody] = useState("");
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState(false);

  // 이 학생에 대한 기존 드래프트 목록
  const [drafts, setDrafts] = useState<DraftRow[]>([]);

  // 학생별 비공개 메모(teacher_student_notes). 교사 본인+관리자만 RLS 접근.
  // AI 세특 generate 시 컨텍스트로 함께 전송된다.
  const [noteText, setNoteText] = useState<string>("");
  const [noteOriginal, setNoteOriginal] = useState<string>("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteError, setNoteError] = useState("");

  // 옛 앱(Streamlit) 이식 데이터 — AI 입력에 합산할지 토글.
  // subject 가 NULL 이면 '교과 무관' 자료 — 목록에는 보이되 기본 선택은 하지 않는다.
  type LegacyReflectionRow = {
    id: string;
    source_subject: string | null;
    subject: string | null;
    activity_label: string;
    payload: Record<string, unknown>;
    legacy_created_at: string | null;
  };
  type SurveyResponseRow = {
    id: string;
    subject: string | null;
    answers: Record<string, string>;
    legacy_created_at: string | null;
    surveys: { title: string | null; kind: string | null } | null;
  };
  const [legacyRecords, setLegacyRecords] = useState<LegacyReflectionRow[]>([]);
  const [surveyRecords, setSurveyRecords] = useState<SurveyResponseRow[]>([]);
  // 옛 성찰·설문도 개별 선택 (records 와 동일 패턴). 학생 선택 시 default 모두 선택.
  const [selectedLegacyIds, setSelectedLegacyIds] = useState<Set<string>>(new Set());
  const [selectedSurveyIds, setSelectedSurveyIds] = useState<Set<string>>(new Set());

  // 0) 내가 맡은 수업 목록 (관리자는 전체). RLS 가 담당 수업만 반환한다.
  const loadCourses = useCallback(async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, school_year, semester, subject, name")
      .order("school_year", { ascending: false })
      .order("semester", { ascending: false })
      .order("subject")
      .order("name");
    const list = (data ?? []) as CourseLite[];
    setCourses(list);
    // 현재 학년도·학기 수업이 하나뿐이면 바로 고른다.
    const current = list.filter(
      (c) => c.school_year === schoolYear && c.semester === currentSemester
    );
    if (current.length === 1) setSelCourseId(current[0].id);
  }, [schoolYear, currentSemester]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // 1) 학생 목록 = 그 수업의 수강생 명단.
  //    아직 회원가입 안 한 편성(student_id IS NULL)은 기록이 있을 수 없으므로 제외한다.
  const loadStudents = useCallback(async () => {
    if (!selCourseId) {
      setStudents([]);
      return;
    }
    setStudentsLoading(true);
    const { data } = await supabase
      .from("course_students")
      .select(
        "student_id, students!inner(" + STUDENT_COLUMNS + ")"
      )
      .eq("course_id", selCourseId)
      .not("student_id", "is", null);

    type Raw = { student_id: string; students: StudentLite };
    const list = ((data ?? []) as unknown as Raw[])
      .map((r) => r.students)
      .filter(Boolean);
    list.sort(
      (a, b) =>
        a.grade - b.grade ||
        a.class_number - b.class_number ||
        a.student_number - b.student_number
    );
    setStudents(list);
    setStudentsLoading(false);
  }, [selCourseId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // 활동 개요 1회 로드 — 비어있지 않은 것만 맵으로.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("activity_overviews")
        .select("slug, overview");
      const map: Record<string, string> = {};
      for (const r of (data ?? []) as { slug: string; overview: string }[]) {
        const v = (r.overview ?? "").trim();
        if (v) map[r.slug] = v;
      }
      setOverviews(map);
    })();
  }, []);

  // 2) 선택 학생의 활동/성찰 + 별표 + 드래프트 로드
  const loadStudentData = useCallback(async () => {
    if (!selStudentId || !selSubject) {
      setRecords([]);
      setMarkedIds(new Set());
      setDrafts([]);
      setBody("");
      setSavedDraftId(null);
      setSaveOk(false);
      setNoteText("");
      setNoteOriginal("");
      setNoteSaved(false);
      setNoteError("");
      setLegacyRecords([]);
      setSurveyRecords([]);
      setSelectedLegacyIds(new Set());
      setSelectedSurveyIds(new Set());
      return;
    }
    setRecordsLoading(true);
    // 모든 기록 조회는 (학년도 · 학기 · 교과) 로 좁힌다 — 다른 교과·학기 성찰이
    // 이 초안에 섞이지 않게 하는 핵심 지점.
    // 옛 성찰·설문은 subject 가 NULL 인 '교과 무관' 자료가 있을 수 있어 함께 통과시키되,
    // 아래에서 기본 선택은 하지 않는다.
    const [recRes, prioRes, draftRes, noteRes, legacyRes, surveyRes] = await Promise.all([
      supabase
        .from("activity_responses")
        .select(
          "id, subject, activity_slug, reflection_data, created_at, activities ( title )"
        )
        .eq("student_id", selStudentId)
        .eq("school_year", selYear)
        .eq("semester", selSemester)
        .eq("subject", selSubject)
        .order("created_at", { ascending: false }),
      supabase
        .from("reflection_priority")
        .select("activity_response_id, marked, priority_rank")
        .eq("student_id", selStudentId)
        .eq("marked", true),
      supabase
        .from("sebteuk_drafts")
        .select(
          "id, student_id, body, ai_model, status, created_at, updated_at, finalized_at"
        )
        .eq("student_id", selStudentId)
        .eq("school_year", selYear)
        .eq("semester", selSemester)
        .eq("subject", selSubject)
        .order("updated_at", { ascending: false }),
      // 본인이 이 학생에 대해 적어둔 메모(있으면).
      supabase
        .from("teacher_student_notes")
        .select("note")
        .eq("teacher_profile_id", teacherProfileId)
        .eq("student_id", selStudentId)
        .maybeSingle(),
      // 옛 앱 이식 성찰 (legacy_reflections) — AI 세특 합산용
      supabase
        .from("legacy_reflections")
        .select(
          "id, source_subject, subject, activity_label, payload, legacy_created_at"
        )
        .eq("student_id", selStudentId)
        .eq("school_year", selYear)
        .eq("semester", selSemester)
        .or(`subject.eq."${selSubject}",subject.is.null`)
        .order("legacy_created_at", { ascending: false, nullsFirst: false }),
      // 설문 응답 (survey_responses) — 본인 학생의 응답 + surveys 메타 join
      supabase
        .from("survey_responses")
        .select(
          "id, subject, answers, legacy_created_at, surveys(title, kind)"
        )
        .eq("student_id", selStudentId)
        .eq("school_year", selYear)
        .eq("semester", selSemester)
        .or(`subject.eq."${selSubject}",subject.is.null`)
        .order("created_at", { ascending: false }),
    ]);

    const recordRows = (recRes.data ?? []) as unknown as RecordRow[];
    setRecords(recordRows);
    const marked = new Set<string>(
      ((prioRes.data ?? []) as { activity_response_id: string }[]).map(
        (r) => r.activity_response_id
      )
    );
    setMarkedIds(marked);
    // 기본 선택: 별표 표시된 것 + (별표 없으면 전체)
    setSelectedIds(
      marked.size > 0
        ? new Set(marked)
        : new Set(recordRows.map((r) => r.id))
    );
    setDrafts((draftRes.data ?? []) as DraftRow[]);
    const noteRow = noteRes.data as { note: string } | null;
    const initialNote = noteRow?.note ?? "";
    setNoteText(initialNote);
    setNoteOriginal(initialNote);
    setNoteSaved(false);
    setNoteError("");
    const lRows = (legacyRes.data ?? []) as LegacyReflectionRow[];
    const sRows = (surveyRes.data ?? []) as unknown as SurveyResponseRow[];
    setLegacyRecords(lRows);
    setSurveyRecords(sRows);
    // 이 교과의 기록만 기본 선택 — 교과 무관(NULL) 자료는 교사가 직접 체크.
    setSelectedLegacyIds(
      new Set(lRows.filter((r) => r.subject === selSubject).map((r) => r.id))
    );
    setSelectedSurveyIds(
      new Set(sRows.filter((r) => r.subject === selSubject).map((r) => r.id))
    );
    setRecordsLoading(false);
    setSavedDraftId(null);
    setSaveOk(false);
  }, [selStudentId, selYear, selSemester, selSubject, teacherProfileId]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // 입력 컨텍스트 — 교사가 선택한 항목만, 별표/일반 구분 표시
  const inputContext = useMemo(() => {
    // chosen 0건이라도 옛 성찰·설문이 있으면 그것만으로 generate 가능.
    const chosen = records.filter((r) => selectedIds.has(r.id));
    const marked = chosen.filter((r) => markedIds.has(r.id));
    const others = chosen.filter((r) => !markedIds.has(r.id));
    const fmtLine = (r: RecordRow, prefix: string) => {
      const title = r.activities?.title ?? shortActivityTitle(r.activity_slug);
      const refl = extractAllReflections(r.reflection_data) || "(성찰 없음)";
      const ov = r.activity_slug ? overviews[r.activity_slug] : "";
      const ovLine = ov ? `\n  활동 개요: ${ov}` : "";
      return `${prefix} 활동: ${title}${ovLine}\n  성찰:\n${refl.split("\n").map((l) => `    ${l}`).join("\n")}`;
    };
    const blocks: string[] = [];
    if (marked.length > 0) {
      blocks.push(
        "## 학생이 강조한 활동/성찰 (생기부 후보)\n" +
          marked.map((r) => fmtLine(r, "★")).join("\n\n")
      );
    }
    if (others.length > 0) {
      blocks.push(
        "## 교사가 추가 선택한 활동/성찰\n" +
          others.map((r) => fmtLine(r, "·")).join("\n\n")
      );
    }
    // 옛 앱 이식 성찰 — 개별 선택된 행만 포함. 컬럼명 → 진짜 질문 매핑 적용.
    const chosenLegacy = legacyRecords.filter((r) => selectedLegacyIds.has(r.id));
    if (chosenLegacy.length > 0) {
      const lines = chosenLegacy
        .map((r) => {
          const labelMap = REFLECTION_LABELS[r.activity_label] ?? {};
          const fields = Object.entries(r.payload)
            .filter(([k]) => !["timestamp", "학번", "이름"].includes(k))
            .map(([k, v]) => {
              const value = String(v ?? "").trim();
              if (!value) return "";
              const prompt = labelMap[k] ?? k;
              return `    Q: ${prompt}\n    A: ${value}`;
            })
            .filter((s) => s)
            .join("\n");
          if (!fields) return null;
          const subj = r.source_subject ? ` [${r.source_subject}]` : "";
          return `· 활동: ${r.activity_label}${subj}\n${fields}`;
        })
        .filter((s): s is string => s !== null);
      if (lines.length > 0) {
        blocks.push(
          "## 옛 앱(Streamlit) 이식 성찰 — 이전 학습 이력\n" + lines.join("\n\n")
        );
      }
    }
    // 설문 응답 — 개별 선택된 행만 포함.
    const chosenSurvey = surveyRecords.filter((r) => selectedSurveyIds.has(r.id));
    if (chosenSurvey.length > 0) {
      const lines = chosenSurvey
        .map((r) => {
          const title = r.surveys?.title ?? r.surveys?.kind ?? "설문";
          const answers = Object.entries(r.answers)
            .map(([k, v]) => `    ${k}: ${String(v)}`)
            .join("\n");
          return `· ${title}\n${answers}`;
        })
        .join("\n\n");
      blocks.push("## 사전/사후 설문 응답 — 학습 인식·태도\n" + lines);
    }
    return blocks.join("\n\n");
  }, [
    records,
    markedIds,
    selectedIds,
    legacyRecords,
    surveyRecords,
    selectedLegacyIds,
    selectedSurveyIds,
    overviews,
  ]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAll() {
    setSelectedIds(new Set(records.map((r) => r.id)));
  }
  function selectStarredOnly() {
    setSelectedIds(new Set(markedIds));
  }
  function clearAll() {
    setSelectedIds(new Set());
  }

  // 학생 메모 저장 — note 가 비어도 행 유지(다음 진입 시 빈 값으로 로드).
  // 빈 값으로 save = 사실상 delete 와 같은 효과. upsert 로 일관 처리.
  async function saveNote() {
    if (!selStudentId) return;
    setNoteSaving(true);
    setNoteError("");
    setNoteSaved(false);
    const { error } = await supabase.from("teacher_student_notes").upsert(
      {
        teacher_profile_id: teacherProfileId,
        student_id: selStudentId,
        note: noteText,
      },
      { onConflict: "teacher_profile_id,student_id" }
    );
    setNoteSaving(false);
    if (error) {
      setNoteError(error.message);
      return;
    }
    setNoteOriginal(noteText);
    setNoteSaved(true);
  }

  async function generate() {
    if (!selStudentId || !inputContext) {
      setGenError("학생을 선택하고 활동 기록이 있어야 생성할 수 있습니다.");
      return;
    }
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/teacher/sebteuk/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentRecord: inputContext,
          // 교사 비공개 메모를 컨텍스트에 포함(저장된 값 + 미저장 편집 모두 반영).
          teacherNote: noteText.trim(),
          targetBytes,
          model,
          // 프롬프트의 "과목:" 줄 — 선택한 교과를 그대로 넘긴다(기존엔 '수학' 고정).
          subject: selSubject,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        text?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setGenError(data.error ?? `요청 실패 (${res.status})`);
        return;
      }
      setBody(data.text ?? "");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    if (!selStudentId || !body.trim()) {
      setSaveError("학생과 본문이 모두 있어야 저장할 수 있습니다.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveOk(false);

    if (savedDraftId) {
      const { error } = await supabase
        .from("sebteuk_drafts")
        .update({ body: body.trim(), ai_model: model })
        .eq("id", savedDraftId);
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("sebteuk_drafts")
        .insert({
          teacher_id: teacherProfileId,
          student_id: selStudentId,
          school_year: selYear,
          semester: selSemester,
          subject: selSubject,
          body: body.trim(),
          ai_model: model,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
      setSavedDraftId((data as { id: string }).id);
    }
    setSaveOk(true);
    setSaving(false);
    loadStudentData();
  }

  function loadDraft(d: DraftRow) {
    setBody(d.body);
    setSavedDraftId(d.id);
    if (d.ai_model) setModel(d.ai_model);
    setSaveOk(false);
  }

  async function deleteDraft(id: string) {
    if (!confirm("이 초안을 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("sebteuk_drafts")
      .delete()
      .eq("id", id);
    if (error) {
      setSaveError(error.message);
      return;
    }
    if (savedDraftId === id) {
      setSavedDraftId(null);
      setBody("");
    }
    loadStudentData();
  }

  const selStudent = students.find((s) => s.id === selStudentId);

  return (
    <div className="space-y-6">
      {/* 작성 범위 — 내 수업 하나 */}
      <section className="rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.04] p-5 sm:p-6">
        <h2 className="text-base font-bold">1. 수업 선택</h2>
        <p className="mt-1 text-xs text-slate-400">
          세특은 <span className="font-semibold text-cyan-200">수업 하나</span> 단위로
          작성합니다. 수업을 고르면 학년도·학기·교과·수강생이 함께 정해지고, 그
          범위의 기록만 아래에 나타납니다. 다른 교과·학기 성찰은 섞이지 않습니다.
        </p>
        <div className="mt-3">
          <label htmlFor="sel-course" className="text-xs font-semibold text-slate-300">
            내 수업 ({courses.length}개)
          </label>
          <select
            id="sel-course"
            value={selCourseId}
            onChange={(e) => {
              setSelCourseId(e.target.value);
              setSelStudentId("");
            }}
            disabled={courses.length === 0}
            className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:opacity-60 [color-scheme:dark]"
          >
            <option value="">— 수업 선택 —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.school_year} {c.semester}학기 · {c.name}
              </option>
            ))}
          </select>
          {courses.length === 0 ? (
            <p className="mt-1 text-[11px] text-amber-200">
              담당 수업이 없습니다. 관리자에게 수업 배정을 요청하세요. (관리자
              화면: 수업 관리 › 담당 교사)
            </p>
          ) : selCourse ? (
            <p className="mt-2 text-[11px] text-slate-400">
              {selCourse.school_year}학년도 {SEMESTER_LABEL[selSemester]} ·{" "}
              <span className={accentText}>{selCourse.subject}</span> · 수강생{" "}
              {students.length}명
            </p>
          ) : null}
        </div>
      </section>

      {/* 학생 선택 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <h2 className="text-base font-bold">2. 학생 선택</h2>
        <div className="mt-3">
          <label htmlFor="sel-student" className="text-xs font-semibold text-slate-300">
            {selCourse
              ? `${selCourse.name} 수강생 (${students.length}명)`
              : "수업을 먼저 선택하세요"}
          </label>
          <select
            id="sel-student"
            value={selStudentId}
            onChange={(e) => setSelStudentId(e.target.value)}
            disabled={!selCourseId || studentsLoading || students.length === 0}
            className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:opacity-60"
          >
            <option value="">— 학생 선택 —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {studentLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 학생별 비공개 메모 — AI 세특 생성 시 컨텍스트로 자동 포함됨. */}
      {selStudent ? (
        <section className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">
              교사 비공개 메모{" "}
              <span className="text-xs font-semibold text-amber-200">
                (학생에게 보이지 않음 · AI 세특 입력에 포함)
              </span>
            </h2>
            <div className="flex items-center gap-2 text-[11px]">
              {noteSaved ? (
                <span className="text-emerald-300">✓ 저장됨</span>
              ) : null}
              {noteError ? (
                <span className="text-rose-300">{noteError}</span>
              ) : null}
              <button
                type="button"
                onClick={saveNote}
                disabled={noteSaving || noteText === noteOriginal}
                className="rounded-full border border-amber-300/40 px-3 py-1 font-semibold text-amber-200 transition hover:bg-amber-300/10 disabled:opacity-60"
              >
                {noteSaving ? "저장 중..." : "메모 저장"}
              </button>
            </div>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => {
              setNoteText(e.target.value);
              setNoteSaved(false);
              setNoteError("");
            }}
            rows={4}
            placeholder="예: 수업 시간에 자기 주도적으로 질문을 많이 함. 통계 단원 흥미가 큼. 또래 협력 학습 잘 이끔."
            className="mt-3 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-300/40"
          />
          <p className="mt-2 text-[11px] text-slate-400">
            저장 안 한 편집 내용도 AI 세특 생성 시 함께 전송됩니다. 빈 값으로 두면 메모 없이 생성.
          </p>
        </section>
      ) : null}

      {/* 학생 활동 기록 미리보기 + 선택 */}
      {selStudent ? (
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">
              3. {selStudent.profiles?.name ?? ""}의 {selSubject} 활동/성찰 (
              {records.length}건)
              {recordsLoading ? <span className="ml-2 text-xs text-slate-400">로딩 중...</span> : null}
            </h2>
            <span className="text-xs text-slate-400">
              선택: <span className={accentText}>{selectedIds.size}</span>건
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {selYear}학년도 {SEMESTER_LABEL[selSemester]} · {selSubject} 범위입니다.
            ★ = 학생이 생기부 후보로 체크한 항목 (기본 선택). 체크박스로 AI에
            보낼 성찰을 직접 고르세요.
          </p>

          {records.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={selectStarredOnly}
                disabled={markedIds.size === 0}
                className="rounded-full border border-amber-300/30 px-3 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-300/10 disabled:opacity-50"
              >
                별표만
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={selectedIds.size === 0}
                className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50"
              >
                모두 해제
              </button>
            </div>
          ) : null}

          {records.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">활동 기록이 없습니다.</p>
          ) : (
            <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
              {records.map((r) => {
                const marked = markedIds.has(r.id);
                const selected = selectedIds.has(r.id);
                return (
                  <li
                    key={r.id}
                    className={`rounded-lg border bg-slate-950/60 p-3 transition ${
                      selected
                        ? marked
                          ? "border-amber-300/40 bg-amber-300/5"
                          : `border-cyan-300/30`
                        : "border-white/5 opacity-70"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(r.id)}
                        className="mt-1 h-4 w-4 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-white">
                            {marked ? "★ " : ""}
                            {r.activities?.title ?? shortActivityTitle(r.activity_slug)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(r.created_at)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                          {r.subject ? (
                            <span className={accentText}>{r.subject}</span>
                          ) : null}
                          {r.activity_slug ? (
                            <span className="text-slate-500">
                              {r.activity_slug}
                            </span>
                          ) : null}
                        </div>
                        {(() => {
                          const refl = extractAllReflections(r.reflection_data);
                          return refl ? (
                            <p className="mt-2 whitespace-pre-wrap text-xs text-slate-300">
                              {refl}
                            </p>
                          ) : (
                            <p className="mt-2 text-[11px] text-slate-500">
                              성찰 없음
                            </p>
                          );
                        })()}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {/* 2-1. 옛 앱 성찰 카드 목록 — 개별 선택 */}
      {selStudent && legacyRecords.length > 0 ? (
        <section className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">
              3-1. 옛 앱 성찰 ({legacyRecords.length}건)
            </h2>
            <span className="text-xs text-slate-400">
              선택: <span className="text-amber-200">{selectedLegacyIds.size}</span>건
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            기존 Streamlit 앱에서 이식. 체크된 항목만 AI 입력에 포함.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedLegacyIds(new Set(legacyRecords.map((r) => r.id)))
              }
              className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={() => setSelectedLegacyIds(new Set())}
              disabled={selectedLegacyIds.size === 0}
              className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50"
            >
              모두 해제
            </button>
          </div>
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {legacyRecords.map((r) => {
              const selected = selectedLegacyIds.has(r.id);
              return (
                <li
                  key={r.id}
                  className={`rounded-lg border bg-slate-950/60 p-3 transition ${
                    selected
                      ? "border-amber-300/40"
                      : "border-white/5 opacity-70"
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        setSelectedLegacyIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(r.id)) next.delete(r.id);
                          else next.add(r.id);
                          return next;
                        })
                      }
                      className="mt-1 h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          📜 {r.activity_label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {r.legacy_created_at
                            ? formatDateTime(r.legacy_created_at)
                            : ""}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.source_subject ? (
                          <span className="inline-block rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                            {r.source_subject}
                          </span>
                        ) : null}
                        {r.subject === null ? (
                          <span className="inline-block rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                            교과 무관 · 기본 미선택
                          </span>
                        ) : null}
                      </div>
                      {/* payload 의미 있는 답변 미리보기(최대 3 줄) — 진짜 질문 매핑 적용 */}
                      <div className="mt-2 space-y-0.5 text-[11px] text-slate-300">
                        {Object.entries(r.payload)
                          .filter(
                            ([k, v]) =>
                              !["timestamp", "학번", "이름"].includes(k) &&
                              String(v ?? "").trim()
                          )
                          .slice(0, 3)
                          .map(([k, v]) => {
                            const label =
                              REFLECTION_LABELS[r.activity_label]?.[k] ?? k;
                            return (
                              <div key={k} className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-500">
                                  {label.length > 60
                                    ? label.slice(0, 60) + "…"
                                    : label}
                                </span>
                                <span className="truncate text-slate-200">
                                  {String(v)}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* 2-2. 사전/사후 설문 응답 — 개별 선택 */}
      {selStudent && surveyRecords.length > 0 ? (
        <section className="rounded-2xl border border-violet-300/25 bg-violet-300/[0.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">
              3-2. 사전/사후 설문 ({surveyRecords.length}건)
            </h2>
            <span className="text-xs text-slate-400">
              선택: <span className="text-violet-200">{selectedSurveyIds.size}</span>건
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            체크된 설문 답변이 AI 입력에 함께 포함.
          </p>
          <ul className="mt-3 space-y-2">
            {surveyRecords.map((r) => {
              const selected = selectedSurveyIds.has(r.id);
              const title = r.surveys?.title ?? r.surveys?.kind ?? "설문";
              return (
                <li
                  key={r.id}
                  className={`rounded-lg border bg-slate-950/60 p-3 transition ${
                    selected
                      ? "border-violet-300/40"
                      : "border-white/5 opacity-70"
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        setSelectedSurveyIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(r.id)) next.delete(r.id);
                          else next.add(r.id);
                          return next;
                        })
                      }
                      className="mt-1 h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          📊 {title}
                        </span>
                        {r.legacy_created_at ? (
                          <span className="text-[11px] text-slate-500">
                            {formatDateTime(r.legacy_created_at)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        답변 {Object.keys(r.answers).length}개
                        {r.subject === null ? (
                          <span className="ml-2 rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                            교과 무관 · 기본 미선택
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* 생성 컨트롤 */}
      {selStudent ? (
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="text-base font-bold">4. AI 초안 생성</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="sel-model" className="text-xs font-semibold text-slate-300">
                모델
              </label>
              <select
                id="sel-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={allowedModels.length === 0}
                className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:opacity-60"
              >
                {allowedModels.length === 0 ? (
                  <option value="">(허용된 모델 없음)</option>
                ) : (
                  allowedModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))
                )}
              </select>
              {allowedModels.length === 0 ? (
                <p className="mt-1 text-[11px] text-amber-200">
                  관리자가 사용 가능한 모델을 지정하지 않았습니다.
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="sel-bytes" className="text-xs font-semibold text-slate-300">
                목표 분량 ({targetBytes} 바이트 ≈ 한글 {Math.round(targetBytes / 3)}자)
              </label>
              <input
                id="sel-bytes"
                type="range"
                min={300}
                max={4000}
                step={100}
                value={targetBytes}
                onChange={(e) => setTargetBytes(Number(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
          </div>

          {genError ? (
            <Alert tone="error" className="mt-3">
              {genError}
            </Alert>
          ) : null}

          <div className="mt-4 flex items-center justify-end">
            <Button onClick={generate} disabled={generating || !inputContext}>
              {generating ? "생성 중..." : "🤖 AI 초안 생성"}
            </Button>
          </div>
          {!inputContext ? (
            <p className="mt-2 text-[11px] text-amber-200">
              {records.length === 0
                ? "활동 기록이 없어 생성할 수 없습니다."
                : "선택한 성찰이 없습니다. 위에서 1개 이상 체크해 주세요."}
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-slate-400">
              선택한 {selectedIds.size}건의 활동/성찰을 AI 입력으로 사용합니다.
            </p>
          )}
        </section>
      ) : null}

      {/* 본문 편집 + 저장 */}
      {selStudent ? (
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="text-base font-bold">5. 검토·편집 후 저장</h2>
          <p className="mt-1 text-xs text-slate-400">
            AI 본문을 직접 다듬어 NEIS 에 그대로 옮길 수 있는 형태로 만든 뒤
            저장하세요.
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="AI 생성 또는 직접 입력한 세특 본문..."
            className="mt-3 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
          />
          <div className="mt-2 text-[11px] text-slate-400">
            현재 바이트: {new Blob([body]).size}
            {savedDraftId ? (
              <span className="ml-2 text-emerald-300">
                (기존 초안 #{savedDraftId.slice(0, 6)} 수정 중)
              </span>
            ) : null}
          </div>

          {saveError ? (
            <Alert tone="error" className="mt-3">
              {saveError}
            </Alert>
          ) : null}
          {saveOk ? (
            <Alert tone="success" className="mt-3">
              초안이 저장되었습니다.
            </Alert>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            {savedDraftId ? (
              <button
                type="button"
                onClick={() => {
                  setSavedDraftId(null);
                  setBody("");
                  setSaveOk(false);
                }}
                className="rounded px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                새 초안으로
              </button>
            ) : null}
            <Button onClick={saveDraft} disabled={saving || !body.trim()}>
              {saving ? "저장 중..." : savedDraftId ? "저장 (덮어쓰기)" : "초안 저장"}
            </Button>
          </div>
        </section>
      ) : null}

      {/* 저장된 초안 목록 */}
      {selStudent && drafts.length > 0 ? (
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
          <h2 className="text-base font-bold">
            저장된 초안 ({drafts.length}건)
          </h2>
          <ul className="mt-3 space-y-2">
            {drafts.map((d) => (
              <li
                key={d.id}
                className={`rounded-lg border border-white/5 bg-slate-950/60 p-3 ${
                  savedDraftId === d.id ? `border ${accentText}` : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-300">
                    {d.ai_model ?? "(직접 작성)"} ·{" "}
                    {formatDateTime(d.updated_at)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => loadDraft(d)}
                      className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-white/10"
                    >
                      불러오기
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDraft(d.id)}
                      className="rounded-full border border-red-300/40 px-2 py-0.5 text-[11px] text-red-200 hover:bg-red-300/10"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-slate-200">
                  {d.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
