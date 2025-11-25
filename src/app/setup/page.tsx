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
