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
const path = require("path");
const os = require("os");
const fs = require("fs");

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
      // CTL reminders have different messaging than regular follow-ups
      const personText = reminder.person ? ` with ${reminder.person}` : '';
      const repLabel = reminder.repTypeLabel || 'Rep';
      const isCTL = reminder.isCTLReminder === true;
      
      let title, message;
      if (isCTL) {
        // Close the Loop reminder
        title = '🔄 Close the Loop Reminder';
        message = reminder.continuationNumber 
          ? `Time to check if ${reminder.person || 'they'} made the change you requested (attempt ${reminder.continuationNumber + 1}).`
          : `Time to check if ${reminder.person || 'they'} made the change you requested after your redirecting feedback.`;
      } else {
        // Standard follow-up reminder
        title = '🔔 Follow-Up Reminder';
        message = `Time to follow up on your ${repLabel} rep${personText}. Check in on progress and give additional feedback if needed.`;
      }
      
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
              url: isCTL ? '/conditioning?mode=ctl' : '/conditioning',
              type: isCTL ? 'ctl_reminder' : 'follow_up_reminder',
              repId: reminder.repId || '',
              threadId: reminder.threadId || '',
              isCTL: String(isCTL)
            }
          });
          logger.info(`${isCTL ? 'CTL' : 'Follow-up'} push sent to ${user.email} for rep ${reminder.repId}`);
        } catch (pushErr) {
          logger.warn(`${isCTL ? 'CTL' : 'Follow-up'} push failed for ${user.email}: ${pushErr.message}`);
        }
      }
      
      // Send email notification
      if (sendEmail && user.email) {
        const targetEmail = isTestUser ? (overrideEmail || null) : user.email;
        if (targetEmail) {
          const subjectPrefix = isTestUser ? `[TEST for ${user.email}] ` : '';
          const linkText = isCTL ? 'Close the Loop' : 'Check in on progress';
          const linkUrl = isCTL ? '/conditioning?mode=ctl' : '/conditioning';
          await sendEmailNotification(
            targetEmail,
            `${subjectPrefix}${title}`,
            message,
            { linkText, linkUrl }
          );
          if (isTestUser) {
            logger.info(`🧪 ${isCTL ? 'CTL' : 'Follow-up'} email redirected: ${user.email} -> ${overrideEmail}`);
          }
        } else if (isTestUser) {
          logger.info(`🧪 Test user ${user.email} has no override email, skipping ${isCTL ? 'CTL' : 'follow-up'} email`);
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
  
  // Original implementation below (disabled until 10DLC campaign approved)
  /*
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioSid || !twilioAuth || (!messagingServiceSid && !twilioFrom)) {
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
    const msgOptions = {
      body: `LeaderReps: ${message} ${linkToInclude}`,
      to: phoneNumber
    };
    if (messagingServiceSid) {
      msgOptions.messagingServiceSid = messagingServiceSid;
    } else {
      msgOptions.from = twilioFrom;
    }
    const result = await client.messages.create(msgOptions);
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

        // Sync to Kit (non-blocking)
        syncLeadToKit(email, firstName, 'leadership-dna', {
          archetype: sanitizedResults.archetype,
        }).then(kitResult => {
          if (kitResult.success) {
            docRef.update({ kitSyncedAt: admin.firestore.FieldValue.serverTimestamp(), kitSubscriberId: kitResult.subscriberId });
          }
        }).catch(err => logger.warn('Kit sync error (non-blocking):', err.message));
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

        // Sync to Kit (non-blocking)
        syncLeadToKit(email, firstName, 'roi-calculator', {
          company: company || '',
          roi_percentage: String(results.roiPercentage || ''),
        }).then(kitResult => {
          if (kitResult.success) {
            docRef.update({ kitSyncedAt: admin.firestore.FieldValue.serverTimestamp(), kitSubscriberId: kitResult.subscriberId });
          }
        }).catch(err => logger.warn('Kit sync error (non-blocking):', err.message));
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

        // Sync to Kit (non-blocking)
        syncLeadToKit(email, firstName, 'accountability', {
          archetype: sanitizedResults.archetype,
          score: String(sanitizedResults.overallScore || ''),
        }).then(kitResult => {
          if (kitResult.success) {
            docRef.update({ kitSyncedAt: admin.firestore.FieldValue.serverTimestamp(), kitSubscriberId: kitResult.subscriberId });
          }
        }).catch(err => logger.warn('Kit sync error (non-blocking):', err.message));
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

// ========================================
// Leadership Readiness Assessment Functions
// ========================================

/**
 * Leadership Readiness dimensions data for AI insights and email generation
 */
const READINESS_DIMENSIONS_DATA = {
  selfAwareness: {
    id: 'selfAwareness',
    name: 'Self-Awareness',
    icon: '🪞',
    color: '#8B5CF6',
  },
  emotionalIntelligence: {
    id: 'emotionalIntelligence',
    name: 'Emotional Intelligence',
    icon: '💛',
    color: '#F59E0B',
  },
  strategicThinking: {
    id: 'strategicThinking',
    name: 'Strategic Thinking',
    icon: '🎯',
    color: '#06B6D4',
  },
  influence: {
    id: 'influence',
    name: 'Influence & Communication',
    icon: '📢',
    color: '#E04E1B',
  },
  resilience: {
    id: 'resilience',
    name: 'Resilience & Adaptability',
    icon: '🔄',
    color: '#47A88D',
  },
};

/**
 * Generate personalized AI insights for leadership readiness assessment
 */
const generateReadinessInsights = async (results, firstName) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    logger.warn("No Gemini API key - using fallback insights");
    return null;
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const topDims = results.topDimensions || [];
  const growthArea = results.growthArea || 'selfAwareness';
  const scores = results.scores || {};
  const archetype = results.archetype || 'balanced-ready';
  const overallScore = results.overallScore || 50;
  const readinessLevel = results.readinessLevel || "Developing";

  const prompt = `You are a world-class executive coach specializing in leadership development, providing personalized feedback to ${firstName || "an aspiring leader"}.

Based on their Leadership Readiness Assessment results:
- Overall Readiness Score: ${overallScore}/100 (${readinessLevel})
- Leadership Archetype: ${archetype.replace(/-/g, ' ')}
- Top strengths: ${topDims.map(d => READINESS_DIMENSIONS_DATA[d]?.name).join(', ')}
- Biggest growth area: ${READINESS_DIMENSIONS_DATA[growthArea]?.name}
- Dimension scores: ${Object.entries(scores).map(([k, v]) => `${READINESS_DIMENSIONS_DATA[k]?.name}: ${v}%`).join(', ')}

Write a personalized leadership readiness coaching insight (250-300 words) that:
1. Honestly assesses their current readiness level with encouragement about their potential
2. Highlights their strongest leadership quality and how it sets them apart
3. Identifies their biggest development opportunity with one specific, actionable practice to start THIS WEEK
4. Explains how LeaderReps' 8-week program accelerates leadership development through daily practices, AI coaching, and real-world application
5. Ends with an inspiring call to action about stepping into their leadership potential

Be direct and supportive—great leaders embrace honest feedback. Use "you" language. Don't use headings or bullet points - make it feel like a personal letter from a mentor who sees their potential and wants to help them realize it.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    logger.error("Gemini readiness insight generation failed:", err.message);
    return null;
  }
};

/**
 * Build HTML email for leadership readiness assessment results
 */
const buildReadinessAssessmentEmail = (firstName, results, aiInsights) => {
  const sortedDimensions = results.sortedDimensions || [];
  const overallScore = results.overallScore || 50;
  const readinessLevel = results.readinessLevel || 'Developing';
  const growthArea = results.growthArea || 'selfAwareness';
  const growthDimData = READINESS_DIMENSIONS_DATA[growthArea] || {};
  const archetype = results.archetype || 'balanced-ready';
  
  const archetypeNames = {
    'self-aware-leader': 'Self-Aware Leader',
    'empathetic-connector': 'Empathetic Connector',
    'strategic-visionary': 'Strategic Visionary',
    'inspiring-influencer': 'Inspiring Influencer',
    'resilient-navigator': 'Resilient Navigator',
    'balanced-ready': 'Balanced Leader',
    'emerging-leader': 'Emerging Leader',
  };
  
  const archetypeTaglines = {
    'self-aware-leader': 'Leads from a place of authenticity and self-knowledge',
    'empathetic-connector': 'Builds bridges and brings out the best in people',
    'strategic-visionary': 'Sees around corners and charts the course forward',
    'inspiring-influencer': 'Moves people to action through powerful communication',
    'resilient-navigator': 'Thrives in chaos and leads through uncertainty',
    'balanced-ready': 'Well-rounded and ready for the next level',
    'emerging-leader': 'On the path with tremendous potential',
  };
  
  const dimensionBars = sortedDimensions.map(([dim, score]) => {
    const data = READINESS_DIMENSIONS_DATA[dim];
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
  <title>Your Leadership Readiness Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #002E47 0%, #001a2b 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <div style="display: inline-block; padding: 8px 16px; background: rgba(71,168,141,0.2); border-radius: 20px; color: #47A88D; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
        🚀 YOUR LEADERSHIP READINESS PROFILE
      </div>
      <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 700;">
        Hi ${firstName || 'Future Leader'}, here are<br/>your results
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
          ${readinessLevel}
        </span>
      </div>
    </div>
    
    <!-- Archetype Card -->
    <div style="background: #002E47; padding: 24px;">
      <div style="color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
        Your Leadership Archetype
      </div>
      <h2 style="margin: 0 0 8px 0; color: #fff; font-size: 22px; font-weight: 700;">
        ${archetypeNames[archetype] || 'Balanced Leader'}
      </h2>
      <p style="margin: 0; color: #47A88D; font-size: 14px; font-weight: 600;">
        ${archetypeTaglines[archetype] || ''}
      </p>
    </div>
    
    <!-- Dimensions -->
    <div style="background: linear-gradient(135deg, #002E47 0%, #001a2b 100%); padding: 24px;">
      <h3 style="margin: 0 0 20px 0; color: #fff; font-size: 16px; font-weight: 600;">
        Your 5 Leadership Readiness Dimensions
      </h3>
      ${dimensionBars}
    </div>
    
    <!-- Growth Focus -->
    <div style="background: #002E47; padding: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #E04E1B; font-size: 16px; font-weight: 600;">
        🎯 Your #1 Development Priority
      </h3>
      <p style="margin: 0; color: #fff; font-size: 14px; font-weight: 600;">
        ${growthDimData.icon || '🎯'} ${growthDimData.name || 'Leadership'}
      </p>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.5;">
        This is your biggest opportunity for growth. Focused development here will accelerate your leadership impact significantly.
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
    <div style="background: linear-gradient(135deg, #47A88D 0%, #3a8a73 100%); padding: 32px; text-align: center; border-radius: 0 0 16px 16px;">
      <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 20px; font-weight: 700;">
        Ready to Accelerate Your Leadership?
      </h3>
      <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        Join LeaderReps' 8-week program with daily leadership practices, AI coaching, and peer collaboration.
      </p>
      <a href="https://www.leaderreps.com" style="display: inline-block; padding: 14px 28px; background: #fff; color: #002E47; font-weight: 700; text-decoration: none; border-radius: 10px; font-size: 14px;">
        Explore LeaderReps Programs →
      </a>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px; text-align: center;">
      <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.5); font-size: 12px;">
        © 2026 LeaderReps. Building tomorrow's leaders.
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
 * Analyze Leadership Readiness Assessment
 * Called from the readiness assessment app after email capture
 */
exports.analyzeReadinessAssessment = onRequest(
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

    logger.info(`Processing leadership readiness assessment for ${email}`);

    try {
      // 1. Generate AI insights
      const aiInsights = await generateReadinessInsights(results, firstName);
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

        const htmlEmail = buildReadinessAssessmentEmail(firstName, results, aiInsights);

        await transporter.sendMail({
          from: `"LeaderReps" <arena@leaderreps.com>`,
          to: email,
          subject: `🚀 ${firstName ? firstName + ', your' : 'Your'} Leadership Readiness: ${results.overallScore || 0}/100`,
          html: htmlEmail,
        });
        
        emailSent = true;
        logger.info(`Readiness results email sent to ${email}`);
      } else {
        logger.warn("Email credentials not configured - skipping email");
      }

      // 3. Store the lead in Firestore
      const sanitizedResults = {
        scores: results.scores || {},
        topDimensions: results.topDimensions || [],
        growthArea: results.growthArea || '',
        archetype: results.archetype || 'balanced-ready',
        overallScore: results.overallScore || 0,
        readinessLevel: results.readinessLevel || '',
      };

      try {
        const docRef = await db.collection('readiness-leads').add({
          email: email.toLowerCase(),
          firstName: firstName || '',
          results: sanitizedResults,
          aiInsights: aiInsights || null,
          source: 'readiness-assessment',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          marketingOptIn: true,
          emailSent,
        });
        logger.info(`Readiness lead stored for ${email}, docId: ${docRef.id}`);

        // Sync to Kit (non-blocking)
        syncLeadToKit(email, firstName, 'readiness', {
          archetype: sanitizedResults.archetype,
          score: String(sanitizedResults.overallScore || ''),
        }).then(kitResult => {
          if (kitResult.success) {
            docRef.update({ kitSyncedAt: admin.firestore.FieldValue.serverTimestamp(), kitSubscriberId: kitResult.subscriberId });
          }
        }).catch(err => logger.warn('Kit sync error (non-blocking):', err.message));
      } catch (firestoreErr) {
        logger.error(`Firestore write FAILED for ${email}:`, firestoreErr);
      }

      res.json({
        success: true,
        aiInsights: aiInsights || null,
        message: 'Leadership readiness assessment processed successfully',
      });

    } catch (err) {
      logger.error("Readiness assessment processing failed:", err);
      res.status(500).json({ error: 'Processing failed', details: err.message });
    }
  }
);

// ============================================================
// KIT (ConvertKit) INTEGRATION
// Syncs leads to Kit for newsletter management
// ============================================================

// Tag mappings for different lead sources
const KIT_TAG_MAPPINGS = {
  'leadership-dna': 'leadership-dna-assessment',
  'accountability': 'accountability-assessment',
  'roi-calculator': 'roi-calculator',
  'readiness': 'leadership-readiness-assessment',
};

/**
 * Helper function to add a subscriber to Kit
 * @param {string} email - Subscriber email
 * @param {string} firstName - Subscriber first name
 * @param {string} source - Lead source (leadership-dna, accountability, roi-calculator, readiness)
 * @param {object} customFields - Additional custom fields to store
 * @returns {object} - Result of the Kit API call
 */
async function syncLeadToKit(email, firstName, source, customFields = {}) {
  const kitApiKey = process.env.KIT_API_KEY;

  if (!kitApiKey || kitApiKey === 'your_kit_api_key_here') {
    logger.warn('Kit API key not configured - skipping Kit sync');
    return { success: false, reason: 'not_configured' };
  }

  try {
    // Step 1: Create or update the subscriber
    // Kit v4 API uses the API Key as a Bearer token
    const subscriberResponse = await fetch('https://api.kit.com/v4/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${kitApiKey}`,
      },
      body: JSON.stringify({
        email_address: email.toLowerCase(),
        first_name: firstName || '',
        state: 'active',
        fields: {
          lead_source: source,
          ...customFields,
        },
      }),
    });

    if (!subscriberResponse.ok) {
      const errorText = await subscriberResponse.text();
      logger.error(`Kit subscriber creation failed: ${subscriberResponse.status} - ${errorText}`);
      return { success: false, reason: 'api_error', status: subscriberResponse.status };
    }

    const subscriberData = await subscriberResponse.json();
    const subscriberId = subscriberData.subscriber?.id;
    logger.info(`Kit subscriber created/updated: ${email}, id: ${subscriberId}`);

    // Step 2: Add tag based on source (if tag ID is configured)
    const tagName = KIT_TAG_MAPPINGS[source];
    if (tagName && subscriberId) {
      // Note: You'll need to create these tags in Kit and get their IDs
      // For now, we log the intent - tags can be added via Kit's tag API
      logger.info(`Kit: Would tag subscriber ${subscriberId} with '${tagName}'`);
    }

    return { 
      success: true, 
      subscriberId,
      email: email.toLowerCase(),
    };

  } catch (error) {
    logger.error('Kit sync error:', error);
    return { success: false, reason: 'exception', error: error.message };
  }
}

/**
 * Webhook endpoint for Kit unsubscribe events
 * Configure this URL in Kit: https://app.kit.com/account/webhooks
 */
exports.kitWebhook = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB",
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

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { subscriber, event_type } = req.body || {};

    if (!subscriber || !subscriber.email_address) {
      logger.warn('Kit webhook: Missing subscriber data');
      res.status(400).json({ error: 'Missing subscriber data' });
      return;
    }

    const email = subscriber.email_address.toLowerCase();
    logger.info(`Kit webhook received: ${event_type} for ${email}`);

    try {
      // Handle unsubscribe events
      if (event_type === 'subscriber.subscriber_unsubscribe' || 
          event_type === 'subscriber.complaint') {
        
        // Update lead records across all collections
        const collections = [
          'assessment-leads',
          'accountability-leads',
          'roi-calculator-leads',
          'readiness-leads',
        ];

        for (const collectionName of collections) {
          const snapshot = await db.collection(collectionName)
            .where('email', '==', email)
            .get();

          for (const doc of snapshot.docs) {
            await doc.ref.update({
              marketingOptIn: false,
              kitUnsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
              kitUnsubscribeReason: event_type,
            });
            logger.info(`Updated ${collectionName}/${doc.id} - marketing opt-out`);
          }
        }

        res.json({ success: true, message: `Processed ${event_type} for ${email}` });
      } else {
        // Log other events but don't process them
        logger.info(`Kit webhook: Unhandled event type ${event_type}`);
        res.json({ success: true, message: 'Event acknowledged' });
      }

    } catch (error) {
      logger.error('Kit webhook error:', error);
      res.status(500).json({ error: 'Processing failed', details: error.message });
    }
  }
);

/**
 * Manual sync function to push existing leads to Kit
 * Call this via Firebase console or admin panel
 */
exports.syncLeadsToKit = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 300,
    memory: "512MiB",
    cors: true,
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    res.set('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Verify admin access via ID token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userEmail = decodedToken.email?.toLowerCase();
      
      // Check if user is admin
      const adminEmails = ['rob@sagecg.com', 'admin@leaderreps.com', 'ryan@leaderreps.com'];
      if (!adminEmails.includes(userEmail)) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }
    } catch (authError) {
      logger.error('Auth verification failed:', authError);
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const { collection: collectionName, limit: syncLimit = 100 } = req.body || {};

    const collectionsToSync = collectionName 
      ? [collectionName]
      : ['assessment-leads', 'accountability-leads', 'roi-calculator-leads', 'readiness-leads'];

    const sourceMap = {
      'assessment-leads': 'leadership-dna',
      'accountability-leads': 'accountability',
      'roi-calculator-leads': 'roi-calculator',
      'readiness-leads': 'readiness',
    };

    const results = {
      synced: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };

    try {
      for (const coll of collectionsToSync) {
        // Only sync leads that opted in and haven't been synced yet
        const snapshot = await db.collection(coll)
          .where('marketingOptIn', '==', true)
          .limit(syncLimit)
          .get();

        for (const doc of snapshot.docs) {
          const data = doc.data();
          
          // Skip if already synced to Kit
          if (data.kitSyncedAt) {
            results.skipped++;
            continue;
          }

          const syncResult = await syncLeadToKit(
            data.email,
            data.firstName || data.contact?.firstName || '',
            sourceMap[coll],
            {
              archetype: data.results?.archetype || data.results?.category || '',
              score: String(data.results?.overallScore || data.results?.score || ''),
            }
          );

          if (syncResult.success) {
            // Mark as synced
            await doc.ref.update({
              kitSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
              kitSubscriberId: syncResult.subscriberId,
            });
            results.synced++;
            results.details.push({ email: data.email, status: 'synced' });
          } else if (syncResult.reason === 'not_configured') {
            results.skipped++;
            results.details.push({ email: data.email, status: 'skipped', reason: 'Kit not configured' });
          } else {
            results.failed++;
            results.details.push({ email: data.email, status: 'failed', reason: syncResult.reason });
          }

          // Rate limit: Kit allows 120 requests per minute
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }

      logger.info(`Kit sync complete: ${results.synced} synced, ${results.skipped} skipped, ${results.failed} failed`);
      res.json({
        success: true,
        ...results,
      });

    } catch (error) {
      logger.error('Kit bulk sync error:', error);
      res.status(500).json({ error: 'Sync failed', details: error.message });
    }
  }
);

// ============================================================
// BOOK BUILDER - AI DRAFT GENERATION
// Generates chapter drafts from source materials using AI
// ============================================================

exports.generateBookDraft = onCall(
  { cors: true, region: "us-central1", invoker: "public" },
  async (request) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not configured");
      throw new HttpsError('internal', 'AI service not configured');
    }

    const { chapterTitle, chapterSummary, sources, bookMetadata, mode = 'draft' } = request.data;

    if (!chapterTitle) {
      throw new HttpsError('invalid-argument', 'Chapter title is required');
    }

    // Build context from source materials
    const sourceContext = sources?.map((s, i) => 
      `--- SOURCE ${i + 1}: ${s.title} (${s.type}) ---\n${s.content?.substring(0, 8000) || '(No content)'}\n`
    ).join('\n\n') || '(No source materials provided)';

    // Build book context
    const bookContext = bookMetadata ? `
Book Title: ${bookMetadata.title || 'Untitled'}
${bookMetadata.subtitle ? `Subtitle: ${bookMetadata.subtitle}` : ''}
Target Audience: ${bookMetadata.targetAudience || 'Business leaders'}
Tone/Style: ${bookMetadata.tone || 'Professional yet conversational'}
${bookMetadata.authors?.length ? `Authors: ${bookMetadata.authors.join(', ')}` : ''}
` : '';

    // Different prompts based on mode
    let prompt = '';
    
    if (mode === 'draft') {
      prompt = `You are a professional book writer helping to draft a chapter for a leadership development book.

${bookContext}

CHAPTER TO WRITE:
Title: ${chapterTitle}
${chapterSummary ? `Summary/Direction: ${chapterSummary}` : ''}

SOURCE MATERIALS TO DRAW FROM:
${sourceContext}

INSTRUCTIONS:
1. Write a compelling chapter draft that synthesizes the source materials
2. Use a confident, authoritative voice appropriate for a business/leadership book
3. Include:
   - An engaging opening hook
   - Clear section headings (use ## for H2, ### for H3)
   - Concrete examples and actionable insights
   - A summary or key takeaways at the end
4. Target 2,000-3,000 words
5. Write in a way that's publisher-ready (Chicago Manual of Style)
6. Transform the raw source materials into polished prose
7. Don't simply quote sources - synthesize and integrate them naturally

Write the chapter now:`;
    } else if (mode === 'expand') {
      prompt = `You are a professional book editor helping to expand and develop a chapter section.

${bookContext}

CHAPTER: ${chapterTitle}

SOURCE MATERIALS:
${sourceContext}

Take the key concepts and expand them into richer, more detailed prose. Add examples, clarifications, and deeper explanations. Target 1,500-2,000 words of additional content.`;
    } else if (mode === 'refine') {
      prompt = `You are a professional book editor refining a chapter draft.

${bookContext}

CHAPTER: ${chapterTitle}

SOURCE MATERIALS (for context):
${sourceContext}

Review the following content and improve it:
1. Strengthen the prose and transitions
2. Ensure consistent tone and voice
3. Add more vivid language where appropriate
4. Improve clarity and flow
5. Keep the core content but enhance the writing quality

Content to refine:
${chapterSummary || '(No content provided)'}`;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: `You are an expert book writer specializing in leadership and business content. You write in a clear, engaging style suitable for publication. You synthesize source materials into original prose rather than simply quoting them.`
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info(`Book draft generated successfully for chapter: ${chapterTitle}`);

      return {
        success: true,
        content: text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        mode
      };
    } catch (error) {
      logger.error("Book draft generation error:", error);
      throw new HttpsError('internal', 'Failed to generate draft: ' + error.message);
    }
  }
);

// ============================================================
// BOOK BUILDER - EXPORT TO DOCX
// Generates a downloadable Word document from book content
// ============================================================

