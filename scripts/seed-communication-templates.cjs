/**
 * Seed Communication Templates
 * 
 * Initializes the communication_templates collection with default templates
 * extracted from the current hardcoded values in Cloud Functions.
 * 
 * Usage:
 *   node scripts/seed-communication-templates.cjs [--project=<project-id>]
 * 
 * Options:
 *   --project=leaderreps-pd-platform  (DEV - default)
 *   --project=leaderreps-test         (TEST)
 *   --project=leaderreps-prod         (PROD)
 */

const admin = require('firebase-admin');
const path = require('path');

// Parse command line args
const args = process.argv.slice(2);
let projectId = 'leaderreps-pd-platform'; // Default to DEV

args.forEach(arg => {
  if (arg.startsWith('--project=')) {
    projectId = arg.split('=')[1];
  }
});

// Map project ID to service account file
const serviceAccountFiles = {
  'leaderreps-pd-platform': 'leaderreps-pd-platform-firebase-adminsdk.json',
  'leaderreps-test': 'leaderreps-test-firebase-adminsdk.json',
  'leaderreps-prod': 'leaderreps-prod-firebase-adminsdk.json'
};

const serviceAccountFile = serviceAccountFiles[projectId];
if (!serviceAccountFile) {
  console.error(`Unknown project: ${projectId}`);
  console.error('Valid projects: leaderreps-pd-platform, leaderreps-test, leaderreps-prod');
  process.exit(1);
}

const serviceAccountPath = path.join(__dirname, '..', serviceAccountFile);
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: projectId
});

const db = admin.firestore();

console.log(`\n🔧 Seeding communication templates for: ${projectId}\n`);

/**
 * Communication Templates
 * 
 * Each template has:
 * - id: Unique identifier (used as document ID)
 * - category: Grouping for admin UI
 * - channel: email | sms | push | all
 * - name: Display name
 * - subject: Email subject line (supports {{variables}})
 * - headline: Email header text
 * - body: Main content (supports {{variables}})
 * - smsBody: Short SMS version
 * - pushTitle: Push notification title
 * - pushBody: Push notification body
 * - buttonText: CTA button text
 * - footerText: Email footer
 * - variables: Array of available variable names
 * - enabled: Whether template is active
 */
