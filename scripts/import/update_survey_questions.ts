/**
 * surveys.questions 를 옛 스트림릿 코드(survey_pre.py / survey_post.py)의
 * 진짜 질문 문장으로 update.
 *
 * 시트 헤더(`[A]흥미1` 등)는 코드명일 뿐 진짜 질문 문장이 아님.
 * 학생이 실제로 본 질문 텍스트는 survey_pre.py CATEGORIES 안의 label.
 *
 * 실행:
 *   npx tsx scripts/import/update_survey_questions.ts --dry-run
 *   npx tsx scripts/import/update_survey_questions.ts
 *
 * 응답 데이터(survey_responses.answers)의 key 는 시트 컬럼명(예: "[A]흥미1")
 * 그대로라, 새 questions[].id 가 동일하게 유지되어 매핑 자동.
 */

import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("❌ env 필요");
  process.exit(1);
}
const DRY_RUN = process.argv.includes("--dry-run");

type Question = {
  id: string;
  prompt: string;
  kind: "scale" | "text";
  reverse?: boolean;
};

// ─── PRE 설문 — 6 카테고리 × 3~4 문항 = 20 (시트 PRE 헤더와 일치)  ──────
const PRE_QUESTIONS: Question[] = [
  // A. 수학 학습 흥미도
  { id: "[A]흥미1", prompt: "나는 수학 시간이 기다려진다.", kind: "scale" },
  { id: "[A]흥미2", prompt: "나는 수학 문제를 풀 때 즐거움을 느낀다.", kind: "scale" },
  { id: "[A]흥미3", prompt: "나는 수학이 실생활과 연결된다고 느낀다.", kind: "scale" },
  { id: "[A]흥미4", prompt: "나는 새로운 수학 개념을 배울 때 설레는 편이다.", kind: "scale" },
  // B. 수학 자기효능감
  { id: "[B]효능1", prompt: "나는 새로운 수학 개념을 스스로 이해할 수 있다고 생각한다.", kind: "scale" },
  { id: "[B]효능2", prompt: "나는 어려운 수학 문제도 노력하면 풀 수 있다고 생각한다.", kind: "scale" },
  { id: "[B]효능3", prompt: "나는 수학 개념들 사이의 연결 관계를 스스로 찾아낼 수 있다고 생각한다.", kind: "scale" },
  { id: "[B]효능4", prompt: "나는 수학 문제를 풀기 위한 다양한 방법을 스스로 생각해낼 수 있다.", kind: "scale" },
  // C. 수학 불안감 (★ 역방향)
  { id: "[C]불안1", prompt: "★ 수학 시험이 다가오면 불안하고 초조해진다.", kind: "scale", reverse: true },
  { id: "[C]불안2", prompt: "★ 수학 문제가 잘 풀리지 않으면 포기하고 싶어진다.", kind: "scale", reverse: true },
  { id: "[C]불안3", prompt: "★ 수학은 나에게 너무 어렵게 느껴진다.", kind: "scale", reverse: true },
  // D. ICT 활용 학습 태도
  { id: "[D]ICT1", prompt: "나는 디지털 도구를 활용하면 수학 개념을 더 잘 이해할 수 있을 것 같다.", kind: "scale" },
  { id: "[D]ICT2", prompt: "나는 시각적 자료(그래프, 애니메이션)가 수학 이해에 도움이 된다고 생각한다.", kind: "scale" },
  { id: "[D]ICT3", prompt: "나는 인터랙티브(직접 조작하는) 학습 도구에 관심이 있다.", kind: "scale" },
  // E. 수학적 시각화
  { id: "[E]시각1", prompt: "나는 그래프나 그림으로 표현된 수학 개념이 더 이해하기 쉽다.", kind: "scale" },
  { id: "[E]시각2", prompt: "나는 수학 공식을 외우는 것보다 개념의 원리를 이해하는 것이 더 중요하다고 생각한다.", kind: "scale" },
  { id: "[E]시각3", prompt: "나는 수학 개념이 변화하는 과정을 눈으로 보면서 배우고 싶다.", kind: "scale" },
  // F. 수학 학습 방법
  { id: "[F]학습1", prompt: "나는 수학을 배울 때 직접 조작하거나 탐구하는 활동이 강의식 수업보다 효과적이라고 생각한다.", kind: "scale" },
  { id: "[F]학습2", prompt: "나는 수학 개념을 배울 때 실생활 맥락이 함께 제시되면 이해가 더 잘 된다.", kind: "scale" },
  { id: "[F]학습3", prompt: "나는 수학 학습에서 내가 직접 규칙이나 패턴을 발견하는 경험이 중요하다고 생각한다.", kind: "scale" },
];

