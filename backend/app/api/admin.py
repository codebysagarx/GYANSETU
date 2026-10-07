from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User, Doubt, Answer, Report, Quiz
from app.schemas.schemas import ReportCreate, ReportResponse, UserProfileResponse
from app.api.auth import get_current_user, get_current_admin, user_to_profile

router = APIRouter(prefix="/admin", tags=["Admin & Moderation"])

@router.get("/metrics")
def get_admin_metrics(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users_count = db.query(User).count()
    doubts_count = db.query(Doubt).count()
    answers_count = db.query(Answer).count()
    pending_reports = db.query(Report).filter(Report.status == "PENDING").count()
    quizzes_count = db.query(Quiz).count()

    return {
        "total_users": users_count,
        "total_doubts": doubts_count,
        "total_answers": answers_count,
        "pending_reports": pending_reports,
        "total_quizzes_generated": quizzes_count
    }

@router.get("/users", response_model=List[UserProfileResponse])
def get_all_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [user_to_profile(u) for u in users]

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    new_role: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if new_role not in ["STUDENT", "ADMIN"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = new_role
    db.commit()
    return {"message": f"User role updated to {new_role}"}

# Any authenticated user can submit a report
@router.post("/reports", response_model=ReportResponse)
def submit_report(
    rep_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = Report(
        reporter_id=current_user.id,
        entity_type=rep_in.entity_type,
        entity_id=rep_in.entity_id,
        reason=rep_in.reason,
        status="PENDING",
        ai_flagged=False
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return ReportResponse(
        id=report.id,
        reporter_id=report.reporter_id,
        reporter_name=current_user.full_name,
        entity_type=report.entity_type,
        entity_id=report.entity_id,
        reason=report.reason,
        status=report.status,
        ai_flagged=report.ai_flagged,
        ai_flag_reason=report.ai_flag_reason,
        created_at=report.created_at
    )

@router.get("/reports", response_model=List[ReportResponse])
def get_reports(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    res = []
    for r in reports:
        res.append(ReportResponse(
            id=r.id,
            reporter_id=r.reporter_id,
            reporter_name=r.reporter.full_name if r.reporter else "User",
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            reason=r.reason,
            status=r.status,
            ai_flagged=r.ai_flagged,
            ai_flag_reason=r.ai_flag_reason,
            created_at=r.created_at
        ))
    return res

@router.post("/reports/{report_id}/resolve")
def resolve_report(
    report_id: str,
    action: str,  # "DISMISS" or "DELETE_CONTENT"
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if action == "DELETE_CONTENT":
        if report.entity_type == "doubt":
            d = db.query(Doubt).filter(Doubt.id == report.entity_id).first()
            if d:
                db.delete(d)
        elif report.entity_type == "answer":
            a = db.query(Answer).filter(Answer.id == report.entity_id).first()
            if a:
                db.delete(a)
        report.status = "RESOLVED"
    else:
        report.status = "DISMISSED"

    db.commit()
    return {"message": f"Report handled with action: {action}", "status": report.status}
