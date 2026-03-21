from datetime import date
from src.utils.db import get_conn


def calculate_age(dob):
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def get_patient_profile(patient_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    p.patient_id,
                    p.date_of_birth,
                    p.gender,
                    ep.chronic_conditions,
                    ep.allergies
                FROM patient p
                LEFT JOIN emergency_profile ep
                    ON ep.patient_id = p.patient_id
                WHERE p.patient_id = %s
                LIMIT 1
            """, (patient_id,))
            row = cur.fetchone()

        if not row:
            return None

        return {
            "patient_id": row[0],
            "age": calculate_age(row[1]),
            "gender": row[2],
            "chronic_conditions": row[3],
            "allergies": row[4],
        }
    finally:
        conn.close()


def get_recent_medical_history(patient_id, limit=3):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT record_id, diagnosis, notes, visit_date
                FROM medical_record
                WHERE patient_id = %s
                ORDER BY visit_date DESC, created_at DESC
                LIMIT %s
            """, (patient_id, limit))
            rows = cur.fetchall()

        results = []
        for row in rows:
            results.append({
                "record_id": row[0],
                "diagnosis": row[1],
                "notes": row[2],
                "visit_date": str(row[3]) if row[3] else None,
            })
        return results
    finally:
        conn.close()


def get_recent_prescriptions(patient_id, limit=5):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    p.prescription_id,
                    p.medicine_name,
                    p.dosage,
                    p.frequency,
                    p.status,
                    p.created_at
                FROM prescription p
                JOIN medical_record mr
                    ON mr.record_id = p.record_id
                WHERE mr.patient_id = %s
                ORDER BY p.created_at DESC
                LIMIT %s
            """, (patient_id, limit))
            rows = cur.fetchall()

        results = []
        for row in rows:
            results.append({
                "prescription_id": row[0],
                "medicine_name": row[1],
                "dosage": row[2],
                "frequency": row[3],
                "status": row[4],
                "created_at": str(row[5]) if row[5] else None,
            })
        return results
    finally:
        conn.close()