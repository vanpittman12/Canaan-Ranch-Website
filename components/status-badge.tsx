import { STATUS_LABELS, type EngagementStatus } from "@/lib/types";

const tones: Record<EngagementStatus, string> = {
  draft: "bg-wheat text-ink",
  pending_review: "bg-brass/15 text-forest",
  changes_requested: "bg-terracotta/12 text-terracotta",
  declined: "bg-ink/8 text-muted",
  accepted: "bg-sage/20 text-forest",
  executed: "bg-forest text-cream",
};

export function StatusBadge({ status }: { status: EngagementStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tones[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
