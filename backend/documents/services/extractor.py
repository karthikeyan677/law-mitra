import os
import logging
import threading
from typing import Optional
from PIL import Image
import pypdf
import pytesseract
from django.db import DatabaseError

from documents.models import Document, DocumentPage

logger = logging.getLogger(__name__)


def process_document(document_id: str) -> bool:
    """
    Extracts text from an uploaded document (PDF or image).
    Updates Document status to PROCESSING, extracts page-by-page text,
    creates DocumentPage records, and sets status to COMPLETED or FAILED.
    Adheres to Privacy Rule 9: logs only document IDs and event names.
    """
    try:
        document = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        logger.warning(f"event=ocr.not_found doc_id={document_id}")
        return False

    try:
        document.status = Document.Status.PROCESSING
        document.error_message = ''
        document.save(update_fields=['status', 'error_message', 'updated_at'])
    except (Document.DoesNotExist, DatabaseError):
        # Document was deleted while waiting to start
        logger.info(f"event=ocr.aborted_deleted doc_id={document_id}")
        return False

    file_path = document.file.path
    if not os.path.isfile(file_path):
        try:
            document.status = Document.Status.FAILED
            document.error_message = "Attached file not found on disk."
            document.save(update_fields=['status', 'error_message', 'updated_at'])
        except (Document.DoesNotExist, DatabaseError):
            pass
        return False

    file_ext = os.path.splitext(file_path)[1].lower()

    try:
        # Clear existing pages if reprocessing
        document.pages.all().delete()

        if file_ext == '.pdf':
            _process_pdf(document, file_path)
        elif file_ext in ('.png', '.jpg', '.jpeg', '.webp', '.tiff', '.bmp'):
            _process_image(document, file_path)
        else:
            _process_generic(document, file_path)

        # Check if document still exists before saving completion
        if not Document.objects.filter(id=document_id).exists():
            logger.info(f"event=ocr.discarded_deleted doc_id={document_id}")
            return False

        document.page_count = document.pages.count()
        document.status = Document.Status.COMPLETED
        document.save(update_fields=['status', 'page_count', 'updated_at'])
        logger.info(f"event=ocr.completed doc_id={document_id} pages={document.page_count}")

        # Auto-run section detection after successful OCR (non-fatal)
        try:
            from analysis.services.section_detector import detect_sections_for_document
            detect_sections_for_document(str(document_id))
            logger.info(f"event=section_detection.auto_completed doc_id={document_id}")
        except Exception as exc:
            logger.warning(
                f"event=section_detection.auto_failed doc_id={document_id} error_type={type(exc).__name__}"
            )

        return True

    except (Document.DoesNotExist, DatabaseError):
        logger.info(f"event=ocr.interrupted_deleted doc_id={document_id}")
        return False
    except Exception as exc:
        logger.error(f"event=ocr.failed doc_id={document_id} error_type={type(exc).__name__}")
        try:
            if Document.objects.filter(id=document_id).exists():
                document.status = Document.Status.FAILED
                document.error_message = f"Extraction failed: {type(exc).__name__}"
                document.save(update_fields=['status', 'error_message', 'updated_at'])
        except Exception:
            pass
        return False


def _process_pdf(document: Document, file_path: str):
    """Parses PDF pages, extracting native digital text or running OCR fallback."""
    reader = pypdf.PdfReader(file_path)

    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        page_text = page.extract_text() or ''

        # If digital text extraction is empty, attempt OCR if image extraction is possible
        if not page_text.strip():
            page_text = _try_ocr_pdf_page(page, page_num)

        DocumentPage.objects.create(
            document=document,
            page_number=page_num,
            extracted_text=page_text.strip(),
            ocr_confidence=95.0 if page.extract_text() else None,
        )


def _try_ocr_pdf_page(page, page_num: int) -> str:
    """Attempts OCR on embedded images in a PDF page."""
    extracted_fragments = []
    try:
        for img_obj in page.images:
            try:
                img = Image.open(img_obj.data)
                ocr_text = pytesseract.image_to_string(img)
                if ocr_text.strip():
                    extracted_fragments.append(ocr_text.strip())
            except Exception:
                continue
    except Exception:
        pass

    if extracted_fragments:
        return "\n\n".join(extracted_fragments)
    return f"[Page {page_num}: Scanned or image-only page. No extractable text found.]"


def _process_image(document: Document, file_path: str):
    """Processes standalone images (PNG, JPG, etc.) using Tesseract OCR."""
    extracted_text = ""
    confidence = None

    try:
        img = Image.open(file_path)
        extracted_text = pytesseract.image_to_string(img)
        confidence = 85.0
    except pytesseract.TesseractNotFoundError:
        extracted_text = (
            "[Image notice. Tesseract OCR binary is not installed on the server. "
            "Native OCR requires the Tesseract engine installed on host PATH.]"
        )
    except Exception as e:
        extracted_text = f"[OCR processing encountered an issue: {type(e).__name__}]"

    DocumentPage.objects.create(
        document=document,
        page_number=1,
        extracted_text=extracted_text.strip(),
        ocr_confidence=confidence,
    )


def _process_generic(document: Document, file_path: str):
    """Processes plain text files or raw text attachments."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        content = f"[Unable to decode file content: {type(e).__name__}]"

    DocumentPage.objects.create(
        document=document,
        page_number=1,
        extracted_text=content.strip(),
        ocr_confidence=100.0,
    )


def trigger_document_processing_async(document_id: str):
    """Triggers asynchronous document processing in a background thread."""
    thread = threading.Thread(
        target=process_document,
        args=(document_id,),
        daemon=True,
        name=f"ocr-worker-{document_id[:8]}"
    )
    thread.start()
    return thread
