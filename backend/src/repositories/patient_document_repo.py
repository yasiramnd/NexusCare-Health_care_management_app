from src.utils.db import get_conn


def get_lab_report(lab_report_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    lab_report_id,
                    patient_id,
                    doctor_id,
                    lab_id,
                    test_name,
                    file_url,
                    uploaded_at
                FROM lab_reports
                WHERE lab_report_id = %s
                LIMIT 1
                """,
                (lab_report_id,)
            )
            row = cur.fetchone()

        if not row:
            return None

        return {
            "lab_report_id": row[0],
            "patient_id": row[1],
            "doctor_id": row[2],
            "lab_id": row[3],
            "test_name": row[4],
            "file_url": row[5],
            "uploaded_at": str(row[6]) if row[6] else None,
        }
    finally:
        conn.close()


def get_recent_lab_reports(patient_id, limit=10):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    lab_report_id,
                    patient_id,
                    doctor_id,
                    lab_id,
                    test_name,
                    file_url,
                    uploaded_at
                FROM lab_reports
                WHERE patient_id = %s
                ORDER BY uploaded_at DESC
                LIMIT %s
                """,
                (patient_id, limit)
            )
            rows = cur.fetchall()

        return [
            {
                "lab_report_id": row[0],
                "patient_id": row[1],
                "doctor_id": row[2],
                "lab_id": row[3],
                "test_name": row[4],
                "file_url": row[5],
                "uploaded_at": str(row[6]) if row[6] else None,
            }
            for row in rows
        ]
    finally:
        conn.close()