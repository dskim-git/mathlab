"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCurrentSchoolYear } from "@/lib/settings/schoolYear";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

type RosterRow = {
  id: string;
  school_year: number;
  grade: number;
  class_number: number;
  student_number: number;
  student_code: string;
  name: string;
};

type ParsedRow = {
  grade: number;
  class_number: number;
  student_number: number;
  student_code: string;
  name: string;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

// CSV(또는 탭) 형식: 학년, 반, 번호, 이름  (헤더 줄은 자동으로 건너뜀)
function parseRosterText(text: string): {
  rows: ParsedRow[];
  errors: string[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const cols = line.split(/[,\t]/).map((c) => c.trim());

    // 첫 줄의 첫 칸이 숫자가 아니면 헤더로 보고 건너뛴다.
    if (index === 0 && cols[0] && Number.isNaN(Number(cols[0]))) {
      return;
    }

    const [gradeStr, classStr, numberStr, name] = cols;
    const grade = Number(gradeStr);
    const classNumber = Number(classStr);
    const studentNumber = Number(numberStr);

    if (
      !Number.isInteger(grade) ||
      grade <= 0 ||
      !Number.isInteger(classNumber) ||
      classNumber <= 0 ||
      !Number.isInteger(studentNumber) ||
      studentNumber <= 0 ||
      !name
    ) {
      errors.push(`${index + 1}행 형식 오류: "${line}"`);
      return;
    }

    rows.push({
      grade,
      class_number: classNumber,
      student_number: studentNumber,
      student_code: `${grade}${pad2(classNumber)}${pad2(studentNumber)}`,
      name,
    });
  });

  return { rows, errors };
}

