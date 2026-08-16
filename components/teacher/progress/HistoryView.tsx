"use client";

import { Fragment, useMemo, useState } from "react";
import { getRoleTheme } from "@/lib/dashboard/roleTheme";
import {
  ProgressGrid,
  type CourseRow,
  type ProgressEntry,
  type WeeklySlotKey,
  type DailyMeta,
  type DailyClassOverride,
} from "./ProgressGrid";
import type { ProgressDay, ProgressWeek } from "@/lib/dashboard/progressDates";

export type HistoryEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  course_id: string | null;
  content: string;
};

export type HistoryDayMeta = {
  date: string;
  isOff: boolean;
  notes: string;
};

type Props = {
  teacherId: string;
  schoolYear: number;
  courses: CourseRow[];
  entries: HistoryEntry[];
  dayMeta: HistoryDayMeta[];
  weeklySlots: WeeklySlotKey[];
  overrides: DailyClassOverride[];
};

// 빈 상태에서 "샘플 미리보기"용 가짜 데이터 (편집 모드 비활성)
// 빈 상태 "샘플 미리보기" 용 가짜 수업·진도 (편집 모드 비활성)
const DEMO_COURSES: CourseRow[] = [
  { id: "demo-c1", name: "1학년 9반 공통수학1", subject: "공통수학1", grade: 1, class_number: 9 },
  { id: "demo-c2", name: "2학년 9반 확률과통계", subject: "확률과통계", grade: 2, class_number: 9 },
];

const DEMO_ENTRIES: HistoryEntry[] = [
  {
    id: "demo-1",
    date: "2026-05-25",
    course_id: "demo-c1",
    content:
      "다항식의 연산 (덧셈·뺄셈·곱셈)\n교과서 p.12-18, 연습문제 1~5번 풀이",
  },
  {
    id: "demo-2",
    date: "2026-05-25",
    course_id: "demo-c2",
    content: "확률의 곱셈정리 도입\n예제 1·2 풀이, 모둠 토의",
  },
  {
    id: "demo-3",
    date: "2026-05-27",
    course_id: "demo-c1",
    content: "인수분해 — 공식 정리\n공통인수·치환·완전제곱식",
  },
  {
    id: "demo-4",
    date: "2026-05-28",
    course_id: "demo-c2",
    content: "베이즈 정리 — 도핑 검사 사례\n쿠키 상자 예제 풀이",
  },
  {
    id: "demo-5",
    date: "2026-05-29",
    course_id: "demo-c1",
    content: "복소수와 이차방정식 — 켤레복소수\n허근의 합·곱",
  },
  {
    id: "demo-6",
    date: "2026-05-29",
    course_id: "demo-c2",
    content: "독립시행 — 자유투 성공률\n수행평가 안내",
  },
];

const DEMO_DAY_META: HistoryDayMeta[] = [
  { date: "2026-05-26", isOff: true, notes: "체육대회 (전체 휴강)" },
  { date: "2026-05-27", isOff: false, notes: "1교시 단축수업 (40분), 학년회의" },
];

