# Security

## Secret management

- **All AI provider keys** (Gemini, Claude, etc.) live in **Google Secret Manager** per Firebase project. Never commit them. Never put them in `.env*` files.
- **Firebase web API keys** (the `apiKey` field of `firebaseConfig`) are public-by-design — they're embedded in every client bundle. Security is enforced by Firebase rules + GCP HTTP referrer restrictions, not by hiding the key.
- **Admin SDK service-account JSONs** must never be committed. Prefer `gcloud auth application-default login` (ADC) for local scripts. Rotate any key that ever lived in a Docker image or CI log.

## Secret rotation

To rotate a secret (example: `GEMINI_API_KEY` in test):

```bash
# 1. Create new key in GCP Console → APIs & Services → Credentials
# 2. Set it in Secret Manager (you'll be prompted to paste — type/paste directly, never via chat tools)
firebase functions:secrets:set GEMINI_API_KEY --project leaderreps-test
# 3. Redeploy any function that uses it so the new version is loaded
firebase deploy --only functions:geminiProxy --project leaderreps-test
# 4. Delete the OLD key in GCP Console Credentials page
```

## Pre-commit secret scanning

Enable the gitleaks pre-commit hook:

```bash
# One-time per clone
git config core.hooksPath .githooks
# Install gitleaks binary
# macOS: brew install gitleaks
# Linux: download from https://github.com/gitleaks/gitleaks/releases
```

The hook runs `gitleaks protect --staged` on every commit and blocks if a secret is detected. Allowlist false positives in `.gitleaks.toml`. Bypass only in genuine emergency with `git commit --no-verify`.

## Reporting a vulnerability

Email security@sagecg.com — please do not file public GitHub issues for security reports.
