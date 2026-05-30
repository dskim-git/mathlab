"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatKoreanDateTime } from "@/lib/dateTime";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { MembersDirectory } from "@/components/admin/MembersDirectory";

type PendingProfile = {
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

export default function AdminMembersPage() {
  const [pending, setPending] = useState<PendingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, login_id, name, role, status, email, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      setErrorMessage(`승인 대기 목록을 불러오지 못했습니다: ${error.message}`);
      setPending([]);
    } else {
      setPending((data ?? []) as PendingProfile[]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function handleApprove(profile: PendingProfile) {
    setBusyId(profile.id);
    setErrorMessage("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", profile.id);

    if (updateError) {
      setErrorMessage(`승인 처리 중 오류: ${updateError.message}`);
      setBusyId(null);
      return;
    }

    // 교사면 teachers 행이 없을 때 생성 (담당 권한은 별도 화면에서 부여)
    if (profile.role === "teacher") {
      const { data: existingTeacher, error: teacherSelectError } =
        await supabase
          .from("teachers")
          .select("id")
          .eq("profile_id", profile.id)
          .maybeSingle();

      if (teacherSelectError) {
        setErrorMessage(`교사 정보 확인 중 오류: ${teacherSelectError.message}`);
        setBusyId(null);
        return;
      }

      if (!existingTeacher) {
        const { error: teacherInsertError } = await supabase
          .from("teachers")
          .insert({ profile_id: profile.id });

        if (teacherInsertError) {
          setErrorMessage(
            `교사 정보(teachers) 생성 중 오류: ${teacherInsertError.message}`
          );
          setBusyId(null);
          return;
        }
      }
    }

    setBusyId(null);
    await loadPending();
  }

  async function handleReject(profile: PendingProfile) {
    setBusyId(profile.id);
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ status: "rejected" })
      .eq("id", profile.id);

    if (error) {
      setErrorMessage(`거부 처리 중 오류: ${error.message}`);
      setBusyId(null);
      return;
    }

    setBusyId(null);
    await loadPending();
  }

  const theme = getRoleTheme("admin");

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>회원관리</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">계정·승인·명렬표</h1>
        <p className="mt-1 text-sm text-slate-400">
          가입 승인을 처리하고, 교사/학생/일반인 계정 정보를 관리합니다.
        </p>
      </div>

      {/* 빠른 진입 — 회원관리 산하만 (교사 권한·교과 접근은 별 메뉴 "교과 권한") */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/roster"
          className={buttonClasses("secondary", { size: "sm" })}
        >
          명렬표
        </Link>
      </div>

      <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            가입 승인 대기{" "}
            <span className="text-base font-semibold text-slate-400">
              ({pending.length}건)
            </span>
          </h2>
          <Button variant="secondary" size="sm" onClick={loadPending}>
            새로고침
          </Button>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          새로 가입한 계정을 승인하거나 거부합니다. 교사 계정을 승인하면 교사
          정보가 함께 생성됩니다.
        </p>

        {errorMessage ? (
          <Alert tone="error" className="mt-4">
            {errorMessage}
          </Alert>
        ) : null}

        <div className="mt-4">
          {isLoading ? (
            <p className="text-slate-300">불러오는 중...</p>
          ) : pending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-950 p-6 text-slate-300">
              승인 대기 중인 계정이 없습니다.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-slate-300">
                      <th className="py-3 pr-4">이름</th>
                      <th className="py-3 pr-4">아이디</th>
                      <th className="py-3 pr-4">역할</th>
                      <th className="py-3 pr-4">가입 시각</th>
                      <th className="py-3 pr-4">처리</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pending.map((profile) => (
                      <tr
                        key={profile.id}
                        className="border-b border-white/5 text-slate-300"
                      >
                        <td className="py-4 pr-4 font-semibold text-white">
                          {profile.name}
                        </td>
                        <td className="py-4 pr-4">{profile.login_id}</td>
                        <td className="py-4 pr-4">
                          <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-200">
                            {ROLE_LABEL[profile.role] ?? profile.role}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          {formatKoreanDateTime(profile.created_at)}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              disabled={busyId === profile.id}
                              onClick={() => handleApprove(profile)}
                            >
                              {busyId === profile.id ? "처리 중..." : "승인"}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={busyId === profile.id}
                              onClick={() => handleReject(profile)}
                            >
                              거부
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 lg:hidden">
                {pending.map((profile) => (
                  <div
                    key={profile.id}
                    className="rounded-2xl border border-white/10 bg-slate-950 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {profile.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {profile.login_id}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                        {ROLE_LABEL[profile.role] ?? profile.role}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      가입: {formatKoreanDateTime(profile.created_at)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === profile.id}
                        onClick={() => handleApprove(profile)}
                      >
                        {busyId === profile.id ? "처리 중..." : "승인"}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={busyId === profile.id}
                        onClick={() => handleReject(profile)}
                      >
                        거부
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <MembersDirectory accentText={theme.accentText} />

      <section className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm text-amber-100">
        <p>
          ※ 교사의 <b>담당 학급·과목·AI세특 권한</b>은 회원관리가 아니라{" "}
          <Link className="underline" href="/admin/access">
            교과 권한
          </Link>{" "}
          메뉴에서 처리합니다 (=계정 자체와 콘텐츠 접근권한 분리).
          <br />※ 비밀번호 재설정은 <code className="rounded bg-slate-800 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          환경변수가 설정되어 있어야 동작합니다. 미설정 시 "Missing ..." 안내가
          노출됩니다.
        </p>
      </section>
    </>
  );
}
