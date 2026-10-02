import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  INTAKE_FIELD_ERROR_BANNER,
  INTAKE_MINUTES,
  INTAKE_STEPS,
  PREPARE_ITEMS,
  REVIEW_STEP_ID,
  canSubmitIntake,
  advanceGate,
  continueControlLabel,
  firstFieldForErrors,
  firstStepForErrors,
  formatGopherTortoiseCount,
  intakeFormSubmitIntent,
  intakeRejectFeedback,
  intakeValuesFromDefaults,
  nextStep,
  previousStep,
  validateStepFields,
  validateThrough,
} from "./intake-steps";
import { intakeSchema } from "./validation";

const completeNotice = {
  buyerLegalName: "Cypress Ridge Holdings LLC",
  buyerAttention: "Avery Cole",
  buyerTitle: "President",
  buyerEmail: "avery@cypressridge.example",
  buyerStreet: "200 Bay Street",
  buyerCity: "Tampa",
  buyerState: "FL",
  buyerPostalCode: "33602",
  buyerPhone: "813-555-0144",
  tortoiseCount: "1",
};

describe("intake wizard", () => {
  it("uses the four locked steps and requires review before submit", () => {
    expect(INTAKE_STEPS.map((step) => step.label)).toEqual([
      "Notice",
      "Capacity",
      "Project",
      "Witness",
    ]);
    expect(canSubmitIntake("witness")).toBe(false);
    expect(canSubmitIntake(REVIEW_STEP_ID)).toBe(true);
    expect(nextStep("witness")).toBe(REVIEW_STEP_ID);
    expect(previousStep(REVIEW_STEP_ID)).toBe("witness");
  });

  it("pluralizes reserved gopher tortoise capacity", () => {
    expect(formatGopherTortoiseCount(1)).toBe("1 gopher tortoise");
    expect(formatGopherTortoiseCount("1")).toBe("1 gopher tortoise");
    expect(formatGopherTortoiseCount(8)).toBe("8 gopher tortoises");
    expect(formatGopherTortoiseCount("")).toBe("— gopher tortoises");
    expect(formatGopherTortoiseCount(1)).not.toBe("1 gopher tortoises");
  });

  it("lists intake items including required project name and no invented schema fields", () => {
    expect(INTAKE_MINUTES).toBe(3);
    expect(PREPARE_ITEMS).toContain("Project name");
    expect(INTAKE_STEPS.find((step) => step.id === "project")?.fields).toContain(
      "donorSiteName",
    );
    expect(INTAKE_STEPS.find((step) => step.id === "notice")?.fields).toContain(
      "buyerTitle",
    );
    expect(PREPARE_ITEMS.join(" ")).toMatch(/title/i);
    const schemaKeys = Object.keys(intakeSchema.shape);
    for (const step of INTAKE_STEPS) {
      for (const field of step.fields) {
        expect(schemaKeys).toContain(field);
      }
    }
  });

  it("validates required fields on submit, including project name", () => {
    const errors = validateStepFields("notice", {
      buyerLegalName: "Cypress Ridge Holdings LLC",
      buyerAttention: "Avery Cole",
      buyerEmail: "not-an-email",
      buyerStreet: "200 Bay Street",
      buyerCity: "Tampa",
      buyerState: "FL",
      buyerPostalCode: "33602",
      buyerPhone: "",
    });
    expect(errors.buyerEmail).toBe("Enter a valid email address.");
    expect(errors.buyerTitle).toBe("This field is required.");
    expect(errors.buyerPhone).toBe("This field is required.");
    expect(firstStepForErrors(errors)).toBe("notice");
    expect(validateThrough("review", { tortoiseCount: "2" }).buyerLegalName).toBe(
      "This field is required.",
    );
    expect(validateThrough("review", { tortoiseCount: "2" }).donorSiteName).toBe(
      "This field is required.",
    );
    expect(validateStepFields("notice", { ...completeNotice, buyerCity: "" }).buyerCity).toBe(
      "City is required.",
    );
  });

  it("lets Continue and step pills browse empty steps; submit still validates", () => {
    const emptyCity = { ...completeNotice, buyerCity: "" };
    expect(advanceGate("notice", "capacity", emptyCity).ok).toBe(true);
    expect(advanceGate("notice", "review", emptyCity).ok).toBe(true);
    expect(advanceGate("notice", "capacity", completeNotice).ok).toBe(true);
    expect(advanceGate("capacity", "notice", emptyCity).ok).toBe(true);

    const skippedProject = advanceGate("notice", "review", {
      ...completeNotice,
      tortoiseCount: "2",
    });
    expect(skippedProject.ok).toBe(true);

    const submitErrors = validateThrough("review", {
      ...completeNotice,
      buyerCity: "",
      tortoiseCount: "2",
    });
    expect(submitErrors.buyerCity).toBe("City is required.");
    expect(submitErrors.donorSiteName).toBe("This field is required.");
    expect(firstStepForErrors(submitErrors)).toBe("notice");
  });

  it("reaches Review from empty Witness without field errors; Review submit still jumps to Notice", () => {
    const empty = intakeValuesFromDefaults();
    expect(continueControlLabel("project")).toBe("Continue");
    expect(continueControlLabel("witness")).toBe("Review");
    expect(nextStep("witness")).toBe(REVIEW_STEP_ID);
    expect(advanceGate("witness", nextStep("witness"), empty)).toEqual({ ok: true });

    const fromWitness = intakeFormSubmitIntent("witness", empty);
    expect(fromWitness).toEqual({ kind: "advance", next: REVIEW_STEP_ID });
    expect("errors" in fromWitness).toBe(false);

    const fromReview = intakeFormSubmitIntent("review", empty);
    expect(fromReview.kind).toBe("reject");
    if (fromReview.kind === "reject") {
      expect(fromReview.errors.buyerLegalName).toBe("This field is required.");
      expect(fromReview.step).toBe("notice");
    }
  });

  it("points a Review reject at the banner copy and the first invalid field", () => {
    const complete = {
      ...intakeValuesFromDefaults(),
      buyerLegalName: "Cypress Ridge Holdings LLC",
      buyerAttention: "Avery Cole",
      buyerTitle: "President",
      buyerEmail: "avery@cypressridge.example",
      buyerStreet: "200 Bay Street",
      buyerCity: "Tampa",
      buyerState: "FL",
      buyerPostalCode: "33602",
      buyerPhone: "813-555-0144",
      tortoiseCount: "2",
      relocationCounty: "Pasco",
      authorizedAgentName: "Riley Nguyen",
      authorizedAgentCompany: "Nguyen Permitting",
      donorCompanyAffiliation: "Lennar",
      donorSiteName: "Cypress Ridge",
      buyerWitnessName: "Jordan Blake",
      buyerWitnessEmail: "jordan@cypressridge.example",
    };
    expect(intakeFormSubmitIntent("review", complete)).toEqual({ kind: "submit" });

    const missingName = intakeFormSubmitIntent("review", {
      ...complete,
      buyerLegalName: " ",
    });
    expect(missingName.kind).toBe("reject");
    if (missingName.kind === "reject") {
      expect(intakeRejectFeedback(missingName.errors)).toEqual({
        message: INTAKE_FIELD_ERROR_BANNER,
        step: "notice",
        field: "buyerLegalName",
      });
      expect(firstFieldForErrors(missingName.errors)).toBe("buyerLegalName");
    }

    const missingProject = intakeFormSubmitIntent("review", {
      ...complete,
      donorSiteName: "",
    });
    expect(missingProject.kind).toBe("reject");
    if (missingProject.kind === "reject") {
      expect(intakeRejectFeedback(missingProject.errors)).toEqual({
        message: "Please correct the highlighted fields.",
        step: "project",
        field: "donorSiteName",
      });
    }

    const missingWitness = intakeFormSubmitIntent("review", {
      ...complete,
      buyerWitnessEmail: "not-an-email",
    });
    expect(missingWitness.kind).toBe("reject");
    if (missingWitness.kind === "reject") {
      expect(intakeRejectFeedback(missingWitness.errors).step).toBe("witness");
      expect(intakeRejectFeedback(missingWitness.errors).field).toBe("buyerWitnessEmail");
    }

    const actions = readFileSync(
      path.join(process.cwd(), "app/actions/engagements.ts"),
      "utf8",
    );
    expect(actions).toContain(INTAKE_FIELD_ERROR_BANNER);

    const form = readFileSync(
      path.join(process.cwd(), "components/intake-form.tsx"),
      "utf8",
    );
    expect(form).toContain('type="button"');
    expect(form).toContain('data-intake-continue="true"');
    expect(form).toMatch(
      /intent\.kind === "reject"[\s\S]*preventDefault\(\)[\s\S]*intakeRejectFeedback\(intent\.errors\)[\s\S]*setClientError\(feedback\.message\)[\s\S]*setStep\(feedback\.step\)[\s\S]*setRejectFocus/,
    );
    expect(form).toContain('data-intake-error-banner="true"');
    expect(form).toContain("data-intake-sticky-error");
    expect(form).toContain('role="alert"');
    expect(form).toContain("scrollIntoView");
    expect(form).toContain(".focus(");
    expect(form).toContain("holdSubmit");
    expect(form).toContain("showSubmit");
    expect(form).not.toMatch(/data-intake-continue[\s\S]{0,80}type="submit"/);
  });
});
