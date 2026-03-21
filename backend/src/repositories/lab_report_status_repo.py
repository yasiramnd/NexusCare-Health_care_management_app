from src.utils.db import get_conn


def update_lab_report_rag_status(lab_report_id, status, error=None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if status == "indexed":
                cur.execute(
                    """
                    UPDATE lab_reports
                    SET rag_status = %s,
                        rag_error = %s,
                        rag_indexed_at = NOW()
                    WHERE lab_report_id = %s
                    """,
                    (status, error, lab_report_id),
                )
            else:
                cur.execute(
                    """
                    UPDATE lab_reports
                    SET rag_status = %s,
                        rag_error = %s
                    WHERE lab_report_id = %s
                    """,
                    (status, error, lab_report_id),
                )
        conn.commit()
    finally:
        conn.close()