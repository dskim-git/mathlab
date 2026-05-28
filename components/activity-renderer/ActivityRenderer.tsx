"use client";

import { useMemo, useState } from "react";
import ProbabilitySimulator from "@/components/activities/ProbabilitySimulator";
import { ACTIVITY_REGISTRY } from "@/components/activities/registry";
import CanvaEmbed from "@/components/content-blocks/CanvaEmbed";
import ExternalEmbed from "@/components/content-blocks/ExternalEmbed";
import GoogleDriveEmbed from "@/components/content-blocks/GoogleDriveEmbed";
import YouTubeEmbed from "@/components/content-blocks/YouTubeEmbed";
import { ContentBlock } from "@/lib/activities/activityBlocks";

type ActivityRendererProps = {
  blocks: ContentBlock[];
  /** student=학생 실제 활동(제출 가능) / teacher=교사 미리보기·수업 화면(미니활동 제출 없음). */
  mode?: "student" | "teacher";
  sessionId?: string;

  activityId?: string;
  activitySlug?: string;
  activitySubject?: string | null;

  studentId?: string;
  studentLoginId?: string;
  studentName?: string;
  studentNumber?: string;
  studentGrade?: string;
  studentClassNumber?: string;
  studentCode?: string;
};

// 긴 미니활동 제목을 목차용 짧은 이름으로 대체(슬러그 기준). 없으면 "미니:" 접두어만 제거.
// 블록 타입 배지(미니활동)가 이미 표시되므로 제목에 "미니:"는 중복이라 떼어 낸다.
const SHORT_ACTIVITY_TITLE: Record<string, string> = {
  "probability_new/mini/rep_perm_dice": "주사위와 중복순열",
  "probability_new/mini/tricolor_flag_perm": "삼색기 순열",
  "probability_new/mini/cube_path_perm": "정육면체 최단경로 순열",
  "probability_new/mini/word_diamond_perm": "단어 다이아몬드 순열",
  "probability_new/mini/morra_game": "손가락 게임 ‘모라’",
  "probability_new/mini/polygon_count_circles": "원 위의 점으로 만든 도형",
  "probability_new/mini/pascal_fractal": "파스칼 삼각형 속 프랙털",
  "probability_new/mini/statistical_prob_sim": "통계적 확률 탐험대",
  "probability_new/mini/stat_prob_experiment": "통계적 확률 실험실",
  "probability/mini/dice_lab": "주사위 실험",
  "probability_new/mini/buffon_needle_mini": "뷔퐁의 바늘 실험",
  "probability_new/mini/bertrand_paradox_mini": "베르트랑의 역설",
  "probability_new/mini/prob_basic_properties": "확률의 기본 성질",
  "probability_new/mini/prob_addition_theorem": "확률의 덧셈정리",
};

function displayBlockTitle(block: ContentBlock): string {
  if (block.type === "interactive_activity") {
    const short = SHORT_ACTIVITY_TITLE[block.content.activitySlug];
    if (short) {
      return short;
    }
  }
  // "미니:" 접두어 제거(앞에 이모지가 있어도 첫 "미니:"를 떼어 냄).
  return block.title.replace(/미니:\s*/, "").trim();
}

function getBlockTypeLabel(type: ContentBlock["type"]) {
  if (type === "text_instruction") {
    return "안내";
  }

  if (type === "canva_embed") {
    return "Canva";
  }

  if (type === "youtube_embed") {
    return "영상";
  }

  if (type === "google_drive_file") {
    return "PDF/파일";
  }

  if (type === "external_embed") {
    return "외부자료";
  }

  if (type === "interactive_activity") {
    return "미니활동";
  }

  return "블록";
}

function renderTextInstruction(
  block: Extract<ContentBlock, { type: "text_instruction" }>
) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-6">
      <p className="text-sm font-semibold text-cyan-300">활동 안내</p>

      <h3 className="mt-3 text-2xl font-bold">{displayBlockTitle(block)}</h3>

      {block.description ? (
        <p className="mt-3 leading-7 text-slate-300">{block.description}</p>
      ) : null}

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="whitespace-pre-wrap leading-8 text-slate-100">
          {block.content.body}
        </p>
      </div>
    </section>
  );
}

