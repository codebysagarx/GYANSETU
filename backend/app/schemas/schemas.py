from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field

# --- User & Auth Schemas ---
class UserRegister(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserProfileResponse"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[str] = None
    subjects: Optional[List[str]] = None
    learning_goal: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    course: Optional[str] = None
    semester: Optional[str] = None
    subjects: Optional[List[str]] = None
    learning_goal: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Subject Schemas ---
class SubjectResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None

    class Config:
        from_attributes = True

# --- Chat & AI Tutor Schemas ---
class ChatSessionCreate(BaseModel):
    title: Optional[str] = "Academic Chat"
    mode: Optional[str] = "academic"  # academic, simplify, summary, exam

class ChatMessageCreate(BaseModel):
    content: str
    mode: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    mode: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

# --- Doubt & Answer Schemas ---
class DoubtCreate(BaseModel):
    title: str = Field(..., min_length=5)
    description: str = Field(..., min_length=10)
    subject_id: Optional[str] = None
    tags: Optional[List[str]] = []

class DoubtUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class AnswerCreate(BaseModel):
    content: str = Field(..., min_length=2)

class AnswerResponse(BaseModel):
    id: str
    doubt_id: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    author_role: str
    content: str
    is_ai_generated: bool
    is_accepted: bool
    upvotes_count: int
    has_upvoted: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class DoubtResponse(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    title: str
    description: str
    tags: List[str] = []
    status: str
    ai_category: Optional[str] = None
    ai_summary: Optional[str] = None
    views_count: int
    answers_count: int = 0
    created_at: datetime
    updated_at: datetime
    answers: List[AnswerResponse] = []

    class Config:
        from_attributes = True

class DoubtListResponse(BaseModel):
    items: List[DoubtResponse]
    total: int

# --- AI Helper Schemas ---
class AICategorizeRequest(BaseModel):
    title: str
    description: str

class AICategorizeResponse(BaseModel):
    category: str
    suggested_tags: List[str]
    confidence: float
    similar_topics: List[str] = []

class AIDiscussionSummaryResponse(BaseModel):
    summary: str
    key_points: List[str]
    suggested_solution: Optional[str] = None

# --- Quiz Schemas ---
class QuizGenerateRequest(BaseModel):
    subject_id: Optional[str] = None
    topic: str
    difficulty: str = "medium"
    num_questions: int = 5

class QuizQuestionResponse(BaseModel):
    id: str
    question_text: str
    options: List[str]
    user_answer_index: Optional[int] = None
    correct_option_index: Optional[int] = None
    explanation: Optional[str] = None
    is_correct: Optional[bool] = None

class QuizResponse(BaseModel):
    id: str
    topic: str
    difficulty: str
    score: int
    total_questions: int
    created_at: datetime
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True

class QuizSubmitRequest(BaseModel):
    answers: Dict[str, int]  # question_id -> selected_option_index

# --- RAG & Notes Schemas ---
class DocumentResponse(BaseModel):
    id: str
    title: str
    file_name: str
    file_size: int
    created_at: datetime
    chunks_count: int = 0

class NotesQueryRequest(BaseModel):
    query: str
    document_ids: Optional[List[str]] = None

class NotesQueryResponse(BaseModel):
    answer: str
    relevant_chunks: List[Dict[str, Any]]

# --- Learning & Dashboard Schemas ---
class RecommendationResponse(BaseModel):
    id: str
    title: str
    description: str
    recommendation_type: str
    subject_id: Optional[str] = None
    is_read: bool
    created_at: datetime

class LearningMetricsResponse(BaseModel):
    total_doubts_asked: int
    total_answers_given: int
    total_quizzes_taken: int
    average_quiz_score: float
    frequent_topics: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
    recommendations: List[RecommendationResponse]

# --- Admin & Reports Schemas ---
class ReportCreate(BaseModel):
    entity_type: str  # doubt, answer
    entity_id: str
    reason: str

class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    reporter_name: str
    entity_type: str
    entity_id: str
    reason: str
    status: str
    ai_flagged: bool
    ai_flag_reason: Optional[str] = None
    created_at: datetime
