import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "nexuscare_patient_docs")

_client = None


def get_qdrant_client() -> QdrantClient:
    global _client
    if _client is None:
        if not QDRANT_URL or not QDRANT_API_KEY:
            raise ValueError("QDRANT_URL and QDRANT_API_KEY must be set")
        _client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
            timeout=30,
        )
    return _client


def ensure_collection(vector_size: int):
    client = get_qdrant_client()
    existing = {c.name for c in client.get_collections().collections}
    
    if QDRANT_COLLECTION not in existing:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE,
            ),
        )
        
    # Ensure payload indexes for filtering fields
    # These calls are idempotent in modern qdrant-client
    client.create_payload_index(
        collection_name=QDRANT_COLLECTION,
        field_name="patient_id",
        field_schema=PayloadSchemaType.KEYWORD,
    )
    client.create_payload_index(
        collection_name=QDRANT_COLLECTION,
        field_name="document_id",
        field_schema=PayloadSchemaType.KEYWORD,
    )