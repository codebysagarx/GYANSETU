import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Doubt, Answer, AnswerVote, LearningEvent
from app.schemas.schemas import AnswerCreate, AnswerResponse
from app.api.auth import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(tags=["Answers & Community Interaction"])

def format_answer(ans: Answer, current_user_id: str) -> AnswerResponse:
    has_upvoted = any(v.user_id == current_user_id for v in ans.votes) if current_user_id else False
    return AnswerResponse(
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
    )

@router.post("/doubts/{doubt_id}/answers", response_model=AnswerResponse)
async def post_answer(
    doubt_id: str,
    ans_in: AnswerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")

    # Moderation check
    mod = await ai_service.moderate_content(ans_in.content)
    if mod["is_flagged"]:
        raise HTTPException(status_code=400, detail=f"Answer blocked: {mod['reason']}")

    answer = Answer(
        doubt_id=doubt.id,
        author_id=current_user.id,
        content=ans_in.content,
        is_ai_generated=False,
        is_accepted=False,
        upvotes_count=0
    )
    db.add(answer)
    db.flush()

    # Log learning event
    event = LearningEvent(
        user_id=current_user.id,
        event_type="POST_ANSWER",
        subject_id=doubt.subject_id,
        metadata_json=json.dumps({"doubt_id": doubt.id, "doubt_title": doubt.title})
    )
    db.add(event)

    db.commit()
    db.refresh(answer)
    return format_answer(answer, current_user.id)

@router.post("/doubts/{doubt_id}/ask-ai", response_model=AnswerResponse)
async def ask_ai_on_doubt(
    doubt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a step-by-step AI explanation directly on a community doubt."""
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")

    # Check if AI has already answered
    existing_ai = db.query(Answer).filter(
        Answer.doubt_id == doubt.id,
        Answer.is_ai_generated == True
    ).first()
    if existing_ai:
        return format_answer(existing_ai, current_user.id)

    # Generate answer using AI service
    subject_name = doubt.subject.name if doubt.subject else (doubt.ai_category or "Computer Science")
    ai_solution = await ai_service.generate_doubt_solution(
        title=doubt.title,
        description=doubt.description,
        subject=subject_name
    )

    answer = Answer(
        doubt_id=doubt.id,
        author_id=current_user.id,
        content=ai_solution,
        is_ai_generated=True,
        is_accepted=False,
        upvotes_count=1
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return format_answer(answer, current_user.id)

@router.post("/answers/{answer_id}/upvote")
def toggle_upvote(
    answer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    vote = db.query(AnswerVote).filter(
        AnswerVote.answer_id == answer.id,
        AnswerVote.user_id == current_user.id
    ).first()

    if vote:
        # Undo upvote
        db.delete(vote)
        answer.upvotes_count = max(0, answer.upvotes_count - 1)
        has_upvoted = False
    else:
        # Add upvote
        new_vote = AnswerVote(answer_id=answer.id, user_id=current_user.id)
        db.add(new_vote)
        answer.upvotes_count += 1
        has_upvoted = True

    db.commit()
    return {"upvotes_count": answer.upvotes_count, "has_upvoted": has_upvoted}

@router.post("/answers/{answer_id}/accept")
def accept_answer(
    answer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    doubt = answer.doubt
    if doubt.author_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only the doubt author can accept a solution")

    # Toggle accepted
    for a in doubt.answers:
        a.is_accepted = False

    answer.is_accepted = True
    doubt.status = "SOLVED"
    db.commit()

    return {"message": "Answer marked as accepted solution", "status": "SOLVED"}

@router.delete("/answers/{answer_id}")
def delete_answer(
    answer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    if answer.author_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to delete this answer")

    db.delete(answer)
    db.commit()
    return {"message": "Answer removed successfully"}
