export type FeedbackCategory = "bug" | "activity_request" | "other";

export const FEEDBACK_CATEGORIES: { value: FeedbackCategory; label: string }[] =
  [
    { value: "bug", label: "🐞 오류 제보" },
    { value: "activity_request", label: "💡 활동 요청" },
    { value: "other", label: "💬 기타" },
  ];

export function categoryLabel(value: string): string {
  return FEEDBACK_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export type FeedbackStatus =
  | "received"
  | "reviewing"
  | "resolved"
  | "rejected";

export const FEEDBACK_STATUSES: {
  value: FeedbackStatus;
  label: string;
  badgeClass: string;
}[] = [
  {
    value: "received",
    label: "접수됨",
    badgeClass: "bg-cyan-300/15 text-cyan-200 border border-cyan-300/30",
  },
  {
    value: "reviewing",
    label: "검토 중",
    badgeClass: "bg-amber-300/15 text-amber-200 border border-amber-300/30",
  },
  {
    value: "resolved",
    label: "처리 완료",
    badgeClass:
      "bg-emerald-300/15 text-emerald-200 border border-emerald-300/30",
  },
  {
    value: "rejected",
    label: "반려",
    badgeClass: "bg-rose-300/15 text-rose-200 border border-rose-300/30",
  },
];

export function statusInfo(value: string) {
  return (
    FEEDBACK_STATUSES.find((s) => s.value === value) ?? {
      value: value as FeedbackStatus,
      label: value,
      badgeClass: "bg-white/10 text-slate-300 border border-white/15",
    }
  );
}

export type FeedbackRow = {
  id: string;
  profile_id: string;
  category: string;
  title: string;
  body: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
  resolved_at: string | null;
};
