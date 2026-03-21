import uuid
from flask import Blueprint, request, jsonify
from src.services.lab_report_ingestion_service import sync_lab_report_to_qdrant, ingest_lab_report_from_url
from src.services.bulk_ingestion_service import discover_and_ingest_all_pdfs


rag_sync_bp = Blueprint("rag_sync", __name__)


@rag_sync_bp.post("/admin/rag/sync-lab-report")
def sync_lab_report():
    data = request.get_json(silent=True) or {}
    lab_report_id = (data.get("lab_report_id") or "").strip()

    if not lab_report_id:
        return jsonify({"error": "lab_report_id is required"}), 400

    try:
        result = sync_lab_report_to_qdrant(lab_report_id)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({
            "error": "LAB_REPORT_SYNC_ERROR",
            "message": str(e),
        }), 500


@rag_sync_bp.post("/admin/rag/sync-object")
def sync_object():
    """
    Manually sync a PDF object from Supabase to RAG.
    Requires: patient_id, file_url (full public or storage URL)
    Optional: document_id, test_name
    """
    data = request.get_json(silent=True) or {}
    patient_id = data.get("patient_id")
    file_url = data.get("file_url")
    document_id = data.get("document_id") or f"manual-{uuid.uuid4().hex[:8]}"
    test_name = data.get("test_name") or "Manual Sync"

    if not patient_id or not file_url:
        return jsonify({"error": "patient_id and file_url are required"}), 400

    try:
        inserted = ingest_lab_report_from_url(
            patient_id=patient_id,
            document_id=document_id,
            file_url=file_url,
            test_name=test_name
        )
        return jsonify({
            "message": "Object synced to RAG",
            "document_id": document_id,
            "chunks_indexed": inserted
        }), 200
    except Exception as e:
        return jsonify({
            "error": "SYNC_OBJECT_ERROR",
            "message": str(e)
        }), 500


@rag_sync_bp.post("/admin/rag/bulk-sync")
def bulk_sync():
    """
    Discovery and sync all PDFs from the bucket to Qdrant.
    """
    try:
        results = discover_and_ingest_all_pdfs()
        return jsonify({
            "message": "Bulk sync triggered",
            "results": results
        }), 200
    except Exception as e:
        return jsonify({
            "error": "BULK_SYNC_ERROR",
            "message": str(e)
        }), 500