"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, QrCode, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/lib/types';
import { Suspense } from 'react';

function AddConnectionContent() {
    const { user, profile: myProfile } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [targetUserId, setTargetUserId] = useState('');
    const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
    const [memo, setMemo] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'scan' | 'confirm' | 'memo'>('scan');

    // URLパラメータからユーザーIDを取得（QRコードからの遷移）
    useEffect(() => {
        const userId = searchParams.get('userId');
        if (userId) {
            setTargetUserId(userId);
            fetchTargetProfile(userId);
        }
    }, [searchParams]);

    const fetchTargetProfile = async (userId: string) => {
        try {
            const profileRef = doc(db, 'profiles', userId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                setTargetProfile(profileSnap.data() as UserProfile);
                setStep('confirm');
            } else {
                toast.error('ユーザーが見つかりません');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('プロフィールの取得に失敗しました');
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSaveConnection = async () => {
        if (!user || !targetProfile) return;

        // 自分自身は追加できない
        if (targetProfile.userId === user.uid) {
            toast.error('自分自身をコネクションに追加できません');
            return;
        }

        setLoading(true);
        try {
            // 双方向でコネクションを作成
            const connectionId = `${user.uid}_${targetProfile.userId}`;
            const reverseConnectionId = `${targetProfile.userId}_${user.uid}`;

            // 自分のコネクション
            await setDoc(doc(db, 'connections', connectionId), {
                ownerUserId: user.uid,
                connectedUserId: targetProfile.userId,
                connectedAt: serverTimestamp(),
                connectedLocation: location || null,
                memo: memo || null,
                tags: tags.length > 0 ? tags : null,
                status: 'active',
            });

            // 相手のコネクション（メモなし）
            await setDoc(doc(db, 'connections', reverseConnectionId), {
                ownerUserId: targetProfile.userId,
                connectedUserId: user.uid,
                connectedAt: serverTimestamp(),
                connectedLocation: location || null,
                memo: null,
                tags: null,
                status: 'active',
            });

            toast.success(`${targetProfile.name}さんとコネクションしました`);
            router.push('/connections');
        } catch (error) {
            console.error('Error saving connection:', error);
            toast.error('コネクションの保存に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary pb-24">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">コネクション追加</h1>
                </div>
            </div>

            <div className="px-4 py-6">
                {/* ステップ1: スキャン待機 */}
                {step === 'scan' && (
                    <div className="text-center py-12">
                        <div className="w-32 h-32 mx-auto mb-6 bg-surface-elevated rounded-2xl flex items-center justify-center border border-accent/20">
                            <QrCode className="w-16 h-16 text-accent" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">QRコードをスキャン</h2>
                        <p className="text-gray-400 mb-6">
                            相手のプロフィールQRコードを<br />
                            スマホのカメラでスキャンしてください
                        </p>
                        <p className="text-xs text-gray-500">
                            または、相手のプロフィールページから<br />
                            「コネクション追加」を押してください
                        </p>
                    </div>
                )}

                {/* ステップ2: 確認 */}
                {step === 'confirm' && targetProfile && (
                    <div>
                        <Card className="border-accent/20 mb-6">
                            <div className="flex items-center gap-4">
                                <Avatar
                                    src={targetProfile.avatarUrl}
                                    alt={targetProfile.name || ''}
                                    size="lg"
                                    rank={targetProfile.rankBadge}
                                />
                                <div>
                                    <h3 className="text-lg font-bold text-white">{targetProfile.name}</h3>
                                    <p className="text-sm text-gray-400">{targetProfile.companyName}</p>
                                    <p className="text-xs text-gray-500">{targetProfile.title}</p>
                                </div>
                            </div>
                        </Card>

                        <p className="text-center text-gray-400 mb-6">
                            この方とコネクションしますか？
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setTargetProfile(null);
                                    setStep('scan');
                                }}
                            >
                                キャンセル
                            </Button>
                            <Button
                                variant="gold"
                                className="flex-1"
                                onClick={() => setStep('memo')}
                            >
                                次へ
                            </Button>
                        </div>
                    </div>
                )}

                {/* ステップ3: メモ入力 */}
                {step === 'memo' && targetProfile && (
                    <div>
                        <Card className="border-accent/20 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar
                                    src={targetProfile.avatarUrl}
                                    alt={targetProfile.name || ''}
                                    size="sm"
                                    rank={targetProfile.rankBadge}
                                />
                                <div>
                                    <h3 className="font-bold text-white">{targetProfile.name}</h3>
                                    <p className="text-xs text-gray-400">{targetProfile.companyName}</p>
                                </div>
                            </div>

                            {/* 場所 */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 block mb-2">出会った場所（任意）</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="例: 12月定例会"
                                    className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50"
                                />
                            </div>

                            {/* メモ */}
                            <div className="mb-4">
                                <label className="text-sm text-gray-400 block mb-2">メモ（任意）</label>
                                <textarea
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    placeholder="例: ECサイト構築の相談に乗ってくれる、来月会食予定"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 resize-none"
                                />
                            </div>

                            {/* タグ */}
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">タグ（任意）</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                        placeholder="例: 投資家、仕入先候補"
                                        className="flex-1 px-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50"
                                    />
                                    <Button variant="outline" onClick={handleAddTag}>
                                        追加
                                    </Button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                        {tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full flex items-center gap-1"
                                            >
                                                {tag}
                                                <button onClick={() => handleRemoveTag(tag)}>
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setStep('confirm')}
                            >
                                戻る
                            </Button>
                            <Button
                                variant="gold"
                                className="flex-1"
                                onClick={handleSaveConnection}
                                disabled={loading}
                            >
                                {loading ? '保存中...' : 'コネクション追加'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AddConnectionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-primary flex items-center justify-center text-white">Loading...</div>}>
            <AddConnectionContent />
        </Suspense>
    );
}
