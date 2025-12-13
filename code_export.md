---
## FILE: src/lib/types.ts

```tsx
import { Timestamp } from 'firebase/firestore';

export type VenueId = 'osaka' | 'kobe' | 'tokyo';
export type RankBadge = 'WHITE' | 'BLUE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'PLATINUM';
export type ParticipationStatus = 'going' | 'interested' | 'not_going';

export interface Venue {
    id: VenueId;
    name: string;
    area: string;
}

export interface User {
    id: string; // Auth UID
    email: string;
    createdAt: Timestamp;
}

export interface UserProfile {
    userId: string;
    name: string;
    kana: string;
    avatarUrl: string;
    companyName: string;
    title: string;
    homeVenueId: VenueId;
    industries: string[];
    wantTags: string[];
    giveTags: string[];
    catchCopy: string;
    bio: string;
    rankBadge: RankBadge;
    rankScore: number;
    unlockedVenueIds: string[];
    isAdmin?: boolean;
    createdAt: Timestamp;
}

export interface Event {
    id: string;
    venueId: string;
    title: string;
    description: string;
    location: string;
    dateTime: Timestamp;
    isOpenToAllVenues: boolean;
    createdAt: Timestamp;
}

export interface EventParticipant {
    id: string;
    eventId: string;
    userId: string;
    status: ParticipationStatus;
    checkedInAt?: Timestamp;
}

export interface Interest {
    id: string;
    fromUserId: string;
    toUserId: string;
    createdAt: Timestamp;
}
export interface Thread {
    threadId: string;
    participantUserIds: string[]; // Always 2 participants
    createdAt: Timestamp;
    lastMessageAt?: Timestamp;
    lastMessageText?: string;
}

export interface Message {
    messageId: string;
    threadId: string;
    senderUserId: string;
    text: string;
    createdAt: Timestamp;
    isRead: boolean;
}
```

---
## FILE: src/lib/permissions.ts

```tsx
import { UserProfile, RankBadge } from "./types";

const badgeOrder: RankBadge[] = [
    "WHITE",
    "BLUE",
    "SILVER",
    "GOLD",
    "DIAMOND",
    "PLATINUM",
];

export function isGoldOrHigher(badge: RankBadge): boolean {
    return badgeOrder.indexOf(badge) >= badgeOrder.indexOf("GOLD");
}

export function isAdmin(profile: UserProfile): boolean {
    return !!profile.isAdmin;
}

export function canViewProfileDetail(
    current: UserProfile,
    target: UserProfile
): boolean {
    if (!current || !target) return false;
    if (current.userId === target.userId) return true;
    if (isAdmin(current)) return true; // Admin can view all
    if (current.homeVenueId === target.homeVenueId) return true;
    if (isGoldOrHigher(current.rankBadge)) return true;
    if (current.unlockedVenueIds?.includes(target.homeVenueId)) return true;
    return false;
}

export function canSendDirectMessage(
    current: UserProfile,
    target: UserProfile
): boolean {
    return canViewProfileDetail(current, target);
}
```

---
## FILE: src/context/AuthContext.tsx

```tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";

interface AuthContextType {
    user: FirebaseUser | null;
    profile: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const profileRef = doc(db, "profiles", firebaseUser.uid);
                    const profileSnap = await getDoc(profileRef);

                    if (profileSnap.exists()) {
                        setProfile(profileSnap.data() as UserProfile);
                    } else {
                        setProfile(null);
                    }
                } catch (error) {
                    console.error("[AuthContext] Error fetching profile:", error);
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
```

---
## FILE: src/app/layout.tsx

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/ui/Navbar";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Goshinkai - 伍心会",
  description: "Management Community App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar />
          <main className="pb-16 sm:pb-0">
            {children}
          </main>
          <BottomNavigation />
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
```

---
## FILE: src/app/page.tsx

```tsx
"use client";

