"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { ProgressWeek, ProgressDay } from "@/lib/dashboard/progressDates";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";

export type ClassRow = {
  grade: number;
  class_number: number;
  subject: string;
};

export type ProgressEntry = {
  id: string;
  date: string;
  grade: number;
  class_number: number;
  subject: string;
  content: string;
};

export type WeeklySlotKey = {
  day_of_week: number;
  grade: number;
  class_number: number;
  subject: string;
};

export type DailyMeta = {
  id?: string;
  date: string;
  isOff: boolean;
  notes: string;
};

export type DailyClassOverride = {
  id: string;
  date: string;
  grade: number;
  class_number: number;
  subject: string;
  action: "add" | "remove";
};

type Props = {
  teacherId: string;
  schoolYear: number;
  classes: ClassRow[];
  weeks: ProgressWeek[];
  initialEntries: ProgressEntry[];
  initialWeeklySlots: WeeklySlotKey[];
  initialDayMeta: DailyMeta[];
  initialOverrides: DailyClassOverride[];
};

type ShadeChoice = "default" | "force_on" | "force_off";

function cellKey(c: ClassRow, dateIso: string) {
  return `${c.grade}-${c.class_number}-${c.subject}-${dateIso}`;
}

function slotSetKey(s: WeeklySlotKey) {
  return `${s.day_of_week}-${s.grade}-${s.class_number}-${s.subject}`;
}

function slotKey(day: number, c: ClassRow) {
  return `${day}-${c.grade}-${c.class_number}-${c.subject}`;
}

function dayOfWeekFromIso(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  const dow = d.getDay(); // 0=일~6=토
  return (dow + 6) % 7; // 월=0
}

type CellMap = Record<string, { content: string; id?: string }>;
type DayMap = Record<string, DailyMeta>;
type OverrideMap = Record<
  string,
  { id: string; action: "add" | "remove" }
>;

function buildCellMap(entries: ProgressEntry[]): CellMap {
  const m: CellMap = {};
  entries.forEach((e) => {
    const k = cellKey(
      { grade: e.grade, class_number: e.class_number, subject: e.subject },
      e.date
    );
    m[k] = { content: e.content, id: e.id };
  });
  return m;
}

function buildDayMap(rows: DailyMeta[]): DayMap {
  const m: DayMap = {};
  rows.forEach((r) => {
    m[r.date] = { ...r };
  });
  return m;
}

function buildOverrideMap(rows: DailyClassOverride[]): OverrideMap {
  const m: OverrideMap = {};
  rows.forEach((r) => {
    const k = cellKey(
      { grade: r.grade, class_number: r.class_number, subject: r.subject },
      r.date
    );
    m[k] = { id: r.id, action: r.action };
  });
  return m;
}

function buildSlotSet(slots: WeeklySlotKey[]): Set<string> {
  return new Set(slots.map(slotSetKey));
}