export default function ActivityRenderer({
  blocks,
  mode = "student",
  sessionId,
  activityId,
  activitySlug,
  activitySubject,
  studentId,
  studentLoginId,
  studentName,
  studentNumber,
  studentGrade,
  studentClassNumber,
  studentCode,
}: ActivityRendererProps) {
  const [selectedBlockId, setSelectedBlockId] = useState(blocks[0]?.id ?? "");

  const selectedBlock = useMemo(() => {
    return blocks.find((block) => block.id === selectedBlockId) ?? blocks[0];
  }, [blocks, selectedBlockId]);

  // 방문한 블록은 언마운트하지 않고 숨김 유지 → iframe(PPT/PDF) 상태가 보존된다.
  // 처음 본 블록만 마운트(지연 로드)하고, 이후 전환 시엔 hidden 으로 숨겨 둔다.
  const [visitedIds, setVisitedIds] = useState<Set<string>>(
    () => new Set(blocks[0]?.id ? [blocks[0].id] : [])
  );

  function selectBlock(id: string) {
    setSelectedBlockId(id);
    setVisitedIds((prev) => {
      if (prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  if (!selectedBlock) {
    return (
      <section className="mt-8 rounded-2xl border border-yellow-400/30 bg-yellow-950/30 p-6 text-yellow-100">
        이 활동에 연결된 콘텐츠 블록이 없습니다.
      </section>
    );
  }

  // 블록 1개의 콘텐츠 JSX. 본문에서 방문한 블록마다 호출해 숨김/표시로 유지한다.
  function renderBlockContent(block: ContentBlock) {
    switch (block.type) {
      case "text_instruction":
        return renderTextInstruction(block);
      case "canva_embed":
        return (
          <CanvaEmbed
            title={block.title}
            description={block.description}
            embedUrl={block.content.embedUrl}
            externalUrl={block.content.externalUrl}
            height={block.content.height}
          />
        );
      case "youtube_embed":
        return (
          <YouTubeEmbed
            title={block.title}
            description={block.description}
            videoUrl={block.content.videoUrl}
            embedUrl={block.content.embedUrl}
            height={block.content.height}
          />
        );
      case "google_drive_file":
        return (
          <GoogleDriveEmbed
            title={block.title}
            description={block.description}
            fileUrl={block.content.fileUrl}
            embedUrl={block.content.embedUrl}
            height={block.content.height}
          />
        );
      case "external_embed":
        return (
          <ExternalEmbed
            title={block.title}
            description={block.description}
            url={block.content.url}
            height={block.content.height}
          />
        );
      case "interactive_activity": {
        const slug = block.content.activitySlug;

        if (slug === "probability-simulator") {
          return (
            <ProbabilitySimulator
              allowSubmit={mode === "student"}
              sessionId={sessionId ?? ""}
              activityId={activityId}
              activitySlug={activitySlug ?? slug}
              activitySubject={activitySubject}
              studentId={studentId}
              studentLoginId={studentLoginId}
              studentName={studentName}
              studentNumber={studentNumber}
              studentGrade={studentGrade}
              studentClassNumber={studentClassNumber}
              studentCode={studentCode}
            />
          );
        }

        const Ported = ACTIVITY_REGISTRY[slug];
        if (Ported) {
          return <Ported />;
        }

        return (
          <section className="rounded-2xl border border-yellow-400/30 bg-yellow-950/30 p-6 text-yellow-100">
            <p className="text-sm font-semibold text-yellow-300/80">
              미니활동 · 준비 중
            </p>
            <h3 className="mt-2 text-xl font-bold">{displayBlockTitle(block)}</h3>
            <p className="mt-3 leading-7 text-yellow-100/90">
              이 미니활동은 아직 새 앱으로 옮기는 중입니다. 곧 여기에서 직접 활동할 수
              있게 됩니다.
            </p>
            <p className="mt-2 text-xs text-yellow-200/50">{slug}</p>
          </section>
        );
      }
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900 p-5">
      <div className="border-b border-white/10 pb-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-300">
              수업 블록 목차
            </p>
            <p className="mt-2 text-sm text-slate-400">
              필요한 자료나 활동을 선택하면 아래 영역에 크게 표시됩니다.
            </p>
          </div>

          <p className="text-sm text-slate-400">
            {blocks.findIndex((block) => block.id === selectedBlock.id) + 1} /{" "}
            {blocks.length}
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-1">
            {blocks.map((block, index) => {
              const isSelected = block.id === selectedBlock.id;

              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => selectBlock(block.id)}
                  className={
                    isSelected
                      ? "min-w-[170px] rounded-xl border border-cyan-300/50 bg-cyan-300/10 px-4 py-3 text-left text-sm font-semibold text-cyan-100"
                      : "min-w-[170px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/10"
                  }
                >
                  <span className="block text-xs text-slate-400">
                    {String(index + 1).padStart(2, "0")} ·{" "}
                    {getBlockTypeLabel(block.type)}
                  </span>
                  <span className="mt-1 block whitespace-nowrap">
                    {displayBlockTitle(block)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 min-w-0">
        {blocks.map((block) =>
          visitedIds.has(block.id) ? (
            <div
              key={block.id}
              className={block.id === selectedBlock.id ? undefined : "hidden"}
            >
              {renderBlockContent(block)}
            </div>
          ) : null
        )}
      </div>
    </section>
  );
}