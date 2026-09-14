import {
  CANAAN_SITE,
  MAP_FRAME,
  REFERENCE_CITIES,
  SOUTHERN_LIMIT_LAT,
  floridaOutlinePath,
  nauticalMilesToPixels,
  project,
  serviceAreaCopy,
} from "@/lib/service-area";

const CUTOFF = project(-82.5, SOUTHERN_LIMIT_LAT);
const SITE = project(CANAAN_SITE.lon, CANAAN_SITE.lat);
const SCALE_NM = [0, 50, 100] as const;
const SCALE_WIDTH = nauticalMilesToPixels(100);

export function ServiceAreaMap() {
  const { width, height, mapHeight } = MAP_FRAME;
  const scaleX = 36;
  const scaleY = mapHeight + 78;

  return (
    <section id="service-area" className="border-b border-line bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brass">
          {serviceAreaCopy.heading}
        </p>
        <h2 className="type-h2 mt-3 max-w-3xl text-forest">{serviceAreaCopy.caption}</h2>
        <figure className="mt-10 overflow-hidden rounded-[16px] border border-line bg-[#f4f1ea] px-3 py-6 sm:px-8">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={serviceAreaCopy.caption}
            className="mx-auto h-auto w-full max-w-2xl"
          >
            <defs>
              <clipPath id="canaan-florida-outline">
                <path d={floridaOutlinePath} />
              </clipPath>
            </defs>
            <rect width={width} height={height} fill="#f4f1ea" />
            <path d={floridaOutlinePath} fill="#e8dfcc" />
            <g clipPath="url(#canaan-florida-outline)">
              <rect x="0" y="0" width={width} height={CUTOFF.y} fill="#3f5346" />
            </g>
            <path
              d={floridaOutlinePath}
              fill="none"
              stroke="#24352a"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
            <line
              x1={project(-83.15, SOUTHERN_LIMIT_LAT).x}
              y1={CUTOFF.y}
              x2={project(-80.4, SOUTHERN_LIMIT_LAT).x}
              y2={CUTOFF.y}
              stroke="#c4a15a"
              strokeDasharray="5 4"
              strokeWidth="1.5"
            />

            {REFERENCE_CITIES.map((city) => {
              const point = project(city.lon, city.lat);
              const isAnchor = "anchor" in city && city.anchor;
              return (
                <g key={city.name}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isAnchor ? 6 : 3.25}
                    fill={isAnchor ? "#c4a15a" : "#1a1712"}
                    stroke={isAnchor ? "#24352a" : "#f4f1ea"}
                    strokeWidth={isAnchor ? 1.5 : 1}
                  />
                  <text
                    x={point.x + city.dx}
                    y={point.y + city.dy}
                    fill="#1a1712"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    fontSize={isAnchor ? 15 : 13}
                    fontWeight={isAnchor ? 700 : 500}
                    textAnchor={"anchorEnd" in city && city.anchorEnd ? "end" : "start"}
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}

            <rect
              x={SITE.x - 5}
              y={SITE.y - 5}
              width="10"
              height="10"
              fill="#24352a"
              stroke="#f4f1ea"
              strokeWidth="1"
              transform={`rotate(45 ${SITE.x} ${SITE.y})`}
            />
            <text
              x={SITE.x - 10}
              y={SITE.y + 22}
              fill="#24352a"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="13"
              fontWeight="700"
              textAnchor="end"
            >
              {CANAAN_SITE.name}
            </text>

            <g>
              <rect x="28" y={mapHeight + 18} width="18" height="12" fill="#3f5346" />
              <text x="54" y={mapHeight + 29} fill="#1a1712" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="13">
                {serviceAreaCopy.legendService}
              </text>
              <circle cx="37" cy={mapHeight + 46} r="5.5" fill="#c4a15a" stroke="#24352a" strokeWidth="1.25" />
              <text x="54" y={mapHeight + 51} fill="#1a1712" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="13">
                {serviceAreaCopy.legendAnchor}
              </text>
              <rect
                x="31.5"
                y={mapHeight + 62}
                width="11"
                height="11"
                fill="#24352a"
                transform={`rotate(45 37 ${mapHeight + 67.5})`}
              />
              <text x="54" y={mapHeight + 73} fill="#1a1712" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="13">
                {serviceAreaCopy.legendSite}
              </text>
            </g>

            <g>
              <line
                x1={scaleX}
                y1={scaleY}
                x2={scaleX + SCALE_WIDTH}
                y2={scaleY}
                stroke="#1a1712"
                strokeWidth="1.5"
              />
              {SCALE_NM.map((nm) => {
                const x = scaleX + nauticalMilesToPixels(nm);
                return (
                  <g key={nm}>
                    <line x1={x} y1={scaleY - 6} x2={x} y2={scaleY + 6} stroke="#1a1712" strokeWidth="1.5" />
                    <text
                      x={x}
                      y={scaleY + 20}
                      fill="#6a6156"
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                      fontSize="11"
                      textAnchor="middle"
                    >
                      {nm}
                    </text>
                  </g>
                );
              })}
              <text
                x={scaleX}
                y={scaleY + 36}
                fill="#6a6156"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontSize="11"
              >
                {serviceAreaCopy.scaleLabel}
              </text>
            </g>
          </svg>
          <figcaption className="mt-4 text-sm leading-6 text-muted">{serviceAreaCopy.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
