"use client";

import React, { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

// 初期管理者として設定するメールアドレス
const INITIAL_ADMIN_EMAIL = 'zain.cricketlover@gmail.com';
// セットアップ用の秘密キー（簡易的なセキュリティ）
const SETUP_SECRET_KEY = 'GOSHINKAI-ADMIN-2024';

export default function AdminSetupPage() {
    const [secretKey, setSecretKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [directUserId, setDirectUserId] = useState('');
    const [usersList, setUsersList] = useState<Array<{ id: string; name: string }>>([]);

    const handleListUsers = async () => {
        if (secretKey !== SETUP_SECRET_KEY) {
            toast.error('セキュリティキーが正しくありません');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const profilesSnap = await getDocs(collection(db, 'profiles'));
            const users: Array<{ id: string; name: string }> = [];

            profilesSnap.forEach((profileDoc) => {
                const data = profileDoc.data();
                users.push({
                    id: profileDoc.id,
                    name: data.name || '名前なし',
                });
                console.log(`ユーザーID: ${profileDoc.id}, 名前: ${data.name}`);
            });

            setUsersList(users);
            setResult(`${users.length}人のユーザーを取得しました。コンソールとリストを確認してください。`);
            toast.success('ユーザー一覧を取得しました');
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(`エラー: ${error.message}`);
            setResult(`エラー: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDirectUpdate = async (userId: string) => {
        if (!userId.trim()) {
            toast.error('ユーザーIDを入力してください');
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(db, 'profiles', userId.trim());
            await updateDoc(userRef, { isAdmin: true });
            toast.success(`ユーザー ${userId} を管理者に設定しました`);
            setResult(`✅ 成功: ${userId} は管理者になりました`);
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(`エラー: ${error.message}`);
            setResult(`❌ エラー: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">管理者セットアップ</h1>
                    <p className="text-gray-400 mt-2">初期管理者アカウントを設定します</p>
                    <p className="text-accent mt-1 text-sm font-mono">対象: {INITIAL_ADMIN_EMAIL}</p>
                </div>

                <Card title="ステップ1: セキュリティ認証">
                    <div className="space-y-4">
                        <Input
                            label="セキュリティキー"
                            type="password"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            placeholder="セットアップキーを入力"
                        />
                        <Button
                            onClick={handleListUsers}
                            isLoading={loading}
                            variant="primary"
                            className="w-full"
                        >
                            認証 & ユーザー一覧取得
                        </Button>
                    </div>
                </Card>

                {usersList.length > 0 && (
                    <Card title="取得したユーザー一覧">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {usersList.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex justify-between items-center p-3 rounded-lg bg-surface-elevated hover:bg-white/5 transition-colors"
                                >
                                    <div>
                                        <p className="text-white font-medium">{user.name}</p>
                                        <p className="text-xs text-gray-500 font-mono">{user.id}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="gold"
                                        onClick={() => setDirectUserId(user.id)}
                                    >
                                        選択
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <Card title="ステップ2: 管理者に設定">
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-sm text-blue-300 mb-2">
                                <strong>方法1:</strong> 上のリストから該当ユーザーを選択
                            </p>
                            <p className="text-sm text-blue-300">
                                <strong>方法2:</strong> Firebase Console の Authentication → Users からユーザーUIDをコピーして入力
                            </p>
                        </div>
                        <Input
                            label="ユーザーID (Firebase Auth UID)"
                            value={directUserId}
                            onChange={(e) => setDirectUserId(e.target.value)}
                            placeholder="例: abc123xyz..."
                        />
                        <Button
                            onClick={() => handleDirectUpdate(directUserId)}
                            isLoading={loading}
                            variant="gold"
                            className="w-full"
                        >
                            このユーザーを管理者に設定
                        </Button>
                    </div>
                </Card>

                {result && (
                    <div className={`p-4 rounded-lg border text-sm ${result.includes('成功') || result.includes('✅')
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : result.includes('エラー') || result.includes('❌')
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                        {result}
                    </div>
                )}

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-300 mb-2">⚠️ セキュリティ上の注意</p>
                    <ul className="text-xs text-yellow-200 space-y-1 list-disc list-inside">
                        <li>このページは初期セットアップ専用です</li>
                        <li>セットアップ完了後は、このファイルを削除することを推奨します</li>
                        <li>セキュリティキー: <code className="bg-black/30 px-1 rounded">GOSHINKAI-ADMIN-2024</code></li>
                    </ul>
                </div>

                <div className="text-center">
                    <Button
                        variant="outline"
                        onClick={() => window.location.href = '/admin'}
                    >
                        管理画面に移動
                    </Button>
                </div>
            </div>
        </div>
    );
}
