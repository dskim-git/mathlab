/**
 * 레거시 설문 import — 구글 설문 시트 → surveys + survey_responses.
 *
 * 시트 구조:
 *   survey_config 탭: key/value 2 컬럼 (pre_active, post_active 토글)
 *   pre_survey   탭: 제출시각/학번/학년/학급 + [A]흥미1~4, [B]효능1~4, [C]불안1~2 등
 *   post_survey  탭: 제출시각/학번/학년/학급 + [A]흥미1~2, [B]효능1~2, [C]불안1~2, [D]ICT1~2, [E]시각1~2 등 (응답 0건)
 *
 * 흐름:
 *   1) survey_config 탭 → pre_active / post_active 토글값 추출
 *   2) pre_survey, post_survey 탭 각각:
 *      - 헤더에서 질문 컬럼 추출 (메타 제외)
 *      - surveys upsert (slug=pre_survey_2026 / post_survey_2026, kind=pre/post, is_active=토글)
 *      - 응답 행 순회: 학번 → student_id/profile_id 매핑 → survey_responses INSERT (is_legacy=true)
 *
 * 실행:
 *   npx tsx scripts/import/surveys.ts --dry-run        # 미리 보기
 *   npx tsx scripts/import/surveys.ts                  # 실제 (append)
 *   npx tsx scripts/import/surveys.ts --reset          # surveys+responses 다 wipe 후 INSERT
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
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const RESET = process.argv.includes("--reset");

const SURVEY_SHEET_ID = "14rvZ-si-ZtUMnmzhQ6wl_IRwc9XO0M4HNFvfzsNp56g";

// 시트 탭 이름
const TAB_CONFIG = "survey_config";
const TAB_PRE = "pre_survey";
const TAB_POST = "post_survey";

// 새 앱 surveys.slug
const SLUG_PRE = "pre_survey_2026";
const SLUG_POST = "post_survey_2026";

// 응답 행에서 학생 매칭에 쓰는 메타 컬럼들 — questions 정의에서 제외.
const META_COLUMNS = new Set([
  "제출시각",
  "timestamp",
  "Timestamp",
  "학번",
  "이름",
  "학년",
  "학급",
]);

async function fetchWorkbook(sheetId: string): Promise<XLSX.WorkBook> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`xlsx fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  return XLSX.read(buf, { type: "array" });
}

async function loadStudentMap(
  sb: SupabaseClient
): Promise<Map<string, { id: string; profileId: string }>> {
  // 설문 시트 학번은 9자리(202610901), 성찰·학생 시트는 5자리(10901).
  // 두 키 모두 등록해 어느 형식이든 매칭되게 한다.
  const { data } = await sb
    .from("students")
    .select("id, profile_id, student_code, student_login_id, school_year")
    .order("school_year", { ascending: false });
  const m = new Map<string, { id: string; profileId: string }>();
  for (const r of (data ?? []) as Array<{
    id: string;
    profile_id: string;
    student_code: string;
    student_login_id: string;
    school_year: number;
  }>) {
    const entry = { id: r.id, profileId: r.profile_id };
    if (!m.has(r.student_code)) m.set(r.student_code, entry);
    if (!m.has(r.student_login_id)) m.set(r.student_login_id, entry);
  }
  return m;
}

/** 'TRUE'/'FALSE' 또는 boolean → boolean */
function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.trim().toUpperCase() === "TRUE";
  return false;
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
  const s = String(raw).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

type Question = { id: string; prompt: string; kind: "scale" };

/** 응답 시트의 첫 행(헤더)에서 질문 컬럼만 추출 — 메타 제외. */
function extractQuestions(headerRow: string[]): Question[] {
  return headerRow
    .filter((h) => h && !META_COLUMNS.has(h.trim()))
    .map((h) => ({ id: h.trim(), prompt: h.trim(), kind: "scale" as const }));
}

