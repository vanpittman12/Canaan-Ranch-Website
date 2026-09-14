/**
 * Florida sandhill: open longleaf pine, wiregrass groundcover, and pale sand.
 * Illustration only — no stock photography, no cartoon wildlife.
 */
const FOREST = "#16241C";
const PINE = "#24352A";
const PINE_MID = "#2F4536";
const WHEAT = "#E0D0B4";
const BRASS = "#C4A15A";
const SAND = "#8A7348";

export function SandhillHabitat() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="habitat-sky" />
      <div className="habitat-sun" />
      <div className="habitat-ground" />
      <div className="habitat-grain" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 720"
        fill="none"
        preserveAspectRatio="xMidYMax slice"
      >
        <DistantRidge />
        <g opacity="0.55">
          <Longleaf x={70} y={150} height={400} trunk={7} crown={1} color={PINE_MID} />
          <Longleaf x={190} y={110} height={440} trunk={8} crown={1.1} color={PINE} />
          <Longleaf x={880} y={80} height={480} trunk={8} crown={1.15} color={PINE_MID} />
          <Longleaf x={1328} y={100} height={450} trunk={7} crown={1.05} color={PINE} />
        </g>
        <SandDunes />
        <WiregrassField />
        <Longleaf x={760} y={10} height={560} trunk={12} crown={1.45} color={FOREST} />
        <Longleaf x={1008} y={-20} height={590} trunk={14} crown={1.65} color={FOREST} />
        <Longleaf x={1236} y={0} height={570} trunk={13} crown={1.5} color={PINE} />
        <Burrow x={1176} y={500} />
        <g>
          <WiregrassClump x={36} y={560} scale={1.6} color={BRASS} />
          <WiregrassClump x={150} y={572} scale={1.4} color={WHEAT} />
          <WiregrassClump x={268} y={564} scale={1.5} color={BRASS} />
          <WiregrassClump x={860} y={548} scale={1.45} color={WHEAT} />
          <WiregrassClump x={1024} y={568} scale={1.7} color={BRASS} />
          <WiregrassClump x={1120} y={540} scale={1.55} color={WHEAT} />
          <WiregrassClump x={1370} y={556} scale={1.4} color={WHEAT} />
        </g>
      </svg>
      <div className="habitat-scrim" />
    </div>
  );
}

function DistantRidge() {
  return (
    <path
      d="M0 360C200 318 320 292 470 312C650 336 760 270 930 292C1100 314 1220 250 1440 278V720H0Z"
      fill={FOREST}
      opacity="0.22"
    />
  );
}

function SandDunes() {
  return (
    <g>
      <path
        d="M0 430C220 384 400 418 640 392C900 362 1080 428 1280 400C1360 388 1410 408 1440 400V720H0Z"
        fill={SAND}
        opacity="0.55"
      />
      <path
        d="M0 488C240 450 460 480 720 456C1000 428 1180 500 1380 470C1410 466 1430 470 1440 468V720H0Z"
        fill={BRASS}
        opacity="0.4"
      />
      <path
        d="M0 540C260 510 500 536 780 516C1060 494 1240 556 1440 534V720H0Z"
        fill={WHEAT}
        opacity="0.32"
      />
    </g>
  );
}

function Longleaf({
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
        d={`M0 ${height} V18`}
        stroke={color}
        strokeWidth={trunk}
        strokeLinecap="round"
      />
      <g transform={`scale(${crown})`}>
        <ellipse cx="0" cy="4" rx="20" ry="14" fill={color} />
        <ellipse cx="-32" cy="20" rx="16" ry="12" fill={color} opacity="0.9" />
        <ellipse cx="34" cy="24" rx="17" ry="12" fill={color} opacity="0.9" />
        {[-48, -30, -14, 0, 16, 32, 48].map((dx) => (
          <path
            key={dx}
            d={`M${dx * 0.15} 6 Q${dx * 0.6} ${-28 - Math.abs(dx) * 0.15} ${dx} ${-10 - Math.abs(dx) * 0.08}`}
            stroke={color}
            strokeWidth="2"
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
  for (let i = 0; i < 28; i += 1) {
    const x = 20 + i * 52 + (i % 3) * 10;
    const y = 500 + (i % 4) * 16;
    const scale = 0.9 + (i % 5) * 0.12;
    clumps.push([x, y, scale, i % 2 === 0 ? BRASS : WHEAT]);
  }
  return (
    <g opacity="0.86">
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

function Burrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M-96 32 C-50 -20 20 -28 108 22 C58 44 12 50 -28 46 C-54 43 -78 38 -96 32Z"
        fill={WHEAT}
      />
      <path d="M-12 14 C12 -12 40 -10 50 16 C32 26 10 26 -8 18Z" fill={FOREST} />
    </g>
  );
}
