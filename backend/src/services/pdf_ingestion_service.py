from src.repositories.patient_document_repo import get_patient_document
from src.services.supabase_storage_service import download_pdf_from_storage
from src.services.pdf_text_service import extract_text_from_pdf_bytes
from src.services.text_chunker_service import chunk_text
from src.services.patient_rag_service import (
    delete_document_chunks,
    upsert_document_chunks,
)


def sync_patient_pdf_to_qdrant(patient_document_id: str):
    doc = get_patient_document(patient_document_id)
    if not doc:
        raise ValueError("Patient document not found")

    if doc.get("mime_type") != "application/pdf":
        raise ValueError("Only PDF documents are supported")

    if not doc.get("file_path"):
        raise ValueError("Patient document file_path is missing")

    pdf_bytes = download_pdf_from_storage(doc["file_path"])
    extracted_text = extract_text_from_pdf_bytes(pdf_bytes)

    if not extracted_text.strip():
        raise ValueError("Could not extract text from PDF")

    chunks = chunk_text(extracted_text)

    delete_document_chunks(doc["patient_document_id"])

    inserted = upsert_document_chunks(
        patient_id=doc["patient_id"],
        document_id=doc["patient_document_id"],
        document_type="pdf_report",
        test_name=doc.get("title"),
        source_file_url=doc["file_path"],
        uploaded_at=doc.get("created_at"),
        chunks=chunks,
    )

    return {
        "patient_document_id": doc["patient_document_id"],
        "patient_id": doc["patient_id"],
        "chunks_indexed": inserted,
    }