"use client";

// 영재 단원 4 작도 빙고 — 단계 1 + C-1 (그룹 권한 통합).
// 이 라운드 범위:
//   - 본인 학급 + 그룹 멤버 컨텍스트 식별
//   - 방 생성: 정규 교사(학급) OR 그룹 안 teacher(그룹)
//   - 자동 입장: 학급 활성 방 + 본인 멤버 그룹 활성 방을 합쳐 선택
//   - 방 코드 입장: 그대로
//   - 입장 후 방 정보 표시만 (빙고판은 라운드 C-2).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  type BingoRoom,
  createClassRoom,
  createGroupRoom,
  endRoom,
  fetchRoomState,
  findMyActiveRooms,
  findRoomByCode,
  updateRoomState,
} from "@/lib/bingo/rooms";
import { getMyGroups, type GroupMembership } from "@/lib/groups/permissions";
import {
  type BingoState,
  type CondKey,
  applyCondChange,
  emptyState,
  getCell,
  isPractice,
} from "@/lib/bingo/state";
import { type TeamId } from "@/lib/bingo/data";
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

// ─── Presence ─────────────────────────────────
type PresenceEntry = {
  profileId: string;
  name: string;
  role: "owner" | "participant";
  problemNum: number | null;
};

// ─── 연결 상태 배지 ────────────────────────────
function ConnBadge({
  conn,
  onRetry,
}: {
  conn: "connecting" | "live" | "reconnecting" | "offline";
  onRetry: () => void;
}) {
  if (conn === "live") {
    return (
      <span
        className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-200"
        title="실시간 동기화 중"
      >
        🟢 LIVE
      </span>
    );
  }
  if (conn === "connecting") {
    return (
      <span className="rounded-md border border-slate-400/40 bg-slate-500/15 px-2 py-1 text-[10px] font-bold text-slate-300">
        ⏳ 연결 중…
      </span>
    );
  }
  if (conn === "reconnecting") {
    return (
      <span
        className="rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-200"
        title="네트워크 일시 끊김 — 자동 재연결 중"
      >
        🟡 재연결 중…
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onRetry}
      className="rounded-md border border-rose-400/50 bg-rose-500/15 px-2 py-1 text-[10px] font-bold text-rose-200 hover:bg-rose-500/25"
      title="실시간 동기화 끊김 — 클릭해 새로고침"
    >
      🔴 오프라인 · 새로고침
    </button>
  );
}

// ─── 참여자 카운트 배지 (교사는 클릭 시 분포 패널) ───────────
function ParticipantsBadge({
  participants,
  isOwner,
  myId,
}: {
  participants: PresenceEntry[];
  isOwner: boolean;
  myId: string;
}) {
  const [open, setOpen] = useState(false);
  const others = participants.filter((p) => p.profileId !== myId);
  const total = participants.length;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => isOwner && setOpen((o) => !o)}
        className={
          "rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-200 " +
          (isOwner ? "hover:bg-emerald-500/25 cursor-pointer" : "cursor-default")
        }
        title={isOwner ? "참여자 분포 보기" : "현재 접속 참여자 수"}
      >
        👥 {total}명
      </button>
      {isOwner && open ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-white/10 bg-slate-950 p-3 text-xs shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold text-slate-200">접속 참여자 ({total})</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-500 hover:text-slate-300"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
          <ParticipantsList participants={participants} myId={myId} />
        </div>
      ) : null}
      {/* 학생 화면용 hidden — 추후 본인 카운트 외 정보 보이게 할지 결정 */}
      {!isOwner && others.length > 0 ? null : null}
    </div>
  );
}

function ParticipantsList({
  participants,
  myId,
}: {
  participants: PresenceEntry[];
  myId: string;
}) {
  // 위치별 그룹핑: 빙고판 / 문제별
  const groups = new Map<string, PresenceEntry[]>();
  for (const p of participants) {
    const key = p.problemNum == null ? "board" : `prob:${p.problemNum}`;
    const arr = groups.get(key) ?? [];
    arr.push(p);
    groups.set(key, arr);
  }
  const boardList = groups.get("board") ?? [];
  const problemKeys = Array.from(groups.keys())
    .filter((k) => k !== "board")
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));

  return (
    <div className="space-y-2">
      <ParticipantsGroup
        title={`🟦 빙고판 (${boardList.length})`}
        list={boardList}
        myId={myId}
      />
      {problemKeys.map((k) => {
        const num = Number(k.slice(5));
        const list = groups.get(k) ?? [];
        return (
          <ParticipantsGroup
            key={k}
            title={`📐 문제 #${num} (${list.length})`}
            list={list}
            myId={myId}
          />
        );
      })}
    </div>
  );
}

