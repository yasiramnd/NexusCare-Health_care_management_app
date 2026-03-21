import io
from pypdf import PdfReader


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    if not file_bytes:
        return ""

    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []

    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        if text.strip():
            pages.append(text.strip())

    return "\n\n".join(pages).strip()