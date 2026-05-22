import EmbedFrame from "./EmbedFrame";

type YouTubeEmbedProps = {
  title: string;
  description?: string;
  videoUrl?: string;
  embedUrl?: string;
  height?: number;
};

function getYouTubeEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);

    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${videoId}`;
    }

    const videoId = url.searchParams.get("v");

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return videoUrl;
  } catch {
    return videoUrl;
  }
}

export default function YouTubeEmbed({
  title,
  description,
  videoUrl,
  embedUrl,
  height,
}: YouTubeEmbedProps) {
  const finalEmbedUrl = embedUrl ?? (videoUrl ? getYouTubeEmbedUrl(videoUrl) : "");

  return (
    <EmbedFrame
      title={title}
      description={description}
      src={finalEmbedUrl}
      externalUrl={videoUrl ?? embedUrl}
      height={height ?? 420}
    />
  );
}