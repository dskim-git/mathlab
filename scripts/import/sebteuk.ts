/**
 * 레거시 AI 세특 import — 공통수학 + 확률통계 성찰 스프레드시트의
 * "세특기록" 탭(저장시각, 학번, 이름, 세특) → sebteuk_drafts (학생당 1행).
 *
 * 옛 streamlit (sebteuk_utils.save_final_sebteuk) 은 학번 기준 upsert 라
 * 시트엔 학생당 1행만 누적. 같은 학생이 두 과목 다 있는 경우는 드물지만
 * (학년 분기), 있으면 body 에 "[공통수학]\n...\n\n[확률과통계]\n..." 형식으로 합친다.
 *
 * 매핑:
 *   - 학번(9자리) → students.student_login_id → students.id
 *   - school_year = 학번 첫 4자리
 *   - teacher_id   = daesobi (profiles.login_id='daesobi')
 *   - body         = 한 과목만이면 "[과목]\n<세특>", 두 과목이면 둘 다 합침
 *   - status       = 'finalized'
 *   - finalized_at = 두 과목 중 가장 최근 저장시각 (created_at 동일)
 *
 * 실행:
 *   npx tsx scripts/import/sebteuk.ts --dry-run
 *   npx tsx scripts/import/sebteuk.ts
 *   npx tsx scripts/import/sebteuk.ts --reset   # daesobi 의 기존 sebteuk_drafts wipe 후 INSERT
 *
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
  console.error("❌ env 필요");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const RESET = process.argv.includes("--reset");

const DAESOBI_LOGIN_ID = "daesobi";
const TAB = "세특기록";

const SHEETS = [
  { id: "1HESVclXf1iBlKLHLYgj00eQkLfmOTb9tw763NEkjOgA", subject: "공통수학" },
  { id: "1GXT4sYZfsrJZUadiCYQ8l2Yfl265G0P8bkVM6vc60PA", subject: "확률과통계" },
];

async function fetchWorkbook(sheetId: string): Promise<XLSX.WorkBook> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`xlsx fetch failed (${sheetId}): ${res.status}`);
  return XLSX.read(await res.arrayBuffer(), { type: "array" });
}

function parseTimestamp(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === "number") {
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) return new Date(Date.UTC(d.y, d.m - 1, d.d, d.H, d.M, d.S)).toISOString();
    return null;
  }
  const d = new Date(String(raw).trim());
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function getDaesobiProfileId(sb: SupabaseClient): Promise<string> {
  const { data } = await sb
    .from("profiles")
    .select("id")
    .eq("login_id", DAESOBI_LOGIN_ID)
    .maybeSingle();
  const id = (data as { id: string } | null)?.id;
  if (!id) throw new Error("daesobi 계정 없음");
  return id;
}

/** 학번(9자리: student_login_id) + 학번(5자리: student_code) 둘 다 키로 등록. */
async function loadStudentMap(
  sb: SupabaseClient
): Promise<Map<string, { id: string; school_year: number }>> {
  const { data } = await sb
    .from("students")
    .select("id, student_login_id, student_code, school_year")
    .order("school_year", { ascending: false });
  const m = new Map<string, { id: string; school_year: number }>();
  for (const r of (data ?? []) as Array<{
    id: string;
    student_login_id: string;
    student_code: string;
    school_year: number;
  }>) {
    if (r.student_login_id && !m.has(r.student_login_id))
      m.set(r.student_login_id, { id: r.id, school_year: r.school_year });
    if (r.student_code && !m.has(r.student_code))
      m.set(r.student_code, { id: r.id, school_year: r.school_year });
  }
  return m;
}

type Collected = {
  student_id: string;
  school_year: number;
  parts: Array<{ subject: string; body: string; finalized_at: string | null }>;
};

