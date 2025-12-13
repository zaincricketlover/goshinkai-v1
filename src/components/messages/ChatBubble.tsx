import React from 'react';
import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

interface ChatBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    avatarUrl?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwn, showAvatar, avatarUrl }) => {
    const formatTime = (timestamp: Timestamp) => {
        return new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' }).format(timestamp.toDate());
    };

    return (
        <div className={cn("flex w-full mb-4", isOwn ? "justify-end" : "justify-start")}>
            {!isOwn && showAvatar && (
                <img
                    src={avatarUrl || '/default-avatar.png'}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full mr-2 self-end mb-1"
                />
            )}
            {!isOwn && !showAvatar && <div className="w-10" />}

            <div className={cn("max-w-[70%] flex flex-col", isOwn ? "items-end" : "items-start")}>
                <div className={cn(
                    "px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm",
                    isOwn
                        ? "bg-gradient-to-br from-accent to-accent-dark text-primary-dark rounded-br-none font-medium"
                        : "bg-surface-elevated border border-white/10 text-white rounded-bl-none"
                )}>
                    {message.text}
                </div>
                <div className="flex items-center mt-1 space-x-2">
                    <span className="text-[10px] text-gray-500">
                        {formatTime(message.createdAt)}
                    </span>
                    {isOwn && message.readAt && (
                        <span className="text-[10px] text-accent">既読</span>
                    )}
                </div>
            </div>
        </div>
    );
};
