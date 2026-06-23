"use client";

// 관리자 전용 — 미니활동 "활동 개요" 보기·편집.
// 개요는 AI 세특 생성 시 입력 컨텍스트로 함께 전송되어, 학생 성찰이 부실해도
// 활동의 실제 내용을 근거로 보완하도록 돕는다(activity_overviews 테이블, slug PK).
//
// 구조의 출처:
//   - 교과 탭·대단원 = DB (subjects + curriculum_units). 활동이 아직 없는 교과·단원도
//     스캐폴드로 노출(다른 교과 콘텐츠 제작 준비).
//   - 활동 배치     = curriculum_units 의 content_blocks(interactive_activity.activitySlug)를
//     대단원(depth 1 조상)으로 귀속. 커리큘럼에 아직 안 붙은 활동은 교과별 "미배치"로 노출.
//   - 활동 전체 목록·제목 = 코드(ACTIVITY_CATALOG + shortActivityTitle).
// DB activity_overviews 에는 slug → overview 텍스트만 저장한다.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import { ACTIVITY_CATALOG } from "@/lib/activities/activityCatalog";
import { shortActivityTitle } from "@/lib/activities/activityTitles";

type OverviewRow = { slug: string; overview: string };
type UnitRow = {
  id: string;
  subject: string;
  parent_id: string | null;
  unit_key: string;
  label: string;
  depth: number;
  order_index: number;
  content_blocks: unknown;
};

// 코드 카탈로그의 활동 전체(임시 시뮬레이터 제외) — slug → 교과.
// 진행률 분모이자 "미배치" 판정의 마스터 집합.
const CATALOG_SUBJECT: Record<string, string> = {};
for (const g of ACTIVITY_CATALOG) {
  if (g.subject === "기타") continue; // probability-simulator(임시) 제외
  for (const slug of g.slugs) CATALOG_SUBJECT[slug] = g.subject;
}
const MASTER_SLUGS = Object.keys(CATALOG_SUBJECT);
const TOTAL = MASTER_SLUGS.length;

// content_blocks 배열에서 interactive_activity 의 activitySlug 만 순서대로 추출.
function blockSlugs(blocks: unknown): string[] {
  if (!Array.isArray(blocks)) return [];
  const out: string[] = [];
  for (const b of blocks) {
    if (b && typeof b === "object") {
      const blk = b as { type?: unknown; content?: { activitySlug?: unknown } };
      if (
        blk.type === "interactive_activity" &&
        typeof blk.content?.activitySlug === "string"
      ) {
        out.push(blk.content.activitySlug);
      }
    }
  }
  return out;
}

type Daewon = { id: string; label: string; subject: string };
type SubjectView = {
  subject: string;
  daewons: Array<{ daewon: Daewon; slugs: string[] }>;
  unplaced: string[]; // 커리큘럼 미배치(이 교과 카탈로그 소속)
};

