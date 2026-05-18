"""Utilities for extracting text from various file formats."""

from pathlib import Path


def extract_text_from_file(file_path: str | Path, filename: str | None = None) -> str:
    """Extract text content from a file based on its extension.
    
    Supported formats: .txt, .md, .csv, .pdf, .docx, .doc
    """
    path = Path(file_path)
    fname = filename or path.name
    ext = Path(fname).suffix.lower()
    
    if ext in (".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm"):
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    
    if ext == ".pdf":
        return _extract_pdf(path)
    
    if ext in (".docx", ".doc"):
        return _extract_docx(path)
    
    # Try to read as text for unknown extensions
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        raise ValueError(f"Unsupported file format: {ext}. Supported: .txt, .pdf, .docx, .doc, .md, .csv")


def _extract_pdf(path: Path) -> str:
    """Extract text from PDF using PyPDF2."""
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        raise ImportError("PyPDF2 is not installed. Install it with: pip install PyPDF2")
    
    reader = PdfReader(str(path))
    text_parts = []
    for page in reader.pages:
        text_parts.append(page.extract_text() or "")
    return "\n\n".join(text_parts)


def _extract_docx(path: Path) -> str:
    """Extract text from DOCX using python-docx."""
    try:
        from docx import Document
    except ImportError:
        raise ImportError("python-docx is not installed. Install it with: pip install python-docx")
    
    doc = Document(str(path))
    text_parts = []
    for para in doc.paragraphs:
        text_parts.append(para.text)
    return "\n".join(text_parts)
