# Production Deployment Checklist

## Pre-Deployment Requirements

### Firebase Project Setup
- [ ] Firebase project `leaderreps-prod` created and configured
- [ ] Service account key generated and saved as `leaderreps-prod-firebase-adminsdk.json`
- [ ] Key file added to `.gitignore` (do NOT commit)
- [ ] Firebase Auth configured with production domain
- [ ] Firebase Authentication providers enabled (Email/Password, Google, etc.)

### Environment Configuration
- [ ] `.env.prod` file exists with correct values
- [ ] Production Gemini API key configured
- [ ] Admin emails configured for production
- [ ] Analytics tracking ID set

### Cloud Functions
- [ ] Functions deployed to `leaderreps-prod` project
- [ ] CORS configuration applied to production
- [ ] Function environment variables configured (Gemini API key, etc.)

### Firestore
- [ ] Firestore rules deployed to production
- [ ] Firestore indexes deployed to production
- [ ] Initial app data migrated from test environment

### Storage
- [ ] Storage rules deployed to production
- [ ] Storage CORS configuration applied
- [ ] Lifecycle rules configured

---

## First-Time Production Setup

### 1. Firebase CLI Authentication
```bash
firebase login
firebase projects:list  # Verify leaderreps-prod is listed
```

### 2. Generate Admin SDK Key
1. Go to Firebase Console → `leaderreps-prod` → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `leaderreps-prod-firebase-adminsdk.json` in project root
4. Verify it's in `.gitignore`

### 3. Configure Cloud Functions Environment
```bash
firebase use prod
firebase functions:config:set gemini.apikey="YOUR_PRODUCTION_API_KEY"
```

### 4. Deploy Firestore Rules & Indexes
```bash
firebase use prod
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Deploy Cloud Functions
```bash
firebase use prod
npm --prefix functions install
firebase deploy --only functions
```

### 6. Migrate Application Data
```bash
# Export from test environment (after QA approval)
npm run data:export test

# Import to production
npm run data:import prod ./data-exports/app-data-test-YYYY-MM-DD.json
```

### 7. Configure Storage
```bash
firebase use prod
firebase deploy --only storage
gsutil cors set cors.json gs://leaderreps-prod.firebasestorage.app
```

### 8. Deploy Hosting
```bash
npm run deploy:prod
# Type 'DEPLOY PROD' when prompted to confirm
```

---

## Regular Deployment Checklist

### Before Deploying

- [ ] All tests pass locally: `npm run test:run`
- [ ] E2E tests pass on test environment: `npm run e2e:test`
- [ ] Code reviewed and approved
- [ ] Changes tested thoroughly on test environment
- [ ] No console errors in test environment
- [ ] Version number updated in `package.json`

### Deploy Steps

1. **Ensure test environment is stable**
   ```bash
   npm run e2e:test
   ```

2. **Deploy to production**
   ```bash
   npm run deploy:prod
   ```
   Type `DEPLOY PROD` when prompted.

3. **Verify deployment**
   - Open https://leaderreps-prod.web.app
   - Hard refresh (Ctrl+Shift+R)
   - Check environment badge shows "PRODUCTION"
   - Test critical flows (login, daily plan, etc.)

4. **Run production smoke tests**
   ```bash
   npm run e2e:prod -- --grep "@smoke"
   ```

### After Deploying

- [ ] Monitor error reporting dashboard
- [ ] Check Analytics for user activity
- [ ] Verify Cloud Functions are running correctly
- [ ] Confirm no increase in error rates

---

## Emergency Rollback

If a production deployment causes issues:

### Option 1: Redeploy Previous Version
```bash
# Check out the previous working commit
git checkout <previous-commit-hash>

# Rebuild and deploy
npm run deploy:prod
```

### Option 2: Firebase Console Rollback
1. Go to Firebase Console → Hosting
2. Click on `leaderreps-prod`
3. Find the previous deployment in the list
4. Click "Rollback" button

---

## Production URLs

| Service | URL |
|---------|-----|
| Main App | https://leaderreps-prod.web.app |
| Custom Domain | https://app.leaderreps.com (if configured) |
| Firebase Console | https://console.firebase.google.com/project/leaderreps-prod |

---

## Contact

For production issues, contact:
- Technical Lead: rob@sagecg.com
- Support: admin@leaderreps.com
