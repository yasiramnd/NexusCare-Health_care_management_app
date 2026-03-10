import psycopg2
from src.auth_service.firebase.config import Config


def get_auth_conn():
    return psycopg2.connect(**Config.AUTH_DB_CONFIG)


def put_auth_conn(conn):
    if conn:
        conn.close()
