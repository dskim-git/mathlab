"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { generateJoinCode } from "@/lib/utils/joinCode";

type Activity = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subject: string | null;
  activity_type: string | null;
};

type CreatedSession = {
  id: string;
  title: string;
  join_code: string;
  teacher_name: string | null;
};

type SessionCreateFormProps = {
  activities: Activity[];
};

export default function SessionCreateForm({
  activities,
}: SessionCreateFormProps) {
  const [title, setTitle] = useState("확률 시뮬레이터 수업");
  const [teacherName, setTeacherName] = useState("");
  const [activityId, setActivityId] = useState(activities[0]?.id ?? "");
  const [createdSession, setCreatedSession] =
    useState<CreatedSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreateSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage("수업 세션 제목을 입력해 주세요.");
      return;
    }

    if (!activityId) {
      setErrorMessage("활동을 선택해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setCreatedSession(null);

    const joinCode = generateJoinCode();

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        activity_id: activityId,
        title: title.trim(),
        join_code: joinCode,
        teacher_name: teacherName.trim() || null,
        is_active: true,
      })
      .select("id, title, join_code, teacher_name")
      .single();

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setCreatedSession(data);
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-6">
      <h2 className="text-xl font-bold">수업 세션 만들기</h2>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        선생님이 수업 세션을 만들면 학생들이 입장 코드로 활동에 참여할 수
        있습니다.
      </p>

      <form onSubmit={handleCreateSession} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="session-title"
            className="block text-sm font-semibold text-slate-200"
          >
            수업 세션 제목
          </label>
          <input
            id="session-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            placeholder="예: 2학년 확률 시뮬레이터 활동"
          />
        </div>

        <div>
          <label
            htmlFor="teacher-name"
            className="block text-sm font-semibold text-slate-200"
          >
            교사 이름
          </label>
          <input
            id="teacher-name"
            value={teacherName}
            onChange={(event) => setTeacherName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            placeholder="예: 김선생"
          />
        </div>

        <div>
          <label
            htmlFor="activity"
            className="block text-sm font-semibold text-slate-200"
          >
            활동 선택
          </label>
          <select
            id="activity"
            value={activityId}
            onChange={(event) => setActivityId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
          >
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.title}
              </option>
            ))}
          </select>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "세션 생성 중..." : "수업 세션 만들기"}
        </button>
      </form>

      {createdSession ? (
        <div className="mt-8 rounded-2xl border border-cyan-300/40 bg-cyan-300/10 p-6">
          <p className="text-sm font-semibold text-cyan-200">
            수업 세션이 생성되었습니다.
          </p>

          <h3 className="mt-3 text-2xl font-bold">{createdSession.title}</h3>

          <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-center">
            <p className="text-sm text-slate-400">학생 입장 코드</p>
            <p className="mt-2 text-5xl font-black tracking-[0.3em] text-cyan-300">
              {createdSession.join_code}
            </p>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            학생들에게 이 코드를 알려주면 됩니다. 다음 단계에서 학생 입장
            페이지와 연결합니다.
          </p>
        </div>
      ) : null}
    </section>
  );
}