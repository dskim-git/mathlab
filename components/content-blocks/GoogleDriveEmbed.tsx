import EmbedFrame from "./EmbedFrame";

type GoogleDriveEmbedProps = {
  title: string;
  description?: string;
  fileUrl?: string;
  embedUrl: string;
  height?: number;
};

export default function GoogleDriveEmbed({
  title,
  description,
  fileUrl,
  embedUrl,
  height,
}: GoogleDriveEmbedProps) {
  return (
    <EmbedFrame
      title={title}
      description={description}
      src={embedUrl}
      externalUrl={fileUrl ?? embedUrl}
      height={height ?? 700}
    />
  );
}