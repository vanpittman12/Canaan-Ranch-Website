import { describe, expect, it } from "vitest";
import {
  INTAKE_MINUTES,
  INTAKE_STEPS,
  PREPARE_ITEMS,
  REVIEW_STEP_ID,
  canSubmitIntake,
  advanceGate,
  firstStepForErrors,
  formatGopherTortoiseCount,
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

  it("gates Continue and Review on required fields, including City", () => {
    const emptyCity = { ...completeNotice, buyerCity: "" };
    const blockedContinue = advanceGate("notice", "capacity", emptyCity);
    expect(blockedContinue.ok).toBe(false);
    if (!blockedContinue.ok) {
      expect(blockedContinue.errors.buyerCity).toBe("City is required.");
      expect(blockedContinue.step).toBe("notice");
    }

    const blockedReview = advanceGate("notice", "review", emptyCity);
    expect(blockedReview.ok).toBe(false);
    if (!blockedReview.ok) {
      expect(blockedReview.errors.buyerCity).toBe("City is required.");
      expect(blockedReview.step).toBe("notice");
    }

    expect(advanceGate("notice", "capacity", completeNotice).ok).toBe(true);
    expect(advanceGate("capacity", "notice", emptyCity).ok).toBe(true);

    const skippedProject = advanceGate("notice", "review", {
      ...completeNotice,
      tortoiseCount: "2",
    });
    expect(skippedProject.ok).toBe(false);
    if (!skippedProject.ok) {
      expect(skippedProject.step).toBe("project");
      expect(skippedProject.errors.donorSiteName).toBe("This field is required.");
    }
  });
});
