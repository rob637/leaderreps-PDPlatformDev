# Leadership Readiness Assessment

A comprehensive assessment to evaluate leadership readiness across 5 key dimensions, helping individuals understand their strengths and growth areas as potential leaders.

## Overview

The Leadership Readiness Assessment is a lead magnet tool that:
- Assesses readiness across 5 leadership dimensions
- Identifies leadership archetype (7 possible archetypes)
- Provides AI-powered personalized coaching insights
- Captures leads for marketing follow-up
- Sends automated results email

## 5 Readiness Dimensions

1. **Self-Awareness** 🪞 - Understanding your strengths, weaknesses, and impact on others
2. **Emotional Intelligence** 💛 - Managing emotions and building relationships  
3. **Strategic Thinking** 🎯 - Seeing the big picture and making sound decisions
4. **Influence & Communication** 📢 - Inspiring and motivating others effectively
5. **Resilience & Adaptability** 🔄 - Handling pressure and navigating change

## Leadership Archetypes

- **Self-Aware Leader** - Leads from authenticity and self-knowledge
- **Empathetic Connector** - Builds bridges and brings out the best in people
- **Strategic Visionary** - Sees around corners and charts the course forward
- **Inspiring Influencer** - Moves people to action through powerful communication
- **Resilient Navigator** - Thrives in chaos and leads through uncertainty
- **Balanced Leader** - Well-rounded and ready for the next level
- **Emerging Leader** - On the path with tremendous potential

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)
- Canvas Confetti (celebration effects)

## Development

```bash
# Install dependencies
npm install

# Run dev server (port 3003)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
readiness-assessment/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   ├── favicon.png
│   ├── logo-white.png
│   └── og-image.png
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── Landing.jsx
    │   ├── AssessmentFlow.jsx
    │   ├── EmailCapture.jsx
    │   └── Results.jsx
    └── data/
        └── questions.js
```

## Assessment Flow

1. **Landing Page** - Introduction and CTA to start
2. **Assessment Flow** - 12 questions across 3 sections:
   - Leadership Scenarios (4 questions)
   - Self-Assessment ratings (5 questions)
   - Preferences & Growth areas (3 questions)
3. **Email Capture** - Teaser of results, email collection
4. **Results Page** - Full results with:
   - Overall readiness score
   - Leadership archetype
   - Radar chart visualization
   - Dimension breakdowns
   - AI coaching insights
   - LeaderReps CTA
   - Social sharing

## Cloud Function Integration

The app calls `analyzeReadinessAssessment` Cloud Function on email submit:
- Generates AI insights via Gemini
- Sends results email
- Stores lead in Firestore (`readiness-leads` collection)

## Deployment

Deploy to Firebase Hosting as a separate project:

```bash
# Build
npm run build

# Deploy (from project root)
firebase deploy --only hosting:leaderreps-readiness
```

Target URL: `https://leaderreps-readiness.web.app` or `https://readiness.leaderreps.com`

## Integration with Sales & Marketing

Leads appear in the Sales & Marketing Center under "Lead Magnets" > "Leadership Readiness" tab with:
- Lead list with filtering by archetype
- Email export functionality  
- Email marketing ideas specific to this assessment
- Link to view the live assessment

## Related Files

- Cloud Function: `functions/index.js` (`analyzeReadinessAssessment`)
- Firestore Rules: `firestore.rules` (`readiness-leads`)
- Admin UI: `src/components/admin/AssessmentLeadsManager.jsx`
