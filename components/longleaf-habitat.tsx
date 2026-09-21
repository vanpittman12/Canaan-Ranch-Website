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
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="longleaf-sky" />
      <div className="longleaf-ground" />
      <div className="longleaf-grain" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 720"
        fill="none"
        preserveAspectRatio="xMidYMax slice"
      >
        <g opacity="0.42">
          <SparsePine x={96} y={-40} height={620} trunk={5} crown={0.72} color={PINE_MID} />
          <SparsePine x={310} y={-10} height={580} trunk={4.5} crown={0.68} color={PINE} />
          <SparsePine x={520} y={20} height={540} trunk={4} crown={0.6} color={NEEDLE} />
          <SparsePine x={860} y={-30} height={610} trunk={5} crown={0.7} color={PINE_MID} />
          <SparsePine x={1120} y={-55} height={650} trunk={6} crown={0.78} color={PINE} />
          <SparsePine x={1368} y={-20} height={590} trunk={5} crown={0.66} color={FOREST} />
        </g>
        <SandWash />
        <WiregrassField />
        <g>
          <WiregrassClump x={48} y={548} scale={1.7} color={BRASS} />
          <WiregrassClump x={180} y={562} scale={1.45} color={WHEAT} />
          <WiregrassClump x={980} y={540} scale={1.6} color={WHEAT} />
          <WiregrassClump x={1140} y={556} scale={1.85} color={BRASS} />
          <WiregrassClump x={1288} y={548} scale={1.5} color={WHEAT} />
          <WiregrassClump x={1396} y={560} scale={1.35} color={BRASS} />
        </g>
      </svg>
      <QuietTortoise />
      <div className="longleaf-scrim" />
    </div>
  );
}

function SandWash() {
  return (
    <g>
      <path
        d="M0 390C260 350 480 372 720 348C980 320 1180 368 1440 344V720H0Z"
        fill={SAND}
        opacity="0.45"
      />
      <path
        d="M0 470C240 438 520 458 820 440C1080 424 1260 478 1440 456V720H0Z"
        fill={BRASS}
        opacity="0.28"
      />
      <path
        d="M0 530C280 508 560 528 860 512C1120 498 1280 548 1440 530V720H0Z"
        fill={WHEAT}
        opacity="0.38"
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
  for (let i = 0; i < 24; i += 1) {
    const x = 30 + i * 58 + (i % 3) * 8;
    const y = 508 + (i % 4) * 18;
    const scale = 0.95 + (i % 5) * 0.1;
    clumps.push([x, y, scale, i % 2 === 0 ? BRASS : WHEAT]);
  }
  return (
    <g opacity="0.9">
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
    <svg
      className="longleaf-tortoise"
      viewBox="0 0 120 64"
      fill="none"
      aria-hidden="true"
    >
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
    </svg>
  );
}
