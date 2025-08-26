import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (e: any) {
    console.error('Failed to initialize Firebase Admin SDK:', e.message);
  }
}

const db = admin.firestore();
const fcm = admin.messaging();

// This is a webhook that should be triggered by an external service like cron-job.org
export async function GET() {
  if (admin.apps.length === 0) {
      return NextResponse.json({ ok: false, error: "Firebase Admin not initialized." }, { status: 500 });
  }

  try {
    const today = new Date();
    const limit = new Date();
    limit.setDate(today.getDate() + 3); // Alert 3 days before expiry

    const snapshot = await db.collection("products")
      .where("expiryDate", "<=", limit)
      .get();
      
    if (snapshot.empty) {
      return NextResponse.json({ ok: true, message: "No products nearing expiry." });
    }

    const userTokensSnapshot = await db.collection("userTokens").get();
    if (userTokensSnapshot.empty) {
      return NextResponse.json({ ok: true, message: "No users subscribed for notifications." });
    }
    const tokens = userTokensSnapshot.docs.map(doc => doc.data().token);
    
    // Filter out invalid or empty tokens
    const validTokens = tokens.filter(token => typeof token === 'string' && token.length > 0);

    if (validTokens.length === 0) {
        return NextResponse.json({ ok: true, message: "No valid notification tokens found." });
    }

    const productsNearingExpiry = snapshot.docs.map(doc => doc.data());
    
    // Create a single notification with a summary
    const notificationBody = productsNearingExpiry
      .map(p => `${p.name} (vence em ${new Date(p.expiryDate.seconds * 1000).toLocaleDateString('pt-BR')})`)
      .join(', ');

    await fcm.sendEachForMulticast({
      notification: {
        title: "⚠️ Alerta de Validade!",
        body: `Produtos perto de vencer: ${notificationBody}`
      },
      tokens: validTokens,
    });
    
    console.log(`Sent expiry notifications for ${productsNearingExpiry.length} products to ${validTokens.length} users.`);
    return NextResponse.json({ ok: true, message: "Expiry notifications sent." });

  } catch (err: any) {
    console.error('Error in check-expiring cron job:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
