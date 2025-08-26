
"use client";

import { db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app } from "@/lib/firebase";

// This is a placeholder for your VAPID key. 
// You need to generate this in your Firebase project settings -> Cloud Messaging.
const VAPID_KEY = "BL-5_i_43qY4xGzVslXBvHw3eYwK-476gEaM9yQ3c0Tz23bI2u_YwzG5L9u8CqM8q9R6aH4J-fXyR8Z7J9K8W7s"; 

// This function handles subscribing the user to push notifications
export const subscribeToNotifications = async (userId: string): Promise<string | null> => {
    const supported = await isSupported();
    if (!supported) {
        console.log("Firebase Messaging is not supported in this browser.");
        return null;
    }
    
    const messaging = getMessaging(app);

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

            if (currentToken) {
                // Save the token to a separate collection for the backend to query
                const tokenRef = doc(db, 'userTokens', userId);
                await setDoc(tokenRef, { token: currentToken });

                console.log('FCM Token saved for user:', userId, currentToken);
                return currentToken;
            } else {
                console.log('No registration token available. Request permission to generate one.');
                return null;
            }
        } else {
            console.log('Unable to get permission to notify.');
            return null;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
        return null;
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
