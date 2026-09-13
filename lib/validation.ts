import { z } from "zod";
import { BUDGET_RANGES, DURATIONS, SERVICE_TYPES } from "./types";

const serviceTypeValues = SERVICE_TYPES.map((item) => item.value) as [
  (typeof SERVICE_TYPES)[number]["value"],
  ...(typeof SERVICE_TYPES)[number]["value"][],
];

export const intakeSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required."),
  website: z
    .string()
    .trim()
    .url("Enter a valid URL, including https://.")
    .or(z.literal(""))
    .default(""),
  contactName: z.string().trim().min(2, "Contact name is required."),
  contactTitle: z.string().trim().min(2, "Title is required."),
  contactEmail: z.string().trim().email("Enter a valid email address."),
  contactPhone: z.string().trim().min(7, "Phone number is required."),
  billingStreet: z.string().trim().min(3, "Street address is required."),
  billingCity: z.string().trim().min(2, "City is required."),
  billingState: z.string().trim().min(2, "State is required."),
  billingPostalCode: z.string().trim().min(3, "Postal code is required."),
  projectTitle: z.string().trim().min(3, "Project title is required."),
  serviceType: z.enum(serviceTypeValues, {
    message: "Select a service type.",
  }),
  scopeSummary: z
    .string()
    .trim()
    .min(20, "Please describe the scope in at least 20 characters."),
  startDate: z.string().trim().min(1, "Start date is required."),
  duration: z.enum(DURATIONS, { message: "Select an estimated duration." }),
  budgetRange: z.enum(BUDGET_RANGES, { message: "Select a budget range." }),
  serviceLocation: z.string().trim().min(2, "Service location is required."),
  notes: z.string().trim().default(""),
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