exports.exportBookToDocx = onCall(
  { cors: true, region: "us-central1", invoker: "public", memory: "512MiB" },
  async (request) => {
    const { chapters, metadata } = request.data;

    if (!chapters || !chapters.length) {
      throw new HttpsError('invalid-argument', 'Chapters are required');
    }

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType, BorderStyle } = require('docx');
      
      // Helper to parse markdown-like content into paragraphs
      const parseContentToParagraphs = (content) => {
        if (!content) return [new Paragraph({ children: [new TextRun({ text: '(No content yet)', italics: true })] })];
        
        const paragraphs = [];
        const lines = content.split('\n');
        let currentParagraph = [];
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          
          // Empty line = new paragraph
          if (!trimmedLine) {
            if (currentParagraph.length > 0) {
              paragraphs.push(new Paragraph({
                children: currentParagraph,
                spacing: { after: 200 }
              }));
              currentParagraph = [];
            }
            continue;
          }
          
          // Heading (## or ###)
          if (trimmedLine.startsWith('### ')) {
            if (currentParagraph.length > 0) {
              paragraphs.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
              currentParagraph = [];
            }
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: trimmedLine.replace(/^###\s*/, ''), bold: true, size: 26 })],
              spacing: { before: 300, after: 150 }
            }));
            continue;
          }
          
          if (trimmedLine.startsWith('## ')) {
            if (currentParagraph.length > 0) {
              paragraphs.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
              currentParagraph = [];
            }
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: trimmedLine.replace(/^##\s*/, ''), bold: true, size: 28 })],
              spacing: { before: 400, after: 200 }
            }));
            continue;
          }
          
          // Bullet point
          if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            if (currentParagraph.length > 0) {
              paragraphs.push(new Paragraph({ children: currentParagraph, spacing: { after: 200 } }));
              currentParagraph = [];
            }
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: trimmedLine.replace(/^[•\-\*]\s*/, ''), size: 24 })],
              bullet: { level: 0 },
              spacing: { after: 100 }
            }));
            continue;
          }
          
          // Bold text handling (**text**)
          if (trimmedLine.includes('**')) {
            const parts = trimmedLine.split(/\*\*([^*]+)\*\*/g);
            for (let i = 0; i < parts.length; i++) {
              if (parts[i]) {
                currentParagraph.push(new TextRun({
                  text: parts[i],
                  bold: i % 2 === 1,
                  size: 24
                }));
              }
            }
            currentParagraph.push(new TextRun({ text: ' ', size: 24 }));
            continue;
          }
          
          // Regular text
          currentParagraph.push(new TextRun({ text: trimmedLine + ' ', size: 24 }));
        }
        
        // Don't forget the last paragraph
        if (currentParagraph.length > 0) {
          paragraphs.push(new Paragraph({
            children: currentParagraph,
            spacing: { after: 200 }
          }));
        }
        
        return paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun({ text: '(No content yet)', italics: true })] })];
      };
      
      // Build document sections
      const children = [];
      
      // ===== TITLE PAGE =====
      children.push(new Paragraph({ children: [] })); // Spacer
      children.push(new Paragraph({ children: [] }));
      children.push(new Paragraph({ children: [] }));
      children.push(new Paragraph({ children: [] }));
      
      // Title
      children.push(new Paragraph({
        children: [new TextRun({
          text: metadata?.title || 'Untitled Book',
          bold: true,
          size: 72, // 36pt
          font: 'Georgia'
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }));
      
      // Subtitle
      if (metadata?.subtitle) {
        children.push(new Paragraph({
          children: [new TextRun({
            text: metadata.subtitle,
            italics: true,
            size: 36, // 18pt
            font: 'Georgia'
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 }
        }));
      }
      
      // Authors
      if (metadata?.authors?.length) {
        children.push(new Paragraph({ children: [] })); // Spacer
        children.push(new Paragraph({
          children: [new TextRun({
            text: 'By',
            size: 24,
            font: 'Georgia'
          })],
          alignment: AlignmentType.CENTER
        }));
        children.push(new Paragraph({
          children: [new TextRun({
            text: metadata.authors.join(', '),
            bold: true,
            size: 28,
            font: 'Georgia'
          })],
          alignment: AlignmentType.CENTER
        }));
      }
      
      // Page break after title
      children.push(new Paragraph({ children: [new PageBreak()] }));
      
      // ===== TABLE OF CONTENTS =====
      children.push(new Paragraph({
        children: [new TextRun({
          text: 'Table of Contents',
          bold: true,
          size: 48,
          font: 'Georgia'
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }));
      
      chapters.forEach((ch, i) => {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `Chapter ${i + 1}: `, bold: true, size: 24 }),
            new TextRun({ text: ch.title, size: 24 })
          ],
          spacing: { after: 150 }
        }));
      });
      
      // Page break after TOC
      children.push(new Paragraph({ children: [new PageBreak()] }));
      
      // ===== CHAPTERS =====
      chapters.forEach((ch, i) => {
        // Chapter number
        children.push(new Paragraph({
          children: [new TextRun({
            text: `CHAPTER ${i + 1}`,
            bold: true,
            size: 24,
            color: '666666',
            font: 'Arial'
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }));
        
        // Chapter title
        children.push(new Paragraph({
          children: [new TextRun({
            text: ch.title,
            bold: true,
            size: 48,
            font: 'Georgia'
          })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }));
        
        // Chapter summary (if exists)
        if (ch.summary) {
          children.push(new Paragraph({
            children: [new TextRun({
              text: ch.summary,
              italics: true,
              size: 26,
              color: '555555'
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }));
        }
        
        // Decorative divider
        children.push(new Paragraph({
          children: [new TextRun({ text: '———', size: 24, color: 'CCCCCC' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }));
        
        // Chapter content
        const contentParagraphs = parseContentToParagraphs(ch.content);
        children.push(...contentParagraphs);
        
        // Page break after each chapter (except the last)
        if (i < chapters.length - 1) {
          children.push(new Paragraph({ children: [new PageBreak()] }));
        }
      });
      
      // Create the document
      const doc = new Document({
        creator: 'LeaderReps Book Builder',
        title: metadata?.title || 'Untitled Book',
        description: metadata?.subtitle || '',
        styles: {
          default: {
            document: {
              run: {
                font: 'Calibri',
                size: 24 // 12pt
              }
            }
          }
        },
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440
              }
            }
          },
          children
        }]
      });
      
      // Generate the document buffer
      const buffer = await Packer.toBuffer(doc);
      const base64 = buffer.toString('base64');
      
      logger.info('Book exported successfully', {
        chapterCount: chapters.length,
        size: buffer.length
      });
      
      return {
        success: true,
        docx: base64,
        format: 'docx',
        fileName: `${(metadata?.title || 'book').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.docx`,
        size: buffer.length,
        chapterCount: chapters.length
      };
    } catch (error) {
      logger.error("Book export error:", error);
      throw new HttpsError('internal', 'Failed to export book: ' + error.message);
    }
  }
);

// ============================================================
// VIDEO TRANSCRIPTION
// Transcribes video content using Gemini's multimodal capabilities
// Uses File API for large videos (up to 2GB)
// ============================================================

exports.transcribeVideo = onCall(
  { cors: true, region: "us-central1", invoker: "public", timeoutSeconds: 540, memory: "2GiB" },
  async (request) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not configured");
      throw new HttpsError('internal', 'AI service not configured');
    }

    const { videoUrl } = request.data;
    
    if (!videoUrl) {
      throw new HttpsError('invalid-argument', 'Video URL is required');
    }

    logger.info('Starting video transcription', { videoUrl: videoUrl.substring(0, 100) });

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Check if it's a YouTube video
      const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      
      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        logger.info('YouTube video detected', { videoId });
        
        // For YouTube, Gemini can process directly with the watch URL
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: `You are a professional transcriptionist. Your task is to create an accurate, readable transcript of the video content.`
        });

        const result = await model.generateContent([
          {
            fileData: {
              fileUri: `https://www.youtube.com/watch?v=${videoId}`,
              mimeType: "video/mp4"
            }
          },
          `Please transcribe the spoken content of this video. Create a clean, readable transcript that:
1. Captures all spoken words accurately
2. Uses proper punctuation and paragraph breaks
3. Includes speaker labels if there are multiple speakers (e.g., "Speaker 1:", "Host:", "Guest:")
4. Omits filler words like "um", "uh" unless they're significant
5. Notes any significant non-verbal elements in [brackets] if relevant (e.g., [applause], [showing slide])

Return ONLY the transcript text, no commentary or metadata.`
        ]);

        const transcript = result.response.text();
        logger.info('Transcription complete', { wordCount: transcript.split(/\s+/).length });

        return { 
          success: true, 
          transcript,
          source: 'youtube',
          videoId
        };
      } else if (videoUrl.includes('firebasestorage.googleapis.com')) {
        // For Firebase Storage videos, use the Gemini File API for large file support
        logger.info('Firebase Storage video detected, downloading...');
        
        const fetch = (await import('node-fetch')).default;
        const { GoogleAIFileManager, FileState } = await import('@google/generative-ai/server');
        const fs = await import('fs');
        const os = await import('os');
        const path = await import('path');
        
        // Download video to temp file
        const response = await fetch(videoUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to download video: ${response.status}`);
        }
        
        const contentLength = response.headers.get('content-length');
        const fileSizeMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0;
        logger.info('Video size', { sizeMB: fileSizeMB.toFixed(2) });
        
        // Limit to 500MB (Gemini File API supports 2GB but we'll be conservative)
        if (fileSizeMB > 500) {
          throw new HttpsError(
            'failed-precondition', 
            `Video is too large (${fileSizeMB.toFixed(0)}MB). Maximum size for AI transcription is 500MB. Please use a shorter video or paste the transcript manually.`
          );
        }
        
        // Save to temp file
        const tempFilePath = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));
        
        logger.info('Video downloaded to temp file, uploading to Gemini File API...');
        
        // Upload to Gemini File API
        const fileManager = new GoogleAIFileManager(apiKey);
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
          mimeType: "video/mp4",
          displayName: `transcription_${Date.now()}`
        });
        
        logger.info('File uploaded, waiting for processing...', { fileName: uploadResult.file.name });
        
        // Wait for file to be processed
        let file = uploadResult.file;
        let waitTime = 0;
        const maxWait = 300000; // 5 minutes max wait
        
        while (file.state === FileState.PROCESSING && waitTime < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          waitTime += 5000;
          file = await fileManager.getFile(file.name);
          logger.info('File processing status', { state: file.state, waitTime: waitTime / 1000 });
        }
        
        // Clean up temp file
        try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
        
        if (file.state === FileState.FAILED) {
          throw new Error('File processing failed on Gemini servers');
        }
        
        if (file.state !== FileState.ACTIVE) {
          throw new Error(`File processing timed out (state: ${file.state})`);
        }
        
        logger.info('File ready, generating transcript...');
        
        // Generate transcript
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: `You are a professional transcriptionist. Your task is to create an accurate, readable transcript of the video content.`
        });

        const result = await model.generateContent([
          {
            fileData: {
              fileUri: file.uri,
              mimeType: file.mimeType
            }
          },
          `Please transcribe the spoken content of this video. Create a clean, readable transcript that:
1. Captures all spoken words accurately
2. Uses proper punctuation and paragraph breaks
3. Includes speaker labels if there are multiple speakers
4. Omits unnecessary filler words
5. Notes any significant visual elements in [brackets] if relevant

Return ONLY the transcript text, no commentary or metadata.`
        ]);

        const transcript = result.response.text();
        logger.info('Transcription complete', { wordCount: transcript.split(/\s+/).length });
        
        // Clean up the uploaded file from Gemini
        try { await fileManager.deleteFile(file.name); } catch (e) { /* ignore - will auto-delete in 48h */ }

        return { 
          success: true, 
          transcript,
          source: 'storage',
          fileSizeMB: fileSizeMB.toFixed(1)
        };
      } else {
        // For other URLs, try to process but may not work
        logger.warn('Unknown video source, attempting transcription', { videoUrl });
        
        throw new HttpsError(
          'invalid-argument', 
          'Currently only YouTube and uploaded videos are supported for transcription. For other video sources, please paste the transcript manually.'
        );
      }
    } catch (error) {
      logger.error("Transcription error:", error);
      
      // Provide helpful error messages
      if (error.message?.includes('SAFETY')) {
        throw new HttpsError('failed-precondition', 'Video content could not be processed due to safety filters.');
      }
      if (error.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpsError('resource-exhausted', 'Video is too long. Please try a shorter video or paste the transcript manually.');
      }
      if (error.code) {
        throw error; // Re-throw HttpsError
      }
      throw new HttpsError('internal', 'Failed to transcribe video: ' + error.message);
    }
  }
);

// ============================================================
// EXTRACT DOCUMENT TEXT
// Extracts text content from PDFs using Gemini
// ============================================================

exports.extractDocumentText = onCall(
  { cors: true, region: "us-central1", invoker: "public", timeoutSeconds: 540, memory: "2GiB" },
  async (request) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not configured");
      throw new HttpsError('internal', 'AI service not configured');
    }

    const { documentUrl, fileType } = request.data;

    if (!documentUrl) {
      throw new HttpsError('invalid-argument', 'Document URL is required');
    }

    logger.info('Starting document text extraction', { documentUrl: documentUrl.substring(0, 100), fileType });

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const { GoogleAIFileManager, FileState } = require('@google/generative-ai/server');
    
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
      // Check if it's a Firebase Storage URL
      if (documentUrl.includes('firebasestorage.googleapis.com')) {
        logger.info('Downloading from Firebase Storage...');
        
        // Download the document first, then use Gemini File API
        const response = await fetch(documentUrl);
        
        if (!response.ok) {
          throw new HttpsError('not-found', 'Could not access document URL');
        }
        
        // Check file size - Gemini File API supports up to 2GB but be conservative
        const contentLength = response.headers.get('content-length');
        const fileSizeMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0;
        logger.info('Document file size', { fileSizeMB: fileSizeMB.toFixed(1) });
        
        if (fileSizeMB > 100) {
          throw new HttpsError(
            'failed-precondition', 
            `Document is too large (${fileSizeMB.toFixed(0)}MB). Maximum size for extraction is 100MB.`
          );
        }
        
        // Determine mime type based on file type
        let mimeType = 'application/pdf';
        if (fileType === 'DOCX') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (fileType === 'PPTX') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        else if (fileType === 'XLSX') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        
        // Get extension from file type
        const ext = (fileType || 'pdf').toLowerCase();
        
        // Save to temp file
        const tempFilePath = path.join(os.tmpdir(), `doc_${Date.now()}.${ext}`);
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));
        
        logger.info('Document downloaded to temp file, uploading to Gemini File API...');
        
        // Upload to Gemini File API
        const fileManager = new GoogleAIFileManager(apiKey);
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
          mimeType: mimeType,
          displayName: `document_${Date.now()}`
        });
        
        logger.info('File uploaded, waiting for processing...', { fileName: uploadResult.file.name });
        
        // Wait for file to be processed
        let file = uploadResult.file;
        let waitTime = 0;
        const maxWait = 120000; // 2 minutes max wait for documents
        
        while (file.state === FileState.PROCESSING && waitTime < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          waitTime += 3000;
          file = await fileManager.getFile(file.name);
          logger.info('File processing status', { state: file.state, waitTime: waitTime / 1000 });
        }
        
        // Clean up temp file
        try { fs.unlinkSync(tempFilePath); } catch (e) { /* ignore */ }
        
        if (file.state === FileState.FAILED) {
          throw new Error('File processing failed on Gemini servers');
        }
        
        if (file.state !== FileState.ACTIVE) {
          throw new Error(`File processing timed out (state: ${file.state})`);
        }
        
        logger.info('File ready, extracting text...');
        
        // Extract text
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: `You are a professional document transcriber. Your task is to extract all text content from documents accurately while maintaining structure and readability.`
        });

        const result = await model.generateContent([
          {
            fileData: {
              fileUri: file.uri,
              mimeType: file.mimeType
            }
          },
          `Please extract ALL the text content from this document. Maintain the structure and formatting as much as possible:
1. Preserve headings, subheadings, and section breaks
2. Maintain paragraph structure
3. Include bullet points and numbered lists
4. Preserve any important formatting like bold text indicators
5. For tables, convert to a readable text format
6. Include page breaks as "---" separators if detectable

Return ONLY the extracted text, no commentary. Do your best to capture every piece of text content.`
        ]);

        const text = result.response.text();
        logger.info('Text extraction complete', { wordCount: text.split(/\s+/).length });
        
        // Clean up the uploaded file from Gemini
        try { await fileManager.deleteFile(file.name); } catch (e) { /* ignore - will auto-delete in 48h */ }

        return { 
          success: true, 
          text,
          source: 'storage',
          fileSizeMB: fileSizeMB.toFixed(1)
        };
      } else {
        // For external URLs, try direct access with Gemini (if it's a public PDF)
        throw new HttpsError(
          'invalid-argument', 
          'Currently only uploaded documents from Media Vault are supported for text extraction. For external documents, please copy/paste the text manually.'
        );
      }
    } catch (error) {
      logger.error("Document extraction error:", error);
      
      if (error.message?.includes('SAFETY')) {
        throw new HttpsError('failed-precondition', 'Document content could not be processed due to safety filters.');
      }
      if (error.message?.includes('UNSUPPORTED')) {
        throw new HttpsError('failed-precondition', 'This document format is not supported for text extraction. Please paste the text manually.');
      }
      if (error.code) {
        throw error; // Re-throw HttpsError
      }
      throw new HttpsError('internal', 'Failed to extract text: ' + error.message);
    }
  }
);

// ============================================================
// BOOK BUILDER - GENERATE FULL BOOK
// Analyzes all sources and generates chapter outline + drafts
// ============================================================

// Helper function to build content string from content_library item for AI consumption
function buildSourceContent(item) {
  const parts = [];
  
  if (item.description) {
    parts.push(item.description);
  }
  
  // Extract content from details based on content type
  if (item.details) {
    if (item.details.content) parts.push(item.details.content);
    if (item.details.overview) parts.push(item.details.overview);
    if (item.details.keyPoints && item.details.keyPoints.length) {
      parts.push('Key Points: ' + item.details.keyPoints.join(', '));
    }
    if (item.details.summary) parts.push(item.details.summary);
    if (item.details.instructions) parts.push(item.details.instructions);
    if (item.details.steps && item.details.steps.length) {
      parts.push('Steps: ' + item.details.steps.map(s => s.title || s).join(' → '));
    }
    if (item.details.reflection) parts.push('Reflection: ' + item.details.reflection);
    if (item.details.applicationTips && item.details.applicationTips.length) {
      parts.push('Tips: ' + item.details.applicationTips.join(', '));
    }
    // Include transcript for videos
    if (item.details.transcript) {
      parts.push('Transcript:\n' + item.details.transcript);
    }
    // Include full text for documents
    if (item.details.fullText) {
      parts.push('Document Content:\n' + item.details.fullText);
    }
    // Include key takeaways for videos
    if (item.details.keyTakeaways) {
      parts.push('Key Takeaways: ' + item.details.keyTakeaways);
    }
  }
  
  return parts.join('\n\n') || item.description || 'No content available';
}

exports.generateFullBook = onCall(
  { cors: true, region: "us-central1", invoker: "public", timeoutSeconds: 540 },
  async (request) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not configured");
      throw new HttpsError('internal', 'AI service not configured');
    }

    const { bookMetadata, regenerate = false } = request.data;
    
    logger.info('Starting full book generation', { regenerate });

    try {
      // Step 1: Fetch all sources from content_library where includeInBook is true
      const sourcesSnap = await db.collection('content_library')
        .where('includeInBook', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      // Map content_library items to source format
      const sources = sourcesSnap.docs.map(doc => {
        const item = doc.data();
        return {
          id: doc.id,
          title: item.title || 'Untitled',
          type: item.type || 'DOCUMENT',
          content: buildSourceContent(item),
          tags: [...(item.programs || []), ...(item.skills || [])],
          description: item.description || '',
          createdAt: item.createdAt
        };
      });
      
      if (sources.length === 0) {
        throw new HttpsError('failed-precondition', 'No content marked for book. Check "Include in Leadership Playbook" on content items in Media Vault.');
      }

      logger.info(`Found ${sources.length} sources from content_library`);

      // Step 1b: Fetch notes for this book (both shared and book-specific)
      const noteCategoryLabels = {
        context: 'Context/Background',
        direction: 'Direction',
        idea: 'Idea',
        structure: 'Structure',
        tone: 'Tone/Style',
        audience: 'Audience',
        other: 'Other'
      };
      
      let notes = [];
      try {
        // Fetch shared notes (bookId is null)
        const sharedNotesSnap = await db.collection('book_notes')
          .where('bookId', '==', null)
          .get();
        
        // Fetch book-specific notes if bookId provided
        let bookSpecificNotes = [];
        if (bookMetadata?.id) {
          const bookNotesSnap = await db.collection('book_notes')
            .where('bookId', '==', bookMetadata.id)
            .get();
          bookSpecificNotes = bookNotesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        
        notes = [
          ...sharedNotesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), scope: 'shared' })),
          ...bookSpecificNotes.map(n => ({ ...n, scope: 'book-specific' }))
        ];
        
        logger.info(`Found ${notes.length} notes (${sharedNotesSnap.size} shared, ${bookSpecificNotes.length} book-specific)`);
      } catch (notesError) {
        logger.warn('Could not fetch notes:', notesError.message);
        notes = [];
      }
      
      // Extract style prompt from book metadata
      const stylePrompt = bookMetadata?.stylePrompt || '';

      // Build source summaries for AI
      const sourceSummaries = sources.map((s, i) => 
        `${i + 1}. "${s.title}" (${s.type})\n   Tags: ${s.tags?.join(', ') || 'none'}\n   Preview: ${s.content?.substring(0, 500) || '(empty)'}...`
      ).join('\n\n');

      // Step 2: Generate chapter outline using AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: `You are an expert book strategist and author specializing in leadership development content. You create compelling, practical book structures.`
      });

      // Build notes context for outline generation
      const notesContext = notes.length > 0 
        ? notes.map(n => `[${noteCategoryLabels[n.category] || n.category}] ${n.title}: ${n.content}`).join('\n\n')
        : '';

      const outlinePrompt = `You are planning a leadership development book based on the following source materials.

BOOK DETAILS:
Title: ${bookMetadata?.title || 'The LeaderReps Method'}
${bookMetadata?.subtitle ? `Subtitle: ${bookMetadata.subtitle}` : 'Subtitle: A Practical Guide to Leadership Development'}
Target Audience: ${bookMetadata?.targetAudience || 'HR Leaders, L&D Professionals, and Executive Teams'}
Tone: ${bookMetadata?.tone || 'Professional yet conversational, practical and actionable'}
${stylePrompt ? `
BOOK STYLE DIRECTION:
${stylePrompt}
` : ''}
${notesContext ? `
AUTHOR NOTES & DIRECTION:
${notesContext}
` : ''}
SOURCE MATERIALS AVAILABLE:
${sourceSummaries}

INSTRUCTIONS:
Create a compelling book outline. For each chapter, specify:
1. Chapter title (compelling, specific)
2. Brief summary (2-3 sentences describing what the chapter covers)
3. Which source materials (by number) should be referenced

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Chapter Title Here",
    "summary": "Brief 2-3 sentence description of what this chapter covers.",
    "sourceRefs": [1, 3, 5]
  }
]

The book style and notes should heavily influence the structure, number of chapters, and approach. Create a logical flow appropriate for the style.

Return ONLY the JSON array, no other text.`;

      logger.info('Generating chapter outline...');
      const outlineResult = await model.generateContent(outlinePrompt);
      const outlineText = outlineResult.response.text();
      
      // Parse the JSON outline
      let chapters;
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = outlineText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }
        chapters = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        logger.error('Failed to parse outline JSON:', outlineText);
        throw new HttpsError('internal', 'AI returned invalid chapter outline format');
      }

      logger.info(`Generated ${chapters.length} chapters outline`);

      // Step 3: Clear existing chapters if regenerating
      if (regenerate) {
        const existingChapters = await db.collection('book_chapters').get();
        const batch = db.batch();
        existingChapters.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        logger.info(`Deleted ${existingChapters.size} existing chapters`);
      }

      // Step 4: Create chapters and generate drafts
      const results = [];
      
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        logger.info(`Processing chapter ${i + 1}/${chapters.length}: ${chapter.title}`);

        // Get source content for this chapter
        const chapterSources = (chapter.sourceRefs || [])
          .map(ref => sources[ref - 1])
          .filter(Boolean);

        const sourceContext = chapterSources.map((s, idx) => 
          `--- SOURCE: ${s.title} (${s.type}) ---\n${s.content?.substring(0, 6000) || '(No content)'}\n`
        ).join('\n\n');

        // Build author notes context for chapter generation
        const authorNotesContext = notes.length > 0 
          ? notes.map(n => `[${noteCategoryLabels[n.category] || n.category}] ${n.title}: ${n.content}`).join('\n\n')
          : '';

        // Generate chapter draft
        const draftPrompt = `You are writing a chapter for a leadership development book.

BOOK: ${bookMetadata?.title || 'The LeaderReps Method'}
Target Audience: ${bookMetadata?.targetAudience || 'Business leaders and HR professionals'}
Tone: ${bookMetadata?.tone || 'Professional yet conversational'}
${stylePrompt ? `
BOOK STYLE DIRECTION (IMPORTANT - follow this closely):
${stylePrompt}
` : ''}
CHAPTER ${i + 1}: ${chapter.title}
Summary: ${chapter.summary}

SOURCE MATERIALS TO SYNTHESIZE:
${sourceContext || '(No specific sources assigned - draw from general leadership knowledge)'}
${authorNotesContext ? `

AUTHOR NOTES & DIRECTION:
Consider these notes from the author when writing this chapter. They provide important context, tone guidance, and ideas:

${authorNotesContext}` : ''}

INSTRUCTIONS:
1. Write a compelling chapter that synthesizes the source materials and follows the book style direction
2. Use a voice and approach consistent with the style direction provided
3. Make it engaging, practical, and appropriate for the target audience
4. Don't reference sources directly - integrate concepts naturally
5. Make it publisher-ready quality

Write the full chapter now:`;

        try {
          const draftResult = await model.generateContent(draftPrompt);
          const draftContent = draftResult.response.text();

          // Save chapter to Firestore
          const chapterData = {
            bookId: bookMetadata?.id || null,
            order: i + 1,
            title: chapter.title,
            summary: chapter.summary,
            content: draftContent,
            status: 'drafting',
            sourceRefs: chapterSources.map(s => s.id),
            wordCount: draftContent.split(/\s+/).filter(Boolean).length,
            createdBy: 'ai-generator',
            lastEditedBy: 'ai-generator',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          const chapterRef = await db.collection('book_chapters').add(chapterData);
          
          results.push({
            id: chapterRef.id,
            order: i + 1,
            title: chapter.title,
            wordCount: chapterData.wordCount,
            status: 'success'
          });

          logger.info(`Chapter ${i + 1} created: ${chapterData.wordCount} words`);

          // Small delay to avoid rate limiting
          if (i < chapters.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (chapterError) {
          logger.error(`Error generating chapter ${i + 1}:`, chapterError);
          results.push({
            order: i + 1,
            title: chapter.title,
            status: 'failed',
            error: chapterError.message
          });
        }
      }

      // Calculate totals
      const totalWords = results.reduce((sum, r) => sum + (r.wordCount || 0), 0);
      const successCount = results.filter(r => r.status === 'success').length;

      logger.info(`Book generation complete: ${successCount}/${chapters.length} chapters, ${totalWords} words`);

      return {
        success: true,
        chaptersGenerated: successCount,
        chaptersTotal: chapters.length,
        totalWordCount: totalWords,
        chapters: results
      };

    } catch (error) {
      logger.error("Full book generation error:", error);
      throw new HttpsError('internal', 'Failed to generate book: ' + error.message);
    }
  }
);


// ============================================================================
// LEADERSHIP LAB — AI Coaching Engine
// ============================================================================

const LL_PREFIX = 'll-';

/** Mask a phone number for safe logging: +1xxxxx3200 */
function maskPhone(phone) {
  if (!phone || phone.length < 6) return '***';
  return phone.slice(0, 2) + 'x'.repeat(phone.length - 6) + phone.slice(-4);
}

/** Get the Firebase project ID at runtime. */
function getLabProjectId() {
  return process.env.GCLOUD_PROJECT
    || (process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId)
    || 'leaderreps-pd-platform';
}

/** Build a Cloud Functions URL dynamically based on project ID. */
function labFunctionUrl(functionName) {
  return `https://us-central1-${getLabProjectId()}.cloudfunctions.net/${functionName}`;
}

/** Get the Leadership Lab hosting domain based on project ID. */
function labHostingDomain() {
  const projectId = getLabProjectId();
  if (projectId === 'leaderreps-prod') return 'https://leaderreps-lab-prod.web.app';
  if (projectId === 'leaderreps-test') return 'https://leaderreps-lab-test.web.app';
  return 'https://leaderreps-lab.web.app';
}

const LL_WEEK_THEMES = [
  "Reinforcing — Recognizing & Reinforcing Great Leadership",
  "One-on-One — Mastering the 1:1 Conversation",
  "Redirecting — Giving Feedback That Actually Lands",
  "Readiness — Handling Pushback & Resistance",
  "Graduation — Leading With Confidence",
];

const LL_EXPERIMENTS = [
  "Before your first meeting today, write down the one thing each person in that room does better than anyone else on the team. During the meeting, find a natural moment to name ONE of those things — out loud, in front of the group. Watch what happens to the room.",
  "The 2-Minute Silence: In your next 1:1, ask your most important question. After they answer, say nothing. Just stay present for a full two minutes. The real answer almost always comes after the first one.",
  "Think of the person you MOST need to give redirecting feedback to — the one you've been putting off. Write it in one sentence: 'When you [behavior], the impact is [consequence].' Now deliver it today. Not tomorrow. Today.",
  "The Columbo Method: Next time someone pushes back, say 'You might be right — help me see what I'm missing.' Then actually listen. Track three things: their energy shift, how the conversation changes, and your own impulse to fight back.",
  "Before your most important meeting this week, write down: What would the leader I'm becoming do differently than the leader I was 5 weeks ago? Then walk in and do exactly that. After, tell your coach what happened.",
];

/** Safely clamp a weekNumber to a valid array index for themes/experiments. */
function weekIdx(weekNumber) {
  return Math.max(0, Math.min(weekNumber - 1, LL_WEEK_THEMES.length - 1));
}

/**
 * evolveProfileIfStale — Background profile evolution.
 * Checks if the Leadership Profile hasn't been updated recently, and if stale,
 * runs a lightweight profile update from recent conversations.
 * Threshold: at least 3 days AND at least 3 conversations since last update.
 */
async function evolveProfileIfStale(uid, apiKey) {
  const db = admin.firestore();
  const lpRef = db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`);
  const lpSnap = await lpRef.get();
  if (!lpSnap.exists) return;

  const profile = lpSnap.data();
  const lastUpdated = profile.updatedAt?.toDate?.() || profile.createdAt?.toDate?.() || new Date(0);
  const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

  // Not stale yet — at least 3 days between updates
  if (daysSinceUpdate < 3) return;

  // Check if there are enough new conversations since last update
  const recentConvos = await db
    .collection(`${LL_PREFIX}users/${uid}/conversations`)
    .where("updatedAt", ">", profile.updatedAt || profile.createdAt)
    .limit(3)
    .get();

  if (recentConvos.size < 3) return;

  logger.info("evolveProfileIfStale: profile is stale, updating", { uid, daysSinceUpdate });

  // Load last 10 conversations for analysis
  const convosSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/conversations`)
    .orderBy("updatedAt", "desc")
    .limit(10)
    .get();

  const transcripts = [];
  convosSnap.forEach((doc) => {
    const data = doc.data();
    const msgs = (data.messages || [])
      .map((m) => `${m.role === "user" ? "LEADER" : "COACH"}: ${m.content}`)
      .join("\n");
    transcripts.push(`--- Conversation (${data.mode}, Week ${data.weekNumber}) ---\n${msgs}`);
  });

  const currentProfileJSON = JSON.stringify({
    presentedSelf: profile.presentedSelf || "",
    observedSelf: profile.observedSelf || "",
    tensions: profile.tensions || [],
    corePatterns: profile.corePatterns || [],
    keyInsights: profile.keyInsights || [],
    growthEdges: profile.growthEdges || [],
    coachingApproach: profile.coachingApproach || "",
  });

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `You are a leadership psychologist updating a leader's behavioral profile based on new conversation data.

CURRENT PROFILE:
${currentProfileJSON}

Analyze the new conversations below. Update the profile to reflect any new observations, shifts in patterns, emerging tensions, or growth. Preserve existing insights that are still valid. Add new ones that emerge. Remove or revise any that are contradicted by new evidence.

Return ONLY a JSON object with the same structure:
{
  "presentedSelf": "Updated 2-3 sentence summary",
  "observedSelf": "Updated 2-3 sentence summary of observed patterns",
  "tensions": [{"left": "...", "right": "...", "position": 0-100, "evidence": "..."}],
  "corePatterns": ["Pattern in 1 sentence"],
  "keyInsights": [{"insight": "...", "evidence": "..."}],
  "growthEdges": ["..."],
  "coachingApproach": "Updated 2-sentence coaching recommendation"
}

Return ONLY valid JSON. No markdown, no explanation.`,
    messages: [{ role: "user", content: transcripts.join("\n\n") }],
  });

  const profileText = response.content[0]?.text || "{}";
  let updatedProfile;
  try {
    updatedProfile = JSON.parse(profileText);
  } catch {
    logger.warn("evolveProfileIfStale: failed to parse profile JSON", { uid });
    return;
  }

  await lpRef.set(
    {
      ...updatedProfile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastAnalyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastEvolutionSource: "auto",
    },
    { merge: true }
  );

  logger.info("evolveProfileIfStale: profile updated", { uid });
}

/**
 * processLabMessage — Shared AI coaching logic for both web app and SMS.
 *
 * @param {string} uid - Firestore user ID
 * @param {string} text - User message
 * @param {object} options
 * @param {string} [options.conversationId] - Existing conversation to continue
 * @param {string} [options.mode] - Coaching mode (coach, practice, mirror, debrief, onboarding)
 * @param {number} [options.weekNumber] - Current milestone (1-5)
 * @param {string} [options.channel] - "app" or "sms"
 * @param {string} [options.interactionType] - SMS interaction type for prompt context
 * @returns {{ response: string, conversationId: string, usage: object }}
 */
