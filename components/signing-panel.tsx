"use client";

import { useActionState, useState } from "react";
import { submitEngagement, type ActionState } from "@/app/actions/engagements";
import type { Engagement } from "@/lib/types";
import { UploadSigned } from "./upload-signed";

const initialState: ActionState = {};

export function SigningPanel({
  engagement,
  contractUrl,
}: {
  engagement: Engagement;
  contractUrl: string;
}) {
  const action = submitEngagement.bind(null, engagement.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [method, setMethod] = useState(engagement.signingMethod ?? "docusign");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="type-h2 text-forest">Choose how you will sign</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Download the populated Word agreement first. DocuSign is the usual signing path and
          emails you as soon as you submit — no admin Accept is required to start signing.
          The fallback is to download the Word agreement and upload a signed copy. The Canaan
          Ranch LLP witness is already routed from brand config. Nothing is executed until a
          signed artifact is on file.
        </p>
      </div>

      {state.error ? (
        <div className="rounded-[12px] border border-terracotta/30 bg-white px-4 py-3 text-sm text-terracotta">
          {state.error}
        </div>
      ) : null}

      <form action={formAction} className="space-y-5">
        <fieldset className="grid gap-4">
          <legend className="sr-only">Signing method</legend>
          <label className={`choice-card ${method === "docusign" ? "choice-card-active" : ""}`}>
            <input
              className="mt-1"
              type="radio"
              name="signingMethod"
              value="docusign"
              checked={method === "docusign"}
              onChange={() => setMethod("docusign")}
            />
            <span>
              <span className="block font-medium text-ink">
                DocuSign on submit (usual signing path)
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted">
                Submitting sends DocuSign to the Buyer signatory and Buyer witness first, then
                Canaan Ranch LLP and the fixed Canaan Ranch LLP witness. Check your email for
                DocuSign. Seller counter-sign can follow later and is not required to start
                your signature.
              </span>
            </span>
          </label>
          <label className={`choice-card ${method === "manual" ? "choice-card-active" : ""}`}>
            <input
              className="mt-1"
              type="radio"
              name="signingMethod"
              value="manual"
              checked={method === "manual"}
              onChange={() => setMethod("manual")}
            />
            <span>
              <span className="block font-medium text-ink">Download and upload a signed copy</span>
              <span className="mt-1 block text-sm leading-6 text-muted">
                Download the populated Word agreement, sign it, and upload the signed file. You
                may upload now or after you submit. Execution still requires an Accept decision.
              </span>
            </span>
          </label>
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a className="btn-secondary" href={contractUrl}>
            Download populated agreement
          </a>
          <button className="btn-primary" type="submit" disabled={pending}>
            {pending
              ? "Submitting…"
              : method === "docusign"
                ? "Submit and send DocuSign"
                : "Submit for Canaan Preserve review"}
          </button>
        </div>
      </form>

      {method === "manual" ? <UploadSigned engagement={engagement} compact /> : null}
    </div>
  );
}
