"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ActivityRenderer from "@/components/activity-renderer/ActivityRenderer";
import { supabase } from "@/lib/supabase/client";
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
  otMaterials = {},
}: {
  subjects: AccessibleSubject[];
  units: CurriculumUnit[];
  /** 교과명 → OT(오리엔테이션) Canva 임베드 URL. 관리자에게만 전달된다. */
  otMaterials?: Record<string, string>;
}) {
  const searchParams = useSearchParams();
  const qsSubject = searchParams.get("subject");
  const qsUnit = searchParams.get("unit");

  // ?subject= 가 접근 가능한 교과명이면 그걸로, 아니면 첫 번째 교과로.
  const [subject, setSubject] = useState(() => {
    if (qsSubject && subjects.some((s) => s.name === qsSubject)) {
      return qsSubject;
    }
    return subjects[0]?.name ?? "";
  });

  // ?unit= 가 있으면 그 잎까지의 경로를 chain 으로 미리 채운다.
  // (마운트 1회만 — 이후엔 사용자 칩 클릭이 chain 을 덮어쓴다.)
  const initialChain = useMemo<string[]>(() => {
    if (!qsUnit) return [];
    const inSubject = units.filter((u) => u.subject === subject);
    const byId = new Map(inSubject.map((u) => [u.id, u]));
    const target = inSubject.find((u) => u.unit_key === qsUnit);
    if (!target) return [];
    const path: string[] = [];
    let node: CurriculumUnit | undefined = target;
    while (node) {
      path.unshift(node.id);
      node = node.parent_id ? byId.get(node.parent_id) : undefined;
    }
    return path;
    // mount-only — qsUnit/subject 변경에 반응하지 않음.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 선택 경로(상위→하위 단원 id 체인). 마지막 항목이 잎이면 그 콘텐츠를 렌더.
  const [chain, setChain] = useState<string[]>(() => initialChain);
  // OT 모드 — 켜지면 단원 콘텐츠 자리에 OT 자료 iframe 을 보여준다.
  const [otOpen, setOtOpen] = useState(false);

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

  // chain 이 비어 있으면 자동으로 firstLeafChain(현 교과의 첫 잎까지) 사용 →
  // useEffect 의 setChain 동기화를 회피(react-hooks/set-state-in-effect).
  const effectiveChain = chain.length > 0 ? chain : firstLeafChain;

  // chain 을 따라 단계별 칩 행을 만든다(각 행 = 같은 부모의 형제들).
  const rows = useMemo(() => {
    const out: { depth: number; options: CurriculumUnit[]; selectedId?: string }[] = [];
    let options = roots;
    let level = 0;
    while (options.length > 0) {
      const selectedId = effectiveChain[level];
      out.push({ depth: options[0].depth, options, selectedId });
      if (!selectedId) break;
      const kids = childrenOf.get(selectedId) ?? [];
      if (kids.length === 0) break;
      options = kids;
      level += 1;
    }
    return out;
  }, [roots, childrenOf, effectiveChain]);

  const lastId = effectiveChain[effectiveChain.length - 1];
  const lastNode = lastId ? byId.get(lastId) : undefined;
  const selectedLeaf = lastNode && isLeaf(lastNode) ? lastNode : undefined;

  // 잎(소단원)이 바뀔 때마다 본인 진도(learning_progress)를 upsert.
  // 로그인된 사용자만 — 모든 역할 공통. 실패는 조용히 무시.
  const leafKey = selectedLeaf?.unit_key;
  const leafSubject = selectedLeaf?.subject;
  const leafTitle = selectedLeaf?.label;
  useEffect(() => {
    if (!leafKey || !leafSubject || !leafTitle) return;
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;
      await supabase.from("learning_progress").upsert(
        {
          profile_id: user.id,
          subject: leafSubject,
          unit_key: leafKey,
          unit_title: leafTitle,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,subject,unit_key" }
      );
    })();
    return () => {
      active = false;
    };
  }, [leafKey, leafSubject, leafTitle]);

  // 어떤 레벨의 칩을 누르면: 그 레벨까지 잘라 붙이고, 컨테이너면 첫 잎까지 자동으로 더 내려간다.
  function selectAt(level: number, id: string) {
    const next = [...effectiveChain.slice(0, level), id];
    let node = byId.get(id);
    while (node && !isLeaf(node)) {
      const child = (childrenOf.get(node.id) ?? [])[0];
      if (!child) break;
      next.push(child.id);
      node = child;
    }
    setChain(next);
  }

  // 교과 전환 — chain 비워 firstLeafChain 으로 자동 진입, OT 모드도 해제.
  function handleSubjectChange(name: string) {
    setSubject(name);
    setChain([]);
    setOtOpen(false);
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
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
            {subjects.map((s) => {
              const active = s.name === subject;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => handleSubjectChange(s.name)}
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
          {/* OT 자료 토글 — 관리자에게만, 현 교과에 OT 가 있을 때만 노출 */}
          {otMaterials[subject] && (
            <button
              type="button"
              onClick={() => setOtOpen((v) => !v)}
              className={
                otOpen
                  ? "shrink-0 rounded-full bg-amber-300 px-4 py-1.5 text-sm font-bold text-slate-950"
                  : "shrink-0 rounded-full border border-amber-300/45 px-4 py-1.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-300/10"
              }
              title="관리자 전용 — OT 오리엔테이션 자료"
            >
              📋 OT 자료{otOpen ? " 닫기" : ""}
            </button>
          )}
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

      {/* 선택 단원 콘텐츠 — 전체 폭. OT 모드면 OT iframe 으로 대체. */}
      <div className="mt-6">
        {otOpen && otMaterials[subject] ? (
          <div className="rounded-2xl border-2 border-amber-300/55 bg-amber-300/5 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-base font-extrabold text-amber-200">
                📋 {subject} — OT 오리엔테이션 자료{" "}
                <span className="text-xs font-bold text-slate-400">(관리자 전용)</span>
              </span>
              <button
                type="button"
                onClick={() => setOtOpen(false)}
                className="rounded-md border border-amber-300/45 px-3 py-1 text-xs font-bold text-amber-200 transition hover:bg-amber-300/10"
              >
                ✕ 닫기
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-amber-300/30 bg-slate-950">
              <iframe
                src={otMaterials[subject]}
                title={`${subject} OT 자료`}
                className="h-full w-full"
                loading="lazy"
                allow="fullscreen"
              />
            </div>
          </div>
        ) : selectedLeaf ? (
          <ActivityRenderer
            key={selectedLeaf.id}
            blocks={selectedLeaf.content_blocks ?? []}
            // /learn 은 교사·학생·관리자 공용 미리보기 동선이라 mode 는 teacher 유지
            // (ProbabilitySimulator 같은 세션 기반 활동의 제출 버튼 비활성).
            // 단 enableReflectionSave 를 켜서 이식 미니활동(ReflectionForm)의 자동 저장은
            // 활성화 — submitActivityReflection 이 students 행 없으면 silent skip.
            mode="teacher"
            enableReflectionSave
            activitySubject={selectedLeaf.subject}
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