export default function AdminRosterPage() {
  const [schoolYear, setSchoolYear] = useState("");
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  // 행별 ✕ 삭제 — confirm 으로 1번 더 확인.
  async function handleDeleteRow(row: RosterRow) {
    const label = `${row.student_code} ${row.name} (${row.grade}학년 ${row.class_number}반 ${row.student_number}번)`;
    const ok = confirm(
      `명렬표에서 영구 삭제할까요?\n${label}\n\n주의: 이 학생이 이미 회원가입한 상태라면 student_roster 행만 사라지고 학생 계정(profiles/students)은 그대로 남습니다. 계정도 함께 정리하려면 회원관리에서 별도 삭제하세요.`
    );
    if (!ok) return;
    setErrorMessage("");
    setMessage("");
    const { error } = await supabase
      .from("student_roster")
      .delete()
      .eq("id", row.id);
    if (error) {
      setErrorMessage(`삭제 오류: ${error.message}`);
      return;
    }
    setMessage(`삭제: ${label}`);
    // 표 갱신
    setRoster((prev) => prev.filter((r) => r.id !== row.id));
  }

  const loadRoster = useCallback(async (year: number) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("student_roster")
      .select("id, school_year, grade, class_number, student_number, student_code, name")
      .eq("school_year", year)
      .order("grade")
      .order("class_number")
      .order("student_number");

    if (error) {
      setErrorMessage(`명렬표 조회 오류: ${error.message}`);
      setRoster([]);
    } else {
      setRoster((data ?? []) as RosterRow[]);
    }
    setIsLoading(false);
  }, []);

  // 최초 진입 시 관리자 설정의 현재 학년도를 기본값으로 채운다.
  useEffect(() => {
    getCurrentSchoolYear().then((year) => setSchoolYear(String(year)));
  }, []);

  useEffect(() => {
    const year = Number(schoolYear);
    if (Number.isInteger(year) && year > 0) {
      loadRoster(year);
    }
  }, [schoolYear, loadRoster]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    setMessage("");
    setErrorMessage("");
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const text = await file.text();
    const { rows, errors } = parseRosterText(text);
    setParsed(rows);
    setParseErrors(errors);
  }

  async function handleUpload() {
    setMessage("");
    setErrorMessage("");

    const year = Number(schoolYear);
    if (!Number.isInteger(year) || year <= 0) {
      setErrorMessage("학년도를 올바르게 입력해 주세요.");
      return;
    }
    if (parsed.length === 0) {
      setErrorMessage("적재할 데이터가 없습니다. CSV 파일을 먼저 선택해 주세요.");
      return;
    }

    setIsBusy(true);

    const payload = parsed.map((row) => ({ ...row, school_year: year }));
    // ignoreDuplicates: 기존 (학년도+학번) 행은 건드리지 않고, 새 학생만 추가한다.
    const { data, error } = await supabase
      .from("student_roster")
      .upsert(payload, {
        onConflict: "school_year,student_code",
        ignoreDuplicates: true,
      })
      .select("id");

    setIsBusy(false);

    if (error) {
      setErrorMessage(`적재 중 오류: ${error.message}`);
      return;
    }

    const insertedCount = data?.length ?? 0;
    const skippedCount = parsed.length - insertedCount;
    setMessage(
      `새로 ${insertedCount}건 추가, 기존 ${skippedCount}건은 건너뛰었습니다.`
    );
    setParsed([]);
    setParseErrors([]);
    setFileName("");
    loadRoster(year);
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <Card className="mx-auto max-w-5xl p-6 sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">관리자 대시보드</p>

        <h1 className="mt-3 text-3xl font-bold">명렬표(재학생 명단) 관리</h1>

        <p className="mt-4 leading-7 text-slate-300">
          학생 회원가입은 이 명렬표의 학번·이름과 일치해야 가능합니다. CSV로 일괄
          업로드합니다.
        </p>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label
                htmlFor="roster-school-year"
                className="block text-xs font-semibold text-slate-300"
              >
                학년도
              </label>
              <input
                id="roster-school-year"
                type="number"
                value={schoolYear}
                onChange={(event) => setSchoolYear(event.target.value)}
                className="mt-1 w-28 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
              />
            </div>

            <div>
              <label
                htmlFor="roster-csv-file"
                className="block text-xs font-semibold text-slate-300"
              >
                CSV 파일 (학년, 반, 번호, 이름)
              </label>
              <input
                id="roster-csv-file"
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFile}
                className="mt-1 block text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-cyan-200"
              />
            </div>

            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isBusy || parsed.length === 0}
            >
              {isBusy ? "적재 중..." : `적재 (${parsed.length}건)`}
            </Button>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            예시(한 줄에 한 명): <code className="text-slate-300">2,6,2,홍길동</code> →
            학번 <code className="text-slate-300">20602</code> (학년1+반2+번호2). 첫 줄이
            머리글이면 자동으로 건너뜁니다.
          </p>

          {fileName ? (
            <p className="mt-2 text-sm text-slate-300">
              선택한 파일: <span className="font-semibold">{fileName}</span> — 인식{" "}
              <span className="font-bold text-cyan-300">{parsed.length}</span>건
              {parseErrors.length > 0 ? (
                <span className="text-red-300">
                  {" "}
                  / 오류 {parseErrors.length}건
                </span>
              ) : null}
            </p>
          ) : null}

          {parseErrors.length > 0 ? (
            <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-xs text-red-200">
              {parseErrors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          ) : null}

          {message ? (
            <Alert tone="success" className="mt-3">
              {message}
            </Alert>
          ) : null}

          {errorMessage ? (
            <Alert tone="error" className="mt-3">
              {errorMessage}
            </Alert>
          ) : null}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {schoolYear}학년도 명렬표
            </h2>
            <span className="text-sm text-slate-400">
              총 <span className="font-bold text-cyan-300">{roster.length}</span>명
            </span>
          </div>

          {isLoading ? (
            <p className="mt-4 text-slate-300">불러오는 중...</p>
          ) : roster.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400">
              등록된 명렬표가 없습니다.
            </div>
          ) : (
            <div className="mt-4 max-h-96 overflow-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-slate-300">
                    <th className="py-2 pr-4">학번</th>
                    <th className="py-2 pr-4">학년</th>
                    <th className="py-2 pr-4">반</th>
                    <th className="py-2 pr-4">번호</th>
                    <th className="py-2 pr-4">이름</th>
                    <th className="py-2 pr-2 text-right" scope="col">
                      <span className="sr-only">삭제</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((row) => (
                    <tr key={row.id} className="border-b border-white/5 text-slate-300">
                      <td className="py-2 pr-4 font-semibold text-white">
                        {row.student_code}
                      </td>
                      <td className="py-2 pr-4">{row.grade}</td>
                      <td className="py-2 pr-4">{row.class_number}</td>
                      <td className="py-2 pr-4">{row.student_number}</td>
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 pr-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row)}
                          aria-label={`${row.name} 명렬표 삭제`}
                          className="rounded border border-rose-300/30 px-2 py-0.5 text-[11px] font-semibold text-rose-200 transition hover:bg-rose-300/10"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Card>
    </main>
  );
}