const TEMPLATES = [
  // ============================================
  // INVITATION TEMPLATES
  // ============================================
  {
    id: 'invitation_platform',
    category: 'invitation',
    channel: 'email',
    name: 'Platform Invitation',
    subject: "You're invited to LeaderReps PD Platform",
    headline: 'Welcome to LeaderReps!',
    body: `You have been invited to join the LeaderReps Professional Development Platform.

Click the button below to accept your invitation and set up your account.`,
    buttonText: 'Accept Invitation',
    footerText: 'If you did not expect this invitation, please ignore this email.',
    variables: ['firstName', 'lastName', 'fullName', 'cohortName', 'inviterName'],
    enabled: true
  },

  // ============================================
  // COACHING TEMPLATES
  // ============================================
  {
    id: 'coaching_registration_user',
    category: 'coaching',
    channel: 'email',
    name: 'Registration Confirmation (User)',
    subject: '✅ Registration Confirmed: {{sessionTitle}}',
    headline: 'Registration Confirmed!',
    body: `Hi {{userName}},

Your coaching session has been successfully scheduled!

Session Details:
• Session: {{sessionTitle}}
• Date: {{sessionDate}}
• Time: {{sessionTime}}
{{#coach}}• Coach: {{coach}}{{/coach}}

Next Steps:
• Open the attached calendar invite to add this session
• Prepare any questions or topics you'd like to discuss
• Join the session at the scheduled time`,
    smsBody: 'LeaderReps: Your {{sessionTitle}} session is confirmed for {{sessionDate}} at {{sessionTime}}.',
    pushTitle: 'Session Confirmed',
    pushBody: 'Your coaching session is scheduled for {{sessionDate}}',
    buttonText: 'Open LeaderReps',
    footerText: 'Questions? Reply to this email or contact your coach directly.',
    variables: ['userName', 'sessionTitle', 'sessionDate', 'sessionTime', 'coach', 'sessionType'],
    enabled: true
  },
  {
    id: 'coaching_registration_facilitator',
    category: 'coaching',
    channel: 'email',
    name: 'Registration Notification (Facilitator)',
    subject: '📅 New Session Registration: {{userName}} - {{sessionTitle}}',
    headline: 'New Session Registration',
    body: `{{userName}} has registered for your coaching session.

Session Details:
• Session: {{sessionTitle}}
• Type: {{sessionType}}
• Date: {{sessionDate}}
• Time: {{sessionTime}}

Participant Details:
• Name: {{userName}}
• Email: {{userEmail}}
{{#coachingItemId}}• Milestone: {{coachingItemId}}{{/coachingItemId}}`,
    smsBody: 'LeaderReps: {{userName}} registered for {{sessionTitle}} on {{sessionDate}}.',
    pushTitle: 'New Registration',
    pushBody: '{{userName}} registered for your {{sessionTitle}} session',
    buttonText: 'Open LeaderReps',
    footerText: 'This is an automated notification from LeaderReps.',
    variables: ['userName', 'userEmail', 'sessionTitle', 'sessionType', 'sessionDate', 'sessionTime', 'coachingItemId'],
    enabled: true
  },
  {
    id: 'coaching_reminder_leader_day_before',
    category: 'coaching',
    channel: 'all',
    name: 'Session Reminder - Leader (24h)',
    subject: '📅 Tomorrow: {{sessionTitle}}',
    headline: '📅 Session Tomorrow',
    body: `Hi {{userName}},

Your coaching session is scheduled for tomorrow. Make sure you're ready!

Session Details:
• Session: {{sessionTitle}}
• Date: {{sessionDate}}
• Time: {{sessionTime}}
{{#coach}}• Coach: {{coach}}{{/coach}}`,
    smsBody: 'LeaderReps: Reminder - Your {{sessionTitle}} session is tomorrow at {{sessionTime}}.',
    pushTitle: 'Session Tomorrow',
    pushBody: 'Your {{sessionTitle}} is scheduled for tomorrow at {{sessionTime}}',
    buttonText: 'Open LeaderReps',
    footerText: 'Calendar invite attached for your convenience.',
    variables: ['userName', 'sessionTitle', 'sessionDate', 'sessionTime', 'coach'],
    enabled: true
  },
  {
    id: 'coaching_reminder_leader_hour_before',
    category: 'coaching',
    channel: 'all',
    name: 'Session Reminder - Leader (1h)',
    subject: '⏰ Starting Soon: {{sessionTitle}}',
    headline: '⏰ Starting Soon',
    body: `Hi {{userName}},

Your coaching session starts in about an hour. Time to prepare!

Session Details:
• Session: {{sessionTitle}}
• Date: {{sessionDate}}
• Time: {{sessionTime}}
{{#coach}}• Coach: {{coach}}{{/coach}}`,
    smsBody: 'LeaderReps: Your {{sessionTitle}} starts in 1 hour!',
    pushTitle: 'Session Starting Soon',
    pushBody: 'Your {{sessionTitle}} starts in about an hour',
    buttonText: 'Open LeaderReps',
    footerText: 'Calendar invite attached for your convenience.',
    variables: ['userName', 'sessionTitle', 'sessionDate', 'sessionTime', 'coach'],
    enabled: true
  },
  {
    id: 'coaching_reminder_facilitator_day_before',
    category: 'coaching',
    channel: 'email',
    name: 'Session Reminder - Facilitator (24h)',
    subject: '📅 Tomorrow: {{userName}} - {{sessionTitle}}',
    headline: '📅 Session Tomorrow',
    body: `You have a coaching session scheduled for tomorrow.

Session Details:
• Session: {{sessionTitle}}
• Date: {{sessionDate}}
• Time: {{sessionTime}}

Participant:
• Name: {{userName}}
• Email: {{userEmail}}`,
    smsBody: 'LeaderReps: Reminder - Session with {{userName}} tomorrow at {{sessionTime}}.',
    pushTitle: 'Session Tomorrow',
    pushBody: 'Session with {{userName}} tomorrow at {{sessionTime}}',
    buttonText: 'Open LeaderReps',
    footerText: 'Calendar invite attached for your convenience.',
    variables: ['userName', 'userEmail', 'sessionTitle', 'sessionDate', 'sessionTime'],
    enabled: true
  },
  {
    id: 'coaching_reminder_facilitator_hour_before',
    category: 'coaching',
    channel: 'email',
    name: 'Session Reminder - Facilitator (1h)',
    subject: '⏰ Starting Soon: {{userName}} - {{sessionTitle}}',
    headline: '⏰ Starting Soon',
    body: `You have a coaching session starting in about an hour.

Session Details:
• Session: {{sessionTitle}}
• Date: {{sessionDate}}
• Time: {{sessionTime}}

Participant:
• Name: {{userName}}
• Email: {{userEmail}}`,
    smsBody: 'LeaderReps: Session with {{userName}} starts in 1 hour!',
    pushTitle: 'Session Starting Soon',
    pushBody: 'Session with {{userName}} starts in about an hour',
    buttonText: 'Open LeaderReps',
    footerText: 'Calendar invite attached for your convenience.',
    variables: ['userName', 'userEmail', 'sessionTitle', 'sessionDate', 'sessionTime'],
    enabled: true
  },

  // ============================================
  // MILESTONE TEMPLATES
  // ============================================
  {
    id: 'milestone_completion',
    category: 'milestone',
    channel: 'email',
    name: 'Milestone Completion',
    subject: '🎉 Milestone Achieved: {{milestoneName}}',
    headline: 'Congratulations!',
    body: `Hi {{userName}},

Great news! Your facilitator has certified your completion of:

🏆 {{milestoneName}}

This is a significant achievement in your leadership development journey. Keep up the excellent work!`,
    smsBody: 'LeaderReps: Congratulations! You completed {{milestoneName}}! 🎉',
    pushTitle: 'Milestone Achieved!',
    pushBody: 'You completed {{milestoneName}}! 🎉',
    buttonText: 'View Progress',
    footerText: 'Keep building your leadership skills!',
    variables: ['userName', 'milestoneName', 'milestone'],
    enabled: true
  },
  {
    id: 'graduation',
    category: 'milestone',
    channel: 'email',
    name: 'Program Graduation',
    subject: '🎓 Congratulations Graduate!',
    headline: '🎓 You Did It!',
    body: `Hi {{userName}},

CONGRATULATIONS! You have successfully completed all 5 milestones and graduated from the LeaderReps Leadership Development Program!

This is a tremendous achievement. You've demonstrated commitment, growth, and dedication to becoming a more effective leader.

Click below to view and download your certificate of completion.`,
    smsBody: 'LeaderReps: CONGRATULATIONS! 🎓 You graduated from the Leadership Program! View your certificate in the app.',
    pushTitle: 'Congratulations Graduate! 🎓',
    pushBody: 'You completed the Leadership Development Program!',
    buttonText: 'View Certificate',
    footerText: 'Thank you for growing with LeaderReps!',
    variables: ['userName'],
    enabled: true
  },

  // ============================================
  // GENERAL / TEST TEMPLATES
  // ============================================
  {
    id: 'test_notification',
    category: 'general',
    channel: 'all',
    name: 'Test Notification',
    subject: '🔔 Test Notification from LeaderReps',
    headline: 'Test Notification',
    body: `This is a test notification from LeaderReps.

If you received this message, the notification system is working correctly.`,
    smsBody: 'LeaderReps Test: This is a test notification. The system is working correctly!',
    pushTitle: 'Test Notification',
    pushBody: 'This is a test notification from LeaderReps',
    buttonText: 'Open LeaderReps',
    footerText: 'This is an automated test message.',
    variables: [],
    enabled: true
  }
];

async function seedTemplates() {
  console.log(`Seeding ${TEMPLATES.length} templates...\n`);
  
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const template of TEMPLATES) {
    try {
      const docRef = db.collection('communication_templates').doc(template.id);
      const existing = await docRef.get();
      
      const data = {
        ...template,
        createdAt: existing.exists ? existing.data().createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await docRef.set(data, { merge: true });
      
      if (existing.exists) {
        console.log(`  ✓ Updated: ${template.name} (${template.id})`);
        updated++;
      } else {
        console.log(`  ✓ Created: ${template.name} (${template.id})`);
        created++;
      }
    } catch (err) {
      console.error(`  ✗ Error: ${template.name} - ${err.message}`);
      errors++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Summary:`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${TEMPLATES.length}`);
  console.log(`${'='.repeat(50)}\n`);
  
  process.exit(errors > 0 ? 1 : 0);
}

seedTemplates().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
