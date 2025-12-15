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
                // Avoid 'undefined' value for Firestore
                referredBy: referrerId || null,
                referralCount: 0,
                inviteCode: newUserInviteCode,
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
