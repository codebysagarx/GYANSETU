import os
import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5173"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

BREAKPOINTS = [
    {"name": "mobile_360", "width": 360, "height": 640},
    {"name": "mobile_390", "width": 390, "height": 844},
    {"name": "tablet_768", "width": 768, "height": 1024},
    {"name": "desktop_1024", "width": 1024, "height": 768},
    {"name": "desktop_1440", "width": 1440, "height": 900},
]

def run_visual_qa():
    print("==================================================")
    print("🎨 STARTING GYANSETU VISUAL QA INSPECTION")
    print("==================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Test Landing Page across all 5 breakpoints
        print("\n[1] Inspecting Landing Page...")
        for bp in BREAKPOINTS:
            page = browser.new_page(viewport={"width": bp["width"], "height": bp["height"]})
            page.goto(f"{BASE_URL}/", wait_until="networkidle")
            page.wait_for_timeout(1000)

            # Check overflow
            scroll_width = page.evaluate("document.documentElement.scrollWidth")
            inner_width = page.evaluate("window.innerWidth")
            has_overflow = scroll_width > inner_width
            status = "❌ OVERFLOW" if has_overflow else "✅ OK"
            print(f"  -> Landing @ {bp['name']} ({bp['width']}px): {status} (scrollWidth: {scroll_width}, innerWidth: {inner_width})")

            screenshot_path = os.path.join(SCREENSHOT_DIR, f"landing_{bp['name']}.png")
            page.screenshot(path=screenshot_path)
            page.close()

        # 2. Authenticate as Demo Student for App Pages
        print("\n[2] Logging in as Demo Student...")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        auth_page = context.new_page()
        auth_page.goto(f"{BASE_URL}/login", wait_until="networkidle")

        # Click demo student button
        demo_btn = auth_page.locator("button:has-text('Demo Student')")
        demo_btn.click()
        auth_page.wait_for_timeout(300)

        # Submit
        submit_btn = auth_page.locator("button[type='submit']")
        submit_btn.click()
        auth_page.wait_for_url("**/dashboard", timeout=8000)
        auth_page.wait_for_timeout(1500)
        print("  -> Authenticated successfully! Current URL:", auth_page.url)

        # 3. Test Dashboard across breakpoints
        print("\n[3] Inspecting Dashboard Page...")
        for bp in BREAKPOINTS:
            dash_page = context.new_page()
            dash_page.set_viewport_size({"width": bp["width"], "height": bp["height"]})
            dash_page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
            dash_page.wait_for_timeout(1200)

            scroll_width = dash_page.evaluate("document.documentElement.scrollWidth")
            inner_width = dash_page.evaluate("window.innerWidth")
            has_overflow = scroll_width > inner_width
            status = "❌ OVERFLOW" if has_overflow else "✅ OK"
            print(f"  -> Dashboard @ {bp['name']} ({bp['width']}px): {status} (scrollWidth: {scroll_width})")

            screenshot_path = os.path.join(SCREENSHOT_DIR, f"dashboard_{bp['name']}.png")
            dash_page.screenshot(path=screenshot_path)
            dash_page.close()

        # 4. Test AI Tutor Page across breakpoints
        print("\n[4] Inspecting AI Tutor Page...")
        for bp in [BREAKPOINTS[1], BREAKPOINTS[2], BREAKPOINTS[4]]: # 390px, 768px, 1440px
            tutor_page = context.new_page()
            tutor_page.set_viewport_size({"width": bp["width"], "height": bp["height"]})
            tutor_page.goto(f"{BASE_URL}/tutor", wait_until="networkidle")
            tutor_page.wait_for_timeout(1200)

            scroll_width = tutor_page.evaluate("document.documentElement.scrollWidth")
            status = "❌ OVERFLOW" if scroll_width > bp["width"] else "✅ OK"
            print(f"  -> AI Tutor @ {bp['name']}: {status}")

            screenshot_path = os.path.join(SCREENSHOT_DIR, f"tutor_{bp['name']}.png")
            tutor_page.screenshot(path=screenshot_path)
            tutor_page.close()

        # 5. Test Doubts Community & Detail
        print("\n[5] Inspecting Doubts Forum...")
        doubts_page = context.new_page()
        doubts_page.set_viewport_size({"width": 1440, "height": 900})
        doubts_page.goto(f"{BASE_URL}/doubts", wait_until="networkidle")
        doubts_page.wait_for_timeout(1000)
        doubts_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "doubts_desktop_1440.png"))
        print("  -> Captured doubts forum desktop screenshot.")
        doubts_page.close()

        # 6. Test Quizzes Page
        print("\n[6] Inspecting AI Quizzes Page...")
        quizzes_page = context.new_page()
        quizzes_page.set_viewport_size({"width": 1440, "height": 900})
        quizzes_page.goto(f"{BASE_URL}/quizzes", wait_until="networkidle")
        quizzes_page.wait_for_timeout(1000)
        quizzes_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "quizzes_desktop_1440.png"))
        print("  -> Captured AI Quizzes screenshot.")
        quizzes_page.close()

        # 7. Test Notes Page (RAG)
        print("\n[7] Inspecting Notes (RAG) Page...")
        notes_page = context.new_page()
        notes_page.set_viewport_size({"width": 1440, "height": 900})
        notes_page.goto(f"{BASE_URL}/notes", wait_until="networkidle")
        notes_page.wait_for_timeout(1000)
        notes_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "notes_desktop_1440.png"))
        print("  -> Captured Notes (RAG) screenshot.")
        notes_page.close()

        # 8. Test My Learning Analytics
        print("\n[8] Inspecting My Learning Analytics...")
        learning_page = context.new_page()
        learning_page.set_viewport_size({"width": 1440, "height": 900})
        learning_page.goto(f"{BASE_URL}/my-learning", wait_until="networkidle")
        learning_page.wait_for_timeout(1000)
        learning_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "learning_desktop_1440.png"))
        print("  -> Captured My Learning screenshot.")
        learning_page.close()

        context.close()

        # 9. Faculty Admin Portal
        print("\n[9] Inspecting Faculty Admin Portal...")
        admin_context = browser.new_context(viewport={"width": 1440, "height": 900})
        admin_page = admin_context.new_page()
        admin_page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        admin_page.locator("button:has-text('Demo Admin')").click()
        admin_page.wait_for_timeout(300)
        admin_page.locator("button[type='submit']").click()
        admin_page.wait_for_url("**/admin", timeout=8000)
        admin_page.wait_for_timeout(1200)

        admin_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "admin_desktop_1440.png"))
        print("  -> Captured Faculty Admin Portal screenshot.")
        admin_context.close()

        browser.close()

    print("\n==================================================")
    print("✅ VISUAL QA COMPLETE — ALL SCREENS INSPECTED!")
    print("==================================================")

if __name__ == "__main__":
    run_visual_qa()
