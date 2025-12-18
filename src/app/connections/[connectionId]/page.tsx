"use client";

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Calendar, Bell, Trash2, MessageSquare, Phone, Mail, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/lib/types';

interface ConnectionData {
    id: string;
    ownerUserId: string;
    connectedUserId: string;
    connectedAt: Timestamp;
    connectedLocation?: string;
    memo?: string;
    tags?: string[];
    lastContactedAt?: Timestamp;
    followUpDate?: Timestamp;
    status: 'active' | 'archived';
}

export default function ConnectionDetailPage({ params }: { params: Promise<{ connectionId: string }> }) {
    const resolvedParams = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [connection, setConnection] = useState<ConnectionData | null>(null);
    const [connectedProfile, setConnectedProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // 編集モード
    const [isEditingMemo, setIsEditingMemo] = useState(false);
    const [editMemo, setEditMemo] = useState('');
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [editTags, setEditTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    // フォローアップ設定
    const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !resolvedParams.connectionId) return;

            try {
                const connectionRef = doc(db, 'connections', resolvedParams.connectionId);
                const connectionSnap = await getDoc(connectionRef);

                if (!connectionSnap.exists()) {
                    toast.error('コネクションが見つかりません');
                    router.push('/connections');
                    return;
                }

                const connectionData = { id: connectionSnap.id, ...connectionSnap.data() } as ConnectionData;

                // 権限チェック
                if (connectionData.ownerUserId !== user.uid) {
                    toast.error('アクセス権限がありません');
                    router.push('/connections');
                    return;
                }

                setConnection(connectionData);
                setEditMemo(connectionData.memo || '');
                setEditTags(connectionData.tags || []);

                // 相手のプロフィールを取得
                const profileRef = doc(db, 'profiles', connectionData.connectedUserId);
                const profileSnap = await getDoc(profileRef);

                if (profileSnap.exists()) {
                    setConnectedProfile(profileSnap.data() as UserProfile);
                }
            } catch (error) {
                console.error('Error fetching connection:', error);
                toast.error('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, resolvedParams.connectionId, router]);

    // メモを保存
    const handleSaveMemo = async () => {
        if (!connection) return;

        try {
            await updateDoc(doc(db, 'connections', connection.id), {
                memo: editMemo || null
            });
            setConnection({ ...connection, memo: editMemo || undefined });
            setIsEditingMemo(false);
            toast.success('メモを保存しました');
        } catch (error) {
            console.error('Error saving memo:', error);
            toast.error('保存に失敗しました');
        }
    };

    // タグを保存
    const handleSaveTags = async () => {
        if (!connection) return;

        try {
            await updateDoc(doc(db, 'connections', connection.id), {
                tags: editTags.length > 0 ? editTags : null
            });
            setConnection({ ...connection, tags: editTags.length > 0 ? editTags : undefined });
            setIsEditingTags(false);
            toast.success('タグを保存しました');
        } catch (error) {
            console.error('Error saving tags:', error);
            toast.error('保存に失敗しました');
        }
    };

    // タグ追加
    const handleAddTag = () => {
        if (tagInput.trim() && !editTags.includes(tagInput.trim())) {
            setEditTags([...editTags, tagInput.trim()]);
            setTagInput('');
        }
    };

    // フォローアップ日を設定
    const handleSetFollowUp = async (days: number) => {
        if (!connection) return;

        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + days);

        try {
            await updateDoc(doc(db, 'connections', connection.id), {
                followUpDate: Timestamp.fromDate(followUpDate)
            });
            setConnection({ ...connection, followUpDate: Timestamp.fromDate(followUpDate) });
            setShowFollowUpPicker(false);
            toast.success(`${days}日後にリマインドします`);
        } catch (error) {
            console.error('Error setting follow-up:', error);
            toast.error('設定に失敗しました');
        }
    };

    // フォローアップをクリア
    const handleClearFollowUp = async () => {
        if (!connection) return;

        try {
            await updateDoc(doc(db, 'connections', connection.id), {
                followUpDate: null
            });
            setConnection({ ...connection, followUpDate: undefined });
            toast.success('リマインドを解除しました');
        } catch (error) {
            console.error('Error clearing follow-up:', error);
            toast.error('解除に失敗しました');
        }
    };

    // 連絡済みをマーク
    const handleMarkContacted = async () => {
        if (!connection) return;

        try {
            await updateDoc(doc(db, 'connections', connection.id), {
                lastContactedAt: serverTimestamp(),
                followUpDate: null
            });
            setConnection({
                ...connection,
                lastContactedAt: Timestamp.now(),
                followUpDate: undefined
            });
            toast.success('連絡済みにしました');
        } catch (error) {
            console.error('Error marking contacted:', error);
            toast.error('更新に失敗しました');
        }
    };

    // コネクション削除
    const handleDelete = async () => {
        if (!connection) return;

        if (!confirm('このコネクションを削除しますか？')) return;

        try {
            await deleteDoc(doc(db, 'connections', connection.id));
            toast.success('コネクションを削除しました');
            router.push('/connections');
        } catch (error) {
            console.error('Error deleting connection:', error);
            toast.error('削除に失敗しました');
        }
    };

    const formatDate = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate();
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getDaysSince = (timestamp: Timestamp | undefined) => {
        if (!timestamp) return null;
        const date = timestamp.toDate();
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!connection || !connectedProfile) {
        return null;
    }

    const daysSinceContact = getDaysSince(connection.lastContactedAt);

    return (
        <div className="min-h-screen bg-primary pb-24">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-white">コネクション詳細</h1>
                    </div>
                    <button onClick={handleDelete} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="px-4 py-6 space-y-4">
                {/* プロフィールカード */}
                <Card className="border-accent/20">
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar
                            src={connectedProfile.avatarUrl}
                            alt={connectedProfile.name || ''}
                            size="lg"
                            rank={connectedProfile.rankBadge}
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-white">{connectedProfile.name}</h2>
                                <Badge rank={connectedProfile.rankBadge} size="sm" />
                            </div>
                            <p className="text-sm text-gray-400">{connectedProfile.companyName}</p>
                            <p className="text-xs text-gray-500">{connectedProfile.title}</p>
                        </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex gap-2">
                        <Button
                            variant="gold"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/messages?userId=${connectedProfile.userId}`)}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            メッセージ
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/profile/${connectedProfile.userId}`)}
                        >
                            プロフィール
                        </Button>
                    </div>
                </Card>

                {/* 連絡状況 */}
                <Card className="border-white/5">
                    <h3 className="text-sm font-bold text-gray-400 mb-3">連絡状況</h3>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">出会った日</span>
                            <span className="text-white">{formatDate(connection.connectedAt)}</span>
                        </div>

                        {connection.connectedLocation && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">出会った場所</span>
                                <span className="text-white">{connection.connectedLocation}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">最後の連絡</span>
                            <div className="flex items-center gap-2">
                                <span className={`${daysSinceContact && daysSinceContact > 30 ? 'text-orange-400' : 'text-white'}`}>
                                    {connection.lastContactedAt ? `${daysSinceContact}日前` : '未連絡'}
                                </span>
                                <Button variant="outline" size="sm" onClick={handleMarkContacted}>
                                    <Check className="w-3 h-3 mr-1" />
                                    連絡済み
                                </Button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">リマインド</span>
                            <div className="flex items-center gap-2">
                                {connection.followUpDate ? (
                                    <>
                                        <span className="text-accent">{formatDate(connection.followUpDate)}</span>
                                        <button onClick={handleClearFollowUp} className="text-gray-500 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => setShowFollowUpPicker(true)}>
                                        <Bell className="w-3 h-3 mr-1" />
                                        設定
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* フォローアップ日選択 */}
                    {showFollowUpPicker && (
                        <div className="mt-4 p-3 bg-surface rounded-lg border border-white/10">
                            <p className="text-sm text-gray-400 mb-3">いつリマインドしますか？</p>
                            <div className="flex flex-wrap gap-2">
                                {[3, 7, 14, 30].map(days => (
                                    <button
                                        key={days}
                                        onClick={() => handleSetFollowUp(days)}
                                        className="px-3 py-1 bg-surface-elevated rounded-full text-sm text-white hover:bg-accent/20 transition-colors"
                                    >
                                        {days}日後
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowFollowUpPicker(false)}
                                    className="px-3 py-1 text-sm text-gray-500 hover:text-white"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* メモ */}
                <Card className="border-white/5">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-gray-400">メモ</h3>
                        {!isEditingMemo && (
                            <button onClick={() => setIsEditingMemo(true)} className="text-gray-500 hover:text-white">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {isEditingMemo ? (
                        <div>
                            <textarea
                                value={editMemo}
                                onChange={(e) => setEditMemo(e.target.value)}
                                placeholder="この人との会話内容、今後の予定などをメモ..."
                                rows={4}
                                className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 resize-none text-sm"
                            />
                            <div className="flex gap-2 mt-2">
                                <Button variant="gold" size="sm" onClick={handleSaveMemo}>保存</Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    setIsEditingMemo(false);
                                    setEditMemo(connection.memo || '');
                                }}>キャンセル</Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-white text-sm whitespace-pre-wrap">
                            {connection.memo || <span className="text-gray-500">メモはありません</span>}
                        </p>
                    )}
                </Card>

                {/* タグ */}
                <Card className="border-white/5">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-gray-400">タグ</h3>
                        {!isEditingTags && (
                            <button onClick={() => setIsEditingTags(true)} className="text-gray-500 hover:text-white">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {isEditingTags ? (
                        <div>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                    placeholder="タグを入力..."
                                    className="flex-1 px-3 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 text-sm"
                                />
                                <Button variant="outline" size="sm" onClick={handleAddTag}>追加</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {editTags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full flex items-center gap-1">
                                        {tag}
                                        <button onClick={() => setEditTags(editTags.filter(t => t !== tag))}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="gold" size="sm" onClick={handleSaveTags}>保存</Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    setIsEditingTags(false);
                                    setEditTags(connection.tags || []);
                                }}>キャンセル</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {connection.tags && connection.tags.length > 0 ? (
                                connection.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-500 text-sm">タグはありません</span>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
