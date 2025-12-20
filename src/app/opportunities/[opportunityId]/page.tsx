"use client";

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Clock, Users, Trash2, MessageSquare, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/lib/types';

interface Opportunity {
    id: string;
    createdBy: string;
    applicants: string[];
    type: 'want' | 'give';
    status: 'open' | 'in_progress' | 'closed';
    title: string;
    category: string;
    budget?: string;
    deadline?: any;
    description: string;
    tags: string[];
}

export default function OpportunityDetailPage({ params }: { params: Promise<{ opportunityId: string }> }) {
    const resolvedParams = use(params);
    const { user, profile: myProfile } = useAuth();
    const router = useRouter();

    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
    const [applicantProfiles, setApplicantProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    const isOwner = user && opportunity?.createdBy === user.uid;
    const hasApplied = user && opportunity?.applicants?.includes(user.uid);

    useEffect(() => {
        const fetchData = async () => {
            if (!resolvedParams.opportunityId) return;

            try {
                const oppRef = doc(db, 'opportunities', resolvedParams.opportunityId);
                const oppSnap = await getDoc(oppRef);

                if (!oppSnap.exists()) {
                    toast.error('案件が見つかりません');
                    router.push('/opportunities');
                    return;
                }

                const oppData = { id: oppSnap.id, ...oppSnap.data() } as Opportunity;
                setOpportunity(oppData);

                // 投稿者のプロフィール
                const ownerRef = doc(db, 'profiles', oppData.createdBy);
                const ownerSnap = await getDoc(ownerRef);
                if (ownerSnap.exists()) {
                    setOwnerProfile(ownerSnap.data() as UserProfile);
                }

                // 応募者のプロフィール（投稿者のみ表示）
                if (user && oppData.createdBy === user.uid && oppData.applicants?.length > 0) {
                    const profiles: UserProfile[] = [];
                    for (const applicantId of oppData.applicants) {
                        const profileRef = doc(db, 'profiles', applicantId);
                        const profileSnap = await getDoc(profileRef);
                        if (profileSnap.exists()) {
                            profiles.push(profileSnap.data() as UserProfile);
                        }
                    }
                    setApplicantProfiles(profiles);
                }
            } catch (error) {
                console.error('Error fetching opportunity:', error);
                toast.error('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [resolvedParams.opportunityId, user, router]);

    // 興味ありを送る
    const handleApply = async () => {
        if (!user || !opportunity) return;

        setApplying(true);
        try {
            await updateDoc(doc(db, 'opportunities', opportunity.id), {
                applicants: arrayUnion(user.uid),
                updatedAt: serverTimestamp(),
            });

            setOpportunity({
                ...opportunity,
                applicants: [...(opportunity.applicants || []), user.uid]
            });
            toast.success('興味ありを送りました');
        } catch (error) {
            console.error('Error applying:', error);
            toast.error('送信に失敗しました');
        } finally {
            setApplying(false);
        }
    };

    // 興味ありを取り消す
    const handleCancelApply = async () => {
        if (!user || !opportunity) return;

        setApplying(true);
        try {
            await updateDoc(doc(db, 'opportunities', opportunity.id), {
                applicants: arrayRemove(user.uid),
                updatedAt: serverTimestamp(),
            });

            setOpportunity({
                ...opportunity,
                applicants: opportunity.applicants.filter((id: string) => id !== user.uid)
            });
            toast.success('興味ありを取り消しました');
        } catch (error) {
            console.error('Error canceling:', error);
            toast.error('取り消しに失敗しました');
        } finally {
            setApplying(false);
        }
    };

    // 案件を削除
    const handleDelete = async () => {
        if (!opportunity) return;

        if (!confirm('この案件を削除しますか？')) return;

        try {
            await deleteDoc(doc(db, 'opportunities', opportunity.id));
            toast.success('案件を削除しました');
            router.push('/opportunities');
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('削除に失敗しました');
        }
    };

    // ステータス変更
    const handleStatusChange = async (newStatus: string) => {
        if (!opportunity) return;

        try {
            await updateDoc(doc(db, 'opportunities', opportunity.id), {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });

            setOpportunity({ ...opportunity, status: newStatus as any });
            toast.success('ステータスを更新しました');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('更新に失敗しました');
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!opportunity || !ownerProfile) return null;

    return (
        <div className="min-h-screen bg-primary pb-24">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-white">案件詳細</h1>
                    </div>
                    {isOwner && (
                        <button onClick={handleDelete} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-4 py-6 space-y-4">
                {/* メインカード */}
                <Card className="border-accent/20">
                    {/* タイプ・ステータス */}
                    <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${opportunity.type === 'want'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                            }`}>
                            {opportunity.type === 'want' ? '🔍 探してます' : '💡 提供できます'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs ${opportunity.status === 'open'
                            ? 'bg-green-500/20 text-green-400'
                            : opportunity.status === 'in_progress'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                            {opportunity.status === 'open' ? '募集中' : opportunity.status === 'in_progress' ? '進行中' : '終了'}
                        </span>
                    </div>

                    {/* タイトル */}
                    <h2 className="text-2xl font-bold text-white mb-3">{opportunity.title}</h2>

                    {/* メタ情報 */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                        <span className="px-2 py-1 bg-surface-elevated rounded text-gray-300">
                            {opportunity.category}
                        </span>
                        {opportunity.budget && (
                            <span className="text-accent">💰 {opportunity.budget}</span>
                        )}
                        {opportunity.deadline && (
                            <span className="text-orange-400 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(opportunity.deadline)}まで
                            </span>
                        )}
                        <span className="text-gray-500 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {opportunity.applicants?.length || 0}人が興味
                        </span>
                    </div>

                    {/* 詳細 */}
                    <p className="text-gray-300 whitespace-pre-wrap mb-4">{opportunity.description}</p>

                    {/* タグ */}
                    {opportunity.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {opportunity.tags.map((tag: string) => (
                                <span key={tag} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 投稿者 */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                        <Avatar
                            src={ownerProfile.avatarUrl}
                            alt={ownerProfile.name || ''}
                            size="md"
                            rank={ownerProfile.rankBadge}
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-white">{ownerProfile.name}</p>
                                <Badge rank={ownerProfile.rankBadge} size="sm" />
                            </div>
                            <p className="text-sm text-gray-400">{ownerProfile.companyName}</p>
                        </div>
                        {!isOwner && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/profile/${ownerProfile.userId}`)}
                            >
                                プロフィール
                            </Button>
                        )}
                    </div>
                </Card>

                {/* アクションボタン（自分の投稿でない場合） */}
                {!isOwner && opportunity.status === 'open' && (
                    <div className="flex gap-3">
                        {hasApplied ? (
                            <>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleCancelApply}
                                    disabled={applying}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    興味ありを取り消す
                                </Button>
                                <Button
                                    variant="gold"
                                    className="flex-1"
                                    onClick={() => router.push(`/messages?userId=${ownerProfile.userId}`)}
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    メッセージ
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="gold"
                                className="w-full"
                                onClick={handleApply}
                                disabled={applying}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                {applying ? '送信中...' : '興味ありを送る'}
                            </Button>
                        )}
                    </div>
                )}

                {/* 投稿者用: 応募者一覧 */}
                {isOwner && applicantProfiles.length > 0 && (
                    <Card className="border-white/5">
                        <h3 className="text-sm font-bold text-gray-400 mb-3">
                            興味ありを送った人（{applicantProfiles.length}人）
                        </h3>
                        <div className="space-y-3">
                            {applicantProfiles.map(applicant => (
                                <div
                                    key={applicant.userId}
                                    className="flex items-center gap-3 p-2 bg-surface rounded-lg cursor-pointer hover:bg-surface-elevated transition-colors"
                                    onClick={() => router.push(`/profile/${applicant.userId}`)}
                                >
                                    <Avatar
                                        src={applicant.avatarUrl}
                                        alt={applicant.name || ''}
                                        size="sm"
                                        rank={applicant.rankBadge}
                                    />
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{applicant.name}</p>
                                        <p className="text-xs text-gray-500">{applicant.companyName}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/messages?userId=${applicant.userId}`);
                                        }}
                                    >
                                        <MessageSquare className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* 投稿者用: ステータス変更 */}
                {isOwner && (
                    <Card className="border-white/5">
                        <h3 className="text-sm font-bold text-gray-400 mb-3">ステータス変更</h3>
                        <div className="flex gap-2">
                            {['open', 'in_progress', 'closed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${opportunity.status === status
                                        ? 'bg-accent text-black'
                                        : 'bg-surface-elevated text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {status === 'open' ? '募集中' : status === 'in_progress' ? '進行中' : '終了'}
                                </button>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
