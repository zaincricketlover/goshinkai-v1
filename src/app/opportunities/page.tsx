"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, Filter, Briefcase, HandHeart, Clock, Users } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface OpportunityWithProfile {
    opportunity: {
        id: string;
        createdBy: string;
        type: 'want' | 'give';
        title: string;
        description: string;
        category: string;
        budget?: string;
        deadline?: any;
        tags: string[];
        status: string;
        applicants: string[];
        createdAt: any;
    };
    profile: UserProfile;
}

const CATEGORIES = ['すべて', 'IT・Web', '製造・メーカー', '営業支援', '資金調達', '人材採用', 'コンサルティング', 'その他'];

export default function OpportunitiesPage() {
    const { user, profile: myProfile } = useAuth();
    const router = useRouter();

    const [opportunities, setOpportunities] = useState<OpportunityWithProfile[]>([]);
    const [filteredOpportunities, setFilteredOpportunities] = useState<OpportunityWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'want' | 'give'>('all');
    const [filterCategory, setFilterCategory] = useState('すべて');
    const [showMyPosts, setShowMyPosts] = useState(false);

    useEffect(() => {
        const fetchOpportunities = async () => {
            if (!user) return;

            try {
                const opportunitiesRef = collection(db, 'opportunities');
                const q = query(
                    opportunitiesRef,
                    where('status', '==', 'open'),
                    orderBy('createdAt', 'desc')
                );

                const snapshot = await getDocs(q);
                const opportunitiesList: OpportunityWithProfile[] = [];

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();

                    // 投稿者のプロフィールを取得
                    const profileRef = doc(db, 'profiles', data.createdBy);
                    const profileSnap = await getDoc(profileRef);

                    if (profileSnap.exists()) {
                        opportunitiesList.push({
                            opportunity: {
                                id: docSnap.id,
                                createdBy: data.createdBy,
                                type: data.type,
                                title: data.title,
                                description: data.description,
                                category: data.category,
                                budget: data.budget,
                                deadline: data.deadline,
                                tags: data.tags || [],
                                status: data.status,
                                applicants: data.applicants || [],
                                createdAt: data.createdAt,
                            },
                            profile: profileSnap.data() as UserProfile,
                        });
                    }
                }

                setOpportunities(opportunitiesList);
                setFilteredOpportunities(opportunitiesList);
            } catch (error) {
                console.error('Error fetching opportunities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOpportunities();
    }, [user]);

    // フィルター処理
    useEffect(() => {
        let filtered = [...opportunities];

        // 自分の投稿のみ
        if (showMyPosts && user) {
            filtered = filtered.filter(o => o.opportunity.createdBy === user.uid);
        }

        // タイプフィルター
        if (filterType !== 'all') {
            filtered = filtered.filter(o => o.opportunity.type === filterType);
        }

        // カテゴリフィルター
        if (filterCategory !== 'すべて') {
            filtered = filtered.filter(o => o.opportunity.category === filterCategory);
        }

        // 検索クエリ
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                o.opportunity.title.toLowerCase().includes(query) ||
                o.opportunity.description.toLowerCase().includes(query) ||
                o.profile.name?.toLowerCase().includes(query) ||
                o.profile.companyName?.toLowerCase().includes(query)
            );
        }

        setFilteredOpportunities(filtered);
    }, [searchQuery, filterType, filterCategory, showMyPosts, opportunities, user]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary pb-24">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-white">案件マッチング</h1>
                    <Button
                        variant="gold"
                        size="sm"
                        onClick={() => router.push('/opportunities/create')}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        投稿
                    </Button>
                </div>

                {/* 検索 */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="キーワードで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50"
                    />
                </div>

                {/* タイプフィルター */}
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all'
                                ? 'bg-accent text-black'
                                : 'bg-surface-elevated text-gray-400'
                            }`}
                    >
                        すべて
                    </button>
                    <button
                        onClick={() => setFilterType('want')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${filterType === 'want'
                                ? 'bg-blue-500 text-white'
                                : 'bg-surface-elevated text-gray-400'
                            }`}
                    >
                        <Briefcase className="w-4 h-4" />
                        探してます
                    </button>
                    <button
                        onClick={() => setFilterType('give')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${filterType === 'give'
                                ? 'bg-green-500 text-white'
                                : 'bg-surface-elevated text-gray-400'
                            }`}
                    >
                        <HandHeart className="w-4 h-4" />
                        提供できます
                    </button>
                </div>

                {/* カテゴリフィルター */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${filterCategory === cat
                                    ? 'bg-accent text-black'
                                    : 'bg-surface-elevated text-gray-400 hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* マイ投稿フィルター */}
                <div className="flex items-center gap-2 mt-3">
                    <button
                        onClick={() => setShowMyPosts(!showMyPosts)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${showMyPosts
                                ? 'bg-accent text-black'
                                : 'bg-surface-elevated text-gray-400'
                            }`}
                    >
                        自分の投稿のみ
                    </button>
                </div>
            </div>

            {/* 案件一覧 */}
            <div className="px-4 py-4 space-y-3">
                {filteredOpportunities.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">💼</div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            案件がありません
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            最初の案件を投稿してみましょう
                        </p>
                        <Button
                            variant="gold"
                            onClick={() => router.push('/opportunities/create')}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            案件を投稿
                        </Button>
                    </div>
                ) : (
                    filteredOpportunities.map(({ opportunity, profile }) => (
                        <Card
                            key={opportunity.id}
                            className="border-white/5 hover:border-accent/30 transition-all cursor-pointer"
                            onClick={() => router.push(`/opportunities/${opportunity.id}`)}
                        >
                            {/* タイプバッジ */}
                            <div className="flex items-center justify-between mb-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${opportunity.type === 'want'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-green-500/20 text-green-400'
                                    }`}>
                                    {opportunity.type === 'want' ? '🔍 探してます' : '💡 提供できます'}
                                </span>
                                <span className="text-xs text-gray-500">{formatDate(opportunity.createdAt)}</span>
                            </div>

                            {/* タイトル */}
                            <h3 className="text-lg font-bold text-white mb-2">{opportunity.title}</h3>

                            {/* 説明 */}
                            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{opportunity.description}</p>

                            {/* カテゴリ・予算 */}
                            <div className="flex items-center gap-3 mb-3 text-xs">
                                <span className="px-2 py-1 bg-surface-elevated rounded text-gray-300">
                                    {opportunity.category}
                                </span>
                                {opportunity.budget && (
                                    <span className="text-accent">💰 {opportunity.budget}</span>
                                )}
                                {opportunity.deadline && (
                                    <span className="text-orange-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(opportunity.deadline)}まで
                                    </span>
                                )}
                            </div>

                            {/* 投稿者 */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <Avatar
                                        src={profile.avatarUrl}
                                        alt={profile.name || ''}
                                        size="sm"
                                        rank={profile.rankBadge}
                                    />
                                    <div>
                                        <p className="text-sm text-white">{profile.name}</p>
                                        <p className="text-xs text-gray-500">{profile.companyName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500 text-xs">
                                    <Users className="w-3 h-3" />
                                    {opportunity.applicants.length}人が興味
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
