# LeaderReps Sales Hub - Chrome Extension

Gmail integration for the LeaderReps Sales Hub CRM. View prospect data directly in Gmail without switching tabs.

## Features

- **Automatic Prospect Detection**: Opens a sidebar with CRM data when you view an email from a known prospect
- **Quick Actions**: Log calls, add notes, send emails directly from Gmail
- **Add New Prospects**: One-click to add unknown senders to your CRM
- **Activity Timeline**: See recent interactions at a glance

## Installation (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `chrome-extension` folder
5. The extension icon should appear in your toolbar

## Structure

```
chrome-extension/
├── manifest.json       # Extension manifest (MV3)
├── background.js       # Service worker for API calls
├── content.js          # Injected into Gmail pages
├── content.css         # Styles for injected elements
├── popup/              # Extension popup (click icon)
│   ├── popup.html
│   └── popup.js
├── sidebar/            # CRM sidebar panel
│   ├── sidebar.html
│   └── sidebar.js
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Development

### Testing Changes
1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the reload icon on the extension card
4. Refresh Gmail

### Adding Icons
Replace the placeholder icons in `icons/` with actual images:
- `icon16.png`: 16x16px (toolbar)
- `icon48.png`: 48x48px (extensions page)
- `icon128.png`: 128x128px (Chrome Web Store)

## Authentication

The extension authenticates via the main Sales Hub web app:
1. User clicks "Sign In" in the popup
2. Opens Sales Hub login page with `?extension=true` parameter
3. After login, the web app sends auth tokens to the extension via `chrome.storage`

## API Endpoints Required

The extension calls these Cloud Functions (need to be implemented):

- `prospectLookup` - Look up prospect by email address
- `getProspect` - Get full prospect data by ID
- `logActivity` - Log activity to prospect timeline
- `updateProspectStatus` - Update prospect status

## Security Notes

- Tokens are stored in `chrome.storage.local` (encrypted by Chrome)
- Only communicates with `leaderreps.team` domain
- No third-party analytics or tracking
- User data never leaves the extension except to Firebase

## Publishing

1. Create icons (16, 48, 128px)
2. Update `manifest.json` version
3. Zip the extension folder
4. Upload to Chrome Web Store Developer Dashboard
