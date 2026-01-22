# LeaderReps Corporate Hub

Internal employee hub for LeaderReps team. Replaces paid SaaS tools.

## 💰 Cost Savings

| Tool Replaced       | Monthly Cost | Annual Savings |
|---------------------|--------------|----------------|
| Sales Navigator     | $150         | $1,800         |
| LinkedIn Helper     | $50          | $600           |
| Calendly            | $20          | $240           |
| Amplify             | $100         | $1,200         |
| **TOTAL**           | **$320/mo**  | **$3,840/yr**  |

## 🚀 Features

### Current
- **Dashboard** - Overview of all tools with savings tracker
- **Prospects** - Sales Navigator replacement (CRM-style prospecting)
- **Vendors** - Client & vendor management
- **Demos** - Demo scheduling and tracking
- **Scheduler** - Calendly replacement for meeting bookings
- **Content Hub** - Amplify replacement for content sharing
- **Feature Lab** - A/B testing and feature flags

### Coming Soon
- Calendar sync (Google, Outlook)
- Public booking pages
- Email sequences (LinkedIn Helper replacement)
- Content analytics
- CRM integrations

## 🛠 Setup

### Prerequisites
- Node.js 18+
- Firebase CLI
- Access to leaderreps-test Firebase project

### Local Development

1. **Install dependencies:**
```bash
cd corporate
npm install
```

2. **Create .env file:**
```bash
cp .env.example .env
# Edit .env with actual Firebase credentials from the main app
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:5174
```

### Firebase Multi-Site Hosting Setup

To deploy the corporate hub alongside the main app, you need to set up multi-site hosting:

1. **Create a new hosting site in Firebase:**
```bash
firebase hosting:sites:create corporate
```

2. **Update firebase.json** to use multiple hosting targets:
```json
{
  "hosting": [
    {
      "target": "app",
      "public": "build",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{"source": "**", "destination": "/index.html"}]
    },
    {
      "target": "corporate",
      "public": "corporate/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{"source": "**", "destination": "/index.html"}]
    }
  ]
}
```

3. **Apply hosting targets in .firebaserc:**
```json
{
  "projects": {
    "default": "leaderreps-test"
  },
  "targets": {
    "leaderreps-test": {
      "hosting": {
        "app": ["leaderreps-test"],
        "corporate": ["corporate"]
      }
    }
  }
}
```

4. **Build and deploy:**
```bash
# Build corporate hub
cd corporate
npm run build

# Deploy only corporate site
cd ..
firebase deploy --only hosting:corporate
```

### Access Control

The Corporate Hub is restricted to `@sagecg.com` and `@leaderreps.com` email domains.
Users with other domains will see an "Access Denied" screen.

## 📁 Project Structure

```
corporate/
├── src/
│   ├── components/
│   │   └── Layout.jsx         # Sidebar navigation
│   ├── contexts/
│   │   └── AuthContext.jsx    # Firebase auth + domain restriction
│   ├── pages/
│   │   ├── Dashboard.jsx      # Main overview
│   │   ├── Prospects.jsx      # Sales Navigator replacement
│   │   ├── Vendors.jsx        # Client management
│   │   ├── Demos.jsx          # Demo tracking
│   │   ├── Scheduler.jsx      # Calendly replacement
│   │   ├── ContentHub.jsx     # Amplify replacement
│   │   ├── FeatureLab.jsx     # A/B testing
│   │   └── LoginPage.jsx      # Auth gate
│   ├── App.jsx                # Routes
│   ├── firebase.js            # Firebase config
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 Design System

Uses the same Tailwind theme as the main LeaderReps app:
- **corporate-navy**: `#0B3954` (primary text)
- **corporate-teal**: `#087E8B` (primary action)
- Brand consistency across all internal tools

## 🔐 Security

- Firebase Authentication required
- Domain-restricted to `@sagecg.com` and `@leaderreps.com`
- Firestore rules should be updated to allow corporate data access
- All data stored in Firestore (same project as main app)

## 📝 Data Collections (Coming)

When we implement full functionality, we'll need these Firestore collections:

```
corporate_prospects/      # Sales prospect data
corporate_vendors/        # Vendor/client management
corporate_demos/          # Demo scheduling
corporate_scheduler/      # Calendar bookings
corporate_content/        # Content library
corporate_experiments/    # A/B test data
corporate_feature_flags/  # Feature flag configs
```
