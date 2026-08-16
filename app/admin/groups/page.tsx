"use client";

// 활동 그룹 관리 — 빙고 방(EuclideaBingo) 처럼 활동 안에서 쓰이는 사람 묶음.
//
// 주의: "수업 편성" 은 여기가 아니라 /admin/courses 다.
//   수업(courses) 도입 전에는 이 그룹이 선택 수업 편성까지 겸했지만, 지금은
//   담당 교사·수강생의 정본이 courses 로 옮겨졌다. 이 화면은 활동용으로 남는다.
//   (bingo_rooms.group_id + lib/groups/permissions.ts 가 그룹 멤버십을 계속 참조한다.)
//
// 한 페이지 안에서:
//   - 좌측: 그룹 목록 + 새 그룹 만들기
//   - 우측: 선택된 그룹의 이름/비고 편집 + 멤버 관리 + 교과 권한
//
// RLS 는 study_groups·members·subjects 모두 관리자 ALL 허용 — 이 페이지는 admin 전용.

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type StudyGroup = {
  id: string;
  name: string;
  note: string;
  created_at: string;
  updated_at: string;
};

type Member = {
  id: string;
  group_id: string;
  profile_id: string;
  role: "teacher" | "student";
  added_at: string;
  // joined
  profile_name: string;
  profile_login_id: string;
  profile_role: string;
};

type GroupSubject = {
  id: string;
  group_id: string;
  subject: string;
  added_at: string;
};

type SubjectMaster = { id: string; name: string };

