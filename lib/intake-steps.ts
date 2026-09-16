import type { IntakeFields } from "./types";

export const INTAKE_STEP_IDS = ["notice", "capacity", "project", "witness"] as const;
export type IntakeStepId = (typeof INTAKE_STEP_IDS)[number];
export const REVIEW_STEP_ID = "review" as const;
export type IntakeWizardStep = IntakeStepId | typeof REVIEW_STEP_ID;

export const INTAKE_MINUTES = 3;

export function gopherTortoiseNoun(count: number) {
  return count === 1 ? "gopher tortoise" : "gopher tortoises";
}

export function formatGopherTortoiseCount(count: number | string) {
  const raw = typeof count === "string" ? count.trim() : String(count);
  const n = Number(raw);
  if (!raw || !Number.isFinite(n)) {
    return "— gopher tortoises";
  }
  return `${n} ${gopherTortoiseNoun(n)}`;
}

export const PREPARE_ITEMS = [
  "Buyer legal name",
  "Buyer notice: signatory, title, street, city, state, postal code, phone, and email",
  "Reserved tortoise count",
  "Project name",
  "County of relocation",
  "Buyer’s authorized agent and donor company affiliation",
  "Buyer witness name and email",
] as const;

export const INTAKE_STEPS = [
  {
    id: "notice",
    label: "Notice",
    title: "Buyer notice block",
    fields: [
      "buyerLegalName",
      "buyerAttention",
      "buyerTitle",
      "buyerEmail",
      "buyerStreet",
      "buyerCity",
      "buyerState",
      "buyerPostalCode",
      "buyerPhone",
    ],
  },
  {
    id: "capacity",
    label: "Capacity",
    title: "Reserved capacity",
    fields: ["tortoiseCount"],
  },
  {
    id: "project",
    label: "Project",
    title: "Project and operations",
    fields: [
      "relocationCounty",
      "authorizedAgentName",
      "authorizedAgentCompany",
      "donorCompanyAffiliation",
      "donorSiteName",
    ],
  },
  {
    id: "witness",
    label: "Witness",
    title: "Buyer witness",
    fields: ["buyerWitnessName", "buyerWitnessEmail"],
  },
] as const;

const EMAIL_FIELDS = new Set(["buyerEmail", "buyerWitnessEmail"]);

export function canSubmitIntake(step: IntakeWizardStep) {
  return step === REVIEW_STEP_ID;
}

export function stepIndex(step: IntakeWizardStep) {
  if (step === REVIEW_STEP_ID) {
    return INTAKE_STEPS.length;
  }
  return INTAKE_STEP_IDS.indexOf(step);
}

export function nextStep(step: IntakeWizardStep): IntakeWizardStep {
  if (step === REVIEW_STEP_ID) {
    return REVIEW_STEP_ID;
  }
  const index = INTAKE_STEP_IDS.indexOf(step);
  return index === INTAKE_STEP_IDS.length - 1
    ? REVIEW_STEP_ID
    : INTAKE_STEP_IDS[index + 1];
}

export function previousStep(step: IntakeWizardStep): IntakeWizardStep {
  if (step === REVIEW_STEP_ID) {
    return INTAKE_STEP_IDS[INTAKE_STEP_IDS.length - 1];
  }
  const index = INTAKE_STEP_IDS.indexOf(step);
  return index <= 0 ? step : INTAKE_STEP_IDS[index - 1];
}

export function firstStepForErrors(
  fieldErrors: Record<string, string>,
): IntakeWizardStep {
  for (const step of INTAKE_STEPS) {
    if (step.fields.some((field) => fieldErrors[field])) {
      return step.id;
    }
  }
  return REVIEW_STEP_ID;
}

export function isEmailValue(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateThrough(
  stepId: IntakeWizardStep,
  values: Record<string, string>,
): Record<string, string> {
  const last =
    stepId === REVIEW_STEP_ID ? INTAKE_STEPS.length - 1 : stepIndex(stepId);
  const errors: Record<string, string> = {};
  for (let index = 0; index <= last; index += 1) {
    Object.assign(errors, validateStepFields(INTAKE_STEPS[index].id, values));
  }
  return errors;
}

/**
 * Gated wizard: Continue and step pills share one rule.
 * Backward/same-step moves are free. Forward moves (including Review)
 * must pass required fields through the last skipped step — City included.
 */
export function advanceGate(
  from: IntakeWizardStep,
  to: IntakeWizardStep,
  values: Record<string, string>,
):
  | { ok: true }
  | { ok: false; errors: Record<string, string>; step: IntakeWizardStep } {
  if (stepIndex(to) <= stepIndex(from)) {
    return { ok: true };
  }
  const through: IntakeWizardStep =
    to === REVIEW_STEP_ID ? REVIEW_STEP_ID : previousStep(to);
  const errors = validateThrough(through, values);
  if (Object.keys(errors).length === 0) {
    return { ok: true };
  }
  return { ok: false, errors, step: firstStepForErrors(errors) };
}

export function validateStepFields(
  stepId: IntakeStepId,
  values: Record<string, string>,
): Record<string, string> {
  const step = INTAKE_STEPS.find((item) => item.id === stepId);
  if (!step) {
    return {};
  }

  const errors: Record<string, string> = {};
  for (const field of step.fields) {
    const value = (values[field] ?? "").trim();
    if (field === "tortoiseCount") {
      const count = Number(value);
      if (!Number.isInteger(count) || count < 1) {
        errors[field] = "Reserve at least one gopher tortoise.";
      }
      continue;
    }
    if (!value) {
      errors[field] = field === "buyerCity" ? "City is required." : "This field is required.";
      continue;
    }
    if (EMAIL_FIELDS.has(field) && !isEmailValue(value)) {
      errors[field] = "Enter a valid email address.";
    }
  }
  return errors;
}

export function intakeValuesFromDefaults(
  defaults?: IntakeFields,
): Record<string, string> {
  return {
    buyerLegalName: defaults?.buyerLegalName ?? "",
    buyerAttention: defaults?.buyerAttention ?? "",
    buyerTitle: defaults?.buyerTitle ?? "",
    buyerEmail: defaults?.buyerEmail ?? "",
    buyerStreet: defaults?.buyerStreet ?? "",
    buyerCity: defaults?.buyerCity ?? "",
    buyerState: defaults?.buyerState ?? "FL",
    buyerPostalCode: defaults?.buyerPostalCode ?? "",
    buyerPhone: defaults?.buyerPhone ?? "",
    tortoiseCount: String(defaults?.tortoiseCount ?? 1),
    relocationCounty: defaults?.relocationCounty ?? "",
    authorizedAgentName: defaults?.authorizedAgentName ?? "",
    authorizedAgentCompany: defaults?.authorizedAgentCompany ?? "",
    donorCompanyAffiliation: defaults?.donorCompanyAffiliation ?? "",
    donorSiteName: defaults?.donorSiteName ?? "",
    donorSiteDescription: defaults?.donorSiteDescription ?? "",
    buyerWitnessName: defaults?.buyerWitnessName ?? "",
    buyerWitnessEmail: defaults?.buyerWitnessEmail ?? "",
  };
}
