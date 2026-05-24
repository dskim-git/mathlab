import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Phase 3a: 세션을 localStorage 대신 쿠키에 저장한다(서버가 읽을 수 있도록).
// createBrowserClient는 document.cookie로 세션을 읽고/쓰며, 토큰 자동 갱신도
// 브라우저에서 그대로 동작한다. 기존 `supabase` import는 그대로 호환된다.
// (서버측 클라이언트와 proxy 토큰 갱신은 3a-2에서 추가)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
