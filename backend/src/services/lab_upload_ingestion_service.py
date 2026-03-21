import threading
import logging

logger = logging.getLogger(__name__)


def ingest_lab_report_to_qdrant(
    *,
    file_url: str,
    patient_id: str,
    request_id: str,
    test_name: str | None = None,
):
    """Download PDF from Supabase, chunk, vectorize, and store in Qdrant.

    This is designed to run in a background thread so the upload response
    is not delayed by embedding computation.
    """
    try:
        # Optional dependencies are loaded lazily so app startup does not fail
        # in environments that only run smoke/health checks.
        from src.services.supabase_storage_service import download_pdf_from_storage
        from src.services.pdf_text_service import extract_text_from_pdf_bytes
        from src.services.text_chunker_service import chunk_text
        from src.services.patient_rag_service import delete_document_chunks, upsert_document_chunks

        logger.info(
            "RAG ingestion started for request_id=%s, patient_id=%s",
            request_id, patient_id,
        )

        pdf_bytes = download_pdf_from_storage(file_url)
        extracted_text = extract_text_from_pdf_bytes(pdf_bytes)

        if not extracted_text.strip():
            logger.warning(
                "RAG ingestion: no text extracted from PDF for request_id=%s",
                request_id,
            )
            return

        chunks = chunk_text(extracted_text)

        # Remove any previous vectors for this document
        delete_document_chunks(request_id)

        inserted = upsert_document_chunks(
            patient_id=patient_id,
            document_id=request_id,
            document_type="lab_report",
            test_name=test_name,
            source_file_url=file_url,
            uploaded_at=None,
            chunks=chunks,
        )

        logger.info(
            "RAG ingestion complete: request_id=%s, chunks_indexed=%d",
            request_id, inserted,
        )

    except ImportError as exc:
        logger.warning(
            "RAG ingestion skipped: optional dependency missing for request_id=%s (%s)",
            request_id,
            exc,
        )
    except Exception:
        logger.exception(
            "RAG ingestion failed for request_id=%s", request_id,
        )


def trigger_rag_ingestion_async(
    *,
    file_url: str,
    patient_id: str,
    request_id: str,
    test_name: str | None = None,
):
    """Fire-and-forget RAG ingestion in a background thread."""
    t = threading.Thread(
        target=ingest_lab_report_to_qdrant,
        kwargs=dict(
            file_url=file_url,
            patient_id=patient_id,
            request_id=request_id,
            test_name=test_name,
        ),
        daemon=True,
    )
    t.start()
