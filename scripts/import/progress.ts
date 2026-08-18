/**
 * 레거시 진도표 시트 import — 4개 탭 → 새 앱 테이블.
 *
 *   진도표      → progress_tracker (teacher=daesobi)
 *   시간표설정  → daily_class_overrides (action='add', teacher=daesobi)
 *   방문기록    → login_logs (profile_id, log_date upsert)
 *   세특사용량  → ai_usage_log (teacher=daesobi)
 *
 * 학반 컬럼 형식: "1학년 9반 (공통수)" / "2학년 9반 (확률과통)"
 * → grade/class_number 추출 + 약어 → subjects 마스터 이름 매핑
 * → 그 (교과·학년·반) 으로 courses(개설 수업) 를 찾아 course_id 로 저장한다.
 *   (진도·시간표 테이블의 키가 course_id 기준으로 바뀌었다 — 20260816_progress_by_course.sql)
 *   개설 수업이 없는 학반은 넣을 수 없으므로 건너뛰고 목록으로 보고한다.
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
// null = 전부 / "progress" "daymeta" "schedule" "visits" "sebteuk" "permissions" "weekly"

const PROGRESS_SHEET_ID = "13dDQ4LAHfOA4poxhD6IZ8RI3OkTrryGOUOjNRAzMhOo";
const SCHOOL_YEAR = 2026;
// 레거시 시트는 2026학년도 1학기 자료다. 20260816_progress_by_course.sql 의
// 백필도 같은 (2026, 1) 기준이라 여기에 맞춘다.
const SEMESTER = 1;
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
// 수업(course) 매핑
// ═════════════════════════════════════════════════════════════
// 20260816_progress_by_course.sql 이후 progress_tracker / daily_class_overrides /
// weekly_schedule 의 유일성 키는 course_id 기준이다. 옛 키
// (grade, class_number, subject) 제약은 삭제됐으므로 그대로 upsert 하면
// 42P10 (no unique or exclusion constraint matching the ON CONFLICT specification)
// 이 난다. 시트의 학반·교과를 개설 수업으로 먼저 해석한 뒤 course_id 로 넣는다.

/** `${subject}-${grade}-${classNumber}` — 시트 학반 ↔ 수업 매칭 키 */
function courseKey(subject: string, grade: number, classNumber: number) {
  return `${subject}-${grade}-${classNumber}`;
}

async function loadCourseMap(sb: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await sb
    .from("courses")
    .select("id, subject, grade, class_number")
    .eq("school_year", SCHOOL_YEAR)
    .eq("semester", SEMESTER);
  if (error) throw new Error(`courses 조회 실패: ${error.message}`);
  const m = new Map<string, string>();
  for (const c of (data ?? []) as Array<{
    id: string;
    subject: string;
    grade: number | null;
    class_number: number | null;
  }>) {
    if (c.grade == null || c.class_number == null) continue; // 학반 없는 선택 수업은 시트에 없다
    m.set(courseKey(c.subject, c.grade, c.class_number), c.id);
  }
  console.log(`수업 매핑 ${m.size}건 (${SCHOOL_YEAR}학년도 ${SEMESTER}학기)`);
  return m;
}

/** 매칭 실패한 학반을 한 번에 모아 보고 — 개설 수업이 없으면 그 행은 넣을 수 없다. */
function reportUnmatched(unmatched: Map<string, number>) {
  if (unmatched.size === 0) return;
  console.log(`  ⚠ 개설 수업 미매칭 ${unmatched.size}종 — 해당 행은 건너뜀`);
  for (const [key, count] of unmatched) {
    console.log(`     ${key} (${count}건)`);
  }
  console.log(`     → 관리자 화면에서 수업을 개설한 뒤 다시 실행하세요.`);
}

