import json
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, Subject, Doubt, Answer, ChatSession, ChatMessage

def init_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # 1. Seed Documented Subjects: OS, DBMS, Mathematics
        subjects_data = [
            {
                "name": "Operating Systems (OS)",
                "slug": "os",
                "description": "Processes, CPU scheduling, synchronization, deadlocks, and virtual memory.",
                "icon": "Cpu"
            },
            {
                "name": "Database Management Systems (DBMS)",
                "slug": "dbms",
                "description": "Relational data model, SQL queries, transactions, ACID properties, and indexing.",
                "icon": "Database"
            },
            {
                "name": "Mathematics",
                "slug": "mathematics",
                "description": "Discrete mathematics, logic, relations, graph theory, and linear algebra.",
                "icon": "Sigma"
            }
        ]

        subject_map = {}
        for s_data in subjects_data:
            existing = db.query(Subject).filter(Subject.slug == s_data["slug"]).first()
            if not existing:
                sub = Subject(**s_data)
                db.add(sub)
                db.flush()
                subject_map[sub.slug] = sub
            else:
                subject_map[existing.slug] = existing

        # 2. Seed Default Admin User
        admin_user = db.query(User).filter(User.email == "admin@gyansetu.edu").first()
        if not admin_user:
            admin_user = User(
                email="admin@gyansetu.edu",
                password_hash=get_password_hash("Admin@123456"),
                full_name="Admin Faculty",
                role="ADMIN",
                course="Computer Science",
                semester="Semester 5",
                learning_goal="Platform and Community Moderation"
            )
            db.add(admin_user)
            db.flush()

        # 3. Seed Default Student User
        student_user = db.query(User).filter(User.email == "student@gyansetu.edu").first()
        if not student_user:
            student_user = User(
                email="student@gyansetu.edu",
                password_hash=get_password_hash("Student@123456"),
                full_name="Student",
                role="STUDENT",
                course="Computer Science",
                semester="Semester 5",
                subjects=json.dumps(["Operating Systems (OS)", "Database Management Systems (DBMS)", "Mathematics"]),
                learning_goal="Understand core computer science concepts and complete semester studies"
            )
            db.add(student_user)
            db.flush()

        # 4. Seed Peer Student User
        peer_user = db.query(User).filter(User.email == "peer@gyansetu.edu").first()
        if not peer_user:
            peer_user = User(
                email="peer@gyansetu.edu",
                password_hash=get_password_hash("Student@123456"),
                full_name="Peer Student",
                role="STUDENT",
                course="Computer Science",
                semester="Semester 5",
                subjects=json.dumps(["Operating Systems (OS)", "Database Management Systems (DBMS)"]),
                learning_goal="Collaborative study in core subjects"
            )
            db.add(peer_user)
            db.flush()

        # 5. Seed Documented Doubts: OS, DBMS
        os_subj = subject_map.get("os")
        dbms_subj = subject_map.get("dbms")

        doubt_1 = db.query(Doubt).filter(Doubt.title.like("%Deadlock and Starvation%")).first()
        if not doubt_1 and os_subj and student_user:
            doubt_1 = Doubt(
                author_id=student_user.id,
                subject_id=os_subj.id,
                title="What is the difference between Deadlock and Starvation in Operating Systems?",
                description="How does deadlock differ from starvation in process scheduling, and how can starvation be prevented?",
                tags="os,deadlock,starvation",
                status="SOLVED",
                ai_category="Operating Systems (OS)",
                ai_summary="Deadlock involves permanent circular waiting among processes, while starvation is indefinite postponement of a ready process.",
                views_count=35
            )
            db.add(doubt_1)
            db.flush()

            # Community Answer
            ans_1 = Answer(
                doubt_id=doubt_1.id,
                author_id=peer_user.id,
                content="""Here is the comparison:

1. **Deadlock**:
   - Two or more processes are blocked waiting for events that only other processes in the set can cause.
   - None of the involved processes can proceed.

2. **Starvation**:
   - A runnable process is indefinitely delayed because higher priority processes continuously take the resource.
   - Solution: Aging (gradually increasing process priority with wait time).""",
                is_ai_generated=False,
                is_accepted=True,
                upvotes_count=8
            )
            db.add(ans_1)

            # AI Solution
            ans_ai = Answer(
                doubt_id=doubt_1.id,
                author_id=admin_user.id,
                content="""### 🤖 GyanSetu AI Assistance

**Concept Explanation:**
- **Deadlock**: A state where every process in a set is waiting for a resource held by another process in the same set. All four Coffman conditions (Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait) must hold.
- **Starvation**: A process is indefinitely delayed from getting resources despite being in ready state due to scheduling bias.

**Prevention:**
- Deadlock prevention breaks one of the Coffman conditions.
- Starvation is resolved using fair queuing or aging.""",
                is_ai_generated=True,
                is_accepted=False,
                upvotes_count=5
            )
            db.add(ans_ai)

        doubt_2 = db.query(Doubt).filter(Doubt.title.like("%B+ Trees%")).first()
        if not doubt_2 and dbms_subj and peer_user:
            doubt_2 = Doubt(
                author_id=peer_user.id,
                subject_id=dbms_subj.id,
                title="Why are B+ Trees preferred over B-Trees for database indexing?",
                description="What makes B+ Trees more suitable for database storage engines when performing range queries?",
                tags="dbms,indexing,b-tree",
                status="OPEN",
                ai_category="Database Management Systems (DBMS)",
                ai_summary="B+ Trees store all records in linked leaf nodes, making range queries efficient with sequential disk access.",
                views_count=22
            )
            db.add(doubt_2)

        # 6. Sample AI Tutor Chat Session
        if student_user:
            existing_chat = db.query(ChatSession).filter(ChatSession.user_id == student_user.id).first()
            if not existing_chat:
                session = ChatSession(
                    user_id=student_user.id,
                    title="Paging in Virtual Memory",
                    mode="explain"
                )
                db.add(session)
                db.flush()

                msg1 = ChatMessage(
                    session_id=session.id,
                    role="user",
                    content="Can you explain how Paging works in virtual memory?",
                    created_at=session.created_at
                )
                msg2 = ChatMessage(
                    session_id=session.id,
                    role="assistant",
                    content="""### 🎓 Academic Explanation: Paging in Virtual Memory

**Paging** is a memory management scheme that permits the physical address space of a process to be noncontiguous.

#### 1. Core Architecture
- **Pages**: Logical memory divided into fixed-sized blocks.
- **Frames**: Physical memory divided into fixed-sized blocks of the same size.
- **Page Table**: Maps logical page numbers to physical frame numbers.

#### 2. Address Translation
A logical address generated by the CPU consists of:
- **Page Number (p)**: Index into the page table.
- **Page Offset (d)**: Combined with the base frame address to define physical memory address.""",
                    created_at=session.created_at
                )
                db.add_all([msg1, msg2])

        db.commit()
        print("[DB] Initialized GyanSetu database successfully.")
    except Exception as e:
        db.rollback()
        print(f"[DB] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
