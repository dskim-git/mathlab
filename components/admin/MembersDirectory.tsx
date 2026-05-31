"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { formatKoreanDateTime } from "@/lib/dateTime";

type MemberRow = {
  id: string;
  login_id: string;
  name: string;
  role: string;
  status: string;
  email: string | null;
  created_at: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  admin: "관리자",
  teacher: "교사",
  student: "학생",
  general: "일반",
};

const ROLE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "전체 역할" },
  { value: "student", label: "학생" },
  { value: "teacher", label: "교사" },
  { value: "general", label: "일반" },
  { value: "admin", label: "관리자" },
];
const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "전체 상태" },
  { value: "approved", label: "승인됨" },
  { value: "pending", label: "대기" },
  { value: "rejected", label: "거부됨" },
];

type Props = {
  accentText: string;
};

function todayKstIsoDate(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function dayDistanceLabel(isoDate: string): string {
  const today = todayKstIsoDate();
  if (isoDate === today) return "오늘";
  const t = new Date(today + "T00:00:00Z").getTime();
  const d = new Date(isoDate + "T00:00:00Z").getTime();
  const diff = Math.round((t - d) / (24 * 60 * 60 * 1000));
  if (diff === 1) return "어제";
  if (diff > 1) return `${diff}일 전`;
  return isoDate;
}

export function MembersDirectory({ accentText }: Props) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  // profile_id → 마지막 접속 일자(KST 'YYYY-MM-DD'). login_logs 의 max(log_date).
  const [lastLogins, setLastLogins] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 비번 재설정 UI 상태
  const [openResetId, setOpenResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetOkId, setResetOkId] = useState<string | null>(null);

  // profile_id → 누적 활동 방문 수(visits)·누적 응답 수(responses).
  // 학생 행에만 표시하지만 데이터는 한 번에 모아 보조 상태로 둔다.
  const [visitsCount, setVisitsCount] = useState<Record<string, number>>({});
  const [responsesCount, setResponsesCount] = useState<Record<string, number>>(
    {}
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const [profilesRes, loginsRes, visitsRes, responsesRes, studentsRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, login_id, name, role, status, email, created_at")
          .order("created_at", { ascending: false }),
        // login_logs 의 (profile_id, log_date) — 같은 profile_id 의 max(log_date) 채집.
        supabase
          .from("login_logs")
          .select("profile_id, log_date")
          .order("log_date", { ascending: false }),
        // 학생 활동 방문 카운트(전체) — 학교 규모 작아 클라이언트 집계 OK.
        supabase.from("activity_visits").select("profile_id"),
        // 학생 응답 — student_id 기준이라 students 로 profile_id 매핑 필요.
        supabase.from("activity_responses").select("student_id"),
        supabase.from("students").select("id, profile_id"),
      ]);

    if (profilesRes.error) setErrorMessage(profilesRes.error.message);
    setMembers((profilesRes.data ?? []) as MemberRow[]);

    // 마지막 접속 매핑 — order desc 라 첫 등장한 log_date 가 max.
    const lastMap: Record<string, string> = {};
    for (const r of (loginsRes.data ?? []) as Array<{
      profile_id: string;
      log_date: string;
    }>) {
      if (!lastMap[r.profile_id]) lastMap[r.profile_id] = r.log_date;
    }
    setLastLogins(lastMap);

    // 누적 활동 방문 카운트.
    const vMap: Record<string, number> = {};
    for (const r of (visitsRes.data ?? []) as Array<{ profile_id: string }>) {
      vMap[r.profile_id] = (vMap[r.profile_id] ?? 0) + 1;
    }
    setVisitsCount(vMap);

    // 누적 응답 카운트 — student_id → profile_id 변환 후 집계.
    const stuToProfile = new Map<string, string>();
    for (const r of (studentsRes.data ?? []) as Array<{
      id: string;
      profile_id: string;
    }>) {
      stuToProfile.set(r.id, r.profile_id);
    }
    const rMap: Record<string, number> = {};
    for (const r of (responsesRes.data ?? []) as Array<{
      student_id: string;
    }>) {
      const pid = stuToProfile.get(r.student_id);
      if (!pid) continue;
      rMap[pid] = (rMap[pid] ?? 0) + 1;
    }
    setResponsesCount(rMap);

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (q) {
        const hay =
          (m.name ?? "").toLowerCase() +
          " " +
          (m.login_id ?? "").toLowerCase() +
          " " +
          (m.email ?? "").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [members, search, roleFilter, statusFilter]);

  function openReset(profileId: string) {
    setOpenResetId(profileId);
    setNewPassword("");
    setResetError("");
    setResetOkId(null);
  }
  function cancelReset() {
    setOpenResetId(null);
    setNewPassword("");
    setResetError("");
  }

  async function submitReset(profileId: string) {
    if (newPassword.length < 8) {
      setResetError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setResetting(true);
    setResetError("");
    setResetOkId(null);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetProfileId: profileId,
          newPassword,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setResetError(data.error ?? `요청 실패 (${res.status})`);
        setResetting(false);
        return;
      }
      setResetOkId(profileId);
      setOpenResetId(null);
      setNewPassword("");
    } catch (e) {
      setResetError(e instanceof Error ? e.message : String(e));
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          전체 회원{" "}
          <span className="text-base font-semibold text-slate-400">
            ({filtered.length}/{members.length})
          </span>
        </h2>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          {loading ? "..." : "새로고침"}
        </Button>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        이름·로그인 ID·이메일로 검색하고, 역할·상태로 필터합니다. 각 회원의
        비밀번호를 재설정할 수 있습니다.
      </p>

      {errorMessage ? (
        <Alert tone="error" className="mt-3">
          {errorMessage}
        </Alert>
      ) : null}

      {/* 검색·필터 */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름·아이디·이메일 검색"
          aria-label="회원 검색"
          className="rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="역할 필터"
          className="rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
        >
          {ROLE_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="상태 필터"
          className="rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* 결과 */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-sm text-slate-400">
            조건에 맞는 회원이 없습니다.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((m) => {
              const isOpen = openResetId === m.id;
              const justSucceeded = resetOkId === m.id;
              return (
                <li
                  key={m.id}
                  className="rounded-lg border border-white/10 bg-slate-950 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white">{m.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {m.login_id}
                        {m.email ? ` · ${m.email}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${accentText} bg-white/5`}
                      >
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          m.status === "approved"
                            ? "bg-emerald-300/15 text-emerald-200"
                            : m.status === "pending"
                            ? "bg-amber-300/15 text-amber-200"
                            : "bg-rose-300/15 text-rose-200"
                        }`}
                      >
                        {m.status === "approved"
                          ? "승인됨"
                          : m.status === "pending"
                          ? "대기"
                          : m.status === "rejected"
                          ? "거부됨"
                          : m.status}
                      </span>
                      <span className="text-slate-500">
                        가입 {formatKoreanDateTime(m.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* 가입날짜 아래 메타.
                      학생: 누적 활동 → 누적 성찰 → 마지막 접속
                      그 외: 마지막 접속만
                      (마지막 접속을 항상 줄 끝에 두어 역할 무관 같은 위치) */}
                  <div className="mt-1 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    {m.role === "student" ? (
                      <>
                        <span>
                          누적 활동{" "}
                          <span className="font-semibold text-cyan-200">
                            {visitsCount[m.id] ?? 0}회
                          </span>
                        </span>
                        <span>
                          누적 성찰{" "}
                          <span className="font-semibold text-emerald-200">
                            {responsesCount[m.id] ?? 0}개
                          </span>
                        </span>
                        <span className="text-slate-700">·</span>
                      </>
                    ) : null}
                    <span>
                      마지막 접속:{" "}
                      {lastLogins[m.id] ? (
                        <span className="text-slate-200">
                          {lastLogins[m.id]}{" "}
                          <span className="text-slate-500">
                            ({dayDistanceLabel(lastLogins[m.id])})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-500">기록 없음</span>
                      )}
                    </span>
                  </div>

                  {justSucceeded ? (
                    <p className="mt-2 text-[11px] text-emerald-300">
                      ✓ 비밀번호가 재설정되었습니다. 본인에게 새 비밀번호를
                      안전한 채널로 전달하세요.
                    </p>
                  ) : null}

                  {isOpen ? (
                    <div className="mt-3 space-y-2 rounded border border-white/10 bg-slate-900/60 p-3">
                      <label
                        htmlFor={`reset-${m.id}`}
                        className="text-xs font-semibold text-slate-300"
                      >
                        새 비밀번호 (8자 이상)
                      </label>
                      <input
                        id={`reset-${m.id}`}
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="예: 12345678"
                        className="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                      />
                      {resetError ? (
                        <p className="text-[11px] text-rose-300">
                          {resetError}
                        </p>
                      ) : null}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelReset}
                          disabled={resetting}
                          className="rounded px-3 py-1 text-xs text-slate-400 hover:text-white disabled:opacity-60"
                        >
                          취소
                        </button>
                        <Button
                          size="sm"
                          onClick={() => submitReset(m.id)}
                          disabled={resetting || newPassword.length < 8}
                        >
                          {resetting ? "재설정 중..." : "비밀번호 재설정"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => openReset(m.id)}
                        className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/10"
                      >
                        🔐 비밀번호 재설정
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
