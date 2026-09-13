"use client";

import { useActionState, useMemo, useState } from "react";
import { createEngagement, updateIntake, type ActionState } from "@/app/actions/engagements";
import { brand } from "@/lib/brand";
import { estimatedPayment, formatUsd } from "@/lib/money";
import type { IntakeFields } from "@/lib/types";

const initialState: ActionState = {};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15";

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint ? <span className="mt-0.5 block text-sm text-muted">{hint}</span> : null}
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-terracotta" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function IntakeForm({
  engagementId,
  defaults,
  allowRateOverride = false,
}: {
  engagementId?: string;
  defaults?: IntakeFields;
  allowRateOverride?: boolean;
}) {
  const action = engagementId
    ? updateIntake.bind(null, engagementId)
    : createEngagement;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  const [count, setCount] = useState(defaults?.tortoiseCount ?? 1);
  const [rate, setRate] = useState(defaults?.perGtRate ?? brand.defaultPerGtRate);
  const total = useMemo(() => estimatedPayment(count || 0, rate || 0), [count, rate]);

  return (
    <form action={formAction} className="space-y-10">
      {state.error ? (
        <div className="rounded-xl border border-terracotta/30 bg-terracotta/8 px-4 py-3 text-sm text-terracotta">
          {state.error}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Buyer notice block</h2>
          <p className="mt-1 text-sm text-muted">
            These fields become the Buyer notice in Parties and Notices: legal name, Attention
            (signatory), street, city, state, postal code, phone, and email. The Effective Date is
            the date the Buyer signs — it is not collected here.
          </p>
        </div>
        <Field
          label="Buyer legal name"
          hint="Buyer party name on the agreement."
          error={errors.buyerLegalName}
        >
          <input
            className={fieldClass}
            name="buyerLegalName"
            defaultValue={defaults?.buyerLegalName}
            required
            autoComplete="organization"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Buyer signatory / attention"
            hint="Appears as Attention on the notice block and as the Buyer signature name."
            error={errors.buyerAttention}
          >
            <input
              className={fieldClass}
              name="buyerAttention"
              defaultValue={defaults?.buyerAttention}
              required
              autoComplete="name"
            />
          </Field>
          <Field
            label="Buyer signatory email"
            hint="Notice email and DocuSign Buyer signer."
            error={errors.buyerEmail}
          >
            <input
              className={fieldClass}
              name="buyerEmail"
              type="email"
              defaultValue={defaults?.buyerEmail}
              required
              autoComplete="email"
            />
          </Field>
        </div>
        <Field
          label="Street address"
          hint="First line of the Buyer notice address."
          error={errors.buyerStreet}
        >
          <input
            className={fieldClass}
            name="buyerStreet"
            defaultValue={defaults?.buyerStreet}
            required
            autoComplete="street-address"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" error={errors.buyerCity}>
            <input
              className={fieldClass}
              name="buyerCity"
              defaultValue={defaults?.buyerCity}
              required
              autoComplete="address-level2"
            />
          </Field>
          <Field label="State" error={errors.buyerState}>
            <input
              className={fieldClass}
              name="buyerState"
              defaultValue={defaults?.buyerState ?? "FL"}
              required
              autoComplete="address-level1"
            />
          </Field>
          <Field label="Postal code" error={errors.buyerPostalCode}>
            <input
              className={fieldClass}
              name="buyerPostalCode"
              defaultValue={defaults?.buyerPostalCode}
              required
              autoComplete="postal-code"
            />
          </Field>
        </div>
        <Field label="Phone" hint="Included on the Buyer notice block." error={errors.buyerPhone}>
          <input
            className={fieldClass}
            name="buyerPhone"
            type="tel"
            defaultValue={defaults?.buyerPhone}
            required
            autoComplete="tel"
          />
        </Field>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Reserved capacity</h2>
          <p className="mt-1 text-sm text-muted">
            The tortoise count becomes Paragraph 2 “up to N” reserved capacity. Adult versus
            juvenile is classified at delivery. {formatUsd(brand.defaultPerGtRate)} per adult.{" "}
            {formatUsd(brand.juvenileAdditionalFee)} per juvenile. No deposits required.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Reserved capacity (gopher tortoise count)"
            hint="Maps to “up to N” in the reserved-capacity paragraph."
            error={errors.tortoiseCount}
          >
            <input
              className={fieldClass}
              name="tortoiseCount"
              type="number"
              min={1}
              step={1}
              required
              value={Number.isFinite(count) ? count : ""}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </Field>
          <div>
            <p className="text-sm font-medium text-ink">Adult rate</p>
            {allowRateOverride ? (
              <input
                className={fieldClass}
                name="perGtRate"
                type="number"
                min={1}
                step={1}
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
              />
            ) : (
              <p className="mt-1.5 rounded-lg border border-line bg-cream/50 px-3.5 py-2.5 text-ink">
                {formatUsd(brand.defaultPerGtRate)} per adult
              </p>
            )}
            <p className="mt-1 text-sm text-muted">
              {formatUsd(brand.juvenileAdditionalFee)} per juvenile at delivery. No deposits
              required.
            </p>
            {errors.perGtRate ? (
              <p className="mt-1 text-sm text-terracotta">{errors.perGtRate}</p>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-cream/40 px-4 py-3 text-sm text-ink">
          Total estimated payment at the adult rate: <strong>{formatUsd(total)}</strong> (
          {count || 0} × {formatUsd(rate || 0)} per adult). Juvenile fees, if any, are added at
          delivery. No deposits required.
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Project and operations</h2>
          <p className="mt-1 text-sm text-muted">
            County of relocation, donor company affiliation, and optional donor site appear in
            the reserved-capacity paragraph. Buyer’s authorized agent appears in Parties,
            Notices, and Buyer responsibilities.
          </p>
        </div>
        <Field
          label="County of relocation"
          hint="Maps to “County of relocation” in the reserved-capacity paragraph."
          error={errors.relocationCounty}
        >
          <input
            className={fieldClass}
            name="relocationCounty"
            defaultValue={defaults?.relocationCounty}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Buyer’s authorized agent name"
            hint="First part of “Buyer’s authorized agent” on the agreement."
            error={errors.authorizedAgentName}
          >
            <input
              className={fieldClass}
              name="authorizedAgentName"
              defaultValue={defaults?.authorizedAgentName}
              required
              autoComplete="name"
            />
          </Field>
          <Field
            label="Buyer’s authorized agent company"
            hint="Second part of “Buyer’s authorized agent” on the agreement."
            error={errors.authorizedAgentCompany}
          >
            <input
              className={fieldClass}
              name="authorizedAgentCompany"
              defaultValue={defaults?.authorizedAgentCompany}
              required
              autoComplete="organization"
            />
          </Field>
        </div>
        <Field
          label="Donor company affiliation"
          hint="Maps to “Donor company affiliation” in the reserved-capacity paragraph. For example Lennar, D.R. Horton."
          error={errors.donorCompanyAffiliation}
        >
          <input
            className={fieldClass}
            name="donorCompanyAffiliation"
            defaultValue={defaults?.donorCompanyAffiliation}
            required
            autoComplete="organization"
          />
        </Field>
        <Field
          label="Donor site / project name (optional)"
          hint="Maps to “Donor site / project” in the reserved-capacity paragraph."
          error={errors.donorSiteName}
        >
          <input
            className={fieldClass}
            name="donorSiteName"
            defaultValue={defaults?.donorSiteName}
          />
        </Field>
        <Field
          label="Project description (optional)"
          hint="Appended as “Project description” in the reserved-capacity paragraph."
          error={errors.donorSiteDescription}
        >
          <textarea
            className={`${fieldClass} min-h-24`}
            name="donorSiteDescription"
            defaultValue={defaults?.donorSiteDescription}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Buyer witness</h2>
          <p className="mt-1 text-sm text-muted">
            One Buyer witness. The name appears on the Buyer signature block; the email is used
            for DocuSign routing. The Canaan Ranch LLP witness is seller-side and is not collected
            on this form.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Buyer witness name" error={errors.buyerWitnessName}>
            <input
              className={fieldClass}
              name="buyerWitnessName"
              defaultValue={defaults?.buyerWitnessName}
              required
              autoComplete="name"
            />
          </Field>
          <Field label="Buyer witness email" error={errors.buyerWitnessEmail}>
            <input
              className={fieldClass}
              name="buyerWitnessEmail"
              type="email"
              defaultValue={defaults?.buyerWitnessEmail}
              required
              autoComplete="email"
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Submitting drafts the Canaan Preserve / Canaan Ranch LLP relocation agreement. You will
          download the populated PDF to review. The usual next step is team Accept, then
          DocuSign. Nothing is executed until the team accepts and a signed copy is on file.
        </p>
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : engagementId
              ? "Update agreement details"
              : "Generate agreement PDF"}
        </button>
      </div>
    </form>
  );
}