async function processLabMessage(uid, text, options = {}) {
  const {
    conversationId,
    mode = "coach",
    weekNumber = 1,
    channel = "app",
    interactionType,
  } = options;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const sanitizedText = text.trim().slice(0, 5000);
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const nowISO = new Date().toISOString();

  // --- Load user profile ---
  const userDocRef = db.doc(`${LL_PREFIX}users/${uid}`);
  const userSnap = await userDocRef.get();
  const userProfile = userSnap.exists ? userSnap.data() : {};
  const userName = userProfile.displayName || userProfile.firstName || "there";

  // --- Load Leadership Profile ---
  const lpRef = db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`);
  const lpSnap = await lpRef.get();
  const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;

  // --- Load recent evidence (last 15 items for coaching context) ---
  let recentEvidence = [];
  try {
    const evidenceSnap = await db
      .collection(`${LL_PREFIX}users/${uid}/evidence`)
      .orderBy("createdAt", "desc")
      .limit(15)
      .get();
    recentEvidence = evidenceSnap.docs.map((d) => d.data());
  } catch {
    // Evidence collection may not exist yet — safe to continue
  }

  // --- Load active reveal (if any) ---
  let activeReveal = null;
  try {
    const revealSnap = await db
      .collection(`${LL_PREFIX}users/${uid}/reveals`)
      .where("status", "in", ["pending", "delivered"])
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    if (!revealSnap.empty) {
      activeReveal = revealSnap.docs[0].data();
    }
  } catch {
    // Reveals collection may not exist yet
  }

  // --- Load recent weekly reflections (generated by labWeekTransition) ---
  let recentSummaries = [];
  try {
    const reflectSnap = await db
      .collection(`${LL_PREFIX}users/${uid}/reflections`)
      .orderBy("weekNumber", "desc")
      .limit(3)
      .get();
    recentSummaries = reflectSnap.docs
      .filter((d) => d.data().summary)
      .map((d) => {
        const data = d.data();
        return {
          weekNumber: data.weekNumber,
          summary: data.summary,
          conversationCount: data.conversationCount || 0,
        };
      });
  } catch {
    // Reflections may not exist yet
  }

  // --- Compute engagement signals ---
  const engagementSignals = {};
  if (userProfile.lastSmsResponseAt) {
    const lastReply = userProfile.lastSmsResponseAt.toDate?.() || new Date(userProfile.lastSmsResponseAt);
    const hoursSince = (Date.now() - lastReply.getTime()) / (1000 * 60 * 60);
    engagementSignals.hoursSinceLastReply = Math.round(hoursSince);
  }
  // Check reply brevity pattern from this conversation
  const userMsgs = existingMessages.filter((m) => m.role === "user");
  if (userMsgs.length > 0) {
    const avgLen = userMsgs.reduce((sum, m) => sum + m.content.length, 0) / userMsgs.length;
    engagementSignals.averageReplyLength = Math.round(avgLen);
    engagementSignals.isShortReplier = avgLen < 30;
  }

  // --- Resolve or create conversation ---
  let convoRef;
  let existingMessages = [];
  let simulationPrompt = null;

  if (conversationId) {
    convoRef = db.doc(`${LL_PREFIX}users/${uid}/conversations/${conversationId}`);
    const convoSnap = await convoRef.get();
    if (!convoSnap.exists) {
      throw new Error("Conversation not found");
    }
    existingMessages = convoSnap.data().messages || [];
    // If this is a simulation conversation, use its stored system prompt
    if (convoSnap.data().simulation?.systemPrompt) {
      simulationPrompt = convoSnap.data().simulation.systemPrompt;
    }
  } else {
    convoRef = db.collection(`${LL_PREFIX}users/${uid}/conversations`).doc();
    await convoRef.set({
      mode,
      weekNumber,
      channel,
      interactionType: interactionType || null,
      messages: [],
      summary: "",
      createdAt: now,
      updatedAt: now,
    });
  }

  // --- Append user message ---
  const userMessage = { role: "user", content: sanitizedText, timestamp: nowISO, channel };
  existingMessages.push(userMessage);

  // --- Build system prompt ---
  // Use stored simulation prompt for practice-mode SMS, otherwise build standard prompt
  const wIdx = weekIdx(weekNumber);
  const systemPrompt = simulationPrompt || buildLabSystemPrompt({
    mode,
    userName,
    weekNumber,
    weekTheme: LL_WEEK_THEMES[wIdx],
    experiment: LL_EXPERIMENTS[wIdx],
    leadershipProfile,
    recentEvidence,
    activeReveal,
    recentSummaries,
    engagementSignals,
    messageCount: existingMessages.length,
    channel,
    interactionType,
    phase: userProfile.phase || (weekNumber > 5 ? "ascent" : "foundation"),
  });

  // --- Prepare messages for Claude ---
  const claudeMessages = existingMessages.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
  }));

  // --- Call Claude (with Gemini fallback) ---
  // SMS responses should be shorter to fit text messages well
  const maxTokens = channel === "sms" ? 400 : 1024;
  let aiText;
  let usageInfo;
  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: claudeMessages,
    });
    aiText = response.content[0]?.text || "I'm here. Tell me more.";
    usageInfo = response.usage;
  } catch (claudeErr) {
    logger.warn("Claude API failed, falling back to Gemini", { uid, error: claudeErr.message });
    // Fallback to Gemini 2.0 Flash
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("Both AI providers unavailable");
    }
    const genAI = new GoogleGenerativeAI(geminiKey);
    const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    // Convert messages to Gemini format
    const geminiHistory = claudeMessages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const chat = geminiModel.startChat({
      history: geminiHistory,
      systemInstruction: { parts: [{ text: systemPrompt }] },
    });
    const lastMsg = claudeMessages[claudeMessages.length - 1]?.content || text;
    const geminiResult = await chat.sendMessage(lastMsg);
    aiText = geminiResult.response.text() || "I'm here. Tell me more.";
    usageInfo = { provider: "gemini-fallback" };
  }

  const aiMessage = { role: "assistant", content: aiText, timestamp: new Date().toISOString(), channel };
  existingMessages.push(aiMessage);

  // --- Save to Firestore ---
  await convoRef.update({
    messages: existingMessages,
    updatedAt: now,
  });

  logger.info("processLabMessage response generated", {
    uid,
    mode,
    channel,
    conversationId: convoRef.id,
    messageCount: existingMessages.length,
    inputTokens: usageInfo?.input_tokens,
    outputTokens: usageInfo?.output_tokens,
    provider: usageInfo?.provider || "claude",
  });

  // --- Auto-evolve Leadership Profile ---
  // Fire-and-forget: check if the profile is stale and trigger an update.
  // Runs after every 10th user message since last profile update.
  if (leadershipProfile && mode !== "onboarding") {
    const userMsgCount = existingMessages.filter((m) => m.role === "user").length;
    // Only check on every 5th message in a conversation to reduce overhead
    if (userMsgCount % 5 === 0) {
      evolveProfileIfStale(uid, apiKey).catch((err) =>
        logger.warn("Background profile evolution failed", { uid, error: err.message })
      );
    }
  }

  return {
    response: aiText,
    conversationId: convoRef.id,
    usage: usageInfo,
  };
}

/**
 * Send an SMS via Twilio for Leadership Lab.
 * @param {string} to - Phone number in E.164 format
 * @param {string} body - Message text
 * @returns {Promise<string>} Twilio message SID
 */
async function sendLabSms(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !auth || (!messagingServiceSid && !from)) {
    logger.error("Twilio credentials not configured for Lab SMS");
    throw new Error("SMS service not configured");
  }

  const client = twilio(sid, auth);
  const msgOptions = { body, to };
  if (messagingServiceSid) {
    msgOptions.messagingServiceSid = messagingServiceSid;
  } else {
    msgOptions.from = from;
  }
  const result = await client.messages.create(msgOptions);
  logger.info("Lab SMS sent", { to: maskPhone(to), sid: result.sid });
  return result.sid;
}

/**
 * Normalize a phone number to E.164 format.
 * @param {string} phone - Raw phone number
 * @returns {string} E.164 formatted phone number
 */
function normalizePhoneE164(phone) {
  if (!phone) return phone;
  // Strip all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");
  // If it starts with +, keep it; otherwise normalize
  if (cleaned.startsWith("+")) return cleaned;
  // Strip leading 1 for US numbers and re-add with +
  if (cleaned.startsWith("1") && cleaned.length === 11) return `+${cleaned}`;
  // Assume US number if 10 digits
  if (cleaned.length === 10) return `+1${cleaned}`;
  // Fallback — add + prefix
  return `+${cleaned}`;
}

/**
 * Look up a Lab user by phone number.
 * Normalizes to E.164 before querying.
 * @param {string} phone - Phone number (any format)
 * @returns {{ uid: string, profile: object } | null}
 */
async function lookupLabUserByPhone(phone) {
  const db = admin.firestore();
  const normalized = normalizePhoneE164(phone);
  const snap = await db
    .collection(`${LL_PREFIX}users`)
    .where("phone", "==", normalized)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { uid: doc.id, profile: doc.data() };
}

/**
 * Get the current week number for a cohort based on its start date.
 * Uses Eastern Time to match the cohort schedule.
 * @param {Date|FirebaseTimestamp} startDate
 * @param {number} [maxWeeks=6] - Maximum week number (from cohort weekCount)
 */
function getCohortWeekNumber(startDate, maxWeeks = 6, { clamp = true } = {}) {
  const start = startDate instanceof Date ? startDate : startDate.toDate();
  // Use Eastern Time for consistent day boundaries
  const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const startET = new Date(start.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const diffMs = nowET - startET;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  if (!clamp) return Math.max(1, week);
  return Math.max(1, Math.min(week, maxWeeks));
}

/**
 * Get the active SMS conversation for a user (today in ET), or null.
 */
async function getActiveSmsConversation(uid) {
  const db = admin.firestore();
  // Use Eastern Time for "today" boundary so conversations don't fragment at 7PM ET
  const todayET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  todayET.setHours(0, 0, 0, 0);

  const snap = await db
    .collection(`${LL_PREFIX}users/${uid}/conversations`)
    .where("channel", "==", "sms")
    .where("createdAt", ">=", todayET)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { conversationId: snap.docs[0].id, data: snap.docs[0].data() };
}

// ---- Exported Cloud Functions ----

/**
 * labCoach — Web app callable. Thin wrapper around processLabMessage.
 */
exports.labCoach = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-test\.web\.app$/,
      /leaderreps-test\.firebaseapp\.com$/,
      /leaderreps-prod\.web\.app$/,
      /leaderreps-prod\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const authUid = request.auth.uid;
    const { text, conversationId, mode = "coach", weekNumber = 1 } = request.data || {};

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new HttpsError("invalid-argument", "Message text is required");
    }

    // Resolve the ll-users doc ID (may differ from auth UID for SMS-originated users)
    const db = admin.firestore();
    let uid = authUid;
    const directSnap = await db.doc(`${LL_PREFIX}users/${authUid}`).get();
    if (!directSnap.exists) {
      // Check for SMS user linked via firebaseAuthUid
      const q = await db.collection(`${LL_PREFIX}users`)
        .where("firebaseAuthUid", "==", authUid)
        .limit(1)
        .get();
      if (!q.empty) {
        uid = q.docs[0].id;
      }
    }

    try {
      const result = await processLabMessage(uid, text, {
        conversationId,
        mode,
        weekNumber,
        channel: "app",
      });

      // Auto-complete onboarding after enough exchanges
      if (mode === "onboarding" && result.conversationId) {
        const convoSnap = await db
          .doc(`${LL_PREFIX}users/${uid}/conversations/${result.conversationId}`)
          .get();
        const msgs = convoSnap.exists ? convoSnap.data().messages || [] : [];
        const userMsgCount = msgs.filter((m) => m.role === "user").length;

        if (userMsgCount >= 4) {
          try {
            const profile = await completeLabOnboarding(uid, result.conversationId);
            result.onboardingComplete = true;
            result.profile = {
              presentedSelf: profile.presentedSelf,
              tensions: profile.tensions,
              growthEdges: profile.growthEdges,
            };
          } catch (e) {
            logger.warn("Web onboarding auto-completion failed", { uid, error: e.message });
          }
        }
      }

      return result;
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labCoach error", error);
      throw new HttpsError("internal", "Failed to generate coaching response");
    }
  }
);

/**
 * labCompleteOnboarding — Called after the onboarding conversation concludes.
 * Web app callable — delegates to shared completeLabOnboarding().
 */
exports.labCompleteOnboarding = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-test\.web\.app$/,
      /leaderreps-test\.firebaseapp\.com$/,
      /leaderreps-prod\.web\.app$/,
      /leaderreps-prod\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const authUid = request.auth.uid;
    const { conversationId } = request.data || {};

    if (!conversationId || typeof conversationId !== "string") {
      throw new HttpsError("invalid-argument", "conversationId is required and must be a string");
    }

    // Resolve the ll-users doc ID (may differ from auth UID for SMS-originated users)
    const db = admin.firestore();
    let uid = authUid;
    const directSnap = await db.doc(`${LL_PREFIX}users/${authUid}`).get();
    if (!directSnap.exists) {
      const q = await db.collection(`${LL_PREFIX}users`)
        .where("firebaseAuthUid", "==", authUid)
        .limit(1)
        .get();
      if (!q.empty) uid = q.docs[0].id;
    }

    try {
      const profile = await completeLabOnboarding(uid, conversationId);

      logger.info("labCompleteOnboarding success", { uid, conversationId });

      return {
        success: true,
        profile: {
          presentedSelf: profile.presentedSelf,
          tensions: profile.tensions,
          growthEdges: profile.growthEdges,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labCompleteOnboarding error", error);
      throw new HttpsError("internal", "Failed to complete onboarding");
    }
  }
);

/**
 * labUpdateProfile — Re-analyzes recent conversations to update the Leadership Profile.
 *
 * Can be called periodically or after significant conversations.
 */
exports.labUpdateProfile = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-test\.web\.app$/,
      /leaderreps-test\.firebaseapp\.com$/,
      /leaderreps-prod\.web\.app$/,
      /leaderreps-prod\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const uid = request.auth.uid;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new HttpsError("internal", "AI service not configured");
    }

    const db = admin.firestore();

    try {
      // Load current profile
      const lpRef = db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`);
      const lpSnap = await lpRef.get();
      const currentProfile = lpSnap.exists ? lpSnap.data() : {};

      // Load recent conversations (last 10)
      const convosSnap = await db
        .collection(`${LL_PREFIX}users/${uid}/conversations`)
        .orderBy("updatedAt", "desc")
        .limit(10)
        .get();

      if (convosSnap.empty) {
        return { success: true, updated: false, reason: "No conversations to analyze" };
      }

      // Build transcript of recent conversations
      const transcripts = [];
      convosSnap.forEach((doc) => {
        const data = doc.data();
        const msgs = (data.messages || [])
          .map((m) => `${m.role === "user" ? "LEADER" : "COACH"}: ${m.content}`)
          .join("\n");
        transcripts.push(`--- Conversation (${data.mode}, Week ${data.weekNumber}) ---\n${msgs}`);
      });

      const fullTranscript = transcripts.join("\n\n");
      const currentProfileJSON = JSON.stringify({
        presentedSelf: currentProfile.presentedSelf || "",
        observedSelf: currentProfile.observedSelf || "",
        tensions: currentProfile.tensions || [],
        corePatterns: currentProfile.corePatterns || [],
        keyInsights: currentProfile.keyInsights || [],
        growthEdges: currentProfile.growthEdges || [],
      });

      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are a leadership psychologist updating a leader's behavioral profile based on new conversation data.

CURRENT PROFILE:
${currentProfileJSON}

Analyze the new conversations below. Update the profile to reflect any new observations, shifts in patterns, emerging tensions, or growth. Preserve existing insights that are still valid. Add new ones that emerge.

Return ONLY a JSON object with the same structure:
{
  "presentedSelf": "Updated 2-3 sentence summary",
  "observedSelf": "Updated 2-3 sentence summary of observed patterns",
  "tensions": [{"left": "...", "right": "...", "position": 0-100, "evidence": "..."}],
  "corePatterns": ["Pattern in 1 sentence"],
  "keyInsights": [{"insight": "...", "evidence": "..."}],
  "growthEdges": ["..."],
  "coachingApproach": "Updated 2-sentence coaching recommendation"
}

Return ONLY valid JSON. No markdown, no explanation.`,
        messages: [{ role: "user", content: fullTranscript }],
      });

      const profileText = response.content[0]?.text || "{}";
      let updatedProfile;
      try {
        updatedProfile = JSON.parse(profileText);
      } catch {
        logger.warn("Failed to parse updated profile JSON");
        return { success: false, reason: "Failed to parse profile update" };
      }

      await lpRef.set(
        {
          ...updatedProfile,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastAnalyzedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      logger.info("labUpdateProfile success", { uid });

      return { success: true, updated: true };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labUpdateProfile error", error);
      throw new HttpsError("internal", "Failed to update profile");
    }
  }
);

/**
 * Build the system prompt for Leadership Lab coaching modes.
 */
function buildLabSystemPrompt({ mode, userName, weekNumber, weekTheme, experiment, leadershipProfile, recentEvidence, activeReveal, recentSummaries, engagementSignals, messageCount, channel, interactionType, phase }) {
  // --- Base context ---
  const isAscent = phase === "ascent" || weekNumber > 5;

  let prompt;
  if (isAscent) {
    prompt = `You are the AI coach for Leadership Lab. ${userName} has completed the Arena Foundations program and is now in the Ascent Phase — an ongoing, open-ended coaching relationship.

Your purpose: continue building your model of this leader's identity, deepen self-awareness, and help them apply what they learned during Foundations to evolving real-world challenges. You know them well by now — coach accordingly.

They are in Week ${weekNumber} overall. There is no end date. You are their permanent leadership coach.
`;
  } else {
    prompt = `You are the AI coach for Leadership Lab — a text-based coaching companion that supports leaders going through the Arena Foundations in-person training program. Your job is to fill the gap between live training sessions: reinforce what was taught, provide quick practice moments, and keep leaders engaged between sessions. Be warm, concise, a little fun — never annoying.

The program has 5 milestones: Reinforcing → One-on-One → Redirecting → Readiness → Graduation. Each milestone is gated by an in-person training session.

${weekNumber > 0 ? `You are coaching ${userName}, who is currently in Milestone ${weekNumber}: "${weekTheme}".

This week's practice challenge: "${experiment}"` : `You are coaching ${userName}, who is just beginning the program.`}

Your purpose: reinforce the concepts being taught in live sessions, help leaders practice between meetings, and build a model of who they are as a leader — then use that to create moments of genuine self-awareness.
`;
  }


  // --- Leadership Profile context ---
  if (leadershipProfile) {
    prompt += `
LEADERSHIP PROFILE — what you know about ${userName}:
`;
    if (leadershipProfile.presentedSelf) {
      prompt += `PRESENTED SELF (how they see themselves): ${leadershipProfile.presentedSelf}\n`;
    }
    if (leadershipProfile.observedSelf) {
      prompt += `OBSERVED SELF (what you've noticed): ${leadershipProfile.observedSelf}\n`;
    }
    if (leadershipProfile.tensions && leadershipProfile.tensions.length > 0) {
      const tensionStr = leadershipProfile.tensions
        .map((t) => `${t.left} ←→ ${t.right} (leans ${t.position > 50 ? t.right : t.left})`)
        .join("; ");
      prompt += `TENSIONS: ${tensionStr}\n`;
    }
    if (leadershipProfile.corePatterns && leadershipProfile.corePatterns.length > 0) {
      prompt += `CORE PATTERNS: ${leadershipProfile.corePatterns.join("; ")}\n`;
    }
    if (leadershipProfile.growthEdges && leadershipProfile.growthEdges.length > 0) {
      prompt += `GROWTH EDGES: ${leadershipProfile.growthEdges.join("; ")}\n`;
    }
    if (leadershipProfile.coachingApproach) {
      prompt += `COACHING APPROACH: ${leadershipProfile.coachingApproach}\n`;
    }
  } else {
    prompt += `\nLEADERSHIP PROFILE: Not yet established. This leader is new. Listen deeply and start building your understanding.\n`;
  }

  // --- Behavioral evidence context ---
  if (recentEvidence && recentEvidence.length > 0) {
    prompt += `\nBEHAVIORAL EVIDENCE — specific observations from recent conversations (use these to ground your coaching in real data, not theory):\n`;
    recentEvidence.slice(0, 10).forEach((e) => {
      const cat = e.category ? `[${e.category}]` : "";
      prompt += `${cat} "${e.quote || e.observation}"`;
      if (e.relatedPattern) prompt += ` (pattern: ${e.relatedPattern})`;
      prompt += `\n`;
    });
    prompt += `Use this evidence naturally — reference specific things they've said or done when it deepens the conversation. Don't list it back to them.\n`;
  }

  // --- Active reveal context ---
  if (activeReveal) {
    prompt += `\nACTIVE REVEAL — a strategic observation was recently shared with this leader:\n`;
    prompt += `Type: ${activeReveal.type || "mirror-moment"}\n`;
    if (activeReveal.content) prompt += `What was said: "${activeReveal.content}"\n`;
    if (activeReveal.evidence) prompt += `Evidence behind it: ${activeReveal.evidence}\n`;
    if (activeReveal.status === "delivered") {
      prompt += `Status: Delivered but not yet acknowledged. If they bring it up, engage deeply. If they don't, don't force it — but it's context for understanding where they are.\n`;
    } else if (activeReveal.status === "pending") {
      prompt += `Status: Pending delivery (will be sent soon). Don't reference it directly — but you can steer the conversation toward the underlying pattern.\n`;
    }
  }

  // --- Recent weekly reflections (narrative memory) ---
  if (recentSummaries && recentSummaries.length > 0) {
    prompt += `\nPAST WEEKS — observations from prior weeks (reference naturally to create continuity, don't recap):\n`;
    recentSummaries.forEach((s) => {
      prompt += `- [Milestone ${s.weekNumber}, ${s.conversationCount} conversations]: ${s.summary}\n`;
    });
  }

  // --- Engagement signals (adapt your approach) ---
  if (engagementSignals) {
    const signals = [];
    if (engagementSignals.isShortReplier) {
      signals.push("Their replies are brief — match their energy. Be concise. Don't over-explain or ask compound questions.");
    }
    if (engagementSignals.hoursSinceLastReply > 72) {
      signals.push(`It's been ${engagementSignals.hoursSinceLastReply}+ hours since they last replied. They may be disengaged or busy. Be warm but low-pressure. Don't guilt them.`);
    }
    if (signals.length > 0) {
      prompt += `\nENGAGEMENT AWARENESS:\n${signals.join("\n")}\n`;
    }
  }

  // --- Conversation pacing ---
  if (channel === "sms" && mode !== "onboarding") {
    if (messageCount >= 10) {
      prompt += `\nPACING: This SMS conversation has ${messageCount} messages. Wrap up gracefully now — close with one sharp observation or question, then let them go. Don't introduce new topics.\n`;
    } else if (messageCount >= 7) {
      prompt += `\nPACING: This SMS conversation is getting long (${messageCount} messages). Start winding down within 1-2 more exchanges. Land the plane — don't keep it circling.\n`;
    }
  } else if (channel === "app" && mode !== "onboarding") {
    if (messageCount >= 16) {
      prompt += `\nPACING: This conversation has ${messageCount} messages. Begin wrapping up. Summarize what emerged, name the most important insight, and close.\n`;
    }
  }

  // --- Mode-specific instructions ---
  const modePrompts = {
    coach: `
MODE: COACH — Open, warm, but incisive coaching conversation.

RULES:
- Ask ONE question at a time. Never stack questions.
- Your questions should be impossible to answer without genuine reflection.
- Connect what they say now to patterns from previous conversations when relevant.
- Never give advice directly. Help them discover insights themselves.
- Be warm but never soft. Real growth requires real honesty.
- Keep responses under 100 words unless the moment requires more.
- Notice what they DON'T say as much as what they do.
- When you spot a gap between their Presented Self and Observed Self, name it gently but clearly.
- Use their name occasionally — not every message.
- If they deflect with humor or intellectualizing, gently name it.
- Don't keep returning to the same tension or growth edge conversation after conversation. If you've explored it recently, move to a different facet of their leadership.`,

    practice: `
MODE: PRACTICE — Situation Simulator. You role-play real scenarios.

RULES:
- The user will describe a real situation they want to rehearse. You play the other person.
- Stay in character as the other person. Don't break character to coach.
- Be realistic — don't make it easy. Real people push back, get defensive, go quiet.
- After 4-6 exchanges in character, pause and step OUT of character to debrief.
- In debrief: ask "What did you notice? Where did you fall back on old patterns?"
- If their approach reveals a gap in their Leadership Profile, note it.
- When starting, ask: "Who am I playing, and what's the situation?"`,

    mirror: `
MODE: MIRROR — Reflecting behavioral patterns back to the leader.

RULES:
- Share specific observations with evidence (their own words when possible).
- Present the gap: what they say about themselves vs. what you've observed.
- Be direct but not cruel. This is confrontation in service of growth.
- Ask: "Does this land? Or does it feel off?" — give them space to push back.
- If they dismiss a valid observation, gently name the dismissal pattern.
- Reference specific tensions and where they sit on each spectrum.
- This mode is powerful — use it to create genuine "aha" moments.`,

    debrief: `
MODE: DEBRIEF — Structured weekly reflection on the experiment.

RULES:
- Focus on this week's experiment: "${experiment}"
- Walk through: What happened? What surprised you? What was hard? What did you learn?
- Connect the experiment to their broader leadership patterns.
- Help them see growth — even small shifts matter.
- End with: "What's one thing you want to carry into next week?"
- Keep it grounded in specifics, not abstract philosophizing.
- Celebrate genuine effort even when results were messy.`,

    onboarding: `
MODE: ONBOARDING — Building the initial Leadership Profile through conversation.

This is your FIRST conversation with this leader. You know nothing about them yet. Your job is to understand who they are as a leader — not through a form, but through genuine curiosity.

IMPORTANT: This should be a SHORT conversation — 4-5 exchanges total. Users are busy leaders. Get what you need efficiently while keeping it warm and human.

CONVERSATION FLOW:
1. Welcome + ask about their role and team (1 message)
2. "What kind of leader do you think you are? And what's the hardest part right now?" (1 message)
3. Follow up on what they said — dig into one thing that feels real (1 message)
4. "If your team described working with you — what would they say? And what do you hope they wouldn't?" (1 message)
5. Wrap up: reflect back 1-2 sharp observations about their leadership, and tell them you're ready to start. (1 message)

RULES:
- Keep it to 4-5 total exchanges. Do NOT keep asking new questions after exchange 5.
- Combine related questions into one message when natural.
- Be warm and genuinely curious — this sets the tone for the entire program.
- Keep responses conversational and under 60 words.
- Listen for: values, fears, blind spots, self-awareness signals.
${messageCount >= 8 ? "- YOU MUST WRAP UP NOW. Summarize what you heard, share 1-2 observations, and tell them you're excited to start working together. Do not ask another question." : ""}
${messageCount >= 6 ? "- Begin wrapping up soon. One more exchange at most before your summary." : ""}`,
  };

  prompt += modePrompts[mode] || modePrompts.coach;

  // --- Universal rules ---
  prompt += `

UNIVERSAL RULES (all modes):
- Never mention that you're an AI, a language model, or that you have a "system prompt."
- Never use bullet points in your responses — write naturally, like a real conversation.
- Never say "That's a great question" or "Thanks for sharing." Just respond.
- If you don't know something, say so. Don't fabricate insights.
- Match the leader's energy — if they're brief, be brief. If they're reflective, go deeper.
- This is a conversation, not a coaching session template. Be human.`;

  // --- SMS channel adjustments ---
  if (channel === "sms") {
    prompt += `

SMS CHANNEL RULES (in addition to above):
- Keep responses under 320 characters (2 SMS segments max). Be concise.
- No formatting — no asterisks, no markdown, no bullet points.
- Write like a text message from a trusted mentor, not a chatbot.
- One thought per message. If you have two things to say, say the more important one.
- Match texting energy — casual but substantive.`;

    if (interactionType) {
      const smsTypeInstructions = {
        "live-ammo": "This is a LIVE-AMMO QUESTION — connected to something real happening in their work today. Be specific and timely.",
        "pattern-interrupt": "This is a PATTERN INTERRUPT — an unexpected observation that disrupts autopilot thinking. Be surprising but grounded in evidence from their profile.",
        "micro-experiment": "This is a MICRO-EXPERIMENT — suggest a tiny 30-second behavioral experiment they can try RIGHT NOW. Make it concrete and doable.",
        "moment-capture": "This is a MOMENT CAPTURE — they're reporting a leadership moment in real-time. Capture the raw experience before they rationalize it. Ask what they felt, not what they think.",
        "connector": "This is a CONNECTOR — link something they just said to something they said in a previous conversation. Show the pattern. Let them sit with it.",
        "pre-game": "This is a PRE-GAME — mental warm-up before a known high-stakes moment. Help them show up intentionally, not reactively.",
        "post-game": "This is a POST-GAME — they just went through something significant. Capture what happened while it's fresh. Don't coach yet — just help them process.",
        "provocation": "This is a PROVOCATION — a deliberately uncomfortable observation. Use sparingly. It should be something true that they haven't been willing to see. Say it with care but don't soften it into nothing.",
        "cohort-thread": "This is a COHORT THREAD — share an anonymous insight from their cohort peers. Create belonging and normalization. Never reveal who said it.",
        "celebration": "This is a CELEBRATION — specific, evidence-backed recognition of genuine growth. Reference exactly what changed and when. No generic praise.",
        "reveal": "This is a REVEAL FOLLOW-UP — you previously sent a strategic observation about a pattern or tension. The leader is responding. Hold the mirror steady. Don't soften what you said. Don't over-explain. Let them process. Ask what landed, what they're sitting with. If they push back, don't retreat — get curious about the pushback. This is the most important conversation you'll have with them.",
        "simulation": "This is a SIMULATION — you are role-playing a real person from their life. Stay in character. Be realistic. After 4-5 exchanges, break character with '--- TIMEOUT ---' and debrief what you observed about their patterns.",
        "prescription": "This is a PRESCRIPTION FOLLOW-UP — a piece of curated content was delivered to this leader based on their growth edge. If they respond, help them connect the concept to their real leadership. Don't lecture — help them apply it. Ask what resonated and what felt off.",
        "ascent-checkin": "This is an ASCENT PHASE CHECK-IN — this leader has completed the Arena Foundations program and is in ongoing coaching. You know them well. Be warm but don't coddle. Reference specific patterns and growth edges from their program. One question. Make it count.",
      };
      if (smsTypeInstructions[interactionType]) {
        prompt += `\n\nINTERACTION TYPE: ${smsTypeInstructions[interactionType]}`;
      }
    }
  }

  return prompt;
}

// ============================================================================
// LEADERSHIP LAB — SMS Integration
// ============================================================================

/**
 * transcribeVoiceMemo — Downloads audio from Twilio and transcribes via Gemini.
 *
 * Uses Gemini's native audio understanding (no File API needed for short clips).
 * Twilio voice memos are typically < 2 min, well within Gemini's inline limit.
 *
 * @param {string} mediaUrl - Twilio MediaUrl (includes auth)
 * @param {string} mimeType - e.g. "audio/ogg", "audio/amr", "audio/mpeg"
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeVoiceMemo(mediaUrl, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("GEMINI_API_KEY not configured for voice memo transcription");
    throw new Error("Transcription service not configured");
  }

  // Download audio from Twilio (URL includes account auth)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const fetchOptions = {};
  if (twilioSid && twilioAuth) {
    fetchOptions.headers = {
      Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64"),
    };
  }

  const response = await fetch(mediaUrl, fetchOptions);
  if (!response.ok) {
    throw new Error(`Failed to download voice memo: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);
  const audioBase64 = audioBuffer.toString("base64");

  // Size check — Gemini inline limit is ~20MB
  const sizeMB = audioBuffer.length / (1024 * 1024);
  if (sizeMB > 20) {
    throw new Error(`Voice memo too large (${sizeMB.toFixed(1)}MB)`);
  }

  logger.info("Transcribing voice memo", { sizeMB: sizeMB.toFixed(2), mimeType });

  // Use Gemini for transcription — it natively understands audio
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType || "audio/ogg",
        data: audioBase64,
      },
    },
    {
      text: "Transcribe this voice memo exactly as spoken. Return ONLY the transcription — no labels, timestamps, or commentary. If the audio is unclear or silent, respond with '[inaudible]'.",
    },
  ]);

  const transcription = result.response.text().trim();
  if (!transcription || transcription === "[inaudible]") {
    throw new Error("Could not transcribe voice memo");
  }

  logger.info("Voice memo transcribed", { length: transcription.length });
  return transcription;
}

/**
 * labSmsWebhook — Receives inbound SMS from Twilio.
 *
 * Flow:
 * 1. Twilio POSTs to this endpoint when a user texts the Lab number.
 * 2. Look up user by phone number in ll-users.
 * 3. If unknown number, reply with a "not enrolled" message.
 * 4. If user hasn't completed onboarding, route to onboarding mode.
 * 5. Otherwise find/create today's active SMS conversation and route through AI.
 * 6. Reply via TwiML.
 */
