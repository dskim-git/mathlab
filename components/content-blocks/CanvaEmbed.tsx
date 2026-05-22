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
  height,
}: CanvaEmbedProps) {
  return (
    <EmbedFrame
      title={title}
      description={description}
      src={embedUrl}
      externalUrl={externalUrl ?? embedUrl}
      height={height ?? 600}
    />
  );
}