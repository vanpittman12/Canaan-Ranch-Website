"use client";

import { useActionState } from "react";
import {
  hideEngagementFromLedger,
  type AdminActionState,
} from "@/app/actions/admin";

const initialState: AdminActionState = {};

export function HideFromLedgerForm({
  engagementId,
  archivedAt,
  variant = "detail",
}: {
  engagementId: string;
  archivedAt: string | null;
  variant?: "detail" | "compact";
}) {
  const action = hideEngagementFromLedger.bind(null, engagementId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const compact = variant === "compact";

  if (archivedAt) {
    if (compact) {
      return <span className="text-sm text-muted">Hidden</span>;
    }
    return (
      <section className="surface-card">
        <h2 className="type-h2 text-forest">Review ledger</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Hidden from the review ledger on{" "}
          {new Date(archivedAt).toLocaleString("en-US")}. The D1 record, R2
          artifacts, and DocuSign envelope stay on file. There is no permanent
          purge.
        </p>
      </section>
    );
  }

  return (
    <details className={compact ? "text-sm" : "surface-card"}>
      <summary
        className={`${compact ? "btn-danger px-3 text-sm" : "btn-danger"} cursor-pointer list-none`}
      >
        Remove from ledger
      </summary>
      <form action={formAction} className={compact ? "mt-3 space-y-3" : "mt-4 space-y-4"}>
        <p className="text-sm leading-6 text-muted">
          Hide this engagement from the review ledger. Allowed for any status.
          D1 payload, R2 artifacts, and DocuSign data stay on file. This is not a
          permanent purge.
        </p>
        <input type="hidden" name="confirmHide" value="on" />
        {state.error ? (
          <p className="text-sm text-terracotta">{state.error}</p>
        ) : null}
        <button className="btn-danger" type="submit" disabled={pending}>
          {pending ? "Hiding…" : "Confirm remove"}
        </button>
      </form>
    </details>
  );
}
