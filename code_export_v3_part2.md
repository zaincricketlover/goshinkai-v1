# Goshinkai V2 - Code Export Part 2

**続き** - スタイル、コンテキスト、フック、UIコンポーネント

---

## 2. スタイル

### `src/app/globals.css`
```css
@import "tailwindcss";

:root {
  /* Primary - Deep Navy/Black */
  --color-primary: #0A0F1C;
  --color-primary-light: #1A1F2E;
  --color-primary-dark: #050810;

  /* Accent - Champagne Gold */
  --color-accent: #C9A962;
  --color-accent-light: #E5D4A1;
  --color-accent-dark: #9A7B3A;

  /* Surface */
  --color-surface: #12171F;
  --color-surface-elevated: #1E2430;

  /* Text */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A0AEC0;
  --color-text-muted: #64748B;

  /* Status */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Rank Badge Colors */
  --rank-white: #F8FAFC;
  --rank-blue: #3B82F6;
  --rank-silver: #94A3B8;
  --rank-gold: #F59E0B;
  --rank-diamond: #38BDF8;
  --rank-platinum: #A78BFA;

  --font-geist-sans: "Geist", "Noto Sans JP", sans-serif;
  --font-geist-mono: "Geist Mono", monospace;
}

@theme {
  --color-primary: var(--color-primary);
  --color-primary-light: var(--color-primary-light);
  --color-primary-dark: var(--color-primary-dark);

  --color-accent: var(--color-accent);
  --color-accent-light: var(--color-accent-light);
  --color-accent-dark: var(--color-accent-dark);

  --color-surface: var(--color-surface);
  --color-surface-elevated: var(--color-surface-elevated);

  --color-text-primary: var(--color-text-primary);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-muted: var(--color-text-muted);

  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-error: var(--color-error);

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
  font-family: var(--font-geist-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Glassmorphism Utilities */
.glass {
  background: rgba(30, 36, 48, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-hover:hover {
  background: rgba(30, 36, 48, 0.85);
  border-color: rgba(201, 169, 98, 0.3);
}

/* Gold Gradient Text */
.text-gradient-gold {
  background: linear-gradient(135deg, #E5D4A1 0%, #C9A962 50%, #9A7B3A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Gold Border Gradient */
.border-gradient-gold {
  position: relative;
  background: linear-gradient(var(--color-surface), var(--color-surface)) padding-box,
    linear-gradient(135deg, #E5D4A1, #C9A962) border-box;
  border: 2px solid transparent;
  border-radius: 9999px;
}

/* Scrollbar Hide */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### `src/app/layout.tsx`
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

## 3. コンテキスト・フック

### `src/context/AuthContext.tsx`
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

### `src/hooks/useMessages.ts`
```typescript
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Thread, UserProfile, Message } from '@/lib/types';

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
        const q = query(
            threadsRef,
            where('participantUserIds', 'array-contains', userId)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const tempThreads: Thread[] = [];
            const userIdsToFetch = new Set<string>();

            // 1. Collect threads and identify missing profiles
            snapshot.docs.forEach(doc => {
                const data = doc.data() as Thread;
                data.threadId = doc.id;
                tempThreads.push(data);

                const otherId = data.participantUserIds.find(id => id !== userId);
                if (otherId && !profileCache.current[otherId]) {
                    userIdsToFetch.add(otherId);
                }
            });

            // 2. Batch fetch missing profiles
            if (userIdsToFetch.size > 0) {
                const ids = Array.from(userIdsToFetch);
                // Firestore 'in' query limit is 30. Chunk if needed.
                const chunkSize = 10;
                for (let i = 0; i < ids.length; i += chunkSize) {
                    const chunk = ids.slice(i, i + chunkSize);
                    try {
                        const profilesQuery = query(
                            collection(db, 'profiles'),
                            where(documentId(), 'in', chunk)
                        );
                        const profilesSnap = await getDocs(profilesQuery);
                        profilesSnap.forEach(pDoc => {
                            profileCache.current[pDoc.id] = pDoc.data() as UserProfile;
                        });
                    } catch (e) {
                        console.error("Error fetching profiles batch:", e);
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
                        const messagesRef = collection(db, 'messages');
                        const messagesQuery = query(
                            messagesRef,
                            where('threadId', '==', thread.threadId),
                            where('senderUserId', '==', otherUserId),
                            where('isRead', '==', false)
                        );
                        const messagesSnapshot = await getDocs(messagesQuery);
                        unreadCount = messagesSnapshot.size;
                    } catch (error) {
                        console.error('Error fetching unread count:', error);
                    }
                }

                return {
                    ...thread,
                    otherUserProfile,
                    unreadCount,
                };
            }));

            // 4. Sort
            threadsData.sort((a, b) => {
                const timeA = a.lastMessageAt?.toMillis() || 0;
                const timeB = b.lastMessageAt?.toMillis() || 0;
                return timeB - timeA;
            });

            setThreads(threadsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { threads, loading };
};
```

---

## 4. UIコンポーネント

### `src/components/ui/Button.tsx`
```tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger';
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
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1C] disabled:opacity-50 disabled:pointer-events-none active:scale-95';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg shadow-blue-900/20',
        secondary: 'bg-surface-elevated text-white hover:bg-gray-700 focus:ring-gray-500 border border-white/10',
        outline: 'border border-white/20 bg-transparent hover:bg-white/5 text-white focus:ring-blue-500',
        ghost: 'bg-transparent hover:bg-white/5 text-gray-300 hover:text-white focus:ring-gray-500',
        gold: 'bg-gradient-to-r from-[#E5D4A1] via-[#C9A962] to-[#9A7B3A] text-[#0A0F1C] hover:brightness-110 focus:ring-[#C9A962] shadow-lg shadow-[#C9A962]/20 font-bold',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-6 text-base',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {children}
        </button>
    );
};
```

### `src/components/ui/Card.tsx`
```tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    title,
    description,
    action,
    ...props
}) => {
    return (
        <motion.div 
            className={cn("glass rounded-2xl overflow-hidden", className)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            {...props}
        >
            {(title || description || action) && (
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-start">
                    <div>
                        {title && <h3 className="text-lg font-bold leading-6 text-white">{title}</h3>}
                        {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="px-6 py-4">
                {children}
            </div>
        </motion.div>
    );
};
```

### `src/components/ui/Input.tsx`
```tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    id,
    icon,
    ...props
}) => {
    const inputId = id || props.name;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    {...props}
                    id={inputId}
                    className={cn(
                        "w-full bg-surface-elevated border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all",
                        icon && "pl-10",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                />
            </div>
            {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        </div>
    );
};
```

### `src/components/ui/Avatar.tsx`
```tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { RankBadge } from '@/lib/types';

interface AvatarProps {
    src?: string | null;
    alt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    rank?: RankBadge;
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    size = 'md',
    rank,
    className
}) => {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-14 w-14',
        xl: 'h-20 w-20',
        '2xl': 'h-32 w-32',
    };

    const getBorderColor = (rank?: RankBadge) => {
        if (!rank) return 'border-white/10';
        switch (rank) {
            case 'GOLD': return 'border-[#C9A962]';
            case 'DIAMOND': return 'border-[#38BDF8]';
            case 'PLATINUM': return 'border-[#A78BFA]';
            default: return 'border-white/10';
        }
    };

    return (
        <div className={cn(
            "relative rounded-full overflow-hidden bg-surface-elevated flex items-center justify-center border-2",
            sizeClasses[size],
            getBorderColor(rank),
            className
        )}>
            {src ? (
                <img src={src} alt={alt} className="h-full w-full object-cover" />
            ) : (
                <span className={cn(
                    "font-bold text-gray-400",
                    size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-xl'
                )}>
                    {alt.charAt(0)}
                </span>
            )}
        </div>
    );
};
```

### `src/components/ui/Badge.tsx`
```tsx
import React from 'react';
import { RankBadge as RankBadgeType } from '@/lib/types';
import { RANK_BADGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BadgeProps {
    rank: RankBadgeType;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
    rank,
    className,
    size = 'md',
    showLabel = true
}) => {
    const config = RANK_BADGES[rank];

    const sizeClasses = {
        sm: 'h-5 px-2 text-[10px]',
        md: 'h-6 px-2.5 text-xs',
        lg: 'h-8 px-3 text-sm',
    };

    // Special effects for high ranks
    const isPremium = ['GOLD', 'DIAMOND', 'PLATINUM'].includes(rank);

    return (
        <span
            className={cn(
                "inline-flex items-center justify-center rounded-full font-bold tracking-wide transition-all",
                sizeClasses[size],
                isPremium ? "shadow-lg" : "bg-surface-elevated border border-white/10 text-gray-300",
                className
            )}
            style={isPremium ? {
                background: rank === 'GOLD' ? 'linear-gradient(135deg, #E5D4A1, #C9A962)' :
                    rank === 'DIAMOND' ? 'linear-gradient(135deg, #38BDF8, #0EA5E9)' :
                        rank === 'PLATINUM' ? 'linear-gradient(135deg, #A78BFA, #8B5CF6)' : undefined,
                color: '#0A0F1C',
                boxShadow: `0 2px 10px ${config.color}40`
            } : undefined}
        >
            {rank === 'DIAMOND' && <span className="mr-1">💎</span>}
            {rank === 'PLATINUM' && <span className="mr-1">👑</span>}
            {showLabel ? config.label : rank}
        </span>
    );
};
```

### `src/components/ui/Navbar.tsx`
```tsx
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Bell, MessageCircle, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { threads } = useMessages(user?.uid);

    const unreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);

    if (!user) return null;

    const isHome = pathname === '/home' || pathname === '/';

    const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
        const isActive = pathname.startsWith(href);
        return (
            <button
                onClick={() => router.push(href)}
                className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                        ? "text-accent bg-white/5"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
            >
                <Icon className="w-4 h-4 mr-2" />
                {label}
            </button>
        );
    };

    return (
        <nav className="bg-surface/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        {!isHome && (
                            <button
                                onClick={() => router.back()}
                                className="mr-4 p-1 rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={() => router.push('/home')}
                            className="text-xl font-bold flex items-center tracking-wider"
                        >
                            <span className="text-gradient-gold mr-2 text-2xl">伍心会</span>
                            <span className="text-xs text-gray-500 hidden sm:block mt-1">EXECUTIVE CLUB</span>
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2">
                        <NavLink href="/events" label="イベント" icon={Calendar} />
                        <NavLink href="/members" label="メンバー" icon={Users} />
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface"></span>
                        </button>

                        <button
                            onClick={() => router.push('/messages')}
                            className="p-2 text-gray-400 hover:text-white transition-colors relative"
                        >
                            <MessageCircle className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center border-2 border-surface">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => router.push(`/profile/${user.uid}`)}
                            className="focus:out line-none"
                        >
                            <Avatar
                                src={profile?.avatarUrl}
                                alt={profile?.name || 'User'}
                                size="sm"
                                rank={profile?.rankBadge}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
```

### `src/components/ui/BottomNavigation.tsx`
```tsx
"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Calendar, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';

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
        { icon: MessageCircle, label: 'トーク', path: '/messages', badge: unreadCount },
        { icon: User, label: 'マイページ', path: `/profile/${user.uid}` },
    ];

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
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
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
```

---

**出力状況**: Part 2 完了 (Styles, Context, Hooks, UI Components)
**次回**: 認証コンポーネント、Homeコンポーネント、Membersコンポーネント、Eventsコンポーネント...

「続きを出力して」でPart 3へ進みます。
