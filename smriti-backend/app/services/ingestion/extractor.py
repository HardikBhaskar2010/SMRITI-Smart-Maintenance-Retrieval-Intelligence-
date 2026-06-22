"""
Document text extraction: PDF · DOCX · image (OCR fallback)
"""
from pathlib import Path
import io
import logging

logger = logging.getLogger(__name__)


def extract_text(file_path: Path) -> list[tuple[int, str]]:
    """
    Returns list of (page_number, text) tuples.
    page_number is 1-indexed.
    """
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        return _extract_pdf(file_path)
    elif suffix == ".docx":
        return _extract_docx(file_path)
    elif suffix in (".png", ".jpg", ".jpeg", ".tiff", ".bmp"):
        return _extract_image(file_path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def _extract_pdf(path: Path) -> list[tuple[int, str]]:
    import fitz  # PyMuPDF
    doc = fitz.open(str(path))
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text").strip()
        if not text:
            # Scanned page — OCR fallback
            try:
                import pytesseract
                from PIL import Image
                pix = page.get_pixmap(dpi=200)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                text = pytesseract.image_to_string(img, lang="eng").strip()
            except Exception as e:
                logger.warning("OCR failed on page %d: %s", i + 1, e)
        if text:
            pages.append((i + 1, text))
    doc.close()
    return pages


def _extract_docx(path: Path) -> list[tuple[int, str]]:
    import docx
    doc = docx.Document(str(path))
    pages, current_page, buffer = [], 1, []
    for i, para in enumerate(doc.paragraphs):
        if para.text.strip():
            buffer.append(para.text.strip())
        if (i + 1) % 15 == 0:
            if buffer:
                pages.append((current_page, "\n".join(buffer)))
                buffer = []
            current_page += 1
    if buffer:
        pages.append((current_page, "\n".join(buffer)))
    return pages


def _extract_image(path: Path) -> list[tuple[int, str]]:
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(str(path))
        text = pytesseract.image_to_string(img, lang="eng").strip()
        return [(1, text)] if text else []
    except Exception as e:
        logger.warning("Image OCR failed for %s: %s", path.name, e)
        return []
