import { generatePopulatedAgreement } from "./agreement-populate";
import { putUpload } from "./store";
import type { Engagement } from "./types";

export function executedAgreementStoredName(engagementId: string) {
  return `${engagementId}-executed-agreement.docx`;
}

/**
 * After Effective Date is known, store a populated Word copy with
 * Effective + Expiration leftovers stamped (Times New Roman 12pt body runs,
 * including Van’s leading expiration tab blank). DocuSign cannot formula-fill
 * Expiration (Date Signed + 1 year) on Van’s “, 202 ,” leftover, so this
 * post-complete stamp is the executed body copy. Contract download regenerates
 * the same stamps from the blank template.
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
