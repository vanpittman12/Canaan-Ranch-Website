import {
  TORTOISE_BODY_PATH,
  TORTOISE_EYE,
  TORTOISE_SCUTE_PATHS,
  TORTOISE_VIEWBOX,
} from "@/lib/tortoise-mark";

export function BrandMark({
  className = "h-10 w-10",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const field = light ? "#24352A" : "#EFE6D4";
  const ink = light ? "#EFE6D4" : "#24352A";
  const brass = "#C4A15A";
  const ring = light ? "rgba(196,161,90,0.85)" : "#C4A15A";

  return (
    <svg
      className={className}
      viewBox={TORTOISE_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-mark="gopher-tortoise"
    >
      <rect x="1.5" y="1.5" width="61" height="61" rx="14" fill={field} stroke={ring} strokeWidth="1.5" />
      <rect x="5" y="5" width="54" height="54" rx="11" stroke={brass} strokeWidth="0.9" opacity="0.55" />
      <path d={TORTOISE_BODY_PATH} fill={ink} />
      {TORTOISE_SCUTE_PATHS.map((d) => (
        <path
          key={d}
          d={d}
          stroke={brass}
          strokeWidth="1.15"
          strokeLinecap="round"
          opacity="0.9"
        />
      ))}
      <circle cx={TORTOISE_EYE.cx} cy={TORTOISE_EYE.cy} r={TORTOISE_EYE.r} fill={field} />
    </svg>
  );
}
