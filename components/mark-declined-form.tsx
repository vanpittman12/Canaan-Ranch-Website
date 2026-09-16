"use client";

import { useActionState } from "react";
import {
  markEngagementDeclined,
  type AdminActionState,
} from "@/app/actions/admin";
import type { EngagementStatus } from "@/lib/types";

const initialState: AdminActionState = {};

export function MarkDeclinedForm({
  engagementId,
  status,
}: {
  engagementId: string;
  status: EngagementStatus;
}) {
  const action = markEngagementDeclined.bind(null, engagementId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (status === "declined") {
    return null;
  }

  return (
    <details className="surface-card">
      <summary className="btn-danger cursor-pointer list-none">Mark declined</summary>
      <form action={formAction} className="mt-4 space-y-4">
        <p className="text-sm leading-6 text-muted">
          Move this engagement to Declined so it leaves the active review queue
          (Pending / Awaiting seller / Changes) but stays on the ledger. D1
          payload, R2 artifacts, and DocuSign data stay on file. Use Remove from
          ledger instead if it should disappear from the default list.
        </p>
        <input type="hidden" name="confirmDecline" value="on" />
        {state.error ? <p className="text-sm text-terracotta">{state.error}</p> : null}
        <button className="btn-danger" type="submit" disabled={pending}>
          {pending ? "Updating…" : "Confirm decline"}
        </button>
      </form>
    </details>
  );
}
