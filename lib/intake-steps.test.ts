import { describe, expect, it } from "vitest";
import {
  INTAKE_MINUTES,
  INTAKE_STEPS,
  PREPARE_ITEMS,
  REVIEW_STEP_ID,
  canSubmitIntake,
  firstStepForErrors,
  formatGopherTortoiseCount,
  nextStep,
  previousStep,
  validateStepFields,
  validateThrough,
} from "./intake-steps";
import { intakeSchema } from "./validation";

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
    expect(errors.buyerPhone).toBe("This field is required.");
    expect(firstStepForErrors(errors)).toBe("notice");
    expect(validateThrough("review", { tortoiseCount: "2" }).buyerLegalName).toBe(
      "This field is required.",
    );
    expect(validateThrough("review", { tortoiseCount: "2" }).donorSiteName).toBe(
      "This field is required.",
    );
  });
});
