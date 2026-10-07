import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.models.models import User, Doubt, Subject, Answer, AnswerVote, LearningEvent
from app.schemas.schemas import (
    DoubtCreate, DoubtUpdate, DoubtResponse, DoubtListResponse,
    AICategorizeRequest, AICategorizeResponse, AIDiscussionSummaryResponse, AnswerResponse
)
from app.api.auth import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/doubts", tags=["Doubts Community"])

def format_doubt_response(doubt: Doubt, current_user_id: Optional[str] = None) -> DoubtResponse:
    tags_list = []
    if doubt.tags:
        tags_list = [t.strip() for t in doubt.tags.split(",") if t.strip()]

    formatted_answers = []
    for ans in doubt.answers:
        has_upvoted = False
        if current_user_id:
            has_upvoted = any(v.user_id == current_user_id for v in ans.votes)

        formatted_answers.append(AnswerResponse(
            id=ans.id,
            doubt_id=ans.doubt_id,
            author_id=ans.author_id,
            author_name=ans.author.full_name if ans.author else "Community Student",
            author_avatar=ans.author.avatar_url if ans.author else None,
            author_role=ans.author.role if ans.author else "STUDENT",
            content=ans.content,
            is_ai_generated=ans.is_ai_generated,
            is_accepted=ans.is_accepted,
            upvotes_count=ans.upvotes_count,
            has_upvoted=has_upvoted,
            created_at=ans.created_at
        ))

    return DoubtResponse(
        id=doubt.id,
        author_id=doubt.author_id,
        author_name=doubt.author.full_name if doubt.author else "Student",
        author_avatar=doubt.author.avatar_url if doubt.author else None,
        subject_id=doubt.subject_id,
        subject_name=doubt.subject.name if doubt.subject else "Computer Science",
        title=doubt.title,
        description=doubt.description,
        tags=tags_list,
        status=doubt.status,
        ai_category=doubt.ai_category,
        ai_summary=doubt.ai_summary,
        views_count=doubt.views_count,
        answers_count=len(doubt.answers),
        created_at=doubt.created_at,
        updated_at=doubt.updated_at,
        answers=formatted_answers
    )

@router.get("", response_model=DoubtListResponse)
def list_doubts(
    q: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Doubt)
    
    if subject_id:
        query = query.filter(Doubt.subject_id == subject_id)
        
    if status_filter and status_filter.upper() in ["OPEN", "SOLVED"]:
        query = query.filter(Doubt.status == status_filter.upper())

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Doubt.title.ilike(search),
                Doubt.description.ilike(search),
                Doubt.tags.ilike(search)
            )
        )

    total = query.count()
    doubts = query.order_by(Doubt.created_at.desc()).offset(skip).limit(limit).all()
    
    return DoubtListResponse(
        items=[format_doubt_response(d) for d in doubts],
        total=total
    )

@router.post("/categorize", response_model=AICategorizeResponse)
async def ai_categorize(req: AICategorizeRequest):
    result = await ai_service.categorize_doubt(req.title, req.description)
    return AICategorizeResponse(
        category=result.get("category", "Computer Science"),
        suggested_tags=result.get("suggested_tags", []),
        confidence=result.get("confidence", 0.9),
        similar_topics=result.get("similar_topics", [])
    )

@router.post("", response_model=DoubtResponse)
async def create_doubt(
    doubt_in: DoubtCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Moderation check
    mod = await ai_service.moderate_content(f"{doubt_in.title} {doubt_in.description}")
    if mod["is_flagged"]:
        raise HTTPException(
            status_code=400,
            detail=f"Doubt submission blocked: {mod['reason']}"
        )

    # 2. AI Categorization & Tag Suggestion
    ai_cat_result = await ai_service.categorize_doubt(doubt_in.title, doubt_in.description)
    ai_category = ai_cat_result.get("category", "Computer Science")
    
    # Resolve subject_id if not provided
    subject_id = doubt_in.subject_id
    if not subject_id:
        matched_subj = db.query(Subject).filter(Subject.name.ilike(f"%{ai_category}%")).first()
        if matched_subj:
            subject_id = matched_subj.id

    # Combine tags
    combined_tags = set(doubt_in.tags or [])
    for tag in ai_cat_result.get("suggested_tags", []):
        combined_tags.add(tag)

    doubt = Doubt(
        author_id=current_user.id,
        subject_id=subject_id,
        title=doubt_in.title,
        description=doubt_in.description,
        tags=",".join(combined_tags),
        status="OPEN",
        ai_category=ai_category,
        ai_summary=None
    )
    db.add(doubt)
    db.flush()

    # Log learning event
    event = LearningEvent(
        user_id=current_user.id,
        event_type="POST_DOUBT",
        subject_id=subject_id,
        metadata_json=json.dumps({"title": doubt.title, "ai_category": ai_category})
    )
    db.add(event)

    db.commit()
    db.refresh(doubt)
    return format_doubt_response(doubt, current_user.id)

@router.get("/{doubt_id}", response_model=DoubtResponse)
def get_doubt_detail(
    doubt_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(lambda: None)
):
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")
        
    doubt.views_count += 1
    db.commit()
    
    uid = current_user.id if current_user else None
    return format_doubt_response(doubt, uid)

@router.put("/{doubt_id}", response_model=DoubtResponse)
def update_doubt(
    doubt_id: str,
    doubt_in: DoubtUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")
        
    if doubt.author_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to edit this doubt")

    if doubt_in.title is not None:
        doubt.title = doubt_in.title
    if doubt_in.description is not None:
        doubt.description = doubt_in.description
    if doubt_in.status is not None:
        doubt.status = doubt_in.status

    db.commit()
    db.refresh(doubt)
    return format_doubt_response(doubt, current_user.id)

@router.delete("/{doubt_id}")
def delete_doubt(
    doubt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")
        
    if doubt.author_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to delete this doubt")

    db.delete(doubt)
    db.commit()
    return {"message": "Doubt removed successfully"}

@router.post("/{doubt_id}/summarize", response_model=AIDiscussionSummaryResponse)
async def summarize_discussion(
    doubt_id: str,
    db: Session = Depends(get_db)
):
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")
        
    answers_text = [a.content for a in doubt.answers]
    summary_data = await ai_service.summarize_discussion(doubt.title, answers_text)
    
    doubt.ai_summary = summary_data["summary"]
    db.commit()
    
    return AIDiscussionSummaryResponse(
        summary=summary_data["summary"],
        key_points=summary_data.get("key_points", []),
        suggested_solution=summary_data.get("suggested_solution")
    )
