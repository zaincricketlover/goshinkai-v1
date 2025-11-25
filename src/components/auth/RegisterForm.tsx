"use client";

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserProfile, VenueId } from '@/lib/types';

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
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="招待コード"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                placeholder="INVITE-CODE"
            />
            <Input
                label="お名前"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="山田 太郎"
            />
            <Input
                label="メールアドレス"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
            />
            <Input
                label="パスワード"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" isLoading={loading}>
                アカウント作成
            </Button>
        </form>
    );
};
