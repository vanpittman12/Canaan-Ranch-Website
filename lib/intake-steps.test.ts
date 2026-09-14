import { describe, expect, it } from "vitest";
import {
  INTAKE_STEPS,
  PREPARE_ITEMS,
  REVIEW_STEP_ID,
  canSubmitIntake,
  firstStepForErrors,
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

  it("lists six existing intake items and no invented schema fields", () => {
    expect(PREPARE_ITEMS).toHaveLength(6);
    const schemaKeys = Object.keys(intakeSchema.shape);
    for (const step of INTAKE_STEPS) {
      for (const field of step.fields) {
        expect(schemaKeys).toContain(field);
      }
    }
  });

  it("blocks advance when a required notice field is empty", () => {
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
  });
});