export default function AdminOverviewsPage() {
  const theme = getRoleTheme("admin");

  const [saved, setSaved] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [adminId, setAdminId] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [justSavedSlug, setJustSavedSlug] = useState<string | null>(null);

  const [subject, setSubject] = useState<string>("");
  // 선택된 대단원 — "__all__"(전체) | daewon.id | "__unplaced__"(미배치).
  const [daewonId, setDaewonId] = useState<string>("__all__");
  const [search, setSearch] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [{ data: userData }, subjRes, unitRes, ovRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("subjects").select("name, order_index").order("order_index"),
      supabase
        .from("curriculum_units")
        .select(
          "id, subject, parent_id, unit_key, label, depth, order_index, content_blocks"
        )
        .order("depth")
        .order("order_index"),
      supabase.from("activity_overviews").select("slug, overview"),
    ]);
    setAdminId(userData.user?.id ?? null);
    const firstErr = subjRes.error || unitRes.error || ovRes.error;
    if (firstErr) {
      setError(firstErr.message);
      setLoading(false);
      return;
    }
    const subjNames = ((subjRes.data ?? []) as Array<{ name: string }>).map(
      (s) => s.name
    );
    setSubjects(subjNames);
    setUnits((unitRes.data ?? []) as UnitRow[]);
    const map: Record<string, string> = {};
    for (const r of (ovRes.data ?? []) as OverviewRow[]) {
      map[r.slug] = r.overview ?? "";
    }
    setSaved(map);
    setDraft(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 교과 구조 — 대단원별 활동 배치 + 미배치 묶음. (saved 와 무관 → units/subjects 만 의존)
  const subjectViews = useMemo(() => {
    const byId = new Map<string, UnitRow>();
    for (const u of units) byId.set(u.id, u);
    // 임의 단원의 대단원(depth 1 조상) 찾기.
    const daewonOf = (u: UnitRow): UnitRow => {
      let cur: UnitRow = u;
      let guard = 0;
      while (cur.depth > 1 && cur.parent_id && guard < 20) {
        const p = byId.get(cur.parent_id);
        if (!p) break;
        cur = p;
        guard += 1;
      }
      return cur;
    };
    // slug → 대단원 id (첫 등장 우선) + 대단원별 활동 순서.
    const placedDaewonId = new Map<string, string>();
    const slugsByDaewon = new Map<string, string[]>();
    for (const u of units) {
      const slugs = blockSlugs(u.content_blocks);
      if (slugs.length === 0) continue;
      const dw = daewonOf(u);
      for (const slug of slugs) {
        if (!CATALOG_SUBJECT[slug]) continue; // 컴포넌트 없는 레거시 슬러그 무시
        if (placedDaewonId.has(slug)) continue;
        placedDaewonId.set(slug, dw.id);
        const arr = slugsByDaewon.get(dw.id) ?? [];
        arr.push(slug);
        slugsByDaewon.set(dw.id, arr);
      }
    }
    // 교과별 대단원 목록(depth 1, order_index 순) + 미배치.
    const views = new Map<string, SubjectView>();
    for (const s of subjects) {
      views.set(s, { subject: s, daewons: [], unplaced: [] });
    }
    const daewonUnits = units
      .filter((u) => u.depth === 1)
      .sort((a, b) => a.order_index - b.order_index);
    for (const du of daewonUnits) {
      const v = views.get(du.subject);
      if (!v) continue; // subjects 마스터에 없는 교과는 스킵
      v.daewons.push({
        daewon: { id: du.id, label: du.label, subject: du.subject },
        slugs: slugsByDaewon.get(du.id) ?? [],
      });
    }
    // 미배치 — 마스터에 있으나 어떤 대단원에도 안 붙은 활동을 카탈로그 교과로 귀속.
    for (const slug of MASTER_SLUGS) {
      if (placedDaewonId.has(slug)) continue;
      const s = CATALOG_SUBJECT[slug];
      const v = views.get(s);
      if (v) v.unplaced.push(slug);
    }
    return views;
  }, [units, subjects]);

  // 교과의 기본 대단원 = 활동이 있는 첫 대단원(없으면 미배치, 없으면 첫 대단원, 없으면 전체).
  const defaultDaewon = useCallback(
    (s: string): string => {
      const v = subjectViews.get(s);
      if (!v) return "__all__";
      const firstWith = v.daewons.find((d) => d.slugs.length > 0);
      if (firstWith) return firstWith.daewon.id;
      if (v.unplaced.length > 0) return "__unplaced__";
      if (v.daewons.length > 0) return v.daewons[0].daewon.id;
      return "__all__";
    },
    [subjectViews]
  );

  function selectSubject(s: string) {
    setSubject(s);
    setDaewonId(defaultDaewon(s));
  }

  // 기본 선택 교과 = 활동이 있는 첫 교과(없으면 첫 교과) + 그 교과의 기본 대단원.
  useEffect(() => {
    if (subject || subjects.length === 0) return;
    const withActivity = subjects.find((s) => {
      const v = subjectViews.get(s);
      return (
        v &&
        (v.unplaced.length > 0 || v.daewons.some((d) => d.slugs.length > 0))
      );
    });
    const s = withActivity ?? subjects[0];
    setSubject(s);
    setDaewonId(defaultDaewon(s));
  }, [subject, subjects, subjectViews, defaultDaewon]);

  const filledCount = useMemo(
    () => MASTER_SLUGS.filter((s) => (saved[s] ?? "").trim().length > 0).length,
    [saved]
  );

  // 검색·미작성 필터.
  const matches = useCallback(
    (slug: string) => {
      if (onlyMissing && (saved[slug] ?? "").trim().length > 0) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        shortActivityTitle(slug).toLowerCase().includes(q) ||
        slug.toLowerCase().includes(q)
      );
    },
    [onlyMissing, saved, search]
  );

  const view = subject ? subjectViews.get(subject) : undefined;

  async function saveOne(slug: string) {
    setSavingSlug(slug);
    setError("");
    const overview = (draft[slug] ?? "").trim();
    const { error: e } = await supabase
      .from("activity_overviews")
      .upsert({ slug, overview, updated_by: adminId }, { onConflict: "slug" });
    setSavingSlug(null);
    if (e) {
      setError(`저장 실패 (${slug}): ${e.message}`);
      return;
    }
    setSaved((prev) => ({ ...prev, [slug]: overview }));
    setJustSavedSlug(slug);
    window.setTimeout(
      () => setJustSavedSlug((cur) => (cur === slug ? null : cur)),
      1500
    );
  }

  function renderRow(slug: string) {
    const dirty = (draft[slug] ?? "") !== (saved[slug] ?? "");
    const has = (saved[slug] ?? "").trim().length > 0;
    return (
      <li
        key={slug}
        className="rounded-lg border border-white/5 bg-slate-950/60 p-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-white">
              {shortActivityTitle(slug)}
            </span>
            {!has ? (
              <span className="ml-2 rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                미작성
              </span>
            ) : null}
            <p className="mt-0.5 font-mono text-[10px] text-slate-500">{slug}</p>
          </div>
          <div className="flex items-center gap-2">
            {justSavedSlug === slug ? (
              <span className="text-[11px] text-emerald-300">✓ 저장됨</span>
            ) : null}
            <button
              type="button"
              onClick={() => saveOne(slug)}
              disabled={!dirty || savingSlug === slug}
              className="rounded border border-cyan-300/40 px-3 py-1 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-300/10 disabled:opacity-40"
            >
              {savingSlug === slug ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
        <textarea
          value={draft[slug] ?? ""}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, [slug]: e.target.value }))
          }
          rows={2}
          placeholder="예: 비밀번호 자릿수를 늘려 가며 중복순열의 경우의 수가 몇 배로 커지는지 직접 만들어 보는 활동."
          className="mt-2 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
        />
      </li>
    );
  }

  function renderDaewonSection(daewon: Daewon, slugs: string[]) {
    const shown = slugs.filter(matches);
    return (
      <section
        key={daewon.id}
        className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-5"
      >
        <h2 className="text-sm font-bold text-white">
          <span className={theme.accentText}>{daewon.label}</span>
          <span className="ml-2 text-[11px] font-normal text-slate-500">
            {slugs.length > 0 ? `${slugs.length}개` : "활동 없음"}
          </span>
        </h2>
        {slugs.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            아직 이 대단원에 등록된 미니활동이 없습니다(준비 중).
          </p>
        ) : shown.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            검색·필터에 맞는 활동이 없습니다.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">{shown.map(renderRow)}</ul>
        )}
      </section>
    );
  }

  function renderUnplacedSection(slugs: string[]) {
    const shown = slugs.filter(matches);
    return (
      <section className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4 sm:p-5">
        <h2 className="text-sm font-bold text-white">
          <span className="text-amber-200">기타 · 커리큘럼 미배치</span>
          <span className="ml-2 text-[11px] font-normal text-slate-500">
            {slugs.length}개
          </span>
        </h2>
        <p className="mt-1 text-[11px] text-slate-400">
          단원(content_blocks)에 아직 연결되지 않은 활동입니다. 개요는 동일하게
          작성·저장됩니다.
        </p>
        {shown.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            검색·필터에 맞는 활동이 없습니다.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">{shown.map(renderRow)}</ul>
        )}
      </section>
    );
  }

  return (
    <>
      <div className="mb-6">
        <p className={`text-sm font-semibold ${theme.accentText}`}>활동 개요</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          미니활동 활동 개요
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          각 활동이 무엇을 시키고 어떤 개념을 다루는지 1~3문장으로 적어 두면, AI
          세특 생성 시 함께 참고되어 학생 성찰이 부실해도 활동 내용을 근거로
          보완합니다. 교과·대단원 구조는 단원 관리(curriculum)에서, 활동
          제목은 코드에서 가져오며 여기서는 개요 텍스트만 저장합니다.
        </p>
      </div>

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {/* 컨트롤 */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-white">
              개요 작성 {filledCount}
            </span>
            <span className="text-slate-400">/ {TOTAL}</span>
            <span className="ml-1 rounded-full bg-cyan-300/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-200">
              {TOTAL > 0 ? Math.round((filledCount / TOTAL) * 100) : 0}%
            </span>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>

        {/* 교과 탭 */}
        <div className="mt-3 flex flex-wrap gap-1">
          {subjects.map((s) => {
            const v = subjectViews.get(s);
            const count =
              (v?.unplaced.length ?? 0) +
              (v?.daewons.reduce((n, d) => n + d.slugs.length, 0) ?? 0);
            return (
              <button
                key={s}
                type="button"
                onClick={() => selectSubject(s)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  subject === s
                    ? "bg-cyan-300 text-slate-950"
                    : "border border-white/15 text-slate-300 hover:bg-white/10"
                }`}
              >
                {s}
                <span
                  className={
                    subject === s ? "ml-1 text-slate-700" : "ml-1 text-slate-500"
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 대단원 선택 (선택 교과의 대단원 + 미배치 + 전체) */}
        {view && (view.daewons.length > 0 || view.unplaced.length > 0) ? (
          <div className="mt-2 flex flex-wrap gap-1 border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={() => setDaewonId("__all__")}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                daewonId === "__all__"
                  ? "bg-white/90 text-slate-950"
                  : "border border-white/15 text-slate-300 hover:bg-white/10"
              }`}
            >
              전체
            </button>
            {view.daewons.map((d) => (
              <button
                key={d.daewon.id}
                type="button"
                onClick={() => setDaewonId(d.daewon.id)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                  daewonId === d.daewon.id
                    ? "bg-white/90 text-slate-950"
                    : "border border-white/15 text-slate-300 hover:bg-white/10"
                } ${d.slugs.length === 0 ? "opacity-50" : ""}`}
              >
                {d.daewon.label}
                <span
                  className={
                    daewonId === d.daewon.id
                      ? "ml-1 text-slate-600"
                      : "ml-1 text-slate-500"
                  }
                >
                  {d.slugs.length}
                </span>
              </button>
            ))}
            {view.unplaced.length > 0 ? (
              <button
                type="button"
                onClick={() => setDaewonId("__unplaced__")}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                  daewonId === "__unplaced__"
                    ? "bg-amber-300 text-slate-950"
                    : "border border-amber-300/30 text-amber-200 hover:bg-amber-300/10"
                }`}
              >
                미배치
                <span className="ml-1 text-amber-700/70">
                  {view.unplaced.length}
                </span>
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목·슬러그 검색"
            className="min-w-40 flex-1 rounded border border-white/10 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-cyan-300/40"
          />
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={onlyMissing}
              onChange={(e) => setOnlyMissing(e.target.checked)}
              className="h-4 w-4"
            />
            미작성만
          </label>
        </div>
      </div>

      {/* 선택 교과의 대단원별 목록 */}
      {!view ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-400">
          {loading ? "불러오는 중..." : "교과를 선택하세요."}
        </div>
      ) : view.daewons.length === 0 && view.unplaced.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-400">
          이 교과에는 아직 단원이 없습니다. 단원 관리에서 대단원을 추가하면
          여기에 표시됩니다.
        </div>
      ) : (
        <div className="space-y-5">
          {daewonId === "__all__" ? (
            <>
              {view.daewons.map((d) =>
                renderDaewonSection(d.daewon, d.slugs)
              )}
              {view.unplaced.length > 0
                ? renderUnplacedSection(view.unplaced)
                : null}
            </>
          ) : daewonId === "__unplaced__" ? (
            renderUnplacedSection(view.unplaced)
          ) : (
            (() => {
              const d = view.daewons.find((x) => x.daewon.id === daewonId);
              return d ? (
                renderDaewonSection(d.daewon, d.slugs)
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-slate-400">
                  대단원을 선택하세요.
                </div>
              );
            })()
          )}
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/admin"
          className="text-xs font-semibold text-slate-400 hover:text-white"
        >
          ← 관리자 홈으로
        </Link>
      </div>
    </>
  );
}
