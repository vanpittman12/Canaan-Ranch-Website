/**
 * Option B preview only. Sparse longleaf trunks, sandy/warm ground, wiregrass
 * in the lower half, and a quiet gopher-tortoise silhouette in the grass.
 * Not used on the live homepage until Van chooses.
 */
const FOREST = "#16241C";
const PINE = "#24352A";
const PINE_MID = "#2F4536";
const WHEAT = "#E0D0B4";
const BRASS = "#C4A15A";
const SAND = "#C4B48A";
const NEEDLE = "#3D5344";

export function LongleafHabitat() {
  return (
    <div className="hero-preview-visual" aria-hidden="true">
      <div className="longleaf-sky" />
      <div className="longleaf-ground" />
      <div className="longleaf-grain" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 720"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <g opacity="0.62">
          <SparsePine x={70} y={-80} height={520} trunk={5} crown={0.7} color={PINE_MID} />
          <SparsePine x={210} y={-50} height={490} trunk={4.5} crown={0.62} color={PINE} />
          <SparsePine x={390} y={-20} height={450} trunk={4} crown={0.58} color={NEEDLE} />
          <SparsePine x={560} y={10} height={420} trunk={4} crown={0.55} color={PINE_MID} />
          <SparsePine x={780} y={-70} height={530} trunk={5.5} crown={0.72} color={PINE} />
          <SparsePine x={980} y={-40} height={490} trunk={5} crown={0.66} color={NEEDLE} />
          <SparsePine x={1188} y={-90} height={560} trunk={6} crown={0.8} color={FOREST} />
          <SparsePine x={1378} y={-30} height={480} trunk={5} crown={0.64} color={PINE} />
        </g>
        <SandWash />
        <WiregrassField />
        <g>
          <WiregrassClump x={40} y={430} scale={1.55} color={BRASS} />
          <WiregrassClump x={160} y={448} scale={1.35} color={WHEAT} />
          <WiregrassClump x={280} y={438} scale={1.45} color={BRASS} />
          <WiregrassClump x={900} y={420} scale={1.5} color={WHEAT} />
          <WiregrassClump x={1040} y={438} scale={1.7} color={BRASS} />
          <WiregrassClump x={1180} y={428} scale={1.6} color={WHEAT} />
          <WiregrassClump x={1300} y={442} scale={1.4} color={BRASS} />
          <WiregrassClump x={1400} y={434} scale={1.3} color={WHEAT} />
        </g>
        <QuietTortoise />
      </svg>
      <div className="longleaf-scrim" />
    </div>
  );
}

function SandWash() {
  return (
    <g>
      <path
        d="M0 300C260 268 480 292 720 270C980 246 1180 292 1440 268V720H0Z"
        fill={SAND}
        opacity="0.5"
      />
      <path
        d="M0 368C240 338 520 358 820 340C1080 326 1260 378 1440 356V720H0Z"
        fill={BRASS}
        opacity="0.3"
      />
      <path
        d="M0 430C280 408 560 428 860 412C1120 398 1280 448 1440 430V720H0Z"
        fill={WHEAT}
        opacity="0.42"
      />
    </g>
  );
}

function SparsePine({
  x,
  y,
  height,
  trunk,
  crown,
  color,
}: {
  x: number;
  y: number;
  height: number;
  trunk: number;
  crown: number;
  color: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M0 ${height} V28`}
        stroke={color}
        strokeWidth={trunk}
        strokeLinecap="round"
      />
      <g transform={`scale(${crown})`}>
        {[-22, -12, 0, 12, 22].map((dx) => (
          <path
            key={`high-${dx}`}
            d={`M0 22 Q${dx * 0.28} ${4 - Math.abs(dx) * 0.12} ${dx} ${-18 - Math.abs(dx) * 0.08}`}
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {[-14, 14].map((dx) => (
          <path
            key={`mid-${dx}`}
            d={`M0 36 Q${dx * 0.35} 18 ${dx} 2`}
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </g>
    </g>
  );
}

function WiregrassField() {
  const clumps: Array<[number, number, number, string]> = [];
  for (let i = 0; i < 26; i += 1) {
    const x = 24 + i * 54 + (i % 3) * 8;
    const y = 390 + (i % 4) * 16;
    const scale = 0.95 + (i % 5) * 0.1;
    clumps.push([x, y, scale, i % 2 === 0 ? BRASS : WHEAT]);
  }
  return (
    <g opacity="0.92">
      {clumps.map(([x, y, scale, color], index) => (
        <WiregrassClump key={`${x}-${index}`} x={x} y={y} scale={scale} color={color} />
      ))}
    </g>
  );
}

function WiregrassClump({
  x,
  y,
  scale,
  color,
}: {
  x: number;
  y: number;
  scale: number;
  color: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 8 C-10 -10 -16 -36 -8 -70 C-4 -40 0 -18 2 8 C8 -16 16 -40 12 -68 C18 -36 12 -12 6 8 C-2 -8 -8 -28 -4 -54 C0 8 0 8 0 8Z"
        fill={color}
        opacity="0.8"
      />
      <path
        d="M0 8 C-6 -22 -4 -48 4 -78"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 8 C10 -18 18 -40 22 -62"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M-3 8 C-14 -16 -20 -34 -24 -52"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

function QuietTortoise() {
  return (
    <g className="longleaf-tortoise" transform="translate(1288 400) scale(0.82)">
      <g fill={FOREST} opacity="0.78">
        <ellipse cx="62" cy="30" rx="34" ry="20" />
        <path d="M28 30 C18 22 12 24 10 30 C12 36 20 38 30 34 Z" />
        <ellipse cx="14" cy="31" rx="7" ry="5" />
        <ellipse cx="42" cy="48" rx="8" ry="5" />
        <ellipse cx="70" cy="50" rx="9" ry="5.5" />
        <ellipse cx="90" cy="44" rx="7" ry="4.5" />
        <ellipse cx="96" cy="34" rx="6" ry="3" />
      </g>
      <path
        d="M36 24 C50 12 78 12 92 26"
        stroke={BRASS}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.45"
      />
    </g>
  );
}
