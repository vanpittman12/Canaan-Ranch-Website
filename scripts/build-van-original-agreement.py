#!/usr/bin/env python3
"""
Build the site blank-template PDF from Van's authentic Word file.

Does not rewrite the legal body. Copies content/agreements/van-original.docx,
underscores + yellow-highlights intake-mapped sample values only, then
LibreOffice-prints the blank file to
public/agreements/canaan-preserve-relocation-agreement-template.pdf.

Also prints the authentic DOCX to content/agreements/van-original.pdf.

Usage:
  python3 scripts/build-van-original-agreement.py
"""

from __future__ import annotations

import hashlib
import shutil
import subprocess
import tempfile
from pathlib import Path

from docx import Document
from docx.enum.text import WD_COLOR_INDEX
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "agreements"
PUBLIC = ROOT / "public" / "agreements"

AUTHENTIC = CONTENT / "van-original.docx"
AUTHENTIC_PDF = CONTENT / "van-original.pdf"
BLANK_DOCX = CONTENT / "van-original-blank.docx"
BLANK_PDF = PUBLIC / "canaan-preserve-relocation-agreement-template.pdf"

EXPECTED_SHA256 = "5711a4abeb62609bbcc63b3df578a60fb3bb2a2ef8838c3836be363903692412"
EXPECTED_SIZE = 73031

BLANK = "____________________"
YELLOW = WD_COLOR_INDEX.YELLOW
PROJECT_SUBTITLE_LEFTOVER = "Multi-Project Relocation Agreement"
PROJECT_SUBTITLE_BLANK = "Project Name"

# Intake-mapped sample strings to blank. Per GT Rate ($5,750) is intentionally
# absent — leave source text, including any existing highlight on that rate.
BLANK_PHRASES = (
    "Bio-Tech Consulting, Inc.",
    "seventeen (17)",
    "one hundred and twenty thousand dollars ($102,000.00)",
    "one hundred and twenty thousand dollars",
    "($102,000.00)",
    "Bob Margeson",
    "3025 East South St.",
    "Orlando, FL 32803",
    "407-894-5969",
    "407-894-",
    "5969",
)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def convert_pdf(docx_path: Path, pdf_path: Path) -> None:
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


def apply_blank_phrases(text: str) -> str:
    for phrase in BLANK_PHRASES:
        text = text.replace(phrase, BLANK)
    return text


def rewrite_paragraph_with_yellow_blanks(paragraph, new_text: str) -> None:
    """Replace paragraph text, highlighting only underscore blanks."""
    for run in paragraph.runs:
        run.text = ""
    parts = new_text.split(BLANK)
    if paragraph.runs:
        first = paragraph.runs[0]
        first.text = parts[0]
        first.font.highlight_color = None
    else:
        paragraph.add_run(parts[0])
    for rest in parts[1:]:
        blank_run = paragraph.add_run(BLANK)
        blank_run.font.highlight_color = YELLOW
        if rest:
            paragraph.add_run(rest)


def apply_project_name_subtitle(paragraph) -> None:
    """Heading2 leftover becomes a yellow Project Name fill field."""
    style = paragraph.style.name if paragraph.style is not None else ""
    compact = " ".join(paragraph.text.split())
    if style != "Heading 2" or compact != PROJECT_SUBTITLE_LEFTOVER:
        return
    for run in paragraph.runs:
        run.text = ""
    run = paragraph.runs[0] if paragraph.runs else paragraph.add_run()
    run.text = PROJECT_SUBTITLE_BLANK
    run.font.highlight_color = YELLOW


def blank_paragraph(paragraph, *, add_printed_name_blank: bool = False) -> None:
    apply_project_name_subtitle(paragraph)
    text = paragraph.text
    if add_printed_name_blank:
        stripped = text.replace("\t", "").strip()
        if stripped in {"Printed Name:", "Printed Name"} and BLANK not in text:
            run = paragraph.add_run(BLANK)
            run.font.highlight_color = YELLOW
            return
    if not text:
        return
    updated = apply_blank_phrases(text)
    if updated != text:
        rewrite_paragraph_with_yellow_blanks(paragraph, updated)


def blank_document(src: Path, dest: Path) -> None:
    shutil.copy2(src, dest)
    doc = Document(dest)
    for paragraph in doc.paragraphs:
        blank_paragraph(paragraph)
    for table_index, table in enumerate(doc.tables):
        for row_index, row in enumerate(table.rows):
            # Table 1 rows 0–4 are the Post Oak signature / seller witnesses.
            buyer_printed_name = table_index == 1 and row_index >= 5
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    blank_paragraph(paragraph, add_printed_name_blank=buyer_printed_name)
    doc.save(dest)
    print(f"wrote {dest} ({dest.stat().st_size} bytes)")


def verify_authentic() -> None:
    size = AUTHENTIC.stat().st_size
    digest = sha256_file(AUTHENTIC)
    if size != EXPECTED_SIZE or digest != EXPECTED_SHA256:
        raise SystemExit(
            f"authentic DOCX mismatch: size={size} sha256={digest} "
            f"(expected {EXPECTED_SIZE} / {EXPECTED_SHA256})"
        )
    print(f"authentic OK {AUTHENTIC} {size} bytes {digest}")


def main() -> None:
    verify_authentic()
    convert_pdf(AUTHENTIC, AUTHENTIC_PDF)
    blank_document(AUTHENTIC, BLANK_DOCX)
    convert_pdf(BLANK_DOCX, BLANK_PDF)


if __name__ == "__main__":
    main()
