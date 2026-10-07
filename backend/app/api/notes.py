import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Document, DocumentChunk, LearningEvent
from app.schemas.schemas import DocumentResponse, NotesQueryRequest, NotesQueryResponse
from app.api.auth import get_current_user
from app.services.rag_service import rag_service

router = APIRouter(prefix="/notes", tags=["Ask From My Notes (RAG)"])

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        results.append(DocumentResponse(
            id=d.id,
            title=d.title,
            file_name=d.file_name,
            file_size=d.file_size,
            created_at=d.created_at,
            chunks_count=len(d.chunks)
        ))
    return results

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    title: str = Form(...),
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    extracted_text = ""
    file_name = "pasted_notes.txt"
    file_size = 0
    file_type = "text/plain"

    if file:
        file_name = file.filename
        file_type = file.content_type or "application/octet-stream"
        file_path = settings.UPLOAD_DIR / f"{current_user.id}_{file_name}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size = os.path.getsize(file_path)
        
        # Read text content
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Unable to read file text: {e}")
    elif raw_text:
        extracted_text = raw_text
        file_size = len(raw_text.encode('utf-8'))
    else:
        raise HTTPException(status_code=400, detail="Must provide either a file or study notes text.")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Uploaded document contains no readable text content.")

    # 1. Create Document record
    doc = Document(
        user_id=current_user.id,
        title=title,
        file_name=file_name,
        file_size=file_size,
        file_type=file_type
    )
    db.add(doc)
    db.flush()

    # 2. Chunk text
    chunks = rag_service.chunk_text(extracted_text, chunk_size=300, overlap=50)
    for idx, c_text in enumerate(chunks):
        chunk = DocumentChunk(
            document_id=doc.id,
            chunk_index=idx,
            chunk_text=c_text
        )
        db.add(chunk)

    # 3. Log event
    event = LearningEvent(
        user_id=current_user.id,
        event_type="VIEW_NOTE",
        metadata_json=f'{{"doc_title": "{doc.title}", "chunks": {len(chunks)}}}'
    )
    db.add(event)

    db.commit()
    db.refresh(doc)

    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        file_name=doc.file_name,
        file_size=doc.file_size,
        created_at=doc.created_at,
        chunks_count=len(chunks)
    )

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()
    return {"message": "Document and all index chunks removed successfully"}

@router.post("/query", response_model=NotesQueryResponse)
async def query_notes(
    req: NotesQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ask a question against student's uploaded notes."""
    query_builder = db.query(DocumentChunk, Document.title).join(
        Document, DocumentChunk.document_id == Document.id
    ).filter(Document.user_id == current_user.id)

    if req.document_ids:
        query_builder = query_builder.filter(Document.id.in_(req.document_ids))

    all_chunks = query_builder.all()
    if not all_chunks:
        return NotesQueryResponse(
            answer="You have not uploaded any notes yet, or no notes matched your selected filter. Upload a note to query!",
            relevant_chunks=[]
        )

    chunks_data = []
    for chunk, doc_title in all_chunks:
        chunks_data.append({
            "id": chunk.id,
            "document_title": doc_title,
            "chunk_text": chunk.chunk_text
        })

    result = await rag_service.answer_from_notes(req.query, chunks_data)
    return NotesQueryResponse(
        answer=result["answer"],
        relevant_chunks=result["relevant_chunks"]
    )
