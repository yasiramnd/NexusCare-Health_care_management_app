import psycopg2
from psycopg2.pool import SimpleConnectionPool
from src.auth_service.firebase.config import Config

_hospital_pool = None


def _get_pool():
    global _hospital_pool
    if _hospital_pool is None:
        _hospital_pool = SimpleConnectionPool(1, 10, **Config.HOSPITAL_DB_CONFIG)
    return _hospital_pool


def get_hospital_conn():
    return _get_pool().getconn()


def put_hospital_conn(conn):
    _get_pool().putconn(conn)