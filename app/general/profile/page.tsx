"use client";

import { MyProfilePanel } from "@/components/profile/MyProfilePanel";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

export default function GeneralProfilePage() {
  const theme = getRoleTheme("general");
  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>내 정보</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">회원 정보 관리</h1>
        <p className="mt-1 text-sm text-slate-400">
          본인 정보 확인과 비밀번호 변경.
        </p>
      </div>
      <MyProfilePanel role="general" accentText={theme.accentText} />
    </>
  );
}
