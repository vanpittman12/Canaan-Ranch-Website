/**
 * DocuSign AutoPlace anchors. Kept in a tiny module so DOCX populate does not
 * import node:crypto / live DocuSign client code on the contract download path.
 *
 * Signature-block `date` strings are Date Signed tabs (auto-fill on sign),
 * not text tabs the recipient types. `/date_effective/` is an extra Date Signed
 * tab for the Buyer on the body Effective Date leftover so the live envelope
 * shows the sign date. Expiration has no Date Signed formula (Date Signed + 1
 * year); envelope send types a provisional UTC-send-date + 1 year as Times New
 * Roman 12pt body text, then persistExecutedAgreement overwrites both dates from
 * the real Effective Date after complete.
 */
export const DOCUSIGN_ANCHORS = {
  buyer_signer: { sign: "/sn_buyer/", date: "/date_buyer/" },
  seller_signer: { sign: "/sn_seller/", date: "/date_seller/" },
  buyer_witness: { sign: "/wit_buyer/", date: "/date_wit_buyer/" },
  seller_witness: { sign: "/wit_seller/", date: "/date_wit_seller/" },
} as const;

/** Buyer Date Signed tab placed on Van’s “this  day of, 2024” leftover. */
export const EFFECTIVE_DATE_SIGNED_ANCHOR = "/date_effective/" as const;
