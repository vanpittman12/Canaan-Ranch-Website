"use client";

import { useActionState } from "react";
import {
  refreshDocuSignStatus,
  resendDocuSign,
  reviewEngagement,
  simulateDocuSignComplete,
  type AdminActionState,
} from "@/app/actions/admin";
import type { Engagement } from "@/lib/types";

const initialState: AdminActionState = {};

export function ReviewForm({ engagement }: { engagement: Engagement }) {
  const action = reviewEngagement.bind(null, engagement.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (engagement.status !== "pending_review") {
    return (
      <div className="surface-card">
        <h2 className="type-h2 text-forest">Review</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          This engagement is no longer in the review queue. Decisions can only be recorded
          while the status is pending review. DocuSign is sent when the buyer submits — Accept
          is not required to start signing. The deal stays awaiting seller signature until Van
          signs on DocuSign.
        </p>
        {engagement.status === "accepted" &&
        engagement.signingMethod === "docusign" &&
        !engagement.docusign.envelopeId ? (
          <ResendDocuSign engagement={engagement} />
        ) : null}
        {engagement.status === "accepted" &&
        engagement.signingMethod === "docusign" &&
        engagement.docusign.envelopeId ? (
          <>
            {engagement.docusign.mode === "live" ? (
              <RefreshStatus engagementId={engagement.id} />
            ) : null}
            <SimulateComplete engagementId={engagement.id} />
          </>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="surface-card space-y-5">
      <div>
        <h2 className="type-h2 text-forest">Team decision</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Accept records a manual signed copy or sends DocuSign only if the envelope was not
          already created at intake submit. It does not mark the deal done. Status stays
          awaiting seller signature until Van/seller has signed and the envelope is complete. A
          reservation letter draft is generated on Accept (manual path) or when the seller
          signs, and is not emailed until you approve send.
        </p>
      </div>
      {state.error ? (
        <div className="rounded-[12px] border border-terracotta/30 bg-white px-4 py-3 text-sm text-terracotta">
          {state.error}
        </div>
      ) : null}
      <label className="block">
        <span className="type-label">Note to file / client</span>
        <textarea
          className="field-control min-h-28"
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

function RefreshStatus({ engagementId }: { engagementId: string }) {
  const action = refreshDocuSignStatus.bind(null, engagementId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-5 rounded-[12px] border border-line bg-cream p-4">
      <p className="text-sm font-medium text-ink">Refresh DocuSign status</p>
      <p className="mt-1 text-sm text-muted">
        Poll DocuSign for this envelope if Connect has not marked it complete yet.
      </p>
      {state.error ? <p className="mt-2 text-sm text-terracotta">{state.error}</p> : null}
      <button className="btn-secondary mt-3" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Refresh envelope status"}
      </button>
    </form>
  );
}

function SimulateComplete({ engagementId }: { engagementId: string }) {
  const action = simulateDocuSignComplete.bind(null, engagementId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-5 rounded-[12px] border border-dashed border-brass bg-cream p-4">
      <p className="text-sm font-medium text-ink">DocuSign stub control</p>
      <p className="mt-1 text-sm text-muted">
        Simulate the webhook that would fire when a signer completes the envelope. This attaches
        a stub signed PDF and moves the status to Executed after seller-sign is simulated.
      </p>
      {state.error ? <p className="mt-2 text-sm text-terracotta">{state.error}</p> : null}
      <button className="btn-secondary mt-3" type="submit" disabled={pending}>
        {pending ? "Recording…" : "Simulate DocuSign signed"}
      </button>
    </form>
  );
}

function ResendDocuSign({ engagement }: { engagement: Engagement }) {
  const action = resendDocuSign.bind(null, engagement.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-5 rounded-[12px] border border-terracotta/30 bg-cream p-4">
      <p className="text-sm font-medium text-ink">Resend DocuSign</p>
      <p className="mt-1 text-sm text-muted">
        Accept already saved, but no envelope was created. Retry sending the populated
        agreement to DocuSign without changing engagement status. Also used when intake
        submit failed to create the envelope.
      </p>
      {engagement.docusign.lastMessage ? (
        <p className="mt-2 text-sm text-terracotta">{engagement.docusign.lastMessage}</p>
      ) : null}
      {state.error ? <p className="mt-2 text-sm text-terracotta">{state.error}</p> : null}
      <button className="btn-primary mt-3" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Resend DocuSign"}
      </button>
    </form>
  );
}

