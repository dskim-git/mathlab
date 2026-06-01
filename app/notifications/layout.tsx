import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/requireUser";
import { PageShell } from "@/components/dashboard/PageShell";
import type { DashboardRole } from "@/lib/dashboard/roleTheme";

// 4역할 공용 알림함 layout — requireUser 로 승인된 사용자 가드 후
// 본인 role 에 맞는 PageShell 로 감싼다(사이드바·헤더·게이미피케이션 종 등 일관 유지).

const ROLE_FROM_PROFILE: Record<string, DashboardRole> = {
  admin: "admin",
  teacher: "teacher",
  student: "student",
  general: "general",
};

export default async function NotificationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireUser();
  const role = ROLE_FROM_PROFILE[profile.role];
  if (!role) {
    redirect("/");
  }
  return (
    <PageShell
      role={role}
      userName={profile.name}
      isAdmin={profile.role === "admin"}
    >
      {children}
    </PageShell>
  );
}
