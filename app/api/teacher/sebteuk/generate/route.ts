import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  SEBTEUK_SYSTEM_PROMPT,
  SEBTEUK_MODELS,
  DEFAULT_SEBTEUK_MODEL,
} from "@/lib/ai/sebteukPrompt";
import {
  getEnabledSebteukModels,
  getEnabledSebteukModelsForTeacher,
} from "@/lib/ai/enabledModels";

/**
 * POST /api/teacher/sebteuk/generate
 * body: { studentRecord: string, targetBytes?: number, subject?: string, model?: string }
 *
 * 보안: 호출자 = ai_sebteuk_enabled=true 인 교사(또는 관리자) 인지 검증.
 * Anthropic Messages API 직접 호출 (SDK 없이 fetch). prompt caching 적용.
 */

const ANTHROPIC_VERSION = "2023-06-01";
const MAX_TOKENS = 2000;

type AllowedModel = (typeof SEBTEUK_MODELS)[number]["id"];

function isAllowedModel(m: string): m is AllowedModel {
  return SEBTEUK_MODELS.some((x) => x.id === m);
}

export async function POST(req: Request) {
  // 1) 호출자 검증
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
  if (
    !p ||
    p.status !== "approved" ||
    (p.role !== "teacher" && p.role !== "admin")
  ) {
    return NextResponse.json(
      { ok: false, error: "교사·관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }
  if (p.role === "teacher") {
    const { data: teacherRow } = await supabase
      .from("teachers")
      .select("ai_sebteuk_enabled")
      .eq("profile_id", user.id)
      .maybeSingle();
    const t = teacherRow as { ai_sebteuk_enabled: boolean } | null;
    if (!t?.ai_sebteuk_enabled) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "AI세특 사용 권한이 없습니다. 관리자에게 권한을 요청해 주세요.",
        },
        { status: 403 }
      );
    }
  }

  // 2) API 키 확인
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "ANTHROPIC_API_KEY 가 설정되지 않았습니다. .env.local 에 추가 후 dev 서버를 재시작하세요.",
      },
      { status: 500 }
    );
  }

  // 3) body 파싱
  let body: {
    studentRecord?: string;
    targetBytes?: number;
    subject?: string;
    model?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 본문입니다." },
      { status: 400 }
    );
  }
  const record = body.studentRecord?.trim();
  if (!record) {
    return NextResponse.json(
      { ok: false, error: "학생 활동 기록(studentRecord)이 비어있습니다." },
      { status: 400 }
    );
  }
  const targetBytes = Math.min(Math.max(body.targetBytes ?? 1500, 300), 4000);
  const subject = (body.subject ?? "수학").trim();
  const requestedModel: AllowedModel =
    body.model && isAllowedModel(body.model)
      ? body.model
      : DEFAULT_SEBTEUK_MODEL;

  // 허용 목록 검증 — 관리자는 글로벌, 교사는 글로벌 ∩ 본인 허용
  const enabledModels =
    p.role === "admin"
      ? await getEnabledSebteukModels(supabase)
      : await getEnabledSebteukModelsForTeacher(supabase, user.id);
  if (!enabledModels.includes(requestedModel)) {
    return NextResponse.json(
      {
        ok: false,
        error: `해당 모델은 관리자가 허용하지 않았습니다. 허용 모델: ${enabledModels.join(", ")}`,
      },
      { status: 403 }
    );
  }
  const model: AllowedModel = requestedModel;

  // 4) Anthropic Messages API 호출 (prompt caching 적용)
  const userMessage =
    `과목: ${subject}\n` +
    `목표 분량: 약 ${targetBytes}바이트 (한글 약 ${Math.round(
      targetBytes / 3
    )}자 내외).\n\n` +
    `[학생 활동 기록]\n${record}`;

  const apiBody = {
    model,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SEBTEUK_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
        "anthropic-beta": "prompt-caching-2024-07-31",
      },
      body: JSON.stringify(apiBody),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: `Anthropic 호출 실패: ${msg}` },
      { status: 502 }
    );
  }

  const respText = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Anthropic 오류 (${res.status}): ${respText.slice(0, 500)}`,
      },
      { status: 502 }
    );
  }

  type AnthropicResp = {
    content: { type: string; text?: string }[];
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  let parsed: AnthropicResp;
  try {
    parsed = JSON.parse(respText) as AnthropicResp;
  } catch {
    return NextResponse.json(
      { ok: false, error: "응답 파싱 실패" },
      { status: 502 }
    );
  }

  const text = parsed.content
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("\n")
    .trim();

  const usage = {
    model,
    input: parsed.usage?.input_tokens ?? 0,
    output: parsed.usage?.output_tokens ?? 0,
    cache_read: parsed.usage?.cache_read_input_tokens ?? 0,
    cache_write: parsed.usage?.cache_creation_input_tokens ?? 0,
  };

  // 사용량 로그 — 실패해도 사용자에게 영향 X (조용히 무시)
  // 본인 행만 INSERT 가능한 RLS 정책으로 보호.
  try {
    await supabase.from("ai_usage_log").insert({
      teacher_id: user.id,
      feature: "sebteuk",
      model,
      input_tokens: usage.input,
      output_tokens: usage.output,
      cache_read_tokens: usage.cache_read,
      cache_write_tokens: usage.cache_write,
    });
  } catch {
    // 로깅 실패는 응답에 영향 X
  }

  return NextResponse.json({ ok: true, text, usage });
}
