"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProbabilitySimulator from "@/components/activities/ProbabilitySimulator";
import { ACTIVITY_REGISTRY } from "@/components/activities/registry";
import { ActivityContextProvider } from "@/components/activities/ActivityContext";
import CanvaEmbed from "@/components/content-blocks/CanvaEmbed";
import ExternalEmbed from "@/components/content-blocks/ExternalEmbed";
import GoogleDriveEmbed from "@/components/content-blocks/GoogleDriveEmbed";
import YouTubeEmbed from "@/components/content-blocks/YouTubeEmbed";
import { ContentBlock } from "@/lib/activities/activityBlocks";
import { SHORT_ACTIVITY_TITLE } from "@/lib/activities/activityTitles";

type ActivityRendererProps = {
  blocks: ContentBlock[];
  /** student=학생 실제 활동(제출 가능) / teacher=교사 미리보기·수업 화면(미니활동 제출 없음). */
  mode?: "student" | "teacher";
  /**
   * 이식 미니활동(ReflectionForm) 의 자동 저장 Context 활성화. /learn 동선처럼
   * 세션 없이 학생이 직접 활동할 때 켠다. mode 와 독립적이라 ProbabilitySimulator 의
   * 세션 기반 제출 동작은 영향받지 않는다. (학생 행 없으면 submit 시 silent skip)
   */
  enableReflectionSave?: boolean;
  sessionId?: string;

  /**
   * 외부(예: /learn 검색)에서 특정 블록을 바로 열어 줄 때 사용. 마운트 시 그 블록을
   * 선택하고, 이후에도 prop 이 새 값으로 바뀌면 그 블록으로 전환 + 콘텐츠 영역으로 스크롤한다.
   * 알 수 없는 id 면 무시.
   */
  initialBlockId?: string;

  /**
   * (옵션) 학생의 성찰 제출이 있는 활동 슬러그 집합. 상단 수업블록 목차 칩에서
   * 해당 interactive_activity 블록 옆에 ⭐ 표시. 비우면(undefined) 인디케이터 비표시.
   */
  reflectedSlugs?: Set<string>;

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

  /**
   * 공개 페이지 동선 — ActivityContext 를 hideReflection=true 로 켜서 활동 컴포넌트
   * 안의 ReflectionForm 을 숨긴다. mode/enableReflectionSave 와는 독립.
   */
  publicMode?: boolean;
  /**
   * 관리자 전용. interactive_activity 블록 본문 위에 "🔗 공개 링크 복사" 버튼 표시.
   * 클릭 시 /public/activity/<slug> URL 을 클립보드에 복사.
   */
  enableShareButton?: boolean;
};

