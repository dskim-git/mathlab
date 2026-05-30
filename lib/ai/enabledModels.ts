import type { SupabaseClient } from "@supabase/supabase-js";
import { SEBTEUK_MODELS } from "./sebteukPrompt";

const KEY = "ai_sebteuk_enabled_models";
const DEFAULT_VALUE = SEBTEUK_MODELS.map((m) => m.id).join(",");

function parseList(raw: string | null | undefined): string[] {
  if (!raw) return SEBTEUK_MODELS.map((m) => m.id);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * app_settings 에서 허용 모델 ID 목록을 읽는다.
 * SEBTEUK_MODELS 정의에 없는 ID 는 자동 필터(=드롭다운 깨짐 방지).
 * 값이 없으면 전체 허용으로 폴백.
 */
export async function getEnabledSebteukModels(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", KEY)
    .maybeSingle();
  const raw = (data as { value: string | null } | null)?.value ?? null;
  const list = parseList(raw);
  const allKnown = new Set<string>(SEBTEUK_MODELS.map((m) => m.id));
  const filtered = list.filter((id) => allKnown.has(id));
  return filtered.length > 0 ? filtered : SEBTEUK_MODELS.map((m) => m.id);
}

/**
 * 허용 목록 저장. 빈 배열은 거부(최소 1개 유지 — 기능을 꺼버리려면 ai_sebteuk_enabled 토글로).
 */
export async function setEnabledSebteukModels(
  supabase: SupabaseClient,
  modelIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (modelIds.length === 0) {
    return { ok: false, error: "최소 1개 모델은 허용해야 합니다." };
  }
  const allKnown = new Set<string>(SEBTEUK_MODELS.map((m) => m.id));
  const safe = modelIds.filter((id) => allKnown.has(id));
  if (safe.length === 0) {
    return { ok: false, error: "유효한 모델이 없습니다." };
  }
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: KEY, value: safe.join(",") }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export { DEFAULT_VALUE as DEFAULT_ENABLED_MODELS_VALUE };

/**
 * 특정 교사가 실제로 사용 가능한 모델 = 글로벌 enabled ∩ 교사 allowed.
 * teachers.allowed_sebteuk_models 가 NULL 이면 글로벌 그대로 따름.
 * 빈 배열이면 빈 결과(이 교사는 사용 불가).
 */
export async function getEnabledSebteukModelsForTeacher(
  supabase: SupabaseClient,
  teacherProfileId: string
): Promise<string[]> {
  const globalEnabled = await getEnabledSebteukModels(supabase);

  const { data } = await supabase
    .from("teachers")
    .select("allowed_sebteuk_models")
    .eq("profile_id", teacherProfileId)
    .maybeSingle();
  const row = data as { allowed_sebteuk_models: string[] | null } | null;
  const teacherAllowed = row?.allowed_sebteuk_models;

  if (teacherAllowed == null) return globalEnabled; // NULL → 글로벌 그대로
  const allowed = new Set(teacherAllowed);
  return globalEnabled.filter((m) => allowed.has(m));
}
