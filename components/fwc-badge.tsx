import { brand } from "@/lib/brand";

export function FwcBadge({
  onForest = false,
  className = "",
}: {
  onForest?: boolean;
  className?: string;
}) {
  return (
    <span className={`fwc-badge ${onForest ? "fwc-badge-on-forest" : ""} ${className}`.trim()}>
      {brand.fwcBadge}
    </span>
  );
}
