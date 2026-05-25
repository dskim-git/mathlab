import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Phase 3a: 매 요청마다 Supabase 세션 토큰을 갱신해 쿠키에 다시 기록한다.
// 서버 컴포넌트(createServerSupabaseClient)가 신선한 세션으로 조회할 수 있게 하기 위함.
// (Next 16에서 middleware는 proxy로 개명됨 — 기능 동일, 기본 Node.js 런타임)
//
// 주의: proxy는 인증의 "본 해결책"이 아니라 토큰 갱신 + optimistic 체크용이다.
// 실제 접근 제어는 각 페이지의 서버측 확인 + (이후) RLS가 담당한다.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경변수가 없으면 토큰 갱신을 건너뛰고 요청을 그대로 통과시킨다.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // createServerClient 직후 다른 로직 없이 바로 getUser를 호출해야 한다(supabase 권장).
  // 이 호출이 만료 임박 토큰을 갱신하고 setAll을 통해 쿠키를 다시 심는다.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 정적 파일·이미지 최적화·favicon·흔한 이미지 확장자는 제외하고 모든 경로에서 실행.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
