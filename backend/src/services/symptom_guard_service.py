from datetime import date

EMERGENCY_KEYWORDS = [
    "chest pain",
    "trouble breathing",
    "difficulty breathing",
    "shortness of breath",
    "stroke",
    "cannot move",
    "seizure",
    "fainted",
    "unconscious",
    "severe bleeding",
    "suicidal",
    "allergic reaction",
    "heartache",
]

URGENT_KEYWORDS = [
    "severe headache",
    "blurred vision",
    "vomiting",
    "high fever",
    "worsening pain",
    "dizzy",
    "dizziness",
    "rash after medicine",
    "side effect",
    "swelling",
    "persistent headache",
]

ROUTINE_KEYWORDS = [
    "headache",
    "nausea",
    "sore throat",
    "tired",
    "fatigue",
    "mild cough",
    "runny nose",
]


def classify_symptom_risk(message: str):
    text = (message or "").lower()

    emergency_hits = [k for k in EMERGENCY_KEYWORDS if k in text]
    if emergency_hits:
        return {
            "level": "emergency",
            "red_flags": emergency_hits
        }

    urgent_hits = [k for k in URGENT_KEYWORDS if k in text]
    if urgent_hits:
        return {
            "level": "urgent",
            "red_flags": urgent_hits
        }

    routine_hits = [k for k in ROUTINE_KEYWORDS if k in text]
    return {
        "level": "routine" if routine_hits else "general",
        "red_flags": routine_hits
    }


def build_safe_fallback(triage_level, red_flags, patient_profile):
    chronic_conditions = patient_profile.get("chronic_conditions") or "your medical history"

    if triage_level == "emergency":
        answer = (
            "Your symptoms may include warning signs that need urgent medical attention. "
            "Please seek emergency care immediately or call emergency services."
        )
    else:
        answer = (
            f"Because of your symptoms and your health background ({chronic_conditions}), "
            "it would be safest to contact your doctor as soon as possible. "
            "In the meantime, rest, stay hydrated, and continue only your already prescribed medicines as directed."
        )

    return {
        "answer": answer,
        "triage": triage_level,
        "should_contact_doctor": True,
        "red_flags": red_flags
    }