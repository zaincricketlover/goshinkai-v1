"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Heart, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RANK_BADGES } from '@/lib/constants';

// ランクアップに必要なポイント
const RANK_THRESHOLDS = {
    WHITE: 0,
    BLUE: 100,
    SILVER: 300,
    GOLD: 600,
    DIAMOND: 1000,
    PLATINUM: 2000,
};

const RANK_ORDER = ['WHITE', 'BLUE', 'SILVER', 'GOLD', 'DIAMOND', 'PLATINUM'];

export const ActionCards = () => {
    const { profile } = useAuth();
    const router = useRouter();
    const [interestedCount, setInterestedCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;

        const fetchData = async () => {
            try {
                // 自分に興味ありを送ってきた人の数
                const interestsSnap = await getDocs(
                    query(collection(db, 'interests'), where('toUserId', '==', profile.userId))
                );
                setInterestedCount(interestsSnap.size);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [profile]);

    // 次のランクまでのポイント計算
    const currentRankIndex = RANK_ORDER.indexOf(profile?.rankBadge || 'WHITE');
    const nextRank = currentRankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[currentRankIndex + 1] : null;
    const currentScore = profile?.rankScore || 0;
    const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank as keyof typeof RANK_THRESHOLDS] : currentScore;
    const pointsToNext = Math.max(0, nextThreshold - currentScore);

    const actions = [
        {
            title: 'あなたに興味がある人',
            icon: Heart,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            value: loading ? '...' : `${interestedCount}人`,
            highlight: interestedCount > 0,
            path: '/matches'
        },
        {
            title: 'マッチ度の高いメンバー',
            icon: Zap,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            value: 'おすすめを見る',
            path: '/members'
        },
        {
            title: nextRank ? `${RANK_BADGES[nextRank as keyof typeof RANK_BADGES].label}まで` : '最高ランク達成！',
            icon: TrendingUp,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            value: nextRank ? `${pointsToNext}pt` : '🎉',
            path: '/events'
        }
    ];

    return (
        <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4 scrollbar-hide">
            {actions.map((a, i) => (
                <div key={i} className="flex-shrink-0 w-64">
                    <Card
                        className={`h-full cursor-pointer group ${a.highlight ? 'border-pink-500/30 animate-pulse' : ''}`}
                        onClick={() => router.push(a.path)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-lg ${a.bg} ${a.color}`}>
                                <a.icon className="w-5 h-5" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-300 mb-1">{a.title}</h4>
                        <span className={`text-xl font-bold ${a.highlight ? 'text-pink-400' : 'text-white'}`}>
                            {a.value}
                        </span>
                    </Card>
                </div>
            ))}
        </div>
    );
};
