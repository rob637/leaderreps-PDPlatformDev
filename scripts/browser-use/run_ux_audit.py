#!/usr/bin/env python3
"""
LeaderReps Browser-Use UX Audit
================================
Uses browser-use + Claude to log into the app as a real user
and perform UX audits of specific flows or the full app.

Usage:
  # Standalone: run a conditioning audit
  python3 scripts/browser-use/run_ux_audit.py

  # Watch mode: process audits queued from the Admin UI
  python3 scripts/browser-use/run_ux_audit.py --watch

  # Custom task
  python3 scripts/browser-use/run_ux_audit.py --task "Navigate to the dashboard and check if all widgets load"

  # Target a different environment
  python3 scripts/browser-use/run_ux_audit.py --env test

  # Save screenshots & recording
  python3 scripts/browser-use/run_ux_audit.py --record

Required env vars:
  ANTHROPIC_API_KEY     - Your Anthropic API key
  E2E_ADMIN_EMAIL       - Login email (defaults to rob@sagecg.com)
  E2E_ADMIN_PASSWORD    - Login password (REQUIRED)

For --watch mode, also needs Firebase credentials:
  GOOGLE_APPLICATION_CREDENTIALS - Path to Firebase service account JSON
  OR the script will look for functions/serviceAccountKey.json
"""

import argparse
import asyncio
import os
import sys
import json
from datetime import datetime
from pathlib import Path

# ============================================
# CONFIGURATION
# ============================================

ENV_URLS = {
    'local': 'http://localhost:5173',
    'dev': 'https://leaderreps-pd-platform.web.app',
    'test': 'https://leaderreps-test.web.app',
    'prod': 'https://leaderreps-prod.web.app',
}

