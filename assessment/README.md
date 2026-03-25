# LeaderReps Leadership DNA Assessment

A world-class, AI-powered leadership assessment that captures email leads and delivers personalized insights.

## Features

- **12 Science-Based Questions**: Scenarios, self-assessments, and preference ranking
- **6 Leadership Dimensions**: Vision, People, Execution, Communication, Adaptability, Innovation
- **AI-Powered Insights**: Personalized coaching feedback via Gemini
- **Beautiful Results**: Radar chart visualization, archetype matching
- **Email Capture**: Results delivered via email (lead generation)
- **Social Sharing**: LinkedIn and Twitter share buttons
- **Mobile-First**: Responsive design with smooth animations

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Framer Motion (animations)
- Canvas Confetti (celebration effect)
- Lucide React (icons)

## Local Development

```bash
cd assessment
npm install
npm run dev
```

Open http://localhost:3001

## Build & Deploy

### Build for production
```bash
npm run build
```

Output goes to `dist/`

### Deploy to Firebase Hosting

Add a hosting target in the main `firebase.json`:

```json
{
  "hosting": [
    {
      "target": "assessment",
      "public": "assessment/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

Then deploy:
```bash
firebase deploy --only hosting:assessment
```

### Custom Domain Setup

1. In Firebase Console → Hosting → Add custom domain
2. Add `assessment.leaderreps.com`
3. Follow DNS verification steps

## Cloud Function

The assessment uses the `analyzeLeadershipAssessment` Cloud Function:
- Generates AI insights via Gemini
- Stores leads in Firestore (`assessment-leads` collection)
- Sends beautiful HTML email with results

## Assessment Flow

1. **Landing** - Hook with value proposition
2. **Questions** - 12 questions across 3 sections
3. **Email Capture** - Gate results with email
4. **Results** - Full visualization + AI insights + CTA

## Lead Data (Firestore)

Leads are stored in `assessment-leads` collection:

```javascript
{
  email: "user@example.com",
  firstName: "John",
  results: { /* scores, archetype, etc */ },
  aiInsights: "Personalized feedback...",
  source: "leadership-dna-assessment",
  createdAt: Timestamp,
  marketingOptIn: true
}
```

## Customization

### Questions
Edit `src/data/questions.js` to modify questions, dimensions, or archetypes.

### Styling
Brand colors are in `tailwind.config.js`:
- Navy: #002E47
- Teal: #47A88D
- Orange: #E04E1B

### AI Prompt
Edit the `generateLeadershipInsights` function in `functions/index.js` to adjust the AI coaching tone/style.
