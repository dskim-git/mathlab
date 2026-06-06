import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ActivityRenderer from "@/components/activity-renderer/ActivityRenderer";
import { ACTIVITY_REGISTRY } from "@/components/activities/registry";
import { SHORT_ACTIVITY_TITLE } from "@/lib/activities/activityTitles";
import type { ContentBlock } from "@/lib/activities/activityBlocks";

// 공개 활동 페이지 — 비로그인도 활동 하나만 체험 가능.
// 단원 탐색·진척·성찰 저장 모두 OFF (ActivityContextProvider 안 켬 → submit silent skip).
// URL 을 모르면 외부인은 접근 못 함. noindex 로 검색엔진 색인도 차단.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function PublicActivityPage({ params }: Props) {
  const { slug: parts } = await params;
  // catch-all → ["probability_new", "mini", "galton_board"] 같은 배열을 슬러그로 합침.
  const slug = parts.join("/");
  if (!ACTIVITY_REGISTRY[slug]) notFound();

  const title = SHORT_ACTIVITY_TITLE[slug] ?? slug;
  // ActivityRenderer 가 기대하는 ContentBlock 모양으로 1개짜리 배열을 만든다.
  // mode="teacher" + enableReflectionSave=false → ActivityContextProvider 미적용 →
  // ReflectionForm 은 useActivityContext()=null 이라 submit 시 "작성 확인" 안내만 표시.
  const blocks: ContentBlock[] = [
    {
      id: "public",
      type: "interactive_activity",
      title,
      content: { activitySlug: slug, reflectionType: "simple" },
    },
  ];

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-cyan-300">공개 미리보기</p>
            <h1 className="mt-1 text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-xs text-slate-400">
              로그인 없이 활동만 체험할 수 있습니다. 진척·성찰 저장은 동작하지 않습니다.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            MathLab 소개 →
          </Link>
        </div>
        <ActivityRenderer blocks={blocks} mode="teacher" publicMode />
      </div>
    </main>
  );
}
