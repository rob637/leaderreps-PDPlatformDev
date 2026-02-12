#!/usr/bin/env python3
"""
LeaderReps Browser-Use UX Audit
================================
Uses browser-use + Claude to log into the app as a real user
and perform UX audits of specific flows or the full app.

Usage:
  # Full conditioning flow audit
  python3 scripts/browser-use/run_ux_audit.py

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
}


# ============================================
# MAIN AUDIT RUNNER
# ============================================

async def run_audit(task, base_url, email, password, record=False, headless=True):
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
        model='claude-sonnet-4-20250514',
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
        
        if result and hasattr(result, 'final_result') and result.final_result:
            report_content += result.final_result()
        elif result:
            report_content += str(result)
        else:
            report_content += "No result returned from agent."

        report_file.write_text(report_content)
        print(f"\n✅ Audit complete! Report saved to: {report_file}")

        # Also save raw action history if available
        try:
            if hasattr(result, 'action_results') and result.action_results:
                history_file = output_dir / f'audit-{timestamp}-actions.json'
                actions = [str(a) for a in result.action_results()]
                history_file.write_text(json.dumps(actions, indent=2))
                print(f"   Action history: {history_file}")
        except Exception:
            pass

        return report_content

    except Exception as e:
        print(f"\n❌ Audit failed: {e}")
        raise
    finally:
        await browser_session.close()


# ============================================
# CLI
# ============================================

def main():
    parser = argparse.ArgumentParser(
        description='Run browser-use UX audits on LeaderReps',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Audit the conditioning flow on dev
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
        '--audit',
        choices=['conditioning', 'dashboard', 'full'],
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

    args = parser.parse_args()

    # Determine the task
    task = args.task if args.task else AUDIT_TASKS[args.audit]
    base_url = ENV_URLS[args.env]
    headless = not args.headed

    # Run it
    asyncio.run(run_audit(
        task=task,
        base_url=base_url,
        email=args.email,
        password=args.password,
        record=args.record,
        headless=headless,
    ))


if __name__ == '__main__':
    main()