exports.labSmsWebhook = onRequest(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    region: "us-central1",
    maxInstances: 20,
  },
  async (req, res) => {
    // Twilio sends POST requests
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    // Validate Twilio signature — MANDATORY for production security
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    if (!twilioAuth) {
      logger.error("TWILIO_AUTH_TOKEN not configured — rejecting webhook");
      res.status(500).send("Server misconfiguration");
      return;
    }
    const signature = req.headers["x-twilio-signature"];
    const url = `https://${req.headers.host}${req.originalUrl}`;
    const valid = twilio.validateRequest(twilioAuth, signature, url, req.body);
    if (!valid) {
      logger.warn("Invalid Twilio signature on labSmsWebhook", { from: maskPhone(req.body?.From) });
      res.status(403).send("Forbidden");
      return;
    }

    const fromPhone = req.body.From; // E.164
    const body = (req.body.Body || "").trim();
    const numMedia = parseInt(req.body.NumMedia || "0", 10);
    const smsSid = req.body.MessageSid || req.body.SmsSid;

    // --- IDEMPOTENCY: Prevent duplicate processing on Twilio retries ---
    if (smsSid) {
      const dedupRef = admin.firestore().doc(`${LL_PREFIX}processed-sms/${smsSid}`);
      const dedupSnap = await dedupRef.get();
      if (dedupSnap.exists) {
        logger.info("Duplicate SMS webhook ignored", { smsSid, from: maskPhone(fromPhone) });
        res.set("Content-Type", "text/xml");
        res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        return;
      }
      // Mark as processing immediately (before AI call)
      await dedupRef.set({ processedAt: admin.firestore.FieldValue.serverTimestamp() });
    }

    logger.info("Lab SMS received", { from: maskPhone(fromPhone), bodyLength: body.length, numMedia });

    // TwiML helper
    const twiml = (message) => {
      res.set("Content-Type", "text/xml");
      res.status(200).send(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
      );
    };

    // --- TCPA COMPLIANCE: Handle opt-out and help keywords ---
    const upperBody = body.toUpperCase();
    if (["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(upperBody)) {
      // Mark user as opted out in Firestore
      try {
        const optOutUser = await lookupLabUserByPhone(fromPhone);
        if (optOutUser) {
          await admin.firestore().doc(`${LL_PREFIX}users/${optOutUser.uid}`).update({
            smsOptIn: false,
            smsOptOutAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          logger.info("User opted out of SMS", { phone: maskPhone(fromPhone), uid: optOutUser.uid });
        }
      } catch (optOutErr) {
        logger.error("Failed to record opt-out", { phone: maskPhone(fromPhone), error: optOutErr.message });
      }
      // Twilio auto-handles STOP for toll-free/short codes, but we send confirmation anyway
      twiml("You've been unsubscribed from Leadership Lab texts. Reply START to re-subscribe anytime.");
      return;
    }

    if (["HELP", "INFO"].includes(upperBody)) {
      twiml("Leadership Lab \u2014 AI leadership coaching via text. Reply STOP to unsubscribe. For support, contact your facilitator or email support@leaderreps.com.");
      return;
    }

    if (upperBody === "START") {
      // Re-subscribe
      try {
        const startUser = await lookupLabUserByPhone(fromPhone);
        if (startUser) {
          await admin.firestore().doc(`${LL_PREFIX}users/${startUser.uid}`).update({
            smsOptIn: true,
            smsOptOutAt: null,
          });
          logger.info("User re-subscribed to SMS", { phone: maskPhone(fromPhone), uid: startUser.uid });
        }
      } catch (startErr) {
        logger.error("Failed to record re-subscribe", { phone: maskPhone(fromPhone), error: startErr.message });
      }
      twiml("Welcome back! You're re-subscribed to Leadership Lab. Your coach is here whenever you need.");
      return;
    }

    // --- ENGAGEMENT LEVEL: Let users text LIGHT / MEDIUM / HEAVY to change frequency ---
    if (["LIGHT", "MEDIUM", "HEAVY"].includes(upperBody)) {
      const levelMap = { LIGHT: 1, MEDIUM: 2, HEAVY: 3 };
      const descMap = { LIGHT: "2-3 texts/week", MEDIUM: "~5 texts/week", HEAVY: "~10 texts/week" };
      try {
        const engUser = await lookupLabUserByPhone(fromPhone);
        if (engUser) {
          await admin.firestore().doc(`${LL_PREFIX}users/${engUser.uid}`).update({
            engagementLevel: levelMap[upperBody],
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          logger.info("User changed engagement level", { phone: maskPhone(fromPhone), level: upperBody });
        }
      } catch (engErr) {
        logger.error("Failed to update engagement level", { phone: maskPhone(fromPhone), error: engErr.message });
      }
      twiml(`Got it — switched to ${upperBody.toLowerCase()} mode (${descMap[upperBody]}). You can change anytime by texting LIGHT, MEDIUM, or HEAVY.`);
      return;
    }

    try {
      // --- Look up user by phone ---
      const user = await lookupLabUserByPhone(fromPhone);

      if (!user) {
        twiml("Hey — this number isn't enrolled in Leadership Lab yet. If you think this is a mistake, reach out to your facilitator.");
        return;
      }

      const { uid, profile } = user;

      // Handle voice memo (MMS with audio)
      let messageText = body;
      let isVoiceMemo = false;
      if (numMedia > 0) {
        const mediaType = req.body.MediaContentType0 || "";
        if (mediaType.startsWith("audio/")) {
          // Voice memo — transcribe via Gemini
          try {
            const mediaUrl = req.body.MediaUrl0;
            const transcription = await transcribeVoiceMemo(mediaUrl, mediaType);
            // Use transcription as the message (append to any accompanying text)
            messageText = body
              ? `${body}\n\n[Voice memo]: ${transcription}`
              : transcription;
            isVoiceMemo = true;
            logger.info("Voice memo transcribed for Lab user", { uid, length: transcription.length });
          } catch (transcribeErr) {
            logger.warn("Voice memo transcription failed", { uid, error: transcribeErr.message });
            // Graceful fallback — let them know we heard them
            if (!body) {
              twiml("I got your voice memo but had trouble understanding it. Could you text me what you were saying?");
              return;
            }
            // If they sent text + voice, just process the text
          }
        } else if (!body) {
          messageText = "[Media received]";
        }
      }

      if (!messageText) {
        twiml("Got it. Text me anytime you want to talk leadership.");
        return;
      }

      // --- Determine mode and week ---
      let mode = "coach";
      let weekNumber = profile.currentWeek || 1;

      if (!profile.onboardingComplete) {
        mode = "onboarding";
        weekNumber = 0;
      }

      // --- Find or create today's SMS conversation ---
      let conversationId = null;
      const activeConvo = await getActiveSmsConversation(uid);
      if (activeConvo) {
        conversationId = activeConvo.conversationId;
        // Inherit mode from the active conversation if it was AI-initiated
        if (activeConvo.data.mode) {
          mode = activeConvo.data.mode;
        }
      }

      // --- SITUATION SIMULATOR: Launch from pre-game replies ---
      // Only launch simulation when user is replying to a pre-game interaction
      // AND explicitly signals they want to practice (not just a long reflection).
      const simTriggerPhrases = ["practice", "simulate", "roleplay", "role play", "rehearse", "let's try", "lets try", "run through", "role-play", "prep me"];
      const wantsSimulation =
        activeConvo?.data?.interactionType === "pre-game" &&
        mode !== "onboarding" &&
        simTriggerPhrases.some((phrase) => messageText.toLowerCase().includes(phrase));

      if (wantsSimulation) {
        // First, save their reply to the pre-game conversation normally
        await processLabMessage(uid, messageText, {
          conversationId,
          mode: "coach",
          weekNumber,
          channel: "sms",
          interactionType: "pre-game",
        });

        // Parse scenario from their message using Claude
        try {
          const apiKey = process.env.ANTHROPIC_API_KEY;
          const anthropic = new Anthropic({ apiKey });
          const parseResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 256,
            system: `Extract the scenario details from this leader's message about an upcoming situation. Return ONLY a JSON object: { "person": "who they'll be talking to (role/name)", "situation": "brief description of the conversation/scenario", "stakes": "what's at risk" }. If the message doesn't describe a clear scenario, return { "valid": false }.`,
            messages: [{ role: "user", content: messageText }],
          });
          const parsed = JSON.parse(parseResponse.content[0]?.text || "{}");

          if (parsed.valid !== false && parsed.situation) {
            // Launch the simulation
            const sim = await initiateSimulation(uid, fromPhone, {
              person: parsed.person || "the other person",
              situation: parsed.situation,
              stakes: parsed.stakes || "",
              weekNumber,
            });

            // Reply with the simulation's first message (already sent via SMS by initiateSimulation)
            // Return empty TwiML since the SMS was already sent
            res.set("Content-Type", "text/xml");
            res.status(200).send(
              `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`
            );
            return;
          }
        } catch (simErr) {
          logger.warn("Simulation auto-launch failed, falling back to normal reply", {
            uid,
            error: simErr.message,
          });
          // Fall through to normal processing
        }
      }

      // --- Process through AI ---
      const result = await processLabMessage(uid, messageText, {
        conversationId,
        mode,
        weekNumber,
        channel: "sms",
        interactionType: activeConvo?.data?.interactionType || null,
      });

      // Track last SMS response time for re-engagement detection
      try {
        await admin.firestore().doc(`${LL_PREFIX}users/${uid}`).update({
          lastSmsResponseAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (trackErr) {
        logger.warn("Failed to track lastSmsResponseAt", { uid, error: trackErr.message });
      }

      // --- REVEAL ENGINE: Track reveal responses ---
      if (activeConvo?.data?.revealId) {
        const revealId = activeConvo.data.revealId;
        try {
          const revealRef = admin.firestore().doc(`${LL_PREFIX}users/${uid}/reveals/${revealId}`);
          const revealSnap = await revealRef.get();
          if (revealSnap.exists && revealSnap.data().status === "delivered") {
            await revealRef.update({
              status: "acknowledged",
              userResponse: messageText.slice(0, 500),
              acknowledgedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            logger.info("Reveal acknowledged by user", { uid, revealId });
          }
        } catch (revealErr) {
          logger.warn("Failed to update reveal response", { uid, revealId, error: revealErr.message });
        }
      }

      // --- Check if onboarding should auto-complete ---
      if (mode === "onboarding") {
        const convoSnap = await admin.firestore()
          .doc(`${LL_PREFIX}users/${uid}/conversations/${result.conversationId}`)
          .get();
        const messages = convoSnap.exists ? convoSnap.data().messages || [] : [];
        const userMessages = messages.filter((m) => m.role === "user");

        if (userMessages.length >= 4) {
          // Enough exchanges — trigger onboarding completion
          try {
            await completeLabOnboarding(uid, result.conversationId);
            logger.info("SMS onboarding auto-completed", { uid });
          } catch (e) {
            logger.warn("SMS onboarding completion failed, will retry later", { uid, error: e.message });
          }
        }
      }

      twiml(result.response);
    } catch (error) {
      logger.error("labSmsWebhook error", error);
      twiml("Something went wrong on my end. Try again in a minute.");
    }
  }
);

/** Escape XML special characters for TwiML */
function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Shared onboarding completion logic — used by both labCompleteOnboarding callable
 * and the SMS webhook auto-complete.
 */
async function completeLabOnboarding(uid, conversationId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");

  const db = admin.firestore();

  // Idempotency guard — don't re-process if already onboarded
  const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
  if (userSnap.exists && userSnap.data().onboardingComplete) {
    logger.info("Onboarding already complete, skipping", { uid });
    return userSnap.data();
  }

  const convoRef = db.doc(`${LL_PREFIX}users/${uid}/conversations/${conversationId}`);
  const convoSnap = await convoRef.get();
  if (!convoSnap.exists) throw new Error("Onboarding conversation not found");

  const messages = convoSnap.data().messages || [];
  if (messages.length < 4) throw new Error("Conversation too short");

  const transcript = messages
    .map((m) => `${m.role === "user" ? "LEADER" : "COACH"}: ${m.content}`)
    .join("\n\n");

  const anthropic = new Anthropic({ apiKey });

  // Build Leadership Profile
  const profileResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `You are a leadership psychologist analyzing an onboarding conversation between a leadership coach and a new program participant. Your job is to create an initial Leadership Profile.

Analyze the conversation transcript and produce a JSON object with this exact structure:
{
  "presentedSelf": "A 2-3 sentence summary of how this leader describes themselves.",
  "observedSelf": "A 2-3 sentence summary of behavioral patterns you OBSERVED in the conversation.",
  "tensions": [
    {"left": "Value A", "right": "Opposing Value B", "position": 50, "evidence": "Brief quote or observation"}
  ],
  "corePatterns": ["Pattern 1 in 1 sentence", "Pattern 2 in 1 sentence"],
  "keyInsights": [{"insight": "Key observation", "evidence": "Their own words or behavior"}],
  "growthEdges": ["Area for development 1", "Area for development 2"],
  "coachingApproach": "A 2-sentence recommendation for how to coach this specific person."
}

Return ONLY the JSON object. No markdown. Be honest but compassionate.`,
    messages: [{ role: "user", content: transcript }],
  });

  const profileText = profileResponse.content[0]?.text || "{}";
  let profile;
  try {
    profile = JSON.parse(profileText);
  } catch {
    profile = {
      presentedSelf: profileText,
      observedSelf: "",
      tensions: [],
      corePatterns: [],
      keyInsights: [],
      growthEdges: [],
      coachingApproach: "",
    };
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  // Save Leadership Profile
  await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).set({
    ...profile,
    createdAt: now,
    updatedAt: now,
    source: "onboarding",
    onboardingConversationId: conversationId,
  });

  // Generate summary
  const summaryResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: "Summarize this coaching onboarding conversation in 1-2 sentences. Focus on key themes and the leader's primary growth area.",
    messages: [{ role: "user", content: transcript }],
  });
  const summary = summaryResponse.content[0]?.text || "";
  await convoRef.update({ summary, updatedAt: now });

  // Mark user as onboarded
  await db.doc(`${LL_PREFIX}users/${uid}`).update({
    onboardingComplete: true,
    currentPhase: "foundation",
    currentWeek: 1,
    onboardedAt: now,
  });

  return profile;
}

// ============================================================================
// LEADERSHIP LAB — Cohort Management
// ============================================================================

/**
 * labSetupCohort — Create a new cohort with start date and facilitators.
 * Admin-only callable.
 */
exports.labSetupCohort = onCall(
  {
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const db = admin.firestore();

    // Check admin
    const adminDoc = await db.doc("metadata/config").get();
    const adminEmails = adminDoc.exists ? (adminDoc.data().adminemails || []) : [];
    const userEmail = (request.auth.token.email || "").toLowerCase();
    if (!adminEmails.map((e) => e.toLowerCase()).includes(userEmail)) {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { name, startDate, facilitatorIds = [], weekCount = 6 } = request.data || {};

    if (!name || typeof name !== "string") {
      throw new HttpsError("invalid-argument", "Cohort name is required");
    }
    if (!startDate || typeof startDate !== "string") {
      throw new HttpsError("invalid-argument", "Start date is required (YYYY-MM-DD)");
    }

    // Validate date format
    const parsedDate = new Date(startDate + "T00:00:00Z");
    if (isNaN(parsedDate.getTime())) {
      throw new HttpsError("invalid-argument", "Invalid date format. Use YYYY-MM-DD.");
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const cohortRef = db.collection(`${LL_PREFIX}cohorts`).doc();

    await cohortRef.set({
      name,
      startDate: admin.firestore.Timestamp.fromDate(parsedDate),
      facilitatorIds,
      weekCount,
      phase: "prep", // prep → active → post
      isActive: false,
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: request.auth.uid,
    });

    // Create facilitator records
    for (const fId of facilitatorIds) {
      await db.doc(`${LL_PREFIX}facilitators/${fId}`).set(
        { cohorts: admin.firestore.FieldValue.arrayUnion(cohortRef.id), updatedAt: now },
        { merge: true }
      );
    }

    logger.info("labSetupCohort created", { cohortId: cohortRef.id, name, startDate });

    return {
      success: true,
      cohortId: cohortRef.id,
      name,
      startDate,
    };
  }
);

/**
 * labAddParticipant — Add a participant to a cohort by phone number.
 * Creates ll-user record, links to cohort, sends welcome text.
 * Admin-only callable.
 */
exports.labAddParticipant = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const db = admin.firestore();

    // Check admin
    const adminDoc = await db.doc("metadata/config").get();
    const adminEmails = adminDoc.exists ? (adminDoc.data().adminemails || []) : [];
    const userEmail = (request.auth.token.email || "").toLowerCase();
    if (!adminEmails.map((e) => e.toLowerCase()).includes(userEmail)) {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { cohortId, phone, firstName, lastName, email, role, engagementLevel } = request.data || {};

    if (!cohortId || typeof cohortId !== "string") {
      throw new HttpsError("invalid-argument", "cohortId is required");
    }
    if (!phone || typeof phone !== "string") {
      throw new HttpsError("invalid-argument", "Phone number is required (E.164 format)");
    }

    // Validate E.164 format
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
      throw new HttpsError("invalid-argument", "Phone must be E.164 format (e.g. +15551234567)");
    }

    // Verify cohort exists
    const cohortRef = db.doc(`${LL_PREFIX}cohorts/${cohortId}`);
    const cohortSnap = await cohortRef.get();
    if (!cohortSnap.exists) {
      throw new HttpsError("not-found", "Cohort not found");
    }

    // Check if phone already registered
    const existing = await lookupLabUserByPhone(phone);
    let uid;

    const now = admin.firestore.FieldValue.serverTimestamp();

    if (existing) {
      uid = existing.uid;
      // Update existing user with cohort assignment
      await db.doc(`${LL_PREFIX}users/${uid}`).update({
        cohortId,
        updatedAt: now,
      });
    } else {
      // Create new ll-user (no Firebase Auth account needed for SMS-only users)
      const userRef = db.collection(`${LL_PREFIX}users`).doc();
      uid = userRef.id;
      await userRef.set({
        phone,
        firstName: firstName || null,
        lastName: lastName || null,
        displayName: firstName || null,
        email: email || null,
        role: role || null,
        cohortId,
        onboardingComplete: false,
        currentPhase: "prep",
        currentWeek: 0,
        smsOptIn: true,
        engagementLevel: [1, 2, 3].includes(engagementLevel) ? engagementLevel : 2,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Add to cohort members
    await db.doc(`${LL_PREFIX}cohorts/${cohortId}/members/${uid}`).set({
      phone,
      firstName: firstName || null,
      status: "enrolled",
      joinedAt: now,
    });

    // Update member count
    await cohortRef.update({
      memberCount: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    // Send welcome text
    const cohortData = cohortSnap.data();
    try {
      await sendLabSms(
        phone,
        `Welcome to Leadership Lab${firstName ? ", " + firstName : ""}. Over the next ${cohortData.weekCount || 6} weeks, I'll be your AI coach — texting you 1-2x a day to help you see your leadership clearly. No app needed. Just reply to my texts. Your first real message comes when your program starts. Talk soon.`
      );
      logger.info("Welcome SMS sent", { uid, phone });
    } catch (smsErr) {
      logger.warn("Failed to send welcome SMS", { phone, error: smsErr.message });
      // Don't fail the operation — user is still enrolled
    }

    logger.info("labAddParticipant success", { uid, cohortId, phone });

    return {
      success: true,
      userId: uid,
      cohortId,
      phone,
    };
  }
);

// ============================================================================
// LEADERSHIP LAB — Scheduled SMS Engine
// ============================================================================

/**
 * labScheduledSms — Runs twice daily (9 AM and 5 PM ET).
 *
 * For each active cohort:
 * 1. Determine current week and day
 * 2. Select the right interaction type for each member
 * 3. Generate a personalized AI message
 * 4. Send via SMS
 * 5. Store the conversation in Firestore
 */
exports.labScheduledSms = onSchedule(
  {
    schedule: "0 9,17 * * 1-5", // 9 AM and 5 PM UTC, weekdays
    timeZone: "America/New_York",
    secrets: ["ANTHROPIC_API_KEY"],
    region: "us-central1",
    maxInstances: 1,
    timeoutSeconds: 540,
  },
  async (event) => {
    const db = admin.firestore();
    const now = new Date();
    const hour = now.getHours(); // In ET due to timeZone config
    const isAM = hour < 12;

    logger.info("labScheduledSms triggered", { hour, isAM });

    // Get active cohorts
    const cohortsSnap = await db
      .collection(`${LL_PREFIX}cohorts`)
      .where("isActive", "==", true)
      .get();

    if (cohortsSnap.empty) {
      logger.info("No active cohorts — nothing to send");
      return;
    }

    let totalSent = 0;
    let totalErrors = 0;

    for (const cohortDoc of cohortsSnap.docs) {
      const cohort = cohortDoc.data();
      const cohortId = cohortDoc.id;
      const weekNumber = getCohortWeekNumber(cohort.startDate, cohort.weekCount || 6);

      if (weekNumber > (cohort.weekCount || 6)) {
        logger.info("Cohort past end date, skipping", { cohortId });
        continue;
      }

      // Get cohort members
      const membersSnap = await db
        .collection(`${LL_PREFIX}cohorts/${cohortId}/members`)
        .where("status", "==", "enrolled")
        .get();

      for (const memberDoc of membersSnap.docs) {
        const memberId = memberDoc.id;
        const member = memberDoc.data();

        try {
          // Load user profile
          const userSnap = await db.doc(`${LL_PREFIX}users/${memberId}`).get();
          if (!userSnap.exists) continue;
          const userProfile = userSnap.data();

          // Skip if not onboarded or opted out
          if (!userProfile.onboardingComplete || !userProfile.smsOptIn) continue;

          // --- ENGAGEMENT LEVEL FILTERING ---
          // 1=light (~2-3/wk: Mon AM + Thu PM reveal only)
          // 2=medium (~5/wk: weekday AM only)
          // 3=heavy (~10/wk: weekday AM + PM — current full behavior)
          const engLevel = userProfile.engagementLevel || 2;
          const weekDay = now.getDay();
          if (engLevel === 1) {
            // Light: only Mon AM and Thu PM
            if (!(weekDay === 1 && isAM) && !(weekDay === 4 && !isAM)) continue;
          } else if (engLevel === 2) {
            // Medium: AM only (no PM texts)
            if (!isAM) continue;
          }
          // engLevel 3 (heavy): no filtering, send AM + PM

          // Use stored currentWeek from user profile if available, else calculate
          const memberWeek = userProfile.currentWeek || weekNumber;

          // --- RE-ENGAGEMENT: Check for silent participants (3+ days) ---
          if (isAM) {
            const lastActivity = userProfile.lastSmsResponseAt;
            if (lastActivity) {
              const lastDate = lastActivity.toDate ? lastActivity.toDate() : new Date(lastActivity);
              const daysSilent = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
              if (daysSilent >= 3) {
                // Send a gentle re-engagement nudge instead of regular content
                const nudges = [
                  `Hey ${userProfile.displayName || userProfile.firstName || "there"} — haven't heard from you in a few days. No pressure, just checking in. How's the experiment going?`,
                  `${userProfile.displayName || userProfile.firstName || "Hey"} — quick check-in. Even a one-word reply keeps the momentum going. What's on your mind today?`,
                  `Missing our chats, ${userProfile.displayName || userProfile.firstName || "friend"}. Leadership growth happens in the small moments. What's one thing you noticed about yourself this week?`,
                ];
                const nudge = nudges[daysSilent % nudges.length];

                const convoRef = db.collection(`${LL_PREFIX}users/${memberId}/conversations`).doc();
                const serverNow = admin.firestore.FieldValue.serverTimestamp();
                await convoRef.set({
                  mode: "coach",
                  weekNumber: memberWeek,
                  channel: "sms",
                  interactionType: "re-engagement",
                  aiInitiated: true,
                  messages: [
                    { role: "assistant", content: nudge, timestamp: new Date().toISOString(), channel: "sms" },
                  ],
                  summary: "",
                  createdAt: serverNow,
                  updatedAt: serverNow,
                });

                await sendLabSms(member.phone, nudge);
                totalSent++;
                logger.info("Re-engagement SMS sent", { memberId, cohortId, daysSilent });
                continue; // Skip normal SMS for this user today
              }
            }
          }

          // Don't send more than 2 texts per day
          const todayConvos = await getActiveSmsConversation(memberId);
          if (todayConvos) {
            const messages = todayConvos.data.messages || [];
            const aiMessages = messages.filter((m) => m.role === "assistant" && m.channel === "sms");
            if (aiMessages.length >= 2) continue; // Already sent 2 today
          }

          // Select interaction type
          const interactionType = selectInteractionType({
            weekNumber: memberWeek,
            isAM,
            userProfile,
            weekDay: now.getDay(), // 0=Sun, 1=Mon, ...
          });

          // Skip PM if AM already covered this type
          if (!isAM && todayConvos && todayConvos.data.interactionType === interactionType) {
            continue;
          }

          // --- REVEAL ENGINE: Thursday PM = reveal delivery slot ---
          const pendingReveal = (!isAM && now.getDay() === 4) ? await getPendingReveal(memberId) : null;

          if (pendingReveal) {
            // Deliver the reveal instead of a normal SMS
            const revealText = pendingReveal.data.content;
            const serverNow = admin.firestore.FieldValue.serverTimestamp();

            // Save reveal conversation
            const convoRef = db.collection(`${LL_PREFIX}users/${memberId}/conversations`).doc();
            await convoRef.set({
              mode: "mirror",
              weekNumber: memberWeek,
              channel: "sms",
              interactionType: "reveal",
              aiInitiated: true,
              revealId: pendingReveal.id,
              messages: [
                { role: "assistant", content: revealText, timestamp: new Date().toISOString(), channel: "sms" },
              ],
              summary: "",
              createdAt: serverNow,
              updatedAt: serverNow,
            });

            // Mark reveal as delivered
            await db.doc(`${LL_PREFIX}users/${memberId}/reveals/${pendingReveal.id}`).update({
              status: "delivered",
              deliveredAt: serverNow,
              conversationId: convoRef.id,
            });

            // Send the SMS
            await sendLabSms(member.phone, revealText);
            totalSent++;

            // Track interaction type for anti-repetition
            const recentTypesReveal = (userProfile.recentInteractionTypes || []).slice(-4);
            recentTypesReveal.push("reveal");
            await db.doc(`${LL_PREFIX}users/${memberId}`).update({ recentInteractionTypes: recentTypesReveal });

            logger.info("Reveal delivered via SMS", {
              memberId,
              cohortId,
              weekNumber: memberWeek,
              revealType: pendingReveal.data.type,
              revealId: pendingReveal.id,
            });
            continue; // Skip normal SMS for this user
          }

          // --- PRESCRIPTION ENGINE: Wednesday AM = prescription delivery slot ---
          if (interactionType === "prescription") {
            const rxSnap = await db.doc(`${LL_PREFIX}users/${memberId}/prescriptions/${memberWeek}`).get();
            if (rxSnap.exists && rxSnap.data().status === "pending") {
              const rxData = rxSnap.data();
              const rxText = rxData.smsDelivery;

              if (rxText) {
                const serverNow = admin.firestore.FieldValue.serverTimestamp();

                // Save prescription delivery conversation
                const convoRef = db.collection(`${LL_PREFIX}users/${memberId}/conversations`).doc();
                await convoRef.set({
                  mode: "coach",
                  weekNumber: memberWeek,
                  channel: "sms",
                  interactionType: "prescription",
                  aiInitiated: true,
                  prescriptionWeek: memberWeek,
                  messages: [
                    { role: "assistant", content: rxText, timestamp: new Date().toISOString(), channel: "sms" },
                  ],
                  summary: "",
                  createdAt: serverNow,
                  updatedAt: serverNow,
                });

                // Mark prescription as delivered
                await rxSnap.ref.update({
                  status: "delivered",
                  deliveredAt: serverNow,
                });

                // Send the SMS
                await sendLabSms(member.phone, rxText);
                totalSent++;

                // Track interaction type for anti-repetition
                const recentTypesRx = (userProfile.recentInteractionTypes || []).slice(-4);
                recentTypesRx.push("prescription");
                await db.doc(`${LL_PREFIX}users/${memberId}`).update({ recentInteractionTypes: recentTypesRx });

                logger.info("Prescription delivered via SMS", {
                  memberId,
                  cohortId,
                  weekNumber: memberWeek,
                  type: rxData.type,
                  topic: rxData.topic,
                });
                continue; // Skip normal SMS generation
              }
            }
            // If no prescription found, fall through to normal AI message
          }

          // Load personalized experiment (fall back to base if not designed yet)
          const challengeSnap = await db.doc(`${LL_PREFIX}users/${memberId}/challenges/${memberWeek}`).get();
          const personalExperiment = challengeSnap.exists
            ? (challengeSnap.data().personalizedExperiment || LL_EXPERIMENTS[weekIdx(memberWeek)])
            : LL_EXPERIMENTS[weekIdx(memberWeek)];

          // If experiment exists and is "assigned", mark as in-progress on first text
          if (challengeSnap.exists && challengeSnap.data().status === "assigned") {
            await challengeSnap.ref.update({
              status: "in-progress",
              startedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          // Generate the AI-initiated message
          const prompt = buildOutboundSmsPrompt({
            interactionType,
            userName: userProfile.displayName || userProfile.firstName || "there",
            weekNumber: memberWeek,
            weekTheme: LL_WEEK_THEMES[weekIdx(memberWeek)],
            experiment: personalExperiment,
          });

          // Load leadership profile for context
          const lpSnap = await db.doc(`${LL_PREFIX}users/${memberId}/leadershipProfile/current`).get();
          const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;

          const systemPrompt = buildLabSystemPrompt({
            mode: "coach",
            userName: userProfile.displayName || userProfile.firstName || "there",
            weekNumber: memberWeek,
            weekTheme: LL_WEEK_THEMES[weekIdx(memberWeek)],
            experiment: personalExperiment,
            leadershipProfile,
            messageCount: 0,
            channel: "sms",
            interactionType,
            phase: userProfile.phase || (memberWeek > 6 ? "ascent" : "foundation"),
          });

          const apiKey = process.env.ANTHROPIC_API_KEY;
          const anthropic = new Anthropic({ apiKey });
          const aiResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 400,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
          });

          const aiText = aiResponse.content[0]?.text || "";
          if (!aiText) continue;

          // Save as a new conversation
          const convoRef = db.collection(`${LL_PREFIX}users/${memberId}/conversations`).doc();
          const serverNow = admin.firestore.FieldValue.serverTimestamp();
          await convoRef.set({
            mode: "coach",
            weekNumber: memberWeek,
            channel: "sms",
            interactionType,
            aiInitiated: true,
            messages: [
              { role: "assistant", content: aiText, timestamp: new Date().toISOString(), channel: "sms" },
            ],
            summary: "",
            createdAt: serverNow,
            updatedAt: serverNow,
          });

          // Send the SMS
          await sendLabSms(member.phone, aiText);
          totalSent++;

          // Track interaction type for anti-repetition
          const recentTypes = (userProfile.recentInteractionTypes || []).slice(-4);
          recentTypes.push(interactionType);
          await db.doc(`${LL_PREFIX}users/${memberId}`).update({ recentInteractionTypes: recentTypes });

          logger.info("Scheduled SMS sent", {
            memberId,
            cohortId,
            weekNumber: memberWeek,
            interactionType,
          });
        } catch (memberErr) {
          totalErrors++;
          logger.error("Failed to send scheduled SMS to member", {
            memberId,
            cohortId,
            error: memberErr.message,
          });
        }
      }
    }

    logger.info("labScheduledSms complete", { totalSent, totalErrors });
  }
);

/**
 * Select the right interaction type based on week, time of day, and user context.
 */
function selectInteractionType({ weekNumber, isAM, userProfile, weekDay }) {
  // Monday AM = always live-ammo (start the week connected to reality)
  if (weekDay === 1 && isAM) return "live-ammo";

  // Tuesday AM = pre-game (sets up potential simulation if they reply)
  if (weekDay === 2 && isAM && weekNumber >= 2) return "pre-game";

  // Wednesday AM = prescribed content delivery
  if (weekDay === 3 && isAM) return "prescription";

  // Wednesday PM = mid-week experiment check
  if (weekDay === 3 && !isAM) return "post-game";

  // Friday PM = weekly debrief prompt
  if (weekDay === 5 && !isAM) return "moment-capture";

  // Provocation = max once per week, never on Monday
  if (weekDay === 4 && isAM && weekNumber > 1) return "provocation";

  // Cohort thread sprinkled in (roughly 1x/week)
  if (weekDay === 2 && !isAM) return "cohort-thread";

  // Build a weighted pool for other slots
  const pool = [];

  // AM tends toward forward-looking types
  if (isAM) {
    pool.push("live-ammo", "live-ammo", "micro-experiment", "pre-game", "connector");
  } else {
    // PM tends toward reflective types
    pool.push("moment-capture", "moment-capture", "post-game", "connector", "pattern-interrupt");
  }

  // Later weeks get more mirrors and celebrations
  if (weekNumber >= 3) pool.push("pattern-interrupt", "celebration");
  if (weekNumber >= 5) pool.push("celebration", "celebration");

  // Anti-repetition: exclude recently used types
  const recentTypes = (userProfile?.recentInteractionTypes || []).slice(0, 3);
  const filtered = pool.filter((t) => !recentTypes.includes(t));
  const finalPool = filtered.length > 0 ? filtered : pool;

  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Build the "user" message that prompts Claude to generate an AI-initiated text.
 * This is a meta-prompt — the AI generates the text TO send, not a reply to a user.
 */
function buildOutboundSmsPrompt({ interactionType, userName, weekNumber, weekTheme, experiment }) {
  return `Generate a single outbound text message to send to ${userName}. This is an AI-INITIATED text — the user did NOT text first. You are reaching out.

Interaction type: ${interactionType}
Week ${weekNumber}: ${weekTheme}
Current experiment: ${experiment}

Write ONLY the text message itself. No preamble, no explanation, no "Here's a message:" — just the raw text as it would appear on their phone. Keep it under 320 characters. Make it feel like it's from a real coach who knows them, not a bot.`;
}

/**
 * labStartCohort — Activate a cohort and trigger the first onboarding texts.
 * Admin-only callable.
 */
exports.labStartCohort = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const db = admin.firestore();

    // Check admin
    const adminDoc = await db.doc("metadata/config").get();
    const adminEmails = adminDoc.exists ? (adminDoc.data().adminemails || []) : [];
    const userEmail = (request.auth.token.email || "").toLowerCase();
    if (!adminEmails.map((e) => e.toLowerCase()).includes(userEmail)) {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { cohortId } = request.data || {};
    if (!cohortId || typeof cohortId !== "string") {
      throw new HttpsError("invalid-argument", "cohortId is required");
    }

    const cohortRef = db.doc(`${LL_PREFIX}cohorts/${cohortId}`);
    const cohortSnap = await cohortRef.get();
    if (!cohortSnap.exists) {
      throw new HttpsError("not-found", "Cohort not found");
    }

    const cohort = cohortSnap.data();
    if (cohort.isActive) {
      throw new HttpsError("already-exists", "Cohort is already active");
    }

    // Mark cohort as active
    const now = admin.firestore.FieldValue.serverTimestamp();
    await cohortRef.update({
      isActive: true,
      phase: "active",
      startDate: admin.firestore.Timestamp.fromDate(new Date()),
      updatedAt: now,
    });

    // Send onboarding kick-off text to all enrolled members
    const membersSnap = await db
      .collection(`${LL_PREFIX}cohorts/${cohortId}/members`)
      .where("status", "==", "enrolled")
      .get();

    let sent = 0;
    let errors = 0;

    for (const memberDoc of membersSnap.docs) {
      const memberId = memberDoc.id;
      const member = memberDoc.data();

      try {
        const userSnap = await db.doc(`${LL_PREFIX}users/${memberId}`).get();
        if (!userSnap.exists) continue;
        const userProfile = userSnap.data();

        if (userProfile.onboardingComplete) continue; // Already onboarded

        const firstName = userProfile.firstName || userProfile.displayName || "";

        await sendLabSms(
          member.phone,
          `${firstName ? firstName + ", it's" : "It's"} time. Your Leadership Lab program starts now. I'm your AI coach, and I want to understand how you lead. Let's start simple — what's your role, and how big is your team? Just text back.`
        );

        // Create the onboarding conversation so replies continue it
        const convoRef = db.collection(`${LL_PREFIX}users/${memberId}/conversations`).doc();
        await convoRef.set({
          mode: "onboarding",
          weekNumber: 0,
          channel: "sms",
          aiInitiated: true,
          messages: [
            {
              role: "assistant",
              content: `${firstName ? firstName + ", it's" : "It's"} time. Your Leadership Lab program starts now. I'm your AI coach, and I want to understand how you lead. Let's start simple — what's your role, and how big is your team? Just text back.`,
              timestamp: new Date().toISOString(),
              channel: "sms",
            },
          ],
          summary: "",
          createdAt: now,
          updatedAt: now,
        });

        sent++;
      } catch (err) {
        errors++;
        logger.error("Failed to send onboarding text", { memberId, error: err.message });
      }
    }

    logger.info("labStartCohort complete", { cohortId, sent, errors });

    return { success: true, cohortId, membersSent: sent, errors };
  }
);

// ============================================================================
// LEADERSHIP LAB — Situation Simulator
// ============================================================================

/**
 * initiateSimulation — Creates a practice-mode SMS conversation where the AI
 * role-plays a real person from the leader's life. Sends the first in-character text.
 *
 * Flow via SMS:
 * 1. Pre-game text asks about an upcoming situation
 * 2. Leader describes it (who, what, stakes)
 * 3. This function launches: AI becomes that person and texts in-character
 * 4. Leader practices their approach over 4-6 exchanges
 * 5. AI breaks character and debriefs: "What did you notice?"
 * 6. Debrief evidence gets captured for profile updates
 *
 * @param {string} uid - User ID
 * @param {string} phone - User's phone number for SMS
 * @param {object} scenario - { person, situation, stakes, weekNumber }
 * @returns {Promise<object>} The created conversation
 */
async function initiateSimulation(uid, phone, scenario) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");

  const db = admin.firestore();

  // Load Leadership Profile for context
  const lpSnap = await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).get();
  const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;

  const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
  const userName = userSnap.exists
    ? (userSnap.data().displayName || userSnap.data().firstName || "there")
    : "there";

  const weekNumber = scenario.weekNumber || (userSnap.exists ? userSnap.data().currentWeek : 1) || 1;
  const wIdx = weekIdx(weekNumber);

  // Build the simulation-specific system prompt
  let simPrompt = `You are playing a ROLE in a leadership simulation for ${userName}.

SCENARIO: ${scenario.situation || "A difficult leadership conversation"}
YOU ARE PLAYING: ${scenario.person || "A direct report"}
STAKES: ${scenario.stakes || "Unknown"}

RULES FOR THE SIMULATION:
- You ARE this person. Stay in character completely.
- Be realistic — push back, get defensive, go quiet, ask hard questions. Real people do.
- Match the emotional reality of this relationship. If the person described is difficult, BE difficult.
- Don't make it easy. Growth happens at the edge of comfort.
- Keep responses under 280 characters (you're texting as this person).
- After 4-5 exchanges, BREAK CHARACTER with "--- TIMEOUT ---" and debrief.
- In debrief: "OK, let's pause. What did you notice about yourself just now?" — then coach.
- In debrief, connect what happened to their Leadership Profile patterns.
- The debrief is the real gold. Don't rush it.`;

  if (leadershipProfile) {
    simPrompt += `

THINGS TO WATCH FOR (from their Leadership Profile):
- Patterns: ${(leadershipProfile.corePatterns || []).join("; ") || "None identified"}
- Growth Edges: ${(leadershipProfile.growthEdges || []).join("; ") || "None identified"}
- They tend to: ${leadershipProfile.observedSelf || "Unknown"}`;
    if (leadershipProfile.tensions && leadershipProfile.tensions.length > 0) {
      const tensionStr = leadershipProfile.tensions
        .map((t) => `lean toward ${t.position > 50 ? t.right : t.left} over ${t.position > 50 ? t.left : t.right}`)
        .join("; ");
      simPrompt += `\n- Tension habits: ${tensionStr}`;
    }
    simPrompt += `\n\nDuring the simulation, embody behaviors that will trigger their patterns. In the debrief, name what you saw.`;
  }

  simPrompt += `

SMS RULES: No formatting. No asterisks. No bullets. Text naturally, in character. Under 280 chars per message.`;

  // Generate the first in-character message
  const anthropic = new Anthropic({ apiKey });
  const firstMessage = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: simPrompt,
    messages: [{
      role: "user",
      content: `Start the simulation. You are ${scenario.person || "the other person"}. Open the conversation with something realistic that ${userName} would need to respond to. Stay in character.`,
    }],
  });

  const aiText = firstMessage.content[0]?.text || "";
  if (!aiText) throw new Error("Failed to generate simulation opening");

  // Save as a practice-mode conversation with scenario metadata
  const now = admin.firestore.FieldValue.serverTimestamp();
  const convoRef = db.collection(`${LL_PREFIX}users/${uid}/conversations`).doc();
  await convoRef.set({
    mode: "practice",
    weekNumber,
    channel: "sms",
    interactionType: "simulation",
    aiInitiated: true,
    simulation: {
      person: scenario.person || "Unknown",
      situation: scenario.situation || "",
      stakes: scenario.stakes || "",
      systemPrompt: simPrompt,
    },
    messages: [
      { role: "assistant", content: aiText, timestamp: new Date().toISOString(), channel: "sms" },
    ],
    summary: "",
    createdAt: now,
    updatedAt: now,
  });

  // Send the SMS
  await sendLabSms(phone, aiText);

  logger.info("Simulation initiated", {
    uid,
    weekNumber,
    person: scenario.person,
    conversationId: convoRef.id,
  });

  return {
    conversationId: convoRef.id,
    firstMessage: aiText,
  };
}

/**
 * labSimulate — Callable to initiate a situation simulation.
 * Can be triggered from the web app or by a facilitator.
 */
exports.labSimulate = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-test\.web\.app$/,
      /leaderreps-test\.firebaseapp\.com$/,
      /leaderreps-prod\.web\.app$/,
      /leaderreps-prod\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const uid = request.auth.uid;
    const { person, situation, stakes } = request.data || {};

    if (!situation) {
      throw new HttpsError("invalid-argument", "Situation description is required");
    }

    const db = admin.firestore();
    const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const phone = userSnap.data().phone;
    if (!phone) {
      throw new HttpsError("failed-precondition", "No phone number on file");
    }

    try {
      const result = await initiateSimulation(uid, phone, {
        person: person || "the other person",
        situation,
        stakes: stakes || "",
        weekNumber: userSnap.data().currentWeek || 1,
      });
      return { success: true, ...result };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labSimulate error", error);
      throw new HttpsError("internal", "Failed to start simulation");
    }
  }
);

// ============================================================================
// LEADERSHIP LAB — Experiment Designer
// ============================================================================

/**
 * labDesignExperiment — Generate a personalized experiment for a user's current week.
 *
 * Uses their Leadership Profile, conversation history, and week theme to create
 * a tailored behavioral experiment that targets their specific growth edges.
 *
 * Can be called automatically on week transition or manually by facilitator.
 */
exports.labDesignExperiment = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: true,
    region: "us-central1",
    invoker: "public",
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { userId, weekNumber } = request.data || {};

    // Either the user designs their own, or an admin/facilitator does it for someone
    const targetUid = userId || request.auth.uid;
    if (userId && userId !== request.auth.uid) {
      // Check admin/facilitator access
      const db = admin.firestore();
      const adminDoc = await db.doc("metadata/config").get();
      const adminEmails = adminDoc.exists ? (adminDoc.data().adminemails || []) : [];
      const userEmail = (request.auth.token.email || "").toLowerCase();
      if (!adminEmails.map((e) => e.toLowerCase()).includes(userEmail)) {
        throw new HttpsError("permission-denied", "Admin access required to design experiments for others");
      }
    }

    try {
      const result = await designExperimentForUser(targetUid, weekNumber);
      return result;
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labDesignExperiment error", error);
      throw new HttpsError("internal", "Failed to design experiment");
    }
  }
);

/**
 * Core experiment design logic — shared between callable and scheduled functions.
 */
async function designExperimentForUser(uid, weekNumber) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");

  const db = admin.firestore();

  // Load user profile
  const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
  if (!userSnap.exists) throw new Error("User not found");
  const userProfile = userSnap.data();
  const week = weekNumber || userProfile.currentWeek || 1;
  const wIdx = weekIdx(week);

  // Load Leadership Profile
  const lpSnap = await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).get();
  const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;

  // Load previous week's challenge (if any) for continuity
  let previousChallenge = null;
  if (week > 1) {
    const prevSnap = await db.doc(`${LL_PREFIX}users/${uid}/challenges/${week - 1}`).get();
    if (prevSnap.exists) previousChallenge = prevSnap.data();
  }

  // Load recent conversations for behavioral context
  const convosSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/conversations`)
    .orderBy("updatedAt", "desc")
    .limit(5)
    .get();

  const recentContext = [];
  convosSnap.forEach((doc) => {
    const data = doc.data();
    const lastMsg = (data.messages || []).filter((m) => m.role === "user").slice(-1)[0];
    if (lastMsg) {
      recentContext.push(`[${data.mode}, Week ${data.weekNumber}]: "${lastMsg.content.slice(0, 200)}"`);
    }
  });

  const baseTheme = LL_WEEK_THEMES[wIdx];
  const baseExperiment = LL_EXPERIMENTS[wIdx];
  const userName = userProfile.displayName || userProfile.firstName || "this leader";

  // Build the prompt
  let profileContext = "";
  if (leadershipProfile) {
    profileContext = `
