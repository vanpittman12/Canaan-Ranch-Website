/**
 * DocuSign AutoPlace anchors. Kept in a tiny module so DOCX populate does not
 * import node:crypto / live DocuSign client code on the contract download path.
 *
 * Signature-block `date` strings are Date Signed tabs (auto-fill on sign),
 * not text tabs the recipient types. Body Effective / Expiration leftovers are
 * typed as explicit calendar dates (Times New Roman 12pt) at populate-after-
 * submit — never AutoPlace and never a body Date Signed overlay.
 */
export const DOCUSIGN_ANCHORS = {
  buyer_signer: { sign: "/sn_buyer/", date: "/date_buyer/" },
  seller_signer: { sign: "/sn_seller/", date: "/date_seller/" },
  buyer_witness: { sign: "/wit_buyer/", date: "/date_wit_buyer/" },
  seller_witness: { sign: "/wit_seller/", date: "/date_wit_seller/" },
} as const;