import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);

  const renderContent = () => {
    if (isLogin) {
      return (
        <>
          <LoginForm />
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  アカウントをお持ちでない場合
                </span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setIsLogin(false)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50"
              >
                新規登録（招待コードが必要です）
              </button>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <RegisterForm />
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                すでにアカウントをお持ちの場合
              </span>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => setIsLogin(true)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50"
            >
              ログイン
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Goshinkai - 伍心会
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Management Community
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          {renderContent()}
        </Card>
      </div>
    </div>
  );
}
```

---
## FILE: src/components/ui/Navbar.tsx

```tsx
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { threads } = useMessages(user?.uid);

    const unreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);

    if (!user) return null;

    const isHome = pathname === '/home' || pathname === '/';

    return (
        <nav className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
            <div className="flex items-center">
                {!isHome && (
                    <button
                        onClick={() => router.back()}
                        className="mr-3 p-1 rounded-full hover:bg-gray-100 text-gray-600"
                        aria-label="戻る"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                <button
                    onClick={() => router.push('/home')}
                    className="text-xl font-bold text-gray-900 flex items-center"
                >
                    <span className="text-blue-600 mr-1">伍</span>心会
                </button>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Desktop/Tablet Navigation */}
                <div className="hidden sm:flex items-center space-x-1 mr-2">
                    <button onClick={() => router.push('/events')} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50">
                        イベント
                    </button>
                    <button onClick={() => router.push('/members')} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 rounded-md hover:bg-gray-50">
                        メンバー
                    </button>
                </div>

                {/* Mobile Icons */}
                <button onClick={() => router.push('/events')} className="sm:hidden p-2 text-gray-600 hover:text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
                <button onClick={() => router.push('/members')} className="sm:hidden p-2 text-gray-600 hover:text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </button>

                <div className="relative">
                    <button
                        onClick={() => router.push('/messages')}
                        className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center animate-pulse border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                <button
                    onClick={() => router.push(`/profile/${user.uid}`)}
                    className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </nav>
    );
}
```

---
## FILE: src/components/ui/BottomNavigation.tsx

```tsx
"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Calendar, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';

export default function BottomNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();
    const { threads } = useMessages(user?.uid);

    if (!user) return null;

    // Hide on login/setup pages
    if (pathname === '/' || pathname === '/setup') return null;

    const unreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);

    const navItems = [
        { icon: Home, label: 'ホーム', path: '/home' },
        { icon: Search, label: 'メンバー', path: '/members' },
        { icon: Calendar, label: 'イベント', path: '/events' },
        { icon: MessageCircle, label: 'メッセージ', path: '/messages', badge: unreadCount },
        { icon: User, label: 'マイページ', path: `/profile/${user.uid}` },
    ];

    return (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/home' && pathname.startsWith(item.path));
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <div className="relative">
                                <Icon size={24} />
                                {item.badge ? (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center">
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
```

---
## FILE: src/components/ui/Card.tsx

```tsx
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    title,
    description,
}) => {
    return (
        <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
            {(title || description) && (
                <div className="px-6 py-4 border-b border-gray-200">
                    {title && <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>}
                    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                </div>
            )}
            <div className="px-6 py-4">
                {children}
            </div>
        </div>
    );
};
```

---
## FILE: src/components/ui/Button.tsx

```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-6 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : null}
            {children}
        </button>
    );
};
```

---
## FILE: src/app/home/page.tsx

```tsx
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };

    if (loading) return <div className="p-8">Loading...</div>;

    if (!user) {
        router.push('/');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <h1 className="text-xl font-bold text-gray-800">Goshinkai</h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/profile/${user.uid}`)}
                            >
                                マイプロフィール
                            </Button>
                            <span className="text-gray-700">
                                {profile?.name || user.email} さん
                            </span>
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                ログアウト
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Welcome Section */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            ようこそ、{profile?.name || user.email} さん
                        </h2>
                        <p className="text-gray-600">
                            Goshinkai へようこそ。あなたのランク: {' '}
                            <span className="font-semibold text-blue-600">
                                {profile?.rankBadge || 'WHITE'} ({profile?.rankScore || 0}pt)
                            </span>
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button
                            onClick={() => router.push(`/profile/${user.uid}`)}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
                        >
                            <div className="flex items-center mb-4">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">マイプロフィール</h3>
                            <p className="text-sm text-gray-600">プロフィールを確認・編集</p>
                        </button>

                        <button
                            onClick={() => router.push('/events')}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
                        >
                            <div className="flex items-center mb-4">
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">イベント</h3>
                            <p className="text-sm text-gray-600">開催予定のイベント一覧</p>
                        </button>

                        <button
                            onClick={() => router.push('/members')}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
                        >
                            <div className="flex items-center mb-4">
                                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">メンバー</h3>
                            <p className="text-sm text-gray-600">他のメンバーを見る</p>
                        </button>
                        <button
                            onClick={() => router.push('/messages')}
                            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer text-left"
                        >
                            <div className="flex items-center mb-4">
                                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">メッセージ</h3>
                            <p className="text-sm text-gray-600">チャット履歴を確認</p>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
```

---
## FILE: src/app/members/page.tsx

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, doc, getDoc, setDoc, serverTimestamp, limit, startAfter, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserProfile } from '@/lib/types';
import { canViewProfileDetail, canSendDirectMessage } from '@/lib/permissions';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';

const VENUES: Record<string, string> = {
    osaka: '大阪',
    kobe: '神戸',
    tokyo: '東京',
};

