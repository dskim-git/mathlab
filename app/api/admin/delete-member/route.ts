import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * 관리자 전용: 다른 사용자 계정 영구 삭제.
 *  POST /api/admin/delete-member
 *  body: { targetProfileId: string }
 *
 * 처리 단계:
 *  1) 호출자가 로그인한 관리자(role=admin, status=approved)인지 cookie 세션으로 검증.
 *  2) 자기 자신 삭제 금지.
 *  3) service_role 로:
 *      a) profiles 행 DELETE — 자식 (students/teachers/teacher_permissions/activity_visits/
 *         activity_responses/learning_progress/login_logs/feedback/notices/sebteuk_drafts/
 *         ai_usage_log/teacher_unit_overrides/class_birthdays/reflection_priority/...)
 *         이 모두 profile_id ON DELETE CASCADE 라 자동 정리됨.
 *      b) auth.users 행 삭제 — auth.admin.deleteUser. (profiles 와 FK 가 없어 명시 호출 필요)
 *  4) 한쪽이 실패해도 다른 쪽은 진행 — 부분 잔재가 생기지 않도록.
 */
export async function POST(req: Request) {
  // 1) 호출자 = 관리자인지 검증
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  const p = profile as { role: string; status: string } | null;
  if (!p || p.role !== "admin" || p.status !== "approved") {
    return NextResponse.json(
      { ok: false, error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  // 2) body 파싱
  let body: { targetProfileId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 본문입니다." },
      { status: 400 }
    );
  }
  const targetProfileId = body.targetProfileId?.trim();
  if (!targetProfileId) {
    return NextResponse.json(
      { ok: false, error: "targetProfileId 가 필요합니다." },
      { status: 400 }
    );
  }
  if (targetProfileId === user.id) {
    return NextResponse.json(
      { ok: false, error: "자기 자신은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  // 3) service_role 클라이언트
  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  // 4) profiles 삭제 — 자식 CASCADE
  const errors: string[] = [];
  const { error: profileErr } = await admin
    .from("profiles")
    .delete()
    .eq("id", targetProfileId);
  if (profileErr) {
    errors.push(`profiles: ${profileErr.message}`);
  }

  // 5) auth.users 삭제 — orphan profile 인 경우(자식만 있던 경우) 이 단계가 실패할 수 있다.
  const { error: authErr } = await admin.auth.admin.deleteUser(targetProfileId);
  if (authErr) {
    // 이미 auth.users 가 없는 경우는 OK 로 처리(예: 부분 정리된 회원).
    const msg = authErr.message || "";
    const isMissing =
      msg.toLowerCase().includes("not found") ||
      msg.toLowerCase().includes("user_not_found");
    if (!isMissing) {
      errors.push(`auth: ${msg}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: errors.join(" / ") },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