function monthKey(iso: string) {
  return iso.slice(0, 7);
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${y}년 ${parseInt(m, 10)}월`;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function dayInfo(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return {
    monthDay: `${d.getMonth() + 1}/${d.getDate()}`,
    dayLabel: DAY_LABELS[d.getDay()],
  };
}

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function cellKey(courseId: string, dateIso: string) {
  return `${courseId}-${dateIso}`;
}

// 표시 순서 — 학년·반이 있으면 그 순, 없으면(학반 없는 수업) 이름 순으로 뒤에.
function sortCourses(rows: CourseRow[]): CourseRow[] {
  return [...rows].sort((a, b) => {
    const ga = a.grade ?? 99;
    const gb = b.grade ?? 99;
    if (ga !== gb) return ga - gb;
    const ca = a.class_number ?? 99;
    const cb = b.class_number ?? 99;
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name, "ko");
  });
}

export function HistoryView({
  teacherId,
  schoolYear,
  courses: propsCourses,
  entries,
  dayMeta,
  weeklySlots,
  overrides,
}: Props) {
  const theme = getRoleTheme("teacher");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [showDemo, setShowDemo] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // 편집 모드에서 사용자가 임시로 추가한 빈 날짜들 (저장 시 DB에 들어가면 정식 행으로 흡수)
  const [extraDates, setExtraDates] = useState<string[]>([]);
  const [pendingDate, setPendingDate] = useState<string>("");

  function addExtraDate() {
    if (!pendingDate) return;
    setExtraDates((prev) =>
      prev.includes(pendingDate) ? prev : [...prev, pendingDate]
    );
    setPendingDate("");
  }
  function removeExtraDate(iso: string) {
    setExtraDates((prev) => prev.filter((d) => d !== iso));
  }

  const isDemo = entries.length === 0 && dayMeta.length === 0 && showDemo;
  const effectiveEntries = isDemo ? DEMO_ENTRIES : entries;
  const effectiveDayMeta = isDemo ? DEMO_DAY_META : dayMeta;
  const allCourses = isDemo ? DEMO_COURSES : propsCourses;

  // 월 목록 (오래된 월 먼저 — 학기 진행 순)
  const monthKeys = useMemo(() => {
    const set = new Set<string>();
    effectiveEntries.forEach((e) => set.add(monthKey(e.date)));
    effectiveDayMeta.forEach((d) => set.add(monthKey(d.date)));
    if (editMode && !isDemo) {
      extraDates.forEach((iso) => set.add(monthKey(iso)));
    }
    return Array.from(set).sort();
  }, [effectiveEntries, effectiveDayMeta, extraDates, editMode, isDemo]);

  // 월 필터
  const filteredEntries = useMemo(
    () =>
      selectedMonth === "all"
        ? effectiveEntries
        : effectiveEntries.filter((e) => monthKey(e.date) === selectedMonth),
    [effectiveEntries, selectedMonth]
  );
  const filteredDayMeta = useMemo(
    () =>
      selectedMonth === "all"
        ? effectiveDayMeta
        : effectiveDayMeta.filter((d) => monthKey(d.date) === selectedMonth),
    [effectiveDayMeta, selectedMonth]
  );

  // 기록에 등장한 수업만 (읽기 표의 컬럼)
  const entryCourses = useMemo<CourseRow[]>(() => {
    const byId = new Map(allCourses.map((c) => [c.id, c]));
    const map = new Map<string, CourseRow>();
    filteredEntries.forEach((e) => {
      if (!e.course_id) return;
      const c = byId.get(e.course_id);
      if (c) map.set(c.id, c);
    });
    return sortCourses(Array.from(map.values()));
  }, [filteredEntries, allCourses]);

  // 편집 모드에서는 담당 수업 전체를 컬럼으로 (기록이 없던 수업에도 입력 가능)
  const editCourses = useMemo<CourseRow[]>(() => {
    const map = new Map<string, CourseRow>();
    [...entryCourses, ...allCourses].forEach((c) => map.set(c.id, c));
    return sortCourses(Array.from(map.values()));
  }, [entryCourses, allCourses]);

  // 등장한 날짜를 월별로 그룹화 (오래된 월 위, 같은 월 안에서 오래된 날짜 위 — 학기 진행 순)
  // 편집 모드일 때만 extraDates 도 합쳐서 빈 행으로 노출.
  const dateGroups = useMemo(() => {
    const set = new Set<string>();
    filteredEntries.forEach((e) => set.add(e.date));
    filteredDayMeta.forEach((d) => set.add(d.date));
    if (editMode && !isDemo) {
      extraDates.forEach((iso) => {
        if (selectedMonth === "all" || monthKey(iso) === selectedMonth) {
          set.add(iso);
        }
      });
    }
    const sorted = Array.from(set).sort(); // 시간 순 (옛→새)
    type Group = { monthKey: string; dates: string[] };
    const groups: Group[] = [];
    sorted.forEach((iso) => {
      const mk = monthKey(iso);
      const last = groups[groups.length - 1];
      if (last && last.monthKey === mk) last.dates.push(iso);
      else groups.push({ monthKey: mk, dates: [iso] });
    });
    return groups;
  }, [filteredEntries, filteredDayMeta, extraDates, editMode, isDemo, selectedMonth]);

  // readonly 표용 인덱스
  const cellIndex = useMemo(() => {
    const m = new Map<string, HistoryEntry>();
    filteredEntries.forEach((e) => {
      if (!e.course_id) return;
      m.set(cellKey(e.course_id, e.date), e);
    });
    return m;
  }, [filteredEntries]);
  const dayMetaIndex = useMemo(() => {
    const m = new Map<string, HistoryDayMeta>();
    filteredDayMeta.forEach((d) => m.set(d.date, d));
    return m;
  }, [filteredDayMeta]);

  // 편집 모드에서 ProgressGrid 에 넘길 weeks(=월별 그룹)
  const weeksForGrid = useMemo<ProgressWeek[]>(() => {
    const today = todayIso();
    return dateGroups.map((g) => ({
      label: monthLabel(g.monthKey),
      days: g.dates
        .slice()
        .sort() // 같은 월 안에선 옛 날짜 위로 (진도표와 동일 방향)
        .map<ProgressDay>((iso) => {
          const info = dayInfo(iso);
          return {
            iso,
            monthDay: info.monthDay,
            dayLabel: info.dayLabel,
            isToday: iso === today,
          };
        }),
    }));
  }, [dateGroups]);

  const progressEntries: ProgressEntry[] = filteredEntries.map((e) => ({
    id: e.id,
    date: e.date,
    course_id: e.course_id,
    content: e.content,
  }));

  const dailyMetaForGrid: DailyMeta[] = filteredDayMeta.map((d) => ({
    date: d.date,
    isOff: d.isOff,
    notes: d.notes,
  }));

  // 빈 상태
  if (entries.length === 0 && dayMeta.length === 0 && !showDemo) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-sm text-slate-300">
        <p>저장된 진도 기록이 없습니다.</p>
        <p className="mt-2">
          <a href="/teacher/progress" className={theme.accentText}>
            진도표 페이지
          </a>{" "}
          에서 수업 내용을 입력하면 여기에 누적됩니다.
        </p>
        <button
          type="button"
          onClick={() => setShowDemo(true)}
          className={`mt-4 rounded-full border px-4 py-2 text-xs font-semibold ${theme.accentBorder} ${theme.accentText} hover:bg-white/5`}
        >
          📝 샘플 한 주 미리보기
        </button>
      </div>
    );
  }

  // 편집 모드 + 표시할 날짜가 있을 때만 ProgressGrid 사용
  const hasDates = dateGroups.length > 0;

  return (
    <div className="space-y-4">
      {isDemo ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-3 text-xs text-amber-100">
          <span>
            📝 <b>미리보기 모드</b> — 샘플 한 주 데이터를 보여드립니다. 편집은
            실데이터 모드에서만 가능합니다.
          </span>
          <button
            type="button"
            onClick={() => setShowDemo(false)}
            className="rounded-full border border-amber-300/40 px-3 py-1 font-semibold hover:bg-amber-300/10"
          >
            미리보기 닫기
          </button>
        </div>
      ) : null}

      {/* 컨트롤 줄 — 월 칩 + 편집 모드 토글 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedMonth("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selectedMonth === "all"
                ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            전체
          </button>
          {monthKeys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedMonth(k)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selectedMonth === k
                  ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {monthLabel(k)}
            </button>
          ))}
        </div>

        {!isDemo ? (
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              editMode
                ? `${theme.accentBg} ${theme.accentText} border ${theme.accentBorder}`
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {editMode ? "✏️ 편집 모드 (켜짐)" : "👁 보기 모드"}
          </button>
        ) : null}
      </div>

      {!hasDates ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">
          이 기간에 저장된 진도 기록이 없습니다.
        </div>
      ) : editMode && !isDemo ? (
        <>
          <p className="text-xs text-amber-200">
            📝 편집 모드 — 셀을 클릭해 진도표와 같은 방식으로 과거 기록을 수정·
            추가·삭제할 수 있습니다. 수업 컬럼은 기록에 등장한 수업 + 현재 담당 수업의
            합집합입니다.
          </p>

          {/* 빈 날짜 추가 */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-3 text-xs">
            <span className="font-semibold text-cyan-200">
              📅 빈 날짜 추가:
            </span>
            <input
              type="date"
              value={pendingDate}
              onChange={(e) => setPendingDate(e.target.value)}
              aria-label="추가할 날짜"
              className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-slate-200 outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
            <button
              type="button"
              onClick={addExtraDate}
              disabled={!pendingDate}
              className="rounded-full bg-cyan-300 px-3 py-1 font-bold text-slate-950 hover:bg-cyan-200 disabled:opacity-60"
            >
              추가
            </button>
            {extraDates.length > 0 ? (
              <div className="ml-auto flex flex-wrap items-center gap-1">
                <span className="text-slate-400">추가됨:</span>
                {extraDates.map((iso) => (
                  <span
                    key={iso}
                    className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-0.5 text-cyan-200"
                  >
                    {iso}
                    <button
                      type="button"
                      onClick={() => removeExtraDate(iso)}
                      aria-label={`${iso} 추가 취소`}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="ml-auto text-slate-500">
                기록이 없는 날짜를 골라 행을 임시로 추가하세요. 셀에 내용을
                저장하면 영구로 남습니다.
              </span>
            )}
          </div>

          <ProgressGrid
            teacherId={teacherId}
            schoolYear={schoolYear}
            courses={editCourses}
            weeks={weeksForGrid}
            initialEntries={progressEntries}
            initialWeeklySlots={weeklySlots}
            initialDayMeta={dailyMetaForGrid}
            initialOverrides={overrides}
          />
        </>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="sticky left-0 z-20 min-w-[120px] bg-slate-900/90 px-3 py-3 text-left text-xs font-semibold text-slate-300 backdrop-blur">
                  일자
                </th>
                {entryCourses.length === 0 ? (
                  <th className="border-l border-white/10 px-3 py-3 text-left text-xs font-semibold text-slate-400">
                    (수업 데이터 없음)
                  </th>
                ) : (
                  entryCourses.map((c) => (
                    <th
                      key={c.id}
                      className="min-w-[180px] border-l border-white/10 px-3 py-3 text-left text-xs font-semibold text-white"
                    >
                      <div>{c.name}</div>
                      <div
                        className={`text-[11px] font-normal ${theme.accentText}`}
                      >
                        {c.subject}
                      </div>
                    </th>
                  ))
                )}
                <th className="sticky right-0 z-20 min-w-[160px] border-l border-white/10 bg-slate-900/90 px-3 py-3 text-left text-xs font-semibold text-amber-200 backdrop-blur">
                  일자 비고 / 휴강
                </th>
              </tr>
            </thead>
            <tbody>
              {dateGroups.map((g) => (
                <Fragment key={g.monthKey}>
                  <tr className="border-b border-white/10">
                    <th
                      scope="colgroup"
                      colSpan={1 + Math.max(entryCourses.length, 1) + 1}
                      className={`sticky left-0 z-10 bg-slate-950/80 px-3 py-1.5 text-left text-[11px] font-bold backdrop-blur ${theme.accentText}`}
                    >
                      {monthLabel(g.monthKey)}
                    </th>
                  </tr>
                  {g.dates.map((iso) => {
                    const info = dayInfo(iso);
                    const meta = dayMetaIndex.get(iso);
                    const isOff = !!meta?.isOff;

                    return (
                      <tr
                        key={iso}
                        className={`border-b border-white/5 ${
                          isOff ? "bg-slate-700/15" : ""
                        }`}
                      >
                        <th
                          scope="row"
                          className="sticky left-0 z-10 bg-slate-900/80 px-3 py-3 text-left text-white backdrop-blur"
                        >
                          <div className="text-sm font-semibold">
                            {info.monthDay}{" "}
                            <span className="font-normal text-slate-400">
                              ({info.dayLabel})
                            </span>
                          </div>
                        </th>
                        {entryCourses.length === 0 ? (
                          <td className="border-l border-white/10 px-3 py-3 text-xs text-slate-500">
                            -
                          </td>
                        ) : (
                          entryCourses.map((c) => {
                            const cell = cellIndex.get(cellKey(c.id, iso));
                            return (
                              <td
                                key={c.id}
                                className={`min-w-[180px] border-l border-white/10 align-top px-3 py-3 ${
                                  isOff ? "opacity-60" : ""
                                }`}
                              >
                                {cell?.content ? (
                                  <span className="block whitespace-pre-wrap text-xs text-white">
                                    {cell.content}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-600">
                                    ·
                                  </span>
                                )}
                              </td>
                            );
                          })
                        )}
                        <td
                          className={`sticky right-0 z-10 min-w-[160px] border-l border-white/10 align-top backdrop-blur px-3 py-3 ${
                            isOff ? "bg-amber-300/10" : "bg-slate-950/80"
                          }`}
                        >
                          {isOff ? (
                            <span className="block text-[11px] font-bold text-amber-300">
                              휴강
                            </span>
                          ) : null}
                          {meta?.notes ? (
                            <span className="mt-0.5 block whitespace-pre-wrap text-[11px] text-slate-300">
                              {meta.notes}
                            </span>
                          ) : !isOff ? (
                            <span className="block text-[11px] text-slate-600">
                              -
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-500">
        {editMode
          ? "편집 모드에서는 진도표 페이지와 동일하게 셀 클릭으로 인라인 편집됩니다. 컬럼은 기록에 등장한 수업 + 현재 담당 수업의 합집합입니다."
          : "보기 모드입니다. 과거 기록을 수정하려면 우측 상단에서 편집 모드를 켜세요."}
      </p>
    </div>
  );
}
