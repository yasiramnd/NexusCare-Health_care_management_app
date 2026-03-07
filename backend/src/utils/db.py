import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(override=True)

def get_conn():
    return psycopg2.connect(
        host=os.getenv("HOSPITAL_DB_HOST"),
        port=int(os.getenv("HOSPITAL_DB_PORT", 5432)),
        dbname=os.getenv("HOSPITAL_DB_NAME"),
        user=os.getenv("HOSPITAL_DB_USER"),
        password=os.getenv("HOSPITAL_DB_PASSWORD"),
        sslmode="require"
    )