type ProfileLite = {
  id: string;
  name: string;
  login_id: string;
  role: string;
};

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [subjects, setSubjects] = useState<SubjectMaster[]>([]);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError("");
    const [groupsRes, subjectsRes] = await Promise.all([
      supabase
        .from("study_groups")
        .select("id, name, note, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase.from("subjects").select("id, name").order("name"),
    ]);
    if (groupsRes.error) {
      setError(`그룹 불러오기 오류: ${groupsRes.error.message}`);
    } else {
      const list = (groupsRes.data ?? []) as StudyGroup[];
      setGroups(list);
      if (!selectedId && list.length > 0) setSelectedId(list[0].id);
    }
    if (!subjectsRes.error) {
      setSubjects((subjectsRes.data ?? []) as SubjectMaster[]);
    }
    setLoading(false);
  }, [selectedId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;
    setMessage("");
    setError("");
    const { data, error } = await supabase
      .from("study_groups")
      .insert({ name: newName.trim(), note: newNote.trim() })
      .select("id, name, note, created_at, updated_at")
      .single();
    if (error) {
      setError(`그룹 생성 오류: ${error.message}`);
      return;
    }
    setGroups((prev) => [data as StudyGroup, ...prev]);
    setSelectedId((data as StudyGroup).id);
    setNewName("");
    setNewNote("");
    setMessage("그룹을 만들었습니다.");
  }

  const selectedGroup = groups.find((g) => g.id === selectedId) ?? null;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-sm font-semibold text-violet-300">관리자 · 활동 그룹</p>
          <h1 className="mt-2 text-3xl font-bold">활동 그룹 관리</h1>
          <p className="mt-2 text-sm text-slate-400">
            빙고 방처럼 활동 안에서 쓰이는 사람 묶음입니다. 그룹에 회원을 넣고
            역할(교사·학생) 과 접근 교과를 설정하세요.
          </p>
          <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/5 p-3 text-xs text-amber-100">
            <b>수업 편성은 여기가 아닙니다.</b> 담당 교사·수강생 배정은{" "}
            <a href="/admin/courses" className="font-semibold underline">
              수업 관리
            </a>
            에서 하세요. 이미 만들어 둔 그룹은 수업 관리의 &ldquo;수업 그룹에서
            가져오기&rdquo; 로 한 번에 옮길 수 있습니다.
          </div>
        </header>

        {error ? <Alert tone="error">{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* 좌측: 그룹 목록 + 생성 */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-200">그룹 목록</h2>
            <p className="mt-1 text-xs text-slate-500">총 {groups.length}개</p>

            <div className="mt-3 max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
              {loading ? (
                <p className="text-xs text-slate-500">불러오는 중…</p>
              ) : groups.length === 0 ? (
                <p className="text-xs text-slate-500">아직 만들어진 그룹이 없어요.</p>
              ) : (
                groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedId(g.id)}
                    className={
                      "block w-full rounded-lg border px-3 py-2 text-left transition " +
                      (g.id === selectedId
                        ? "border-cyan-400/50 bg-cyan-500/10 text-cyan-100"
                        : "border-white/10 bg-slate-900/50 text-slate-300 hover:bg-slate-900")
                    }
                  >
                    <div className="text-sm font-bold">{g.name}</div>
                    {g.note ? (
                      <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{g.note}</div>
                    ) : null}
                  </button>
                ))
              )}
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <h3 className="text-xs font-bold text-slate-300">새 그룹 만들기</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="그룹명 (예: 2026 영재반 A)"
                className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
              />
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="비고 (수업 일정·대상 메모)"
                rows={2}
                className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
              />
              <Button type="submit" size="sm" disabled={!newName.trim()}>
                ＋ 만들기
              </Button>
            </form>
          </Card>

          {/* 우측: 선택된 그룹 상세 */}
          <div className="space-y-4">
            {selectedGroup ? (
              <GroupDetail
                key={selectedGroup.id}
                group={selectedGroup}
                subjects={subjects}
                onUpdated={(updated) => {
                  setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
                }}
                onDeleted={(id) => {
                  setGroups((prev) => prev.filter((g) => g.id !== id));
                  setSelectedId(null);
                  setMessage("그룹을 삭제했습니다.");
                }}
                onError={setError}
                onMessage={setMessage}
              />
            ) : (
              <Card className="p-6 text-sm text-slate-400">왼쪽에서 그룹을 선택하거나 새로 만드세요.</Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── 그룹 상세 ─────────────────────────────────────────────
function GroupDetail({
  group,
  subjects,
  onUpdated,
  onDeleted,
  onError,
  onMessage,
}: {
  group: StudyGroup;
  subjects: SubjectMaster[];
  onUpdated: (g: StudyGroup) => void;
  onDeleted: (id: string) => void;
  onError: (msg: string) => void;
  onMessage: (msg: string) => void;
}) {
  const [name, setName] = useState(group.name);
  const [note, setNote] = useState(group.note);
  const [savingMeta, setSavingMeta] = useState(false);

  async function handleSaveMeta() {
    setSavingMeta(true);
    onError("");
    const { data, error } = await supabase
      .from("study_groups")
      .update({ name: name.trim(), note: note.trim() })
      .eq("id", group.id)
      .select("id, name, note, created_at, updated_at")
      .single();
    setSavingMeta(false);
    if (error) {
      onError(`그룹 수정 오류: ${error.message}`);
      return;
    }
    onUpdated(data as StudyGroup);
    onMessage("그룹 정보를 저장했습니다.");
  }

  async function handleDelete() {
    if (!confirm(`'${group.name}' 그룹을 삭제하시겠어요? 멤버·교과 설정이 모두 함께 삭제됩니다.`)) return;
    const { error } = await supabase.from("study_groups").delete().eq("id", group.id);
    if (error) {
      onError(`그룹 삭제 오류: ${error.message}`);
      return;
    }
    onDeleted(group.id);
  }

  const dirty = name.trim() !== group.name || note.trim() !== group.note;

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-base font-bold text-white">그룹 정보</h2>
          <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
            🗑 그룹 삭제
          </Button>
        </div>

        <div className="mt-3 grid gap-3">
          <label className="block text-xs font-semibold text-slate-300">
            그룹명
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:border-cyan-400/50 focus:outline-none"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-300">
            비고 (수업 일정·대상)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:border-cyan-400/50 focus:outline-none"
            />
          </label>
          <div>
            <Button type="button" size="sm" onClick={handleSaveMeta} disabled={!dirty || savingMeta || !name.trim()}>
              {savingMeta ? "저장 중…" : "변경 저장"}
            </Button>
          </div>
        </div>
      </Card>

      <MembersPanel groupId={group.id} onError={onError} onMessage={onMessage} />

      <SubjectsPanel groupId={group.id} subjects={subjects} onError={onError} onMessage={onMessage} />
    </>
  );
}

// ─── 멤버 패널 ─────────────────────────────────────────────
function MembersPanel({
  groupId,
  onError,
  onMessage,
}: {
  groupId: string;
  onError: (msg: string) => void;
  onMessage: (msg: string) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ProfileLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [defaultRole, setDefaultRole] = useState<"teacher" | "student">("student");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("study_group_members")
      .select(
        "id, group_id, profile_id, role, added_at, profile:profiles!inner(name, login_id, role)",
      )
      .eq("group_id", groupId)
      .order("added_at", { ascending: true });
    if (error) {
      onError(`멤버 불러오기 오류: ${error.message}`);
      setLoading(false);
      return;
    }
    const rows: Member[] = (data ?? []).map((row: unknown) => {
      const r = row as {
        id: string;
        group_id: string;
        profile_id: string;
        role: "teacher" | "student";
        added_at: string;
        profile: { name: string; login_id: string; role: string };
      };
      return {
        id: r.id,
        group_id: r.group_id,
        profile_id: r.profile_id,
        role: r.role,
        added_at: r.added_at,
        profile_name: r.profile?.name ?? "",
        profile_login_id: r.profile?.login_id ?? "",
        profile_role: r.profile?.role ?? "",
      };
    });
    setMembers(rows);
    setLoading(false);
  }, [groupId, onError]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSearch(e: ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 2) {
      setMatches([]);
      return;
    }
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, login_id, role")
      .or(`name.ilike.%${q}%,login_id.ilike.%${q}%`)
      .neq("role", "admin")
      .limit(15);
    setSearching(false);
    if (error) {
      onError(`회원 검색 오류: ${error.message}`);
      return;
    }
    const memberIds = new Set(members.map((m) => m.profile_id));
    setMatches(((data ?? []) as ProfileLite[]).filter((p) => !memberIds.has(p.id)));
  }

  async function handleAdd(profile: ProfileLite) {
    const { error } = await supabase.from("study_group_members").insert({
      group_id: groupId,
      profile_id: profile.id,
      role: defaultRole,
    });
    if (error) {
      onError(`멤버 추가 오류: ${error.message}`);
      return;
    }
    onMessage(`${profile.name}(${profile.login_id}) 을(를) ${defaultRole === "teacher" ? "교사" : "학생"} 역할로 추가했습니다.`);
    setQuery("");
    setMatches([]);
    load();
  }

  async function handleChangeRole(memberId: string, role: "teacher" | "student") {
    const { error } = await supabase.from("study_group_members").update({ role }).eq("id", memberId);
    if (error) {
      onError(`역할 변경 오류: ${error.message}`);
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
  }

  async function handleRemove(member: Member) {
    if (!confirm(`${member.profile_name} 을(를) 그룹에서 제외하시겠어요?`)) return;
    const { error } = await supabase.from("study_group_members").delete().eq("id", member.id);
    if (error) {
      onError(`멤버 제거 오류: ${error.message}`);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
  }

  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-white">멤버 ({members.length}명)</h2>

      <div className="mt-3 space-y-1.5">
        {loading ? (
          <p className="text-xs text-slate-500">불러오는 중…</p>
        ) : members.length === 0 ? (
          <p className="text-xs text-slate-500">아직 추가된 멤버가 없어요.</p>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-100">
                  {m.profile_name}{" "}
                  <span className="ml-1 font-mono text-[11px] text-slate-500">{m.profile_login_id}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{m.profile_role}</div>
              </div>
              <select
                value={m.role}
                onChange={(e) => handleChangeRole(m.id, e.target.value as "teacher" | "student")}
                className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs font-bold text-slate-100 [color-scheme:dark]"
              >
                <option value="student" style={{ background: "#0f172a", color: "#e2e8f0" }}>
                  학생
                </option>
                <option value="teacher" style={{ background: "#0f172a", color: "#e2e8f0" }}>
                  교사
                </option>
              </select>
              <Button type="button" size="sm" variant="danger" onClick={() => handleRemove(m)}>
                제거
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <h3 className="text-xs font-bold text-slate-300">멤버 추가</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="이름 또는 로그인 ID 검색…"
            className="min-w-[200px] flex-1 rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
          />
          <label className="text-xs text-slate-400">
            추가 시 역할
            <select
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value as "teacher" | "student")}
              className="ml-1 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-100 [color-scheme:dark]"
            >
              <option value="student" style={{ background: "#0f172a", color: "#e2e8f0" }}>
                학생
              </option>
              <option value="teacher" style={{ background: "#0f172a", color: "#e2e8f0" }}>
                교사
              </option>
            </select>
          </label>
        </div>
        {searching ? (
          <p className="mt-2 text-xs text-slate-500">검색 중…</p>
        ) : matches.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {matches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAdd(p)}
                className="flex w-full items-center justify-between rounded-md border border-white/10 bg-slate-950 px-3 py-1.5 text-left text-sm text-slate-200 transition hover:bg-slate-900"
              >
                <span>
                  <span className="font-semibold text-slate-100">{p.name}</span>{" "}
                  <span className="ml-1 font-mono text-[11px] text-slate-500">{p.login_id}</span>
                  <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">{p.role}</span>
                </span>
                <span className="text-xs font-semibold text-cyan-300">＋ 추가</span>
              </button>
            ))}
          </div>
        ) : query.trim().length >= 2 ? (
          <p className="mt-2 text-xs text-slate-500">검색 결과가 없어요. (이미 멤버이거나 일치하는 회원 없음)</p>
        ) : null}
      </div>
    </Card>
  );
}

