"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useRouter, usePathname } from 'next/navigation';
import { isAdmin } from '@/lib/permissions';
import { Settings } from 'lucide-react';

export default function Navbar() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { threads } = useMessages(user?.uid);

    const unreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);

    if (!user) return null;

    const isHome = pathname === '/home' || pathname === '/';

    return (
        <nav className="bg-surface/90 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center">
                {!isHome && (
                    <button
                        onClick={() => router.back()}
                        className="mr-3 p-1 rounded-full hover:bg-white/5 text-gray-300"
                        aria-label="戻る"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                <button
                    onClick={() => router.push('/home')}
                    className="text-xl font-bold text-white flex items-center"
                >
                    <span className="text-accent mr-1">伍</span>心会
                </button>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Desktop/Tablet Navigation */}
                <div className="hidden sm:flex items-center space-x-1 mr-2">
                    <button onClick={() => router.push('/events')} className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-accent rounded-md hover:bg-white/5">
                        イベント
                    </button>
                    <button onClick={() => router.push('/members')} className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-accent rounded-md hover:bg-white/5">
                        メンバー
                    </button>
                    <button onClick={() => router.push('/matches')} className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-accent rounded-md hover:bg-white/5">
                        マッチ
                    </button>
                    {/* Admin Link - Desktop */}
                    {profile && isAdmin(profile) && (
                        <button
                            onClick={() => router.push('/admin')}
                            className="px-3 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 rounded-md hover:bg-purple-500/10"
                        >
                            管理
                        </button>
                    )}
                </div>

                {/* Mobile Icons */}
                <button onClick={() => router.push('/events')} className="sm:hidden p-2 text-gray-300 hover:text-accent">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
                <button onClick={() => router.push('/members')} className="sm:hidden p-2 text-gray-300 hover:text-accent">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </button>

                {/* Admin Link - Mobile */}
                {profile && isAdmin(profile) && (
                    <button
                        onClick={() => router.push('/admin')}
                        className="sm:hidden p-2 text-purple-400 hover:text-purple-300"
                        title="管理画面"
                    >
                        <Settings className="h-6 w-6" />
                    </button>
                )}

                <div className="relative">
                    <button
                        onClick={() => router.push('/messages')}
                        className="relative p-2 text-gray-300 hover:text-accent focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center animate-pulse border-2 border-surface">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                <button
                    onClick={() => router.push(`/profile/${user.uid}`)}
                    className="h-8 w-8 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden border border-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </nav>
    );
}
