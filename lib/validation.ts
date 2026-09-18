import { z } from "zod";
import { brand, getSellerWitness } from "./brand";
import type { IntakeFields } from "./types";

export const intakeSchema = z.object({
  buyerLegalName: z.string().trim().min(2, "Buyer legal name is required."),
  buyerAttention: z.string().trim().min(2, "Signatory name is required."),
  buyerTitle: z.string().trim().min(2, "Title is required."),
  buyerEmail: z.string().trim().email("Enter a valid email address."),
  buyerStreet: z.string().trim().min(3, "Street address is required."),
  buyerCity: z.string().trim().min(2, "City is required."),
  buyerState: z.string().trim().min(2, "State is required."),
  buyerPostalCode: z.string().trim().min(3, "Postal code is required."),
  buyerPhone: z.string().trim().min(7, "Phone number is required."),
  tortoiseCount: z.coerce
    .number({ error: "Enter the number of gopher tortoises." })
    .int("Use a whole number.")
    .min(1, "Reserve at least one gopher tortoise."),
  relocationCounty: z.string().trim().min(2, "County of relocation is required."),
  authorizedAgentName: z.string().trim().min(2, "Buyer’s authorized agent name is required."),
  authorizedAgentCompany: z
    .string()
    .trim()
    .min(2, "Buyer’s authorized agent company is required."),
  donorCompanyAffiliation: z
    .string()
    .trim()
    .min(2, "Donor company affiliation is required."),
  donorSiteName: z.string().trim().min(2, "Project name is required."),
  donorSiteDescription: z.string().trim().default(""),
  buyerWitnessName: z.string().trim().min(2, "Buyer witness name is required."),
  buyerWitnessEmail: z.string().trim().email("Enter a valid Buyer witness email."),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

/** Public create/update ignore posted rate and any posted Canaan witness. */
export function publicIntakeFields(input: IntakeInput): IntakeFields {
  const witness = getSellerWitness();
  return {
    ...input,
    perGtRate: brand.defaultPerGtRate,
    sellerWitnessName: witness.name,
    sellerWitnessEmail: witness.email,
  };
}

export function formDataToObject(formData: FormData) {
  const object: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      object[key] = value;
    }
  }
  return object;
}

export function flattenZodErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
