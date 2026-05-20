#!/usr/bin/env node
/**
 * scripts/data/generate-welcome-pdfs.cjs
 *
 * Generates branded "Welcome to Foundation" and "Welcome to Ascent" PDFs,
 * uploads them to Firebase Storage, and patches the corresponding
 * content_library/{welcome-to-foundation, welcome-to-ascent} docs so
 * details.url points at the new file (with a Firebase download token).
 *
 * Companion to: scripts/data/seed-welcome-documents.cjs
 *
 * Usage:
 *   node scripts/data/generate-welcome-pdfs.cjs            # dev (default)
 *   node scripts/data/generate-welcome-pdfs.cjs test
 *   node scripts/data/generate-welcome-pdfs.cjs prod
 *
 * Notes:
 * - Reuses pdfkit + @google-cloud/storage from functions/node_modules so we
 *   don't add new root deps. If those modules are missing, run
 *   `npm --prefix functions install` first.
 * - Idempotent: re-running overwrites the PDF and refreshes the URL.
 */

const path = require('path');
const Module = require('module');

// Allow requiring packages installed under functions/node_modules
const FUNCTIONS_NODE_MODULES = path.resolve(__dirname, '..', '..', 'functions', 'node_modules');
const ROOT_NODE_MODULES = path.resolve(__dirname, '..', '..', 'node_modules');
const origResolve = Module._resolveLookupPaths;
Module._resolveLookupPaths = function (request, parent) {
  const result = origResolve.call(this, request, parent) || [];
  if (Array.isArray(result)) {
    if (!result.includes(FUNCTIONS_NODE_MODULES)) result.push(FUNCTIONS_NODE_MODULES);
    if (!result.includes(ROOT_NODE_MODULES)) result.push(ROOT_NODE_MODULES);
  }
  return result;
};

const PDFDocument = require('pdfkit');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { PassThrough } = require('stream');

const ENV = (process.argv[2] || 'dev').toLowerCase();
const ENV_TO_PROJECT = {
  dev: { projectId: 'leaderreps-pd-platform', bucket: 'leaderreps-pd-platform.firebasestorage.app' },
  test: { projectId: 'leaderreps-test', bucket: 'leaderreps-test.firebasestorage.app' },
  prod: { projectId: 'leaderreps-prod', bucket: 'leaderreps-prod.firebasestorage.app' },
};
const ENV_CONFIG = ENV_TO_PROJECT[ENV];
if (!ENV_CONFIG) {
  console.error(`Unknown env "${ENV}". Use: dev | test | prod`);
  process.exit(1);
}

const KEY_FILE = path.resolve(
  __dirname,
  '..',
  '..',
  `${ENV_CONFIG.projectId}-firebase-adminsdk.json`
);

const sa = require(KEY_FILE);
admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: ENV_CONFIG.projectId,
  storageBucket: ENV_CONFIG.bucket,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Brand colors (mirrors tailwind.config.cjs)
const NAVY = '#002E47';
const TEAL = '#47A88D';
const ORANGE = '#E04E1B';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748B';

