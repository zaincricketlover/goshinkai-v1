# Goshinkai V2 - Code Export Part 3

**続き** - ランディング、Home、Admin、Auth、Setup

---

## 5. ページ (Pages)

### `src/app/page.tsx` (ランディングページ)
```tsx
"use client";

import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-gradient-gold tracking-tight mb-2">
            伍心会
          </h2>
          <p className="text-sm text-gray-400 tracking-[0.2em] uppercase">
            Executive Members Club
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Card className="border-white/10 shadow-2xl shadow-black/50">
          <div className="mb-6 flex justify-center space-x-4 border-b border-white/10 pb-4">
            <button
              onClick={() => setIsLogin(true)}
              className={`pb-2 text-sm font-medium transition-all ${isLogin
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              ログイン
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`pb-2 text-sm font-medium transition-all ${!isLogin
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              新規登録
            </button>
          </div>

          {isLogin ? <LoginForm /> : <RegisterForm />}
        </Card>

        <p className="mt-8 text-center text-xs text-gray-600">
          &copy; 2024 Goshinkai. All rights reserved.
        </p>
      </div>
    </div>
  );
}
```

### `src/app/home/page.tsx`
```tsx
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { MemberCard } from '@/components/home/MemberCard';
import { EventCountdown } from '@/components/home/EventCountdown';
import { ActionCards } from '@/components/home/ActionCards';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { staggerContainer, slideUp } from '@/lib/animations';

export default function HomePage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div></div>;

    if (!user || !profile) {
        router.push('/');
        return null;
    }

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-primary pb-20">
            <motion.div 
                className="max-w-md mx-auto px-4 py-6 space-y-8"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
            >
                {/* Member Card Section */}
                <motion.section variants={slideUp}>
                    <MemberCard profile={profile} />
                </motion.section>

                {/* Event Countdown Section */}
                <motion.section variants={slideUp}>
                    <EventCountdown />
                </motion.section>

                {/* Action Cards Section */}
                <motion.section variants={slideUp}>
                    <h3 className="text-lg font-bold text-white mb-4 px-1">ダッシュボード</h3>
                    <ActionCards />
                </motion.section>

                {/* Logout (Temporary location) */}
                <motion.div variants={slideUp} className="pt-8 text-center">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-red-400"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        ログアウト
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
```

### `src/app/setup/page.tsx`
```tsx
"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function SetupPage() {
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');

    const handleCreateInvite = async () => {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (!apiKey || !projectId) {
            alert("Firebase設定が見つかりません。.env.localを確認してください。");
            return;
        }

        if (!code) {
            alert("コードを入力してください");
            return;
        }

        try {
            setMessage("処理中... (認証接続テスト)");

            // Dynamic import to avoid SSR issues with Auth if any
            const { signInAnonymously } = await import("firebase/auth");
            const { auth } = await import("@/lib/firebase");

            await signInAnonymously(auth);

            setMessage("処理中... (Firestore書き込み)");

            // Step 2: Try Firestore with timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestoreへの接続がタイムアウトしました。ネットワーク接続やFirebase設定を確認してください。")), 5000)
            );

            const colRef = collection(db, 'invites');

            await Promise.race([
                addDoc(colRef, {
                    code,
                    invitedByUserId: 'system',
                    usedByUserId: null,
                    createdAt: serverTimestamp(),
                }),
                timeoutPromise
            ]);

            setMessage(`招待コード "${code}" を作成しました。`);
            alert(`成功！招待コード "${code}" を作成しました。`);
            setCode('');
        } catch (error: any) {
            console.error("Detailed Error:", error);
            setMessage(`エラー: ${error.message}`);
            alert(`エラーが発生しました:\n${error.message}\n\nコンソールのログ設定値を確認してください。`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <Card title="初期データセットアップ">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-900">招待コード作成</h4>
                            <div className="mt-2 flex gap-2">
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="INVITE-CODE"
                                />
                                <Button onClick={handleCreateInvite}>作成</Button>
                            </div>
                        </div>
                        {message && (
                            <div className="p-2 bg-blue-50 text-blue-700 rounded text-sm">
                                {message}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
```

---

## 6. 認証コンポーネント

### `src/components/auth/LoginForm.tsx`
```tsx
"use client";

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, Lock } from 'lucide-react';

export const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/home');
        } catch (err: any) {
            console.error(err);
            setError('メールアドレスまたはパスワードが正しくありません。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <Input
                    label="メールアドレス"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    icon={<Mail className="w-5 h-5" />}
                />
                <Input
                    label="パスワード"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    icon={<Lock className="w-5 h-5" />}
                />
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <Button type="submit" className="w-full" variant="gold" size="lg" isLoading={loading}>
                ログイン
            </Button>
        </form>
    );
};
```

### `src/components/auth/RegisterForm.tsx`
```tsx
"use client";

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserProfile } from '@/lib/types';
import { Mail, Lock, Key, User } from 'lucide-react';

export const RegisterForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Validate Invite Code
            const invitesRef = collection(db, 'invites');
            const q = query(invitesRef, where('code', '==', inviteCode), where('isUsed', '==', false));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('無効な招待コードか、既に使用されています。');
                setLoading(false);
                return;
            }

            const inviteDoc = querySnapshot.docs[0];

            // 2. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Create User Profile
            const userProfile: UserProfile = {
                userId: user.uid,
                name: name,
                kana: '',
                avatarUrl: '',
                companyName: '',
                title: '',
                homeVenueId: 'osaka', // Default
                industries: [],
                wantTags: [],
                giveTags: [],
                catchCopy: '',
                bio: '',
                rankBadge: 'WHITE',
                rankScore: 0,
                unlockedVenueIds: ['osaka'],
                createdAt: serverTimestamp() as Timestamp,
            };

            await setDoc(doc(db, 'profiles', user.uid), userProfile);

            // 4. Mark Invite as Used
            await updateDoc(doc(db, 'invites', inviteDoc.id), {
                isUsed: true,
                usedByUserId: user.uid,
                usedAt: serverTimestamp()
            });

            // 5. Redirect to Home
            router.push('/home');

        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('このメールアドレスは既に登録されています。');
            } else if (err.code === 'auth/weak-password') {
                setError('パスワードは6文字以上で入力してください。');
            } else {
                setError(err.message || '登録中にエラーが発生しました。');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <Input
                    label="招待コード"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    required
                    placeholder="INVITE-CODE"
                    icon={<Key className="w-5 h-5" />}
                />
                <Input
                    label="お名前"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="山田 太郎"
                    icon={<User className="w-5 h-5" />}
                />
                <Input
                    label="メールアドレス"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    icon={<Mail className="w-5 h-5" />}
                />
                <Input
                    label="パスワード"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    icon={<Lock className="w-5 h-5" />}
                />
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <Button type="submit" className="w-full" variant="gold" size="lg" isLoading={loading}>
                アカウント作成
            </Button>
        </form>
    );
};
```

---

## 7. 管理者機能

### `src/app/admin/page.tsx`
```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { isAdmin } from '@/lib/permissions';
import { UserProfile } from '@/lib/types';

export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        rankDistribution: {} as Record<string, number>,
        totalEvents: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user || !profile || !isAdmin(profile)) {
            router.push('/');
            return;
        }

        const fetchStats = async () => {
            try {
                // Fetch Users
                const usersSnap = await getDocs(collection(db, 'profiles'));
                const totalUsers = usersSnap.size;
                const rankDistribution: Record<string, number> = {};

                usersSnap.forEach(doc => {
                    const data = doc.data() as UserProfile;
                    const rank = data.rankBadge || 'WHITE';
                    rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
                });

                // Fetch Events
                const eventsSnap = await getDocs(collection(db, 'events'));
                const totalEvents = eventsSnap.size;

                setStats({
                    totalUsers,
                    rankDistribution,
                    totalEvents,
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, profile, authLoading, router]);

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (!user || !profile || !isAdmin(profile)) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">管理者ダッシュボード</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-500">総会員数</h3>
                            <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalUsers}</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-500">総イベント数</h3>
                            <p className="text-4xl font-bold text-green-600 mt-2">{stats.totalEvents}</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-500">プラチナ会員</h3>
                            <p className="text-4xl font-bold text-purple-600 mt-2">
                                {stats.rankDistribution['PLATINUM'] || 0}
                            </p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="ランク分布">
                        <div className="space-y-4">
                            {Object.entries(stats.rankDistribution).map(([rank, count]) => (
                                <div key={rank} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">{rank}</span>
                                    <div className="flex items-center flex-1 mx-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="クイックアクション">
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-medium text-gray-900">ユーザー管理</span>
                                <span className="text-gray-400">→</span>
                            </button>
                            <button
                                onClick={() => router.push('/admin/events')}
                                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-medium text-gray-900">イベント管理</span>
                                <span className="text-gray-400">→</span>
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
```

### `src/app/admin/events/page.tsx`
```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { isAdmin } from '@/lib/permissions';
import { Event, VenueId } from '@/lib/types';

export default function AdminEventsPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [location, setLocation] = useState('');
    const [venueId, setVenueId] = useState<VenueId>('osaka');
    const [isOpenToAllVenues, setIsOpenToAllVenues] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!user || !profile || !isAdmin(profile)) {
            router.push('/');
            return;
        }

        fetchEvents();
    }, [user, profile, authLoading, router]);

    const fetchEvents = async () => {
        try {
            const eventsSnap = await getDocs(collection(db, 'events'));
            const eventsList: Event[] = [];
            eventsSnap.forEach(doc => {
                eventsList.push({ id: doc.id, ...doc.data() } as Event);
            });
            // Sort by date desc
            eventsList.sort((a, b) => b.dateTime.seconds - a.dateTime.seconds);
            setEvents(eventsList);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('イベントを作成しますか？')) return;
        setCreating(true);

        try {
            await addDoc(collection(db, 'events'), {
                title,
                description,
                dateTime: Timestamp.fromDate(new Date(dateTime)),
                location,
                venueId,
                isOpenToAllVenues,
                createdBy: user?.uid,
                createdAt: Timestamp.now(),
            });

            alert('イベントを作成しました');
            // Reset form
            setTitle('');
            setDescription('');
            setDateTime('');
            setLocation('');
            setVenueId('osaka');
            setIsOpenToAllVenues(false);

            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            alert('作成に失敗しました');
        } finally {
            setCreating(false);
        }
    };

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (!user || !profile || !isAdmin(profile)) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">イベント管理</h1>
                    <Button onClick={() => router.push('/admin')} variant="outline">
                        ダッシュボードに戻る
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Event Form */}
                    <div className="lg:col-span-1">
                        <Card title="新規イベント作成">
                            <form onSubmit={handleCreateEvent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">タイトル</label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        placeholder="例: 大阪交流会"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">日時</label>
                                    <Input
                                        type="datetime-local"
                                        value={dateTime}
                                        onChange={(e) => setDateTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">場所</label>
                                    <Input
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        required
                                        placeholder="例: 梅田スカイビル"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">開催拠点</label>
                                    <select
                                        value={venueId}
                                        onChange={(e) => setVenueId(e.target.value as VenueId)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        <option value="osaka">大阪</option>
                                        <option value="kobe">神戸</option>
                                        <option value="tokyo">東京</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">詳細</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        rows={4}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="isOpenToAllVenues"
                                        type="checkbox"
                                        checked={isOpenToAllVenues}
                                        onChange={(e) => setIsOpenToAllVenues(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isOpenToAllVenues" className="ml-2 block text-sm text-gray-900">
                                        全拠点参加可能にする
                                    </label>
                                </div>
                                <Button type="submit" isLoading={creating} className="w-full">
                                    作成する
                                </Button>
                            </form>
                        </Card>
                    </div>

                    {/* Event List */}
                    <div className="lg:col-span-2">
                        <Card title="イベント一覧">
                            <div className="space-y-4">
                                {events.map((event) => (
                                    <div key={event.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {event.dateTime.toDate().toLocaleString()} @ {event.location} ({event.venueId})
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => router.push(`/events/${event.id}`)}>
                                                詳細
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
```

### `src/app/admin/users/page.tsx`
```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { isAdmin } from '@/lib/permissions';
import { UserProfile, RankBadge } from '@/lib/types';

const RANK_OPTIONS: RankBadge[] = ['WHITE', 'BLUE', 'SILVER', 'GOLD', 'DIAMOND', 'PLATINUM'];
const SUPER_ADMIN_EMAIL = 'info@sandudm.com';

export default function AdminUsersPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user || !profile || !isAdmin(profile)) {
            router.push('/');
            return;
        }

        const fetchUsers = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'profiles'));
                const usersList: UserProfile[] = [];
                usersSnap.forEach(doc => {
                    usersList.push(doc.data() as UserProfile);
                });
                setUsers(usersList);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user, profile, authLoading, router]);

    const handleRankChange = async (userId: string, newRank: RankBadge) => {
        if (!confirm(`ユーザーのランクを ${newRank} に変更しますか？`)) return;
        setUpdating(userId);
        try {
            const userRef = doc(db, 'profiles', userId);
            await updateDoc(userRef, { rankBadge: newRank });

            setUsers(users.map(u => u.userId === userId ? { ...u, rankBadge: newRank } : u));
            alert('ランクを更新しました');
        } catch (error) {
            console.error('Error updating rank:', error);
            alert('更新に失敗しました');
        } finally {
            setUpdating(null);
        }
    };

    const handleToggleAdmin = async (targetUser: UserProfile) => {
        if (user?.email !== SUPER_ADMIN_EMAIL) {
            alert('管理者権限の変更はスーパー管理者のみ可能です。');
            return;
        }

        const newStatus = !targetUser.isAdmin;
        const message = newStatus
            ? `${targetUser.name} を管理者に設定しますか？`
            : `${targetUser.name} の管理者権限を解除しますか？`;

        if (!confirm(message)) return;

        setUpdating(targetUser.userId);
        try {
            const userRef = doc(db, 'profiles', targetUser.userId);
            await updateDoc(userRef, { isAdmin: newStatus });

            setUsers(users.map(u => u.userId === targetUser.userId ? { ...u, isAdmin: newStatus } : u));
            alert('権限を更新しました');
        } catch (error) {
            console.error('Error updating admin status:', error);
            alert('更新に失敗しました');
        } finally {
            setUpdating(null);
        }
    };

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (!user || !profile || !isAdmin(profile)) return null;

    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
                    <Button onClick={() => router.push('/admin')} variant="outline">
                        ダッシュボードに戻る
                    </Button>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">会社・役職</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">拠点</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ランク</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">権限</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u.userId}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold mr-3">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                                    <div className="text-sm text-gray-500">{u.userId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{u.companyName}</div>
                                            <div className="text-sm text-gray-500">{u.title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {u.homeVenueId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                                {u.rankBadge}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.isAdmin ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                                            <select
                                                value={u.rankBadge}
                                                onChange={(e) => handleRankChange(u.userId, e.target.value as RankBadge)}
                                                disabled={updating === u.userId}
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md mb-2"
                                            >
                                                {RANK_OPTIONS.map(rank => (
                                                    <option key={rank} value={rank}>{rank}</option>
                                                ))}
                                            </select>

                                            {isSuperAdmin && u.userId !== user.uid && (
                                                <Button
                                                    size="sm"
                                                    variant={u.isAdmin ? "outline" : "primary"}
                                                    onClick={() => handleToggleAdmin(u)}
                                                    isLoading={updating === u.userId}
                                                    className="w-full"
                                                >
                                                    {u.isAdmin ? '管理者解除' : '管理者にする'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
```

---

**出力状況**: Part 3 完了 (Landing, Home, Setup, Auth, Admin)
**出力済み**: Part 1 (設定・型定義), Part 2 (スタイル、コンテキスト、UI), Part 3 (ページ・Auth・Admin)

残りのコンポーネント（Home, Members, Events, Messages, Profile）は必要に応じて追加でお送りします。
