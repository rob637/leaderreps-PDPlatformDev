# LeaderReps Environments

## Environment Overview

### 🔧 Development (leaderreps-pd-platform)
- **Purpose**: Active development and testing
- **Firebase Project**: `leaderreps-pd-platform`
- **URL**: https://leaderreps-pd-platform.web.app/
- **Config File**: `.env.dev` (committed) / `.env.local` (gitignored, for local dev)
- **Deploy Command**: `npm run deploy:dev`

### 🧪 Test (leaderreps-test)
- **Purpose**: QA testing and stakeholder demos
- **Firebase Project**: `leaderreps-test`
- **URL**: https://leaderreps-test.web.app/
- **Config File**: `.env.test`
- **Deploy Command**: `npm run deploy:test`

### 🚀 Production (leaderreps-prod)
- **Purpose**: Live production environment
- **Firebase Project**: `leaderreps-prod`
- **URL**: https://leaderreps-prod.web.app/
- **Config File**: `.env.prod`
- **Deploy Command**: `npm run deploy:prod` (requires confirmation)
- **See Also**: [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)

## Deployment Commands

### Deploy to Development
```bash
npm run deploy:dev
```

### Deploy to Test
```bash
npm run deploy:test
```

### Deploy to Production
```bash
npm run deploy:prod
# Type 'DEPLOY PROD' when prompted to confirm
```

## Firebase Project Switching

```bash
# List available projects
firebase projects:list

# Switch to test
firebase use test

# Switch to prod
firebase use prod

# Switch to dev (default)
firebase use default
```

## Environment Variables

| File | Purpose | Committed |
|------|---------|-----------|
| `.env.dev` | Development environment | ✅ Yes |
| `.env.test` | Test environment | ✅ Yes |
| `.env.prod` | Production environment | ✅ Yes |
| `.env.local` | Local overrides (API keys) | ❌ No (gitignored) |
| `.env.secrets` | Shared secrets (API keys) | ❌ No (gitignored) |
| `.env.example` | Template for new devs | ✅ Yes |

## What Gets Deployed

All deployment scripts will:
1. Copy the environment-specific .env file to .env.local
2. Build the project with Vite (which bakes in env vars)
3. Deploy to the appropriate Firebase Hosting site
4. Restore .env.local to DEV for local development

## Current Setup

- ✅ Development environment active
- ✅ Test environment active
- ✅ Production environment ready
