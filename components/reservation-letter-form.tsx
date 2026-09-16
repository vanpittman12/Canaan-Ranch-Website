"use client";

import { useActionState } from "react";
import {
  approveReservationLetterSend,
  type AdminActionState,
} from "@/app/actions/admin";
import { LETTER_STATUS_LABELS, type Engagement } from "@/lib/types";

const initialState: AdminActionState = {};

export function ReservationLetterForm({ engagement }: { engagement: Engagement }) {
  const letter = engagement.reservationLetter;
  const action = approveReservationLetterSend.bind(null, engagement.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const generated = Boolean(letter.storedName);
  const sent = letter.status === "sent" && Boolean(letter.sentAt);
  const canApprove =
    (engagement.status === "accepted" || engagement.status === "executed") && !sent;

  return (
    <section className="surface-card">
      <h2 className="type-h2 text-forest">Reservation letter</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Generated from intake after Accept (manual path) or when the Seller signs. Refreshed
        when the Seller signs (Effective Date). Email goes out only after you check Send
        reservation letter — never automatically.
      </p>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="grid grid-cols-[8.25rem_1fr] gap-3">
          <dt className="text-muted">Status</dt>
          <dd className="text-ink">{LETTER_STATUS_LABELS[letter.status]}</dd>
        </div>
        <div className="grid grid-cols-[8.25rem_1fr] gap-3">
          <dt className="text-muted">Draft generated</dt>
          <dd className="text-ink">
            {letter.generatedAt
              ? new Date(letter.generatedAt).toLocaleString("en-US")
              : "Not yet"}
          </dd>
        </div>
        <div className="grid grid-cols-[8.25rem_1fr] gap-3">
          <dt className="text-muted">Send approval</dt>
          <dd className="text-ink">
            {sent
              ? `Sent ${new Date(letter.sentAt!).toLocaleString("en-US")}${
                  letter.notifyMode === "stub" ? " (local stub)" : ""
                }`
              : generated
                ? "Awaiting send approval"
                : "—"}
          </dd>
        </div>
        {letter.letterDate ? (
          <div className="grid grid-cols-[8.25rem_1fr] gap-3">
            <dt className="text-muted">Letter date</dt>
            <dd className="text-ink">{letter.letterDate}</dd>
          </div>
        ) : null}
        {letter.refreshedAt ? (
          <div className="grid grid-cols-[8.25rem_1fr] gap-3">
            <dt className="text-muted">Refreshed</dt>
            <dd className="text-ink">{new Date(letter.refreshedAt).toLocaleString("en-US")}</dd>
          </div>
        ) : null}
      </dl>
      {letter.lastError ? (
        <p className="mt-3 text-sm text-terracotta">{letter.lastError}</p>
      ) : null}
      {generated ? (
        <a className="btn-secondary mt-4 inline-flex" href={`/api/engagements/${engagement.id}/letter`}>
          Download letter PDF
        </a>
      ) : null}
      {canApprove ? (
        <form action={formAction} className="mt-5 rounded-[12px] border border-line bg-cream p-4">
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              className="mt-1 h-4 w-4 accent-forest"
              type="checkbox"
              name="sendReservationLetter"
              value="on"
            />
            <span>
              <span className="font-medium">Send reservation letter</span>
              <span className="mt-1 block text-muted">
                Emails the PDF to Van (vpittman@beachparkcap.com) and the buyer notice
                email ({engagement.intake.buyerEmail || "not on file"}).
              </span>
            </span>
          </label>
          {state.error ? <p className="mt-2 text-sm text-terracotta">{state.error}</p> : null}
          <button className="btn-primary mt-4" type="submit" disabled={pending}>
            {pending ? "Sending…" : generated ? "Approve and email letter" : "Generate and email letter"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