// ---------------------------------------------------------------------------
// PDF Content
// ---------------------------------------------------------------------------
const DOCS = [
  {
    id: 'welcome-to-foundation',
    storagePath: 'content/welcome/welcome-to-foundation.pdf',
    title: 'Welcome to Foundation',
    subtitle: 'The core program where your leadership practice begins.',
    intro:
      'Foundation is the core LeaderReps program: a focused set of Real Reps that build the ' +
      'leadership behaviors you\'ll carry the rest of your career. There is no fixed calendar. ' +
      'You move forward when the work is done and your trainer signs off. Read this once before ' +
      'you begin so you know how the app is set up and how to use it well.',
    sections: [
      {
        heading: 'What Foundation Is',
        body:
          'Foundation is a trainer-paced program built around Real Reps — leadership behaviors ' +
          'you practice in your real work and submit evidence of, not videos you watch and check ' +
          'off. Your trainer reviews what you submit, gives you feedback, and signs off when ' +
          'you\'re ready. Progression is based on demonstrated behavior, not time spent in the app.',
      },
      {
        heading: 'Your Dashboard',
        body:
          'When you log in, your dashboard shows everything that matters today. There is no ' +
          'forced schedule and no AM/PM gates — just five things in one place:',
        bullets: [
          'Foundation Kickoff — your required to-dos. This stays on the dashboard until everything is done, then auto-hides.',
          'Notifications — announcements from your trainer and the LeaderReps team.',
          'My Events — coaching sessions and community events you\'re registered for, with a Join button when it\'s time.',
          'Upcoming Events — coaching and community events you can register for in one tap.',
          'Ask a Trainer — send a question privately, or browse answered questions from other leaders.',
        ],
      },
      {
        heading: 'Your Navigation',
        body:
          'The rest of the app lives in the navigation. The sections you\'ll use most:',
        bullets: [
          'Events — the full list of coaching and community sessions, combined in one place.',
          'Content — every video, reading, workbook, and tool you need for Foundation.',
          'Conditioning — where you log Real Reps: practice a behavior in a real situation, then debrief it here.',
          'Ask a Trainer — same as the dashboard widget, with full history.',
          'Your Locker — your evidence, history, and certificates as you complete work.',
        ],
      },
      {
        heading: 'What\'s Expected of You',
        body:
          'You are expected to complete the required Real Reps and provide acceptable evidence ' +
          'of the behavior in your real work. Trainers will coach, challenge, and hold standards ' +
          '— they will not take ownership of your work. Progression may be paused if reps are ' +
          'incomplete or below standard. The path forward is always the same: do the next rep.',
      },
      {
        heading: 'How to Get the Most Out of It',
        bullets: [
          'Treat the reps as real work, not assignments. Pick situations that actually matter to you.',
          'Submit evidence honestly — partial truth slows you down more than missed deadlines.',
          'Register for coaching and community events early; they\'re where the real conversations happen.',
          'Use Ask a Trainer when you\'re stuck. That\'s what it\'s for.',
          'Revisit Content whenever you need a refresher. Everything stays available — even after Foundation.',
        ],
      },
      {
        heading: 'Ready to Begin',
        body:
          'Head back to your dashboard and start with whatever\'s in Foundation Kickoff. When ' +
          'your trainer signs off your Foundation work, you\'ll be welcomed into Ascent. Until ' +
          'then — do the work, in the open, on real situations. Welcome to Foundation.',
      },
    ],
    accent: TEAL,
  },
  {
    id: 'welcome-to-ascent',
    storagePath: 'content/welcome/welcome-to-ascent.pdf',
    title: 'Welcome to Ascent',
    subtitle: 'Where your leadership practice becomes a way of being.',
    intro:
      'Your trainer has signed off your Foundation work. Foundation isn\'t the end — it\'s the ' +
      'beginning. Ascent is the ongoing practice phase: no end date, no fixed schedule, just ' +
      'continued reps as you keep growing. Your dashboard has been cleared of Foundation ' +
      'carry-over so you can focus on what\'s next. Read this once so you know how Ascent is ' +
      'different from Foundation.',
    sections: [
      {
        heading: 'What Ascent Is',
        body:
          'Ascent is indefinite. You stay in Ascent as long as you\'re actively practicing ' +
          'leadership. There are no milestones to hit and no countdown to a finish line. The ' +
          'work shifts from building the foundational reps to applying them under real pressure ' +
          '— bigger decisions, harder conversations, and the people you lead.',
      },
      {
        heading: 'Your Dashboard (Same Five Things, New Focus)',
        body:
          'Your dashboard looks and behaves the same as it did in Foundation:',
        bullets: [
          'Ascent Kickoff — any required Ascent to-dos. Auto-hides when complete.',
          'Notifications — announcements from your trainer and the LeaderReps team.',
          'My Events — coaching sessions and community events you\'re registered for.',
          'Upcoming Events — new coaching and community events you can register for.',
          'Ask a Trainer — your direct line to a trainer between sessions.',
        ],
      },
      {
        heading: 'What Carries Over',
        bullets: [
          'Content — every Foundation video, reading, workbook, and tool stays in the Content section. Revisit anything, any time.',
          'Your Locker — your Foundation evidence, history, and certificates remain there.',
          'Events, Conditioning, and Ask a Trainer — all still available, now focused on applied leadership.',
        ],
      },
      {
        heading: 'How to Use Ascent Well',
        bullets: [
          'Pick the rep that matters this week and run it for real — don\'t rehearse generic situations.',
          'Bring real moments into your coaching and community events. The harder the situation, the more useful the conversation.',
          'Use Ask a Trainer for the questions that don\'t fit a session.',
          'Track patterns across your Conditioning debriefs — that\'s where your next breakthrough lives.',
          'When you stall, shrink the rep. A small honest action beats a perfect plan.',
        ],
      },
      {
        heading: 'What Success Looks Like',
        body:
          'In Ascent, success isn\'t measured by what you complete in the app. It\'s measured ' +
          'by how the people around you experience your leadership. Over time, the reps stop ' +
          'feeling like reps — they become the way you show up.',
      },
      {
        heading: 'Ready to Climb',
        body:
          'Head back to your dashboard and start with whatever\'s in front of you today. ' +
          'Same tools, sharper edges. Welcome to Ascent.',
      },
    ],
    accent: ORANGE,
  },
];

