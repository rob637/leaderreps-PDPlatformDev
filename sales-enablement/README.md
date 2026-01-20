# Sales Enablement Assets

## Quick Links

| Asset | How to Access | Format |
|-------|---------------|--------|
| **Executive Summary** | `npm run serve-sales` then open http://localhost:3001 | HTML → Print to PDF |
| **Demo App** | https://leaderreps-demo.web.app | Interactive Web |
| **Video Scripts** | [VIDEO-SCRIPTS.md](./VIDEO-SCRIPTS.md) | Reference |

---

## 📄 Executive Summary (PDF)

A professional one-page leave-behind for prospects.

### To Generate PDF:

1. **Option A: Run locally**
   ```bash
   cd sales-enablement/executive-summary
   npx serve -p 3001
   ```
   Then open http://localhost:3001 and click "Save as PDF" button

2. **Option B: Open directly**
   - Open `sales-enablement/executive-summary/index.html` in Chrome
   - Click "Save as PDF" or use Cmd/Ctrl + P → Save as PDF

3. **Option C: Host on Firebase**
   - Deploy to a `/sales` subdirectory on your site
   - Share link directly with prospects

---

## 🎬 Creating the Videos

### Recommended Approach: Screen Recording + AI Voiceover

**Total investment: ~$50-100 and 2-3 hours**

#### Step 1: Generate AI Voiceover with ElevenLabs

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up (free tier gives ~10 minutes)
3. Select a voice:
   - **Adam** - Professional male
   - **Rachel** - Professional female
   - **Charlie** - Warm, approachable
4. Paste scripts from [VIDEO-SCRIPTS.md](./VIDEO-SCRIPTS.md)
5. Settings: Stability ~0.5, Clarity ~0.75
6. Download as MP3

**Files to create:**
- `explainer-2min.mp3` (full script)
- `hook-30sec.mp3`
- `problem-45sec.mp3`
- `difference-30sec.mp3`
- `social-proof-30sec.mp3`

#### Step 2: Record Demo App Footage

1. Install [Loom](https://loom.com) or use QuickTime/OBS
2. Open the demo at https://leaderreps-demo.web.app
3. Set browser to 1920x1080
4. Record yourself clicking through:
   - Welcome → Dashboard → Morning Practice → Content Library → Conclusion
5. Move slowly and deliberately
6. Record ~3 minutes of clean footage

#### Step 3: Edit Together

**Free options:**
- [CapCut](https://capcut.com) - Free, easy, works in browser
- [DaVinci Resolve](https://blackmagicdesign.com/products/davinciresolve) - Free, professional

**Process:**
1. Import screen recording + voiceover
2. Cut footage to match narration
3. Add text overlays for key stats
4. Add background music (use CapCut's library)
5. Export at 1080p for explainer, 1080x1920 for shorts

---

### Alternative: AI Video Generation

If you don't want to edit video, use AI tools:

#### Option A: Synthesia ($30/video)
1. Go to [synthesia.io](https://synthesia.io)
2. Choose an AI avatar
3. Paste the script
4. Add demo app screenshots as backgrounds
5. Generate and download

#### Option B: HeyGen ($24/month)
1. Go to [heygen.com](https://heygen.com)  
2. Similar process to Synthesia
3. Good for creating multiple videos

#### Option C: Pictory ($19/month)
1. Go to [pictory.ai](https://pictory.ai)
2. Paste script → auto-generates video with stock footage
3. Add your own demo screenshots
4. Good for quick social clips

---

### Video Specifications

| Platform | Resolution | Max Length | Format |
|----------|------------|------------|--------|
| Website/Email | 1920x1080 | Any | MP4 |
| LinkedIn | 1920x1080 | 10 min | MP4 |
| YouTube | 1920x1080 | Any | MP4 |
| TikTok | 1080x1920 | 3 min | MP4 |
| Instagram Reels | 1080x1920 | 90 sec | MP4 |
| YouTube Shorts | 1080x1920 | 60 sec | MP4 |

---

## 📁 File Organization

```
sales-enablement/
├── README.md                    # This file
├── EXECUTIVE-SUMMARY.md         # Copy/text version
├── VIDEO-SCRIPTS.md             # All video scripts
├── executive-summary/
│   └── index.html               # Printable HTML → PDF
└── videos/                      # Put completed videos here
    ├── explainer-2min.mp4
    ├── hook-30sec.mp4
    ├── problem-45sec.mp4
    ├── difference-30sec.mp4
    └── social-proof-30sec.mp4
```

---

## ✅ Video Production Checklist

- [ ] Generate voiceovers in ElevenLabs
- [ ] Record demo app screen capture
- [ ] Edit 2-minute explainer video
- [ ] Cut 30-second "Hook" for TikTok/Shorts
- [ ] Cut 45-second "Problem" for LinkedIn
- [ ] Cut 30-second "Difference" for social
- [ ] Cut 30-second "Social Proof" for LinkedIn
- [ ] Upload to YouTube (unlisted for sales use)
- [ ] Upload to hosting for website embed
- [ ] Create Loom version for personalized outreach

---

## 💡 Pro Tips

1. **For sales calls:** Use Loom to record a personalized version with the prospect's name

2. **For LinkedIn:** Native video gets 3x the reach of links - upload directly

3. **For email:** Host on Wistia or Vidyard to track who watches and how long

4. **For website:** Embed the explainer on landing page above the fold

5. **For trade shows:** Loop the 2-min explainer on a screen at your booth
