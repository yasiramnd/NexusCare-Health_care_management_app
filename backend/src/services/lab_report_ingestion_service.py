from src.repositories.patient_document_repo import get_lab_report
from src.services.supabase_storage_service import download_pdf_from_storage
from src.services.pdf_text_service import extract_text_from_pdf_bytes
from src.services.text_chunker_service import chunk_text
from src.services.patient_rag_service import delete_document_chunks, upsert_document_chunks
from src.repositories.lab_report_status_repo import update_lab_report_rag_status


def ingest_lab_report_from_url(patient_id: str, document_id: str, file_url: str, test_name: str = None, uploaded_at: str = None):
    """
    Generic function to ingest a lab report from a Supabase storage URL.
    """
    pdf_bytes = download_pdf_from_storage(file_url)
    extracted_text = extract_text_from_pdf_bytes(pdf_bytes)

    if not extracted_text.strip():
        raise ValueError("Could not extract text from PDF")

    chunks = chunk_text(extracted_text)

    # Clean up existing chunks for this specific document if any
    delete_document_chunks(document_id)

    inserted = upsert_document_chunks(
        patient_id=patient_id,
        document_id=document_id,
        document_type="lab_report",
        test_name=test_name,
        source_file_url=file_url,
        uploaded_at=uploaded_at,
        chunks=chunks,
    )

    return inserted


def sync_lab_report_to_qdrant(lab_report_id: str):
    """
    Syncs a lab report from the lab_reports table to Qdrant.
    """
    update_lab_report_rag_status(lab_report_id, "processing")

    try:
        lab = get_lab_report(lab_report_id)
        if not lab:
            raise ValueError("Lab report not found")

        if not lab.get("file_url"):
            raise ValueError("Lab report file_url is missing")

        inserted = ingest_lab_report_from_url(
            patient_id=lab["patient_id"],
            document_id=lab["lab_report_id"],
            file_url=lab["file_url"],
            test_name=lab.get("test_name"),
            uploaded_at=lab.get("uploaded_at"),
        )

        update_lab_report_rag_status(lab_report_id, "indexed")

        return {
            "lab_report_id": lab["lab_report_id"],
            "patient_id": lab["patient_id"],
            "test_name": lab.get("test_name"),
            "chunks_indexed": inserted,
        }

    except Exception as e:
        update_lab_report_rag_status(lab_report_id, "failed", str(e))
        raise