import psycopg2
from psycopg2.pool import SimpleConnectionPool
from src.auth_service.firebase.config import Config

_auth_pool = None


def _get_pool():
    global _auth_pool
    if _auth_pool is None:
        _auth_pool = SimpleConnectionPool(1, 10, **Config.AUTH_DB_CONFIG)
    return _auth_pool


def get_auth_conn():
    return _get_pool().getconn()


def put_auth_conn(conn):
    _get_pool().putconn(conn)