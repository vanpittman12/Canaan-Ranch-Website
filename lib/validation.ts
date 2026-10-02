import { z } from "zod";
import { brand, getSellerWitness } from "./brand";
import type { IntakeFields } from "./types";

export const intakeSchema = z.object({
  buyerLegalName: z
    .string()
    .trim()
    .min(2, "Buyer legal name is required.")
    .max(200, "Keep the Buyer legal name under 200 characters."),
  buyerAttention: z
    .string()
    .trim()
    .min(2, "Signatory name is required.")
    .max(200, "Keep the signatory name under 200 characters."),
  buyerTitle: z
    .string()
    .trim()
    .min(2, "Title is required.")
    .max(200, "Keep the title under 200 characters."),
  buyerEmail: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Keep the email under 254 characters."),
  buyerStreet: z
    .string()
    .trim()
    .min(3, "Street address is required.")
    .max(300, "Keep the street address under 300 characters."),
  buyerCity: z
    .string()
    .trim()
    .min(2, "City is required.")
    .max(200, "Keep the city under 200 characters."),
  buyerState: z
    .string()
    .trim()
    .min(2, "State is required.")
    .max(100, "Keep the state under 100 characters."),
  buyerPostalCode: z
    .string()
    .trim()
    .min(3, "Postal code is required.")
    .max(20, "Keep the postal code under 20 characters."),
  buyerPhone: z
    .string()
    .trim()
    .min(7, "Phone number is required.")
    .max(50, "Keep the phone number under 50 characters."),
  tortoiseCount: z.coerce
    .number({ error: "Enter the number of gopher tortoises." })
    .int("Use a whole number.")
    .min(1, "Reserve at least one gopher tortoise."),
  relocationCounty: z
    .string()
    .trim()
    .min(2, "County of relocation is required.")
    .max(200, "Keep the county under 200 characters."),
  authorizedAgentName: z
    .string()
    .trim()
    .min(2, "Buyer’s authorized agent name is required.")
    .max(200, "Keep the authorized agent name under 200 characters."),
  authorizedAgentCompany: z
    .string()
    .trim()
    .min(2, "Buyer’s authorized agent company is required.")
    .max(200, "Keep the authorized agent company under 200 characters."),
  donorCompanyAffiliation: z
    .string()
    .trim()
    .min(2, "Donor company affiliation is required.")
    .max(200, "Keep the donor company affiliation under 200 characters."),
  donorSiteName: z
    .string()
    .trim()
    .min(2, "Project name is required.")
    .max(200, "Keep the project name under 200 characters."),
  donorSiteDescription: z
    .string()
    .trim()
    .max(5000, "Keep the project description under 5000 characters.")
    .default(""),
  buyerWitnessName: z
    .string()
    .trim()
    .min(2, "Buyer witness name is required.")
    .max(200, "Keep the Buyer witness name under 200 characters."),
  buyerWitnessEmail: z
    .string()
    .trim()
    .email("Enter a valid Buyer witness email.")
    .max(254, "Keep the Buyer witness email under 254 characters."),
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
