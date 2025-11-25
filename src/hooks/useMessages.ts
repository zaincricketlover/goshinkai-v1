import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Thread, UserProfile, Message } from '@/lib/types';

export interface ThreadWithProfile extends Thread {
    otherUserProfile: UserProfile | null;
    unreadCount: number;
}

export const useMessages = (userId: string | undefined) => {
    const [threads, setThreads] = useState<ThreadWithProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const threadsRef = collection(db, 'threads');
        // インデックスエラー回避のため orderBy を一時的に削除し、クライアント側でソートする
        const q = query(
            threadsRef,
            where('participantUserIds', 'array-contains', userId)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const threadsData: ThreadWithProfile[] = [];

            for (const docSnapshot of snapshot.docs) {
                const threadData = docSnapshot.data() as Thread;
                threadData.threadId = docSnapshot.id;

                // 相手のプロフィールを取得
                const otherUserId = threadData.participantUserIds.find(id => id !== userId);
                let otherUserProfile: UserProfile | null = null;
                if (otherUserId) {
                    try {
                        const profileRef = doc(db, 'profiles', otherUserId);
                        const profileSnap = await getDoc(profileRef);
                        if (profileSnap.exists()) {
                            otherUserProfile = profileSnap.data() as UserProfile;
                        }
                    } catch (error) {
                        console.error('Error fetching profile:', error);
                    }
                }

                // 未読数を取得
                let unreadCount = 0;
                try {
                    const messagesRef = collection(db, 'messages');
                    // インデックスエラー回避のため、threadIdのみでクエリし、他はクライアント側でフィルタリング
                    const messagesQuery = query(
                        messagesRef,
                        where('threadId', '==', threadData.threadId)
                    );
                    const messagesSnapshot = await getDocs(messagesQuery);

                    unreadCount = messagesSnapshot.docs.filter(doc => {
                        const msg = doc.data() as Message;
                        return msg.senderUserId !== userId && !msg.isRead;
                    }).length;
                } catch (error) {
                    console.error('Error fetching unread count:', error);
                }

                threadsData.push({
                    ...threadData,
                    otherUserProfile,
                    unreadCount,
                });
            }

            // クライアント側でソート
            threadsData.sort((a, b) => {
                const timeA = a.lastMessageAt?.toMillis() || 0;
                const timeB = b.lastMessageAt?.toMillis() || 0;
                return timeB - timeA;
            });

            setThreads(threadsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { threads, loading };
};
