import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "lab-report")

_supabase = None


def get_supabase_client() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase


def normalize_storage_path(file_url: str) -> str:
    """
    Accepts either:
    - full public/storage URL
    - raw storage path like: patients/p123/labs/file.pdf
    Returns the path relative to the bucket.
    """
    if not file_url:
        raise ValueError("file_url is required")

    marker = f"/object/public/{SUPABASE_STORAGE_BUCKET}/"
    if marker in file_url:
        return file_url.split(marker, 1)[1]

    marker = f"/object/sign/{SUPABASE_STORAGE_BUCKET}/"
    if marker in file_url:
        return file_url.split(marker, 1)[1].split("?", 1)[0]

    marker = f"/object/{SUPABASE_STORAGE_BUCKET}/"
    if marker in file_url:
        return file_url.split(marker, 1)[1].split("?", 1)[0]

    return file_url.lstrip("/")


def upload_pdf_to_storage(file_bytes: bytes, patient_id: str, filename: str) -> str:
    """Upload a PDF to Supabase storage and return the storage path."""
    import uuid as _uuid

    safe_name = f"{_uuid.uuid4().hex}_{filename}"
    storage_path = f"patients/{patient_id}/labs/{safe_name}"

    client = get_supabase_client()
    client.storage.from_(SUPABASE_STORAGE_BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": "application/pdf"},
    )

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{storage_path}"
    return public_url


def download_pdf_from_storage(file_url: str) -> bytes:
    client = get_supabase_client()
    file_path = normalize_storage_path(file_url)
    content = client.storage.from_(SUPABASE_STORAGE_BUCKET).download(file_path)

    if not content:
        raise ValueError("Downloaded file is empty")

    return content


def list_all_files_recursively(bucket_name: str, prefix: str = "") -> list[dict]:
    """
    Recursively list all files in a Supabase storage bucket.
    Returns a list of dicts with 'name', 'id', 'updated_at', 'metadata', and 'full_path'.
    """
    client = get_supabase_client()
    all_files = []
    folders_to_process = [prefix]

    while folders_to_process:
        current_folder = folders_to_process.pop(0)
        
        # list() returns both files and folders
        items = client.storage.from_(bucket_name).list(current_folder, {"limit": 1000})

        for item in items:
            item_name = item.get("name")
            if not item_name or item_name == ".emptyFolderPlaceholder":
                continue

            full_path = f"{current_folder}/{item_name}".lstrip("/")
            
            # If it's a folder, it won't have metadata/id in many Supabase client versions
            # Or item.get('id') is None
            if item.get("id") is None:
                folders_to_process.append(full_path)
            else:
                # It's a file
                item["full_path"] = full_path
                all_files.append(item)

    return all_files