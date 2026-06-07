/**
 * 레거시 사용자 import — 구글 시트(공개) → 새 앱(Supabase Auth + profiles + students + study_groups).
 *
 * 흐름:
 *   1) 학생 탭 CSV fetch → student_roster upsert → auth.admin.createUser(role=student)
 *      → 트리거(handle_new_auth_user)가 명렬표 매칭 후 profiles+students 자동 생성
 *      → must_change_password=true 업데이트
 *   2) 일반인 탭 CSV fetch → 그룹에 따라 분기:
 *      - "휘문고 수학과" → role=teacher + 휘문고 그룹 멤버 + 9 교과 (그룹은 미리 생성)
 *      - "영재(...)"    → role=general + 영재 그룹 멤버 + 영재 교과
 *   3) daesobi(김대섭) 교사 계정 신규 생성 — 옛 진도표 owner 로 쓸 자리
 *   4) 모든 결과를 legacy_users_audit 에 기록
 *
 * 스킵 규칙:
 *   - 학생 탭의 김대섭(학번 20000, 10000) — 테스트 계정, 사용자 결정
 *   - 일반인 탭의 j9heeyun(성윤) — 이미 새 앱에 heyheidi 로 가입됨
 *   - 새 앱에 이미 같은 login_id 가 있으면 'matched_existing' 으로 audit
 *
 * 실행:
 *   npx tsx scripts/import/users.ts --dry-run   # 미리 보기 (INSERT 없음)
 *   npx tsx scripts/import/users.ts             # 실제 실행
 *
 * 환경변수(.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const TEMP_PASSWORD = "11111111";
const EMAIL_DOMAIN = process.env.NEXT_PUBLIC_SYNTH_EMAIL_DOMAIN ?? "mathlab.app";
const SCHOOL_YEAR = 2026;

// --only=students|general|daesobi 로 특정 단계만 실행 (재실행 시).
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? onlyArg.slice("--only=".length) : null; // null=전부

// ─── 시트 ID + gid (사용자가 알려주면 채움) ─────────────────────────────
const USERS_SHEET_ID = "1e1A67HYErUeZX1y3cdemSNSswiDk0M4FRUN7ONMqkBU";
const STUDENT_TAB_GID = "1748289468";  // 학생 탭
const GENERAL_TAB_GID = "886396050";   // 일반인 탭

// ─── 스킵 규칙 ─────────────────────────────────────────────────────────
const SKIP_STUDENT_HAKBEONS = new Set(["20000", "10000"]); // 김대섭 테스트 계정
const SKIP_GENERAL_LOGIN_IDS = new Set(["j9heeyun"]);      // 성윤 (이미 heyheidi)

// ─── daesobi 신규 교사 (별도 생성) ─────────────────────────────────────
const DAESOBI_LOGIN_ID = "daesobi";
const DAESOBI_NAME = "김대섭";

// ─── 그룹 정의 ─────────────────────────────────────────────────────────
type GroupSpec = {
  match: (groupValue: string) => boolean;
  groupName: string;
  role: "teacher" | "general";
  subjects: "all" | string[];
};
const GROUP_SPECS: GroupSpec[] = [
  {
    match: (g) => g.trim() === "휘문고 수학과",
    groupName: "휘문고 수학과",
    role: "teacher",
    subjects: "all",
  },
  {
    match: (g) => g.trim().startsWith("영재"),
    groupName: "영재(260321)",
    role: "general",
    subjects: ["영재"],
  },
];

// ─── CSV 파서 (RFC 4180 단순화, 한국어·콤마·쌍따옴표 처리) ────────────
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (field || row.length > 0) {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        }
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else field += c;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function fetchCsv(sheetId: string, gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet fetch failed (gid=${gid}): ${res.status}`);
  return parseCsv(await res.text());
}

// ─── 헤더 → 인덱스 맵 ──────────────────────────────────────────────────
function headerMap(headerRow: string[]): Map<string, number> {
  const m = new Map<string, number>();
  headerRow.forEach((h, i) => m.set(h.trim(), i));
  return m;
}

// ─── 학번 → grade/class/number 분해 (예: 20901 → 2학년 9반 01번) ──────
function parseHakbeon(
  raw: string
): { grade: number; classNumber: number; studentNumber: number } | null {
  const s = raw.trim().padStart(5, "0");
  if (!/^\d{5}$/.test(s)) return null;
  return {
    grade: Number(s[0]),
    classNumber: Number(s.slice(1, 3)),
    studentNumber: Number(s.slice(3, 5)),
  };
}

// ─── audit 기록 헬퍼 ──────────────────────────────────────────────────
async function audit(
  sb: SupabaseClient,
  row: {
    login: string;
    name: string;
    group: string;
    profileId: string | null;
    status: string;
    note: string;
  }
) {
  if (DRY_RUN) return;
  await sb.from("legacy_users_audit").insert({
    legacy_login_id: row.login,
    legacy_name: row.name,
    legacy_group: row.group,
    new_profile_id: row.profileId,
    status: row.status,
    note: row.note,
  });
}

// ─── 학생 import ───────────────────────────────────────────────────────
async function importStudents(sb: SupabaseClient) {
  console.log("\n=== 학생 탭 import ===");
  if (STUDENT_TAB_GID.includes("<<")) {
    console.log("⏭  STUDENT_TAB_GID 미설정 — 학생 탭 import 건너뜀");
    return;
  }
  const rows = await fetchCsv(USERS_SHEET_ID, STUDENT_TAB_GID);
  if (rows.length < 2) {
    console.log("⚠️  데이터 행 없음");
    return;
  }
  const h = headerMap(rows[0]);
  const iHakbeon = h.get("학번")!;
  const iName = h.get("이름")!;
  const iLoginId = h.get("아이디")!;

  let ok = 0, skip = 0, fail = 0;

  for (const r of rows.slice(1)) {
    const hakbeon = (r[iHakbeon] ?? "").trim();
    const name = (r[iName] ?? "").trim();
    const loginId = (r[iLoginId] ?? "").trim();
    if (!hakbeon || !name || !loginId) {
      skip++;
      console.log(`  ⏭ 빈 행 skip: ${hakbeon}/${name}/${loginId}`);
      continue;
    }
    if (SKIP_STUDENT_HAKBEONS.has(hakbeon)) {
      skip++;
      await audit(sb, { login: loginId, name, group: "학생",
        profileId: null, status: "skipped",
        note: "테스트 계정 (김대섭 학번 20000/10000)" });
      console.log(`  ⏭ 김대섭 테스트 계정 skip: ${hakbeon} ${name}`);
      continue;
    }
    const parsed = parseHakbeon(hakbeon);
    if (!parsed) {
      fail++;
      await audit(sb, { login: loginId, name, group: "학생",
        profileId: null, status: "failed",
        note: `학번 형식 오류: ${hakbeon}` });
      console.log(`  ❌ 학번 형식 오류: ${hakbeon} ${name}`);
      continue;
    }
    const email = `${loginId}@${EMAIL_DOMAIN}`;
    const studentCode = hakbeon;

    if (DRY_RUN) {
      console.log(`  [DRY] ${loginId} ${name} (${parsed.grade}/${parsed.classNumber}/${parsed.studentNumber})`);
      ok++;
      continue;
    }

    // 1) student_roster upsert (트리거가 매칭에 사용)
    //    student_roster 는 grade/class_number/student_number NOT NULL — parseHakbeon 결과 사용.
    const { error: rErr } = await sb.from("student_roster").upsert({
      school_year: SCHOOL_YEAR,
      student_code: studentCode,
      grade: parsed.grade,
      class_number: parsed.classNumber,
      student_number: parsed.studentNumber,
      name,
    }, { onConflict: "school_year,student_code" });
    if (rErr) {
      fail++;
      await audit(sb, { login: loginId, name, group: "학생",
        profileId: null, status: "failed",
        note: `roster upsert 실패: ${rErr.message}` });
      console.log(`  ❌ roster ${loginId} ${name}: ${rErr.message}`);
      continue;
    }

    // 2) auth.admin.createUser — 트리거가 profiles+students 자동 생성
    //    트리거(handle_new_auth_user, role=student 분기)는 school_year + student_code +
    //    name 셋으로 student_roster 매칭하므로 메타에 셋 다 넣어야 매칭 성공.
    const { data: created, error: cErr } = await sb.auth.admin.createUser({
      email,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        login_id: loginId,
        name,
        role: "student",
        school_year: SCHOOL_YEAR,
        student_code: studentCode,
      },
    });
    if (cErr) {
      // 이미 있는 사용자면 matched_existing
      if (/already.*registered|already exists|duplicate/i.test(cErr.message)) {
        skip++;
        await audit(sb, { login: loginId, name, group: "학생",
          profileId: null, status: "matched_existing", note: cErr.message });
        console.log(`  ↩  이미 존재: ${loginId} ${name}`);
      } else {
        fail++;
        await audit(sb, { login: loginId, name, group: "학생",
          profileId: null, status: "failed",
          note: `createUser 실패: ${cErr.message}` });
        console.log(`  ❌ ${loginId} ${name}: ${cErr.message}`);
      }
      continue;
    }

    // 3) must_change_password=true
    const newId = created.user!.id;
    await sb.from("profiles").update({ must_change_password: true }).eq("id", newId);

    ok++;
    await audit(sb, { login: loginId, name, group: "학생",
      profileId: newId, status: "imported", note: "" });
    console.log(`  ✅ ${loginId} ${name}`);
  }
  console.log(`학생 결과: ok=${ok}, skip=${skip}, fail=${fail}`);
}

// ─── study_groups 사전 생성 + 교과 권한 부여 ─────────────────────────
async function ensureGroups(sb: SupabaseClient): Promise<Map<string, string>> {
  const idByName = new Map<string, string>();
  // 모든 교과 미리 조회 (subjects.name)
  const { data: subs } = await sb.from("subjects").select("name");
  const allSubjects = (subs ?? []).map((s: { name: string }) => s.name);

  for (const spec of GROUP_SPECS) {
    if (DRY_RUN) {
      console.log(`  [DRY] 그룹 ensure: ${spec.groupName}`);
      idByName.set(spec.groupName, "dry-id");
      continue;
    }
    // 이미 있는지 조회
    let { data: g } = await sb
      .from("study_groups")
      .select("id")
      .eq("name", spec.groupName)
      .maybeSingle();
    if (!g) {
      const ins = await sb
        .from("study_groups")
        .insert({ name: spec.groupName, note: "옛 시트 이식" })
        .select("id")
        .single();
      if (ins.error) {
        console.log(`  ❌ 그룹 생성 실패 ${spec.groupName}: ${ins.error.message}`);
        continue;
      }
      g = ins.data;
    }
    const gid = (g as { id: string }).id;
    idByName.set(spec.groupName, gid);

    // 교과 권한 부여
    const subjects = spec.subjects === "all" ? allSubjects : spec.subjects;
    for (const subject of subjects) {
      await sb
        .from("study_group_subjects")
        .upsert({ group_id: gid, subject }, { onConflict: "group_id,subject" });
    }
    console.log(`  ✅ 그룹 ${spec.groupName} (교과 ${subjects.length}개)`);
  }
  return idByName;
}

// ─── 일반인 import ─────────────────────────────────────────────────────
async function importGeneral(sb: SupabaseClient, groupIds: Map<string, string>) {
  console.log("\n=== 일반인 탭 import ===");
  if (GENERAL_TAB_GID.includes("<<")) {
    console.log("⏭  GENERAL_TAB_GID 미설정 — 일반인 탭 import 건너뜀");
    return;
  }
  const rows = await fetchCsv(USERS_SHEET_ID, GENERAL_TAB_GID);
  if (rows.length < 2) {
    console.log("⚠️  데이터 행 없음");
    return;
  }
  const h = headerMap(rows[0]);
  const iName = h.get("이름")!;
  const iLoginId = h.get("아이디")!;
  const iGroup = h.get("그룹")!;

  let ok = 0, skip = 0, fail = 0;

  for (const r of rows.slice(1)) {
    const name = (r[iName] ?? "").trim();
    const loginId = (r[iLoginId] ?? "").trim();
    const group = (r[iGroup] ?? "").trim();
    if (!name || !loginId) {
      skip++;
      console.log(`  ⏭ 빈 행 skip: ${name}/${loginId}`);
      continue;
    }
    if (SKIP_GENERAL_LOGIN_IDS.has(loginId)) {
      skip++;
      await audit(sb, { login: loginId, name, group,
        profileId: null, status: "skipped",
        note: "이미 새 앱에 가입(성윤=heyheidi)" });
      console.log(`  ⏭ ${loginId} ${name} (skip: 성윤)`);
      continue;
    }
    const spec = GROUP_SPECS.find((s) => s.match(group));
    if (!spec) {
      skip++;
      await audit(sb, { login: loginId, name, group,
        profileId: null, status: "skipped",
        note: `매핑된 그룹 없음: '${group}'` });
      console.log(`  ⏭ ${loginId} ${name} (그룹 미매핑: ${group})`);
      continue;
    }
    const email = `${loginId}@${EMAIL_DOMAIN}`;
    const role = spec.role;

    if (DRY_RUN) {
      console.log(`  [DRY] ${loginId} ${name} → ${role} (${spec.groupName})`);
      ok++;
      continue;
    }

    const { data: created, error: cErr } = await sb.auth.admin.createUser({
      email,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: { login_id: loginId, name, role },
    });
    if (cErr) {
      if (/already.*registered|already exists|duplicate/i.test(cErr.message)) {
        skip++;
        await audit(sb, { login: loginId, name, group,
          profileId: null, status: "matched_existing", note: cErr.message });
        console.log(`  ↩  이미 존재: ${loginId} ${name}`);
      } else {
        fail++;
        await audit(sb, { login: loginId, name, group,
          profileId: null, status: "failed",
          note: `createUser 실패: ${cErr.message}` });
        console.log(`  ❌ ${loginId} ${name}: ${cErr.message}`);
      }
      continue;
    }
    const newId = created.user!.id;

    // approved + must_change_password (트리거가 pending 으로 만들었으니 승인)
    await sb.from("profiles").update({
      status: "approved",
      must_change_password: true,
    }).eq("id", newId);

    // role=teacher 면 teachers 행 보장
    if (role === "teacher") {
      await sb.from("teachers").upsert(
        { profile_id: newId },
        { onConflict: "profile_id" }
      );
    }

    // 그룹 멤버 추가
    const gid = groupIds.get(spec.groupName);
    if (gid) {
      await sb.from("study_group_members").upsert(
        { group_id: gid, profile_id: newId, role: role === "teacher" ? "teacher" : "student" },
        { onConflict: "group_id,profile_id" }
      );
    }

    ok++;
    await audit(sb, { login: loginId, name, group,
      profileId: newId, status: "imported", note: `→ ${role} / 그룹 ${spec.groupName}` });
    console.log(`  ✅ ${loginId} ${name} → ${role}`);
  }
  console.log(`일반인 결과: ok=${ok}, skip=${skip}, fail=${fail}`);
}

// ─── daesobi 신규 교사 생성 ────────────────────────────────────────────
async function ensureDaesobi(sb: SupabaseClient) {
  console.log("\n=== daesobi(김대섭) 교사 신규 생성 ===");
  const email = `${DAESOBI_LOGIN_ID}@${EMAIL_DOMAIN}`;
  if (DRY_RUN) {
    console.log(`  [DRY] ${DAESOBI_LOGIN_ID} ${DAESOBI_NAME} → teacher`);
    return;
  }
  const { data: created, error } = await sb.auth.admin.createUser({
    email,
    password: TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: { login_id: DAESOBI_LOGIN_ID, name: DAESOBI_NAME, role: "teacher" },
  });
  if (error) {
    if (/already.*registered|already exists|duplicate/i.test(error.message)) {
      console.log(`  ↩  이미 존재: ${DAESOBI_LOGIN_ID}`);
    } else {
      console.log(`  ❌ ${error.message}`);
    }
    return;
  }
  const newId = created.user!.id;
  await sb.from("profiles").update({
    status: "approved",
    must_change_password: true,
  }).eq("id", newId);
  await sb.from("teachers").upsert(
    { profile_id: newId },
    { onConflict: "profile_id" }
  );
  console.log(`  ✅ ${DAESOBI_LOGIN_ID} ${DAESOBI_NAME}`);
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "🔵 DRY-RUN (no DB writes)" : "🔴 LIVE (DB writes)"}`);
  console.log(`Only: ${ONLY ?? "all"}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  const sb = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 그룹은 학생/일반인 import 전에 항상 보장 — 단 --only=daesobi 면 굳이 안 만듦.
  let groupIds = new Map<string, string>();
  if (ONLY === null || ONLY === "general" || ONLY === "students") {
    console.log("\n=== 그룹 ensure ===");
    groupIds = await ensureGroups(sb);
  }

  if (ONLY === null || ONLY === "students") {
    await importStudents(sb);
  }
  if (ONLY === null || ONLY === "general") {
    await importGeneral(sb, groupIds);
  }
  if (ONLY === null || ONLY === "daesobi") {
    await ensureDaesobi(sb);
  }

  console.log("\n✅ 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