LEADERSHIP PROFILE:
- Presented Self: ${leadershipProfile.presentedSelf || "Unknown"}
- Observed Self: ${leadershipProfile.observedSelf || "Unknown"}
- Core Patterns: ${(leadershipProfile.corePatterns || []).join("; ") || "None identified yet"}
- Growth Edges: ${(leadershipProfile.growthEdges || []).join("; ") || "None identified yet"}
- Coaching Approach: ${leadershipProfile.coachingApproach || "Not yet defined"}`;

    if (leadershipProfile.tensions && leadershipProfile.tensions.length > 0) {
      const tensionStr = leadershipProfile.tensions
        .map((t) => `${t.left} ↔ ${t.right} (leans ${t.position > 50 ? t.right : t.left})`)
        .join("; ");
      profileContext += `\n- Tensions: ${tensionStr}`;
    }
  }

  let prevContext = "";
  if (previousChallenge) {
    prevContext = `
LAST WEEK'S EXPERIMENT:
- Theme: ${previousChallenge.theme}
- Experiment: ${previousChallenge.personalizedExperiment || previousChallenge.experiment}
- Status: ${previousChallenge.status}
- AI Observation: ${previousChallenge.aiObservation || "None"}`;
  }

  const recentContextStr = recentContext.length > 0
    ? `\nRECENT CONVERSATION SNIPPETS:\n${recentContext.join("\n")}`
    : "";

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are the Experiment Designer for Leadership Lab, a 5-milestone leadership development program that supports the Arena Foundations in-person training.

Your job: take this week's BASE experiment and PERSONALIZE it for this specific leader based on their Leadership Profile, behavioral patterns, and recent conversations.

The base experiment is the starting point — your job is to make it hit harder and land more precisely for THIS person. Target their specific growth edges, tensions, and blind spots.

Rules:
- The personalized experiment must be BEHAVIORAL — something they DO, not something they think about
- It must be completable in a normal work week
- It must be specific enough that they'll know if they did it or didn't
- It should feel slightly uncomfortable — right at the edge of their comfort zone
- Include a "why this matters for YOU" sentence that connects it to their profile
- Keep the experiment description under 100 words
- Add 2-3 "notice" prompts — specific things to pay attention to while doing the experiment

Return ONLY a JSON object:
{
  "personalizedExperiment": "The tailored experiment description",
  "whyThisMatters": "1-2 sentences connecting this to their specific growth edge",
  "noticePrompts": ["What to notice #1", "What to notice #2", "What to notice #3"],
  "difficulty": "stretch | edge | deep-end",
  "targetPattern": "The specific pattern this experiment is designed to surface or disrupt"
}

Return ONLY valid JSON. No markdown.`,
    messages: [{
      role: "user",
      content: `Design a personalized experiment for ${userName}.

WEEK ${week}: ${baseTheme}
BASE EXPERIMENT: ${baseExperiment}
${profileContext}
${prevContext}
${recentContextStr}`,
    }],
  });

  const resultText = response.content[0]?.text || "{}";
  let design;
  try {
    design = JSON.parse(resultText);
  } catch {
    logger.warn("Failed to parse experiment design JSON", { resultText });
    design = {
      personalizedExperiment: baseExperiment,
      whyThisMatters: "",
      noticePrompts: [],
      difficulty: "stretch",
      targetPattern: "",
    };
  }

  // Save to challenges collection
  const now = admin.firestore.FieldValue.serverTimestamp();
  const challengeRef = db.doc(`${LL_PREFIX}users/${uid}/challenges/${week}`);
  await challengeRef.set({
    weekNumber: week,
    theme: baseTheme,
    experiment: baseExperiment,
    personalizedExperiment: design.personalizedExperiment,
    whyThisMatters: design.whyThisMatters,
    noticePrompts: design.noticePrompts || [],
    difficulty: design.difficulty || "stretch",
    targetPattern: design.targetPattern || "",
    status: "assigned", // assigned → in-progress → completed
    assignedAt: now,
    updatedAt: now,
    aiObservation: null,
  });

  logger.info("Experiment designed", { uid, week, difficulty: design.difficulty });

  return {
    success: true,
    weekNumber: week,
    theme: baseTheme,
    experiment: design.personalizedExperiment,
    whyThisMatters: design.whyThisMatters,
    noticePrompts: design.noticePrompts,
    difficulty: design.difficulty,
  };
}

// ============================================================================
// LEADERSHIP LAB — Content Prescription System
// ============================================================================

/**
 * prescribeContentForUser — AI generates a personalized leadership concept,
 * framework, or micro-exercise matched to this leader's current tensions,
 * growth edges, and experiment progress. "No content library — AI prescribes,
 * the user doesn't browse."
 *
 * Called during labWeekTransition after experiment design.
 * Delivered via SMS on Wednesday AM.
 *
 * @param {string} uid - User ID
 * @param {number} weekNumber - Current week
 * @returns {Promise<object>} Saved prescription document
 */
async function prescribeContentForUser(uid, weekNumber) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");

  const db = admin.firestore();

  // Load user profile
  const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
  if (!userSnap.exists) throw new Error("User not found");
  const userProfile = userSnap.data();
  const userName = userProfile.displayName || userProfile.firstName || "this leader";

  // Load Leadership Profile
  const lpSnap = await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).get();
  const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;

  // Load this week's experiment
  const challengeSnap = await db.doc(`${LL_PREFIX}users/${uid}/challenges/${weekNumber}`).get();
  const experiment = challengeSnap.exists ? challengeSnap.data() : null;

  // Load previous prescriptions for variety
  const prevPrescriptions = await db
    .collection(`${LL_PREFIX}users/${uid}/prescriptions`)
    .orderBy("weekNumber", "desc")
    .limit(3)
    .get();

  const previousTopics = [];
  prevPrescriptions.forEach((doc) => {
    const d = doc.data();
    if (d.topic) previousTopics.push(d.topic);
  });

  // Load recent evidence for behavioral grounding
  const evidenceSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/evidence`)
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();

  const recentEvidence = [];
  evidenceSnap.forEach((doc) => {
    const d = doc.data();
    if (d.quote) recentEvidence.push(`"${d.quote}"`);
    if (d.observation) recentEvidence.push(d.observation);
  });

  const weekTheme = LL_WEEK_THEMES[weekIdx(weekNumber)];

  // Build profile context
  let profileContext = "LEADERSHIP PROFILE: Not yet established.";
  if (leadershipProfile) {
    profileContext = `LEADERSHIP PROFILE:
- Presented Self: ${leadershipProfile.presentedSelf || "Unknown"}
- Observed Self: ${leadershipProfile.observedSelf || "Unknown"}
- Core Patterns: ${(leadershipProfile.corePatterns || []).join("; ") || "None yet"}
- Growth Edges: ${(leadershipProfile.growthEdges || []).join("; ") || "None yet"}`;

    if (leadershipProfile.tensions && leadershipProfile.tensions.length > 0) {
      const tensionStr = leadershipProfile.tensions
        .map((t) => `${t.left} ↔ ${t.right} (leans ${t.position > 50 ? t.right : t.left})`)
        .join("; ");
      profileContext += `\n- Active Tensions: ${tensionStr}`;
    }
  }

  const experimentContext = experiment
    ? `THIS WEEK'S EXPERIMENT: ${experiment.personalizedExperiment || experiment.experiment}\nTarget Pattern: ${experiment.targetPattern || "N/A"}`
    : "No experiment assigned yet.";

  const evidenceContext = recentEvidence.length > 0
    ? `RECENT BEHAVIORAL EVIDENCE:\n${recentEvidence.slice(0, 6).join("\n")}`
    : "";

  const avoidContext = previousTopics.length > 0
    ? `ALREADY PRESCRIBED (avoid repeating): ${previousTopics.join(", ")}`
    : "";

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are a leadership development content curator for Leadership Lab, a 5-milestone program supporting Arena Foundations in-person training.

Your job: prescribe ONE specific leadership concept, framework, or micro-exercise that is precisely matched to this leader's current growth edge and behavioral patterns. You are NOT building a content library — you are making a SURGICAL prescription based on what you know about this person.

PRESCRIPTION TYPES (pick the most fitting):
- "concept" — A leadership framework or mental model they need right now (e.g., "Radical Candor's 2x2", "Lencioni's vulnerability-based trust")
- "reframe" — A perspective shift on a pattern you've observed in them (e.g., "What if your need for consensus isn't empathy — it's conflict avoidance?")
- "micro-exercise" — A 5-minute reflective exercise tied to their specific tension (e.g., "Write down the last 3 decisions you delegated vs. held onto. What pattern do you see?")
- "reading" — A specific article concept, book chapter idea, or thought leader's framework (describe the core idea, don't just name-drop)

Rules:
- NEVER prescribe something generic. Every prescription must reference THIS leader's specific patterns or tensions.
- The "whyYou" field should feel like the coach is speaking directly to them — connecting the prescription to something specific from their profile or conversations.
- The "smsDelivery" field is the actual text message that will be sent — keep it under 300 characters, make it compelling and personal, and end with a question or call to reflection.
- Keep "content" under 200 words — concise and actionable.
- The prescription should complement (not duplicate) their weekly experiment.

Return ONLY a JSON object:
{
  "type": "concept" | "reframe" | "micro-exercise" | "reading",
  "topic": "Short title (3-6 words)",
  "content": "The actual prescription content — the concept explained, the reframe articulated, or the exercise described",
  "whyYou": "1-2 sentences explaining why THIS prescription for THIS leader right now",
  "smsDelivery": "The SMS text to deliver this prescription (under 300 chars)",
  "connectedTension": "Which tension or growth edge this targets (from their profile)"
}

Return ONLY valid JSON. No markdown.`,
    messages: [{
      role: "user",
      content: `Prescribe content for ${userName}.

WEEK ${weekNumber}: ${weekTheme}
${profileContext}
${experimentContext}
${evidenceContext}
${avoidContext}`,
    }],
  });

  const resultText = response.content[0]?.text || "{}";
  let prescription;
  try {
    prescription = JSON.parse(resultText);
  } catch {
    logger.warn("Failed to parse prescription JSON", { resultText });
    prescription = {
      type: "concept",
      topic: weekTheme,
      content: `This week focuses on ${weekTheme}. Reflect on how this theme shows up in your daily leadership.`,
      whyYou: "Matched to your current week's theme.",
      smsDelivery: `Something for you to sit with this week about ${weekTheme}. How does this show up in your leadership?`,
      connectedTension: "",
    };
  }

  // Save to prescriptions collection
  const now = admin.firestore.FieldValue.serverTimestamp();
  const prescriptionData = {
    weekNumber,
    type: prescription.type || "concept",
    topic: prescription.topic || "",
    content: prescription.content || "",
    whyYou: prescription.whyYou || "",
    smsDelivery: prescription.smsDelivery || "",
    connectedTension: prescription.connectedTension || "",
    status: "pending", // pending → delivered → read
    createdAt: now,
    deliveredAt: null,
  };

  await db.doc(`${LL_PREFIX}users/${uid}/prescriptions/${weekNumber}`).set(prescriptionData);

  logger.info("Content prescribed", { uid, weekNumber, type: prescription.type, topic: prescription.topic });

  return prescriptionData;
}

// ============================================================================
// LEADERSHIP LAB — Reveal Engine
// ============================================================================

/**
 * extractEvidenceFromConversations — Analyzes a week of coaching transcripts and
 * extracts structured behavioral evidence (quotes, pattern signals, tension markers).
 *
 * Called during labWeekTransition after generating the weekly reflection.
 *
 * @param {string} uid - User ID
 * @param {number} weekNumber - Week the conversations are from
 * @param {string} transcript - Combined transcript of all conversations
 * @param {object} leadershipProfile - Current Leadership Profile
 * @returns {Promise<object[]>} Array of saved evidence documents
 */
async function extractEvidenceFromConversations(uid, weekNumber, transcript, leadershipProfile) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");

  const anthropic = new Anthropic({ apiKey });

  let profileContext = "";
  if (leadershipProfile) {
    profileContext = `
LEADERSHIP PROFILE:
- Presented Self: ${leadershipProfile.presentedSelf || "Unknown"}
- Observed Self: ${leadershipProfile.observedSelf || "Unknown"}
- Tensions: ${(leadershipProfile.tensions || []).map((t) => `${t.left} ↔ ${t.right}`).join("; ") || "None"}
- Core Patterns: ${(leadershipProfile.corePatterns || []).join("; ") || "None"}
- Growth Edges: ${(leadershipProfile.growthEdges || []).join("; ") || "None"}`;
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are a leadership psychologist extracting behavioral evidence from coaching conversations.

Your job: identify specific moments in the transcript that reveal something important about this leader's identity, patterns, or tensions. Focus on:

1. PRESENTED-SELF evidence: How they describe themselves or their leadership (their self-image)
2. OBSERVED-BEHAVIOR evidence: What their word choices, stories, and reactions actually reveal (may contradict presented self)
3. TENSION-SIGNAL evidence: Moments where two competing values or patterns collide
4. GROWTH-SIGNAL evidence: Moments of genuine self-awareness, vulnerability, or pattern-breaking
5. RESISTANCE evidence: Deflection, rationalization, humor-as-shield, or refusing to look at something

Extract 3-7 evidence items. Quality over quantity. Only include evidence that's genuinely revealing — skip surface-level observations.
${profileContext}

Return ONLY a JSON array:
[
  {
    "quote": "Their exact words or a close paraphrase (under 100 chars)",
    "observation": "What this reveals about them (1 sentence)",
    "category": "presented-self | observed-behavior | tension-signal | growth-signal | resistance",
    "relatedTension": { "left": "Value A", "right": "Value B" } or null,
    "relatedPattern": "Pattern name from their profile" or null,
    "significance": "high | medium | low"
  }
]

Return ONLY valid JSON. No markdown, no explanation.`,
    messages: [{ role: "user", content: `WEEK ${weekNumber} CONVERSATIONS:\n\n${transcript}` }],
  });

  const resultText = response.content[0]?.text || "[]";
  let evidenceItems;
  try {
    evidenceItems = JSON.parse(resultText);
    if (!Array.isArray(evidenceItems)) evidenceItems = [];
  } catch {
    logger.warn("Failed to parse evidence extraction JSON", { uid, weekNumber });
    return [];
  }

  // Save each evidence item to Firestore
  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const saved = [];

  for (const item of evidenceItems) {
    const ref = db.collection(`${LL_PREFIX}users/${uid}/evidence`).doc();
    const doc = {
      quote: (item.quote || "").slice(0, 200),
      observation: (item.observation || "").slice(0, 300),
      category: item.category || "observed-behavior",
      relatedTension: item.relatedTension || null,
      relatedPattern: item.relatedPattern || null,
      significance: item.significance || "medium",
      weekNumber,
      usedInReveal: false,
      createdAt: now,
    };
    await ref.set(doc);
    saved.push({ id: ref.id, ...doc });
  }

  logger.info("Evidence extracted", { uid, weekNumber, count: saved.length });
  return saved;
}

/**
 * generateRevealIfReady — Checks if enough evidence has accumulated for a meaningful
 * reveal, and if the timing is right. If so, generates and stores a pending reveal.
 *
 * Reveal timing strategy:
 * - Week 1: No reveals (building trust)
 * - Week 2: Pattern observation eligible (if enough evidence)
 * - Week 3: Tension reveal eligible (Presented vs Observed)
 * - Week 4: Connection reveal (linking multiple patterns)
 * - Week 5: Deep reveal (core tension confrontation)
 * - Week 5: Growth recognition (celebrating shifts with evidence)
 * - Max 1 pending reveal at a time. 3-4 total across 5 milestones.
 *
 * @param {string} uid - User ID
 * @param {number} upcomingWeek - The NEXT week (reveal will be delivered that week)
 * @returns {Promise<object|null>} The generated reveal, or null if not ready
 */
