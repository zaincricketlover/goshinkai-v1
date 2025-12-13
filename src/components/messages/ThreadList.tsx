import React from 'react';
import { Thread, UserProfile } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

interface ThreadWithProfile extends Thread {
    otherUserProfile: UserProfile | null;
    unreadCount: number;
}

interface ThreadListProps {
    threads: ThreadWithProfile[];
}

export const ThreadList: React.FC<ThreadListProps> = ({ threads }) => {
    const router = useRouter();

    console.log('ThreadList received threads:', threads);
    console.log('ThreadList threads count:', threads?.length);

    const formatTime = (timestamp?: Timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' }).format(date);
        }
        return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(date);
    };

    if (threads.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                メッセージはまだありません
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {threads.map((thread) => (
                <Card
                    key={thread.threadId}
                    className="hover:bg-surface-elevated/80 transition-colors cursor-pointer border-white/5"
                >
                    <div
                        onClick={() => router.push(`/messages/${thread.threadId}`)}
                        className="flex items-center space-x-4"
                    >
                        <div className="relative">
                            <Avatar
                                src={thread.otherUserProfile?.avatarUrl}
                                alt={thread.otherUserProfile?.name || 'Unknown'}
                                size="md"
                                rank={thread.otherUserProfile?.rankBadge}
                            />
                            {thread.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-surface">
                                    {thread.unreadCount}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="text-sm font-bold text-white truncate">
                                    {thread.otherUserProfile?.name || 'Unknown User'}
                                </h3>
                                <span className="text-xs text-gray-500">
                                    {formatTime(thread.lastMessageAt)}
                                </span>
                            </div>
                            <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                                {thread.lastMessageText || '画像が送信されました'}
                            </p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};
