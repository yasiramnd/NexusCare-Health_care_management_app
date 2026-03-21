import logging
import uuid
from src.services.supabase_storage_service import list_all_files_recursively, SUPABASE_STORAGE_BUCKET, SUPABASE_URL
from src.services.lab_upload_ingestion_service import trigger_rag_ingestion_async

logger = logging.getLogger(__name__)

def discover_and_ingest_all_pdfs(bucket_name: str = SUPABASE_STORAGE_BUCKET):
    """
    Finds all PDFs in the storage bucket and triggers RAG ingestion for those
    matching the expected path structure.
    """
    logger.info("Starting bulk discovery in bucket: %s", bucket_name)
    
    try:
        files = list_all_files_recursively(bucket_name)
        logger.info("Found %d total objects in storage", len(files))
        
        pdf_count = 0
        triggered_count = 0
        
        for file_info in files:
            full_path = file_info.get("full_path", "")
            if not full_path.lower().endswith(".pdf"):
                continue
            
            pdf_count += 1
            
            # Heuristic for patient_id extraction
            # Path formats:
            # 1. patients/{patient_id}/labs/{filename}
            # 2. {patient_id}/lab-reports/{patient_id}/{filename} (from user screenshot)
            
            segments = full_path.split("/")
            patient_id = None
            
            if len(segments) >= 2:
                if segments[0] == "patients":
                    patient_id = segments[1]
                else:
                    # Assume first segment is patient_id if not 'patients'
                    patient_id = segments[0]
            
            if not patient_id:
                logger.warning("Could not determine patient_id for path: %s", full_path)
                continue
            
            # Construct public URL
            file_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{full_path}"
            
            # Use part of filename or a hash of path as request_id if we don't have one
            # Ideally we want this to be stable so we don't double-index
            # We can use a uuid5 based on the full path
            request_id = str(uuid.uuid5(uuid.NAMESPACE_URL, file_url))
            
            logger.info("Triggering ingestion for patient %s: %s", patient_id, full_path)
            
            trigger_rag_ingestion_async(
                file_url=file_url,
                patient_id=patient_id,
                request_id=request_id,
                test_name="Bulk Discovery Sync"
            )
            triggered_count += 1
            
        return {
            "total_objects": len(files),
            "pdfs_found": pdf_count,
            "ingestions_triggered": triggered_count
        }
        
    except Exception as e:
        logger.exception("Bulk discovery failed")
        return {"error": str(e)}
