import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

def check_tables():
    config = {
        "host":     os.getenv("HOSPITAL_DB_HOST"),
        "port":     os.getenv("HOSPITAL_DB_PORT", 5432),
        "dbname":   os.getenv("HOSPITAL_DB_NAME"),
        "user":     os.getenv("HOSPITAL_DB_USER"),
        "password": os.getenv("HOSPITAL_DB_PASSWORD"),
    }
    
    try:
        conn = psycopg2.connect(**config, cursor_factory=RealDictCursor)
        with conn.cursor() as cur:
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
            tables = [row['table_name'] for row in cur.fetchall()]
            print(f"Tables: {tables}")
            
            if 'availability' in tables:
                cur.execute("SELECT count(*) FROM availability;")
                print(f"availability count: {cur.fetchone()['count']}")
                
            if 'doctr_availablity' in tables:
                cur.execute("SELECT count(*) FROM doctr_availablity;")
                print(f"doctr_availablity count: {cur.fetchone()['count']}")
                
            # Also check columns of both if they exist
            for t in ['availability', 'doctr_availablity']:
                if t in tables:
                    cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{t}';")
                    cols = [row['column_name'] for row in cur.fetchall()]
                    print(f"Columns of {t}: {cols}")
                    
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tables()