# Pre-built audit tasks
AUDIT_TASKS = {
    'conditioning': """
You are a UX auditor testing the LeaderReps leadership development platform.
Your job is to use the app like a real user and report ANY issues you find.

STEPS:
1. You are already logged in. Navigate to the Conditioning screen (look for "Conditioning" or "Reps" in the navigation — it may be in a bottom nav bar or sidebar).
2. Once on the Conditioning screen, carefully observe:
   - Does the page load without errors?
   - Is there a consistent color scheme? (should be navy/teal/orange — NO purple or indigo)
   - Are all cards and sections properly aligned?
   - Are there any broken layouts or overlapping elements?
3. Try to commit a new rep:
   - Look for a "Commit Rep" or "+" button
   - Go through the form — note any confusing labels, missing fields, or layout issues
   - Check if the form has microphone/voice input buttons on text fields
   - Do NOT actually submit — just observe the form UX
   - Close/cancel the form
4. If there are any existing reps listed, tap on one to see the detail view.
5. If there's a missed rep, try opening the debrief modal.
6. Look at the overall page layout — check mobile responsiveness, spacing, typography.

REPORT FORMAT:
After completing the walkthrough, provide a structured report:

## UX Audit Report — Conditioning Flow
### Date: [today]
### Environment: [url]

### Issues Found
For each issue:
- **Severity**: Critical / Major / Minor / Cosmetic
- **Location**: Which screen/modal/component
- **Description**: What's wrong
- **Screenshot context**: What you see on screen
- **Suggestion**: How to fix it

### Positive Observations
What works well, feels polished, or is intuitive.

### Overall Assessment
1-10 score with justification.
""",

    'dashboard': """
You are a UX auditor testing the LeaderReps leadership development platform.

STEPS:
1. You are already logged in. You should be on or navigate to the Dashboard.
2. Observe the dashboard layout:
   - Do all widgets load? Any spinners stuck?
   - Is the layout clean on the current viewport?
   - Are colors consistent (navy/teal/orange brand palette)?
   - Any broken images or icons?
3. Check each visible widget:
   - Does it show meaningful data or helpful empty states?
   - Are CTAs (buttons/links) clear and obvious?
   - Does the typography hierarchy make sense?
4. Check the navigation:
   - Is the current page clearly indicated?
   - Can you tell where you are in the app?
   - Are nav labels clear?
5. Check the top bar / header area for any issues.

REPORT FORMAT:
## UX Audit Report — Dashboard
### Issues Found (with Severity, Location, Description, Suggestion)
### Positive Observations
### Overall Assessment (1-10)
""",

    'full': """
You are a UX auditor testing the LeaderReps leadership development platform.
Do a comprehensive walkthrough of ALL main screens.

STEPS:
1. You are logged in. Start at the Dashboard.
2. Visit EACH screen accessible from the navigation:
   - Dashboard
   - Dev Plan (if available)
   - Content Library (if available)
   - Conditioning / Reps
   - Community (if available)
   - Coaching Labs (if available)
   - Profile / Settings
3. For each screen:
   - Note load time (fast? slow? spinner?)
   - Check visual consistency (colors, fonts, spacing, borders)
   - Look for broken elements or error states
   - Check button/link discoverability
   - Note any purple/indigo — should be navy/teal/orange only
4. Try at least one interactive flow end-to-end (like viewing content or opening a modal).

REPORT FORMAT:
## Full App UX Audit Report
### Screen-by-Screen Findings
For each screen visited:
- Screen name
- Load status
- Issues found (severity + description)
- Score (1-10)

### Cross-Cutting Issues (consistency, navigation, colors)
### Top 5 Priority Fixes
### Overall App Score (1-10)
""",

    'dev-plan': """
You are a UX auditor testing the LeaderReps leadership development platform.

STEPS:
1. You are logged in. Find and navigate to "Dev Plan" in the sidebar navigation.
2. Once on the Dev Plan screen:
   - Does it load fully? Any stuck spinners or empty states?
   - Is the content organized logically?
   - Check for any broken cards, missing content, or layout issues
   - Look at how modules/weeks/content is presented
   - Is there clear progress indication?
3. If there are expandable sections or modules, open at least 2-3 of them.
4. If there are any links to content (videos, articles), click one and check the experience.
5. Navigate back and check the breadcrumb/back navigation works.
6. Note typography, spacing, color consistency (should be navy/teal/orange palette).

REPORT FORMAT:
## UX Audit Report — Dev Plan
### Issues Found (with Severity, Location, Description, Suggestion)
### Positive Observations
### Overall Assessment (1-10)
""",

    'profile-settings': """
You are a UX auditor testing the LeaderReps leadership development platform.

STEPS:
1. You are logged in. Find and navigate to Profile or Settings (look in sidebar, top-right avatar, or bottom nav).
2. Check the profile screen:
   - Is user information displayed correctly?
   - Are there edit capabilities? Do they work?
   - Is the layout clean and organized?
   - Any broken images, missing data, or layout issues?
3. Look for Settings or Preferences:
   - Are setting categories clear?
   - Do toggles/controls look functional?
   - Is dark mode available? Try toggling it.
4. Check for any account management features (name, email, password change).
5. Look for notification preferences if available.
6. Navigate back to dashboard and verify the transition is smooth.

REPORT FORMAT:
## UX Audit Report — Profile & Settings
### Issues Found (with Severity, Location, Description, Suggestion)
### Positive Observations
### Overall Assessment (1-10)
""",

    'navigation-flow': """
You are a UX auditor testing the overall navigation and flow of the LeaderReps platform.

STEPS:
1. You are logged in. Start at the Dashboard.
2. Systematically visit EVERY screen you can find in the navigation:
   - Click each item in the sidebar (or bottom nav if mobile)
   - For each screen: note the screen name, whether it loads, any errors
   - Count how many navigation items there are
3. Test the back/forward navigation:
   - Use the browser back button after navigating to a deep screen
   - Does it return to the right place?
4. Check for dead-end screens:
   - Any screen where you can't easily get back?
   - Any screens that feel disconnected?
5. Test the sidebar:
   - Does it show which screen is currently active?
   - Does it collapse/expand properly?
   - Is the hierarchy logical?
6. Look for any duplicate or confusing nav items.
7. Time the transitions — do screens load quickly or is there noticeable lag?

REPORT FORMAT:
## UX Audit Report — Navigation & Flow
### Navigation Map (list all screens found)
### Issues Found (with Severity, Location, Description, Suggestion)
### Screen Load Assessment
### Navigation Coherence Score (1-10)
### Overall Assessment (1-10)
""",

    'content-library': """
You are a UX auditor testing the content experience on the LeaderReps platform.

STEPS:
1. You are logged in. Look for a Content Library, Locker, Explore, or similar content browsing area.
2. If you find it:
   - How is content organized? Categories, tags, search?
   - Can you filter or sort?
   - Click on at least 2-3 content items
   - Check how content renders (text formatting, images, videos)
   - Is there progress tracking on content?
3. Check the content detail view:
   - Is the layout readable?
   - Are there related content suggestions?
   - Can you navigate back easily?
4. If there are videos:
   - Do video players load?
   - Are there proper controls?
   - Is the thumbnail/preview useful?
5. Note the overall content discovery experience — can you find what you need?

REPORT FORMAT:
## UX Audit Report — Content Experience
### Issues Found (with Severity, Location, Description, Suggestion)
### Content Organization Assessment
### Positive Observations
### Overall Assessment (1-10)
""",

    'error-states': """
You are a UX auditor testing error handling and edge cases on the LeaderReps platform.

STEPS:
1. You are logged in. Test various error scenarios:
2. Try clicking on elements that might be disabled or unavailable.
3. Look for any JavaScript errors in the page (check if there are error banners, toasts, or console errors visible).
4. Try navigating to areas that might require specific permissions.
5. Check empty states:
   - Are empty lists/sections handled gracefully?
   - Do they show helpful messages?
   - Are there clear CTAs for what to do next?
6. Try resizing the browser window dramatically:
   - Does the layout break at any viewport size?
   - Do elements overlap?
   - Is text still readable?
7. Look for loading states:
   - Are there skeleton screens or spinners during data loading?
   - Do they feel appropriate or too long?
8. Check for any hardcoded/placeholder text that shouldn't be there.

REPORT FORMAT:
## UX Audit Report — Error States & Edge Cases
### Issues Found (with Severity, Location, Description, Suggestion)
### Empty State Quality Assessment
### Error Handling Quality
### Overall Robustness Score (1-10)
""",
}