// 미니활동 제목 짧은 이름 매핑은 lib/activities/activityTitles.ts.

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
  enableReflectionSave = false,
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
  initialBlockId,
  reflectedSlugs,
  publicMode = false,
  enableShareButton = false,
}: ActivityRendererProps) {
  // initialBlockId 가 유효(블록 목록에 있음)하면 그걸 첫 선택으로, 아니면 첫 블록.
  const firstSelectedId = useMemo(() => {
    if (initialBlockId && blocks.some((b) => b.id === initialBlockId)) {
      return initialBlockId;
    }
    return blocks[0]?.id ?? "";
    // 마운트 1회 — 이후 변경은 아래 useEffect 가 처리.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedBlockId, setSelectedBlockId] = useState(firstSelectedId);

  const selectedBlock = useMemo(() => {
    return blocks.find((block) => block.id === selectedBlockId) ?? blocks[0];
  }, [blocks, selectedBlockId]);

  // 방문한 블록은 언마운트하지 않고 숨김 유지 → iframe(PPT/PDF) 상태가 보존된다.
  // 처음 본 블록만 마운트(지연 로드)하고, 이후 전환 시엔 hidden 으로 숨겨 둔다.
  const [visitedIds, setVisitedIds] = useState<Set<string>>(
    () => new Set(firstSelectedId ? [firstSelectedId] : [])
  );

  // 검색 → 활동 칩 클릭처럼 외부에서 initialBlockId 가 새 값으로 바뀌면 그 블록으로 전환.
  // 같은 ActivityRenderer 인스턴스 안에서 활동만 바꾸는 경우(같은 잎)도 커버.
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!initialBlockId) return;
    if (!blocks.some((b) => b.id === initialBlockId)) return;
    setSelectedBlockId(initialBlockId);
    setVisitedIds((prev) => {
      if (prev.has(initialBlockId)) return prev;
      const next = new Set(prev);
      next.add(initialBlockId);
      return next;
    });
    // 다음 프레임에 콘텐츠 영역으로 스크롤(레이아웃이 자리잡은 뒤).
    requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [initialBlockId, blocks]);

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
          // 학생 모드(세션 동선) 또는 enableReflectionSave(/learn 동선)면 자동 저장 Context 활성화.
          // 교사 미리보기·수업 편집에선 비활성(props 둘 다 꺼짐).
          // 블록 설정의 reflectionType 을 Context 에 흘려 ReflectionForm 이 공통 질문 깊이를 결정.
          const reflectionDepth: "simple" | "deep" =
            block.content.reflectionType === "deep" ? "deep" : "simple";
          // 공개 페이지 동선이면 Provider 를 hideReflection=true 로 켜서 폼 자체 숨김.
          // (자동 저장 분기보다 먼저 처리 — publicMode 가 모든 옵션을 덮어쓴다.)
          if (publicMode) {
            return (
              <ActivityContextProvider
                value={{
                  activitySlug: slug,
                  subject: activitySubject ?? null,
                  reflectionDepth,
                  hideReflection: true,
                }}
              >
                <Ported />
              </ActivityContextProvider>
            );
          }
          if (mode === "student" || enableReflectionSave) {
            return (
              <ActivityContextProvider
                value={{
                  activitySlug: slug,
                  subject: activitySubject ?? null,
                  reflectionDepth,
                }}
              >
                <Ported />
              </ActivityContextProvider>
            );
          }
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
    <section
      ref={rootRef}
      className="mt-8 scroll-mt-4 rounded-2xl border border-white/10 bg-slate-900 p-5"
    >
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
              const reflected =
                block.type === "interactive_activity" &&
                reflectedSlugs?.has(block.content.activitySlug);

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
                  title={reflected ? "성찰 제출 완료" : undefined}
                >
                  <span className="block text-xs text-slate-400">
                    {String(index + 1).padStart(2, "0")} ·{" "}
                    {getBlockTypeLabel(block.type)}
                  </span>
                  <span className="mt-1 block whitespace-nowrap">
                    {reflected ? (
                      <span className="mr-1 text-amber-300">⭐</span>
                    ) : null}
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
              {block.type === "interactive_activity" && enableShareButton ? (
                <ShareLinkBar slug={block.content.activitySlug} />
              ) : null}
              {renderBlockContent(block)}
            </div>
          ) : null
        )}
      </div>
    </section>
  );
}

// 관리자 전용 — interactive_activity 블록 본문 우측 상단에 떠 있는 작은 액션 바.
// /public/activity/<slug> URL 을 클립보드에 복사. HTTPS 또는 localhost 에서만 동작.
function ShareLinkBar({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copy() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/public/activity/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setError(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 권한 거부 등 — fallback 으로 prompt 띄움.
      setError(true);
      window.prompt("이 URL 을 복사하세요:", url);
    }
  }
  return (
    <div className="mb-2 flex justify-end">
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-amber-300/45 px-3 py-1 text-xs font-semibold text-amber-200 transition hover:bg-amber-300/10"
        title="비로그인도 열 수 있는 활동 공개 URL 을 클립보드에 복사 (관리자 전용)"
      >
        🔗 {copied ? "복사됨!" : error ? "복사 실패 — 수동 복사" : "공개 링크 복사"}
      </button>
    </div>
  );
}