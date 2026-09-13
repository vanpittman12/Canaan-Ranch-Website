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
  children,
}: {
  label: string;
  name?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
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
          <h2 className="font-serif text-2xl text-forest">Agreement dates</h2>
          <p className="mt-1 text-sm text-muted">
            Expiration is one year after the Effective Date and is filled automatically.
          </p>
        </div>
        <Field label="Effective date" error={errors.effectiveDate}>
          <input
            className={fieldClass}
            name="effectiveDate"
            type="date"
            defaultValue={defaults?.effectiveDate}
            required
          />
        </Field>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Buyer</h2>
          <p className="mt-1 text-sm text-muted">
            Legal name and notice block that appear on the relocation agreement.
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
          <Field label="Attention" error={errors.buyerAttention}>
            <input
              className={fieldClass}
              name="buyerAttention"
              defaultValue={defaults?.buyerAttention}
              required
              autoComplete="name"
            />
          </Field>
          <Field label="Email" error={errors.buyerEmail}>
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
          <h2 className="font-serif text-2xl text-forest">Reserved capacity</h2>
          <p className="mt-1 text-sm text-muted">
            Paragraph 2 of the agreement reserves capacity for up to this many gopher tortoises.
            Adult versus juvenile is determined at delivery, not here.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Number of gopher tortoises" error={errors.tortoiseCount}>
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
              <>
                <input type="hidden" name="perGtRate" value={rate} />
                <p className="mt-1.5 rounded-lg border border-line bg-cream/50 px-3.5 py-2.5 text-ink">
                  {formatUsd(brand.defaultPerGtRate)} standard
                </p>
              </>
            )}
            <p className="mt-1 text-sm text-muted">
              Generally non-negotiable. Manager can override for rare exceptions.
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
          <h2 className="font-serif text-2xl text-forest">Donor site (optional)</h2>
          <p className="mt-1 text-sm text-muted">
            If known, this is written into the reserved-capacity paragraph. Additional project
            information that does not belong in the agreement will be collected later.
          </p>
        </div>
        <Field label="Donor site / project name" error={errors.donorSiteName}>
          <input
            className={fieldClass}
            name="donorSiteName"
            defaultValue={defaults?.donorSiteName}
          />
        </Field>
        <Field label="Project description" error={errors.donorSiteDescription}>
          <textarea
            className={`${fieldClass} min-h-24`}
            name="donorSiteDescription"
            defaultValue={defaults?.donorSiteDescription}
          />
        </Field>
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Submitting generates the Canaan Preserve / Canaan Ranch LLP relocation agreement.
          Nothing is executed until the team accepts and a signed copy is on file.
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
