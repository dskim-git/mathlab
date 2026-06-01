export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireUser } from "@/lib/auth/requireUser";
import { NotificationsList } from "@/components/notifications/NotificationsList";

export default async function NotificationsPage() {
  const { profile } = await requireUser();
  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold text-cyan-300">알림함</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">전체 알림</h1>
        <p className="mt-1 text-sm text-slate-400">
          새 건의·건의 답변·성찰 마감 등 본인에게 온 알림을 모두 봅니다.
        </p>
      </div>
      <NotificationsList role={profile.role} />
    </>
  );
}