async function generateRevealIfReady(uid, upcomingWeek) {
  // No reveals in week 1 — build trust first
  if (upcomingWeek <= 1) return null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");

  const db = admin.firestore();

  // Check how many reveals have already been delivered or are pending
  const existingReveals = await db
    .collection(`${LL_PREFIX}users/${uid}/reveals`)
    .get();
  const deliveredCount = existingReveals.docs.filter(
    (d) => d.data().status === "delivered" || d.data().status === "acknowledged"
  ).length;
  const hasPending = existingReveals.docs.some((d) => d.data().status === "pending");

  // Foundation: max 4 reveals, Ascent: no cap. Max 1 pending at a time.
  const isAscent = upcomingWeek > 5;
  if ((!isAscent && deliveredCount >= 4) || hasPending) return null;

  // Skip some weeks to make reveals feel strategic, not routine
  // Ideal: weeks 2, 3, 4/5 — but dependent on evidence quality
  // Week 5 is reserved for growth recognition (different from confrontation)
  const revealSchedule = {
    2: "pattern-reveal",
    3: "tension-reveal",
    4: "mirror-moment",
    5: "growth-recognition",
  };
  // Ascent phase: generate periodic reveals based on ongoing conversations
  let revealType = revealSchedule[upcomingWeek];
  if (!revealType && upcomingWeek > 5) {
    // In Ascent, generate a reveal every 3-4 weeks if there's enough evidence
    const weeksSinceLastReveal = upcomingWeek - existingReveals.docs
      .filter((d) => d.data().status !== "pending")
      .reduce((max, d) => Math.max(max, d.data().weekNumber || 0), 0);
    if (weeksSinceLastReveal >= 3) {
      revealType = upcomingWeek % 2 === 0 ? "growth-recognition" : "mirror-moment";
    }
  }
  if (!revealType) return null;

  // Don't reveal every week — skip if they've already had one recently
  if (deliveredCount > 0 && upcomingWeek - existingReveals.docs
    .filter((d) => d.data().status !== "pending")
    .reduce((max, d) => Math.max(max, d.data().weekNumber || 0), 0) < 2
    && upcomingWeek < 5) {
    // Last reveal was last week — skip unless it's week 5 (growth recognition)
    return null;
  }

  // Load all accumulated evidence
  const evidenceSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/evidence`)
    .orderBy("createdAt", "asc")
    .get();

  if (evidenceSnap.empty) return null;

  const allEvidence = evidenceSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Need minimum evidence before attempting a reveal
  const minEvidence = { "pattern-reveal": 3, "tension-reveal": 4, "mirror-moment": 5, "growth-recognition": 3 };
  if (allEvidence.length < (minEvidence[revealType] || 3)) return null;

  // Load Leadership Profile
  const lpSnap = await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).get();
  const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;
  if (!leadershipProfile) return null; // Can't reveal without a profile

  // Load user profile for name
  const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
  const userName = userSnap.exists
    ? (userSnap.data().displayName || userSnap.data().firstName || "there")
    : "there";

  // Build the evidence context
  const evidenceContext = allEvidence
    .filter((e) => e.significance === "high" || e.significance === "medium")
    .map((e) => `[Week ${e.weekNumber}, ${e.category}] "${e.quote}" — ${e.observation}`)
    .join("\n");

  // Build previous reveals context
  const previousReveals = existingReveals.docs
    .filter((d) => d.data().status !== "pending")
    .map((d) => {
      const r = d.data();
      return `[Week ${r.weekNumber}, ${r.type}]: ${r.content?.slice(0, 100)}... Response: ${r.userResponse || "none"}`;
    })
    .join("\n");

  const typeInstructions = {
    "pattern-reveal": `Generate a PATTERN REVEAL — name a behavioral pattern you've observed that they may not be fully aware of. Ground it in specific evidence. This is a gentle first mirror: "I've noticed that when X happens, you tend to Y." Make them curious, not defensive.`,
    "tension-reveal": `Generate a TENSION REVEAL — surface the gap between their Presented Self and their Observed Self. Use their own words against the evidence. This should be a "wait... you're right" moment. Example shape: "You describe yourself as [presented], but in our conversations I've noticed [observed]. What do you make of that gap?"`,
    "mirror-moment": `Generate a MIRROR MOMENT — a direct, unflinching observation that connects multiple patterns into a deeper truth. This is the most confrontational reveal. It should be something they've been avoiding. Be caring but don't soften it into nothing. They need to feel this one.`,
    "growth-recognition": `Generate a GROWTH RECOGNITION — celebrate a genuine shift you've observed, with specific evidence. Show them the before and after. This is NOT generic praise. Reference exact moments. Make them see how far they've come. This should feel earned and real.`,
  };

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `You are the Reveal Engine for Leadership Lab. Your job is to craft a single, strategic reveal — a moment of confrontation or recognition that creates genuine self-awareness that cannot be unseen.

${typeInstructions[revealType]}

LEADERSHIP PROFILE:
- Presented Self: ${leadershipProfile.presentedSelf || "Unknown"}
- Observed Self: ${leadershipProfile.observedSelf || "Unknown"}
- Tensions: ${(leadershipProfile.tensions || []).map((t) => `${t.left} ↔ ${t.right} (leans ${t.position > 50 ? t.right : t.left}, evidence: ${t.evidence || "none"})`).join("; ") || "None"}
- Core Patterns: ${(leadershipProfile.corePatterns || []).join("; ") || "None"}
- Growth Edges: ${(leadershipProfile.growthEdges || []).join("; ") || "None"}

ACCUMULATED EVIDENCE:
${evidenceContext}

${previousReveals ? `PREVIOUS REVEALS (don't repeat these):\n${previousReveals}` : "No previous reveals — this is the first one."}

The reveal will be delivered via TEXT MESSAGE. It must:
- Be under 300 characters (fit in a text)
- Feel personal and specific (never generic coaching platitudes)
- Land as a genuine insight, not an accusation
- End with a question or invitation to reflect (not a demand for response)
- Use ${userName}'s name at most once

Return ONLY a JSON object:
{
  "content": "The reveal text message",
  "evidenceUsed": ["evidence_id_1", "evidence_id_2"],
  "targetTension": { "left": "Value A", "right": "Value B" } or null,
  "targetPattern": "The pattern this targets" or null,
  "rationale": "1 sentence on why this reveal, why now (for internal tracking)"
}

Return ONLY valid JSON.`,
    messages: [{
      role: "user",
      content: `Generate a ${revealType} for ${userName} to be delivered in Week ${upcomingWeek}.

Evidence IDs for reference: ${allEvidence.map((e) => e.id).join(", ")}`,
    }],
  });

  const resultText = response.content[0]?.text || "{}";
  let reveal;
  try {
    reveal = JSON.parse(resultText);
  } catch {
    logger.warn("Failed to parse reveal JSON", { uid, upcomingWeek });
    return null;
  }

  if (!reveal.content) return null;

  // Save the pending reveal
  const now = admin.firestore.FieldValue.serverTimestamp();
  const revealRef = db.collection(`${LL_PREFIX}users/${uid}/reveals`).doc();
  const revealDoc = {
    type: revealType,
    weekNumber: upcomingWeek,
    content: reveal.content.slice(0, 500),
    evidenceUsed: (reveal.evidenceUsed || []).slice(0, 10),
    targetTension: reveal.targetTension || null,
    targetPattern: reveal.targetPattern || null,
    rationale: (reveal.rationale || "").slice(0, 300),
    status: "pending",
    deliveredAt: null,
    conversationId: null,
    userResponse: null,
    impact: null,
    createdAt: now,
  };
  await revealRef.set(revealDoc);

  // Mark evidence as used in a reveal
  for (const eid of (reveal.evidenceUsed || [])) {
    const evidRef = db.doc(`${LL_PREFIX}users/${uid}/evidence/${eid}`);
    const evidSnap = await evidRef.get();
    if (evidSnap.exists) {
      await evidRef.update({ usedInReveal: true });
    }
  }

  logger.info("Reveal generated", { uid, upcomingWeek, type: revealType, revealId: revealRef.id });
  return { id: revealRef.id, ...revealDoc };
}

/**
 * getPendingReveal — Check if a user has a pending reveal ready for delivery.
 *
 * @param {string} uid - User ID
 * @returns {Promise<{ id: string, data: object } | null>}
 */
async function getPendingReveal(uid) {
  const db = admin.firestore();
  const snap = await db
    .collection(`${LL_PREFIX}users/${uid}/reveals`)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { id: snap.docs[0].id, data: snap.docs[0].data() };
}

/**
 * labWeekTransition — Scheduled function that runs Monday at 6 AM ET.
 *
 * For each active cohort:
 * 1. Check if a new week has started
 * 2. Update each member's currentWeek
 * 3. Generate personalized experiments for the new week
 * 4. Summarize last week's conversations and update observations
 * 5. Create cohort pulse data
 */
exports.labWeekTransition = onSchedule(
  {
    schedule: "0 6 * * 1", // Monday 6 AM
    timeZone: "America/New_York",
    secrets: ["ANTHROPIC_API_KEY"],
    region: "us-central1",
    maxInstances: 1,
    timeoutSeconds: 540,
  },
  async (event) => {
    const db = admin.firestore();

    logger.info("labWeekTransition triggered");

    const cohortsSnap = await db
      .collection(`${LL_PREFIX}cohorts`)
      .where("isActive", "==", true)
      .get();

    if (cohortsSnap.empty) {
      logger.info("No active cohorts");
      return;
    }

    let totalProcessed = 0;
    let totalErrors = 0;

    for (const cohortDoc of cohortsSnap.docs) {
      const cohort = cohortDoc.data();
      const cohortId = cohortDoc.id;
      const weekNumber = getCohortWeekNumber(cohort.startDate, cohort.weekCount || 6, { clamp: false });

      if (weekNumber > (cohort.weekCount || 6)) {
        // Program ended — mark cohort as post-program
        await cohortDoc.ref.update({
          isActive: false,
          phase: "post",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Transition all members to ascent phase
        const finishedMembers = await db
          .collection(`${LL_PREFIX}cohorts/${cohortId}/members`)
          .where("status", "==", "enrolled")
          .get();

        const batch = db.batch();
        const now = admin.firestore.FieldValue.serverTimestamp();
        for (const mDoc of finishedMembers.docs) {
          // Update user profile to ascent phase
          batch.update(db.doc(`${LL_PREFIX}users/${mDoc.id}`), {
            phase: "ascent",
            ascentStartDate: now,
            updatedAt: now,
          });
          // Update cohort member status
          batch.update(mDoc.ref, {
            status: "ascent",
            updatedAt: now,
          });
        }
        await batch.commit();

        logger.info("Cohort completed program, members transitioned to ascent", {
          cohortId,
          memberCount: finishedMembers.size,
        });
        continue;
      }

      // Get members
      const membersSnap = await db
        .collection(`${LL_PREFIX}cohorts/${cohortId}/members`)
        .where("status", "==", "enrolled")
        .get();

      for (const memberDoc of membersSnap.docs) {
        const memberId = memberDoc.id;

        try {
          const userSnap = await db.doc(`${LL_PREFIX}users/${memberId}`).get();
          if (!userSnap.exists) continue;
          const userProfile = userSnap.data();

          if (!userProfile.onboardingComplete) continue;

          const prevWeek = userProfile.currentWeek || 1;

          // Only process if week actually changed
          if (weekNumber <= prevWeek) continue;

          // --- Summarize last week's conversations ---
          const lastWeekConvos = await db
            .collection(`${LL_PREFIX}users/${memberId}/conversations`)
            .where("weekNumber", "==", prevWeek)
            .get();

          if (!lastWeekConvos.empty) {
            const transcripts = [];
            lastWeekConvos.forEach((doc) => {
              const data = doc.data();
              const msgs = (data.messages || [])
                .map((m) => `${m.role === "user" ? "LEADER" : "COACH"}: ${m.content}`)
                .join("\n");
              if (msgs) transcripts.push(msgs);
            });

            if (transcripts.length > 0) {
              const apiKey = process.env.ANTHROPIC_API_KEY;
              const anthropic = new Anthropic({ apiKey });

              // Generate weekly reflection/observation
              const obsResponse = await anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 512,
                system: `You are a leadership psychologist analyzing a week of coaching conversations. Write a brief observation note about this leader's week. Include: key themes, behavioral patterns noticed, experiment follow-through, and any shifts from previous weeks. Keep it under 150 words. Write in third person ("They...").`,
                messages: [{ role: "user", content: transcripts.join("\n---\n") }],
              });

              const observation = obsResponse.content[0]?.text || "";

              // Save weekly reflection
              const now = admin.firestore.FieldValue.serverTimestamp();
              await db.doc(`${LL_PREFIX}users/${memberId}/reflections/${prevWeek}`).set({
                weekNumber: prevWeek,
                summary: observation,
                conversationCount: lastWeekConvos.size,
                keyInsights: [],
                patterns: [],
                createdAt: now,
              });

              // Update last week's challenge with observation
              const challengeRef = db.doc(`${LL_PREFIX}users/${memberId}/challenges/${prevWeek}`);
              const challengeSnap = await challengeRef.get();
              if (challengeSnap.exists) {
                await challengeRef.update({
                  aiObservation: observation,
                  status: "completed",
                  updatedAt: now,
                });
              }

              // --- REVEAL ENGINE: Extract evidence from this week's conversations ---
              try {
                const lpSnap = await db.doc(`${LL_PREFIX}users/${memberId}/leadershipProfile/current`).get();
                const lp = lpSnap.exists ? lpSnap.data() : null;
                await extractEvidenceFromConversations(memberId, prevWeek, transcripts.join("\n---\n"), lp);
              } catch (evidErr) {
                logger.warn("Failed to extract evidence", { memberId, prevWeek, error: evidErr.message });
              }
            }
          }

          // --- REVEAL ENGINE: Generate reveal for upcoming week if ready ---
          try {
            const revealResult = await generateRevealIfReady(memberId, weekNumber);
            if (revealResult) {
              logger.info("Reveal queued for delivery", { memberId, weekNumber, type: revealResult.type });
            }
          } catch (revealErr) {
            logger.warn("Failed to generate reveal", { memberId, weekNumber, error: revealErr.message });
          }

          // --- Advance to new week ---
          await db.doc(`${LL_PREFIX}users/${memberId}`).update({
            currentWeek: weekNumber,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // --- Design new experiment ---
          try {
            await designExperimentForUser(memberId, weekNumber);
          } catch (expErr) {
            logger.warn("Failed to design experiment", { memberId, weekNumber, error: expErr.message });
          }

          // --- Prescribe content for this week ---
          try {
            await prescribeContentForUser(memberId, weekNumber);
          } catch (rxErr) {
            logger.warn("Failed to prescribe content", { memberId, weekNumber, error: rxErr.message });
          }

          totalProcessed++;
        } catch (memberErr) {
          totalErrors++;
          logger.error("Week transition error for member", { memberId, error: memberErr.message });
        }
      }

      // --- Update cohort pulse ---
      const now = admin.firestore.FieldValue.serverTimestamp();
      await db.doc(`${LL_PREFIX}cohorts/${cohortId}/pulse/${weekNumber}`).set(
        {
          weekNumber,
          memberCount: membersSnap.size,
          processedAt: now,
        },
        { merge: true }
      );
    }

    logger.info("labWeekTransition complete", { totalProcessed, totalErrors });
  }
);

/**
 * labTestAdvanceWeek — Admin-only tool for testing the full lifecycle.
 * Sets a member's currentWeek, optionally marks onboarding complete,
 * and optionally triggers the week transition logic (summaries, reveals, experiments).
 */
exports.labTestAdvanceWeek = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const db = admin.firestore();

    // Check admin
    const adminDoc = await db.doc("metadata/config").get();
    const adminEmails = adminDoc.exists ? (adminDoc.data().adminemails || []) : [];
    const userEmail = (request.auth.token.email || "").toLowerCase();
    if (!adminEmails.map((e) => e.toLowerCase()).includes(userEmail)) {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { memberId, targetWeek, completeOnboarding, cohortId } = request.data || {};

    if (!memberId || typeof memberId !== "string") {
      throw new HttpsError("invalid-argument", "memberId is required");
    }
    if (!targetWeek || typeof targetWeek !== "number" || targetWeek < 0 || targetWeek > 52) {
      throw new HttpsError("invalid-argument", "targetWeek must be 0-52");
    }

    const userRef = db.doc(`${LL_PREFIX}users/${memberId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userProfile = userSnap.data();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const updates = { currentWeek: targetWeek, updatedAt: now };

    // Set phase based on week
    if (targetWeek > 6) {
      updates.phase = "ascent";
      if (!userProfile.ascentStartDate) {
        updates.ascentStartDate = now;
      }
    } else if (targetWeek >= 1) {
      updates.phase = "foundation";
    }

    // Optionally mark onboarding as complete
    if (completeOnboarding && !userProfile.onboardingComplete) {
      updates.onboardingComplete = true;
      updates.onboardedAt = now;
    }

    await userRef.update(updates);

    // If advancing forward, try to design experiment and prescribe content
    if (targetWeek > 0) {
      try {
        await designExperimentForUser(memberId, targetWeek);
      } catch (e) {
        logger.warn("Test advance: experiment design failed", { memberId, targetWeek, error: e.message });
      }

      try {
        await prescribeContentForUser(memberId, targetWeek);
      } catch (e) {
        logger.warn("Test advance: prescription failed", { memberId, targetWeek, error: e.message });
      }
    }

    // Also update cohort member doc if cohortId provided
    if (cohortId) {
      try {
        await db.doc(`${LL_PREFIX}cohorts/${cohortId}/members/${memberId}`).update({
          currentWeek: targetWeek,
          updatedAt: now,
        });
      } catch (e) {
        logger.warn("Test advance: cohort member update failed", { error: e.message });
      }
    }

    logger.info("labTestAdvanceWeek", { memberId, targetWeek, completeOnboarding: !!completeOnboarding });

    return {
      success: true,
      memberId,
      previousWeek: userProfile.currentWeek || 0,
      newWeek: targetWeek,
      onboardingComplete: completeOnboarding ? true : userProfile.onboardingComplete,
    };
  }
);

/**
 * labTestTriggerOnboarding — Admin-only. Creates a web-based onboarding
 * conversation for a member without sending SMS. Allows testing the full
 * onboarding flow via the app when SMS is unavailable.
 */
exports.labTestTriggerOnboarding = onCall(
  {
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const db = admin.firestore();

    // Check admin
    const adminDoc = await db.doc("metadata/config").get();
    const adminEmails = adminDoc.exists ? (adminDoc.data().adminemails || []) : [];
    const userEmail = (request.auth.token.email || "").toLowerCase();
    if (!adminEmails.map((e) => e.toLowerCase()).includes(userEmail)) {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { memberId } = request.data || {};

    if (!memberId || typeof memberId !== "string") {
      throw new HttpsError("invalid-argument", "memberId is required");
    }

    const userRef = db.doc(`${LL_PREFIX}users/${memberId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userProfile = userSnap.data();
    if (userProfile.onboardingComplete) {
      return { success: true, alreadyOnboarded: true, message: "User already completed onboarding" };
    }

    const firstName = userProfile.firstName || userProfile.displayName || "there";
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Check for existing onboarding conversation
    const existingSnap = await db
      .collection(`${LL_PREFIX}users/${memberId}/conversations`)
      .where("mode", "==", "onboarding")
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return {
        success: true,
        alreadyExists: true,
        conversationId: existingSnap.docs[0].id,
        message: "Onboarding conversation already exists",
      };
    }

    // Create onboarding conversation (web channel, no SMS)
    const openingMessage = `${firstName}, it's time. Your Leadership Lab program starts now. I'm your AI coach, and I want to understand how you lead. Let's start simple — what's your role, and how big is your team?`;

    const convoRef = db.collection(`${LL_PREFIX}users/${memberId}/conversations`).doc();
    await convoRef.set({
      mode: "onboarding",
      weekNumber: 0,
      channel: "web",
      aiInitiated: true,
      messages: [
        {
          role: "assistant",
          content: openingMessage,
          timestamp: new Date().toISOString(),
          channel: "web",
        },
      ],
      summary: "",
      createdAt: now,
      updatedAt: now,
    });

    logger.info("labTestTriggerOnboarding", { memberId, conversationId: convoRef.id });

    return {
      success: true,
      conversationId: convoRef.id,
      message: "Onboarding conversation created via web",
    };
  }
);

/**
 * labRevealStatus — Fetch a user's reveal history and evidence summary.
 * Used by the web app's Mirror screen.
 */
exports.labRevealStatus = onCall(
  {
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-test\.web\.app$/,
      /leaderreps-test\.firebaseapp\.com$/,
      /leaderreps-prod\.web\.app$/,
      /leaderreps-prod\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    try {
      // Load all reveals
      const revealsSnap = await db
        .collection(`${LL_PREFIX}users/${uid}/reveals`)
        .orderBy("createdAt", "asc")
        .get();

      const reveals = revealsSnap.docs.map((d) => ({
        id: d.id,
        type: d.data().type,
        weekNumber: d.data().weekNumber,
        content: d.data().content,
        status: d.data().status,
        deliveredAt: d.data().deliveredAt,
        userResponse: d.data().userResponse,
        targetTension: d.data().targetTension,
        targetPattern: d.data().targetPattern,
      }));

      // Load evidence summary (counts by category, week)
      const evidenceSnap = await db
        .collection(`${LL_PREFIX}users/${uid}/evidence`)
        .get();

      const evidenceSummary = {
        total: evidenceSnap.size,
        byCategory: {},
        byWeek: {},
        highSignificance: 0,
      };

      evidenceSnap.forEach((d) => {
        const data = d.data();
        const cat = data.category || "unknown";
        evidenceSummary.byCategory[cat] = (evidenceSummary.byCategory[cat] || 0) + 1;
        const week = data.weekNumber || 0;
        evidenceSummary.byWeek[week] = (evidenceSummary.byWeek[week] || 0) + 1;
        if (data.significance === "high") evidenceSummary.highSignificance++;
      });

      return {
        reveals,
        evidenceSummary,
        totalReveals: reveals.length,
        deliveredReveals: reveals.filter((r) => r.status !== "pending").length,
      };
    } catch (error) {
      logger.error("labRevealStatus error", error);
      throw new HttpsError("internal", "Failed to fetch reveal status");
    }
  }
);

// ============================================================================
// LEADERSHIP LAB — Facilitator Dashboard APIs
// ============================================================================

/**
 * Check if a user is an admin or facilitator for a specific cohort.
 */
async function isFacilitatorOrAdmin(auth, cohortId) {
  const db = admin.firestore();
  const email = (auth.token?.email || "").toLowerCase();

  // Check admin
  const configDoc = await db.doc("metadata/config").get();
  const adminEmails = configDoc.exists ? (configDoc.data().adminemails || []) : [];
  if (adminEmails.map((e) => e.toLowerCase()).includes(email)) return true;

  // Check facilitator
  if (cohortId) {
    const cohortSnap = await db.doc(`${LL_PREFIX}cohorts/${cohortId}`).get();
    if (cohortSnap.exists) {
      const facilIds = cohortSnap.data().facilitatorIds || [];
      if (facilIds.includes(auth.uid)) return true;
    }
    // Also check ll-facilitators collection
    const facSnap = await db.doc(`${LL_PREFIX}facilitators/${auth.uid}`).get();
    if (facSnap.exists) return true;
  }

  return false;
}

/**
 * labWarRoom — Real-time cohort overview for facilitators.
 *
 * Returns:
 * - Each member's engagement status (active, quiet, at-risk)
 * - Last text exchange timestamps
 * - Current experiment status
 * - Reveal status
 * - Onboarding completion
 * - Alerts (quiet members, failed experiments, strong reactions)
 */
exports.labWarRoom = onCall(
  {
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { cohortId } = request.data || {};
    if (!cohortId) {
      throw new HttpsError("invalid-argument", "cohortId is required");
    }

    const authorized = await isFacilitatorOrAdmin(request.auth, cohortId);
    if (!authorized) {
      throw new HttpsError("permission-denied", "Facilitator or admin access required");
    }

    const db = admin.firestore();

    try {
      // Load cohort
      const cohortSnap = await db.doc(`${LL_PREFIX}cohorts/${cohortId}`).get();
      if (!cohortSnap.exists) {
        throw new HttpsError("not-found", "Cohort not found");
      }
      const cohort = cohortSnap.data();
      const weekNumber = getCohortWeekNumber(cohort.startDate);

      // Load members
      const membersSnap = await db
        .collection(`${LL_PREFIX}cohorts/${cohortId}/members`)
        .where("status", "==", "enrolled")
        .get();

      const members = [];
      const alerts = [];
      const now = new Date();

      for (const memberDoc of membersSnap.docs) {
        const memberId = memberDoc.id;
        const memberData = memberDoc.data();

        // Load user profile
        const userSnap = await db.doc(`${LL_PREFIX}users/${memberId}`).get();
        if (!userSnap.exists) continue;
        const userProfile = userSnap.data();

        // Get recent conversations (last 7 days)
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentConvos = await db
          .collection(`${LL_PREFIX}users/${memberId}/conversations`)
          .where("createdAt", ">=", weekAgo)
          .orderBy("createdAt", "desc")
          .get();

        // Engagement metrics
        const totalMessages = recentConvos.docs.reduce((sum, d) => {
          return sum + (d.data().messages || []).filter((m) => m.role === "user").length;
        }, 0);
        const lastActivity = recentConvos.empty
          ? null
          : recentConvos.docs[0].data().updatedAt;
        const daysSinceActivity = lastActivity
          ? Math.floor((now - (lastActivity.toDate ? lastActivity.toDate() : new Date(lastActivity))) / (1000 * 60 * 60 * 24))
          : 999;

        // Engagement status
        let engagement = "active";
        if (daysSinceActivity > 3) engagement = "at-risk";
        else if (daysSinceActivity > 1 || totalMessages < 2) engagement = "quiet";

        // Get current experiment status
        const challengeSnap = await db.doc(`${LL_PREFIX}users/${memberId}/challenges/${weekNumber}`).get();
        const experimentStatus = challengeSnap.exists ? challengeSnap.data().status : "none";

        // Get reveal status
        const revealSnap = await db
          .collection(`${LL_PREFIX}users/${memberId}/reveals`)
          .where("status", "in", ["pending", "delivered"])
          .limit(1)
          .get();
        const hasActiveReveal = !revealSnap.empty;
        const revealStatus = revealSnap.empty ? "none" : revealSnap.docs[0].data().status;

        const memberSummary = {
          id: memberId,
          firstName: userProfile.displayName || userProfile.firstName || memberData.firstName || "Unknown",
          phone: userProfile.phone || memberData.phone,
          onboardingComplete: !!userProfile.onboardingComplete,
          currentWeek: userProfile.currentWeek || 0,
          engagement,
          daysSinceActivity,
          messagesThisWeek: totalMessages,
          conversationsThisWeek: recentConvos.size,
          experimentStatus,
          revealStatus: hasActiveReveal ? revealStatus : "none",
        };

        members.push(memberSummary);

        // Generate alerts
        if (!userProfile.onboardingComplete && weekNumber > 0) {
          alerts.push({ type: "onboarding-incomplete", memberId, name: memberSummary.firstName, severity: "high" });
        }
        if (engagement === "at-risk") {
          alerts.push({ type: "quiet-member", memberId, name: memberSummary.firstName, days: daysSinceActivity, severity: "high" });
        }
        if (revealStatus === "delivered" && daysSinceActivity <= 1) {
          alerts.push({ type: "reveal-delivered", memberId, name: memberSummary.firstName, severity: "info" });
        }
      }

      // Sort: at-risk first, then quiet, then active
      const engagementOrder = { "at-risk": 0, quiet: 1, active: 2 };
      members.sort((a, b) => (engagementOrder[a.engagement] || 2) - (engagementOrder[b.engagement] || 2));

      return {
        cohort: {
          id: cohortId,
          name: cohort.name,
          weekNumber,
          phase: cohort.phase,
          isActive: cohort.isActive,
          memberCount: members.length,
        },
        members,
        alerts: alerts.sort((a, b) => (a.severity === "high" ? -1 : 1) - (b.severity === "high" ? -1 : 1)),
        summary: {
          total: members.length,
          active: members.filter((m) => m.engagement === "active").length,
          quiet: members.filter((m) => m.engagement === "quiet").length,
          atRisk: members.filter((m) => m.engagement === "at-risk").length,
          onboarded: members.filter((m) => m.onboardingComplete).length,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labWarRoom error", error);
      throw new HttpsError("internal", "Failed to load war room data");
    }
  }
);

/**
 * labDeepDive — Detailed view of an individual cohort member.
 *
 * Returns Leadership Profile, conversation summaries, evidence, reveals,
 * experiment history, and AI coaching recommendations.
 */
exports.labDeepDive = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { cohortId, memberId } = request.data || {};
    if (!cohortId || !memberId) {
      throw new HttpsError("invalid-argument", "cohortId and memberId are required");
    }

    const authorized = await isFacilitatorOrAdmin(request.auth, cohortId);
    if (!authorized) {
      throw new HttpsError("permission-denied", "Facilitator or admin access required");
    }

    const db = admin.firestore();

    try {
      // Load user profile
      const userSnap = await db.doc(`${LL_PREFIX}users/${memberId}`).get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "Member not found");
      }
      const userProfile = userSnap.data();

      // Load Leadership Profile
      const lpSnap = await db.doc(`${LL_PREFIX}users/${memberId}/leadershipProfile/current`).get();
      const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;

      // Load all reflections (weekly summaries)
      const reflectionsSnap = await db
        .collection(`${LL_PREFIX}users/${memberId}/reflections`)
        .orderBy("weekNumber", "asc")
        .get();
      const reflections = reflectionsSnap.docs.map((d) => ({
        weekNumber: d.data().weekNumber,
        summary: d.data().summary,
        conversationCount: d.data().conversationCount,
      }));

      // Load challenges/experiments
      const challengesSnap = await db
        .collection(`${LL_PREFIX}users/${memberId}/challenges`)
        .orderBy("weekNumber", "asc")
        .get();
      const challenges = challengesSnap.docs.map((d) => ({
        weekNumber: d.data().weekNumber,
        theme: d.data().theme,
        experiment: d.data().personalizedExperiment || d.data().experiment,
        status: d.data().status,
        difficulty: d.data().difficulty,
        aiObservation: d.data().aiObservation,
      }));

      // Load reveals
      const revealsSnap = await db
        .collection(`${LL_PREFIX}users/${memberId}/reveals`)
        .orderBy("createdAt", "asc")
        .get();
      const reveals = revealsSnap.docs.map((d) => ({
        id: d.id,
        type: d.data().type,
        weekNumber: d.data().weekNumber,
        content: d.data().content,
        status: d.data().status,
        userResponse: d.data().userResponse,
        rationale: d.data().rationale,
        targetPattern: d.data().targetPattern,
      }));

      // Load high-significance evidence
      const evidenceSnap = await db
        .collection(`${LL_PREFIX}users/${memberId}/evidence`)
        .where("significance", "==", "high")
        .get();
      const keyEvidence = evidenceSnap.docs.map((d) => ({
        quote: d.data().quote,
        observation: d.data().observation,
        category: d.data().category,
        weekNumber: d.data().weekNumber,
      }));

      // Recent conversation summaries (last 10)
      const convosSnap = await db
        .collection(`${LL_PREFIX}users/${memberId}/conversations`)
        .orderBy("updatedAt", "desc")
        .limit(10)
        .get();
      const recentConversations = convosSnap.docs.map((d) => ({
        id: d.id,
        mode: d.data().mode,
        weekNumber: d.data().weekNumber,
        channel: d.data().channel,
        interactionType: d.data().interactionType,
        messageCount: (d.data().messages || []).length,
        lastMessage: (d.data().messages || []).slice(-1)[0]?.content?.slice(0, 100) || "",
        createdAt: d.data().createdAt,
      }));

      return {
        member: {
          id: memberId,
          firstName: userProfile.displayName || userProfile.firstName,
          phone: userProfile.phone,
          currentWeek: userProfile.currentWeek,
          onboardingComplete: userProfile.onboardingComplete,
          currentPhase: userProfile.currentPhase,
        },
        leadershipProfile: leadershipProfile ? {
          presentedSelf: leadershipProfile.presentedSelf,
          observedSelf: leadershipProfile.observedSelf,
          tensions: leadershipProfile.tensions,
          corePatterns: leadershipProfile.corePatterns,
          growthEdges: leadershipProfile.growthEdges,
          coachingApproach: leadershipProfile.coachingApproach,
        } : null,
        reflections,
        challenges,
        reveals,
        keyEvidence,
        recentConversations,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labDeepDive error", error);
      throw new HttpsError("internal", "Failed to load member deep dive");
    }
  }
);

