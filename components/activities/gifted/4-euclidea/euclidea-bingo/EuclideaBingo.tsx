"use client";

// 영재 단원 4 작도 빙고 — 단계 1 + C-1 (그룹 권한 통합).
// 이 라운드 범위:
//   - 본인 학급 + 그룹 멤버 컨텍스트 식별
//   - 방 생성: 정규 교사(학급) OR 그룹 안 teacher(그룹)
//   - 자동 입장: 학급 활성 방 + 본인 멤버 그룹 활성 방을 합쳐 선택
//   - 방 코드 입장: 그대로
//   - 입장 후 방 정보 표시만 (빙고판은 라운드 C-2).

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  type BingoRoom,
  createClassRoom,
  createGroupRoom,
  endRoom,
  findMyActiveRooms,
  findRoomByCode,
} from "@/lib/bingo/rooms";
import { getMyGroups, type GroupMembership } from "@/lib/groups/permissions";
import BingoBoard from "./BingoBoard";

type Role = "teacher" | "student" | "admin" | "general" | "unknown";

type Me = {
  profileId: string;
  role: Role;
  grade: number | null;
  classNumber: number | null;
  name: string;
  /** 그룹 멤버십 (그룹 ID·역할·교과) */
  groups: GroupMembership[];
  /** 그룹 이름 lookup */
  groupNames: Record<string, string>;
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

  const groups = await getMyGroups(supabase);
  const groupIds = groups.map((g) => g.group_id);
  let groupNames: Record<string, string> = {};
  if (groupIds.length > 0) {
    const { data: gs } = await supabase
      .from("study_groups")
      .select("id, name")
      .in("id", groupIds);
    for (const row of (gs ?? []) as { id: string; name: string }[]) {
      groupNames[row.id] = row.name;
    }
  }

  return {
    profileId: user.id,
    role: ((profile as { role: Role }).role as Role) ?? "unknown",
    grade,
    classNumber,
    name: (profile as { name?: string }).name ?? "",
    groups,
    groupNames,
  };
}

export default function EuclideaBingo() {
  const [me, setMe] = useState<Me | null>(null);
  const [room, setRoom] = useState<BingoRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<BingoRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshRooms = useCallback(async (info: Me) => {
    const rooms = await findMyActiveRooms(supabase, {
      grade: info.grade,
      classNumber: info.classNumber,
      groupIds: info.groups.map((g) => g.group_id),
    });
    setAvailableRooms(rooms);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await loadMe();
        if (!mounted || !info) {
          setMe(info);
          setLoading(false);
          return;
        }
        setMe(info);
        await refreshRooms(info);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshRooms]);

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

  // 입구 화면 — 방장 자격 / 자동 입장 후보 / 코드 입장
  const teacherGroups = me.groups.filter((g) => g.role === "teacher");
  const canMakeClassRoom = me.role === "teacher" || me.role === "admin";

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
        {availableRooms.length > 0 ? (
          <AvailableRoomsPanel rooms={availableRooms} me={me} onEnter={setRoom} />
        ) : null}

        {canMakeClassRoom ? (
          <TeacherClassEntry me={me} onEnter={setRoom} onError={setError} />
        ) : null}

        {teacherGroups.length > 0 ? (
          <TeacherGroupEntry
            me={me}
            teacherGroups={teacherGroups}
            onEnter={setRoom}
            onError={setError}
          />
        ) : null}

        {!canMakeClassRoom && teacherGroups.length === 0 && availableRooms.length === 0 ? (
          <StudentEmpty me={me} />
        ) : null}

        <CodeEntry onEnter={setRoom} onError={setError} />
      </div>
    </div>
  );
}

