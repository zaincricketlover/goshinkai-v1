"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Calendar, MessageCircle, Heart, User, Settings, Users, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { isAdmin } from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function BottomNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, profile, loading } = useAuth();
    const { threads } = useMessages(user?.uid);

    // ローディング中または未認証の場合はナビを表示しない
    if (loading || !user) return null;

    // Hide on login/setup pages
    if (pathname === '/' || pathname === '/setup') return null;

    const unreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);

    const navItems = [
        { icon: Home, label: 'ホーム', path: '/home' },
        { icon: Search, label: 'メンバー', path: '/members' },
        { icon: Briefcase, label: '案件', path: '/opportunities' },
        { icon: Users, label: '人脈', path: '/connections' },
        { icon: MessageCircle, label: 'トーク', path: '/messages', badge: unreadCount },
        { icon: User, label: 'マイページ', path: `/profile/${user.uid}` },
    ];

    // Add admin item if user is admin
    if (profile && isAdmin(profile)) {
        navItems.push({ icon: Settings, label: '管理', path: '/admin' });
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-white/5 pb-safe z-50">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/home' && pathname.startsWith(item.path));
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-accent" : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <div className="relative">
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                {item.badge ? (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center border-2 border-surface">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                ) : null}
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
