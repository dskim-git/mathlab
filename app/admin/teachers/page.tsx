"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type Permission = {
  id: string;
  subject: string;
  grade: number;
  class_number: number;
};

type TeacherProfile = {
  id: string;
  name: string;
  login_id: string;
  role: string;
  status: string;
};

type TeacherRow = {
  id: string; // teacher_id
  profiles: TeacherProfile;
  teacher_permissions: Permission[];
};

type SchoolClass = {
  grade: number;
  class_number: number;
};

type StudyGroupLite = {
  id: string;
  name: string;
};

// study_group_members 한 행 (역할 무관) — 담당 그룹/학생 수 계산에 함께 쓴다.
type GroupMemberRow = {
  id: string;
  group_id: string;
  profile_id: string;
  role: "teacher" | "student";
};

function TeacherCard({
  teacher,
  subjects,
  classes,
  groups,
  groupSubjects,
  groupStudentCounts,
  myGroupRows,
  onChanged,
}: {
  teacher: TeacherRow;
  subjects: string[];
  classes: SchoolClass[];
  groups: StudyGroupLite[];
  groupSubjects: Map<string, string[]>;
  groupStudentCounts: Map<string, number>;
  myGroupRows: GroupMemberRow[];
  onChanged: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  // 등록된 학급에서 학년 목록(중복 제거), 선택한 학년의 반 목록.
  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.map((c) => c.grade))).sort((a, b) => a - b),
    [classes]
  );

  const classOptions = useMemo(
    () =>
      classes
        .filter((c) => c.grade === Number(grade))
        .map((c) => c.class_number)
        .sort((a, b) => a - b),
    [classes, grade]
  );

  const masterEmpty = subjects.length === 0 || classes.length === 0;

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!subject) {
      setErrorMessage("과목을 선택해 주세요.");
      return;
    }
    // 0반이 유효한 반이라 Number 값의 truthiness 로 판정하면 안 된다 (0 → falsy).
    // 선택 여부는 문자열이 비었는지로 본다.
    if (grade === "") {
      setErrorMessage("학년을 선택해 주세요.");
      return;
    }
    if (classNumber === "") {
      setErrorMessage("반을 선택해 주세요.");
      return;
    }
    const gradeValue = Number(grade);
    const classValue = Number(classNumber);

    setIsBusy(true);
    const { error } = await supabase.from("teacher_permissions").insert({
      teacher_id: teacher.id,
      subject,
      grade: gradeValue,
      class_number: classValue,
    });
    setIsBusy(false);

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "이미 등록된 담당 학급입니다."
          : `추가 중 오류: ${error.message}`
      );
      return;
    }

    setSubject("");
    setGrade("");
    setClassNumber("");
    onChanged();
  }

  async function handleDelete(permission: Permission) {
    setErrorMessage("");
    setIsBusy(true);
    const { error } = await supabase
      .from("teacher_permissions")
      .delete()
      .eq("id", permission.id);
    setIsBusy(false);

    if (error) {
      setErrorMessage(`삭제 중 오류: ${error.message}`);
      return;
    }
    onChanged();
  }

  // ── 담당 수업 그룹 (study_group_members role='teacher') ──
  // 정규 학년·반으로 묶이지 않는 선택 수업(경제수학 등) 을 이 교사에게 연결한다.
  // 연결되면 그룹 학생의 성찰·기록이 담당 학급과 동일하게 열리고 AI 세특 대상이 된다.
  const [groupPicker, setGroupPicker] = useState("");
  const myGroupIds = new Set(myGroupRows.map((r) => r.group_id));
  const availableGroups = groups.filter((g) => !myGroupIds.has(g.id));

  async function handleAddGroup() {
    if (!groupPicker) return;
    setErrorMessage("");
    setIsBusy(true);
    const { error } = await supabase.from("study_group_members").insert({
      group_id: groupPicker,
      profile_id: teacher.profiles.id,
      role: "teacher",
    });

    if (error && error.code === "23505") {
      // 이미 그 그룹의 멤버(학생 역할 등) → 역할만 교사로 승격.
      const { error: upErr } = await supabase
        .from("study_group_members")
        .update({ role: "teacher" })
        .eq("group_id", groupPicker)
        .eq("profile_id", teacher.profiles.id);
      setIsBusy(false);
      if (upErr) {
        setErrorMessage(`그룹 연결 중 오류: ${upErr.message}`);
        return;
      }
      setGroupPicker("");
      onChanged();
      return;
    }

    setIsBusy(false);
    if (error) {
      setErrorMessage(`그룹 연결 중 오류: ${error.message}`);
      return;
    }
    setGroupPicker("");
    onChanged();
  }

  async function handleRemoveGroup(row: GroupMemberRow) {
    setErrorMessage("");
    setIsBusy(true);
    const { error } = await supabase
      .from("study_group_members")
      .delete()
      .eq("id", row.id);
    setIsBusy(false);
    if (error) {
      setErrorMessage(`그룹 연결 해제 중 오류: ${error.message}`);
      return;
    }
    onChanged();
  }

  const selectClassName =
    "mt-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-white">{teacher.profiles.name}</p>
          <p className="text-sm text-slate-400">
            아이디: {teacher.profiles.login_id}
          </p>
        </div>

        <span className="text-sm text-slate-400">
          담당 학급{" "}
          <span className="font-bold text-cyan-300">
            {teacher.teacher_permissions.length}
          </span>
          개
        </span>
      </div>

      {teacher.teacher_permissions.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400">
          지정된 담당 학급이 없습니다.
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {teacher.teacher_permissions.map((permission) => (
            <span
              key={permission.id}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200"
            >
              {permission.subject} · {permission.grade}학년 {permission.class_number}반
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleDelete(permission)}
                className="rounded-full px-1 text-cyan-200/70 transition hover:text-red-300 disabled:opacity-50"
                aria-label="담당 학급 삭제"
                title="삭제"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {masterEmpty ? (
        <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-950/30 p-4 text-sm text-yellow-100">
          먼저 상단 <span className="font-semibold">과목·학급</span> 메뉴에서 과목과
          학급을 등록해 주세요.
        </div>
      ) : (
        <form
          onSubmit={handleAdd}
          className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4"
        >
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-300">과목</label>
            <select
              aria-label="과목 선택"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setErrorMessage("");
              }}
              className={selectClassName}
            >
              <option value="">선택</option>
              {subjects.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-300">학년</label>
            <select
              aria-label="학년 선택"
              value={grade}
              onChange={(event) => {
                setGrade(event.target.value);
                setClassNumber(""); // 학년 바뀌면 반 초기화
                setErrorMessage("");
              }}
              className={selectClassName}
            >
              <option value="">선택</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  {g}학년
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-300">반</label>
            <select
              aria-label="반 선택"
              value={classNumber}
              onChange={(event) => {
                setClassNumber(event.target.value);
                setErrorMessage("");
              }}
              disabled={!grade}
              className={`${selectClassName} disabled:opacity-50`}
            >
              <option value="">{grade ? "선택" : "학년 먼저"}</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}반
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" size="sm" disabled={isBusy}>
            담당 학급 추가
          </Button>
        </form>
      )}

      {/* ── 담당 수업 그룹 ── */}
      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-violet-200">
            담당 수업 그룹{" "}
            <span className="font-normal text-slate-400">
              (선택 수업 등 학급으로 묶이지 않는 집단)
            </span>
          </p>
          <span className="text-sm text-slate-400">
            <span className="font-bold text-violet-300">
              {myGroupRows.length}
            </span>
            개
          </span>
        </div>

        {myGroupRows.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400">
            연결된 수업 그룹이 없습니다.
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {myGroupRows.map((row) => {
              const group = groups.find((g) => g.id === row.group_id);
              const subjectList = groupSubjects.get(row.group_id) ?? [];
              return (
                <span
                  key={row.id}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-300/10 px-3 py-1 text-sm font-semibold text-violet-200"
                >
                  <span>
                    {group?.name ?? "(삭제된 그룹)"}
                    <span className="ml-1 text-xs font-normal text-violet-300/70">
                      학생 {groupStudentCounts.get(row.group_id) ?? 0}명
                      {subjectList.length > 0
                        ? ` · ${subjectList.join(", ")}`
                        : " · 교과 미지정"}
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleRemoveGroup(row)}
                    className="rounded-full px-1 text-violet-200/70 transition hover:text-red-300 disabled:opacity-50"
                    aria-label="수업 그룹 연결 해제"
                    title="연결 해제"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {groups.length === 0 ? (
          <div className="mt-3 rounded-xl border border-yellow-400/30 bg-yellow-950/30 p-4 text-sm text-yellow-100">
            먼저 <span className="font-semibold">수업 그룹</span> 메뉴에서 그룹을
            만들고 학생을 넣어 주세요.
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-300">
                수업 그룹
              </label>
              <select
                aria-label="수업 그룹 선택"
                value={groupPicker}
                onChange={(event) => {
                  setGroupPicker(event.target.value);
                  setErrorMessage("");
                }}
                className={`${selectClassName} min-w-[220px]`}
              >
                <option value="">선택</option>
                {availableGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (학생 {groupStudentCounts.get(g.id) ?? 0}명)
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              size="sm"
              disabled={isBusy || !groupPicker}
              onClick={handleAddGroup}
            >
              그룹 연결
            </Button>
          </div>
        )}

        <p className="mt-2 text-xs text-slate-500">
          연결하면 그룹 학생의 성찰·활동 기록이 담당 학급과 똑같이 열리고 AI 세특
          대상에 포함됩니다. 열람 범위는 그룹에 지정된 교과로 제한됩니다.
        </p>
      </div>

      {errorMessage ? (
        <Alert tone="error" className="mt-3">
          {errorMessage}
        </Alert>
      ) : null}
    </div>
  );
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [groups, setGroups] = useState<StudyGroupLite[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMemberRow[]>([]);
  const [groupSubjectRows, setGroupSubjectRows] = useState<
    { group_id: string; subject: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const [
      teacherResult,
      subjectResult,
      classResult,
      groupResult,
      groupMemberResult,
      groupSubjectResult,
    ] = await Promise.all([
      supabase
        .from("teachers")
        .select(
          "id, profiles!inner(id, name, login_id, role, status), teacher_permissions(id, subject, grade, class_number)"
        )
        .eq("profiles.role", "teacher")
        .eq("profiles.status", "approved"),
      supabase.from("subjects").select("name").order("name"),
      supabase
        .from("school_classes")
        .select("grade, class_number")
        .order("grade")
        .order("class_number"),
      supabase.from("study_groups").select("id, name").order("name"),
      supabase
        .from("study_group_members")
        .select("id, group_id, profile_id, role"),
      supabase.from("study_group_subjects").select("group_id, subject"),
    ]);

    if (teacherResult.error) {
      setErrorMessage(`교사 목록을 불러오지 못했습니다: ${teacherResult.error.message}`);
      setTeachers([]);
    } else {
      setTeachers((teacherResult.data ?? []) as unknown as TeacherRow[]);
    }

    if (!subjectResult.error) {
      setSubjects(
        ((subjectResult.data ?? []) as { name: string }[]).map((s) => s.name)
      );
    }

    if (!classResult.error) {
      setClasses((classResult.data ?? []) as SchoolClass[]);
    }

    if (!groupResult.error) {
      setGroups((groupResult.data ?? []) as StudyGroupLite[]);
    }
    if (!groupMemberResult.error) {
      setGroupMembers((groupMemberResult.data ?? []) as GroupMemberRow[]);
    }
    if (!groupSubjectResult.error) {
      setGroupSubjectRows(
        (groupSubjectResult.data ?? []) as { group_id: string; subject: string }[]
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 그룹별 교과 / 학생 수 — 카드마다 다시 계산하지 않도록 한 번만 집계.
  const groupSubjects = useMemo(() => {
    const map = new Map<string, string[]>();
    groupSubjectRows.forEach((r) => {
      const arr = map.get(r.group_id) ?? [];
      arr.push(r.subject);
      map.set(r.group_id, arr);
    });
    return map;
  }, [groupSubjectRows]);

  const groupStudentCounts = useMemo(() => {
    const map = new Map<string, number>();
    groupMembers
      .filter((m) => m.role === "student")
      .forEach((m) => map.set(m.group_id, (map.get(m.group_id) ?? 0) + 1));
    return map;
  }, [groupMembers]);

  const teacherGroupRows = useMemo(
    () => groupMembers.filter((m) => m.role === "teacher"),
    [groupMembers]
  );

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-5xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">관리자 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">교사 담당 학급·수업 그룹(권한)</h1>

        <p className="mt-4 leading-7 text-slate-300">
          승인된 교사에게 담당 학급(과목·학년·반)을 부여하거나 회수합니다. 선택지는{" "}
          <span className="font-semibold text-cyan-200">과목·학급</span> 메뉴에서
          등록한 목록에서 고릅니다. 선택 수업처럼 학급으로 묶이지 않는 집단은{" "}
          <span className="font-semibold text-violet-200">수업 그룹</span> 메뉴에서
          만든 그룹을 아래 <span className="font-semibold">담당 수업 그룹</span> 에
          연결하세요.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData}>
            새로고침
          </Button>

          <span className="text-sm text-slate-400">
            승인된 교사:{" "}
            <span className="font-bold text-cyan-300">{teachers.length}</span>명
          </span>
        </div>

        {errorMessage ? (
          <Alert tone="error" className="mt-5">
            {errorMessage}
          </Alert>
        ) : null}

        <section className="mt-6 space-y-4">
          {isLoading ? (
            <p className="text-slate-300">불러오는 중...</p>
          ) : teachers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
              승인된 교사가 없습니다.
            </div>
          ) : (
            teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                subjects={subjects}
                classes={classes}
                groups={groups}
                groupSubjects={groupSubjects}
                groupStudentCounts={groupStudentCounts}
                myGroupRows={teacherGroupRows.filter(
                  (r) => r.profile_id === teacher.profiles.id
                )}
                onChanged={loadData}
              />
            ))
          )}
        </section>
      </Card>
    </main>
  );
}
