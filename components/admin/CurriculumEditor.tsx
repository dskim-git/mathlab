"use client";

// 관리자용 curriculum_units 트리 CRUD 에디터.
// - 교과 선택 → 대단원/중단원/소단원 cascade 칩.
// - 각 단원 카드 우측에 ↑↓ ✏️ ✕.
// - 단원 추가: 새 라벨 입력 + (부모 unit_key + 순번) 으로 자동 unit_key 생성.
// - 잎(소단원) 의 콘텐츠 블록 편집은 별도 페이지(/admin/curriculum/[unitId]/blocks).
// - 모든 쓰기는 RLS admin ALL 정책으로 보호.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export type AdminUnit = {
  id: string;
  subject: string;
  parent_id: string | null;
  unit_key: string;
  label: string;
  depth: number;
  order_index: number;
  /** 잎인지 빠른 판단용. content_blocks 가 배열 + 길이>0 일 때 잎. */
  hasContent: boolean;
};

type Props = {
  subjects: string[];
  units: AdminUnit[];
};

function depthLabel(depth: number): string {
  if (depth === 1) return "대단원";
  if (depth === 2) return "중단원";
  if (depth === 3) return "소단원";
  return "단원";
}

export default function CurriculumEditor({ subjects, units }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(subjects[0] ?? "");
  const [chain, setChain] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 인라인 추가 폼 상태 — depth 1/2/3 별로.
  const [addingDepth, setAddingDepth] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState("");

  // 인라인 이름 변경
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  // 교과별 트리 구성
  const { roots, childrenOf, byId } = useMemo(() => {
    const inSubject = units
      .filter((u) => u.subject === subject)
      .sort((a, b) => a.order_index - b.order_index);
    const byId = new Map<string, AdminUnit>();
    const childrenOf = new Map<string, AdminUnit[]>();
    inSubject.forEach((u) => byId.set(u.id, u));
    inSubject.forEach((u) => {
      const k = u.parent_id ?? "__root__";
      const arr = childrenOf.get(k) ?? [];
      arr.push(u);
      childrenOf.set(k, arr);
    });
    return { roots: childrenOf.get("__root__") ?? [], childrenOf, byId };
  }, [units, subject]);

  // chain 을 따라 단계별 행.
  // 핵심: chain[level] 이 있으면 자식이 비어 있어도 "빈 다음 행"을 push 해서
  // '+ 추가' 가 보이도록 한다(새로 만든 단원에 자식이 없을 때도 진입 가능).
  const rows = useMemo(() => {
    const out: {
      depth: number;
      parentId: string | null;
      options: AdminUnit[];
      selectedId?: string;
    }[] = [];
    let options = roots;
    let parentId: string | null = null;
    let level = 0;
    while (true) {
      const selectedId = chain[level];
      const currentDepth = options[0]?.depth ?? level + 1;
      out.push({ depth: currentDepth, parentId, options, selectedId });
      if (!selectedId) break;
      if (currentDepth >= 3) break; // 소단원이 마지막 depth — 더 깊은 자식 없음
      const kids = childrenOf.get(selectedId) ?? [];
      options = kids;
      parentId = selectedId;
      level += 1;
    }
    return out;
  }, [roots, childrenOf, chain]);

  function handleSubjectChange(name: string) {
    setSubject(name);
    setChain([]);
    setEditingId(null);
    setAddingDepth(null);
    setNewLabel("");
    setError("");
  }

  function selectAt(level: number, id: string) {
    setChain([...chain.slice(0, level), id]);
    setEditingId(null);
    setAddingDepth(null);
    setNewLabel("");
    setError("");
  }

  /** 새 unit_key 자동 생성: 부모 키 + "-" + 다음 순번. 최상위(부모 없음)는 같은 교과의 다음 정수. */
  function nextUnitKey(parentId: string | null): {
    unit_key: string;
    order_index: number;
  } {
    const siblings = childrenOf.get(parentId ?? "__root__") ?? [];
    let maxIdx = 0;
    const used = new Set(siblings.map((s) => s.unit_key));
    for (const s of siblings) maxIdx = Math.max(maxIdx, s.order_index);
    const prefix = parentId ? (byId.get(parentId)?.unit_key ?? "") + "-" : "";
    let n = siblings.length + 1;
    // 중복이면 +1
    while (used.has(`${prefix}${n}`)) n += 1;
    return { unit_key: `${prefix}${n}`, order_index: maxIdx + 1 };
  }

  async function handleAdd(depth: number, parentId: string | null) {
    const label = newLabel.trim();
    if (!label) {
      setError("단원 이름을 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    const { unit_key, order_index } = nextUnitKey(parentId);
    const { error: e } = await supabase.from("curriculum_units").insert({
      subject,
      parent_id: parentId,
      unit_key,
      label,
      depth,
      order_index,
      content_blocks: null,
    });
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setAddingDepth(null);
    setNewLabel("");
    router.refresh();
  }

  async function handleRename(u: AdminUnit) {
    const label = editingLabel.trim();
    if (!label) {
      setError("이름은 비울 수 없습니다.");
      return;
    }
    if (label === u.label) {
      setEditingId(null);
      return;
    }
    setBusy(true);
    setError("");
    const { error: e } = await supabase
      .from("curriculum_units")
      .update({ label })
      .eq("id", u.id);
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setEditingId(null);
    setEditingLabel("");
    router.refresh();
  }

  async function handleMove(u: AdminUnit, direction: -1 | 1) {
    const siblings = childrenOf.get(u.parent_id ?? "__root__") ?? [];
    const idx = siblings.findIndex((s) => s.id === u.id);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= siblings.length) return;
    const other = siblings[targetIdx];
    setBusy(true);
    setError("");
    const [r1, r2] = await Promise.all([
      supabase
        .from("curriculum_units")
        .update({ order_index: other.order_index })
        .eq("id", u.id),
      supabase
        .from("curriculum_units")
        .update({ order_index: u.order_index })
        .eq("id", other.id),
    ]);
    setBusy(false);
    if (r1.error || r2.error) {
      setError(r1.error?.message ?? r2.error?.message ?? "순서 변경 실패");
      return;
    }
    router.refresh();
  }

  async function handleDelete(u: AdminUnit) {
    const kids = childrenOf.get(u.id) ?? [];
    const kidLabel = kids.length > 0 ? `자식 단원 ${kids.length}개 + ` : "";
    if (
      !confirm(
        `"${u.label}" (${depthLabel(u.depth)})를 삭제할까요?\n${kidLabel}연결된 콘텐츠 블록·교사 오버라이드도 함께 사라집니다.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    const { error: e } = await supabase
      .from("curriculum_units")
      .delete()
      .eq("id", u.id);
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    // 삭제된 단원이 chain 에 있으면 chain 잘라냄
    const cutLevel = chain.findIndex((id) => id === u.id);
    if (cutLevel >= 0) setChain(chain.slice(0, cutLevel));
    router.refresh();
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-slate-300">
        등록된 교과가 없습니다. 먼저 /admin/settings 에서 교과를 추가해 주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 교과 선택 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold text-slate-400">교과</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {subjects.map((s) => {
            const active = s === subject;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleSubjectChange(s)}
                disabled={busy}
                className={
                  active
                    ? "rounded-full bg-cyan-300 px-4 py-1.5 text-sm font-semibold text-slate-950"
                    : "rounded-full border border-white/15 px-4 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      {/* 단계별 단원 행 */}
      {rows.map((row, level) => {
        const depth = row.depth;
        const parentId = row.parentId;
        const adding = addingDepth === depth;
        return (
          <section
            key={`${level}-${parentId ?? "root"}`}
            className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-300">
                {depthLabel(depth)}
                <span className="ml-2 text-xs text-slate-500">
                  {row.options.length}개
                </span>
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setAddingDepth(adding ? null : depth);
                  setNewLabel("");
                }}
                disabled={busy}
              >
                {adding ? "취소" : `+ ${depthLabel(depth)} 추가`}
              </Button>
            </div>

            {adding ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={`${depthLabel(depth)} 이름`}
                  aria-label={`${depthLabel(depth)} 이름`}
                  className="flex-1 rounded border border-cyan-300/40 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleAdd(depth, parentId)}
                  disabled={busy}
                >
                  저장
                </Button>
              </div>
            ) : null}

            {row.options.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">
                {depthLabel(depth)}이 없습니다.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {row.options.map((u, idx) => {
                  const isSelected = u.id === row.selectedId;
                  const isEditing = editingId === u.id;
                  return (
                    <li
                      key={u.id}
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                        isSelected
                          ? "border-cyan-300/50 bg-cyan-300/5"
                          : "border-white/10 bg-slate-950"
                      }`}
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <span className="w-12 shrink-0 text-xs text-slate-500">
                          {u.unit_key}
                        </span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingLabel}
                            onChange={(e) => setEditingLabel(e.target.value)}
                            aria-label="단원 이름"
                            className="flex-1 rounded border border-cyan-300/40 bg-slate-900 px-2 py-1 text-sm text-cyan-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => selectAt(level, u.id)}
                            className="flex-1 text-left text-sm font-semibold text-white hover:text-cyan-200"
                          >
                            {u.label}
                            {u.hasContent ? (
                              <span className="ml-2 text-[10px] text-emerald-300">
                                📄 콘텐츠
                              </span>
                            ) : null}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingLabel("");
                              }}
                              disabled={busy}
                              className="rounded px-2 py-1 text-[11px] text-slate-400 hover:text-white disabled:opacity-60"
                            >
                              취소
                            </button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleRename(u)}
                              disabled={busy}
                            >
                              저장
                            </Button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busy || idx === 0}
                              onClick={() => handleMove(u, -1)}
                              aria-label="위로"
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={busy || idx === row.options.length - 1}
                              onClick={() => handleMove(u, 1)}
                              aria-label="아래로"
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setEditingId(u.id);
                                setEditingLabel(u.label);
                              }}
                              className="rounded border border-white/10 px-2 py-1 text-[11px] text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
                            >
                              ✏️
                            </button>
                            {depth === 3 ? (
                              <Link
                                href={`/admin/curriculum/${u.id}/blocks`}
                                className="rounded border border-emerald-300/30 px-2 py-1 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-300/10"
                              >
                                블록
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDelete(u)}
                              aria-label="삭제"
                              className="rounded border border-rose-300/30 px-2 py-1 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-60"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
