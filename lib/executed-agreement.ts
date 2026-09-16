import { generatePopulatedAgreement } from "./agreement-populate";
import { putUpload } from "./store";
import type { Engagement } from "./types";

export function executedAgreementStoredName(engagementId: string) {
  return `${engagementId}-executed-agreement.docx`;
}

/**
 * After Effective Date is known, regenerate the populated Word with calendar
 * Effective + Expiration stamps (Times New Roman 12pt). The outgoing envelope
 * already has typed pending phrases; this post-complete file is the executed
 * body copy with addOneYear dates. Contract download regenerates the same stamps.
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
