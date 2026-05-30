import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * service_role 키로 만든 관리자 전용 Supabase 클라이언트.
 *  - **서버 전용**(Route Handler/Server Action). 절대 client 컴포넌트에 import 금지.
 *  - RLS 우회 + Auth Admin API(auth.admin.*) 호출 가능.
 *  - 환경변수 `SUPABASE_SERVICE_ROLE_KEY` 필요 (`.env.local`).
 *
 * 사용 시 호출 직전에 반드시 "현재 요청자가 관리자인지" 별도 검증해야 한다.
 * (이 클라이언트 자체는 인증을 거치지 않고 service_role 권한으로 동작하므로.)
 */
export function createAdminSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — Supabase Studio › Project Settings › API에서 service_role 키를 복사해 .env.local 에 추가하세요."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
