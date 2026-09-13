"use client";

import { useActionState } from "react";
import { createEngagement, updateIntake, type ActionState } from "@/app/actions/engagements";
import { BUDGET_RANGES, DURATIONS, SERVICE_TYPES, type IntakeFields } from "@/lib/types";

const initialState: ActionState = {};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  name: string;
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
}: {
  engagementId?: string;
  defaults?: IntakeFields;
}) {
  const action = engagementId
    ? updateIntake.bind(null, engagementId)
    : createEngagement;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-10">
      {state.error ? (
        <div className="rounded-xl border border-terracotta/30 bg-terracotta/8 px-4 py-3 text-sm text-terracotta">
          {state.error}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Company</h2>
          <p className="mt-1 text-sm text-muted">
            The legal name and organization that will be party to the agreement.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Legal company name" name="companyName" error={errors.companyName}>
            <input
              className={fieldClass}
              name="companyName"
              defaultValue={defaults?.companyName}
              required
              autoComplete="organization"
            />
          </Field>
          <Field label="Website (optional)" name="website" error={errors.website}>
            <input
              className={fieldClass}
              name="website"
              type="url"
              placeholder="https://"
              defaultValue={defaults?.website}
              autoComplete="url"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Primary contact</h2>
          <p className="mt-1 text-sm text-muted">
            Who we should reach for questions, review, and signature.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="contactName" error={errors.contactName}>
            <input
              className={fieldClass}
              name="contactName"
              defaultValue={defaults?.contactName}
              required
              autoComplete="name"
            />
          </Field>
          <Field label="Title" name="contactTitle" error={errors.contactTitle}>
            <input
              className={fieldClass}
              name="contactTitle"
              defaultValue={defaults?.contactTitle}
              required
              autoComplete="organization-title"
            />
          </Field>
          <Field label="Email" name="contactEmail" error={errors.contactEmail}>
            <input
              className={fieldClass}
              name="contactEmail"
              type="email"
              defaultValue={defaults?.contactEmail}
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Phone" name="contactPhone" error={errors.contactPhone}>
            <input
              className={fieldClass}
              name="contactPhone"
              type="tel"
              defaultValue={defaults?.contactPhone}
              required
              autoComplete="tel"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Billing address</h2>
          <p className="mt-1 text-sm text-muted">Used as the client address on the agreement.</p>
        </div>
        <Field label="Street address" name="billingStreet" error={errors.billingStreet}>
          <input
            className={fieldClass}
            name="billingStreet"
            defaultValue={defaults?.billingStreet}
            required
            autoComplete="street-address"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" name="billingCity" error={errors.billingCity}>
            <input
              className={fieldClass}
              name="billingCity"
              defaultValue={defaults?.billingCity}
              required
              autoComplete="address-level2"
            />
          </Field>
          <Field label="State" name="billingState" error={errors.billingState}>
            <input
              className={fieldClass}
              name="billingState"
              defaultValue={defaults?.billingState}
              required
              autoComplete="address-level1"
            />
          </Field>
          <Field label="Postal code" name="billingPostalCode" error={errors.billingPostalCode}>
            <input
              className={fieldClass}
              name="billingPostalCode"
              defaultValue={defaults?.billingPostalCode}
              required
              autoComplete="postal-code"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-forest">Project basics</h2>
          <p className="mt-1 text-sm text-muted">
            These details populate Canaan Ranch’s standard professional-services agreement.
          </p>
        </div>
        <Field label="Project title" name="projectTitle" error={errors.projectTitle}>
          <input
            className={fieldClass}
            name="projectTitle"
            defaultValue={defaults?.projectTitle}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service type" name="serviceType" error={errors.serviceType}>
            <select
              className={fieldClass}
              name="serviceType"
              defaultValue={defaults?.serviceType ?? ""}
              required
            >
              <option value="" disabled>
                Select a service
              </option>
              {SERVICE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Service / site location" name="serviceLocation" error={errors.serviceLocation}>
            <input
              className={fieldClass}
              name="serviceLocation"
              defaultValue={defaults?.serviceLocation}
              required
            />
          </Field>
          <Field label="Preferred start date" name="startDate" error={errors.startDate}>
            <input
              className={fieldClass}
              name="startDate"
              type="date"
              defaultValue={defaults?.startDate}
              required
            />
          </Field>
          <Field label="Estimated duration" name="duration" error={errors.duration}>
            <select
              className={fieldClass}
              name="duration"
              defaultValue={defaults?.duration ?? ""}
              required
            >
              <option value="" disabled>
                Select duration
              </option>
              {DURATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Budget range" name="budgetRange" error={errors.budgetRange}>
            <select
              className={fieldClass}
              name="budgetRange"
              defaultValue={defaults?.budgetRange ?? ""}
              required
            >
              <option value="" disabled>
                Select a range
              </option>
              {BUDGET_RANGES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Scope summary" name="scopeSummary" error={errors.scopeSummary}>
          <textarea
            className={`${fieldClass} min-h-32`}
            name="scopeSummary"
            defaultValue={defaults?.scopeSummary}
            required
            placeholder="What should Canaan Ranch deliver, and what does success look like?"
          />
        </Field>
        <Field label="Additional notes (optional)" name="notes" error={errors.notes}>
          <textarea
            className={`${fieldClass} min-h-24`}
            name="notes"
            defaultValue={defaults?.notes}
            placeholder="Constraints, stakeholders, seasonal timing, or special terms."
          />
        </Field>
      </section>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Submitting generates a Canaan Ranch agreement preview. Nothing is executed until the
          team accepts and a signed copy is on file.
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
