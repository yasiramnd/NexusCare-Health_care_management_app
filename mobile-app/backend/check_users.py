import psycopg2
from app.db.auth_db import auth_pool
from psycopg2.extras import RealDictCursor

def check_users():
    try:
        conn = auth_pool.getconn()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT user_id, email, role, is_active FROM credentials ORDER BY user_id DESC LIMIT 5")
            users = cur.fetchall()
            for user in users:
                print(user)
        auth_pool.putconn(conn)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
