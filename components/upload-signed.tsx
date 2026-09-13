"use client";

import { useActionState } from "react";
import { uploadSignedCopy, type ActionState } from "@/app/actions/engagements";
import type { Engagement } from "@/lib/types";

const initialState: ActionState = {};

export function UploadSigned({
  engagement,
  compact = false,
}: {
  engagement: Engagement;
  compact?: boolean;
}) {
  const action = uploadSignedCopy.bind(null, engagement.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className={compact ? "rounded-xl border border-dashed border-line bg-cream/40 p-4" : "space-y-4"}
    >
      <div className={compact ? "" : ""}>
        <p className="font-medium text-ink">
          {engagement.signedArtifact ? "Replace signed copy" : "Upload a manually signed PDF"}
        </p>
        <p className="mt-1 text-sm text-muted">
          PDF only, up to 10 MB. A signed file does not close the engagement until the team
          accepts.
        </p>
      </div>
      {engagement.signedArtifact ? (
        <p className="mt-2 text-sm text-forest">
          On file: {engagement.signedArtifact.filename} (
          {engagement.signedArtifact.source === "manual_upload" ? "manual upload" : "DocuSign stub"})
        </p>
      ) : null}
      {state.error ? (
        <p className="mt-2 text-sm text-terracotta" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-sm file:font-medium file:text-cream"
          type="file"
          name="signedPdf"
          accept="application/pdf,.pdf"
          required
        />
        <button className="btn-secondary" type="submit" disabled={pending}>
          {pending ? "Uploading…" : "Upload signed copy"}
        </button>
      </div>
    </form>
  );
}
