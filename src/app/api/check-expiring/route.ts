
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import type { UserProfile } from '@/services/userService';

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

  console.log("Cron job started: checking for expiring products.");

  try {
    const userTokensSnapshot = await db.collection("userTokens").get();
    if (userTokensSnapshot.empty) {
      console.log("No users subscribed for notifications.");
      return NextResponse.json({ ok: true, message: "No users subscribed for notifications." });
    }

    let notificationsSentCount = 0;
    const today = new Date();

    // Iterate over each user with a notification token
    for (const tokenDoc of userTokensSnapshot.docs) {
      const userId = tokenDoc.id;
      const { token } = tokenDoc.data();

      if (!token || typeof token !== 'string') continue;

      // Get user-specific notification preferences
      const userProfileDoc = await db.collection("users").doc(userId).get();
      if (!userProfileDoc.exists) continue;

      const userProfile = userProfileDoc.data() as UserProfile;
      const expiryPrefs = userProfile.preferences?.notifications?.expiry;

      // Check if user has enabled expiry notifications
      if (!expiryPrefs || !expiryPrefs.enabled) continue;

      const thresholdDays = expiryPrefs.thresholdDays || 7;
      const limitDate = new Date();
      limitDate.setDate(today.getDate() + thresholdDays);

      // Query for products for this specific user that are nearing expiry based on their preference
      const productsQuery = db.collection("products")
        .where("userId", "==", userId)
        .where("expiryDate", ">=", today)
        .where("expiryDate", "<=", limitDate);
        
      const productsSnapshot = await productsQuery.get();
        
      if (productsSnapshot.empty) {
        continue; // No expiring products for this user
      }

      const expiringProducts = productsSnapshot.docs.map(doc => doc.data());
      
      // Create a single notification with a summary for the user
      const notificationBody = `Você tem ${expiringProducts.length} produto(s) vencendo nos próximos ${thresholdDays} dias.`;

      await fcm.send({
        notification: {
          title: "⚠️ Alerta de Validade!",
          body: notificationBody,
        },
        token: token,
      });

      notificationsSentCount++;
      console.log(`Sent expiry notification for ${expiringProducts.length} products to user ${userId}.`);
    }
    
    const message = `Cron job finished. Sent notifications to ${notificationsSentCount} users.`;
    console.log(message);
    return NextResponse.json({ ok: true, message });

  } catch (err: any) {
    console.error('Error in check-expiring cron job:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
