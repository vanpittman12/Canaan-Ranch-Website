"use client";

import { useActionState } from "react";
import { reviewEngagement, simulateDocuSignComplete, type AdminActionState } from "@/app/actions/admin";
import type { Engagement } from "@/lib/types";

const initialState: AdminActionState = {};

export function ReviewForm({ engagement }: { engagement: Engagement }) {
  const action = reviewEngagement.bind(null, engagement.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (engagement.status !== "pending_review") {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-serif text-2xl text-forest">Review</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          This engagement is no longer in the review queue. Decisions can only be recorded while
          the status is pending review. Nothing closes without Accept.
        </p>
        {engagement.status === "accepted" &&
        engagement.signingMethod === "docusign" &&
        engagement.docusign.envelopeId ? (
          <SimulateComplete engagementId={engagement.id} />
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-6">
      <div>
        <h2 className="font-serif text-2xl text-forest">Team decision</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Accept is the only path to execution. If a signed copy is already uploaded, Accept will
          mark the agreement executed. If the client chose DocuSign, Accept sends the stub
          envelope.
        </p>
      </div>
      {state.error ? (
        <div className="rounded-xl border border-terracotta/30 bg-terracotta/8 px-4 py-3 text-sm text-terracotta">
          {state.error}
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-ink">Note to file / client</span>
        <textarea
          className="mt-1.5 min-h-28 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
          name="note"
          placeholder="Required when requesting changes. Optional for accept or decline."
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="btn-primary"
          name="decision"
          value="accept"
          type="submit"
          disabled={pending}
        >
          Accept
        </button>
        <button
          className="btn-secondary"
          name="decision"
          value="request_changes"
          type="submit"
          disabled={pending}
        >
          Request changes
        </button>
        <button
          className="btn-danger"
          name="decision"
          value="decline"
          type="submit"
          disabled={pending}
        >
          Decline
        </button>
      </div>
    </form>
  );
}

function SimulateComplete({ engagementId }: { engagementId: string }) {
  const [state, formAction, pending] = useActionState(
    async () => simulateDocuSignComplete(engagementId),
    initialState,
  );

  return (
    <form action={formAction} className="mt-5 rounded-xl border border-dashed border-brass/50 bg-wheat/50 p-4">
      <p className="text-sm font-medium text-ink">DocuSign stub control</p>
      <p className="mt-1 text-sm text-muted">
        Simulate the webhook that would fire when a signer completes the envelope. This attaches
        a stub signed PDF and moves the status to Executed.
      </p>
      {state.error ? <p className="mt-2 text-sm text-terracotta">{state.error}</p> : null}
      <button className="btn-secondary mt-3" type="submit" disabled={pending}>
        {pending ? "Recording…" : "Simulate DocuSign signed"}
      </button>
    </form>
  );
}
