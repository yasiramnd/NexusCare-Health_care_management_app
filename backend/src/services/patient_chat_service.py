from src.services.symptom_guard_service import classify_symptom_risk, build_safe_fallback
from src.services.llm_service import generate_chat_response
from src.services.output_filter_service import enforce_safe_output
from src.services.patient_rag_service import search_patient_knowledge
from src.repositories.patient_context_repo import (
    get_patient_profile,
    get_recent_medical_history,
    get_recent_prescriptions,
)


SYSTEM_PROMPT = """
You are a healthcare support assistant for patients.

Strict safety rules:
- Do not diagnose any disease or condition.
- Do not prescribe new medication.
- Do not change dosage.
- Do not tell the patient to stop any medication.
- Only advise contacting a doctor or seeking medical help.
- Use only the patient context provided.
- If there are warning signs, advise urgent care or contacting a doctor.
- Keep answers short, calm, and safety-focused.
- Do not mention treatments not already in the patient record.
- Use retrieved lab-report content only as supporting context.
- If structured patient data conflicts with retrieved lab-report content, prefer structured patient data.
"""


def format_context(profile, history, prescriptions):
    meds = []
    for p in prescriptions:
        meds.append(
            f"- {p['medicine_name']} | dosage: {p['dosage']} | frequency: {p['frequency']} | status: {p['status']}"
        )
    meds_text = "\n".join(meds) if meds else "No recent prescriptions recorded."

    recent_visits = []
    for h in history:
        recent_visits.append(
            f"- Visit date: {h['visit_date']} | diagnosis: {h['diagnosis']} | notes: {h['notes']}"
        )
    visits_text = "\n".join(recent_visits) if recent_visits else "No recent medical history recorded."

    return f"""
Patient context:
- Patient ID: {profile.get("patient_id")}
- Age: {profile.get("age")}
- Gender: {profile.get("gender")}
- Allergies: {profile.get("allergies") or "None recorded"}
- Chronic conditions: {profile.get("chronic_conditions") or "None recorded"}

Recent prescriptions:
{meds_text}

Recent medical history:
{visits_text}
""".strip()


def format_rag_context(rag_chunks):
    if not rag_chunks:
        return "No matching lab report content found."

    lines = []
    for item in rag_chunks[:5]:
        lines.append(
            f"- [type={item.get('document_type')} | test_name={item.get('test_name')} | "
            f"document_id={item.get('document_id')} | score={round(item.get('score', 0), 3)}] "
            f"{item.get('text')}"
        )
    return "\n".join(lines)


def build_user_prompt(message, profile, history, prescriptions, triage, rag_chunks):
    context = format_context(profile, history, prescriptions)
    rag_text = format_rag_context(rag_chunks)

    return f"""
{context}

Retrieved lab report context:
{rag_text}

Triage level: {triage["level"]}
Detected red flags: {", ".join(triage["red_flags"]) if triage["red_flags"] else "None"}

Patient message:
{message}

Respond with:
1. A direct answer based ONLY on the structured patient context and retrieved lab report context.
2. Warning signs to watch for.
3. When to contact a doctor.

Rules:
- Do not diagnose.
- Do not change medication dosage.
- Do not prescribe new treatment.
- Do not recommend starting or stopping medicine.
- Prefer structured patient data over retrieved lab report text if there is any conflict.
""".strip()


def handle_patient_chat(patient_id, message):
    profile = get_patient_profile(patient_id)
    if not profile:
        raise ValueError("Patient not found")

    triage = classify_symptom_risk(message)

    if triage["level"] in ("emergency", "urgent"):
        result = build_safe_fallback(triage["level"], triage["red_flags"], profile)
        result["context_used"] = {
            "used_profile": True,
            "used_history": False,
            "used_prescriptions": False,
            "used_rag": False,
        }
        return result

    history = get_recent_medical_history(patient_id, limit=3)
    prescriptions = get_recent_prescriptions(patient_id, limit=5)
    rag_chunks = search_patient_knowledge(patient_id=patient_id, query=message, limit=5)

    user_prompt = build_user_prompt(
        message=message,
        profile=profile,
        history=history,
        prescriptions=prescriptions,
        triage=triage,
        rag_chunks=rag_chunks,
    )

    raw_answer = generate_chat_response(SYSTEM_PROMPT, user_prompt)
    safe_answer = enforce_safe_output(raw_answer, triage["level"])

    return {
        "answer": safe_answer,
        "triage": triage["level"],
        "should_contact_doctor": True,
        "red_flags": triage["red_flags"],
        "context_used": {
            "used_profile": True,
            "used_history": len(history) > 0,
            "used_prescriptions": len(prescriptions) > 0,
            "used_rag": len(rag_chunks) > 0,
        }
    }