"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDoc, Timestamp, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Message, UserProfile } from '@/lib/types';
import { ChatBubble } from '@/components/messages/ChatBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { Avatar } from '@/components/ui/Avatar';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function ChatPage({ params }: { params: Promise<{ threadId: string }> }) {
    const resolvedParams = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Mark messages as read
    const markMessagesAsRead = async (messagesToMark: Message[]) => {
        if (!user) return;

        try {
            const batch = writeBatch(db);
            const unreadMessages = messagesToMark.filter(
                m => m.senderUserId !== user.uid && !m.isRead
            );

            for (const msg of unreadMessages) {
                const msgRef = doc(db, 'threads', resolvedParams.threadId, 'messages', msg.messageId);
                batch.update(msgRef, { isRead: true, readAt: serverTimestamp() });
            }

            if (unreadMessages.length > 0) {
                await batch.commit();
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    useEffect(() => {
        console.log('Loading messages for threadId:', resolvedParams.threadId);
        if (!user) return;

        // 1. Fetch Thread Info
        const fetchThreadInfo = async () => {
            const threadDoc = await getDoc(doc(db, 'threads', resolvedParams.threadId));
            if (threadDoc.exists()) {
                const data = threadDoc.data();
                const otherUserId = data.participantUserIds.find((id: string) => id !== user.uid);
                if (otherUserId) {
                    const userDoc = await getDoc(doc(db, 'profiles', otherUserId));
                    if (userDoc.exists()) {
                        setOtherUser(userDoc.data() as UserProfile);
                    }
                }
            }
        };

        fetchThreadInfo();

        // 2. Listen to Messages from BOTH locations (Legacy Root & New Subcollection)

        // A. Subcollection query
        const subMessagesRef = collection(db, 'threads', resolvedParams.threadId, 'messages');
        const subQuery = query(subMessagesRef, orderBy('createdAt', 'asc'));

        // B. Root collection query (Legacy)
        const rootMessagesRef = collection(db, 'messages');
        const rootQuery = query(
            rootMessagesRef,
            where('threadId', '==', resolvedParams.threadId),
            orderBy('createdAt', 'asc')
        );

        let subMessages: Message[] = [];
        let rootMessages: Message[] = [];

        // Helper to merge and update state
        const updateAllMessages = () => {
            const allMessages = [...rootMessages, ...subMessages];

            // Deduplicate by messageId just in case
            const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.messageId, m])).values());

            // Sort by createdAt
            uniqueMessages.sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;
                return timeA - timeB;
            });

            console.log('Total messages loaded:', uniqueMessages.length);
            setMessages(uniqueMessages);
            setLoading(false);
            setTimeout(scrollToBottom, 100);

            // Mark unread messages as read (check both batch and individual if needed, 
            // but for simplicity we only mark if they are currently unread in the UI)
            if (uniqueMessages.length > 0) {
                markMessagesAsRead(uniqueMessages);
            }
        };

        const unsubSub = onSnapshot(subQuery, (snapshot) => {
            subMessages = snapshot.docs.map(doc => ({ messageId: doc.id, ...doc.data() } as Message));
            updateAllMessages();
        });

        const unsubRoot = onSnapshot(rootQuery, (snapshot) => {
            rootMessages = snapshot.docs.map(doc => ({ messageId: doc.id, ...doc.data() } as Message));
            updateAllMessages();
        }, (error) => {
            // Ignore root query error if permissions are strict, but log it
            console.warn("Legacy message fetch failed (likely permission), ignoring:", error);
            // If root fetch fails, just show subMessages
            updateAllMessages();
        });

        return () => {
            unsubSub();
            unsubRoot();
        };
    }, [user, resolvedParams.threadId]);

    const handleSendMessage = async (text: string, isTemplate: boolean) => {
        if (!user) return;

        try {
            const messagesRef = collection(db, 'threads', resolvedParams.threadId, 'messages');
            await addDoc(messagesRef, {
                threadId: resolvedParams.threadId,
                senderUserId: user.uid,
                text: text,
                isTemplate: isTemplate,
                createdAt: serverTimestamp(),
                isRead: false,
                readAt: null
            });

            // Update Thread Last Message
            await updateDoc(doc(db, 'threads', resolvedParams.threadId), {
                lastMessageAt: serverTimestamp(),
                lastMessageText: text,
                lastMessageSenderId: user.uid
            });

        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div></div>;

    return (
        <div className="flex flex-col h-screen bg-primary">
            {/* Header */}
            <div className="bg-surface/90 backdrop-blur-md border-b border-white/5 p-4 flex items-center sticky top-0 z-10">
                <button onClick={() => router.back()} className="mr-4 text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center cursor-pointer" onClick={() => otherUser && router.push(`/profile/${otherUser.userId}`)}>
                    <Avatar
                        src={otherUser?.avatarUrl}
                        alt={otherUser?.name || 'User'}
                        size="sm"
                        rank={otherUser?.rankBadge}
                        className="mr-3"
                    />
                    <div>
                        <h2 className="text-sm font-bold text-white">{otherUser?.name}</h2>
                        <p className="text-xs text-gray-400">{otherUser?.companyName}</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-gray-500 mb-2">まだメッセージがありません</p>
                        <p className="text-sm text-gray-600">最初のメッセージを送ってみましょう！</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatBubble
                            key={msg.messageId}
                            message={msg}
                            isOwn={msg.senderUserId === user?.uid}
                            showAvatar={msg.senderUserId !== user?.uid}
                            avatarUrl={otherUser?.avatarUrl}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <MessageInput onSend={handleSendMessage} />
        </div>
    );
}
