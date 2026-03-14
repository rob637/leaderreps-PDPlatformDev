const fs = require('fs');
let code = fs.readFileSync('functions/index.js', 'utf8');

const oldStr = `exports.onCoachingRegistration = require("firebase-functions/v2/firestore").onDocumentCreated("coaching_registrations/{registrationId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.error("No data associated with the event");
    return;
  }

  const registration = snapshot.data();
  logger.info("New coaching registration:", { id: event.params.registrationId, sessionId: registration.sessionId });

  // Skip if this is a cancelled or no-show status (edge case)
  if (registration.status === 'CANCELLED' || registration.status === 'NO_SHOW') {
    return;
  }`;

const newStr = `exports.onCoachingRegistration = require("firebase-functions/v2/firestore").onDocumentWritten("coaching_registrations/{registrationId}", async (event) => {
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
  const isNowRegistered = registration.status !== 'CANCELLED' && registration.status !== 'NO_SHOW';
  const wasRegistered = beforeRegistration ? (beforeRegistration.status !== 'CANCELLED' && beforeRegistration.status !== 'NO_SHOW') : false;

  if (!isNowRegistered || wasRegistered) {
    return; // Not a new registration event (either cancelling, or already registered and just updating other fields)
  }

  logger.info("New coaching registration (or switch):", { id: event.params.registrationId, sessionId: registration.sessionId });`;

if (code.includes(oldStr)) {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('functions/index.js', code);
  console.log('Successfully updated functions/index.js');
} else {
  console.error('Could not find old string.');
}
