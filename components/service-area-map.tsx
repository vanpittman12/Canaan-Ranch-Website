import {
  ALACHUA,
  MAP_FRAME,
  SOUTHERN_LIMIT_LAT,
  floridaOutlinePath,
  project,
  serviceAreaCopy,
} from "@/lib/service-area";

const CUTOFF = project(-82.5, SOUTHERN_LIMIT_LAT);
const ANCHOR = project(ALACHUA.lon, ALACHUA.lat);
const RADIUS = CUTOFF.y - ANCHOR.y;

export function ServiceAreaMap() {
  const { width, height } = MAP_FRAME;
  const lineWest = project(-83.2, SOUTHERN_LIMIT_LAT);
  const lineEast = project(-80.35, SOUTHERN_LIMIT_LAT);

  return (
    <section id="service-area" className="border-b border-line bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
          {serviceAreaCopy.heading}
        </p>
        <h2 className="type-h2 mt-3 max-w-3xl text-forest">{serviceAreaCopy.caption}</h2>
        <figure className="mt-10 overflow-hidden rounded-[16px] border border-line bg-white px-3 py-6 sm:px-8">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={serviceAreaCopy.caption}
            className="mx-auto h-auto w-full max-w-xl"
          >
            <defs>
              <clipPath id="canaan-florida-outline">
                <path d={floridaOutlinePath} />
              </clipPath>
            </defs>
            <rect width={width} height={height} fill="#fffcf7" />
            <path d={floridaOutlinePath} fill="#efe6d4" />
            <g clipPath="url(#canaan-florida-outline)">
              <rect x="0" y="0" width={width} height={CUTOFF.y} fill="#7a8f6a" fillOpacity="0.42" />
              <line
                x1={lineWest.x}
                y1={CUTOFF.y}
                x2={lineEast.x}
                y2={CUTOFF.y}
                stroke="#9c4b32"
                strokeWidth="2.5"
              />
            </g>
            <path
              d={floridaOutlinePath}
              fill="none"
              stroke="#24352a"
              strokeLinejoin="round"
              strokeWidth="2.25"
            />
            <path
              d={`M ${ANCHOR.x} ${CUTOFF.y} A ${RADIUS} ${RADIUS} 0 0 1 ${ANCHOR.x + RADIUS} ${ANCHOR.y}`}
              fill="none"
              stroke="#c4a15a"
              strokeDasharray="6 5"
              strokeWidth="1.75"
            />
            <path
              d={`M ${ANCHOR.x - RADIUS} ${ANCHOR.y} A ${RADIUS} ${RADIUS} 0 0 1 ${ANCHOR.x} ${CUTOFF.y}`}
              fill="none"
              stroke="#c4a15a"
              strokeDasharray="6 5"
              strokeWidth="1.75"
            />
            <circle cx={ANCHOR.x} cy={ANCHOR.y} r="6.5" fill="#c4a15a" stroke="#24352a" strokeWidth="1.5" />
            <text
              x={ANCHOR.x + 12}
              y={ANCHOR.y - 10}
              fill="#1a1712"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="16"
              fontWeight="600"
            >
              Alachua
            </text>
            <text
              x={lineEast.x - 4}
              y={CUTOFF.y + 22}
              fill="#9c4b32"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="13"
              fontWeight="600"
              textAnchor="end"
            >
              ~28.1°N
            </text>
          </svg>
          <figcaption className="sr-only">{serviceAreaCopy.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
