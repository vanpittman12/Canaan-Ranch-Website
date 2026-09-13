import { z } from "zod";
import { brand } from "./brand";

export const intakeSchema = z.object({
  effectiveDate: z.string().trim().min(1, "Effective date is required."),
  buyerLegalName: z.string().trim().min(2, "Buyer legal name is required."),
  buyerAttention: z.string().trim().min(2, "Attention name is required."),
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
  perGtRate: z.coerce
    .number({ error: "Enter a per-tortoise rate." })
    .min(1, "Rate must be greater than zero.")
    .default(brand.defaultPerGtRate),
  donorSiteName: z.string().trim().default(""),
  donorSiteDescription: z.string().trim().default(""),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

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
