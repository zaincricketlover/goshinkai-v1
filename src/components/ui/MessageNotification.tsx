"use client";

import React from 'react';
import { ThreadWithProfile } from '@/hooks/useMessages';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

interface MessageNotificationProps {
    threads: ThreadWithProfile[];
    onClose: () => void;
}

export function MessageNotification({ threads, onClose }: MessageNotificationProps) {
    const router = useRouter();

    const handleThreadClick = (threadId: string) => {
        router.push(`/messages/${threadId}`);
        onClose();
    };

    const formatTimestamp = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '今';
        if (diffMins < 60) return `${diffMins}分前`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}時間前`;
        return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700">メッセージ</h3>
                <button
                    onClick={() => {
                        router.push('/messages');
                        onClose();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                    すべて見る
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {threads.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 text-sm">メッセージはありません</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {threads.map((thread) => (
                            <li key={thread.threadId}>
                                <button
                                    onClick={() => handleThreadClick(thread.threadId)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start space-x-3 ${thread.unreadCount > 0 ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {thread.otherUserProfile?.name.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className={`text-sm font-medium truncate ${thread.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {thread.otherUserProfile?.name || '不明なユーザー'}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                                {formatTimestamp(thread.lastMessageAt)}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate ${thread.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                            {thread.lastMessageText || '画像またはスタンプ'}
                                        </p>
                                    </div>
                                    {thread.unreadCount > 0 && (
                                        <span className="h-2 w-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
