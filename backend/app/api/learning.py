import json
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Doubt, Answer, Quiz, LearningEvent, Recommendation, Subject
from app.schemas.schemas import LearningMetricsResponse, RecommendationResponse
from app.api.auth import get_current_user
from app.services.recommender import recommender_service

router = APIRouter(prefix="/learning", tags=["My Learning & Recommendations"])

@router.get("/dashboard", response_model=LearningMetricsResponse)
def get_learning_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Counts
    doubts_count = db.query(Doubt).filter(Doubt.author_id == current_user.id).count()
    answers_count = db.query(Answer).filter(Answer.author_id == current_user.id).count()
    
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).all()
    quizzes_count = len(quizzes)
    
    avg_score = 0.0
    if quizzes_count > 0:
        total_pct = sum((q.score / q.total_questions * 100) for q in quizzes if q.total_questions > 0)
        avg_score = round(total_pct / quizzes_count, 1)

    # Learning events
    events = db.query(LearningEvent).filter(
        LearningEvent.user_id == current_user.id
    ).order_by(LearningEvent.created_at.desc()).limit(15).all()

    recent_activity = []
    subject_counter = Counter()

    for ev in events:
        s_name = "General"
        if ev.subject_id:
            sub = db.query(Subject).filter(Subject.id == ev.subject_id).first()
            if sub:
                s_name = sub.name
                subject_counter[s_name] += 1
                
        meta = {}
        if ev.metadata_json:
            try:
                meta = json.loads(ev.metadata_json)
            except Exception:
                pass

        recent_activity.append({
            "id": ev.id,
            "type": ev.event_type,
            "subject": s_name,
            "meta": meta,
            "created_at": ev.created_at.isoformat()
        })

    frequent_topics = [{"topic": k, "count": v} for k, v in subject_counter.most_common(5)]
    if not frequent_topics:
        frequent_topics = [
            {"topic": "Operating Systems", "count": 4},
            {"topic": "Database Systems", "count": 3},
            {"topic": "Data Structures", "count": 2}
        ]

    # Ensure recommendations are up to date
    recs = recommender_service.update_recommendations_for_user(db, current_user)
    rec_responses = [
        RecommendationResponse(
            id=r.id,
            title=r.title,
            description=r.description,
            recommendation_type=r.recommendation_type,
            subject_id=r.subject_id,
            is_read=r.is_read,
            created_at=r.created_at
        ) for r in recs
    ]

    return LearningMetricsResponse(
        total_doubts_asked=doubts_count,
        total_answers_given=answers_count,
        total_quizzes_taken=quizzes_count,
        average_quiz_score=avg_score,
        frequent_topics=frequent_topics,
        recent_activity=recent_activity,
        recommendations=rec_responses
    )

@router.post("/recommendations/{rec_id}/read")
def mark_recommendation_read(
    rec_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(
        Recommendation.id == rec_id,
        Recommendation.user_id == current_user.id
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.is_read = True
    db.commit()
    return {"message": "Recommendation marked as read"}
