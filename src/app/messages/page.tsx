"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { ThreadList } from '@/components/messages/ThreadList';

export default function MessagesPage() {
    const { user } = useAuth();
    const { threads, loading } = useMessages(user?.uid);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div></div>;

    return (
        <div className="min-h-screen bg-primary pb-20 px-4 py-6">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6">トーク</h1>
                <ThreadList threads={threads} />
            </div>
        </div>
    );
}