# ============================================
# MAIN AUDIT RUNNER
# ============================================

async def run_audit(task, base_url, email, password, record=False, headless=True, model='claude-sonnet-4-20250514'):
    """Run a browser-use audit with Claude."""
    try:
        from browser_use import Agent, BrowserSession, ChatAnthropic
    except ImportError:
        print("❌ Missing dependencies. Run:")
        print("   pip3 install browser-use")
        sys.exit(1)

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ ANTHROPIC_API_KEY environment variable not set.")
        print("   export ANTHROPIC_API_KEY='your-key-here'")
        sys.exit(1)

    # Strip smart quotes that may have been introduced by copy-paste
    api_key = api_key.strip().strip('\u2018\u2019\u201c\u201d\'"')

    if not password:
        print("❌ No password provided.")
        print("   export E2E_ADMIN_PASSWORD='your-password'")
        sys.exit(1)

    # Set up output directory
    output_dir = Path('scripts/browser-use/reports')
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')

    print(f"\n🔍 LeaderReps UX Audit")
    print(f"   Environment: {base_url}")
    print(f"   User: {email}")
    print(f"   Model: {model}")
    print(f"   Headless: {headless}")
    print(f"   Recording: {record}")
    print(f"   Output: {output_dir}/")
    print()

    # Configure browser session
    session_kwargs = {
        'headless': headless,
    }
    if record:
        session_kwargs['record_video_dir'] = str(output_dir)

    browser_session = BrowserSession(**session_kwargs)

    # Build the full task with login instructions prepended
    full_task = f"""
IMPORTANT: You are testing a web application at {base_url}

FIRST, LOG IN:
1. Go to {base_url}
2. You should see a login screen. If not, look for a "Sign In" or "Login" link.
3. Enter email: {email}
4. Enter password: {password}
5. Click the Sign In / Login button
6. Wait for the dashboard or home page to load fully

THEN, PERFORM THE AUDIT:
{task}

Take your time. Be thorough. Note everything you observe.
"""

    # Create the LLM
    llm = ChatAnthropic(
        model=model,
        api_key=api_key,
    )

    # Create and run the agent
    agent = Agent(
        task=full_task,
        llm=llm,
        browser_session=browser_session,
        max_actions_per_step=5,
        generate_gif=record,
    )

    print("🚀 Starting browser-use agent...\n")

    try:
        result = await agent.run(max_steps=50)

        # Save the report
        report_file = output_dir / f'audit-{timestamp}.md'
        
        # Extract the final result text
        report_content = f"# LeaderReps UX Audit Report\n\n"
        report_content += f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        report_content += f"**Environment:** {base_url}\n"
        report_content += f"**User:** {email}\n\n"
        report_content += "---\n\n"
        
        if result and hasattr(result, 'final_result'):
            final = result.final_result() if callable(result.final_result) else result.final_result
            if final:
                report_content += str(final)
            else:
                report_content += "Agent completed but produced no final result text."
        elif result:
            report_content += str(result)
        else:
            report_content += "No result returned from agent."

        report_file.write_text(report_content)
        print(f"\n✅ Audit complete! Report saved to: {report_file}")

        # Also save raw action history if available
        try:
            action_results = result.action_results() if callable(getattr(result, 'action_results', None)) else getattr(result, 'action_results', None)
            if action_results:
                history_file = output_dir / f'audit-{timestamp}-actions.json'
                actions = [str(a) for a in action_results]
                history_file.write_text(json.dumps(actions, indent=2, ensure_ascii=False))
                print(f"   Action history: {history_file}")
        except Exception:
            pass

        return report_content

    except Exception as e:
        print(f"\n❌ Audit failed: {e}")
        raise
    finally:
        try:
            await browser_session.stop()
        except Exception:
            pass  # Session may already be stopped


