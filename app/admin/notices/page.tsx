"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { formatKoreanDateTime } from "@/lib/dateTime";

type TargetKind = "all" | "role" | "class" | "profile";
type RoleValue = "student" | "teacher" | "general" | "admin";

type NoticeRow = {
  id: string;
  title: string;
  body: string;
  target_kind: TargetKind;
  target_value: string | null;
  created_by: string;
  created_at: string;
  profiles: { name: string | null } | null;
};

type ClassRow = {
  grade: number;
  class_number: number;
};

type ProfileLite = {
  id: string;
  name: string;
  login_id: string;
  role: string;
};

const ROLE_LABEL: Record<string, string> = {
  admin: "관리자",
  teacher: "교사",
  student: "학생",
  general: "일반",
};

function targetSummary(row: NoticeRow): string {
  if (row.target_kind === "all") return "전체";
  if (row.target_kind === "role")
    return `역할: ${ROLE_LABEL[row.target_value ?? ""] ?? row.target_value}`;
  if (row.target_kind === "class")
    return `학급: ${row.target_value} (학년-반)`;
  if (row.target_kind === "profile") return `개인: ${row.target_value ?? ""}`;
  return "(알수 없음)";
}

export default function AdminNoticesPage() {
  const theme = getRoleTheme("admin");

  const [me, setMe] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // 작성 폼
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<TargetKind>("all");
  const [roleValue, setRoleValue] = useState<RoleValue>("student");
  const [grades, setGrades] = useState<number[]>([]);
  const [classByGrade, setClassByGrade] = useState<
    Record<number, number[]>
  >({});
  const [selGrade, setSelGrade] = useState<number | "">("");
  const [selClass, setSelClass] = useState<number | "">("");

  const [profileSearch, setProfileSearch] = useState("");
  const [profileResults, setProfileResults] = useState<ProfileLite[]>([]);
  const [selProfile, setSelProfile] = useState<ProfileLite | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitOk, setSubmitOk] = useState(false);

  // 목록
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1) 내 정보 + 학급 마스터 로드
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setMe(user?.id ?? null);
      setAuthChecked(true);

      // 학급 마스터
      const { data: classRows } = await supabase
        .from("school_classes")
        .select("grade, class_number")
        .order("grade")
        .order("class_number");
      if (!active) return;
      const rows = (classRows ?? []) as ClassRow[];
      const gradeSet = new Set<number>();
      const byGrade: Record<number, number[]> = {};
      rows.forEach((r) => {
        gradeSet.add(r.grade);
        if (!byGrade[r.grade]) byGrade[r.grade] = [];
        byGrade[r.grade].push(r.class_number);
      });
      setGrades(Array.from(gradeSet).sort((a, b) => a - b));
      setClassByGrade(byGrade);
    })();
    return () => {
      active = false;
    };
  }, []);

  // 2) 공지 목록 로드
  const load = useCallback(async () => {
    setLoading(true);
    setListError("");
    const { data, error } = await supabase
      .from("notices")
      .select(
        "id, title, body, target_kind, target_value, created_by, created_at, profiles ( name )"
      )
      .order("created_at", { ascending: false });
    if (error) setListError(error.message);
    setNotices((data ?? []) as unknown as NoticeRow[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // 3) 개인별 대상 — 검색
  useEffect(() => {
    let active = true;
    const q = profileSearch.trim();
    if (kind !== "profile" || q.length < 1) {
      setProfileResults([]);
      return;
    }
    (async () => {
      // 이름·login_id에 부분 일치
      const pattern = `%${q}%`;
      const { data } = await supabase
        .from("profiles")
        .select("id, name, login_id, role")
        .or(`name.ilike.${pattern},login_id.ilike.${pattern}`)
        .limit(10);
      if (!active) return;
      setProfileResults((data ?? []) as ProfileLite[]);
    })();
    return () => {
      active = false;
    };
  }, [profileSearch, kind]);

  const classOptions = useMemo(
    () => (selGrade === "" ? [] : classByGrade[selGrade] ?? []),
    [selGrade, classByGrade]
  );

  function resetForm() {
    setTitle("");
    setBody("");
    setKind("all");
    setRoleValue("student");
    setSelGrade("");
    setSelClass("");
    setProfileSearch("");
    setProfileResults([]);
    setSelProfile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSubmitOk(false);

    if (!me) return;
    const t = title.trim();
    const b = body.trim();
    if (!t || !b) {
      setSubmitError("제목과 내용을 모두 입력해 주세요.");
      return;
    }

    let targetValue: string | null = null;
    if (kind === "role") {
      targetValue = roleValue;
    } else if (kind === "class") {
      if (selGrade === "" || selClass === "") {
        setSubmitError("학년과 반을 모두 선택해 주세요.");
        return;
      }
      targetValue = `${selGrade}-${selClass}`;
    } else if (kind === "profile") {
      if (!selProfile) {
        setSubmitError("개인 대상을 선택해 주세요.");
        return;
      }
      targetValue = selProfile.id;
    }

    setSubmitting(true);
    const { error } = await supabase.from("notices").insert({
      title: t,
      body: b,
      target_kind: kind,
      target_value: targetValue,
      created_by: me,
    });
    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }
    setSubmitOk(true);
    resetForm();
    setSubmitting(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("이 공지를 삭제하시겠습니까?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) {
      setListError(error.message);
      setDeletingId(null);
      return;
    }
    setDeletingId(null);
    load();
  }

  if (!authChecked) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
        확인 중...
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>공지사항</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          전체 · 역할 · 학급 · 개인 공지
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          대상을 골라 공지를 보냅니다. 대상에 해당하는 사용자에게만 공지가
          노출됩니다.
        </p>
      </div>

      {/* 작성 폼 */}
      <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <h2 className="text-base font-bold">새 공지 작성</h2>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label htmlFor="nc-title" className="text-xs font-semibold text-slate-300">
              제목
            </label>
            <input
              id="nc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </div>

          <div>
            <label htmlFor="nc-body" className="text-xs font-semibold text-slate-300">
              내용
            </label>
            <textarea
              id="nc-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
          </div>

          {/* 대상 선택 */}
          <fieldset className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <legend className="px-1 text-xs font-semibold text-slate-300">
              대상
            </legend>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-200 sm:grid-cols-4">
              {(
                [
                  ["all", "전체"],
                  ["role", "역할별"],
                  ["class", "학급별"],
                  ["profile", "개인"],
                ] as [TargetKind, string][]
              ).map(([k, label]) => (
                <label
                  key={k}
                  className="flex items-center gap-1.5 rounded border border-white/10 bg-slate-900 px-3 py-2"
                >
                  <input
                    type="radio"
                    name="target-kind"
                    value={k}
                    checked={kind === k}
                    onChange={() => setKind(k)}
                    className="h-3 w-3"
                  />
                  {label}
                </label>
              ))}
            </div>

            {kind === "role" ? (
              <div className="mt-3">
                <label htmlFor="nc-role" className="text-xs font-semibold text-slate-300">
                  역할
                </label>
                <select
                  id="nc-role"
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value as RoleValue)}
                  className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                >
                  <option value="student">학생</option>
                  <option value="teacher">교사</option>
                  <option value="general">일반</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            ) : null}

            {kind === "class" ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="nc-grade" className="text-xs font-semibold text-slate-300">
                    학년
                  </label>
                  <select
                    id="nc-grade"
                    value={selGrade === "" ? "" : String(selGrade)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelGrade(v === "" ? "" : Number(v));
                      setSelClass("");
                    }}
                    className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                  >
                    <option value="">선택</option>
                    {grades.map((g) => (
                      <option key={g} value={g}>
                        {g}학년
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="nc-class" className="text-xs font-semibold text-slate-300">
                    반
                  </label>
                  <select
                    id="nc-class"
                    value={selClass === "" ? "" : String(selClass)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelClass(v === "" ? "" : Number(v));
                    }}
                    disabled={selGrade === ""}
                    className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:opacity-60"
                  >
                    <option value="">선택</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}반
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {kind === "profile" ? (
              <div className="mt-3">
                <label htmlFor="nc-profile" className="text-xs font-semibold text-slate-300">
                  대상자 검색 (이름 또는 로그인 ID)
                </label>
                <input
                  id="nc-profile"
                  type="text"
                  value={profileSearch}
                  onChange={(e) => {
                    setProfileSearch(e.target.value);
                    setSelProfile(null);
                  }}
                  placeholder="예: 홍길동 또는 20202"
                  className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                />
                {selProfile ? (
                  <div className="mt-2 flex items-center justify-between rounded border border-cyan-300/30 bg-cyan-300/5 px-2 py-1 text-xs">
                    <span>
                      선택됨: <b>{selProfile.name}</b> ({selProfile.login_id}) ·{" "}
                      {ROLE_LABEL[selProfile.role] ?? selProfile.role}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelProfile(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      해제
                    </button>
                  </div>
                ) : profileResults.length > 0 ? (
                  <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded border border-white/10 bg-slate-950 p-2">
                    {profileResults.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelProfile(p);
                            setProfileResults([]);
                          }}
                          className="w-full rounded px-2 py-1 text-left text-xs text-slate-200 hover:bg-white/5"
                        >
                          <b>{p.name}</b> ({p.login_id}) ·{" "}
                          {ROLE_LABEL[p.role] ?? p.role}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : profileSearch ? (
                  <p className="mt-2 text-[11px] text-slate-500">
                    검색 결과 없음
                  </p>
                ) : null}
              </div>
            ) : null}
          </fieldset>

          {submitError ? <Alert tone="error">{submitError}</Alert> : null}
          {submitOk ? (
            <Alert tone="success">공지가 발송되었습니다.</Alert>
          ) : null}

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "보내는 중..." : "공지 보내기"}
            </Button>
          </div>
        </form>
      </section>

      {/* 보낸 공지 목록 */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">
            보낸 공지 ({notices.length}건)
          </h2>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "..." : "새로고침"}
          </button>
        </div>
        {listError ? (
          <Alert tone="error" className="mt-3">
            {listError}
          </Alert>
        ) : null}
        {notices.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">아직 발송한 공지가 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notices.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border border-white/5 bg-slate-950/60 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${theme.badgeClass}`}
                  >
                    {targetSummary(n)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">
                  {n.body}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>
                    {n.profiles?.name ?? "(작성자 미상)"} ·{" "}
                    {formatKoreanDateTime(n.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    disabled={deletingId === n.id}
                    className="rounded-full border border-red-300/40 px-2 py-0.5 font-semibold text-red-200 hover:bg-red-300/10 disabled:opacity-60"
                  >
                    {deletingId === n.id ? "삭제 중" : "삭제"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
