"use client";

// 교사별 단원(잎) 수업 블록 커스터마이즈 에디터.
// - 담당 교과 칩 → 단원 트리(대→중→소) → 잎 선택 → 기본 블록 목록 + 본인 override
// - 체크박스로 포함/제외, ↑↓ 로 순서 변경
// - 저장 = teacher_unit_overrides upsert(block_ids 본인 순서 배열)
// - 기본으로 복원 = 본인 행 delete

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import ActivityRenderer from "@/components/activity-renderer/ActivityRenderer";
import type { ContentBlock } from "@/lib/activities/activityBlocks";

export type EditorUnit = {
  id: string;
  subject: string;
  parent_id: string | null;
  unit_key: string;
  label: string;
  depth: number;
  order_index: number;
  content_blocks: ContentBlock[] | null;
};

export type EditorOverride = {
  subject: string;
  unit_key: string;
  block_ids: string[];
};

type Props = {
  /** 본인이 담당하는 교과명(관리자=전체). */
  subjects: string[];
  /** 위 교과들에 속하는 모든 curriculum_units. */
  units: EditorUnit[];
  /** 본인이 기존에 저장해둔 override 목록. */
  overrides: EditorOverride[];
  /** 현재 사용자 profile id (= 교사 본인). upsert/delete 시 PK 의 일부로 사용. */
  teacherProfileId: string;
};

function isLeaf(u: EditorUnit): boolean {
  return Array.isArray(u.content_blocks) && u.content_blocks.length > 0;
}

function depthLabel(depth: number): string {
  if (depth === 1) return "대단원";
  if (depth === 2) return "중단원";
  if (depth === 3) return "소단원";
  return "단원";
}

function blockKindBadge(b: ContentBlock): string {
  switch (b.type) {
    case "text_instruction":
      return "안내";
    case "canva_embed":
      return "Canva";
    case "youtube_embed":
      return "YouTube";
    case "google_drive_file":
      return "PDF";
    case "external_embed":
      return "임베드";
    case "interactive_activity":
      return "미니활동";
    default:
      return "블록";
  }
}

