"use client";

import { useMemo, useState } from "react";
import ProbabilitySimulator from "@/components/activities/ProbabilitySimulator";
import CanvaEmbed from "@/components/content-blocks/CanvaEmbed";
import ExternalEmbed from "@/components/content-blocks/ExternalEmbed";
import GoogleDriveEmbed from "@/components/content-blocks/GoogleDriveEmbed";
import YouTubeEmbed from "@/components/content-blocks/YouTubeEmbed";
import { ContentBlock } from "@/lib/activities/activityBlocks";

type ActivityRendererProps = {
  blocks: ContentBlock[];
  sessionId: string;
  studentName?: string;
  studentNumber?: string;
};

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

      <h3 className="mt-3 text-2xl font-bold">{block.title}</h3>

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
  sessionId,
  studentName,
  studentNumber,
}: ActivityRendererProps) {
  const [selectedBlockId, setSelectedBlockId] = useState(blocks[0]?.id ?? "");

  const selectedBlock = useMemo(() => {
    return blocks.find((block) => block.id === selectedBlockId) ?? blocks[0];
  }, [blocks, selectedBlockId]);

  if (!selectedBlock) {
    return (
      <section className="mt-8 rounded-2xl border border-yellow-400/30 bg-yellow-950/30 p-6 text-yellow-100">
        이 활동에 연결된 콘텐츠 블록이 없습니다.
      </section>
    );
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
                  onClick={() => setSelectedBlockId(block.id)}
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
                    {block.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 min-w-0">
        {selectedBlock.type === "text_instruction"
          ? renderTextInstruction(selectedBlock)
          : null}

        {selectedBlock.type === "canva_embed" ? (
          <CanvaEmbed
            title={selectedBlock.title}
            description={selectedBlock.description}
            embedUrl={selectedBlock.content.embedUrl}
            externalUrl={selectedBlock.content.externalUrl}
            height={selectedBlock.content.height}
          />
        ) : null}

        {selectedBlock.type === "youtube_embed" ? (
          <YouTubeEmbed
            title={selectedBlock.title}
            description={selectedBlock.description}
            videoUrl={selectedBlock.content.videoUrl}
            embedUrl={selectedBlock.content.embedUrl}
            height={selectedBlock.content.height}
          />
        ) : null}

        {selectedBlock.type === "google_drive_file" ? (
          <GoogleDriveEmbed
            title={selectedBlock.title}
            description={selectedBlock.description}
            fileUrl={selectedBlock.content.fileUrl}
            embedUrl={selectedBlock.content.embedUrl}
            height={selectedBlock.content.height}
          />
        ) : null}

        {selectedBlock.type === "external_embed" ? (
          <ExternalEmbed
            title={selectedBlock.title}
            description={selectedBlock.description}
            url={selectedBlock.content.url}
            height={selectedBlock.content.height}
          />
        ) : null}

        {selectedBlock.type === "interactive_activity" &&
        selectedBlock.content.activitySlug === "probability-simulator" ? (
          <ProbabilitySimulator
            sessionId={sessionId}
            activitySlug={selectedBlock.content.activitySlug}
            studentName={studentName}
            studentNumber={studentNumber}
          />
        ) : null}

        {selectedBlock.type === "interactive_activity" &&
        selectedBlock.content.activitySlug !== "probability-simulator" ? (
          <section className="rounded-2xl border border-yellow-400/30 bg-yellow-950/30 p-6 text-yellow-100">
            <h3 className="text-xl font-bold">아직 연결되지 않은 미니활동</h3>
            <p className="mt-3 leading-7">
              activitySlug: {selectedBlock.content.activitySlug}
            </p>
          </section>
        ) : null}
      </div>
    </section>
  );
}