import re

FORBIDDEN_PATTERNS = [
    r"\byou have\b",
    r"\byou likely have\b",
    r"\byou definitely have\b",
    r"\bthis is\b.*\b(disease|infection|migraine|heartache|cancer|stroke|flu)\b",
    r"\bstop taking\b",
    r"\bincrease the dose\b",
    r"\bdecrease the dose\b",
    r"\bdouble the dose\b",
    r"\btake \d+ tablets\b",
    r"\bstart taking\b",
    r"\bswitch to\b",
    r"\byou should take\b.*\bmg\b",
]

SAFE_FALLBACK = (
    "I cannot provide medical advice or self-care suggestions. "
    "Please continue your medicines only as already prescribed. "
    "If you have any concerns or your symptoms continue, please contact your doctor."
)


def contains_forbidden_content(text: str) -> bool:
    lowered = (text or "").lower()
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, lowered):
            return True
    return False


def enforce_safe_output(text: str, triage: str):
    if not text:
        return SAFE_FALLBACK

    if contains_forbidden_content(text):
        return SAFE_FALLBACK

    # force escalation language for urgent/emergency
    if triage in ("urgent", "emergency"):
        if "doctor" not in text.lower() and "emergency" not in text.lower():
            text += " Please contact your doctor as soon as possible."

    return text