export default function LessonBlocksEditor({
  subjects,
  units,
  overrides,
  teacherProfileId,
}: Props) {
  const [subject, setSubject] = useState(subjects[0] ?? "");
  const [chain, setChain] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "ok" | "err">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  // 현재 본인의 override 들. 저장/삭제 시 로컬 상태로 동기화해 즉시 반영.
  const [myOverrides, setMyOverrides] = useState<EditorOverride[]>(overrides);

  // 편집 드래프트(잎 단위): selectedKey → { included(체크 켜진 id 들, 순서대로), excluded(체크 해제된 id 들) }
  // selectedKey 가 바뀌면 드래프트 다시 계산.
  type Draft = { included: string[]; excluded: string[] };
  const [draft, setDraft] = useState<Draft | null>(null);
  // 미리보기 토글 — 현재 드래프트를 학생 화면처럼 렌더해 확인.
  const [previewOpen, setPreviewOpen] = useState(false);

  // 교과별 트리 구성
  const { roots, childrenOf, byId, byKey } = useMemo(() => {
    const inSubject = units
      .filter((u) => u.subject === subject)
      .sort((a, b) => a.order_index - b.order_index);
    const byId = new Map<string, EditorUnit>();
    const byKey = new Map<string, EditorUnit>();
    const childrenOf = new Map<string, EditorUnit[]>();
    inSubject.forEach((u) => {
      byId.set(u.id, u);
      byKey.set(u.unit_key, u);
    });
    inSubject.forEach((u) => {
      const k = u.parent_id ?? "__root__";
      const arr = childrenOf.get(k) ?? [];
      arr.push(u);
      childrenOf.set(k, arr);
    });
    const roots = childrenOf.get("__root__") ?? [];
    return { roots, childrenOf, byId, byKey };
  }, [units, subject]);

  // 칩 단계 행
  const rows = useMemo(() => {
    const out: {
      depth: number;
      options: EditorUnit[];
      selectedId?: string;
    }[] = [];
    let options = roots;
    let level = 0;
    while (options.length > 0) {
      const selectedId = chain[level];
      out.push({ depth: options[0].depth, options, selectedId });
      if (!selectedId) break;
      const kids = childrenOf.get(selectedId) ?? [];
      if (kids.length === 0) break;
      options = kids;
      level += 1;
    }
    return out;
  }, [roots, childrenOf, chain]);

  const selectedLeaf = useMemo(() => {
    const lastId = chain[chain.length - 1];
    if (!lastId) return null;
    const node = byId.get(lastId);
    if (!node || !isLeaf(node)) return null;
    return node;
  }, [chain, byId]);

  const overrideForLeaf = useMemo(() => {
    if (!selectedLeaf) return null;
    return (
      myOverrides.find(
        (o) =>
          o.subject === selectedLeaf.subject &&
          o.unit_key === selectedLeaf.unit_key
      ) ?? null
    );
  }, [selectedLeaf, myOverrides]);

  function selectAt(level: number, id: string) {
    const next = [...chain.slice(0, level), id];
    // 컨테이너 노드면 첫 잎까지 자동 드릴다운(편집 시 즉시 잎이 보이도록).
    let node = byId.get(id);
    while (node && !isLeaf(node)) {
      const child = (childrenOf.get(node.id) ?? [])[0];
      if (!child) break;
      next.push(child.id);
      node = child;
    }
    setChain(next);
    setSaveStatus("idle");
    setErrorMessage("");
    setPreviewOpen(false);

    // 드래프트 초기화 — 잎에 도달했을 때 기본 블록 + override 적용
    const newLast = next[next.length - 1];
    const newLeaf = newLast ? byId.get(newLast) : undefined;
    if (newLeaf && isLeaf(newLeaf)) {
      const blocks = newLeaf.content_blocks ?? [];
      const allIds = blocks.map((b) => b.id);
      const ov = myOverrides.find(
        (o) =>
          o.subject === newLeaf.subject && o.unit_key === newLeaf.unit_key
      );
      if (ov) {
        // override: included = block_ids 중 실제 존재하는 것만, 본인이 정한 순서
        // excluded = 기본에는 있지만 override 에 없는 것
        const includedSet = new Set(ov.block_ids);
        const included = ov.block_ids.filter((id) => blocks.some((b) => b.id === id));
        const excluded = allIds.filter((id) => !includedSet.has(id));
        setDraft({ included, excluded });
      } else {
        // 기본 — 전체 포함, 원래 순서
        setDraft({ included: allIds, excluded: [] });
      }
    } else {
      setDraft(null);
    }
  }

  function handleSubjectChange(name: string) {
    setSubject(name);
    setChain([]);
    setDraft(null);
    setSaveStatus("idle");
    setErrorMessage("");
    setPreviewOpen(false);
  }

  // 체크박스 토글
  function toggleInclude(blockId: string, on: boolean) {
    if (!draft) return;
    if (on) {
      // excluded → included 끝
      setDraft({
        included: [...draft.included, blockId],
        excluded: draft.excluded.filter((id) => id !== blockId),
      });
    } else {
      setDraft({
        included: draft.included.filter((id) => id !== blockId),
        excluded: [...draft.excluded, blockId],
      });
    }
  }

  function moveIncluded(blockId: string, dir: -1 | 1) {
    if (!draft) return;
    const idx = draft.included.indexOf(blockId);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= draft.included.length) return;
    const next = [...draft.included];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    setDraft({ ...draft, included: next });
  }

  async function handleSave() {
    if (!selectedLeaf || !draft) return;
    setSaveStatus("saving");
    setErrorMessage("");
    const payload = {
      teacher_profile_id: teacherProfileId,
      subject: selectedLeaf.subject,
      unit_key: selectedLeaf.unit_key,
      block_ids: draft.included,
    };
    const { error } = await supabase
      .from("teacher_unit_overrides")
      .upsert(payload, {
        onConflict: "teacher_profile_id,subject,unit_key",
      });
    if (error) {
      setSaveStatus("err");
      setErrorMessage(error.message);
      return;
    }
    setMyOverrides((prev) => {
      const without = prev.filter(
        (o) =>
          !(o.subject === payload.subject && o.unit_key === payload.unit_key)
      );
      return [
        ...without,
        {
          subject: payload.subject,
          unit_key: payload.unit_key,
          block_ids: payload.block_ids,
        },
      ];
    });
    setSaveStatus("ok");
  }

  async function handleResetToDefault() {
    if (!selectedLeaf) return;
    if (!overrideForLeaf) {
      // 이미 기본 — 드래프트만 원복.
      const blocks = selectedLeaf.content_blocks ?? [];
      setDraft({ included: blocks.map((b) => b.id), excluded: [] });
      return;
    }
    if (
      !confirm(
        "이 단원의 내 편집을 삭제하고 기본 구성으로 되돌릴까요?\n저장된 순서·제외 설정이 모두 사라집니다."
      )
    ) {
      return;
    }
    setSaveStatus("saving");
    const { error } = await supabase
      .from("teacher_unit_overrides")
      .delete()
      .eq("teacher_profile_id", teacherProfileId)
      .eq("subject", selectedLeaf.subject)
      .eq("unit_key", selectedLeaf.unit_key);
    if (error) {
      setSaveStatus("err");
      setErrorMessage(error.message);
      return;
    }
    setMyOverrides((prev) =>
      prev.filter(
        (o) =>
          !(o.subject === selectedLeaf.subject && o.unit_key === selectedLeaf.unit_key)
      )
    );
    const blocks = selectedLeaf.content_blocks ?? [];
    setDraft({ included: blocks.map((b) => b.id), excluded: [] });
    setSaveStatus("ok");
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-slate-300">
        담당 교과가 없습니다. 관리자에게 권한을 요청해 주세요.
      </div>
    );
  }

  // 잎의 기본 블록 배열
  const baseBlocks: ContentBlock[] = selectedLeaf?.content_blocks ?? [];
  const baseById = new Map(baseBlocks.map((b) => [b.id, b]));
  void byKey; // 향후 unit_key 기반 직접 조회용(현재는 미사용)

  return (
    <div className="space-y-6">
      {/* 교과 선택 + 단원 트리 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-xs font-semibold text-slate-400">
            교과
          </span>
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
            {subjects.map((s) => {
              const active = s === subject;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSubjectChange(s)}
                  className={
                    active
                      ? "shrink-0 rounded-full bg-cyan-300 px-4 py-1.5 text-sm font-semibold text-slate-950"
                      : "shrink-0 rounded-full border border-white/15 px-4 py-1.5 text-sm text-slate-300 transition hover:bg-white/10"
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {rows.map((row, level) => (
          <div
            key={level}
            className="mt-2 flex items-center gap-3 border-t border-white/5 pt-2"
          >
            <span className="w-14 shrink-0 text-xs font-semibold text-slate-400">
              {depthLabel(row.depth)}
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {row.options.map((u) => {
                const active = u.id === row.selectedId;
                const leaf = isLeaf(u);
                const hasOverride = myOverrides.some(
                  (o) => o.subject === u.subject && o.unit_key === u.unit_key
                );
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectAt(level, u.id)}
                    className={
                      active
                        ? "shrink-0 rounded-lg border border-cyan-300/60 bg-cyan-300/15 px-3 py-1.5 text-sm font-semibold text-cyan-100"
                        : "shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10"
                    }
                  >
                    {leaf ? "📄 " : ""}
                    {u.label}
                    {hasOverride ? (
                      <span className="ml-1 text-[10px] text-amber-300">●</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 편집 영역 */}
      {selectedLeaf == null ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-slate-400">
          위에서 소단원을 선택하면 그 단원의 수업 블록을 편집할 수 있습니다.
        </div>
      ) : draft == null ? null : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-400">
                {selectedLeaf.subject}
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">
                {selectedLeaf.label}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {overrideForLeaf
                  ? "이 단원은 내가 편집한 구성을 사용 중입니다 (● 표시)."
                  : "이 단원은 기본 구성을 그대로 사용 중입니다."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPreviewOpen((v) => !v)}
              >
                {previewOpen ? "미리보기 닫기" : "미리보기"}
              </Button>
              <Button
                type="button"
                variant="neutral"
                size="sm"
                onClick={handleResetToDefault}
              >
                기본으로 복원
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={saveStatus === "saving"}
                onClick={handleSave}
              >
                {saveStatus === "saving" ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>

          {saveStatus === "ok" ? (
            <Alert tone="success" className="mt-3">
              저장했습니다.
            </Alert>
          ) : null}
          {saveStatus === "err" ? (
            <Alert tone="error" className="mt-3">
              저장 중 오류: {errorMessage}
            </Alert>
          ) : null}

          {/* 포함된 블록 — 순서 표시 + 위/아래 + 제외 */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-300">
              ✅ 포함된 블록 ({draft.included.length}개) — 학생에게 이 순서로 보입니다
            </p>
            {draft.included.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-white/15 p-4 text-sm text-slate-400">
                포함된 블록이 없습니다. 아래 ‘제외된 블록’에서 다시 추가하세요.
              </p>
            ) : (
              <ol className="mt-2 space-y-2">
                {draft.included.map((id, idx) => {
                  const b = baseById.get(id);
                  if (!b) return null;
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/60 p-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-200">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          <span className="mr-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                            {blockKindBadge(b)}
                          </span>
                          {b.title || "(제목 없음)"}
                        </p>
                        {b.description ? (
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {b.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="위로 이동"
                          onClick={() => moveIncluded(id, -1)}
                          disabled={idx === 0}
                          className="rounded border border-white/10 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label="아래로 이동"
                          onClick={() => moveIncluded(id, 1)}
                          disabled={idx === draft.included.length - 1}
                          className="rounded border border-white/10 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          aria-label="제외"
                          onClick={() => toggleInclude(id, false)}
                          className="rounded border border-amber-300/30 px-2 py-1 text-xs text-amber-200 transition hover:bg-amber-300/10"
                        >
                          제외
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* 미리보기 — 현재 드래프트(included 순서)로 학생 화면처럼 렌더.
              ActivityRenderer 안의 미니활동·SVG·임베드가 자연폭(가끔 hardcoded 폭)을 가져
              페이지까지 부풀리는 일이 있어 다단계로 폭을 가둔다:
                outer : min-w-0 + overflow-hidden  → outer 자체가 부모(편집 박스) 폭을 안 넘김
                inner : max-w-full + overflow-x-auto → 내부가 정말 넓으면 inner 안에서만 스크롤 */}
          {previewOpen ? (
            <div className="mt-5 min-w-0 overflow-hidden rounded-2xl border-2 border-cyan-300/30 bg-cyan-300/5 p-4">
              <p className="text-xs font-semibold text-cyan-200">
                🔍 미리보기 — 저장 전 학생 화면 시뮬레이션
              </p>
              {draft.included.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  포함된 블록이 없어 표시할 콘텐츠가 없습니다.
                </p>
              ) : (
                <div className="mt-3 w-full max-w-full overflow-x-auto">
                  <div className="min-w-0">
                    <ActivityRenderer
                      key={`preview::${draft.included.join(",")}`}
                      blocks={
                        draft.included
                          .map((id) => baseById.get(id))
                          .filter(Boolean) as ContentBlock[]
                      }
                      mode="teacher"
                      activitySubject={selectedLeaf.subject}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* 제외된 블록 — 체크해서 다시 포함 */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-400">
              ⛔ 제외된 블록 ({draft.excluded.length}개)
            </p>
            {draft.excluded.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                현재 모든 기본 블록이 포함되어 있습니다.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {draft.excluded.map((id) => {
                  const b = baseById.get(id);
                  if (!b) return null;
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-slate-950/40 p-3 opacity-70"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-300">
                          <span className="mr-2 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                            {blockKindBadge(b)}
                          </span>
                          {b.title || "(제목 없음)"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleInclude(id, true)}
                        className="rounded border border-cyan-300/30 px-2 py-1 text-xs text-cyan-200 transition hover:bg-cyan-300/10"
                      >
                        다시 포함
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
