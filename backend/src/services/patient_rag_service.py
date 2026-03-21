import os
from uuid import uuid5, NAMESPACE_URL

from qdrant_client.models import (
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    FilterSelector,
)

from src.services.embedding_service import embed_text, get_embedding_dimension
from src.services.qdrant_client_service import get_qdrant_client, ensure_collection

QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "nexuscare_patient_docs")


def _make_chunk_id(document_id: str, chunk_index: int) -> str:
    return str(uuid5(NAMESPACE_URL, f"{document_id}:{chunk_index}"))


def delete_document_chunks(document_id: str):
    # Ensure collection and indexes exist before filtering by document_id
    ensure_collection(get_embedding_dimension())
    
    client = get_qdrant_client()
    client.delete(
        collection_name=QDRANT_COLLECTION,
        points_selector=FilterSelector(
            filter=Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            )
        ),
        wait=True,
    )


def upsert_document_chunks(
    *,
    patient_id: str,
    document_id: str,
    document_type: str,
    test_name: str | None,
    source_file_url: str,
    uploaded_at: str | None,
    chunks: list[str],
):
    if not patient_id:
        raise ValueError("patient_id is required")
    if not document_id:
        raise ValueError("document_id is required")
    if not chunks:
        return 0

    ensure_collection(get_embedding_dimension())
    client = get_qdrant_client()

    points = []
    for idx, chunk in enumerate(chunks):
        points.append(
            PointStruct(
                id=_make_chunk_id(document_id, idx),
                vector=embed_text(chunk),
                payload={
                    "patient_id": patient_id,
                    "document_id": document_id,
                    "document_type": document_type,
                    "test_name": test_name,
                    "source_file_url": source_file_url,
                    "uploaded_at": uploaded_at,
                    "chunk_index": idx,
                    "text": chunk,
                },
            )
        )

    client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=points,
        wait=True,
    )
    return len(points)


def search_patient_knowledge(patient_id: str, query: str, limit: int = 5):
    client = get_qdrant_client()

    results = client.query_points(
        collection_name=QDRANT_COLLECTION,
        query=embed_text(query),
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="patient_id",
                    match=MatchValue(value=patient_id),
                )
            ]
        ),
        limit=limit,
        with_payload=True,
    ).points

    output = []
    for item in results:
        payload = item.payload or {}
        output.append({
            "score": item.score,
            "document_id": payload.get("document_id"),
            "document_type": payload.get("document_type"),
            "test_name": payload.get("test_name"),
            "source_file_url": payload.get("source_file_url"),
            "uploaded_at": payload.get("uploaded_at"),
            "text": payload.get("text"),
        })

    return output