/**
 * DocuSign AutoPlace anchors. Kept in a tiny module so DOCX populate does not
 * import node:crypto / live DocuSign client code on the contract download path.
 *
 * Signature-block `date` strings are Date Signed tabs (auto-fill on sign),
 * not text tabs the recipient types. Body Effective / Expiration leftovers are
 * typed as explicit calendar dates (Times New Roman 12pt) at populate-after-
 * submit — never AutoPlace and never a body Date Signed overlay.
 *
 * Tab placement: 1pt white anchors are appended to By: / Witness: paragraphs
 * on the populated copy only. Sign Here / Date Signed then use per-role
 * `anchorXOffset` / `anchorYOffset` (pixels) so the tabs sit on the signature
 * underline, not on the printed name. See DOCUSIGN_TAB_OFFSETS.
 */
export const DOCUSIGN_ANCHOR_UNITS = "pixels" as const;

export const DOCUSIGN_ANCHORS = {
  buyer_signer: { sign: "/sn_buyer/", date: "/date_buyer/" },
  seller_signer: { sign: "/sn_seller/", date: "/date_seller/" },
  buyer_witness: { sign: "/wit_buyer/", date: "/date_wit_buyer/" },
  seller_witness: { sign: "/wit_seller/", date: "/date_wit_seller/" },
} as const;

export type DocuSignRole = keyof typeof DOCUSIGN_ANCHORS;

export type TabAnchorOffset = {
  anchorXOffset: string;
  anchorYOffset: string;
};

/**
 * Pixel offsets from the trailing 1pt white AutoPlace string.
 *
 * DocuSign rules (eSign REST):
 * - `anchorUnits: "pixels"` (72 px ≈ 1 in)
 * - Positive X = right, positive Y = down
 * - Sign Here: bottom-left of the stamp at the anchor + offset
 * - Date Signed: top-left of the tab at the anchor + offset
 *
 * Van’s signature page is a two-column table (~3.1" left / ~3.0" right):
 * - Seller / buyer **By:** is the right-column signature line (underlined tab
 *   after “By:”). The printed name is on that same line, so Sign Here is
 *   pulled left onto the underline and lifted so the stamp is not on the name.
 * - Seller **Witness** has an `X` + underlined tab in the row *above* the
 *   italic “Witness Signature” label. Buyer witness has the same label with
 *   an empty cell above. Both witness stamps lift onto that underline row.
 * - Date Signed goes to the right of the same line (Word tab stops ~4278–4604
 *   twips). Seller By: already carries “Andrew V. Pittman, Jr.”, so its date
 *   X offset stays small to avoid TAB_OUT_OF_BOUNDS.
 *
 * Re-tune after a live production visual check (Account Base URI, often
 * na1.docusign.net): change only the strings below, send one envelope, and
 * nudge ~8–16 px at a time. If create fails with TAB_OUT_OF_BOUNDS, reduce
 * |X|. Do not move these into a DocuSign Template library — per-deal Word
 * populate stays the source.
 */
export const DOCUSIGN_TAB_OFFSETS: Record<
  DocuSignRole,
  { sign: TabAnchorOffset; date: TabAnchorOffset }
> = {
  buyer_signer: {
    sign: { anchorXOffset: "-64", anchorYOffset: "-24" },
    date: { anchorXOffset: "80", anchorYOffset: "-8" },
  },
  seller_signer: {
    sign: { anchorXOffset: "-96", anchorYOffset: "-24" },
    date: { anchorXOffset: "16", anchorYOffset: "-8" },
  },
  buyer_witness: {
    sign: { anchorXOffset: "-40", anchorYOffset: "-20" },
    date: { anchorXOffset: "96", anchorYOffset: "-20" },
  },
  seller_witness: {
    sign: { anchorXOffset: "-40", anchorYOffset: "-20" },
    date: { anchorXOffset: "96", anchorYOffset: "-20" },
  },
};
