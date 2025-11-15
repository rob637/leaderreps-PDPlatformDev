# Environment Setup Guide

This project uses multiple Firebase environments to support different stages of development.

## Environments

### 🔧 Development (leaderreps-pd-platform)
- **Purpose**: Active development and feature work
- **URL**: https://leaderreps-pd-platform.web.app/
- **Firebase Project**: `leaderreps-pd-platform`
- **Config File**: `.env.dev`
- **Deploy Script**: `./deploy-dev.sh "commit message"`

### 🧪 Test (leaderreps-test)
- **Purpose**: QA testing and user acceptance testing
- **URL**: https://leaderreps-test.web.app/
- **Firebase Project**: `leaderreps-test`
- **Config File**: `.env.test`
- **Deploy Script**: `./deploy-test.sh "commit message"`

### 🚀 Production (Coming Soon)
- **Purpose**: Live production environment for end users
- **Status**: To be created in a few weeks
- **Config File**: Will be `.env.production`

## Deployment

### Deploy to Development
```bash
./deploy-dev.sh "Your commit message"
```

### Deploy to Test
```bash
./deploy-test.sh "Your commit message"
```

## Manual Deployment

If you need more control, you can deploy manually:

### Switch environments:
```bash
firebase use dev    # Switch to development
firebase use test   # Switch to test
firebase use default # Switch back to default (dev)
```

### Build and deploy:
```bash
# Copy the appropriate environment file
cp .env.test .env.local

# Build the project
npm run build

# Deploy
firebase deploy --only hosting

# Clean up
rm .env.local
```

## Environment Variables

Each environment has its own configuration file:

- `.env.dev` - Development environment config
- `.env.test` - Test environment config
- `.env.example` - Template for environment variables

### Key Differences:

**Development (.env.dev)**
- `VITE_ENABLE_DEBUG_MODE=true`
- `VITE_ENABLE_ANALYTICS=false`
- `VITE_ENV=development`

**Test (.env.test)**
- `VITE_ENABLE_DEBUG_MODE=true`
- `VITE_ENABLE_ANALYTICS=false`
- `VITE_ENV=test`

## Firebase Projects

View your Firebase projects:
```bash
firebase projects:list
```

Current configuration is stored in `.firebaserc`:
```json
{
  "projects": {
    "default": "leaderreps-pd-platform",
    "dev": "leaderreps-pd-platform",
    "test": "leaderreps-test"
  }
}
```

## Access Control

### Development
- For internal development team
- Full access to debugging tools
- Frequent updates

### Test
- Share with stakeholders for QA
- URL: https://leaderreps-test.web.app/
- More stable than dev, less frequent updates
- Use for user acceptance testing

## Best Practices

1. **Always test in dev first** before deploying to test
2. **Deploy to test** when you want to share features with stakeholders
3. **Use meaningful commit messages** when deploying
4. **Keep test environment stable** - don't deploy work-in-progress
5. **Document breaking changes** when deploying to test

## Troubleshooting

### Check which environment you're using:
```bash
firebase use
```

### View deployment history:
```bash
firebase hosting:channel:list
```

### Roll back a deployment:
```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

## Firebase Console Links

- [Development Console](https://console.firebase.google.com/project/leaderreps-pd-platform/overview)
- [Test Console](https://console.firebase.google.com/project/leaderreps-test/overview)
