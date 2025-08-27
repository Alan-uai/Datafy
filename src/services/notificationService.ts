
"use client";

import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "@/lib/firebase";

// IMPORTANT: The VAPID key should be loaded from an environment variable.
// Make sure you have VAPID_KEY set in your .env file (e.g., VAPID_KEY='your_firebase_vapid_key').
// If this code runs client-side in Next.js, the variable name in .env might need to be NEXT_PUBLIC_VAPID_KEY
// to be exposed to the browser. If you encounter issues, try renaming your environment variable to NEXT_PUBLIC_VAPID_KEY.
const NEXT_PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;

// This function handles subscribing the user to push notifications
export const subscribeToNotifications = async (userId: string): Promise<string | null> => {
    const supported = await isSupported();
    if (!supported) {
        console.warn("Firebase Messaging is not supported in this browser.");
        throw new Error("As notificações não são suportadas neste navegador.");
    }

    if (!NEXT_PUBLIC_VAPID_KEY) {
        console.error("VAPID_KEY is not configured. Please set it in your .env file.");
        throw new Error("Chave VAPID não configurada. As notificações não funcionarão.");
    }

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        console.warn('Notification permission was not granted.');
        return null;
    }

    console.log('Notification permission granted. Attempting to get token...');
    // The getToken call will throw if it fails, which will be caught in the component
    const currentToken = await getToken(messaging, { vapidKey: NEXT_PUBLIC_VAPID_KEY });

    if (currentToken) {
        // Save the token to a separate collection for the backend to query
        const tokenRef = doc(db, 'userTokens', userId);
        await setDoc(tokenRef, { token: currentToken, subscribedAt: new Date() });

        console.log('FCM Token saved for user:', userId, currentToken);
        return currentToken;
    } else {
        // This case is unlikely if permission is granted, but good to handle.
        throw new Error('Não foi possível obter o token de notificação.');
    }
};


// This function handles unsubscribing the user
export const unsubscribeFromNotifications = async (userId: string, token: string): Promise<void> => {
     if (!token) return;
     const tokenRef = doc(db, 'userTokens', userId);
     try {
        // Remove the user's token document
        await deleteDoc(tokenRef);
        console.log('Token removed for user:', userId);
     } catch(error) {
         console.error("Error removing token: ", error);
     }
};


// ----- SIMULATED BACKEND LOGIC -----
// The following functions demonstrate how you would check for notifications.
// In a real application, this logic would live in a secure backend environment
// (like Firebase Cloud Functions) and run on a schedule (e.g., daily).
// THIS IS NOW HANDLED BY THE /api/check-expiring ROUTE

import { getProductsByUser } from "./productService";
import { getUserProfile } from "./userService";
import { differenceInDays, isPast, isToday } from "date-fns";

// SIMULATED: Check for expiring products
export const checkExpiryNotifications = async (userId: string) => {
    const profile = await getUserProfile(userId);
    if (!profile || !profile.preferences.notifications.expiry.enabled) return;

    const products = await getProductsByUser(userId);
    const threshold = profile.preferences.notifications.expiry.thresholdDays;

    const expiringProducts = products.filter(p => {
        const daysRemaining = differenceInDays(p.expiryDate, new Date());
        return daysRemaining >= 0 && daysRemaining <= threshold;
    });

    if (expiringProducts.length > 0) {
        const message = {
            title: "Produtos Próximos da Validade!",
            body: `Você tem ${expiringProducts.length} produto(s) vencendo nos próximos ${threshold} dias.`,
        };
        console.log("SIMULATING PUSH:", message);
        // In a real backend, you would use the stored pushToken to send this message via FCM.
        // sendPushNotification(profile.preferences.notifications.pushToken, message);
    }
};

// SIMULATED: Check for low stock items
export const checkLowStockNotifications = async (userId: string) => {
    const LOW_STOCK_THRESHOLD = 5; // This could also be a user preference
    const profile = await getUserProfile(userId);
    if (!profile || !profile.preferences.notifications.lowStock.enabled) return;

    const products = await getProductsByUser(userId);
    const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity < LOW_STOCK_THRESHOLD);

    if (lowStockProducts.length > 0) {
        const message = {
            title: "Estoque Baixo!",
            body: `Você tem ${lowStockProducts.length} produto(s) com estoque baixo.`,
        };
        console.log("SIMULATING PUSH:", message);
        // sendPushNotification(profile.preferences.notifications.pushToken, message);
    }
};

    
