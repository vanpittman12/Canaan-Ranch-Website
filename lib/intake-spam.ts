/**
 * Hidden spam-trap field on the public intake form. Real visitors never see or
 * fill it (off-screen, aria-hidden, no tab stop, autocomplete off); naive bots
 * fill every input. A filled trap is rejected silently on the server.
 */
export const INTAKE_HONEYPOT_FIELD = "website_url";

export function honeypotTripped(formData: FormData) {
  const value = formData.get(INTAKE_HONEYPOT_FIELD);
  return typeof value === "string" && value.trim().length > 0;
}
