from flask import Blueprint, request, jsonify
from src.services.patient_chat_service import handle_patient_chat

patient_chat_bp = Blueprint("patient_chat", __name__)

@patient_chat_bp.post("/patient/chat/message")
def patient_chat_message():
    data = request.get_json(silent=True) or {}

    patient_id = (data.get("patient_id") or "").strip()
    message = (data.get("message") or "").strip()

    if not patient_id:
        return jsonify({"error": "patient_id is required"}), 400

    if not message:
        return jsonify({"error": "message is required"}), 400

    try:
        result = handle_patient_chat(patient_id, message)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({
            "error": "CHATBOT_INTERNAL_ERROR",
            "message": str(e)
        }), 500