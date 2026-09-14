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
  southOfCutoffOverlayPath,
} from "@/lib/service-area";

const CUTOFF_WEST = project(SOUTHERN_LIMIT_LINE.west[0], SOUTHERN_LIMIT_LINE.west[1]);
const CUTOFF_EAST = project(SOUTHERN_LIMIT_LINE.east[0], SOUTHERN_LIMIT_LINE.east[1]);
const SCALE_NM = [0, 50, 100] as const;
const SCALE_WIDTH = nauticalMilesToPixels(100);
const LEGEND_X = 48;
const LEGEND_Y = Math.round(MAP_FRAME.height * 0.58);
const SCALE_X = 64;
const SCALE_Y = LEGEND_Y + 108;
const SERVICE_PATH = serviceAreaOverlayPath();
const SOUTH_PATH = southOfCutoffOverlayPath();

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
                d={SOUTH_PATH}
                fill={MAP_OVERLAY.outside}
                fillOpacity={MAP_OVERLAY.outsideOpacity}
                fillRule="evenodd"
              />
              <path
                d={SERVICE_PATH}
                fill={MAP_OVERLAY.fill}
                fillOpacity={MAP_OVERLAY.fillOpacity}
                fillRule="evenodd"
              />
              <path
                d={SERVICE_PATH}
                fill="none"
                stroke={MAP_OVERLAY.outline}
                strokeOpacity="0.65"
                strokeWidth="1.2"
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
                        r={isAnchor ? 5.5 : 3.2}
                        fill={isAnchor ? "#c4a15a" : "#1a1712"}
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
                      style={{ paintOrder: "stroke", stroke: "#f7f1e6", strokeWidth: 3.5 }}
                    >
                      {place.name}
                    </text>
                  </g>
                );
              })}

              <g>
                <rect
                  x={LEGEND_X}
                  y={LEGEND_Y}
                  width="228"
                  height="92"
                  rx="10"
                  fill="#f7f1e6"
                  fillOpacity="0.96"
                  stroke="#d2c4a8"
                />
                <rect x={LEGEND_X + 16} y={LEGEND_Y + 16} width="18" height="12" fill="#3f5346" />
                <text
                  x={LEGEND_X + 42}
                  y={LEGEND_Y + 27}
                  fill="#1a1712"
                  fontFamily="var(--font-source), ui-sans-serif, system-ui, sans-serif"
                  fontSize="13"
                >
                  {serviceAreaCopy.legendService}
                </text>
                <circle cx={LEGEND_X + 25} cy={LEGEND_Y + 46} r="5" fill="#c4a15a" />
                <text
                  x={LEGEND_X + 42}
                  y={LEGEND_Y + 51}
                  fill="#1a1712"
                  fontFamily="var(--font-source), ui-sans-serif, system-ui, sans-serif"
                  fontSize="13"
                >
                  {serviceAreaCopy.legendAnchor}
                </text>
                <rect
                  x={LEGEND_X + 20}
                  y={LEGEND_Y + 64}
                  width="10"
                  height="10"
                  fill="#24352a"
                  transform={`rotate(45 ${LEGEND_X + 25} ${LEGEND_Y + 69})`}
                />
                <text
                  x={LEGEND_X + 42}
                  y={LEGEND_Y + 75}
                  fill="#1a1712"
                  fontFamily="var(--font-source), ui-sans-serif, system-ui, sans-serif"
                  fontSize="13"
                >
                  {serviceAreaCopy.legendSite}
                </text>
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
                      <line
                        x1={x}
                        y1={SCALE_Y - 6}
                        x2={x}
                        y2={SCALE_Y + 6}
                        stroke="#1a1712"
                        strokeWidth="1.6"
                      />
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
