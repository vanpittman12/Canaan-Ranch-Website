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
          <h2 className="font-serif text-2xl text-forest">Buyer</h2>
          <p className="mt-1 text-sm text-muted">
            Legal name, notice block, and Buyer signatory. The Effective Date is the date the
            Buyer signs — it is not collected here.
          </p>
        </div>
        <Field label="Buyer legal name" error={errors.buyerLegalName}>
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
            hint="Name that appears on notices and as the Buyer DocuSign signer."
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
          <Field label="Buyer signatory email" error={errors.buyerEmail}>
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
        <Field label="Street address" error={errors.buyerStreet}>
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
        <Field label="Phone" error={errors.buyerPhone}>
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
          <h2 className="font-serif text-2xl text-forest">Reserved spots</h2>
          <p className="mt-1 text-sm text-muted">
            Reserve recipient-site capacity as a tortoise count. Adult versus juvenile is not
            known at intake — juveniles are classified at delivery and acceptance, with a{" "}
            {formatUsd(brand.juvenileAdditionalFee)} additional fee per juvenile in the
            agreement (not collected here).
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Number of spots (tortoise count)" error={errors.tortoiseCount}>
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
            <p className="text-sm font-medium text-ink">Per GT rate</p>
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
                {formatUsd(brand.defaultPerGtRate)} standard
              </p>
            )}
            <p className="mt-1 text-sm text-muted">
              Default {formatUsd(brand.defaultPerGtRate)}. Generally non-negotiable. Manager
              override only for rare exceptions.
            </p>
            {errors.perGtRate ? (
              <p className="mt-1 text-sm text-terracotta">{errors.perGtRate}</p>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-cream/40 px-4 py-3 text-sm text-ink">
          Total estimated payment: <strong>{formatUsd(total)}</strong> ({count || 0} ×{" "}
          {formatUsd(rate || 0)})
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Project and operations</h2>
          <p className="mt-1 text-sm text-muted">
            Stored with the deal. County, authorized agent, and donor company also appear in the
            agreement where they belong.
          </p>
        </div>
        <Field
          label="County of relocation"
          hint="Donor / project county."
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
          <Field label="Authorized agent name" error={errors.authorizedAgentName}>
            <input
              className={fieldClass}
              name="authorizedAgentName"
              defaultValue={defaults?.authorizedAgentName}
              required
              autoComplete="name"
            />
          </Field>
          <Field
            label="Authorized agent company affiliation"
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
          hint="For example Lennar, D.R. Horton."
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
        <Field label="Donor site / project name (optional)" error={errors.donorSiteName}>
          <input
            className={fieldClass}
            name="donorSiteName"
            defaultValue={defaults?.donorSiteName}
          />
        </Field>
        <Field label="Project description (optional)" error={errors.donorSiteDescription}>
          <textarea
            className={`${fieldClass} min-h-24`}
            name="donorSiteDescription"
            defaultValue={defaults?.donorSiteDescription}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Witnesses</h2>
          <p className="mt-1 text-sm text-muted">
            One witness for the Buyer and one witness for Canaan Ranch LLP. Names appear on the
            signature blocks; emails are used for DocuSign routing.
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Canaan Ranch LLP witness name" error={errors.sellerWitnessName}>
            <input
              className={fieldClass}
              name="sellerWitnessName"
              defaultValue={defaults?.sellerWitnessName}
              required
              autoComplete="name"
            />
          </Field>
          <Field label="Canaan Ranch LLP witness email" error={errors.sellerWitnessEmail}>
            <input
              className={fieldClass}
              name="sellerWitnessEmail"
              type="email"
              defaultValue={defaults?.sellerWitnessEmail}
              required
              autoComplete="email"
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Submitting drafts the Canaan Preserve / Canaan Ranch LLP relocation agreement. The
          usual next step is DocuSign. Nothing is executed until the team accepts and a signed
          copy is on file.
        </p>
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : engagementId
              ? "Update agreement details"
              : "Generate agreement preview"}
        </button>
      </div>
    </form>
  );
}
