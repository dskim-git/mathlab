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
        description: "이항분포 시뮬레이션을 시작하기 전에 읽어보세요.",
        content: {
          body: "이번 활동에서는 같은 시행을 여러 번 반복했을 때 성공 횟수가 어떤 분포를 이루는지 관찰합니다. 시뮬레이션 결과의 평균과 분산을 이론값과 비교하고, 그래프를 통해 상대도수와 이론확률의 차이를 살펴보세요.",
        },
      },
      {
        id: "probability-simulator",
        type: "interactive_activity",
        title: "확률 시뮬레이터",
        description: "동전, 주사위, 직접 설정한 성공확률로 이항분포를 탐구합니다.",
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