/**
 * labSessionPlanner — AI-generated agenda for in-person facilitator sessions.
 *
 * Analyzes cohort data and generates a structured session plan with:
 * - Discussion topics based on common tensions
 * - Individual check-in prompts
 * - Activities targeting the cohort's collective growth edges
 * - Facilitator talking points
 */
exports.labSessionPlanner = onCall(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 3,
    timeoutSeconds: 120,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { cohortId, sessionDuration = 60 } = request.data || {};
    if (!cohortId) {
      throw new HttpsError("invalid-argument", "cohortId is required");
    }

    const authorized = await isFacilitatorOrAdmin(request.auth, cohortId);
    if (!authorized) {
      throw new HttpsError("permission-denied", "Facilitator or admin access required");
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new HttpsError("internal", "AI service not configured");
    }

    const db = admin.firestore();

    try {
      const cohortSnap = await db.doc(`${LL_PREFIX}cohorts/${cohortId}`).get();
      if (!cohortSnap.exists) {
        throw new HttpsError("not-found", "Cohort not found");
      }
      const cohort = cohortSnap.data();
      const weekNumber = getCohortWeekNumber(cohort.startDate);
      const wIdx = weekIdx(weekNumber);

      // Gather cohort member data
      const membersSnap = await db
        .collection(`${LL_PREFIX}cohorts/${cohortId}/members`)
        .where("status", "==", "enrolled")
        .get();

      const memberProfiles = [];
      for (const memberDoc of membersSnap.docs) {
        const memberId = memberDoc.id;
        const userSnap = await db.doc(`${LL_PREFIX}users/${memberId}`).get();
        if (!userSnap.exists) continue;
        const user = userSnap.data();

        const lpSnap = await db.doc(`${LL_PREFIX}users/${memberId}/leadershipProfile/current`).get();
        const lp = lpSnap.exists ? lpSnap.data() : null;

        // Get this week's reflection
        const reflSnap = await db.doc(`${LL_PREFIX}users/${memberId}/reflections/${weekNumber - 1}`).get();
        const weeklyReflection = reflSnap.exists ? reflSnap.data().summary : null;

        // Get challenge status
        const challSnap = await db.doc(`${LL_PREFIX}users/${memberId}/challenges/${weekNumber}`).get();
        const challenge = challSnap.exists ? challSnap.data() : null;

        memberProfiles.push({
          name: user.displayName || user.firstName || "Unknown",
          presentedSelf: lp?.presentedSelf || "Not yet profiled",
          tensions: (lp?.tensions || []).map((t) => `${t.left} ↔ ${t.right}`).join("; "),
          growthEdges: (lp?.growthEdges || []).join("; "),
          weeklyReflection: weeklyReflection || "No reflection yet",
          experimentStatus: challenge?.status || "none",
          experiment: challenge?.personalizedExperiment || challenge?.experiment || "None assigned",
        });
      }

      const memberContext = memberProfiles
        .map((m) => `${m.name}:
  Presented Self: ${m.presentedSelf}
  Tensions: ${m.tensions || "None"}
  Growth Edges: ${m.growthEdges || "None"}
  Weekly Observation: ${m.weeklyReflection}
  Experiment: ${m.experiment} (${m.experimentStatus})`)
        .join("\n\n");

      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are a session planner for Leadership Lab, a 5-milestone leadership development program that supports Arena Foundations in-person training. The facilitator is preparing for a group session with their cohort.

Generate a detailed session plan that:
1. Weaves AI coaching insights into group discussion
2. Creates safe-enough space for vulnerability without forcing it
3. Uses the real tensions and patterns from the cohort's AI coaching
4. Includes at least one activity where members interact with each other's growth edges
5. Never reveals individual AI coaching details publicly — only the facilitator sees this plan

Session Duration: ${sessionDuration} minutes
Week ${weekNumber}: ${LL_WEEK_THEMES[wIdx]}
This week's base experiment: ${LL_EXPERIMENTS[wIdx]}

Return ONLY a JSON object:
{
  "sessionTitle": "Compelling session title",
  "openingPrompt": "1-2 sentence opening question for the group (under 50 words)",
  "segments": [
    {
      "title": "Segment name",
      "duration": 15,
      "type": "discussion | activity | reflection | debrief",
      "description": "What happens in this segment",
      "facilitatorNotes": "What to watch for, who to check on, what patterns to name"
    }
  ],
  "individualCheckIns": [
    {
      "name": "Member name",
      "prompt": "Personalized question to ask them privately or in group",
      "watchFor": "What to notice about their response"
    }
  ],
  "closingPrompt": "Powerful closing reflection for the group",
  "facilitatorPrep": "2-3 sentences on what to prepare or be aware of for this session"
}`,
        messages: [{
          role: "user",
          content: `Plan a ${sessionDuration}-minute session for Week ${weekNumber}.

COHORT MEMBERS:
${memberContext}`,
        }],
      });

      const resultText = response.content[0]?.text || "{}";
      let plan;
      try {
        plan = JSON.parse(resultText);
      } catch {
        logger.warn("Failed to parse session plan JSON");
        plan = { sessionTitle: "Session Plan", segments: [], error: "Failed to generate structured plan", rawPlan: resultText };
      }

      // Save the session plan
      const now = admin.firestore.FieldValue.serverTimestamp();
      const planRef = db.collection(`${LL_PREFIX}cohorts/${cohortId}/sessionPlans`).doc();
      await planRef.set({
        weekNumber,
        plan,
        sessionDuration,
        generatedBy: request.auth.uid,
        createdAt: now,
      });

      return {
        success: true,
        planId: planRef.id,
        weekNumber,
        weekTheme: LL_WEEK_THEMES[wIdx],
        plan,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labSessionPlanner error", error);
      throw new HttpsError("internal", "Failed to generate session plan");
    }
  }
);

/**
 * labSendText — Facilitator sends a manual text to a cohort member.
 *
 * Creates a conversation record and sends via SMS.
 * The text appears as a coach message, maintaining the AI coaching voice.
 */
exports.labSendText = onCall(
  {
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { cohortId, memberId, message } = request.data || {};
    if (!cohortId || !memberId || !message) {
      throw new HttpsError("invalid-argument", "cohortId, memberId, and message are required");
    }

    const authorized = await isFacilitatorOrAdmin(request.auth, cohortId);
    if (!authorized) {
      throw new HttpsError("permission-denied", "Facilitator or admin access required");
    }

    const sanitizedMessage = message.trim().slice(0, 500);
    if (!sanitizedMessage) {
      throw new HttpsError("invalid-argument", "Message cannot be empty");
    }

    const db = admin.firestore();

    try {
      // Load member
      const userSnap = await db.doc(`${LL_PREFIX}users/${memberId}`).get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "Member not found");
      }
      const phone = userSnap.data().phone;
      if (!phone) {
        throw new HttpsError("failed-precondition", "Member has no phone number");
      }

      const weekNumber = userSnap.data().currentWeek || 1;
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Save as a facilitator-initiated conversation
      const convoRef = db.collection(`${LL_PREFIX}users/${memberId}/conversations`).doc();
      await convoRef.set({
        mode: "coach",
        weekNumber,
        channel: "sms",
        interactionType: "facilitator-manual",
        aiInitiated: false,
        facilitatorId: request.auth.uid,
        messages: [
          { role: "assistant", content: sanitizedMessage, timestamp: new Date().toISOString(), channel: "sms" },
        ],
        summary: "",
        createdAt: now,
        updatedAt: now,
      });

      // Send SMS
      const sid = await sendLabSms(phone, sanitizedMessage);

      logger.info("Facilitator text sent", {
        facilitatorId: request.auth.uid,
        memberId,
        cohortId,
      });

      return {
        success: true,
        conversationId: convoRef.id,
        messageSid: sid,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labSendText error", error);
      throw new HttpsError("internal", "Failed to send text");
    }
  }
);

// ============================================================================
// LEADERSHIP LAB — My Prescriptions (user-facing)
// ============================================================================

/**
 * labMyPrescriptions — Returns the authenticated user's content prescriptions.
 * Used by the Lab screen to show "Prescribed for You" content.
 */
exports.labMyPrescriptions = onCall(
  {
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    try {
      // Get user's current week
      const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found");
      }
      const currentWeek = userSnap.data().currentWeek || 1;

      // Load all prescriptions, most recent first
      const rxSnap = await db
        .collection(`${LL_PREFIX}users/${uid}/prescriptions`)
        .orderBy("weekNumber", "desc")
        .get();

      const prescriptions = [];
      rxSnap.forEach((doc) => {
        const d = doc.data();
        prescriptions.push({
          id: doc.id,
          weekNumber: d.weekNumber,
          type: d.type,
          topic: d.topic,
          content: d.content,
          whyYou: d.whyYou,
          connectedTension: d.connectedTension,
          status: d.status,
          createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
          deliveredAt: d.deliveredAt ? d.deliveredAt.toDate().toISOString() : null,
        });
      });

      // Mark current week's prescription as "read" if user is viewing
      const currentRx = prescriptions.find((p) => p.weekNumber === currentWeek && p.status === "delivered");
      if (currentRx) {
        await db.doc(`${LL_PREFIX}users/${uid}/prescriptions/${currentRx.id}`).update({
          status: "read",
        });
        currentRx.status = "read";
      }

      return {
        currentWeek,
        prescriptions,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labMyPrescriptions error", error);
      throw new HttpsError("internal", "Failed to load prescriptions");
    }
  }
);

// ============================================================================
// LEADERSHIP LAB — 360 Feedback Integration
// ============================================================================

const { randomBytes } = require("crypto");

/**
 * labCreate360 — Creates a 360 feedback survey for a user. Returns a unique
 * survey URL that can be shared with peers/team members.
 *
 * The facilitator or the leader themselves can trigger this.
 */
exports.labCreate360 = onCall(
  {
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 5,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { targetUserId } = request.data || {};
    // If targetUserId is provided, must be facilitator/admin
    // If not, the user is creating their own 360
    const uid = targetUserId || request.auth.uid;

    if (targetUserId && targetUserId !== request.auth.uid) {
      // Verify caller is a facilitator or admin
      const db = admin.firestore();
      const cohortsSnap = await db
        .collection(`${LL_PREFIX}cohorts`)
        .where("facilitators", "array-contains", request.auth.uid)
        .limit(1)
        .get();

      if (cohortsSnap.empty) {
        throw new HttpsError("permission-denied", "Only facilitators can create 360s for other users");
      }
    }

    const db = admin.firestore();

    // Check if user exists
    const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User not found");
    }
    const userData = userSnap.data();
    const leaderName = userData.displayName || userData.firstName || "this leader";

    // Generate unique survey token
    const token = randomBytes(16).toString("hex");

    // Check for existing active survey
    const existingSnap = await db
      .collection(`${LL_PREFIX}360surveys`)
      .where("userId", "==", uid)
      .where("status", "==", "open")
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0];
      const baseUrl = labFunctionUrl('lab360Form');
      return {
        surveyId: existing.id,
        surveyUrl: `${baseUrl}?token=${existing.data().token}`,
        responseCount: existing.data().responseCount || 0,
        status: "existing",
      };
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const surveyRef = db.collection(`${LL_PREFIX}360surveys`).doc();
    await surveyRef.set({
      userId: uid,
      leaderName,
      token,
      status: "open", // open → processing → complete
      responseCount: 0,
      createdBy: request.auth.uid,
      createdAt: now,
      updatedAt: now,
    });

    const baseUrl = labFunctionUrl('lab360Form');
    const surveyUrl = `${baseUrl}?token=${token}`;

    // If user has phone and SMS opt-in, text them the link
    if (userData.phone && userData.smsOptIn) {
      try {
        await sendLabSms(
          userData.phone,
          `Your 360 feedback survey is ready. Share this link with 3-5 people who know your leadership well: ${surveyUrl}`
        );
      } catch {
        // SMS is supplemental — don't fail the create
      }
    }

    logger.info("360 survey created", { uid, surveyId: surveyRef.id });

    return {
      surveyId: surveyRef.id,
      surveyUrl,
      responseCount: 0,
      status: "created",
    };
  }
);

/**
 * lab360Form — HTTP GET that serves a self-contained HTML form for 360 respondents.
 * No authentication required — access is via the unique survey token.
 */
exports.lab360Form = onRequest(
  {
    region: "us-central1",
    maxInstances: 20,
  },
  async (req, res) => {
    const token = req.query.token;
    if (!token) {
      res.status(400).send("Missing survey token");
      return;
    }

    const db = admin.firestore();
    const surveySnap = await db
      .collection(`${LL_PREFIX}360surveys`)
      .where("token", "==", token)
      .where("status", "==", "open")
      .limit(1)
      .get();

    if (surveySnap.empty) {
      res.status(404).send("This survey is no longer accepting responses.");
      return;
    }

    const survey = surveySnap.docs[0].data();
    const leaderName = survey.leaderName;
    const submitUrl = labFunctionUrl('lab360Submit');

    if (req.method === "GET") {
      res.set("Content-Type", "text/html");
      res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>360 Feedback for ${escapeHtml(leaderName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Nunito Sans', system-ui, sans-serif; background: #F5F4F0; color: #1a1a1a; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; }
    h1 { font-size: 24px; color: #002E47; margin-bottom: 8px; }
    .subtitle { color: #777; font-size: 14px; margin-bottom: 32px; line-height: 1.5; }
    .question { margin-bottom: 24px; }
    label { display: block; font-weight: 600; font-size: 14px; color: #002E47; margin-bottom: 8px; line-height: 1.4; }
    textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 12px; font-family: inherit; font-size: 14px; resize: vertical; min-height: 80px; }
    textarea:focus { outline: none; border-color: #47A88D; box-shadow: 0 0 0 2px rgba(71,168,141,0.15); }
    .relationship { margin-bottom: 24px; }
    select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 12px; font-family: inherit; font-size: 14px; background: white; }
    button { width: 100%; padding: 14px; background: #47A88D; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    button:hover { background: #3d9179; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .note { font-size: 12px; color: #999; margin-top: 24px; text-align: center; }
    .success { text-align: center; padding: 60px 20px; }
    .success h2 { color: #47A88D; margin-bottom: 12px; }
    .error { color: #E04E1B; font-size: 13px; margin-top: 8px; display: none; }
  </style>
</head>
<body>
  <div class="container" id="form-view">
    <h1>360 Feedback</h1>
    <p class="subtitle">
      You've been asked to share honest feedback about <strong>${escapeHtml(leaderName)}</strong>'s leadership.
      Your responses are <strong>completely anonymous</strong> — ${escapeHtml(leaderName)} will see synthesized themes, not individual responses.
    </p>
    <form id="feedback-form">
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <div class="relationship">
        <label>Your relationship to ${escapeHtml(leaderName)}:</label>
        <select name="relationship" required>
          <option value="">Select one...</option>
          <option value="direct-report">Direct report</option>
          <option value="peer">Peer / colleague</option>
          <option value="manager">Their manager</option>
          <option value="cross-functional">Cross-functional partner</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="question">
        <label>What is ${escapeHtml(leaderName)}'s greatest strength as a leader?</label>
        <textarea name="q1" required minlength="20" placeholder="Be specific — think of a concrete example..."></textarea>
      </div>
      <div class="question">
        <label>What is the one thing ${escapeHtml(leaderName)} should change about how they lead?</label>
        <textarea name="q2" required minlength="20" placeholder="What would make the biggest difference?"></textarea>
      </div>
      <div class="question">
        <label>Describe a recent moment where ${escapeHtml(leaderName)}'s leadership had a significant impact (positive or negative).</label>
        <textarea name="q3" required minlength="20" placeholder="What happened, and what was the impact?"></textarea>
      </div>
      <div class="question">
        <label>What does ${escapeHtml(leaderName)} seem to avoid or struggle with?</label>
        <textarea name="q4" required minlength="20" placeholder="What patterns have you noticed?"></textarea>
      </div>
      <div class="question">
        <label>If you could tell ${escapeHtml(leaderName)} one honest thing about their leadership that they might not want to hear, what would it be?</label>
        <textarea name="q5" required minlength="20" placeholder="Be honest — this is anonymous and it helps them grow..."></textarea>
      </div>
      <p class="error" id="error-msg"></p>
      <button type="submit" id="submit-btn">Submit Feedback</button>
      <p class="note">Your identity will never be shared. Only synthesized themes are shown to ${escapeHtml(leaderName)}.</p>
    </form>
  </div>
  <div class="container success" id="success-view" style="display:none">
    <h2>Thank you</h2>
    <p>Your feedback has been recorded anonymously. It will help ${escapeHtml(leaderName)} grow as a leader.</p>
  </div>
  <script>
    document.getElementById('feedback-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const btn = document.getElementById('submit-btn');
      const errEl = document.getElementById('error-msg');
      btn.disabled = true;
      btn.textContent = 'Submitting...';
      errEl.style.display = 'none';
      try {
        const fd = new FormData(this);
        const body = {};
        fd.forEach((v, k) => { body[k] = v; });
        const resp = await fetch('${submitUrl}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || 'Submission failed');
        }
        document.getElementById('form-view').style.display = 'none';
        document.getElementById('success-view').style.display = 'block';
      } catch (err) {
        errEl.textContent = err.message || 'Something went wrong. Please try again.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Submit Feedback';
      }
    });
  </script>
</body>
</html>`);
    } else {
      res.status(405).send("Method not allowed");
    }
  }
);

/** Escape HTML for safe template rendering */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * lab360Submit — HTTP POST endpoint that saves anonymous 360 feedback responses.
 * When 3+ responses are collected, automatically triggers synthesis.
 */
exports.lab360Submit = onRequest(
  {
    secrets: ["ANTHROPIC_API_KEY"],
    region: "us-central1",
    maxInstances: 20,
    cors: true,
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    res.set("Access-Control-Allow-Origin", "*");

    const { token, relationship, q1, q2, q3, q4, q5 } = req.body || {};

    if (!token || !relationship || !q1 || !q2 || !q3 || !q4 || !q5) {
      res.status(400).send("All fields are required");
      return;
    }

    const db = admin.firestore();

    // Validate token
    const surveySnap = await db
      .collection(`${LL_PREFIX}360surveys`)
      .where("token", "==", token)
      .where("status", "==", "open")
      .limit(1)
      .get();

    if (surveySnap.empty) {
      res.status(404).send("This survey is no longer accepting responses.");
      return;
    }

    const surveyDoc = surveySnap.docs[0];
    const surveyId = surveyDoc.id;
    const surveyData = surveyDoc.data();

    try {
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Save the response (anonymous — no identity stored)
      await db.collection(`${LL_PREFIX}360surveys/${surveyId}/responses`).add({
        relationship: String(relationship).slice(0, 50),
        q1_strength: String(q1).slice(0, 2000),
        q2_change: String(q2).slice(0, 2000),
        q3_impact: String(q3).slice(0, 2000),
        q4_avoids: String(q4).slice(0, 2000),
        q5_honest: String(q5).slice(0, 2000),
        submittedAt: now,
      });

      // Increment response count
      const newCount = (surveyData.responseCount || 0) + 1;
      await surveyDoc.ref.update({
        responseCount: newCount,
        updatedAt: now,
      });

      // If 3+ responses, trigger synthesis
      if (newCount >= 3) {
        try {
          await process360Results(surveyId);
        } catch (processErr) {
          logger.warn("360 auto-processing failed, will retry", { surveyId, error: processErr.message });
        }
      }

      res.status(200).json({ success: true, responseCount: newCount });
    } catch (error) {
      logger.error("lab360Submit error", { surveyId, error: error.message });
      res.status(500).send("Failed to save response. Please try again.");
    }
  }
);

/**
 * process360Results — Synthesizes all 360 feedback responses for a survey using AI.
 * Updates the Leadership Profile with external perspective.
 *
 * @param {string} surveyId - The survey document ID
 */
async function process360Results(surveyId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");

  const db = admin.firestore();

  const surveySnap = await db.doc(`${LL_PREFIX}360surveys/${surveyId}`).get();
  if (!surveySnap.exists) throw new Error("Survey not found");
  const survey = surveySnap.data();
  const uid = survey.userId;

  // Load all responses
  const responsesSnap = await db
    .collection(`${LL_PREFIX}360surveys/${surveyId}/responses`)
    .get();

  if (responsesSnap.size < 3) {
    logger.info("Not enough 360 responses yet", { surveyId, count: responsesSnap.size });
    return;
  }

  const responses = [];
  responsesSnap.forEach((doc) => {
    const d = doc.data();
    responses.push({
      relationship: d.relationship,
      strength: d.q1_strength,
      change: d.q2_change,
      impact: d.q3_impact,
      avoids: d.q4_avoids,
      honest: d.q5_honest,
    });
  });

  // Load current Leadership Profile for comparison
  const lpSnap = await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).get();
  const currentProfile = lpSnap.exists ? lpSnap.data() : null;

  let profileContext = "";
  if (currentProfile) {
    profileContext = `CURRENT LEADERSHIP PROFILE (from coaching conversations):
- Presented Self: ${currentProfile.presentedSelf || "N/A"}
- Observed Self (AI): ${currentProfile.observedSelf || "N/A"}
- Tensions: ${(currentProfile.tensions || []).map((t) => `${t.left} ↔ ${t.right}`).join("; ") || "None"}
- Growth Edges: ${(currentProfile.growthEdges || []).join("; ") || "None"}`;
  }

  // Build anonymized response text
  const responseText = responses
    .map((r, i) => {
      return `RESPONDENT ${i + 1} (${r.relationship}):
- Greatest Strength: ${r.strength}
- Should Change: ${r.change}
- Impact Moment: ${r.impact}
- Avoids/Struggles: ${r.avoids}
- Honest Truth: ${r.honest}`;
    })
    .join("\n\n");

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are a leadership psychologist synthesizing 360 feedback for a leader in Leadership Lab.

You have the leader's self-assessment (from coaching conversations) AND external feedback from their team/peers. Your job is to find the GAPS — where others see them differently from how they see themselves.

This is the most powerful data in the program. Handle it with care but not cowardice.

Rules:
- Synthesize themes across respondents — never attribute quotes to specific people
- Identify the strongest convergence points (things multiple people independently said)
- Surface the biggest gap between how the leader sees themselves and how others see them
- Be specific — use aggregated examples, not vague generalizations
- The "blindSpot" should be something the leader genuinely can't see about themselves
- "strengthsConfirmed" are things others agree on that the leader may undervalue
- "shadowSide" is the downside of their strengths that others experience

Return ONLY a JSON object:
{
  "externalObservedSelf": "3-4 sentence synthesis of how others actually experience this leader's leadership",
  "strengthsConfirmed": ["Strength seen by multiple respondents #1", "Strength #2"],
  "changeRequested": ["Change requested by multiple respondents #1", "Change #2"],
  "blindSpot": "The most significant gap between self-perception and external perception — something they genuinely can't or won't see",
  "shadowSide": "The downside of their strengths that others experience (e.g., 'decisiveness' experienced as 'steamrolling')",
  "tensionEvidence": ["Evidence from 360 that relates to a specific tension in their profile"],
  "gapSummary": "2-3 sentence summary comparing their Presented Self to what others actually experience. Be direct."
}

Return ONLY valid JSON. No markdown.`,
    messages: [{
      role: "user",
      content: `Synthesize 360 feedback for ${survey.leaderName}.

${profileContext}

360 FEEDBACK RESPONSES (${responses.length} respondents):

${responseText}`,
    }],
  });

  const resultText = response.content[0]?.text || "{}";
  let synthesis;
  try {
    synthesis = JSON.parse(resultText);
  } catch {
    logger.warn("Failed to parse 360 synthesis JSON", { resultText });
    synthesis = {
      externalObservedSelf: "Multiple perspectives have been collected. Review the themes below.",
      strengthsConfirmed: [],
      changeRequested: [],
      blindSpot: "",
      shadowSide: "",
      tensionEvidence: [],
      gapSummary: "",
    };
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  // Save 360 summary
  await db.doc(`${LL_PREFIX}users/${uid}/360summary/current`).set({
    surveyId,
    respondentCount: responses.length,
    externalObservedSelf: synthesis.externalObservedSelf || "",
    strengthsConfirmed: synthesis.strengthsConfirmed || [],
    changeRequested: synthesis.changeRequested || [],
    blindSpot: synthesis.blindSpot || "",
    shadowSide: synthesis.shadowSide || "",
    tensionEvidence: synthesis.tensionEvidence || [],
    gapSummary: synthesis.gapSummary || "",
    status: "complete",
    processedAt: now,
    updatedAt: now,
  });

  // Update survey status
  await surveySnap.ref.update({
    status: "complete",
    processedAt: now,
    updatedAt: now,
  });

  // Update Leadership Profile with external perspective
  if (currentProfile && synthesis.externalObservedSelf) {
    const updatedProfile = {
      externalObservedSelf: synthesis.externalObservedSelf,
      blindSpot: synthesis.blindSpot || "",
      shadowSide: synthesis.shadowSide || "",
      has360: true,
      updatedAt: now,
    };
    await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).update(updatedProfile);
  }

  // Notify user via SMS
  const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
  if (userSnap.exists) {
    const userData = userSnap.data();
    if (userData.phone && userData.smsOptIn) {
      try {
        await sendLabSms(
          userData.phone,
          `Your 360 feedback is ready. ${responses.length} people shared their perspective on your leadership. Open the app to see the full picture — what they see that you might not.`
        );
      } catch {
        // SMS is supplemental
      }
    }
  }

  logger.info("360 feedback processed", { uid, surveyId, respondentCount: responses.length });

  return synthesis;
}

/**
 * labMy360Summary — Returns the authenticated user's 360 feedback synthesis.
 * Used by the Mirror screen.
 */
exports.labMy360Summary = onCall(
  {
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    try {
      // Get 360 summary
      const summarySnap = await db.doc(`${LL_PREFIX}users/${uid}/360summary/current`).get();

      if (!summarySnap.exists) {
        // Check for active survey
        const surveySnap = await db
          .collection(`${LL_PREFIX}360surveys`)
          .where("userId", "==", uid)
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        if (surveySnap.empty) {
          return { hasSurvey: false, summary: null };
        }

        const survey = surveySnap.docs[0].data();
        return {
          hasSurvey: true,
          surveyStatus: survey.status,
          responseCount: survey.responseCount || 0,
          summary: null,
        };
      }

      const d = summarySnap.data();
      return {
        hasSurvey: true,
        surveyStatus: "complete",
        summary: {
          respondentCount: d.respondentCount,
          externalObservedSelf: d.externalObservedSelf,
          strengthsConfirmed: d.strengthsConfirmed || [],
          changeRequested: d.changeRequested || [],
          blindSpot: d.blindSpot,
          shadowSide: d.shadowSide,
          tensionEvidence: d.tensionEvidence || [],
          gapSummary: d.gapSummary,
          processedAt: d.processedAt ? d.processedAt.toDate().toISOString() : null,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labMy360Summary error", error);
      throw new HttpsError("internal", "Failed to load 360 summary");
    }
  }
);

// ============================================================================
// LEADERSHIP LAB — Ascent Phase (Post-Program)
// ============================================================================

/**
 * generateWeatherReport — Analyzes the leader's full trajectory and recent
 * conversations to produce a monthly "leadership weather report."
 *
 * The weather report uses meteorological metaphors to describe:
 * - Current climate (overall leadership state)
 * - Forecast (where they're headed based on patterns)
 * - Growth patterns (what's shifted since the program)
 * - Active tensions (which tensions are most alive right now)
 * - Recommended focus (one thing to pay attention to this month)
 *
 * @param {string} uid - User ID
 * @returns {Promise<object>} Saved weather report document
 */
async function generateWeatherReport(uid) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");

  const db = admin.firestore();

  // Load user profile
  const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
  if (!userSnap.exists) throw new Error("User not found");
  const userProfile = userSnap.data();
  const userName = userProfile.displayName || userProfile.firstName || "this leader";

  // Load Leadership Profile
  const lpSnap = await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).get();
  const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;

  // Load all reflections (weekly summaries from the program)
  const reflSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/reflections`)
    .orderBy("weekNumber", "asc")
    .get();

  const reflections = [];
  reflSnap.forEach((doc) => {
    const d = doc.data();
    reflections.push(`Week ${d.weekNumber}: ${d.summary}`);
  });

  // Load all challenges/experiments
  const challSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/challenges`)
    .orderBy("weekNumber", "asc")
    .get();

  const experiments = [];
  challSnap.forEach((doc) => {
    const d = doc.data();
    experiments.push(
      `Week ${d.weekNumber} (${d.status}): ${d.personalizedExperiment || d.experiment}${d.aiObservation ? ` — Observation: ${d.aiObservation}` : ""}`
    );
  });

  // Load reveals
  const revSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/reveals`)
    .where("status", "in", ["delivered", "acknowledged"])
    .orderBy("createdAt", "asc")
    .get();

  const reveals = [];
  revSnap.forEach((doc) => {
    const d = doc.data();
    reveals.push(`${d.type}: ${d.content}${d.userResponse ? ` — Response: "${d.userResponse}"` : ""}`);
  });

  // Load recent conversations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentConvos = await db
    .collection(`${LL_PREFIX}users/${uid}/conversations`)
    .where("createdAt", ">=", thirtyDaysAgo)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const recentContext = [];
  recentConvos.forEach((doc) => {
    const data = doc.data();
    const userMsgs = (data.messages || [])
      .filter((m) => m.role === "user")
      .map((m) => m.content.slice(0, 200));
    if (userMsgs.length > 0) {
      recentContext.push(`[${data.mode}, ${data.interactionType || "general"}]: ${userMsgs.join(" | ")}`);
    }
  });

  // Load previous weather reports for continuity
  const prevReports = await db
    .collection(`${LL_PREFIX}users/${uid}/weatherReports`)
    .orderBy("createdAt", "desc")
    .limit(2)
    .get();

  const previousReports = [];
  prevReports.forEach((doc) => {
    const d = doc.data();
    previousReports.push(`${d.month}: Climate — ${d.climate}. Focus — ${d.recommendedFocus}`);
  });

  // Build profile context
  let profileContext = "LEADERSHIP PROFILE: Not established.";
  if (leadershipProfile) {
    profileContext = `LEADERSHIP PROFILE:
- Presented Self: ${leadershipProfile.presentedSelf || "N/A"}
- Observed Self: ${leadershipProfile.observedSelf || "N/A"}
- Core Patterns: ${(leadershipProfile.corePatterns || []).join("; ") || "None"}
- Growth Edges: ${(leadershipProfile.growthEdges || []).join("; ") || "None"}`;

    if (leadershipProfile.tensions && leadershipProfile.tensions.length > 0) {
      const tensionStr = leadershipProfile.tensions
        .map((t) => `${t.left} ↔ ${t.right} (leans ${t.position > 50 ? t.right : t.left})`)
        .join("; ");
      profileContext += `\n- Tensions: ${tensionStr}`;
    }
  }

  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are the Leadership Weather Service for Leadership Lab. You've been coaching this leader through the Arena Foundations program and now they're in the Ascent Phase — ongoing post-program development.

