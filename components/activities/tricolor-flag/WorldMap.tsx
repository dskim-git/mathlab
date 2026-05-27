"use client";

import { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule } from "d3-geo";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { feature, mesh } from "topojson-client";
import { COLORS, FLAGS, type FlagDef } from "./data";

const W = 800;
const H = 400;
const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* 세계지도에 삼색기 국가 핀을 표시(원본 d3 지도 재현). */
export default function WorldMap() {
  const projection = useMemo(
    () => geoNaturalEarth1().scale(W / 6.3).translate([W / 2, H / 2]),
    []
  );
  const pathGen = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => pathGen(geoGraticule()()) ?? "", [pathGen]);

  const [countries, setCountries] = useState<string[]>([]);
  const [borders, setBorders] = useState("");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [hover, setHover] = useState<{ f: FlagDef; x: number; y: number } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(WORLD_URL)
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((world: any) => {
        if (!active) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fc = feature(world, world.objects.countries) as any;
        setCountries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fc.features.map((f: any) => pathGen(f) ?? "").filter(Boolean)
        );
        setBorders(
          pathGen(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mesh(world, world.objects.countries, (a: any, b: any) => a !== b) as any
          ) ?? ""
        );
        setStatus("ok");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [pathGen]);

  const pins = useMemo(
    () =>
      FLAGS.map((f) => {
        const xy = projection([f.lng, f.lat]);
        return xy ? { f, x: xy[0], y: xy[1] } : null;
      }).filter((p): p is { f: FlagDef; x: number; y: number } => p !== null),
    [projection]
  );

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ background: "#0a1832" }}>
        <path d={graticule} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={0.3} />
        {countries.map((d, i) => (
          <path key={i} d={d} fill="#1e3a5f" stroke="#2d5a9e" strokeWidth={0.3} />
        ))}
        {borders ? <path d={borders} fill="none" stroke="#3a6ba8" strokeWidth={0.2} /> : null}
        {pins.map(({ f, x, y }, i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={hover?.f === f ? 8 : 5}
            fill={COLORS[f.c[0]].hex}
            stroke="#fff"
            strokeWidth={1.2}
            opacity={0.92}
            className="cursor-pointer"
            onMouseEnter={() => setHover({ f, x, y })}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {status === "loading" ? (
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-slate-400">
          🔄 지도 로딩 중...
        </p>
      ) : null}
      {status === "error" ? (
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-red-300">
          ❌ 지도 데이터를 불러오지 못했습니다.
        </p>
      ) : null}

      {hover ? (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-lg border border-white/20 bg-slate-950/95 px-3 py-2 text-xs"
          style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%` }}
        >
          <div className="flex gap-0.5">
            {hover.f.c.map((c, i) => (
              <span
                key={i}
                className="inline-block h-4 w-3 rounded-sm border border-white/20"
                style={{ background: COLORS[c].hex }}
              />
            ))}
          </div>
          <div className="mt-1 font-bold text-white">{hover.f.name}</div>
          <div className="mt-0.5 text-[10px] text-slate-400">
            {hover.f.c.map((c) => COLORS[c].short).join("·")} ·{" "}
            {hover.f.o === "v" ? "세로" : "가로"} 줄무늬
          </div>
        </div>
      ) : null}
    </div>
  );
}
