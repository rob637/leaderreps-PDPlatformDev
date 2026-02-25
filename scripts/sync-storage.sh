#!/bin/bash

# Sync Storage Files Between Environments
# Usage: ./scripts/sync-storage.sh dev test
#        ./scripts/sync-storage.sh dev prod
#
# This copies files from one Firebase Storage bucket to another
# Requires: gcloud auth and appropriate permissions

set -e

SOURCE_ENV=$1
TARGET_ENV=$2

if [ -z "$SOURCE_ENV" ] || [ -z "$TARGET_ENV" ]; then
    echo "Usage: ./scripts/sync-storage.sh <source> <target>"
    echo "  Examples:"
    echo "    ./scripts/sync-storage.sh dev test"
    echo "    ./scripts/sync-storage.sh dev prod"
    exit 1
fi

# Map environment names to bucket URLs
get_bucket() {
    case $1 in
        dev)  echo "gs://leaderreps-pd-platform.firebasestorage.app" ;;
        test) echo "gs://leaderreps-test.firebasestorage.app" ;;
        prod) echo "gs://leaderreps-prod.firebasestorage.app" ;;
        *)    echo "Unknown environment: $1"; exit 1 ;;
    esac
}

SOURCE_BUCKET=$(get_bucket $SOURCE_ENV)
TARGET_BUCKET=$(get_bucket $TARGET_ENV)

echo "═══════════════════════════════════════════════════════════════"
echo "  Storage Sync: $SOURCE_ENV → $TARGET_ENV"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Source: $SOURCE_BUCKET"
echo "Target: $TARGET_BUCKET"
echo ""

# Check gcloud auth
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1 | grep -q "@"; then
    echo "❌ Not authenticated with gcloud. Run: gcloud auth login"
    exit 1
fi

echo "✓ Authenticated with gcloud"
echo ""

# Sync the vault folder (contains videos)
echo "📁 Syncing /vault/ ..."
gsutil -m rsync -r "$SOURCE_BUCKET/vault/" "$TARGET_BUCKET/vault/" 2>&1 || {
    echo "⚠️  Note: If you see permission errors, ensure you have Storage Admin role on both projects"
}

# Sync public folder if it exists
echo "📁 Syncing /public/ ..."
gsutil -m rsync -r "$SOURCE_BUCKET/public/" "$TARGET_BUCKET/public/" 2>&1 || true

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Storage sync complete!"
echo ""
echo "Next: Update Firestore URLs with:"
echo "  npm run data:rewrite-urls test"
echo "═══════════════════════════════════════════════════════════════"