// ─── 교과 권한 패널 ─────────────────────────────────────
function SubjectsPanel({
  groupId,
  subjects,
  onError,
  onMessage,
}: {
  groupId: string;
  subjects: SubjectMaster[];
  onError: (msg: string) => void;
  onMessage: (msg: string) => void;
}) {
  const [rows, setRows] = useState<GroupSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("study_group_subjects")
      .select("id, group_id, subject, added_at")
      .eq("group_id", groupId)
      .order("added_at", { ascending: true });
    if (error) {
      onError(`교과 목록 오류: ${error.message}`);
    } else {
      setRows((data ?? []) as GroupSubject[]);
    }
    setLoading(false);
  }, [groupId, onError]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    if (!picker) return;
    const { error } = await supabase
      .from("study_group_subjects")
      .insert({ group_id: groupId, subject: picker });
    if (error) {
      onError(`교과 추가 오류: ${error.message}`);
      return;
    }
    onMessage(`'${picker}' 교과 권한을 추가했습니다.`);
    setPicker("");
    load();
  }

  async function handleRemove(row: GroupSubject) {
    if (!confirm(`'${row.subject}' 교과 권한을 제거하시겠어요?`)) return;
    const { error } = await supabase.from("study_group_subjects").delete().eq("id", row.id);
    if (error) {
      onError(`교과 제거 오류: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  }

  const taken = new Set(rows.map((r) => r.subject));
  const available = subjects.filter((s) => !taken.has(s.name));

  return (
    <Card className="p-5">
      <h2 className="text-base font-bold text-white">접근 가능 교과 ({rows.length})</h2>
      <p className="mt-1 text-xs text-slate-500">
        이 그룹의 회원은 여기 등록된 교과에 접근할 수 있어요. 후속 라운드에서 학생·교사 화면에 반영됩니다.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {loading ? (
          <span className="text-xs text-slate-500">불러오는 중…</span>
        ) : rows.length === 0 ? (
          <span className="text-xs text-slate-500">아직 등록된 교과가 없어요.</span>
        ) : (
          rows.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-200"
            >
              {r.subject}
              <button
                type="button"
                onClick={() => handleRemove(r)}
                className="text-cyan-300 hover:text-rose-300"
                aria-label={`${r.subject} 제거`}
              >
                ✕
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        <select
          value={picker}
          onChange={(e) => setPicker(e.target.value)}
          className="min-w-[180px] rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 [color-scheme:dark]"
        >
          <option value="" style={{ background: "#0f172a", color: "#e2e8f0" }}>
            교과 선택…
          </option>
          {available.map((s) => (
            <option key={s.id} value={s.name} style={{ background: "#0f172a", color: "#e2e8f0" }}>
              {s.name}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" onClick={handleAdd} disabled={!picker}>
          ＋ 교과 추가
        </Button>
      </div>
    </Card>
  );
}
