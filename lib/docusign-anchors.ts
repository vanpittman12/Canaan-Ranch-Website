/**
 * DocuSign AutoPlace anchors. Kept in a tiny module so DOCX populate does not
 * import node:crypto / live DocuSign client code on the contract download path.
 *
 * Signature-block `date` strings are Date Signed tabs (auto-fill on sign),
 * not text tabs the recipient types. Body Effective / Expiration leftovers are
 * typed into the DOCX (Times New Roman 12pt) at populate — never AutoPlace.
 * DocuSign has no “Date Signed + 1 year” formula for Van’s “, 202 ,” leftover.
 */
export const DOCUSIGN_ANCHORS = {
  buyer_signer: { sign: "/sn_buyer/", date: "/date_buyer/" },
  seller_signer: { sign: "/sn_seller/", date: "/date_seller/" },
  buyer_witness: { sign: "/wit_buyer/", date: "/date_wit_buyer/" },
  seller_witness: { sign: "/wit_seller/", date: "/date_wit_seller/" },
} as const;
