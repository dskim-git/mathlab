import { supabase } from "@/lib/supabase/client";

// app_settings.current_school_year 를 읽어 현재 학년도를 돌려준다.
// 학생 가입(anon)·명렬표 업로드(admin) 등이 공유한다.
// 값이 없거나 이상하면 안전한 기본값으로 떨어진다.
const FALLBACK_SCHOOL_YEAR = 2026;

export async function getCurrentSchoolYear(): Promise<number> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "current_school_year")
    .maybeSingle();

  if (error || !data) {
    return FALLBACK_SCHOOL_YEAR;
  }

  const year = Number((data as { value: string }).value);
  return Number.isInteger(year) && year > 0 ? year : FALLBACK_SCHOOL_YEAR;
}
