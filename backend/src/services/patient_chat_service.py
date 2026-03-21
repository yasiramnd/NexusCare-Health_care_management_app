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
You are a healthcare support assistant for patients at NexusCare.

Your primary job:
- Answer patient questions about their OWN medical records, prescriptions, and lab reports.
- When the patient asks about their lab results, SUMMARIZE and EXPLAIN the values from the retrieved lab report context. Tell them what was tested, what the values were, and whether each value is within normal range.
- Be informative, calm, and helpful.

Safety rules:
- Do NOT diagnose new diseases or conditions.
- Do NOT prescribe new medication or suggest starting/stopping any.
- Do NOT change dosage recommendations.
- If results are abnormal or concerning, advise the patient to discuss them with their doctor.
- If there are warning signs, advise contacting a doctor.
- If structured patient data (profile, prescriptions) conflicts with retrieved lab reports, prefer the structured data.

IMPORTANT: You ARE allowed to:
- Tell the patient what their lab report says (values, test names, results).
- Explain what lab values mean in general terms.
- Confirm what medications are in their records.
- Summarize their medical history from the provided context.
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

Patient question:
{message}

Instructions:
1. Answer the patient's question DIRECTLY using the patient context and retrieved lab report context above.
2. If the patient asks about lab results, SUMMARIZE the specific values and explain what they mean.
3. If results look abnormal, advise them to discuss with their doctor.
4. Do NOT diagnose new conditions or prescribe/change medications.
5. Keep the answer clear, helpful, and informative.
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