// ─── POST 설문 — 6 카테고리 likert + J 자유 서술 ─────────────────────────
const POST_QUESTIONS: Question[] = [
  // A/B
  { id: "[A]흥미1", prompt: "나는 수학 시간이 기다려진다.", kind: "scale" },
  { id: "[A]흥미2", prompt: "나는 수학이 실생활과 연결된다고 느낀다.", kind: "scale" },
  { id: "[B]효능1", prompt: "나는 새로운 수학 개념을 스스로 이해할 수 있다고 생각한다.", kind: "scale" },
  { id: "[B]효능2", prompt: "나는 어려운 수학 문제도 노력하면 풀 수 있다고 생각한다.", kind: "scale" },
  // C/D
  { id: "[C]불안1", prompt: "★ 수학 시험이 다가오면 불안하고 초조해진다.", kind: "scale", reverse: true },
  { id: "[C]불안2", prompt: "★ 수학 문제가 잘 풀리지 않으면 포기하고 싶어진다.", kind: "scale", reverse: true },
  { id: "[D]ICT1", prompt: "나는 디지털 도구를 활용하면 수학 개념을 더 잘 이해할 수 있다.", kind: "scale" },
  { id: "[D]ICT2", prompt: "나는 시각적 자료(그래프, 애니메이션)가 수학 이해에 도움이 된다.", kind: "scale" },
  // E/F
  { id: "[E]시각1", prompt: "나는 그래프나 그림으로 표현된 수학 개념이 더 이해하기 쉽다.", kind: "scale" },
  { id: "[E]시각2", prompt: "나는 수학 개념이 변화하는 과정을 눈으로 보면서 배우고 싶다.", kind: "scale" },
  { id: "[F]학습1", prompt: "직접 조작하거나 탐구하는 활동이 강의식 수업보다 효과적이라고 생각한다.", kind: "scale" },
  { id: "[F]학습2", prompt: "수학 학습에서 내가 직접 규칙이나 패턴을 발견하는 경험이 중요하다고 생각한다.", kind: "scale" },
  // G. 웹앱 활용 경험
  { id: "[G]앱1", prompt: "이 웹앱의 시각적 자료(그래프, 시뮬레이션)는 개념 이해에 도움이 되었다.", kind: "scale" },
  { id: "[G]앱2", prompt: "이 웹앱의 인터랙티브 활동은 수업에 대한 흥미를 높여주었다.", kind: "scale" },
  { id: "[G]앱3", prompt: "이 웹앱은 교과서만으로 이해하기 어려운 개념을 이해하는 데 도움이 되었다.", kind: "scale" },
  // H. 개념 이해 효과
  { id: "[H]개념1", prompt: "이 웹앱 활동을 통해 수학 개념의 원리를 더 잘 이해하게 되었다.", kind: "scale" },
  { id: "[H]개념2", prompt: "이 웹앱에서 값을 직접 바꿔가며 결과를 확인하는 과정이 개념 이해에 효과적이었다.", kind: "scale" },
  { id: "[H]개념3", prompt: "이 웹앱 활동 후 비슷한 유형의 문제를 스스로 풀어보고 싶다는 생각이 들었다.", kind: "scale" },
  // I. 수업 방식 선호
  { id: "[I]수업1", prompt: "이 웹앱을 활용한 수업 방식이 기존 강의식 수업보다 더 효과적이었다.", kind: "scale" },
  { id: "[I]수업2", prompt: "앞으로도 이와 같은 디지털 탐구 활동이 수학 수업에 포함되었으면 한다.", kind: "scale" },
  // J. 자유 서술
  { id: "[J]서술1", prompt: "이 웹앱을 사용하면서 수학 개념 이해에 가장 도움이 되었던 활동은 무엇인가요? 이유도 함께 써주세요.", kind: "text" },
  { id: "[J]서술2", prompt: "이 웹앱이 수학에 대한 나의 생각이나 태도에 어떤 변화를 주었나요?", kind: "text" },
];

async function main() {
  console.log(`Mode: ${DRY_RUN ? "🔵 DRY-RUN" : "🔴 LIVE"}`);
  const sb = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const { slug, qs, label } of [
    { slug: "pre_survey_2026", qs: PRE_QUESTIONS, label: "사전" },
    { slug: "post_survey_2026", qs: POST_QUESTIONS, label: "사후" },
  ]) {
    console.log(`\n=== ${label} (${slug}) — ${qs.length}문항 ===`);
    if (DRY_RUN) {
      qs.slice(0, 3).forEach((q) => console.log(`  - ${q.id}: ${q.prompt}`));
      if (qs.length > 3) console.log(`  ... (+${qs.length - 3})`);
      continue;
    }
    const { error } = await sb
      .from("surveys")
      .update({ questions: qs })
      .eq("slug", slug);
    if (error) {
      console.log(`  ❌ ${slug}: ${error.message}`);
    } else {
      console.log(`  ✅ ${slug} 질문 ${qs.length}개 업데이트 완료`);
    }
  }

  console.log("\n✅ 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
