type EmbedFrameProps = {
  title: string;
  description?: string;
  src: string;
  height?: number;
  externalUrl?: string;
  /** true면 고정 높이 대신 16:9 반응형(Canva PPT 등 와이드 슬라이드용). */
  aspectVideo?: boolean;
};

export default function EmbedFrame({
  title,
  description,
  src,
  height = 600,
  externalUrl,
  aspectVideo = false,
}: EmbedFrameProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-5">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>

          {description ? (
            <p className="mt-2 leading-7 text-slate-300">{description}</p>
          ) : null}
        </div>

        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
          >
            새 창으로 열기
          </a>
        ) : null}
      </div>

      {aspectVideo ? (
        <div className="mt-5 flex justify-center">
          <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-black">
            <iframe
              title={title}
              src={src}
              width="100%"
              height="100%"
              allowFullScreen
              className="block h-full w-full"
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black">
          <iframe
            title={title}
            src={src}
            width="100%"
            height={height}
            allowFullScreen
            className="block w-full"
          />
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-slate-400">
        임베딩이 보이지 않으면 공유 설정 또는 외부 사이트의 iframe 허용 여부를
        확인하세요.
      </p>
    </section>
  );
}