from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
from app.config import Config

# Pool connects to Supabase ap-southeast-2 (HOSPITAL_DB_*)
# Tables used: users, doctor, patient, lab, appointment, availability,
#              medical_record, prescription, lab_reports,
#              emergency_profile, normal_order, priority_order
hospital_pool = SimpleConnectionPool(
    1, 10,
    cursor_factory=RealDictCursor,
    **Config.HOSPITAL_DB_CONFIG
)


def get_hospital_conn():
    return hospital_pool.getconn()


def put_hospital_conn(conn):
    hospital_pool.putconn(conn)
