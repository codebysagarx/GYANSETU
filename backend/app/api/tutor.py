import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, ChatSession, ChatMessage, LearningEvent
from app.schemas.schemas import ChatSessionCreate, ChatSessionResponse, ChatMessageCreate, ChatMessageResponse
from app.api.auth import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()
    return sessions

@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(
    session_in: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = ChatSession(
        user_id=current_user.id,
        title=session_in.title or "Academic Chat",
        mode=session_in.mode or "academic"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session_detail(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted successfully"}

@router.post("/sessions/{session_id}/image", response_model=ChatMessageResponse)
async def analyze_tutor_image(
    session_id: str,
    image: UploadFile = File(...),
    mode: str = Form("explain"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    if not (image.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")
    answer = await ai_service.analyze_doubt_image(await image.read(), image.content_type, mode)
    msg = ChatMessage(session_id=session.id, role="assistant", content=answer, metadata_json=json.dumps({"mode": mode, "image_question": True}))
    db.add(msg); db.commit(); db.refresh(msg)
    return msg

@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_message(
    session_id: str,
    msg_in: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    mode = msg_in.mode or session.mode or "academic"
    session.mode = mode

    # 1. Save student's message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=msg_in.content
    )
    db.add(user_msg)
    db.flush()

    # Update session title dynamically if it's the first question
    if len(session.messages) <= 1:
        session.title = msg_in.content[:40] + ("..." if len(msg_in.content) > 40 else "")

    # 2. Gather conversation history for context
    history = []
    for m in session.messages[-6:]:
        history.append({"role": m.role, "content": m.content})

    # 3. Generate AI Tutor response
    ai_content = await ai_service.generate_tutor_response(
        message=msg_in.content,
        mode=mode,
        history=history
    )

    # 4. Save AI's response
    assistant_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=ai_content,
        metadata_json=json.dumps({"mode": mode})
    )
    db.add(assistant_msg)

    # 5. Log learning event
    event = LearningEvent(
        user_id=current_user.id,
        event_type="ASK_TUTOR",
        metadata_json=json.dumps({"topic": session.title, "mode": mode})
    )
    db.add(event)

    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg
