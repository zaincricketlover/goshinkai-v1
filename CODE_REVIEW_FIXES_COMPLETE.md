# Goshinenkai V2 - 修正完了コード（外部エンジニア確認用）

## 📋 修正概要

外部エンジニアレビューに基づき以下を修正しました：
- 🔴 高優先度: Message型修正、招待コードシステム全面改修、Navbar typo修正
- 🟡 中優先度: 管理画面ダークテーマ統一、招待コード管理画面新規作成、プロフィール改善
- 🟢 低優先度: AuthContext拡張、プロフィール編集UX改善

---

## 修正ファイル一覧

### 1. `src/lib/types.ts`

**変更内容**: InviteCode/InviteUsage型追加、UserProfileに紹介フィールド追加、Message.isRead修正

```typescript
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
    websiteUrl?: string;
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
    lastActiveAt?: Timestamp;
    referredBy?: string;      // 誰に紹介されたか
    referralCount?: number;    // 紹介した人数（デフォルト0）
    inviteCode?: string;      // 自分の招待コード
    createdAt: Timestamp;
}

export interface Event {
    id: string;
    venueId: string;
    title: string;
    description: string;
    location: string;
    locationUrl?: string;
    imageUrl?: string;
    dateTime: Timestamp;
    endTime?: Timestamp;
    isOpenToAllVenues: boolean;
    maxParticipants?: number;
    createdAt: Timestamp;
}

export interface EventParticipant {
    id?: string;
    eventId: string;
    userId: string;
    status: ParticipationStatus;
    checkedInAt?: Timestamp;
    pointsAwarded?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Interest {
    id: string;
    fromUserId: string;
    toUserId: string;
    createdAt: Timestamp;
}

export interface Thread {
    threadId: string;
    participantUserIds: string[];
    createdAt: Timestamp;
    lastMessageAt?: Timestamp;
    lastMessageText?: string;
    lastMessageSenderId?: string;
}

export interface Message {
    messageId: string;
    threadId: string;
    senderUserId: string;
    text: string;
    isTemplate: boolean;
    createdAt: Timestamp;
    isRead: boolean;  // ← readAt から isRead に変更
}

// 招待コード（改善版）
export interface InviteCode {
    code: string;
    createdBy: string;        // 作成者（紹介者）のuserId
    createdAt: Timestamp;
    isActive: boolean;        // 無効化可能
    useCount: number;         // 使用回数
    maxUses?: number | null;  // 最大使用回数（nullなら無制限）
}

// 招待使用履歴
export interface InviteUsage {
    id: string;
    inviteCode: string;
    usedBy: string;           // 使用者のuserId
    referredBy: string;       // 紹介者のuserId
    usedAt: Timestamp;
    pointsAwarded: number;    // 紹介者に付与したポイント
}
```

---

### 2. `src/components/auth/RegisterForm.tsx`

**変更内容**: 招待コードシステム全面改修（複数人招待、紹介ポイント付与、紹介者記録）

```typescript
"use client";

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
    collection, query, where, getDocs, doc, setDoc,
    updateDoc, addDoc, increment, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserProfile } from '@/lib/types';
import { Mail, Lock, Key, User } from 'lucide-react';

const REFERRAL_POINTS = 50; // 紹介ポイント

// ユニークな招待コードを生成
const generateInviteCode = (userId: string): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${code}-${userId.slice(0, 4).toUpperCase()}`;
};

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
            // 1. 招待コードを検証（isActive かつ maxUses未満）
            const invitesRef = collection(db, 'invites');
            const q = query(
                invitesRef,
                where('code', '==', inviteCode.toUpperCase().trim()),
                where('isActive', '==', true)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('無効な招待コードです。');
                setLoading(false);
                return;
            }

            const inviteDoc = querySnapshot.docs[0];
            const inviteData = inviteDoc.data();

            // maxUsesが設定されていて、超えている場合
            if (inviteData.maxUses && inviteData.useCount >= inviteData.maxUses) {
                setError('この招待コードは使用上限に達しています。');
                setLoading(false);
                return;
            }

            const referrerId = inviteData.createdBy; // 紹介者のID

            // 2. Firebase Auth ユーザー作成
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. 新規ユーザー用の招待コードを生成
            const newUserInviteCode = generateInviteCode(user.uid);

            // 4. ユーザープロフィール作成
            const userProfile: UserProfile = {
                userId: user.uid,
                name: name,
                kana: '',
                avatarUrl: '',
                companyName: '',
                title: '',
                homeVenueId: 'osaka',
                industries: [],
                wantTags: [],
                giveTags: [],
                catchCopy: '',
                bio: '',
                rankBadge: 'WHITE',
                rankScore: 0,
                unlockedVenueIds: ['osaka'],
                referredBy: referrerId,        // 紹介者を記録
                referralCount: 0,              // 初期値
                inviteCode: newUserInviteCode, // 自分の招待コード
                createdAt: serverTimestamp() as Timestamp,
            };

            await setDoc(doc(db, 'profiles', user.uid), userProfile);

            // 5. 招待コードの使用回数をインクリメント
            await updateDoc(doc(db, 'invites', inviteDoc.id), {
                useCount: increment(1)
            });

            // 6. 招待使用履歴を記録
            await addDoc(collection(db, 'inviteUsages'), {
                inviteCode: inviteCode.toUpperCase().trim(),
                usedBy: user.uid,
                referredBy: referrerId,
                usedAt: serverTimestamp(),
                pointsAwarded: REFERRAL_POINTS,
            });

            // 7. 紹介者にポイント付与 & 紹介人数カウントアップ
            if (referrerId && referrerId !== 'system') {
                const referrerRef = doc(db, 'profiles', referrerId);
                await updateDoc(referrerRef, {
                    rankScore: increment(REFERRAL_POINTS),
                    referralCount: increment(1),
                });
            }

            // 8. 新規ユーザーの招待コードをinvitesコレクションに追加
            await addDoc(collection(db, 'invites'), {
                code: newUserInviteCode,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                isActive: true,
                useCount: 0,
                maxUses: null, // 無制限
            });

            // 9. ホームへリダイレクト
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
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    placeholder="ABC123-XXXX"
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

### 3. `firestore.rules`

**変更内容**: invites/inviteUsages用のセキュリティルール追加

```javascript
// 抜粋：招待コード関連のルールのみ

// Invites - 改善版
match /invites/{inviteId} {
  allow read: if true; // 検証用に読み取り許可
  allow create: if isAuthenticated(); // 新規ユーザーも自分のコード作成可能
  // update: useCount のインクリメントのみ許可
  allow update: if isAuthenticated() 
      && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['useCount'])
      && request.resource.data.useCount == resource.data.useCount + 1;
}

// InviteUsages - 新規追加
match /inviteUsages/{usageId} {
  allow read: if isAuthenticated() && (
      resource.data.usedBy == request.auth.uid || 
      resource.data.referredBy == request.auth.uid ||
      isAdmin()
  );
  allow create: if isAuthenticated() && request.resource.data.usedBy == request.auth.uid;
}
```

---

### 4. `src/components/ui/Navbar.tsx`

**変更内容**: typo修正（focus:out line-none → focus:outline-none）

Line 91:
```typescript
className="focus:outline-none"  // ← 修正済み
```

---

### 5. `src/app/admin/invites/page.tsx`（新規作成）

**機能**: 招待コード管理（発行、有効/無効切替、使用履歴表示）

完全なコードは272行なので、ポイントのみ記載：
- 招待コード発行（手動 or 自動生成）
- 最大使用回数設定
- 有効/無効切り替え
- 使用履歴テーブル（誰が誰を招待したか）
- ワンクリックコピー機能

---

### 6. `src/components/profile/ProfileInfo.tsx`

**変更内容**: 自分のプロフィールに招待コード表示追加

```typescript
// 抜粋：招待コードセクション
{isOwnProfile && profile.inviteCode && (
    <Card className="border-accent/20">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">あなたの招待コード</h3>
                <p className="text-2xl font-mono font-bold text-gradient-gold">
                    {profile.inviteCode}
                </p>
            </div>
            <Button variant="outline" size="sm" onClick={copyInviteCode}>
                <Copy className="w-4 h-4 mr-2" />
                コピー
            </Button>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center text-gray-400">
                <Users className="w-4 h-4 mr-2" />
                <span className="text-sm">紹介した人数</span>
            </div>
            <span className="text-xl font-bold text-white">{profile.referralCount || 0}人</span>
        </div>
    </Card>
)}
```

---

### 7. `src/context/AuthContext.tsx`

**変更内容**: refreshProfile 関数追加

```typescript
// 抜粋
const refreshProfile = async () => {
    if (!user) return;
    
    try {
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
            setProfile(profileSnap.data() as UserProfile);
        }
    } catch (error) {
        console.error("[AuthContext] Error refreshing profile:", error);
    }
};

// Provider value に追加
<AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
```

---

### 8. 管理画面ダークテーマ化

以下のファイルをダークテーマに統一：
- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/events/page.tsx`
- `src/app/setup/page.tsx`

主な変更：
- `bg-gray-100` → `bg-primary`
- `text-gray-900` → `text-white`
- Card背景を `glass` クラスに
- アイコン追加（Users, Calendar, Ticket, TrendingUp）

---

## ✅ 検証項目

### 招待コードシステム
1. ✅ 1つのコードで複数人招待可能
2. ✅ 紹介者に50ポイント自動付与
3. ✅ 紹介人数カウントアップ
4. ✅ 新規ユーザーに招待コード自動発行
5. ✅ 管理画面で使用履歴確認可能

### Message型
6. ✅ useMessages.ts で isRead 参照
7. ✅ types.ts で isRead: boolean 定義

### UI改善
8. ✅ 全管理画面ダークテーマ統一
9. ✅ プロフィールに招待コード表示
10. ✅ プロフィール編集後に即座反映（refreshProfile）

---

## 📝 注意事項

### 既存データとの互換性
既存ユーザーには `referralCount`, `inviteCode` がないため、コード上で安全にハンドリング：
```typescript
profile.referralCount || 0
profile.inviteCode || null
```

### Firestore インデックス
以下のクエリで複合インデックスが必要になる可能性があります：
- `invites`: `code (ASC), isActive (ASC)`
- `inviteUsages`: `referredBy (ASC), usedAt (DESC)`

エラーが出た場合、Firebaseコンソールでインデックス作成してください。

---

## 🚀 次のステップ（オプション）

1. **招待コードの統計ダッシュボード** - どのコードが最も使われているか可視化
2. **招待報酬の段階的増加** - 5人紹介でボーナス、10人紹介でランクアップ
3. **プロフィール編集モーダル化** - 別ページではなくモーダルで編集

---

以上、すべての修正が完了しました。
