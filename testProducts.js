import 'dotenv/config';
import admin from 'firebase-admin';

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function test() {
    const s = await db.collection('products').get();
    console.log('Total length:', s.docs.length);
    console.log('First doc:', s.docs[0]?.data());
}

test();