const RANK_BADGES: Record<string, string> = {
    WHITE: 'ホワイト',
    BLUE: 'ブルー',
    SILVER: 'シルバー',
    GOLD: 'ゴールド',
    DIAMOND: 'ダイヤモンド',
    PLATINUM: 'プラチナ',
};

export default function MembersPage() {
    const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [venueFilter, setVenueFilter] = useState<string>('all');

    // Initial fetch
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        if (user) {
            fetchMembers(true);
        }
    }, [user, authLoading, router, venueFilter]); // Re-fetch when venue filter changes

    // Search effect with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) {
                fetchMembers(true);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchMembers = async (isReset = false) => {
        if (!user) return;
        
        try {
            if (isReset) {
                setLoading(true);
                setMembers([]);
                setLastDoc(null);
                setHasMore(true);
            } else {
                setLoadingMore(true);
            }

            let q = query(collection(db, 'profiles'), limit(20));

            // Apply filters
            if (venueFilter !== 'all') {
                q = query(q, where('homeVenueId', '==', venueFilter));
            }

            // Client-side filtering strategy for search for now to ensure accuracy
            // We fetch more if searching, or just rely on what we have.
            // For this implementation, we will fetch and then filter client side for the search query
            // This is not perfect for scalability but better than nothing for now.
            
            if (!isReset && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const querySnapshot = await getDocs(q);
            const newMembers: UserProfile[] = [];
            
            querySnapshot.forEach((doc) => {
                const profile = doc.data() as UserProfile;
                if (profile.userId !== user.uid) {
                    if (searchQuery) {
                        const queryText = searchQuery.toLowerCase();
                        if (
                            profile.name.toLowerCase().includes(queryText) ||
                            profile.companyName?.toLowerCase().includes(queryText) ||
                            profile.catchCopy?.toLowerCase().includes(queryText)
                        ) {
                            newMembers.push(profile);
                        }
                    } else {
                        newMembers.push(profile);
                    }
                }
            });

            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            
            if (querySnapshot.docs.length < 20) {
                setHasMore(false);
            }

            if (isReset) {
                setMembers(newMembers);
            } else {
                setMembers(prev => [...prev, ...newMembers]);
            }

        } catch (error) {
            console.error('Error fetching members:', error);
            toast.error('メンバーの取得に失敗しました');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleMessage = async (memberId: string) => {
        if (!user) return;

        try {
            const threadId = [user.uid, memberId].sort().join('_');
            const threadRef = doc(db, 'threads', threadId);
            const threadSnap = await getDoc(threadRef);

            if (!threadSnap.exists()) {
                await setDoc(threadRef, {
                    participantUserIds: [user.uid, memberId],
                    lastMessageAt: serverTimestamp(),
                    lastMessageText: '',
                    createdAt: serverTimestamp(),
                });
            }
            router.push(`/messages/${threadId}`);
        } catch (error) {
            console.error('Error creating/accessing thread:', error);
            toast.error('メッセージスレッドの作成に失敗しました');
        }
    };

    if (authLoading) return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Skeleton variant="circular" width={64} height={64} />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton variant="text" width="60%" />
                                        <Skeleton variant="text" width="40%" />
                                    </div>
                                </div>
                                <Skeleton variant="text" height={20} />
                                <div className="flex gap-2">
                                    <Skeleton variant="rectangular" height={32} className="flex-1" />
                                    <Skeleton variant="rectangular" height={32} className="flex-1" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 pb-24">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">メンバー</h1>
                </div>

                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="名前、会社名、キャッチコピーで検索"
                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">拠点フィルター</label>
                            <select
                                value={venueFilter}
                                onChange={(e) => setVenueFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="all">すべて</option>
                                <option value="osaka">大阪</option>
                                <option value="kobe">神戸</option>
                                <option value="tokyo">東京</option>
                            </select>
                        </div>
                    </div>
                </Card>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => {
                        const isUnlocked = currentUserProfile ? canViewProfileDetail(currentUserProfile, member) : false;
                        const canMessage = currentUserProfile ? canSendDirectMessage(currentUserProfile, member) : false;

                        return (
                            <Card key={member.userId}>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">{member.name}</h3>
                                            {isUnlocked && member.companyName && (
                                                <p className="text-sm text-gray-600 truncate">{member.companyName}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {RANK_BADGES[member.rankBadge]}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {VENUES[member.homeVenueId]}
                                        </span>
                                    </div>

                                    {isUnlocked ? (
                                        member.catchCopy && (
                                            <p className="text-sm text-gray-700 italic line-clamp-2">"{member.catchCopy}"</p>
                                        )
                                    ) : (
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 flex flex-col items-center justify-center text-center space-y-1">
                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mb-1">
                                                <span className="text-lg">🔒</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-700">会員限定情報</p>
                                            <p className="text-[10px] text-gray-500 leading-tight">詳細閲覧には条件達成が必要です</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button onClick={() => router.push(`/profile/${member.userId}`)} className="flex-1" size="sm">
                                            プロフィール
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (canMessage) {
                                                    handleMessage(member.userId);
                                                } else {
                                                    toast.error('この会員へのメッセージ機能は、ゴールド以上のランクか、この会場のイベントに参加すると解放されます。');
                                                }
                                            }}
                                            variant={canMessage ? "outline" : "ghost"}
                                            className={`flex-1 ${!canMessage ? 'text-gray-400' : ''}`}
                                            size="sm"
                                        >
                                            {canMessage ? 'メッセージ' : '🔒 メッセージ'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    
                    {/* Loading Skeletons for Pagination */}
                    {loadingMore && [...Array(3)].map((_, i) => (
                         <Card key={`skeleton-${i}`}>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Skeleton variant="circular" width={64} height={64} />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton variant="text" width="60%" />
                                        <Skeleton variant="text" width="40%" />
                                    </div>
                                </div>
                                <Skeleton variant="text" height={20} />
                                <div className="flex gap-2">
                                    <Skeleton variant="rectangular" height={32} className="flex-1" />
                                    <Skeleton variant="rectangular" height={32} className="flex-1" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {loading && !loadingMore && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i}>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <Skeleton variant="circular" width={64} height={64} />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton variant="text" width="60%" />
                                            <Skeleton variant="text" width="40%" />
                                        </div>
                                    </div>
                                    <Skeleton variant="text" height={20} />
                                    <div className="flex gap-2">
                                        <Skeleton variant="rectangular" height={32} className="flex-1" />
                                        <Skeleton variant="rectangular" height={32} className="flex-1" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && hasMore && !loadingMore && (
                    <div className="mt-8 flex justify-center">
                        <Button onClick={() => fetchMembers(false)} variant="outline">
                            もっと見る
                        </Button>
                    </div>
                )}
                
                {!loading && members.length === 0 && (
                    <div className="mt-6 text-center text-gray-500">
                        条件に一致するメンバーが見つかりませんでした。
                    </div>
                )}
            </div>
        </div>
    );
}
```

---
## FILE: src/app/profile/[userId]/page.tsx

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserProfile } from '@/lib/types';
import { use } from 'react';
import { canViewProfileDetail, canSendDirectMessage } from '@/lib/permissions';

const VENUES: Record<string, string> = {
    osaka: '大阪',
    kobe: '神戸',
    tokyo: '東京',
};

const RANK_BADGES: Record<string, string> = {
    WHITE: 'ホワイト',
    BLUE: 'ブルー',
    SILVER: 'シルバー',
    GOLD: 'ゴールド',
    DIAMOND: 'ダイヤモンド',
    PLATINUM: 'プラチナ',
};

function InterestButtons({ fromUserId, toUserId, router, canMessage }: { fromUserId: string; toUserId: string; router: any, canMessage: boolean }) {
    const [hasInterest, setHasInterest] = useState(false);
    const [mutualInterest, setMutualInterest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const checkInterest = async () => {
            try {
                const interestsRef = collection(db, 'interests');

                const fromQuery = query(
                    interestsRef,
                    where('fromUserId', '==', fromUserId),
                    where('toUserId', '==', toUserId)
                );
                const fromSnapshot = await getDocs(fromQuery);
                setHasInterest(!fromSnapshot.empty);

                const toQuery = query(
                    interestsRef,
                    where('fromUserId', '==', toUserId),
                    where('toUserId', '==', fromUserId)
                );
                const toSnapshot = await getDocs(toQuery);

                if (!fromSnapshot.empty && !toSnapshot.empty) {
                    setMutualInterest(true);
                }
            } catch (error) {
                console.error('Error checking interest:', error);
            } finally {
                setLoading(false);
            }
        };

        checkInterest();
    }, [fromUserId, toUserId]);

    const handleInterestToggle = async () => {
        setProcessing(true);
        try {
            const interestsRef = collection(db, 'interests');
            const q = query(
                interestsRef,
                where('fromUserId', '==', fromUserId),
                where('toUserId', '==', toUserId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                await setDoc(doc(interestsRef), {
                    fromUserId,
                    toUserId,
                    createdAt: serverTimestamp(),
                });
                setHasInterest(true);

                // Check for mutual interest again
                const reverseQuery = query(
                    interestsRef,
                    where('fromUserId', '==', toUserId),
                    where('toUserId', '==', fromUserId)
                );
                const reverseSnapshot = await getDocs(reverseQuery);
                if (!reverseSnapshot.empty) {
                    setMutualInterest(true);
                    alert('マッチングしました！メッセージを送ることができます。');
                }
            } else {
                snapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
                setHasInterest(false);
                setMutualInterest(false);
            }
        } catch (error) {
            console.error('Error toggling interest:', error);
            alert('エラーが発生しました');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="border-t border-gray-200 pt-6">
            {mutualInterest && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-medium">✓ マッチしています</p>
                </div>
            )}
            <div className="flex gap-4">
                <Button
                    onClick={handleInterestToggle}
                    className={`flex-1 ${hasInterest ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    isLoading={processing}
                >
                    {hasInterest ? '興味を取り消す' : '興味を持つ'}
                </Button>
                <Button
                    variant={canMessage ? "outline" : "ghost"}
                    className={`flex-1 ${!canMessage ? 'text-gray-400' : ''}`}
                    onClick={async () => {
                        if (!canMessage) {
                            alert('この会員へのメッセージ機能は、ゴールド以上のランクか、この会場のイベントに参加すると解放されます。');
                            return;
                        }
                        // スレッドIDを生成（2人のユーザーIDをソートして連結）
                        const threadId = [fromUserId, toUserId].sort().join('_');

                        try {
                            // スレッドが存在するか確認
                            const threadRef = doc(db, 'threads', threadId);
                            const threadSnap = await getDoc(threadRef);

                            if (!threadSnap.exists()) {
                                // スレッドを作成
                                await setDoc(threadRef, {
                                    participantUserIds: [fromUserId, toUserId],
                                    lastMessageAt: serverTimestamp(),
                                    lastMessageText: '',
                                    createdAt: serverTimestamp(),
                                });
                            }

                            // チャット画面へ遷移
                            router.push(`/messages/${threadId}`);
                        } catch (error) {
                            console.error('Error creating/accessing thread:', error);
                            alert('エラーが発生しました');
                        }
                    }}
                >
                    {canMessage ? 'メッセージ' : '🔒 メッセージ'}
                </Button>
            </div>
        </div>
    );
}

function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const resolvedParams = use(params);
    const { user, profile: currentUserProfile } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileRef = doc(db, 'profiles', resolvedParams.userId);
                const profileSnap = await getDoc(profileRef);

                if (profileSnap.exists()) {
                    setProfile(profileSnap.data() as UserProfile);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [resolvedParams.userId]);

    if (loading) return <div className="p-8">Loading...</div>;

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Card title="プロフィールが見つかりません">
                    <p className="text-gray-600">指定されたユーザーのプロフィールが見つかりませんでした。</p>
                </Card>
            </div>
        );
    }

    const isOwnProfile = user?.uid === resolvedParams.userId;
    const isUnlocked = isOwnProfile || (currentUserProfile ? canViewProfileDetail(currentUserProfile, profile) : false);
    const canMessage = currentUserProfile ? canSendDirectMessage(currentUserProfile, profile) : false;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                                    {profile.name.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                                    {profile.kana && (
                                        <p className="text-sm text-gray-500">{profile.kana}</p>
                                    )}
                                    <div className="flex items-center mt-2 space-x-2">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {RANK_BADGES[profile.rankBadge]} ({profile.rankScore || 0}pt)
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {VENUES[profile.homeVenueId]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {isOwnProfile && (
                                <Button onClick={() => router.push('/profile/edit')}>
                                    編集
                                </Button>
                            )}
                        </div>

                        {isUnlocked ? (
                            <>
                                {profile.catchCopy && (
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                        <p className="text-blue-900 italic">"{profile.catchCopy}"</p>
                                    </div>
                                )}

                                {(profile.companyName || profile.title) && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">所属</h3>
                                        <div className="space-y-2">
                                            {profile.companyName && (
                                                <p className="text-gray-700">
                                                    <span className="font-medium">会社:</span> {profile.companyName}
                                                </p>
                                            )}
                                            {profile.title && (
                                                <p className="text-gray-700">
                                                    <span className="font-medium">役職:</span> {profile.title}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {profile.bio && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">自己紹介</h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                                    </div>
                                )}

                                {profile.wantTags && profile.wantTags.length > 0 && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">欲しいもの</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.wantTags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profile.giveTags && profile.giveTags.length > 0 && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">提供できるもの</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.giveTags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="border-t border-gray-200 pt-8">
                                <div className="bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl">🔒</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">会員限定コンテンツ</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        この会員の詳細情報とメッセージ機能を利用するには、<br className="hidden sm:block" />
                                        以下のいずれかの条件を満たす必要があります。
                                    </p>

                                    <div className="bg-white p-4 rounded-lg border border-gray-100 max-w-sm mx-auto text-left space-y-3 shadow-inner">
                                        <div className="flex items-center text-sm text-gray-700">
                                            <span className="text-yellow-500 mr-2">●</span>
                                            ゴールドランク以上の会員
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <span className="text-blue-500 mr-2">●</span>
                                            同じ拠点（{VENUES[profile.homeVenueId]}）の会員
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <span className="text-green-500 mr-2">●</span>
                                            この拠点のイベントに参加してロック解除
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isOwnProfile && user && (
                            <InterestButtons
                                fromUserId={user.uid}
                                toUserId={resolvedParams.userId}
                                router={router}
                                canMessage={canMessage}
                            />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default ProfilePage;
```

---
## FILE: src/app/events/page.tsx

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Event } from '@/lib/types';

export default function EventsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        const fetchEvents = async () => {
            try {
                const eventsRef = collection(db, 'events');
                const q = query(eventsRef, orderBy('dateTime', 'asc'));
                const querySnapshot = await getDocs(q);

                const eventsList: Event[] = [];
                querySnapshot.forEach((doc) => {
                    eventsList.push({ id: doc.id, ...doc.data() } as Event);
                });

                setEvents(eventsList);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchEvents();
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (!user) return null;

    const formatDate = (timestamp: Timestamp) => {
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">イベント一覧</h1>
                    <div className="flex gap-3">
                        <Button onClick={() => router.push('/events/create')}>
                            イベントを作成
                        </Button>
                        <Button onClick={() => router.push('/home')} variant="outline">
                            ホームに戻る
                        </Button>
                    </div>
                </div>

                {events.length === 0 ? (
                    <Card title="イベントがありません">
                        <p className="text-gray-600">現在、開催予定のイベントはありません。</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {events.map((event) => (
                            <Card key={event.id}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {event.title}
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {formatDate(event.dateTime)}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {event.location}
                                            </div>
                                        </div>
                                        <p className="mt-3 text-gray-700">{event.description}</p>
                                        {event.isOpenToAllVenues && (
                                            <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                全拠点参加可能
                                            </span>
                                        )}
                                    </div>
                                    <div className="ml-6">
                                        <Button
                                            onClick={() => router.push(`/events/${event.id}`)}
                                        >
                                            詳細を見る
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
```

---
## FILE: src/app/events/[eventId]/page.tsx

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, serverTimestamp, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Event, EventParticipant, UserProfile } from '@/lib/types';
import { use } from 'react';
import { toast } from 'sonner';

const VENUES: Record<string, string> = {
    osaka: '大阪',
    kobe: '神戸',
    tokyo: '東京',
};

const RANK_BADGES: Record<string, string> = {
    WHITE: 'ホワイト',
    BLUE: 'ブルー',
    SILVER: 'シルバー',
    GOLD: 'ゴールド',
    DIAMOND: 'ダイヤモンド',
    PLATINUM: 'プラチナ',
};

function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
    const resolvedParams = use(params);
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [participants, setParticipants] = useState<(EventParticipant & { profile: UserProfile })[]>([]);
    const [myParticipation, setMyParticipation] = useState<EventParticipant | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        const fetchEventData = async () => {
            try {
                // Fetch Event
                const eventRef = doc(db, 'events', resolvedParams.eventId);
                const eventSnap = await getDoc(eventRef);

                if (eventSnap.exists()) {
                    setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);

                    // Fetch Participants
                    const participantsRef = collection(db, 'event_participants');
                    const q = query(participantsRef, where('eventId', '==', resolvedParams.eventId));
                    const participantsSnap = await getDocs(q);

                    const participantsList: (EventParticipant & { profile: UserProfile })[] = [];
                    
                    for (const docSnap of participantsSnap.docs) {
                        const participantData = docSnap.data() as EventParticipant;
                        
                        // Check if it's me
                        if (user && participantData.userId === user.uid) {
                            setMyParticipation({ id: docSnap.id, ...participantData });
                        }

                        // Fetch Profile for each participant
                        const profileRef = doc(db, 'profiles', participantData.userId);
                        const profileSnap = await getDoc(profileRef);
                        if (profileSnap.exists()) {
                             participantsList.push({
                                id: docSnap.id,
                                ...participantData,
                                profile: profileSnap.data() as UserProfile
                            });
                        }
                    }
                    setParticipants(participantsList);
                }
            } catch (error) {
                console.error('Error fetching event data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchEventData();
        }
    }, [user, authLoading, router, resolvedParams.eventId]);

    const handleParticipation = async (status: 'going' | 'interested' | 'not_going') => {
        if (!user || !event) return;
        setProcessing(true);

        try {
            const participantsRef = collection(db, 'event_participants');
            
            if (myParticipation) {
                // Update existing
                if (status === 'not_going') {
                    await deleteDoc(doc(participantsRef, myParticipation.id));
                    setMyParticipation(null);
                    setParticipants(prev => prev.filter(p => p.userId !== user.uid));
                    toast.success('参加をキャンセルしました');
                } else {
                    const docRef = doc(participantsRef, myParticipation.id);
                    await updateDoc(docRef, { status });
                    setMyParticipation({ ...myParticipation, status });
                    setParticipants(prev => prev.map(p => p.userId === user.uid ? { ...p, status } : p));
                    toast.success('参加ステータスを更新しました');
                }
            } else {
                // Create new
                if (status !== 'not_going') {
                    const newDocRef = doc(participantsRef); // Auto ID
                    const newParticipant: EventParticipant = {
                        id: newDocRef.id,
                        eventId: event.id,
                        userId: user.uid,
                        status,
                    };
                    await setDoc(newDocRef, newParticipant);
                    
                    // Optimistically add to list (need profile)
                    if (profile) {
                         setParticipants(prev => [...prev, { ...newParticipant, profile }]);
                    }
                    setMyParticipation(newParticipant);
                    toast.success('参加登録しました');
                }
            }
        } catch (error) {
            console.error('Error updating participation:', error);
            toast.error('エラーが発生しました');
        } finally {
            setProcessing(false);
        }
    };

    const handleCheckIn = async () => {
        if (!user || !event || !myParticipation) return;
        setProcessing(true);

        try {
            const docRef = doc(db, 'event_participants', myParticipation.id);
            await updateDoc(docRef, {
                checkedInAt: serverTimestamp(),
            });

            // Update local state
            setMyParticipation({ ...myParticipation, checkedInAt: Timestamp.now() });
            
            // Add Rank Score
            const profileRef = doc(db, 'profiles', user.uid);
            await updateDoc(profileRef, {
                rankScore: increment(10), // 10 points for check-in
                unlockedVenueIds: arrayUnion(event.venueId) // Unlock venue
            });

            toast.success('チェックインしました！ランクスコア+10pt、会場ロック解除！');

        } catch (error) {
             console.error('Error checking in:', error);
             toast.error('チェックインに失敗しました');
        } finally {
            setProcessing(false);
        }
    };


    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (!event) return (
         <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Card title="イベントが見つかりません">
                <p className="text-gray-600">指定されたイベントが見つかりませんでした。</p>
            </Card>
        </div>
    );

    const formatDate = (timestamp: Timestamp) => {
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => router.back()}>
                        ← 戻る
                    </Button>
                </div>

                <Card className="mb-8">
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                    {VENUES[event.venueId]}
                                </span>
                                {event.isOpenToAllVenues && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        全拠点参加可能
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center text-gray-700">
                                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatDate(event.dateTime)}
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {event.location}
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-3">参加ステータス</h3>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <Button
                                            variant={myParticipation?.status === 'going' ? 'primary' : 'outline'}
                                            onClick={() => handleParticipation('going')}
                                            isLoading={processing}
                                            className="flex-1"
                                            size="sm"
                                        >
                                            参加する
                                        </Button>
                                        <Button
                                            variant={myParticipation?.status === 'interested' ? 'primary' : 'outline'}
                                            onClick={() => handleParticipation('interested')}
                                            isLoading={processing}
                                            className="flex-1"
                                            size="sm"
                                        >
                                            興味あり
                                        </Button>
                                    </div>
                                    {myParticipation && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleParticipation('not_going')}
                                            isLoading={processing}
                                            size="sm"
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            参加を取り消す
                                        </Button>
                                    )}
                                </div>

                                {myParticipation?.status === 'going' && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        {myParticipation.checkedInAt ? (
                                            <div className="text-center p-2 bg-green-100 text-green-800 rounded-md font-bold">
                                                チェックイン済み
                                            </div>
                                        ) : (
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                onClick={handleCheckIn}
                                                isLoading={processing}
                                            >
                                                会場でチェックイン
                                            </Button>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            ※チェックインするとランクスコア獲得＆会場ロック解除！
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">イベント詳細</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                        </div>
                    </div>
                </Card>

                <Card title={`参加者 (${participants.filter(p => p.status === 'going').length}名)`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {participants.filter(p => p.status === 'going').map((participant) => (
                            <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/profile/${participant.userId}`)}>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {participant.profile.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{participant.profile.name}</p>
                                    <p className="text-xs text-gray-500">{participant.profile.companyName}</p>
                                </div>
                            </div>
                        ))}
                        {participants.filter(p => p.status === 'going').length === 0 && (
                            <p className="text-gray-500 text-sm col-span-full">まだ参加者はいません。</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default EventDetailPage;
```

---
## FILE: src/app/messages/page.tsx

```tsx
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { useMessages } from '@/hooks/useMessages';
import { Skeleton } from '@/components/ui/Skeleton';

export default function MessagesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { threads, loading: threadsLoading } = useMessages(user?.uid);

    if (authLoading) return <div className="p-8">Loading...</div>;

    if (!user) {
        router.push('/');
        return null;
    }

    if (threadsLoading) {
        return (
            <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">メッセージ</h1>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Card key={i}>
                                <div className="flex items-center space-x-4">
                                    <Skeleton variant="circular" width={48} height={48} />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton variant="text" width="30%" />
                                            <Skeleton variant="text" width="20%" />
                                        </div>
                                        <Skeleton variant="text" width="60%" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">メッセージ</h1>

                {threads.length === 0 ? (
                    <Card title="メッセージはありません">
                        <p className="text-gray-600">まだメッセージのやり取りはありません。</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {threads.map((thread) => (
                            <div
                                key={thread.threadId}
                                onClick={() => router.push(`/messages/${thread.threadId}`)}
                                className="cursor-pointer transition-transform hover:scale-[1.01]"
                            >
                                <Card className={`hover:shadow-md transition-shadow ${thread.unreadCount > 0 ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                                {thread.otherUserProfile?.name.charAt(0)}
                                            </div>
                                            {thread.unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white">
                                                    {thread.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className={`text-lg font-semibold truncate ${thread.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {thread.otherUserProfile?.name || 'Unknown User'}
                                                </h3>
                                                {thread.lastMessageAt && (
                                                    <span className={`text-xs ${thread.unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                                                        {thread.lastMessageAt.toDate().toLocaleString('ja-JP', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                {thread.lastMessageText || '画像が送信されました'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
```

---
## FILE: src/hooks/useMessages.ts

```tsx
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs, orderBy, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Thread, UserProfile } from '@/lib/types';

export interface ThreadWithProfile extends Thread {
    otherUserProfile: UserProfile | null;
    unreadCount: number;
}

export const useMessages = (userId: string | undefined) => {
    const [threads, setThreads] = useState<ThreadWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const profileCache = useRef<Record<string, UserProfile>>({});

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const threadsRef = collection(db, 'threads');
        const messagesRef = collection(db, 'messages');
        
        const q = query(
            threadsRef,
            where('participantUserIds', 'array-contains', userId),
            orderBy('lastMessageAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const tempThreads: Thread[] = [];
            const userIdsToFetch = new Set<string>();

            // 1. Collect threads and identify missing profiles
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Thread;
                tempThreads.push({ ...data, threadId: doc.id });
                
                const otherUserId = data.participantUserIds.find(id => id !== userId);
                if (otherUserId && !profileCache.current[otherUserId]) {
                    userIdsToFetch.add(otherUserId);
                }
            });

            // 2. Batch fetch missing profiles
            if (userIdsToFetch.size > 0) {
                const idsArray = Array.from(userIdsToFetch);
                // Firestore 'in' query limit is 10. Chunk if necessary (simplified here for <10)
                // For production with >10 concurrent chats with NEW users, need chunking.
                const chunks = [];
                for (let i = 0; i < idsArray.length; i += 10) {
                    chunks.push(idsArray.slice(i, i + 10));
                }

                for (const chunk of chunks) {
                    try {
                        const profilesQuery = query(
                            collection(db, 'profiles'),
                            where(documentId(), 'in', chunk)
                        );
                        const profilesSnap = await getDocs(profilesQuery);
                        profilesSnap.forEach(doc => {
                            profileCache.current[doc.id] = doc.data() as UserProfile;
                        });
                    } catch (error) {
                        console.error("Error batch fetching profiles:", error);
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
                        const messagesQuery = query(
                            messagesRef,
                            where('threadId', '==', thread.threadId),
                            where('senderUserId', '==', otherUserId),
                            where('isRead', '==', false)
                        );
                        // We just need the count, not the docs. But count() aggregation is server-side.
                        // For client SDK, getting docs size is standard unless using count() aggregation query (v9.14+)
                        // Using getDocs for now as it's standard.
                        const messagesSnapshot = await getDocs(messagesQuery);
                        unreadCount = messagesSnapshot.size;
                    } catch (error) {
                        console.error('Error fetching unread count:', error);
                    }
                }

                return {
                    ...thread,
                    otherUserProfile,
                    unreadCount
                };
            }));

            // 4. Sort (redundant if query is ordered, but good for safety after async ops)
            threadsData.sort((a, b) => {
                const dateA = a.lastMessageAt?.toDate().getTime() || 0;
                const dateB = b.lastMessageAt?.toDate().getTime() || 0;
                return dateB - dateA;
            });

            setThreads(threadsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { threads, loading };
};
```





