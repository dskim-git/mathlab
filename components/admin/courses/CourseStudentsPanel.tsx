"use client";

// 수업의 수강생 편성 패널.
//
// 편성은 학번 기준이라 아직 가입 전인 학생도 미리 넣을 수 있다 — 학기 초 세팅의 핵심.
// 학생을 담는 방법 네 가지:
//   1) 학급 통째   — 명렬표에서 그 반 전원 (정규 수업)
//   2) 수업 그룹   — 이미 묶어둔 선택 수업 집단을 그대로 (경제수학 등)
//   3) 개별 검색   — 명렬표에서 이름·학번으로
//   4) 학번 붙여넣기 — 엑셀에서 복사한 명단을 한 번에

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  fetchClassStudentCodes,
  type CandidateStudent,
  type EnrollRow,
} from "@/lib/courses/enroll";

type CourseLite = {
  id: string;
  school_year: number;
  grade: number | null;
  class_number: number | null;
};

type SchoolClass = { grade: number; class_number: number };
type StudyGroupLite = { id: string; name: string };

const inputClass =
  "w-full rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none [color-scheme:dark]";

const smallSelect =
  "rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 [color-scheme:dark]";

export function CourseStudentsPanel({
  course,
  classes,
  onError,
  onMessage,
  onChanged,
}: {
  course: CourseLite;
  classes: SchoolClass[];
  onError: (m: string) => void;
  onMessage: (m: string) => void;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<EnrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [bulkGrade, setBulkGrade] = useState("");
  const [bulkClass, setBulkClass] = useState("");
  const [groups, setGroups] = useState<StudyGroupLite[]>([]);
  const [groupPick, setGroupPick] = useState("");
  const [paste, setPaste] = useState("");
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<CandidateStudent[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_students")
      .select(
        "id, student_id, student_code, school_year, students(grade, class_number, student_number, profiles!profile_id(name))"
      )
      .eq("course_id", course.id);
    if (error) {
      onError(`수강생 오류: ${error.message}`);
      setLoading(false);
      return;
    }

    type Raw = {
      id: string;
      student_id: string | null;
      student_code: string;
      school_year: number;
      students: {
        grade: number;
        class_number: number;
        student_number: number;
        profiles: { name: string | null } | null;
      } | null;
    };
    const raws = (data ?? []) as unknown as Raw[];

    // 미가입 편성은 계정이 없으니 명렬표에서 이름·학반을 채운다.
    const pendingCodes = raws.filter((r) => !r.students).map((r) => r.student_code);
    const rosterMap = new Map<string, CandidateStudent>();
    if (pendingCodes.length > 0) {
      const { data: roster } = await supabase
        .from("student_roster")
        .select("student_code, name, grade, class_number, student_number")
        .eq("school_year", course.school_year)
        .in("student_code", pendingCodes);
      ((roster ?? []) as CandidateStudent[]).forEach((r) =>
        rosterMap.set(r.student_code, r)
      );
    }

    const list: EnrollRow[] = raws.map((r) => {
      const fromRoster = rosterMap.get(r.student_code);
      return {
        id: r.id,
        student_id: r.student_id,
        student_code: r.student_code,
        school_year: r.school_year,
        grade: r.students?.grade ?? fromRoster?.grade ?? null,
        class_number: r.students?.class_number ?? fromRoster?.class_number ?? null,
        student_number:
          r.students?.student_number ?? fromRoster?.student_number ?? null,
        name: r.students?.profiles?.name ?? fromRoster?.name ?? "",
      };
    });
    list.sort(
      (a, b) =>
        (a.grade ?? 99) - (b.grade ?? 99) ||
        (a.class_number ?? 99) - (b.class_number ?? 99) ||
        (a.student_number ?? 999) - (b.student_number ?? 999)
    );
    setRows(list);
    setLoading(false);
  }, [course.id, course.school_year, onError]);

  useEffect(() => {
    load();
  }, [load]);

  // 수업 그룹 목록 — 이미 묶어둔 선택 수업 집단을 그대로 가져오기 위함.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("study_groups")
        .select("id, name")
        .order("name");
      setGroups((data ?? []) as StudyGroupLite[]);
    })();
  }, []);

  // 편성 추가의 공통 경로 — 학번 배열을 받아 중복만 걸러 넣는다.
  const addCodes = useCallback(
    async (codes: string[], label: string) => {
      const taken = new Set(rows.map((r) => r.student_code));
      const fresh = Array.from(new Set(codes)).filter((c) => c && !taken.has(c));
      if (fresh.length === 0) {
        onMessage("추가할 학생이 없습니다 (이미 모두 편성됨).");
        return;
      }
      setBusy(true);
      onError("");
      const { error } = await supabase.from("course_students").insert(
        fresh.map((code) => ({
          course_id: course.id,
          student_code: code,
          school_year: course.school_year,
        }))
      );
      setBusy(false);
      if (error) {
        onError(`편성 오류: ${error.message}`);
        return;
      }
      onMessage(`${label} ${fresh.length}명을 편성했습니다.`);
      load();
      onChanged();
    },
    [rows, course.id, course.school_year, onError, onMessage, load, onChanged]
  );

  async function handleBulkClass() {
    if (!bulkGrade || !bulkClass) return;
    const found = await fetchClassStudentCodes(
      course.school_year,
      Number(bulkGrade),
      Number(bulkClass)
    );
    if (found.length === 0) {
      onError(
        `${bulkGrade}학년 ${bulkClass}반 학생을 찾지 못했습니다. ${course.school_year}학년도 명렬표가 올라와 있는지 확인해 주세요.`
      );
      return;
    }
    await addCodes(
      found.map((f) => f.student_code),
      `${bulkGrade}학년 ${bulkClass}반`
    );
    setBulkGrade("");
    setBulkClass("");
  }

  async function handleImportGroup() {
    if (!groupPick) return;
    const { data: members } = await supabase
      .from("study_group_members")
      .select("profile_id")
      .eq("group_id", groupPick)
      .eq("role", "student");
    const profileIds = ((members ?? []) as { profile_id: string }[]).map(
      (m) => m.profile_id
    );
    if (profileIds.length === 0) {
      onError("이 그룹에 학생 역할 멤버가 없습니다.");
      return;
    }
    const { data: sList } = await supabase
      .from("students")
      .select("student_code")
      .in("profile_id", profileIds);
    const groupName = groups.find((g) => g.id === groupPick)?.name ?? "그룹";
    await addCodes(
      ((sList ?? []) as { student_code: string }[]).map((s) => s.student_code),
      `${groupName} 에서`
    );
    setGroupPick("");
  }

  // 학번을 줄·쉼표·탭으로 구분해 붙여넣기. "20602 홍길동" 처럼 이름이 붙어 있어도
  // 앞의 숫자만 학번으로 읽는다.
  async function handlePaste() {
    const codes = paste
      .split(/[\n,;\t]+/)
      .map((line) => line.trim().match(/^\d+/)?.[0] ?? "")
      .filter((c) => c.length > 0);
    if (codes.length === 0) {
      onError("학번을 찾지 못했습니다. 한 줄에 학번 하나씩 붙여넣어 주세요.");
      return;
    }
    await addCodes(codes, "붙여넣기로");
    setPaste("");
  }

  async function handleSearch(e: ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 2) {
      setMatches([]);
      return;
    }
    // 명렬표에서 찾는다 — 가입 여부와 무관하게 편성할 수 있어야 하므로.
    const { data } = await supabase
      .from("student_roster")
      .select("student_code, name, grade, class_number, student_number")
      .eq("school_year", course.school_year)
      .or(`name.ilike.%${q}%,student_code.ilike.%${q}%`)
      .order("grade")
      .order("class_number")
      .order("student_number")
      .limit(20);
    const taken = new Set(rows.map((r) => r.student_code));
    setMatches(
      ((data ?? []) as CandidateStudent[]).filter(
        (r) => !taken.has(r.student_code)
      )
    );
  }

  async function handleRemove(r: EnrollRow) {
    const { error } = await supabase
      .from("course_students")
      .delete()
      .eq("id", r.id);
    if (error) {
      onError(`편성 제거 오류: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    onChanged();
  }

  const gradeOptions = Array.from(new Set(classes.map((c) => c.grade))).sort(
    (a, b) => a - b
  );
  const linked = rows.filter((r) => r.student_id).length;
  const pending = rows.length - linked;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-white">
          수강 학생 ({rows.length}명)
        </h2>
        <span className="text-xs text-slate-400">
          가입 연결 <span className="font-bold text-cyan-300">{linked}</span> ·
          미가입 대기 <span className="font-bold text-amber-300">{pending}</span>
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        편성은 <b>학번</b> 기준입니다. 아직 회원가입 전인 학생도 미리 넣어두면,
        가입하는 순간 자동으로 연결되어 교사 화면에 나타납니다.
        {course.grade !== null && course.class_number !== null ? (
          <>
            {" "}
            이 수업은 {course.grade}학년 {course.class_number}반으로 지정되어 있어,
            그 반으로 새로 가입하는 학생은 편성하지 않아도 자동 배정됩니다.
          </>
        ) : null}
      </p>

      {/* 1) 학급 통째 */}
      <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-3">
        <span className="text-xs font-bold text-slate-300">학급 통째</span>
        <select
          value={bulkGrade}
          onChange={(e) => {
            setBulkGrade(e.target.value);
            setBulkClass("");
          }}
          aria-label="편성 학년"
          className={`w-24 ${smallSelect}`}
        >
          <option value="">학년</option>
          {gradeOptions.map((g) => (
            <option key={g} value={g}>
              {g}학년
            </option>
          ))}
        </select>
        <select
          value={bulkClass}
          onChange={(e) => setBulkClass(e.target.value)}
          disabled={!bulkGrade}
          aria-label="편성 반"
          className={`w-24 ${smallSelect} disabled:opacity-50`}
        >
          <option value="">반</option>
          {classes
            .filter((c) => c.grade === Number(bulkGrade))
            .map((c) => (
              <option key={c.class_number} value={c.class_number}>
                {c.class_number}반
              </option>
            ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleBulkClass}
          disabled={!bulkGrade || !bulkClass || busy}
        >
          ＋ 반 전체
        </Button>
        <span className="text-[11px] text-slate-500">
          명렬표 기준 (미가입 포함)
        </span>
      </div>

      {/* 2) 수업 그룹에서 가져오기 */}
      <div className="mt-2 flex flex-wrap items-end gap-2 rounded-lg border border-violet-300/20 bg-violet-300/[0.04] p-3">
        <span className="text-xs font-bold text-violet-200">수업 그룹에서</span>
        <select
          value={groupPick}
          onChange={(e) => setGroupPick(e.target.value)}
          aria-label="수업 그룹 선택"
          className={`min-w-[200px] ${smallSelect}`}
        >
          <option value="">그룹 선택…</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleImportGroup}
          disabled={!groupPick || busy}
        >
          ＋ 그룹 학생 가져오기
        </Button>
        <span className="text-[11px] text-slate-500">
          이미 묶어둔 선택 수업 집단을 그대로
        </span>
      </div>

      {/* 3) 개별 검색 + 4) 붙여넣기 */}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="명렬표에서 이름·학번 검색…"
            aria-label="학생 검색"
            className={inputClass}
          />
          {matches.length > 0 ? (
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {matches.map((s) => (
                <button
                  key={s.student_code}
                  type="button"
                  onClick={() => addCodes([s.student_code], s.name)}
                  className="flex w-full items-center justify-between rounded-md border border-white/10 bg-slate-950 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-900"
                >
                  <span>
                    <span className="font-semibold text-slate-100">{s.name}</span>
                    <span className="ml-2 text-[11px] text-slate-400">
                      {s.grade}-{s.class_number} {s.student_number}번
                    </span>
                    <span className="ml-1 font-mono text-[11px] text-slate-500">
                      {s.student_code}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-cyan-300">＋</span>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <p className="mt-2 text-xs text-slate-500">
              {course.school_year}학년도 명렬표에 일치하는 학생이 없어요.
            </p>
          ) : null}
        </div>
        <div>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={3}
            placeholder={"학번 붙여넣기 (한 줄에 하나)\n20602\n20615 홍길동"}
            aria-label="학번 붙여넣기"
            className={inputClass}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-1"
            onClick={handlePaste}
            disabled={!paste.trim() || busy}
          >
            ＋ 학번으로 편성
          </Button>
        </div>
      </div>

      {/* 명단 */}
      <div className="mt-4 max-h-[360px] overflow-y-auto border-t border-white/10 pt-3">
        {loading ? (
          <p className="text-xs text-slate-500">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-amber-300">
            편성된 학생이 없습니다. 위에서 추가해 주세요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {rows.map((r) => {
              const isPending = !r.student_id;
              return (
                <span
                  key={r.id}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs " +
                    (isPending
                      ? "border-amber-300/30 bg-amber-300/5 text-amber-100"
                      : "border-white/10 bg-slate-900/60 text-slate-200")
                  }
                  title={
                    isPending
                      ? "아직 회원가입 전 — 가입하면 자동으로 연결됩니다"
                      : ""
                  }
                >
                  <span className="text-slate-500">
                    {r.grade !== null
                      ? `${r.grade}-${r.class_number}`
                      : r.student_code}
                  </span>
                  <span className="font-semibold">{r.name || r.student_code}</span>
                  {isPending ? <span className="text-[10px]">대기</span> : null}
                  <button
                    type="button"
                    onClick={() => handleRemove(r)}
                    className="text-slate-500 transition hover:text-red-300"
                    aria-label={`${r.name || r.student_code} 편성 제외`}
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
