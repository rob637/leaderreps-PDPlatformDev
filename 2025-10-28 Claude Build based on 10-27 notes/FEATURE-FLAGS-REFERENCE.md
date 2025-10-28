# Feature Flags Quick Reference Card

## 🎚️ Firestore Path
`metadata/config` document → `featureFlags` field

---

## ✅ v1 Configuration (Production Ready)

```json
{
  "featureFlags": {
    "enableDevPlan": true,
    "enableReadings": true,
    "enableCourses": true,
    "enableBookends": true,
    "enablePlanningHub": false,
    "enableVideos": false,
    "enableLabs": false,
    "enableRoiReport": false,
    "enableCommunity": false,
    "enableRecap": false,
    "enableLabsAdvanced": false
  }
}
```

---

## 📋 Feature Flag Reference

| Flag | Feature | Boss Status | User Sees? | Admin Sees? |
|------|---------|-------------|------------|-------------|
| `enableDevPlan` | Development Plan | ✅ v1 | ✅ Yes | ✅ Yes |
| `enableReadings` | Professional Reading Hub | ✅ v1 | ✅ Yes | ✅ Yes |
| `enableCourses` | Course Library + QuickStart | ✅ v1 | ✅ Yes | ✅ Yes |
| `enableBookends` | AM/PM Bookends on Dashboard | ✅ v1 NEW | ✅ Yes | ✅ Yes |
| `enablePlanningHub` | Strategic Content Tools | 🚧 v2 | ❌ No | ✅ Yes |
| `enableVideos` | Content Leader Talks | 🚧 v2 | ❌ No | ✅ Yes |
| `enableLabs` | AI Coaching Lab | 🚧 v2 | ❌ No | ✅ Yes |
| `enableRoiReport` | Executive ROI Report | 🚧 v2 | ❌ No | ✅ Yes |
| `enableCommunity` | Leadership Community | 🚧 v2 | ❌ No | ✅ Yes |
| `enableRecap` | Weekly Recap | 🚧 Future | ❌ No | ✅ Yes |

---

## 🔧 Common Scenarios

### Test Bookends as Admin
```json
{
  "featureFlags": {
    "enableBookends": true
  }
}
```
**Result**: You see bookends, regular users see them too

### Hide Bookends from Everyone (Including Admin)
❌ **NOT POSSIBLE** - Admins always bypass flags!
**Workaround**: Comment out the components in Dashboard.jsx

### Show v2 Features to Beta Users
**Option 1**: Make them admins temporarily (add email to ADMIN_EMAILS)
**Option 2**: Create new flag like `enableV2Beta` and check against a beta user list

### Production v1 Launch
Set all flags as shown in "v1 Configuration" above

---

## 🎭 Testing Matrix

| Scenario | enableBookends | User Experience |
|----------|----------------|-----------------|
| Development | `true` | See bookends + all v2 features (as admin) |
| User Testing | `true` | See bookends only (v2 hidden) |
| Production v1 | `true` | See bookends only (v2 hidden) |
| Rollback | `false` | Don't see bookends (v2 still hidden) |

---

## 🚨 Important Notes

### Admin Behavior
- **Admins (rob@sagecg.com, ryan@leaderreps.com) ALWAYS see ALL features**
- Flags don't apply to admins
- This is by design for development/testing
- Test user experience by creating a non-admin account

### Flag Logic in Code
```javascript
// In NavSidebar (App.jsx)
.filter(item => isAdmin || !item.flag || (featureFlags && featureFlags[item.flag] !== false))

// In Dashboard.jsx
{(featureFlags?.enableBookends || isAdmin) && (
  <MorningBookend ... />
)}
```

### Missing Flags
- If flag doesn't exist in Firestore: defaults to MOCK_FEATURE_FLAGS in useAppServices.jsx
- Missing flags are treated as `false` for regular users
- Admins still see everything

---

## 🔄 Flag Update Process

### In Firestore Console
1. Navigate to Firestore
2. Go to `metadata` collection
3. Open `config` document
4. Edit `featureFlags` field
5. Save

### Takes Effect
- **Immediately** for new page loads
- Users need to refresh browser
- No app redeployment needed

---

## 📱 Boss's v1 Vision

**Enabled Features** (what users see):
- ✅ The Arena (Dashboard with AM/PM Bookends)
- ✅ Development Plan
- ✅ Professional Reading Hub
- ✅ Course Library (including QuickStart)
- ✅ App Settings

**Hidden from Users** (admins still see):
- 🚧 Strategic Content Tools
- 🚧 Content Leader Talks
- 🚧 AI Coaching Lab
- 🚧 Executive ROI Report
- 🚧 Leadership Community

---

## 💡 Pro Tips

1. **Test with non-admin account** to see real user experience
2. **Toggle flags in real-time** to demo features to boss
3. **Use Chrome DevTools** to test as different screen sizes
4. **Check Firestore security rules** to ensure flag document is readable
5. **Add new flags** to MOCK_FEATURE_FLAGS for local development

---

## 🐛 Troubleshooting

### "I changed the flag but nothing happened"
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- Check you're not logged in as admin
- Verify flag name matches exactly (case-sensitive)
- Check browser console for errors

### "Admins don't see a feature"
- Check feature actually has flag checking code
- Verify ADMIN_EMAILS includes your email (lowercase)
- Check browser console for isAdmin value

### "Regular users see v2 features"
- Flag might be set to `true` in Firestore
- Check flag name is correct in both Firestore and code
- Verify user email is NOT in ADMIN_EMAILS

---

## 📊 Recommended Flag Progression

### Phase 1: Internal Testing
```json
{
  "enableBookends": true,  // Test new feature
  "enablePlanningHub": false,
  "enableVideos": false,
  "enableLabs": false,
  "enableRoiReport": false,
  "enableCommunity": false
}
```

### Phase 2: Beta Users
```json
{
  "enableBookends": true,  // Rolled out
  "enablePlanningHub": false,
  "enableVideos": false,
  "enableLabs": false,
  "enableRoiReport": false,
  "enableCommunity": false
}
```

### Phase 3: Production v1
Same as Phase 2

### Phase 4: v2 Features Ready
```json
{
  "enableBookends": true,
  "enablePlanningHub": true,  // NEW: Strategic tools ready
  "enableVideos": false,
  "enableLabs": true,  // NEW: AI coaching ready
  "enableRoiReport": false,
  "enableCommunity": false
}
```

---

## 🎯 Quick Commands

### Firebase CLI (if using)
```bash
# Get current flags
firebase firestore:get metadata/config --pretty

# Update flag (example)
firebase firestore:update metadata/config --data '{"featureFlags.enableBookends": true}'
```

### In Browser Console
```javascript
// Check current flags (as logged-in user)
// Open DevTools → Console
// Paste this:
console.log('Feature Flags:', window.__FIREBASE_FLAGS__);
// Note: Variable name depends on how you expose it
```

---

That's it! Toggle flags confidently. 🎚️
