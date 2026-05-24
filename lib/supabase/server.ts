import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Phase 3a: 서버 컴포넌트/Server Function이 "로그인한 사용자"로 Supabase를 조회하기
// 위한 클라이언트. 세션은 쿠키에 있고(브라우저 클라이언트가 createBrowserClient로 기록),
// 여기서 그 쿠키를 읽어 요청자 신원이 담긴 JWT로 PostgREST에 접근한다.
//
// 주의(Next 16): cookies()는 async이고, Server Component 렌더 중에는 쿠키 set이
// 불가능하다. 그래서 setAll은 try/catch로 감싸고, 실제 토큰 갱신은 proxy.ts가 맡는다.
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component 렌더 중 set 호출 → 무시(토큰 갱신은 proxy가 담당).
        }
      },
    },
  });
}
