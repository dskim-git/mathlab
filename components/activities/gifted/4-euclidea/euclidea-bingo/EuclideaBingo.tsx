"use client";

// 영재 단원 4 작도 빙고 — 단계 1 (인프라).
// 이 라운드 범위:
//   - 사용자 역할/학급 식별
//   - 방 생성(교사) / 방 코드 입장(공통) / 학급 활성 방 자동 입장(학생)
//   - 입장 후 방 정보 표시만 (빙고판은 단계 2~).
// 다음 라운드: 빙고판 UI + L/E/V 컨트롤 + Realtime postgres_changes 구독.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  type BingoRoom,
  createClassRoom,
  endRoom,
  findActiveClassRoom,
  findRoomByCode,
} from "@/lib/bingo/rooms";

type Role = "teacher" | "student" | "admin" | "general" | "unknown";

type Me = {
  profileId: string;
  role: Role;
  grade: number | null;
  classNumber: number | null;
  name: string;
};

async function loadMe(): Promise<Me | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;
  let grade: number | null = null;
  let classNumber: number | null = null;
  if (profile.role === "student") {
    const { data: s } = await supabase
      .from("students")
      .select("grade, class_number")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (s) {
      grade = (s as { grade: number; class_number: number }).grade;
      classNumber = (s as { grade: number; class_number: number }).class_number;
    }
  }
  return {
    profileId: user.id,
    role: ((profile as { role: Role }).role as Role) ?? "unknown",
    grade,
    classNumber,
    name: (profile as { name?: string }).name ?? "",
  };
}

export default function EuclideaBingo() {
  const [me, setMe] = useState<Me | null>(null);
  const [room, setRoom] = useState<BingoRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await loadMe();
        if (!mounted) return;
        setMe(info);
        if (info?.role === "student" && info.grade != null && info.classNumber != null) {
          const r = await findActiveClassRoom(supabase, info.grade, info.classNumber);
          if (mounted) setRoom(r);
        }
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-sm text-slate-400">
        불러오는 중...
      </div>
    );
  }
  if (!me) {
    return (
      <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-6 text-sm text-rose-200">
        로그인이 필요합니다.
      </div>
    );
  }

  if (room) {
    return <RoomView room={room} me={me} onLeave={() => setRoom(null)} />;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5">
        <h2 className="text-2xl font-bold text-white">🎯 작도 게임 (빙고)</h2>
        <p className="mt-1 text-sm text-slate-400">
          5×5 빙고판으로 25 작도 문제를 팀별로 도전하는 게임입니다.
        </p>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
          ⚠️ {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {me.role === "teacher" || me.role === "admin" ? (
          <TeacherEntry me={me} onEnter={setRoom} onError={setError} />
        ) : (
          <StudentEntry me={me} />
        )}

        <CodeEntry onEnter={setRoom} onError={setError} />
      </div>
    </div>
  );
}

