import { generatePopulatedAgreement } from "./agreement-populate";
import { putUpload } from "./store";
import type { Engagement } from "./types";

export function executedAgreementStoredName(engagementId: string) {
  return `${engagementId}-executed-agreement.docx`;
}

/**
 * After Effective Date is known (intake submit), store a populated Word copy
 * with the same explicit Effective + Expiration calendar stamps already typed
 * into the outgoing DocuSign envelope. Completion must not change those dates.
 * Contract download regenerates the same stamps from the blank template.
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
