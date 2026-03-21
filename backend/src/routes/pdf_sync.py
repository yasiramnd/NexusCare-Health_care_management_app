from flask import Blueprint, request, jsonify
from src.services.pdf_ingestion_service import sync_patient_pdf_to_qdrant

rag_sync_bp = Blueprint("rag_sync", __name__)

@rag_sync_bp.post("/admin/rag/sync-pdf")
def sync_pdf():
    data = request.get_json(silent=True) or {}
    patient_document_id = (data.get("patient_document_id") or "").strip()

    if not patient_document_id:
        return jsonify({"error": "patient_document_id is required"}), 400

    try:
        result = sync_patient_pdf_to_qdrant(patient_document_id)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({
            "error": "PDF_SYNC_ERROR",
            "message": str(e)
        }), 500