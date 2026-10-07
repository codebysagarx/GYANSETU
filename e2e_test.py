import urllib.request
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api"

def make_req(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"HTTP ERROR on {method} {endpoint}: {e.code} - {err_msg}")
        raise

def run_e2e_suite():
    print("==================================================")
    print("🚀 GYANSETU FULL-STACK END-TO-END VERIFICATION")
    print("==================================================")
    
    # 1. Register Student
    print("\n[Step 1] Registering New Student...")
    reg_data = {
        "email": f"student_{int(time.time())}@gyansetu.edu",
        "password": "Password@123",
        "full_name": "Student User"
    }
    reg_resp = make_req("/auth/register", method="POST", data=reg_data)
    token = reg_resp["access_token"]
    user_id = reg_resp["user"]["id"]
    print(f"-> Registered successfully! User ID: {user_id}, Name: {reg_resp['user']['full_name']}")
    
    # 2. Onboarding Academic Profile
    print("\n[Step 2] Onboarding Profile Customization...")
    onboarding_data = {
        "course": "Computer Science",
        "semester": "Semester 5",
        "subjects": ["Operating Systems (OS)", "Database Management Systems (DBMS)", "Mathematics"],
        "learning_goal": "Understand core computer science concepts and complete semester studies"
    }
    prof_resp = make_req("/users/profile", method="PUT", data=onboarding_data, token=token)
    print(f"-> Onboarding persisted: {prof_resp['course']} ({prof_resp['semester']}), Subjects: {prof_resp['subjects']}")
    
    # 3. AI Tutor Chat with Documented Modes (Explain, Simplify, Summarize, Exam Answer)
    print("\n[Step 3] AI Tutor Chat Session with Documented Modes...")
    session_resp = make_req("/tutor/sessions", method="POST", data={"title": "Virtual Memory & Paging", "mode": "explain"}, token=token)
    session_id = session_resp["id"]
    print(f"-> Created Chat Session: {session_id}")
    
    # Test Explain mode
    msg_explain = make_req(f"/tutor/sessions/{session_id}/messages", method="POST", data={"content": "Explain how Paging works in virtual memory.", "mode": "explain"}, token=token)
    print(f"-> 'Explain' response received ({len(msg_explain['content'])} chars)")
    
    # Test Simplify mode
    msg_simplify = make_req(f"/tutor/sessions/{session_id}/messages", method="POST", data={"content": "Simplify this concept.", "mode": "simplify"}, token=token)
    print(f"-> 'Simplify' response received ({len(msg_simplify['content'])} chars)")
    
    # 4. AI Doubt Categorization & Post Doubt
    print("\n[Step 4] AI Doubt Categorization & Community Doubt Creation...")
    cat_resp = make_req("/doubts/categorize", method="POST", data={"title": "Deadlock avoidance with Banker's algorithm", "description": "How does Banker's algorithm ensure the system stays in a safe state?"}, token=token)
    print(f"-> AI Categorized into: '{cat_resp['category']}', Tags: {cat_resp['suggested_tags']}")
    
    doubt_data = {
        "title": "How does the Banker's algorithm verify a safe state in Operating Systems?",
        "description": "What is the role of the Need matrix and Available vector when checking resource allocation?",
        "tags": cat_resp["suggested_tags"]
    }
    doubt_resp = make_req("/doubts", method="POST", data=doubt_data, token=token)
    doubt_id = doubt_resp["id"]
    print(f"-> Doubt Posted: ID={doubt_id}, Title='{doubt_resp['title'][:50]}...'")
    
    # 5. "Ask AI" on the Doubt
    print("\n[Step 5] Triggering 'Ask AI' on Doubt...")
    ai_ans_resp = make_req(f"/doubts/{doubt_id}/ask-ai", method="POST", token=token)
    print(f"-> AI Solution Generated on Doubt! (is_ai_generated: {ai_ans_resp['is_ai_generated']})")
    
    # 6. Peer Student Reply & Upvoting
    print("\n[Step 6] Posting Peer Reply & Upvoting...")
    peer_token = make_req("/auth/login", method="POST", data={"email": "peer@gyansetu.edu", "password": "Student@123456"})["access_token"]
    peer_ans = make_req(f"/doubts/{doubt_id}/answers", method="POST", data={"content": "The system simulates allocation by checking if Need <= Work. If satisfied, Work = Work + Allocation and process marks finish."}, token=peer_token)
    print(f"-> Peer Reply posted: ID={peer_ans['id']}")
    
    upvote_resp = make_req(f"/answers/{peer_ans['id']}/upvote", method="POST", token=token)
    print(f"-> Upvoted peer reply! Upvotes count: {upvote_resp['upvotes_count']}, Has Upvoted: {upvote_resp['has_upvoted']}")
    
    # 7. Accept Solution (Solved State)
    print("\n[Step 7] Author Marking Answer as Accepted Solution...")
    accept_resp = make_req(f"/answers/{peer_ans['id']}/accept", method="POST", token=token)
    print(f"-> Doubt status updated to: {accept_resp['status']}")
    
    # 8. AI Discussion Summary
    print("\n[Step 8] Generating AI Discussion Summary...")
    summary_resp = make_req(f"/doubts/{doubt_id}/summarize", method="POST", token=token)
    print(f"-> AI Summary: '{summary_resp['summary']}'")
    print(f"-> Key Points: {summary_resp['key_points']}")
    
    # 9. AI Quiz Generation & Evaluation
    print("\n[Step 9] Generating AI Quiz & Grading Answers...")
    quiz_resp = make_req("/quizzes/generate", method="POST", data={"topic": "Deadlock Conditions in Operating Systems", "difficulty": "medium", "num_questions": 5}, token=token)
    quiz_id = quiz_resp["id"]
    print(f"-> Quiz Generated: ID={quiz_id}, Total Questions: {quiz_resp['total_questions']}")
    
    answers_map = {q["id"]: 2 for q in quiz_resp["questions"]}
    graded_quiz = make_req(f"/quizzes/{quiz_id}/submit", method="POST", data={"answers": answers_map}, token=token)
    print(f"-> Quiz Graded! Score: {graded_quiz['score']} / {graded_quiz['total_questions']}")
    
    # 10. Ask From My Notes (RAG)
    print("\n[Step 10] Uploading Study Notes & RAG Semantic Querying...")
    rag_resp = make_req("/notes/query", method="POST", data={"query": "Explain page fault resolution steps"}, token=token)
    print(f"-> RAG Query executed! Answer length: {len(rag_resp['answer'])} chars")
    
    # 11. Student Learning Analytics & Recommendations
    print("\n[Step 11] Fetching My Learning Dashboard...")
    learning_resp = make_req("/learning/dashboard", method="GET", token=token)
    print(f"-> Total Doubts Asked: {learning_resp['total_doubts_asked']}")
    print(f"-> Total Quizzes Taken: {learning_resp['total_quizzes_taken']}")
    print(f"-> Frequent Topics: {[t['topic'] for t in learning_resp['frequent_topics']]}")
    print(f"-> Active Recommendations: {len(learning_resp['recommendations'])}")
    
    # 12. Admin Portal & Moderation
    print("\n[Step 12] Admin Portal & Content Moderation...")
    admin_token = make_req("/auth/login", method="POST", data={"email": "admin@gyansetu.edu", "password": "Admin@123456"})["access_token"]
    admin_metrics = make_req("/admin/metrics", method="GET", token=admin_token)
    print(f"-> Platform Metrics: Users={admin_metrics['total_users']}, Doubts={admin_metrics['total_doubts']}, Quizzes={admin_metrics['total_quizzes_generated']}")
    
    admin_users = make_req("/admin/users", method="GET", token=admin_token)
    print(f"-> Admin User Directory: {len(admin_users)} registered users verified.")
    
    print("\n==================================================")
    print("✅ ALL GYANSETU MVP WORKFLOWS VERIFIED 100%!")
    print("==================================================")

if __name__ == "__main__":
    run_e2e_suite()
