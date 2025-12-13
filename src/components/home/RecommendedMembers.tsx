"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { getRecommendedUsers, MatchResult } from '@/lib/matchScore';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronRight } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/Skeleton';

export const RecommendedMembers = () => {
    const { profile } = useAuth();
    const router = useRouter();
    const [recommended, setRecommended] = useState<(UserProfile & { matchResult: MatchResult })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;

        const fetchRecommended = async () => {
            try {
                const snapshot = await getDocs(query(collection(db, 'profiles'), limit(50)));
                const allUsers: UserProfile[] = [];
                snapshot.forEach(doc => {
                    if (doc.id !== profile.userId) {
                        allUsers.push(doc.data() as UserProfile);
                    }
                });

                const top3 = getRecommendedUsers(profile, allUsers, 3);
                setRecommended(top3);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommended();
    }, [profile]);

    if (loading) {
        return <CardSkeleton />;
    }

    if (recommended.length === 0) return null;

    return (
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    あなたにおすすめ
                </h3>
                <button
                    onClick={() => router.push('/members')}
                    className="text-xs text-accent hover:text-accent-light flex items-center"
                >
                    もっと見る <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-3">
                {recommended.map((user, index) => (
                    <Card
                        key={user.userId}
                        className="cursor-pointer hover:border-accent/30 transition-all"
                        onClick={() => router.push(`/profile/${user.userId}`)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    size="md"
                                    rank={user.rankBadge}
                                />
                                <div className="absolute -top-1 -left-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-[10px] font-bold text-primary">
                                    {index + 1}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-white truncate">{user.name}</h4>
                                    <Badge rank={user.rankBadge} size="sm" showLabel={false} />
                                </div>
                                <p className="text-xs text-gray-400 truncate">{user.companyName}</p>

                                {user.matchResult.canProvide.length > 0 && (
                                    <p className="text-xs text-accent mt-1 truncate">
                                        💡 {user.matchResult.canProvide[0]}を提供可能
                                    </p>
                                )}
                            </div>

                            <div className="text-right">
                                <div className="text-2xl font-bold text-accent">{user.matchResult.score}%</div>
                                <div className="text-[10px] text-gray-500">マッチ度</div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