Your job: produce a monthly "Leadership Weather Report" — a rich metaphorical summary of where this leader stands and where they're heading. Think of it as a climate report for their leadership, not a report card.

Weather metaphors to use naturally (don't force all of them):
- Clear skies = alignment, confidence, self-awareness
- Gathering clouds = unresolved tension building
- High pressure = external demands creating compression
- Trade winds = reliable patterns (can be strengths or ruts)
- Front moving in = shift/transition approaching
- Fog = uncertainty, lack of clarity
- Thaw = old defenses softening
- Turbulence = productive discomfort, growth happening

Rules:
- Ground every observation in EVIDENCE from their conversations, experiments, and reveals
- Reference specific moments from their program — use their own words when possible
- The "forecast" should be predictive based on patterns, not aspirational
- "recommendedFocus" should be ONE specific, actionable focus area for the coming month
- The "smsTeaser" is a compelling 1-line text message to entice them to open the full report in the app
- Keep "climate" to 2-3 sentences. Keep "forecast" to 2-3 sentences.
- "growthSignals" should reference specific behavioral shifts with evidence
- "activeTensions" should name which tensions from their profile are most alive right now

Return ONLY a JSON object:
{
  "climate": "2-3 sentence current state using weather metaphors, grounded in evidence",
  "forecast": "2-3 sentence predictive outlook based on patterns",
  "growthSignals": ["Specific shift #1 with evidence", "Specific shift #2"],
  "activeTensions": ["Tension description with current state"],
  "recommendedFocus": "One specific focus for this month",
  "smsTeaser": "One compelling line to text them (under 160 chars)",
  "weatherEmoji": "☀️ | 🌤️ | ⛅ | 🌥️ | 🌦️ | 🌧️ | ⛈️ | 🌫️"
}

Return ONLY valid JSON. No markdown.`,
    messages: [{
      role: "user",
      content: `Generate ${monthName} weather report for ${userName}.

${profileContext}

PROGRAM REFLECTIONS:
${reflections.join("\n") || "None recorded"}

EXPERIMENTS:
${experiments.join("\n") || "None recorded"}

REVEALS:
${reveals.join("\n") || "None delivered"}

RECENT CONVERSATIONS (last 30 days):
${recentContext.join("\n") || "No recent conversations"}

PREVIOUS WEATHER REPORTS:
${previousReports.join("\n") || "First report"}`,
    }],
  });

  const resultText = response.content[0]?.text || "{}";
  let report;
  try {
    report = JSON.parse(resultText);
  } catch {
    logger.warn("Failed to parse weather report JSON", { resultText });
    report = {
      climate: "Conditions are developing. More data needed to establish a clear pattern.",
      forecast: "Continue engaging with coaching conversations to build a richer picture.",
      growthSignals: [],
      activeTensions: [],
      recommendedFocus: "Stay engaged with weekly check-ins.",
      smsTeaser: "Your monthly leadership weather report is ready.",
      weatherEmoji: "🌤️",
    };
  }

  // Save to weatherReports collection
  const now = admin.firestore.FieldValue.serverTimestamp();
  const reportData = {
    month: monthName,
    climate: report.climate || "",
    forecast: report.forecast || "",
    growthSignals: report.growthSignals || [],
    activeTensions: report.activeTensions || [],
    recommendedFocus: report.recommendedFocus || "",
    smsTeaser: report.smsTeaser || "",
    weatherEmoji: report.weatherEmoji || "🌤️",
    status: "generated", // generated → delivered → read
    createdAt: now,
    deliveredAt: null,
  };

  const reportRef = db.collection(`${LL_PREFIX}users/${uid}/weatherReports`).doc();
  await reportRef.set(reportData);

  logger.info("Weather report generated", { uid, month: monthName });

  return { id: reportRef.id, ...reportData };
}

/**
 * labGenerateWeatherReport — Monthly scheduled function that generates weather
 * reports for all leaders in the Ascent Phase.
 *
 * Runs on the 1st of each month at 6 AM ET.
 */
exports.labGenerateWeatherReport = onSchedule(
  {
    schedule: "0 6 1 * *", // 1st of month, 6 AM
    timeZone: "America/New_York",
    secrets: ["ANTHROPIC_API_KEY"],
    region: "us-central1",
    maxInstances: 1,
    timeoutSeconds: 540,
  },
  async (event) => {
    const db = admin.firestore();

    logger.info("labGenerateWeatherReport triggered");

    // Find all ascent-phase users
    const usersSnap = await db
      .collection(`${LL_PREFIX}users`)
      .where("phase", "==", "ascent")
      .get();

    if (usersSnap.empty) {
      logger.info("No ascent-phase users");
      return;
    }

    let generated = 0;
    let errors = 0;

    for (const userDoc of usersSnap.docs) {
      try {
        const report = await generateWeatherReport(userDoc.id);

        // Send the teaser via SMS if user has a phone
        const userData = userDoc.data();
        if (userData.phone && userData.smsOptIn) {
          await sendLabSms(userData.phone, report.smsTeaser || "Your monthly leadership weather report is ready. Open the app to see the full forecast.");

          // Mark as delivered
          await db.doc(`${LL_PREFIX}users/${userDoc.id}/weatherReports/${report.id}`).update({
            status: "delivered",
            deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        generated++;
      } catch (err) {
        errors++;
        logger.error("Failed to generate weather report", { uid: userDoc.id, error: err.message });
      }
    }

    logger.info("labGenerateWeatherReport complete", { generated, errors });
  }
);

/**
 * labAscentScheduledSms — Weekly coaching check-in for post-program leaders.
 *
 * Runs Monday 9 AM ET — one text per week instead of the daily cadence during
 * the active program. Maintains the coaching relationship with lower touch.
 */
exports.labAscentScheduledSms = onSchedule(
  {
    schedule: "0 9 * * 1", // Monday 9 AM
    timeZone: "America/New_York",
    secrets: ["ANTHROPIC_API_KEY"],
    region: "us-central1",
    maxInstances: 1,
    timeoutSeconds: 540,
  },
  async (event) => {
    const db = admin.firestore();

    logger.info("labAscentScheduledSms triggered");

    // Find all ascent-phase users
    const usersSnap = await db
      .collection(`${LL_PREFIX}users`)
      .where("phase", "==", "ascent")
      .get();

    if (usersSnap.empty) {
      logger.info("No ascent-phase users");
      return;
    }

    let totalSent = 0;
    let totalErrors = 0;

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;

      if (!userData.phone || !userData.smsOptIn) continue;

      try {
        // Load Leadership Profile
        const lpSnap = await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).get();
        const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;

        // Load most recent weather report for context
        const recentReport = await db
          .collection(`${LL_PREFIX}users/${uid}/weatherReports`)
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        let reportContext = "";
        if (!recentReport.empty) {
          const r = recentReport.docs[0].data();
          reportContext = `\nLATEST WEATHER REPORT:\n- Climate: ${r.climate}\n- Recommended Focus: ${r.recommendedFocus}`;
        }

        // Load last few ascent conversations for continuity
        const recentConvos = await db
          .collection(`${LL_PREFIX}users/${uid}/conversations`)
          .orderBy("createdAt", "desc")
          .limit(3)
          .get();

        const recentContext = [];
        recentConvos.forEach((doc) => {
          const data = doc.data();
          const lastUserMsg = (data.messages || []).filter((m) => m.role === "user").slice(-1)[0];
          if (lastUserMsg) recentContext.push(`"${lastUserMsg.content.slice(0, 200)}"`);
        });

        const userName = userData.displayName || userData.firstName || "there";

        // Build profile context
        let profileStr = "";
        if (leadershipProfile) {
          profileStr = `\nPROFILE:\n- Growth Edges: ${(leadershipProfile.growthEdges || []).join("; ") || "N/A"}`;
          if (leadershipProfile.tensions && leadershipProfile.tensions.length > 0) {
            const tensionStr = leadershipProfile.tensions
              .map((t) => `${t.left} ↔ ${t.right}`)
              .join("; ");
            profileStr += `\n- Tensions: ${tensionStr}`;
          }
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: `You are the AI coach for Leadership Lab. ${userName} has completed the Arena Foundations program and is now in the Ascent Phase — ongoing weekly check-ins to sustain and deepen their growth.

Your role has shifted from intensive daily coaching to a lighter weekly touch. Think of yourself as a trusted advisor who drops in once a week with something meaningful.

ASCENT PHASE COACHING RULES:
- ONE text per week. Make it count.
- Rotate between: checking in on their recommended focus area, surfacing a pattern you've noticed, asking about a real leadership moment that week, or connecting something current to something from their program.
- Reference their specific growth edges and tensions — show that you remember them.
- Be warm but substantive. No generic "how's your week going?"
- Keep it under 300 characters.
- End with something that invites reflection but doesn't demand a response.
${profileStr}
${reportContext}

RECENT EXCHANGES:
${recentContext.join("\n") || "No recent exchanges"}`,
          messages: [{
            role: "user",
            content: `Generate a weekly ascent check-in text for ${userName}. Write ONLY the text message. No preamble.`,
          }],
        });

        const aiText = response.content[0]?.text || "";
        if (!aiText) continue;

        // Save conversation
        const now = admin.firestore.FieldValue.serverTimestamp();
        const convoRef = db.collection(`${LL_PREFIX}users/${uid}/conversations`).doc();
        await convoRef.set({
          mode: "coach",
          weekNumber: userData.currentWeek || 6,
          channel: "sms",
          interactionType: "ascent-checkin",
          aiInitiated: true,
          messages: [
            { role: "assistant", content: aiText, timestamp: new Date().toISOString(), channel: "sms" },
          ],
          summary: "",
          createdAt: now,
          updatedAt: now,
        });

        // Send SMS
        await sendLabSms(userData.phone, aiText);
        totalSent++;

        logger.info("Ascent check-in sent", { uid });
      } catch (err) {
        totalErrors++;
        logger.error("Ascent SMS error", { uid, error: err.message });
      }
    }

    logger.info("labAscentScheduledSms complete", { totalSent, totalErrors });
  }
);

/**
 * labMyWeatherReports — Returns the authenticated user's weather reports.
 * Used by the Story screen to show monthly growth summaries.
 */
exports.labMyWeatherReports = onCall(
  {
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    try {
      const reportsSnap = await db
        .collection(`${LL_PREFIX}users/${uid}/weatherReports`)
        .orderBy("createdAt", "desc")
        .get();

      const reports = [];
      reportsSnap.forEach((doc) => {
        const d = doc.data();
        reports.push({
          id: doc.id,
          month: d.month,
          climate: d.climate,
          forecast: d.forecast,
          growthSignals: d.growthSignals || [],
          activeTensions: d.activeTensions || [],
          recommendedFocus: d.recommendedFocus,
          weatherEmoji: d.weatherEmoji || "🌤️",
          status: d.status,
          createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
        });
      });

      // Mark the latest as "read" if user is viewing
      if (reports.length > 0 && reports[0].status === "delivered") {
        await db.doc(`${LL_PREFIX}users/${uid}/weatherReports/${reports[0].id}`).update({
          status: "read",
        });
        reports[0].status = "read";
      }

      return { reports };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labMyWeatherReports error", error);
      throw new HttpsError("internal", "Failed to load weather reports");
    }
  }
);

// ============================================================================
// LEADERSHIP LAB — Growth Narrative Generator
// ============================================================================

/**
 * generateGrowthNarrative — Synthesizes the leader's entire journey into a
 * cohesive growth narrative: who they were, what shifted, and who they're becoming.
 *
 * Draws from: Leadership Profile (dual profile, tensions), all weekly reflections,
 * all experiments (and their outcomes), reveals (and responses), 360 feedback
 * (if available), evidence, and conversation history.
 *
 * The narrative has three acts:
 * 1. ARRIVAL — Who they were when they started (from onboarding + Week 1)
 * 2. THE CRUCIBLE — What happened, what surprised them, where they resisted and where they opened
 * 3. EMERGENCE — Who they're becoming (with honest admission of what hasn't changed yet)
 *
 * @param {string} uid - User ID
 * @returns {Promise<object>} The generated narrative document
 */
async function generateGrowthNarrative(uid) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service not configured");

  const db = admin.firestore();

  // Load user profile
  const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
  if (!userSnap.exists) throw new Error("User not found");
  const userProfile = userSnap.data();
  const userName = userProfile.displayName || userProfile.firstName || "this leader";

  // Load Leadership Profile
  const lpSnap = await db.doc(`${LL_PREFIX}users/${uid}/leadershipProfile/current`).get();
  const leadershipProfile = lpSnap.exists ? lpSnap.data() : null;

  // Load all weekly reflections
  const reflSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/reflections`)
    .orderBy("weekNumber", "asc")
    .get();

  const reflections = [];
  reflSnap.forEach((doc) => {
    const d = doc.data();
    reflections.push(`Week ${d.weekNumber}: ${d.summary}`);
  });

  // Load all experiments and outcomes
  const challSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/challenges`)
    .orderBy("weekNumber", "asc")
    .get();

  const experiments = [];
  challSnap.forEach((doc) => {
    const d = doc.data();
    const status = d.status || "unknown";
    const obs = d.aiObservation ? ` | Observation: ${d.aiObservation}` : "";
    const why = d.whyThisMatters ? ` | Why: ${d.whyThisMatters}` : "";
    experiments.push(
      `Week ${d.weekNumber} [${status}]: ${d.personalizedExperiment || d.experiment}${why}${obs}`
    );
  });

  // Load all reveals + responses
  const revSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/reveals`)
    .orderBy("createdAt", "asc")
    .get();

  const reveals = [];
  revSnap.forEach((doc) => {
    const d = doc.data();
    const resp = d.userResponse ? ` → Response: "${d.userResponse}"` : ` → ${d.status}`;
    reveals.push(`[${d.type}] ${d.content}${resp}`);
  });

  // Load key evidence
  const evSnap = await db
    .collection(`${LL_PREFIX}users/${uid}/evidence`)
    .orderBy("createdAt", "asc")
    .limit(15)
    .get();

  const evidenceItems = [];
  evSnap.forEach((doc) => {
    const d = doc.data();
    if (d.quote) evidenceItems.push(`Week ${d.weekNumber}: "${d.quote}" (${d.category || "general"})`);
    if (d.observation) evidenceItems.push(`Week ${d.weekNumber}: ${d.observation}`);
  });

  // Load 360 summary if available
  const threeSixtySnap = await db.doc(`${LL_PREFIX}users/${uid}/360summary/current`).get();
  let threeSixtyContext = "";
  if (threeSixtySnap.exists) {
    const s = threeSixtySnap.data();
    threeSixtyContext = `
360 FEEDBACK (${s.respondentCount} respondents):
- External Observed Self: ${s.externalObservedSelf}
- Blind Spot: ${s.blindSpot}
- Shadow Side: ${s.shadowSide}
- Gap Summary: ${s.gapSummary}
- Strengths Confirmed: ${(s.strengthsConfirmed || []).join("; ")}
- Change Requested: ${(s.changeRequested || []).join("; ")}`;
  }

  // Load onboarding conversation for "arrival" context
  const onboardingConvo = await db
    .collection(`${LL_PREFIX}users/${uid}/conversations`)
    .where("mode", "==", "onboarding")
    .limit(1)
    .get();

  let arrivalContext = "";
  if (!onboardingConvo.empty) {
    const onbData = onboardingConvo.docs[0].data();
    const transcript = (onbData.messages || [])
      .map((m) => `${m.role === "user" ? "LEADER" : "COACH"}: ${m.content}`)
      .join("\n");
    arrivalContext = `ONBOARDING CONVERSATION:\n${transcript.slice(0, 2000)}`;
  }

  // Build profile context
  let profileContext = "";
  if (leadershipProfile) {
    profileContext = `LEADERSHIP PROFILE:
- Presented Self: ${leadershipProfile.presentedSelf || "N/A"}
- Observed Self (AI): ${leadershipProfile.observedSelf || "N/A"}
- Core Patterns: ${(leadershipProfile.corePatterns || []).join("; ") || "None"}
- Growth Edges: ${(leadershipProfile.growthEdges || []).join("; ") || "None"}
- Coaching Approach: ${leadershipProfile.coachingApproach || "N/A"}`;

    if (leadershipProfile.tensions && leadershipProfile.tensions.length > 0) {
      const tensionStr = leadershipProfile.tensions
        .map((t) => `${t.left} ↔ ${t.right} (leans ${t.position > 50 ? t.right : t.left})`)
        .join("; ");
      profileContext += `\n- Tensions: ${tensionStr}`;
    }

    if (leadershipProfile.externalObservedSelf) {
      profileContext += `\n- External Observed Self (360): ${leadershipProfile.externalObservedSelf}`;
    }
    if (leadershipProfile.blindSpot) {
      profileContext += `\n- Blind Spot (360): ${leadershipProfile.blindSpot}`;
    }
  }

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: `You are writing a leadership growth narrative for ${userName} — a leader who completed Leadership Lab, a 5-milestone intensive leadership development program aligned with the Arena Foundations in-person training.

This is NOT a report card. It's a STORY. A narrative about a real human being who showed up, got uncomfortable, and changed (or didn't, in some places). Write it as if you're a wise observer who knows them deeply and cares about their growth.

NARRATIVE STRUCTURE (follow this):

1. ARRIVAL — Who were they when they walked in? What did they believe about their leadership? What were they carrying? Draw from the onboarding conversation and early weeks.

2. THE CRUCIBLE — What happened during the program? What experiments mattered most? Where did they resist? Where were they surprised by themselves? What reveals landed hardest? What moments cracked something open? Be specific — use their own words when possible.

3. EMERGENCE — Who are they becoming? What has genuinely shifted? AND (critically) — what hasn't shifted yet? What tensions remain unresolved? What growth edges are still sharp? Be honest. The most powerful narratives don't pretend everything is resolved.

4. WHAT OTHERS SEE — If 360 data is available, weave in how others experience their leadership. Surface the gaps — where self-perception and external perception don't match. This is powerful material.

5. LOOKING AHEAD — One paragraph about what's next. Not advice. Just an honest reckoning with where the work continues.

Rules:
- Write in second person ("You arrived...") — make it feel personal
- Use their actual words and specific moments when possible
- Don't sugarcoat. Don't catastrophize. Be real.
- Length: 500-800 words total
- No bullet points, no headers in the narrative itself — write it as flowing prose
- If 360 data exists, the gap between self and others' perception should be a key theme
- End with something that resonates — a sentence they'll remember

Return ONLY a JSON object:
{
  "narrative": "The full growth narrative text (500-800 words, flowing prose)",
  "title": "A short evocative title for their narrative (3-8 words)",
  "keyTheme": "The single most important theme of their growth journey (1 sentence)",
  "unresolved": "The most significant unresolved tension or growth edge (1 sentence)",
  "smsTeaser": "A compelling 1-line text to deliver: 'Your growth narrative is ready' (under 160 chars)"
}

Return ONLY valid JSON. No markdown.`,
    messages: [{
      role: "user",
      content: `Write the growth narrative for ${userName}.

${profileContext}

${arrivalContext}

WEEKLY REFLECTIONS:
${reflections.join("\n") || "None recorded"}

EXPERIMENTS:
${experiments.join("\n") || "None recorded"}

REVEALS:
${reveals.join("\n") || "None delivered"}

KEY EVIDENCE:
${evidenceItems.join("\n") || "None collected"}
${threeSixtyContext}`,
    }],
  });

  const resultText = response.content[0]?.text || "{}";
  let narrative;
  try {
    narrative = JSON.parse(resultText);
  } catch {
    logger.warn("Failed to parse growth narrative JSON", { resultText });
    narrative = {
      narrative: resultText,
      title: "Your Leadership Story",
      keyTheme: "Growth is a journey, not a destination.",
      unresolved: "",
      smsTeaser: "Your leadership growth narrative is ready. Open the app to read your story.",
    };
  }

  // Save the narrative
  const now = admin.firestore.FieldValue.serverTimestamp();
  const narrativeData = {
    title: narrative.title || "Your Leadership Story",
    narrative: narrative.narrative || "",
    keyTheme: narrative.keyTheme || "",
    unresolved: narrative.unresolved || "",
    smsTeaser: narrative.smsTeaser || "",
    status: "generated", // generated → delivered → read
    createdAt: now,
    updatedAt: now,
  };

  // Use set with merge so we can regenerate
  await db.doc(`${LL_PREFIX}users/${uid}/growthNarrative/current`).set(narrativeData, { merge: true });

  logger.info("Growth narrative generated", { uid, title: narrative.title });

  return narrativeData;
}

/**
 * labGenerateNarrative — Generates or regenerates the growth narrative for
 * the authenticated user. Can be called from the Story screen.
 */
exports.labGenerateNarrative = onCall(
  {
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    secrets: ["ANTHROPIC_API_KEY"],
    maxInstances: 10,
    timeoutSeconds: 120,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    try {
      // Verify user has enough data (at least 2 weeks)
      const userSnap = await db.doc(`${LL_PREFIX}users/${uid}`).get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found");
      }
      const currentWeek = userSnap.data().currentWeek || 1;
      if (currentWeek < 2) {
        throw new HttpsError(
          "failed-precondition",
          "Your narrative needs at least 2 weeks of data to generate."
        );
      }

      const narrativeData = await generateGrowthNarrative(uid);

      // Mark as delivered (user is actively requesting it)
      await db.doc(`${LL_PREFIX}users/${uid}/growthNarrative/current`).update({
        status: "read",
      });

      return {
        title: narrativeData.title,
        narrative: narrativeData.narrative,
        keyTheme: narrativeData.keyTheme,
        unresolved: narrativeData.unresolved,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labGenerateNarrative error", error);
      throw new HttpsError("internal", "Failed to generate narrative");
    }
  }
);

/**
 * labMyNarrative — Returns the authenticated user's current growth narrative.
 * Used by the Story screen.
 */
exports.labMyNarrative = onCall(
  {
    cors: [
      /leaderreps-pd-platform\.web\.app$/,
      /leaderreps-pd-platform\.firebaseapp\.com$/,
      /leaderreps-lab\.web\.app$/,
      /leaderreps-lab\.firebaseapp\.com$/,
      /localhost/,
    ],
    invoker: "public",
    region: "us-central1",
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const uid = request.auth.uid;
    const db = admin.firestore();

    try {
      const narrativeSnap = await db.doc(`${LL_PREFIX}users/${uid}/growthNarrative/current`).get();

      if (!narrativeSnap.exists) {
        return {
          hasNarrative: false,
          narrative: null,
          canGenerate: (await db.doc(`${LL_PREFIX}users/${uid}`).get()).data()?.currentWeek >= 2,
        };
      }

      const d = narrativeSnap.data();

      // Mark as read if delivered
      if (d.status === "delivered") {
        await narrativeSnap.ref.update({ status: "read" });
      }

      return {
        hasNarrative: true,
        canGenerate: true,
        narrative: {
          title: d.title,
          narrative: d.narrative,
          keyTheme: d.keyTheme,
          unresolved: d.unresolved,
          status: d.status,
          createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
          updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("labMyNarrative error", error);
      throw new HttpsError("internal", "Failed to load narrative");
    }
  }
);

// ============================================================================
// LEADERSHIP LAB — App Unlock (SMS → App upgrade)
// ============================================================================

/**
 * labUnlockApp — Generate a magic link so an SMS participant can access the web app.
 * Creates a Firebase Auth user (by phone), stores an unlock code, and sends the link via SMS.
 * Admin/facilitator-only callable.
 */
exports.labUnlockApp = onCall(
  {
    cors: true,
    region: "us-central1",
    invoker: "public",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const db = admin.firestore();

    // Check admin
    const adminDoc = await db.doc("metadata/config").get();
    const adminEmails = adminDoc.exists ? (adminDoc.data().adminemails || []) : [];
    const callerEmail = (request.auth.token.email || "").toLowerCase();
    if (!adminEmails.map((e) => e.toLowerCase()).includes(callerEmail)) {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { memberId } = request.data || {};
    if (!memberId) {
      throw new HttpsError("invalid-argument", "memberId is required");
    }

    // Look up the ll-users doc
    const userRef = db.doc(`${LL_PREFIX}users/${memberId}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "Member not found");
    }

    const userData = userSnap.data();
    const phone = userData.phone;
    if (!phone) {
      throw new HttpsError("failed-precondition", "Member has no phone number");
    }

    // Create or find Firebase Auth user by phone
    let authUser;
    try {
      authUser = await admin.auth().getUserByPhoneNumber(phone);
      logger.info("Found existing auth user", { uid: authUser.uid, phone });
    } catch {
      // Create new auth user
      authUser = await admin.auth().createUser({
        phoneNumber: phone,
        displayName: [userData.firstName, userData.lastName].filter(Boolean).join(" ") || undefined,
      });
      logger.info("Created new auth user", { uid: authUser.uid, phone });
    }

    // Store the auth UID link on the ll-users doc
    await userRef.update({
      firebaseAuthUid: authUser.uid,
      appUnlocked: true,
      appUnlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Also update the cohort member doc so AdminScreen can show unlock status
    if (userData.cohortId) {
      try {
        await db.doc(`${LL_PREFIX}cohorts/${userData.cohortId}/members/${memberId}`).update({
          appUnlocked: true,
        });
      } catch {
        // Member doc may not have this path — non-critical
      }
    }

    // Generate unlock code (128-bit, URL-safe)
    const code = require("crypto").randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.doc(`${LL_PREFIX}unlock-codes/${code}`).set({
      memberId,
      authUid: authUser.uid,
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      used: false,
    });

    // Send magic link via SMS
    const link = `${labHostingDomain()}?unlock=${code}`;
    const name = userData.firstName || "Hey";
    try {
      await sendLabSms(
        phone,
        `${name} — your Leadership Lab app is ready. See your leadership profile, run simulations, and go deeper. Tap to sign in (no password needed):\n\n${link}`
      );
      logger.info("Unlock link sent", { memberId, phone });
    } catch (smsErr) {
      logger.warn("Failed to send unlock SMS", { phone, error: smsErr.message });
      // Still return success — code is created, admin can share link manually
    }

    return {
      success: true,
      link,
      expiresAt: expiresAt.toISOString(),
    };
  }
);

/**
 * labRedeemUnlock — Exchange an unlock code for a Firebase custom token.
 * Public HTTPS endpoint (no auth required — the code IS the credential).
 * One-time use, expires after 7 days.
 */
exports.labRedeemUnlock = onRequest(
  {
    region: "us-central1",
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    // CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { code } = req.body || {};
    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Missing unlock code" });
      return;
    }

    // Sanitize — only hex chars allowed
    if (!/^[a-f0-9]{40}$/.test(code)) {
      res.status(400).json({ error: "Invalid code format" });
      return;
    }

    const db = admin.firestore();
    const codeRef = db.doc(`${LL_PREFIX}unlock-codes/${code}`);
    const codeSnap = await codeRef.get();

    if (!codeSnap.exists) {
      res.status(404).json({ error: "Invalid or expired unlock code" });
      return;
    }

    const codeData = codeSnap.data();

    if (codeData.used) {
      res.status(410).json({ error: "This link has already been used. Open the app and sign in normally." });
      return;
    }

    // Expiration check — always enforce (expiresAt is required)
    if (!codeData.expiresAt || codeData.expiresAt.toDate() < new Date()) {
      res.status(410).json({ error: "This link has expired. Ask your facilitator for a new one." });
      return;
    }

    // Mark as used
    await codeRef.update({ used: true, usedAt: admin.firestore.FieldValue.serverTimestamp() });

    // Generate custom token for the auth user
    try {
      const customToken = await admin.auth().createCustomToken(codeData.authUid);

      logger.info("Unlock code redeemed", { memberId: codeData.memberId, authUid: codeData.authUid });

      res.status(200).json({
        success: true,
        token: customToken,
        memberId: codeData.memberId,
      });
    } catch (err) {
      logger.error("Failed to create custom token", { error: err.message });
      res.status(500).json({ error: "Failed to sign in. Please try again." });
    }
  }
);
