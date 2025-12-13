import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Thread, UserProfile, Message } from '@/lib/types';

export interface ThreadWithProfile extends Thread {
    otherUserProfile: UserProfile | null;
    unreadCount: number;
}

export const useMessages = (userId: string | undefined) => {
    const [threads, setThreads] = useState<ThreadWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const profileCache = useRef<Record<string, UserProfile>>({});

    useEffect(() => {
        console.log('useMessages called with userId:', userId);

        if (!userId) {
            console.log('No userId, skipping...');
            setLoading(false);
            return;
        }

        console.log('Setting up threads listener...');
        const threadsRef = collection(db, 'threads');
        const q = query(
            threadsRef,
            where('participantUserIds', 'array-contains', userId)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            console.log('Threads snapshot received:', snapshot.size, 'docs');
            const tempThreads: Thread[] = [];
            const userIdsToFetch = new Set<string>();

            // 1. Collect threads and identify missing profiles
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Thread;
                data.threadId = doc.id;
                tempThreads.push(data);

                const otherId = data.participantUserIds.find(id => id !== userId);
                if (otherId && !profileCache.current[otherId]) {
                    userIdsToFetch.add(otherId);
                }
            });

            // 2. Batch fetch missing profiles
            if (userIdsToFetch.size > 0) {
                const ids = Array.from(userIdsToFetch);
                // Firestore 'in' query limit is 30. Chunk if needed.
                const chunkSize = 10;
                for (let i = 0; i < ids.length; i += chunkSize) {
                    const chunk = ids.slice(i, i + chunkSize);
                    try {
                        const profilesQuery = query(
                            collection(db, 'profiles'),
                            where(documentId(), 'in', chunk)
                        );
                        const profilesSnap = await getDocs(profilesQuery);
                        profilesSnap.forEach(pDoc => {
                            profileCache.current[pDoc.id] = pDoc.data() as UserProfile;
                        });
                    } catch (e) {
                        console.error("Error fetching profiles batch:", e);
                    }
                }
            }

            // 3. Build final result (Fetch unread counts in parallel)
            const threadsData: ThreadWithProfile[] = await Promise.all(tempThreads.map(async (thread) => {
                const otherUserId = thread.participantUserIds.find(id => id !== userId);
                const otherUserProfile = otherUserId ? (profileCache.current[otherUserId] || null) : null;

                // Optimize unread count: Query only unread messages from other user
                let unreadCount = 0;
                if (otherUserId) {
                    try {
                        // Use nested subcollection path: 'threads/{threadId}/messages'
                        const messagesRef = collection(db, 'threads', thread.threadId, 'messages');
                        const messagesQuery = query(
                            messagesRef,
                            where('senderUserId', '==', otherUserId),
                            where('isRead', '==', false)
                        );
                        // Using getCountFromServer would be better if available in this SDK version and needed,
                        // but getDocs is fine if count is low. 
                        const messagesSnapshot = await getDocs(messagesQuery);
                        unreadCount = messagesSnapshot.size;
                    } catch (error) {
                        // Suppress permission errors and default to 0
                        console.error('Error fetching unread count:', error);
                        unreadCount = 0;
                    }
                }

                return {
                    ...thread,
                    otherUserProfile,
                    unreadCount,
                };
            }));

            // 4. Sort
            threadsData.sort((a, b) => {
                const timeA = a.lastMessageAt?.toMillis() || 0;
                const timeB = b.lastMessageAt?.toMillis() || 0;
                return timeB - timeA;
            });

            setThreads(threadsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching threads:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { threads, loading };
};
