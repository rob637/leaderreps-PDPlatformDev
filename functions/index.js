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
  // Set config: firebase functions:config:set email.user="your-email@gmail.com" email.pass="your-app-password"
  const emailUser = process.env.EMAIL_USER || (require("firebase-functions").config().email?.user);
  const emailPass = process.env.EMAIL_PASS || (require("firebase-functions").config().email?.pass);

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
 * Set the API key using: firebase functions:config:set gemini.apikey="YOUR_API_KEY"
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

      // Get the API key from environment variable or functions config
      const apiKey = process.env.GEMINI_API_KEY || 
                    (require("firebase-functions").config().gemini?.apikey);
      
      if (!apiKey) {
        logger.error("GEMINI_API_KEY is not configured. Set with: firebase functions:config:set gemini.apikey=\"YOUR_KEY\"");
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
    
    // Get the API key
    const apiKey = process.env.GEMINI_API_KEY || 
                  (require("firebase-functions").config().gemini?.apikey);
    
    if (!apiKey) {
      logger.error("GEMINI_API_KEY is not configured for assessRepQuality");
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
  const emailUser = process.env.EMAIL_USER || (require("firebase-functions").config().email?.user);
  const emailPass = process.env.EMAIL_PASS || (require("firebase-functions").config().email?.pass);

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
        id: entityId // if entityId is passed, use it.
      };
      
      // Merge extra search params if needed, though 'id' is usually enough
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
        const emailUser = process.env.EMAIL_USER || (require("firebase-functions").config().email?.user);
        const emailPass = process.env.EMAIL_PASS || (require("firebase-functions").config().email?.pass);

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
