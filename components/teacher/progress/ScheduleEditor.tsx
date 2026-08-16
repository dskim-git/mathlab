"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

// 시간표의 단위는 "개설 수업" 이다. 수업이 학년도·학기·교과·학반을 이미 들고 있어
// 학기가 바뀌면 담당 목록도 자동으로 갈린다.
export type EditorCourseRow = {
  id: string;
  name: string;
  subject: string;
  grade: number | null;
  class_number: number | null;
};

export type WeeklySlot = {
  id: string;
  day_of_week: number; // 0~4
  course_id: string | null;
};

type Props = {
  teacherId: string;
  courses: EditorCourseRow[];
  initialSlots: WeeklySlot[];
  termLabel: string;
};

const DAYS: { value: number; label: string }[] = [
  { value: 0, label: "월" },
  { value: 1, label: "화" },
  { value: 2, label: "수" },
  { value: 3, label: "목" },
  { value: 4, label: "금" },
];

function slotKey(day: number, courseId: string) {
  return `${day}-${courseId}`;
}

export function ScheduleEditor({
  teacherId,
  courses,
  initialSlots,
  termLabel,
}: Props) {
  const theme = getRoleTheme("teacher");
  const [slots, setSlots] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    initialSlots.forEach((s) => {
      if (!s.course_id) return; // 수업으로 매칭되지 않은 옛 행은 무시
      m[slotKey(s.day_of_week, s.course_id)] = s.id;
    });
    return m;
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const toggle = useCallback(
    async (day: number, c: EditorCourseRow) => {
      const key = slotKey(day, c.id);
      const existingId = slots[key];
      setBusy(key);
      setErrorMessage("");

      if (existingId) {
        // 끄기 — 삭제
        const { error } = await supabase
          .from("weekly_schedule")
          .delete()
          .eq("id", existingId);
        if (error) {
          setErrorMessage(error.message);
        } else {
          setSlots((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      } else {
        // 켜기 — 삽입
        const { data, error } = await supabase
          .from("weekly_schedule")
          // 교과·학년·반은 DB 트리거가 수업에서 채운다.
          .insert({
            teacher_id: teacherId,
            day_of_week: day,
            course_id: c.id,
          })
          .select("id")
          .single();
        if (error) {
          setErrorMessage(error.message);
        } else {
          setSlots((prev) => ({
            ...prev,
            [key]: (data as { id: string }).id,
          }));
        }
      }
      setBusy(null);
    },
    [slots, teacherId]
  );

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-yellow-300/30 bg-yellow-950/30 p-6 text-sm text-yellow-100">
        {termLabel}에 담당 수업이 없습니다. 관리자가 수업 관리 화면에서 이 학기
        수업을 만들고 담당 교사로 배정해야 시간표를 설정할 수 있습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/30 p-4 text-sm text-red-200">
          저장 중 오류: {errorMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 text-slate-300">
              <th className="sticky left-0 z-10 bg-slate-900/80 px-3 py-3 text-left text-xs font-semibold backdrop-blur">
                담당 수업
              </th>
              {DAYS.map((d) => (
                <th
                  key={d.value}
                  className="border-l border-white/10 px-3 py-3 text-center text-xs font-bold text-slate-300"
                >
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <th
                  className="sticky left-0 z-10 bg-slate-900/80 px-3 py-3 text-left font-semibold text-white backdrop-blur"
                  scope="row"
                >
                  <div>{c.name}</div>
                  <div
                    className={`text-[11px] font-normal ${theme.accentText}`}
                  >
                    {c.subject}
                  </div>
                </th>
                {DAYS.map((d) => {
                  const key = slotKey(d.value, c.id);
                  const on = !!slots[key];
                  const isBusy = busy === key;
                  return (
                    <td
                      key={key}
                      className="border-l border-white/10 px-2 py-2 text-center"
                    >
                      <button
                        type="button"
                        onClick={() => toggle(d.value, c)}
                        disabled={isBusy}
                        aria-label={`${c.name} ${d.label}요일 ${on ? "수업 켜짐 (끄기)" : "수업 꺼짐 (켜기)"}`}
                        className={`h-9 w-full rounded-lg border text-xs font-semibold transition disabled:opacity-60 ${
                          on
                            ? `${theme.accentBg} ${theme.accentText} ${theme.accentBorder}`
                            : "border-white/10 text-slate-500 hover:bg-white/5"
                        }`}
                      >
                        {on ? "수업" : "-"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        칸을 클릭해 요일 시간표를 켜고 끕니다. 시간표가 켜진 (수업·요일) 칸은
        진도표에서 음영으로 표시됩니다. 특정 날짜의 휴강은 진도표에서 그 날 행을
        직접 휴강 처리합니다. 학기가 바뀌면 그 학기 수업으로 목록이 갈립니다.
      </p>
    </div>
  );
}
