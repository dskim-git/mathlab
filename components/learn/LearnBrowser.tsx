"use client";

import { useEffect, useMemo, useState } from "react";
import ActivityRenderer from "@/components/activity-renderer/ActivityRenderer";
import type { ContentBlock } from "@/lib/activities/activityBlocks";
import type { AccessibleSubject } from "@/lib/curriculum/accessibleSubjects";

export type CurriculumUnit = {
  id: string;
  subject: string;
  parent_id: string | null;
  unit_key: string;
  label: string;
  depth: number;
  order_index: number;
  content_blocks: ContentBlock[] | null;
};

function isLeaf(unit: CurriculumUnit): boolean {
  return Array.isArray(unit.content_blocks) && unit.content_blocks.length > 0;
}

function depthLabel(depth: number): string {
  if (depth === 1) return "대단원";
  if (depth === 2) return "중단원";
  if (depth === 3) return "소단원";
  return "단원";
}

export default function LearnBrowser({
  subjects,
  units,
}: {
  subjects: AccessibleSubject[];
  units: CurriculumUnit[];
}) {
  const [subject, setSubject] = useState(subjects[0]?.name ?? "");
  // 선택 경로(상위→하위 단원 id 체인). 마지막 항목이 잎이면 그 콘텐츠를 렌더.
  const [chain, setChain] = useState<string[]>([]);

  const { roots, childrenOf, byId } = useMemo(() => {
    const inSubject = units
      .filter((u) => u.subject === subject)
      .sort((a, b) => a.order_index - b.order_index);

    const childrenOf = new Map<string, CurriculumUnit[]>();
    const byId = new Map<string, CurriculumUnit>();
    inSubject.forEach((u) => byId.set(u.id, u));
    inSubject.forEach((u) => {
      const key = u.parent_id ?? "__root__";
      const arr = childrenOf.get(key) ?? [];
      arr.push(u);
      childrenOf.set(key, arr);
    });
    const roots = childrenOf.get("__root__") ?? [];
    return { roots, childrenOf, byId };
  }, [units, subject]);

  // 첫 잎까지 내려가는 경로(교과 진입 시 바로 콘텐츠가 보이도록).
  const firstLeafChain = useMemo(() => {
    const path: string[] = [];
    let node: CurriculumUnit | undefined = roots[0];
    while (node) {
      path.push(node.id);
      if (isLeaf(node)) break;
      node = (childrenOf.get(node.id) ?? [])[0];
    }
    return path;
  }, [roots, childrenOf]);

  useEffect(() => {
    setChain(firstLeafChain);
  }, [subject, firstLeafChain]);

  // chain 을 따라 단계별 칩 행을 만든다(각 행 = 같은 부모의 형제들).
  const rows = useMemo(() => {
    const out: { depth: number; options: CurriculumUnit[]; selectedId?: string }[] = [];
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

  const lastId = chain[chain.length - 1];
  const lastNode = lastId ? byId.get(lastId) : undefined;
  const selectedLeaf = lastNode && isLeaf(lastNode) ? lastNode : undefined;

  // 어떤 레벨의 칩을 누르면: 그 레벨까지 잘라 붙이고, 컨테이너면 첫 잎까지 자동으로 더 내려간다.
  function selectAt(level: number, id: string) {
    const next = [...chain.slice(0, level), id];
    let node = byId.get(id);
    while (node && !isLeaf(node)) {
      const child = (childrenOf.get(node.id) ?? [])[0];
      if (!child) break;
      next.push(child.id);
      node = child;
    }
    setChain(next);
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-slate-300">
        접근 가능한 교과가 없습니다. 관리자에게 교과 접근 권한을 요청해 주세요.
      </div>
    );
  }

  return (
    <div>
      {/* 단원 선택 — 상단 가로 배치 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        {/* 교과 */}
        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-xs font-semibold text-slate-400">교과</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {subjects.map((s) => {
              const active = s.name === subject;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setSubject(s.name)}
                  className={
                    active
                      ? "shrink-0 rounded-full bg-cyan-300 px-4 py-1.5 text-sm font-semibold text-slate-950"
                      : "shrink-0 rounded-full border border-white/15 px-4 py-1.5 text-sm text-slate-300 transition hover:bg-white/10"
                  }
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 대 / 중 / 소단원 단계별 칩 */}
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
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 선택 단원 콘텐츠 — 전체 폭 */}
      <div className="mt-6">
        {selectedLeaf ? (
          <ActivityRenderer
            key={selectedLeaf.id}
            blocks={selectedLeaf.content_blocks ?? []}
            mode="teacher"
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-slate-400">
            위에서 소단원을 선택하면 수업 자료가 여기에 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
