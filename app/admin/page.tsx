"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatKoreanDateTime } from "@/lib/dateTime";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

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

export default function AdminApprovalPage() {
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

    // 1. 승인 처리
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", profile.id);

    if (updateError) {
      setErrorMessage(`승인 처리 중 오류: ${updateError.message}`);
      setBusyId(null);
      return;
    }

    // 2. 교사면 teachers 행이 없을 때 생성 (담당 권한은 추후 별도 화면에서 부여)
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

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-5xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">관리자 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">가입 승인 대기</h1>

        <p className="mt-4 leading-7 text-slate-300">
          새로 가입한 계정을 승인하거나 거부합니다. 교사 계정을 승인하면 교사
          정보가 함께 생성되어 교사 로그인을 사용할 수 있습니다.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadPending}>
            새로고침
          </Button>

          <span className="text-sm text-slate-400">
            대기 중:{" "}
            <span className="font-bold text-cyan-300">{pending.length}</span>건
          </span>
        </div>

        {errorMessage ? (
          <Alert tone="error" className="mt-5">
            {errorMessage}
          </Alert>
        ) : null}

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
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
        </section>
      </Card>
    </main>
  );
}
