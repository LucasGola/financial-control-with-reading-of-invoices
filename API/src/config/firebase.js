const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

// Validate required environment variables
if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
  console.error('Missing required Firebase configuration. Please check your .env file.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = { admin, db };