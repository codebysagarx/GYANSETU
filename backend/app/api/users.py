import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Subject
from app.schemas.schemas import UserUpdate, UserProfileResponse, SubjectResponse
from app.api.auth import get_current_user, user_to_profile

router = APIRouter(prefix="/users", tags=["Users & Onboarding"])

@router.put("/profile", response_model=UserProfileResponse)
def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
    if update_data.course is not None:
        current_user.course = update_data.course
    if update_data.semester is not None:
        current_user.semester = update_data.semester
    if update_data.learning_goal is not None:
        current_user.learning_goal = update_data.learning_goal
    if update_data.subjects is not None:
        current_user.subjects = json.dumps(update_data.subjects)

    db.commit()
    db.refresh(current_user)
    return user_to_profile(current_user)

@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    subjects = db.query(Subject).order_by(Subject.name).all()
    return subjects
