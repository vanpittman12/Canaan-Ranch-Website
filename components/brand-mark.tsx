import {
  GROUND_LINE_PATH,
  PINE_CROWN_NODE,
  PINE_NEEDLE_PATHS,
  PINE_TRUNK_PATH,
  PINE_VIEWBOX,
  WIREGRASS_PATHS,
} from "@/lib/pine-mark";

export function BrandMark({
  className = "h-10 w-10",
  light = false,
  framed = false,
}: {
  className?: string;
  light?: boolean;
  framed?: boolean;
}) {
  const ink = framed && !light ? "#EFE6D4" : light ? "#EFE6D4" : "#24352A";
  const brass = "#C4A15A";
  const field = "#24352A";

  return (
    <svg
      className={className}
      viewBox={PINE_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-mark="longleaf-pine"
    >
      {framed ? <rect x="0" y="0" width="64" height="64" rx="14" fill={field} /> : null}
      {framed ? (
        <rect x="5" y="5" width="54" height="54" rx="11" stroke={brass} strokeWidth="1" opacity="0.75" />
      ) : null}
      <path d={PINE_TRUNK_PATH} stroke={ink} strokeWidth="2.8" strokeLinecap="round" />
      {PINE_NEEDLE_PATHS.map((d) => (
        <path key={d} d={d} stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
      ))}
      <circle cx={PINE_CROWN_NODE.cx} cy={PINE_CROWN_NODE.cy} r={PINE_CROWN_NODE.r} fill={brass} />
      <path d={GROUND_LINE_PATH} stroke={ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      {WIREGRASS_PATHS.map((d) => (
        <path key={d} d={d} stroke={brass} strokeWidth="1.6" strokeLinecap="round" />
      ))}
    </svg>
  );
}
