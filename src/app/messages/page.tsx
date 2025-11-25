"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Thread, UserProfile } from '@/lib/types';

interface ThreadWithProfile extends Thread {
    otherUserProfile: UserProfile | null;
    unreadCount: number;
}

export default function MessagesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [threads, setThreads] = useState<ThreadWithProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const threadsRef = collection(db, 'threads');
        const q = query(
            threadsRef,
            where('participantUserIds', 'array-contains', user.uid)
            // orderBy('lastMessageAt', 'desc') // インデックスエラー回避のため削除
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const threadsData: ThreadWithProfile[] = [];

            for (const docSnapshot of snapshot.docs) {
                const threadData = docSnapshot.data() as Thread;
                threadData.threadId = docSnapshot.id;

                // 相手のプロフィールを取得
                const otherUserId = threadData.participantUserIds.find(id => id !== user.uid);
                let otherUserProfile: UserProfile | null = null;
                if (otherUserId) {
                    const profileRef = doc(db, 'profiles', otherUserId);
                    const profileSnap = await getDoc(profileRef);
                    if (profileSnap.exists()) {
                        otherUserProfile = profileSnap.data() as UserProfile;
                    }
                }

                // 未読数を取得
                // 注: 本来はサブコレクションのクエリが必要だが、ここでは簡易的に0とするか、
                // useMessagesフックと同様のロジックが必要。
                // 今回は一覧表示の高速化のため、未読数は useMessages フック側（Navbar）に任せ、
                // ここでは表示しないか、別途取得する。
                // いったん0としておく。
                const unreadCount = 0;

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
    }, [user]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

    if (!user) {
        router.push('/');
        return null;
    }

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-900">トーク</h1>
            </div>

            <div className="divide-y divide-gray-100">
                {threads.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        メッセージはまだありません
                    </div>
                ) : (
                    threads.map((thread) => (
                        <div
                            key={thread.threadId}
                            onClick={() => router.push(`/messages/${thread.threadId}`)}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100"
                        >
                            <div className="relative flex-shrink-0 mr-4">
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                    {thread.otherUserProfile?.name.charAt(0) || '?'}
                                </div>
                                {/* オンラインインジケーターなどをここに追加可能 */}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="text-base font-semibold text-gray-900 truncate mr-2">
                                        {thread.otherUserProfile?.name || '不明なユーザー'}
                                    </h3>
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                        {formatTime(thread.lastMessageAt)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-500 truncate pr-4">
                                        {thread.lastMessageText || '画像が送信されました'}
                                    </p>
                                    {thread.unreadCount > 0 && (
                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white min-w-[1.25rem]">
                                            {thread.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
