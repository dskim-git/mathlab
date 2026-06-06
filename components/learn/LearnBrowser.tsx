"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ActivityRenderer from "@/components/activity-renderer/ActivityRenderer";
import { supabase } from "@/lib/supabase/client";
import type { ContentBlock } from "@/lib/activities/activityBlocks";
import { shortActivityTitle } from "@/lib/activities/activityTitles";
import type { AccessibleSubject } from "@/lib/curriculum/accessibleSubjects";
import {
  applyOverrideToBlocks,
  makeOverrideKey,
} from "@/lib/curriculum/lessonOverrides";

/** 서버에서 미리 해석한 override 항목(키 + 블록 ID 순서 배열). */
export type LessonOverrideEntry = {
  /** makeOverrideKey(subject, unit_key) 결과 */
  key: string;
  blockIds: string[];
};

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
  overrideEntries = [],
}: {
  subjects: AccessibleSubject[];
  units: CurriculumUnit[];
  /** 교과명 → OT(오리엔테이션) Canva 임베드 URL. 관리자에게만 전달된다. */
  otMaterials?: Record<string, string>;
  /**
   * 현재 사용자에게 적용할 단원별 블록 ID 오버라이드.
   * 학생 = 자기 학급 담당 교사의 편집, 교사 = 본인 편집, 그 외 = 빈 배열.
   */
  overrideEntries?: LessonOverrideEntry[];
}) {
  const overrideMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const e of overrideEntries) m.set(e.key, e.blockIds);
    return m;
  }, [overrideEntries]);

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
  // 검색어 — 단원명/활동명 가로 검색. 비어 있으면 검색 모드 OFF.
  const [query, setQuery] = useState("");

  // 모든 교과의 잎(소단원)을 가로질러 [단원 라벨 + 부모 경로 + 포함 활동 짧은 제목]을
  // 한 줄 문자열로 합쳐 검색 인덱스를 만든다. units 가 변하지 않는 한 1회 계산.
  type SearchEntry = {
    leaf: CurriculumUnit;
    /** 교과 > 대 > 중 > 소 */
    path: string;
    /** 매칭에 사용할 소문자 합성 문자열(단원 라벨 + 활동 제목들) */
    haystack: string;
    /** 잎 안의 interactive_activity 활동 짧은 제목들 */
    activityTitles: string[];
  };
  const allUnitsById = useMemo(() => {
    const m = new Map<string, CurriculumUnit>();
    units.forEach((u) => m.set(u.id, u));
    return m;
  }, [units]);
  const searchIndex = useMemo<SearchEntry[]>(() => {
    const out: SearchEntry[] = [];
    for (const u of units) {
      if (!isLeaf(u)) continue;
      // 부모 체인 — 교과명 + 모든 조상 라벨 + 본인.
      const labels: string[] = [u.label];
      let p = u.parent_id ? allUnitsById.get(u.parent_id) : undefined;
      while (p) {
        labels.unshift(p.label);
        p = p.parent_id ? allUnitsById.get(p.parent_id) : undefined;
      }
      const activityTitles: string[] = [];
      for (const b of u.content_blocks ?? []) {
        if (b.type === "interactive_activity") {
          activityTitles.push(shortActivityTitle(b.content.activitySlug));
        }
      }
      const path = [u.subject, ...labels].join(" › ");
      const haystack = [path, ...activityTitles].join(" ").toLowerCase();
      out.push({ leaf: u, path, haystack, activityTitles });
    }
    return out;
  }, [units, allUnitsById]);

  // 접근 가능한 교과명 집합 — 검색 결과는 권한 있는 교과로만 제한.
  const accessibleSubjectNames = useMemo(
    () => new Set(subjects.map((s) => s.name)),
    [subjects]
  );

  const trimmedQuery = query.trim();
  const searchResults = useMemo<SearchEntry[]>(() => {
    if (trimmedQuery.length === 0) return [];
    const q = trimmedQuery.toLowerCase();
    const out: SearchEntry[] = [];
    for (const e of searchIndex) {
      if (!accessibleSubjectNames.has(e.leaf.subject)) continue;
      if (e.haystack.includes(q)) out.push(e);
      if (out.length >= 30) break;
    }
    return out;
  }, [trimmedQuery, searchIndex, accessibleSubjectNames]);

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

  // 검색 결과에서 잎을 선택하면: 교과 전환 + 그 잎까지의 부모 체인을 한 번에 설정.
  function jumpToLeaf(leaf: CurriculumUnit) {
    const path: string[] = [];
    let node: CurriculumUnit | undefined = leaf;
    while (node) {
      path.unshift(node.id);
      node = node.parent_id ? allUnitsById.get(node.parent_id) : undefined;
    }
    if (leaf.subject !== subject) setSubject(leaf.subject);
    setChain(path);
    setOtOpen(false);
    setQuery("");
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
      {/* 가로 검색 — 모든 교과의 소단원 라벨 + 그 안에 포함된 활동 짧은 제목을
          동시에 매칭한다. 결과 클릭 → 교과 전환 + 잎까지 chain 점프. */}
      <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <label className="flex items-center gap-2">
          <span aria-hidden className="text-base">🔎</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="단원 또는 활동 이름으로 검색 (예: 정규분포, 갈튼 보드)"
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/60 focus:outline-none"
          />
          {trimmedQuery && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="shrink-0 rounded-md border border-white/15 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10"
            >
              지우기
            </button>
          )}
        </label>
        {trimmedQuery && (
          <div className="mt-3">
            {searchResults.length === 0 ? (
              <p className="text-sm text-slate-400">
                일치하는 단원·활동이 없습니다.
              </p>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
                {searchResults.map((e) => {
                  const q = trimmedQuery.toLowerCase();
                  const matchedActs = e.activityTitles.filter((t) =>
                    t.toLowerCase().includes(q)
                  );
                  return (
                    <li key={e.leaf.id}>
                      <button
                        type="button"
                        onClick={() => jumpToLeaf(e.leaf)}
                        className="block w-full rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-left transition hover:border-cyan-300/40 hover:bg-slate-950"
                      >
                        <div className="text-sm font-semibold text-white">
                          📄 {e.leaf.label}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {e.path}
                        </div>
                        {matchedActs.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {matchedActs.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-100"
                              >
                                {t}
                              </span>
                            ))}
                            {matchedActs.length > 4 && (
                              <span className="text-xs text-slate-500">
                                +{matchedActs.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

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
          (() => {
            // 본인(교사) 또는 자기 학급 담당 교사의 override 가 있으면 그 순서·포함 적용.
            // 없으면 기본 블록 그대로.
            const ovKey = makeOverrideKey(
              selectedLeaf.subject,
              selectedLeaf.unit_key
            );
            const ovIds = overrideMap.get(ovKey);
            const base = selectedLeaf.content_blocks ?? [];
            const blocks = applyOverrideToBlocks(base, ovIds);
            return (
              <ActivityRenderer
                // override 적용 결과가 바뀌면 강제 재마운트 → 방문한 블록 상태 초기화.
                key={`${selectedLeaf.id}::${ovIds ? ovIds.join(",") : "base"}`}
                blocks={blocks}
                // /learn 은 교사·학생·관리자 공용 미리보기 동선이라 mode 는 teacher 유지
                // (ProbabilitySimulator 같은 세션 기반 활동의 제출 버튼 비활성).
                // 단 enableReflectionSave 를 켜서 이식 미니활동(ReflectionForm)의 자동 저장은
                // 활성화 — submitActivityReflection 이 students 행 없으면 silent skip.
                mode="teacher"
                enableReflectionSave
                activitySubject={selectedLeaf.subject}
              />
            );
          })()
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-slate-400">
            위에서 소단원을 선택하면 수업 자료가 여기에 표시됩니다.
          </div>
        )}
      </div>
    </div>
  );
}
