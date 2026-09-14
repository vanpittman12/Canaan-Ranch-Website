"use client";

import { useActionState, useMemo, useState } from "react";
import { createEngagement, updateIntake, type ActionState } from "@/app/actions/engagements";
import { brand } from "@/lib/brand";
import {
  INTAKE_STEPS,
  REVIEW_STEP_ID,
  canSubmitIntake,
  firstStepForErrors,
  formatGopherTortoiseCount,
  intakeValuesFromDefaults,
  nextStep,
  previousStep,
  type IntakeWizardStep,
  validateThrough,
} from "@/lib/intake-steps";
import { estimatedPayment, formatUsd } from "@/lib/money";
import type { IntakeFields } from "@/lib/types";

const initialState: ActionState = {};

function FieldRow({
  columns,
  children,
}: {
  columns: 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        columns === 3
          ? "flex flex-col gap-4 sm:grid sm:grid-cols-3 sm:grid-rows-[auto_auto_auto_auto] sm:gap-x-4 sm:gap-y-0"
          : "flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:grid-rows-[auto_auto_auto_auto] sm:gap-x-4 sm:gap-y-0"
      }
    >
      {children}
    </div>
  );
}

function Field({
  name,
  label,
  error,
  hint,
  children,
  split = false,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  split?: boolean;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const hintSlot = (
    <p
      id={hintId}
      className={`mt-1 text-sm sm:row-start-2 ${hint ? "text-muted" : "invisible max-sm:hidden"}`}
      aria-hidden={hint ? undefined : true}
    >
      {hint || "\u00a0"}
    </p>
  );

  const errorSlot = (
    <p
      id={errorId}
      className={`mt-1 min-h-5 text-sm sm:row-start-4 ${error ? "text-terracotta" : "invisible max-sm:hidden"}`}
      role={error ? "alert" : undefined}
    >
      {error || "\u00a0"}
    </p>
  );

  if (split) {
    return (
      <div
        className="flex min-w-0 flex-col sm:col-span-1 sm:row-span-4 sm:grid sm:grid-rows-subgrid sm:items-stretch"
        data-field={name}
        data-describedby={describedBy}
      >
        <label htmlFor={name} className="type-label sm:row-start-1">
          {label}
        </label>
        {hintSlot}
        <div className="sm:row-start-3">{children}</div>
        {errorSlot}
      </div>
    );
  }

  return (
    <div className="flex flex-col" data-describedby={describedBy}>
      <label htmlFor={name} className="type-label">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {children}
      <p
        id={errorId}
        className={`mt-1 min-h-5 text-sm ${error ? "text-terracotta" : "invisible"}`}
        role={error ? "alert" : undefined}
      >
        {error || "\u00a0"}
      </p>
    </div>
  );
}

function controlProps(
  name: string,
  error?: string,
  hint?: string,
): {
  id: string;
  name: string;
  className: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
} {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return {
    id: name,
    name,
    className: "field-control",
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
  };
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
  const [values, setValues] = useState(() => intakeValuesFromDefaults(defaults));
  const [step, setStep] = useState<IntakeWizardStep>(defaults ? REVIEW_STEP_ID : "notice");
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [appliedErrorKey, setAppliedErrorKey] = useState("");
  const errors = { ...stepErrors, ...(state.fieldErrors ?? {}) };
  const errorKey = state.fieldErrors ? JSON.stringify(state.fieldErrors) : "";
  if (errorKey && errorKey !== appliedErrorKey) {
    setAppliedErrorKey(errorKey);
    setStep(firstStepForErrors(state.fieldErrors ?? {}));
  }
  const count = Number(values.tortoiseCount);
  const rate = defaults?.perGtRate ?? brand.defaultPerGtRate;
  const total = useMemo(
    () => estimatedPayment(Number.isFinite(count) ? count : 0, rate || 0),
    [count, rate],
  );

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setStepErrors((current) => {
      if (!current[name]) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function goTo(target: IntakeWizardStep) {
    setStepErrors({});
    setStep(target);
  }

  function goNext() {
    if (step === REVIEW_STEP_ID) {
      return;
    }
    goTo(nextStep(step));
  }

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(event) => {
        if (!canSubmitIntake(step)) {
          event.preventDefault();
          goNext();
          return;
        }
        const gate = validateThrough(REVIEW_STEP_ID, values);
        if (Object.keys(gate).length > 0) {
          event.preventDefault();
          setStepErrors(gate);
          setStep(firstStepForErrors(gate));
        }
      }}
      className="space-y-8"
    >
      {state.error ? (
        <div className="rounded-[12px] border border-terracotta/30 bg-white px-4 py-3 text-sm text-terracotta">
          {state.error}
        </div>
      ) : null}

      <ol className="pill-row" aria-label="Intake progress">
        {INTAKE_STEPS.map((item, index) => {
          const active = step === item.id;
          const complete = INTAKE_STEPS.findIndex((entry) => entry.id === step) > index || step === REVIEW_STEP_ID;
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`status-pill min-h-11 ${
                  active
                    ? "bg-forest text-cream"
                    : complete
                      ? "border border-sage bg-cream text-forest"
                      : "border border-line bg-white text-muted"
                }`}
                onClick={() => goTo(item.id)}
              >
                {index + 1} {item.label}
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className={`status-pill min-h-11 ${
              step === REVIEW_STEP_ID
                ? "bg-forest text-cream"
                : "border border-line bg-white text-muted"
            }`}
            onClick={() => goTo(REVIEW_STEP_ID)}
          >
            Review
          </button>
        </li>
      </ol>

      <section hidden={step !== "notice"} className="space-y-4">
        <div>
          <h2 className="type-h2 text-forest">Buyer notice block</h2>
          <p className="mt-2 text-sm text-muted">
            These fields become the Buyer notice in Parties and Notices. The Effective Date is
            the date the Buyer signs — it is not collected here.
          </p>
        </div>
        <Field
          name="buyerLegalName"
          label="Buyer legal name"
          hint="Buyer party name on the agreement."
          error={errors.buyerLegalName}
        >
          <input
            {...controlProps("buyerLegalName", errors.buyerLegalName, "Buyer party name on the agreement.")}
            value={values.buyerLegalName}
            onChange={(event) => update("buyerLegalName", event.target.value)}
            required
            autoComplete="organization"
          />
        </Field>
        <FieldRow columns={2}>
          <Field
            split
            name="buyerAttention"
            label="Buyer signatory / attention"
            hint="Appears as Attention on the notice block and as the Buyer signature name."
            error={errors.buyerAttention}
          >
            <input
              {...controlProps(
                "buyerAttention",
                errors.buyerAttention,
                "Appears as Attention on the notice block and as the Buyer signature name.",
              )}
              value={values.buyerAttention}
              onChange={(event) => update("buyerAttention", event.target.value)}
              required
              autoComplete="name"
            />
          </Field>
          <Field
            split
            name="buyerEmail"
            label="Buyer signatory email"
            hint="Notice email and DocuSign Buyer signer."
            error={errors.buyerEmail}
          >
            <input
              {...controlProps(
                "buyerEmail",
                errors.buyerEmail,
                "Notice email and DocuSign Buyer signer.",
              )}
              type="email"
              value={values.buyerEmail}
              onChange={(event) => update("buyerEmail", event.target.value)}
              required
              autoComplete="email"
            />
          </Field>
        </FieldRow>
        <Field
          name="buyerStreet"
          label="Street address"
          hint="First line of the Buyer notice address."
          error={errors.buyerStreet}
        >
          <input
            {...controlProps(
              "buyerStreet",
              errors.buyerStreet,
              "First line of the Buyer notice address.",
            )}
            value={values.buyerStreet}
            onChange={(event) => update("buyerStreet", event.target.value)}
            required
            autoComplete="street-address"
          />
        </Field>
        <FieldRow columns={3}>
          <Field split name="buyerCity" label="City" error={errors.buyerCity}>
            <input
              {...controlProps("buyerCity", errors.buyerCity)}
              value={values.buyerCity}
              onChange={(event) => update("buyerCity", event.target.value)}
              required
              autoComplete="address-level2"
            />
          </Field>
          <Field split name="buyerState" label="State" error={errors.buyerState}>
            <input
              {...controlProps("buyerState", errors.buyerState)}
              value={values.buyerState}
              onChange={(event) => update("buyerState", event.target.value)}
              required
              autoComplete="address-level1"
            />
          </Field>
          <Field split name="buyerPostalCode" label="Postal code" error={errors.buyerPostalCode}>
            <input
              {...controlProps("buyerPostalCode", errors.buyerPostalCode)}
              value={values.buyerPostalCode}
              onChange={(event) => update("buyerPostalCode", event.target.value)}
              required
              autoComplete="postal-code"
            />
          </Field>
        </FieldRow>
        <Field
          name="buyerPhone"
          label="Phone"
          hint="Included on the Buyer notice block."
          error={errors.buyerPhone}
        >
          <input
            {...controlProps("buyerPhone", errors.buyerPhone, "Included on the Buyer notice block.")}
            type="tel"
            value={values.buyerPhone}
            onChange={(event) => update("buyerPhone", event.target.value)}
            required
            autoComplete="tel"
          />
        </Field>
      </section>

      <section hidden={step !== "capacity"} className="space-y-4">
        <div>
          <h2 className="type-h2 text-forest">Reserved capacity</h2>
          <p className="mt-2 text-sm text-muted">
            The tortoise count becomes Paragraph 2 “up to N” reserved capacity. Adult versus
            juvenile is classified at delivery. {formatUsd(brand.defaultPerGtRate)} per adult.{" "}
            {formatUsd(brand.juvenileRate)} per juvenile (all-in, not added to the adult rate).
            No deposits required.
          </p>
        </div>
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field
            name="tortoiseCount"
            label="Reserved capacity (gopher tortoise count)"
            hint="Maps to “up to N” in the reserved-capacity paragraph."
            error={errors.tortoiseCount}
          >
            <input
              {...controlProps(
                "tortoiseCount",
                errors.tortoiseCount,
                "Maps to “up to N” in the reserved-capacity paragraph.",
              )}
              type="number"
              min={1}
              step={1}
              required
              value={values.tortoiseCount}
              onChange={(event) => update("tortoiseCount", event.target.value)}
            />
          </Field>
          <div>
            <p className="type-label">Adult rate</p>
            {allowRateOverride ? (
              <input
                className="field-control"
                name="perGtRate"
                type="number"
                min={1}
                step={1}
                defaultValue={rate}
              />
            ) : (
              <p className="field-control bg-cream">{formatUsd(brand.defaultPerGtRate)} per adult</p>
            )}
            <p className="mt-1 text-sm text-muted">
              {formatUsd(brand.juvenileRate)} per juvenile at delivery (all-in, not added to the
              adult rate).
            </p>
            {errors.perGtRate ? (
              <p className="mt-1 text-sm text-terracotta">{errors.perGtRate}</p>
            ) : null}
          </div>
        </div>
        <div className="rounded-[12px] border border-line bg-cream px-4 py-3 text-sm text-ink">
          Total estimated payment at the adult rate: <strong>{formatUsd(total)}</strong> (
          {Number.isFinite(count) ? count : 0} × {formatUsd(rate || 0)} per adult). A juvenile
          classified at delivery is {formatUsd(brand.juvenileRate)} total, not in addition to the
          adult rate.
        </div>
      </section>

      <section hidden={step !== "project"} className="space-y-4">
        <div>
          <h2 className="type-h2 text-forest">Project and operations</h2>
          <p className="mt-2 text-sm text-muted">
            Project name is required for tracking. County of relocation and donor company
            affiliation also appear here. Buyer’s authorized agent appears in Parties, Notices,
            and Buyer responsibilities.
          </p>
        </div>
        <Field
          name="relocationCounty"
          label="County of relocation"
          hint="Maps to “County of relocation” in the reserved-capacity paragraph."
          error={errors.relocationCounty}
        >
          <input
            {...controlProps(
              "relocationCounty",
              errors.relocationCounty,
              "Maps to “County of relocation” in the reserved-capacity paragraph.",
            )}
            value={values.relocationCounty}
            onChange={(event) => update("relocationCounty", event.target.value)}
            required
          />
        </Field>
        <FieldRow columns={2}>
          <Field
            split
            name="authorizedAgentName"
            label="Buyer’s authorized agent name"
            hint="First part of “Buyer’s authorized agent” on the agreement."
            error={errors.authorizedAgentName}
          >
            <input
              {...controlProps(
                "authorizedAgentName",
                errors.authorizedAgentName,
                "First part of “Buyer’s authorized agent” on the agreement.",
              )}
              value={values.authorizedAgentName}
              onChange={(event) => update("authorizedAgentName", event.target.value)}
              required
              autoComplete="name"
            />
          </Field>
          <Field
            split
            name="authorizedAgentCompany"
            label="Buyer’s authorized agent company"
            hint="Second part of “Buyer’s authorized agent” on the agreement."
            error={errors.authorizedAgentCompany}
          >
            <input
              {...controlProps(
                "authorizedAgentCompany",
                errors.authorizedAgentCompany,
                "Second part of “Buyer’s authorized agent” on the agreement.",
              )}
              value={values.authorizedAgentCompany}
              onChange={(event) => update("authorizedAgentCompany", event.target.value)}
              required
              autoComplete="organization"
            />
          </Field>
        </FieldRow>
        <Field
          name="donorCompanyAffiliation"
          label="Donor company affiliation"
          hint="Maps to “Donor company affiliation” in the reserved-capacity paragraph. For example Lennar, D.R. Horton."
          error={errors.donorCompanyAffiliation}
        >
          <input
            {...controlProps(
              "donorCompanyAffiliation",
              errors.donorCompanyAffiliation,
              "Maps to “Donor company affiliation” in the reserved-capacity paragraph. For example Lennar, D.R. Horton.",
            )}
            value={values.donorCompanyAffiliation}
            onChange={(event) => update("donorCompanyAffiliation", event.target.value)}
            required
            autoComplete="organization"
          />
        </Field>
        <Field
          name="donorSiteName"
          label="Project name"
          hint="Required for tracking. Maps to “Donor site / project” when the Word file has a blank."
          error={errors.donorSiteName}
        >
          <input
            {...controlProps(
              "donorSiteName",
              errors.donorSiteName,
              "Required for tracking. Maps to “Donor site / project” when the Word file has a blank.",
            )}
            value={values.donorSiteName}
            onChange={(event) => update("donorSiteName", event.target.value)}
            required
          />
        </Field>
        <Field
          name="donorSiteDescription"
          label="Project description (optional)"
          hint="Appended as “Project description” in the reserved-capacity paragraph."
          error={errors.donorSiteDescription}
        >
          <textarea
            {...controlProps(
              "donorSiteDescription",
              errors.donorSiteDescription,
              "Appended as “Project description” in the reserved-capacity paragraph.",
            )}
            className="field-control min-h-24"
            value={values.donorSiteDescription}
            onChange={(event) => update("donorSiteDescription", event.target.value)}
          />
        </Field>
      </section>

      <section hidden={step !== "witness"} className="space-y-4">
        <div>
          <h2 className="type-h2 text-forest">Buyer witness</h2>
          <p className="mt-2 text-sm text-muted">
            One Buyer witness. The name appears on the Buyer signature block; the email is used
            for DocuSign routing. The Canaan Ranch LLP witness is seller-side and is not collected
            on this form.
          </p>
        </div>
        <FieldRow columns={2}>
          <Field
            split
            name="buyerWitnessName"
            label="Buyer witness name"
            error={errors.buyerWitnessName}
          >
            <input
              {...controlProps("buyerWitnessName", errors.buyerWitnessName)}
              value={values.buyerWitnessName}
              onChange={(event) => update("buyerWitnessName", event.target.value)}
              required
              autoComplete="name"
            />
          </Field>
          <Field
            split
            name="buyerWitnessEmail"
            label="Buyer witness email"
            error={errors.buyerWitnessEmail}
          >
            <input
              {...controlProps("buyerWitnessEmail", errors.buyerWitnessEmail)}
              type="email"
              value={values.buyerWitnessEmail}
              onChange={(event) => update("buyerWitnessEmail", event.target.value)}
              required
              autoComplete="email"
            />
          </Field>
        </FieldRow>
      </section>

      <section hidden={step !== REVIEW_STEP_ID} className="space-y-5">
        <div>
          <h2 className="type-h2 text-forest">Review answers</h2>
          <p className="mt-2 text-sm text-muted">
            Confirm these details before the populated agreement is generated. You can edit any section
            and return here. Submit is available only from this review.
          </p>
        </div>
        <ReviewGroup
          title="Notice"
          onEdit={() => setStep("notice")}
          rows={[
            ["Buyer legal name", values.buyerLegalName],
            ["Attention", values.buyerAttention],
            ["Email", values.buyerEmail],
            ["Phone", values.buyerPhone],
            [
              "Notice address",
              `${values.buyerStreet}, ${values.buyerCity}, ${values.buyerState} ${values.buyerPostalCode}`,
            ],
          ]}
        />
        <ReviewGroup
          title="Capacity"
          onEdit={() => setStep("capacity")}
          rows={[
            ["Reserved capacity", formatGopherTortoiseCount(values.tortoiseCount)],
            ["Adult rate", `${formatUsd(rate)} per adult`],
            [
              "Juvenile rate",
              `${formatUsd(brand.juvenileRate)} per juvenile (all-in, not added to the adult rate)`,
            ],
            ["Deposits", "None required"],
          ]}
        />
        <ReviewGroup
          title="Project"
          onEdit={() => setStep("project")}
          rows={[
            ["County of relocation", values.relocationCounty],
            [
              "Authorized agent",
              `${values.authorizedAgentName}, ${values.authorizedAgentCompany}`,
            ],
            ["Donor company affiliation", values.donorCompanyAffiliation],
            ["Project name", values.donorSiteName || "—"],
            ["Project description", values.donorSiteDescription || "—"],
          ]}
        />
        <ReviewGroup
          title="Witness"
          onEdit={() => setStep("witness")}
          rows={[
            ["Buyer witness", `${values.buyerWitnessName} · ${values.buyerWitnessEmail}`],
            ["Canaan Ranch LLP witness", "Seller-side, already on file"],
          ]}
        />
      </section>

      <div className="intake-sticky flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {step === REVIEW_STEP_ID
            ? "Submitting drafts the Canaan Preserve / Canaan Ranch LLP relocation agreement. You will download the populated Word agreement next."
            : "Continue through Notice, Capacity, Project, and Witness, then review before generate."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {step !== "notice" ? (
            <button
              className="btn-secondary"
              type="button"
              onClick={() => goTo(previousStep(step))}
            >
              Back
            </button>
          ) : null}
          {step === REVIEW_STEP_ID ? (
            <button className="btn-primary" type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : engagementId
                  ? "Update agreement details"
                  : "Generate populated agreement"}
            </button>
          ) : (
            <button className="btn-primary" type="button" onClick={goNext}>
              Continue
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function ReviewGroup({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: Array<[string, string]>;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-[12px] border border-line bg-cream/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-xl font-medium text-forest">{title}</h3>
        <button className="btn-secondary !min-h-11 !px-3 text-sm" type="button" onClick={onEdit}>
          Edit
        </button>
      </div>
      <dl className="mt-3 grid gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
            <dt className="type-label">{label}</dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
