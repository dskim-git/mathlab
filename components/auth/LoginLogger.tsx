"use client";

// 4역할(관리자/교사/학생/일반인) layout 에 마운트해, 로그인한 사용자의 일자별 접속 로그를
// KST 기준 하루 1행으로 남긴다. unique(profile_id, log_date) 제약 + upsert(ignoreDuplicates)
// 로 같은 날 여러 페이지 진입해도 첫 번째만 INSERT 된다.

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

function todayKst(): string {
  // 사용자가 한국이라 KST 기준 일자 사용. server timezone 의존 회피.
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function LoginLogger() {
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;
      await supabase.from("login_logs").upsert(
        { profile_id: user.id, log_date: todayKst() },
        { onConflict: "profile_id,log_date", ignoreDuplicates: true }
      );
    })();
    return () => {
      active = false;
    };
  }, []);
  return null;
}
