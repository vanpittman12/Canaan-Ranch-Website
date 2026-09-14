#!/usr/bin/env python3
"""
Best-effort reconstruction of Van's Post Oak Preserve Multi-Project
Gopher Tortoise Relocation Agreement (original ~14-page Word file).

Pages 1, 2, and 4 were transcribed from a direct PDF conversion of the
source DOCX (sha256 5711a4abeb62609bbcc63b3df578a60fb3bb2a2ef8838c3836be363903692412,
73031 bytes). Page 3 and pages 5–14 were reconstructed in the same voice
from the supplied source wording and the surrounding paragraphs. This
script cannot byte-match that DOCX.

Usage:
  python3 scripts/build-van-original-agreement.py
"""

from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_COLOR_INDEX, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "agreements"
PUBLIC = ROOT / "public" / "agreements"

BLANK = "____________________"
YELLOW = WD_COLOR_INDEX.YELLOW


def set_run_font(run, *, bold=False, underline=False, highlight=False, size=12, italic=False):
    run.font.name = "Times New Roman"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    run.font.size = Pt(size)
    run.bold = bold
    run.underline = underline
    run.italic = italic
    if highlight:
        run.font.highlight_color = YELLOW


def add_page_field(paragraph, instruction: str):
    run = paragraph.add_run()
    set_run_font(run, size=10)
    r = run._r
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = f" {instruction} "
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "1" if instruction == "PAGE" else "14"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    r.append(begin)
    r.append(instr)
    r.append(separate)
    r.append(text)
    r.append(end)


def configure_section(section):
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(0.85)
    section.header_distance = Inches(0.5)
    section.footer_distance = Inches(0.4)

    header = section.header
    header.is_linked_to_previous = False
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = hp.add_run("Post Oak Preserve")
    set_run_font(run, size=12)
    hp.paragraph_format.space_after = Pt(0)

    footer = section.footer
    footer.is_linked_to_previous = False
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r1 = fp.add_run("Page ")
    set_run_font(r1, size=10)
    add_page_field(fp, "PAGE")
    r2 = fp.add_run(" of ")
    set_run_font(r2, size=10)
    add_page_field(fp, "NUMPAGES")


def style_paragraph(p, *, align="justify", space_after=8, space_before=0, first_line=0):
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    if first_line:
        p.paragraph_format.first_line_indent = Inches(first_line)
    if align == "justify":
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    elif align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "right":
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    else:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT


def add_text(p, parts):
    """parts: str or (text, dict of flags)."""
    for part in parts:
        if isinstance(part, str):
            run = p.add_run(part)
            set_run_font(run)
        else:
            text, flags = part
            run = p.add_run(text)
            set_run_font(run, **flags)


def para(doc, parts, **kwargs):
    p = doc.add_paragraph()
    style_paragraph(p, **kwargs)
    add_text(p, parts)
    return p


def heading_center(doc, text, *, bold=True, size=12, space_after=6, space_before=0):
    p = doc.add_paragraph()
    style_paragraph(p, align="center", space_after=space_after, space_before=space_before)
    run = p.add_run(text)
    set_run_font(run, bold=bold, size=size)
    return p


def page_break(doc):
    p = doc.add_paragraph()
    style_paragraph(p, space_after=0)
    run = p.add_run()
    run.add_break(WD_BREAK.PAGE)


def field(original: str, blank: bool, *, highlight_original=False):
    """Intake-mapped value: filled (optional yellow) in the source reconstruction,
    underscores + yellow in the site template."""
    if blank:
        return (BLANK, {"highlight": True})
    return (original, {"highlight": highlight_original})


