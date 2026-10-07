import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Quiz, QuizQuestion, LearningEvent, Subject
from app.schemas.schemas import (
    QuizGenerateRequest, QuizResponse, QuizQuestionResponse, QuizSubmitRequest
)
from app.api.auth import get_current_user
from app.services.ai_service import ai_service
from app.services.recommender import recommender_service

router = APIRouter(prefix="/quizzes", tags=["AI Quizzes"])

def format_quiz(quiz: Quiz, hide_answers: bool = True) -> QuizResponse:
    q_responses = []
    for q in quiz.questions:
        try:
            options = json.loads(q.options)
        except Exception:
            options = [q.options]

        q_responses.append(QuizQuestionResponse(
            id=q.id,
            question_text=q.question_text,
            options=options,
            user_answer_index=q.user_answer_index,
            correct_option_index=None if hide_answers else q.correct_option_index,
            explanation=None if hide_answers else q.explanation,
            is_correct=q.is_correct
        ))

    return QuizResponse(
        id=quiz.id,
        topic=quiz.topic,
        difficulty=quiz.difficulty,
        score=quiz.score,
        total_questions=quiz.total_questions,
        created_at=quiz.created_at,
        questions=q_responses
    )

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    req: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Call AI service to generate questions
    questions_data = await ai_service.generate_quiz(
        topic=req.topic,
        difficulty=req.difficulty,
        count=req.num_questions
    )

    if not questions_data:
        raise HTTPException(status_code=500, detail="Failed to generate quiz questions")

    # 2. Persist Quiz
    quiz = Quiz(
        user_id=current_user.id,
        subject_id=req.subject_id,
        topic=req.topic,
        difficulty=req.difficulty,
        score=0,
        total_questions=len(questions_data)
    )
    db.add(quiz)
    db.flush()

    # 3. Persist Questions
    for q_data in questions_data:
        q_record = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data["question_text"],
            options=json.dumps(q_data["options"]),
            correct_option_index=q_data.get("correct_option_index", 0),
            explanation=q_data.get("explanation", "Standard definition and core concept analysis.")
        )
        db.add(q_record)

    db.commit()
    db.refresh(quiz)
    return format_quiz(quiz, hide_answers=True)

@router.get("", response_model=List[QuizResponse])
def get_user_quizzes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).order_by(Quiz.created_at.desc()).all()
    return [format_quiz(q, hide_answers=False) for q in quizzes]

@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz_detail(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Hide answers if none answered yet
    hide = all(q.user_answer_index is None for q in quiz.questions)
    return format_quiz(quiz, hide_answers=hide)

@router.post("/{quiz_id}/submit", response_model=QuizResponse)
def submit_quiz(
    quiz_id: str,
    sub_in: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    score = 0
    for q in quiz.questions:
        user_choice = sub_in.answers.get(q.id)
        q.user_answer_index = user_choice
        if user_choice is not None and user_choice == q.correct_option_index:
            q.is_correct = True
            score += 1
        else:
            q.is_correct = False

    quiz.score = score

    # Log learning event
    event = LearningEvent(
        user_id=current_user.id,
        event_type="TAKE_QUIZ",
        subject_id=quiz.subject_id,
        metadata_json=json.dumps({"topic": quiz.topic, "score": score, "total": quiz.total_questions})
    )
    db.add(event)
    db.commit()

    # Trigger recommendation update based on new score
    recommender_service.update_recommendations_for_user(db, current_user)

    db.refresh(quiz)
    return format_quiz(quiz, hide_answers=False)