function ParticipantsGroup({
  title,
  list,
  myId,
}: {
  title: string;
  list: PresenceEntry[];
  myId: string;
}) {
  if (list.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold text-slate-400">{title}</div>
      <div className="flex flex-wrap gap-1">
        {list.map((p) => (
          <span
            key={p.profileId}
            className={
              "rounded-full border px-2 py-0.5 text-[11px] font-semibold " +
              (p.role === "owner"
                ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
                : p.profileId === myId
                  ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                  : "border-white/10 bg-slate-900/80 text-slate-300")
            }
          >
            {p.role === "owner" ? "👑 " : ""}
            {p.name}
            {p.profileId === myId ? " (나)" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── 방 내부 ─────────────────────────────────
function RoomView({ room, me, onLeave }: { room: BingoRoom; me: Me; onLeave: () => void }) {
  const isOwner = room.created_by === me.profileId;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 진실 source — 방장 update 가 DB 에 저장되고 Realtime 으로 모든 참여자에게 전파.
  const initialState = useMemo<BingoState>(() => {
    const s = room.state as Partial<BingoState>;
    return s && typeof s === "object" && "probs" in s ? (s as BingoState) : emptyState();
  }, [room.state]);
  const [state, setState] = useState<BingoState>(initialState);
  const [conn, setConn] = useState<"connecting" | "live" | "reconnecting" | "offline">(
    "connecting",
  );
  const connRef = useRef(conn);
  useEffect(() => {
    connRef.current = conn;
  }, [conn]);

  // 학생 effective nav (BingoBoard 에서 lift up) + presence 참여자 목록.
  const [effectiveNav, setEffectiveNav] = useState<number | null>(null);
  const [participants, setParticipants] = useState<PresenceEntry[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 최신 state 를 DB 에서 한 번 더 가져와 동기화 (구독 사이 누락분·visibility 복귀 시).
  const refetchState = useCallback(async () => {
    try {
      const s = await fetchRoomState(supabase, room.id);
      if (s && typeof s === "object" && "probs" in s) {
        setState(s as BingoState);
      }
    } catch (e) {
      // 일시적 네트워크 — 다음 재구독에서 다시 시도
      console.warn("bingo refetchState failed:", (e as Error).message);
    }
  }, [room.id]);

  // Realtime 구독 — 자동 재구독 + 가시성 복귀 시 refetch.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;
    let backoff = 1000; // 1s → 30s 까지 증가

    function syncPresence(ch: ReturnType<typeof supabase.channel>) {
      const raw = ch.presenceState();
      const list: PresenceEntry[] = [];
      // raw: { presence_ref: [{...metas}] } — 같은 profileId 가 여러 ref 로 나올 수 있어 마지막만 유지.
      const seen = new Set<string>();
      for (const arr of Object.values(raw)) {
        for (const m of arr as unknown as PresenceEntry[]) {
          if (!m || !m.profileId || seen.has(m.profileId)) continue;
          seen.add(m.profileId);
          list.push(m);
        }
      }
      setParticipants(list);
    }

    function subscribe() {
      setConn((c) => (c === "live" ? "reconnecting" : c === "offline" ? "reconnecting" : "connecting"));
      channel = supabase
        .channel(`bingo_room_${room.id}`, {
          config: { presence: { key: me.profileId } },
        })
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bingo_rooms",
            filter: `id=eq.${room.id}`,
          },
          (payload) => {
            const newRow = payload.new as { state?: BingoState };
            if (newRow?.state && typeof newRow.state === "object") {
              setState(newRow.state);
            }
          },
        )
        .on("presence", { event: "sync" }, () => {
          if (channel) syncPresence(channel);
        })
        .subscribe(async (status) => {
          if (disposed) return;
          if (status === "SUBSCRIBED") {
            setConn("live");
            backoff = 1000;
            // 구독 사이 도착했을 수 있는 update 를 한 번 더 동기화.
            void refetchState();
            // 자기 위치 publish.
            try {
              await channel?.track({
                profileId: me.profileId,
                name: me.name,
                role: isOwner ? "owner" : "participant",
                problemNum: effectiveNav,
              } satisfies PresenceEntry);
            } catch (e) {
              console.warn("presence track failed:", (e as Error).message);
            }
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            setConn("offline");
            scheduleReconnect();
          }
        });
      channelRef.current = channel;
    }

    function scheduleReconnect() {
      if (disposed || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (disposed) return;
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch {
            /* 무시 */
          }
          channel = null;
          channelRef.current = null;
        }
        backoff = Math.min(backoff * 2, 30000);
        subscribe();
      }, backoff);
    }

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      void refetchState();
      if (connRef.current === "live" || retryTimer) return;
      // 백그라운드에서 채널이 끊겼다면 곧장 재구독 시도.
      backoff = 1000;
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* 무시 */
        }
        channel = null;
        channelRef.current = null;
      }
      subscribe();
    }

    subscribe();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* 무시 */
        }
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, refetchState, me.profileId, me.name, isOwner]);

  // effective nav 변경 시 presence 다시 publish.
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch || conn !== "live") return;
    void ch
      .track({
        profileId: me.profileId,
        name: me.name,
        role: isOwner ? "owner" : "participant",
        problemNum: effectiveNav,
      } satisfies PresenceEntry)
      .catch((e) => console.warn("presence track update failed:", (e as Error).message));
  }, [effectiveNav, conn, me.profileId, me.name, isOwner]);

  // ── 낙관적 update + DB save 헬퍼 ── 방장만 호출 (RLS 가 학생 호출 거부).
  const persistState = useCallback(
    async (next: BingoState) => {
      if (!isOwner) return;
      const prev = state;
      setState(next);
      try {
        await updateRoomState(supabase, room.id, next as unknown as Record<string, unknown>);
      } catch (e) {
        setError((e as Error).message);
        setState(prev);
      }
    },
    [isOwner, room.id, state],
  );

  // 셀 조건(L/E/V) 변경
  const handleChangeCond = useCallback(
    async (num: number, key: CondKey, team: TeamId | null) => {
      const prev = getCell(state, num);
      const nextCell = applyCondChange(prev, key, team);
      if (nextCell === prev) return;
      await persistState({ ...state, probs: { ...state.probs, [num]: nextCell } });
    },
    [state, persistState],
  );

  // 방장 화면 이동 (학생 동시 따라감)
  const handleGoToProblem = useCallback(
    async (num: number | null) => {
      await persistState({ ...state, nav: { problemNum: num } });
    },
    [state, persistState],
  );

  // 전체 초기화
  const handleReset = useCallback(async () => {
    if (!confirm("이 빙고 방의 모든 진행 상태를 초기화하시겠어요?")) return;
    await persistState({ ...emptyState(), practiceMode: state.practiceMode });
  }, [state.practiceMode, persistState]);

  // 연습 모드 토글 — 방장만
  const handleTogglePractice = useCallback(async () => {
    await persistState({ ...state, practiceMode: !isPractice(state) });
  }, [state, persistState]);

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

  const practice = isPractice(state);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-6 text-slate-100">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">🎯 작도 게임 (빙고)</h2>
          <p className="mt-1 text-xs text-slate-400">
            5×5 빙고판 · 25 작도 문제 · 4팀 점수 — {scopeLabel}{" "}
            <span className="font-mono ml-2 text-cyan-300">{room.room_code}</span>
            {practice ? (
              <span className="ml-2 rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-200">
                🟢 연습 모드 ON
              </span>
            ) : null}
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
          <ConnBadge conn={conn} onRetry={refetchState} />
          <ParticipantsBadge
            participants={participants}
            isOwner={isOwner}
            myId={me.profileId}
          />
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
              onClick={handleTogglePractice}
              className={
                "rounded-lg border px-3 py-1 text-xs font-semibold transition " +
                (practice
                  ? "border-emerald-400/60 bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/35"
                  : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20")
              }
              title="학생이 빙고 칸을 자유롭게 클릭해 풀어보도록 허용"
            >
              ✏️ 연습하기 {practice ? "(켜짐)" : ""}
            </button>
          ) : null}
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

      {error ? (
        <div className="mb-3 rounded-lg border border-rose-400/40 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
          ⚠️ {error}
        </div>
      ) : null}

      <BingoBoard
        room={room}
        canEdit={isOwner}
        state={state}
        onChangeCond={handleChangeCond}
        onGoToProblem={handleGoToProblem}
        onReset={handleReset}
        onEffectiveNavChange={setEffectiveNav}
      />
    </div>
  );
}

