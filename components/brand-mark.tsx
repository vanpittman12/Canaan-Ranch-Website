export function BrandMark({
  className = "h-10 w-10",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const ink = light ? "#EFE6D4" : "#24352A";
  const brass = "#C4A15A";

  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="60" height="60" rx="14" stroke={ink} strokeWidth="2.4" />
      <path
        d="M18 46c2.2-9 6.4-16 14-16s11.8 7 14 16"
        stroke={ink}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M32 14v16M24 22c2.4 3.2 5.4 5.4 8 6.2C34.6 27.4 37.6 25.2 40 22"
        stroke={brass}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="14" r="2.2" fill={brass} />
    </svg>
  );
}