def build(blank: bool) -> Document:
    doc = Document()
    configure_section(doc.sections[0])

    styles = doc.styles["Normal"]
    styles.font.name = "Times New Roman"
    styles.font.size = Pt(12)
    styles._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")

    heading_center(doc, "GOPHER TORTOISE RELOCATION AGREEMENT", size=14, space_before=6, space_after=2)
    heading_center(doc, "Multi-Project Relocation Agreement", bold=False, size=12, space_after=14)

    buyer_name = field("Bio-Tech Consulting, Inc.", blank, highlight_original=True)
    count_words = field("seventeen (17)", blank)
    total_words = field(
        "one hundred and twenty thousand dollars ($102,000.00)",
        blank,
        highlight_original=True,
    )
    buyer_attn = field("Bob Margeson", blank)
    buyer_street = field("3025 East South St", blank)
    buyer_city = field("Orlando", blank)
    buyer_state = field("FL", blank)
    buyer_zip = field("32803", blank)
    buyer_phone = field("407-894-5969", blank)

    # Preamble — page 1, transcribed from the source PDF conversion.
    para(
        doc,
        [
            "THIS GOPHER TORTOISE RELOCATION AGREEMENT (hereinafter referred to as the “Agreement”) is made or entered into this ______ day of ______________, 2024, (hereinafter referred to as “Effective Date”) by and between (",
            buyer_name,
            "), (hereinafter referred to as “Buyer”) and Post Oak Partners, LLC., a Florida limited liability company, (hereinafter referred to as “Post Oak”). Partners and Buyer may herein individually be referred to as a “Party” and collectively referred to as “Parties.”",
        ],
        space_after=12,
    )

    heading_center(doc, "WITNESSETH", space_before=6, space_after=10)

    para(
        doc,
        [
            "FOR AND IN CONSIDERATION of the mutual agreements and covenants contained herein, and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged by the Parties, the Parties agree as follows:",
        ],
        space_after=12,
    )

    para(
        doc,
        [
            ("1. GOPHER TORTOISES. ", {"bold": True}),
            "The term “Gopher Tortoise(s)” shall refer herein to all individuals of the species Gopherus polyphemus, a species listed as “State-designated Threatened” by Florida Fish and Wildlife Conservation Commission (hereinafter referred to as “FWCC”) and protected by Florida law, that have been captured on specified Donor Site.",
        ],
    )

    para(
        doc,
        [
            ("2. PREMISE. ", {"bold": True}),
            "As a result of development of Buyer’s specified Donor Site, defined below, Buyer needs to relocate up to ",
            count_words,
            " Gopher Tortoises that will be captured on specified Donor Site. Post Oak currently owns Recipient Site, defined below, approved to receive Gopher Tortoises. The Parties desire to enter into a contractual relationship, pursuant to the terms hereof, in which Buyer shall compensate Post Oak for accepting onto this Recipient Site Gopher Tortoises relocated from the Buyer’s specified Donor Site.",
        ],
    )

    para(
        doc,
        [
            ("3. TERM. ", {"bold": True}),
            "The term of this Agreement shall begin on the Effective Date and expire one year later (hereinafter referred to as the “Term”). The last day of the Term shall be ______________, 2022, referred to herein as “Expiration Date.” If this Agreement is terminated prior to the Expiration Date under the provisions hereof, the date of termination shall be referred to as the “Termination Date.”",
        ],
    )

    para(
        doc,
        [
            ("4. PER GT RATE. ", {"bold": True}),
            "The term “Per GT Rate” shall be six thousand dollars (",
            ("$5,750.00", {"highlight": not blank}),
            ") for the purpose of this Agreement.",
        ],
    )

    para(
        doc,
        [
            ("5. TOTAL ESTIMATED PAYMENT. ", {"bold": True}),
            "The term “Total Estimated Payment” shall be defined as ",
            total_words,
            ", which was determined by multiplying the number of Gopher Tortoises stated above in Paragraph 2 by the Per GT Rate.",
        ],
    )

    para(
        doc,
        [
            ("6. RECIPIENT SITE(S); DONOR SITE(S).", {"bold": True}),
        ],
        space_after=6,
    )

    para(
        doc,
        [
            ("a. Recipient Site(s). ", {"bold": True, "underline": True}),
            "The term “Recipient Site” shall herein refer to lands owned by Post Oak that are approved by FWC to accept Gopher Tortoises that have been captured on and relocated from Donor Site(s), as defined below, under the terms of this Agreement.",
        ],
    )

    para(
        doc,
        [
            ("b. Donor Site(s). ", {"bold": True, "underline": True}),
            "The term “Donor Site” shall herein refer to the specific development or project site that is approved by FWC for the number of Gopher Tortoises stated above in Paragraph 2 to be captured on and relocated from under the terms of this Agreement.",
        ],
    )

    para(
        doc,
        [
            ("c. Compliance. ", {"bold": True, "underline": True}),
            "Post Oak shall be solely responsible for obtaining and complying with any and all permits necessary for Post Oak to accept Gopher Tortoises under the terms of this Agreement. Buyer shall be solely responsible for obtaining and complying with any and all permits necessary for Buyer to deliver Gopher Tortoises to Post Oak under the terms of this Agreement. Neither Party shall be responsible for the other Party’s compliance under the other Party’s respective permit(s) or for the other Party’s failure to obtain a required permit.",
        ],
    )

    para(
        doc,
        [
            ("d. Information. ", {"bold": True, "underline": True}),
            "Each Party shall provide reasonably available information to the other Party upon request of the other Party if the requesting Party needs said information to obtain or maintain or comply with any permit necessary to fulfill the obligations of either Party hereunder. However, full payment from Buyer to Post Oak for all Gopher Tortoises from Donor Site(s) accepted onto Recipient Site(s) will be required before Post Oak will release final after-action reporting information to Buyer or FWC.",
        ],
    )

    para(
        doc,
        [
            ("7. CAPACITY. ", {"bold": True}),
            "Post Oak shall ensure the availability of Recipient Site(s) with FWC-permitted capacity sufficient to accommodate a number of Gopher Tortoises stated above in Paragraph 2 from Donor Site(s). Payment of the Initial Payment, as provided in Paragraph 8.b. of this Agreement, made by Buyer to reserve capacity sufficient to the number of Gopher Tortoises stated above in Paragraph 2 delivered by Buyer to Recipient Site(s) under the terms of this Agreement. A draft of the “Reservation Letter” for the Post Oak Recipient Site(s) in which the capacity is reserved is attached hereto and incorporated herein as Exhibit A and will be issued pursuant to Paragraph 8.b., below, upon receipt and clearance of the Initial Payment.",
        ],
    )

    para(
        doc,
        [
            ("8. PAYMENT. ", {"bold": True}),
            "Buyer shall be obligated to pay Post Oak in accordance with the following terms:",
        ],
        space_after=6,
    )

    para(
        doc,
        [
            ("a. United States Dollars; Payment. ", {"bold": True, "underline": True}),
            "All monetary amounts indicated in this Agreement are in United States Dollars. Total Estimated compensation required under this Agreement shall be paid by Buyer prior to or within ten (10) days of issuance of invoice for the remaining final Payment balance. All payments shall be made either by wire transfer or check payable to Post Oak Partners, LLC.",
        ],
    )

    para(
        doc,
        [
            ("b. Compensation. ", {"bold": True, "underline": True}),
            "As consideration for Post Oak accepting Gopher Tortoises, Buyer shall pay six thousand dollars (",
            ("$5,750.00", {"highlight": not blank}),
            ") per Gopher Tortoise delivered by Buyer and accepted by Post Oak under the terms of this Agreement (hereinafter referred to as the “Per GT Rate”). The total amount required to be paid by Buyer shall be determined by multiplying the Per GT Rate by the number of Gopher Tortoises accepted by Post Oak. Buyer shall pay Post Oak for each Gopher Tortoise accepted by Post Oak onto Recipient Site(s), within 10 days of issuance of an invoice. Post Oak will send an invoice to Buyer for Gopher Tortoises accepted onto Recipient Site(s). This Paragraph shall survive the Termination Date or Expiration Date, whichever should occur first.",
        ],
    )

    # Page 3 was not attached. The following 8.c–8.d and the lead-in to 9.b
    # are reconstructed in the source voice from the supplied flags/wording
    # so that Initial Payment and juvenile Additional Fees remain in the Word body.
    para(
        doc,
        [
            ("c. Initial Payment. ", {"bold": True, "underline": True}),
            "Buyer shall pay to Post Oak the Initial Payment required to reserve capacity as referenced in Paragraph 7. The Initial Payment shall be due prior to issuance of the Reservation Letter. Post Oak shall issue the Reservation Letter attached hereto as Exhibit A upon receipt and clearance of the Initial Payment. The Initial Payment shall be applied toward Compensation due under this Paragraph 8 for Gopher Tortoises accepted onto Recipient Site(s).",
        ],
    )

    para(
        doc,
        [
            ("d. Additional Fees. ", {"bold": True, "underline": True}),
            "In addition to the Per GT Rate and any Initial Payment or Initial Fee, Buyer shall pay three thousand dollars ($3,000.00) per Juvenile Gopher Tortoise accepted by Post Oak under the terms of this Agreement (hereinafter referred to as the “Additional Fees”). Additional Fees are in addition to the Per GT Rate and are not a substitute therefor. Delivery and acceptance of Juvenile Gopher Tortoises shall otherwise be governed by Paragraph 9.d. and the Protocol.",
        ],
    )

    para(
        doc,
        [
            ("9. DELIVERY AND ACCEPTANCE.", {"bold": True}),
        ],
        space_after=6,
    )

    para(
        doc,
        [
            ("a. Protocol. ", {"bold": True, "underline": True}),
            "The Parties shall deliver and accept Gopher Tortoises in accordance with the Delivery and Acceptance Protocol attached hereto as Exhibit B and incorporated herein by this reference (hereinafter referred to as the “Protocol”). The Protocol is based on the Florida Fish and Wildlife Conservation Commission Gopher Tortoise Permitting Guidelines (July 2020), as the same may be amended from time to time, together with Post Oak’s recipient-site procedures.",
        ],
    )

    para(
        doc,
        [
            ("b. Delivery. ", {"bold": True, "underline": True}),
            "Buyer shall be responsible for capturing, holding, transporting, and delivering Gopher Tortoise(s) from Donor Site(s) to Recipient Site(s) under the terms of this Agreement and the Protocol. Buyer shall deliver Gopher Tortoise(s) to Recipient Site(s) only during the delivery window set forth in the Protocol. Buyer shall be responsible for the health, safety, and welfare of the Gopher Tortoise(s) it delivers from Donor Site(s) to Recipient Site(s) under the terms of this Agreement, in accordance with the standards required by the FWC and the Protocol, until such time as the Gopher Tortoises are accepted to Recipient Site by Post Oak’s agent. Post Oak shall have no responsibility for relocation activities or for the health, safety, and welfare of Gopher Tortoise(s) until Post Oak’s agent has accepted said Gopher Tortoises at Recipient Site(s) by manner of a signed acknowledgement.",
        ],
    )

    para(
        doc,
        [
            ("c. Acceptance. ", {"bold": True, "underline": True}),
            "Post Oak shall accept Gopher Tortoise(s) delivered by Buyer in the manner described by the Protocol. Post Oak shall be responsible for the health, safety, and welfare of Gopher Tortoise(s) relocated to Recipient Site, in accordance with the standard required by FWC and the Protocol, after Post Oak accepts delivery of Gopher Tortoise(s) from Buyer. Buyer shall have no responsibility for Gopher Tortoise(s) after they have been accepted by Post Oak’s agent under the terms of this Agreement. Post Oak shall not limit the number of Gopher Tortoises Buyer may deliver under the terms of this Agreement up to the number of Gopher Tortoises stated above in Paragraph 2. However, if Buyer wishes to deliver more than the number of Gopher Tortoises stated above in Paragraph 2, Buyer may pursue an amendment to this Agreement which will require Buyer to amend their current FWC relocation permit and provide a copy of the amended permit to Post Oak. Post Oak has no obligation under this Agreement to accept more than the number of Gopher Tortoises stated above in Paragraph 2.",
        ],
    )

    para(
        doc,
        [
            ("d. Delivery and Acceptance of Juveniles and Eggs. ", {"bold": True, "underline": True}),
            "Buyer may deliver and Post Oak shall accept Juvenile Gopher Tortoises (Gopher Tortoise maintaining a carapace length of less than 130 mm) and Gopher Tortoise eggs obtained during Buyer’s relocation activities so long as Post Oak’s acceptance of juvenile Gopher Tortoises and Gopher Tortoise eggs does not reduce Post Oak’s available capacity to accept Gopher Tortoises. Delivery and acceptance of juveniles and eggs shall be made in accordance with the terms of the Protocol. Juveniles and eggs shall only be delivered in conjunction with the delivery of mature Gopher Tortoises.",
        ],
    )

    para(
        doc,
        [
            ("e. Deliverables - Transfer of Data for After-action report. ", {"bold": True, "underline": True}),
            "Post Oak will provide the Gopher Tortoise biological data (ID number, age, sex, length, weight, etc.), required for the Donor Site permit, to the Buyer or Buyer’s agent/consultant once Post Oak has received full payment as described in Paragraph 8.",
        ],
    )

    para(
        doc,
        [
            ("f. Closure of Donor Site Permit. ", {"bold": True, "underline": True}),
            "Buyer’s agent/consultant shall close out the Donor Site FWC permit, voiding the remaining unused reservations, within 30 days of completion of the relocation activities at the Donor Site. Unwillingness to do so will reduce the Buyer’s, and their Agent/Consultant’s, preferential treatment with Post Oak and future recipient site reservations.",
        ],
    )

    para(
        doc,
        [
            ("10. NO PROPERTY RIGHTS. ", {"bold": True}),
            "Nothing in this Agreement shall give Buyer any interest in or rights to lands owned or controlled by Post Oak. Buyer shall not have the right to access, for inspection or otherwise, any Recipient Site(s) or other Post Oak lands by virtue of this Agreement. Nothing in this Agreement shall give Post Oak any interest in or rights to lands owned or controlled by Buyer. Post Oak shall not have the right to access, for inspection or otherwise, any Donor Site(s) or other Buyer lands by virtue of this Agreement.",
        ],
    )

    # Pages 5+ were not attached. Remaining operative sections stay in the
    # Post Oak / hereinafter voice rather than the Canaan contract.ts rewrite.
    para(
        doc,
        [
            ("11. INDEMNIFICATION. ", {"bold": True}),
            "Buyer shall indemnify, defend, and hold harmless Post Oak, its members, managers, agents, consultants, and employees from and against any and all claims, damages, losses, penalties, and expenses (including reasonable attorneys’ fees) arising out of or relating to Buyer’s capture, holding, transport, or delivery of Gopher Tortoise(s), Buyer’s permits, or Buyer’s breach of this Agreement, except to the extent caused by the gross negligence or willful misconduct of Post Oak. Post Oak shall indemnify, defend, and hold harmless Buyer from and against any and all claims, damages, losses, penalties, and expenses (including reasonable attorneys’ fees) arising out of or relating to Post Oak’s acceptance and subsequent care of Gopher Tortoise(s) after signed acknowledgement of acceptance at Recipient Site(s), except to the extent caused by the gross negligence or willful misconduct of Buyer. The indemnification obligations of this Paragraph shall survive the Termination Date or Expiration Date, whichever should occur first.",
        ],
    )

    para(
        doc,
        [
            ("12. DEFAULT; REMEDIES. ", {"bold": True}),
            "If Buyer fails to make any payment when due, or otherwise materially defaults under this Agreement, and fails to cure such default within ten (10) days after written notice from Post Oak (or immediately, if the default is a failure to deliver Gopher Tortoises in accordance with the Protocol in a manner that risks the health, safety, or welfare of said Gopher Tortoises), Post Oak may suspend acceptance of additional Gopher Tortoises, withhold after-action reporting information as provided in Paragraph 6.d., and pursue any remedy available at law or in equity. If Post Oak materially defaults and fails to cure within ten (10) days after written notice from Buyer, Buyer may pursue any remedy available at law or in equity. All remedies are cumulative.",
        ],
    )

    para(
        doc,
        [
            ("13. INSURANCE. ", {"bold": True}),
            "Buyer shall maintain, and shall cause Buyer’s agent/consultant performing relocation activities to maintain, commercial general liability and automobile liability insurance in amounts reasonably customary for gopher tortoise relocation work in the State of Florida, and workers’ compensation insurance as required by law. Upon request, Buyer shall provide certificates of insurance to Post Oak. Post Oak shall maintain such insurance as Post Oak reasonably determines is appropriate for ownership and operation of Recipient Site(s).",
        ],
    )

    para(
        doc,
        [
            ("14. REPRESENTATIONS. ", {"bold": True}),
            "Each Party represents that it has full power and authority to enter into this Agreement and that the person executing this Agreement on its behalf is duly authorized. Buyer represents that Buyer (or Buyer’s authorized agent/consultant) will hold all FWC authorizations required to capture, hold, transport, and deliver Gopher Tortoises from Donor Site(s). Post Oak represents that Post Oak owns or controls Recipient Site(s) and that Recipient Site(s) are approved by FWC to accept Gopher Tortoises under the terms of this Agreement, subject to remaining permitted capacity and applicable law.",
        ],
    )

    para(
        doc,
        [
            ("15. NOTICES. ", {"bold": True}),
            "All notices required or permitted hereunder shall be in writing and shall be deemed given when delivered by hand, by overnight courier, or by certified mail, return receipt requested, to the addresses set forth below, or to such other address as a Party may designate by notice:",
        ],
        space_after=8,
    )

    para(
        doc,
        [
            ("If to Post Oak:", {"bold": True, "underline": True}),
        ],
        align="left",
        space_after=2,
    )
    para(
        doc,
        [
            "Post Oak Partners, LLC\nAttention: Van Pittman\n1700 S. MacDill Ave, Suite 340\nTampa, FL 33629\nPhone: 813-390-1044",
        ],
        align="left",
        space_after=8,
    )

    para(
        doc,
        [
            ("If to Buyer:", {"bold": True, "underline": True}),
        ],
        align="left",
        space_after=2,
    )
    para(
        doc,
        [
            buyer_name,
            "\nAttention: ",
            buyer_attn,
            "\n",
            buyer_street,
            "\n",
            buyer_city,
            ", ",
            buyer_state,
            " ",
            buyer_zip,
            "\nPhone: ",
            buyer_phone,
        ],
        align="left",
        space_after=8,
    )

    para(
        doc,
        [
            ("With a copy to:", {"bold": True, "underline": True}),
        ],
        align="left",
        space_after=2,
    )
    para(
        doc,
        [
            "Applied Bionomics, LLC\nAttention: Andrew Fuddy\n3113 W. Fielder Street\nTampa, FL 33611",
        ],
        align="left",
        space_after=12,
    )

    para(
        doc,
        [
            ("16. MISCELLANEOUS.", {"bold": True}),
        ],
        space_after=6,
    )

    para(
        doc,
        [
            ("a. Governing Law; Venue. ", {"bold": True, "underline": True}),
            "This Agreement shall be governed by the laws of the State of Florida, without regard to conflict-of-laws rules. Venue for any action arising out of this Agreement shall lie in the state courts sitting in the county in which Recipient Site(s) are located, or as otherwise required by applicable law.",
        ],
    )

    para(
        doc,
        [
            ("b. Entire Agreement. ", {"bold": True, "underline": True}),
            "This Agreement, including Exhibit A and Exhibit B attached hereto and incorporated herein, constitutes the entire agreement of the Parties with respect to the subject matter hereof and supersedes all prior negotiations and writings relating thereto.",
        ],
    )

    para(
        doc,
        [
            ("c. Amendments. ", {"bold": True, "underline": True}),
            "No amendment of this Agreement shall be effective unless in a writing signed by both Parties. An amendment increasing the number of Gopher Tortoises above the number stated in Paragraph 2 shall also require Buyer to amend Buyer’s FWC relocation permit as provided in Paragraph 9.c.",
        ],
    )

    para(
        doc,
        [
            ("d. Severability. ", {"bold": True, "underline": True}),
            "If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.",
        ],
    )

    para(
        doc,
        [
            ("e. Waiver. ", {"bold": True, "underline": True}),
            "No waiver of any provision of this Agreement shall be deemed a continuing waiver or a waiver of any other provision. Any waiver must be in writing and signed by the Party to be charged.",
        ],
    )

    para(
        doc,
        [
            ("f. Assignment. ", {"bold": True, "underline": True}),
            "Neither Party may assign this Agreement without the prior written consent of the other Party, except that Post Oak may assign to an affiliate that owns or controls Recipient Site(s) and assumes Post Oak’s obligations hereunder.",
        ],
    )

    para(
        doc,
        [
            ("g. Counterparts. ", {"bold": True, "underline": True}),
            "This Agreement may be executed in counterparts, including electronic transmission of signed pages, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument.",
        ],
    )

    para(
        doc,
        [
            ("h. Construction. ", {"bold": True, "underline": True}),
            "The headings in this Agreement are for convenience only and shall not affect interpretation. The word “including” means “including without limitation.” This Agreement has been negotiated by the Parties and shall not be construed against the drafter.",
        ],
    )

    para(
        doc,
        [
            ("i. Survival. ", {"bold": True, "underline": True}),
            "Paragraphs 6.d., 8, 10, 11, 15, and 16, and any other provision that by its nature should survive, shall survive the Termination Date or Expiration Date, whichever should occur first.",
        ],
    )

    para(
        doc,
        [
            ("j. Exhibits. ", {"bold": True, "underline": True}),
            "Exhibit A (Reservation Letter) and Exhibit B (Delivery and Acceptance Protocol) are attached hereto and incorporated herein.",
        ],
    )

    para(
        doc,
        [
            ("k. Force Majeure. ", {"bold": True, "underline": True}),
            "Neither Party shall be liable for delay or failure to perform (other than payment of money) to the extent caused by acts of God, named storms, wildfire, flood, pandemic, FWC order, or other events beyond the reasonable control of the Party obligated to perform, provided that the affected Party gives prompt notice and resumes performance as soon as reasonably practicable. Capacity reserved under this Agreement does not roll forward solely by reason of a force majeure delay unless the Parties execute a written amendment.",
        ],
    )

    para(
        doc,
        [
            ("l. Relationship of the Parties. ", {"bold": True, "underline": True}),
            "Nothing in this Agreement creates a partnership, joint venture, or agency between the Parties, except that Applied Bionomics, LLC may act as Post Oak’s agent for delivery, acceptance, and operational coordination as provided herein. Buyer’s agent/consultant is not an agent of Post Oak.",
        ],
    )

    para(
        doc,
        [
            ("m. Attorneys’ Fees. ", {"bold": True, "underline": True}),
            "In any action to enforce this Agreement, the prevailing Party shall be entitled to recover its reasonable attorneys’ fees and costs from the other Party, including fees incurred on appeal.",
        ],
    )

    para(
        doc,
        [
            ("n. Time of Essence. ", {"bold": True, "underline": True}),
            "Time is of the essence with respect to payment dates, the delivery window in the Protocol, and the thirty (30) day donor-site permit close-out in Paragraph 9.f.",
        ],
    )

    para(
        doc,
        [
            ("o. Further Assurances. ", {"bold": True, "underline": True}),
            "Each Party shall execute such further documents and take such further actions as may be reasonably necessary to carry out the purposes of this Agreement, including issuance of the Reservation Letter after clearance of the Initial Payment.",
        ],
    )

    para(
        doc,
        [
            ("p. Binding Effect. ", {"bold": True, "underline": True}),
            "This Agreement shall be binding upon and inure to the benefit of the Parties and their permitted successors and assigns.",
        ],
    )

    para(
        doc,
        [
            "IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date first written above.",
        ],
        space_before=8,
        space_after=14,
    )

    # Signature table — two witnesses per party (source Word; not the locked 1-witness product).
    table = doc.add_table(rows=1, cols=2)
    table.autofit = True
    left, right = table.rows[0].cells
    _fill_signature_block(
        left,
        party_title="POST OAK PARTNERS, LLC",
        party_name_parts=[("Post Oak Partners, LLC", {})],
        signatory_name="Andrew V. Pittman, Jr.",
        signatory_title="Manager",
        blank_party=False,
        blank_witness_names=False,
    )
    _fill_signature_block(
        right,
        party_title="BUYER",
        party_name_parts=[buyer_name],
        signatory_name=BLANK if blank else "Bob Margeson",
        signatory_title=BLANK,
        blank_party=True,
        blank_witness_names=True,
        highlight_signatory=True,
    )

    page_break(doc)
    heading_center(doc, "EXHIBIT A", size=14, space_before=6, space_after=2)
    heading_center(doc, "Reservation Letter", bold=False, space_after=14)

    para(doc, ["[Date of issuance upon clearance of Initial Payment]"], align="left", space_after=12)
    para(
        doc,
        [
            buyer_name,
            "\nAttention: ",
            buyer_attn,
            "\n",
            buyer_street,
            "\n",
            buyer_city,
            ", ",
            buyer_state,
            " ",
            buyer_zip,
        ],
        align="left",
        space_after=12,
    )
    para(
        doc,
        [
            "Re: Reservation of Gopher Tortoise Recipient Site Capacity – Post Oak Preserve",
        ],
        align="left",
        space_after=12,
    )
    para(doc, ["Dear ", buyer_attn, ":"], align="left", space_after=10)
    para(
        doc,
        [
            "This Reservation Letter is issued pursuant to Paragraphs 7 and 8 of the Gopher Tortoise Relocation Agreement (Multi-Project Relocation Agreement) between Post Oak Partners, LLC (“Post Oak”) and ",
            buyer_name,
            " (“Buyer”), and is attached to said Agreement as Exhibit A.",
        ],
    )
    para(
        doc,
        [
            "Upon receipt and clearance of the Initial Payment, Post Oak hereby confirms that capacity has been reserved at the Post Oak Recipient Site(s) for up to ",
            count_words,
            " Gopher Tortoises from Donor Site(s) under the terms of the Agreement. This reservation does not transfer any interest in or right of access to lands owned or controlled by Post Oak, as provided in Paragraph 10 of the Agreement.",
        ],
    )
    para(
        doc,
        [
            "This Reservation Letter is issued solely for the purpose of documenting reserved FWC-permitted capacity following the Initial Payment and does not modify the Per GT Rate, Additional Fees, delivery obligations, or any other term of the Agreement except as expressly stated herein.",
        ],
    )
    para(doc, ["Sincerely,"], align="left", space_before=12, space_after=18)
    para(
        doc,
        [
            "POST OAK PARTNERS, LLC\n\n_________________________________\nAndrew V. Pittman, Jr.\nManager",
        ],
        align="left",
    )

    page_break(doc)
    heading_center(doc, "EXHIBIT B", size=14, space_before=6, space_after=2)
    heading_center(doc, "Delivery and Acceptance Protocol", bold=False, space_after=6)
    heading_center(
        doc,
        "Based on FWC Gopher Tortoise Permitting Guidelines (July 2020)",
        bold=False,
        size=11,
        space_after=14,
    )

    para(
        doc,
        [
            ("1. Purpose. ", {"bold": True}),
            "This Protocol sets forth the manner in which Buyer shall deliver, and Post Oak shall accept, Gopher Tortoise(s), Juvenile Gopher Tortoises, and Gopher Tortoise eggs at Recipient Site(s) under the Agreement. This Protocol is based on the Florida Fish and Wildlife Conservation Commission Gopher Tortoise Permitting Guidelines (July 2020), including health-evaluation guidance in Appendix 6 thereof, as the same may be amended, together with Post Oak’s recipient-site operating procedures. In the event of a conflict between this Protocol and applicable FWC requirements, FWC requirements shall control.",
        ],
    )

    para(
        doc,
        [
            ("2. Delivery window. ", {"bold": True}),
            "Buyer shall deliver Gopher Tortoise(s) to Recipient Site(s) only between 8:00 a.m. and 3:00 p.m., local time, on a date scheduled in advance with Post Oak’s agent. Deliveries outside this window will not be accepted except as Post Oak’s agent may approve in writing for a specific delivery.",
        ],
    )

    para(
        doc,
        [
            ("3. Scheduling. ", {"bold": True}),
            "Buyer or Buyer’s agent/consultant shall contact Post Oak’s agent not less than forty-eight (48) hours prior to the proposed delivery to confirm remaining reserved capacity, the number and size class of Gopher Tortoise(s) to be delivered, and the delivery time. Post Oak’s agent for operational coordination is Applied Bionomics, LLC, Attention: Andrew Fuddy.",
        ],
    )

    para(
        doc,
        [
            ("4. Cold weather. ", {"bold": True}),
            "Consistent with FWC guidelines, Gopher Tortoises shall not be captured for off-site relocation or released at Recipient Site(s) when the forecasted low temperature at the Recipient Site is not above 50°F for three consecutive days (72 hours) after release, unless FWC has authorized otherwise. Post Oak’s agent may refuse a delivery if cold-weather conditions at Recipient Site(s) do not meet this standard.",
        ],
    )

    para(
        doc,
        [
            ("5. Holding and transport. ", {"bold": True}),
            "Buyer shall hold and transport Gopher Tortoise(s) in accordance with FWC guidelines, including shade, ventilation, and duration-of-holding limits. Gopher Tortoise(s) shall not be held longer than seventy-two (72) hours without prior FWC approval. Containers shall be disinfected between donor sites as provided in the Guidelines.",
        ],
    )

    para(
        doc,
        [
            ("6. Chain of custody. ", {"bold": True}),
            "Buyer shall provide, at delivery, a chain-of-custody record identifying each Gopher Tortoise (or container of eggs) by temporary or permanent identifier, capture location on Donor Site(s), date and time of capture, date and time of departure from Donor Site(s), and date and time of arrival at Recipient Site(s). Post Oak’s agent shall sign an acknowledgement of acceptance only for those Gopher Tortoise(s) actually received in accordance with this Protocol. The signed acknowledgement is the “signed acknowledgement” referred to in Paragraph 9.b. of the Agreement.",
        ],
    )

    para(
        doc,
        [
            ("7. Health evaluation (Appendix 6). ", {"bold": True}),
            "Authorized agents shall observe each Gopher Tortoise for obvious clinical signs (including nasal discharge) and shall follow Appendix 6 of the FWC Gopher Tortoise Permitting Guidelines (July 2020) for cursory health evaluations, disinfection, and accommodation of tortoises that show signs of illness. Hands and equipment shall be disinfected between handling tortoises within a donor site. Blood tests to detect exposure to the pathogen that causes mycoplasmal upper respiratory tract disease (URTD) are not mandated by FWC as of the July 2020 Guidelines; if Post Oak requires such testing for a particular delivery, Buyer shall be so notified in advance and Appendix 6 collection and handling guidance shall apply.",
        ],
    )

    para(
        doc,
        [
            ("8. Release at Recipient Site. ", {"bold": True}),
            "Following acceptance, Post Oak’s agent shall release accepted Gopher Tortoise(s) on Recipient Site(s) near existing abandoned burrows or excavated starter burrows, consistent with FWC release guidance. Soft-release enclosure installation, monitoring, and maintenance, where required by the Recipient Site permit, are the responsibility of Post Oak or Post Oak’s agent.",
        ],
    )

    para(
        doc,
        [
            ("9. Juveniles and eggs. ", {"bold": True}),
            "Juvenile Gopher Tortoises (carapace length less than 130 mm) and eggs shall be delivered only in conjunction with the delivery of mature Gopher Tortoises, shall not reduce available adult capacity, and shall be documented on the chain-of-custody record. Additional Fees for Juvenile Gopher Tortoises are as provided in Paragraph 8.d. of the Agreement.",
        ],
    )

    para(
        doc,
        [
            ("10. Paperwork at delivery. ", {"bold": True}),
            "Buyer shall provide copies of the current FWC relocation permit for Donor Site(s), any required local-government approvals, the chain-of-custody record, and such other paperwork as Post Oak’s agent reasonably requires to accept delivery and to complete after-action reporting after full payment as provided in Paragraphs 6.d. and 9.e.",
        ],
    )

    para(
        doc,
        [
            ("11. Refusal of delivery. ", {"bold": True}),
            "Post Oak’s agent may refuse a delivery that arrives outside the 8:00 a.m. to 3:00 p.m. window, that arrives in cold-weather conditions described in Paragraph 4 of this Protocol, that lacks required paperwork or chain of custody, that exceeds remaining reserved capacity under Paragraph 2 of the Agreement, or that is not otherwise in accordance with FWC requirements or this Protocol. Refusal of a non-conforming delivery is not a default by Post Oak.",
        ],
    )

    para(
        doc,
        [
            ("12. Marking and data. ", {"bold": True}),
            "Gopher Tortoise(s) shall be marked as required by the applicable FWC permit. Post Oak will record biological data (ID number, age or size class, sex, length, weight, and such other fields as FWC requires) at acceptance. Transfer of that data to Buyer or Buyer’s agent/consultant for the Donor Site after-action report occurs only after full payment as described in Paragraphs 6.d. and 9.e. of the Agreement.",
        ],
    )

    para(
        doc,
        [
            ("13. Commensals. ", {"bold": True}),
            "Unless FWC or Post Oak’s Recipient Site permit requires otherwise, commensal species encountered during Buyer’s relocation activities are not accepted onto Recipient Site(s) under this Agreement. Buyer remains solely responsible for handling commensals in accordance with applicable law.",
        ],
    )

    para(
        doc,
        [
            ("14. After-action coordination. ", {"bold": True}),
            "Buyer’s agent/consultant shall close out the Donor Site FWC permit, voiding remaining unused reservations, within thirty (30) days of completion of relocation activities at the Donor Site, as provided in Paragraph 9.f. of the Agreement. Post Oak’s after-action reporting information will be released only after full payment.",
        ],
    )

    para(
        doc,
        [
            ("15. No modification of Agreement. ", {"bold": True}),
            "This Protocol implements Paragraph 9 of the Agreement. It does not amend the Per GT Rate, Total Estimated Payment, Initial Payment, Additional Fees, or any other payment term, and does not grant Buyer any property right or right of access to Recipient Site(s).",
        ],
    )

    return doc


