"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, doc, getDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Message, UserProfile, Thread } from '@/lib/types';
import { use } from 'react';

export default function ChatPage({ params }: { params: Promise<{ threadId: string }> }) {
    const resolvedParams = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // スレッド情報と相手のプロフィールを取得
    useEffect(() => {
        if (!user) return;

        const fetchThreadAndProfile = async () => {
            try {
                const threadRef = doc(db, 'threads', resolvedParams.threadId);
                const threadSnap = await getDoc(threadRef);

                if (threadSnap.exists()) {
                    const threadData = threadSnap.data() as Thread;
                    const otherUserId = threadData.participantUserIds.find(id => id !== user.uid);

                    if (otherUserId) {
                        const profileRef = doc(db, 'profiles', otherUserId);
                        const profileSnap = await getDoc(profileRef);
                        if (profileSnap.exists()) {
                            setOtherUser(profileSnap.data() as UserProfile);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching thread/profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchThreadAndProfile();
    }, [user, resolvedParams.threadId]);

    // メッセージをリアルタイムで取得
    useEffect(() => {
        if (!user) return;

        const messagesRef = collection(db, 'messages');
        // インデックスエラー回避のため orderBy を一時的に削除し、クライアント側でソートする
        const q = query(
            messagesRef,
            where('threadId', '==', resolvedParams.threadId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData: Message[] = [];
            snapshot.forEach((doc) => {
                const msgData = doc.data() as Message;
                msgData.messageId = doc.id;
                messagesData.push(msgData);
            });

            // クライアント側でソート
            messagesData.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || Date.now();
                const timeB = b.createdAt?.toMillis() || Date.now();
                return timeA - timeB;
            });

            setMessages(messagesData);
        });

        return () => unsubscribe();
    }, [user, resolvedParams.threadId]);

    // 既読更新処理
    useEffect(() => {
        if (!user || messages.length === 0) return;

        const unreadMessages = messages.filter(
            msg => msg.senderUserId !== user.uid && !msg.isRead
        );

        if (unreadMessages.length > 0) {
            const batch = writeBatch(db);
            unreadMessages.forEach(msg => {
                const msgRef = doc(db, 'messages', msg.messageId);
                batch.update(msgRef, { isRead: true });
            });
            batch.commit().catch(err => console.error('Error marking messages as read:', err));
        }
    }, [messages, user]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user || !newMessage.trim()) return;

        setSending(true);
        try {
            const text = newMessage.trim();

            await addDoc(collection(db, 'messages'), {
                threadId: resolvedParams.threadId,
                senderUserId: user.uid,
                text: text,
                createdAt: serverTimestamp(),
                isRead: false,
            });

            await updateDoc(doc(db, 'threads', resolvedParams.threadId), {
                lastMessageAt: serverTimestamp(),
                lastMessageText: text,
            });

            setNewMessage('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch (error) {
            console.error('Error sending message:', error);
            alert('メッセージの送信に失敗しました。');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#7494c0]"><div className="animate-spin h-8 w-8 border-4 border-white rounded-full border-t-transparent"></div></div>;
    if (!user) { router.push('/'); return null; }

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        return timestamp.toDate().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        return timestamp.toDate().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
    };

    let lastDate = '';

    return (
        <div className="h-screen flex flex-col bg-[#7494c0]">
            {/* Header */}
            <div className="bg-[#2c3e50] text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center space-x-3">
                    <button onClick={() => router.push('/messages')} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-lg font-bold truncate max-w-[200px]">
                        {otherUser?.name || 'Loading...'}
                    </h2>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                    const isOwn = message.senderUserId === user.uid;
                    const messageDate = formatDate(message.createdAt);
                    const showDate = messageDate !== lastDate;
                    lastDate = messageDate;

                    return (
                        <div key={message.messageId}>
                            {showDate && (
                                <div className="flex justify-center my-4">
                                    <span className="bg-black/20 text-white text-xs px-3 py-1 rounded-full">
                                        {messageDate}
                                    </span>
                                </div>
                            )}
                            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
                                {!isOwn && otherUser && (
                                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold mr-2 self-start mt-1 overflow-hidden flex-shrink-0">
                                        {otherUser.name.charAt(0)}
                                    </div>
                                )}
                                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                    {!isOwn && (
                                        <span className="text-xs text-white/80 mb-1 ml-1">{otherUser?.name}</span>
                                    )}
                                    <div className="flex items-end gap-1">
                                        {isOwn && (
                                            <div className="flex flex-col items-end text-[10px] text-white/80 min-w-[30px]">
                                                {message.isRead && <span className="text-yellow-400 font-bold">既読</span>}
                                                <span>{formatTime(message.createdAt)}</span>
                                            </div>
                                        )}
                                        <div
                                            className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm relative ${isOwn
                                                    ? 'bg-[#8de055] text-black rounded-tr-none'
                                                    : 'bg-white text-black rounded-tl-none'
                                                }`}
                                        >
                                            {message.text}
                                        </div>
                                        {!isOwn && (
                                            <span className="text-[10px] text-white/80 min-w-[30px]">
                                                {formatTime(message.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white px-3 py-2 flex items-end gap-2">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
                <div className="flex-1 bg-gray-100 rounded-2xl px-3 py-2">
                    <textarea
                        ref={textareaRef}
                        value={newMessage}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="メッセージを入力"
                        rows={1}
                        className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32"
                        style={{ minHeight: '24px' }}
                        disabled={sending}
                    />
                </div>
                <button
                    onClick={() => handleSendMessage()}
                    disabled={!newMessage.trim() || sending}
                    className={`p-2 rounded-full ${!newMessage.trim() ? 'text-gray-400' : 'text-[#2c3e50]'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
