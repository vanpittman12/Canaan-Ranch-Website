import type { Engagement } from "@/lib/types";

const stages = [
  {
    id: "intake",
    title: "Intake saved",
    body: "Buyer notice, capacity, project, and witness are on file.",
  },
  {
    id: "download",
    title: "Download agreement",
    body: "Review the populated Word agreement. There is no on-screen contract preview.",
  },
  {
    id: "signing",
    title: "Choose signing",
    body: "DocuSign after Accept is the usual path. You can also download the Word agreement and upload a signed copy.",
  },
  {
    id: "review",
    title: "Canaan Preserve review",
    body: "Accept is not complete. The engagement stays awaiting seller signature until Van signs on DocuSign (or a complete signed copy is on file).",
  },
  {
    id: "executed",
    title: "Executed",
    body: "Effective Date is the Buyer signature date. Expiration is one year later.",
  },
] as const;

function stageState(engagement: Engagement, id: (typeof stages)[number]["id"]) {
  const submitted = Boolean(engagement.submittedAt) || engagement.status !== "draft";
  const signedChoice = Boolean(engagement.signingMethod);
  const accepted =
    engagement.status === "accepted" || engagement.status === "executed";
  const executed = engagement.status === "executed";

  if (id === "intake") {
    return "done";
  }
  if (id === "download") {
    return signedChoice || submitted ? "done" : "current";
  }
  if (id === "signing") {
    if (signedChoice || submitted) {
      return accepted || submitted ? "done" : "current";
    }
    return "todo";
  }
  if (id === "review") {
    if (executed) {
      return "done";
    }
    if (submitted) {
      return "current";
    }
    return "todo";
  }
  return executed ? "done" : "todo";
}

export function EngagementTimeline({ engagement }: { engagement: Engagement }) {
  return (
    <section className="surface-card">
      <h2 className="type-h2 text-forest">What happens next</h2>
      <ol className="mt-5 space-y-4">
        {stages.map((stage, index) => {
          const state = stageState(engagement, stage.id);
          return (
            <li key={stage.id} className="grid grid-cols-[2rem_1fr] gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  state === "done"
                    ? "border-forest bg-forest text-cream"
                    : state === "current"
                      ? "border-brass bg-cream text-forest"
                      : "border-line bg-white text-muted"
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-ink">{stage.title}</p>
                <p className="text-sm leading-6 text-muted">{stage.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
