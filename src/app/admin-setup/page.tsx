"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const ALLOWED_EMAILS = ['info@sandudm.com']; // ここに許可するメールアドレスを追加

export default function AdminSetupPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const makeMeAdmin = async () => {
        if (!user) return;

        if (!ALLOWED_EMAILS.includes(user.email || '')) {
            alert('このメールアドレスは許可されていません。');
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, 'profiles', user.uid);
            await updateDoc(userRef, { isAdmin: true });
            alert('あなたは管理者になりました！リロードしてください。');
            window.location.href = '/admin';
        } catch (error) {
            console.error('Error making admin:', error);
            alert('失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div>Login required</div>;

    const isAllowed = ALLOWED_EMAILS.includes(user.email || '');

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Card title="Admin Setup (Dev Only)">
                <p className="mb-4">現在のユーザーを管理者に設定します。</p>

                {!isAllowed && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                        あなたのメールアドレス ({user.email}) は許可リストに含まれていません。
                    </div>
                )}

                <Button
                    onClick={makeMeAdmin}
                    isLoading={loading}
                    disabled={!isAllowed}
                    className={!isAllowed ? "opacity-50 cursor-not-allowed" : ""}
                >
                    管理者になる
                </Button>
            </Card>
        </div>
    );
}
