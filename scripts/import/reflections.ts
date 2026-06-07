/**
 * 레거시 성찰 import — 공통수학 + 확률통계 구글 시트(xlsx 다운로드) → legacy_reflections.
 *
 * 흐름:
 *   1) 각 시트의 .xlsx 한 번에 다운로드 (모든 탭 한꺼번에)
 *   2) 탭마다 = 활동 (탭 이름 = activity_label)
 *   3) 행마다:
 *      - 학번(5자리) 컬럼 → students.student_code → students.id 매칭
 *      - 의미 있는 답변(학번/이름/timestamp 제외)이 하나도 없으면 skip
 *      - timestamp 컬럼 → legacy_created_at (있으면)
 *      - 행 전체를 payload(jsonb) 그대로 보존 → 옛 형식 조회·AI 세특 입력에 활용
 *   4) 탭당 batch INSERT
 *
 * 실행:
 *   npx tsx scripts/import/reflections.ts --dry-run        # 미리 보기
 *   npx tsx scripts/import/reflections.ts                  # 실제 INSERT (append)
 *   npx tsx scripts/import/reflections.ts --reset          # 기존 legacy_reflections 전체 삭제 후 INSERT
 *
 * 의존: xlsx + dotenv (이미 설치됨).
 * 환경: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
import * as XLSX from "xlsx";

dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const RESET = process.argv.includes("--reset");

const SHEETS = [
  {
    id: "1HESVclXf1iBlKLHLYgj00eQkLfmOTb9tw763NEkjOgA",
    subject: "공통수학",
  },
  {
    id: "1GXT4sYZfsrJZUadiCYQ8l2Yfl265G0P8bkVM6vc60PA",
    subject: "확률과통계",
  },
];

// 학생/이름/시각 같은 메타 컬럼 — payload 의 의미 있는 답변 카운트에서 제외.
const META_COLUMNS = new Set(["학번", "이름", "timestamp", "Timestamp", "TIMESTAMP"]);

async function fetchWorkbook(sheetId: string): Promise<XLSX.WorkBook> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`xlsx fetch failed (${sheetId}): ${res.status}`);
  const buf = await res.arrayBuffer();
  return XLSX.read(buf, { type: "array" });
}

async function loadStudentMap(sb: SupabaseClient): Promise<Map<string, string>> {
  // students.student_code → students.id
  // 같은 student_code 가 여러 학년도에 있을 수 있어 가장 최근 학년도 우선.
  const { data } = await sb
    .from("students")
    .select("id, student_code, school_year")
    .order("school_year", { ascending: false });
  const m = new Map<string, string>();
  for (const r of (data ?? []) as Array<{
    id: string;
    student_code: string;
    school_year: number;
  }>) {
    // ascending: false 라 먼저 본 게 최근 학년도. 이후 같은 코드는 무시.
    if (!m.has(r.student_code)) m.set(r.student_code, r.id);
  }
  return m;
}

/** 엑셀 셀 → timestamp ISO 문자열. 인식 못 하면 null. */
function parseTimestamp(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) return raw.toISOString();
  // 숫자(엑셀 시리얼)
  if (typeof raw === "number") {
    // XLSX serial → JS Date
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) {
      const js = new Date(Date.UTC(d.y, d.m - 1, d.d, d.H, d.M, d.S));
      return js.toISOString();
    }
    return null;
  }
  const s = String(raw).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function importReflections() {
  console.log(`Mode: ${DRY_RUN ? "🔵 DRY-RUN (no DB writes)" : "🔴 LIVE (DB writes)"}`);
  console.log(`Reset: ${RESET ? "YES (먼저 wipe)" : "no (append)"}`);
  console.log(`Supabase: ${SUPABASE_URL}`);

  const sb = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (RESET) {
    if (DRY_RUN) {
      console.log("  [DRY] RESET 표시 (실제 wipe 안 함)");
    } else {
      const { error: delErr } = await sb
        .from("legacy_reflections")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (delErr) {
        console.error(`❌ RESET 실패: ${delErr.message}`);
        process.exit(1);
      }
      console.log("  🧹 legacy_reflections 전체 삭제 완료");
    }
  }

  const studentMap = await loadStudentMap(sb);
  console.log(`학생 매핑 ${studentMap.size}명 로드`);

  let totalOk = 0,
    totalUnmatched = 0,
    totalEmpty = 0,
    totalFail = 0;
  const unmatchedHakbeon = new Set<string>();

  for (const sheet of SHEETS) {
    console.log(`\n=== ${sheet.subject} (${sheet.id.slice(0, 8)}...) ===`);
    const wb = await fetchWorkbook(sheet.id);
    console.log(
      `탭 ${wb.SheetNames.length}개: ${wb.SheetNames.slice(0, 6).join(", ")}${
        wb.SheetNames.length > 6 ? ` (+${wb.SheetNames.length - 6})` : ""
      }`
    );

    for (const tabName of wb.SheetNames) {
      const ws = wb.Sheets[tabName];
      // raw:true → date object/number 보존 → parseTimestamp 가 처리
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: "",
      });
      if (rows.length === 0) continue;

      const batch: Array<{
        student_id: string;
        source_subject: string;
        activity_label: string;
        payload: Record<string, unknown>;
        legacy_created_at: string | null;
      }> = [];

      let okT = 0,
        unT = 0,
        empT = 0;

      for (const row of rows) {
        const hakbeonRaw = row["학번"];
        if (hakbeonRaw == null || hakbeonRaw === "") {
          empT++;
          continue;
        }
        // 숫자/문자열 모두 string 정규화 (앞 0 없음 — 학번은 1~3으로 시작)
        const hakbeon = String(hakbeonRaw).trim();
        const studentId = studentMap.get(hakbeon);
        if (!studentId) {
          unT++;
          unmatchedHakbeon.add(hakbeon);
          continue;
        }

        // 의미 있는 답변(메타 컬럼 제외) 있는지 확인
        const hasAnswer = Object.entries(row).some(([k, v]) => {
          if (META_COLUMNS.has(k)) return false;
          return String(v ?? "").trim() !== "";
        });
        if (!hasAnswer) {
          empT++;
          continue;
        }

        // payload 정규화 — 모든 값을 string 으로 (xlsx 의 Date/number 객체는 JSON 직렬화 시 문제)
        const payload: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          if (v == null || v === "") continue;
          if (v instanceof Date) payload[k] = v.toISOString();
          else payload[k] = String(v);
        }

        batch.push({
          student_id: studentId,
          source_subject: sheet.subject,
          activity_label: tabName,
          payload,
          legacy_created_at: parseTimestamp(row["timestamp"]),
        });
        okT++;
      }

      if (DRY_RUN) {
        if (okT > 0 || unT > 0) {
          console.log(
            `  [DRY] ${tabName}: ok=${okT}, unmatched=${unT}, empty=${empT}`
          );
        }
      } else if (batch.length > 0) {
        // 한 탭 batch INSERT — supabase는 1000개 이상이면 분할 권장하지만 보통 탭당 수십~수백
        const { error } = await sb.from("legacy_reflections").insert(batch);
        if (error) {
          console.log(`  ❌ ${tabName} insert 실패: ${error.message}`);
          totalFail += batch.length;
          okT = 0;
        } else {
          console.log(
            `  ✅ ${tabName}: ${okT}건 (unmatched=${unT}, empty=${empT})`
          );
        }
      } else if (unT > 0 || empT > 0) {
        console.log(
          `  ⏭ ${tabName}: 의미 있는 행 0 (unmatched=${unT}, empty=${empT})`
        );
      }

      totalOk += okT;
      totalUnmatched += unT;
      totalEmpty += empT;
    }
  }

  console.log("\n=== 요약 ===");
  console.log(`  ok=${totalOk}`);
  console.log(`  unmatched(학번 매칭 실패)=${totalUnmatched}`);
  console.log(`  empty(답변 없는 행)=${totalEmpty}`);
  console.log(`  fail=${totalFail}`);
  if (unmatchedHakbeon.size > 0) {
    console.log(`\n학번 매칭 실패 (distinct ${unmatchedHakbeon.size}개):`);
    console.log("  " + Array.from(unmatchedHakbeon).sort().join(", "));
  }
}

importReflections().catch((e) => {
  console.error(e);
  process.exit(1);
});
