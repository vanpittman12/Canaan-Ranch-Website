import Image from "next/image";
import {
  BASEMAP,
  MAP_FRAME,
  MAP_OVERLAY,
  MAP_PLACES,
  SOUTHERN_LIMIT_LINE,
  labelOffset,
  nauticalMilesToPixels,
  project,
  serviceAreaCopy,
  serviceAreaOverlayPath,
} from "@/lib/service-area";

const CUTOFF_WEST = project(SOUTHERN_LIMIT_LINE.west[0], SOUTHERN_LIMIT_LINE.west[1]);
const CUTOFF_EAST = project(SOUTHERN_LIMIT_LINE.east[0], SOUTHERN_LIMIT_LINE.east[1]);
const SCALE_NM = [0, 50, 100] as const;
const SCALE_WIDTH = nauticalMilesToPixels(100);
const SCALE_X = 56;
const SCALE_Y = Math.round(MAP_FRAME.height * 0.58);
const OVERLAY_PATH = serviceAreaOverlayPath();

export function ServiceAreaMap() {
  const { width, height } = MAP_FRAME;

  return (
    <section id="service-area" className="border-b border-line bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
          {serviceAreaCopy.heading}
        </p>
        <h2 className="type-h2 mt-3 max-w-3xl text-forest">{serviceAreaCopy.caption}</h2>
        <figure className="mt-10 overflow-hidden rounded-[16px] border border-line bg-[#d7e4ea]">
          <div className="relative">
            <Image
              src={BASEMAP.src}
              alt="OpenStreetMap geographic map of Florida"
              width={width}
              height={height}
              className="h-auto w-full"
            />
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={serviceAreaCopy.caption}
              className="absolute inset-0 h-full w-full"
            >
              <path
                d={OVERLAY_PATH}
                fill={MAP_OVERLAY.fill}
                fillOpacity={MAP_OVERLAY.fillOpacity}
                fillRule="evenodd"
              />
              <path
                d={OVERLAY_PATH}
                fill="none"
                stroke={MAP_OVERLAY.outline}
                strokeOpacity="0.7"
                strokeWidth="1.4"
              />
              <line
                x1={CUTOFF_WEST.x}
                y1={CUTOFF_WEST.y}
                x2={CUTOFF_EAST.x}
                y2={CUTOFF_EAST.y}
                stroke={MAP_OVERLAY.cutoff}
                strokeDasharray="7 5"
                strokeWidth="2"
              />

              {MAP_PLACES.map((place) => {
                const point = project(place.lon, place.lat);
                const label = labelOffset(place);
                const isAnchor = place.kind === "anchor";
                const isSite = place.kind === "site";
                return (
                  <g key={place.name}>
                    {isSite ? (
                      <rect
                        x={point.x - 5}
                        y={point.y - 5}
                        width="10"
                        height="10"
                        fill="#24352a"
                        stroke="#fffcf7"
                        strokeWidth="1.25"
                        transform={`rotate(45 ${point.x} ${point.y})`}
                      />
                    ) : (
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isAnchor ? 6 : 3.4}
                        fill={isAnchor ? "#c4a15a" : "#1a1712"}
                        stroke={isAnchor ? "#24352a" : "#fffcf7"}
                        strokeWidth={isAnchor ? 1.5 : 1}
                      />
                    )}
                    <text
                      x={point.x + label.dx}
                      y={point.y + label.dy}
                      fill="#1a1712"
                      fontFamily="var(--font-source), ui-sans-serif, system-ui, sans-serif"
                      fontSize={isAnchor || isSite ? 18 : 15}
                      fontWeight={isAnchor || isSite ? 700 : 600}
                      textAnchor={label.anchor}
                      style={{ paintOrder: "stroke", stroke: "#fffcf7", strokeWidth: 4 }}
                    >
                      {place.name}
                    </text>
                  </g>
                );
              })}

              <g>
                <line
                  x1={SCALE_X}
                  y1={SCALE_Y}
                  x2={SCALE_X + SCALE_WIDTH}
                  y2={SCALE_Y}
                  stroke="#1a1712"
                  strokeWidth="1.6"
                />
                {SCALE_NM.map((nm) => {
                  const x = SCALE_X + nauticalMilesToPixels(nm);
                  return (
                    <g key={nm}>
                      <line x1={x} y1={SCALE_Y - 6} x2={x} y2={SCALE_Y + 6} stroke="#1a1712" strokeWidth="1.6" />
                      <text
                        x={x}
                        y={SCALE_Y + 20}
                        fill="#1a1712"
                        fontFamily="var(--font-source), ui-sans-serif, system-ui, sans-serif"
                        fontSize="12"
                        textAnchor="middle"
                      >
                        {nm}
                      </text>
                    </g>
                  );
                })}
                <text
                  x={SCALE_X}
                  y={SCALE_Y + 36}
                  fill="#1a1712"
                  fontFamily="var(--font-source), ui-sans-serif, system-ui, sans-serif"
                  fontSize="12"
                >
                  {serviceAreaCopy.scaleLabel}
                </text>
              </g>
            </svg>
            <div className="pointer-events-none absolute bottom-3 left-3 max-w-[16rem] rounded-[12px] border border-line bg-paper/95 px-3 py-3 text-[13px] leading-5 text-ink shadow-sm">
              <p className="flex items-center gap-2">
                <span className="inline-block h-3 w-4 rounded-[2px] bg-[#3f5346]" aria-hidden="true" />
                {serviceAreaCopy.legendService}
              </p>
              <p className="mt-1.5 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-forest bg-brass" aria-hidden="true" />
                {serviceAreaCopy.legendAnchor}
              </p>
              <p className="mt-1.5 flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rotate-45 bg-forest" aria-hidden="true" />
                {serviceAreaCopy.legendSite}
              </p>
            </div>
          </div>
          <figcaption className="border-t border-line bg-paper px-4 py-3 text-sm leading-6 text-muted sm:px-5">
            <span className="block">{serviceAreaCopy.caption}</span>
            <span className="mt-1 block text-xs">{serviceAreaCopy.attribution}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
