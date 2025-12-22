import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const initNotifications = async (userId: string) => {
    try {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return null;
        }

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted');
            // TODO: FCM設定後にトークンを取得してFirestoreに保存する処理を追加予定
            // const messaging = getMessaging(app);
            // const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
            // await updateDoc(doc(db, 'profiles', userId), { fcmToken: token });
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error initializing notifications:', error);
        return null;
    }
};
