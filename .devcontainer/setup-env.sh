#!/bin/bash
# Auto-generates .env.local from .env.prod + GitHub Codespace secrets.
# Runs on postCreate. Skips if .env.local already exists (preserves existing setup).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
ENV_FILE="$ROOT_DIR/.env.local"

if [ -f "$ENV_FILE" ]; then
  echo "✓ .env.local already exists — skipping auto-generation."
  exit 0
fi

echo "Generating .env.local from .env.prod + Codespace secrets..."

# Start with the committed prod config (Firebase project IDs, app config, etc.)
if [ -f "$ROOT_DIR/.env.prod" ]; then
  cp "$ROOT_DIR/.env.prod" "$ENV_FILE"
  echo "✓ Copied .env.prod as base"
else
  echo "⚠ .env.prod not found — creating empty .env.local"
  touch "$ENV_FILE"
fi

# Layer in secret API keys from GitHub Codespace secrets (not committed to repo)
[ -n "$VITE_GEMINI_API_KEY" ]   && echo "VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY"   >> "$ENV_FILE"
[ -n "$VITE_OPENAI_API_KEY" ]   && echo "VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY"   >> "$ENV_FILE"

echo "✓ .env.local ready with $(wc -l < "$ENV_FILE") variables."
echo ""
echo "  If API keys are missing, add them at:"
echo "  github.com/rob637/leaderreps-PDPlatformDev → Settings → Secrets and variables → Codespaces"
