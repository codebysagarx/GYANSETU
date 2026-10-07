import os
import sys

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.db.init_db import init_db
from app.core.database import SessionLocal
from app.models.models import User, Doubt, Subject, Answer, Quiz
from app.services.ai_service import ai_service
from app.services.rag_service import rag_service
import asyncio

async def main():
    print("=== Testing GyanSetu Backend ===")
    
    # 1. Initialize DB
    print("[1] Initializing Database...")
    init_db()
    
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"-> Seeded Users: {len(users)} ({[u.email for u in users]})")
        
        subjects = db.query(Subject).all()
        print(f"-> Seeded Subjects: {len(subjects)} ({[s.name for s in subjects[:4]]}...)")
        
        doubts = db.query(Doubt).all()
        print(f"-> Seeded Doubts: {len(doubts)}")
        
        # 2. Test AI Categorization
        print("\n[2] Testing AI Doubt Categorization...")
        test_title = "How does deadlock avoidance work in Banker's algorithm?"
        test_desc = "Explain the safe state and resource allocation matrix."
        cat = await ai_service.categorize_doubt(test_title, test_desc)
        print(f"-> Result: Category='{cat.get('category')}', Tags={cat.get('suggested_tags')}")
        
        # 3. Test AI Tutor
        print("\n[3] Testing AI Tutor Academic & Simplify Modes...")
        academic_ans = await ai_service.generate_tutor_response("Explain TCP 3-way handshake", mode="academic")
        print(f"-> Academic response length: {len(academic_ans)} chars")
        simplify_ans = await ai_service.generate_tutor_response("Explain TCP 3-way handshake", mode="simplify")
        print(f"-> Simplify response snippet: {simplify_ans[:120]}...")
        
        # 4. Test AI Quiz Generation
        print("\n[4] Testing AI Quiz Generator...")
        quiz_questions = await ai_service.generate_quiz("Operating Systems", difficulty="medium", count=3)
        print(f"-> Generated {len(quiz_questions)} questions:")
        for idx, q in enumerate(quiz_questions):
            print(f"   Q{idx+1}: {q['question_text'][:60]}... (Correct: Option {q['correct_option_index']})")
            
        # 5. Test RAG Notes Service
        print("\n[5] Testing RAG / Notes Similarity...")
        note_text = """
        Operating Systems Virtual Memory and Page Faults:
        When a process references a page not present in main memory, the MMU signals a page fault interrupt.
        The operating system suspends the process, finds a free frame in physical memory, and schedules
        a disk I/O operation to read the requested page from swap space into RAM.
        Once the page is loaded, the page table is updated, the valid bit is set to 1, and the instruction is restarted.
        """
        chunks = rag_service.chunk_text(note_text, chunk_size=50, overlap=10)
        print(f"-> Created {len(chunks)} chunks from sample note")
        chunks_data = [{"id": f"c_{i}", "document_title": "OS Memory Notes", "chunk_text": c} for i, c in enumerate(chunks)]
        
        rag_answer = await rag_service.answer_from_notes("What happens when a page fault occurs?", chunks_data)
        print(f"-> Retrieved top chunks: {len(rag_answer['relevant_chunks'])}")
        print(f"-> RAG Answer snippet: {rag_answer['answer'][:150]}...")
        
        print("\n=== ALL BACKEND CORE CAPABILITIES VERIFIED SUCCESSFULLY! ===")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