async function upsertSurvey(
  sb: SupabaseClient,
  spec: {
    slug: string;
    title: string;
    kind: "pre" | "post";
    isActive: boolean;
    questions: Question[];
  }
): Promise<string | null> {
  if (DRY_RUN) {
    console.log(
      `  [DRY] survey ${spec.slug} (kind=${spec.kind}, active=${spec.isActive}, q=${spec.questions.length})`
    );
    return "dry-id";
  }
  // 기존 행 있으면 update, 없으면 insert.
  const { data: existing } = await sb
    .from("surveys")
    .select("id")
    .eq("slug", spec.slug)
    .maybeSingle();

  if (existing) {
    const id = (existing as { id: string }).id;
    const { error } = await sb
      .from("surveys")
      .update({
        title: spec.title,
        kind: spec.kind,
        is_active: spec.isActive,
        questions: spec.questions,
      })
      .eq("id", id);
    if (error) {
      console.log(`  ❌ ${spec.slug} update 실패: ${error.message}`);
      return null;
    }
    console.log(`  ↻ ${spec.slug} 업데이트 (q=${spec.questions.length})`);
    return id;
  } else {
    const { data, error } = await sb
      .from("surveys")
      .insert({
        slug: spec.slug,
        title: spec.title,
        kind: spec.kind,
        is_active: spec.isActive,
        questions: spec.questions,
      })
      .select("id")
      .single();
    if (error) {
      console.log(`  ❌ ${spec.slug} insert 실패: ${error.message}`);
      return null;
    }
    console.log(
      `  ✅ ${spec.slug} 신규 생성 (q=${spec.questions.length}, active=${spec.isActive})`
    );
    return (data as { id: string }).id;
  }
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "🔵 DRY-RUN" : "🔴 LIVE"}`);
  console.log(`Reset: ${RESET ? "YES (wipe 후 INSERT)" : "no (append)"}`);
  const sb = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (RESET) {
    if (DRY_RUN) {
      console.log("  [DRY] RESET 표시 (실제 wipe 안 함)");
    } else {
      // 응답 먼저(cascade로도 처리되지만 명시) → surveys 행.
      await sb
        .from("survey_responses")
        .delete()
        .in("survey_id", [
          // 후속 upsert 가 알아서 새로 만듦. 여기서는 모든 행 wipe (legacy + 새).
        ])
        .neq("id", "00000000-0000-0000-0000-000000000000")
        .then((r) => {
          if (r.error) console.log(`  ⚠ responses 일괄 wipe 시도 — ${r.error.message}`);
        });
      // 모든 응답 통째 wipe (RESET 의도라 안전)
      await sb
        .from("survey_responses")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      console.log("  🧹 survey_responses 전체 wipe");
      // surveys 행도 wipe (slug 두 개)
      await sb.from("surveys").delete().in("slug", [SLUG_PRE, SLUG_POST]);
      console.log(`  🧹 surveys (${SLUG_PRE}, ${SLUG_POST}) wipe`);
    }
  }

  console.log(`\n=== 설문 시트 (${SURVEY_SHEET_ID.slice(0, 8)}...) ===`);
  const wb = await fetchWorkbook(SURVEY_SHEET_ID);
  console.log(`탭: ${wb.SheetNames.join(", ")}`);

  // ─── 1) survey_config 토글 ─────────────────────────────────────
  const configWs = wb.Sheets[TAB_CONFIG];
  let preActive = false;
  let postActive = false;
  if (configWs) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(configWs, {
      defval: "",
    });
    for (const r of rows) {
      const key = String(r["key"] ?? "").trim();
      const val = r["value"];
      if (key === "pre_active") preActive = parseBool(val);
      if (key === "post_active") postActive = parseBool(val);
    }
    console.log(
      `\n[config] pre_active=${preActive}, post_active=${postActive}`
    );
  } else {
    console.log(`⚠️  ${TAB_CONFIG} 탭 없음`);
  }

  // ─── 2) pre_survey 정의 + 응답 ─────────────────────────────────
  const preWs = wb.Sheets[TAB_PRE];
  let preSurveyId: string | null = null;
  if (preWs) {
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(preWs, {
      defval: "",
    });
    const headers =
      XLSX.utils.sheet_to_json<unknown[]>(preWs, { header: 1 })[0] ?? [];
    const headerStrs = (headers as unknown[]).map((h) => String(h ?? "").trim());
    const questions = extractQuestions(headerStrs);

    console.log(`\n=== pre_survey (응답 ${data.length}건, 질문 ${questions.length}개) ===`);
    preSurveyId = await upsertSurvey(sb, {
      slug: SLUG_PRE,
      title: "사전 설문 (2026 이식)",
      kind: "pre",
      isActive: preActive,
      questions,
    });

    if (preSurveyId && preSurveyId !== "dry-id") {
      const studentMap = await loadStudentMap(sb);
      let ok = 0,
        unmatched = 0,
        empty = 0,
        skipDup = 0,
        fail = 0;
      const unmatchedHak = new Set<string>();
      const batch: Array<{
        survey_id: string;
        profile_id: string;
        student_id: string;
        answers: Record<string, string>;
        is_legacy: boolean;
        legacy_created_at: string | null;
      }> = [];
      for (const row of data) {
        const hakbeon = String(row["학번"] ?? "").trim();
        if (!hakbeon) {
          empty++;
          continue;
        }
        const st = studentMap.get(hakbeon);
        if (!st) {
          unmatched++;
          unmatchedHak.add(hakbeon);
          continue;
        }
        const answers: Record<string, string> = {};
        for (const q of questions) {
          const v = row[q.id];
          if (v == null || v === "") continue;
          answers[q.id] = String(v);
        }
        if (Object.keys(answers).length === 0) {
          empty++;
          continue;
        }
        batch.push({
          survey_id: preSurveyId,
          profile_id: st.profileId,
          student_id: st.id,
          answers,
          is_legacy: true,
          legacy_created_at: parseTimestamp(row["제출시각"]),
        });
        ok++;
      }
      if (batch.length > 0) {
        // unique(survey_id, profile_id) — 중복 있으면 행 단위 실패. 한 번에 insert 후 에러 캐치.
        const { error } = await sb.from("survey_responses").insert(batch);
        if (error) {
          // unique 위반 등 — 한 행씩 다시 시도해서 어느 행만 실패인지 분리.
          console.log(`  ⚠ batch 실패 (${error.message}), 행별 재시도`);
          ok = 0;
          for (const r of batch) {
            const sing = await sb.from("survey_responses").insert(r);
            if (sing.error) {
              if (/duplicate|unique/i.test(sing.error.message)) skipDup++;
              else fail++;
            } else ok++;
          }
        }
      }
      console.log(
        `  pre_survey 결과: ok=${ok}, unmatched=${unmatched}, empty=${empty}, skipDup=${skipDup}, fail=${fail}`
      );
      if (unmatchedHak.size > 0) {
        console.log(
          `  unmatched 학번 (${unmatchedHak.size}개): ${Array.from(unmatchedHak).sort().join(", ")}`
        );
      }
    }
  } else {
    console.log(`⚠️  ${TAB_PRE} 탭 없음`);
  }

  // ─── 3) post_survey 정의 (응답 0건 예상) ──────────────────────
  const postWs = wb.Sheets[TAB_POST];
  if (postWs) {
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(postWs, {
      defval: "",
    });
    const headers =
      XLSX.utils.sheet_to_json<unknown[]>(postWs, { header: 1 })[0] ?? [];
    const headerStrs = (headers as unknown[]).map((h) => String(h ?? "").trim());
    const questions = extractQuestions(headerStrs);
    console.log(
      `\n=== post_survey (응답 ${data.length}건, 질문 ${questions.length}개) ===`
    );
    await upsertSurvey(sb, {
      slug: SLUG_POST,
      title: "사후 설문 (2026 이식)",
      kind: "post",
      isActive: postActive,
      questions,
    });
    // 응답 import 는 데이터 있을 때만 (현재 0건 가정).
    if (data.length > 0) {
      console.log(
        `  ℹ post_survey 응답이 ${data.length}건 있음 — 현재 스크립트는 pre 만 import. 필요 시 동일 패턴으로 확장.`
      );
    }
  } else {
    console.log(`⚠️  ${TAB_POST} 탭 없음`);
  }

  console.log("\n✅ 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
