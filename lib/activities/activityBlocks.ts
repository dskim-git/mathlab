export type ReflectionType = "simple" | "deep";

export type TextInstructionBlock = {
  id: string;
  type: "text_instruction";
  title: string;
  description?: string;
  content: {
    body: string;
  };
};

export type CanvaEmbedBlock = {
  id: string;
  type: "canva_embed";
  title: string;
  description?: string;
  content: {
    embedUrl: string;
    externalUrl?: string;
    height?: number;
  };
};

export type YouTubeEmbedBlock = {
  id: string;
  type: "youtube_embed";
  title: string;
  description?: string;
  content: {
    videoUrl?: string;
    embedUrl?: string;
    height?: number;
  };
};

export type GoogleDriveFileBlock = {
  id: string;
  type: "google_drive_file";
  title: string;
  description?: string;
  content: {
    fileUrl?: string;
    embedUrl: string;
    height?: number;
  };
};

export type ExternalEmbedBlock = {
  id: string;
  type: "external_embed";
  title: string;
  description?: string;
  content: {
    url: string;
    height?: number;
  };
};

export type InteractiveActivityBlock = {
  id: string;
  type: "interactive_activity";
  title: string;
  description?: string;
  content: {
    activitySlug: string;
    reflectionType: ReflectionType;
  };
};

export type ContentBlock =
  | TextInstructionBlock
  | CanvaEmbedBlock
  | YouTubeEmbedBlock
  | GoogleDriveFileBlock
  | ExternalEmbedBlock
  | InteractiveActivityBlock;

export function getActivityBlocksForSlug(activitySlug: string): ContentBlock[] {
  if (activitySlug === "probability-simulator") {
    return [
      {
        id: "probability-intro",
        type: "text_instruction",
        title: "활동 안내",
        description: "이항분포 시뮬레이션 활동의 전체 흐름입니다.",
        content: {
          body: "이번 활동에서는 같은 시행을 여러 번 반복했을 때 성공 횟수가 어떤 분포를 이루는지 관찰합니다.\n\n먼저 수업 자료와 영상을 확인한 뒤, 확률 시뮬레이터를 실행해 보세요. 시뮬레이션 결과의 평균과 분산을 이론값과 비교하고, 그래프를 통해 상대도수와 이론확률의 차이를 살펴봅니다.\n\n마지막에는 관찰한 내용을 바탕으로 결과 해석과 성찰을 제출합니다.",
        },
      },
      {
        id: "probability-canva-ppt",
        type: "canva_embed",
        title: "수업 진행용 Canva PPT",
        description:
          "Canva로 제작한 수업 진행 자료입니다. 임베딩이 잘 되는지 확인합니다.",
        content: {
          embedUrl:
            "https://www.canva.com/design/DAHHubI7TPY/TE4S7QmetsL7EWiTgCAITg/view?embed",
          externalUrl:
            "https://www.canva.com/design/DAHHubI7TPY/TE4S7QmetsL7EWiTgCAITg/view?embed",
          height: 650,
        },
      },
      {
        id: "probability-youtube-video",
        type: "youtube_embed",
        title: "관련 개념 영상",
        description:
          "YouTube 영상 임베딩 테스트입니다. 지정한 시작 지점부터 재생되도록 embedUrl을 사용합니다.",
        content: {
          videoUrl: "https://youtu.be/InAIZ3tP_Mk?si=pQoxDuxJBC1AsC3b&start=535",
          embedUrl: "https://www.youtube.com/embed/InAIZ3tP_Mk?start=535",
          height: 420,
        },
      },
      {
        id: "probability-drive-pdf",
        type: "google_drive_file",
        title: "Google Drive PDF 활동지",
        description:
          "Google Drive에 업로드한 PDF 자료 임베딩 테스트입니다.",
        content: {
          fileUrl:
            "https://drive.google.com/file/d/1-0MKRkeaYx_-5X6yWR7ASIbI5mNTg0Dn/preview",
          embedUrl:
            "https://drive.google.com/file/d/1-0MKRkeaYx_-5X6yWR7ASIbI5mNTg0Dn/preview",
          height: 720,
        },
      },
      {
        id: "probability-external-site",
        type: "external_embed",
        title: "외부 사이트 자료",
        description:
          "외부 사이트 임베딩 테스트입니다. 사이트 정책에 따라 iframe 표시가 차단될 수 있으며, 이 경우 새 창으로 열기를 사용합니다.",
        content: {
          url: "https://tong.kostat.go.kr/tongramy_web/main.do?menuSn=163#",
          height: 700,
        },
      },
      {
        id: "probability-simulator",
        type: "interactive_activity",
        title: "확률 시뮬레이터",
        description:
          "동전, 주사위, 직접 설정한 성공확률로 이항분포를 탐구합니다.",
        content: {
          activitySlug: "probability-simulator",
          reflectionType: "simple",
        },
      },
    ];
  }

  return [
    {
      id: "default-intro",
      type: "text_instruction",
      title: "활동 안내",
      description: "아직 이 활동의 세부 콘텐츠 블록이 설정되지 않았습니다.",
      content: {
        body: "이 활동은 아직 콘텐츠 블록 구조로 연결되지 않았습니다. 앞으로 Canva PPT, YouTube 영상, PDF, 외부 사이트, 미니활동 등을 블록 단위로 추가할 수 있습니다.",
      },
    },
  ];
}