export function ProgressGrid({
  teacherId,
  schoolYear,
  classes,
  weeks,
  initialEntries,
  initialWeeklySlots,
  initialDayMeta,
  initialOverrides,
}: Props) {
  const theme = getRoleTheme("teacher");
  const router = useRouter();

  const [cells, setCells] = useState<CellMap>(() => buildCellMap(initialEntries));
  const [dayMeta, setDayMeta] = useState<DayMap>(() => buildDayMap(initialDayMeta));
  const [overrides, setOverrides] = useState<OverrideMap>(() =>
    buildOverrideMap(initialOverrides)
  );
  const slotSet = useMemo(
    () => buildSlotSet(initialWeeklySlots),
    [initialWeeklySlots]
  );

  // 편집 상태
  const [editing, setEditing] = useState<string | null>(null);
  const [draftCell, setDraftCell] = useState("");
  const [draftShade, setDraftShade] = useState<ShadeChoice>("default");
  const [draftDayNotes, setDraftDayNotes] = useState("");
  const [draftDayOff, setDraftDayOff] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  function startEditCell(c: ClassRow, dateIso: string) {
    const k = cellKey(c, dateIso);
    setDraftCell(cells[k]?.content ?? "");
    const ov = overrides[k];
    setDraftShade(
      ov?.action === "add"
        ? "force_on"
        : ov?.action === "remove"
        ? "force_off"
        : "default"
    );
    setEditing("cell:" + k);
    setErrorMessage("");
  }

  function startEditDay(dateIso: string) {
    const m = dayMeta[dateIso];
    setDraftDayNotes(m?.notes ?? "");
    setDraftDayOff(!!m?.isOff);
    setEditing("day:" + dateIso);
    setErrorMessage("");
  }

  function cancel() {
    setEditing(null);
    setDraftCell("");
    setDraftShade("default");
    setDraftDayNotes("");
    setDraftDayOff(false);
  }

  // 음영 결정 — 오버라이드 > 휴강 > 시간표
  function shadeOf(c: ClassRow, dateIso: string): {
    shaded: boolean;
    kind: "default_on" | "default_off" | "force_on" | "force_off" | "day_off";
  } {
    const meta = dayMeta[dateIso];
    if (meta?.isOff) return { shaded: false, kind: "day_off" };

    const ov = overrides[cellKey(c, dateIso)];
    if (ov?.action === "add") return { shaded: true, kind: "force_on" };
    if (ov?.action === "remove") return { shaded: false, kind: "force_off" };

    const dow = dayOfWeekFromIso(dateIso);
    const baseOn = slotSet.has(slotKey(dow, c));
    return baseOn
      ? { shaded: true, kind: "default_on" }
      : { shaded: false, kind: "default_off" };
  }

  // 셀 저장: progress_tracker(내용) + daily_class_overrides(음영) 동시 처리
  const saveCell = useCallback(
    async (c: ClassRow, dateIso: string) => {
      const k = cellKey(c, dateIso);
      setBusy("cell:" + k);
      setErrorMessage("");

      const content = draftCell.trim();
      const existingCellId = cells[k]?.id;
      const existingOverride = overrides[k];

      try {
        // 1) 내용 저장/업데이트 (빈 내용이면 진도 행은 그대로 두고 음영만 동기화)
        if (content) {
          const { data, error } = await supabase
            .from("progress_tracker")
            .upsert(
              {
                teacher_id: teacherId,
                school_year: schoolYear,
                date: dateIso,
                grade: c.grade,
                class_number: c.class_number,
                subject: c.subject,
                lesson_topic: content,
                notes: "",
              },
              { onConflict: "teacher_id,date,grade,class_number,subject" }
            )
            .select("id")
            .single();
          if (error) throw error;
          setCells((prev) => ({
            ...prev,
            [k]: { content, id: (data as { id: string }).id },
          }));
        }

        // 2) 음영 오버라이드 동기화
        const desiredAction: "add" | "remove" | null =
          draftShade === "force_on"
            ? "add"
            : draftShade === "force_off"
            ? "remove"
            : null;

        if (desiredAction === null) {
          // override 제거 (기본 = 시간표 따름)
          if (existingOverride) {
            const { error } = await supabase
              .from("daily_class_overrides")
              .delete()
              .eq("id", existingOverride.id);
            if (error) throw error;
            setOverrides((prev) => {
              const next = { ...prev };
              delete next[k];
              return next;
            });
          }
        } else if (existingOverride?.action !== desiredAction) {
          // id 명시 없이 onConflict 키로 upsert
          const { data, error } = await supabase
            .from("daily_class_overrides")
            .upsert(
              {
                teacher_id: teacherId,
                date: dateIso,
                grade: c.grade,
                class_number: c.class_number,
                subject: c.subject,
                action: desiredAction,
              },
              {
                onConflict:
                  "teacher_id,date,grade,class_number,subject",
              }
            )
            .select("id")
            .single();
          if (error) throw error;
          setOverrides((prev) => ({
            ...prev,
            [k]: {
              id: (data as { id: string }).id,
              action: desiredAction,
            },
          }));
        }

        setBusy(null);
        setEditing(null);
        // 서버 컴포넌트(부모 페이지)의 entries/dayMeta/overrides props 도
        // 새 데이터로 받아 보기 모드 표가 즉시 반영되도록 한다.
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(msg);
        setBusy(null);
      }
    },
    [draftCell, draftShade, cells, overrides, teacherId, schoolYear, router]
  );

  // 셀 삭제 (내용 + 오버라이드 모두 제거)
  const deleteCell = useCallback(
    async (c: ClassRow, dateIso: string) => {
      const k = cellKey(c, dateIso);
      setBusy("cell:" + k);
      setErrorMessage("");

      const cellId = cells[k]?.id;
      const overrideId = overrides[k]?.id;

      try {
        if (cellId) {
          const { error } = await supabase
            .from("progress_tracker")
            .delete()
            .eq("id", cellId);
          if (error) throw error;
        }
        if (overrideId) {
          const { error } = await supabase
            .from("daily_class_overrides")
            .delete()
            .eq("id", overrideId);
          if (error) throw error;
        }
        setCells((prev) => {
          const next = { ...prev };
          delete next[k];
          return next;
        });
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[k];
          return next;
        });
        setBusy(null);
        setEditing(null);
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(msg);
        setBusy(null);
      }
    },
    [cells, overrides, router]
  );

  // 일자 비고/휴강 저장
  const saveDay = useCallback(
    async (dateIso: string) => {
      setBusy("day:" + dateIso);
      setErrorMessage("");
      const notes = draftDayNotes.trim();
      const isOff = draftDayOff;
      const existing = dayMeta[dateIso];

      if (!notes && !isOff) {
        if (existing?.id) {
          const { error } = await supabase
            .from("daily_schedule_meta")
            .delete()
            .eq("id", existing.id);
          if (error) {
            setErrorMessage(error.message);
            setBusy(null);
            return;
          }
          setDayMeta((prev) => {
            const next = { ...prev };
            delete next[dateIso];
            return next;
          });
          router.refresh();
        }
        setBusy(null);
        setEditing(null);
        return;
      }

      const { data, error } = await supabase
        .from("daily_schedule_meta")
        .upsert(
          {
            teacher_id: teacherId,
            date: dateIso,
            is_off: isOff,
            notes,
          },
          { onConflict: "teacher_id,date" }
        )
        .select("id")
        .single();

      if (error) {
        setErrorMessage(error.message);
        setBusy(null);
        return;
      }

      setDayMeta((prev) => ({
        ...prev,
        [dateIso]: {
          id: (data as { id: string }).id,
          date: dateIso,
          isOff,
          notes,
        },
      }));
      setBusy(null);
      setEditing(null);
      router.refresh();
    },
    [draftDayNotes, draftDayOff, dayMeta, teacherId, router]
  );

  if (classes.length === 0) {
    return (
      <div className="rounded-2xl border border-yellow-300/30 bg-yellow-950/30 p-6 text-sm text-yellow-100">
        담당 학급이 없어서 진도표를 만들 수 없습니다. 관리자가 교사 권한
        화면에서 담당 학급을 등록해야 합니다.
      </div>
    );
  }

  // 헬퍼: 한 주(평일 5일)를 렌더링
  function renderDayRow(d: ProgressDay) {
    const isToday = d.isToday;
    const meta = dayMeta[d.iso];
    const isOff = meta?.isOff;
    const dayEditing = editing === "day:" + d.iso;
    const dayBusy = busy === "day:" + d.iso;

    // 일자 비고/휴강 td (행의 맨 오른쪽에 sticky)
    const dayMetaCell = (
      <td
        key="day-meta"
        className={`sticky right-0 z-10 min-w-[160px] border-l border-white/10 align-top backdrop-blur ${
          isOff ? "bg-amber-300/10" : "bg-slate-950/80"
        }`}
      >
        {dayEditing ? (
          <div className="space-y-1.5 p-2">
            <textarea
              value={draftDayNotes}
              onChange={(e) => setDraftDayNotes(e.target.value)}
              placeholder="이 날 비고 (단축수업·시험 등)"
              rows={2}
              className="w-full rounded border border-amber-300/40 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-amber-300/40"
              autoFocus
            />
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <input
                type="checkbox"
                checked={draftDayOff}
                onChange={(e) => setDraftDayOff(e.target.checked)}
                className="h-3 w-3"
              />
              이 날은 전체 휴강
            </label>
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={cancel}
                disabled={dayBusy}
                className="rounded px-2 py-0.5 text-[11px] text-slate-400 hover:text-white disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => saveDay(d.iso)}
                disabled={dayBusy}
                className="rounded bg-amber-300 px-2 py-0.5 text-[11px] font-bold text-slate-950 hover:bg-amber-200 disabled:opacity-60"
              >
                {dayBusy ? "저장중" : "저장"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => startEditDay(d.iso)}
            className="block min-h-[64px] w-full px-2 py-2 text-left transition hover:bg-white/5"
          >
            {meta?.isOff ? (
              <span className="block text-[11px] font-bold text-amber-300">
                휴강
              </span>
            ) : null}
            {meta?.notes ? (
              <span className="mt-0.5 block whitespace-pre-wrap text-[11px] text-slate-300">
                {meta.notes}
              </span>
            ) : !meta?.isOff ? (
              <span className="block text-[11px] text-slate-500">+ 비고</span>
            ) : null}
          </button>
        )}
      </td>
    );

    return (
      <tr
        key={d.iso}
        className={`border-b border-white/5 ${isOff ? "bg-slate-700/15" : ""}`}
      >
        {/* 좌측 sticky: 일자 */}
        <th
          scope="row"
          className={`sticky left-0 z-10 bg-slate-900/80 px-3 py-3 text-left backdrop-blur ${
            isToday ? theme.accentText : "text-white"
          }`}
        >
          <div className="text-sm font-semibold">
            {d.monthDay}{" "}
            <span className="font-normal text-slate-400">({d.dayLabel})</span>
          </div>
          {isToday ? (
            <div className="text-[10px] font-bold uppercase tracking-wider">
              오늘
            </div>
          ) : null}
        </th>

        {/* 학반별 진도 셀 */}
        {classes.map((c) => {
          const k = cellKey(c, d.iso);
          const cur = cells[k];
          const sh = shadeOf(c, d.iso);
          const cellEditing = editing === "cell:" + k;
          const cellBusy = busy === "cell:" + k;

          const hasContent = !!cur?.content;
          const bgClass = (() => {
            if (sh.kind === "day_off") return "bg-slate-700/20";
            if (sh.kind === "force_on")
              return hasContent ? "bg-amber-300/25" : "bg-amber-300/15";
            if (sh.kind === "force_off") return "bg-slate-800/20";
            if (sh.kind === "default_on")
              return hasContent ? "bg-cyan-300/25" : theme.accentBg;
            // default_off — 시간표 비음영이지만 진도가 적혀 있으면 강조
            if (hasContent) return "bg-cyan-300/15";
            return "";
          })();

          return (
            <td
              key={k}
              className={`min-w-[180px] border-l border-white/10 align-top ${bgClass}`}
            >
              {cellEditing ? (
                <div className="space-y-1.5 p-2">
                  <textarea
                    value={draftCell}
                    onChange={(e) => setDraftCell(e.target.value)}
                    placeholder="수업 단원·내용 (자유 입력)"
                    rows={3}
                    className="w-full rounded border border-cyan-300/40 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:ring-2 focus:ring-cyan-300/40"
                    autoFocus
                  />
                  <fieldset className="rounded border border-white/10 bg-slate-950/60 px-2 py-1.5">
                    <legend className="px-1 text-[10px] font-semibold text-slate-400">
                      음영 (수업 여부)
                    </legend>
                    <div className="flex flex-col gap-1 text-[11px] text-slate-200">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name={`shade-${k}`}
                          checked={draftShade === "default"}
                          onChange={() => setDraftShade("default")}
                          className="h-3 w-3"
                        />
                        시간표 따름
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name={`shade-${k}`}
                          checked={draftShade === "force_on"}
                          onChange={() => setDraftShade("force_on")}
                          className="h-3 w-3"
                        />
                        강제 음영 (이 날 임시 수업)
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name={`shade-${k}`}
                          checked={draftShade === "force_off"}
                          onChange={() => setDraftShade("force_off")}
                          className="h-3 w-3"
                        />
                        음영 해제 (이 날만 결강)
                      </label>
                    </div>
                  </fieldset>
                  <div className="flex items-center justify-between gap-1">
                    {cur?.id || overrides[k] ? (
                      <button
                        type="button"
                        onClick={() => deleteCell(c, d.iso)}
                        disabled={cellBusy}
                        className="rounded border border-red-300/40 px-2 py-0.5 text-[11px] font-semibold text-red-200 hover:bg-red-300/10 disabled:opacity-60"
                      >
                        ✕ 삭제
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={cancel}
                        disabled={cellBusy}
                        className="rounded px-2 py-0.5 text-[11px] text-slate-400 hover:text-white disabled:opacity-60"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => saveCell(c, d.iso)}
                        disabled={cellBusy}
                        className="rounded bg-cyan-300 px-2 py-0.5 text-[11px] font-bold text-slate-950 hover:bg-cyan-200 disabled:opacity-60"
                      >
                        {cellBusy ? "저장중" : "저장"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEditCell(c, d.iso)}
                  className={`block min-h-[72px] w-full px-2 py-2 text-left transition hover:bg-white/5 ${
                    sh.kind === "day_off" ? "opacity-60" : ""
                  }`}
                >
                  {/* 음영 종류 마이크로 라벨 */}
                  {sh.kind === "force_on" ? (
                    <span className="mb-1 inline-block rounded bg-amber-300/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
                      임시 수업
                    </span>
                  ) : sh.kind === "force_off" ? (
                    <span className="mb-1 inline-block rounded bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                      결강
                    </span>
                  ) : null}

                  {cur?.content ? (
                    <span className="block whitespace-pre-wrap text-xs text-white">
                      {cur.content}
                    </span>
                  ) : sh.shaded ? (
                    <span className={`block text-[11px] ${theme.accentText}`}>
                      + 입력
                    </span>
                  ) : (
                    <span className="block text-[11px] text-slate-600">
                      {sh.kind === "day_off" ? "(휴강)" : "·"}
                    </span>
                  )}
                </button>
              )}
            </td>
          );
        })}

        {/* 우측 sticky: 일자 비고/휴강 */}
        {dayMetaCell}
      </tr>
    );
  }

  return (
    <div className="space-y-3">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-300/30 bg-red-950/30 p-4 text-sm text-red-200">
          저장 중 오류: {errorMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="sticky left-0 z-20 min-w-[120px] bg-slate-900/90 px-3 py-3 text-left text-xs font-semibold text-slate-300 backdrop-blur">
                일자
              </th>
              {classes.map((c) => (
                <th
                  key={`${c.grade}-${c.class_number}-${c.subject}`}
                  className="min-w-[180px] border-l border-white/10 px-3 py-3 text-left text-xs font-semibold text-white"
                >
                  <div>
                    {c.grade}학년 {c.class_number}반
                  </div>
                  <div
                    className={`text-[11px] font-normal ${theme.accentText}`}
                  >
                    {c.subject}
                  </div>
                </th>
              ))}
              <th className="sticky right-0 z-20 min-w-[160px] border-l border-white/10 bg-slate-900/90 px-3 py-3 text-left text-xs font-semibold text-amber-200 backdrop-blur">
                일자 비고 / 휴강
              </th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => {
              const hasToday = w.days.some((d) => d.isToday);
              return (
                <Fragment key={w.label}>
                  <tr className="border-b border-white/10">
                    <th
                      scope="colgroup"
                      colSpan={2 + classes.length}
                      className={`sticky left-0 z-10 bg-slate-950/80 px-3 py-1.5 text-left text-[11px] font-bold backdrop-blur ${
                        hasToday ? theme.accentText : "text-slate-400"
                      }`}
                    >
                      {w.label}
                    </th>
                  </tr>
                  {w.days.map((d) => renderDayRow(d))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="space-y-1 text-xs text-slate-500">
        <li>
          <span className={`mr-1 inline-block h-3 w-3 rounded ${theme.accentBg}`} />
          시간표 음영 — 칸 클릭 후 자유 입력
        </li>
        <li>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-amber-300/15 border border-amber-300/30" />
          임시 수업 — 시간표엔 없지만 그 날만 수업 (편집 모드에서 "강제 음영")
        </li>
        <li>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-slate-800/40 border border-slate-700" />
          결강 — 시간표엔 있지만 그 날만 빠짐 (편집 모드에서 "음영 해제")
        </li>
        <li>
          <span className="mr-1 inline-block h-3 w-3 rounded bg-slate-700/30" />
          전체 휴강 — 일자 비고 칸에서 "전체 휴강" 체크
        </li>
      </ul>
    </div>
  );
}
