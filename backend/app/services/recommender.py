from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import User, Quiz, LearningEvent, Recommendation, Subject

class RecommenderService:
    def update_recommendations_for_user(self, db: Session, user: User) -> List[Recommendation]:
        """Generate personalized study recommendations based on recent quizzes and doubts."""
        # 1. Check recent quizzes with low scores
        quizzes = db.query(Quiz).filter(Quiz.user_id == user.id).order_by(Quiz.created_at.desc()).limit(5).all()
        weak_topics = []
        for q in quizzes:
            if q.total_questions > 0 and (q.score / q.total_questions) < 0.7:
                weak_topics.append(q.topic)

        # 2. Check frequent learning events
        events = db.query(LearningEvent).filter(LearningEvent.user_id == user.id).order_by(LearningEvent.created_at.desc()).limit(10).all()
        
        # 3. Create recommendations if not already existing
        existing_titles = set(r.title for r in db.query(Recommendation).filter(Recommendation.user_id == user.id).all())
        
        new_recs = []
        for topic in weak_topics:
            title = f"Revise: {topic}"
            if title not in existing_titles:
                rec = Recommendation(
                    user_id=user.id,
                    title=title,
                    description=f"Your recent quiz score on '{topic}' was below 70%. We recommend reviewing core definitions and practicing another quiz.",
                    recommendation_type="REVISE_TOPIC"
                )
                db.add(rec)
                new_recs.append(rec)
                existing_titles.add(title)

        # General helpful recommendations if user has few
        if len(existing_titles) < 2:
            default_recs = [
                ("Master Operating System Concurrency", "Explore Semaphores and Deadlock conditions to build strong systems foundations.", "Operating Systems (OS)"),
                ("Sharpen Database Normalization Skills", "Practice identifying 2NF vs 3NF vs BCNF functional dependencies for semester exams.", "Database Management Systems (DBMS)")
            ]
            for title, desc, subj_name in default_recs:
                if title not in existing_titles:
                    subj = db.query(Subject).filter(Subject.name == subj_name).first()
                    rec = Recommendation(
                        user_id=user.id,
                        title=title,
                        description=desc,
                        subject_id=subj.id if subj else None,
                        recommendation_type="PRACTICE_QUIZ"
                    )
                    db.add(rec)
                    new_recs.append(rec)
                    existing_titles.add(title)

        if new_recs:
            db.commit()

        return db.query(Recommendation).filter(Recommendation.user_id == user.id).order_by(Recommendation.created_at.desc()).limit(5).all()

recommender_service = RecommenderService()
