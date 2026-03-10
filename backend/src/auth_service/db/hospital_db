import psycopg2
from src.auth_service.firebase.config import Config


def get_hospital_conn():
    return psycopg2.connect(**Config.HOSPITAL_DB_CONFIG)


def put_hospital_conn(conn):
    if conn:
        conn.close()
