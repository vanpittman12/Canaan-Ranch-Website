export function SandhillHabitat() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="habitat-grain" />
      <svg
        className="absolute inset-y-0 right-0 h-full w-[min(100%,42rem)] text-forest-deep"
        viewBox="0 0 640 640"
        fill="currentColor"
        preserveAspectRatio="xMaxYMax meet"
      >
        <g opacity="0.92">
          <Palmetto cx={470} cy={430} scale={1.15} />
          <Palmetto cx={560} cy={470} scale={0.82} />
          <Palmetto cx={390} cy={500} scale={0.7} />
          <Wiregrass x={300} y={560} />
          <Wiregrass x={430} y={575} />
          <Wiregrass x={540} y={585} />
          <Longleaf x={180} y={220} height={340} />
          <Longleaf x={240} y={160} height={400} />
        </g>
      </svg>
    </div>
  );
}

function Palmetto({
  cx,
  cy,
  scale,
}: {
  cx: number;
  cy: number;
  scale: number;
}) {
  const leaflets = [-70, -48, -26, 0, 26, 48, 70];
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <path d="M-3 8 V78 H3 V8 Z" />
      {leaflets.map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy="-46"
          rx="9"
          ry="52"
          transform={`rotate(${angle})`}
        />
      ))}
    </g>
  );
}

function Wiregrass({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M0 0 C-6 -28 -10 -52 -4 -78" />
      <path d="M6 0 C4 -24 8 -48 14 -72" />
      <path d="M12 2 C16 -20 22 -40 20 -64" />
      <path d="M-8 2 C-16 -22 -18 -40 -22 -58" />
    </g>
  );
}

function Longleaf({
  x,
  y,
  height,
}: {
  x: number;
  y: number;
  height: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke="currentColor" strokeWidth="3">
      <path d={`M0 ${height} V0`} />
      <path d="M0 8 L-28 -10" />
      <path d="M0 8 L28 -8" />
      <path d="M0 22 L-22 4" />
      <path d="M0 22 L24 6" />
    </g>
  );
}
