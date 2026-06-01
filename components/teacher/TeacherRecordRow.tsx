"use client";

import { useState } from "react";
import {
  RecordDetail,
  formatKoreanDateTime,
  previewText,
  type TeacherRecordRowData,
} from "./recordShared";

export type { TeacherRecordRowData };

const COLUMN_COUNT = 6;

/** 데스크톱(lg+) 표의 한 행. 클릭하면 상세 행이 펼쳐진다. 모바일은 TeacherRecordCard 사용. */
export default function TeacherRecordRow({
  row,
}: {
  row: TeacherRecordRowData;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const reflection = row.reflection_data?.reflection?.trim() ?? "";

  return (
    <>
      <tr
        onClick={() => setIsExpanded((current) => !current)}
        className="cursor-pointer border-b border-white/5 align-top text-slate-300 transition hover:bg-white/5"
      >
        <td className="py-4 pr-4 font-semibold text-white">
          {row.students?.profiles?.name ?? "-"}
        </td>

        <td className="py-4 pr-4 text-slate-300">
          {row.student_code ?? row.student_number ?? "-"}
        </td>

        <td className="py-4 pr-4">
          {row.activities?.title ?? row.activity_slug ?? "-"}
          {row.locked_at ? (
            <span
              className="ml-2 rounded-full bg-amber-300/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200"
              title="마감됨"
            >
              🔒
            </span>
          ) : null}
        </td>

        <td className="py-4 pr-4">{row.subject ?? "-"}</td>

        <td className="py-4 pr-4 whitespace-nowrap">
          {formatKoreanDateTime(row.created_at)}
        </td>

        <td className="py-4 pr-4 text-slate-400">
          <span>{reflection ? previewText(reflection) : "-"}</span>
          <span className="ml-2 text-cyan-300">
            {isExpanded ? "▴ 접기" : "▾ 자세히"}
          </span>
        </td>
      </tr>

      {isExpanded ? (
        <tr className="border-b border-white/10 bg-slate-950/60">
          <td colSpan={COLUMN_COUNT} className="px-4 py-5">
            <RecordDetail row={row} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