// ─── 교사용 블록 편집기 지원 ──────────────────────────────────────
// 블록 유형 선택 목록(추가 버튼·라벨 공용 출처).
export const BLOCK_TYPE_OPTIONS: {
  type: ContentBlock["type"];
  label: string;
  hint: string;
}[] = [
  { type: "text_instruction", label: "안내 텍스트", hint: "활동 목적·순서·주의사항 안내" },
  { type: "canva_embed", label: "Canva PPT", hint: "Canva 수업 자료 임베딩" },
  { type: "youtube_embed", label: "YouTube 영상", hint: "유튜브 영상 임베딩" },
  { type: "google_drive_file", label: "Google Drive PDF/파일", hint: "Drive PDF·문서 임베딩" },
  { type: "external_embed", label: "외부 사이트", hint: "GeoGebra·Desmos 등 iframe" },
  { type: "interactive_activity", label: "미니활동", hint: "확률 시뮬레이터 등 참여형 활동" },
];

export function getBlockTypeLabel(type: ContentBlock["type"]): string {
  return BLOCK_TYPE_OPTIONS.find((option) => option.type === type)?.label ?? "블록";
}

export function generateBlockId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// 유형별 기본값으로 새 블록을 만든다(편집기에서 '추가' 시 사용).
export function createEmptyBlock(type: ContentBlock["type"]): ContentBlock {
  const id = generateBlockId();

  switch (type) {
    case "text_instruction":
      return { id, type, title: "안내 텍스트", content: { body: "" } };
    case "canva_embed":
      return { id, type, title: "Canva PPT", content: { embedUrl: "" } };
    case "youtube_embed":
      return { id, type, title: "YouTube 영상", content: { videoUrl: "" } };
    case "google_drive_file":
      return { id, type, title: "Google Drive 자료", content: { embedUrl: "" } };
    case "external_embed":
      return { id, type, title: "외부 사이트", content: { url: "" } };
    case "interactive_activity":
      return {
        id,
        type,
        title: "확률 시뮬레이터",
        content: { activitySlug: "probability-simulator", reflectionType: "simple" },
      };
  }
}

// 저장 전 필수값 검증 — 사람이 읽는 오류 메시지 배열을 반환(빈 배열이면 통과).
export function validateBlocks(blocks: ContentBlock[]): string[] {
  const errors: string[] = [];

  blocks.forEach((block, index) => {
    const where = `${index + 1}번 블록(${getBlockTypeLabel(block.type)})`;

    if (!block.title.trim()) {
      errors.push(`${where}: 제목을 입력하세요.`);
    }

    switch (block.type) {
      case "text_instruction":
        if (!block.content.body.trim()) {
          errors.push(`${where}: 안내 내용을 입력하세요.`);
        }
        break;
      case "canva_embed":
        if (!block.content.embedUrl.trim()) {
          errors.push(`${where}: 임베드 주소(embedUrl)를 입력하세요.`);
        }
        break;
      case "youtube_embed":
        if (!block.content.videoUrl?.trim() && !block.content.embedUrl?.trim()) {
          errors.push(`${where}: 영상 주소를 입력하세요.`);
        }
        break;
      case "google_drive_file":
        if (!block.content.embedUrl.trim()) {
          errors.push(`${where}: 임베드 주소(preview URL)를 입력하세요.`);
        }
        break;
      case "external_embed":
        if (!block.content.url.trim()) {
          errors.push(`${where}: 사이트 주소(url)를 입력하세요.`);
        }
        break;
      case "interactive_activity":
        if (!block.content.activitySlug.trim()) {
          errors.push(`${where}: 미니활동 종류를 선택하세요.`);
        }
        break;
    }
  });

  return errors;
}