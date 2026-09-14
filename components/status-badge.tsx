import { STATUS_LABELS, STATUS_PILL_LABELS, type EngagementStatus } from "@/lib/types";

const tones: Record<EngagementStatus, string> = {
  draft: "bg-wheat text-ink",
  pending_review: "bg-cream text-forest border border-brass",
  changes_requested: "bg-white text-terracotta border border-terracotta/40",
  declined: "bg-cream text-muted border border-line",
  accepted: "bg-cream text-forest border border-brass",
  executed: "bg-forest text-cream",
};

export function StatusBadge({ status }: { status: EngagementStatus }) {
  return (
    <span
      className={`status-pill ${tones[status]}`}
      title={STATUS_LABELS[status]}
    >
      {STATUS_PILL_LABELS[status]}
    </span>
  );
}
