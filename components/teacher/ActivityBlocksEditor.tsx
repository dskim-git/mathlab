"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  BLOCK_TYPE_OPTIONS,
  ContentBlock,
  createEmptyBlock,
  getBlockTypeLabel,
  validateBlocks,
} from "@/lib/activities/activityBlocks";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Alert } from "@/components/ui/Alert";
import ActivityRenderer from "@/components/activity-renderer/ActivityRenderer";

type ActivityBlocksEditorProps = {
  activityId: string;
  initialContentBlocks: unknown;
};

const fieldClasses =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white " +
  "outline-none transition focus:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40";

const textareaClasses = `resize-y ${fieldClasses}`;

function toBlocks(value: unknown): ContentBlock[] {
  return Array.isArray(value) ? (value as ContentBlock[]) : [];
}

export default function ActivityBlocksEditor({
  activityId,
  initialContentBlocks,
}: ActivityBlocksEditorProps) {
  const router = useRouter();

  const [blocks, setBlocks] = useState<ContentBlock[]>(() =>
    toBlocks(initialContentBlocks)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  function resetFeedback() {
    setMessage("");
    setErrorMessage("");
  }

  function updateBlock(id: string, updater: (block: ContentBlock) => ContentBlock) {
    setBlocks((prev) => prev.map((block) => (block.id === id ? updater(block) : block)));
    resetFeedback();
  }

  // content 객체의 임의 키 갱신(편집기 내부 신뢰 입력이라 캐스팅 허용).
  function setContent(id: string, key: string, value: unknown) {
    updateBlock(
      id,
      (block) =>
        ({
          ...block,
          content: { ...(block.content as Record<string, unknown>), [key]: value },
        }) as ContentBlock
    );
  }

  function addBlock(type: ContentBlock["type"]) {
    const block = createEmptyBlock(type);
    setBlocks((prev) => [...prev, block]);
    setExpandedId(block.id);
    resetFeedback();
  }

  function removeBlock(id: string) {
    if (!window.confirm("이 블록을 삭제할까요? (저장하기 전까지는 되돌릴 수 있습니다)")) {
      return;
    }
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    resetFeedback();
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    resetFeedback();
  }

  async function handleSave() {
    const errors = validateBlocks(blocks);
    if (errors.length > 0) {
      setMessage("");
      setErrorMessage(`저장 전에 확인해 주세요:\n- ${errors.join("\n- ")}`);
      return;
    }

    setIsSaving(true);
    resetFeedback();

    const { error } = await supabase
      .from("activities")
      .update({ content_blocks: blocks })
      .eq("id", activityId);

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("저장했습니다. 학생 활동 화면에 반영됩니다.");
    router.refresh();
  }

  function renderHeightField(block: ContentBlock) {
    const height = (block.content as { height?: number }).height;
    return (
      <TextField
        id={`${block.id}-height`}
        type="number"
        label="높이 px (선택)"
        value={height ?? ""}
        onChange={(event) =>
          setContent(
            block.id,
            "height",
            event.target.value === "" ? undefined : Number(event.target.value)
          )
        }
        hint="비우면 유형별 기본 높이를 사용합니다."
        placeholder="예: 650"
      />
    );
  }

  function renderTypeFields(block: ContentBlock) {
    switch (block.type) {
      case "text_instruction":
        return (
          <div>
            <label
              htmlFor={`${block.id}-body`}
              className="block text-sm font-semibold text-slate-200"
            >
              안내 내용
            </label>
            <textarea
              id={`${block.id}-body`}
              rows={8}
              className={textareaClasses}
              value={block.content.body}
              onChange={(event) => setContent(block.id, "body", event.target.value)}
              placeholder="학생에게 보여줄 안내 문장을 입력하세요. 줄바꿈이 그대로 표시됩니다."
            />
          </div>
        );
      case "canva_embed":
        return (
          <>
            <TextField
              id={`${block.id}-embedUrl`}
              label="Canva 임베드 주소 (embedUrl)"
              value={block.content.embedUrl}
              onChange={(event) => setContent(block.id, "embedUrl", event.target.value)}
              hint="Canva 공유 → 임베드(.../view?embed) 주소"
              placeholder="https://www.canva.com/design/.../view?embed"
            />
            <TextField
              id={`${block.id}-externalUrl`}
              label="새 창 주소 (선택)"
              value={block.content.externalUrl ?? ""}
              onChange={(event) => setContent(block.id, "externalUrl", event.target.value)}
              hint="비우면 임베드 주소를 사용합니다."
              placeholder="https://www.canva.com/design/.../view"
            />
            {renderHeightField(block)}
          </>
        );
      case "youtube_embed":
        return (
          <>
            <TextField
              id={`${block.id}-videoUrl`}
              label="YouTube 영상 주소"
              value={block.content.videoUrl ?? ""}
              onChange={(event) => setContent(block.id, "videoUrl", event.target.value)}
              hint="일반 유튜브 링크를 붙여넣으면 자동으로 임베드됩니다. (youtu.be/... 또는 watch?v=...)"
              placeholder="https://youtu.be/...?start=535"
            />
            <TextField
              id={`${block.id}-embedUrl`}
              label="임베드 주소 (선택·고급)"
              value={block.content.embedUrl ?? ""}
              onChange={(event) => setContent(block.id, "embedUrl", event.target.value)}
              hint="직접 지정하려면 입력. 비우면 위 영상 주소에서 자동 생성합니다."
              placeholder="https://www.youtube.com/embed/...?start=535"
            />
            {renderHeightField(block)}
          </>
        );
      case "google_drive_file":
        return (
          <>
            <TextField
              id={`${block.id}-embedUrl`}
              label="임베드 주소 (preview URL)"
              value={block.content.embedUrl}
              onChange={(event) => setContent(block.id, "embedUrl", event.target.value)}
              hint="Drive 파일 → 공유(링크 보기 허용) → .../preview 주소"
              placeholder="https://drive.google.com/file/d/.../preview"
            />
            <TextField
              id={`${block.id}-fileUrl`}
              label="새 창 주소 (선택)"
              value={block.content.fileUrl ?? ""}
              onChange={(event) => setContent(block.id, "fileUrl", event.target.value)}
              hint="비우면 임베드 주소를 사용합니다."
              placeholder="https://drive.google.com/file/d/.../view"
            />
            {renderHeightField(block)}
          </>
        );
      case "external_embed":
        return (
          <>
            <TextField
              id={`${block.id}-url`}
              label="사이트 주소 (url)"
              value={block.content.url}
              onChange={(event) => setContent(block.id, "url", event.target.value)}
              hint="iframe 임베드가 막힌 사이트는 학생 화면에서 '새 창으로 열기'로 안내됩니다."
              placeholder="https://www.geogebra.org/..."
            />
            {renderHeightField(block)}
          </>
        );
      case "interactive_activity":
        return (
          <>
            <div>
              <label
                htmlFor={`${block.id}-slug`}
                className="block text-sm font-semibold text-slate-200"
              >
                미니활동 종류
              </label>
              <select
                id={`${block.id}-slug`}
                className={fieldClasses}
                value={block.content.activitySlug}
                onChange={(event) => setContent(block.id, "activitySlug", event.target.value)}
              >
                <option value="probability-simulator">
                  확률 시뮬레이터 (probability-simulator)
                </option>
              </select>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                현재 연결된 미니활동은 확률 시뮬레이터뿐입니다. 새 미니활동은 코드 연결이
                필요합니다.
              </p>
            </div>
            <div>
              <label
                htmlFor={`${block.id}-reflection`}
                className="block text-sm font-semibold text-slate-200"
              >
                성찰 유형
              </label>
              <select
                id={`${block.id}-reflection`}
                className={fieldClasses}
                value={block.content.reflectionType}
                onChange={(event) =>
                  setContent(block.id, "reflectionType", event.target.value)
                }
              >
                <option value="simple">간단 성찰</option>
                <option value="deep">심화 성찰</option>
              </select>
            </div>
          </>
        );
    }
  }

  return (
    <section className="mt-8">
      {/* 상단: 안내 + 저장 */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">콘텐츠 블록 편집</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            블록을 추가·수정·삭제하고 순서를 바꾼 뒤 저장하세요. 저장하면 학생 활동
            화면에 그대로 반영됩니다.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPreview((value) => !value)}
          >
            {showPreview ? "미리보기 닫기" : "미리보기"}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      {showPreview ? (
        <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-slate-950 p-4 sm:p-5">
          <p className="text-sm font-semibold text-cyan-300">
            미리보기 · 학생 화면처럼 렌더 (저장 전 편집 내용 반영 · 미니활동은 실행되지 않음)
          </p>
          <ActivityRenderer mode="teacher" blocks={blocks} />
        </div>
      ) : null}

      {/* 블록 추가 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm font-semibold text-slate-200">블록 추가</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {BLOCK_TYPE_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => addBlock(option.type)}
              title={option.hint}
              className="rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
            >
              + {option.label}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <Alert tone="success" className="mt-4 whitespace-pre-wrap">
          {message}
        </Alert>
      ) : null}
      {errorMessage ? (
        <Alert tone="error" className="mt-4 whitespace-pre-wrap">
          {errorMessage}
        </Alert>
      ) : null}

      {/* 블록 목록 */}
      {blocks.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-slate-950 p-6 text-center text-sm text-slate-400">
          아직 블록이 없습니다. 위에서 블록을 추가해 수업 흐름을 구성하세요.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {blocks.map((block, index) => {
            const isExpanded = expandedId === block.id;

            return (
              <div key={block.id} className="rounded-2xl border border-white/10 bg-slate-900">
                {/* 헤더 행 */}
                <div className="flex flex-wrap items-center gap-3 p-4">
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {String(index + 1).padStart(2, "0")} · {getBlockTypeLabel(block.type)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {block.title || "(제목 없음)"}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveBlock(index, -1)}
                      disabled={index === 0}
                      className="rounded-lg border border-white/15 px-2 py-1 text-sm transition hover:bg-white/10 disabled:opacity-40"
                      aria-label="위로 이동"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(index, 1)}
                      disabled={index === blocks.length - 1}
                      className="rounded-lg border border-white/15 px-2 py-1 text-sm transition hover:bg-white/10 disabled:opacity-40"
                      aria-label="아래로 이동"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : block.id)}
                      className="rounded-lg border border-white/15 px-3 py-1 text-sm font-semibold transition hover:bg-white/10"
                    >
                      {isExpanded ? "접기" : "편집"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="rounded-lg border border-red-300/40 px-3 py-1 text-sm font-semibold text-red-200 transition hover:bg-red-300/10"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* 편집 폼 */}
                {isExpanded ? (
                  <div className="space-y-4 border-t border-white/10 p-4">
                    <TextField
                      id={`${block.id}-title`}
                      label="제목"
                      value={block.title}
                      onChange={(event) =>
                        updateBlock(block.id, (current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="블록 제목"
                    />

                    <div>
                      <label
                        htmlFor={`${block.id}-desc`}
                        className="block text-sm font-semibold text-slate-200"
                      >
                        설명 (선택)
                      </label>
                      <textarea
                        id={`${block.id}-desc`}
                        rows={2}
                        className={textareaClasses}
                        value={block.description ?? ""}
                        onChange={(event) =>
                          updateBlock(block.id, (current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="학생에게 보여줄 짧은 설명"
                      />
                    </div>

                    {renderTypeFields(block)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