// ---------------------------------------------------------------------------
// PDF builder
// ---------------------------------------------------------------------------
function buildPdf(spec) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: { Title: spec.title, Author: 'LeaderReps' },
    });
    const stream = new PassThrough();
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    doc.pipe(stream);

    // Header band
    doc.rect(0, 0, doc.page.width, 90).fill(NAVY);
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('LEADERREPS', 72, 32, { characterSpacing: 2 });
    doc
      .fillColor(spec.accent)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('PROFESSIONAL DEVELOPMENT', 72, 50, { characterSpacing: 1.5 });

    // Reset cursor below header
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(28).text(spec.title, 72, 130);
    doc.moveDown(0.3);
    doc.fillColor(SLATE_500).font('Helvetica').fontSize(13).text(spec.subtitle);

    // Accent rule
    const ruleY = doc.y + 10;
    doc.moveTo(72, ruleY).lineTo(160, ruleY).lineWidth(3).strokeColor(spec.accent).stroke();
    doc.moveDown(1.2);

    // Intro
    doc
      .fillColor(SLATE_700)
      .font('Helvetica')
      .fontSize(11)
      .text(spec.intro, { align: 'left', lineGap: 4 });
    doc.moveDown(1);

    // Sections
    spec.sections.forEach((section) => {
      // Page-break safety
      if (doc.y > doc.page.height - 160) doc.addPage();

      doc
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(section.heading, { lineGap: 2 });
      doc.moveDown(0.4);

      if (section.body) {
        doc
          .fillColor(SLATE_700)
          .font('Helvetica')
          .fontSize(11)
          .text(section.body, { align: 'left', lineGap: 4 });
      }

      if (Array.isArray(section.bullets)) {
        section.bullets.forEach((b) => {
          if (doc.y > doc.page.height - 100) doc.addPage();
          const startY = doc.y;
          doc.fillColor(spec.accent).font('Helvetica-Bold').fontSize(11).text('•', 72, startY);
          doc
            .fillColor(SLATE_700)
            .font('Helvetica')
            .fontSize(11)
            .text(b, 90, startY, {
              width: doc.page.width - 90 - 72,
              lineGap: 3,
            });
          doc.moveDown(0.35);
        });
      }

      doc.moveDown(0.8);
    });

    // Footer on last page
    const footerY = doc.page.height - 50;
    doc
      .fillColor(SLATE_500)
      .font('Helvetica')
      .fontSize(9)
      .text('LeaderReps Professional Development', 72, footerY, { align: 'left' });
    doc
      .fillColor(SLATE_500)
      .font('Helvetica')
      .fontSize(9)
      .text('leaderreps.com', 72, footerY, {
        align: 'right',
        width: doc.page.width - 144,
      });

    doc.end();
  });
}

// ---------------------------------------------------------------------------
// Upload + Firestore patch
// ---------------------------------------------------------------------------
async function uploadPdf(buffer, storagePath) {
  const file = bucket.file(storagePath);
  const downloadToken = crypto.randomUUID();

  await file.save(buffer, {
    metadata: {
      contentType: 'application/pdf',
      cacheControl: 'public, max-age=3600',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
    resumable: false,
  });

  const encodedPath = encodeURIComponent(storagePath);
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
  return url;
}

async function patchContentDoc(id, url) {
  const ref = db.collection('content_library').doc(id);
  const snap = await ref.get();
  const now = admin.firestore.FieldValue.serverTimestamp();
  if (!snap.exists) {
    console.warn(`  ! content_library/${id} does not exist — run seed-welcome-documents.cjs first.`);
    return;
  }
  const existing = snap.data() || {};
  await ref.set(
    {
      ...existing,
      type: existing.type || 'DOCUMENT',
      status: existing.status || 'PUBLISHED',
      details: {
        ...(existing.details || {}),
        url,
      },
      updatedAt: now,
    },
    { merge: true }
  );
}

(async () => {
  console.log(`\nGenerating Welcome PDFs for ${ENV_CONFIG.projectId} (env=${ENV})\n`);
  for (const spec of DOCS) {
    process.stdout.write(`  • ${spec.id} ... `);
    const buf = await buildPdf(spec);
    const url = await uploadPdf(buf, spec.storagePath);
    await patchContentDoc(spec.id, url);
    console.log('done');
    console.log(`      storage: gs://${bucket.name}/${spec.storagePath}`);
    console.log(`      url:     ${url}`);
  }
  console.log('\n✅ Welcome documents are live. Refresh the app to see them.\n');
  process.exit(0);
})().catch((e) => {
  console.error('\n❌ Failed to generate Welcome PDFs:', e);
  process.exit(1);
});
