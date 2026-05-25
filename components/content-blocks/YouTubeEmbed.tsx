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
      const start = url.searchParams.get("start");

      if (start) {
        return `https://www.youtube.com/embed/${videoId}?start=${start}`;
      }

      return `https://www.youtube.com/embed/${videoId}`;
    }

    const videoId = url.searchParams.get("v");
    const start = url.searchParams.get("start");

    if (videoId) {
      if (start) {
        return `https://www.youtube.com/embed/${videoId}?start=${start}`;
      }

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
}: YouTubeEmbedProps) {
  const finalEmbedUrl =
    embedUrl ?? (videoUrl ? getYouTubeEmbedUrl(videoUrl) : "");

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-5">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>

          {description ? (
            <p className="mt-2 leading-7 text-slate-300">{description}</p>
          ) : null}
        </div>

        {videoUrl || embedUrl ? (
          <a
            href={videoUrl ?? embedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            새 창으로 열기
          </a>
        ) : null}
      </div>

      <div className="mt-5 flex justify-center">
        <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-black">
          <iframe
            title={title}
            src={finalEmbedUrl}
            width="100%"
            height="100%"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="block h-full w-full"
          />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        영상이 보이지 않으면 공유 설정 또는 YouTube 임베딩 허용 여부를
        확인하세요.
      </p>
    </section>
  );
}