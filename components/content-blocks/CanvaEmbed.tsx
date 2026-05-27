import EmbedFrame from "./EmbedFrame";

type CanvaEmbedProps = {
  title: string;
  description?: string;
  embedUrl: string;
  externalUrl?: string;
  height?: number;
};

export default function CanvaEmbed({
  title,
  description,
  embedUrl,
  externalUrl,
}: CanvaEmbedProps) {
  // Canva 프레젠테이션은 16:9 → 고정 높이(import된 800px 등) 대신 반응형 비율로 렌더.
  return (
    <EmbedFrame
      title={title}
      description={description}
      src={embedUrl}
      externalUrl={externalUrl ?? embedUrl}
      aspectVideo
    />
  );
}