// ═════════════════════════════════════════════════════════════
// 1) 진도표 → progress_tracker
// ═════════════════════════════════════════════════════════════
async function importProgress(
  sb: SupabaseClient,
  daesobiId: string,
  ws: XLSX.WorkSheet,
  courseMap: Map<string, string>
) {
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

  // 교과·학년·반은 DB 트리거가 course 에서 채운다 — course_id 만 보내면 된다.
  const batch: Array<{
    teacher_id: string;
    school_year: number;
    date: string;
    course_id: string;
    lesson_topic: string;
    notes: string;
  }> = [];
  const unmatched = new Map<string, number>();

  for (const row of rows) {
    const date = parseDate(row["날짜"]);
    if (!date) continue;
    for (const cc of classCols) {
      const topic = String(row[cc.h] ?? "").trim();
      if (!topic) continue;
      const key = courseKey(cc.parsed.subject, cc.parsed.grade, cc.parsed.classNumber);
      const courseId = courseMap.get(key);
      if (!courseId) {
        unmatched.set(key, (unmatched.get(key) ?? 0) + 1);
        continue;
      }
      batch.push({
        teacher_id: daesobiId,
        school_year: SCHOOL_YEAR,
        date,
        course_id: courseId,
        lesson_topic: topic,
        notes: "", // 비고는 daily_schedule_meta 로 분리 (importDailyMeta)
      });
    }
  }

  console.log(`  배치 ${batch.length}건`);
  reportUnmatched(unmatched);
  if (DRY_RUN || batch.length === 0) return;
  // unique (teacher,date,course) — 중복 시 ignore. supabase 는 upsert ignoreDuplicates.
  const { error } = await sb
    .from("progress_tracker")
    .upsert(batch, {
      onConflict: "teacher_id,date,course_id",
      ignoreDuplicates: true,
    });
  if (error) console.log(`  ❌ ${error.message}`);
  else console.log(`  ✅ ${batch.length}건 (중복 시 ignore)`);
}

// ═════════════════════════════════════════════════════════════
// 1b) 진도표 시트 비고 → daily_schedule_meta (일자별 단일)
//      시트의 "비고" 컬럼은 한 일자에 하나 — 모든 학반에 동일 적용되는
//      날짜 단위 메모이므로 daily_schedule_meta.notes 로 저장한다.
// ═════════════════════════════════════════════════════════════
async function importDailyMeta(sb: SupabaseClient, daesobiId: string, ws: XLSX.WorkSheet) {
  console.log("\n=== 진도표 비고 → daily_schedule_meta (일자별) ===");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  const seen = new Set<string>();
  const batch: Array<{
    teacher_id: string;
    date: string;
    is_off: boolean;
    notes: string;
  }> = [];
  for (const row of rows) {
    const date = parseDate(row["날짜"]);
    if (!date) continue;
    const memo = String(row["비고"] ?? "").trim();
    if (!memo) continue;
    if (seen.has(date)) continue;
    seen.add(date);
    batch.push({ teacher_id: daesobiId, date, is_off: false, notes: memo });
  }
  console.log(`  배치 ${batch.length}건 (일자별 단일)`);
  if (DRY_RUN || batch.length === 0) return;
  const { error } = await sb
    .from("daily_schedule_meta")
    .upsert(batch, { onConflict: "teacher_id,date" });
  if (error) console.log(`  ❌ ${error.message}`);
  else console.log(`  ✅ ${batch.length}건`);
}