async function main() {
  console.log(`Mode: ${DRY_RUN ? "🔵 DRY-RUN" : "🔴 LIVE"}`);
  console.log(`Reset: ${RESET ? "YES" : "no"}`);

  const sb = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const daesobiId = await getDaesobiProfileId(sb);
  console.log(`daesobi profile_id = ${daesobiId}`);

  const studentMap = await loadStudentMap(sb);
  console.log(`students 로드: ${studentMap.size}건 (login_id+code 키)`);

  if (RESET && !DRY_RUN) {
    console.log("\n🧹 RESET — daesobi 의 sebteuk_drafts wipe");
    const { error } = await sb
      .from("sebteuk_drafts")
      .delete()
      .eq("teacher_id", daesobiId);
    if (error) console.log(`  ❌ ${error.message}`);
    else console.log("  ✅ done");
  }

  // 학생당 누적
  const collected = new Map<string, Collected>();
  const unmatched = new Set<string>();

  for (const sheet of SHEETS) {
    console.log(`\n=== ${sheet.subject} (${sheet.id}) ===`);
    const wb = await fetchWorkbook(sheet.id);
    const ws = wb.Sheets[TAB];
    if (!ws) {
      console.log(`  ⚠ ${TAB} 탭 없음 — skip`);
      continue;
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
    });
    console.log(`  ${rows.length} 행`);

    let matched = 0;
    for (const row of rows) {
      const studentNum = String(row["학번"] ?? "").trim();
      const body = String(row["세특"] ?? "").trim();
      if (!studentNum || !body) continue;
      const found = studentMap.get(studentNum);
      if (!found) {
        unmatched.add(studentNum);
        continue;
      }
      matched++;
      const finalized_at = parseTimestamp(row["저장시각"]);
      const cur = collected.get(found.id) ?? {
        student_id: found.id,
        school_year: found.school_year,
        parts: [],
      };
      cur.parts.push({ subject: sheet.subject, body, finalized_at });
      collected.set(found.id, cur);
    }
    console.log(`  매칭 ${matched}건 (unmatched 학번 누적 ${unmatched.size}건)`);
  }

  if (unmatched.size > 0) {
    const list = Array.from(unmatched).sort().slice(0, 20);
    console.log(
      `\n⚠ unmatched 학번 ${unmatched.size}건: ${list.join(", ")}${unmatched.size > 20 ? " ..." : ""}`
    );
  }

  console.log(`\n=== 합산 결과 ===`);
  console.log(`  학생 수: ${collected.size}명`);
  const bothCount = Array.from(collected.values()).filter(
    (c) => c.parts.length >= 2
  ).length;
  console.log(`  두 과목 다 있는 학생: ${bothCount}명`);

  // sebteuk_drafts 배치
  const batch: Array<{
    teacher_id: string;
    student_id: string;
    school_year: number;
    body: string;
    status: "finalized";
    finalized_at: string | null;
  }> = [];

  for (const c of collected.values()) {
    // body 합치기 — 과목별 섹션
    const body = c.parts
      .map((p) => `[${p.subject}]\n${p.body}`)
      .join("\n\n");
    // finalized_at = 최신
    const latest =
      c.parts
        .map((p) => p.finalized_at)
        .filter((t): t is string => !!t)
        .sort()
        .slice(-1)[0] ?? null;
    batch.push({
      teacher_id: daesobiId,
      student_id: c.student_id,
      school_year: c.school_year,
      body,
      status: "finalized",
      finalized_at: latest,
    });
  }

  console.log(`  배치 ${batch.length}건`);
  if (DRY_RUN || batch.length === 0) {
    console.log("\n✅ DRY-RUN 종료");
    return;
  }

  // INSERT (unique 제약 없음 — RESET 안 하면 중복 누적 가능)
  const { error } = await sb.from("sebteuk_drafts").insert(batch);
  if (error) console.log(`  ❌ ${error.message}`);
  else console.log(`  ✅ ${batch.length}건 INSERT`);

  console.log("\n✅ 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
