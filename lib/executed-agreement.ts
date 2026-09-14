import { generatePopulatedAgreement } from "./agreement-populate";
import { putUpload } from "./store";
import type { Engagement } from "./types";

export function executedAgreementStoredName(engagementId: string) {
  return `${engagementId}-executed-agreement.docx`;
}

/**
 * After Effective Date is known, store a populated Word copy with
 * Effective + Expiration leftovers stamped. DocuSign cannot formula-fill
 * Expiration (Date Signed + 1 year) on Van’s “, 202 ,” leftover, so this
 * post-complete stamp is the executed body copy.
 */
export async function persistExecutedAgreement(engagement: Engagement) {
  if (!engagement.effectiveDate) {
    return;
  }
  try {
    const populated = await generatePopulatedAgreement(engagement);
    await putUpload(executedAgreementStoredName(engagement.id), populated.bytes);
  } catch (error) {
    // Effective Date is already on the engagement; contract download regenerates.
    console.error("Unable to store the date-stamped executed agreement.", error);
  }
}
