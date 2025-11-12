// set-membership-tier.js
// Script to set membership tier for a specific user
// Usage: node set-membership-tier.js <email> <tier>

import admin from 'firebase-admin';

// Initialize Firebase Admin with explicit project ID
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: 'leaderreps-pd-platform'
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function setMembershipTier(email, tier) {
  try {
    console.log(`Setting membership tier for ${email} to ${tier}...`);
    
    // First, find the user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error(`User with email ${email} not found`);
      return false;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    
    console.log(`Found user: ${userId}`);
    
    // Update membership data
    const membershipPath = `users/${userId}/membership/current`;
    const membershipData = {
      currentTier: tier,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'admin-script'
    };
    
    await db.doc(membershipPath).set(membershipData, { merge: true });
    
    console.log(`Successfully set membership tier to ${tier} for ${email}`);
    
    // Read back the data to confirm
    const updatedDoc = await db.doc(membershipPath).get();
    const updatedData = updatedDoc.data();
    console.log('Updated membership data:', updatedData);
    
    return true;
  } catch (error) {
    console.error('Error setting membership tier:', error);
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log('Usage: node set-membership-tier.js <email> <tier>');
  console.log('Example: node set-membership-tier.js rob@sagecg.com professional');
  process.exit(1);
}

const [email, tier] = args;

// Validate tier
const validTiers = ['basic', 'professional', 'elite'];
if (!validTiers.includes(tier)) {
  console.error(`Invalid tier: ${tier}. Must be one of: ${validTiers.join(', ')}`);
  process.exit(1);
}

// Run the script
setMembershipTier(email, tier).then(success => {
  process.exit(success ? 0 : 1);
});