// ─── 자동 입장 후보 (학급·그룹 활성 방) ─────────────────
function AvailableRoomsPanel({
  rooms,
  me,
  onEnter,
}: {
  rooms: BingoRoom[];
  me: Me;
  onEnter: (room: BingoRoom) => void;
}) {
  return (
    <section className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.06] p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-300">
        🟢 참여 가능한 방
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rooms.map((r) => {
          const label = r.group_id
            ? me.groupNames[r.group_id] ?? "그룹 방"
            : r.grade != null && r.class_number != null
            ? `${r.grade}학년 ${r.class_number}반`
            : "방";
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onEnter(r)}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/50 px-3 py-2 text-left transition hover:bg-slate-900"
            >
              <span className="text-sm font-semibold text-slate-100">{label}</span>
              <span className="font-mono text-xs text-slate-400">{r.room_code}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── 정규 교사: 학급용 방 만들기 ───────────────────────
function TeacherClassEntry({
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

  return (
    <section className="rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-amber-300">
        🧑‍🏫 정규 학급용 방 만들기
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
          onClick={handleCreate}
          disabled={busy}
          className="rounded-lg border border-amber-400/50 bg-amber-500/25 px-4 py-1.5 text-sm font-bold text-amber-100 transition hover:bg-amber-500/35 disabled:opacity-40"
        >
          🎯 새 학급 방
        </button>
      </div>
    </section>
  );
}

// ─── 그룹 안 teacher: 그룹용 방 만들기 ─────────────────
function TeacherGroupEntry({
  me,
  teacherGroups,
  onEnter,
  onError,
}: {
  me: Me;
  teacherGroups: GroupMembership[];
  onEnter: (room: BingoRoom) => void;
  onError: (msg: string) => void;
}) {
  const [selectedGroupId, setSelectedGroupId] = useState(teacherGroups[0]?.group_id ?? "");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!selectedGroupId) return;
    setBusy(true);
    try {
      const room = await createGroupRoom(supabase, {
        teacherProfileId: me.profileId,
        groupId: selectedGroupId,
      });
      onEnter(room);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-violet-400/30 bg-violet-500/[0.06] p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-violet-300">
        👨‍👩‍👧 수업 그룹용 방 만들기
      </div>
      <p className="mb-3 text-sm text-slate-300">
        본인이 교사 역할로 속한 수업 그룹에서 빙고 방을 시작합니다. 기존 활성 방이 있으면 마감됩니다.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-slate-400">
          그룹
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="mt-1 min-w-[200px] rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 [color-scheme:dark]"
          >
            {teacherGroups.map((g) => (
              <option key={g.group_id} value={g.group_id} style={{ background: "#0f172a", color: "#e2e8f0" }}>
                {me.groupNames[g.group_id] ?? "(이름 없음)"}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy || !selectedGroupId}
          className="rounded-lg border border-violet-400/50 bg-violet-500/25 px-4 py-1.5 text-sm font-bold text-violet-100 transition hover:bg-violet-500/35 disabled:opacity-40"
        >
          🎯 새 그룹 방
        </button>
      </div>
    </section>
  );
}

// ─── 학생(또는 일반인) — 접근 가능한 방이 없을 때 안내 ──
function StudentEmpty({ me }: { me: Me }) {
  return (
    <section className="rounded-xl border border-cyan-400/30 bg-cyan-500/[0.06] p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-cyan-300">🧑‍🎓 참여</div>
      {me.groups.length > 0 ? (
        <p className="text-sm text-slate-300">
          본인이 멤버인 수업 그룹의 활성 방이 아직 없어요. 선생님이 그룹용 방을 만들면 자동으로 표시됩니다.
        </p>
      ) : me.grade != null && me.classNumber != null ? (
        <p className="text-sm text-slate-300">
          현재 <span className="font-semibold text-cyan-200">{me.grade}학년 {me.classNumber}반</span> 의
          활성 방이 없어요. 선생님이 방을 만들면 자동으로 표시됩니다.
        </p>
      ) : (
        <p className="text-sm text-slate-300">학급·그룹 정보가 없어요. 아래 방 코드를 입력해 참여하세요.</p>
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

// ─── 방 내부 ─────────────────────────────────
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

  const scopeLabel = room.group_id
    ? me.groupNames[room.group_id] ?? "그룹 방"
    : room.grade != null && room.class_number != null
    ? `${room.grade}학년 ${room.class_number}반`
    : "—";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">🎯 작도 게임 (빙고)</h2>
          <p className="mt-1 text-xs text-slate-400">
            5×5 빙고판 · 25 작도 문제 · 4팀 점수 — {scopeLabel}{" "}
            <span className="font-mono ml-2 text-cyan-300">{room.room_code}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={onLeave}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            ◀ 입구
          </button>
          {isOwner ? (
            <button
              type="button"
              onClick={handleEnd}
              disabled={busy}
              className="rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25 disabled:opacity-40"
            >
              방 종료
            </button>
          ) : null}
        </div>
      </header>

      <BingoBoard room={room} canEdit={isOwner} />
    </div>
  );
}

