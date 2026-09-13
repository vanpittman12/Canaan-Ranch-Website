export function BrandMark({
  className = "h-10 w-10",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  const ink = light ? "#F4EEE3" : "#1B3328";
  const brass = "#B68B3D";

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
        d="M12 42c6-10 11-16 20-16s14 6 20 16"
        stroke={ink}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M20 42c4-6 8-10 12-10s8 4 12 10"
        stroke={brass}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M32 18v10"
        stroke={brass}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="16" r="2.4" fill={brass} />
    </svg>
  );
}
