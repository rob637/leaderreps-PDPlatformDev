/**
 * Firebase Cloud Functions for LeaderReps PD Platform
 * 
 * Includes:
 * - scheduledDailyRollover: Runs at 11:59 PM to archive daily data and reset for the new day
 * - manualRollover: HTTP endpoint to manually trigger rollover for a specific user (catch-up)
 * - geminiProxy: Secure proxy for Gemini AI API calls
 * - scheduledNotificationCheck: Checks for scheduled notifications every 15 minutes
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
  const appDomain = projectId === 'leaderreps-test' 
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
  let emailTemplate = {
    subject: "You're invited to LeaderReps PD Platform",
    headline: "Welcome to LeaderReps!",
    bodyText: "You have been invited to join the LeaderReps Professional Development Platform.",
    buttonText: "Accept Invitation",
    expiryText: "This invitation will expire in 7 days.",
    footerText: "If you did not expect this invitation, please ignore this email."
  };
  
  try {
    const templateDoc = await admin.firestore().collection('metadata').doc('email_templates').get();
    if (templateDoc.exists) {
      const templates = templateDoc.data();
      if (templates.invite) {
        emailTemplate = { ...emailTemplate, ...templates.invite };
      }
    }
  } catch (err) {
    logger.warn("Could not fetch email template, using defaults:", err.message);
  }

  // Use customMessage from invitation if provided, otherwise use template bodyText
  const bodyText = invitation.customMessage && invitation.customMessage.trim() 
    ? invitation.customMessage 
    : emailTemplate.bodyText;
  
  // Variable substitution - replace {{variables}} in text
  const firstName = invitation.firstName || '';
  const lastName = invitation.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'there';
  
  const substituteVars = (text) => {
    return (text || '')
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{lastName\}\}/g, lastName)
      .replace(/\{\{fullName\}\}/g, fullName)
      .replace(/\{\{email\}\}/g, email)
      .replace(/\{\{inviteLink\}\}/g, inviteLink);
  };

  const emailFromName = process.env.EMAIL_FROM_NAME || 'LeaderReps Platform';
  const emailReplyTo = process.env.EMAIL_REPLY_TO || emailUser;

  const mailOptions = {
    from: `"${emailFromName}" <${emailUser}>`,
    replyTo: emailReplyTo,
    to: recipientEmail,
    subject: `${subjectPrefix}${substituteVars(emailTemplate.subject)}`,
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'LeaderReps Platform',
      'Precedence': 'bulk',
    },
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${invitation.isTest ? `
          <div style="background-color: #fff7ed; border: 1px solid #fdba74; padding: 10px; margin-bottom: 20px; border-radius: 6px; color: #9a3412;">
            <strong>🧪 TEST MODE</strong><br/>
            This invitation was created for: <strong>${email}</strong><br/>
            But sent to you for testing purposes.
          </div>
        ` : ''}
        <h2 style="color: #0f172a;">${substituteVars(emailTemplate.headline)}</h2>
        <p>${substituteVars(bodyText)}</p>
        <p>Click the button below to accept your invitation and set up your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">${substituteVars(emailTemplate.buttonText)}</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>${substituteVars(emailTemplate.expiryText)}</p>
        <hr style="border: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px;">${substituteVars(emailTemplate.footerText)}</p>
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
  { cors: true, region: "us-central1" },
  async (request) => {
    const { repType, person, responses, structured } = request.data;
    
    if ((!responses && !structured) || !repType) {
      throw new HttpsError('invalid-argument', 'repType and (responses or structured) are required');
    }
    
    // Support both old "responses" format and new "structured" format
    // Structured format has: what_said, commitment, reflection, context_moment, their_response, etc.
    const data = structured || responses || {};
    
    const whatSaid = data.what_said || data.what_happened || '';
    const commitment = data.commitment || data.outcome || '';
    const reflection = data.reflection || data.next_time || data.learning || '';
    const theirResponse = Array.isArray(data.their_response) ? data.their_response.join(', ') : (data.their_response || '');
    const contextMoment = data.context_moment || data.when_happened || '';
    
    logger.info("assessRepQuality input", { repType, person, whatSaid: whatSaid.substring(0, 100), commitment: commitment.substring(0, 100), reflection: reflection.substring(0, 100) });
    
    // Get the API key from environment variable (functions/.env)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not configured. Set it in functions/.env");
      throw new HttpsError('internal', 'AI service not configured');
    }
    
    // Rep type descriptions for context
    const repTypeDescriptions = {
      'reinforce_public': 'Reinforcing behavior in public - recognizing someone\'s positive contribution in front of others. NOTE: This rep type is about GIVING praise/recognition, not asking for something.',
      'public_praise': 'Reinforcing behavior in public - recognizing someone\'s positive contribution in front of others. NOTE: This rep type is about GIVING praise/recognition, not asking for something.',
      'direct_feedback': 'Providing honest, direct feedback to help someone improve',
      'difficult_conversation': 'Having a challenging but necessary conversation with someone',
      'delegation': 'Delegating responsibility with clear expectations and accountability',
      'boundary_setting': 'Setting or maintaining a professional boundary',
      'vision_casting': 'Articulating vision, direction, or inspiring others',
      'coaching': 'Coaching or mentoring someone to develop their skills',
      'recognition': 'Recognizing or appreciating someone\'s contribution. NOTE: This rep type is about GIVING praise/recognition, not asking for something.',
      'tough_request': 'Making a tough or uncomfortable ask of someone',
      'redirect_private': 'Redirecting behavior privately - giving constructive feedback one-on-one'
    };
    
    const repDescription = repTypeDescriptions[repType] || repType;
    
    const prompt = `You are evaluating a leadership practice exercise ("rep") for quality and constructiveness.

CONTEXT:
- Rep Type: ${repDescription}
- Person involved: ${person || 'Not specified'}
- Context/When: ${contextMoment || 'Not specified'}

USER'S EVIDENCE:
1. What they said/did: "${whatSaid}"
2. Their response: "${theirResponse}"
3. Commitment/Outcome: "${commitment}"
4. Reflection: "${reflection}"

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
Evaluate this leadership rep on 4 dimensions. For each dimension, determine if it PASSES or FAILS:

1. SPECIFIC_LANGUAGE: Did they use specific, MEANINGFUL language showing what they actually said IN A PROFESSIONAL CONTEXT?
   - PASS: Contains actual words/phrases that form coherent sentences showing real WORKPLACE communication
   - FAIL: Gibberish, random characters, non-professional content, or empty

2. CLEAR_REQUEST: Did they have a clear PROFESSIONAL purpose or make a WORK-RELATED request?
   - For reinforce_public/recognition/public_praise: A clear, PROFESSIONAL statement of praise for work/contribution counts as a PASS
   - For other rep types: A clear work-related ask, request, or expectation being set
   - FAIL: No clear purpose, gibberish, non-professional content, OR inappropriate content
   
3. NAMED_COMMITMENT: Did they obtain or note a MEANINGFUL PROFESSIONAL outcome/commitment?
   - PASS: Named what the other person agreed to DO AT WORK, their professional response
   - For recognition reps: Noting the person's genuine response to workplace recognition counts as a PASS
   - FAIL: Missing, gibberish, non-professional commitments (e.g., "marry me"), or placeholder text

4. REFLECTION: Did they reflect MEANINGFULLY on the LEADERSHIP experience?
   - PASS: Genuine insight about the leadership interaction, what they learned about leading others
   - FAIL: Empty, gibberish, unrelated reflections, or generic platitudes without substance

SPECIAL RULES FOR REP TYPES:
- For reinforce_public, public_praise, recognition: These are about GIVING appreciation FOR PROFESSIONAL CONTRIBUTIONS. Don't fail "clear_request" just because there's no ask - the praise itself IS the purpose.
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

COACHING GUIDANCE (CRITICAL - FOLLOW EXACTLY):
You are a COACH, not a teacher. When a dimension FAILS, use QUESTIONS to prompt reflection, NOT prescriptive examples or scripts.

NEVER say "Try something like..." or give them words to copy.
ALWAYS ask questions that help them discover the answer themselves.

For each failed dimension, provide a "coachingQuestion" - a reflective question that helps them think deeper.

Examples of GOOD coaching questions:
- "Close your eyes and replay the moment. What exact words came out of your mouth?"
- "If you were watching a video of this conversation, what would you hear yourself saying?"
- "What did you actually need from them? How might you express that clearly?"
- "What commitment would make you confident they'll follow through?"
- "What surprised you about how this went? What would you do differently?"

Examples of BAD (prescriptive) responses - DO NOT USE:
- "Try something like: 'Bill, I wanted to recognize you...'" ← Never give scripts
- "You should say: 'I need you to...'" ← Never prescribe words
- "A good example would be..." ← Never give examples

Respond ONLY with valid JSON in this exact format:
{
  "dimensions": {
    "specific_language": {
      "passed": boolean,
      "feedback": "brief explanation of what was good or what's missing",
      "quote": "the specific language they used if any, or null",
      "coachingQuestion": "if FAILED, a reflective question to help them discover what they said"
    },
    "clear_request": {
      "passed": boolean,
      "feedback": "brief explanation of what was good or what's missing",
      "coachingQuestion": "if FAILED, a question to help them clarify their purpose/ask"
    },
    "named_commitment": {
      "passed": boolean,
      "feedback": "brief explanation of what was good or what's missing",
      "coachingQuestion": "if FAILED, a question about what commitment they sought"
    },
    "reflection": {
      "passed": boolean,
      "feedback": "brief explanation of what was good or what's missing",
      "coachingQuestion": "if FAILED, a question to prompt deeper reflection"
    }
  },
  "isConstructive": boolean,
  "constructiveFeedback": "if not constructive, explain why - be direct about the specific issue",
  "summary": "2-sentence overall assessment",
  "coachingTip": "one reflective question to consider before their next rep"
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
      
      // Calculate passed count
      const dimensions = assessment.dimensions || {};
      let passedCount = 0;
      const totalDimensions = 4;
      
      if (dimensions.specific_language?.passed) passedCount++;
      if (dimensions.clear_request?.passed) passedCount++;
      if (dimensions.named_commitment?.passed) passedCount++;
      if (dimensions.reflection?.passed) passedCount++;
      
      // Overall assessment - must be constructive AND pass 3/4 dimensions
      const isConstructive = assessment.isConstructive !== false;
      const meetsStandard = isConstructive && passedCount >= 3;
      
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

  // Send SMS (not implemented yet)
  if (phone && (!type || type === 'sms' || type === 'both')) {
    try {
      await sendSmsNotification(phone, testMessage);
      results.sms = { success: false, error: "SMS not implemented" };
    } catch (e) {
      results.sms = { success: false, error: e.message };
    }
  }

  return { success: true, results };
}

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
                // Check if Morning Bookend (Win the Day) is completed
                shouldSend = !practiceData.morningBookend?.winCompleted;
                break;
              case 'pm_bookend_incomplete':
                // Check if Evening Bookend (Reflection) is completed
                shouldSend = !practiceData.eveningBookend?.completedAt;
                break;
              case 'daily_action_incomplete':
                // Check if Daily Rep is completed
                shouldSend = practiceData.dailyTargetRepStatus !== 'Completed'; 
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
      let sendSms = false;
      
      // Get escalation data for smart escalation
      const escalation = settings.escalation || { missedDays: 0 };
      const missedDays = escalation.missedDays || 0;
      
      switch (strategy) {
        case 'smart_escalation':
          // Level 0 (Day 1): Push only
          // Level 1 (Day 2): Push + Email
          // Level 2 (Day 3+): Push + Email + SMS
          sendPush = settings.channels?.push !== false;
          sendEmail = missedDays >= 1 && settings.channels?.email !== false;
          sendSms = missedDays >= 2 && settings.channels?.sms !== false && settings.phoneNumber;
          logger.info(`Smart escalation for ${user.email}: missedDays=${missedDays}, push=${sendPush}, email=${sendEmail}, sms=${sendSms}`);
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
          sendSms = settings.channels?.sms !== false && settings.phoneNumber;
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

      // SMS via Twilio - Skip for test users (don't send test SMS)
      // SMS includes a shortened link at the end
      if (sendSms && settings.phoneNumber && !isTestUser) {
        await sendSmsNotification(settings.phoneNumber, rule.message, linkOptions);
      } else if (sendSms && isTestUser) {
        logger.info(`🧪 SMS skipped for test user ${user.email}`);
      }
      
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
// Options can include: { linkText, linkUrl } to append a link to the message
async function sendSmsNotification(phoneNumber, message, options = {}) {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioSid || !twilioAuth || !twilioFrom) {
    logger.warn("Twilio credentials not configured. SMS not sent.");
    return;
  }

  // Dynamically determine the app URL based on the Firebase project
  const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG).projectId;
  const appDomain = projectId === 'leaderreps-test' 
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
  const appDomain = projectId === 'leaderreps-test' 
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
exports.apolloSearchProxy = onCall({ cors: true, region: "us-central1" }, async (request) => {
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
exports.instantlyProxy = onCall({ cors: true, region: "us-central1" }, async (request) => {
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
exports.linkedHelperProxy = onCall({ cors: true, region: "us-central1" }, async (request) => {
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
exports.linkedHelperQueueAdd = onCall({ cors: true, region: "us-central1" }, async (request) => {
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
exports.sendOutreachEmail = onCall({ cors: true, region: "us-central1" }, async (request) => {
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
        cors: true,
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
  region: "us-central1"
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

  const { fileIds = [], folderIds = [], getServiceAccountEmail = false } = request.data;

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

      // 6. Create Firestore record
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
      results.push({ fileId, name, success: true, assetId: docRef.id });
      logger.info('Drive import success', { fileId, name, assetId: docRef.id });

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
  secrets: ["GMAIL_CLIENT_ID"]
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.');
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  if (!clientId) {
    throw new HttpsError('failed-precondition', 'Gmail OAuth not configured.');
  }

  const userId = request.auth.uid;
  
  // Dynamic redirect URI based on project
  const projectId = process.env.GCLOUD_PROJECT || 'leaderreps-test';
  const redirectUri = `https://us-central1-${projectId}.cloudfunctions.net/gmailOAuthCallback`;
  
  // Encode state with userId so we know who to save tokens for
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
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
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    
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
    return res.redirect(`${getAppUrl()}/settings?gmail_error=${encodeURIComponent(error)}`);
  }
  
  if (!code || !state) {
    return res.redirect(`${getAppUrl()}/settings?gmail_error=missing_params`);
  }
  
  // Decode state (contains userId)
  let userId;
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    userId = stateData.userId;
  } catch (e) {
    logger.error('Invalid OAuth state', { state });
    return res.redirect(`${getAppUrl()}/settings?gmail_error=invalid_state`);
  }
  
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  
  // Dynamic redirect URI based on project
  const projectId = process.env.GCLOUD_PROJECT || 'leaderreps-test';
  const redirectUri = `https://us-central1-${projectId}.cloudfunctions.net/gmailOAuthCallback`;
  
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
    return res.redirect(`${getAppUrl()}/settings?gmail_error=not_configured`);
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
      return res.redirect(`${getAppUrl()}/settings?gmail_error=token_exchange_failed`);
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
    
    logger.info('Gmail OAuth completed (team account)', { userId, email: connectedEmail });
    
    // Redirect back to app with the connected email
    return res.redirect(`${getAppUrl()}/settings?gmail_connected=${encodeURIComponent(connectedEmail)}`);
    
  } catch (error) {
    logger.error('Gmail OAuth callback error', error);
    return res.redirect(`${getAppUrl()}/settings?gmail_error=callback_failed`);
  }
});

// Helper to get the app URL based on environment
function getAppUrl() {
  // LR-HubSpot / Team Sales app URL
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
  
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  
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
  region: "us-central1" 
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
