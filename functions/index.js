/**
 * Firebase Cloud Functions for LeaderReps PD Platform
 * 
 * Includes:
 * - scheduledDailyRollover: Runs at 11:59 PM to archive daily data and reset for the new day
 * - manualRollover: HTTP endpoint to manually trigger rollover for a specific user (catch-up)
 * - geminiProxy: Secure proxy for Gemini AI API calls
 * - scheduledNotificationCheck: Checks for scheduled notifications every 15 minutes
 * - onCoachingRegistration: Sends confirmation + ICS calendar to leader and notification to facilitator
 * - onCoachingCancellation: Sends cancellation emails when a registration is cancelled
 * - scheduledCoachingReminders: Sends 24-hour and 1-hour reminders for upcoming coaching sessions
 * - scheduledFirestoreBackup: Runs daily at 2:00 AM ET to export all Firestore data to Cloud Storage
 */

// const { setGlobalOptions } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https"); 
const cors = require("cors")({ origin: true });
// const functions = require("firebase-functions"); 
const functionsV1 = require("firebase-functions/v1"); 
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Anthropic = require("@anthropic-ai/sdk");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Global options for cost control
// setGlobalOptions({ maxInstances: 10, region: "us-central1" });

// ============================================
// COMMUNICATION TEMPLATE HELPERS
// ============================================

/**
 * Fetch a communication template from Firestore
 * @param {string} templateId - The template document ID
 * @returns {Object|null} Template data or null if not found
 */
const getTemplate = async (templateId) => {
  try {
    const doc = await db.collection('communication_templates').doc(templateId).get();
    if (doc.exists && doc.data().enabled !== false) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (err) {
    logger.warn(`Failed to fetch template ${templateId}:`, err.message);
    return null;
  }
};

/**
 * Apply variable substitution to a template string
 * Supports {{variable}} syntax and {{#variable}}content{{/variable}} conditional blocks
 * @param {string} text - Template text
 * @param {Object} variables - Key-value pairs for substitution
 * @returns {string} Processed text
 */
const applyTemplateVariables = (text, variables = {}) => {
  if (!text) return '';
  
  let result = text;
  
  // Handle conditional blocks {{#variable}}content{{/variable}}
  // These only render if the variable is truthy
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, varName, content) => {
    return variables[varName] ? content : '';
  });
  
  // Handle simple variable substitution {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] !== undefined ? variables[varName] : '';
  });
  
  return result;
};

/**
 * Determine if a given date is during Eastern Daylight Time (EDT)
 * DST in US: Starts 2nd Sunday of March at 2AM, ends 1st Sunday of November at 2AM
 * @param {Date} date - The date to check
 * @returns {boolean} True if the date is during EDT (summer time)
 */
const isEasternDST = (date) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-indexed
  
  // January, February, December - always EST (standard time)
  if (month < 2 || month > 10) return false;
  
  // April through October - always EDT (daylight time)
  if (month > 2 && month < 10) return true;
  
  // March - DST starts 2nd Sunday
  if (month === 2) {
    // Find 2nd Sunday of March
    const firstDayOfMarch = new Date(Date.UTC(year, 2, 1));
    const firstSunday = 1 + (7 - firstDayOfMarch.getUTCDay()) % 7;
    const secondSunday = firstSunday + 7;
    const dstStartDate = new Date(Date.UTC(year, 2, secondSunday, 7, 0, 0)); // 2AM EST = 7AM UTC
    return date >= dstStartDate;
  }
  
  // November - DST ends 1st Sunday
  if (month === 10) {
    // Find 1st Sunday of November
    const firstDayOfNov = new Date(Date.UTC(year, 10, 1));
    const firstSunday = 1 + (7 - firstDayOfNov.getUTCDay()) % 7;
    const dstEndDate = new Date(Date.UTC(year, 10, firstSunday, 6, 0, 0)); // 2AM EDT = 6AM UTC
    return date < dstEndDate;
  }
  
  return false;
};

/**
 * Generate HTML email from template
 * Uses the standard LeaderReps email wrapper
 */
const generateEmailHtml = (template, variables, appUrl) => {
  const headline = applyTemplateVariables(template.headline || '', variables);
  const body = applyTemplateVariables(template.body || '', variables);
  const buttonText = applyTemplateVariables(template.buttonText || 'Open LeaderReps', variables);
  const footerText = applyTemplateVariables(template.footerText || '', variables);
  
  // Convert line breaks to HTML
  const bodyHtml = body.split('\n').map(line => {
    if (line.startsWith('•')) {
      return `<li style="margin: 4px 0;">${line.substring(1).trim()}</li>`;
    }
    return line ? `<p style="margin: 8px 0;">${line}</p>` : '';
  }).join('');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #002E47 0%, #004466 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">${headline}</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        ${bodyHtml}
        
        <p style="text-align: center; margin-top: 24px;">
          <a href="${appUrl}" style="background: #47A88D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">${buttonText}</a>
        </p>
      </div>
      ${footerText ? `
      <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">${footerText}</p>
      </div>
      ` : ''}
    </div>
  `;
};

/**
 * VALIDATE INVITATION (Gen 1 - HTTPS Callable)
 * Allows frontend to lookup invite details by token without exposing the whole collection.
 * Using Gen 1 for reliable unauthenticated CORS handling.
 */
exports.validateInvitation = functionsV1.https.onCall(async (data, context) => {
    logger.info("validateInvitation called (Gen1)", { data });
    
    const { token } = data;
    if (!token) {
        logger.error("Missing token argument");
        throw new functionsV1.https.HttpsError('invalid-argument', 'The function must be called with a "token" argument.');
    }

    try {
        const invitesRef = db.collection('invitations');
        const q = invitesRef.where('token', '==', token).limit(1);
        const snapshot = await q.get();

        if (snapshot.empty) {
            logger.warn("Invitation not found for token", { token });
            throw new functionsV1.https.HttpsError('not-found', 'Invitation not found.');
        }

        const doc = snapshot.docs[0];
        const inviteData = doc.data();
        logger.info("Invitation found", { id: doc.id, email: inviteData.email });

        // Return safe data
        return {
            id: doc.id,
            email: inviteData.email,
            name: inviteData.name,
            firstName: inviteData.firstName || '',
            lastName: inviteData.lastName || '',
            role: inviteData.role,
            status: inviteData.status,
            cohortId: inviteData.cohortId || null
        };
    } catch (error) {
        logger.error("Error in validateInvitation", error);
        if (error.code) {
            throw error;
        }
        throw new functionsV1.https.HttpsError('internal', error.message || 'Unknown internal error');
    }
});

/**
 * ACCEPT INVITATION (Callable - Gen 2)
 * Marks invitation as accepted and links it to the user.
 * Also handles admin role assignment by adding email to adminemails list.
 * For test users, saves isTestUser flag and testNotificationRecipient for notification override.
 * Protected: Can only be called by authenticated users.
 */
exports.acceptInvitation = onCall({ cors: true, region: "us-central1" }, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { inviteId } = request.data;
    const uid = request.auth.uid;

    if (!inviteId) {
        throw new HttpsError('invalid-argument', 'The function must be called with an "inviteId" argument.');
    }

    const inviteRef = db.collection('invitations').doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
        throw new HttpsError('not-found', 'Invitation not found.');
    }
    
    const inviteData = inviteDoc.data();
    
    // Mark invite as accepted
    await inviteRef.update({
        status: 'accepted',
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        acceptedBy: uid
    });
    
    // If admin role, add email to adminemails list in metadata/config
    // This must be done server-side because new users don't have admin permissions yet
    if (inviteData.role === 'admin' && inviteData.email) {
        try {
            const configRef = db.collection('metadata').doc('config');
            // Always store admin emails as lowercase for consistent matching
            await configRef.update({
                adminemails: admin.firestore.FieldValue.arrayUnion(inviteData.email.toLowerCase())
            });
            logger.info("Added admin email to config", { email: inviteData.email });
        } catch (adminErr) {
            logger.error("Failed to add admin email to config", adminErr);
            // Don't fail the whole operation if this fails
        }
    }
    
    // Also save the role, cohortId, and displayName to the user profile
    // This ensures the user profile has the correct data from the invite
    try {
        const userRef = db.collection('users').doc(uid);
        const userData = {
            role: inviteData.role || 'user',
            arenaEntryDate: admin.firestore.FieldValue.serverTimestamp(),
            email: inviteData.email || null
        };
        
        // Construct displayName from firstName and lastName
        const firstName = inviteData.firstName || '';
        const lastName = inviteData.lastName || '';
        const displayName = `${firstName} ${lastName}`.trim();
        if (displayName) {
            userData.displayName = displayName;
        }
        
        if (inviteData.cohortId) {
            userData.cohortId = inviteData.cohortId;
            logger.info("Setting cohortId on user profile", { uid, cohortId: inviteData.cohortId });
        }
        // Save test user information for notification routing
        if (inviteData.isTest) {
            userData.isTestUser = true;
            userData.testNotificationRecipient = inviteData.testRecipient || null;
            logger.info("Test user flagged for notification override", { uid, testRecipient: inviteData.testRecipient });
        }
        await userRef.set(userData, { merge: true });
        logger.info("User profile updated with invite data", { uid, role: inviteData.role, cohortId: inviteData.cohortId, displayName: displayName || '(none)' });
    } catch (userErr) {
        logger.error("Failed to update user profile", userErr);
    }

    return { success: true, role: inviteData.role };
});

/**
 * SEND INVITATION EMAIL (Firestore Trigger)
 * Listens for new documents OR updates in the 'invitations' collection and sends an email.
 * Handles initial creation AND resend requests.
 */
exports.sendInvitationEmail = require("firebase-functions/v2/firestore").onDocumentWritten("invitations/{invitationId}", async (event) => {
  const snapshot = event.data.after; // The new state
  const before = event.data.before; // The old state

  // 1. Check if document exists (it wasn't deleted)
  if (!snapshot.exists) {
    return;
  }
  
  const invitation = snapshot.data();
  
  // 2. Determine if we should send the email
  // - Case A: New document created (before.exists is false)
  // - Case B: 'resend' flag is set to true
  const isNew = !before.exists;
  const isResend = invitation.resend === true;

  // If neither new nor resend requested, exit
  if (!isNew && !isResend) {
    return;
  }

  // If it's a resend, but status is already 'sent' and we just updated it to 'sent' (loop prevention), exit
  // Actually, we will clear the 'resend' flag after sending, so checking invitation.resend === true is sufficient trigger.

  const email = invitation.email;
  const token = invitation.token;
  
  if (!email || !token) {
    logger.error("Invitation missing email or token", invitation);
    return;
  }

  // Configure Nodemailer transporter
  // Note: For production, use a dedicated email service like SendGrid, Mailgun, or AWS SES.
  // For development/testing with Gmail, you need an App Password.
  // Set EMAIL_USER and EMAIL_PASS in functions/.env
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    logger.error("Email credentials not configured. Set email.user and email.pass.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  // Dynamically determine the app URL based on the Firebase project
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId;
  const appDomain = projectId === 'leaderreps-prod'
    ? 'arena.leaderreps.com'
    : projectId === 'leaderreps-test' 
      ? 'leaderreps-test.web.app' 
      : 'leaderreps-pd-platform.web.app';
  
  // Use 'token' query param to match frontend AuthPanel expectation
  const inviteLink = `https://${appDomain}/auth?token=${token}`;
  
  // Handle Test Mode
  let recipientEmail = email;
  let subjectPrefix = "";
  
  if (invitation.isTest) {
    recipientEmail = invitation.testRecipient || emailUser; // Default to sender if no recipient specified
    subjectPrefix = `[TEST INVITE for ${email}] `;
    logger.info(`🧪 Test Mode: Redirecting email for ${email} to ${recipientEmail}`);
  }

  // Fetch email template from Firestore (with fallback defaults)
  const defaultTemplate = {
    subject: "You're invited to LeaderReps PD Platform",
    headline: "Welcome to LeaderReps!",
    body: "You have been invited to join the LeaderReps Professional Development Platform.\n\nClick the button below to accept your invitation and set up your account.",
    buttonText: "Accept Invitation",
    footerText: "If you did not expect this invitation, please ignore this email."
  };
  
  // Try to load from communication_templates collection
  const template = await getTemplate('invitation_platform') || defaultTemplate;
  logger.info('Using invitation template:', { templateId: template.id || 'default' });

  // Use customMessage from invitation if provided, otherwise use template body
  const bodyText = invitation.customMessage && invitation.customMessage.trim() 
    ? invitation.customMessage 
    : template.body;
  
  // Build template variables
  const firstName = invitation.firstName || '';
  const lastName = invitation.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'there';
  
  const templateVars = {
    firstName,
    lastName,
    fullName,
    email,
    inviteLink,
    cohortName: invitation.cohortName || '',
    inviterName: invitation.inviterName || ''
  };

  const emailFromName = process.env.EMAIL_FROM_NAME || 'LeaderReps Arena';
  const emailFromAddress = process.env.EMAIL_FROM || emailUser;
  const emailReplyTo = process.env.EMAIL_REPLY_TO || 'arena@leaderreps.com';

  // Build logo URL using the same domain logic
  const logoUrl = `https://${appDomain}/icons/icon-192x192.png`;

  const mailOptions = {
    from: `"${emailFromName}" <${emailFromAddress}>`,
    replyTo: emailReplyTo,
    to: recipientEmail,
    subject: `${subjectPrefix}${applyTemplateVariables(template.subject, templateVars)}`,
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'LeaderReps Arena',
      'Precedence': 'bulk',
    },
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Logo Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${logoUrl}" alt="LeaderReps" style="width: 64px; height: 64px; border-radius: 12px;" />
        </div>
        ${invitation.isTest ? `
          <div style="background-color: #fff7ed; border: 1px solid #fdba74; padding: 10px; margin-bottom: 20px; border-radius: 6px; color: #9a3412;">
            <strong>🧪 TEST MODE</strong><br/>
            This invitation was created for: <strong>${email}</strong><br/>
            But sent to you for testing purposes.
          </div>
        ` : ''}
        <h2 style="color: #002E47; margin-bottom: 16px;">${applyTemplateVariables(template.headline, templateVars)}</h2>
        <p>${applyTemplateVariables(bodyText, templateVars).replace(/\n/g, '<br/>')}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #47A88D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">${applyTemplateVariables(template.buttonText, templateVars)}</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <hr style="border: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px;">${applyTemplateVariables(template.footerText || '', templateVars)}</p>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">
          LeaderReps Arena | Professional Leadership Development<br/>
          <a href="https://leaderreps.com" style="color: #47A88D;">leaderreps.com</a>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Invitation email sent to ${recipientEmail} (Original: ${email})`);
    
    // Update the invitation document to mark as sent and clear resend flag
    await snapshot.ref.update({ 
      status: "sent",
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      resend: false, // Clear the flag to prevent loops
      error: admin.firestore.FieldValue.delete() // Clear any previous errors
    });
    
  } catch (error) {
    logger.error("Error sending invitation email:", error);
    await snapshot.ref.update({ 
      status: "error", 
      error: error.message,
      resend: false // Clear flag even on error to prevent infinite retry loops
    });
  }
});

/**
 * ICS CALENDAR HELPER
 * Generates ICS file content for calendar attachments
 * Uses America/New_York timezone for all sessions
 */
const formatCalendarDateICS = (date) => {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

// Format date for ICS with timezone (no Z suffix)
const formatLocalDateICS = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

const generateICSContent = ({ title, description, location, startDate, startTime, durationMinutes = 60, uid, organizerEmail, organizerName, attendeeEmail, attendeeName }) => {
  // Parse the date string - expects format like "2026-03-12" or ISO string
  // startDate comes from Firestore, could be a string or Date
  let dateStr = startDate;
  if (startDate && typeof startDate === 'object' && startDate.toDate) {
    // Firestore Timestamp
    dateStr = startDate.toDate().toISOString().split('T')[0];
  } else if (startDate instanceof Date) {
    dateStr = startDate.toISOString().split('T')[0];
  } else if (typeof startDate === 'string' && startDate.includes('T')) {
    // ISO string - extract date part
    dateStr = startDate.split('T')[0];
  }
  
  // Build datetime by combining date + time (treating time as Eastern)
  let hours = 0;
  let minutes = 0;
  if (startTime) {
    // Parse time like "10:00 AM", "12:00 PM", "14:00"
    const timeParts = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeParts) {
      hours = parseInt(timeParts[1]);
      minutes = parseInt(timeParts[2]);
      const meridiem = timeParts[3];
      if (meridiem) {
        if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
    }
  }
  
  // Create date components from date string
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Format start and end times for ICS (local time format, no Z)
  const startFormatted = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}00`;
  
  // Calculate end time
  const endMinutes = minutes + durationMinutes;
  const endHours = hours + Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  const endFormatted = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}T${String(endHours).padStart(2, '0')}${String(endMins).padStart(2, '0')}00`;
  
  const now = new Date();
  
  // VTIMEZONE for America/New_York (handles EDT/EST automatically)
  const vtimezone = [
    'BEGIN:VTIMEZONE',
    'TZID:America/New_York',
    'BEGIN:DAYLIGHT',
    'DTSTART:20070311T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0400',
    'TZNAME:EDT',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'DTSTART:20071104T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0500',
    'TZNAME:EST',
    'END:STANDARD',
    'END:VTIMEZONE'
  ].join('\r\n');
  
  // Build event lines
  const eventLines = [
    'BEGIN:VEVENT',
    `UID:${uid || `${Date.now()}@leaderreps.com`}`,
    `DTSTAMP:${formatCalendarDateICS(now)}`,
    `DTSTART;TZID=America/New_York:${startFormatted}`,
    `DTEND;TZID=America/New_York:${endFormatted}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${location || 'Virtual Session'}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0'
  ];
  
  // Add ORGANIZER if provided (required for RSVP to work)
  if (organizerEmail) {
    const orgName = organizerName || 'LeaderReps Trainer';
    eventLines.push(`ORGANIZER;CN=${orgName}:mailto:${organizerEmail}`);
  }
  
  // Add ATTENDEE if provided (required for RSVP to work)
  if (attendeeEmail) {
    const attName = attendeeName || 'Participant';
    eventLines.push(`ATTENDEE;CN=${attName};RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${attendeeEmail}`);
  }
  
  eventLines.push('END:VEVENT');
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LeaderReps//Coaching Session//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    vtimezone,
    eventLines.join('\r\n'),
    'END:VCALENDAR'
  ].join('\r\n');
};

/**
 * COACHING REGISTRATION NOTIFICATION
 * Sends email notifications to facilitators when a user registers for a coaching session.
 * Also sends confirmation to the user with calendar attachment.
 */
exports.onCoachingRegistration = require("firebase-functions/v2/firestore").onDocumentWritten("coaching_registrations/{registrationId}", async (event) => {
  const afterSnapshot = event.data?.after;
  const beforeSnapshot = event.data?.before;
  
  if (!afterSnapshot || !afterSnapshot.exists) {
    // Document deleted or no data
    return;
  }

  const registration = afterSnapshot.data();
  const beforeRegistration = beforeSnapshot && beforeSnapshot.exists ? beforeSnapshot.data() : null;

  // We only send the email if it transitions to REGISTERED 
  // (either it's new and registered, or changed from CANCELLED to REGISTERED)
  const currentStatus = (registration.status || '').toLowerCase();
  const previousStatus = beforeRegistration ? (beforeRegistration.status || '').toLowerCase() : '';
  
  const isNowRegistered = currentStatus !== 'cancelled' && currentStatus !== 'no_show';
  const wasRegistered = beforeRegistration ? (previousStatus !== 'cancelled' && previousStatus !== 'no_show') : false;

  if (!isNowRegistered || wasRegistered) {
    return; // Not a new registration event (either cancelling, or already registered and just updating other fields)
  }

  logger.info("New coaching registration (or switch):", { id: event.params.registrationId, sessionId: registration.sessionId });

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    logger.warn("Email credentials not configured. Skipping notification.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const projectId = process.env.GCLOUD_PROJECT || (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId);
  const appDomain = projectId === 'leaderreps-prod'
    ? 'arena.leaderreps.com'
    : projectId === 'leaderreps-test' 
      ? 'leaderreps-test.web.app' 
      : 'leaderreps-pd-platform.web.app';
  const appUrl = `https://${appDomain}`;

  const emailFromName = process.env.EMAIL_FROM_NAME || 'LeaderReps';
  const emailReplyTo = process.env.EMAIL_REPLY_TO || emailUser;

  // Format date nicely
  const sessionDate = registration.sessionDate 
    ? new Date(registration.sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Date TBD';
  const sessionTime = registration.sessionTime || 'Time TBD';

  // Build template variables
  const templateVars = {
    userName: registration.userName || 'there',
    userEmail: registration.userEmail || 'Not provided',
    sessionTitle: registration.sessionTitle || 'Coaching Session',
    sessionType: registration.sessionType || '1:1 Coaching',
    sessionDate,
    sessionTime,
    coach: registration.coach || '',
    coachingItemId: registration.coachingItemId || ''
  };

  // Fetch templates (with fallback to hardcoded)
  const facilitatorTemplate = await getTemplate('coaching_registration_facilitator');
  const userTemplate = await getTemplate('coaching_registration_user');
  
  logger.info('Using coaching templates:', { 
    facilitator: facilitatorTemplate?.id || 'fallback', 
    user: userTemplate?.id || 'fallback' 
  });

  // 1. Send notification to facilitator/coach if coachEmail is available
  if (registration.coachEmail) {
    let facilitatorHtml;
    let facilitatorSubject;
    
    if (facilitatorTemplate) {
      facilitatorSubject = applyTemplateVariables(facilitatorTemplate.subject, templateVars);
      facilitatorHtml = generateEmailHtml(facilitatorTemplate, templateVars, appUrl);
    } else {
      // Fallback to hardcoded HTML
      facilitatorSubject = `📅 New Session Registration: ${registration.userName || 'A participant'} - ${registration.sessionTitle || 'Coaching Session'}`;
      facilitatorHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #002E47 0%, #004466 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">New Session Registration</h2>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin-top: 0;"><strong>${registration.userName || 'A participant'}</strong> has registered for your coaching session.</p>
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
              <h3 style="margin-top: 0; color: #002E47;">Session Details</h3>
              <p style="margin: 8px 0;"><strong>Session:</strong> ${registration.sessionTitle || 'Coaching Session'}</p>
              <p style="margin: 8px 0;"><strong>Type:</strong> ${registration.sessionType || '1:1 Coaching'}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${sessionDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${sessionTime}</p>
            </div>
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
              <h3 style="margin-top: 0; color: #002E47;">Participant Details</h3>
              <p style="margin: 8px 0;"><strong>Name:</strong> ${registration.userName || 'Not provided'}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${registration.userEmail || 'Not provided'}</p>
              ${registration.coachingItemId ? `<p style="margin: 8px 0;"><strong>Milestone:</strong> ${registration.coachingItemId}</p>` : ''}
            </div>
            <p style="text-align: center; margin-top: 24px;">
              <a href="${appUrl}" style="background: #47A88D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open LeaderReps</a>
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">This is an automated notification from LeaderReps.</p>
          </div>
        </div>
      `;
    }
    
    const facilitatorMailOptions = {
      from: `"${emailFromName}" <${emailUser}>`,
      replyTo: emailReplyTo,
      to: registration.coachEmail,
      subject: facilitatorSubject,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'LeaderReps Platform',
      },
      html: facilitatorHtml,
    };

    try {
      await transporter.sendMail(facilitatorMailOptions);
      logger.info(`Facilitator notification sent to ${registration.coachEmail}`);
    } catch (error) {
      logger.error(`Failed to send facilitator notification to ${registration.coachEmail}:`, error);
    }
  } else {
    logger.info("No coachEmail on registration, skipping facilitator notification");
  }

  // Generate ICS calendar content for attachments
  const icsContent = generateICSContent({
    title: `LeaderReps: ${registration.sessionTitle || 'Coaching Session'}`,
    description: `Coaching session${registration.coach ? ` with ${registration.coach}` : ''}\\n\\nJoin via LeaderReps: ${appUrl}`,
    location: 'Virtual Session',
    startDate: registration.sessionDate,
    startTime: registration.sessionTime,
    durationMinutes: 60,
    uid: `${event.params.registrationId}@leaderreps.com`,
    // Add organizer (trainer) and attendee (participant) for RSVP functionality
    organizerEmail: registration.coachEmail || emailUser,
    organizerName: registration.coach || 'LeaderReps Trainer',
    attendeeEmail: registration.userEmail,
    attendeeName: registration.userName
  });

  // 2. Send confirmation to the user with calendar attachment
  if (registration.userEmail) {
    let userHtml;
    let userSubject;
    
    if (userTemplate) {
      userSubject = applyTemplateVariables(userTemplate.subject, templateVars);
      userHtml = generateEmailHtml(userTemplate, templateVars, appUrl);
    } else {
      // Fallback to hardcoded HTML
      userSubject = `✅ Registration Confirmed: ${registration.sessionTitle || 'Coaching Session'}`;
      userHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #002E47 0%, #004466 100%); padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Registration Confirmed!</h2>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin-top: 0;">Hi ${registration.userName || 'there'},</p>
            <p>Your coaching session has been successfully scheduled!</p>
            <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
              <h3 style="margin-top: 0; color: #002E47;">Session Details</h3>
              <p style="margin: 8px 0;"><strong>Session:</strong> ${registration.sessionTitle || 'Coaching Session'}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${sessionDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${sessionTime}</p>
              ${registration.coach ? `<p style="margin: 8px 0;"><strong>Trainer:</strong> ${registration.coach}</p>` : ''}
            </div>
            <p style="text-align: center; margin: 16px 0;">
              <span style="background: #e0f2fe; color: #0369a1; padding: 8px 16px; border-radius: 6px; font-size: 14px;">📅 Calendar invite attached - open the .ics file to add to your calendar</span>
            </p>
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Open the attached calendar invite to add this session</li>
              <li>Prepare any questions or topics you'd like to discuss</li>
              <li>Join the session at the scheduled time</li>
            </ul>
            <p style="text-align: center; margin-top: 24px;">
              <a href="${appUrl}" style="background: #47A88D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open LeaderReps</a>
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">Questions? Reply to this email or contact your trainer directly.</p>
          </div>
        </div>
      `;
    }
    
    const userMailOptions = {
      from: `"${emailFromName}" <${emailUser}>`,
      replyTo: emailReplyTo,
      to: registration.userEmail,
      subject: userSubject,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'LeaderReps Platform',
      },
      attachments: [{
        filename: 'coaching-session.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }],
      html: userHtml,
    };

    try {
      await transporter.sendMail(userMailOptions);
      logger.info(`User confirmation sent to ${registration.userEmail}`);
    } catch (error) {
      logger.error(`Failed to send user confirmation to ${registration.userEmail}:`, error);
    }
  }

  // Update registration to mark notification sent
  try {
    await snapshot.ref.update({
      notificationSentAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    logger.error("Failed to update registration with notification timestamp:", error);
  }
});

/**
 * COACHING REGISTRATION CANCELLATION
 * Sends cancellation emails when a registration status changes to 'cancelled'.
 * Notifies both the participant and the coach.
 */
exports.onCoachingCancellation = require("firebase-functions/v2/firestore").onDocumentUpdated("coaching_registrations/{registrationId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  
  // Only trigger when status changes TO cancelled (not when already cancelled)
  const wasCancelled = (beforeData.status || '').toLowerCase() === 'cancelled';
  const isCancelled = (afterData.status || '').toLowerCase() === 'cancelled';
  
  if (wasCancelled || !isCancelled) {
    // Either was already cancelled, or isn't being cancelled now
    return;
  }
  
  logger.info("Coaching registration cancelled:", { 
    id: event.params.registrationId, 
    sessionId: afterData.sessionId,
    previousStatus: beforeData.status 
  });

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    logger.warn("Email credentials not configured. Skipping cancellation notification.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const projectId = process.env.GCLOUD_PROJECT || (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId);
  const appDomain = projectId === 'leaderreps-prod'
    ? 'arena.leaderreps.com'
    : projectId === 'leaderreps-test' 
      ? 'leaderreps-test.web.app' 
      : 'leaderreps-pd-platform.web.app';
  const appUrl = `https://${appDomain}`;

  const emailFromName = process.env.EMAIL_FROM_NAME || 'LeaderReps';
  const emailReplyTo = process.env.EMAIL_REPLY_TO || emailUser;

  // Format date nicely
  const sessionDate = afterData.sessionDate 
    ? new Date(afterData.sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Date TBD';
  const sessionTime = afterData.sessionTime || 'Time TBD';

  // Get coachEmail - try registration first, then look up from session
  let coachEmail = afterData.coachEmail;
  if (!coachEmail && afterData.sessionId) {
    try {
      const sessionDoc = await admin.firestore()
        .collection('coaching_sessions')
        .doc(afterData.sessionId)
        .get();
      if (sessionDoc.exists) {
        coachEmail = sessionDoc.data().coachEmail;
        logger.info("Looked up coachEmail from session:", { coachEmail, sessionId: afterData.sessionId });
      }
    } catch (lookupErr) {
      logger.warn("Could not look up coachEmail from session:", lookupErr.message);
    }
  }

  // 1. Send cancellation notification to the coach
  if (coachEmail) {
    const coachSubject = `❌ Session Cancelled: ${afterData.userName || 'A participant'} - ${afterData.sessionTitle || 'Coaching Session'}`;
    const coachHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Session Cancelled</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin-top: 0;"><strong>${afterData.userName || 'A participant'}</strong> has cancelled their coaching session.</p>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #fecaca; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Cancelled Session Details</h3>
            <p style="margin: 8px 0;"><strong>Session:</strong> ${afterData.sessionTitle || 'Coaching Session'}</p>
            <p style="margin: 8px 0;"><strong>Type:</strong> ${afterData.sessionType || '1:1 Coaching'}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${sessionDate}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${sessionTime}</p>
          </div>
          <p style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}" style="background: #47A88D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open LeaderReps</a>
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">This is an automated notification from LeaderReps.</p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"${emailFromName}" <${emailUser}>`,
        replyTo: emailReplyTo,
        to: coachEmail,
        subject: coachSubject,
        html: coachHtml,
      });
      logger.info(`Coach cancellation notification sent to ${coachEmail}`);
    } catch (error) {
      logger.error(`Failed to send coach cancellation to ${coachEmail}:`, error);
    }
  }

  // 2. Send cancellation confirmation to the participant
  if (afterData.userEmail) {
    const userSubject = `❌ Session Cancelled: ${afterData.sessionTitle || 'Coaching Session'}`;
    const userHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Session Cancelled</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin-top: 0;">Hi ${afterData.userName || 'there'},</p>
          <p>Your coaching session has been cancelled.</p>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #fecaca; margin: 16px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Cancelled Session</h3>
            <p style="margin: 8px 0;"><strong>Session:</strong> ${afterData.sessionTitle || 'Coaching Session'}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${sessionDate}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${sessionTime}</p>
            ${afterData.coach ? `<p style="margin: 8px 0;"><strong>Trainer:</strong> ${afterData.coach}</p>` : ''}
          </div>
          <p style="text-align: center; margin: 16px 0;">
            <span style="background: #fef2f2; color: #991b1b; padding: 8px 16px; border-radius: 6px; font-size: 14px;">📅 Please remove this from your calendar</span>
          </p>
          <p>You can schedule a new session anytime from the Coaching Hub.</p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="${appUrl}" style="background: #47A88D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Browse Sessions</a>
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Questions? Reply to this email or contact your trainer directly.</p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"${emailFromName}" <${emailUser}>`,
        replyTo: emailReplyTo,
        to: afterData.userEmail,
        subject: userSubject,
        html: userHtml,
      });
      logger.info(`User cancellation confirmation sent to ${afterData.userEmail}`);
    } catch (error) {
      logger.error(`Failed to send user cancellation to ${afterData.userEmail}:`, error);
    }
  }

  // Update registration to mark cancellation notification sent
  try {
    await event.data.after.ref.update({
      cancellationNotificationSentAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    logger.error("Failed to update registration with cancellation timestamp:", error);
  }
});

/**
 * COACHING SESSION REMINDERS
 * Sends reminder emails to leaders and facilitators before coaching sessions.
 * 
 * Runs every hour and checks for:
 * - Sessions starting in ~24 hours (sends day-before reminder)
 * - Sessions starting in ~1 hour (sends same-day reminder)
 */
exports.scheduledCoachingReminders = onSchedule("every 1 hours", async (event) => {
  logger.info("Starting coaching session reminder check...");
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    logger.warn("Email credentials not configured. Skipping reminders.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailPass },
  });

  const projectId = process.env.GCLOUD_PROJECT || (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId);
  const appDomain = projectId === 'leaderreps-test' ? 'leaderreps-test.web.app' : 'leaderreps-pd-platform.web.app';
  const appUrl = `https://${appDomain}`;
  const emailFromName = process.env.EMAIL_FROM_NAME || 'LeaderReps';
  const emailReplyTo = process.env.EMAIL_REPLY_TO || emailUser;

  const now = new Date();
  
  // Get all active registrations (registered status only - not cancelled)
  const registrationsSnap = await db.collection('coaching_registrations')
    .where('status', 'in', ['registered', 'REGISTERED'])
    .get();
  
  if (registrationsSnap.empty) {
    logger.info("No active coaching registrations found.");
    return;
  }

  let remindersSent = 0;

  // Pre-fetch reminder templates
  const reminderTemplates = {
    leaderDayBefore: await getTemplate('coaching_reminder_leader_day_before'),
    leaderHourBefore: await getTemplate('coaching_reminder_leader_hour_before'),
    facilitatorDayBefore: await getTemplate('coaching_reminder_facilitator_day_before'),
    facilitatorHourBefore: await getTemplate('coaching_reminder_facilitator_hour_before')
  };
  logger.info('Loaded reminder templates:', {
    leaderDayBefore: !!reminderTemplates.leaderDayBefore,
    leaderHourBefore: !!reminderTemplates.leaderHourBefore,
    facilitatorDayBefore: !!reminderTemplates.facilitatorDayBefore,
    facilitatorHourBefore: !!reminderTemplates.facilitatorHourBefore
  });

  for (const doc of registrationsSnap.docs) {
    const registration = { id: doc.id, ...doc.data() };
    
    if (!registration.sessionDate) continue;
    
    // Parse session datetime - sessions are in America/New_York timezone
    // The sessionDate is stored as "YYYY-MM-DD" (local date, no timezone)
    // The sessionTime is stored as "HH:MM AM/PM" (local time)
    // We need to interpret these as Eastern Time and convert to UTC for comparison
    
    // Parse the time components first
    let sessionHours = 0;
    let sessionMinutes = 0;
    if (registration.sessionTime) {
      const timeParts = registration.sessionTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeParts) {
        sessionHours = parseInt(timeParts[1]);
        sessionMinutes = parseInt(timeParts[2]);
        const meridiem = timeParts[3];
        if (meridiem) {
          if (meridiem.toUpperCase() === 'PM' && sessionHours !== 12) sessionHours += 12;
          if (meridiem.toUpperCase() === 'AM' && sessionHours === 12) sessionHours = 0;
        }
      }
    }
    
    // Parse date components (YYYY-MM-DD)
    const dateParts = registration.sessionDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
    const day = parseInt(dateParts[2]);
    
    // Determine if DST is in effect for America/New_York
    // DST starts 2nd Sunday of March, ends 1st Sunday of November
    const sessionDateForDST = new Date(Date.UTC(year, month, day, 12, 0, 0)); // noon to avoid edge cases
    const isDST = isEasternDST(sessionDateForDST);
    const easternOffset = isDST ? 4 : 5; // EDT = UTC-4, EST = UTC-5
    
    // Create session start time in UTC by adding the Eastern offset
    // e.g., 10:00 AM Eastern = 14:00 UTC (during EDT) or 15:00 UTC (during EST)
    const sessionStartUTC = new Date(Date.UTC(year, month, day, sessionHours + easternOffset, sessionMinutes, 0, 0));
    
    const hoursUntilSession = (sessionStartUTC - now) / (1000 * 60 * 60);
    
    // Skip sessions in the past or too far in the future
    if (hoursUntilSession < 0 || hoursUntilSession > 25) continue;
    
    // Determine reminder type and check if already sent
    const reminderFlags = registration.remindersSent || {};
    let reminderType = null;
    let reminderSubjectPrefix = '';
    
    if (hoursUntilSession >= 23 && hoursUntilSession <= 25 && !reminderFlags.dayBefore) {
      reminderType = 'dayBefore';
      reminderSubjectPrefix = '📅 Tomorrow: ';
    } else if (hoursUntilSession >= 0.5 && hoursUntilSession <= 1.5 && !reminderFlags.hourBefore) {
      reminderType = 'hourBefore';
      reminderSubjectPrefix = '⏰ Starting Soon: ';
    }
    
    if (!reminderType) continue;
    
    // Format date/time for email
    const sessionDate = sessionStart.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const sessionTime = registration.sessionTime || sessionStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    
    // Build template variables
    const templateVars = {
      userName: registration.userName || 'there',
      userEmail: registration.userEmail || 'Not provided',
      sessionTitle: registration.sessionTitle || 'Coaching Session',
      sessionDate,
      sessionTime,
      coach: registration.coach || ''
    };
    
    // Generate ICS for attachment
    const icsContent = generateICSContent({
      title: `LeaderReps: ${registration.sessionTitle || 'Coaching Session'}`,
      description: `Coaching session${registration.coach ? ` with ${registration.coach}` : ''}\\n\\nJoin via LeaderReps: ${appUrl}`,
      location: 'Virtual Session',
      startDate: registration.sessionDate,
      startTime: registration.sessionTime,
      durationMinutes: 60,
      uid: `${doc.id}@leaderreps.com`,
      organizerEmail: registration.coachEmail || emailUser,
      organizerName: registration.coach || 'LeaderReps Trainer',
      attendeeEmail: registration.userEmail,
      attendeeName: registration.userName
    });
    
    // Determine which template to use
    const leaderTemplate = reminderType === 'dayBefore' 
      ? reminderTemplates.leaderDayBefore 
      : reminderTemplates.leaderHourBefore;
    const facilitatorTemplate = reminderType === 'dayBefore' 
      ? reminderTemplates.facilitatorDayBefore 
      : reminderTemplates.facilitatorHourBefore;
    
    // Send reminder to leader
    if (registration.userEmail) {
      let leaderHtml;
      let leaderSubject;
      
      if (leaderTemplate) {
        leaderSubject = applyTemplateVariables(leaderTemplate.subject, templateVars);
        leaderHtml = generateEmailHtml(leaderTemplate, templateVars, appUrl);
      } else {
        // Fallback to hardcoded
        leaderSubject = `${reminderSubjectPrefix}${registration.sessionTitle || 'Coaching Session'}`;
        const reminderMessage = reminderType === 'dayBefore' 
          ? "Your coaching session is scheduled for tomorrow. Make sure you're ready!"
          : "Your coaching session starts in about an hour. Time to prepare!";
        leaderHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #002E47 0%, #004466 100%); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">${reminderType === 'dayBefore' ? '📅 Session Tomorrow' : '⏰ Starting Soon'}</h2>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="margin-top: 0;">Hi ${registration.userName || 'there'},</p>
              <p>${reminderMessage}</p>
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
                <h3 style="margin-top: 0; color: #002E47;">Session Details</h3>
                <p style="margin: 8px 0;"><strong>Session:</strong> ${registration.sessionTitle || 'Coaching Session'}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${sessionDate}</p>
                <p style="margin: 8px 0;"><strong>Time:</strong> ${sessionTime}</p>
                ${registration.coach ? `<p style="margin: 8px 0;"><strong>Trainer:</strong> ${registration.coach}</p>` : ''}
              </div>
              <p style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}" style="background: #47A88D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open LeaderReps</a>
              </p>
            </div>
            <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">Calendar invite attached for your convenience.</p>
            </div>
          </div>
        `;
      }
      
      const leaderMailOptions = {
        from: `"${emailFromName}" <${emailUser}>`,
        replyTo: emailReplyTo,
        to: registration.userEmail,
        subject: leaderSubject,
        attachments: [{
          filename: 'coaching-session.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }],
        html: leaderHtml,
      };

      try {
        await transporter.sendMail(leaderMailOptions);
        logger.info(`${reminderType} reminder sent to leader: ${registration.userEmail}`);
        remindersSent++;
      } catch (error) {
        logger.error(`Failed to send leader reminder to ${registration.userEmail}:`, error);
      }
    }
    
    // Send reminder to facilitator/coach
    if (registration.coachEmail) {
      let facilitatorHtml;
      let facilitatorSubject;
      
      if (facilitatorTemplate) {
        facilitatorSubject = applyTemplateVariables(facilitatorTemplate.subject, templateVars);
        facilitatorHtml = generateEmailHtml(facilitatorTemplate, templateVars, appUrl);
      } else {
        // Fallback to hardcoded
        facilitatorSubject = `${reminderSubjectPrefix}${registration.userName || 'Participant'} - ${registration.sessionTitle || 'Coaching Session'}`;
        facilitatorHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #002E47 0%, #004466 100%); padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0;">${reminderType === 'dayBefore' ? '📅 Session Tomorrow' : '⏰ Starting Soon'}</h2>
            </div>
            <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="margin-top: 0;">You have a coaching session ${reminderType === 'dayBefore' ? 'scheduled for tomorrow' : 'starting in about an hour'}.</p>
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
                <h3 style="margin-top: 0; color: #002E47;">Session Details</h3>
                <p style="margin: 8px 0;"><strong>Session:</strong> ${registration.sessionTitle || 'Coaching Session'}</p>
                <p style="margin: 8px 0;"><strong>Date:</strong> ${sessionDate}</p>
                <p style="margin: 8px 0;"><strong>Time:</strong> ${sessionTime}</p>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 16px 0;">
                <h3 style="margin-top: 0; color: #002E47;">Participant</h3>
                <p style="margin: 8px 0;"><strong>Name:</strong> ${registration.userName || 'Not provided'}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${registration.userEmail || 'Not provided'}</p>
              </div>
              <p style="text-align: center; margin-top: 24px;">
                <a href="${appUrl}" style="background: #47A88D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open LeaderReps</a>
              </p>
            </div>
            <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">Calendar invite attached for your convenience.</p>
            </div>
          </div>
        `;
      }
      
      const facilitatorMailOptions = {
        from: `"${emailFromName}" <${emailUser}>`,
        replyTo: emailReplyTo,
        to: registration.coachEmail,
        subject: facilitatorSubject,
        attachments: [{
          filename: 'coaching-session.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }],
        html: facilitatorHtml,
      };

      try {
        await transporter.sendMail(facilitatorMailOptions);
        logger.info(`${reminderType} reminder sent to facilitator: ${registration.coachEmail}`);
        remindersSent++;
      } catch (error) {
        logger.error(`Failed to send facilitator reminder to ${registration.coachEmail}:`, error);
      }
    }
    
    // Mark reminder as sent
    try {
      await doc.ref.update({
        [`remindersSent.${reminderType}`]: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      logger.error(`Failed to update reminder flag for ${doc.id}:`, error);
    }
  }
  
  logger.info(`Coaching reminder check complete. Sent ${remindersSent} reminders.`);
});

/**
 * MILESTONE COMPLETION EMAIL
 * Sends email notification when a facilitator signs off on a leader's milestone.
 * Also sends graduation notification when all 5 milestones are complete.
 * Includes link to view/print certificate.
 */
exports.sendMilestoneCompletionEmail = onCall(async (request) => {
  const { userId, userEmail, userName, milestone, milestoneName, isGraduation } = request.data;
  
  if (!userEmail) {
    logger.warn('No email provided for milestone completion notification');
    return { success: false, error: 'No email provided' };
  }
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    logger.warn('Email credentials not configured for milestone notification');
    return { success: false, error: 'Email not configured' };
  }
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass }
  });
  
  const projectId = process.env.GCLOUD_PROJECT || (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId);
  const appDomain = projectId === 'leaderreps-test' ? 'leaderreps-test.web.app' : 'leaderreps-pd-platform.web.app';
  const appUrl = `https://${appDomain}`;
  const emailFromName = process.env.EMAIL_FROM_NAME || 'LeaderReps';
  const emailReplyTo = process.env.EMAIL_REPLY_TO || emailUser;
  
  // Fetch templates
  const milestoneTemplate = await getTemplate('milestone_completion');
  const graduationTemplate = await getTemplate('graduation');
  
  logger.info('Using milestone templates:', { 
    milestone: milestoneTemplate?.id || 'fallback',
    graduation: graduationTemplate?.id || 'fallback'
  });
  
  // Build template variables
  const templateVars = {
    userName: userName || 'there',
    milestoneName: milestoneName || `Milestone ${milestone}`,
    milestone: String(milestone),
    nextMilestone: String((milestone || 0) + 1)
  };
  
  const milestoneEmoji = {
    1: '📍',
    2: '🎯',
    3: '💡',
    4: '🚀',
    5: '🏆'
  };
  
  let subject, bodyHtml;
  
  if (isGraduation) {
    if (graduationTemplate) {
      subject = applyTemplateVariables(graduationTemplate.subject, templateVars);
      bodyHtml = generateEmailHtml(graduationTemplate, templateVars, appUrl);
    } else {
      subject = `🎓 Congratulations! You've Graduated from LeaderReps!`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #002E47 0%, #004466 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎓 Congratulations!</h1>
            <p style="color: #9CE0C8; margin: 10px 0 0 0; font-size: 18px;">You've Graduated!</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin-top: 0; font-size: 18px;">Hi ${userName || 'there'},</p>
            <p style="font-size: 16px;">You've successfully completed all 5 milestones and earned your <strong>LeaderReps Leadership Certification</strong>!</p>
            <div style="background: linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%); padding: 4px; border-radius: 12px; margin: 24px 0;">
              <div style="background: white; padding: 24px; border-radius: 10px; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">CERTIFICATE OF COMPLETION</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #002E47;">LeaderReps Leadership Program</p>
                <p style="margin: 8px 0 0 0; font-size: 16px; color: #47A88D;">All 5 Milestones Complete</p>
              </div>
            </div>
            <p style="text-align: center; margin-top: 24px;">
              <a href="${appUrl}?screen=certificates" style="background: #47A88D; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View Your Certificate</a>
            </p>
            <p style="margin-top: 24px; color: #666; font-size: 14px;">You can print or share your certificate from the app. Thank you for your dedication to becoming a better leader!</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">Congratulations from the LeaderReps Team!</p>
          </div>
        </div>
      `;
    }
  } else {
    if (milestoneTemplate) {
      subject = applyTemplateVariables(milestoneTemplate.subject, templateVars);
      bodyHtml = generateEmailHtml(milestoneTemplate, templateVars, appUrl);
    } else {
      subject = `✅ Milestone ${milestone} Complete: ${milestoneName}`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #002E47 0%, #004466 100%); padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">${milestoneEmoji[milestone] || '✅'} Milestone Complete!</h2>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin-top: 0;">Hi ${userName || 'there'},</p>
            <p>Congratulations! Your facilitator has signed off on <strong>Milestone ${milestone}: ${milestoneName}</strong>.</p>
            <div style="background: #10B981; color: white; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">${milestoneEmoji[milestone]} ${milestoneName}</p>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Milestone ${milestone} of 5 Complete</p>
            </div>
            ${milestone < 5 ? `
            <p><strong>What's Next?</strong></p>
            <p>Your certificate for this milestone is now available in the app. <strong>Milestone ${milestone + 1}</strong> is now unlocked and ready for you to begin!</p>
            ` : ''}
            <p style="text-align: center; margin-top: 24px;">
              <a href="${appUrl}" style="background: #47A88D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Certificate & Continue</a>
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">Keep up the great work!</p>
          </div>
        </div>
      `;
    }
  }
  
  const mailOptions = {
    from: `"${emailFromName}" <${emailUser}>`,
    replyTo: emailReplyTo,
    to: userEmail,
    subject,
    html: bodyHtml
  };
  
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Milestone completion email sent to ${userEmail} for milestone ${milestone}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send milestone email to ${userEmail}:`, error);
    return { success: false, error: error.message };
  }
});

/**
 * GEMINI AI PROXY
 * Secure endpoint for making Gemini API calls from the frontend
 * Keeps the API key secure on the server side
 * 
 * Set GEMINI_API_KEY in functions/.env
 */
exports.geminiProxy = onRequest(
  {
    cors: true,
    invoker: "public", // Required for CORS preflight requests to work
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { prompt, model = "gemini-2.0-flash", systemInstruction } = req.body;

      if (!prompt) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }

      // Get the API key from environment variable (functions/.env)
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        logger.error("GEMINI_API_KEY is not configured. Set it in functions/.env");
        res.status(500).json({ error: "AI service not configured" });
        return;
      }

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({ 
        model,
        systemInstruction: systemInstruction || "You are a helpful assistant for the LeaderReps leadership development platform."
      });

      // Generate content
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info(`Gemini API call successful, model: ${model}`);
      
      res.status(200).json({ 
        success: true, 
        text,
        model 
      });

    } catch (error) {
      logger.error("Gemini API error:", error);
      res.status(500).json({ 
        error: "Failed to generate content", 
        details: error.message 
      });
    }
  }
);

// ================================================================
// DRF EVALUATION FUNCTION
// Implements the LeaderReps AI Evaluation Specification for 
// Deliver Reinforcing Feedback Real Reps
// ================================================================
async function assessDRFRep(data, person, repType, previousQuestions = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("GEMINI_API_KEY is not configured");
    throw new HttpsError('internal', 'AI service not configured');
  }

  // Extract DRF-specific evidence
  const drfResponses = data.drf_responses || {};
  const commitContext = data.commit_context || '';
  const selfAssessment = data.self_assessment || {};
  const responseType = data.response_type || '';
  const notes = data.notes || '';
  const situationBranch = data.situation_branch || '';

  // Build evidence summary from structured DRF fields
  const evidenceLines = [];
  if (drfResponses.describe_behavior) {
    evidenceLines.push(`- Behavior described: ${drfResponses.describe_behavior}`);
  }
  if (drfResponses.why_matters) {
    evidenceLines.push(`- Why it matters: ${drfResponses.why_matters}`);
  }

  // Self-assessment context
  const selfAssessmentLines = Object.entries(selfAssessment)
    .filter(([, v]) => v && String(v).trim())
    .map(([key, val]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `- ${label}: ${val}`;
    })
    .join('\n');

  // Situation type descriptions for coaching tone
  const situationDescriptions = {
    'reinforcing_behavior': 'Reinforcing a behavior I want repeated',
    'acknowledging_improvement': 'Acknowledging improvement after prior feedback',
    'recognizing_follow_through': 'Recognizing strong follow-through',
    'reinforcing_ownership': 'Reinforcing ownership taken without prompting'
  };

  const situationLabel = situationDescriptions[situationBranch] || situationBranch || 'Not specified';

  const prompt = `You are evaluating a leadership practice exercise ("Real Rep") for Deliver Reinforcing Feedback.

DEFINITION:
Deliver Reinforcing Feedback occurs when a leader:
- notices a specific behavior
- communicates that behavior
- explains why the behavior matters
- signals that the behavior should continue
The purpose is to reinforce repeatable leadership behaviors, not simply praise outcomes.

CONTEXT:
- Situation type: ${situationLabel}
${commitContext ? `- Situation context (optional note): ${commitContext}` : ''}
- Person involved: ${person || 'Not specified'}
- Their response: ${responseType || 'Not specified'}

EVIDENCE PROVIDED:
${evidenceLines.join('\n') || '(No structured evidence provided)'}
${selfAssessmentLines ? `\nSelf-Assessment:\n${selfAssessmentLines}` : ''}
${notes ? `\nAdditional notes: ${notes}` : ''}

INPUT VALIDITY CHECK (CRITICAL - EVALUATE FIRST):
Before scoring ANY condition, check if the evidence contains GIBBERISH or NONSENSE:
- Random characters or keyboard mashing (e.g., "asdf", "qwerty", "jjjj", "asddfasfdasfd")
- Meaningless text that does not form coherent sentences
- Placeholder text (e.g., "test", "xxx", "lorem ipsum")
- Single repeated characters or words
- Content unrelated to workplace leadership (personal relationships, jokes, etc.)

If ANY evidence field contains gibberish or nonsense:
1. Set repValidity to "invalid"
2. Set invalidReason to describe the specific gibberish detected (quote it)
3. ALL conditions MUST score 0 with label "None"
4. Do NOT attempt to interpret or find meaning in nonsense text

EVALUATION INSTRUCTIONS:
First determine if this rep is Valid or Invalid.
A rep is Valid if the leader clearly delivered reinforcing feedback.
Reinforcing feedback requires:
- noticing a specific behavior
- communicating the behavior
- explaining why it matters

A rep is Invalid if:
- the evidence contains gibberish, random characters, or nonsense text
- the response does not describe feedback delivered
- the response contains only general praise
- the response contains no usable evidence
Example invalid evidence: "I told them good job." or "asdfasdf"

If Invalid, set repValidity to "invalid" and stop — all conditions score 0.

COMBINED EVIDENCE RULE:
The AI may use all evidence fields, including optional notes.
Secondary notes may clarify the overall evidence but do not guarantee score points individually.
Optional notes may clarify evidence but do not add bonus points.
A single statement may satisfy multiple conditions.
Example:
"You stayed late to help the new rep. That helped them ramp faster."
Behavior = observable action, Impact = why it matters.
Each condition must still be scored independently.
Optional notes may clarify evidence but do not add bonus points.

SCORING RULES:
Score each condition 0-3:
3 = Strong evidence
2 = Adequate evidence
1 = Weak evidence
0 = No usable evidence

CONDITION 1 — OBSERVABLE BEHAVIOR CLEARLY NAMED (Critical Condition — Camera Test)
Did the leader clearly describe the behavior being reinforced?
The behavior description should pass the Camera Test: a neutral observer should be able to see the behavior occurring.
3: Behavior clearly observable (e.g., "You stayed late to help the new rep learn the CRM.")
2: Behavior identifiable but slightly general (e.g., "You did a nice job helping the team.")
1: Behavior vague or interpreted (e.g., "You showed great leadership.")
0: No behavior evidence (e.g., "Great job." / "Nice work.")

CONDITION 2 — IMPACT OR MEANING EXPLAINED
Did the leader explain why the behavior matters?
Impact connects behavior to: team effectiveness, results, culture, standards, or learning.
3: Impact clearly stated (e.g., "That helped the team ramp faster.")
2: Impact implied but not clearly explained (e.g., "That really helped.")
1: Impact vague or generic (e.g., "That was awesome.")
0: No impact stated.

CONDITION 3 — REINFORCEMENT OF REPEAT BEHAVIOR
Did the leader reinforce or encourage repeating the behavior?
Reinforcement can be explicit or implied.
3: Clear encouragement to repeat (e.g., "Keep doing that." / "That's exactly the approach we want to see.")
2: Encouragement implied (e.g., "I appreciate you doing that.")
1: Positive tone but no reinforcement signal (e.g., "Nice." / "Good.")
0: No reinforcement present.

AUTOMATIC FAIL CONDITIONS:
The rep automatically fails if:
- any condition scores 0
- two conditions score 1
- Observable Behavior Clearly Named = 1
Behavior specificity is a critical leadership behavior. This prevents generic praise from passing.

PASS RULE:
A rep passes if: repValidity = Valid AND no automatic fail conditions triggered AND total score >= 5.
Total score = sum of all three condition scores (range 3-9).

SIMPLICITY RULE:
Do not penalize short reinforcing feedback.
Example strong feedback: "You summarized the client concerns clearly. That helped the team align."
Simplicity is acceptable when the behavior is observable and the impact is understandable.
Only penalize feedback that is generic praise, non-observable, or lacking meaning.

COACHING QUESTIONS (1-2):
Generate 1-2 coaching questions addressing the lowest scoring condition.
Reference the leader's evidence when possible.
Question rotation rule:
Question 1 -> Reflection or Counterfactual frame
Question 2 -> Forward-Looking frame
CRITICAL: The AI should avoid repeating the same question structure across consecutive reps.
${previousQuestions && previousQuestions.length > 0 ? `For context, here are the coaching questions from their PREVIOUS rep. DO NOT repeat these topics or structures:\n${previousQuestions.map(q => `- ${q}`).join('\n')}` : ''}

Question examples:
- Reflection: "What made that behavior stand out to you in the moment?"
- Counterfactual: "What might have happened if you had named the impact more clearly?"
- Forward-Looking: "What's one way you might reinforce that behavior even more clearly next time?"

REFLECTION PROMPT (Optional):
A short prompt encouraging the leader to apply the lesson in the next rep.
Encourage reflection, not instruction.
Example: "Before your next rep, consider one behavior you want to intentionally notice and reinforce."

${situationBranch ? `SITUATION-AWARE COACHING:\nReference the selected situation type (${situationLabel}) in your coaching when relevant.` : ''}

Respond ONLY with valid JSON in this exact format:
{
  "repValidity": "valid" or "invalid",
  "invalidReason": "Reason if invalid, null if valid",
  "conditions": {
    "behavior_named": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "impact_explained": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "reinforcement_given": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    }
  },
  "autoFailTriggered": boolean,
  "autoFailReason": "Reason if auto-fail, null otherwise",
  "totalScore": number,
  "repPassed": boolean,
  "coachingQuestions": ["question1", "question2"],
  "reflectionPrompt": "Optional short reflection prompt or null",
  "summary": "2-sentence evaluation summary"
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let assessment;
    try {
      assessment = JSON.parse(text);
    } catch (parseErr) {
      logger.error("Failed to parse DRF AI response as JSON", { text, error: parseErr });
      throw new HttpsError('internal', 'AI response was not valid JSON');
    }

    const conditions = assessment.conditions || {};
    const totalScore = (conditions.behavior_named?.score || 0) + 
                       (conditions.impact_explained?.score || 0) + 
                       (conditions.reinforcement_given?.score || 0);

    // Validate auto-fail conditions server-side
    const scores = [
      conditions.behavior_named?.score || 0,
      conditions.impact_explained?.score || 0,
      conditions.reinforcement_given?.score || 0
    ];
    const hasZero = scores.some(s => s === 0);
    const onesCount = scores.filter(s => s === 1).length;
    const behaviorIsOne = (conditions.behavior_named?.score || 0) === 1;
    const autoFailTriggered = hasZero || onesCount >= 2 || behaviorIsOne;

    const isValid = assessment.repValidity !== 'invalid';
    const repPassed = isValid && !autoFailTriggered && totalScore >= 5;

    logger.info("DRF rep assessment completed", { 
      repType, totalScore, repPassed, autoFailTriggered, isValid
    });

    return {
      evaluationType: 'drf_scored',
      repValidity: assessment.repValidity || 'valid',
      invalidReason: assessment.invalidReason || null,
      conditions,
      autoFailTriggered,
      autoFailReason: autoFailTriggered ? (assessment.autoFailReason || 'Automatic fail condition met') : null,
      totalScore,
      maxScore: 9,
      repPassed,
      coachingQuestions: assessment.coachingQuestions || [],
      reflectionPrompt: assessment.reflectionPrompt || null,
      summary: assessment.summary || (repPassed ? 'Rep Passed' : 'Rep Not Passed'),
      // Backward-compatible fields
      meetsStandard: repPassed,
      isConstructive: isValid,
      constructiveFeedback: !isValid ? (assessment.invalidReason || 'This rep does not contain valid evidence') : null,
      assessedAt: new Date().toISOString(),
      assessedBy: 'ai'
    };

  } catch (error) {
    logger.error("Error in assessDRFRep", error);
    if (error.code) throw error;
    throw new HttpsError('internal', 'Failed to assess DRF rep quality');
  }
}

// ================================================================
// SCE EVALUATION FUNCTION
// Implements the LeaderReps AI Evaluation Specification for 
// Set Clear Expectations Real Reps
// ================================================================
async function assessSCERep(data, person, repType, previousQuestions = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("GEMINI_API_KEY is not configured");
    throw new HttpsError('internal', 'AI service not configured');
  }

  // Extract SCE-specific evidence
  const situationBranch = data.situation_branch || '';
  const commitContext = data.commit_context || '';
  const sceResponses = data.sce_responses || {};
  const selfAssessment = data.self_assessment || {};
  const responseType = data.response_type || data.outcome || '';
  const notes = data.notes || '';

  // Build evidence summary from structured SCE fields
  const evidenceLines = Object.entries(sceResponses)
    .filter(([, v]) => v && String(v).trim())
    .map(([key, val]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      // Handle yes/no/comment fields
      if (typeof val === 'object' && val !== null) {
        const parts = [];
        if (val.answer) parts.push(val.answer);
        if (val.comment) parts.push(val.comment);
        return `- ${label}: ${parts.join(' — ')}`;
      }
      return `- ${label}: ${val}`;
    })
    .join('\n');

  // Situation type descriptions for coaching tone
  const situationDescriptions = {
    'assigning_task': 'Assigning a task and defining what done looks like',
    'delegating': 'Delegating ongoing ownership of a responsibility',
    'behavioral_standards': 'Setting or clarifying behavioral standards',
    'resetting': 'Resetting expectations without changing ownership'
  };

  const situationLabel = situationDescriptions[situationBranch] || situationBranch || 'Not specified';

  const prompt = `You are evaluating a leadership practice exercise ("Real Rep") for Set Clear Expectations.

DEFINITION:
Set Clear Expectations occurs when a leader explicitly defines what work or behavior is expected and what success looks like.
The goal is to eliminate ambiguity before execution begins.
This Real Rep also verifies that the expectation is understood and responsibility for the outcome is clear.

CONTEXT:
- Situation type: ${situationLabel}
${commitContext ? `- Situation context (optional note): ${commitContext}` : ''}
- Person involved: ${person || 'Not specified'}
- Their response: ${responseType || 'Not specified'}

EVIDENCE PROVIDED:
${evidenceLines || '(No structured evidence provided)'}
${notes ? `\nAdditional notes: ${notes}` : ''}

INPUT VALIDITY CHECK (CRITICAL - EVALUATE FIRST):
Before scoring ANY condition, check if the evidence contains GIBBERISH or NONSENSE:
- Random characters or keyboard mashing (e.g., "asdf", "qwerty", "jjjj", "asddfasfdasfd")
- Meaningless text that does not form coherent sentences
- Placeholder text (e.g., "test", "xxx", "lorem ipsum")
- Single repeated characters or words
- Content unrelated to workplace leadership (personal relationships, jokes, etc.)

If ANY evidence field contains gibberish or nonsense:
1. Set repValidity to "invalid"
2. Set invalidReason to describe the specific gibberish detected (quote it)
3. ALL conditions MUST score 0 with label "None"
4. Do NOT attempt to interpret or find meaning in nonsense text

EVALUATION INSTRUCTIONS:
First determine if this rep is Valid or Invalid.
A rep is Valid if the leader clearly attempted to define expectations for work or behavior.
A rep is Invalid if:
- the evidence contains gibberish, random characters, or nonsense text
- the response does not describe expectation-setting
- the response is unrelated to the Real Rep
- the response contains no usable evidence

If Invalid, set repValidity to "invalid" and stop — all conditions score 0.

SCORING RULES:
Score each condition 0–3:
3 = Strong evidence
2 = Adequate evidence
1 = Weak evidence
0 = No usable evidence

The AI may use all available evidence fields, including optional notes. A single statement may satisfy multiple conditions, but each condition must still be scored independently.
When evaluating evidence, you may use information across fields if the evidence collectively clarifies the expectation or success criteria.
Optional notes may clarify evidence but do not add bonus points.

CONDITION 1 — EXPECTATION CLEARLY STATED
Did the leader clearly state the expected task, deliverable, or behavior?
The expectation should include: an action, a clear object or outcome, a specific instruction.
3: Expectation clear and actionable (e.g., "Prepare a three-slide summary of the risks")
2: Expectation understandable but slightly vague (e.g., "Put together a summary of the risks")
1: Expectation vague or incomplete (e.g., "Handle this")
0: No usable expectation

CONDITION 2 — SUCCESS CLEARLY DEFINED (Critical Condition)
Did the leader define what "done" looks like?
Success criteria should allow the work to be inspected or evaluated.
Indicators: scope, quantity, deadline, format, quality, measurable outcome.
3: Success criteria clearly define inspectable results (e.g., "Include the three risks and recommended actions")
2: Outcome partially defined (e.g., "Include the key risks")
1: Outcome unclear (e.g., "Make sure it's good")
0: No success criteria provided

CONDITION 3 — SHARED UNDERSTANDING CONFIRMED
Did the leader confirm alignment?
Alignment may be demonstrated through restating, acknowledging, or confirming understanding.
3: Expectation or success criteria restated (e.g., "So you want three slides by Thursday")
2: Acknowledgement without restatement (e.g., "Got it")
1: Alignment assumed but not tested
0: No usable alignment evidence

CONDITION 4 — OWNERSHIP CLEARLY ESTABLISHED
Did the leader ensure it was clear who is responsible for delivering the outcome?
Responsibility may be newly transferred or reaffirmed.
3: Responsibility clearly accepted or reaffirmed (e.g., "I'll take care of the report and have it ready Thursday")
2: Ownership implied but not explicit (e.g., "I'll handle it")
1: Ownership uncertain or hesitant (e.g., "I'll try") — statements expressing hesitation automatically score 1 or lower
0: No ownership evidence

AUTOMATIC FAIL CONDITIONS:
The rep automatically fails if:
- any condition scores 0
- two conditions score 1
- Expectation clearly stated = 1
- Success clearly defined = 1
Expectation clarity and success definition are non-negotiable leadership behaviors.
Ownership is not a non-negotiable fail condition because ownership may already exist.
Evaluate automatic fail conditions BEFORE calculating total score.

PASS RULE:
A rep passes if: repValidity = Valid AND no automatic fail conditions triggered AND total score >= 6.
Total score = sum of all four condition scores (range 4–12).

SIMPLICITY RULE:
Do not penalize simple expectations. "Send the client update by Thursday" can still score Strong.
Weak scores should occur only when expectations are vague, generalized, incomplete, or non-inspectable.

COACHING QUESTIONS (1–2):
Generate 1-2 coaching questions addressing the lowest scoring condition.
Reference the leader's evidence when possible.
Question rotation rule:
Question 1 -> Reflection or Counterfactual frame
Question 2 -> Forward-Looking frame
CRITICAL: The AI should avoid repeating the same question structure across consecutive reps.
${previousQuestions && previousQuestions.length > 0 ? `For context, here are the coaching questions from their PREVIOUS rep. DO NOT repeat these topics or structures:\n${previousQuestions.map(q => `- ${q}`).join('\n')}` : ''}

Question examples:
- Reflection: "What signal told you they fully understood the expectation?"
- Counterfactual: "What might have happened if you asked them to summarize what 'done' looks like?"
- Forward-Looking: "What's one simple way you might confirm ownership next time?"

REFLECTION PROMPT (Optional):
A short prompt encouraging the leader to apply the lesson in the next rep.
Encourage reflection, not instruction.

${situationBranch ? `SITUATION-AWARE COACHING:
Reference the selected situation type (${situationLabel}) in your coaching when relevant.` : ''}

Respond ONLY with valid JSON in this exact format:
{
  "repValidity": "valid" or "invalid",
  "invalidReason": "Reason if invalid, null if valid",
  "conditions": {
    "expectation_stated": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "success_defined": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "understanding_confirmed": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "ownership_established": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    }
  },
  "autoFailTriggered": boolean,
  "autoFailReason": "Reason if auto-fail, null otherwise",
  "totalScore": number,
  "repPassed": boolean,
  "coachingQuestions": ["question1", "question2"],
  "reflectionPrompt": "Optional short reflection prompt or null",
  "summary": "2-sentence evaluation summary"
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let assessment;
    try {
      assessment = JSON.parse(text);
    } catch (parseErr) {
      logger.error("Failed to parse SCE AI response as JSON", { text, error: parseErr });
      throw new HttpsError('internal', 'AI response was not valid JSON');
    }

    const conditions = assessment.conditions || {};
    const totalScore = (conditions.expectation_stated?.score || 0) + 
                       (conditions.success_defined?.score || 0) + 
                       (conditions.understanding_confirmed?.score || 0) + 
                       (conditions.ownership_established?.score || 0);

    // Validate auto-fail conditions server-side
    const scores = [
      conditions.expectation_stated?.score || 0,
      conditions.success_defined?.score || 0,
      conditions.understanding_confirmed?.score || 0,
      conditions.ownership_established?.score || 0
    ];
    const hasZero = scores.some(s => s === 0);
    const onesCount = scores.filter(s => s === 1).length;
    const expectationIsOne = (conditions.expectation_stated?.score || 0) === 1;
    const successIsOne = (conditions.success_defined?.score || 0) === 1;
    const autoFailTriggered = hasZero || onesCount >= 2 || expectationIsOne || successIsOne;

    const isValid = assessment.repValidity !== 'invalid';
    const repPassed = isValid && !autoFailTriggered && totalScore >= 6;

    logger.info("SCE rep assessment completed", { 
      repType, totalScore, repPassed, autoFailTriggered, isValid
    });

    return {
      // SCE-specific format
      evaluationType: 'sce_scored',
      repValidity: assessment.repValidity || 'valid',
      invalidReason: assessment.invalidReason || null,
      conditions,
      autoFailTriggered,
      autoFailReason: autoFailTriggered ? (assessment.autoFailReason || 'Automatic fail condition met') : null,
      totalScore,
      maxScore: 12,
      repPassed,
      coachingQuestions: assessment.coachingQuestions || [],
      reflectionPrompt: assessment.reflectionPrompt || null,
      summary: assessment.summary || (repPassed ? 'Rep Passed' : 'Rep Not Passed'),
      // Backward-compatible fields for QualityAssessmentCard
      meetsStandard: repPassed,
      isConstructive: isValid,
      constructiveFeedback: !isValid ? (assessment.invalidReason || 'This rep does not contain valid evidence') : null,
      assessedAt: new Date().toISOString(),
      assessedBy: 'ai'
    };

  } catch (error) {
    logger.error("Error in assessSCERep", error);
    if (error.code) throw error;
    throw new HttpsError('internal', 'Failed to assess SCE rep quality');
  }
}

// ================================================================
// FUW (Follow-Up on the Work) EVALUATION FUNCTION
// ================================================================
async function assessFUWRep(data, person, repType, previousQuestions = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("GEMINI_API_KEY is not configured");
    throw new HttpsError('internal', 'AI service not configured');
  }

  // Extract FUW-specific evidence
  const fuwResponses = data.fuw_responses || data.sce_responses || {};
  const selfAssessment = data.self_assessment || {};
  const responseType = data.response_type || '';
  const notes = data.notes || '';
  const situationBranch = data.situation_branch || '';

  // Build evidence summary from structured FUW fields
  // FUW_EVIDENCE_QUESTIONS capture: status_question, vague_response, validation_question, obstacle_question
  const evidenceLines = [];
  if (fuwResponses.status_question) {
    evidenceLines.push(`- Status question asked: "${fuwResponses.status_question}"`);
  }
  if (fuwResponses.vague_response) {
    const vagueLabel = typeof fuwResponses.vague_response === 'object' 
      ? fuwResponses.vague_response.selected 
      : fuwResponses.vague_response;
    evidenceLines.push(`- Was the response vague?: ${vagueLabel}`);
  }
  if (fuwResponses.validation_question) {
    evidenceLines.push(`- Follow-up validation question: "${fuwResponses.validation_question}"`);
  }
  if (fuwResponses.obstacle_question) {
    evidenceLines.push(`- Obstacle/risk question: "${fuwResponses.obstacle_question}"`);
  }
  // Fallback to legacy field names if new fields aren't present
  if (evidenceLines.length === 0) {
    if (fuwResponses.what_said) {
      evidenceLines.push(`- What you said: ${fuwResponses.what_said}`);
    }
    if (fuwResponses.what_they_said) {
      evidenceLines.push(`- What they said: ${fuwResponses.what_they_said}`);
    }
    if (fuwResponses.their_response) {
      evidenceLines.push(`- Their response: ${fuwResponses.their_response}`);
    }
  }

  // Self-assessment context
  const selfAssessmentLines = Object.entries(selfAssessment)
    .filter(([, v]) => v && String(v).trim())
    .map(([key, val]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `- ${label}: ${val}`;
    })
    .join('\n');

  // Situation type descriptions for coaching tone
  const situationDescriptions = {
    'checking_progress': 'Checking in on delegated work',
    'following_up_commitment': 'Following up on a commitment',
    'inspecting_milestone': 'Inspecting a milestone'
  };

  const situationLabel = situationDescriptions[situationBranch] || situationBranch || 'Not specified';

  const prompt = `You are evaluating a leadership practice exercise ("Real Rep") for Follow-Up on the Work.

DEFINITION:
Follow-Up on the Work occurs when a leader:
- checks in on delegated or assigned work
- asks about progress in a way that makes execution visible
- maintains the direct's ownership without taking back the work
The purpose is to ensure work stays on track while keeping ownership with the direct.

CONTEXT:
- Situation type: ${situationLabel}
- Person involved: ${person || 'Not specified'}
- Their response: ${responseType || 'Not specified'}

EVIDENCE PROVIDED:
${evidenceLines.join('\n') || '(No structured evidence provided)'}
${selfAssessmentLines ? `\nSelf-Assessment:\n${selfAssessmentLines}` : ''}
${notes ? `\nAdditional notes: ${notes}` : ''}

INPUT VALIDITY CHECK (CRITICAL - EVALUATE FIRST):
Before scoring ANY condition, check if the evidence contains GIBBERISH or NONSENSE:
- Random characters or keyboard mashing (e.g., "asdf", "qwerty", "jjjj")
- Meaningless text that does not form coherent sentences
- Placeholder text (e.g., "test", "xxx", "lorem ipsum")
- Single repeated characters or words
- Content unrelated to workplace leadership

If ANY evidence field contains gibberish or nonsense:
1. Set repValidity to "invalid"
2. Set invalidReason to describe the specific gibberish detected
3. ALL conditions MUST score 0 with label "None"
4. Do NOT attempt to interpret or find meaning in nonsense text

EVALUATION INSTRUCTIONS:
First determine if this rep is Valid or Invalid.
A rep is Valid if the leader clearly followed up on work.
Following up requires:
- referencing specific work
- asking about progress or status
- keeping ownership with the direct

A rep is Invalid if:
- the evidence contains gibberish, random characters, or nonsense text
- the response does not describe a follow-up interaction
- the response contains no usable evidence

If Invalid, set repValidity to "invalid" and stop — all conditions score 0.

SCORING RULES:
Score each condition 0-3:
3 = Strong evidence
2 = Adequate evidence
1 = Weak evidence
0 = No usable evidence

CONDITION 1 — WORK ANCHORED & STATUS REQUESTED (Critical Condition)
Did the leader ask about progress while referencing the specific work?
3: Clear work reference and progress request (e.g., "Where are you with the client proposal?")
2: Work referenced but slightly general (e.g., "How's the proposal going?")
1: Progress asked but work not clearly referenced (e.g., "Any updates?")
0: No progress question

CONDITION 2 — PROGRESS VISIBILITY
Did the interaction reveal real execution progress?
3: Leader validated progress with inspection (e.g., "What's left to finish?")
2: Progress became visible without explicit validation (e.g., Direct clearly explained remaining work)
1: Leader accepted vague reassurance (e.g., "It's going well")
0: No visibility into progress

CONDITION 3 — OWNERSHIP PRESERVED
Did the work remain owned by the direct?
3: Ownership clearly reinforced (e.g., "What's your next step?" / "Keep me posted")
2: Ownership implied but not clearly reinforced (e.g., "Okay")
1: Leader begins directing execution heavily (prescribing solutions)
0: Leader takes back the work (e.g., "Send it to me and I'll finish it")

AUTOMATIC FAIL CONDITIONS:
The rep automatically fails if:
- any condition scores 0
- two conditions score 1
- Work Anchored & Status Requested = 1
Work anchoring is critical — vague check-ins don't demonstrate the behavior.

PASS RULE:
A rep passes if: repValidity = Valid AND no automatic fail conditions triggered AND total score >= 6.
Total score = sum of all three condition scores (range 3-9).

COACHING QUESTIONS (1-2):
Generate 1-2 coaching questions addressing the lowest scoring condition.
Reference the leader's evidence when possible.
Question frames:
- Reflection: "What made you choose that approach to checking in?"
- Counterfactual: "What might have changed if you had asked about specific milestones?"
- Forward-Looking: "What's one question you could ask next time to make progress more visible?"

${previousQuestions && previousQuestions.length > 0 ? `For context, here are the coaching questions from their PREVIOUS rep. DO NOT repeat these topics:\n${previousQuestions.map(q => `- ${q}`).join('\n')}` : ''}

Respond ONLY with valid JSON in this exact format:
{
  "repValidity": "valid" or "invalid",
  "invalidReason": "Reason if invalid, null if valid",
  "conditions": {
    "work_anchored": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "progress_visible": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "ownership_preserved": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    }
  },
  "autoFailTriggered": boolean,
  "autoFailReason": "Reason if auto-fail, null otherwise",
  "totalScore": number,
  "repPassed": boolean,
  "coachingQuestions": ["question1", "question2"],
  "reflectionPrompt": "Optional short reflection prompt or null",
  "summary": "2-sentence evaluation summary"
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let assessment;
    try {
      assessment = JSON.parse(text);
    } catch (parseErr) {
      logger.error("Failed to parse FUW AI response as JSON", { text, error: parseErr });
      throw new HttpsError('internal', 'AI response was not valid JSON');
    }

    const conditions = assessment.conditions || {};
    const totalScore = (conditions.work_anchored?.score || 0) + 
                       (conditions.progress_visible?.score || 0) + 
                       (conditions.ownership_preserved?.score || 0);

    // Validate auto-fail conditions server-side
    const scores = [
      conditions.work_anchored?.score || 0,
      conditions.progress_visible?.score || 0,
      conditions.ownership_preserved?.score || 0
    ];
    const hasZero = scores.some(s => s === 0);
    const onesCount = scores.filter(s => s === 1).length;
    const workAnchoredIsOne = (conditions.work_anchored?.score || 0) === 1;
    const autoFailTriggered = hasZero || onesCount >= 2 || workAnchoredIsOne;

    const isValid = assessment.repValidity !== 'invalid';
    const repPassed = isValid && !autoFailTriggered && totalScore >= 6;

    logger.info("FUW rep assessment completed", { 
      repType, totalScore, repPassed, autoFailTriggered, isValid
    });

    return {
      evaluationType: 'fuw_scored',
      repValidity: assessment.repValidity || 'valid',
      invalidReason: assessment.invalidReason || null,
      conditions,
      autoFailTriggered,
      autoFailReason: autoFailTriggered ? (assessment.autoFailReason || 'Automatic fail condition met') : null,
      totalScore,
      maxScore: 9,
      repPassed,
      coachingQuestions: assessment.coachingQuestions || [],
      reflectionPrompt: assessment.reflectionPrompt || null,
      summary: assessment.summary || (repPassed ? 'Rep Passed' : 'Rep Not Passed'),
      meetsStandard: repPassed,
      isConstructive: isValid,
      constructiveFeedback: !isValid ? (assessment.invalidReason || 'This rep does not contain valid evidence') : null,
      assessedAt: new Date().toISOString(),
      assessedBy: 'ai'
    };

  } catch (error) {
    logger.error("Error in assessFUWRep", error);
    if (error.code) throw error;
    throw new HttpsError('internal', 'Failed to assess FUW rep quality');
  }
}

// ================================================================
// LWV (Lead With Vulnerability) EVALUATION FUNCTION
// ================================================================
async function assessLWVRep(data, person, repType, previousQuestions = [], previousForwardScores = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("GEMINI_API_KEY is not configured");
    throw new HttpsError('internal', 'AI service not configured');
  }

  // Extract LWV-specific evidence
  const lwvResponses = data.lwv_responses || data.sce_responses || {};
  const selfAssessment = data.self_assessment || {};
  const responseType = data.response_type || '';
  const notes = data.notes || '';
  const situationBranch = data.situation_branch || '';

  // Build evidence summary from structured LWV fields
  // LWV_EVIDENCE_QUESTIONS capture: vulnerability_statement, forward_statement
  const evidenceLines = [];
  if (lwvResponses.vulnerability_statement) {
    evidenceLines.push(`- Vulnerability statement: "${lwvResponses.vulnerability_statement}"`);
  }
  if (lwvResponses.forward_statement) {
    evidenceLines.push(`- Forward/learning statement: "${lwvResponses.forward_statement}"`);
  }
  // Fallback to legacy field names if new fields aren't present
  if (evidenceLines.length === 0) {
    if (lwvResponses.what_said) {
      evidenceLines.push(`- What you said: ${lwvResponses.what_said}`);
    }
    if (lwvResponses.what_they_said) {
      evidenceLines.push(`- What they said: ${lwvResponses.what_they_said}`);
    }
    if (lwvResponses.their_response) {
      evidenceLines.push(`- Their response: ${lwvResponses.their_response}`);
    }
  }

  // Self-assessment context
  const selfAssessmentLines = Object.entries(selfAssessment)
    .filter(([, v]) => v && String(v).trim())
    .map(([key, val]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `- ${label}: ${val}`;
    })
    .join('\n');

  // Situation type descriptions for coaching tone
  const situationDescriptions = {
    'owning_mistake': 'Owning a mistake you made',
    'sharing_gap': 'Sharing a gap in your knowledge or skill',
    'modeling_learning': 'Modeling learning in front of the team'
  };

  const situationLabel = situationDescriptions[situationBranch] || situationBranch || 'Not specified';

  // Pattern detection for forward strength
  const recentForwardZeros = previousForwardScores.slice(-2).filter(s => s === 0).length;
  const patternFeedbackNeeded = recentForwardZeros >= 2;

  const prompt = `You are evaluating a leadership practice exercise ("Real Rep") for Lead With Vulnerability.

DEFINITION (LWV Design Intent):
Lead With Vulnerability is:
- Visible leadership ownership in moments where credibility, clarity, or direction was at risk
- Self-focused: the leader takes personal responsibility for THEIR OWN behavior, thinking, or decision
- Specific: must reference a clear action, interaction, or decision

Lead With Vulnerability is NOT:
- General accountability language ("I owned it", "I took responsibility")
- Low-stakes communication cleanup
- Indirect feedback delivery disguised as ownership
- Apology-only patterns without forward action

CONTEXT:
- Situation type: ${situationLabel}
- Person involved: ${person || 'Not specified'}
- Their response: ${responseType || 'Not specified'}

EVIDENCE PROVIDED:
${evidenceLines.join('\n') || '(No structured evidence provided)'}
${selfAssessmentLines ? `\nSelf-Assessment:\n${selfAssessmentLines}` : ''}
${notes ? `\nAdditional notes: ${notes}` : ''}

====== VALIDITY CHECKS (EVALUATE IN ORDER) ======

CHECK 1: INPUT VALIDITY (Gibberish Detection)
Before scoring ANY condition, check if the evidence contains GIBBERISH or NONSENSE:
- Random characters or keyboard mashing (e.g., "asdf", "qwerty", "jjjj")
- Meaningless text that does not form coherent sentences
- Placeholder text (e.g., "test", "xxx", "lorem ipsum")
- Single repeated characters or words
- Content unrelated to workplace leadership
If detected: Set repValidity = "invalid", invalidReason = "Evidence contains unusable or nonsense text"

CHECK 2: MINIMUM EVIDENCE QUALITY (Required Components)
The vulnerability statement MUST include ALL of:
1. Subject (I / my / me) — first-person ownership
2. Action or thinking shift — what they did/decided/missed
3. Identifiable context — a conversation, decision, or action that can be anchored

Reject if ANY component is missing. Examples that FAIL this check:
- "Owned the mistake" (no action, no context)
- "Admitted I was wrong" (no action, no context)
- "Took accountability" (no action, no context)
If failed: Set repValidity = "invalid", invalidReason = "Statement lacks minimum evidence quality (missing subject, action, or context)"

CHECK 3: REAL EXPOSURE THRESHOLD
A rep is Valid only if the vulnerability statement reflects:
- A specific, identifiable leadership miss, uncertainty, or thinking change
- Observable impact on work, expectations, or team interaction

Mark Invalid if:
- Statement is generic ownership with no identifiable situation
  - "I should have been clearer" (no situation)
  - "I could have handled that better" (no anchor)
- Statement lacks contextual anchor (no clear conversation, decision, or action)
If failed: Set repValidity = "invalid", invalidReason = "Generic ownership without identifiable situation or context"

CHECK 4: AUTHORITY COLLAPSE DETECTION
Authority collapse = exaggerated failure language + undermining confidence in future leadership
Auto-fail if statement includes BOTH:
- Absolute language: "completely", "totally", "everything"
- Self-competence erosion

Examples that FAIL:
- "I completely screwed everything up"
- "That was a total failure on my part"
Examples that PASS:
- "That was a miss on my part"
- "I handled that poorly"
If detected: Set repValidity = "invalid", invalidReason = "Authority collapse detected — exaggerated failure language undermines leadership credibility"

CHECK 5: LWV PURITY (Self-Focused Boundary)
LWV must primarily focus on the leader's own behavior, thinking, or decision.
DISQUALIFY if:
- The vulnerability statement includes direction to others as the PRIMARY outcome
- The primary intent is correcting others' behavior rather than owning the miss

Examples that FAIL LWV (should be SCE or RED):
- "I should have been clearer, so going forward I need you to follow the process"
- "That's on me, but I need you to improve communication"

ALLOWED (brief expectation reset directly tied to leader's miss):
- "I wasn't clear on expectations earlier. Let me reset what success looks like."

If primary intent = directing others: 
Set hybridDrift = true
Set hybridDriftReason = "This interaction may be SCE or RED, not LWV — primary focus is correcting others' behavior"

====== SCORING (Only if rep passes all validity checks) ======

CONDITION 1 — OWNERSHIP PRESENT (Critical Condition)
Did the leader take personal responsibility for a mistake or learning gap?
3 = Strong: Clear personal ownership with no deflection (e.g., "I rushed that decision and missed something important.")
2 = Adequate: Ownership present but slightly hedged (e.g., "I should have handled that differently.")
1 = Weak: Ownership implied but not direct (e.g., "Things could have gone better.")
0 = None: No ownership or deflection to others (e.g., "The team didn't execute well.")

CONDITION 2 — STATEMENT CLARITY (HARDENED)
Was the ownership statement clear and specific?
3 = Strong: Specific action + identifiable situation (e.g., "I rushed the timeline on the proposal yesterday.")
2 = Adequate: Action identifiable, context implied (e.g., "I rushed that conversation earlier.")
1 = Weak: Generic ownership without clear situation (e.g., "I should have handled that better.")
0 = None: Unusable / vague (e.g., "Things got messy.")

CRITICAL RULE: If Clarity ≤ 1, the rep CANNOT pass, even if ownership is strong.
OVERRIDE RULE: If Ownership ≥ 2 but Clarity ≤ 1 → Set repValidity = "invalid" with reason "Ownership present but lacks required specificity"

CONDITION 3 — FORWARD STRENGTH
Did the leader connect the ownership to forward action or learning?
3 = Strong: Clear forward commitment with specific action (e.g., "Next time I'll brief you before the meeting.")
2 = Adequate: Forward action implied but not specific (e.g., "I'll do better next time.")
1 = Weak: Forward action vague or absent (acknowledged miss but no forward look)
0 = None: No forward action or stuck in the past

${patternFeedbackNeeded ? `
PATTERN ALERT: This leader has scored Forward Strength = 0 on 2 of their last 3 LWV reps.
If Forward Strength = 0 again, include this EXACT pattern feedback in your response:
"You're consistently acknowledging ownership, but not reinforcing what changes moving forward. How will you ensure your vulnerability also strengthens direction, not just accountability?"
` : ''}

====== AUTO-FAIL CONDITIONS ======

The rep automatically fails if ANY of:
- repValidity = "invalid"
- Ownership Present < 2 (Critical condition — without clear ownership, this is not vulnerability)
- Statement Clarity ≤ 1 (Hardened rule — specificity is required)
- Any condition scores 0
- Two conditions score 1

PASS RULE:
A rep passes if: repValidity = "valid" AND no automatic fail conditions AND total score >= 6.
Total score = sum of all three condition scores (range 3-9).

====== COACHING QUESTIONS (1-2) ======

Generate 1-2 coaching questions addressing the lowest scoring condition.
Reference the leader's evidence when possible.
Be encouraging — vulnerability is hard.

If hybridDrift detected, add this coaching prompt:
"This moment includes both ownership and direction. What was your primary objective—owning the miss, or correcting behavior?"

${previousQuestions && previousQuestions.length > 0 ? `For context, here are the coaching questions from their PREVIOUS rep. DO NOT repeat these topics:\n${previousQuestions.map(q => `- ${q}`).join('\n')}` : ''}

====== RESPONSE FORMAT ======

Respond ONLY with valid JSON in this exact format:
{
  "repValidity": "valid" or "invalid",
  "invalidReason": "Reason if invalid, null if valid",
  "conditions": {
    "ownership_present": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "statement_clarity": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "forward_strength": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    }
  },
  "hybridDrift": boolean,
  "hybridDriftReason": "Reason if hybrid drift detected, null otherwise",
  "authorityCollapse": boolean,
  "autoFailTriggered": boolean,
  "autoFailReason": "Reason if auto-fail, null otherwise",
  "totalScore": number,
  "repPassed": boolean,
  "coachingQuestions": ["question1", "question2"],
  "patternFeedback": "Pattern feedback if applicable, null otherwise",
  "reflectionPrompt": "Optional short reflection prompt or null",
  "summary": "2-sentence evaluation summary"
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let assessment;
    try {
      assessment = JSON.parse(text);
    } catch (parseErr) {
      logger.error("Failed to parse LWV AI response as JSON", { text, error: parseErr });
      throw new HttpsError('internal', 'AI response was not valid JSON');
    }

    const conditions = assessment.conditions || {};
    const totalScore = (conditions.ownership_present?.score || 0) + 
                       (conditions.statement_clarity?.score || 0) + 
                       (conditions.forward_strength?.score || 0);

    // Server-side validation of auto-fail conditions (hardened per v2 spec)
    const ownershipScore = conditions.ownership_present?.score || 0;
    const clarityScore = conditions.statement_clarity?.score || 0;
    const forwardScore = conditions.forward_strength?.score || 0;
    const scores = [ownershipScore, clarityScore, forwardScore];
    
    const hasZero = scores.some(s => s === 0);
    const onesCount = scores.filter(s => s === 1).length;
    const ownershipBelowTwo = ownershipScore < 2;
    const clarityBelowTwo = clarityScore <= 1; // Hardened rule: Clarity ≤ 1 = fail
    
    // Override validity check: Ownership present but Clarity ≤ 1 → Invalid
    let effectiveValidity = assessment.repValidity;
    let effectiveInvalidReason = assessment.invalidReason;
    if (ownershipScore >= 2 && clarityScore <= 1 && effectiveValidity !== 'invalid') {
      effectiveValidity = 'invalid';
      effectiveInvalidReason = 'Ownership present but lacks required specificity';
    }
    
    const autoFailTriggered = hasZero || onesCount >= 2 || ownershipBelowTwo || clarityBelowTwo;
    
    // Determine auto-fail reason
    let autoFailReason = null;
    if (autoFailTriggered) {
      if (ownershipBelowTwo) {
        autoFailReason = 'Ownership Present must be at least Adequate (score 2)';
      } else if (clarityBelowTwo) {
        autoFailReason = 'Statement Clarity must be at least Adequate (score 2) — specificity required';
      } else if (hasZero) {
        autoFailReason = 'One or more conditions scored None (0)';
      } else if (onesCount >= 2) {
        autoFailReason = 'Two or more conditions scored Weak (1)';
      }
    }

    const isValid = effectiveValidity !== 'invalid';
    const repPassed = isValid && !autoFailTriggered && totalScore >= 6;

    // Check for forward strength pattern (for tracking/analytics)
    const currentForwardScore = forwardScore;
    const forwardPatternTriggered = patternFeedbackNeeded && currentForwardScore === 0;

    logger.info("LWV rep assessment completed (v2)", { 
      repType, totalScore, repPassed, autoFailTriggered, isValid,
      clarityScore, ownershipScore, forwardScore,
      hybridDrift: assessment.hybridDrift,
      authorityCollapse: assessment.authorityCollapse,
      forwardPatternTriggered
    });

    return {
      evaluationType: 'lwv_scored_v2',
      repValidity: effectiveValidity,
      invalidReason: effectiveInvalidReason || null,
      conditions,
      hybridDrift: assessment.hybridDrift || false,
      hybridDriftReason: assessment.hybridDriftReason || null,
      authorityCollapse: assessment.authorityCollapse || false,
      autoFailTriggered,
      autoFailReason: autoFailTriggered ? autoFailReason : null,
      totalScore,
      maxScore: 9,
      repPassed,
      coachingQuestions: assessment.coachingQuestions || [],
      patternFeedback: forwardPatternTriggered ? 
        "You're consistently acknowledging ownership, but not reinforcing what changes moving forward. How will you ensure your vulnerability also strengthens direction, not just accountability?" : 
        (assessment.patternFeedback || null),
      reflectionPrompt: assessment.reflectionPrompt || null,
      summary: assessment.summary || (repPassed ? 'Rep Passed' : 'Rep Not Passed'),
      meetsStandard: repPassed,
      isConstructive: isValid,
      constructiveFeedback: !isValid ? (effectiveInvalidReason || 'This rep does not contain valid evidence') : null,
      assessedAt: new Date().toISOString(),
      assessedBy: 'ai',
      // Analytics fields
      forwardStrengthScore: currentForwardScore,
      forwardPatternTriggered
    };

  } catch (error) {
    logger.error("Error in assessLWVRep", error);
    if (error.code) throw error;
    throw new HttpsError('internal', 'Failed to assess LWV rep quality');
  }
}

// ================================================================
// RED (Deliver Redirecting Feedback) EVALUATION FUNCTION
// Implements the LeaderReps AI Evaluation Specification FINAL v4
// ================================================================
async function assessREDRep(data, person, repType, previousQuestions = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("GEMINI_API_KEY is not configured");
    throw new HttpsError('internal', 'AI service not configured');
  }

  // Extract RED-specific evidence
  const redResponses = data.red_responses || data.sce_responses || {};
  const selfAssessment = data.self_assessment || {};
  const responseType = data.response_type || '';
  const otherResponseText = data.other_response_text || '';
  const notes = data.notes || '';
  const situationBranch = data.situation_branch || '';
  const difficulty = data.difficulty || ''; // 'low' | 'moderate' | 'high'
  const internalGap = data.internal_gap || ''; // 'nothing' | 'mild' | 'strong' | 'avoided'
  const internalGapDetail = data.internal_gap_detail || '';
  const scenarioType = data.scenario_type || ''; // 'one_time' | 'repeated' | 'team' | 'high_stakes'

  // Build evidence summary from structured RED fields
  const evidenceLines = [];
  if (redResponses.behavior_statement) {
    evidenceLines.push(`- Behavior described: "${redResponses.behavior_statement}"`);
  }
  if (redResponses.impact_statement) {
    evidenceLines.push(`- Impact/Why it matters: "${redResponses.impact_statement}"`);
  }
  if (redResponses.request_statement) {
    evidenceLines.push(`- Request for change: "${redResponses.request_statement}"`);
  }
  if (redResponses.their_response_detail) {
    evidenceLines.push(`- Their response (free text): "${redResponses.their_response_detail}"`);
  }

  // Self-assessment context
  const selfAssessmentLines = Object.entries(selfAssessment)
    .filter(([, v]) => v && String(v).trim())
    .map(([key, val]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `- ${label}: ${val}`;
    })
    .join('\n');

  // Situation type descriptions
  const situationDescriptions = {
    'repeated_behavior': 'Repeated behavior or pattern',
    'first_occurrence': 'First-time occurrence',
    'real_time': 'Real-time / in-the-moment feedback',
    'after_the_fact': 'After-the-fact feedback'
  };

  // Scenario type descriptions (seeds intensity level)
  const scenarioDescriptions = {
    'one_time': 'One-time behavior miss (Intensity Level 1)',
    'repeated': 'Repeated pattern or ongoing issue (Intensity Level 2)',
    'team': 'Team or group behavior (Intensity Level 2)',
    'high_stakes': 'High-stakes or sensitive situation (Intensity Level 3)'
  };

  // Internal gap descriptions
  const internalGapDescriptions = {
    'nothing': 'Nothing felt difficult',
    'mild': 'Mild tension',
    'strong': 'Strong emotion',
    'avoided': 'Leader avoided saying something'
  };

  const situationLabel = situationDescriptions[situationBranch] || situationBranch || 'Not specified';
  const scenarioLabel = scenarioDescriptions[scenarioType] || scenarioType || 'Not specified';
  const internalGapLabel = internalGapDescriptions[internalGap] || internalGap || 'Not specified';

  const prompt = `You are evaluating a leadership practice exercise ("Real Rep") for Deliver Redirecting Feedback.

DEFINITION:
Deliver Redirecting Feedback occurs when a leader:
- names a specific behavior gap
- explains why it matters (impact or standard)
- requests a change in future behavior
- delivers the message directly and with composure

PURPOSE:
- correct behavior early
- maintain accountability
- preserve trust

CONTEXT:
- Scenario type: ${scenarioLabel}
- Situation type: ${situationLabel}
- Person involved: ${person || 'Not specified'}
- Their response (selected): ${responseType || 'Not specified'}
${otherResponseText ? `- Their response (detail): ${otherResponseText}` : ''}
- Self-reported difficulty: ${difficulty || 'Not specified'}
- Internal gap (what felt difficult): ${internalGapLabel}
${internalGapDetail ? `- Internal gap detail: "${internalGapDetail}"` : ''}

EVIDENCE PROVIDED:
${evidenceLines.join('\n') || '(No structured evidence provided)'}
${selfAssessmentLines ? `\nSelf-Assessment:\n${selfAssessmentLines}` : ''}
${notes ? `\nAdditional notes: ${notes}` : ''}

INPUT VALIDITY CHECK (CRITICAL - EVALUATE FIRST):
Before scoring ANY condition, check if the evidence contains GIBBERISH or NONSENSE:
- Random characters or keyboard mashing (e.g., "asdf", "qwerty", "jjjj")
- Meaningless text that does not form coherent sentences
- Placeholder text (e.g., "test", "xxx", "lorem ipsum")
- Single repeated characters or words
- Content unrelated to workplace leadership

If ANY evidence field contains gibberish or nonsense:
1. Set repValidity to "invalid"
2. Set invalidReason to describe the specific gibberish detected
3. ALL conditions MUST score 0 with label "None"
4. Do NOT attempt to interpret or find meaning in nonsense text

EVALUATION INSTRUCTIONS:
First determine if this rep is Valid or Invalid.

A rep is VALID if ALL:
- behavior gap exists
- feedback delivered (direct or indirect)
- request exists

A rep is INVALID if ANY:
- no feedback delivered
- no behavior identified
- no request
- only coaching/advice without clear feedback

CLARIFICATION: Indirect delivery = Valid but scored under Direct Delivery condition. Validity does NOT require correct delivery.

EVALUATOR HIERARCHY (MANDATORY - evaluate in this order):
1. Behavior / Impact / Request
2. Response
3. Difficulty / Internal Gap
4. Do NOT infer missing clarity

SCORING RULES:
Score each condition 0-3:
3 = Strong evidence
2 = Adequate evidence
1 = Weak evidence
0 = No usable evidence

CONDITION 1 — BEHAVIOR CLEARLY NAMED (Critical)
Would a camera capture this behavior? Use the Camera Test.
3: specific, observable (e.g., "You interrupted the client twice before they finished speaking.")
2: general but identifiable (e.g., "You cut the client off.")
1: interpretive (e.g., "You weren't very professional.") — AUTO-FAIL if 1
0: missing

RULES:
- Interpretive behavior → max score 1
- Mixed observable + interpretive → max score 2
- Must describe what happened, not conclusions

CONDITION 2 — IMPACT / STANDARD (Critical)
Did the leader explain why this matters?
3: clear consequence OR standard stated (e.g., "That made it harder for them to explain their concern.")
2: implied but understandable (e.g., "That really affected the conversation.")
1: vague (e.g., "That's not good.")
0: missing

CONDITION 3 — REQUEST (Critical)
Did the leader make a specific request for change?

CRITICAL RULE: Request = 3 (Strong) ONLY IF the expected behavior is explicitly stated AND confirmed.

Two paths to Request = 3:
1. Leader-Defined: Leader states the expected behavior directly
   Example: "Submit it by 3pm going forward."
2. Direct-Defined + Leader Confirmed: Direct states it, leader confirms
   Example: Direct: "I'll send it before 3." → Leader: "Good—send it by 3pm."

Scoring:
3: specific, observable future behavior + confirmation (see paths above)
2: conversational + anchored to change (e.g., "What will you do differently next time?") — applies to Challenge/Collaborate requests where direct stated action but leader did NOT confirm
1: vague (e.g., "Be more mindful.") — AUTO-FAIL if <= 1
0: missing

REQUEST CLASSIFICATION (required in output):
- Command: explicit directive (e.g., "Submit by 3pm going forward.")
- Challenge: question prompting ownership (e.g., "What will you do differently?")
- Collaborate: joint discussion framing (e.g., "Let's talk about how to prevent this.")

REQUEST CONFIRMATION TYPE (required in output):
- leader_stated: Leader explicitly stated the expected behavior
- direct_stated_leader_confirmed: Direct stated, leader echoed/confirmed
- direct_stated_not_confirmed: Direct stated action, but leader did NOT confirm (triggers Closure Check)
- none: No clear request made

CONDITION 4 — DIRECT DELIVERY
Was the feedback delivered directly to the right person?
3: direct, correct audience
2: direct but broad (e.g., told the team instead of individual)
1: indirect (e.g., told someone else to deliver it) — AUTO-FAIL if 0
0: not delivered — AUTO-FAIL

GROUP RULE: Score = 3 only if:
- behavior explicitly stated as shared
- feedback delivered to that group
- no avoidance of individual accountability

CONDITION 5 — DELIVERY DISCIPLINE
Did the leader deliver with composure?
3: neutral, composed throughout
2: softened or mild tension (e.g., "I was frustrated but kept it contained")
1: hedging or edge showing
0: harsh / emotional — AUTO-FAIL

EMOTIONAL LEAKAGE (Hard Cap):
If ANY present → max Delivery Discipline = 1:
- "always / never" language
- labeling (e.g., "you're irresponsible")
- moral judgment
- escalation language
- stacked issues (multiple unrelated complaints)

SPECIAL EVIDENCE RULES:

SECONDHAND FEEDBACK:
- Behavior max = 2 (must attribute source)
- Does NOT automatically impact other conditions

AUTOMATIC FAIL LOGIC:
Fail if ANY:
- Any critical condition = 0
- Behavior = 1
- Request ≤ 1
- Delivery Discipline = 0
- Direct Delivery = 0
- Two conditions = 1

PASS RULE:
A rep passes if:
- repValidity = Valid
- no automatic fail triggered
- total score ≥ 9 (out of 15)

FEEDBACK INTENSITY SCALING (Internal Classification):
Level 1: minor issue
Level 2: clear miss
Level 3: repeated / risk

Intensity ≥ 2 if ANY:
- Impact references team/client
- Behavior is repeated/pattern
- Self-reported Internal Gap = strong emotion
- Response Type = Defensive / Denied

UNDER-SCALING CHECK (Light Nudge Detection):
If Intensity ≥ 2 AND Behavior ≥ 2 AND Impact ≥ 2 AND Request = 2:
Output coaching: "This reads more like a light nudge than a full redirect. Given the impact of the situation, a more explicit standard may have been needed."

If Intensity = 1 AND Behavior ≥ 2 AND Impact ≥ 2 AND Request = 2:
Output coaching: "This reads more like a light nudge than a full redirect. The behavior is clear, but the expected change is not fully defined yet."

CONVERSATION CLOSURE CHECK:
Trigger if Request = 2 AND requestConfirmationType = direct_stated_not_confirmed:
Output coaching: "You asked what they would do differently, and they identified a clear action. However, the expectation was not explicitly confirmed. How could you reinforce the standard so it is clearly owned going forward?"

Also trigger if Request = 2 generally (coaching only, does NOT change score):
"Did this conversation end with a clear, observable next step?"
If weak: "The conversation opened well but may not have landed on a clear behavioral change. What specifically will be different next time?"

ANTI-GAMING CHECKS:

A. Internal Gap Cross-Check:
If Internal Gap = "strong" (strong emotion) AND ≥ 2 of (Behavior, Impact, Request) = 3:
Cap Delivery Discipline at 2
Flag: antiGamingInternalGapTriggered = true

B. Internal Gap Avoided Cross-Check:
If Internal Gap = "avoided" AND Delivery Discipline ≥ 2:
Flag but don't penalize: "You noted something was held back. What might have been clearer if it was said?"
Flag: antiGamingAvoidedTriggered = true

C. Difficulty Mismatch:
If Difficulty = "low" AND Intensity ≥ 2:
Flag but don't penalize: "The self-reported difficulty seems low for the intensity of this situation."
Flag: antiGamingDifficultyMismatch = true

D. Mixed Feedback Detection:
If reinforcing + redirecting feedback mixed in same evidence:
Behavior capped at 2
Flag: mixedFeedbackDetected = true

COACHING OUTPUT RULES:
- Max 2-3 insights total
- Priority Order (MANDATORY): 
  1. Fail reason (if triggered)
  2. Request weakness when Intensity ≥ 2 (forced priority)
  3. Lowest scoring condition
  4. Under-Scaling / Light Nudge
  5. Closure Check
  6. Anti-Gaming flags
  7. Pattern feedback (if provided)
- If fail triggered → prioritize fail + 1 improvement
- Do NOT stack redundant insights

COACHING QUESTIONS (1-2):
Generate 1-2 coaching questions addressing the lowest scoring condition.
Reference the leader's evidence when possible.
Question rotation rule:
Question 1 -> Reflection or Counterfactual frame
Question 2 -> Forward-Looking frame
${previousQuestions && previousQuestions.length > 0 ? `For context, here are the coaching questions from their PREVIOUS rep. DO NOT repeat these topics:\n${previousQuestions.map(q => `- ${q}`).join('\n')}` : ''}

Question examples:
- Reflection: "What signal told you they understood the change you were asking for?"
- Counterfactual: "What might have happened if you had stated the expected behavior more explicitly?"
- Forward-Looking: "What's one way you might make the request more observable next time?"

DESIGN INTENT:
This system builds:
- clarity under pressure
- directness without avoidance
- composure under tension

Prevents:
- vague feedback
- indirect leadership
- emotional reactivity

Respond ONLY with valid JSON in this exact format:
{
  "repValidity": "valid" or "invalid",
  "invalidReason": "Reason if invalid, null if valid",
  "conditions": {
    "behavior_named": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "impact_explained": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null"
    },
    "request_made": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition",
      "quote": "exact evidence excerpt if relevant, or null",
      "requestType": "Command" | "Challenge" | "Collaborate" | null,
      "requestConfirmationType": "leader_stated" | "direct_stated_leader_confirmed" | "direct_stated_not_confirmed" | "none"
    },
    "direct_delivery": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition"
    },
    "delivery_discipline": {
      "score": 0-3,
      "label": "Strong" | "Adequate" | "Weak" | "None",
      "feedback": "Brief observation about this condition"
    }
  },
  "intensityLevel": 1 | 2 | 3,
  "autoFailTriggered": boolean,
  "autoFailReason": "Reason if auto-fail, null otherwise",
  "failTriggeredBy": "behavior_one" | "request_lte_one" | "delivery_zero" | "direct_delivery_zero" | "two_conditions_one" | "any_zero" | null,
  "mixedFeedbackDetected": boolean,
  "antiGamingFlags": {
    "internalGapTriggered": boolean,
    "avoidedTriggered": boolean,
    "difficultyMismatch": boolean
  },
  "underScalingDetected": boolean,
  "closureCheckTriggered": boolean,
  "totalScore": number,
  "repPassed": boolean,
  "coachingQuestions": ["question1", "question2"],
  "coachingInsights": ["insight1", "insight2"],
  "reflectionPrompt": "Optional short reflection prompt or null",
  "summary": "2-sentence evaluation summary"
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let assessment;
    try {
      assessment = JSON.parse(text);
    } catch (parseErr) {
      logger.error("Failed to parse RED AI response as JSON", { text, error: parseErr });
      throw new HttpsError('internal', 'AI response was not valid JSON');
    }

    const conditions = assessment.conditions || {};
    const totalScore = (conditions.behavior_named?.score || 0) + 
                       (conditions.impact_explained?.score || 0) + 
                       (conditions.request_made?.score || 0) +
                       (conditions.direct_delivery?.score || 0) +
                       (conditions.delivery_discipline?.score || 0);

    // Validate auto-fail conditions server-side per spec
    const scores = [
      conditions.behavior_named?.score || 0,
      conditions.impact_explained?.score || 0,
      conditions.request_made?.score || 0,
      conditions.direct_delivery?.score || 0,
      conditions.delivery_discipline?.score || 0
    ];
    
    const hasZero = scores.some(s => s === 0);
    const onesCount = scores.filter(s => s === 1).length;
    const behaviorIsOne = (conditions.behavior_named?.score || 0) === 1;
    const requestLteOne = (conditions.request_made?.score || 0) <= 1;
    const deliveryDisciplineZero = (conditions.delivery_discipline?.score || 0) === 0;
    const directDeliveryZero = (conditions.direct_delivery?.score || 0) === 0;
    
    // Auto-fail logic per spec
    const autoFailTriggered = hasZero || onesCount >= 2 || behaviorIsOne || requestLteOne || deliveryDisciplineZero || directDeliveryZero;

    // Determine fail reason for tracking
    let failTriggeredBy = null;
    if (autoFailTriggered) {
      if (hasZero) failTriggeredBy = 'any_zero';
      else if (behaviorIsOne) failTriggeredBy = 'behavior_one';
      else if (requestLteOne) failTriggeredBy = 'request_lte_one';
      else if (deliveryDisciplineZero) failTriggeredBy = 'delivery_zero';
      else if (directDeliveryZero) failTriggeredBy = 'direct_delivery_zero';
      else if (onesCount >= 2) failTriggeredBy = 'two_conditions_one';
    }

    const isValid = assessment.repValidity !== 'invalid';
    const repPassed = isValid && !autoFailTriggered && totalScore >= 9;

    logger.info("RED rep assessment completed", { 
      repType, totalScore, repPassed, autoFailTriggered, isValid, failTriggeredBy
    });

    return {
      evaluationType: 'red_scored',
      repValidity: assessment.repValidity || 'valid',
      invalidReason: assessment.invalidReason || null,
      conditions,
      intensityLevel: assessment.intensityLevel || 1,
      autoFailTriggered,
      autoFailReason: autoFailTriggered ? (assessment.autoFailReason || 'Automatic fail condition met') : null,
      failTriggeredBy,
      // New fields from spec
      mixedFeedbackDetected: assessment.mixedFeedbackDetected || false,
      antiGamingFlags: assessment.antiGamingFlags || {
        internalGapTriggered: false,
        avoidedTriggered: false,
        difficultyMismatch: false
      },
      underScalingDetected: assessment.underScalingDetected || false,
      closureCheckTriggered: assessment.closureCheckTriggered || false,
      requestConfirmationType: conditions.request_made?.requestConfirmationType || null,
      // Standard fields
      totalScore,
      maxScore: 15,
      repPassed,
      coachingQuestions: assessment.coachingQuestions || [],
      coachingInsights: assessment.coachingInsights || [],
      reflectionPrompt: assessment.reflectionPrompt || null,
      summary: assessment.summary || (repPassed ? 'Rep Passed' : 'Rep Not Passed'),
      meetsStandard: repPassed,
      isConstructive: isValid,
      constructiveFeedback: !isValid ? (assessment.invalidReason || 'This rep does not contain valid evidence') : null,
      assessedAt: new Date().toISOString(),
      assessedBy: 'ai'
    };

  } catch (error) {
    logger.error("Error in assessREDRep", error);
    if (error.code) throw error;
    throw new HttpsError('internal', 'Failed to assess RED rep quality');
  }
}

/**
 * ASSESS CTL (Close the Loop) REP
 * Evaluates whether a Close the Loop action meets quality standards.
 * CTL has 3 binary pass/fail criteria - all 3 must pass for CTL to pass.
 * 
 * Criteria:
 * 1. Real Check - Was this a deliberate, intentional follow-up?
 * 2. Usable Evidence - Is the observation specific and observable?
 * 3. Appropriate Response - Did the leader respond appropriately?
 * 
 * Anti-Gaming Checks:
 * - Evidence Enforcement: Vague evidence → Fail
 * - Drive-By Detection: Minimal observation + no response → Fail/Flag
 * - Avoidance Pattern: Repeated CTL without follow-up RED → Coaching escalation
 * - Over-Polished Pattern: Strong REDs + weak CTLs → Coaching
 */
async function assessCTLRep(data, linkedRepId) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    logger.error("GEMINI_API_KEY is not configured for CTL assessment");
    throw new HttpsError('internal', 'AI service not configured');
  }

  const {
    decision,        // 'changed' | 'not_changed' | 'not_observed'
    observation,     // { what_observed, observation_context, is_secondhand, secondhand_source }
    gaveReinforcingFeedback,   // boolean (for 'changed')
    gaveFollowupFeedback,      // boolean (for 'not_changed')
    nextAction,      // string (for 'not_changed' without feedback)
    nextActionDate,  // string/date (for 'not_changed' without feedback)
    nextCheckDate,   // string (for rescheduling)
    notObservedReason, // string (for 'not_observed')
    notObservedDetail, // string (optional detail for 'not_observed')
    // Anti-gaming context
    cycleNumber,     // Which cycle this is (1, 2, 3...)
    previousCtlDecisions, // Array of previous CTL decisions in this thread
    originalRedScore  // Score of the original RED that started this thread
  } = data;

  // Not observed is a valid deferral, not scored
  if (decision === 'not_observed') {
    return {
      evaluationType: 'ctl_deferred',
      decision,
      notObservedReason,
      notObservedDetail: notObservedDetail || null,
      nextCheckDate,
      criteria: null,
      allPassed: null,
      summary: 'Close the Loop deferred - no opportunity to observe yet.',
      assessedAt: new Date().toISOString(),
      // Flag excessive deferrals
      deferralWarning: cycleNumber > 1 ? 'This thread has been deferred before. Consider whether follow-up is being avoided.' : null
    };
  }

  const observationText = observation?.what_observed || '';
  const contextText = observation?.observation_context || '';
  const isSecondhand = observation?.is_secondhand || false;
  const secondhandSource = observation?.secondhand_source || '';

  // Build anti-gaming context for prompt
  const antiGamingContext = [];
  if (cycleNumber && cycleNumber > 1) {
    antiGamingContext.push(`This is cycle ${cycleNumber} of this feedback thread.`);
  }
  if (previousCtlDecisions && previousCtlDecisions.length > 0) {
    const notChangedCount = previousCtlDecisions.filter(d => d === 'not_changed').length;
    if (notChangedCount >= 1) {
      antiGamingContext.push(`Previous CTL checks: ${notChangedCount} showed behavior not changed.`);
    }
  }

  const prompt = `You are evaluating a "Close the Loop" (CTL) action for a leadership development program.

After giving redirecting feedback, the leader is checking whether the behavior changed.

DECISION: ${decision === 'changed' ? 'The leader reports the behavior CHANGED' : 'The leader reports the behavior DID NOT CHANGE'}

OBSERVATION:
What they observed: "${observationText}"
Context (when/where): "${contextText}"
${isSecondhand ? `This is SECONDHAND information. Source: "${secondhandSource || 'Not named'}"` : ''}

${decision === 'changed' ? `
RESPONSE: ${gaveReinforcingFeedback ? 'Leader gave reinforcing feedback to acknowledge the change' : 'Leader did not give explicit reinforcing feedback'}
` : `
RESPONSE: ${gaveFollowupFeedback ? 'Leader gave additional redirecting feedback' : `Leader did not give feedback. Next action: "${nextAction || 'Not specified'}" on date: ${nextActionDate || 'Not specified'}`}
`}

${antiGamingContext.length > 0 ? `
PATTERN CONTEXT (for anti-gaming detection):
${antiGamingContext.join('\n')}
` : ''}

Evaluate this CTL action against THREE criteria. Each is pass/fail.

CRITERION 1: REAL CHECK
Did the leader perform a DELIBERATE, intentional follow-up?
- PASS: They specifically looked for behavior change (scheduled check, intentional observation)
- FAIL: Incidental observation, no real effort to check, or superficial check

DRIVE-BY DETECTION: If observation is minimal (few words, no specifics) AND no response was given, this is likely a "drive-by check" → FAIL

CRITERION 2: USABLE EVIDENCE (Camera Test)
Is the observation SPECIFIC and OBSERVABLE? Would a camera capture this?
- PASS: Describes concrete actions seen/heard, specific enough to verify behavior change
- FAIL: 
  - Vague impressions ("seems better", "appears improved")
  - Assumptions about mindset
  - Hearsay without named source
  - Interpretive statements instead of observable facts

SECONDHAND RULES:
- If secondhand: Source MUST be named for pass
- Secondhand can still pass if observation is specific and source is credible

CRITERION 3: APPROPRIATE RESPONSE
Did the leader respond appropriately to what they observed?

For "behavior changed":
- PASS: Either reinforced the change OR appropriately did nothing (change was acknowledged)
- FAIL: Missing any acknowledgment when one was warranted

For "behavior not changed":
- PASS: Either gave follow-up feedback OR has a SPECIFIC next action plan with DATE
- FAIL: 
  - No response and no plan
  - Vague plan without specific date
  - Gave up / avoidance signals

ANTI-GAMING FLAGS TO DETECT:
1. driveByCheck: Minimal effort observation (few words) + no meaningful response
2. vagueEvidence: "Seems better", "appears", "I think" without specifics
3. avoidanceSignal: Not changed + no feedback + weak/no plan (repeated pattern)
4. overPolished: Perfect observation format but no actual follow-through

Respond with JSON only:
{
  "criteria": {
    "real_check": {
      "passed": boolean,
      "feedback": "One sentence explaining the assessment"
    },
    "usable_evidence": {
      "passed": boolean,
      "feedback": "One sentence explaining the assessment",
      "isSecondhand": boolean,
      "evidenceQuality": "strong" | "adequate" | "weak" | "vague"
    },
    "appropriate_response": {
      "passed": boolean,
      "feedback": "One sentence explaining the assessment"
    }
  },
  "antiGamingFlags": {
    "driveByCheck": boolean,
    "vagueEvidence": boolean,
    "avoidanceSignal": boolean,
    "overPolished": boolean
  },
  "summary": "One sentence overall summary",
  "coachingTip": "One actionable coaching tip if any criterion failed, or encouragement if all passed"
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let assessment;
    try {
      assessment = JSON.parse(text);
    } catch (parseErr) {
      logger.error("Failed to parse CTL AI response as JSON", { text, error: parseErr });
      throw new HttpsError('internal', 'AI response was not valid JSON');
    }

    const criteria = assessment.criteria || {};
    const realCheckPassed = criteria.real_check?.passed === true;
    const evidencePassed = criteria.usable_evidence?.passed === true;
    const responsePassed = criteria.appropriate_response?.passed === true;
    
    const allPassed = realCheckPassed && evidencePassed && responsePassed;
    const passedCount = [realCheckPassed, evidencePassed, responsePassed].filter(Boolean).length;

    // Extract anti-gaming flags
    const antiGamingFlags = assessment.antiGamingFlags || {
      driveByCheck: false,
      vagueEvidence: false,
      avoidanceSignal: false,
      overPolished: false
    };

    // Determine if any anti-gaming flag was triggered
    const anyAntiGamingTriggered = Object.values(antiGamingFlags).some(v => v === true);

    logger.info("CTL assessment completed", { 
      decision, allPassed, passedCount, linkedRepId, anyAntiGamingTriggered
    });

    return {
      evaluationType: 'ctl_scored',
      decision,
      criteria,
      passedCount,
      totalCriteria: 3,
      allPassed,
      meetsStandard: allPassed,
      // Anti-gaming outputs
      antiGamingFlags,
      anyAntiGamingTriggered,
      evidenceQuality: criteria.usable_evidence?.evidenceQuality || null,
      // Summaries
      summary: assessment.summary || (allPassed ? 'Loop closed successfully' : 'Close the Loop needs improvement'),
      coachingTip: assessment.coachingTip || null,
      assessedAt: new Date().toISOString(),
      assessedBy: 'ai'
    };

  } catch (error) {
    logger.error("Error in assessCTLRep", error);
    if (error.code) throw error;
    throw new HttpsError('internal', 'Failed to assess CTL quality');
  }
}

/**
 * ASSESS REP QUALITY (Gen 2 - HTTPS Callable)
 * Uses AI to evaluate the semantic quality of leadership rep evidence.
 * Analyzes whether the rep demonstrates genuine constructive leadership behavior.
 * 
 * Input: {
 *   repType: string (e.g., "public_praise", "direct_feedback", etc.),
 *   person: string (who the rep was with),
 *   responses: {
 *     what_said: string,      // What the user said/did
 *     commitment: string,     // Commitment obtained 
 *     next_time: string       // Reflection on next time
 *   }
 * }
 * 
 * Returns: {
 *   dimensions: {
 *     specific_language: { passed: boolean, feedback: string, quote: string },
 *     clear_request: { passed: boolean, feedback: string },
 *     named_commitment: { passed: boolean, feedback: string },
 *     reflection: { passed: boolean, feedback: string }
 *   },
 *   passedCount: number,
 *   totalDimensions: number,
 *   meetsStandard: boolean,
 *   isConstructive: boolean,
 *   summary: string,
 *   coachingTip: string
 * }
 */
exports.assessRepQuality = onCall(
  { 
    cors: [/arena\.leaderreps\.com$/, /leaderreps-prod\.web\.app$/, /leaderreps-prod\.firebaseapp\.com$/, /leaderreps-test\.web\.app$/, /leaderreps-test\.firebaseapp\.com$/, /leaderreps-pd-platform\.web\.app$/, /leaderreps-pd-platform\.firebaseapp\.com$/, /localhost/],
    invoker: "public",
    region: "us-central1" 
  },
  async (request) => {
    const { repType, person, responses, structured } = request.data;
    
    if ((!responses && !structured) || !repType) {
      throw new HttpsError('invalid-argument', 'repType and (responses or structured) are required');
    }
    
    // Support both old "responses" format and new V2 "structured" format
    // V2 structured format has: what_said, their_response, response_type, outcome, what_went_well, what_different, reflection
    const data = structured || responses || {};
    
    // Fetch previous rep coaching questions to avoid duplication (in-memory sort to avoid index requirements)
    // Also fetch forward_strength scores for LWV pattern detection
    let previousQuestions = [];
    let previousForwardScores = [];
    const uid = request.auth?.uid;
    if (uid) {
      try {
        const pastRepsSnap = await db.collection('users').doc(uid).collection('conditioning_reps')
          .where('repType', '==', repType)
          .get();
        if (!pastRepsSnap.empty) {
          const reps = [];
          pastRepsSnap.forEach(doc => {
            const d = doc.data();
            if (d.status === 'debriefed' || d.status === 'loop_closed') {
              const qa = d.qualityAssessment || {};
              reps.push({
                t: d.debriefedAt?.toMillis ? d.debriefedAt.toMillis() : (d.createdAt?.toMillis ? d.createdAt.toMillis() : 0),
                q: qa.coachingQuestions || [],
                fs: qa.forwardStrengthScore ?? qa.conditions?.forward_strength?.score ?? null
              });
            }
          });
          reps.sort((a, b) => b.t - a.t);
          if (reps.length > 0 && reps[0].q.length > 0) {
            previousQuestions = reps[0].q;
          }
          // Collect forward_strength scores from up to 3 most recent LWV reps
          if (repType === 'lead_with_vulnerability') {
            previousForwardScores = reps
              .filter(r => r.fs !== null && r.fs !== undefined)
              .slice(0, 3)
              .map(r => r.fs);
          }
        }
      } catch (err) {
        logger.warn("Could not fetch previous rep questions", { error: err.message });
      }
    }

    // Route rep-specific evaluations to dedicated assessment functions
    if (repType === 'set_clear_expectations') {
      return await assessSCERep(data, person, repType, previousQuestions);
    }
    if (repType === 'deliver_reinforcing_feedback') {
      return await assessDRFRep(data, person, repType, previousQuestions);
    }
    if (repType === 'follow_up_work') {
      return await assessFUWRep(data, person, repType, previousQuestions);
    }
    if (repType === 'lead_with_vulnerability') {
      return await assessLWVRep(data, person, repType, previousQuestions, previousForwardScores);
    }
    if (repType === 'deliver_redirecting_feedback') {
      return await assessREDRep(data, person, repType, previousQuestions);
    }
    if (repType === 'close_the_loop') {
      // CTL requires linkedRepId instead of person
      const linkedRepId = request.data.linkedRepId;
      return await assessCTLRep(data, linkedRepId);
    }
    
    // V2 fields
    const whatSaid = data.what_said || data.what_happened || '';
    const theirResponse = Array.isArray(data.their_response) ? data.their_response.join(', ') : (data.their_response || '');
    const responseType = data.response_type || data.outcome || '';
    const whatWentWell = data.what_went_well || '';
    const whatDifferent = data.what_different || '';
    // Combined reflection (V2 has two parts, V1 had one)
    const reflection = data.reflection || [whatWentWell, whatDifferent].filter(Boolean).join(' | ') || '';
    
    logger.info("assessRepQuality input", { repType, person, whatSaid: whatSaid.substring(0, 100), theirResponse: theirResponse.substring(0, 50), reflection: reflection.substring(0, 100) });
    
    // Get the API key from environment variable (functions/.env)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not configured. Set it in functions/.env");
      throw new HttpsError('internal', 'AI service not configured');
    }
    
    // Rep type descriptions for context (V2 rep types)
    const repTypeDescriptions = {
      // Build the Team
      'set_clear_expectations': 'Setting clear expectations - defining what success looks like for someone',
      'address_behavior': 'Addressing behavior - giving direct feedback on specific actions that need to change',
      'recognize_contributions': 'Recognizing contributions - acknowledging and appreciating someone\'s work or effort',
      'coach_for_development': 'Coaching for development - helping someone grow through questions and guidance',
      // Lead the Work  
      'prioritize_and_focus': 'Prioritizing and focusing - making decisions about what matters most',
      'clarify_decision': 'Clarifying a decision - communicating the what/why of a decision to get alignment',
      'set_boundaries': 'Setting boundaries - saying no or establishing limits on time/scope/resources',
      'delegate_with_accountability': 'Delegating with accountability - assigning ownership with clear expectations',
      // Lead Yourself
      'make_a_tough_ask': 'Making a tough ask - requesting something that feels uncomfortable or risky',
      'speak_up_in_the_moment': 'Speaking up in the moment - saying something important when it would be easier to stay silent',
      // Legacy V1 types (for backward compatibility)
      'reinforce_public': 'Reinforcing behavior in public - recognizing someone\'s positive contribution in front of others',
      'public_praise': 'Reinforcing behavior in public - recognizing someone\'s positive contribution in front of others',
      'direct_feedback': 'Providing honest, direct feedback to help someone improve',
      'difficult_conversation': 'Having a challenging but necessary conversation with someone',
      'delegation': 'Delegating responsibility with clear expectations and accountability',
      'boundary_setting': 'Setting or maintaining a professional boundary',
      'vision_casting': 'Articulating vision, direction, or inspiring others',
      'coaching': 'Coaching or mentoring someone to develop their skills',
      'recognition': 'Recognizing or appreciating someone\'s contribution',
      'tough_request': 'Making a tough or uncomfortable ask of someone',
      'redirect_private': 'Redirecting behavior privately - giving constructive feedback one-on-one'
    };
    
    const repDescription = repTypeDescriptions[repType] || repType;
    
    const prompt = `You are evaluating a leadership practice exercise ("Real Rep") for quality and constructiveness.

CONTEXT:
- Rep Type: ${repDescription}
- Person involved: ${person || 'Not specified'}

USER'S EVIDENCE:
1. What they said/did: "${whatSaid}"
2. How they responded: "${theirResponse}" (${responseType})
3. What went well: "${whatWentWell}"
4. What they'd do differently: "${whatDifferent}"

CRITICAL QUALITY REQUIREMENTS - READ FIRST:
You must evaluate whether the content represents a REAL, PROFESSIONAL LEADERSHIP interaction.
FAIL any dimension if the content is:
- Gibberish, random characters, or keyboard mashing (e.g., "asdf", "qwerty", "jjjj", random letters)
- Placeholder text (e.g., "test", "xxx", "lorem ipsum", single words repeated)
- Too vague to represent actual communication (e.g., just "thanks" with no context)
- NOT RELATED TO PROFESSIONAL LEADERSHIP (e.g., personal relationships, marriage proposals, non-work topics)
- Clearly fake, joke content, or nonsensical (doesn't describe a real workplace interaction)

A PASS requires evidence of a GENUINE PROFESSIONAL LEADERSHIP interaction - something that would happen in a workplace, team, or professional context.

EVALUATION CRITERIA:
Evaluate this leadership rep on 3 dimensions. For each dimension, determine if it PASSES or FAILS:

1. SPECIFIC_LANGUAGE: Did they describe specifically what they SAID or DID in this leadership moment?
   - PASS: Contains actual words/phrases or specific actions showing real WORKPLACE communication
   - FAIL: Gibberish, random characters, vague ("talked to them"), non-professional content, or empty

2. OBSERVED_RESPONSE: Did they describe how the other person responded to their leadership action?
   - PASS: Describes the other person's reaction, response, or behavior (even if brief)
   - For recognition/praise reps: Noting genuine acknowledgment or appreciation counts as a PASS
   - FAIL: Missing, gibberish, or no observable response described

3. REFLECTION: Did they reflect MEANINGFULLY on what went well AND what they'd do differently?
   - PASS: Shows genuine insight - ideally addresses both what worked and what could improve
   - FAIL: Empty, gibberish, or generic platitudes without substance ("it was fine")

SPECIAL RULES FOR REP TYPES:
- For recognition reps (recognize_contributions, reinforce_public, public_praise): The "response" can simply be how the person received the recognition.
- Be generous in interpretation - if they provided real PROFESSIONAL details, give credit even if format isn't perfect.

CRITICAL QUALITY CHECK - IS_CONSTRUCTIVE:
Determine if this rep demonstrates CONSTRUCTIVE, PROFESSIONAL leadership behavior.
Mark as isConstructive: false if ANY of the following are present:
- Gibberish, random characters, or meaningless text (e.g., "asdf", "qwer", random letters)
- Content unrelated to professional leadership (e.g., personal relationships, romantic proposals, non-work topics)
- Hostility, threats, or intimidation (including threats of firing or physical harm)
- Unprofessional, morbid, or violent language (e.g., references to death, killing, violence)
- Insults, personal attacks, or manipulation
- Joke or trolling content that clearly isn't a real leadership exercise
- Placeholder or test content (e.g., "test", "xxx", repeated characters)

If isConstructive is false, "constructiveFeedback" MUST be specific:
- Quote the specific part of the evidence that triggered the flag.
- Explain clearly why it is inappropriate for a professional leader.
- Do NOT use generic phrases like "lacks essential elements". Be direct about the issue.

COACHING GUIDANCE (CRITICAL - SOCRATIC & OPEN-ENDED):
You are a SOCRATIC COACH. Your goal is to stimulate deep reflection, NOT to correct or validate.

When providing feedback or asking follow-up questions:
1. NEVER be prescriptive. Do not say "Try this next time" or "You should have said...".
2. ALWAYS ask open-ended questions that force the leader to think for themselves.
3. If they missed something, ask "What prevented you from...?" or "What would have happened if...?"
4. If they did well, ask "What made that effective?" or "How did that land for them?"
5. Focus on the "Camera Test": Ask them to describe observable behaviors rather than interpretations.

Examples of SOCRATIC questions:
- "If you were watching a video of this interaction, what exactly would you see and hear?"
- "What evidence do you have that they understood your message?"
- "How did their body language shift when you said that?"
- "What outcome were you hoping for, and where specifically did it diverge?"
- "What is one thing you would change if you could replay this moment?"

Avoid these patterns:
- "Good job listing specific actions." (Too validation-heavy)
- "Next time, try using the XYZ framework." (Too prescriptive)
- "You missed describing their reaction." (Too corrective - instead ask: "How did they respond?")

Respond ONLY with valid JSON in this exact format:
{
  "dimensions": {
    "specific_language": {
      "passed": boolean,
      "feedback": "Socratic question or observation about their specific language",
      "quote": "the specific language they used if any, or null",
      "coachingQuestion": "Reflective question to deepen their awareness of what they said"
    },
    "observed_response": {
      "passed": boolean,
      "feedback": "Socratic question or observation about the other person's response",
      "coachingQuestion": "Reflective question to help them recall the other person's reaction"
    },
    "reflection": {
      "passed": boolean,
      "feedback": "Socratic question or observation about their reflection",
      "coachingQuestion": "Reflective question to deepen their learning"
    }
  },
  "isConstructive": boolean,
  "constructiveFeedback": "If not constructive, ask a question to help them understand why",
  "summary": "2-sentence Socratic summary helping them see their rep objectively",
  "coachingTip": "One powerful open-ended question to carry into their next rep"
}`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      let assessment;
      try {
        assessment = JSON.parse(text);
      } catch (parseErr) {
        logger.error("Failed to parse AI response as JSON", { text, error: parseErr });
        throw new HttpsError('internal', 'AI response was not valid JSON');
      }
      
      // Calculate passed count (V2: 3 dimensions)
      const dimensions = assessment.dimensions || {};
      let passedCount = 0;
      const totalDimensions = 3;
      
      if (dimensions.specific_language?.passed) passedCount++;
      if (dimensions.observed_response?.passed) passedCount++;
      if (dimensions.reflection?.passed) passedCount++;
      
      // Overall assessment - must be constructive AND pass 2/3 dimensions
      const isConstructive = assessment.isConstructive !== false;
      const meetsStandard = isConstructive && passedCount >= 2;
      
      logger.info("Rep quality assessment completed", { 
        repType, 
        passedCount, 
        isConstructive, 
        meetsStandard 
      });
      
      return {
        dimensions,
        passedCount,
        totalDimensions,
        meetsStandard,
        isConstructive,
        constructiveFeedback: assessment.constructiveFeedback || null,
        summary: assessment.summary || (meetsStandard 
          ? 'This rep meets the quality standard'
          : `This rep needs improvement in ${totalDimensions - passedCount} area(s)`),
        coachingTip: assessment.coachingTip || null,
        assessedAt: new Date().toISOString(),
        assessedBy: 'ai'
      };
      
    } catch (error) {
      logger.error("Error in assessRepQuality", error);
      if (error.code) throw error;
      throw new HttpsError('internal', 'Failed to assess rep quality');
    }
  }
);

/**
 * MANUAL ROLLOVER (HTTP Trigger)
 * Allows manually triggering the rollover for a specific user.
 * Useful for debugging or fixing missed rollovers.
 * 
 * Usage: POST /manualRollover?email=rob@sagecg.com
 */
exports.manualRollover = onRequest(
  {
    cors: true,
    // invoker: "public", // Removed to fix IAM permission error during deploy
  },
  async (req, res) => {
    const email = req.query.email || req.body.email;
    
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    logger.info(`🔧 Starting manual rollover for ${email}`);

    try {
      // Find user by email
      const usersSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      
      if (usersSnapshot.empty) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;
      
      // Calculate dates
      const chicagoFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const now = new Date();
      const todayStr = chicagoFormatter.format(now); // Target date for manual run is TODAY
      
      // Get current data from MODULES collection (Correct Path)
      const currentRef = db.collection("modules").doc(userId).collection("daily_practice").doc("current");
      const currentDoc = await currentRef.get();

      if (!currentDoc.exists) {
        res.status(404).json({ error: "No daily_practice data found for user" });
        return;
      }

      const currentData = currentDoc.data();
      const dataDate = currentData.date;

      if (dataDate === todayStr) {
        res.json({ message: "User is already on today's date", date: dataDate });
        return;
      }

      // === ARCHIVE OLD DATA ===
      // Archive to USERS collection (Legacy/History Path)
      const archiveRef = db.collection("users").doc(userId).collection("daily_logs").doc(dataDate);
      await archiveRef.set({
        ...currentData,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        rolloverSource: "manual-function",
      }, { merge: true });

      // === CALCULATE CARRY-OVERS ===
      const currentWins = currentData.morningBookend?.wins || [];
      const carriedWins = currentWins
        .filter((w) => !w.completed && w.text && w.text.trim().length > 0)
        .map((w) => ({ ...w, completed: false, saved: true }));

      const completedWins = currentWins.filter((w) => w.completed && w.text);
      const newWinsHistoryEntry = completedWins.map((w, i) => ({
        id: w.id || `win-${dataDate}-${i}`,
        date: dataDate,
        text: w.text,
        completed: true,
      }));
      const existingWinsList = currentData.winsList || [];

      const currentReps = currentData.active_commitments || [];
      const carriedReps = currentReps.filter((r) => r.status !== "Committed");

      const completedReps = currentReps.filter((r) => r.status === "Committed");
      const newRepsHistoryEntry = {
        date: dataDate,
        completedCount: completedReps.length,
        items: completedReps.map((r) => ({ id: r.id, text: r.text })),
      };
      const existingRepsHistory = currentData.repsHistory || [];

      const reflection = currentData.eveningBookend || {};
      const hasReflection = reflection.good || reflection.better || reflection.best;
      const newReflectionEntry = hasReflection
        ? {
            id: `ref-${dataDate}`,
            date: dataDate,
            reflectionGood: reflection.good,
            reflectionWork: reflection.better,
            reflectionTomorrow: reflection.best,
          }
        : null;
      const existingReflectionHistory = currentData.reflectionHistory || [];

      const scorecard = currentData.scorecard || {
        reps: { done: 0, total: 0 },
        win: { done: 0, total: 0 },
        grounding: { done: 0, total: 1 },
      };
      const newScorecardEntry = {
        date: dataDate,
        score: `${(scorecard.reps?.done || 0) + (scorecard.win?.done || 0) + (scorecard.grounding?.done || 0)}/${(scorecard.reps?.total || 0) + (scorecard.win?.total || 0) + (scorecard.grounding?.total || 1)}`,
        details: scorecard,
      };
      const existingScorecardHistory = currentData.scorecardHistory || currentData.commitmentHistory || [];

      // Streak
      const currentStreakCount = currentData.streakCount || 0;
      const groundingDone = currentData.groundingRepCompleted ? 1 : 0;
      const winsDone = scorecard.win?.done || 0;
      const repsDone = scorecard.reps?.done || completedReps.length;
      const didActivity = groundingDone > 0 || winsDone > 0 || repsDone > 0;
      
      const todayDateObj = new Date(dataDate + 'T12:00:00');
      const dayOfWeek = todayDateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      let newStreakCount = currentStreakCount;
      if (didActivity) {
        newStreakCount = currentStreakCount + 1;
      } else if (!isWeekend) {
        newStreakCount = 0;
      }

      // === PREPARE NEW STATE ===
      const newState = {
        ...currentData,
        date: todayStr, // Set to TODAY
        lastUpdated: new Date().toISOString(),
        streakCount: newStreakCount,
        lastStreakDate: dataDate,
        streakHistory: [
          { date: dataDate, streak: newStreakCount, didActivity, isWeekend },
          ...(currentData.streakHistory || []).slice(0, 29)
        ],
        winsList: [...newWinsHistoryEntry, ...existingWinsList].filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i
        ),
        repsHistory: [newRepsHistoryEntry, ...existingRepsHistory].filter(
          (v, i, a) => a.findIndex((t) => t.date === v.date) === i
        ),
        reflectionHistory: newReflectionEntry
          ? [newReflectionEntry, ...existingReflectionHistory].filter(
              (v, i, a) => a.findIndex((t) => t.date === v.date) === i
            )
          : existingReflectionHistory,
        scorecardHistory: [newScorecardEntry, ...existingScorecardHistory].filter(
          (v, i, a) => a.findIndex((t) => t.date === v.date) === i
        ),
        morningBookend: {
          ...currentData.morningBookend,
          wins: [...carriedWins, ...Array(3).fill(null)].slice(0, 3).map((w, i) => w || { id: `win-${Date.now()}-${i}`, text: "", completed: false, saved: false }),
          winCompleted: false,
          completedAt: null,
          otherTasks: [],
        },
        active_commitments: carriedReps,
        dailyTargetRepStatus: "Pending",
        eveningBookend: {
          good: "",
          better: "",
          best: "",
          habits: {},
          completedAt: null,
          otherTasks: [],
        },
        scorecard: {
          reps: { done: 0, total: 0, pct: 0 },
          win: { done: 0, total: 0, pct: 0 },
          grounding: { done: 0, total: 1, pct: 0 },
        },
        groundingRepCompleted: false,
      };

      await currentRef.set(newState);

      logger.info(`✅ Manual rollover complete for ${email}`);
      res.json({ success: true, message: `Rolled over from ${dataDate} to ${todayStr}` });

    } catch (error) {
      logger.error("Manual rollover failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * SCHEDULED DAILY ROLLOVER
 * Runs every night at 11:59 PM (America/Chicago timezone)
 */
exports.scheduledDailyRollover = onSchedule(
  {
    schedule: "59 23 * * *", // 11:59 PM every day
    timeZone: "America/Chicago",
    retryCount: 3,
  },
  async () => {
    logger.info("🌙 Starting scheduled daily rollover at 11:59 PM");

    const chicagoFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const now = new Date();
    const todayStr = chicagoFormatter.format(now);
    
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const tomorrow = chicagoFormatter.format(tomorrowDate);
    
    logger.info(`📅 Date calculation: today=${todayStr}, tomorrow=${tomorrow} (Chicago time)`);

    try {
      const usersSnapshot = await db.collection("users").get();
      let processedCount = 0;
      let errorCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        logger.info(`👤 User found: ${userData.email} (${userId})`);

        try {
          // FIX: Use 'modules' collection for daily_practice
          const currentRef = db.collection("modules").doc(userId).collection("daily_practice").doc("current");
          const currentDoc = await currentRef.get();

          if (!currentDoc.exists) {
            logger.info(`User ${userId}: No daily_practice data, skipping`);
            continue;
          }

          const currentData = currentDoc.data();
          const dataDate = currentData.date;

          if (!dataDate || dataDate === tomorrow) {
            logger.info(`User ${userId}: Already up to date (${dataDate}), skipping`);
            continue;
          }

          // Archive to 'users' collection (Legacy/History Path)
          const archiveRef = db.collection("users").doc(userId).collection("daily_logs").doc(dataDate);
          await archiveRef.set({
            ...currentData,
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
            rolloverSource: "scheduled-function",
          }, { merge: true });

          // === CALCULATE CARRY-OVERS ===
          const currentWins = currentData.morningBookend?.wins || [];
          const carriedWins = currentWins
            .filter((w) => !w.completed && w.text && w.text.trim().length > 0)
            .map((w) => ({ ...w, completed: false, saved: true }));

          const completedWins = currentWins.filter((w) => w.completed && w.text);
          const newWinsHistoryEntry = completedWins.map((w, i) => ({
            id: w.id || `win-${dataDate}-${i}`,
            date: dataDate,
            text: w.text,
            completed: true,
          }));
          const existingWinsList = currentData.winsList || [];

          const currentReps = currentData.active_commitments || [];
          const carriedReps = currentReps.filter((r) => r.status !== "Committed");

          const completedReps = currentReps.filter((r) => r.status === "Committed");
          const newRepsHistoryEntry = {
            date: dataDate,
            completedCount: completedReps.length,
            items: completedReps.map((r) => ({ id: r.id, text: r.text })),
          };
          const existingRepsHistory = currentData.repsHistory || [];

          const reflection = currentData.eveningBookend || {};
          const hasReflection = reflection.good || reflection.better || reflection.best;
          const newReflectionEntry = hasReflection
            ? {
                id: `ref-${dataDate}`,
                date: dataDate,
                reflectionGood: reflection.good,
                reflectionWork: reflection.better,
                reflectionTomorrow: reflection.best,
              }
            : null;
          const existingReflectionHistory = currentData.reflectionHistory || [];

          const scorecard = currentData.scorecard || {
            reps: { done: 0, total: 0 },
            win: { done: 0, total: 0 },
            grounding: { done: 0, total: 1 },
          };
          const newScorecardEntry = {
            date: dataDate,
            score: `${(scorecard.reps?.done || 0) + (scorecard.win?.done || 0) + (scorecard.grounding?.done || 0)}/${(scorecard.reps?.total || 0) + (scorecard.win?.total || 0) + (scorecard.grounding?.total || 1)}`,
            details: scorecard,
          };
          const existingScorecardHistory = currentData.scorecardHistory || currentData.commitmentHistory || [];

          // Streak
          const currentStreakCount = currentData.streakCount || 0;
          const groundingDone = currentData.groundingRepCompleted ? 1 : 0;
          const winsDone = scorecard.win?.done || 0;
          const repsDone = scorecard.reps?.done || completedReps.length;
          const didActivity = groundingDone > 0 || winsDone > 0 || repsDone > 0;
          
          const todayDateObj = new Date(dataDate + 'T12:00:00');
          const dayOfWeek = todayDateObj.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          let newStreakCount = currentStreakCount;
          if (didActivity) {
            newStreakCount = currentStreakCount + 1;
            logger.info(`User ${userId}: Activity detected. Streak: ${currentStreakCount} -> ${newStreakCount}`);
          } else if (isWeekend) {
            logger.info(`User ${userId}: Weekend with no activity. Streak maintained.`);
          } else {
            newStreakCount = 0;
            logger.info(`User ${userId}: Weekday with no activity. Streak reset.`);
          }

          // === PREPARE NEW STATE ===
          const newState = {
            ...currentData,
            date: tomorrow,
            lastUpdated: new Date().toISOString(),
            streakCount: newStreakCount,
            lastStreakDate: dataDate,
            streakHistory: [
              { date: dataDate, streak: newStreakCount, didActivity, isWeekend },
              ...(currentData.streakHistory || []).slice(0, 29)
            ],
            winsList: [...newWinsHistoryEntry, ...existingWinsList].filter(
              (v, i, a) => a.findIndex((t) => t.id === v.id) === i
            ),
            repsHistory: [newRepsHistoryEntry, ...existingRepsHistory].filter(
              (v, i, a) => a.findIndex((t) => t.date === v.date) === i
            ),
            reflectionHistory: newReflectionEntry
              ? [newReflectionEntry, ...existingReflectionHistory].filter(
                  (v, i, a) => a.findIndex((t) => t.date === v.date) === i
                )
              : existingReflectionHistory,
            scorecardHistory: [newScorecardEntry, ...existingScorecardHistory].filter(
              (v, i, a) => a.findIndex((t) => t.date === v.date) === i
            ),
            morningBookend: {
              ...currentData.morningBookend,
              wins: [...carriedWins, ...Array(3).fill(null)].slice(0, 3).map((w, i) => w || { id: `win-${Date.now()}-${i}`, text: "", completed: false, saved: false }),
              winCompleted: false,
              completedAt: null,
              otherTasks: [],
            },
            active_commitments: carriedReps,
            dailyTargetRepStatus: "Pending",
            eveningBookend: {
              good: "",
              better: "",
              best: "",
              habits: {},
              completedAt: null,
              otherTasks: [],
            },
            scorecard: {
              reps: { done: 0, total: 0, pct: 0 },
              win: { done: 0, total: 0, pct: 0 },
              grounding: { done: 0, total: 1, pct: 0 },
            },
            groundingRepCompleted: false,
          };

          await currentRef.set(newState);

          // === RESET ESCALATION IF USER COMPLETED THEIR WORK ===
          // If user did any activity today, reset their missed days counter
          if (didActivity) {
            try {
              const userRef = db.collection('users').doc(userId);
              await userRef.update({
                'notificationSettings.escalation.missedDays': 0,
                'notificationSettings.escalation.lastCompletedDate': dataDate
              });
              logger.info(`✅ User ${userId}: Reset escalation counter (completed work)`);
            } catch (escErr) {
              // Non-critical, just log
              logger.warn(`Could not reset escalation for ${userId}: ${escErr.message}`);
            }
          }

          processedCount++;
          logger.info(`✅ User ${userId}: Rolled over from ${dataDate} to ${tomorrow}`);
        } catch (userError) {
          errorCount++;
          logger.error(`❌ User ${userId}: Rollover failed`, userError);
        }
      }

      logger.info(`🌙 Daily rollover complete: ${processedCount} users processed, ${errorCount} errors`);
      return { success: true, processed: processedCount, errors: errorCount };
    } catch (error) {
      logger.error("🔥 Daily rollover failed:", error);
      throw error;
    }
  }
);

/**
 * DEBUG USER DATA
 * Dumps the user's daily_practice/current data for inspection.
 * Usage: GET /debugUser
 */
exports.debugUser = onRequest(
  {
    cors: true,
    // invoker: "public", // Removed to fix IAM permission error during deploy
  },
  async (req, res) => {
    try {
      const usersSnapshot = await db.collection("users").get();
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName
      }));
      
      res.json({
        count: users.length,
        users
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * SCHEDULED DAILY NOTIFICATIONS
 * Sends personalized notifications to users based on their current day in the daily plan.
 * Runs every morning at 8:00 AM Central Time.
 */
exports.scheduledDailyNotifications = onSchedule(
  {
    schedule: "0 8 * * *", // 8:00 AM every day
    timeZone: "America/Chicago",
  },
  async () => {
    logger.info("🔔 Starting daily notifications job...");

    try {
      // 1. Fetch all users with a startDate
      const usersSnapshot = await db.collection("users").get();
      const users = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.startDate); // Only users with a start date

      // 2. Fetch daily plan
      const planSnapshot = await db.collection("daily_plan_v1").get();
      const dailyPlan = {};
      planSnapshot.docs.forEach(doc => {
        dailyPlan[doc.data().dayNumber] = { id: doc.id, ...doc.data() };
      });

      let sentCount = 0;
      const now = new Date();

      for (const user of users) {
        try {
          // Calculate user's current day
          let startDate = user.startDate;
          if (startDate?.toDate) startDate = startDate.toDate();
          else if (startDate?.seconds) startDate = new Date(startDate.seconds * 1000);
          else startDate = new Date(startDate);

          const diffMs = now.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const currentDay = diffDays >= 0 ? diffDays + 1 : diffDays;

          // Get the day's data
          const dayData = dailyPlan[currentDay];
          if (!dayData) continue;

          // Check if notifications should be shown for this day
          if (!dayData.dashboard?.showNotifications) continue;

          // Build notification content
          const notificationText = dayData.dashboard?.notificationText || dayData.focus || `Day ${currentDay}`;

          // Check if user has FCM token
          const fcmToken = user.fcmToken;
          if (!fcmToken) {
            logger.info(`User ${user.email} has no FCM token, skipping.`);
            continue;
          }
          
          // Handle test users - still send push notifications but log it
          const isTestUser = user.isTestUser === true;
          if (isTestUser) {
            logger.info(`🧪 Test user ${user.email} - Push notification would be sent for Day ${currentDay}`);
            // Still send the push notification (goes to their device if registered)
          }

          // Send push notification
          const message = {
            notification: {
              title: isTestUser 
                ? `🧪 [TEST] Day ${currentDay}: ${dayData.title || 'Today\'s Focus'}`
                : `🎯 Day ${currentDay}: ${dayData.title || 'Today\'s Focus'}`,
              body: notificationText.substring(0, 100),
            },
            data: {
              dayNumber: String(currentDay),
              screen: 'dashboard',
              isTest: isTestUser ? 'true' : 'false',
            },
            token: fcmToken,
          };

          await admin.messaging().send(message);
          sentCount++;
          logger.info(`📬 Notification sent to ${user.email} for Day ${currentDay}`);
        } catch (userError) {
          logger.warn(`Failed to send notification to user ${user.id}:`, userError.message);
        }
      }

      logger.info(`🔔 Daily notifications complete: ${sentCount} sent`);
      return { success: true, sent: sentCount };
    } catch (error) {
      logger.error("🔥 Daily notifications failed:", error);
      throw error;
    }
  }
);

/**
 * SEND TEST NOTIFICATION
 * Manual endpoint to test push notifications for a specific user.
 * Usage: POST /sendTestNotification?email=rob@sagecg.com
 */
exports.sendTestNotification = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    const email = req.query.email || req.body.email;
    
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    try {
      // Find user
      const usersSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      
      if (usersSnapshot.empty) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const user = usersSnapshot.docs[0].data();
      const fcmToken = user.fcmToken;

      if (!fcmToken) {
        res.status(400).json({ error: "User has no FCM token registered" });
        return;
      }

      // Send test notification
      const message = {
        notification: {
          title: "🧪 Test Notification",
          body: "This is a test notification from LeaderReps!",
        },
        data: {
          screen: 'dashboard',
          test: 'true',
        },
        token: fcmToken,
      };

      const response = await admin.messaging().send(message);
      logger.info(`Test notification sent to ${email}:`, response);

      res.json({ success: true, messageId: response });
    } catch (error) {
      logger.error("Test notification error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * SEND TEST EMAIL/SMS NOTIFICATION (Callable - Gen 2)
 * Kept for backward compatibility (dev works). Still requires Firebase Auth.
 */
exports.sendTestEmailSms = onCall({ region: "us-central1", invoker: "public" }, async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { email, phone, message, type } = request.data;
    return await handleTestEmailSms(email, phone, message, type);
  }
);

/**
 * SEND TEST EMAIL/SMS NOTIFICATION (HTTP with CORS)
 * Explicit CORS handling to satisfy browsers (esp. test env).
 */
exports.sendTestEmailSmsHttp = onRequest({ region: "us-central1", invoker: "public" }, (req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      // Verify Firebase ID token
      const authHeader = req.headers.authorization || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (!idToken) {
        res.status(401).json({ success: false, error: 'unauthenticated' });
        return;
      }

      const decoded = await admin.auth().verifyIdToken(idToken);
      if (!decoded) {
        res.status(401).json({ success: false, error: 'unauthenticated' });
        return;
      }

      const { email, phone, message, type } = req.body || {};
      const result = await handleTestEmailSms(email, phone, message, type);
      res.json(result);
    } catch (error) {
      logger.error('Test email/sms HTTP error:', error);
      res.status(500).json({ success: false, error: error.message || 'internal error' });
    }
  });
});

// Shared handler for test email/SMS notifications
async function handleTestEmailSms(email, phone, message, type) {
  const testMessage = message || "This is a test notification from LeaderReps!";
  const results = { email: null, sms: null };

  // Send Email
  if (email && (!type || type === 'email' || type === 'both')) {
    try {
      await sendEmailNotification(email, "Test Notification", testMessage);
      results.email = { success: true, sentTo: email };
    } catch (e) {
      results.email = { success: false, error: e.message };
    }
  }

  // SMS disabled for go-live - uncomment when Twilio is configured
  /*
  // Send SMS (not implemented yet)
  if (phone && (!type || type === 'sms' || type === 'both')) {
    try {
      await sendSmsNotification(phone, testMessage);
      results.sms = { success: false, error: "SMS not implemented" };
    } catch (e) {
      results.sms = { success: false, error: e.message };
    }
  }
  */

  return { success: true, results };
}

/**
 * SCHEDULED FOLLOW-UP REMINDERS
 * Runs every 6 hours to check for rep follow-up reminders that are due.
 * When a user completes a rep and requests a follow-up reminder, the reminder date
 * is stored in the 'follow_up_reminders' collection. This function checks for 
 * reminders where the date has passed and sends push + email notifications.
 */
exports.scheduledFollowUpReminders = onSchedule("every 6 hours", async (event) => {
  logger.info("Starting scheduled follow-up reminder check...");
  
  try {
    // 1. Get all unsent reminders where the date has passed
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const remindersSnap = await db.collection('follow_up_reminders')
      .where('sent', '==', false)
      .get();
    
    if (remindersSnap.empty) {
      logger.info("No pending follow-up reminders found.");
      return;
    }
    
    let sentCount = 0;
    let skippedCount = 0;
    
    for (const reminderDoc of remindersSnap.docs) {
      const reminder = reminderDoc.data();
      
      // Check if reminder date has passed (compare as strings: YYYY-MM-DD)
      if (reminder.reminderDate > todayStr) {
        skippedCount++;
        continue; // Not yet due
      }
      
      // Get user data for notification delivery
      const userDoc = await db.collection('users').doc(reminder.userId).get();
      if (!userDoc.exists) {
        logger.warn(`User ${reminder.userId} not found for reminder ${reminderDoc.id}`);
        // Mark as sent to avoid retrying
        await reminderDoc.ref.update({ sent: true, sentAt: now.toISOString(), error: 'user_not_found' });
        continue;
      }
      
      const user = userDoc.data();
      const settings = user.notificationSettings || {};
      const strategy = settings.strategy || 'smart_escalation';
      const isTestUser = user.isTestUser === true;
      const overrideEmail = user.testNotificationRecipient;
      
      // Determine notification channels
      let sendPush = false;
      // ALWAYS send email for explicitly requested follow-up reminders
      let sendEmail = true; 
      
      if (strategy !== 'disabled' && settings.enabled !== false) {
        switch (strategy) {
          case 'push_only':
            sendPush = true;
            break;
          case 'email_only':
            // sendEmail is already true
            break;
          case 'full_accountability':
          case 'smart_escalation':
          default:
            sendPush = settings.channels?.push !== false;
            break;
        }
      }
      
      // Build notification content
      const personText = reminder.person ? ` with ${reminder.person}` : '';
      const repLabel = reminder.repTypeLabel || 'Rep';
      const title = '🔔 Follow-Up Reminder';
      const message = `Time to follow up on your ${repLabel} rep${personText}. Check in on progress and give additional feedback if needed.`;
      
      // Send push notification
      if (sendPush && user.fcmToken) {
        try {
          await admin.messaging().send({
            token: user.fcmToken,
            notification: {
              title,
              body: message
            },
            data: {
              url: '/conditioning',
              type: 'follow_up_reminder',
              repId: reminder.repId || ''
            }
          });
          logger.info(`Follow-up push sent to ${user.email} for rep ${reminder.repId}`);
        } catch (pushErr) {
          logger.warn(`Follow-up push failed for ${user.email}: ${pushErr.message}`);
        }
      }
      
      // Send email notification
      if (sendEmail && user.email) {
        const targetEmail = isTestUser ? (overrideEmail || null) : user.email;
        if (targetEmail) {
          const subjectPrefix = isTestUser ? `[TEST for ${user.email}] ` : '';
          await sendEmailNotification(
            targetEmail,
            `${subjectPrefix}${title}`,
            message,
            { linkText: 'Check in on progress', linkUrl: '/conditioning' }
          );
          if (isTestUser) {
            logger.info(`🧪 Follow-up email redirected: ${user.email} -> ${overrideEmail}`);
          }
        } else if (isTestUser) {
          logger.info(`🧪 Test user ${user.email} has no override email, skipping follow-up email`);
        }
      }
      
      // Mark reminder as sent
      await reminderDoc.ref.update({
        sent: true,
        sentAt: now.toISOString()
      });
      
      sentCount++;
    }
    
    logger.info(`Follow-up reminders: ${sentCount} sent, ${skippedCount} not yet due.`);
    
  } catch (error) {
    logger.error("Error in scheduledFollowUpReminders", error);
  }
});

/**
 * SCHEDULED NOTIFICATION CHECK
 * Runs every 15 minutes to check for scheduled notifications based on user timezones.
 */
exports.scheduledNotificationCheck = onSchedule("every 15 minutes", async (event) => {
  logger.info("Starting scheduled notification check...");
  
  try {
    // 1. Get all enabled notification rules
    const rulesSnap = await db.collection('notification_rules').where('enabled', '==', true).get();
    if (rulesSnap.empty) {
      logger.info("No enabled notification rules found.");
      return;
    }
    const rules = rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. Get all users with notifications enabled (including those with strategy set)
    // We query for enabled=true OR strategy exists (not disabled)
    const usersSnap = await db.collection('users').where('notificationSettings.enabled', '==', true).get();
    if (usersSnap.empty) {
      logger.info("No users with notifications enabled.");
      return;
    }

    const notificationsToSend = [];

    // 3. Iterate users and check rules
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const settings = userData.notificationSettings;
      const timezone = settings.timezone || 'UTC';
      const strategy = settings.strategy || 'smart_escalation'; // Default to smart escalation
      
      // Skip if strategy is disabled
      if (strategy === 'disabled') {
        continue;
      }

      // Get User's Local Time
      const now = new Date();
      const timeOptions = { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false };
      const timeParts = new Intl.DateTimeFormat('en-US', timeOptions).formatToParts(now);
      const localHour = parseInt(timeParts.find(p => p.type === 'hour').value);
      const localMinute = parseInt(timeParts.find(p => p.type === 'minute').value);
      
      // Get User's Local Date (YYYY-MM-DD) for checking logs
      const dateOptions = { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' };
      const dateParts = new Intl.DateTimeFormat('en-US', dateOptions).formatToParts(now);
      const year = dateParts.find(p => p.type === 'year').value;
      const month = dateParts.find(p => p.type === 'month').value;
      const day = dateParts.find(p => p.type === 'day').value;
      const localDateId = `${year}-${month}-${day}`;

      for (const rule of rules) {
        const [ruleHour, ruleMinute] = rule.time.split(':').map(Number);

        // Check if time matches (within 14 minutes window)
        const localTotalMinutes = localHour * 60 + localMinute;
        const ruleTotalMinutes = ruleHour * 60 + ruleMinute;
        
        // Handle day wrap-around if needed (e.g. rule 23:55, local 00:05) - ignoring for simplicity now
        const diff = localTotalMinutes - ruleTotalMinutes;
        
        if (diff >= 0 && diff < 15) {
          // Check Criteria
          let shouldSend = false;
          
          if (rule.criteria === 'always') {
            shouldSend = true;
          } else {
            // Fetch Current Daily Practice Data (Live Data)
            // Note: daily_logs are archives. We need the live 'current' doc.
            const practiceRef = db.collection('users').doc(userId).collection('daily_practice').doc('current');
            const practiceSnap = await practiceRef.get();
            const practiceData = practiceSnap.exists ? practiceSnap.data() : {};

            switch (rule.criteria) {
              case 'am_bookend_incomplete':
              case 'pm_bookend_incomplete':
              case 'daily_action_incomplete':
                // DEPRECATED: AM/PM Bookends and Daily Reps have been removed from the app
                // Skip these rules - they should be disabled in Firestore
                logger.info(`Skipping deprecated criteria: ${rule.criteria} for rule ${rule.id}`);
                shouldSend = false;
                break;
              default:
                logger.warn(`Unknown criteria: ${rule.criteria}`);
            }
          }

          if (shouldSend) {
            notificationsToSend.push({
              user: userData,
              userId: userId,
              rule: rule,
              localDateId,
              strategy
            });
          }
        }
      }
    }

    // 4. Send Notifications with Smart Escalation
    for (const item of notificationsToSend) {
      const { user, userId, rule, localDateId, strategy } = item;
      const settings = user.notificationSettings;
      
      // Handle test users - redirect notifications to override email
      const isTestUser = user.isTestUser === true;
      const overrideEmail = user.testNotificationRecipient;
      
      // Hyperlink options from the rule configuration
      const linkOptions = {
        linkText: rule.linkText || null,
        linkUrl: rule.linkUrl || null
      };

      // Determine channels based on strategy and escalation
      let sendPush = false;
      let sendEmail = false;
      // SMS disabled for go-live - uncomment when Twilio is configured
      // let sendSms = false;
      
      // Get escalation data for smart escalation
      const escalation = settings.escalation || { missedDays: 0 };
      const missedDays = escalation.missedDays || 0;
      
      switch (strategy) {
        case 'smart_escalation':
          // Level 0 (Day 1): Push only
          // Level 1 (Day 2): Push + Email
          // Level 2 (Day 3+): Push + Email + SMS (disabled for go-live)
          sendPush = settings.channels?.push !== false;
          sendEmail = missedDays >= 1 && settings.channels?.email !== false;
          // SMS disabled for go-live - uncomment when Twilio is configured
          // sendSms = missedDays >= 2 && settings.channels?.sms !== false && settings.phoneNumber;
          logger.info(`Smart escalation for ${user.email}: missedDays=${missedDays}, push=${sendPush}, email=${sendEmail}`);
          break;
          
        case 'push_only':
          sendPush = true;
          break;
          
        case 'email_only':
          sendEmail = true;
          break;
          
        case 'full_accountability':
          sendPush = settings.channels?.push !== false;
          sendEmail = settings.channels?.email !== false;
          // SMS disabled for go-live - uncomment when Twilio is configured
          // sendSms = settings.channels?.sms !== false && settings.phoneNumber;
          break;
          
        default:
          // Fallback to old behavior using channel settings directly
          sendEmail = settings.channels?.email === true;
          sendSms = settings.channels?.sms === true;
      }

      // Send Push Notification (if supported and enabled)
      if (sendPush && user.fcmToken) {
        try {
          await admin.messaging().send({
            token: user.fcmToken,
            notification: {
              title: rule.name,
              body: rule.message
            },
            data: {
              url: linkOptions.linkUrl || '/dashboard',
              ruleId: rule.id || ''
            }
          });
          logger.info(`Push notification sent to ${user.email}`);
        } catch (pushErr) {
          logger.warn(`Push notification failed for ${user.email}: ${pushErr.message}`);
        }
      }

      // Email
      if (sendEmail && user.email) {
        // For test users, ALWAYS use override email or skip
        // Never send to actual test email addresses (e.g., ryan2@test.com)
        if (isTestUser) {
          if (overrideEmail) {
            const subjectPrefix = `[TEST for ${user.email}] `;
            await sendEmailNotification(overrideEmail, `${subjectPrefix}${rule.name}`, rule.message, linkOptions);
            logger.info(`🧪 Test user notification redirected: ${user.email} -> ${overrideEmail}`);
          } else {
            logger.info(`🧪 Test user ${user.email} has no override email, skipping notification`);
          }
        } else {
          // Regular user - send to their email
          await sendEmailNotification(user.email, rule.name, rule.message, linkOptions);
        }
      }

      // SMS disabled for go-live - uncomment when Twilio is configured
      /*
      // SMS via Twilio - Skip for test users (don't send test SMS)
      // SMS includes a shortened link at the end
      if (sendSms && settings.phoneNumber && !isTestUser) {
        await sendSmsNotification(settings.phoneNumber, rule.message, linkOptions);
      } else if (sendSms && isTestUser) {
        logger.info(`🧪 SMS skipped for test user ${user.email}`);
      }
      */
      
      // Update escalation tracking for smart escalation strategy
      if (strategy === 'smart_escalation') {
        try {
          const userRef = db.collection('users').doc(userId);
          await userRef.update({
            'notificationSettings.escalation.missedDays': admin.firestore.FieldValue.increment(1),
            'notificationSettings.escalation.lastNotificationDate': localDateId
          });
        } catch (escErr) {
          logger.warn(`Could not update escalation for ${user.email}: ${escErr.message}`);
        }
      }
    }

    logger.info(`Processed ${notificationsToSend.length} notifications.`);

  } catch (error) {
    logger.error("Error in scheduledNotificationCheck", error);
  }
});

// Helper to send SMS via Twilio
// NOTE: SMS functionality is disabled for go-live. Uncomment all sendSms references when Twilio is configured.
// Options can include: { linkText, linkUrl } to append a link to the message
async function sendSmsNotification(phoneNumber, message, options = {}) {
  // SMS disabled for go-live - early return
  logger.info("SMS disabled for go-live. Would have sent to:", phoneNumber);
  return;
  
  // Original implementation below (disabled)
  /*
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioSid || !twilioAuth || !twilioFrom) {
    logger.warn("Twilio credentials not configured. SMS not sent.");
    return;
  }

  // Dynamically determine the app URL based on the Firebase project
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId;
  const appDomain = projectId === 'leaderreps-prod'
    ? 'arena.leaderreps.com'
    : projectId === 'leaderreps-test' 
      ? 'leaderreps-test.web.app' 
      : 'leaderreps-pd-platform.web.app';
  const appUrl = `https://${appDomain}`;

  // Determine the link to include
  let linkToInclude = appUrl;
  if (options.linkUrl) {
    linkToInclude = options.linkUrl.startsWith('http') 
      ? options.linkUrl 
      : `${appUrl}${options.linkUrl.startsWith('/') ? '' : '/'}${options.linkUrl}`;
  }

  try {
    const client = twilio(twilioSid, twilioAuth);
    const result = await client.messages.create({
      body: `LeaderReps: ${message} ${linkToInclude}`,
      from: twilioFrom,
      to: phoneNumber
    });
    logger.info(`SMS sent to ${phoneNumber}: ${result.sid}`);
  } catch (e) {
    logger.error(`Failed to send SMS to ${phoneNumber}`, e);
  }
  */
}

// Helper to send email
// Options can include: { linkText, linkUrl } to specify custom hyperlink
async function sendEmailNotification(email, subject, message, options = {}) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailPass },
  });

  // Dynamically determine the app URL based on the Firebase project
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId;
  const appDomain = projectId === 'leaderreps-prod'
    ? 'arena.leaderreps.com'
    : projectId === 'leaderreps-test' 
      ? 'leaderreps-test.web.app' 
      : 'leaderreps-pd-platform.web.app';
  const appUrl = `https://${appDomain}`;

  let htmlMessage = message;
  let linkDestination = appUrl; // Default link
  
  // If admin configured a specific linkText and linkUrl, use those
  if (options.linkText && options.linkUrl && message.includes(options.linkText)) {
    // Determine full URL - if it starts with /, prepend appUrl
    linkDestination = options.linkUrl.startsWith('http') 
      ? options.linkUrl 
      : `${appUrl}${options.linkUrl.startsWith('/') ? '' : '/'}${options.linkUrl}`;
    
    // Replace the linkText with a hyperlink
    htmlMessage = message.replace(
      options.linkText,
      `<a href="${linkDestination}" style="color: #0066cc; text-decoration: underline; font-weight: 500;">${options.linkText}</a>`
    );
    logger.info(`Configured hyperlink: "${options.linkText}" -> ${linkDestination}`);
  } else {
    // Fallback: Build HTML with action phrases as hyperlinks
    // Look for action patterns like "Complete your...", "Do your...", "Finish your...", "Start your..."
    const actionPattern = /(Complete your [^.!?]+|Do your [^.!?]+|Finish your [^.!?]+|Start your [^.!?]+|Log your [^.!?]+|Review your [^.!?]+|Check your [^.!?]+)/gi;
    
    htmlMessage = message.replace(actionPattern, (match) => {
      return `<a href="${appUrl}" style="color: #0066cc; text-decoration: underline; font-weight: 500;">${match}</a>`;
    });
  }

  const emailFromName = process.env.EMAIL_FROM_NAME || 'LeaderReps';
  const emailReplyTo = process.env.EMAIL_REPLY_TO || emailUser;

  try {
    await transporter.sendMail({
      from: `"${emailFromName}" <${emailUser}>`,
      replyTo: emailReplyTo,
      to: email,
      subject: `🔔 ${subject}`,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'LeaderReps Platform',
        'Precedence': 'bulk',
      },
      text: `${message} - ${linkDestination}`,
      html: `<p>${htmlMessage}</p>`
    });
    logger.info(`Notification email sent to ${email}`);
  } catch (e) {
    logger.error(`Failed to send email to ${email}`, e);
  }
}

/**
 * APOLLO SEARCH PROXY (Callable - Gen 2)
 * Proxies Apollo.io API calls to avoid CORS issues in the browser.
 * Only admins can use this function.
 */
exports.apolloSearchProxy = onCall({ cors: true, region: "us-central1", invoker: "public" }, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to use Apollo search.');
  }

  // Check if user is admin
  const userEmail = request.auth.token.email?.toLowerCase();
  const hardcodedAdmins = ['rob@sagecg.com', 'admin@leaderreps.com', 'ryan@leaderreps.com'];
  
  let isAdmin = hardcodedAdmins.includes(userEmail);
  
  if (!isAdmin) {
    // Check dynamic admin list
    try {
      const configDoc = await db.collection('metadata').doc('config').get();
      if (configDoc.exists) {
        const adminEmails = configDoc.data().adminemails || [];
        isAdmin = adminEmails.map(e => e.toLowerCase()).includes(userEmail);
      }
    } catch (err) {
      logger.error('Error checking admin status', err);
    }
  }

  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Only admins can use Apollo search.');
  }

  const { apiKey, searchParams, mode = 'people', entityId } = request.data;

  if (!apiKey) {
    throw new HttpsError('invalid-argument', 'Apollo API key is required.');
  }

  // Determine endpoint based on mode
  let endpoint = 'https://api.apollo.io/v1/mixed_people/api_search';
  let body = searchParams;

  if (mode === 'organizations') {
      endpoint = 'https://api.apollo.io/v1/organizations/search';
  } else if (mode === 'enrich') {
      // Enrichment Endpoint
      // Note: This endpoint consumes credits!
      endpoint = 'https://api.apollo.io/v1/people/match';
      // For match, Apollo expects { id: "..." } or { email: "..." } inside query
      body = {
        api_key: apiKey,
        reveal_personal_emails: true,
        // reveal_phone_number: true, // Requires webhook_url, disabling for sync requests
      };
      
      // Support both ID and email for matching
      if (entityId) {
        body.id = entityId;
      }
      if (request.data.email) {
        body.email = request.data.email;
      }
      if (request.data.linkedinUrl) {
        body.linkedin_url = request.data.linkedinUrl;
      }
      // Names can help improve match accuracy
      if (request.data.firstName) {
        body.first_name = request.data.firstName;
      }
      if (request.data.lastName) {
        body.last_name = request.data.lastName;
      }
      if (request.data.company) {
        body.organization_name = request.data.company;
      }
      
      // Merge extra search params if needed
      if (searchParams) {
          body = { ...body, ...searchParams };
      }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
      },
      // For enrich mode, api_key is often in body. For search it can be in header or body.
      // We'll put it in both or rely on header if supported, but Apollo Match usually likes it in body.
      body: JSON.stringify(body),
    });

    // Get response as text first to handle non-JSON error responses
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // Apollo returned non-JSON response (likely an error message)
      logger.error('Apollo API returned non-JSON response', { 
        status: response.status, 
        responseText: responseText.substring(0, 200) 
      });
      throw new HttpsError('invalid-argument', 
        responseText.includes('Invalid') ? 'Invalid Apollo API key. Please update your API key in Settings.' :
        `Apollo API error: ${responseText.substring(0, 100)}`
      );
    }

    if (!response.ok) {
      logger.error('Apollo API error', { status: response.status, data });
      throw new HttpsError('internal', data.error || 'Apollo API request failed.');
    }

    logger.info('Apollo search successful', { resultCount: data.people?.length || 0 });
    return data;
  } catch (error) {
    logger.error('Apollo proxy error', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', error.message || 'Failed to search Apollo.');
  }
});

/**
 * INSTANTLY.AI API PROXY (Callable - Gen 2)
 * Proxies Instantly.ai API calls for cold email campaign management.
 * Supports campaign listing, lead management, and status syncing.
 * API Docs: https://developer.instantly.ai/
 */
exports.instantlyProxy = onCall({ cors: true, region: "us-central1", invoker: "public" }, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to use Instantly API.');
  }

  // Check if user is admin or team member
  const userEmail = request.auth.token.email?.toLowerCase();
  const teamEmails = [
    'rob@sagecg.com', 'rob@leaderreps.com', 
    'ryan@leaderreps.com', 
    'jeff@leaderreps.com', 
    'cristina@leaderreps.com'
  ];
  
  let isAuthorized = teamEmails.includes(userEmail);
  
  if (!isAuthorized) {
    // Check dynamic admin list
    try {
      const configDoc = await db.collection('metadata').doc('config').get();
      if (configDoc.exists) {
        const adminEmails = configDoc.data().adminemails || [];
        isAuthorized = adminEmails.map(e => e.toLowerCase()).includes(userEmail);
      }
    } catch (err) {
      logger.error('Error checking authorization status', err);
    }
  }

  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Not authorized to use Instantly API.');
  }

  const { action, apiKey: userApiKey } = request.data;
  
  // Get API key from request (user settings) or fall back to environment/config
  const apiKey = userApiKey || 
    process.env.INSTANTLY_API_KEY || 
    (functionsV1.config().instantly && functionsV1.config().instantly.api_key);
  
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Instantly API key not configured. Please add your API key in Settings.');
  }

  const INSTANTLY_BASE_URL = 'https://api.instantly.ai/api/v1';

  // Helper for Instantly API calls
  async function instantlyFetch(endpoint, method = 'GET', body = null) {
    const url = `${INSTANTLY_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Instantly uses api_key as query param for most endpoints
    const urlWithKey = url.includes('?') ? `${url}&api_key=${apiKey}` : `${url}?api_key=${apiKey}`;
    
    if (body) {
      // Add api_key to body as well (some endpoints need it)
      options.body = JSON.stringify({ ...body, api_key: apiKey });
    }
    
    const response = await fetch(urlWithKey, options);
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Instantly API returned non-JSON response', { 
        status: response.status, 
        responseText: responseText.substring(0, 200) 
      });
      throw new HttpsError('internal', `Instantly API error: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      logger.error('Instantly API error', { status: response.status, endpoint, data });
      throw new HttpsError('internal', data.error || data.message || 'Instantly API request failed.');
    }
    
    return data;
  }

  try {
    switch (action) {
      // ========== CAMPAIGN OPERATIONS ==========
      case 'listCampaigns': {
        const result = await instantlyFetch('/campaign/list', 'GET');
        logger.info('Instantly: Listed campaigns', { count: result?.length || 0 });
        return result;
      }
      
      case 'getCampaign': {
        const { campaignId } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        const result = await instantlyFetch(`/campaign/get?id=${campaignId}`, 'GET');
        return result;
      }
      
      case 'getCampaignAnalytics': {
        const { campaignId } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        const result = await instantlyFetch(`/analytics/campaign/summary?campaign_id=${campaignId}`, 'GET');
        return result;
      }
      
      // ========== LEAD OPERATIONS ==========
      case 'addLead': {
        const { campaignId, lead } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        if (!lead?.email) throw new HttpsError('invalid-argument', 'Lead email is required.');
        
        const result = await instantlyFetch('/lead/add', 'POST', {
          campaign_id: campaignId,
          ...lead
        });
        
        logger.info('Instantly: Added lead', { email: lead.email, campaignId });
        return result;
      }
      
      case 'addLeads': {
        const { campaignId, leads } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        if (!leads?.length) throw new HttpsError('invalid-argument', 'At least one lead is required.');
        
        // Instantly supports bulk add with /lead/add/bulk
        const result = await instantlyFetch('/lead/add/bulk', 'POST', {
          campaign_id: campaignId,
          leads: leads.map(lead => ({
            ...lead,
            campaign_id: campaignId
          }))
        });
        
        logger.info('Instantly: Added leads batch', { count: leads.length, campaignId });
        return result;
      }
      
      case 'getLeadStatus': {
        const { email } = request.data;
        if (!email) throw new HttpsError('invalid-argument', 'Email is required.');
        
        const result = await instantlyFetch(`/lead/get?email=${encodeURIComponent(email)}`, 'GET');
        return result;
      }
      
      case 'getCampaignLeads': {
        const { campaignId, limit = 100, skip = 0 } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        
        const result = await instantlyFetch(
          `/lead/list?campaign_id=${campaignId}&limit=${limit}&skip=${skip}`, 
          'GET'
        );
        return result;
      }
      
      case 'pauseLead': {
        const { campaignId, email } = request.data;
        if (!campaignId || !email) {
          throw new HttpsError('invalid-argument', 'Campaign ID and email are required.');
        }
        
        const result = await instantlyFetch('/lead/update/status', 'POST', {
          campaign_id: campaignId,
          email: email,
          status: 'paused'
        });
        
        logger.info('Instantly: Paused lead', { email, campaignId });
        return result;
      }
      
      case 'resumeLead': {
        const { campaignId, email } = request.data;
        if (!campaignId || !email) {
          throw new HttpsError('invalid-argument', 'Campaign ID and email are required.');
        }
        
        const result = await instantlyFetch('/lead/update/status', 'POST', {
          campaign_id: campaignId,
          email: email,
          status: 'active'
        });
        
        logger.info('Instantly: Resumed lead', { email, campaignId });
        return result;
      }
      
      case 'removeLead': {
        const { campaignId, email } = request.data;
        if (!campaignId || !email) {
          throw new HttpsError('invalid-argument', 'Campaign ID and email are required.');
        }
        
        const result = await instantlyFetch('/lead/delete', 'POST', {
          campaign_id: campaignId,
          delete_list: [email]
        });
        
        logger.info('Instantly: Removed lead', { email, campaignId });
        return result;
      }
      
      default:
        throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
    }
  } catch (error) {
    logger.error('Instantly proxy error', { action, error: error.message });
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', error.message || 'Failed to call Instantly API.');
  }
});

/**
 * INSTANTLY WEBHOOK HANDLER (Gen 2 HTTP Request)
 * Receives webhook events from Instantly.ai (replies, bounces, opens, etc.)
 * and updates prospect status in Firestore.
 * 
 * Configure webhook URL in Instantly: https://us-central1-{PROJECT_ID}.cloudfunctions.net/instantlyWebhook
 */
exports.instantlyWebhook = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  
  const event = req.body;
  logger.info('Instantly webhook received', { eventType: event.event_type, email: event.email });
  
  try {
    const { event_type, email, campaign_id, timestamp } = event;
    
    if (!email) {
      logger.warn('Instantly webhook missing email');
      return res.status(400).json({ error: 'Missing email' });
    }
    
    // Find the prospect by email
    const prospectsRef = db.collection('corporate_prospects');
    const snapshot = await prospectsRef.where('email', '==', email.toLowerCase()).limit(1).get();
    
    if (snapshot.empty) {
      logger.info('Prospect not found for Instantly webhook', { email });
      return res.status(200).json({ message: 'Prospect not found, event ignored' });
    }
    
    const prospectDoc = snapshot.docs[0];
    const prospectId = prospectDoc.id;
    
    // Map Instantly event to prospect update
    const updates = {
      instantlyLastEvent: event_type,
      instantlyLastEventAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update status based on event type
    switch (event_type) {
      case 'email_replied':
      case 'replied':
        updates.instantlyStatus = 'replied';
        // Optionally move to different pipeline stage
        updates.stage = 'contacted';
        break;
        
      case 'email_bounced':
      case 'bounced':
        updates.instantlyStatus = 'bounced';
        break;
        
      case 'email_opened':
      case 'opened':
        // Don't overwrite more important statuses
        const currentData = prospectDoc.data();
        if (!['replied', 'meeting_booked'].includes(currentData.instantlyStatus)) {
          updates.instantlyStatus = 'opened';
        }
        break;
        
      case 'lead_unsubscribed':
      case 'unsubscribed':
        updates.instantlyStatus = 'unsubscribed';
        break;
        
      case 'lead_interested':
      case 'interested':
        updates.instantlyStatus = 'interested';
        updates.stage = 'qualified';
        break;
        
      case 'meeting_booked':
        updates.instantlyStatus = 'meeting_booked';
        updates.stage = 'demo';
        break;
        
      default:
        logger.info('Unhandled Instantly event type', { event_type });
    }
    
    // Add to activity log
    const activity = {
      type: 'instantly_event',
      event: event_type,
      campaignId: campaign_id || null,
      timestamp: new Date(timestamp || Date.now()),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update prospect and add activity
    await prospectDoc.ref.update(updates);
    await prospectDoc.ref.collection('activities').add(activity);
    
    logger.info('Instantly webhook processed', { prospectId, event_type });
    return res.status(200).json({ success: true, prospectId });
    
  } catch (error) {
    logger.error('Instantly webhook error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * LINKEDHELPER API PROXY (Callable - Gen 2)
 * Proxies LinkedHelper 2 API calls for LinkedIn automation management.
 * Supports campaign listing, contact management, and status syncing.
 * API Docs: https://docs.linkedhelper.com/api/
 */
exports.linkedHelperProxy = onCall({ cors: true, region: "us-central1", invoker: "public" }, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to use LinkedHelper API.');
  }

  // Check if user is admin or team member
  const userEmail = request.auth.token.email?.toLowerCase();
  const teamEmails = [
    'rob@sagecg.com', 'rob@leaderreps.com', 
    'ryan@leaderreps.com', 
    'jeff@leaderreps.com', 
    'cristina@leaderreps.com'
  ];
  
  let isAuthorized = teamEmails.includes(userEmail);
  
  if (!isAuthorized) {
    // Check dynamic admin list
    try {
      const configDoc = await db.collection('metadata').doc('config').get();
      if (configDoc.exists) {
        const adminEmails = configDoc.data().adminemails || [];
        isAuthorized = adminEmails.map(e => e.toLowerCase()).includes(userEmail);
      }
    } catch (err) {
      logger.error('Error checking authorization status', err);
    }
  }

  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Not authorized to use LinkedHelper API.');
  }

  const { action, apiKey: userApiKey } = request.data;
  
  // Get API key from request (user settings) or fall back to environment/config
  const apiKey = userApiKey || 
    process.env.LINKEDHELPER_API_KEY || 
    (functionsV1.config().linkedhelper && functionsV1.config().linkedhelper.api_key);
  
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'LinkedHelper API key not configured. Please add your API key in Settings.');
  }

  // LinkedHelper 2 uses localhost API when running
  // For cloud integration, we use their cloud API endpoint
  const LINKEDHELPER_BASE_URL = 'https://api.linkedhelper.com/v1';

  // Helper for LinkedHelper API calls
  async function linkedHelperFetch(endpoint, method = 'GET', body = null) {
    const url = `${LINKEDHELPER_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('LinkedHelper API returned non-JSON response', { 
        status: response.status, 
        responseText: responseText.substring(0, 200) 
      });
      throw new HttpsError('internal', `LinkedHelper API error: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      logger.error('LinkedHelper API error', { status: response.status, endpoint, data });
      throw new HttpsError('internal', data.error || data.message || 'LinkedHelper API request failed.');
    }
    
    return data;
  }

  try {
    switch (action) {
      // ========== CAMPAIGN OPERATIONS ==========
      case 'listCampaigns': {
        const result = await linkedHelperFetch('/campaigns', 'GET');
        logger.info('LinkedHelper: Listed campaigns', { count: result?.campaigns?.length || 0 });
        return result.campaigns || result;
      }
      
      case 'getCampaign': {
        const { campaignId } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        const result = await linkedHelperFetch(`/campaigns/${campaignId}`, 'GET');
        return result;
      }
      
      case 'getCampaignStats': {
        const { campaignId } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        const result = await linkedHelperFetch(`/campaigns/${campaignId}/stats`, 'GET');
        return result;
      }
      
      // ========== CONTACT OPERATIONS ==========
      case 'addContact': {
        const { campaignId, contact } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        if (!contact?.linkedinUrl && !contact?.profileUrl) {
          throw new HttpsError('invalid-argument', 'LinkedIn URL is required.');
        }
        
        const result = await linkedHelperFetch(`/campaigns/${campaignId}/contacts`, 'POST', {
          linkedin_url: contact.linkedinUrl || contact.profileUrl,
          first_name: contact.firstName || '',
          last_name: contact.lastName || '',
          company: contact.company || '',
          title: contact.title || '',
          email: contact.email || '',
          custom_data: contact.customData || {}
        });
        
        logger.info('LinkedHelper: Added contact', { 
          linkedinUrl: contact.linkedinUrl || contact.profileUrl, 
          campaignId 
        });
        return result;
      }
      
      case 'addContacts': {
        const { campaignId, contacts } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        if (!contacts?.length) throw new HttpsError('invalid-argument', 'At least one contact is required.');
        
        const formattedContacts = contacts.map(c => ({
          linkedin_url: c.linkedinUrl || c.profileUrl || c.linkedin,
          first_name: c.firstName || c.name?.split(' ')[0] || '',
          last_name: c.lastName || c.name?.split(' ').slice(1).join(' ') || '',
          company: c.company || '',
          title: c.title || '',
          email: c.email || '',
          custom_data: c.customData || {}
        }));
        
        const result = await linkedHelperFetch(`/campaigns/${campaignId}/contacts/bulk`, 'POST', {
          contacts: formattedContacts
        });
        
        logger.info('LinkedHelper: Added contacts batch', { count: contacts.length, campaignId });
        return result;
      }
      
      case 'getContactStatus': {
        const { linkedinUrl, email } = request.data;
        if (!linkedinUrl && !email) {
          throw new HttpsError('invalid-argument', 'LinkedIn URL or email is required.');
        }
        
        // Search by LinkedIn URL or email
        const searchParam = linkedinUrl 
          ? `linkedin_url=${encodeURIComponent(linkedinUrl)}`
          : `email=${encodeURIComponent(email)}`;
        
        const result = await linkedHelperFetch(`/contacts/search?${searchParam}`, 'GET');
        return result;
      }
      
      case 'getCampaignContacts': {
        const { campaignId, limit = 100, offset = 0, status } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        
        let endpoint = `/campaigns/${campaignId}/contacts?limit=${limit}&offset=${offset}`;
        if (status) {
          endpoint += `&status=${status}`;
        }
        
        const result = await linkedHelperFetch(endpoint, 'GET');
        return result;
      }
      
      case 'updateContactStatus': {
        const { campaignId, contactId, status } = request.data;
        if (!campaignId || !contactId) {
          throw new HttpsError('invalid-argument', 'Campaign ID and contact ID are required.');
        }
        
        const result = await linkedHelperFetch(`/campaigns/${campaignId}/contacts/${contactId}`, 'PATCH', {
          status: status
        });
        
        logger.info('LinkedHelper: Updated contact status', { contactId, status, campaignId });
        return result;
      }
      
      case 'removeContact': {
        const { campaignId, contactId } = request.data;
        if (!campaignId || !contactId) {
          throw new HttpsError('invalid-argument', 'Campaign ID and contact ID are required.');
        }
        
        const result = await linkedHelperFetch(`/campaigns/${campaignId}/contacts/${contactId}`, 'DELETE');
        
        logger.info('LinkedHelper: Removed contact', { contactId, campaignId });
        return result;
      }
      
      // ========== SYNC OPERATIONS ==========
      case 'syncCampaignResults': {
        // Fetch all contacts with updated statuses for syncing back to CRM
        const { campaignId, since } = request.data;
        if (!campaignId) throw new HttpsError('invalid-argument', 'Campaign ID is required.');
        
        let endpoint = `/campaigns/${campaignId}/contacts?limit=500`;
        if (since) {
          endpoint += `&updated_since=${since}`;
        }
        
        const result = await linkedHelperFetch(endpoint, 'GET');
        logger.info('LinkedHelper: Synced campaign results', { 
          campaignId, 
          count: result?.contacts?.length || 0 
        });
        return result;
      }
      
      default:
        throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
    }
  } catch (error) {
    logger.error('LinkedHelper proxy error', { action, error: error.message });
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', error.message || 'Failed to call LinkedHelper API.');
  }
});

/**
 * LINKEDHELPER WEBHOOK HANDLER (Gen 2 HTTP Request)
 * Receives webhook events from LinkedHelper (connection accepted, message replied, etc.)
 * and updates prospect status in Firestore.
 * 
 * Configure webhook URL in LinkedHelper: https://us-central1-{PROJECT_ID}.cloudfunctions.net/linkedHelperWebhook
 */
exports.linkedHelperWebhook = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  
  const event = req.body;
  logger.info('LinkedHelper webhook received', { eventType: event.event_type, linkedinUrl: event.linkedin_url });
  
  try {
    const { event_type, linkedin_url, email, campaign_id, timestamp, contact_data } = event;
    
    if (!linkedin_url && !email) {
      logger.warn('LinkedHelper webhook missing identifier');
      return res.status(400).json({ error: 'Missing linkedin_url or email' });
    }
    
    // Find the prospect by LinkedIn URL or email
    const prospectsRef = db.collection('corporate_prospects');
    let snapshot;
    
    if (linkedin_url) {
      // Try to match LinkedIn URL (may have variations)
      const normalizedUrl = linkedin_url.toLowerCase().replace(/\/$/, '');
      snapshot = await prospectsRef
        .where('linkedin', '>=', normalizedUrl.split('/in/')[0])
        .limit(10)
        .get();
      
      // Filter for exact match
      const matchingDocs = snapshot.docs.filter(doc => {
        const prospectLinkedin = (doc.data().linkedin || '').toLowerCase().replace(/\/$/, '');
        return prospectLinkedin.includes(normalizedUrl.split('/in/')[1] || normalizedUrl);
      });
      
      if (matchingDocs.length > 0) {
        snapshot = { empty: false, docs: matchingDocs };
      } else {
        snapshot = { empty: true, docs: [] };
      }
    }
    
    // Fallback to email search
    if ((!snapshot || snapshot.empty) && email) {
      snapshot = await prospectsRef.where('email', '==', email.toLowerCase()).limit(1).get();
    }
    
    if (!snapshot || snapshot.empty) {
      logger.info('Prospect not found for LinkedHelper webhook', { linkedin_url, email });
      return res.status(200).json({ message: 'Prospect not found, event ignored' });
    }
    
    const prospectDoc = snapshot.docs[0];
    const prospectId = prospectDoc.id;
    
    // Map LinkedHelper event to prospect update
    const updates = {
      linkedHelperLastEvent: event_type,
      linkedHelperLastEventAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update status based on event type
    switch (event_type) {
      case 'connection_sent':
        updates.linkedHelperStatus = 'pending';
        break;
        
      case 'connection_accepted':
      case 'connected':
        updates.linkedHelperStatus = 'connected';
        updates.linkedinStatus = 'connected'; // Update main LinkedIn status too
        break;
        
      case 'message_sent':
        updates.linkedHelperStatus = 'messaged';
        break;
        
      case 'message_replied':
      case 'replied':
        updates.linkedHelperStatus = 'replied';
        updates.stage = 'contacted'; // Move to contacted stage
        break;
        
      case 'connection_declined':
      case 'declined':
        updates.linkedHelperStatus = 'declined';
        break;
        
      case 'profile_visited':
        // Don't overwrite more important statuses
        const currentData = prospectDoc.data();
        if (!['connected', 'replied', 'messaged'].includes(currentData.linkedHelperStatus)) {
          updates.linkedHelperStatus = 'visited';
        }
        break;
        
      case 'withdrawn':
        updates.linkedHelperStatus = 'withdrawn';
        break;
        
      default:
        logger.info('Unhandled LinkedHelper event type', { event_type });
    }
    
    // Add to activity log
    const activity = {
      type: 'linkedin_event',
      event: event_type,
      campaignId: campaign_id || null,
      linkedinUrl: linkedin_url || null,
      timestamp: new Date(timestamp || Date.now()),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      details: contact_data || null
    };
    
    // Update prospect and add activity
    await prospectDoc.ref.update(updates);
    await prospectDoc.ref.collection('activities').add(activity);
    
    logger.info('LinkedHelper webhook processed', { prospectId, event_type });
    return res.status(200).json({ success: true, prospectId });
    
  } catch (error) {
    logger.error('LinkedHelper webhook error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * LINKEDHELPER SYNC JOB (Scheduled - runs every 15 minutes)
 * Pulls latest status updates from LinkedHelper campaigns and syncs to Firestore.
 * This provides a backup sync mechanism in case webhooks are missed.
 */
exports.linkedHelperSyncJob = onSchedule({
  schedule: "every 15 minutes",
  region: "us-central1",
  timeoutSeconds: 300
}, async (event) => {
  logger.info("LinkedHelper sync job started");
  
  const apiKey = process.env.LINKEDHELPER_API_KEY || 
    (functionsV1.config().linkedhelper && functionsV1.config().linkedhelper.api_key);
  
  if (!apiKey) {
    logger.warn("LinkedHelper API key not configured, skipping sync");
    return;
  }
  
  try {
    // Get the last sync timestamp
    const syncMetaRef = db.collection('metadata').doc('linkedhelper_sync');
    const syncMeta = await syncMetaRef.get();
    const lastSync = syncMeta.exists ? syncMeta.data().lastSync?.toDate() : null;
    const lastSyncISO = lastSync ? lastSync.toISOString() : null;
    
    // Get all prospects that have been pushed to LinkedHelper
    const prospectsRef = db.collection('corporate_prospects');
    const linkedProspects = await prospectsRef
      .where('linkedHelperCampaignId', '!=', null)
      .get();
    
    if (linkedProspects.empty) {
      logger.info("No prospects linked to LinkedHelper campaigns");
      return;
    }
    
    // Group prospects by campaign
    const prospectsByCampaign = {};
    linkedProspects.docs.forEach(doc => {
      const data = doc.data();
      const campaignId = data.linkedHelperCampaignId;
      if (!prospectsByCampaign[campaignId]) {
        prospectsByCampaign[campaignId] = [];
      }
      prospectsByCampaign[campaignId].push({ id: doc.id, ...data });
    });
    
    let syncedCount = 0;
    
    // For each campaign, fetch latest statuses
    for (const [campaignId, prospects] of Object.entries(prospectsByCampaign)) {
      try {
        let endpoint = `https://api.linkedhelper.com/v1/campaigns/${campaignId}/contacts?limit=500`;
        if (lastSyncISO) {
          endpoint += `&updated_since=${lastSyncISO}`;
        }
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          logger.warn(`Failed to fetch campaign ${campaignId} contacts`, { status: response.status });
          continue;
        }
        
        const data = await response.json();
        const contacts = data.contacts || [];
        
        // Match and update prospects
        for (const contact of contacts) {
          const linkedinUrl = (contact.linkedin_url || '').toLowerCase();
          const email = (contact.email || '').toLowerCase();
          
          // Find matching prospect
          const matchingProspect = prospects.find(p => {
            const pLinkedin = (p.linkedin || '').toLowerCase();
            const pEmail = (p.email || '').toLowerCase();
            return (linkedinUrl && pLinkedin.includes(linkedinUrl.split('/in/')[1] || linkedinUrl)) ||
                   (email && pEmail === email);
          });
          
          if (matchingProspect && contact.status !== matchingProspect.linkedHelperStatus) {
            await prospectsRef.doc(matchingProspect.id).update({
              linkedHelperStatus: contact.status,
              linkedHelperLastSync: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            syncedCount++;
          }
        }
      } catch (err) {
        logger.error(`Error syncing campaign ${campaignId}`, err);
      }
    }
    
    // Update last sync time
    await syncMetaRef.set({
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
      syncedCount
    }, { merge: true });
    
    logger.info("LinkedHelper sync job completed", { syncedCount });
    
  } catch (error) {
    logger.error("LinkedHelper sync job error", error);
  }
});

/**
 * LINKEDHELPER QUEUE POLL (HTTP Request)
 * Called by Chrome extension to fetch pending LinkedHelper push tasks.
 * The extension polls this endpoint and processes tasks via localhost API.
 */
exports.linkedHelperQueuePoll = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  // Verify auth token from header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (error) {
    logger.error('Invalid auth token for queue poll', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  const userEmail = decodedToken.email?.toLowerCase();
  
  // Check if user is authorized
  const teamEmails = [
    'rob@sagecg.com', 'rob@leaderreps.com', 
    'ryan@leaderreps.com', 
    'jeff@leaderreps.com', 
    'cristina@leaderreps.com'
  ];
  
  if (!teamEmails.includes(userEmail)) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  try {
    // Fetch pending queue items
    const queueRef = db.collection('linkedhelper_queue');
    const pendingItems = await queueRef
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc')
      .limit(10)
      .get();
    
    const items = [];
    
    for (const doc of pendingItems.docs) {
      const item = { id: doc.id, ...doc.data() };
      
      // Fetch prospect data
      const prospectDoc = await db.collection('corporate_prospects').doc(item.prospectId).get();
      if (prospectDoc.exists) {
        item.prospect = { id: prospectDoc.id, ...prospectDoc.data() };
      }
      
      // Mark as processing to prevent duplicate processing
      await doc.ref.update({
        status: 'processing',
        processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingBy: userEmail
      });
      
      items.push(item);
    }
    
    logger.info('LinkedHelper queue poll', { count: items.length, user: userEmail });
    return res.status(200).json({ items });
    
  } catch (error) {
    logger.error('LinkedHelper queue poll error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * LINKEDHELPER QUEUE COMPLETE (HTTP Request)
 * Called by Chrome extension to report completion of a queue task.
 */
exports.linkedHelperQueueComplete = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  // Verify auth token from header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  try {
    await admin.auth().verifyIdToken(token);
  } catch (error) {
    logger.error('Invalid auth token for queue complete', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  const { queueItemId, status, result, error: errorMsg } = req.body;
  
  if (!queueItemId || !status) {
    return res.status(400).json({ error: 'Missing queueItemId or status' });
  }
  
  try {
    const queueItemRef = db.collection('linkedhelper_queue').doc(queueItemId);
    const queueItem = await queueItemRef.get();
    
    if (!queueItem.exists) {
      return res.status(404).json({ error: 'Queue item not found' });
    }
    
    const itemData = queueItem.data();
    
    // Update queue item
    await queueItemRef.update({
      status: status,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      result: result || null,
      error: errorMsg || null
    });
    
    // If successful, update the prospect
    if (status === 'completed' && itemData.prospectId) {
      await db.collection('corporate_prospects').doc(itemData.prospectId).update({
        linkedHelperStatus: 'pending',
        linkedHelperCampaignId: itemData.campaignId,
        linkedHelperPushedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Add activity
      await db.collection('corporate_prospects').doc(itemData.prospectId)
        .collection('activities').add({
          type: 'linkedin_push',
          campaignId: itemData.campaignId,
          message: 'Pushed to LinkedHelper campaign',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      logger.info('LinkedHelper queue item completed', { queueItemId, prospectId: itemData.prospectId });
    } else if (status === 'failed') {
      logger.warn('LinkedHelper queue item failed', { queueItemId, error: errorMsg });
    }
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    logger.error('LinkedHelper queue complete error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * LINKEDHELPER QUEUE ADD (Callable)
 * Adds a prospect to the LinkedHelper push queue.
 * Called from Team Sales Hub UI.
 */
exports.linkedHelperQueueAdd = onCall({ cors: true, region: "us-central1", invoker: "public" }, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userEmail = request.auth.token.email?.toLowerCase();
  const { prospectId, campaignId, campaignName } = request.data;
  
  if (!prospectId || !campaignId) {
    throw new HttpsError('invalid-argument', 'prospectId and campaignId are required');
  }
  
  // Check authorization
  const teamEmails = [
    'rob@sagecg.com', 'rob@leaderreps.com', 
    'ryan@leaderreps.com', 
    'jeff@leaderreps.com', 
    'cristina@leaderreps.com'
  ];
  
  if (!teamEmails.includes(userEmail)) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }
  
  try {
    // Check prospect exists
    const prospectDoc = await db.collection('corporate_prospects').doc(prospectId).get();
    if (!prospectDoc.exists) {
      throw new HttpsError('not-found', 'Prospect not found');
    }
    
    const prospect = prospectDoc.data();
    if (!prospect.linkedin) {
      throw new HttpsError('failed-precondition', 'Prospect has no LinkedIn URL');
    }
    
    // Check if already in queue
    const existingQueue = await db.collection('linkedhelper_queue')
      .where('prospectId', '==', prospectId)
      .where('status', 'in', ['pending', 'processing'])
      .limit(1)
      .get();
    
    if (!existingQueue.empty) {
      throw new HttpsError('already-exists', 'Prospect already queued for LinkedHelper');
    }
    
    // Add to queue
    const queueItem = await db.collection('linkedhelper_queue').add({
      prospectId,
      campaignId,
      campaignName: campaignName || null,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userEmail,
      prospectName: prospect.name,
      prospectLinkedin: prospect.linkedin
    });
    
    logger.info('LinkedHelper queue item added', { queueItemId: queueItem.id, prospectId });
    
    return { 
      success: true, 
      queueItemId: queueItem.id,
      message: 'Prospect added to LinkedHelper queue. It will be pushed when the extension processes the queue.'
    };
    
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('LinkedHelper queue add error', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * SEND OUTREACH EMAIL (Callable)
 * Sends an email via Nodemailer for the Outreach module.
 * Can be used for live campaigns or test emails.
 */
exports.sendOutreachEmail = onCall({ cors: true, region: "us-central1", invoker: "public" }, async (request) => {
    // Check authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { to, subject, html, text, isTest, replyTo: customReplyTo, senderName, prospectId } = request.data;
    // Use custom replyTo if provided (assigned sender), otherwise fall back to authenticated user
    const replyToEmail = customReplyTo || request.auth.token.email;
    const displayName = senderName || 'LeaderReps Corporate';
    
    // Log intent
    logger.info("sendOutreachEmail called", { to, subject, isTest, replyTo: replyToEmail, user: request.auth.uid });

    // 0. Check Unsubscribe Blocklist (unless it's a test email to self)
    if (!isTest) {
        try {
            const unsubSnap = await db.collection('unsubscribes').where('email', '==', to).limit(1).get();
            if (!unsubSnap.empty) {
                logger.warn(`Blocked email to unsubscribed recipient: ${to}`);
                return { success: false, blocked: true, message: "Recipient has unsubscribed." };
            }
        } catch (e) {
            logger.error("Error checking unsubscribe list", e);
            // Proceed with caution or fail? Let's proceed but log it.
        }
    }

    // 1. Configure Transporter
    const emailUser = process.env.EMAIL_USER || (functionsV1.config().email && functionsV1.config().email.user);
    const emailPass = process.env.EMAIL_PASS || (functionsV1.config().email && functionsV1.config().email.pass);

    if (!emailUser || !emailPass) {
        logger.error("Email credentials not configured.");
        return { success: true, simulated: true, message: "Email simulation: Credentials not set." };
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });

    // 2. Prepare Footer & Link
    // Dynamically determine the app URL based on the Firebase project
    const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId;
    const appDomain = projectId === 'leaderreps-test' 
        ? 'leaderreps-test.web.app' 
        : 'leaderrepscorp.web.app'; // Default to corporate domain
    
    const unsubLink = `https://${appDomain}/unsubscribe?email=${encodeURIComponent(to)}`;
    
    // Generate tracking pixel URL (only for non-test emails with prospectId)
    const trackingId = prospectId ? `${prospectId}_${Date.now()}` : null;
    const trackingPixel = trackingId && !isTest
        ? `<img src="https://us-central1-${projectId}.cloudfunctions.net/trackEmailOpen?id=${trackingId}" width="1" height="1" style="display:none;" alt="" />`
        : '';
    
    const footerHtml = `
        <br/><br/>
        <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; font-family: sans-serif;">
            <p>LeaderReps Corporate • 123 Leadership Way • Chicago, IL</p>
            <p>Don't want these emails? <a href="${unsubLink}" style="color: #64748b; text-decoration: underline;">Unsubscribe here</a>.</p>
        </div>
        ${trackingPixel}
    `;

    // 3. Prepare Email
    const mailOptions = {
        from: `"${displayName}" <${emailUser}>`,
        replyTo: replyToEmail, // Uses assigned sender if provided, otherwise authenticated user
        to: to,
        subject: isTest ? `[TEST] ${subject}` : subject,
        headers: {
            'List-Unsubscribe': `<${unsubLink}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'X-Priority': '3',
            'X-Mailer': 'LeaderReps Corporate',
            'Precedence': 'bulk',
        },
        text: (text || "Enable HTML to view this message.") + `\n\nUnsubscribe: ${unsubLink}`,
        html: html + footerHtml
    };

    // 4. Send
    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info("Email sent", { messageId: info.messageId });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error("Error sending email", error);
        throw new HttpsError('internal', "Failed to send email: " + error.message);
    }
});

// Email Open Tracking Endpoint
// Returns a 1x1 transparent GIF and records the open
exports.trackEmailOpen = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
    const { id } = req.query;
    
    if (id) {
        try {
            // Parse tracking ID (format: prospectId_timestamp)
            const [prospectId] = id.split('_');
            
            if (prospectId) {
                // Record the open in the prospect's history
                const prospectRef = db.collection('corporate_prospects').doc(prospectId);
                const prospectSnap = await prospectRef.get();
                
                if (prospectSnap.exists) {
                    const data = prospectSnap.data();
                    const history = data.history || [];
                    const emailOpens = data.emailOpens || [];
                    
                    // Avoid duplicate opens within 1 minute
                    const now = new Date();
                    const recentOpen = emailOpens.find(o => 
                        now - new Date(o.timestamp) < 60000
                    );
                    
                    if (!recentOpen) {
                        await prospectRef.update({
                            emailOpens: [...emailOpens, { 
                                timestamp: now.toISOString(),
                                trackingId: id,
                                userAgent: req.headers['user-agent'] || 'unknown'
                            }],
                            lastEmailOpened: now.toISOString(),
                            history: [...history, { 
                                date: now.toISOString(), 
                                action: 'Email opened' 
                            }]
                        });
                        logger.info("Email open tracked", { prospectId, trackingId: id });
                    }
                }
            }
        } catch (e) {
            logger.error("Error tracking email open", e);
            // Don't fail the request - still return the pixel
        }
    }
    
    // Return a 1x1 transparent GIF
    const transparentGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(transparentGif);
});


/**
 * SEND REPPY INVITE - Send email invitation to join Reppy app
 * Creates an invitation record and sends a welcome email
 */
exports.sendReppyInvite = onCall({ cors: true, region: "us-central1" }, async (request) => {
    // Require authentication
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Must be logged in to send invites.');
    }

    const { email, name, isAdmin } = request.data;
    
    if (!email) {
        throw new HttpsError('invalid-argument', 'Email is required.');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new HttpsError('invalid-argument', 'Invalid email format.');
    }

    try {
        // Generate a unique invite token
        const token = require('crypto').randomBytes(32).toString('hex');
        
        // Check if user already exists in reppy_users
        const existingUserQuery = await db.collection('reppy_users')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();
        
        if (!existingUserQuery.empty) {
            throw new HttpsError('already-exists', 'A user with this email already exists.');
        }

        // Check if invite already sent (pending)
        const existingInviteQuery = await db.collection('reppy_invitations')
            .where('email', '==', email.toLowerCase())
            .where('status', '==', 'pending')
            .limit(1)
            .get();
        
        if (!existingInviteQuery.empty) {
            throw new HttpsError('already-exists', 'An invitation has already been sent to this email.');
        }

        // Create invitation record
        const inviteRef = db.collection('reppy_invitations').doc();
        const inviteData = {
            email: email.toLowerCase(),
            name: name || '',
            isAdmin: isAdmin === true,
            token: token,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: request.auth.uid,
            createdByEmail: request.auth.token.email || 'unknown'
        };
        
        await inviteRef.set(inviteData);
        logger.info(`Reppy invitation created for ${email}`, { inviteId: inviteRef.id });

        // Send invitation email
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (!emailUser || !emailPass) {
            logger.warn("Email credentials not configured - invitation created but email not sent");
            return { 
                success: true, 
                inviteId: inviteRef.id,
                emailSent: false,
                message: 'Invitation created but email could not be sent (no email credentials configured)'
            };
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: emailUser, pass: emailPass },
        });

        // Build the invite link - Reppy app URL
        const inviteLink = `https://leaderreps-reppy.web.app/auth?invite=${token}`;
        
        const firstName = name ? name.split(' ')[0] : 'there';
        const roleText = isAdmin ? 'as an Admin' : '';

        const mailOptions = {
            from: `"LeaderReps Reppy" <${emailUser}>`,
            to: email,
            subject: `🎯 You're invited to join Reppy - Your AI Leadership Coach`,
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="https://leaderreps-reppy.web.app/logo-full.png" alt="LeaderReps" style="height: 40px;">
                    </div>
                    
                    <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">
                        Hey ${firstName}! 👋
                    </h1>
                    
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        You've been invited to join <strong>Reppy</strong> ${roleText} – your personal AI leadership coach that helps you grow as a leader through daily micro-sessions, personalized coaching conversations, and real-time guidance.
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                        <p style="color: white; font-size: 14px; margin-bottom: 16px; opacity: 0.9;">
                            Click below to create your account and start your leadership journey:
                        </p>
                        <a href="${inviteLink}" style="display: inline-block; background: white; color: #0d9488; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                            Accept Invitation →
                        </a>
                    </div>
                    
                    <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            <strong>What you'll get:</strong><br>
                            ✅ Daily 5-minute leadership sessions<br>
                            ✅ AI coaching that knows your context<br>
                            ✅ Track your growth over time<br>
                            ✅ Practice tough conversations safely
                        </p>
                    </div>
                    
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; text-align: center;">
                        If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                </div>
            `,
            text: `Hey ${firstName}! You've been invited to join Reppy ${roleText} – your personal AI leadership coach. Click here to accept: ${inviteLink}`
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Reppy invitation email sent to ${email}`);

        return { 
            success: true, 
            inviteId: inviteRef.id,
            emailSent: true,
            message: `Invitation sent to ${email}`
        };

    } catch (error) {
        logger.error("Error in sendReppyInvite", error);
        if (error.code) {
            throw error;
        }
        throw new HttpsError('internal', error.message || 'Failed to send invitation');
    }
});


/**
 * REPPY COACHING - AI-powered leadership coaching conversations
 * Uses Claude to provide personalized, interactive coaching
 */
exports.reppyCoach = onCall(
    { 
        secrets: ["ANTHROPIC_API_KEY"],
        cors: [/arena\.leaderreps\.com$/, /leaderreps-prod\.web\.app$/, /leaderreps-prod\.firebaseapp\.com$/, /leaderreps-test\.web\.app$/, /leaderreps-test\.firebaseapp\.com$/, /leaderreps-pd-platform\.web\.app$/, /leaderreps-pd-platform\.firebaseapp\.com$/, /localhost/],
        invoker: "public",
        region: "us-central1",
        maxInstances: 20,
    },
    async (request) => {
        logger.info("reppyCoach called", { 
            hasAuth: !!request.auth,
            messageCount: request.data?.messages?.length 
        });

        // Verify authentication
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { messages, context } = request.data;
        
        if (!messages || !Array.isArray(messages)) {
            throw new HttpsError('invalid-argument', 'Messages array is required');
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            logger.error("ANTHROPIC_API_KEY not configured");
            throw new HttpsError('internal', 'AI service not configured');
        }

        try {
            const anthropic = new Anthropic({ apiKey });

            // Build the system prompt based on context
            const systemPrompt = buildReppySystemPrompt(context);

            // Convert messages to Anthropic format
            const anthropicMessages = messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));

            const response = await anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1024,
                system: systemPrompt,
                messages: anthropicMessages,
            });

            const assistantMessage = response.content[0]?.text || "I'm here to help. Could you tell me more?";

            logger.info("reppyCoach response generated", { 
                inputTokens: response.usage?.input_tokens,
                outputTokens: response.usage?.output_tokens 
            });

            return { 
                message: assistantMessage,
                usage: response.usage
            };

        } catch (error) {
            logger.error("Error in reppyCoach", error);
            throw new HttpsError('internal', 'Failed to generate coaching response');
        }
    }
);

/**
 * Build the system prompt for Reppy based on user context
 */
function buildReppySystemPrompt(context = {}) {
    const { 
        userName = 'there',
        userRole = 'leader',
        userChallenge = '',
        userGoal = '',
        sessionType = 'reflection',
        sessionTheme = 'leadership',
        sessionTitle = '',
        sessionContent = '',
        currentPhase = 'foundation'
    } = context;

    return `You are Reppy, an AI leadership coach created by LeaderReps. You help leaders grow through personalized, conversational coaching.

YOUR PERSONALITY:
- Warm, encouraging, and genuinely curious about the person you're coaching
- Direct but kind - you challenge thinking without being harsh
- Practical - you focus on actionable insights, not just theory
- You use the leader's name (${userName}) naturally in conversation
- You keep responses concise (2-4 paragraphs max) - this is a conversation, not a lecture
- You ask follow-up questions to deepen reflection

ABOUT THIS LEADER:
- Name: ${userName}
- Role: ${userRole}
- Current Challenge: ${userChallenge || 'Not specified'}
- Leadership Goal: ${userGoal || 'Growing as a leader'}
- Growth Phase: ${currentPhase}

CURRENT SESSION:
- Type: ${sessionType}
- Theme: ${sessionTheme}
- Title: ${sessionTitle}
${sessionContent ? `- Content/Context: ${sessionContent}` : ''}

YOUR COACHING APPROACH:
1. If the user's response is vague or unclear, gently ask for specifics ("Tell me more about that..." or "What specifically happened?")
2. If they share a challenge, acknowledge it first, then help them explore solutions
3. If they share a win, celebrate it and help them extract the learning
4. Connect their responses back to their stated goals and challenges when relevant
5. End most responses with a thoughtful question to keep the conversation going
6. If they seem stuck, offer a perspective or framework, but always bring it back to their situation

IMPORTANT:
- Never lecture or give long theoretical explanations
- Don't overwhelm with multiple questions - ask one good question at a time
- If they say something doesn't make sense or seems off, acknowledge it and ask for clarification
- Be authentically curious - you're learning about them as you coach them
- Use their actual words back to them to show you're listening`;
}

// ================================================================================
// GMAIL INTEGRATION - LR-Instantly Email Sending
// Uses Gmail OAuth to send emails from connected @leaderreps.biz accounts
// ================================================================================

/**
 * LIST CONNECTED GMAIL ACCOUNTS
 * Returns all Gmail accounts connected for team-level sending.
 * Only accessible by admin users.
 */
exports.gmailListAccounts = onCall({ 
  cors: true, 
  region: "us-central1",
  invoker: "public"
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.');
  }

  // Check if user is admin
  const userEmail = request.auth.token.email?.toLowerCase();
  const adminEmails = [
    'rob@sagecg.com', 'rob@leaderreps.com', 
    'cristina@leaderreps.com', 'cristina@leaderreps.biz',
    'ryan@leaderreps.com', 'ryan@leaderreps.biz',
    'jeff@leaderreps.com', 'jeff@leaderreps.biz'
  ];
  
  if (!adminEmails.includes(userEmail)) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  try {
    const accountsSnap = await db.collection('team_settings').doc('gmail_accounts').collection('accounts').get();
    const accounts = [];
    
    accountsSnap.forEach(doc => {
      const data = doc.data();
      accounts.push({
        id: doc.id,
        email: data.email,
        connectedAt: data.connectedAt,
        isActive: data.isActive !== false,
        // Don't expose tokens to client
      });
    });
    
    return { accounts };
  } catch (error) {
    logger.error('Error listing Gmail accounts', error);
    throw new HttpsError('internal', 'Failed to list accounts');
  }
});

/**
 * IMPORT FROM GOOGLE DRIVE
 * Downloads files from Google Drive using the Cloud Function's service account
 * credentials and uploads them to Firebase Storage, creating media_assets records.
 *
 * Accepts Google Drive file IDs and folder IDs from share links.
 * The Drive folder/files must be shared with the Cloud Function's service account
 * email address (shown in the UI and logs).
 *
 * Uses google-auth-library ADC with drive.readonly scope.
 */
exports.importFromDrive = onCall({
  cors: true,
  region: "us-central1",
  timeoutSeconds: 540,  // 9 minutes for large file downloads
  memory: "1GiB",
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.');
  }

  // Auth check — admin/team only
  const userEmail = request.auth.token.email?.toLowerCase();
  const teamEmails = [
    'rob@sagecg.com', 'rob@leaderreps.com',
    'ryan@leaderreps.com',
    'jeff@leaderreps.com',
    'cristina@leaderreps.com'
  ];
  let isAuthorized = teamEmails.includes(userEmail);
  if (!isAuthorized) {
    try {
      const configDoc = await db.collection('metadata').doc('config').get();
      if (configDoc.exists) {
        const adminEmails = configDoc.data().adminemails || [];
        isAuthorized = adminEmails.map(e => e.toLowerCase()).includes(userEmail);
      }
    } catch (err) { /* fall through */ }
  }
  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Not authorized.');
  }

  const { fileIds = [], folderIds = [], getServiceAccountEmail = false, forReplacement = false } = request.data;

  // --- Service account auth via google-auth-library ---
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const authClient = await auth.getClient();

  // If caller just wants the SA email (for sharing instructions), return it
  if (getServiceAccountEmail) {
    const saEmail = authClient.email || (await auth.getCredentials()).client_email || 'unknown';
    logger.info('Service account email requested', { saEmail });
    return { serviceAccountEmail: saEmail };
  }

  if (fileIds.length === 0 && folderIds.length === 0) {
    throw new HttpsError('invalid-argument', 'No file or folder IDs provided.');
  }

  // Get an access token for Drive API calls
  const { token: accessToken } = await authClient.getAccessToken();
  if (!accessToken) {
    throw new HttpsError('internal', 'Failed to obtain Drive access token from service account.');
  }

  const bucket = admin.storage().bucket();
  const results = [];
  const driveHeaders = { Authorization: `Bearer ${accessToken}` };

  // Helper: get file metadata from Drive
  const getFileMetadata = async (fileId) => {
    const metaResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size&supportsAllDrives=true`,
      { headers: driveHeaders }
    );
    if (!metaResponse.ok) {
      const errText = await metaResponse.text();
      throw new Error(`Metadata fetch failed (${metaResponse.status}): ${errText}`);
    }
    return metaResponse.json();
  };

  // Helper: download and import a single file
  const importFile = async (fileId) => {
    try {
      // 1. Get file metadata
      const meta = await getFileMetadata(fileId);
      const { name, mimeType, size } = meta;

      // Skip Google Docs native formats (Sheets, Docs, Slides) — they can't be downloaded directly
      if (mimeType.startsWith('application/vnd.google-apps.')) {
        logger.warn('Skipping native Google format', { fileId, name, mimeType });
        results.push({ fileId, name, success: false, error: `Native Google format (${mimeType}) — download the file as PDF/MP4 first` });
        return;
      }

      logger.info('Importing from Drive', { fileId, name, mimeType });

      // 2. Download file content
      const driveResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
        { headers: driveHeaders }
      );

      if (!driveResponse.ok) {
        const errText = await driveResponse.text();
        logger.error('Drive download failed', { fileId, status: driveResponse.status, error: errText });
        results.push({ fileId, name, success: false, error: `Download failed: ${driveResponse.status}` });
        return;
      }

      // 3. Read file into buffer
      const arrayBuffer = await driveResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 4. Upload to Firebase Storage
      const timestamp = Date.now();
      const safeName = name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `vault/${timestamp}_${safeName}`;
      const storageFile = bucket.file(storagePath);

      await storageFile.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: { driveFileId: fileId, originalName: name }
        }
      });

      // Generate a signed URL (valid for 7 years) since uniform bucket-level access prevents per-object ACLs
      const [signedUrl] = await storageFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 365 * 24 * 60 * 60 * 1000,
      });
      const downloadURL = signedUrl;

      // 5. Determine media type
      let mediaType = 'OTHER';
      if (mimeType.startsWith('image/')) mediaType = 'IMAGE';
      else if (mimeType.startsWith('video/')) mediaType = 'VIDEO';
      else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('msword')) mediaType = 'DOCUMENT';

      // 6. Create Firestore record (skip if this is a replacement import)
      let assetId = null;
      if (!forReplacement) {
        const assetData = {
          title: name,
          fileName: safeName,
          storagePath,
          url: downloadURL,
          type: mediaType,
          mimeType,
          size: parseInt(size) || buffer.length,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          tags: [],
          source: 'google-drive',
          driveFileId: fileId,
        };

        const docRef = await db.collection('media_assets').add(assetData);
        assetId = docRef.id;
      }
      
      results.push({ 
        fileId, 
        name, 
        success: true, 
        assetId,
        url: downloadURL,
        storagePath,
        size: parseInt(size) || buffer.length,
        mimeType,
        type: mediaType
      });
      logger.info('Drive import success', { fileId, name, assetId, forReplacement });

    } catch (error) {
      logger.error('Drive import error', { fileId, error: error.message });
      results.push({ fileId, name: fileId, success: false, error: error.message });
    }
  };

  // 1. Resolve folder IDs → file IDs
  for (const folderId of folderIds) {
    try {
      logger.info('Listing folder contents', { folderId });
      let pageToken = '';
      do {
        const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size),nextPageToken&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? '&pageToken=' + pageToken : ''}`;
        const listResponse = await fetch(url, { headers: driveHeaders });
        if (!listResponse.ok) {
          const errText = await listResponse.text();
          results.push({ fileId: folderId, name: `Folder ${folderId}`, success: false, error: `Folder list failed: ${listResponse.status} — ${errText}` });
          break;
        }
        const listData = await listResponse.json();
        const folderFiles = listData.files || [];
        logger.info('Found files in folder', { folderId, count: folderFiles.length });

        // Import each file from the folder
        for (const ff of folderFiles) {
          // Skip sub-folders
          if (ff.mimeType === 'application/vnd.google-apps.folder') continue;
          await importFile(ff.id);
        }
        pageToken = listData.nextPageToken || '';
      } while (pageToken);
    } catch (error) {
      logger.error('Folder listing error', { folderId, error: error.message });
      results.push({ fileId: folderId, name: `Folder ${folderId}`, success: false, error: error.message });
    }
  }

  // 2. Import individual file IDs
  for (const fileId of fileIds) {
    await importFile(fileId);
  }

  const successCount = results.filter(r => r.success).length;
  return { results, successCount, totalCount: results.length };
});

/**
 * GET GMAIL AUTH URL
 * Returns the OAuth URL for connecting a Gmail account.
 * User clicks this to authorize LR-Instantly to send emails on their behalf.
 */
exports.gmailGetAuthUrl = onCall({ 
  cors: true, 
  region: "us-central1",
  invoker: "public",
  secrets: ["GMAIL_CLIENT_ID"]
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.');
  }

  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  if (!clientId) {
    throw new HttpsError('failed-precondition', 'Gmail OAuth not configured.');
  }

  const userId = request.auth.uid;
  const returnUrl = request.data.returnUrl; // Where to redirect after OAuth
  
  // Dynamic redirect URI based on project (Gen 2 functions use Cloud Run URLs)
  const projectId = process.env.GCLOUD_PROJECT || 'leaderreps-test';
  // Cloud Run URL format for Gen 2 functions
  const redirectUri = projectId === 'leaderreps-prod' 
    ? 'https://gmailoauthcallback-z3b7uz7nma-uc.a.run.app'
    : projectId === 'leaderreps-test'
      ? 'https://gmailoauthcallback-dzk3wipgfa-uc.a.run.app'
      : `https://us-central1-${projectId}.cloudfunctions.net/gmailOAuthCallback`;
  
  // Encode state with userId and returnUrl so we know where to redirect after
  const state = Buffer.from(JSON.stringify({ userId, returnUrl })).toString('base64');
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ');
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;
  
  return { authUrl };
});

/**
 * GMAIL PROXY
 * Handles Gmail API calls using OAuth tokens from user settings.
 * Supports: listing messages, getting message details, sending emails, syncing threads.
 */
exports.gmailProxy = onCall({ 
  cors: true, 
  region: "us-central1",
  invoker: "public",
  secrets: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET"]
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to use Gmail API.');
  }

  // Check if user is admin or team member
  const userEmail = request.auth.token.email?.toLowerCase();
  const teamEmails = [
    'rob@sagecg.com', 'rob@leaderreps.com', 
    'ryan@leaderreps.com', 
    'jeff@leaderreps.com', 
    'cristina@leaderreps.com'
  ];
  
  let isAuthorized = teamEmails.includes(userEmail);
  
  if (!isAuthorized) {
    try {
      const configDoc = await db.collection('metadata').doc('config').get();
      if (configDoc.exists) {
        const adminEmails = configDoc.data().adminemails || [];
        isAuthorized = adminEmails.map(e => e.toLowerCase()).includes(userEmail);
      }
    } catch (err) {
      logger.error('Error checking authorization status', err);
    }
  }

  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Not authorized to use Gmail API.');
  }

  const { action, accessToken, refreshToken, fromEmail } = request.data;
  
  // Get tokens - either from request OR look up by fromEmail
  let activeAccessToken = accessToken;
  let activeRefreshToken = refreshToken;
  
  // If fromEmail is provided, look up tokens from team_settings
  if (fromEmail && !accessToken && !refreshToken) {
    try {
      const accountsSnapshot = await db.collection('team_settings').doc('gmail_accounts')
        .collection('accounts').where('email', '==', fromEmail.toLowerCase()).get();
      
      if (accountsSnapshot.empty) {
        throw new HttpsError('not-found', `Gmail account ${fromEmail} not connected.`);
      }
      
      const accountData = accountsSnapshot.docs[0].data();
      activeAccessToken = accountData.accessToken;
      activeRefreshToken = accountData.refreshToken;
      
      logger.info('Gmail: Using team account', { fromEmail });
    } catch (error) {
      logger.error('Error looking up team account', { fromEmail, error: error.message });
      throw new HttpsError('failed-precondition', `Could not find Gmail account: ${fromEmail}`);
    }
  }
  
  if (!activeAccessToken && !activeRefreshToken) {
    throw new HttpsError('failed-precondition', 'Gmail not connected. Please connect Gmail in Settings.');
  }

  // Helper to refresh access token
  const refreshAccessToken = async (refreshToken) => {
    const clientId = process.env.GMAIL_CLIENT_ID?.trim();
    const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      logger.error('Refresh token failed', { error: tokenData.error, description: tokenData.error_description });
      throw new HttpsError('unauthenticated', 'Gmail token expired. Please reconnect Gmail.');
    }
    
    return tokenData.access_token;
  };

  // If loading from team account (fromEmail), ALWAYS refresh to ensure token is valid
  // Access tokens expire after 1 hour
  if (fromEmail && activeRefreshToken) {
    try {
      activeAccessToken = await refreshAccessToken(activeRefreshToken);
      
      // Update the stored token for next time
      try {
        const emailDocId = fromEmail.toLowerCase().replace(/[.@]/g, '_');
        const accountRef = db.collection('team_settings').doc('gmail_accounts')
          .collection('accounts').doc(emailDocId);
        await accountRef.update({ 
          accessToken: activeAccessToken,
          tokenUpdatedAt: new Date().toISOString()
        });
        logger.info('Refreshed team account token', { fromEmail });
      } catch (e) {
        logger.warn('Could not update team account token', e);
      }
    } catch (error) {
      logger.error('Error refreshing team account token', { fromEmail, error: error.message });
      throw new HttpsError('unauthenticated', 'Gmail token expired. Please reconnect Gmail.');
    }
  }
  // If we have a refresh token but no access token (legacy user account), exchange it
  else if (!activeAccessToken && activeRefreshToken) {
    try {
      activeAccessToken = await refreshAccessToken(activeRefreshToken);
      
      // Save the new access token back to user settings (fire and forget)
      try {
        const userId = request.auth.uid;
        const settingsRef = db.collection('users').doc(userId).collection('settings').doc('gmail');
        await settingsRef.update({ 
          accessToken: activeAccessToken,
          tokenUpdatedAt: new Date().toISOString()
        });
      } catch (e) {
        logger.warn('Could not update access token in settings', e);
      }
    } catch (error) {
      logger.error('Error refreshing Gmail token', error);
      throw new HttpsError('unauthenticated', 'Failed to refresh Gmail token. Please reconnect Gmail.');
    }
  }

  const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

  // Helper for Gmail API calls
  async function gmailFetch(endpoint, method = 'GET', body = null) {
    const url = `${GMAIL_API_BASE}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${activeAccessToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Gmail API returned non-JSON response', { 
        status: response.status, 
        responseText: responseText.substring(0, 200) 
      });
      throw new HttpsError('internal', `Gmail API error: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      logger.error('Gmail API error', { status: response.status, endpoint, data });
      
      if (response.status === 401) {
        throw new HttpsError('unauthenticated', 'Gmail token expired. Please reconnect Gmail.');
      }
      
      throw new HttpsError('internal', data.error?.message || 'Gmail API request failed.');
    }
    
    return data;
  }

  try {
    switch (action) {
      // ========== EMAIL LISTING ==========
      case 'listMessages': {
        const { maxResults = 50, pageToken, query } = request.data;
        let endpoint = `/messages?maxResults=${maxResults}`;
        if (pageToken) endpoint += `&pageToken=${pageToken}`;
        if (query) endpoint += `&q=${encodeURIComponent(query)}`;
        
        const result = await gmailFetch(endpoint, 'GET');
        logger.info('Gmail: Listed messages', { count: result.messages?.length || 0 });
        return result;
      }
      
      case 'getMessage': {
        const { messageId, format = 'full' } = request.data;
        if (!messageId) throw new HttpsError('invalid-argument', 'Message ID is required.');
        
        const result = await gmailFetch(`/messages/${messageId}?format=${format}`, 'GET');
        return result;
      }
      
      case 'getThread': {
        const { threadId, format = 'full' } = request.data;
        if (!threadId) throw new HttpsError('invalid-argument', 'Thread ID is required.');
        
        const result = await gmailFetch(`/threads/${threadId}?format=${format}`, 'GET');
        return result;
      }
      
      // ========== SEND EMAIL ==========
      case 'sendEmail': {
        const { to, subject, body, cc, bcc, replyToMessageId, threadId } = request.data;
        if (!to || !subject || !body) {
          throw new HttpsError('invalid-argument', 'To, subject, and body are required.');
        }
        
        // Build raw email
        let rawEmail = `To: ${to}\r\n`;
        if (cc) rawEmail += `Cc: ${cc}\r\n`;
        if (bcc) rawEmail += `Bcc: ${bcc}\r\n`;
        rawEmail += `Subject: ${subject}\r\n`;
        rawEmail += `Content-Type: text/html; charset=UTF-8\r\n`;
        if (replyToMessageId) rawEmail += `In-Reply-To: ${replyToMessageId}\r\n`;
        rawEmail += `\r\n${body}`;
        
        // Base64 URL encode
        const encodedEmail = Buffer.from(rawEmail)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        const requestBody = { raw: encodedEmail };
        if (threadId) requestBody.threadId = threadId;
        
        const result = await gmailFetch('/messages/send', 'POST', requestBody);
        logger.info('Gmail: Email sent', { to, subject: subject.substring(0, 50) });
        return result;
      }
      
      // ========== LABELS ==========
      case 'listLabels': {
        const result = await gmailFetch('/labels', 'GET');
        return result;
      }
      
      // ========== PROFILE ==========
      case 'getProfile': {
        const result = await gmailFetch('/profile', 'GET');
        return result;
      }
      
      // ========== SYNC OPERATIONS ==========
      case 'syncSentEmails': {
        // Get sent emails in the last N days
        const { daysBack = 7, prospectEmails = [] } = request.data;
        const afterDate = new Date();
        afterDate.setDate(afterDate.getDate() - daysBack);
        const afterTimestamp = Math.floor(afterDate.getTime() / 1000);
        
        // Build query for sent emails to specific contacts
        let query = `in:sent after:${afterTimestamp}`;
        if (prospectEmails.length > 0) {
          // Gmail query for multiple recipients: (to:a@b.com OR to:c@d.com)
          const toClause = prospectEmails.map(e => `to:${e}`).join(' OR ');
          query += ` (${toClause})`;
        }
        
        const result = await gmailFetch(`/messages?maxResults=100&q=${encodeURIComponent(query)}`, 'GET');
        
        // Get full details for each message
        const messages = result.messages || [];
        const fullMessages = [];
        
        for (const msg of messages.slice(0, 50)) { // Limit to 50 to avoid timeout
          try {
            const fullMsg = await gmailFetch(`/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, 'GET');
            fullMessages.push(fullMsg);
          } catch (e) {
            logger.warn('Could not fetch message details', { id: msg.id, error: e.message });
          }
        }
        
        logger.info('Gmail: Synced sent emails', { count: fullMessages.length });
        return { messages: fullMessages };
      }
      
      case 'syncReceivedEmails': {
        // Get received emails from specific contacts
        const { daysBack = 7, prospectEmails = [] } = request.data;
        const afterDate = new Date();
        afterDate.setDate(afterDate.getDate() - daysBack);
        const afterTimestamp = Math.floor(afterDate.getTime() / 1000);
        
        let query = `in:inbox after:${afterTimestamp}`;
        if (prospectEmails.length > 0) {
          const fromClause = prospectEmails.map(e => `from:${e}`).join(' OR ');
          query += ` (${fromClause})`;
        }
        
        const result = await gmailFetch(`/messages?maxResults=100&q=${encodeURIComponent(query)}`, 'GET');
        
        const messages = result.messages || [];
        const fullMessages = [];
        
        for (const msg of messages.slice(0, 50)) {
          try {
            const fullMsg = await gmailFetch(`/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, 'GET');
            fullMessages.push(fullMsg);
          } catch (e) {
            logger.warn('Could not fetch message details', { id: msg.id, error: e.message });
          }
        }
        
        logger.info('Gmail: Synced received emails', { count: fullMessages.length });
        return { messages: fullMessages };
      }
      
      default:
        throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
    }
  } catch (error) {
    logger.error('Gmail API error', { action, error: error.message });
    if (error.code) throw error;
    throw new HttpsError('internal', error.message || 'Gmail API request failed.');
  }
});


/**
 * GMAIL OAUTH CALLBACK
 * HTTP endpoint that handles the OAuth redirect from Google.
 * Exchanges the auth code for tokens and saves them to user settings.
 */
exports.gmailOAuthCallback = onRequest({ 
  cors: true, 
  region: "us-central1",
  secrets: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET"]
}, async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    logger.error('Gmail OAuth error', { error });
    // Can't get returnUrl if state parsing fails, use default
    return res.redirect(`${getAppUrl()}/settings?gmail_error=${encodeURIComponent(error)}`);
  }
  
  if (!code || !state) {
    return res.redirect(`${getAppUrl()}/settings?gmail_error=missing_params`);
  }
  
  // Decode state (contains userId and optional returnUrl)
  let userId, returnUrl;
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    userId = stateData.userId;
    // Use returnUrl from state, or default to main app settings
    returnUrl = stateData.returnUrl || `${getAppUrl()}/settings`;
  } catch (e) {
    logger.error('Invalid OAuth state', { state });
    return res.redirect(`${getAppUrl()}/settings?gmail_error=invalid_state`);
  }
  
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  
  // Dynamic redirect URI based on project (Gen 2 functions use Cloud Run URLs)
  const projectId = process.env.GCLOUD_PROJECT || 'leaderreps-test';
  // Cloud Run URL format for Gen 2 functions
  const redirectUri = projectId === 'leaderreps-prod' 
    ? 'https://gmailoauthcallback-z3b7uz7nma-uc.a.run.app'
    : projectId === 'leaderreps-test'
      ? 'https://gmailoauthcallback-dzk3wipgfa-uc.a.run.app'
      : `https://us-central1-${projectId}.cloudfunctions.net/gmailOAuthCallback`;
  
  // Debug logging - verbose mode
  logger.info('OAuth callback - FULL DEBUG', { 
    hasCode: !!code, 
    codeLength: code?.length,
    codePrefix: code?.substring(0, 20),
    userId, 
    clientIdFull: clientId,
    clientSecretFull: clientSecret,
    redirectUri,
    projectId
  });
  
  if (!clientId || !clientSecret) {
    logger.error('Gmail OAuth not configured');
    return res.redirect(`${returnUrl}?gmail_error=not_configured`);
  }
  
  try {
    // Build request body
    const requestBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
    
    logger.info('Token exchange request - RAW BODY', {
      rawBody: requestBody.toString(),
      bodyLength: requestBody.toString().length
    });
    
    // Try with fetch as JSON instead
    const jsonBody = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    };
    
    logger.info('Token exchange as JSON', jsonBody);
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: requestBody
    });
    
    const rawText = await tokenResponse.text();
    logger.info('Token exchange RAW response', { 
      status: tokenResponse.status,
      rawResponse: rawText
    });
    
    const tokenData = JSON.parse(rawText);
    
    // Log full response for debugging
    logger.info('Token exchange response - PARSED', { 
      status: tokenResponse.status,
      tokenDataKeys: Object.keys(tokenData),
      hasAccessToken: !!tokenData.access_token, 
      error: tokenData.error,
      errorDescription: tokenData.error_description
    });
    
    if (!tokenData.access_token) {
      logger.error('Failed to get access token', tokenData);
      return res.redirect(`${returnUrl}?gmail_error=token_exchange_failed`);
    }
    
    // Get user's email from Gmail profile
    const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const profileData = await profileResponse.json();
    const connectedEmail = profileData.emailAddress.toLowerCase();
    
    // Save tokens to TEAM-LEVEL settings (all admins can see/use)
    // Using email as doc ID (sanitized) for easy lookup
    const emailDocId = connectedEmail.replace(/[.@]/g, '_');
    const teamSettingsRef = db.collection('team_settings').doc('gmail_accounts').collection('accounts').doc(emailDocId);
    await teamSettingsRef.set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      email: connectedEmail,
      connectedBy: userId,
      connectedAt: new Date().toISOString(),
      tokenUpdatedAt: new Date().toISOString(),
      isActive: true
    });
    
    logger.info('Gmail OAuth completed (team account)', { userId, email: connectedEmail, returnUrl });
    
    // Redirect back to originating app with the connected email
    return res.redirect(`${returnUrl}?gmail_connected=${encodeURIComponent(connectedEmail)}`);
    
  } catch (error) {
    logger.error('Gmail OAuth callback error', error);
    return res.redirect(`${returnUrl}?gmail_error=callback_failed`);
  }
});

// Helper to get the app URL based on environment
function getAppUrl() {
  // Return correct URL based on project
  const projectId = process.env.GCLOUD_PROJECT || 'leaderreps-test';
  if (projectId === 'leaderreps-prod') {
    return 'https://arena.leaderreps.com';
  }
  return process.env.APP_URL || 'https://leaderreps-team.web.app';
}


/**
 * GMAIL SYNC JOB
 * Scheduled function that syncs Gmail activity for all connected users.
 * Runs every 15 minutes.
 */
exports.gmailSyncJob = onSchedule({
  schedule: "every 15 minutes",
  region: "us-central1",
  timeoutSeconds: 300,
  memory: "512MiB",
}, async (event) => {
  logger.info("Gmail sync job started");
  
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  
  try {
    // 1. Get all connected team Gmail accounts
    const accountsSnap = await db.collection('team_settings')
      .doc('gmail_accounts').collection('accounts').get();
    
    if (accountsSnap.empty) {
      logger.info('No team Gmail accounts connected, skipping sync');
      return;
    }
    
    const accounts = [];
    accountsSnap.forEach(doc => {
      const data = doc.data();
      if (data.refreshToken && data.email) {
        accounts.push({ id: doc.id, ...data });
      }
    });
    
    logger.info(`Found ${accounts.length} team Gmail accounts`);
    
    // 2. Get ALL prospects with email addresses
    const prospectsSnap = await db.collection('corporate_prospects').get();
    const prospectEmails = [];
    const prospectsByEmail = {};
    
    prospectsSnap.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        const email = data.email.toLowerCase();
        prospectEmails.push(email);
        prospectsByEmail[email] = {
          id: doc.id,
          name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          email: data.email
        };
      }
    });
    
    if (prospectEmails.length === 0) {
      logger.info('No prospects with emails, skipping sync');
      return;
    }
    
    logger.info(`Loaded ${prospectEmails.length} prospect emails to match against`);
    
    // 3. Get last sync time from team_settings (default to 1 hour ago)
    const syncMetaRef = db.collection('team_settings').doc('gmail_sync');
    const syncMetaSnap = await syncMetaRef.get();
    const lastSyncTime = syncMetaSnap.exists && syncMetaSnap.data().lastSyncAt
      ? new Date(syncMetaSnap.data().lastSyncAt)
      : new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago default
    
    const afterTimestamp = Math.floor(lastSyncTime.getTime() / 1000);
    
    let totalSynced = 0;
    
    // 4. Process each Gmail account
    for (const account of accounts) {
      try {
        const synced = await syncTeamGmailAccount(account, clientId, clientSecret, prospectEmails, prospectsByEmail, afterTimestamp);
        totalSynced += synced;
      } catch (error) {
        logger.error(`Gmail sync failed for ${account.email}`, { error: error.message });
      }
    }
    
    // 5. Update last sync time
    await syncMetaRef.set({ 
      lastSyncAt: new Date().toISOString(),
      lastSyncResult: { totalSynced, accounts: accounts.length, prospects: prospectEmails.length }
    }, { merge: true });
    
    logger.info(`Gmail sync job completed: ${totalSynced} new activities across ${accounts.length} accounts`);
    
  } catch (error) {
    logger.error("Gmail sync job error", { error: error.message });
  }
});

/**
 * Helper: Sync Gmail for a team account
 * Checks both sent and received emails, logs to outreach_activities
 */
async function syncTeamGmailAccount(account, clientId, clientSecret, prospectEmails, prospectsByEmail, afterTimestamp) {
  // Refresh access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    logger.warn(`Could not refresh token for ${account.email}`, { error: tokenData.error });
    return 0;
  }
  
  const accessToken = tokenData.access_token;
  
  // Update stored token
  try {
    const emailDocId = account.email.toLowerCase().replace(/[.@]/g, '_');
    await db.collection('team_settings').doc('gmail_accounts')
      .collection('accounts').doc(emailDocId)
      .update({ accessToken, tokenUpdatedAt: new Date().toISOString() });
  } catch (e) {
    logger.warn('Could not update stored access token', { error: e.message });
  }
  
  const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
  let syncedCount = 0;
  
  // --- CHECK RECEIVED EMAILS (replies from prospects) ---
  // Build Gmail from: query (max 20 emails per query to avoid URL limits)
  const emailBatches = [];
  for (let i = 0; i < prospectEmails.length; i += 20) {
    emailBatches.push(prospectEmails.slice(i, i + 20));
  }
  
  for (const batch of emailBatches) {
    const fromClause = batch.map(e => `from:${e}`).join(' OR ');
    const receivedQuery = `in:inbox after:${afterTimestamp} (${fromClause})`;
    
    try {
      const listResp = await fetch(
        `${GMAIL_API}/messages?maxResults=50&q=${encodeURIComponent(receivedQuery)}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const listData = await listResp.json();
      
      for (const msg of (listData.messages || []).slice(0, 25)) {
        try {
          const synced = await processGmailMessage(msg.id, accessToken, GMAIL_API, prospectsByEmail, account.email, 'received');
          if (synced) syncedCount++;
        } catch (e) {
          logger.warn(`Could not process received message ${msg.id}`, { error: e.message });
        }
      }
    } catch (e) {
      logger.warn(`Received email query failed for batch`, { error: e.message });
    }
  }
  
  // --- CHECK SENT EMAILS (outgoing to prospects) ---
  for (const batch of emailBatches) {
    const toClause = batch.map(e => `to:${e}`).join(' OR ');
    const sentQuery = `in:sent after:${afterTimestamp} (${toClause})`;
    
    try {
      const listResp = await fetch(
        `${GMAIL_API}/messages?maxResults=50&q=${encodeURIComponent(sentQuery)}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const listData = await listResp.json();
      
      for (const msg of (listData.messages || []).slice(0, 25)) {
        try {
          const synced = await processGmailMessage(msg.id, accessToken, GMAIL_API, prospectsByEmail, account.email, 'sent');
          if (synced) syncedCount++;
        } catch (e) {
          logger.warn(`Could not process sent message ${msg.id}`, { error: e.message });
        }
      }
    } catch (e) {
      logger.warn(`Sent email query failed for batch`, { error: e.message });
    }
  }
  
  logger.info(`Gmail sync for ${account.email}: ${syncedCount} new activities`);
  return syncedCount;
}

/**
 * Helper: Process a single Gmail message into an outreach_activity
 */
async function processGmailMessage(messageId, accessToken, apiBase, prospectsByEmail, teamEmail, direction) {
  const msgResp = await fetch(
    `${apiBase}/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  const msgDetail = await msgResp.json();
  
  // Parse headers
  const headers = {};
  (msgDetail.payload?.headers || []).forEach(h => {
    headers[h.name.toLowerCase()] = h.value;
  });
  
  // Find matching prospect
  const relevantEmail = direction === 'received'
    ? extractEmail(headers.from || '')
    : extractEmail(headers.to || '');
  
  const prospect = prospectsByEmail[relevantEmail.toLowerCase()];
  if (!prospect) return false;
  
  // Dedup check: has this gmailMessageId already been logged?
  const existingQuery = await db.collection('outreach_activities')
    .where('gmailMessageId', '==', messageId)
    .limit(1)
    .get();
  
  if (!existingQuery.empty) return false;
  
  // Build activity record (matches schema used by EmailQueue + replyDetectionService)
  const subject = headers.subject || '(No subject)';
  const date = headers.date ? new Date(headers.date) : new Date();
  
  const activity = {
    prospectId: prospect.id,
    prospectEmail: prospect.email,
    prospectName: prospect.name,
    channel: 'email',
    type: direction === 'received' ? 'email_received' : 'email_sent',
    outcome: direction === 'received' ? 'replied' : 'sent',
    content: direction === 'received'
      ? `Reply received: "${subject}"\n\n${msgDetail.snippet || ''}`
      : `Email sent: "${subject}"\n\n${msgDetail.snippet || ''}`,
    subject,
    gmailMessageId: messageId,
    gmailThreadId: msgDetail.threadId,
    fromEmail: headers.from || '',
    toEmail: headers.to || '',
    createdAt: date.toISOString(),
    userEmail: 'system@leaderreps.com',
    userName: 'Gmail Sync',
    isAutoDetected: true,
    source: 'gmail_sync',
    syncedVia: teamEmail
  };
  
  await db.collection('outreach_activities').add(activity);
  return true;
}

/**
 * Helper: Extract email address from "Name <email>" format
 */
function extractEmail(emailString) {
  const match = emailString.match(/<([^>]+)>/);
  if (match) return match[1];
  // If no angle brackets, assume the whole string is the email
  return emailString.trim();
}

// ========================================
// CHROME EXTENSION API ENDPOINTS
// ========================================

/**
 * PROSPECT LOOKUP (Gen 2 - HTTP Request)
 * Chrome Extension API: Look up a prospect by email address.
 * Used by the Gmail sidebar to find prospects when viewing emails.
 */
exports.prospectLookup = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  // Verify Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    const { email, userId } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Verify the userId matches the token
    if (userId && userId !== uid) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }
    
    // Look up prospect by email
    const prospectsRef = db.collection('corporate_prospects');
    const snapshot = await prospectsRef
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      logger.info('Prospect not found', { email, uid });
      return res.json({ found: false });
    }
    
    const prospectDoc = snapshot.docs[0];
    const prospectData = prospectDoc.data();
    
    // Fetch recent activities
    const activitiesSnapshot = await prospectsRef
      .doc(prospectDoc.id)
      .collection('activities')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();
    
    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info('Prospect found', { email, prospectId: prospectDoc.id, uid });
    
    return res.json({
      found: true,
      prospect: {
        id: prospectDoc.id,
        name: prospectData.name || '',
        email: prospectData.email || '',
        phone: prospectData.phone || '',
        company: prospectData.company || '',
        title: prospectData.title || '',
        status: prospectData.stage || 'lead',
        linkedinUrl: prospectData.linkedinUrl || prospectData.linkedin || '',
        owner: prospectData.owner || '',
        value: prospectData.value || 0,
        notes: prospectData.notes || '',
        activities
      }
    });
  } catch (error) {
    logger.error('prospectLookup error', { error: error.message });
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET PROSPECT (Gen 2 - HTTP Request)
 * Chrome Extension API: Get full prospect data by ID.
 */
exports.getProspect = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  // Verify Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    const { prospectId, userId } = req.body;
    
    if (!prospectId) {
      return res.status(400).json({ error: 'Prospect ID is required' });
    }
    
    // Verify the userId matches the token
    if (userId && userId !== uid) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }
    
    // Get prospect document
    const prospectDoc = await db.collection('corporate_prospects').doc(prospectId).get();
    
    if (!prospectDoc.exists) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    const prospectData = prospectDoc.data();
    
    // Fetch all activities
    const activitiesSnapshot = await db.collection('corporate_prospects')
      .doc(prospectId)
      .collection('activities')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    
    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info('getProspect success', { prospectId, uid });
    
    return res.json({
      success: true,
      prospect: {
        id: prospectDoc.id,
        name: prospectData.name || '',
        email: prospectData.email || '',
        phone: prospectData.phone || '',
        company: prospectData.company || '',
        title: prospectData.title || '',
        status: prospectData.stage || 'lead',
        linkedinUrl: prospectData.linkedinUrl || prospectData.linkedin || '',
        owner: prospectData.owner || '',
        ownerEmail: prospectData.ownerEmail || '',
        value: prospectData.value || 0,
        notes: prospectData.notes || '',
        createdAt: prospectData.createdAt?.toDate?.()?.toISOString() || '',
        updatedAt: prospectData.updatedAt?.toDate?.()?.toISOString() || '',
        activities
      }
    });
  } catch (error) {
    logger.error('getProspect error', { error: error.message });
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * LOG ACTIVITY (Gen 2 - HTTP Request)
 * Chrome Extension API: Log an activity to a prospect's timeline.
 */
exports.logActivity = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  // Verify Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const userEmail = decodedToken.email || '';
    
    const { prospectId, activity, userId } = req.body;
    
    if (!prospectId) {
      return res.status(400).json({ error: 'Prospect ID is required' });
    }
    
    if (!activity || !activity.type) {
      return res.status(400).json({ error: 'Activity with type is required' });
    }
    
    // Verify the userId matches the token
    if (userId && userId !== uid) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }
    
    // Verify prospect exists
    const prospectDoc = await db.collection('corporate_prospects').doc(prospectId).get();
    
    if (!prospectDoc.exists) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    // Create activity document
    const activityData = {
      type: activity.type,
      title: activity.title || '',
      description: activity.description || '',
      notes: activity.notes || '',
      outcome: activity.outcome || '',
      duration: activity.duration || 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userEmail,
      createdByUid: uid,
      source: 'chrome_extension'
    };
    
    const activityRef = await db.collection('corporate_prospects')
      .doc(prospectId)
      .collection('activities')
      .add(activityData);
    
    // Update prospect's updatedAt
    await db.collection('corporate_prospects').doc(prospectId).update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActivityType: activity.type
    });
    
    logger.info('Activity logged', { prospectId, activityId: activityRef.id, type: activity.type, uid });
    
    return res.json({
      success: true,
      activityId: activityRef.id
    });
  } catch (error) {
    logger.error('logActivity error', { error: error.message });
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * UPDATE PROSPECT STATUS (Gen 2 - HTTP Request)
 * Chrome Extension API: Update a prospect's pipeline stage/status.
 */
exports.updateProspectStatus = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
  // Verify Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const userEmail = decodedToken.email || '';
    
    const { prospectId, status, userId } = req.body;
    
    if (!prospectId) {
      return res.status(400).json({ error: 'Prospect ID is required' });
    }
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Valid statuses
    const validStatuses = ['new', 'contacted', 'qualified', 'demo', 'proposal', 'negotiation', 'won', 'lost'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    // Verify the userId matches the token
    if (userId && userId !== uid) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }
    
    // Verify prospect exists
    const prospectRef = db.collection('corporate_prospects').doc(prospectId);
    const prospectDoc = await prospectRef.get();
    
    if (!prospectDoc.exists) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    
    const previousStatus = prospectDoc.data().stage || 'new';
    
    // Update prospect status
    await prospectRef.update({
      stage: status.toLowerCase(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastStatusChangeAt: admin.firestore.FieldValue.serverTimestamp(),
      lastStatusChangedBy: userEmail
    });
    
    // Log status change as an activity
    await prospectRef.collection('activities').add({
      type: 'status_change',
      title: `Status changed to ${status}`,
      description: `Pipeline stage changed from ${previousStatus} to ${status}`,
      previousStatus,
      newStatus: status.toLowerCase(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userEmail,
      createdByUid: uid,
      source: 'chrome_extension'
    });
    
    logger.info('Prospect status updated', { prospectId, previousStatus, newStatus: status, uid });
    
    return res.json({
      success: true,
      previousStatus,
      newStatus: status.toLowerCase()
    });
  } catch (error) {
    logger.error('updateProspectStatus error', { error: error.message });
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ================================================================================
// SEQUENCE ENGINE - Email Automation
// ================================================================================

/**
 * PROCESS SEQUENCE QUEUE
 * Runs every 15 minutes to send scheduled sequence emails.
 * 
 * Workflow:
 * 1. Get all active enrollments where nextSendAt <= now
 * 2. For each enrollment, get sequence steps and templates
 * 3. Send email via Gmail API (or queue for manual send if Gmail not connected)
 * 4. Update enrollment progress (currentStep++) and schedule next email
 * 5. Mark as completed when all steps are done
 * 
 * Note: This function currently marks emails as "ready to send" and logs activity.
 * Actual email sending requires Gmail OAuth integration (see gmailProxy).
 * For now, users can manually send from the UI using the prepared content.
 */
exports.processSequenceQueue = onSchedule({
  schedule: 'every 15 minutes',
  timeZone: 'America/New_York',
  memory: '256MiB',
  region: 'us-central1'
}, async (event) => {
  const now = admin.firestore.Timestamp.now();
  const nowDate = now.toDate();
  
  logger.info('Processing sequence queue', { timestamp: nowDate.toISOString() });
  
  try {
    // ── Load team sending limits ──────────────────────────────────
    let maxPerDay = 100;   // default
    let maxPerHour = 25;   // default
    try {
      const limitsSnap = await db.doc('team_settings/sending_limits').get();
      if (limitsSnap.exists) {
        const limits = limitsSnap.data();
        maxPerDay  = limits.maxPerDay  ?? 100;
        maxPerHour = limits.maxPerHour ?? 25;
      }
    } catch (err) {
      logger.warn('Could not load sending limits, using defaults', err);
    }

    // ── Check daily and hourly send counts ───────────────────────
    const startOfDay = new Date(nowDate);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfHour = new Date(nowDate);
    startOfHour.setMinutes(0, 0, 0);

    const dailySentSnap = await db.collection('outreach_activities')
      .where('type', '==', 'sequence_email')
      .where('automated', '==', true)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
      .get();
    const dailySent = dailySentSnap.size;

    const hourlySentSnap = await db.collection('outreach_activities')
      .where('type', '==', 'sequence_email')
      .where('automated', '==', true)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startOfHour))
      .get();
    const hourlySent = hourlySentSnap.size;

    if (dailySent >= maxPerDay) {
      logger.info(`Daily limit reached (${dailySent}/${maxPerDay}). Skipping.`);
      return { sent: 0, errors: 0, completed: 0, skipped: 0, reason: 'daily_limit' };
    }
    if (hourlySent >= maxPerHour) {
      logger.info(`Hourly limit reached (${hourlySent}/${maxPerHour}). Skipping.`);
      return { sent: 0, errors: 0, completed: 0, skipped: 0, reason: 'hourly_limit' };
    }

    // How many more we can send this run
    const remainingDaily  = maxPerDay  - dailySent;
    const remainingHourly = maxPerHour - hourlySent;
    const sendBudget = Math.min(remainingDaily, remainingHourly, 50);

    // ── Fetch due enrollments ────────────────────────────────────
    const dueEnrollments = await db.collection('sequence_enrollments')
      .where('status', '==', 'active')
      .where('nextSendAt', '<=', now)
      .limit(sendBudget)
      .get();
    
    if (dueEnrollments.empty) {
      logger.info('No enrollments due for processing');
      return { sent: 0, errors: 0, completed: 0 };
    }
    
    logger.info(`Processing ${dueEnrollments.size} due enrollments (budget: ${sendBudget})`);
    
    const results = { sent: 0, errors: 0, completed: 0, skipped: 0 };
    
    for (const doc of dueEnrollments.docs) {
      const enrollment = doc.data();
      
      try {
        // 1. Get the sequence definition
        const sequenceSnap = await db.collection('outreach_sequences')
          .doc(enrollment.sequenceId)
          .get();
        
        if (!sequenceSnap.exists) {
          logger.warn(`Sequence ${enrollment.sequenceId} not found for enrollment ${doc.id}`);
          await doc.ref.update({ 
            status: 'error',
            lastError: 'Sequence not found'
          });
          results.errors++;
          continue;
        }
        
        const sequence = sequenceSnap.data();
        
        // ── Send window enforcement ──────────────────────────────
        const sendWindow = sequence.sendWindow || {};
        const tz = sendWindow.timezone || 'America/New_York';
        const startHour = sendWindow.startHour ?? 8;
        const endHour   = sendWindow.endHour   ?? 18;
        const weekdaysOnly = sendWindow.weekdaysOnly ?? true;

        // Get current time in the sequence's timezone
        const nowInTz = new Date(nowDate.toLocaleString('en-US', { timeZone: tz }));
        const currentHour = nowInTz.getHours();
        const currentDay  = nowInTz.getDay(); // 0=Sun, 6=Sat

        const isWeekend  = currentDay === 0 || currentDay === 6;
        const isOutsideWindow = currentHour < startHour || currentHour >= endHour;

        if ((weekdaysOnly && isWeekend) || isOutsideWindow) {
          // Reschedule to next valid send time
          const nextValid = getNextSendWindowStart(nowDate, startHour, endHour, tz, weekdaysOnly);
          await doc.ref.update({ nextSendAt: admin.firestore.Timestamp.fromDate(nextValid) });
          results.skipped++;
          logger.info(`Enrollment ${doc.id} outside send window → rescheduled to ${nextValid.toISOString()}`);
          continue;
        }

        // 2. Get current step
        const step = sequence.steps?.[enrollment.currentStep];
        if (!step) {
          // No more steps, mark complete
          await doc.ref.update({ 
            status: 'completed',
            completedAt: now
          });
          
          await db.collection('outreach_sequences').doc(enrollment.sequenceId).update({
            activeEnrollments: admin.firestore.FieldValue.increment(-1),
            totalCompleted: admin.firestore.FieldValue.increment(1)
          });
          
          results.completed++;
          logger.info(`Enrollment ${doc.id} completed`);
          continue;
        }
        
        // ── A/B variant selection ────────────────────────────────
        let selectedTemplateId = step.templateId;
        let selectedSubject    = step.subject || '';
        let variantId          = null;

        if (step.variants && step.variants.length > 0) {
          // Weighted random selection
          const totalWeight = step.variants.reduce((sum, v) => sum + (v.weight || 50), 0);
          let rand = Math.random() * totalWeight;
          for (const variant of step.variants) {
            rand -= (variant.weight || 50);
            if (rand <= 0) {
              selectedTemplateId = variant.templateId || selectedTemplateId;
              selectedSubject    = variant.subject    || selectedSubject;
              variantId          = variant.id || variant.label || null;
              break;
            }
          }
          logger.info(`A/B selected variant "${variantId}" for enrollment ${doc.id}`);
        }

        // 3. Get template
        let template = null;
        if (selectedTemplateId) {
          const templateSnap = await db.collection('outreach_templates')
            .doc(selectedTemplateId)
            .get();
          
          if (templateSnap.exists) {
            template = templateSnap.data();
          }
        }
        
        // 4. Personalize content
        const variables = enrollment.variables || {};
        const subject = substituteVariables(selectedSubject || template?.subject || '', variables);
        const body = substituteVariables(template?.content || '', variables);
        
        // 5. Check for Gmail tokens
        let gmailConnected = false;
        try {
          const tokensSnap = await db.collection('users')
            .doc(enrollment.ownerId)
            .collection('settings')
            .doc('gmail')
            .get();
          
          gmailConnected = tokensSnap.exists && !!tokensSnap.data()?.refreshToken;
        } catch (err) {
          logger.warn(`Could not check Gmail tokens for ${enrollment.ownerId}`, err);
        }
        
        // 6. Log activity
        const activityData = {
          prospectId: enrollment.prospectId,
          prospectEmail: enrollment.prospectEmail,
          prospectName: enrollment.prospectName,
          channel: step.channel || 'email',
          outcome: gmailConnected ? 'sent' : 'queued',
          type: 'sequence_email',
          sequenceId: enrollment.sequenceId,
          sequenceName: enrollment.sequenceName,
          stepNumber: enrollment.currentStep,
          subject: subject,
          contentPreview: body?.substring(0, 200),
          ownerId: enrollment.ownerId,
          ownerName: enrollment.ownerName,
          createdAt: now,
          automated: true,
          gmailSent: gmailConnected,
          ...(variantId ? { variantId } : {})
        };
        
        await db.collection('outreach_activities').add(activityData);
        
        // 7. Update enrollment for next step
        const nextStepIndex = enrollment.currentStep + 1;
        
        if (nextStepIndex >= sequence.steps.length) {
          await doc.ref.update({ 
            status: 'completed',
            completedAt: now,
            emailsSent: admin.firestore.FieldValue.increment(1),
            lastSentAt: now
          });
          
          await db.collection('outreach_sequences').doc(enrollment.sequenceId).update({
            activeEnrollments: admin.firestore.FieldValue.increment(-1),
            totalCompleted: admin.firestore.FieldValue.increment(1)
          });
          
          results.completed++;
        } else {
          const nextStep = sequence.steps[nextStepIndex];
          const daysUntilNext = (nextStep.day || 0) - (step.day || 0);
          const nextSendAt = addDays(now.toDate(), Math.max(daysUntilNext, 1));
          
          await doc.ref.update({ 
            currentStep: nextStepIndex,
            nextSendAt: admin.firestore.Timestamp.fromDate(nextSendAt),
            emailsSent: admin.firestore.FieldValue.increment(1),
            lastSentAt: now
          });
          
          results.sent++;
        }
        
        logger.info(`Processed enrollment ${doc.id}`, { 
          step: enrollment.currentStep, 
          nextStep: nextStepIndex,
          gmailConnected,
          variantId
        });
        
      } catch (error) {
        logger.error(`Error processing enrollment ${doc.id}:`, error);
        
        const retryCount = (enrollment.retryCount || 0) + 1;
        if (retryCount >= 3) {
          await doc.ref.update({ 
            status: 'error',
            lastError: error.message
          });
          
          await db.collection('outreach_sequences').doc(enrollment.sequenceId).update({
            activeEnrollments: admin.firestore.FieldValue.increment(-1)
          });
        } else {
          await doc.ref.update({ 
            retryCount,
            lastError: error.message,
            nextSendAt: admin.firestore.Timestamp.fromDate(
              new Date(Date.now() + 60 * 60 * 1000)
            )
          });
        }
        
        results.errors++;
      }
    }
    
    logger.info('Sequence processing complete:', results);
    return results;
    
  } catch (error) {
    logger.error('Fatal error in processSequenceQueue:', error);
    throw error;
  }
});

/**
 * MANUAL PROCESS SEQUENCE (Callable)
 * Manually trigger sequence processing for testing/debugging.
 * Requires admin authorization.
 */
exports.processSequenceManual = onCall({ 
  cors: true, 
  region: "us-central1",
  invoker: "public" 
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.');
  }

  // Check admin authorization
  const userEmail = request.auth.token.email?.toLowerCase();
  const teamEmails = [
    'rob@sagecg.com', 'rob@leaderreps.com', 
    'ryan@leaderreps.com', 
    'jeff@leaderreps.com'
  ];
  
  let isAuthorized = teamEmails.includes(userEmail);
  
  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Not authorized.');
  }

  logger.info('Manual sequence processing triggered by', { email: userEmail });
  
  // Reuse the same logic
  const now = admin.firestore.Timestamp.now();
  
  const dueEnrollments = await db.collection('sequence_enrollments')
    .where('status', '==', 'active')
    .where('nextSendAt', '<=', now)
    .limit(20)
    .get();
  
  return {
    success: true,
    enrollmentsDue: dueEnrollments.size,
    message: `Found ${dueEnrollments.size} enrollments due for processing`
  };
});

// Helper: Variable substitution
function substituteVariables(text, variables) {
  if (!text || !variables) return text;
  
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, value || '');
  }
  return result;
}

// Helper: Add days to date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================
// ADMIN: DELETE TEST USER
// ============================================

/**
 * DELETE TEST USER
 * Safely deletes a test user and all their data.
 * Admin-only, requires confirmation, logs all actions.
 * 
 * Usage: Call with { email: "test@example.com", confirm: true }
 */
exports.deleteTestUser = onCall({ 
  cors: true, 
  region: "us-central1",
  invoker: "public"  // Required for CORS preflight in Gen 2 - auth is still enforced in code
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.');
  }

  // Check if user is admin (hardcoded list + metadata/config)
  const callerEmail = request.auth.token.email?.toLowerCase();
  const hardcodedAdmins = [
    'rob@sagecg.com', 'rob@leaderreps.com', 
    'cristina@leaderreps.com', 'cristina@leaderreps.biz',
    'ryan@leaderreps.com', 'ryan@leaderreps.biz',
    'jeff@leaderreps.com', 'jeff@leaderreps.biz'
  ];
  
  let isAdmin = hardcodedAdmins.includes(callerEmail);
  
  if (!isAdmin) {
    // Check dynamic admin list
    try {
      const configDoc = await db.collection('metadata').doc('config').get();
      if (configDoc.exists) {
        const adminEmails = configDoc.data().adminemails || [];
        isAdmin = adminEmails.map(e => e.toLowerCase()).includes(callerEmail);
      }
    } catch (err) {
      logger.warn('Could not check dynamic admin list:', err.message);
    }
  }
  
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  const { email, confirm } = request.data || {};
  
  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'Email address required.');
  }
  
  if (confirm !== true) {
    throw new HttpsError('invalid-argument', 'Must set confirm: true to delete user.');
  }
  
  const targetEmail = email.toLowerCase().trim();
  
  // Safety check: Don't allow deleting admin accounts
  if (hardcodedAdmins.includes(targetEmail)) {
    throw new HttpsError('failed-precondition', 'Cannot delete admin accounts via this function.');
  }
  
  logger.info(`[deleteTestUser] Admin ${callerEmail} requesting deletion of ${targetEmail}`);
  
  try {
    // Step 1: Find user in Firestore by email
    const usersSnap = await db.collection('users').where('email', '==', targetEmail).get();
    
    if (usersSnap.empty) {
      // Also check case-insensitive
      const usersSnapLower = await db.collection('users').where('email', '==', email.trim()).get();
      if (usersSnapLower.empty) {
        throw new HttpsError('not-found', `No user found with email: ${targetEmail}`);
      }
    }
    
    const userDoc = usersSnap.empty ? null : usersSnap.docs[0];
    const userId = userDoc?.id;
    const userData = userDoc?.data();
    
    // Step 2: Delete from Firebase Auth
    let authDeleted = false;
    try {
      const authUser = await admin.auth().getUserByEmail(targetEmail);
      await admin.auth().deleteUser(authUser.uid);
      authDeleted = true;
      logger.info(`[deleteTestUser] Deleted from Firebase Auth: ${authUser.uid}`);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        logger.info(`[deleteTestUser] User not found in Firebase Auth (already deleted or never existed)`);
      } else {
        logger.warn(`[deleteTestUser] Error deleting from Auth:`, authErr.message);
      }
    }
    
    // Step 3: Delete Firestore subcollections
    let subcollectionsDeleted = [];
    if (userId) {
      const subcollections = await db.collection('users').doc(userId).listCollections();
      for (const sub of subcollections) {
        const subDocs = await sub.get();
        const batch = db.batch();
        let count = 0;
        subDocs.forEach(d => {
          batch.delete(d.ref);
          count++;
        });
        if (count > 0) {
          await batch.commit();
          subcollectionsDeleted.push({ name: sub.id, count });
          logger.info(`[deleteTestUser] Deleted ${count} docs from subcollection: ${sub.id}`);
        }
      }
    }
    
    // Step 4: Delete main user document
    let userDocDeleted = false;
    if (userId) {
      await db.collection('users').doc(userId).delete();
      userDocDeleted = true;
      logger.info(`[deleteTestUser] Deleted user document: ${userId}`);
    }
    
    // Step 5: Log deletion for audit
    await db.collection('admin_logs').add({
      action: 'delete_test_user',
      targetEmail: targetEmail,
      targetUserId: userId || null,
      targetDisplayName: userData?.displayName || userData?.name || null,
      deletedBy: callerEmail,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      results: {
        authDeleted,
        userDocDeleted,
        subcollectionsDeleted
      }
    });
    
    logger.info(`[deleteTestUser] Successfully deleted user: ${targetEmail}`);
    
    return {
      success: true,
      deletedEmail: targetEmail,
      deletedUserId: userId || null,
      authDeleted,
      userDocDeleted,
      subcollectionsDeleted
    };
    
  } catch (err) {
    logger.error(`[deleteTestUser] Error:`, err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', `Failed to delete user: ${err.message}`);
  }
});

/**
 * Helper: Calculate the next valid send window start.
 * Advances to the next valid weekday (if weekdaysOnly) and sets the hour
 * to startHour in the given timezone.
 */
function getNextSendWindowStart(fromDate, startHour, endHour, tz, weekdaysOnly) {
  // Start from next day at startHour
  const next = new Date(fromDate);
  next.setDate(next.getDate() + 1);
  // Set to startHour in UTC (approximate — fine for ±1 hour scheduling)
  const tzOffsets = {
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
  };
  const offset = tzOffsets[tz] || -5;
  next.setUTCHours(startHour - offset, 0, 0, 0);

  // Skip weekends if needed
  if (weekdaysOnly) {
    const day = next.getUTCDay();
    if (day === 6) next.setDate(next.getDate() + 2); // Sat → Mon
    if (day === 0) next.setDate(next.getDate() + 1); // Sun → Mon
  }

  return next;
}

// ============================================
// BUG REPORT EMAIL NOTIFICATION
// ============================================

/**
 * onBugReport: Firestore trigger on bug_reports collection.
 * Sends an email notification to rob@leaderreps.com when a user submits a bug report.
 */
exports.onBugReport = require("firebase-functions/v2/firestore").onDocumentCreated("bug_reports/{reportId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.error("onBugReport: No data associated with the event");
    return;
  }

  const report = snapshot.data();
  const reportId = event.params.reportId;
  logger.info("New bug report submitted:", { id: reportId, userId: report.userId });

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    logger.warn("Email credentials not configured. Skipping bug report notification.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  // Get user info - prefer stored fields (added Mar 2026), fall back to Auth lookup
  let userName = report.userDisplayName || report.userEmail || "Unknown User";
  let userEmail = report.userEmail || "";
  
  // If no stored user info, try Auth lookup as fallback
  if (!report.userEmail && !report.userDisplayName && report.userId) {
    try {
      const userRecord = await admin.auth().getUser(report.userId);
      userName = userRecord.displayName || userRecord.email || report.userId;
      userEmail = userRecord.email || "";
    } catch (err) {
      logger.warn("Could not look up user for bug report:", err.message);
    }
  }

  const systemInfo = report.systemInfo || {};
  const timestamp = systemInfo.timestamp || new Date().toISOString();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #002E47 0%, #004466 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">🐛 New Bug Report</h2>
      </div>
      <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #334155; width: 120px;">Reported by</td>
            <td style="padding: 8px 12px; color: #475569;">${userName}${userEmail ? ` (${userEmail})` : ""}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 8px 12px; font-weight: bold; color: #334155;">Page</td>
            <td style="padding: 8px 12px; color: #475569;">${systemInfo.screen || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #334155;">Time</td>
            <td style="padding: 8px 12px; color: #475569;">${timestamp}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="padding: 8px 12px; font-weight: bold; color: #334155;">Viewport</td>
            <td style="padding: 8px 12px; color: #475569;">${systemInfo.viewport || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #334155;">Browser</td>
            <td style="padding: 8px 12px; color: #475569; word-break: break-all;">${systemInfo.userAgent || "N/A"}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #002E47; font-size: 15px;">Description</h3>
          <p style="margin: 0; color: #334155; white-space: pre-wrap;">${report.description || "No description provided"}</p>
        </div>

        ${report.steps ? `
        <div style="margin-top: 12px; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #002E47; font-size: 15px;">Steps to Reproduce</h3>
          <p style="margin: 0; color: #334155; white-space: pre-wrap;">${report.steps}</p>
        </div>
        ` : ""}
      </div>
      <div style="background: #f1f5f9; padding: 12px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">Report ID: ${reportId}</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"LeaderReps Platform" <${emailUser}>`,
    to: "rob@leaderreps.com",
    subject: `🐛 Bug Report: ${(report.description || "").substring(0, 60)}${(report.description || "").length > 60 ? "..." : ""}`,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info("Bug report email sent to rob@leaderreps.com", { reportId });
  } catch (err) {
    logger.error("Failed to send bug report email:", err);
  }
});

// ============================================================
// SCHEDULED FIRESTORE BACKUP
// ============================================================
// Runs daily at 2:00 AM ET to export all Firestore data to a Cloud Storage bucket.
// Uses the native Firestore managed export (admin.firestore().exportDocuments).
// Exports go to: gs://{projectId}-firestore-backups/YYYY-MM-DD/
//
// SETUP REQUIRED (one-time per project):
//   1. Create the backup bucket:
//      gsutil mb -l us-central1 gs://{projectId}-firestore-backups
//   2. Grant the default service account permission:
//      gsutil iam ch serviceAccount:{projectId}@appspot.gserviceaccount.com:roles/storage.admin gs://{projectId}-firestore-backups
//   3. Enable the Firestore API for exports:
//      gcloud services enable firestore.googleapis.com --project={projectId}
//   4. Grant the service account the datastore.importExport role:
//      gcloud projects add-iam-policy-binding {projectId} \
//        --member="serviceAccount:{projectId}@appspot.gserviceaccount.com" \
//        --role="roles/datastore.importExportAdmin"
//
// To restore from a backup:
//   gcloud firestore import gs://{projectId}-firestore-backups/YYYY-MM-DD/
// ============================================================
exports.scheduledFirestoreBackup = onSchedule({
  schedule: "every day 02:00",
  timeZone: "America/New_York",
  timeoutSeconds: 300,
  memory: "256MiB",
}, async (event) => {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  const bucketName = `${projectId}-firestore-backups`;
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const outputUri = `gs://${bucketName}/${timestamp}`;

  logger.info(`Starting Firestore backup to ${outputUri}`);

  try {
    const client = new admin.firestore.v1.FirestoreAdminClient();
    const databaseName = client.databasePath(projectId, "(default)");

    const [response] = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix: outputUri,
      // Empty collectionIds = export ALL collections
      collectionIds: [],
    });

    logger.info("Firestore backup initiated successfully", {
      operationName: response.name,
      outputUri,
    });
  } catch (err) {
    logger.error("Firestore backup failed", { error: err.message, outputUri });
    throw err;
  }
});

// ============================================================
// SOCIAL MEDIA MONITOR - On-Demand Trigger
// ============================================================
// Allows admins to manually trigger the social media leadership finder
// Fetches posts from Reddit RSS, generates AI responses, sends emails
// ============================================================

const Parser = require("rss-parser");
// Create parser with proper User-Agent to avoid Reddit 403 blocks
const rssParser = new Parser({
  headers: {
    'User-Agent': 'LeaderReps-SocialMonitor/1.0 (+https://leaderreps.com; cloud-function)',
    'Accept': 'application/rss+xml, application/xml, text/xml',
  },
  timeout: 10000,
});

// Leadership-focused subreddits
const LEADERSHIP_SUBREDDITS = [
  "leadership", "management", "humanresources", "AskHR",
  "careerdevelopment", "careeradvice", "smallbusiness", "startups",
  "entrepreneur", "projectmanagement", "cscareerquestions"
];

// Leadership keywords (AI validates relevance after initial match)
// Using phrase-based keywords to reduce false positives
const LEADERSHIP_KEYWORDS = [
  // Leadership development
  "leadership development", "leadership training", "leadership skills",
  "leadership coaching", "leadership advice", "better leader",
  // Manager-specific
  "new manager", "first time manager", "new to management",
  "become a manager", "being a manager",
  // Team leadership
  "leading a team", "lead my team", "manage my team",
  "managing people", "people management", "team management",
  "managing direct reports",
  // Feedback & coaching
  "giving feedback", "difficult conversation", "coaching employees",
  "1 on 1", "one on one",
  // Challenges
  "underperforming employee", "team morale", "delegation", "micromanaging"
];

/**
 * Fetch posts from Reddit JSON API (with RSS fallback)
 * Reddit requires proper User-Agent to avoid 403 blocks
 */
const fetchRedditPosts = async (subreddits, maxAge = 48) => {
  const posts = [];
  const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);
  const userAgent = 'LeaderReps-SocialMonitor/1.0 (+https://leaderreps.com; cloud-function)';
  
  for (const subreddit of subreddits) {
    try {
      // Try JSON API first (more reliable than RSS)
      const jsonUrl = `https://www.reddit.com/r/${subreddit}/new.json?limit=50`;
      const response = await fetch(jsonUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Status code ${response.status}`);
      }
      
      const data = await response.json();
      const children = data?.data?.children || [];
      
      for (const child of children) {
        const post = child.data;
        if (!post) continue;
        
        const pubDate = (post.created_utc || 0) * 1000;
        if (pubDate < cutoffTime) continue;
        
        const text = `${post.title || ""} ${post.selftext || ""}`.toLowerCase();
        const matchedKeywords = LEADERSHIP_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
        
        if (matchedKeywords.length > 0) {
          posts.push({
            id: post.id || post.permalink,
            platform: "reddit",
            subreddit,
            title: post.title,
            content: post.selftext || "",
            author: post.author || "unknown",
            url: `https://www.reddit.com${post.permalink}`,
            createdAt: new Date(pubDate),
            matchedKeywords,
            score: post.score,
            numComments: post.num_comments,
          });
        }
      }
    } catch (jsonErr) {
      // Fallback to RSS if JSON fails
      logger.warn(`Reddit JSON failed for r/${subreddit}: ${jsonErr.message}, trying RSS...`);
      try {
        const feedUrl = `https://www.reddit.com/r/${subreddit}/new.rss`;
        const feed = await rssParser.parseURL(feedUrl);
        
        for (const item of feed.items || []) {
          const pubDate = new Date(item.pubDate || item.isoDate).getTime();
          if (pubDate < cutoffTime) continue;
          
          const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
          const matchedKeywords = LEADERSHIP_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
          
          if (matchedKeywords.length > 0) {
            posts.push({
              id: item.guid || item.link,
              platform: "reddit",
              subreddit,
              title: item.title,
              content: item.contentSnippet || "",
              author: item.creator || "unknown",
              url: item.link,
              createdAt: new Date(item.pubDate || item.isoDate),
              matchedKeywords,
            });
          }
        }
      } catch (rssErr) {
        logger.warn(`Failed to fetch r/${subreddit}:`, rssErr.message);
      }
    }
  }
  
  return posts;
};

/**
 * Fetch posts from Hacker News API
 */
const fetchHackerNewsPosts = async (maxAge = 48) => {
  const posts = [];
  const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);
  
  try {
    // Get recent stories (new, best, ask)
    const storyTypes = ['newstories', 'beststories', 'askstories'];
    const allStoryIds = [];
    
    for (const type of storyTypes) {
      const response = await fetch(`https://hacker-news.firebaseio.com/v0/${type}.json`);
      const ids = await response.json();
      allStoryIds.push(...(ids || []).slice(0, 50)); // Top 50 from each
    }
    
    // Dedupe and limit
    const uniqueIds = [...new Set(allStoryIds)].slice(0, 100);
    
    // Fetch story details (batch)
    for (const id of uniqueIds) {
      try {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const story = await storyRes.json();
        
        if (!story || !story.title) continue;
        
        const pubDate = (story.time || 0) * 1000;
        if (pubDate < cutoffTime) continue;
        
        const text = `${story.title || ""} ${story.text || ""}`.toLowerCase();
        const matchedKeywords = LEADERSHIP_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
        
        if (matchedKeywords.length > 0) {
          posts.push({
            id: `hn-${story.id}`,
            platform: "hackernews",
            title: story.title,
            content: story.text || "",
            author: story.by || "unknown",
            url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            createdAt: new Date(pubDate),
            matchedKeywords,
            score: story.score,
          });
        }
      } catch (e) {
        // Skip individual story errors
      }
    }
  } catch (err) {
    logger.warn("Failed to fetch Hacker News:", err.message);
  }
  
  return posts;
};

/**
 * Fetch posts from Stack Exchange Workplace API
 */
const fetchStackExchangePosts = async (maxAge = 48) => {
  const posts = [];
  const cutoffTime = Math.floor((Date.now() - (maxAge * 60 * 60 * 1000)) / 1000);
  
  try {
    // Search for leadership-related questions
    const searchTerms = ["leadership", "manager", "team lead", "managing", "feedback"];
    
    for (const term of searchTerms) {
      const url = `https://api.stackexchange.com/2.3/search?order=desc&sort=creation&intitle=${encodeURIComponent(term)}&site=workplace&filter=withbody&pagesize=20`;
      const response = await fetch(url);
      const data = await response.json();
      
      for (const item of data.items || []) {
        if (item.creation_date < cutoffTime) continue;
        
        // Check for keyword match
        const text = `${item.title || ""} ${item.body || ""}`.toLowerCase();
        const matchedKeywords = LEADERSHIP_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
        
        if (matchedKeywords.length > 0) {
          const postId = `se-${item.question_id}`;
          if (!posts.find(p => p.id === postId)) {
            posts.push({
              id: postId,
              platform: "stackexchange",
              title: item.title,
              content: item.body?.replace(/<[^>]*>/g, "").substring(0, 500) || "",
              author: item.owner?.display_name || "unknown",
              url: item.link,
              createdAt: new Date(item.creation_date * 1000),
              matchedKeywords,
              score: item.score,
            });
          }
        }
      }
    }
  } catch (err) {
    logger.warn("Failed to fetch Stack Exchange:", err.message);
  }
  
  return posts;
};

/**
 * Fetch posts from Dev.to API
 */
const fetchDevToPosts = async (maxAge = 48) => {
  const posts = [];
  const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);
  
  try {
    // Search for leadership-related articles
    const tags = ["leadership", "management", "career", "teamwork", "softskills"];
    
    for (const tag of tags) {
      const url = `https://dev.to/api/articles?tag=${tag}&per_page=30`;
      const response = await fetch(url);
      const articles = await response.json();
      
      for (const article of articles || []) {
        const pubDate = new Date(article.published_at).getTime();
        if (pubDate < cutoffTime) continue;
        
        const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();
        const matchedKeywords = LEADERSHIP_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
        
        if (matchedKeywords.length > 0) {
          const postId = `devto-${article.id}`;
          if (!posts.find(p => p.id === postId)) {
            posts.push({
              id: postId,
              platform: "devto",
              title: article.title,
              content: article.description || "",
              author: article.user?.name || article.user?.username || "unknown",
              url: article.url,
              createdAt: new Date(pubDate),
              matchedKeywords,
            });
          }
        }
      }
    }
  } catch (err) {
    logger.warn("Failed to fetch Dev.to:", err.message);
  }
  
  return posts;
};

/**
 * Fetch posts from Medium via RSS
 */
const fetchMediumPosts = async (maxAge = 48) => {
  const posts = [];
  const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);
  
  // Medium tags with leadership content
  const tags = ["leadership", "management", "team-leadership", "executive-coaching"];
  
  for (const tag of tags) {
    try {
      const feedUrl = `https://medium.com/feed/tag/${tag}`;
      const feed = await rssParser.parseURL(feedUrl);
      
      for (const item of feed.items || []) {
        const pubDate = new Date(item.pubDate || item.isoDate).getTime();
        if (pubDate < cutoffTime) continue;
        
        const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
        const matchedKeywords = LEADERSHIP_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
        
        if (matchedKeywords.length > 0) {
          const postId = item.guid || item.link;
          if (!posts.find(p => p.id === postId)) {
            posts.push({
              id: postId,
              platform: "medium",
              title: item.title,
              content: item.contentSnippet || "",
              author: item.creator || "unknown",
              url: item.link,
              createdAt: new Date(pubDate),
              matchedKeywords,
            });
          }
        }
      }
    } catch (err) {
      logger.warn(`Failed to fetch Medium tag ${tag}:`, err.message);
    }
  }
  
  return posts;
};

/**
 * Fetch posts from Indie Hackers RSS
 */
const fetchIndieHackersPosts = async (maxAge = 48) => {
  const posts = [];
  const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);
  
  try {
    // Note: Indie Hackers discontinued their RSS feed, trying Google News search as fallback
    const feedUrl = "https://news.google.com/rss/search?q=indie+hackers+leadership+site:indiehackers.com&hl=en-US&gl=US&ceid=US:en";
    const feed = await rssParser.parseURL(feedUrl);
    
    for (const item of feed.items || []) {
      const pubDate = new Date(item.pubDate || item.isoDate).getTime();
      if (pubDate < cutoffTime) continue;
      
      const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
      const matchedKeywords = LEADERSHIP_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
      
      if (matchedKeywords.length > 0) {
        posts.push({
          id: item.guid || item.link,
          platform: "indiehackers",
          title: item.title,
          content: item.contentSnippet || "",
          author: item.creator || "unknown",
          url: item.link,
          createdAt: new Date(pubDate),
          matchedKeywords,
        });
      }
    }
  } catch (err) {
    logger.warn("Failed to fetch Indie Hackers:", err.message);
  }
  
  return posts;
};

/**
 * Fetch posts from Leadership RSS Blogs (HBR, First Round, etc.)
 */
const LEADERSHIP_RSS_FEEDS = [
  // Working feeds as of 2026-03
  { name: "Lara Hogan", url: "https://larahogan.me/feed.xml" },
  { name: "Seth Godin", url: "https://seths.blog/feed/" },
  { name: "MIT Sloan Review", url: "https://sloanreview.mit.edu/feed/" },
  { name: "Know Your Team", url: "https://knowyourteam.com/blog/feed/" },
  // Note: HBR, First Round Review, Manager's Handbook feeds are no longer available
];

const fetchLeadershipBlogPosts = async (maxAge = 48) => {
  const posts = [];
  const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);
  
  for (const blog of LEADERSHIP_RSS_FEEDS) {
    try {
      const feed = await rssParser.parseURL(blog.url);
      
      for (const item of feed.items || []) {
        const pubDate = new Date(item.pubDate || item.isoDate).getTime();
        if (pubDate < cutoffTime) continue;
        
        // Leadership blogs are pre-qualified, but still check keywords for relevance
        const text = `${item.title || ""} ${item.contentSnippet || ""}`.toLowerCase();
        const matchedKeywords = LEADERSHIP_KEYWORDS.filter(kw => text.includes(kw.toLowerCase()));
        
        // Include all from leadership blogs even without keyword match
        posts.push({
          id: item.guid || item.link,
          platform: "rss",
          source: blog.name,
          title: item.title,
          content: item.contentSnippet || "",
          author: item.creator || blog.name,
          url: item.link,
          createdAt: new Date(pubDate),
          matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : ["leadership blog"],
        });
      }
    } catch (err) {
      logger.warn(`Failed to fetch ${blog.name}:`, err.message);
    }
  }
  
  return posts;
};

/**
 * Fetch posts from ALL platforms
 */
const fetchAllPlatformPosts = async (maxAge = 48) => {
  logger.info("Fetching from all 7 platforms...");
  
  const [reddit, hackernews, stackexchange, devto, medium, indiehackers, rss] = await Promise.all([
    fetchRedditPosts(LEADERSHIP_SUBREDDITS, maxAge),
    fetchHackerNewsPosts(maxAge),
    fetchStackExchangePosts(maxAge),
    fetchDevToPosts(maxAge),
    fetchMediumPosts(maxAge),
    fetchIndieHackersPosts(maxAge),
    fetchLeadershipBlogPosts(maxAge),
  ]);
  
  logger.info(`Fetched: Reddit=${reddit.length}, HN=${hackernews.length}, SE=${stackexchange.length}, Dev.to=${devto.length}, Medium=${medium.length}, IH=${indiehackers.length}, RSS=${rss.length}`);
  
  return [...reddit, ...hackernews, ...stackexchange, ...devto, ...medium, ...indiehackers, ...rss];
};

/**
 * Generate AI response for a post using Gemini
 */
const generateSocialResponse = async (post, genAI) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `You are helping respond to social media posts about leadership development.

ABOUT LEADERREPS:
LeaderReps is a leadership professional development platform offering cohort-based 8-week leadership programs, daily practices, AI coaching, and community events.

CURRENT PROMOTION - COACHING THE COACHES WEBINAR:
"Why Feedback Fails" - A FREE 60-minute working session on giving effective feedback.
URL: https://www.leaderreps.com/coaching-the-coaches

CLEAR Framework for feedback:
- Check: Make sure they're open to feedback
- Label: Give them a headline  
- Evidence: Describe only what a camera would record
- Anchor: Connect the behavior to the impact
- Request: Be clear about what you want moving forward

RESPONSE GUIDELINES:
1. First, genuinely address the person's question or pain point
2. Provide actionable value they can use immediately
3. Keep the tone conversational and authentic - NOT salesy
4. Only mention LeaderReps/the webinar if genuinely relevant
5. Keep responses concise - 2-3 short paragraphs max
6. Match the platform's tone (Reddit = casual)

---
Platform: Reddit (r/${post.subreddit}) - use casual, helpful tone, don't be promotional

POST TO RESPOND TO:
Author: ${post.author}
Title: ${post.title}
Content: ${post.content}
---

Generate a helpful, authentic response to this post.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error(`Gemini error for ${post.id}:`, err.message);
    return null;
  }
};

/**
 * AI-based relevance check - determines if a post is actually about leadership development
 * Returns true if the post is relevant, false otherwise
 */
const checkLeadershipRelevance = async (post, genAI) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = `You are a content classifier for a leadership development platform.

WHAT WE ARE LOOKING FOR (RELEVANT):
- People asking for advice on managing/leading teams
- Questions about giving feedback, difficult conversations, coaching employees
- New managers seeking guidance on leadership skills
- People struggling with team dynamics, delegation, motivation
- Questions about leadership training or development programs
- Posts about executive presence, influence, or leadership style
- HR professionals discussing people management challenges

WHAT WE ARE NOT LOOKING FOR (IRRELEVANT):
- Generic career advice (salary negotiation, job searching, resumes)
- Technical questions about project management tools/software
- Posts about "being a leader" in gaming, sports, or competitions
- Job postings or hiring announcements
- Pure rants/venting without asking for advice
- Questions about becoming a manager (job hunting), not being a manager (skill development)
- Posts where "manager" or "leader" is used in a non-leadership context (e.g., "package manager", "project leader" as job title)

---
POST TO EVALUATE:
Title: ${post.title}
Content: ${post.content}
Subreddit: r/${post.subreddit}
---

Is this post genuinely about leadership development, managing people, or becoming a better leader where we could provide valuable advice?

Reply with ONLY "YES" or "NO" followed by a brief reason (10 words max).
Example: "YES - asking for feedback advice"
Example: "NO - job posting not seeking advice"`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim().toUpperCase();
    const isRelevant = response.startsWith("YES");
    logger.info(`Relevance check for "${post.title.substring(0, 50)}...": ${response}`);
    return isRelevant;
  } catch (err) {
    logger.warn(`Relevance check failed for ${post.id}, including by default:`, err.message);
    return true; // Include on error to avoid missing content
  }
};

/**
 * Build HTML email body
 */
const buildSocialMonitorEmail = (posts, responses) => {
  // Distinct colors for all 7 platforms
  const platformColors = { 
    reddit: "#FF4500",       // Reddit orange
    hackernews: "#FF6600",   // HN orange
    stackexchange: "#F48024", // Stack orange
    devto: "#0A0A0A",        // Dev.to black
    medium: "#00AB6C",       // Medium green
    indiehackers: "#1F64D5", // IH blue
    rss: "#8B5CF6",          // RSS purple (leadership blogs)
  };
  
  let postsHtml = "";
  for (const post of posts) {
    if (!post) continue; // Skip undefined posts
    
    const response = responses[post.id];
    const badgeColor = platformColors[post.platform] || "#666666";
    const postUrl = post.url || "#";
    const createdDate = post.createdAt instanceof Date && !isNaN(post.createdAt) 
      ? post.createdAt.toLocaleDateString() 
      : "Recent";
    
    postsHtml += `
      <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 4px solid ${badgeColor};">
        <div style="margin-bottom: 8px;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; color: white; background: ${badgeColor}; text-transform: uppercase;">
            ${post.platform === "rss" ? (post.source || "Blog") : post.platform === "stackexchange" ? "Stack Exchange" : post.platform === "hackernews" ? "Hacker News" : post.platform === "devto" ? "Dev.to" : post.platform === "indiehackers" ? "Indie Hackers" : (post.platform || "unknown")}
          </span>
          ${post.subreddit ? `<span style="color: #666; margin-left: 8px;">r/${post.subreddit}</span>` : ""}
        </div>
        <h3 style="margin: 8px 0; color: #002E47; font-size: 16px;">
          <a href="${postUrl}" style="color: #002E47; text-decoration: none;">${post.title || "View Post"}</a>
        </h3>
        <p style="color: #666; font-size: 13px; margin: 8px 0;">
          By ${post.author || "unknown"} • ${createdDate}
        </p>
        <p style="color: #333; margin: 8px 0; font-size: 14px;">
          ${(post.content || "").substring(0, 300)}${(post.content || "").length > 300 ? "..." : ""}
        </p>
        ${response ? `
          <div style="background: #E8F5E9; padding: 12px; border-radius: 6px; margin-top: 12px;">
            <p style="color: #2E7D32; font-weight: bold; margin: 0 0 8px 0; font-size: 13px;">💡 Suggested Response:</p>
            <p style="color: #333; margin: 0; font-size: 13px; white-space: pre-wrap;">${response}</p>
          </div>
        ` : ""}
        <a href="${postUrl}" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: #47A88D; color: white; text-decoration: none; border-radius: 6px; font-size: 13px;">
          View & Respond →
        </a>
      </div>
    `;
  }
  
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #002E47; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 22px;">🎯 Leadership Content Finder</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">${posts.length} new leadership discussions found</p>
    </div>
    <div style="background: #f1f5f9; padding: 20px; border-radius: 0 0 8px 8px;">
      ${postsHtml}
    </div>
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      <p style="margin: 0;">Social Media Monitor for LeaderReps</p>
      <p style="margin: 4px 0;"><a href="https://www.leaderreps.com" style="color: #47A88D;">www.leaderreps.com</a></p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Callable function to run social media monitor on demand
 * 
 * Features:
 * - Deduplication: Tracks sent posts in Firestore to avoid re-sending
 * - Per-subscriber filtering: Each subscriber only gets posts for their selected platforms
 * - AI responses: Gemini generates contextual reply suggestions
 */
exports.runSocialMediaMonitor = onCall({ 
  cors: true, 
  region: "us-central1",
  timeoutSeconds: 180,
  memory: "512MiB"
}, async (request) => {
  // Verify admin
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in");
  }
  
  const userEmail = request.auth.token.email?.toLowerCase();
  const adminDoc = await db.collection("metadata").doc("config").get();
  const adminEmails = (adminDoc.exists && adminDoc.data().adminemails) || [];
  const isAdmin = adminEmails.some(e => e.toLowerCase() === userEmail);
  
  if (!isAdmin) {
    throw new HttpsError("permission-denied", "Admin access required");
  }
  
  const { testMode = false, recipientEmail, forceResend = false } = request.data || {};
  
  logger.info("Social media monitor triggered", { userEmail, testMode, forceResend });
  
  try {
    // 1. Fetch posts from ALL 7 platforms
    logger.info("Fetching posts from all platforms...");
    const posts = await fetchAllPlatformPosts(48); // 48 hours
    logger.info(`Found ${posts.length} matching posts across all platforms`);
    
    if (posts.length === 0) {
      return { success: true, message: "No matching posts found", postsFound: 0, newPosts: 0, emailsSent: 0 };
    }
    
    // 2. Deduplication - filter out posts already sent
    const sentPostsDoc = await db.doc("config/social-monitor-sent-posts").get();
    const sentPostIds = sentPostsDoc.exists ? (sentPostsDoc.data().postIds || []) : [];
    const sentPostsSet = new Set(sentPostIds);
    
    let newPosts = posts;
    if (!forceResend) {
      newPosts = posts.filter(p => !sentPostsSet.has(p.id));
      logger.info(`Filtered to ${newPosts.length} new posts (${posts.length - newPosts.length} already sent)`);
    }
    
    if (newPosts.length === 0) {
      return { 
        success: true, 
        message: "All posts have already been sent", 
        postsFound: posts.length, 
        newPosts: 0, 
        emailsSent: 0 
      };
    }
    
    // Limit to 15 posts for initial processing
    let limitedPosts = newPosts.slice(0, 15);
    
    // 3. AI Relevance Check - filter to only truly leadership-relevant posts
    const geminiKey = process.env.GEMINI_API_KEY;
    const responses = {};
    
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      
      // First pass: check relevance of each post
      logger.info("Checking AI relevance of posts...");
      const relevantPosts = [];
      for (const post of limitedPosts) {
        const isRelevant = await checkLeadershipRelevance(post, genAI);
        if (isRelevant) {
          relevantPosts.push(post);
        }
      }
      logger.info(`${relevantPosts.length}/${limitedPosts.length} posts passed AI relevance check`);
      
      // Update limitedPosts to only relevant ones
      limitedPosts = relevantPosts;
      
      if (limitedPosts.length === 0) {
        return {
          success: true,
          message: `Found ${posts.length} keyword matches, but none were relevant to leadership development after AI review`,
          postsFound: posts.length,
          newPosts: 0,
          emailsSent: 0,
        };
      }
      
      // Second pass: generate responses for relevant posts
      logger.info("Generating AI responses for relevant posts...");
      for (const post of limitedPosts) {
        const response = await generateSocialResponse(post, genAI);
        if (response) {
          responses[post.id] = response;
        }
      }
      logger.info(`Generated ${Object.keys(responses).length} responses`);
    }
    
    // 4. Get subscriptions or use provided recipient
    let recipients = [];
    
    if (recipientEmail) {
      recipients = [{ email: recipientEmail, platforms: ["reddit"] }];
    } else {
      const subsDoc = await db.doc("config/social-monitor-subscriptions").get();
      if (subsDoc.exists) {
        const subs = subsDoc.data().subscriptions || [];
        recipients = subs.filter(s => s.enabled !== false && s.email);
      }
    }
    
    // Fallback to requesting user
    if (recipients.length === 0) {
      recipients = [{ email: userEmail, platforms: ["reddit"] }];
    }
    
    // 4. Send emails
    if (!testMode) {
      const emailUser = process.env.NODEMAILER_EMAIL;
      const emailPass = process.env.NODEMAILER_PASSWORD;
      
      if (emailUser && emailPass) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: emailUser, pass: emailPass },
        });
        
        const htmlBody = buildSocialMonitorEmail(limitedPosts, responses);
        
        for (const recipient of recipients) {
          await transporter.sendMail({
            from: `"LeaderReps Social Monitor" <${emailUser}>`,
            to: recipient.email,
            subject: `🎯 [Leadership Finder] ${limitedPosts.length} new discussions found`,
            html: htmlBody,
          });
          logger.info(`Email sent to ${recipient.email}`);
        }
      }
    }
    
    // 5. Mark posts as sent (for deduplication)
    if (!testMode && limitedPosts.length > 0) {
      const newSentIds = limitedPosts.map(p => p.id);
      // Keep last 500 sent post IDs (rolling window)
      const allSentIds = [...new Set([...newSentIds, ...sentPostIds])].slice(0, 500);
      
      await db.doc("config/social-monitor-sent-posts").set({
        postIds: allSentIds,
        lastRun: admin.firestore.FieldValue.serverTimestamp(),
        lastRunBy: userEmail,
        lastPostCount: limitedPosts.length,
      }, { merge: true });
      
      logger.info(`Marked ${newSentIds.length} posts as sent`);
    }
    
    return {
      success: true,
      postsFound: posts.length,
      newPosts: limitedPosts.length,
      responsesGenerated: Object.keys(responses).length,
      emailsSent: testMode ? 0 : recipients.length,
      recipients: recipients.map(r => r.email),
    };
    
  } catch (err) {
    logger.error("Social media monitor failed:", err);
    throw new HttpsError("internal", `Monitor failed: ${err.message}`);
  }
});

/**
 * SCHEDULED SOCIAL MEDIA MONITOR
 * Runs every morning at 9:00 AM ET to send leadership content digests
 */
exports.scheduledSocialMediaMonitor = onSchedule(
  {
    schedule: "0 9 * * *", // 9:00 AM every day
    timeZone: "America/New_York",
    region: "us-central1",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (event) => {
    logger.info("🎯 Starting scheduled social media monitor at 9:00 AM ET");
    
    try {
      // 1. Get subscribers
      const subsDoc = await db.doc("config/social-monitor-subscriptions").get();
      if (!subsDoc.exists) {
        logger.info("No subscriptions found, skipping");
        return;
      }
      
      const subs = subsDoc.data().subscriptions || [];
      const enabledSubs = subs.filter(s => s.enabled !== false && s.email);
      
      if (enabledSubs.length === 0) {
        logger.info("No enabled subscriptions, skipping");
        return;
      }
      
      logger.info(`Found ${enabledSubs.length} enabled subscribers`);
      
      // 2. Fetch posts from ALL 7 platforms
      const posts = await fetchAllPlatformPosts(48); // 48 hours
      logger.info(`Found ${posts.length} matching posts from all platforms`);
      
      if (posts.length === 0) {
        logger.info("No posts found, skipping");
        return;
      }
      
      // 3. Deduplication - filter out posts already sent
      const sentPostsDoc = await db.doc("config/social-monitor-sent-posts").get();
      const sentPostIds = sentPostsDoc.exists ? (sentPostsDoc.data().postIds || []) : [];
      const sentPostsSet = new Set(sentPostIds);
      
      const newPosts = posts.filter(p => !sentPostsSet.has(p.id));
      logger.info(`Filtered to ${newPosts.length} new posts (${posts.length - newPosts.length} already sent)`);
      
      if (newPosts.length === 0) {
        logger.info("All posts already sent, skipping");
        return;
      }
      
      // Limit to 15 posts
      let limitedPosts = newPosts.slice(0, 15);
      
      // 4. AI Relevance Check
      const geminiKey = process.env.GEMINI_API_KEY;
      const responses = {};
      
      if (geminiKey) {
        const genAI = new GoogleGenerativeAI(geminiKey);
        
        // Check relevance
        logger.info("Checking AI relevance of posts...");
        const relevantPosts = [];
        for (const post of limitedPosts) {
          const isRelevant = await checkLeadershipRelevance(post, genAI);
          if (isRelevant) {
            relevantPosts.push(post);
          }
        }
        logger.info(`${relevantPosts.length}/${limitedPosts.length} posts passed AI relevance check`);
        
        limitedPosts = relevantPosts;
        
        if (limitedPosts.length === 0) {
          logger.info("No relevant posts after AI filter, skipping");
          return;
        }
        
        // Generate responses
        logger.info("Generating AI responses...");
        for (const post of limitedPosts) {
          const response = await generateSocialResponse(post, genAI);
          if (response) {
            responses[post.id] = response;
          }
        }
        logger.info(`Generated ${Object.keys(responses).length} responses`);
      }
      
      // 5. Send emails to each subscriber
      const emailUser = process.env.NODEMAILER_EMAIL;
      const emailPass = process.env.NODEMAILER_PASSWORD;
      
      if (!emailUser || !emailPass) {
        logger.error("Email credentials not configured");
        return;
      }
      
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailUser, pass: emailPass },
      });
      
      const htmlBody = buildSocialMonitorEmail(limitedPosts, responses);
      let emailsSent = 0;
      
      for (const sub of enabledSubs) {
        try {
          await transporter.sendMail({
            from: `"LeaderReps Social Monitor" <${emailUser}>`,
            to: sub.email,
            subject: `🎯 [Leadership Finder] ${limitedPosts.length} new discussions found`,
            html: htmlBody,
          });
          logger.info(`Email sent to ${sub.email}`);
          emailsSent++;
        } catch (emailErr) {
          logger.error(`Failed to send to ${sub.email}:`, emailErr.message);
        }
      }
      
      // 6. Mark posts as sent
      if (limitedPosts.length > 0) {
        const newSentIds = limitedPosts.map(p => p.id);
        const allSentIds = [...new Set([...newSentIds, ...sentPostIds])].slice(0, 500);
        
        await db.doc("config/social-monitor-sent-posts").set({
          postIds: allSentIds,
          lastRun: admin.firestore.FieldValue.serverTimestamp(),
          lastRunBy: "scheduled-function",
          lastPostCount: limitedPosts.length,
        }, { merge: true });
      }
      
      logger.info(`✅ Scheduled social media monitor complete: ${limitedPosts.length} posts sent to ${emailsSent} subscribers`);
      
    } catch (err) {
      logger.error("Scheduled social media monitor failed:", err);
    }
  }
);

// ============================================================================
// LEADERSHIP ASSESSMENT ENGINE
// ============================================================================

const LEADERSHIP_DIMENSIONS_DATA = {
  vision: {
    name: 'Vision & Strategy',
    shortName: 'Visionary',
    icon: '🔭',
    color: '#8B5CF6',
    description: 'You see the big picture and inspire others with a compelling future.',
  },
  people: {
    name: 'People & Empathy',
    shortName: 'Connector',
    icon: '💚',
    color: '#10B981',
    description: 'You lead through relationships and genuine care.',
  },
  execution: {
    name: 'Execution & Drive',
    shortName: 'Driver',
    icon: '🎯',
    color: '#EF4444',
    description: 'You turn plans into results.',
  },
  communication: {
    name: 'Communication',
    shortName: 'Communicator',
    icon: '🎙️',
    color: '#F59E0B',
    description: 'You excel at getting ideas across clearly and persuasively.',
  },
  adaptability: {
    name: 'Adaptability',
    shortName: 'Navigator',
    icon: '🌊',
    color: '#06B6D4',
    description: 'You thrive in change and help others navigate uncertainty.',
  },
  innovation: {
    name: 'Innovation & Growth',
    shortName: 'Innovator',
    icon: '💡',
    color: '#EC4899',
    description: 'You challenge the status quo and find creative solutions.',
  },
};

/**
 * Generate personalized AI insights for leadership assessment
 */
const generateLeadershipInsights = async (results, firstName) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    logger.warn("No Gemini API key - using fallback insights");
    return null;
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const topDims = results.topDimensions || [];
  const scores = results.scores || {};
  const archetype = results.archetypeData?.name || "Balanced Leader";

  const prompt = `You are a world-class executive coach providing personalized feedback to ${firstName || "a leader"}.

Based on their Leadership DNA Assessment results:
- Archetype: ${archetype}
- Top strengths: ${topDims.map(d => LEADERSHIP_DIMENSIONS_DATA[d]?.name).join(', ')}
- Dimension scores: ${Object.entries(scores).map(([k, v]) => `${LEADERSHIP_DIMENSIONS_DATA[k]?.name}: ${v}%`).join(', ')}

Write a personalized coaching insight (250-300 words) that:
1. Celebrates their unique leadership combination
2. Provides one specific strength to double down on
3. Identifies one growth opportunity with actionable advice
4. Ends with an inspiring call to action

Be warm, specific, and actionable. Use "you" language. Don't use headings or bullet points - make it feel like a personal letter from a mentor.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error("Gemini insight generation failed:", err.message);
    return null;
  }
};

/**
 * Build beautiful HTML email for assessment results
 */
const buildAssessmentEmail = (firstName, results, aiInsights) => {
  const archetype = results.archetypeData || {};
  const sortedDimensions = results.sortedDimensions || [];
  const scores = results.scores || {};
  
  const dimensionBars = sortedDimensions.map(([dim, score]) => {
    const data = LEADERSHIP_DIMENSIONS_DATA[dim];
    return `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #fff; font-weight: 500;">${data.icon} ${data.name}</span>
          <span style="color: rgba(255,255,255,0.7);">${score}%</span>
        </div>
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; height: 8px; overflow: hidden;">
          <div style="background: ${data.color}; height: 100%; width: ${score}%; border-radius: 8px;"></div>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Leadership DNA Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #002E47 0%, #001a2b 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <div style="display: inline-block; padding: 8px 16px; background: rgba(71,168,141,0.2); border-radius: 20px; color: #47A88D; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
        ✨ YOUR RESULTS ARE READY
      </div>
      <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 700;">
        Hi ${firstName || 'Leader'}, here's your<br/>Leadership DNA
      </h1>
    </div>
    
    <!-- Archetype Card -->
    <div style="background: linear-gradient(135deg, #002E47 0%, #003d5c 100%); padding: 32px; text-align: center;">
      <div style="color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        Your Leadership Archetype
      </div>
      <h2 style="margin: 0 0 8px 0; color: #fff; font-size: 24px; font-weight: 700;">
        ${archetype.name || 'Leadership Excellence'}
      </h2>
      <p style="margin: 0 0 12px 0; color: #47A88D; font-size: 14px; font-weight: 600;">
        ${archetype.tagline || ''}
      </p>
      ${archetype.superpower ? `
      <div style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 20px; color: #fff; font-size: 13px; margin-bottom: 16px;">
        ⚡ Superpower: <strong>${archetype.superpower}</strong>
      </div>
      ` : ''}
      <p style="margin: 0 0 12px 0; color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.6;">
        ${archetype.description || ''}
      </p>
      ${archetype.famousLeaders ? `
      <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 12px;">
        Similar leaders: ${archetype.famousLeaders.join(', ')}
      </p>
      ` : ''}
    </div>
    
    <!-- Dimensions -->
    <div style="background: #002E47; padding: 24px;">
      <h3 style="margin: 0 0 20px 0; color: #fff; font-size: 16px; font-weight: 600;">
        Your Leadership Dimensions
      </h3>
      ${dimensionBars}
    </div>
    
    <!-- AI Insights -->
    ${aiInsights ? `
    <div style="background: linear-gradient(135deg, #002E47 0%, #003d5c 100%); padding: 24px;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <span style="margin-right: 8px;">✨</span>
        <h3 style="margin: 0; color: #fff; font-size: 16px; font-weight: 600;">
          Personalized Insights
        </h3>
      </div>
      <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 14px; line-height: 1.7; white-space: pre-wrap;">
${aiInsights}
      </p>
    </div>
    ` : ''}
    
    <!-- CTA -->
    <div style="background: linear-gradient(135deg, #47A88D 0%, #3a8a73 100%); padding: 32px; text-align: center; border-radius: 0 0 16px 16px;">
      <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 20px; font-weight: 700;">
        Ready to Level Up?
      </h3>
      <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        Join our 8-week leadership development program and go from knowing your strengths to mastering them.
      </p>
      <a href="https://www.leaderreps.com" style="display: inline-block; padding: 14px 28px; background: #fff; color: #002E47; font-weight: 700; text-decoration: none; border-radius: 10px; font-size: 14px;">
        Explore LeaderReps Programs →
      </a>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.5); font-size: 12px;">
        © 2026 LeaderReps. All rights reserved.
      </p>
      <a href="https://www.leaderreps.com" style="color: #47A88D; font-size: 12px; text-decoration: none;">
        www.leaderreps.com
      </a>
    </div>
    
  </div>
</body>
</html>`;
};

/**
 * Cloud Function: Analyze leadership assessment and send results email
 * Called from the assessment app after email capture
 */
exports.analyzeLeadershipAssessment = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: true, // Enable CORS for browser requests
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    // Set CORS headers for actual request
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { email, firstName, answers, results } = req.body;

    if (!email || !results) {
      res.status(400).json({ error: 'Missing required fields: email and results' });
      return;
    }

    logger.info(`Processing leadership assessment for ${email}`);

    try {
      // 1. Generate AI insights
      const aiInsights = await generateLeadershipInsights(results, firstName);
      logger.info(`AI insights generated: ${aiInsights ? 'yes' : 'no'}`);

      // 2. Send email FIRST (before Firestore which can fail on complex objects)
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      let emailSent = false;

      if (emailUser && emailPass) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: emailUser, pass: emailPass },
        });

        const htmlEmail = buildAssessmentEmail(firstName, results, aiInsights);

        await transporter.sendMail({
          from: `"LeaderReps" <arena@leaderreps.com>`,
          to: email,
          subject: `🎯 ${firstName ? firstName + ', your' : 'Your'} Leadership DNA Results Are Ready`,
          html: htmlEmail,
        });
        
        emailSent = true;
        logger.info(`Results email sent to ${email}`);
      } else {
        logger.warn("Email credentials not configured - skipping email");
      }

      // 3. Store the lead in Firestore (sanitized data)
      // Flatten results to avoid Firestore nested entity issues
      const sanitizedResults = {
        scores: results.scores || {},
        topDimensions: results.topDimensions || [],
        archetype: results.archetype || 'balanced-leader',
        archetypeName: results.archetypeData?.name || '',
      };

      logger.info(`Attempting to store lead for ${email}...`);
      try {
        const docRef = await db.collection('assessment-leads').add({
          email: email.toLowerCase(),
          firstName: firstName || '',
          results: sanitizedResults,
          aiInsights: aiInsights || null,
          source: 'leadership-dna-assessment',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          marketingOptIn: true,
          emailSent,
        });
        logger.info(`Lead stored successfully for ${email}, docId: ${docRef.id}`);
      } catch (firestoreErr) {
        logger.error(`Firestore write FAILED for ${email}:`, firestoreErr);
      }

      // Return insights to display on results page
      res.json({
        success: true,
        aiInsights: aiInsights || null,
        message: 'Assessment processed successfully',
      });

    } catch (err) {
      logger.error("Assessment processing failed:", err);
      res.status(500).json({ error: 'Processing failed', details: err.message });
    }
  }
);

// ===========================================
// ROI Calculator Functions
// ===========================================

/**
 * Generate personalized AI insights for ROI calculation
 */
const generateROIInsights = async (inputs, results) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    logger.warn("No Gemini API key - using fallback ROI insights");
    return null;
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Use results.totalInvestment (calculated value) since inputs only has investmentPerLeader
  const totalInvestment = results.totalInvestment || (inputs.investmentPerLeader * inputs.numLeaders) || 0;

  const prompt = `You are a strategic business consultant helping a ${inputs.title || 'business leader'} at ${inputs.company || 'their organization'} build the business case for leadership development investment.

ROI Calculation Results:
- Industry: ${inputs.industry || 'General'}
- Number of Leaders: ${inputs.numLeaders || 10}
- Employees Impacted: ${(inputs.numLeaders || 10) * (inputs.teamSize || 8)}
- Current Turnover Rate: ${inputs.turnoverRate || 15}%
- Total Investment: $${totalInvestment.toLocaleString()}
- Projected Annual Savings: $${(results.totalAnnualSavings || 0).toLocaleString()}
- ROI: ${results.roiPercentage || 0}%
- Payback Period: ${results.paybackMonths || 0} months

Breakdown:
- Turnover Savings: $${(results.turnoverSavings || 0).toLocaleString()}
- Productivity Gains: $${(results.productivityGains || 0).toLocaleString()}
- Absenteeism Reduction: $${(results.absenteeismSavings || 0).toLocaleString()}
- Engagement Value: $${(results.engagementValue || 0).toLocaleString()}

Write a personalized executive summary (200-250 words) that:
1. Highlights the most compelling ROI insight for their specific industry
2. Provides 2-3 key talking points they can use to present this to stakeholders
3. Identifies the biggest risk of NOT investing in leadership development
4. Ends with a clear next step recommendation

Use confident, professional language appropriate for a boardroom presentation. Be specific with numbers. Make them feel confident presenting this case.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error("Gemini ROI insight generation failed:", err.message);
    return null;
  }
};

/**
 * Build beautiful HTML email for ROI Calculator results
 */
const buildROIEmail = (firstName, inputs, results, aiInsights) => {
  const formatCurrency = (num) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num || 0);

  // Calculate totalInvestment from results or derive from inputs
  const totalInvestment = results.totalInvestment || (inputs.investmentPerLeader * inputs.numLeaders) || 0;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #002E47 0%, #003d5c 100%); padding: 40px 30px; text-align: center;">
      <img src="https://leaderreps.com/logo-white.png" alt="LeaderReps" style="height: 40px; margin-bottom: 20px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
        Your Leadership ROI Report
      </h1>
      <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0; font-size: 16px;">
        ${firstName ? `${firstName}, here's` : "Here's"} your personalized ROI analysis
      </p>
    </div>

    <!-- Main Stats -->
    <div style="padding: 30px;">
      <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 20px;">
        <p style="color: rgba(255,255,255,0.8); margin: 0 0 5px; font-size: 14px;">Projected Annual Savings</p>
        <p style="color: #ffffff; margin: 0; font-size: 42px; font-weight: 700;">${formatCurrency(results.totalAnnualSavings)}</p>
        <p style="color: rgba(255,255,255,0.7); margin: 10px 0 0; font-size: 13px;">
          Range: ${formatCurrency(results.savingsRange.conservative)} – ${formatCurrency(results.savingsRange.optimistic)}
        </p>
      </div>

      <div style="display: flex; gap: 15px;">
        <div style="flex: 1; background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #64748b; margin: 0 0 5px; font-size: 12px;">ROI</p>
          <p style="color: #002E47; margin: 0; font-size: 28px; font-weight: 700;">${results.roiPercentage}%</p>
        </div>
        <div style="flex: 1; background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #64748b; margin: 0 0 5px; font-size: 12px;">Payback</p>
          <p style="color: #002E47; margin: 0; font-size: 28px; font-weight: 700;">${results.paybackMonths} mo</p>
        </div>
      </div>
    </div>

    <!-- Details -->
    <div style="padding: 0 30px 30px;">
      <h3 style="color: #002E47; margin: 0 0 15px; font-size: 18px;">Your Input Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Industry</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #002E47; font-weight: 500;">${inputs.industry}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Leaders in Program</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #002E47; font-weight: 500;">${inputs.numLeaders}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Employees Impacted</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #002E47; font-weight: 500;">${inputs.numLeaders * inputs.teamSize}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Current Turnover</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #002E47; font-weight: 500;">${inputs.turnoverRate}%</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #64748b;">Investment</td>
          <td style="padding: 10px 0; text-align: right; color: #002E47; font-weight: 500;">${formatCurrency(totalInvestment)}</td>
        </tr>
      </table>
    </div>

    <!-- Breakdown -->
    <div style="padding: 0 30px 30px;">
      <h3 style="color: #002E47; margin: 0 0 15px; font-size: 18px;">Savings Breakdown</h3>
      <div style="background: #002E47; border-radius: 12px; padding: 20px;">
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: rgba(255,255,255,0.7); font-size: 13px;">Turnover Cost Savings</span>
            <span style="color: #10B981; font-weight: 600;">${formatCurrency(results.turnoverSavings)}</span>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: rgba(255,255,255,0.7); font-size: 13px;">Productivity Gains</span>
            <span style="color: #06B6D4; font-weight: 600;">${formatCurrency(results.productivityGains)}</span>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: rgba(255,255,255,0.7); font-size: 13px;">Absenteeism Reduction</span>
            <span style="color: #fbbf24; font-weight: 600;">${formatCurrency(results.absenteeismSavings)}</span>
          </div>
        </div>
        <div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: rgba(255,255,255,0.7); font-size: 13px;">Engagement Value</span>
            <span style="color: #E04E1B; font-weight: 600;">${formatCurrency(results.engagementValue)}</span>
          </div>
        </div>
      </div>
    </div>

    ${aiInsights ? `
    <!-- AI Insights -->
    <div style="padding: 0 30px 30px;">
      <h3 style="color: #002E47; margin: 0 0 15px; font-size: 18px;">💡 Executive Summary</h3>
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border-left: 4px solid #47A88D;">
        <p style="color: #334155; margin: 0; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${aiInsights}</p>
      </div>
    </div>
    ` : ''}

    <!-- CTA -->
    <div style="padding: 0 30px 40px; text-align: center;">
      <a href="https://leaderreps.com/programs" style="display: inline-block; background: #47A88D; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
        Explore Our Programs →
      </a>
      <p style="color: #64748b; margin: 20px 0 0; font-size: 13px;">
        Ready to realize these savings? Let's discuss how we can help.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} LeaderReps. Developing exceptional leaders.<br>
        <a href="https://leaderreps.com" style="color: #47A88D;">leaderreps.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Cloud Function: Process ROI Calculator submission and send results email
 * Called from the ROI calculator app after email capture
 */
exports.processROICalculator = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: true,
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    res.set('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { email, firstName, lastName, company, title, inputs, results } = req.body;

    if (!email || !inputs || !results) {
      res.status(400).json({ error: 'Missing required fields: email, inputs, and results' });
      return;
    }

    logger.info(`Processing ROI calculator for ${email}`);

    try {
      // 1. Generate AI insights
      const aiInsights = await generateROIInsights(
        { ...inputs, company, title },
        results
      );
      logger.info(`AI ROI insights generated: ${aiInsights ? 'yes' : 'no'}`);

      // 2. Send email
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      let emailSent = false;

      if (emailUser && emailPass) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: emailUser, pass: emailPass },
        });

        const htmlEmail = buildROIEmail(firstName, inputs, results, aiInsights);

        await transporter.sendMail({
          from: `"LeaderReps" <arena@leaderreps.com>`,
          to: email,
          subject: `📊 ${firstName ? firstName + ', your' : 'Your'} Leadership ROI Report: ${results.roiPercentage}% Return`,
          html: htmlEmail,
        });
        
        emailSent = true;
        logger.info(`ROI report email sent to ${email}`);
      } else {
        logger.warn("Email credentials not configured - skipping email");
      }

      // 3. Store lead in Firestore
      try {
        const docRef = await db.collection('roi-calculator-leads').add({
          email: email.toLowerCase(),
          firstName: firstName || '',
          lastName: lastName || '',
          company: company || '',
          title: title || '',
          inputs: inputs,
          results: {
            totalAnnualSavings: results.totalAnnualSavings,
            roiPercentage: results.roiPercentage,
            paybackMonths: results.paybackMonths,
            turnoverSavings: results.turnoverSavings,
            productivityGains: results.productivityGains,
            absenteeismSavings: results.absenteeismSavings,
            engagementValue: results.engagementValue,
            totalInvestment: results.totalInvestment,
          },
          aiInsights: aiInsights || null,
          source: 'roi-calculator',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          marketingOptIn: true,
          emailSent,
        });
        logger.info(`ROI lead stored successfully for ${email}, docId: ${docRef.id}`);
      } catch (firestoreErr) {
        logger.error(`Firestore write FAILED for ROI lead ${email}:`, firestoreErr);
      }

      res.json({
        success: true,
        aiInsights: aiInsights || null,
        message: 'ROI calculation processed successfully',
      });

    } catch (err) {
      logger.error("ROI calculator processing failed:", err);
      res.status(500).json({ error: 'Processing failed', details: err.message });
    }
  }
);

// ===========================================
// Accountability Assessment Functions
// ===========================================

/**
 * Accountability dimensions data for AI insights and email generation
 */
const ACCOUNTABILITY_DIMENSIONS_DATA = {
  ownership: {
    id: 'ownership',
    name: 'Ownership Mindset',
    icon: '🎯',
    color: '#E04E1B',
  },
  reliability: {
    id: 'reliability',
    name: 'Commitment Reliability',
    icon: '✅',
    color: '#47A88D',
  },
  transparency: {
    id: 'transparency',
    name: 'Transparent Communication',
    icon: '🔍',
    color: '#06B6D4',
  },
  standards: {
    id: 'standards',
    name: 'Standards & Expectations',
    icon: '📏',
    color: '#8B5CF6',
  },
  feedback: {
    id: 'feedback',
    name: 'Feedback & Growth',
    icon: '💪',
    color: '#10B981',
  },
};

/**
 * Generate personalized AI insights for accountability assessment
 */
const generateAccountabilityInsights = async (results, firstName) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    logger.warn("No Gemini API key - using fallback insights");
    return null;
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const topDims = results.topDimensions || [];
  const weakestDim = results.weakestDimension || 'ownership';
  const scores = results.scores || {};
  const archetype = results.archetypeData?.name || "Accountable Leader";
  const overallScore = results.overallScore || 50;
  const maturityLevel = results.maturityLevel || "Developing";

  const prompt = `You are a world-class executive coach specializing in accountability and leadership development, providing personalized feedback to ${firstName || "a leader"}.

Based on their Accountability Assessment results:
- Overall Score: ${overallScore}/100 (${maturityLevel})
- Archetype: ${archetype}
- Top strengths: ${topDims.map(d => ACCOUNTABILITY_DIMENSIONS_DATA[d]?.name).join(', ')}
- Biggest growth area: ${ACCOUNTABILITY_DIMENSIONS_DATA[weakestDim]?.name}
- Dimension scores: ${Object.entries(scores).map(([k, v]) => `${ACCOUNTABILITY_DIMENSIONS_DATA[k]?.name}: ${v}%`).join(', ')}

Write a personalized accountability coaching insight (250-300 words) that:
1. Acknowledges their current accountability level honestly but encouragingly
2. Highlights their top accountability strength and how to leverage it
3. Identifies their biggest accountability gap with one specific, actionable practice to start THIS WEEK
4. Explains how LeaderReps' 8-week program builds accountability through daily micro-practices, AI coaching, and peer accountability partners
5. Ends with an inspiring but direct call to action about choosing accountability

Be direct and honest—accountability requires facing the truth. Use "you" language. Don't use headings or bullet points - make it feel like a personal message from a tough but caring coach who believes in their potential.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error("Gemini accountability insight generation failed:", err.message);
    return null;
  }
};

/**
 * Build HTML email for accountability assessment results
 */
const buildAccountabilityAssessmentEmail = (firstName, results, aiInsights) => {
  const archetype = results.archetypeData || {};
  const sortedDimensions = results.sortedDimensions || [];
  const overallScore = results.overallScore || 50;
  const maturityLevel = results.maturityLevel || 'Developing';
  const weakestDim = results.weakestDimension || 'ownership';
  const weakestDimData = ACCOUNTABILITY_DIMENSIONS_DATA[weakestDim] || {};
  
  const dimensionBars = sortedDimensions.map(([dim, score]) => {
    const data = ACCOUNTABILITY_DIMENSIONS_DATA[dim];
    return `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span style="color: #fff; font-weight: 500;">${data.icon} ${data.name}</span>
          <span style="color: rgba(255,255,255,0.7);">${score}%</span>
        </div>
        <div style="background: rgba(255,255,255,0.1); border-radius: 8px; height: 8px; overflow: hidden;">
          <div style="background: ${data.color}; height: 100%; width: ${score}%; border-radius: 8px;"></div>
        </div>
      </div>
    `;
  }).join('');

  // Color for score
  const getScoreColor = () => {
    if (overallScore >= 80) return '#10B981';
    if (overallScore >= 65) return '#47A88D';
    if (overallScore >= 50) return '#F59E0B';
    return '#E04E1B';
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Accountability Assessment Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #002E47 0%, #001a2b 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <div style="display: inline-block; padding: 8px 16px; background: rgba(224,78,27,0.2); border-radius: 20px; color: #E04E1B; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
        🎯 YOUR ACCOUNTABILITY PROFILE
      </div>
      <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 700;">
        Hi ${firstName || 'Leader'}, here are<br/>your results
      </h1>
    </div>
    
    <!-- Score Card -->
    <div style="background: linear-gradient(135deg, #002E47 0%, #003d5c 100%); padding: 32px; text-align: center;">
      <div style="display: inline-block; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 4px solid ${getScoreColor()}; line-height: 1;">
        <div style="padding-top: 30px;">
          <span style="color: #fff; font-size: 42px; font-weight: 700;">${overallScore}</span>
          <span style="color: rgba(255,255,255,0.6); font-size: 14px; display: block;">/100</span>
        </div>
      </div>
      <div style="margin-top: 16px;">
        <span style="display: inline-block; padding: 8px 20px; background: ${getScoreColor()}; color: #fff; border-radius: 20px; font-weight: 700; font-size: 16px;">
          ${maturityLevel}
        </span>
      </div>
    </div>
    
    <!-- Archetype Card -->
    <div style="background: #002E47; padding: 24px;">
      <div style="color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        Your Accountability Archetype
      </div>
      <h2 style="margin: 0 0 8px 0; color: #fff; font-size: 22px; font-weight: 700;">
        ${archetype.name || 'Accountable Leader'}
      </h2>
      <p style="margin: 0 0 12px 0; color: #E04E1B; font-size: 14px; font-weight: 600;">
        ${archetype.tagline || ''}
      </p>
      ${archetype.superpower ? `
      <div style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 20px; color: #fff; font-size: 13px; margin-bottom: 16px;">
        ⚡ Superpower: <strong>${archetype.superpower}</strong>
      </div>
      ` : ''}
      <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.6;">
        ${archetype.description || ''}
      </p>
    </div>
    
    <!-- Dimensions -->
    <div style="background: linear-gradient(135deg, #002E47 0%, #001a2b 100%); padding: 24px;">
      <h3 style="margin: 0 0 20px 0; color: #fff; font-size: 16px; font-weight: 600;">
        Your 5 Accountability Dimensions
      </h3>
      ${dimensionBars}
    </div>
    
    <!-- Growth Focus -->
    <div style="background: #002E47; padding: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #E04E1B; font-size: 16px; font-weight: 600;">
        ⚠️ Your #1 Growth Focus
      </h3>
      <p style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">
        ${weakestDimData.icon || '🎯'} ${weakestDimData.name || 'Accountability'}
      </p>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.5;">
        This is your biggest opportunity for growth. Small improvements here will have an outsized impact on your effectiveness as a leader.
      </p>
    </div>
    
    <!-- AI Insights -->
    ${aiInsights ? `
    <div style="background: linear-gradient(135deg, #002E47 0%, #003d5c 100%); padding: 24px;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <span style="margin-right: 8px;">✨</span>
        <h3 style="margin: 0; color: #fff; font-size: 16px; font-weight: 600;">
          Your Personalized Coaching
        </h3>
      </div>
      <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 14px; line-height: 1.7; white-space: pre-wrap;">
${aiInsights}
      </p>
    </div>
    ` : ''}
    
    <!-- CTA -->
    <div style="background: linear-gradient(135deg, #E04E1B 0%, #c43d12 100%); padding: 32px; text-align: center; border-radius: 0 0 16px 16px;">
      <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 20px; font-weight: 700;">
        Ready to Build Unshakeable Accountability?
      </h3>
      <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        Join LeaderReps' 8-week program with daily accountability practices, AI coaching, and peer accountability partners.
      </p>
      <a href="https://www.leaderreps.com" style="display: inline-block; padding: 14px 28px; background: #fff; color: #002E47; font-weight: 700; text-decoration: none; border-radius: 10px; font-size: 14px;">
        Explore LeaderReps Programs →
      </a>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.5); font-size: 12px;">
        © 2026 LeaderReps. Building accountable leaders.
      </p>
      <a href="https://www.leaderreps.com" style="color: #E04E1B; font-size: 12px; text-decoration: none;">
        www.leaderreps.com
      </a>
    </div>
    
  </div>
</body>
</html>`;
};

/**
 * Cloud Function: Analyze accountability assessment and send results email
 * Called from the accountability assessment app after email capture
 */
exports.analyzeAccountabilityAssessment = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256MiB",
    cors: true,
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    res.set('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { email, firstName, answers, results } = req.body;

    if (!email || !results) {
      res.status(400).json({ error: 'Missing required fields: email and results' });
      return;
    }

    logger.info(`Processing accountability assessment for ${email}`);

    try {
      // 1. Generate AI insights
      const aiInsights = await generateAccountabilityInsights(results, firstName);
      logger.info(`AI insights generated: ${aiInsights ? 'yes' : 'no'}`);

      // 2. Send email
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      let emailSent = false;

      if (emailUser && emailPass) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: emailUser, pass: emailPass },
        });

        const htmlEmail = buildAccountabilityAssessmentEmail(firstName, results, aiInsights);

        await transporter.sendMail({
          from: `"LeaderReps" <arena@leaderreps.com>`,
          to: email,
          subject: `🎯 ${firstName ? firstName + ', your' : 'Your'} Accountability Assessment: ${results.overallScore || 0}/100`,
          html: htmlEmail,
        });
        
        emailSent = true;
        logger.info(`Accountability results email sent to ${email}`);
      } else {
        logger.warn("Email credentials not configured - skipping email");
      }

      // 3. Store the lead in Firestore
      const sanitizedResults = {
        scores: results.scores || {},
        topDimensions: results.topDimensions || [],
        weakestDimension: results.weakestDimension || '',
        archetype: results.archetype || 'balanced-accountable',
        archetypeName: results.archetypeData?.name || '',
        overallScore: results.overallScore || 0,
        maturityLevel: results.maturityLevel || '',
      };

      try {
        const docRef = await db.collection('accountability-leads').add({
          email: email.toLowerCase(),
          firstName: firstName || '',
          results: sanitizedResults,
          aiInsights: aiInsights || null,
          source: 'accountability-assessment',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          marketingOptIn: true,
          emailSent,
        });
        logger.info(`Accountability lead stored for ${email}, docId: ${docRef.id}`);
      } catch (firestoreErr) {
        logger.error(`Firestore write FAILED for ${email}:`, firestoreErr);
      }

      res.json({
        success: true,
        aiInsights: aiInsights || null,
        message: 'Accountability assessment processed successfully',
      });

    } catch (err) {
      logger.error("Accountability assessment processing failed:", err);
      res.status(500).json({ error: 'Processing failed', details: err.message });
    }
  }
);
