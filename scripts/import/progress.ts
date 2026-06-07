/**
 * 레거시 진도표 시트 import — 4개 탭 → 새 앱 테이블.
 *
 *   진도표      → progress_tracker (teacher=daesobi)
 *   시간표설정  → daily_class_overrides (action='add', teacher=daesobi)
 *   방문기록    → login_logs (profile_id, log_date upsert)
 *   세특사용량  → ai_usage_log (teacher=daesobi)
 *
 * 학반 컬럼 형식: "1학년 9반 (공통수)" / "2학년 9반 (확률과통)"
 * → grade/class_number 추출 + 약어 → subjects 마스터 이름 매핑.
 *
 * 실행:
 *   npx tsx scripts/import/progress.ts --dry-run
 *   npx tsx scripts/import/progress.ts
 *   npx tsx scripts/import/progress.ts --reset           # 4 테이블 모두 wipe (daesobi 행만)
 *   npx tsx scripts/import/progress.ts --only=progress   # 특정 탭만
 *
 * 환경: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
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
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? onlyArg.slice("--only=".length) : null;
// null = 전부 / "progress" "schedule" "visits" "sebteuk"

const PROGRESS_SHEET_ID = "13dDQ4LAHfOA4poxhD6IZ8RI3OkTrryGOUOjNRAzMhOo";
const SCHOOL_YEAR = 2026;
const DAESOBI_LOGIN_ID = "daesobi";

const TAB_PROGRESS = "진도표";
const TAB_SCHEDULE = "시간표설정";
const TAB_VISITS = "방문기록";
const TAB_SEBTEUK = "세특사용량";

async function fetchWorkbook(sheetId: string): Promise<XLSX.WorkBook> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`xlsx fetch failed: ${res.status}`);
  return XLSX.read(await res.arrayBuffer(), { type: "array" });
}

/** 학반 컬럼명 → {grade, classNumber, subject} */
function parseClassHeader(
  header: string
): { grade: number; classNumber: number; subject: string } | null {
  const m = header.match(/^\s*(\d+)\s*학년\s*(\d+)\s*반\s*\(([^)]+)\)/);
  if (!m) return null;
  const grade = Number(m[1]);
  const classNumber = Number(m[2]);
  const rawSubj = m[3].trim();
  // 약어 → subjects 마스터 이름.
  let subject: string;
  if (/공통수/.test(rawSubj)) {
    subject = grade === 1 ? "공통수학1" : "공통수학2";
  } else if (/확률.*통/.test(rawSubj) || /확통/.test(rawSubj)) {
    subject = "확률과통계";
  } else if (/대수/.test(rawSubj)) {
    subject = "대수";
  } else if (/미적/.test(rawSubj)) {
    subject = grade === 1 ? "미적분1" : "미적분2";
  } else if (/기하/.test(rawSubj)) {
    subject = "기하";
  } else if (/경제/.test(rawSubj)) {
    subject = "경제수학";
  } else if (/영재/.test(rawSubj)) {
    subject = "영재";
  } else {
    subject = rawSubj;
  }
  return { grade, classNumber, subject };
}

/** 엑셀 셀 → ISO timestamp. 인식 못 하면 null. */
function parseTimestamp(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === "number") {
    const d = XLSX.SSF.parse_date_code(raw);
    if (d) {
      const js = new Date(Date.UTC(d.y, d.m - 1, d.d, d.H, d.M, d.S));
      return js.toISOString();
    }
    return null;
  }
  const d = new Date(String(raw).trim());
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** 엑셀 셀 → 'YYYY-MM-DD' */
function parseDate(raw: unknown): string | null {
  const iso = parseTimestamp(raw);
  return iso ? iso.slice(0, 10) : null;
}

async function getDaesobiProfileId(sb: SupabaseClient): Promise<string> {
  const { data } = await sb
    .from("profiles")
    .select("id")
    .eq("login_id", DAESOBI_LOGIN_ID)
    .maybeSingle();
  const id = (data as { id: string } | null)?.id;
  if (!id) throw new Error(`daesobi 계정 없음 — users import 먼저`);
  return id;
}

