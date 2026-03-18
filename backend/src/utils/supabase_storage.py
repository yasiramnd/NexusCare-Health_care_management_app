import os
from typing import Optional, Tuple
from urllib.parse import quote

import requests


class SupabaseStorageError(RuntimeError):
    pass


def _infer_supabase_url_from_env() -> str:
    # Example DB users: postgres.<project_ref>
    for env_name in ("HOSPITAL_DB_USER", "AUTH_DB_USER"):
        user = (os.getenv(env_name) or "").strip()
        if user.startswith("postgres.") and len(user.split(".", 1)) == 2:
            project_ref = user.split(".", 1)[1].strip()
            if project_ref:
                return f"https://{project_ref}.supabase.co"
    return ""


def _get_supabase_config() -> Tuple[str, str]:
    base_url = ((os.getenv("SUPABASE_URL") or "").strip().rstrip("/")) or _infer_supabase_url_from_env()
    api_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or ""
    ).strip()

    if not base_url:
        raise SupabaseStorageError(
            "Supabase URL is not configured. Set SUPABASE_URL or provide HOSPITAL_DB_USER/AUTH_DB_USER in format postgres.<project_ref>."
        )
    if not api_key:
        raise SupabaseStorageError(
            "Supabase Storage key is not configured. Set SUPABASE_SERVICE_ROLE_KEY."
        )
    return base_url, api_key


def upload_bytes(bucket: str, object_path: str, data: bytes, content_type: str) -> str:
    base_url, api_key = _get_supabase_config()
    encoded_path = quote(object_path.lstrip("/"), safe="/")
    endpoint = f"{base_url}/storage/v1/object/{bucket}/{encoded_path}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "apikey": api_key,
        "Content-Type": content_type or "application/octet-stream",
        "x-upsert": "true",
    }
    resp = requests.post(endpoint, headers=headers, data=data, timeout=45)
    if resp.status_code >= 400:
        raise SupabaseStorageError(f"Supabase upload failed ({resp.status_code}): {resp.text}")

    sign_endpoint = f"{base_url}/storage/v1/object/sign/{bucket}/{encoded_path}"
    sign_resp = requests.post(
        sign_endpoint,
        headers={
            "Authorization": f"Bearer {api_key}",
            "apikey": api_key,
            "Content-Type": "application/json",
        },
        json={"expiresIn": 315360000},  # 10 years
        timeout=30,
    )
    if sign_resp.status_code < 400:
        signed = (sign_resp.json() or {}).get("signedURL")
        if signed:
            if signed.startswith("http"):
                return signed
            return f"{base_url}/storage/v1{signed}"

    # Fallback to public URL in case signed URL generation is not available.
    return f"{base_url}/storage/v1/object/public/{bucket}/{encoded_path}"


def extract_object_path_from_url(bucket: str, file_url: str) -> Optional[str]:
    url = (file_url or "").strip()
    if not url:
        return None

    public_marker = f"/storage/v1/object/public/{bucket}/"
    signed_marker = f"/storage/v1/object/sign/{bucket}/"

    if public_marker in url:
        return url.split(public_marker, 1)[1].split("?", 1)[0]
    if signed_marker in url:
        return url.split(signed_marker, 1)[1].split("?", 1)[0]
    return None


def download_bytes(bucket: str, object_path: str) -> Tuple[bytes, str]:
    base_url, api_key = _get_supabase_config()
    encoded_path = quote(object_path.lstrip("/"), safe="/")
    endpoint = f"{base_url}/storage/v1/object/{bucket}/{encoded_path}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "apikey": api_key,
    }
    resp = requests.get(endpoint, headers=headers, timeout=45)
    if resp.status_code >= 400:
        raise SupabaseStorageError(f"Supabase download failed ({resp.status_code}): {resp.text}")

    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def object_exists(bucket: str, object_path: str) -> bool:
    base_url, api_key = _get_supabase_config()
    encoded_path = quote(object_path.lstrip("/"), safe="/")
    endpoint = f"{base_url}/storage/v1/object/info/{bucket}/{encoded_path}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "apikey": api_key,
    }
    resp = requests.get(endpoint, headers=headers, timeout=20)
    if resp.status_code == 404:
        return False
    if resp.status_code >= 400:
        raise SupabaseStorageError(f"Supabase object info failed ({resp.status_code}): {resp.text}")

    return True
