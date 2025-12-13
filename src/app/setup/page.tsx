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
    const [isSuccess, setIsSuccess] = useState(false);

    const handleCreateInvite = async () => {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (!apiKey || !projectId) {
            setMessage("Firebase設定が見つかりません。.env.localを確認してください。");
            setIsSuccess(false);
            return;
        }

        if (!code) {
            setMessage("コードを入力してください");
            setIsSuccess(false);
            return;
        }

        try {
            setMessage("処理中... (認証接続テスト)");
            setIsSuccess(false);

            const { signInAnonymously } = await import("firebase/auth");
            const { auth } = await import("@/lib/firebase");

            await signInAnonymously(auth);

            setMessage("処理中... (Firestore書き込み)");

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestoreへの接続がタイムアウトしました。")), 5000)
            );

            const colRef = collection(db, 'invites');

            await Promise.race([
                addDoc(colRef, {
                    code: code.toUpperCase(),
                    createdBy: 'system',
                    createdAt: serverTimestamp(),
                    isActive: true,
                    useCount: 0,
                    maxUses: null,
                }),
                timeoutPromise
            ]);

            setMessage(`招待コード "${code.toUpperCase()}" を作成しました。`);
            setIsSuccess(true);
            setCode('');
        } catch (error: any) {
            console.error("Detailed Error:", error);
            setMessage(`エラー: ${error.message}`);
            setIsSuccess(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">初期データセットアップ</h1>
                    <p className="text-gray-400">システム管理者用</p>
                </div>

                <Card>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">招待コード作成</h3>
                            <div className="space-y-4">
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="INVITE-CODE"
                                    label="招待コード"
                                />
                                <Button onClick={handleCreateInvite} variant="gold" className="w-full">
                                    コードを作成
                                </Button>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-lg ${isSuccess
                                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                    : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                                }`}>
                                <p className="text-sm">{message}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10">
                            <p className="text-xs text-gray-500 text-center">
                                このページは開発・テスト用です。本番環境では管理画面から招待コードを発行してください。
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
