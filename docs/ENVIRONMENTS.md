# LeaderReps Environments

## Environment Overview

### 🔧 Development (leaderreps-pd-platform)
- **Purpose**: Active development and testing
- **Firebase Project**: `leaderreps-pd-platform`
- **URL**: https://leaderreps-pd-platform.web.app/
- **Config File**: `.env.local` (gitignored, for local dev)
- **Deploy Script**: `./deploy.sh "commit message"` or `./deploy-dev.sh "commit message"`

### 🧪 Test (leaderreps-test)
- **Purpose**: QA testing and stakeholder demos
- **Firebase Project**: `leaderreps-test`
- **URL**: https://leaderreps-test.web.app/
- **Config File**: `.env.test`
- **Deploy Script**: `./deploy-test.sh "commit message"`

### 🚀 Production (Coming Soon)
- **Purpose**: Live production environment
- **Status**: To be created in a few weeks
- **Deploy Script**: Will be `./deploy-prod.sh`

## Deployment Commands

### Deploy to Development
```bash
./deploy.sh "your commit message"
# or
./deploy-dev.sh "your commit message"
```

### Deploy to Test
```bash
./deploy-test.sh "your commit message"
```

## Firebase Project Switching

```bash
# List available projects
firebase projects:list

# Switch to test
firebase use test

# Switch to dev (default)
firebase use default
```

## Environment Variables

- `.env.test` - Test environment configuration
- `.env.local` - Local development (gitignored)
- `.env.example` - Template for environment variables

## What Gets Deployed

Both deployment scripts will:
1. Commit and push changes to GitHub
2. Build the project with the appropriate environment config
3. Deploy to Firebase Hosting
4. Deploy Firestore rules and indexes
5. Clean up temporary files

## Current Setup

- ✅ Development environment active
- ✅ Test environment created and deployed
- ⏳ Production environment (coming soon)
