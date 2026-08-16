"use client";

// 수업 관리 — (학년도 · 학기 · 교과 · 수강생) 을 묶는 개설 수업.
//
// 정규 수업(1학년 9반 공통수학2) 과 선택 수업(경제수학) 을 같은 화면에서 다룬다.
// 차이는 학생을 넣는 방법뿐 — 정규는 학급 통째로, 선택은 개별로 골라 담는다.
//
// 교사가 /teacher/sebteuk 등에서 고르는 "내 수업" 목록이 여기서 만들어진다.
// RLS 는 courses/course_teachers/course_students 모두 관리자 ALL — 이 페이지는 admin 전용.

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CourseStudentsPanel } from "@/components/admin/courses/CourseStudentsPanel";
import { fetchClassStudentCodes } from "@/lib/courses/enroll";

type Course = {
  id: string;
  school_year: number;
  semester: number;
  subject: string;
  name: string;
  grade: number | null;
  class_number: number | null;
  note: string;
};

type TeacherRow = {
  id: string;
  course_id: string;
  profile_id: string;
  profile_name: string;
  profile_login_id: string;
};

type ProfileLite = {
  id: string;
  name: string;
  login_id: string;
  role: string;
};

type SchoolClass = { grade: number; class_number: number };

const inputClass =
  "w-full rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none [color-scheme:dark]";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [counts, setCounts] = useState<
    Map<string, { teachers: number; students: number }>
  >(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // 목록 필터 (학년도·학기)
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterSemester, setFilterSemester] = useState<string>("");

  // 새 수업
  const [newYear, setNewYear] = useState("2026");
  const [newSemester, setNewSemester] = useState("2");
  const [newSubject, setNewSubject] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [courseRes, subjectRes, classRes, tCountRes, sCountRes] =
      await Promise.all([
        supabase
          .from("courses")
          .select(
            "id, school_year, semester, subject, name, grade, class_number, note"
          )
          .order("school_year", { ascending: false })
          .order("semester")
          .order("subject")
          .order("name"),
        supabase
          .from("subjects")
          .select("name")
          .order("order_index", { nullsFirst: false })
          .order("name"),
        supabase
          .from("school_classes")
          .select("grade, class_number")
          .order("grade")
          .order("class_number"),
        supabase.from("course_teachers").select("course_id"),
        supabase.from("course_students").select("course_id"),
      ]);

    if (courseRes.error) {
      setError(`수업 목록 오류: ${courseRes.error.message}`);
      setLoading(false);
      return;
    }
    const list = (courseRes.data ?? []) as Course[];
    setCourses(list);
    if (!subjectRes.error) {
      setSubjects(((subjectRes.data ?? []) as { name: string }[]).map((s) => s.name));
    }
    if (!classRes.error) {
      setClasses((classRes.data ?? []) as SchoolClass[]);
    }

    const map = new Map<string, { teachers: number; students: number }>();
    const bump = (id: string, key: "teachers" | "students") => {
      const cur = map.get(id) ?? { teachers: 0, students: 0 };
      cur[key] += 1;
      map.set(id, cur);
    };
    ((tCountRes.data ?? []) as { course_id: string }[]).forEach((r) =>
      bump(r.course_id, "teachers")
    );
    ((sCountRes.data ?? []) as { course_id: string }[]).forEach((r) =>
      bump(r.course_id, "students")
    );
    setCounts(map);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const yearOptions = useMemo(
    () =>
      Array.from(new Set(courses.map((c) => c.school_year))).sort((a, b) => b - a),
    [courses]
  );

  const visible = useMemo(
    () =>
      courses.filter((c) => {
        if (filterYear && String(c.school_year) !== filterYear) return false;
        if (filterSemester && String(c.semester) !== filterSemester) return false;
        return true;
      }),
    [courses, filterYear, filterSemester]
  );

  // 학급을 고르면 이름을 자동으로 채운다 (직접 고친 이름은 건드리지 않음).
  const autoName = useMemo(() => {
    if (!newSubject) return "";
    if (newGrade && newClass) return `${newGrade}학년 ${newClass}반 ${newSubject}`;
    return `${newYear} ${newSemester}학기 ${newSubject}`;
  }, [newSubject, newGrade, newClass, newYear, newSemester]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const name = (newName.trim() || autoName).trim();
    if (!newSubject || !name) {
      setError("교과와 수업명을 입력해 주세요.");
      return;
    }
    const grade = newGrade ? Number(newGrade) : null;
    const classNumber = newClass ? Number(newClass) : null;

    const { data, error: insErr } = await supabase
      .from("courses")
      .insert({
        school_year: Number(newYear),
        semester: Number(newSemester),
        subject: newSubject,
        name,
        grade,
        class_number: classNumber,
      })
      .select("id, school_year, semester, subject, name, grade, class_number, note")
      .single();

    if (insErr) {
      setError(
        insErr.code === "23505"
          ? "같은 학년도·학기에 이미 같은 이름의 수업이 있습니다."
          : `수업 생성 오류: ${insErr.message}`
      );
      return;
    }

    const created = data as Course;

    // 학급을 지정했으면 그 반을 명렬표 기준으로 편성 — 미가입 학생도 미리 잡아둔다.
    if (grade !== null && classNumber !== null) {
      const codes = await fetchClassStudentCodes(
        Number(newYear),
        grade,
        classNumber
      );
      if (codes.length > 0) {
        await supabase.from("course_students").insert(
          codes.map((c) => ({
            course_id: created.id,
            student_code: c.student_code,
            school_year: Number(newYear),
          }))
        );
      }
      setMessage(
        `'${name}' 수업을 만들고 ${grade}학년 ${classNumber}반 ${codes.length}명을 편성했습니다. 아직 가입 전인 학생은 가입하는 순간 자동으로 연결됩니다.`
      );
    } else {
      setMessage(`'${name}' 수업을 만들었습니다. 학생을 편성해 주세요.`);
    }

    setNewSubject("");
    setNewGrade("");
    setNewClass("");
    setNewName("");
    setSelectedId(created.id);
    load();
  }

  const selected = courses.find((c) => c.id === selectedId) ?? null;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-semibold text-cyan-300">관리자 · 수업</p>
          <h1 className="mt-2 text-3xl font-bold">수업 관리</h1>
          <p className="mt-2 text-sm text-slate-400">
            학년도 · 학기 · 교과 · 수강생을 한 묶음으로 관리합니다. 학급이 통째로
            듣는 정규 수업과, 경제수학처럼 여러 학급에서 모인 선택 수업을 같은
            방식으로 다룹니다. 교사는 여기서 배정된 수업만 기록 조회·AI 세특에
            사용할 수 있습니다.
          </p>
        </header>

        {error ? <Alert tone="error">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* 좌: 목록 + 생성 */}
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-200">수업 목록</h2>
              <span className="text-xs text-slate-500">{visible.length}개</span>
            </div>

            <div className="mt-3 flex gap-2">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                aria-label="학년도 필터"
                className={inputClass}
              >
                <option value="">전체 학년도</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}학년도
                  </option>
                ))}
              </select>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                aria-label="학기 필터"
                className={inputClass}
              >
                <option value="">전체 학기</option>
                <option value="1">1학기</option>
                <option value="2">2학기</option>
              </select>
            </div>

            <div className="mt-3 max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-slate-500">불러오는 중…</p>
              ) : visible.length === 0 ? (
                <p className="text-xs text-slate-500">해당 조건의 수업이 없어요.</p>
              ) : (
                visible.map((c) => {
                  const n = counts.get(c.id) ?? { teachers: 0, students: 0 };
                  const empty = n.students === 0 || n.teachers === 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={
                        "block w-full rounded-lg border px-3 py-2 text-left transition " +
                        (c.id === selectedId
                          ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                          : "border-white/10 bg-slate-900/50 text-slate-300 hover:bg-slate-900")
                      }
                    >
                      <div className="flex items-center gap-1.5 text-sm font-bold">
                        {c.name}
                        {empty ? (
                          <span
                            className="text-amber-300"
                            title="교사 또는 학생이 비어 있습니다"
                          >
                            ⚠
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {c.school_year}학년도 {c.semester}학기 · {c.subject} · 교사{" "}
                        {n.teachers}명 · 학생 {n.students}명
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleCreate}
              className="mt-4 space-y-2 border-t border-white/10 pt-4"
            >
              <h3 className="text-xs font-bold text-slate-300">새 수업 만들기</h3>
              <div className="flex gap-2">
                <select
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  aria-label="학년도"
                  className={inputClass}
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}학년도
                    </option>
                  ))}
                </select>
                <select
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  aria-label="학기"
                  className={inputClass}
                >
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
              </div>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                aria-label="교과"
                className={inputClass}
              >
                <option value="">교과 선택…</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <select
                  value={newGrade}
                  onChange={(e) => {
                    setNewGrade(e.target.value);
                    setNewClass("");
                  }}
                  aria-label="학년 (정규 수업만)"
                  className={inputClass}
                >
                  <option value="">학년 (선택 수업이면 비움)</option>
                  {Array.from(new Set(classes.map((c) => c.grade)))
                    .sort((a, b) => a - b)
                    .map((g) => (
                      <option key={g} value={g}>
                        {g}학년
                      </option>
                    ))}
                </select>
                <select
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  disabled={!newGrade}
                  aria-label="반"
                  className={`${inputClass} disabled:opacity-50`}
                >
                  <option value="">{newGrade ? "반" : "—"}</option>
                  {classes
                    .filter((c) => c.grade === Number(newGrade))
                    .map((c) => (
                      <option key={c.class_number} value={c.class_number}>
                        {c.class_number}반
                      </option>
                    ))}
                </select>
              </div>

              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={autoName || "수업명"}
                aria-label="수업명"
                className={inputClass}
              />
              <p className="text-[11px] text-slate-500">
                학년·반을 고르면 그 반 학생이 <b>자동 배정</b>됩니다. 선택 수업은
                학년·반을 비우고 만든 뒤 학생을 골라 담으세요.
              </p>
              <Button type="submit" size="sm" disabled={!newSubject}>
                ＋ 수업 만들기
              </Button>
            </form>
          </Card>

          {/* 우: 상세 */}
          <div className="space-y-4">
            {selected ? (
              <CourseDetail
                key={selected.id}
                course={selected}
                classes={classes}
                onChanged={load}
                onDeleted={() => {
                  setSelectedId(null);
                  setMessage("수업을 삭제했습니다.");
                  load();
                }}
                onError={setError}
                onMessage={setMessage}
              />
            ) : (
              <Card className="p-6 text-sm text-slate-400">
                왼쪽에서 수업을 선택하거나 새로 만드세요.
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── 수업 상세 ─────────────────────────────────────────────
function CourseDetail({
  course,
  classes,
  onChanged,
  onDeleted,
  onError,
  onMessage,
}: {
  course: Course;
  classes: SchoolClass[];
  onChanged: () => void;
  onDeleted: () => void;
  onError: (m: string) => void;
  onMessage: (m: string) => void;
}) {
  const [name, setName] = useState(course.name);
  const [note, setNote] = useState(course.note);
  const [saving, setSaving] = useState(false);

  // 다른 학기로 복제
  const [copyYear, setCopyYear] = useState(String(course.school_year));
  const [copySemester, setCopySemester] = useState(
    course.semester === 1 ? "2" : "1"
  );
  const [copying, setCopying] = useState(false);

  async function handleSave() {
    setSaving(true);
    onError("");
    const { error } = await supabase
      .from("courses")
      .update({ name: name.trim(), note: note.trim() })
      .eq("id", course.id);
    setSaving(false);
    if (error) {
      onError(`수업 수정 오류: ${error.message}`);
      return;
    }
    onMessage("수업 정보를 저장했습니다.");
    onChanged();
  }

  async function handleDelete() {
    if (
      !confirm(
        `'${course.name}' 수업을 삭제하시겠어요?\n담당 교사·수강생 배정이 함께 사라집니다. (학생의 성찰 기록 자체는 지워지지 않습니다.)`
      )
    )
      return;
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (error) {
      onError(`수업 삭제 오류: ${error.message}`);
      return;
    }
    onDeleted();
  }

  // 학기가 바뀌어도 수강생·담당 교사가 그대로인 경우가 많아 통째로 복제한다.
  // 2학기 세팅을 처음부터 다시 하지 않아도 되게 하는 것이 목적.
  async function handleCopy() {
    setCopying(true);
    onError("");
    const targetYear = Number(copyYear);
    const targetSemester = Number(copySemester);
    if (
      targetYear === course.school_year &&
      targetSemester === course.semester
    ) {
      onError("같은 학년도·학기로는 복제할 수 없습니다.");
      setCopying(false);
      return;
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({
        school_year: targetYear,
        semester: targetSemester,
        subject: course.subject,
        name: course.name,
        grade: course.grade,
        class_number: course.class_number,
        note: `${course.school_year}학년도 ${course.semester}학기 수업에서 복제`,
      })
      .select("id")
      .single();

    if (error) {
      setCopying(false);
      onError(
        error.code === "23505"
          ? "대상 학기에 같은 이름의 수업이 이미 있습니다."
          : `복제 오류: ${error.message}`
      );
      return;
    }
    const newId = (data as { id: string }).id;

    const [tRes, sRes] = await Promise.all([
      supabase.from("course_teachers").select("profile_id").eq("course_id", course.id),
      supabase
        .from("course_students")
        .select("student_code")
        .eq("course_id", course.id),
    ]);
    const tRows = ((tRes.data ?? []) as { profile_id: string }[]).map((r) => ({
      course_id: newId,
      profile_id: r.profile_id,
    }));
    // 편성은 학번 기준으로 복사한다 — 미가입 대기 학생도 그대로 따라간다.
    const sRows = ((sRes.data ?? []) as { student_code: string }[]).map((r) => ({
      course_id: newId,
      student_code: r.student_code,
      school_year: targetYear,
    }));
    if (tRows.length > 0) await supabase.from("course_teachers").insert(tRows);
    if (sRows.length > 0) await supabase.from("course_students").insert(sRows);

    setCopying(false);
    onMessage(
      `${targetYear}학년도 ${targetSemester}학기로 복제했습니다. (교사 ${tRows.length}명 · 학생 ${sRows.length}명)`
    );
    onChanged();
  }

  const dirty = name.trim() !== course.name || note.trim() !== course.note;

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">{course.name}</h2>
            <p className="mt-1 text-xs text-slate-400">
              {course.school_year}학년도 {course.semester}학기 · {course.subject}
              {course.grade !== null && course.class_number !== null
                ? ` · ${course.grade}학년 ${course.class_number}반 정규 수업`
                : " · 선택 수업 (학급 무관)"}
            </p>
          </div>
          <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
            🗑 수업 삭제
          </Button>
        </div>

        <div className="mt-3 grid gap-3">
          <label className="block text-xs font-semibold text-slate-300">
            수업명
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-300">
            비고
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={`mt-1 ${inputClass}`}
            />
          </label>
          <div>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving || !name.trim()}
            >
              {saving ? "저장 중…" : "변경 저장"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-white/10 pt-4">
          <div>
            <p className="text-xs font-bold text-slate-300">다른 학기로 복제</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              교사·수강생을 그대로 복사합니다. 2학기 세팅에 쓰세요.
            </p>
          </div>
          <select
            value={copyYear}
            onChange={(e) => setCopyYear(e.target.value)}
            aria-label="복제 대상 학년도"
            className="w-32 rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 [color-scheme:dark]"
          >
            {[course.school_year, course.school_year + 1].map((y) => (
              <option key={y} value={y}>
                {y}학년도
              </option>
            ))}
          </select>
          <select
            value={copySemester}
            onChange={(e) => setCopySemester(e.target.value)}
            aria-label="복제 대상 학기"
            className="w-28 rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 [color-scheme:dark]"
          >
            <option value="1">1학기</option>
            <option value="2">2학기</option>
          </select>
          <Button type="button" size="sm" variant="secondary" onClick={handleCopy} disabled={copying}>
            {copying ? "복제 중…" : "복제"}
          </Button>
        </div>
      </Card>

      <CourseTeachersPanel courseId={course.id} onError={onError} onMessage={onMessage} onChanged={onChanged} />

      <CourseStudentsPanel
        course={course}
        classes={classes}
        onError={onError}
        onMessage={onMessage}
        onChanged={onChanged}
      />
    </>
  );
}

// ─── 담당 교사 ─────────────────────────────────────────────
function CourseTeachersPanel({
  courseId,
  onError,
  onMessage,
  onChanged,
}: {
  courseId: string;
  onError: (m: string) => void;
  onMessage: (m: string) => void;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ProfileLite[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_teachers")
      .select("id, course_id, profile_id, profiles!inner(name, login_id)")
      .eq("course_id", courseId)
      .order("added_at");
    if (error) {
      onError(`담당 교사 오류: ${error.message}`);
      setLoading(false);
      return;
    }
    setRows(
      (data ?? []).map((row: unknown) => {
        const r = row as {
          id: string;
          course_id: string;
          profile_id: string;
          profiles: { name: string; login_id: string };
        };
        return {
          id: r.id,
          course_id: r.course_id,
          profile_id: r.profile_id,
          profile_name: r.profiles?.name ?? "",
          profile_login_id: r.profiles?.login_id ?? "",
        };
      })
    );
    setLoading(false);
  }, [courseId, onError]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSearch(e: ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 2) {
      setMatches([]);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("id, name, login_id, role")
      .or(`name.ilike.%${q}%,login_id.ilike.%${q}%`)
      .in("role", ["teacher", "admin"])
      .eq("status", "approved")
      .limit(15);
    const taken = new Set(rows.map((r) => r.profile_id));
    setMatches(((data ?? []) as ProfileLite[]).filter((p) => !taken.has(p.id)));
  }

  async function handleAdd(p: ProfileLite) {
    const { error } = await supabase
      .from("course_teachers")
      .insert({ course_id: courseId, profile_id: p.id });
    if (error) {
      onError(`담당 교사 추가 오류: ${error.message}`);
      return;
    }
    onMessage(`${p.name} 선생님을 담당 교사로 추가했습니다.`);
    setQuery("");
    setMatches([]);
    load();
    onChanged();
  }

  async function handleRemove(r: TeacherRow) {
    const { error } = await supabase.from("course_teachers").delete().eq("id", r.id);
    if (error) {
      onError(`담당 교사 제거 오류: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    onChanged();
  }

  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-white">담당 교사 ({rows.length}명)</h2>
      <p className="mt-1 text-xs text-slate-500">
        여기 등록된 교사만 이 수업 학생의 성찰을 열람하고 AI 세특을 쓸 수 있습니다.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {loading ? (
          <span className="text-xs text-slate-500">불러오는 중…</span>
        ) : rows.length === 0 ? (
          <span className="text-xs text-amber-300">
            담당 교사가 없습니다. 아래에서 추가하세요.
          </span>
        ) : (
          rows.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200"
            >
              {r.profile_name}
              <span className="font-mono text-[11px] text-cyan-300/60">
                {r.profile_login_id}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(r)}
                className="rounded-full px-1 text-cyan-200/70 transition hover:text-red-300"
                aria-label="담당 교사 제거"
              >
                ✕
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="교사 이름 또는 로그인 ID 검색…"
          aria-label="교사 검색"
          className={inputClass}
        />
        {matches.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAdd(p)}
                className="flex w-full items-center justify-between rounded-md border border-white/10 bg-slate-950 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-900"
              >
                <span>
                  <span className="font-semibold text-slate-100">{p.name}</span>
                  <span className="ml-1 font-mono text-[11px] text-slate-500">
                    {p.login_id}
                  </span>
                </span>
                <span className="text-xs font-semibold text-cyan-300">＋ 추가</span>
              </button>
            ))}
          </div>
        ) : query.trim().length >= 2 ? (
          <p className="mt-2 text-xs text-slate-500">검색 결과가 없어요.</p>
        ) : null}
      </div>
    </Card>
  );
}

