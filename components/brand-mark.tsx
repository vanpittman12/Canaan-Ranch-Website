import {
  TORTOISE_EYE,
  TORTOISE_FORELEG_PATH,
  TORTOISE_HEAD_PATH,
  TORTOISE_HINDLEG_PATH,
  TORTOISE_SCALE_PATHS,
  TORTOISE_SCUTE_PATHS,
  TORTOISE_SHELL_PATH,
  TORTOISE_TAIL_PATH,
  TORTOISE_VIEWBOX,
} from "@/lib/tortoise-mark";

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
      viewBox={TORTOISE_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-mark="gopher-tortoise"
    >
      {framed ? <rect x="0" y="0" width="64" height="64" rx="14" fill={field} /> : null}
      {framed ? (
        <rect x="5" y="5" width="54" height="54" rx="11" stroke={brass} strokeWidth="1" opacity="0.75" />
      ) : null}
      <path d={TORTOISE_SHELL_PATH} fill={ink} fillOpacity="0.14" stroke={ink} strokeWidth="2.15" />
      <path d={TORTOISE_HEAD_PATH} fill={ink} fillOpacity="0.14" stroke={ink} strokeWidth="2.15" />
      <path
        d={TORTOISE_FORELEG_PATH}
        stroke={ink}
        strokeWidth="3.3"
        strokeLinecap="round"
      />
      <path d={TORTOISE_HINDLEG_PATH} stroke={ink} strokeWidth="3.3" strokeLinecap="round" />
      <path d={TORTOISE_TAIL_PATH} stroke={ink} strokeWidth="1.8" strokeLinecap="round" />
      {TORTOISE_SCUTE_PATHS.map((d) => (
        <path key={d} d={d} stroke={brass} strokeWidth="1.45" strokeLinecap="round" />
      ))}
      {TORTOISE_SCALE_PATHS.map((d) => (
        <path key={d} d={d} stroke={brass} strokeWidth="1.15" strokeLinecap="round" />
      ))}
      <circle cx={TORTOISE_EYE.cx} cy={TORTOISE_EYE.cy} r={TORTOISE_EYE.r} fill={ink} />
    </svg>
  );
}