# ============================================
# FIRESTORE WATCH MODE
# ============================================

def get_firestore_client():
    """Initialize Firestore client for watch mode."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("❌ firebase-admin not installed. Run:")
        print("   pip3 install firebase-admin")
        sys.exit(1)

    # Try to find credentials
    cred_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
    if not cred_path:
        # Look for common locations
        candidates = [
            'functions/serviceAccountKey.json',
            'serviceAccountKey.json',
            os.path.expanduser('~/.config/firebase/serviceAccountKey.json'),
        ]
        for c in candidates:
            if os.path.exists(c):
                cred_path = c
                break

    if not cred_path or not os.path.exists(cred_path):
        print("❌ Firebase credentials not found.")
        print("   Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in functions/")
        print("   Generate one at: Firebase Console → Project Settings → Service Accounts")
        sys.exit(1)

    # Determine which project from the service account
    with open(cred_path) as f:
        sa_data = json.load(f)
    project_id = sa_data.get('project_id', 'unknown')
    print(f"   Firebase project: {project_id}")
    print(f"   Credentials: {cred_path}")

    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    return firestore.client()


async def process_pending_audit(firestore_db, audit_doc, password, headless=True, model='claude-sonnet-4-20250514'):
    """Process a single pending audit from Firestore."""
    from firebase_admin import firestore as fs
    
    doc_ref = audit_doc.reference
    data = audit_doc.to_dict()

    audit_type = data.get('auditType', 'conditioning')
    environment = data.get('environment', 'dev')
    custom_task = data.get('customTask')
    email = data.get('email', 'rob@sagecg.com')
    base_url = data.get('url') or ENV_URLS.get(environment, ENV_URLS['dev'])

    # Determine the task
    if custom_task:
        task = custom_task
    elif audit_type in AUDIT_TASKS:
        task = AUDIT_TASKS[audit_type]
    else:
        task = AUDIT_TASKS['conditioning']

    print(f"\n{'='*60}")
    print(f"📋 Processing audit: {audit_doc.id}")
    print(f"   Type: {audit_type} | Env: {environment} | Email: {email}")
    print(f"{'='*60}")

    # Mark as running
    doc_ref.update({
        'status': 'running',
        'updatedAt': fs.SERVER_TIMESTAMP,
    })

    try:
        report = await run_audit(
            task=task,
            base_url=base_url,
            email=email,
            password=password,
            headless=headless,
            model=model,
        )

        # Extract score if present (look for X/10 pattern)
        score = None
        import re
        score_match = re.search(r'(\d+(?:\.\d+)?)\s*/\s*10', report or '')
        if score_match:
            score = float(score_match.group(1))

        # Write report back to Firestore
        doc_ref.update({
            'status': 'completed',
            'report': report or 'No report generated.',
            'score': score,
            'completedAt': fs.SERVER_TIMESTAMP,
            'updatedAt': fs.SERVER_TIMESTAMP,
        })

        print(f"✅ Audit {audit_doc.id} completed" + (f" (score: {score}/10)" if score else ""))

    except Exception as e:
        doc_ref.update({
            'status': 'failed',
            'error': str(e),
            'updatedAt': fs.SERVER_TIMESTAMP,
        })
        print(f"❌ Audit {audit_doc.id} failed: {e}")


async def watch_firestore(password, headless=True, poll_interval=10, model='claude-sonnet-4-20250514'):
    """Poll Firestore for pending audits and process them."""
    firestore_db = get_firestore_client()

    print(f"\n👁️  Watch mode active — polling every {poll_interval}s")
    print(f"   Audits are queued from Admin → UX Audit Lab")
    print(f"   Press Ctrl+C to stop\n")

    try:
        while True:
            # Query for pending audits
            runs_ref = firestore_db.collection('admin').document('ux-audits').collection('runs')
            pending = runs_ref.where('status', '==', 'pending').order_by('createdAt').limit(1).get()

            for audit_doc in pending:
                await process_pending_audit(firestore_db, audit_doc, password, headless, model=model)

            await asyncio.sleep(poll_interval)

    except KeyboardInterrupt:
        print("\n\n👋 Watch mode stopped.")


# ============================================
# CLI
# ============================================

def main():
    parser = argparse.ArgumentParser(
        description='Run browser-use UX audits on LeaderReps',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Watch Firestore for audits queued from Admin UI
  python3 scripts/browser-use/run_ux_audit.py --watch

  # Standalone: audit the conditioning flow on dev
  python3 scripts/browser-use/run_ux_audit.py

  # Full app audit on test environment
  python3 scripts/browser-use/run_ux_audit.py --audit full --env test

  # Custom task
  python3 scripts/browser-use/run_ux_audit.py --task "Check if the daily plan widget shows correct day number"

  # Run headed (visible browser) for debugging
  python3 scripts/browser-use/run_ux_audit.py --headed
        """
    )

    parser.add_argument(
        '--watch',
        action='store_true',
        help='Watch Firestore for audits queued from the Admin UI'
    )
    parser.add_argument(
        '--audit',
        choices=['conditioning', 'dashboard', 'full', 'dev-plan', 'profile-settings', 'navigation-flow', 'content-library', 'error-states'],
        default='conditioning',
        help='Pre-built audit to run (default: conditioning)'
    )
    parser.add_argument(
        '--task',
        type=str,
        help='Custom task description (overrides --audit)'
    )
    parser.add_argument(
        '--env',
        choices=['local', 'dev', 'test', 'prod'],
        default='dev',
        help='Target environment (default: dev)'
    )
    parser.add_argument(
        '--email',
        type=str,
        default=os.environ.get('E2E_ADMIN_EMAIL', 'rob@sagecg.com'),
        help='Login email'
    )
    parser.add_argument(
        '--password',
        type=str,
        default=os.environ.get('E2E_ADMIN_PASSWORD', ''),
        help='Login password (or set E2E_ADMIN_PASSWORD env var)'
    )
    parser.add_argument(
        '--headed',
        action='store_true',
        help='Run with visible browser window'
    )
    parser.add_argument(
        '--record',
        action='store_true',
        help='Save screenshots and recording'
    )
    parser.add_argument(
        '--poll-interval',
        type=int,
        default=10,
        help='Seconds between Firestore polls in watch mode (default: 10)'
    )
    parser.add_argument(
        '--model',
        type=str,
        default='claude-sonnet-4-20250514',
        help='Anthropic model to use (default: claude-sonnet-4-20250514)'
    )
    parser.add_argument(
        '--batch',
        nargs='+',
        choices=['conditioning', 'dashboard', 'full', 'dev-plan', 'profile-settings', 'navigation-flow', 'content-library', 'error-states'],
        help='Run multiple audits in sequence with cooldown between them'
    )
    parser.add_argument(
        '--cooldown',
        type=int,
        default=90,
        help='Seconds to wait between batch audits for rate limit cooldown (default: 90)'
    )

    args = parser.parse_args()
    headless = not args.headed

    if args.watch:
        # Watch mode — poll Firestore for pending audits
        if not args.password:
            print("❌ Password required. Set E2E_ADMIN_PASSWORD or use --password")
            sys.exit(1)
        asyncio.run(watch_firestore(
            password=args.password,
            headless=headless,
            poll_interval=args.poll_interval,
            model=args.model,
        ))
    else:
        # Standalone mode — run a single audit or batch
        base_url = ENV_URLS[args.env]

        if args.batch:
            # Batch mode — run multiple audits with cooldown
            print(f"\n🔄 Batch mode: {len(args.batch)} audits queued")
            print(f"   Audits: {', '.join(args.batch)}")
            print(f"   Cooldown: {args.cooldown}s between audits\n")
            
            for i, audit_name in enumerate(args.batch):
                print(f"\n{'='*60}")
                print(f"📋 Batch {i+1}/{len(args.batch)}: {audit_name}")
                print(f"{'='*60}")
                
                task = AUDIT_TASKS[audit_name]
                try:
                    asyncio.run(run_audit(
                        task=task,
                        base_url=base_url,
                        email=args.email,
                        password=args.password,
                        record=args.record,
                        headless=headless,
                        model=args.model,
                    ))
                except Exception as e:
                    print(f"❌ Batch audit '{audit_name}' failed: {e}")
                
                # Cooldown between audits (skip after last)
                if i < len(args.batch) - 1:
                    print(f"\n⏳ Cooling down {args.cooldown}s before next audit...")
                    import time
                    time.sleep(args.cooldown)
            
            print(f"\n✅ Batch complete! {len(args.batch)} audits run.")
            print(f"   Reports in: scripts/browser-use/reports/")
        else:
            task = args.task if args.task else AUDIT_TASKS[args.audit]
            asyncio.run(run_audit(
                task=task,
                base_url=base_url,
                email=args.email,
                password=args.password,
                record=args.record,
                headless=headless,
                model=args.model,
            ))


if __name__ == '__main__':
    main()