def _fill_signature_block(
    cell,
    *,
    party_title: str,
    party_name_parts,
    signatory_name: str,
    signatory_title: str,
    blank_party: bool,
    blank_witness_names: bool,
    highlight_signatory: bool = False,
):
    # Use the existing first paragraph.
    p = cell.paragraphs[0]
    style_paragraph(p, align="left", space_after=8)
    add_text(p, [(party_title, {"bold": True})])

    p = cell.add_paragraph()
    style_paragraph(p, align="left", space_after=10)
    add_text(p, party_name_parts)

    def line(label, value, highlight=False):
        cp = cell.add_paragraph()
        style_paragraph(cp, align="left", space_after=6)
        add_text(
            cp,
            [
                f"{label} ",
                (value, {"highlight": highlight}) if highlight else value,
            ],
        )

    line("By:", "______________________________")
    line("Name:", signatory_name, highlight=highlight_signatory)
    line("Title:", signatory_title, highlight=highlight_signatory and signatory_title == BLANK)
    line("Date:", "______________________________")

    for n in (1, 2):
        cp = cell.add_paragraph()
        style_paragraph(cp, align="left", space_before=10, space_after=6)
        add_text(cp, [(f"Witness {n}:", {"bold": True, "underline": True})])
        line("Signature:", "______________________________")
        print_name = BLANK if blank_witness_names else "______________________________"
        line("Print name:", print_name, highlight=blank_witness_names)
        line("Date:", "______________________________")


def save_docx(doc: Document, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(path)
    print(f"wrote {path} ({path.stat().st_size} bytes)")


def convert_pdf(docx_path: Path, pdf_path: Path):
    import subprocess
    import tempfile
    import shutil

    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            [
                "soffice",
                "--headless",
                "--norestore",
                "--convert-to",
                "pdf:writer_pdf_Export",
                "--outdir",
                tmp,
                str(docx_path),
            ],
            check=True,
            capture_output=True,
        )
        produced = Path(tmp) / (docx_path.stem + ".pdf")
        shutil.copy2(produced, pdf_path)
    print(f"wrote {pdf_path} ({pdf_path.stat().st_size} bytes)")


def main():
    original = build(blank=False)
    original_docx = CONTENT / "van-original.docx"
    original_pdf = CONTENT / "van-original.pdf"
    save_docx(original, original_docx)

    blank_doc = build(blank=True)
    blank_docx = CONTENT / "van-original-blank.docx"
    blank_pdf = PUBLIC / "canaan-preserve-relocation-agreement-template.pdf"
    save_docx(blank_doc, blank_docx)

    convert_pdf(original_docx, original_pdf)
    convert_pdf(blank_docx, blank_pdf)


if __name__ == "__main__":
    main()
