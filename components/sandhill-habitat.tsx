/**
 * Pasco County sandhill: open longleaf pine, wiregrass groundcover,
 * pale sand, and a gopher tortoise at a burrow apron.
 * Illustration only — no stock photography.
 */
export function SandhillHabitat() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="habitat-sky" />
      <div className="habitat-sun" />
      <div className="habitat-grain" />
      <svg
        className="absolute inset-0 h-full w-full text-forest-deep"
        viewBox="0 0 1440 720"
        fill="currentColor"
        preserveAspectRatio="xMidYMax slice"
      >
        <DistantRidge />
        <g opacity="0.38">
          <Longleaf x={118} y={168} height={390} trunk={2.2} crown={0.72} />
          <Longleaf x={198} y={128} height={430} trunk={2.4} crown={0.8} />
          <Longleaf x={980} y={110} height={455} trunk={2.3} crown={0.78} />
          <Longleaf x={1088} y={150} height={410} trunk={2.1} crown={0.7} />
          <Longleaf x={1288} y={135} height={430} trunk={2.2} crown={0.74} />
        </g>
        <SandDunes />
        <g opacity="0.72">
          <Longleaf x={312} y={88} height={500} trunk={3.2} crown={1} />
          <Longleaf x={868} y={70} height={520} trunk={3.4} crown={1.05} />
          <Longleaf x={1196} y={96} height={490} trunk={3} crown={0.95} />
        </g>
        <WiregrassField />
        <g opacity="0.92">
          <Longleaf x={1040} y={40} height={560} trunk={4.2} crown={1.2} />
          <Longleaf x={1340} y={58} height={540} trunk={3.8} crown={1.1} />
        </g>
        <Burrow x={1210} y={628} />
        <HabitatTortoise x={1164} y={612} />
        <g className="habitat-near-grass">
          <Wiregrass x={70} y={690} scale={1.3} />
          <Wiregrass x={160} y={700} scale={1.15} />
          <Wiregrass x={250} y={694} scale={1.25} />
          <Wiregrass x={980} y={688} scale={1.2} />
          <Wiregrass x={1100} y={698} scale={1.35} />
          <Wiregrass x={1320} y={692} scale={1.2} />
        </g>
      </svg>
      <div className="habitat-scrim" />
    </div>
  );
}

function DistantRidge() {
  return (
    <g opacity="0.22">
      <path
        d="M0 430C160 400 260 360 390 372C540 388 620 330 760 344C900 358 1000 300 1180 318C1280 328 1360 312 1440 322V720H0Z"
        fill="#16241C"
      />
    </g>
  );
}

function SandDunes() {
  return (
    <g>
      <path
        d="M0 560C180 528 320 548 480 536C680 520 820 568 1020 548C1180 534 1300 558 1440 542V720H0Z"
        fill="#3D3A28"
        opacity="0.35"
      />
      <path
        d="M0 600C200 574 360 596 560 580C780 560 940 610 1160 590C1280 580 1360 598 1440 586V720H0Z"
        fill="#5A4E32"
        opacity="0.42"
      />
      <path
        d="M0 644C220 622 400 640 640 628C880 614 1060 656 1280 640C1360 634 1400 642 1440 638V720H0Z"
        fill="#8A7348"
        opacity="0.38"
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
}: {
  x: number;
  y: number;
  height: number;
  trunk: number;
  crown: number;
}) {
  const top = 8;
  const mid = height * 0.22;
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke="currentColor">
      <path d={`M0 ${height} V${top}`} strokeWidth={trunk} strokeLinecap="round" />
      <NeedleTuft x={0} y={top} scale={crown} />
      <NeedleTuft x={-6 * crown} y={top + mid * 0.35} scale={crown * 0.62} />
      <NeedleTuft x={7 * crown} y={top + mid * 0.5} scale={crown * 0.55} />
      <path
        d={`M0 ${top + mid * 0.35} L${-18 * crown} ${top + mid * 0.08}`}
        strokeWidth={Math.max(1.2, trunk * 0.45)}
        strokeLinecap="round"
      />
      <path
        d={`M0 ${top + mid * 0.5} L${20 * crown} ${top + mid * 0.18}`}
        strokeWidth={Math.max(1.2, trunk * 0.45)}
        strokeLinecap="round"
      />
    </g>
  );
}

function NeedleTuft({ x, y, scale }: { x: number; y: number; scale: number }) {
  const needles = [
    [-22, -36],
    [-12, -42],
    [0, -46],
    [12, -42],
    [22, -36],
    [-28, -22],
    [28, -22],
    [-16, -28],
    [16, -28],
    [-8, -34],
    [8, -34],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="currentColor" fill="none">
      {needles.map(([dx, dy]) => (
        <path
          key={`${dx}-${dy}`}
          d={`M0 0 Q${dx * 0.4} ${dy * 0.55} ${dx} ${dy}`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function WiregrassField() {
  const clumps: Array<[number, number, number]> = [];
  for (let i = 0; i < 36; i += 1) {
    const x = 24 + i * 40 + (i % 3) * 10;
    const y = 638 + (i % 4) * 10;
    const scale = 0.7 + (i % 5) * 0.08;
    clumps.push([x, y, scale]);
  }
  return (
    <g opacity="0.55">
      {clumps.map(([x, y, scale], index) => (
        <Wiregrass key={`${x}-${index}`} x={x} y={y} scale={scale} />
      ))}
    </g>
  );
}

function Wiregrass({
  x,
  y,
  scale = 1,
}: {
  x: number;
  y: number;
  scale?: number;
}) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M0 0 C-5 -26 -9 -50 -3 -76" />
      <path d="M5 0 C3 -22 8 -46 14 -70" />
      <path d="M11 2 C16 -18 22 -38 20 -62" />
      <path d="M-7 2 C-15 -20 -18 -38 -22 -56" />
      <path d="M-2 1 C-1 -30 2 -54 8 -78" />
      <path d="M8 1 C12 -24 18 -44 26 -60" />
    </g>
  );
}

function Burrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.8">
      <path d="M-70 18 C-40 -8 10 -16 78 10 C40 22 8 28 -20 24 C-40 22 -58 20 -70 18Z" fill="#E0D0B4" />
      <path d="M-8 8 C8 -6 28 -4 36 10 C24 16 8 16 -4 12Z" fill="#16241C" />
    </g>
  );
}

function HabitatTortoise({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.15)`} fill="currentColor">
      <path d="M0 10C0 4 6 -1 16 -2C24 -3 32 1 34 6C36 6 39 7 40 10C41 13 39 16 36 16L34 16C34.4 20 34.8 23 33.6 25C32.4 27 29 27 28.4 24.6C27.8 22.4 28.2 19 28 16.4H12.4C12 19.2 11.4 22 11.8 24C12.2 26.2 9 26.6 8.2 24.2C7.4 21.8 8.2 18.8 8.8 16.2C5.8 15.6 3 14 0 10Z" />
    </g>
  );
}