// ═════════════════════════════════════════════════════════════
// 2) 시간표설정 → daily_class_overrides
// ═════════════════════════════════════════════════════════════
async function importSchedule(
  sb: SupabaseClient,
  daesobiId: string,
  ws: XLSX.WorkSheet,
  courseMap: Map<string, string>
) {
  console.log("\n=== 시간표설정 → daily_class_overrides ===");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  const batch: Array<{
    teacher_id: string;
    date: string;
    course_id: string;
    action: "add";
  }> = [];
  const unmatched = new Map<string, number>();
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
    const key = courseKey(parsed.subject, parsed.grade, parsed.classNumber);
    const courseId = courseMap.get(key);
    if (!courseId) {
      unmatched.set(key, (unmatched.get(key) ?? 0) + 1);
      continue;
    }
    batch.push({
      teacher_id: daesobiId,
      date,
      course_id: courseId,
      action: "add",
    });
  }
  console.log(`  배치 ${batch.length}건 (빈 행 skip ${skip})`);
  reportUnmatched(unmatched);
  if (DRY_RUN || batch.length === 0) return;
  const { error } = await sb
    .from("daily_class_overrides")
    .upsert(batch, {
      onConflict: "teacher_id,date,course_id",
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
// 5) 자동 추정: progress_tracker → teacher_permissions
//    daesobi 의 진도표에 등장한 (grade, class, subject) 유니크 조합을
//    teacher_permissions 에 일괄 등록. 이미 있으면 ignoreDuplicates.
// ═════════════════════════════════════════════════════════════
async function deriveTeacherPermissions(sb: SupabaseClient, daesobiId: string) {
  console.log("\n=== teacher_permissions 자동 추정 (progress_tracker 기반) ===");

  // daesobi 의 teachers 행 확인 / 생성
  let teacherRowId: string | null = null;
  {
    const { data } = await sb
      .from("teachers")
      .select("id")
      .eq("profile_id", daesobiId)
      .maybeSingle();
    teacherRowId = (data as { id: string } | null)?.id ?? null;
  }
  if (!teacherRowId) {
    if (DRY_RUN) {
      console.log("  [dry-run] teachers 행 없음 — INSERT 예정");
    } else {
      const { data, error } = await sb
        .from("teachers")
        .insert({ profile_id: daesobiId })
        .select("id")
        .single();
      if (error) {
        console.log(`  ❌ teachers INSERT 실패: ${error.message}`);
        return;
      }
      teacherRowId = (data as { id: string }).id;
      console.log(`  ✅ teachers 행 생성: ${teacherRowId}`);
    }
  } else {
    console.log(`  teachers.id = ${teacherRowId}`);
  }

  // progress_tracker 의 유니크 학반·과목
  const { data: progRows, error: progErr } = await sb
    .from("progress_tracker")
    .select("grade, class_number, subject")
    .eq("teacher_id", daesobiId);
  if (progErr) {
    console.log(`  ❌ progress_tracker 조회 실패: ${progErr.message}`);
    return;
  }
  const uniq = new Map<string, { grade: number; class_number: number; subject: string }>();
  for (const r of (progRows ?? []) as Array<{
    grade: number;
    class_number: number;
    subject: string;
  }>) {
    const key = `${r.grade}-${r.class_number}-${r.subject}`;
    if (!uniq.has(key)) uniq.set(key, r);
  }
  console.log(`  유니크 학반·과목 ${uniq.size}건: ${Array.from(uniq.keys()).join(", ")}`);
  if (DRY_RUN || uniq.size === 0 || !teacherRowId) return;

  const batch = Array.from(uniq.values()).map((u) => ({
    teacher_id: teacherRowId!,
    grade: u.grade,
    class_number: u.class_number,
    subject: u.subject,
  }));
  const { error } = await sb
    .from("teacher_permissions")
    .upsert(batch, {
      onConflict: "teacher_id,subject,grade,class_number",
      ignoreDuplicates: true,
    });
  if (error) console.log(`  ❌ ${error.message}`);
  else console.log(`  ✅ ${batch.length}건 (중복 시 ignore)`);
}

// ═════════════════════════════════════════════════════════════
// 6) 자동 추정: progress_tracker → weekly_schedule
//    각 (요일, grade, class, subject) 의 진도 입력 횟수를 세어
//    임계 이상 (default: 3회) 나오면 정규 수업으로 간주, weekly_schedule INSERT.
//    요일: 0=월 ~ 4=금 (주말은 제외).
// ═════════════════════════════════════════════════════════════
const WEEKLY_THRESHOLD = 3;

async function deriveWeeklySchedule(sb: SupabaseClient, daesobiId: string) {
  console.log("\n=== weekly_schedule 자동 추정 (progress_tracker 기반) ===");
  const { data: rows, error } = await sb
    .from("progress_tracker")
    .select("date, course_id, grade, class_number, subject")
    .eq("teacher_id", daesobiId);
  if (error) {
    console.log(`  ❌ progress_tracker 조회 실패: ${error.message}`);
    return;
  }

  // (day_of_week, course_id) → count. 학년·반·교과는 로그 표시용으로만 들고 간다.
  const tally = new Map<
    string,
    {
      day_of_week: number;
      course_id: string;
      label: string;
      count: number;
    }
  >();
  let noCourse = 0;
  for (const r of (rows ?? []) as Array<{
    date: string;
    course_id: string | null;
    grade: number | null;
    class_number: number | null;
    subject: string;
  }>) {
    if (!r.course_id) {
      noCourse += 1; // 수업으로 매칭되지 않은 옛 행 — 시간표를 만들 수 없다
      continue;
    }
    const d = new Date(r.date + "T00:00:00");
    const jsDow = d.getDay(); // 0=일 ~ 6=토
    if (jsDow === 0 || jsDow === 6) continue; // 주말 skip
    const dow = jsDow - 1; // 1=월 → 0, 5=금 → 4
    const key = `${dow}-${r.course_id}`;
    const prev = tally.get(key);
    if (prev) prev.count += 1;
    else
      tally.set(key, {
        day_of_week: dow,
        course_id: r.course_id,
        label: `${r.grade ?? "-"}-${r.class_number ?? "-"} ${r.subject}`,
        count: 1,
      });
  }
  if (noCourse > 0) {
    console.log(`  ⚠ course_id 없는 진도 행 ${noCourse}건 — 추정에서 제외`);
  }

  const candidates = Array.from(tally.values())
    .filter((t) => t.count >= WEEKLY_THRESHOLD)
    .sort((a, b) =>
      a.day_of_week !== b.day_of_week
        ? a.day_of_week - b.day_of_week
        : a.label.localeCompare(b.label)
    );
  const DOW_LABEL = ["월", "화", "수", "목", "금"];
  console.log(`  임계 ${WEEKLY_THRESHOLD}회 이상: ${candidates.length}건`);
  for (const c of candidates) {
    console.log(`    ${DOW_LABEL[c.day_of_week]} ${c.label} (${c.count}회)`);
  }
  if (DRY_RUN || candidates.length === 0) return;

  // 교과·학년·반은 DB 트리거가 course 에서 채운다.
  const batch = candidates.map((c) => ({
    teacher_id: daesobiId,
    day_of_week: c.day_of_week,
    course_id: c.course_id,
  }));
  const { error: upErr } = await sb
    .from("weekly_schedule")
    .upsert(batch, {
      onConflict: "teacher_id,day_of_week,course_id",
      ignoreDuplicates: true,
    });
  if (upErr) console.log(`  ❌ ${upErr.message}`);
  else console.log(`  ✅ ${batch.length}건 (중복 시 ignore)`);
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
  const courseMap = await loadCourseMap(sb);

  if (RESET && !DRY_RUN) {
    console.log("\n🧹 RESET — daesobi 의 progress/daymeta/schedule/sebteuk wipe");
    await sb.from("progress_tracker").delete().eq("teacher_id", daesobiId);
    await sb.from("daily_schedule_meta").delete().eq("teacher_id", daesobiId);
    await sb.from("daily_class_overrides").delete().eq("teacher_id", daesobiId);
    await sb.from("ai_usage_log").delete().eq("teacher_id", daesobiId);
    // login_logs 는 dedupe upsert 라 굳이 wipe 안 함.
  }

  const wb = await fetchWorkbook(PROGRESS_SHEET_ID);
  console.log(`\n탭: ${wb.SheetNames.join(", ")}`);

  if (ONLY === null || ONLY === "progress") {
    const ws = wb.Sheets[TAB_PROGRESS];
    if (ws) await importProgress(sb, daesobiId, ws, courseMap);
    else console.log(`⚠ ${TAB_PROGRESS} 탭 없음`);
  }
  if (ONLY === null || ONLY === "daymeta") {
    const ws = wb.Sheets[TAB_PROGRESS];
    if (ws) await importDailyMeta(sb, daesobiId, ws);
    else console.log(`⚠ ${TAB_PROGRESS} 탭 없음`);
  }
  if (ONLY === null || ONLY === "schedule") {
    const ws = wb.Sheets[TAB_SCHEDULE];
    if (ws) await importSchedule(sb, daesobiId, ws, courseMap);
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
  if (ONLY === null || ONLY === "permissions") {
    await deriveTeacherPermissions(sb, daesobiId);
  }
  if (ONLY === null || ONLY === "weekly") {
    await deriveWeeklySchedule(sb, daesobiId);
  }

  console.log("\n✅ 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