// ─── 교사: 방 생성 ─────────────────────────────────────────
function TeacherEntry({
  me,
  onEnter,
  onError,
}: {
  me: Me;
  onEnter: (room: BingoRoom) => void;
  onError: (msg: string) => void;
}) {
  const [grade, setGrade] = useState(1);
  const [classNumber, setClassNumber] = useState(1);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    try {
      const room = await createClassRoom(supabase, {
        teacherProfileId: me.profileId,
        grade,
        classNumber,
      });
      onEnter(room);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResume() {
    setBusy(true);
    try {
      const r = await findActiveClassRoom(supabase, grade, classNumber);
      if (!r) {
        onError(`${grade}학년 ${classNumber}반의 활성 방이 없어요. 새로 만들어 보세요.`);
        return;
      }
      onEnter(r);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-300">
        🧑‍🏫 교사 (방장)
      </div>
      <p className="mb-3 text-sm text-slate-300">
        담당 학급에서 빙고 방을 시작하세요. 기존 활성 방이 있으면 자동으로 마감되고 새로 만들어집니다.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-slate-400">
          학년
          <select
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="mt-1 rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 [color-scheme:dark]"
          >
            {[1, 2, 3].map((g) => (
              <option key={g} value={g} style={{ background: "#0f172a", color: "#e2e8f0" }}>
                {g}학년
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs text-slate-400">
          반
          <select
            value={classNumber}
            onChange={(e) => setClassNumber(Number(e.target.value))}
            className="mt-1 rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 [color-scheme:dark]"
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c} style={{ background: "#0f172a", color: "#e2e8f0" }}>
                {c}반
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleResume}
          disabled={busy}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-40"
        >
          기존 방 이어하기
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="rounded-lg border border-amber-400/50 bg-amber-500/25 px-4 py-1.5 text-sm font-bold text-amber-100 transition hover:bg-amber-500/35 disabled:opacity-40"
        >
          🎯 새 방 만들기
        </button>
      </div>
    </section>
  );
}

// ─── 학생: 자기 학급 방 없음 안내 ──────────────────────────
function StudentEntry({ me }: { me: Me }) {
  return (
    <section className="rounded-xl border border-cyan-400/30 bg-cyan-500/[0.06] p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-cyan-300">
        🧑‍🎓 학생
      </div>
      {me.grade != null && me.classNumber != null ? (
        <p className="text-sm text-slate-300">
          현재 <span className="font-semibold text-cyan-200">{me.grade}학년 {me.classNumber}반</span> 의 활성 빙고 방이 없어요.
          선생님이 방을 만들면 자동으로 입장됩니다. 다른 학급 방에 참여하려면 아래 코드를 입력하세요.
        </p>
      ) : (
        <p className="text-sm text-slate-300">학급 정보가 없어요. 아래 방 코드를 입력해 참여하세요.</p>
      )}
    </section>
  );
}

// ─── 공통: 방 코드 입장 ──────────────────────────────────
function CodeEntry({
  onEnter,
  onError,
}: {
  onEnter: (room: BingoRoom) => void;
  onError: (msg: string) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleJoin() {
    setBusy(true);
    try {
      const r = await findRoomByCode(supabase, code);
      if (!r) {
        onError("해당 코드의 활성 방을 찾을 수 없어요.");
        return;
      }
      onEnter(r);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">
        🔢 방 코드로 입장
      </div>
      <p className="mb-3 text-xs text-slate-400">선생님께 받은 6자리 코드를 입력하세요.</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="예: ABC123"
          maxLength={6}
          className="w-36 rounded-md border border-white/10 bg-slate-950 px-3 py-1.5 font-mono text-base tracking-widest text-emerald-300 placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleJoin}
          disabled={busy || code.length !== 6}
          className="rounded-lg border border-emerald-400/50 bg-emerald-500/20 px-4 py-1.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-40"
        >
          입장
        </button>
      </div>
    </section>
  );
}

// ─── 방 내부 (placeholder) ─────────────────────────────────
function RoomView({ room, me, onLeave }: { room: BingoRoom; me: Me; onLeave: () => void }) {
  const isOwner = room.created_by === me.profileId;
  const [busy, setBusy] = useState(false);

  async function handleEnd() {
    if (!confirm("이 방을 종료하시겠어요? 학생들이 더 이상 들어올 수 없습니다.")) return;
    setBusy(true);
    try {
      await endRoom(supabase, room.id);
      onLeave();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">🎯 작도 게임 (빙고)</h2>
          <p className="mt-1 text-sm text-slate-400">
            방 입장 완료 — 빙고판은 다음 단계에서 추가됩니다.
          </p>
        </div>
        <span
          className={
            "rounded-md px-3 py-1 text-xs font-bold " +
            (isOwner
              ? "border border-amber-400/50 bg-amber-500/20 text-amber-200"
              : "border border-cyan-400/40 bg-cyan-500/15 text-cyan-200")
          }
        >
          {isOwner ? "방장" : "참여자"}
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard label="방 코드" value={room.room_code} mono />
        <InfoCard
          label="학급"
          value={room.grade != null && room.class_number != null ? `${room.grade}학년 ${room.class_number}반` : "—"}
        />
        <InfoCard label="상태" value={room.status === "active" ? "🟢 활성" : "🔘 종료"} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onLeave}
          className="rounded-lg border border-white/10 bg-slate-900 px-4 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          ◀ 입구로
        </button>
        {isOwner ? (
          <button
            type="button"
            onClick={handleEnd}
            disabled={busy}
            className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-4 py-1.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-40"
          >
            🗑 방 종료
          </button>
        ) : null}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
        🚧 빙고판은 다음 단계에서 추가됩니다 (5×5 그리드, L/E/V 컨트롤, 실시간 동기화).
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={"mt-1 text-base font-bold text-slate-100 " + (mono ? "font-mono tracking-widest" : "")}>
        {value}
      </div>
    </div>
  );
}
