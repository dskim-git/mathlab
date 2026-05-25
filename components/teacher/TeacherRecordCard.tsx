"use client";

import { useState } from "react";
import {
  RecordDetail,
  formatKoreanDateTime,
  previewText,
  type TeacherRecordRowData,
} from "./recordShared";

/** 모바일(lg 미만) 카드. 데스크톱 표(TeacherRecordRow)와 같은 데이터를 카드로 보여준다. */
export default function TeacherRecordCard({
  row,
}: {
  row: TeacherRecordRowData;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const reflection = row.reflection_data?.reflection?.trim() ?? "";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <p className="font-semibold text-white">
            {row.students?.profiles?.name ?? "-"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {row.activities?.title ?? row.activity_slug ?? "-"}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-cyan-300">
          {isExpanded ? "▴ 접기" : "▾ 자세히"}
        </span>
      </button>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-slate-400">학번</dt>
          <dd className="mt-1 text-slate-300">
            {row.student_code ?? row.student_number ?? "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">과목</dt>
          <dd className="mt-1 text-slate-300">{row.subject ?? "-"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-400">제출 시각</dt>
          <dd className="mt-1 text-slate-300">
            {formatKoreanDateTime(row.created_at)}
          </dd>
        </div>
      </dl>

      {isExpanded ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <RecordDetail row={row} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          {reflection ? previewText(reflection) : "성찰 내용 없음"}
        </p>
      )}
    </div>
  );
}
