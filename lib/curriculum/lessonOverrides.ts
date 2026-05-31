// 단원 잎의 수업 블록을 "현재 사용자의 관점" 으로 해석하는 헬퍼.
// - 학생: 자기 학급·과목 담당 교사의 teacher_unit_overrides 가 있으면 그 block_ids 순서·포함 적용.
// - 교사: 본인 override 가 있으면 본인 화면에 본인 편집 결과 그대로(자기 학생과 같은 화면 미리보기).
// - 일반인/관리자: 기본 블록 그대로.
//
// 여러 교사가 같은 (subject, unit_key) 행을 갖는 경우(드물지만 학급에 같은 과목 교사 둘) 첫 번째 행.

import type { SupabaseClient } from "@supabase/supabase-js";

export type OverrideMap = Map<string, string[]>;

function key(subject: string, unitKey: string): string {
  return `${subject}::${unitKey}`;
}

export function makeOverrideKey(subject: string, unitKey: string): string {
  return key(subject, unitKey);
}

/**
 * 현재 사용자가 적용해야 할 (subject, unit_key) → block_ids 매핑을 가져온다.
 * RLS 가 본인/학생 학급 범위로 자동 필터하므로 SELECT 결과를 첫 행 기준으로 모아 Map 으로 만든다.
 */
export async function fetchUserOverrideMap(
  supabase: SupabaseClient,
  opts: { role: string; userId: string }
): Promise<OverrideMap> {
  const map: OverrideMap = new Map();

  // 일반인·관리자는 적용하지 않는다(기본 블록 그대로).
  if (opts.role === "general" || opts.role === "admin") {
    return map;
  }

  // 교사: 본인 override 만.
  // 학생: RLS 학생 정책이 자기 학급 담당 교사의 행만 보여준다.
  let query = supabase
    .from("teacher_unit_overrides")
    .select("subject, unit_key, block_ids");
  if (opts.role === "teacher") {
    query = query.eq("teacher_profile_id", opts.userId);
  }
  const { data, error } = await query;
  if (error || !data) return map;

  for (const row of data as Array<{
    subject: string;
    unit_key: string;
    block_ids: string[];
  }>) {
    const k = key(row.subject, row.unit_key);
    if (map.has(k)) continue; // 첫 행 우선
    map.set(k, row.block_ids);
  }
  return map;
}

/**
 * 단원의 기본 블록 배열에 (선택된) override 를 적용해 최종 블록 배열을 만든다.
 * override 의 block_ids 순서대로 + 기본에 존재하는 ID 만. override 가 없으면 기본 그대로.
 */
export function applyOverrideToBlocks<B extends { id: string }>(
  base: B[],
  blockIds: string[] | undefined
): B[] {
  if (!blockIds || blockIds.length === 0) {
    // override 행이 있어도 block_ids 가 비어 있으면 "모두 제외" 의도.
    if (blockIds) return [];
    return base;
  }
  const byId = new Map(base.map((b) => [b.id, b]));
  const out: B[] = [];
  for (const id of blockIds) {
    const b = byId.get(id);
    if (b) out.push(b);
  }
  return out;
}
