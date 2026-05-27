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
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full bg-[#0a1832]">
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

        {hover
          ? (() => {
              const name = hover.f.name;
              const boxW = Math.max(112, name.length * 14 + 24);
              return (
                <g transform={`translate(${hover.x}, ${hover.y})`} pointerEvents="none">
                  <rect
                    x={-boxW / 2}
                    y={-58}
                    width={boxW}
                    height={48}
                    rx={6}
                    fill="#0a0a1a"
                    fillOpacity={0.95}
                    stroke="#ffffff"
                    strokeOpacity={0.2}
                  />
                  {hover.f.c.map((c, i) => (
                    <rect
                      key={i}
                      x={-boxW / 2 + 12 + i * 15}
                      y={-52}
                      width={12}
                      height={16}
                      rx={2}
                      fill={COLORS[c].hex}
                      stroke="#ffffff"
                      strokeOpacity={0.25}
                    />
                  ))}
                  <text x={0} y={-26} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight={700}>
                    {name}
                  </text>
                  <text x={0} y={-14} textAnchor="middle" fill="#94a3b8" fontSize={9}>
                    {hover.f.c.map((c) => COLORS[c].short).join("·")} ·{" "}
                    {hover.f.o === "v" ? "세로" : "가로"}
                  </text>
                </g>
              );
            })()
          : null}
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
    </div>
  );
}
