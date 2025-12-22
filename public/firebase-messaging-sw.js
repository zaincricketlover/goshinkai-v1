importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// These will be replaced by actual config in production or environment variables
firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "goshinkai-3c77a.firebaseapp.com",
    projectId: "goshinkai-3c77a",
    storageBucket: "goshinkai-3c77a.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Background message received:', payload);

    const notificationTitle = payload.notification?.title || '伍心会通知';
    const notificationOptions = {
        body: payload.notification?.body || '新しい通知があります',
        icon: '/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
