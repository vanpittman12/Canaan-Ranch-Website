"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createEngagement, updateIntake, type ActionState } from "@/app/actions/engagements";
import { brand } from "@/lib/brand";
import {
  INTAKE_STEPS,
  REVIEW_STEP_ID,
  advanceGate,
  continueControlLabel,
  firstStepForErrors,
  formatGopherTortoiseCount,
  intakeFormSubmitIntent,
  intakeRejectFeedback,
  intakeValuesFromDefaults,
  nextStep,
  previousStep,
  type IntakeWizardStep,
} from "@/lib/intake-steps";
import { agreementDatePreview, estimatedPayment, formatUsd } from "@/lib/money";
import {
  buyerNoticeAddress,
  displayValue,
  formatAuthorizedAgent,
  formatBuyerWitness,
  type IntakeFields,
} from "@/lib/types";

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
  const [clientError, setClientError] = useState("");
  const [holdSubmit, setHoldSubmit] = useState(false);
  const [rejectFocus, setRejectFocus] = useState<{
    field: string;
    step: IntakeWizardStep;
  } | null>(null);
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
    setClientError("");
    setHoldSubmit(false);
    setRejectFocus(null);
    setStep(target);
  }

  function tryGoTo(target: IntakeWizardStep) {
    const gate = advanceGate(step, target, values);
    if (!gate.ok) {
      setStepErrors(gate.errors);
      setStep(gate.step);
      return;
    }
    goTo(target);
  }

  function goNext() {
    if (step === REVIEW_STEP_ID) {
      return;
    }
    tryGoTo(nextStep(step));
  }

  // Review enables Submit in the same render. A requestAnimationFrame arm left
  // the control disabled (and the form action unset) if that frame never ran.
  const submitReady = step === REVIEW_STEP_ID;
  const bannerMessage =
    state.error || (clientError && Object.keys(stepErrors).length > 0 ? clientError : "");
  // Keep Submit mounted through the reject scroll so it does not vanish
  // in the same paint as the jump to the invalid step.
  const showSubmit = submitReady || holdSubmit;

  useEffect(() => {
    if (!rejectFocus || step !== rejectFocus.step) {
      return;
    }
    let cancelled = false;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }
        const el = document.getElementById(rejectFocus.field);
        if (el instanceof HTMLElement) {
          el.scrollIntoView({ block: "center", inline: "nearest" });
          el.focus({ preventScroll: true });
        }
        setHoldSubmit(false);
        setRejectFocus(null);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outer);
      if (inner) {
        cancelAnimationFrame(inner);
      }
    };
  }, [rejectFocus, step]);

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(event) => {
        const intent = intakeFormSubmitIntent(step, values);
        if (intent.kind === "advance") {
          event.preventDefault();
          goNext();
          return;
        }
        if (intent.kind === "reject") {
          event.preventDefault();
          const feedback = intakeRejectFeedback(intent.errors);
          setClientError(feedback.message);
          setStepErrors(intent.errors);
          setStep(feedback.step);
          if (feedback.field) {
            setHoldSubmit(true);
            setRejectFocus({ field: feedback.field, step: feedback.step });
          }
        }
      }}
      className="intake-form space-y-8"
    >
      <div className="intake-scroll space-y-8">
      {bannerMessage ? (
        <div
          id="intake-form-error"
          role="alert"
          data-intake-error-banner="true"
          className="rounded-[12px] border border-terracotta/30 bg-white px-4 py-3 text-sm text-terracotta"
        >
          {bannerMessage}
        </div>
      ) : null}

      <div className="pill-stack" role="navigation" aria-label="Intake progress">
        <ol className="pill-row">
          {INTAKE_STEPS.slice(0, 3).map((item, index) => {
            const active = step === item.id;
            const complete =
              INTAKE_STEPS.findIndex((entry) => entry.id === step) > index ||
              step === REVIEW_STEP_ID;
            return (
              <li key={item.id} className="min-w-0">
                <button
                  type="button"
                  className={`status-pill min-h-11 ${
                    active
                      ? "bg-forest text-cream"
                      : complete
                        ? "border border-sage bg-cream text-forest"
                        : "border border-line bg-white text-muted"
                  }`}
                  onClick={() => tryGoTo(item.id)}
                >
                  {index + 1} {item.label}
                </button>
              </li>
            );
          })}
        </ol>
        <ol className="pill-row pill-row-end">
          {INTAKE_STEPS.slice(3).map((item, index) => {
            const stepIndex = index + 3;
            const active = step === item.id;
            const complete =
              INTAKE_STEPS.findIndex((entry) => entry.id === step) > stepIndex ||
              step === REVIEW_STEP_ID;
            return (
              <li key={item.id} className="min-w-0">
                <button
                  type="button"
                  className={`status-pill min-h-11 ${
                    active
                      ? "bg-forest text-cream"
                      : complete
                        ? "border border-sage bg-cream text-forest"
                        : "border border-line bg-white text-muted"
                  }`}
                  onClick={() => tryGoTo(item.id)}
                >
                  {stepIndex + 1} {item.label}
                </button>
              </li>
            );
          })}
          <li className="min-w-0">
            <button
              type="button"
              className={`status-pill min-h-11 ${
                step === REVIEW_STEP_ID
                  ? "bg-forest text-cream"
                  : "border border-line bg-white text-muted"
              }`}
              onClick={() => tryGoTo(REVIEW_STEP_ID)}
            >
              Review
            </button>
          </li>
        </ol>
      </div>

      <section hidden={step !== "notice"} className="space-y-4">
        <div>
          <h2 className="type-h2 text-forest">Buyer notice block</h2>
          <p className="mt-2 text-sm text-muted">
            These fields are the Buyer notice on the agreement. Dates are set automatically when you
            submit. The Effective Date is the Florida/Eastern calendar date you submit this
            intake — it is not collected here. The Expiration Date is that same calendar day one year later.
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
            label="Buyer signatory"
            hint="The person who signs. Also used as Attention on the notice and as the DocuSign name."
            error={errors.buyerAttention}
          >
            <input
              {...controlProps(
                "buyerAttention",
                errors.buyerAttention,
                "The person who signs. Also used as Attention on the notice and as the DocuSign name.",
              )}
              value={values.buyerAttention}
              onChange={(event) => update("buyerAttention", event.target.value)}
              required
              autoComplete="name"
            />
          </Field>
          <Field
            split
            name="buyerTitle"
            label="Title"
            hint="Title under the signature."
            error={errors.buyerTitle}
          >
            <input
              {...controlProps(
                "buyerTitle",
                errors.buyerTitle,
                "Title under the signature.",
              )}
              value={values.buyerTitle}
              onChange={(event) => update("buyerTitle", event.target.value)}
              required
              autoComplete="organization-title"
            />
          </Field>
        </FieldRow>
        <Field
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
            How many gopher tortoises you are reserving. Adult versus juvenile is classified at
            delivery. {formatUsd(brand.defaultPerGtRate)} per adult.{" "}
            {formatUsd(brand.juvenileRate)} per juvenile. No deposits required.
          </p>
        </div>
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field
            name="tortoiseCount"
            label="Reserved capacity (gopher tortoise count)"
            hint="How many gopher tortoises you are reserving."
            error={errors.tortoiseCount}
          >
            <input
              {...controlProps(
                "tortoiseCount",
                errors.tortoiseCount,
                "How many gopher tortoises you are reserving.",
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
            Project name, county of relocation, donor affiliation, and the buyer’s authorized
            agent.
          </p>
        </div>
        <Field
          name="relocationCounty"
          label="County of relocation"
          hint="County the tortoises are relocating from."
          error={errors.relocationCounty}
        >
          <input
            {...controlProps(
              "relocationCounty",
              errors.relocationCounty,
              "County the tortoises are relocating from.",
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
            hint="Name of the buyer’s authorized agent."
            error={errors.authorizedAgentName}
          >
            <input
              {...controlProps(
                "authorizedAgentName",
                errors.authorizedAgentName,
                "Name of the buyer’s authorized agent.",
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
            hint="Company of the buyer’s authorized agent."
            error={errors.authorizedAgentCompany}
          >
            <input
              {...controlProps(
                "authorizedAgentCompany",
                errors.authorizedAgentCompany,
                "Company of the buyer’s authorized agent.",
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
          hint="For example, Lennar, D.R. Horton."
          error={errors.donorCompanyAffiliation}
        >
          <input
            {...controlProps(
              "donorCompanyAffiliation",
              errors.donorCompanyAffiliation,
              "For example, Lennar, D.R. Horton.",
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
          hint="Shows as your project name on the agreement."
          error={errors.donorSiteName}
        >
          <input
            {...controlProps(
              "donorSiteName",
              errors.donorSiteName,
              "Shows as your project name on the agreement.",
            )}
            value={values.donorSiteName}
            onChange={(event) => update("donorSiteName", event.target.value)}
            required
          />
        </Field>
        <Field
          name="donorSiteDescription"
          label="Project description (optional)"
          hint="Optional extra project details on the agreement."
          error={errors.donorSiteDescription}
        >
          <textarea
            {...controlProps(
              "donorSiteDescription",
              errors.donorSiteDescription,
              "Optional extra project details on the agreement.",
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
            One Buyer witness. Name and email for the Buyer signature block.
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
            Confirm these details. You can edit any section and return here. Submit is available
            only from this review.
          </p>
        </div>
        <ReviewGroup
          title="Notice"
          onEdit={() => goTo("notice")}
          rows={[
            ["Buyer legal name", values.buyerLegalName],
            ["Buyer signatory", values.buyerAttention],
            ["Title", values.buyerTitle],
            ["Email", values.buyerEmail],
            ["Phone", values.buyerPhone],
            ["Notice address", displayValue(buyerNoticeAddress(values))],
          ]}
        />
        <ReviewGroup
          title="Capacity"
          onEdit={() => goTo("capacity")}
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
          onEdit={() => goTo("project")}
          rows={[
            ["County of relocation", values.relocationCounty],
            [
              "Authorized agent",
              displayValue(formatAuthorizedAgent(values)),
            ],
            ["Donor company affiliation", displayValue(values.donorCompanyAffiliation)],
            ["Project name", displayValue(values.donorSiteName)],
            ["Project description", displayValue(values.donorSiteDescription)],
          ]}
        />
        <ReviewGroup
          title="Witness"
          onEdit={() => goTo("witness")}
          rows={[
            [
              "Buyer witness",
              displayValue(
                formatBuyerWitness(values.buyerWitnessName, values.buyerWitnessEmail),
              ),
            ],
            ["Canaan Ranch LLP witness", "Already on file"],
          ]}
        />
        <IntakeAgreementDates />
      </section>
      </div>

      <div className="intake-sticky flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={`text-sm ${bannerMessage ? "font-medium text-terracotta" : "text-muted"}`}
          data-intake-sticky-error={bannerMessage ? "true" : undefined}
        >
          {bannerMessage
            ? bannerMessage
            : step === REVIEW_STEP_ID
              ? pending
                ? engagementId
                  ? "Saving…"
                  : "Creating your agreement…"
                : "Submit to create your agreement. You can download the Word file next."
              : "Continue or click any step to browse. Required fields are checked when you submit on Review."}
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
          {/* Continue stays type="button" so a Witness click cannot finish as submit. */}
          <button
            key="intake-continue"
            className={`btn-primary ${showSubmit ? "!hidden" : ""}`}
            type="button"
            data-intake-continue="true"
            tabIndex={showSubmit ? -1 : undefined}
            onClick={goNext}
          >
            {continueControlLabel(step)}
          </button>
          <button
            key="intake-submit"
            className={`btn-primary ${showSubmit ? "" : "!hidden"}`}
            type="submit"
            data-intake-submit="true"
            tabIndex={showSubmit ? undefined : -1}
            disabled={!submitReady || pending}
          >
            {pending
              ? engagementId
                ? "Saving…"
                : "Creating your agreement…"
              : engagementId
                ? "Update & download agreement"
                : "Submit & download agreement"}
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * Client-mounted so prerendered `/intake` HTML cannot bake a calendar day that
 * hydrates as a different Florida/Eastern date (React #418).
 * Submit still stamps Effective/Expiration from `businessDateOnly(now)`.
 */
function IntakeAgreementDates() {
  const [preview, setPreview] = useState<ReturnType<typeof agreementDatePreview> | null>(
    null,
  );

  useEffect(() => {
    setPreview(agreementDatePreview());
  }, []);

  return (
    <div className="rounded-[12px] border border-line bg-cream/60 p-4">
      <h3 className="font-serif text-xl font-medium text-forest">Agreement dates</h3>
      <p className="mt-2 text-sm text-muted">
        Preview of the dates that will be typed into the Word agreement and DocuSign
        envelope when you submit. These are not editable fields. Effective Date is
        today’s Florida/Eastern calendar date; Expiration Date is that same calendar
        day one year later.
      </p>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
          <dt className="type-label">Effective Date</dt>
          <dd className="text-ink">{preview?.effectiveLong ?? "—"}</dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
          <dt className="type-label">Expiration Date</dt>
          <dd className="text-ink">{preview?.expirationLong ?? "—"}</dd>
        </div>
      </dl>
    </div>
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
            <dd className="text-ink">{displayValue(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
