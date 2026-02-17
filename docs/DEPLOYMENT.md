# LeaderReps Deployment Guide

## ⚠️ CRITICAL: NEVER USE RAW FIREBASE COMMANDS

Environment variables are **baked into the build at compile time** by Vite.
This means you MUST use the deployment scripts that handle environment setup.

## ✅ CORRECT WAY TO DEPLOY

### Deploy to DEV:
```bash
npm run deploy:dev
```

### Deploy to TEST:
```bash
npm run deploy:test
```

### Deploy to PROD:
```bash
npm run deploy:prod
# Type 'DEPLOY PROD' when prompted to confirm
```

### Deploy to BOTH (dev and test):
```bash
npm run deploy:dev && npm run deploy:test
```

## ❌ NEVER DO THIS

These commands will cause environment variable mixups:

```bash
# WRONG - Don't use these!
npm run build
firebase deploy --project leaderreps-pd-platform
firebase deploy --project leaderreps-test
firebase deploy --project leaderreps-prod
firebase deploy --only hosting
vite build
```

## Why This Matters

1. **Vite bakes environment variables at build time**
   - `import.meta.env.VITE_*` variables are replaced with actual values during build
   - The `.env.local` file determines which values get baked in
   - Building once and deploying to multiple environments = WRONG

2. **Each environment needs its own build**
   - DEV build uses `.env.dev` → deploys to leaderreps-pd-platform
   - TEST build uses `.env.test` → deploys to leaderreps-test
   - PROD build uses `.env.prod` → deploys to leaderreps-prod

3. **The deploy scripts handle this automatically**
   - `npm run deploy:dev` → copies .env.dev → builds → deploys to DEV
   - `npm run deploy:test` → copies .env.test → builds → deploys to TEST
   - `npm run deploy:prod` → copies .env.prod → builds → deploys to PROD

## Deployment Checklist

- [ ] Commit and push code changes first
- [ ] Use `npm run deploy:dev` for DEV
- [ ] Use `npm run deploy:test` for TEST
- [ ] Use `npm run deploy:prod` for PROD (requires typing 'DEPLOY PROD' to confirm)
- [ ] Verify environment badge after deployment
- [ ] Hard refresh (Ctrl+Shift+R) to clear cache

## Verifying Correct Deployment

After deploying, check the environment badge in the Admin Command Center:
- **DEV**: Should show "DEVELOPMENT" badge
- **TEST**: Should show "TEST" badge
- **PROD**: Should show "PRODUCTION" badge

If you see the wrong badge, the deployment was done incorrectly.

## Production Deployment

For production deployments, see [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md) for:
- Pre-deployment requirements
- First-time setup instructions
- Emergency rollback procedures
