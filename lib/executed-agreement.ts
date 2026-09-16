import { generatePopulatedAgreement } from "./agreement-populate";
import { putUpload } from "./store";
import type { Engagement } from "./types";

export function executedAgreementStoredName(engagementId: string) {
  return `${engagementId}-executed-agreement.docx`;
}

/**
 * After Effective Date is known, regenerate the populated Word with exact
 * calendar Effective + Expiration stamps (Times New Roman 12pt, Effective + 1
 * year). Envelope send may already have a provisional Expiration (UTC send date
 * + 1 year); this overwrite is the executed body copy. DocuSign cannot
 * formula-fill Date Signed + 1 year on Van’s “, 202 ,” leftover.
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
