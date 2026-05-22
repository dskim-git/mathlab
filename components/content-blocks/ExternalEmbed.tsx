import EmbedFrame from "./EmbedFrame";

type ExternalEmbedProps = {
  title: string;
  description?: string;
  url: string;
  height?: number;
};

export default function ExternalEmbed({
  title,
  description,
  url,
  height,
}: ExternalEmbedProps) {
  return (
    <EmbedFrame
      title={title}
      description={description}
      src={url}
      externalUrl={url}
      height={height ?? 600}
    />
  );
}