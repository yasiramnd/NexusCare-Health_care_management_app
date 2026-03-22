from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
from app.config import Config

# Pool connects to Supabase ap-south-1 (AUTH_DB_*)
# Table used: credentials (user_id, firebase_uid, role, is_active)


auth_pool = SimpleConnectionPool(
    1, 2,  # ✅ reduce connections (VERY IMPORTANT)

    host="aws-1-ap-south-1.pooler.supabase.com",
    database="postgres",
    user="postgres.bdlneidslgoshrmbtqwz",
    password="behjg7r9YTF@#",  # 🔴 put your real password here
    port=5432,
    sslmode="require"
)

def get_auth_conn():
    return auth_pool.getconn()


def put_auth_conn(conn):
    auth_pool.putconn(conn)