// ═════════════════════════════════════════════════════════════
// 1) 진도표 → progress_tracker
// ═════════════════════════════════════════════════════════════
async function importProgress(sb: SupabaseClient, daesobiId: string, ws: XLSX.WorkSheet) {
  console.log("\n=== 진도표 → progress_tracker ===");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  if (rows.length === 0) {
    console.log("  ⚠ 데이터 없음");
    return;
  }
  // 헤더 (첫 행의 키 순서)
  const headers =
    (XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })[0] as unknown[]).map(
      (h) => String(h ?? "").trim()
    );
  const classCols = headers
    .map((h) => ({ h, parsed: parseClassHeader(h) }))
    .filter((x): x is { h: string; parsed: ReturnType<typeof parseClassHeader> & {} } => x.parsed != null);
  console.log(`  학반 컬럼 ${classCols.length}개: ${classCols.map((c) => c.h).join(", ")}`);

  const batch: Array<{
    teacher_id: string;
    school_year: number;
    date: string;
    grade: number;
    class_number: number;
    subject: string;
    lesson_topic: string;
    notes: string;
  }> = [];

  for (const row of rows) {
    const date = parseDate(row["날짜"]);
    if (!date) continue;
    const memo = String(row["비고"] ?? "").trim();
    for (const cc of classCols) {
      const topic = String(row[cc.h] ?? "").trim();
      if (!topic) continue;
      batch.push({
        teacher_id: daesobiId,
        school_year: SCHOOL_YEAR,
        date,
        grade: cc.parsed.grade,
        class_number: cc.parsed.classNumber,
        subject: cc.parsed.subject,
        lesson_topic: topic,
        notes: memo,
      });
    }
  }

  console.log(`  배치 ${batch.length}건`);
  if (DRY_RUN || batch.length === 0) return;
  // unique (teacher,date,grade,class,subject) — 중복 시 ignore. supabase 는 upsert ignoreDuplicates.
  const { error } = await sb
    .from("progress_tracker")
    .upsert(batch, {
      onConflict: "teacher_id,date,grade,class_number,subject",
      ignoreDuplicates: true,
    });
  if (error) console.log(`  ❌ ${error.message}`);
  else console.log(`  ✅ ${batch.length}건 (중복 시 ignore)`);
}

// ═════════════════════════════════════════════════════════════
// 2) 시간표설정 → daily_class_overrides
// ═════════════════════════════════════════════════════════════
async function importSchedule(sb: SupabaseClient, daesobiId: string, ws: XLSX.WorkSheet) {
  console.log("\n=== 시간표설정 → daily_class_overrides ===");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  const batch: Array<{
    teacher_id: string;
    date: string;
    grade: number;
    class_number: number;
    subject: string;
    action: "add";
  }> = [];
  let skip = 0;
  for (const row of rows) {
    const date = parseDate(row["날짜"]);
    if (!date) continue;
    const className = String(row["수업반"] ?? "").trim();
    if (!className) {
      skip++;
      continue;
    }
    const parsed = parseClassHeader(className);
    if (!parsed) {
      skip++;
      continue;
    }
    batch.push({
      teacher_id: daesobiId,
      date,
      grade: parsed.grade,
      class_number: parsed.classNumber,
      subject: parsed.subject,
      action: "add",
    });
  }
  console.log(`  배치 ${batch.length}건 (빈 행 skip ${skip})`);
  if (DRY_RUN || batch.length === 0) return;
  const { error } = await sb
    .from("daily_class_overrides")
    .upsert(batch, {
      onConflict: "teacher_id,date,grade,class_number,subject",
      ignoreDuplicates: true,
    });
  if (error) console.log(`  ❌ ${error.message}`);
  else console.log(`  ✅ ${batch.length}건`);
}

// ═════════════════════════════════════════════════════════════
// 3) 방문기록 → login_logs (날짜 dedupe upsert)
// ═════════════════════════════════════════════════════════════
async function importVisits(sb: SupabaseClient, ws: XLSX.WorkSheet) {
  console.log("\n=== 방문기록 → login_logs (일자별 dedupe) ===");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  // login_id → profile_id 매핑 (전체 profiles fetch)
  const { data: profs } = await sb
    .from("profiles")
    .select("id, login_id");
  const idMap = new Map<string, string>();
  for (const p of (profs ?? []) as Array<{ id: string; login_id: string }>) {
    idMap.set(p.login_id, p.id);
  }

  const uniqueKey = new Set<string>();
  const batch: Array<{
    profile_id: string;
    log_date: string;
    logged_at: string;
  }> = [];
  let unmatched = 0;
  const unmatchedIds = new Set<string>();

  for (const row of rows) {
    const visitedAt = parseTimestamp(row["방문시각"]);
    const loginId = String(row["아이디"] ?? "").trim();
    if (!visitedAt || !loginId) continue;
    const pid = idMap.get(loginId);
    if (!pid) {
      unmatched++;
      unmatchedIds.add(loginId);
      continue;
    }
    const logDate = visitedAt.slice(0, 10);
    const key = `${pid}::${logDate}`;
    if (uniqueKey.has(key)) continue; // 같은 사용자·날짜 중복 skip
    uniqueKey.add(key);
    batch.push({ profile_id: pid, log_date: logDate, logged_at: visitedAt });
  }
  console.log(`  unique ${batch.length}건 (unmatched login_id ${unmatched}건)`);
  if (unmatchedIds.size > 0) {
    console.log(
      `  unmatched id (${unmatchedIds.size}): ${Array.from(unmatchedIds).sort().slice(0, 20).join(", ")}${unmatchedIds.size > 20 ? " ..." : ""}`
    );
  }
  if (DRY_RUN || batch.length === 0) return;
  const { error } = await sb
    .from("login_logs")
    .upsert(batch, {
      onConflict: "profile_id,log_date",
      ignoreDuplicates: true,
    });
  if (error) console.log(`  ❌ ${error.message}`);
  else console.log(`  ✅ ${batch.length}건`);
}

