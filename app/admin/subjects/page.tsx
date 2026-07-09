"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type Subject = { id: string; name: string; order_index: number | null };
type SchoolClass = { grade: number; class_number: number };
type ClassPerm = { id: string; grade: number; class_number: number; subject: string };
type GeneralUser = { id: string; name: string; login_id: string; status: string };
type GeneralPerm = { id: string; profile_id: string; subject: string };
type TeacherUser = { id: string; name: string; login_id: string; status: string };
type TeacherPerm = { id: string; profile_id: string; subject: string };

const selectClassName =
  "mt-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40";

function SubjectCard({
  subject,
  classes,
  generalUsers,
  teacherUsers,
  classPerms,
  generalPerms,
  teacherPerms,
  onChanged,
}: {
  subject: Subject;
  classes: SchoolClass[];
  generalUsers: GeneralUser[];
  teacherUsers: TeacherUser[];
  classPerms: ClassPerm[];
  generalPerms: GeneralPerm[];
  teacherPerms: TeacherPerm[];
  onChanged: () => void;
}) {
  const [grade, setGrade] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [profileId, setProfileId] = useState("");
  const [teacherProfileId, setTeacherProfileId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

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

  // 이름 빠른 조회용 (일반인 칩 라벨)
  const userName = useMemo(() => {
    const map = new Map<string, GeneralUser>();
    generalUsers.forEach((u) => map.set(u.id, u));
    return map;
  }, [generalUsers]);

  // 이름 빠른 조회용 (교사 칩 라벨)
  const teacherName = useMemo(() => {
    const map = new Map<string, TeacherUser>();
    teacherUsers.forEach((u) => map.set(u.id, u));
    return map;
  }, [teacherUsers]);

  async function handleAddClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const gradeValue = Number(grade);
    const classValue = Number(classNumber);
    if (!gradeValue) {
      setErrorMessage("학년을 선택해 주세요.");
      return;
    }
    if (!classValue) {
      setErrorMessage("반을 선택해 주세요.");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase.from("class_subject_permissions").insert({
      grade: gradeValue,
      class_number: classValue,
      subject: subject.name,
    });
    setIsBusy(false);

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "이미 부여된 학급입니다."
          : `추가 중 오류: ${error.message}`
      );
      return;
    }

    setGrade("");
    setClassNumber("");
    onChanged();
  }

  async function handleDeleteClass(perm: ClassPerm) {
    setErrorMessage("");
    setIsBusy(true);
    const { error } = await supabase
      .from("class_subject_permissions")
      .delete()
      .eq("id", perm.id);
    setIsBusy(false);
    if (error) {
      setErrorMessage(`삭제 중 오류: ${error.message}`);
      return;
    }
    onChanged();
  }

  async function handleAddGeneral(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!profileId) {
      setErrorMessage("일반인 계정을 선택해 주세요.");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase.from("general_subject_permissions").insert({
      profile_id: profileId,
      subject: subject.name,
    });
    setIsBusy(false);

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "이미 부여된 계정입니다."
          : `추가 중 오류: ${error.message}`
      );
      return;
    }

    setProfileId("");
    onChanged();
  }

  async function handleDeleteGeneral(perm: GeneralPerm) {
    setErrorMessage("");
    setIsBusy(true);
    const { error } = await supabase
      .from("general_subject_permissions")
      .delete()
      .eq("id", perm.id);
    setIsBusy(false);
    if (error) {
      setErrorMessage(`삭제 중 오류: ${error.message}`);
      return;
    }
    onChanged();
  }

  async function handleAddTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!teacherProfileId) {
      setErrorMessage("교사 계정을 선택해 주세요.");
      return;
    }

    setIsBusy(true);
    const { error } = await supabase.from("teacher_subject_permissions").insert({
      profile_id: teacherProfileId,
      subject: subject.name,
    });
    setIsBusy(false);

    if (error) {
      setErrorMessage(
        error.code === "23505"
          ? "이미 부여된 계정입니다."
          : `추가 중 오류: ${error.message}`
      );
      return;
    }

    setTeacherProfileId("");
    onChanged();
  }

  async function handleDeleteTeacher(perm: TeacherPerm) {
    setErrorMessage("");
    setIsBusy(true);
    const { error } = await supabase
      .from("teacher_subject_permissions")
      .delete()
      .eq("id", perm.id);
    setIsBusy(false);
    if (error) {
      setErrorMessage(`삭제 중 오류: ${error.message}`);
      return;
    }
    onChanged();
  }

  const noClasses = classes.length === 0;
  const noGeneral = generalUsers.length === 0;
  const noTeacher = teacherUsers.length === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-bold text-white">{subject.name}</p>
        <span className="text-sm text-slate-400">
          학급 <span className="font-bold text-cyan-300">{classPerms.length}</span> · 일반인{" "}
          <span className="font-bold text-cyan-300">{generalPerms.length}</span> · 교사{" "}
          <span className="font-bold text-cyan-300">{teacherPerms.length}</span>
        </span>
      </div>

      {/* 학생: 학급 접근 */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-200">학생 (학급 단위)</p>

        {classPerms.length === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-white/15 bg-slate-950 p-3 text-sm text-slate-400">
            접근 가능한 학급이 없습니다.
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {classPerms.map((perm) => (
              <span
                key={perm.id}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200"
              >
                {perm.grade}학년 {perm.class_number}반
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDeleteClass(perm)}
                  className="rounded-full px-1 text-cyan-200/70 transition hover:text-red-300 disabled:opacity-50"
                  aria-label="학급 접근 삭제"
                  title="삭제"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {noClasses ? (
          <div className="mt-3 rounded-xl border border-yellow-400/30 bg-yellow-950/30 p-3 text-sm text-yellow-100">
            먼저 <span className="font-semibold">과목·학급</span> 메뉴에서 학급을 등록해 주세요.
          </div>
        ) : (
          <form onSubmit={handleAddClass} className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-300">학년</label>
              <select
                aria-label={`${subject.name} 학년 선택`}
                value={grade}
                onChange={(event) => {
                  setGrade(event.target.value);
                  setClassNumber("");
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
                aria-label={`${subject.name} 반 선택`}
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
              학급 추가
            </Button>
          </form>
        )}
      </div>

      {/* 일반인: 개인 접근 */}
      <div className="mt-5 border-t border-white/10 pt-5">
        <p className="text-sm font-semibold text-slate-200">일반인 (개인 단위)</p>

        {generalPerms.length === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-white/15 bg-slate-950 p-3 text-sm text-slate-400">
            접근 권한을 가진 일반인이 없습니다.
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {generalPerms.map((perm) => (
              <span
                key={perm.id}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200"
              >
                {userName.get(perm.profile_id)?.name ?? "(알 수 없음)"}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDeleteGeneral(perm)}
                  className="rounded-full px-1 text-cyan-200/70 transition hover:text-red-300 disabled:opacity-50"
                  aria-label="일반인 접근 삭제"
                  title="삭제"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {noGeneral ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-slate-950 p-3 text-sm text-slate-400">
            등록된 일반인 계정이 없습니다.
          </div>
        ) : (
          <form onSubmit={handleAddGeneral} className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-300">일반인 계정</label>
              <select
                aria-label={`${subject.name} 일반인 선택`}
                value={profileId}
                onChange={(event) => {
                  setProfileId(event.target.value);
                  setErrorMessage("");
                }}
                className={selectClassName}
              >
                <option value="">선택</option>
                {generalUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.login_id})
                    {u.status !== "approved" ? ` · ${u.status}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" disabled={isBusy}>
              일반인 추가
            </Button>
          </form>
        )}
      </div>

      {/* 교사: 개인 접근 (담당 학반과 무관하게 수업 내용 열람) */}
      <div className="mt-5 border-t border-white/10 pt-5">
        <p className="text-sm font-semibold text-slate-200">교사 (개인 단위)</p>
        <p className="mt-1 text-xs text-slate-400">
          담당 학반이 아니어도 이 교과의 수업 내용을 볼 수 있게 부여합니다.
        </p>

        {teacherPerms.length === 0 ? (
          <div className="mt-2 rounded-xl border border-dashed border-white/15 bg-slate-950 p-3 text-sm text-slate-400">
            개인 접근 권한을 가진 교사가 없습니다.
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {teacherPerms.map((perm) => (
              <span
                key={perm.id}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-200"
              >
                {teacherName.get(perm.profile_id)?.name ?? "(알 수 없음)"}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDeleteTeacher(perm)}
                  className="rounded-full px-1 text-cyan-200/70 transition hover:text-red-300 disabled:opacity-50"
                  aria-label="교사 접근 삭제"
                  title="삭제"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {noTeacher ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-slate-950 p-3 text-sm text-slate-400">
            등록된 교사 계정이 없습니다.
          </div>
        ) : (
          <form onSubmit={handleAddTeacher} className="mt-3 flex flex-wrap items-end gap-2">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-300">교사 계정</label>
              <select
                aria-label={`${subject.name} 교사 선택`}
                value={teacherProfileId}
                onChange={(event) => {
                  setTeacherProfileId(event.target.value);
                  setErrorMessage("");
                }}
                className={selectClassName}
              >
                <option value="">선택</option>
                {teacherUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.login_id})
                    {u.status !== "approved" ? ` · ${u.status}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" disabled={isBusy}>
              교사 추가
            </Button>
          </form>
        )}
      </div>

      {errorMessage ? (
        <Alert tone="error" className="mt-3">
          {errorMessage}
        </Alert>
      ) : null}
    </div>
  );
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [generalUsers, setGeneralUsers] = useState<GeneralUser[]>([]);
  const [teacherUsers, setTeacherUsers] = useState<TeacherUser[]>([]);
  const [classPerms, setClassPerms] = useState<ClassPerm[]>([]);
  const [generalPerms, setGeneralPerms] = useState<GeneralPerm[]>([]);
  const [teacherPerms, setTeacherPerms] = useState<TeacherPerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const [
      subjectRes,
      classRes,
      generalRes,
      teacherRes,
      classPermRes,
      generalPermRes,
      teacherPermRes,
    ] = await Promise.all([
      supabase
        .from("subjects")
        .select("id, name, order_index")
        .order("order_index", { nullsFirst: false })
        .order("name"),
      supabase
        .from("school_classes")
        .select("grade, class_number")
        .order("grade")
        .order("class_number"),
      supabase
        .from("profiles")
        .select("id, name, login_id, status")
        .eq("role", "general")
        .order("name"),
      supabase
        .from("profiles")
        .select("id, name, login_id, status")
        .eq("role", "teacher")
        .order("name"),
      supabase
        .from("class_subject_permissions")
        .select("id, grade, class_number, subject"),
      supabase
        .from("general_subject_permissions")
        .select("id, profile_id, subject"),
      supabase
        .from("teacher_subject_permissions")
        .select("id, profile_id, subject"),
    ]);

    if (subjectRes.error) {
      setErrorMessage(`교과 목록 오류: ${subjectRes.error.message}`);
      setSubjects([]);
    } else {
      setSubjects((subjectRes.data ?? []) as Subject[]);
    }
    if (!classRes.error) setClasses((classRes.data ?? []) as SchoolClass[]);
    if (!generalRes.error) setGeneralUsers((generalRes.data ?? []) as GeneralUser[]);
    if (!teacherRes.error) setTeacherUsers((teacherRes.data ?? []) as TeacherUser[]);
    if (!classPermRes.error) setClassPerms((classPermRes.data ?? []) as ClassPerm[]);
    if (!generalPermRes.error)
      setGeneralPerms((generalPermRes.data ?? []) as GeneralPerm[]);
    if (!teacherPermRes.error)
      setTeacherPerms((teacherPermRes.data ?? []) as TeacherPerm[]);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-5xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">관리자 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">교과 접근 권한</h1>

        <p className="mt-4 leading-7 text-slate-300">
          교과별로 학생(학급 단위)·일반인(개인 단위)·교사(개인 단위)의 접근 권한을 부여·회수합니다.
          교사(개인 단위)는 담당 학반이 아니어도 수업 내용을 열람할 수 있게 하는 권한입니다. 교사의 담당 과목·학급 배정은{" "}
          <Link href="/admin/teachers" className="font-semibold text-cyan-200 underline">
            교사 권한
          </Link>{" "}
          메뉴에서 관리합니다. 교과·학급 목록은{" "}
          <Link href="/admin/settings" className="font-semibold text-cyan-200 underline">
            과목·학급
          </Link>{" "}
          메뉴에서 등록합니다.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData}>
            새로고침
          </Button>
          <span className="text-sm text-slate-400">
            교과 <span className="font-bold text-cyan-300">{subjects.length}</span>개
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
          ) : subjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
              등록된 교과가 없습니다.{" "}
              <Link href="/admin/settings" className={buttonClasses("secondary", { size: "sm" })}>
                과목·학급에서 등록
              </Link>
            </div>
          ) : (
            subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                classes={classes}
                generalUsers={generalUsers}
                teacherUsers={teacherUsers}
                classPerms={classPerms.filter((p) => p.subject === subject.name)}
                generalPerms={generalPerms.filter((p) => p.subject === subject.name)}
                teacherPerms={teacherPerms.filter((p) => p.subject === subject.name)}
                onChanged={loadData}
              />
            ))
          )}
        </section>
      </Card>
    </main>
  );
}
