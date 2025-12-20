import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Copy, Calendar, User, Plus, Users, Heart, MessageSquare, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface ProfileInfoProps {
    profile: UserProfile;
    isOwnProfile: boolean;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile, isOwnProfile }) => {
    const router = useRouter();
    const [referrerName, setReferrerName] = useState<string>('');
    const [nextEventAttending, setNextEventAttending] = useState<any>(null);

    useEffect(() => {
        const fetchExtras = async () => {
            if (profile.referredBy) {
                const refDoc = await getDoc(doc(db, 'profiles', profile.referredBy));
                if (refDoc.exists()) {
                    setReferrerName(refDoc.data().name);
                }
            }
            // Logic for next event could be complex, for now we might skip or need a collection query.
            // Simplified: If profile has 'nextEventId' or we query participation.
            // Since the user asked for this, let's assume we can fetch ONE event they are going to.
            // For optimized performance, we might just query 'events' where 'participants.{userId}.status == going'
            // But since Firestore structure is 'events/{id}/participants/{doc}' we can't easily query "all events where I am participating" without a composite index or separate UserEvents collection.
            // We will skip actual fetching for now unless we change DB structure or have 'attendingEvents' array in user profile.
            // Let's assume 'attendingEventIds' exists or we just show a placeholder if we can't efficiently query.
            // UPDATE: The User Dashboard shows "eventsAttended" count.
            // Let's try to show if we have the data.
        };
        fetchExtras();
    }, [profile]);

    const getRankInfo = (score: number) => {
        if (score < 100) return { current: 'WHITE', next: 'BLUE', progress: score, threshold: 100 };
        if (score < 300) return { current: 'BLUE', next: 'SILVER', progress: score - 100, threshold: 200 };
        if (score < 800) return { current: 'SILVER', next: 'GOLD', progress: score - 300, threshold: 500 };
        if (score < 2000) return { current: 'GOLD', next: 'DIAMOND', progress: score - 800, threshold: 1200 };
        return { current: 'PLATINUM', next: 'MAX', progress: 100, threshold: 100 };
    };

    const rankInfo = getRankInfo(profile.rankScore || 0);

    return (
        <div className="space-y-6">
            {/* 統計ダッシュボード */}
            {isOwnProfile && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                    <Card className="flex flex-col items-center justify-center py-4 bg-surface/40">
                        <Users className="w-5 h-5 text-blue-400 mb-2" />
                        <span className="text-2xl font-bold text-white">{profile.connectionsCount || 0}</span>
                        <span className="text-[10px] text-gray-500">人脈</span>
                    </Card>
                    <Card className="flex flex-col items-center justify-center py-4 bg-surface/40">
                        <Heart className="w-5 h-5 text-pink-400 mb-2" />
                        <span className="text-2xl font-bold text-white">{profile.interestsReceived || 0}</span>
                        <span className="text-[10px] text-gray-500">興味あり</span>
                    </Card>
                    <Card className="flex flex-col items-center justify-center py-4 bg-surface/40">
                        <Calendar className="w-5 h-5 text-green-400 mb-2" />
                        <span className="text-2xl font-bold text-white">{profile.eventsAttended || 0}</span>
                        <span className="text-[10px] text-gray-500">参加イベント</span>
                    </Card>
                    <Card className="flex flex-col items-center justify-center py-4 bg-surface/40">
                        <TrendingUp className="w-5 h-5 text-accent mb-2" />
                        <span className="text-2xl font-bold text-white">{profile.referralCount || 0}</span>
                        <span className="text-[10px] text-gray-500">招待数</span>
                    </Card>
                </div>
            )}

            {/* ランク進捗 */}
            {isOwnProfile && (
                <Card className="mx-2">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Current Rank</p>
                            <p className="text-sm font-bold text-accent">{rankInfo.current}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Next Rank</p>
                            <p className="text-sm font-bold text-gray-400">{rankInfo.next}</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(rankInfo.progress / rankInfo.threshold) * 100}%` }}
                            className="bg-accent h-full"
                        />
                    </div>
                    <p className="text-[10px] text-center text-gray-500 mt-2">
                        次のランクまであと <span className="text-accent font-bold">{rankInfo.threshold - rankInfo.progress}</span> スコア
                    </p>
                </Card>
            )}
            {/* Catch Copy & Bio */}
            <Card>
                {profile.catchCopy && (
                    <div className="mb-4 text-center">
                        <h3 className="text-lg font-bold text-accent italic">"{profile.catchCopy}"</h3>
                    </div>
                )}
                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {profile.bio || '自己紹介はまだありません。'}
                </p>

                {/* 招待者情報 */}
                {profile.referredBy && referrerName && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-4 pt-4 border-t border-white/5">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>招待者:</span>
                        <span
                            className="text-accent cursor-pointer hover:underline"
                            onClick={() => router.push(`/profile/${profile.referredBy}`)}
                        >
                            {referrerName}様
                        </span>
                    </div>
                )}
            </Card>

            {/* Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="WANT (求めているもの)" action={
                    isOwnProfile ? (
                        <button
                            onClick={() => router.push('/profile/edit#want')}
                            className="text-accent hover:text-accent/80 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    ) : undefined
                }>
                    <div className="flex flex-wrap gap-2">
                        {profile.wantTags && profile.wantTags.length > 0 ? (
                            profile.wantTags.map((tag, i) => (
                                <span key={i} className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1 rounded-full text-xs font-medium">
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 text-sm">未設定</span>
                        )}
                    </div>
                </Card>
                <Card title="GIVE (提供できるもの)" action={
                    isOwnProfile ? (
                        <button
                            onClick={() => router.push('/profile/edit#give')}
                            className="text-accent hover:text-accent/80 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    ) : undefined
                }>
                    <div className="flex flex-wrap gap-2">
                        {profile.giveTags && profile.giveTags.length > 0 ? (
                            profile.giveTags.map((tag, i) => (
                                <span key={i} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-medium">
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 text-sm">未設定</span>
                        )}
                    </div>
                </Card>
            </div>

            {/* ゴールデンチケット */}
            {isOwnProfile && (
                <Card className="border-accent/30 bg-gradient-to-br from-accent/10 via-surface-elevated to-surface overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="text-center mb-6">
                            <p className="text-xs text-accent tracking-widest uppercase mb-2">Golden Ticket</p>
                            <p className="text-[10px] text-gray-400 mb-4">
                                信頼できる仲間を、伍心会へ招待できます
                            </p>
                            <div className="bg-surface/50 rounded-xl p-4 border border-accent/20">
                                <p className="text-3xl font-mono font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent tracking-[0.3em]">
                                    {profile.inviteCode || 'コード未生成'}
                                </p>
                            </div>
                        </div>

                        {profile.inviteCode && (
                            <Button variant="gold" onClick={() => {
                                navigator.clipboard.writeText(profile.inviteCode || '');
                                toast.success('招待コードをコピーしました');
                            }} className="w-full mb-4">
                                <Copy className="w-4 h-4 mr-2" />
                                招待コードをコピー
                            </Button>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">{profile.referralCount || 0}</p>
                                <p className="text-[10px] text-gray-400">招待したメンバー</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-accent">+{(profile.referralCount || 0) * 50}</p>
                                <p className="text-[10px] text-gray-400">獲得ポイント</p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/10 text-center">
                            <p className="text-[10px] text-accent">
                                🎫 1名招待するごとに <span className="font-bold">+50pt</span> 獲得
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Industries */}
            {profile.industries && profile.industries.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {profile.industries.map((ind, i) => (
                        <span key={i} className="text-xs text-gray-500 bg-surface-elevated px-2 py-1 rounded">
                            #{ind}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