// ═════════════════════════════════════════════════════════════
// 4) 세특사용량 → ai_usage_log
// ═════════════════════════════════════════════════════════════
async function importSebteukUsage(sb: SupabaseClient, daesobiId: string, ws: XLSX.WorkSheet) {
  console.log("\n=== 세특사용량 → ai_usage_log ===");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  const batch: Array<{
    teacher_id: string;
    feature: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_write_tokens: number;
    created_at: string;
  }> = [];
  for (const row of rows) {
    const createdAt = parseTimestamp(row["일시"]);
    if (!createdAt) continue;
    const model = String(row["모델"] ?? "").trim();
    if (!model) continue;
    batch.push({
      teacher_id: daesobiId,
      feature: "sebteuk",
      model,
      input_tokens: Number(row["입력토큰"] ?? 0) || 0,
      output_tokens: Number(row["출력토큰"] ?? 0) || 0,
      cache_read_tokens: Number(row["캐시읽기"] ?? 0) || 0,
      cache_write_tokens: Number(row["캐시쓰기"] ?? 0) || 0,
      created_at: createdAt,
    });
  }
  console.log(`  배치 ${batch.length}건`);
  if (DRY_RUN || batch.length === 0) return;
  // ai_usage_log 에는 unique 제약 없음 — 중복 import 가능. RESET 으로 wipe 후 INSERT 권장.
  const { error } = await sb.from("ai_usage_log").insert(batch);
  if (error) console.log(`  ❌ ${error.message}`);
  else console.log(`  ✅ ${batch.length}건`);
}

// ═════════════════════════════════════════════════════════════
// 메인
// ═════════════════════════════════════════════════════════════
async function main() {
  console.log(`Mode: ${DRY_RUN ? "🔵 DRY-RUN" : "🔴 LIVE"}`);
  console.log(`Reset: ${RESET ? "YES" : "no"}`);
  console.log(`Only: ${ONLY ?? "all"}`);
  const sb = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const daesobiId = await getDaesobiProfileId(sb);
  console.log(`daesobi profile_id = ${daesobiId}`);

  if (RESET && !DRY_RUN) {
    console.log("\n🧹 RESET — daesobi 의 progress/schedule/sebteuk + 모든 login_logs wipe");
    await sb.from("progress_tracker").delete().eq("teacher_id", daesobiId);
    await sb.from("daily_class_overrides").delete().eq("teacher_id", daesobiId);
    await sb.from("ai_usage_log").delete().eq("teacher_id", daesobiId);
    // login_logs 는 dedupe upsert 라 굳이 wipe 안 함.
  }

  const wb = await fetchWorkbook(PROGRESS_SHEET_ID);
  console.log(`\n탭: ${wb.SheetNames.join(", ")}`);

  if (ONLY === null || ONLY === "progress") {
    const ws = wb.Sheets[TAB_PROGRESS];
    if (ws) await importProgress(sb, daesobiId, ws);
    else console.log(`⚠ ${TAB_PROGRESS} 탭 없음`);
  }
  if (ONLY === null || ONLY === "schedule") {
    const ws = wb.Sheets[TAB_SCHEDULE];
    if (ws) await importSchedule(sb, daesobiId, ws);
    else console.log(`⚠ ${TAB_SCHEDULE} 탭 없음`);
  }
  if (ONLY === null || ONLY === "visits") {
    const ws = wb.Sheets[TAB_VISITS];
    if (ws) await importVisits(sb, ws);
    else console.log(`⚠ ${TAB_VISITS} 탭 없음`);
  }
  if (ONLY === null || ONLY === "sebteuk") {
    const ws = wb.Sheets[TAB_SEBTEUK];
    if (ws) await importSebteukUsage(sb, daesobiId, ws);
    else console.log(`⚠ ${TAB_SEBTEUK} 탭 없음`);
  }

  console.log("\n✅ 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
