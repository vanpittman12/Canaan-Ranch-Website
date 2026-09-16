/**
 * DocuSign AutoPlace anchors. Kept in a tiny module so DOCX populate does not
 * import node:crypto / live DocuSign client code on the contract download path.
 *
 * Signature-block `date` strings are Date Signed tabs (auto-fill on sign),
 * not text tabs the recipient types. `/date_effective/` is an extra Date Signed
 * tab for the Buyer, inserted immediately after Van’s Effective Date leftover
 * so the live envelope shows the sign date on that leftover (Times New Roman
 * 12pt). Expiration is stamped after complete (no DocuSign
 * “Date Signed + 1 year” formula for Word leftovers).
 */
export const DOCUSIGN_ANCHORS = {
  buyer_signer: { sign: "/sn_buyer/", date: "/date_buyer/" },
  seller_signer: { sign: "/sn_seller/", date: "/date_seller/" },
  buyer_witness: { sign: "/wit_buyer/", date: "/date_wit_buyer/" },
  seller_witness: { sign: "/wit_seller/", date: "/date_wit_seller/" },
} as const;

/** Buyer Date Signed tab placed on Van’s “this  day of, 2024” leftover. */
export const EFFECTIVE_DATE_SIGNED_ANCHOR = "/date_effective/" as const;
