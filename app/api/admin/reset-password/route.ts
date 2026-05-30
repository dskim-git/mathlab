import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * 관리자 전용: 다른 사용자의 비밀번호 재설정.
 *  POST /api/admin/reset-password
 *  body: { targetProfileId: string, newPassword: string }
 *
 * 보안:
 *  1) 요청자가 로그인한 관리자(role=admin, status=approved)인지 cookie 세션으로 검증.
 *  2) 통과 시 service_role 클라이언트로 auth.admin.updateUserById 호출.
 *  3) 자기 자신을 대상으로도 가능(원하지 않으면 차단 가능).
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
  let body: { targetProfileId?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 본문입니다." },
      { status: 400 }
    );
  }
  const targetProfileId = body.targetProfileId?.trim();
  const newPassword = body.newPassword;
  if (!targetProfileId || !newPassword) {
    return NextResponse.json(
      { ok: false, error: "targetProfileId 와 newPassword 가 필요합니다." },
      { status: 400 }
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { ok: false, error: "비밀번호는 8자 이상이어야 합니다." },
      { status: 400 }
    );
  }

  // 3) service_role 로 비밀번호 변경
  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const { error } = await admin.auth.admin.updateUserById(targetProfileId, {
    password: newPassword,
  });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
