"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Heart, X, User, Calendar, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';

// Simplified Match Logic (Client-side for now, ideally server-side)
const calculateMatchScore = (p1: UserProfile, p2: UserProfile) => {
    let score = 0;
    // 1. Tag matching
    const p1Wants = new Set(p1.wantTags || []);
    const p2Gives = new Set(p2.giveTags || []);
    const p1Gives = new Set(p1.giveTags || []);
    const p2Wants = new Set(p2.wantTags || []);

    const match1 = [...p1Wants].filter(x => p2Gives.has(x)).length;
    const match2 = [...p2Wants].filter(x => p1Gives.has(x)).length;

    score += (match1 + match2) * 15;

    // 2. Industry matching
    const p1Ind = new Set(p1.industries || []);
    const p2Ind = new Set(p2.industries || []);
    const commonInd = [...p1Ind].filter(x => p2Ind.has(x)).length;
    score += commonInd * 10;

    // 3. Home Venue
    if (p1.homeVenueId === p2.homeVenueId) score += 5;

    // Cap at 95-99
    return Math.min(score + 30, 99); // Base compatibility
};

export default function MatchPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [recommendedUsers, setRecommendedUsers] = useState<(UserProfile & { matchResult: { score: number } })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!profile) {
                console.log('No profile available');
                return;
            }

            setLoading(true);
            try {
                // 全プロフィールを取得
                const profilesSnap = await getDocs(collection(db, 'profiles'));
                console.log('Total profiles found:', profilesSnap.size);

                // 既に興味ありを送った相手を取得
                const sentInterestsSnap = await getDocs(
                    query(
                        collection(db, 'interests'),
                        where('fromUserId', '==', profile.userId)
                    )
                );
                const sentToIds = new Set(
                    sentInterestsSnap.docs.map(d => d.data().toUserId)
                );

                const candidates: any[] = [];

                profilesSnap.forEach(docSnap => {
                    const data = docSnap.data() as UserProfile;

                    // 自分自身を除外
                    if (data.userId === profile.userId) return;

                    // 名前がない人を除外
                    if (!data.name) return;

                    // 既に興味ありを送った人を除外
                    if (sentToIds.has(data.userId)) return;

                    // マッチスコアを計算
                    const score = calculateMatchScore(profile, data);

                    candidates.push({
                        ...data,
                        matchResult: { score }
                    });
                });

                // スコア順にソート
                candidates.sort((a, b) => b.matchResult.score - a.matchResult.score);

                console.log('Candidates after filtering:', candidates.length);
                setRecommendedUsers(candidates.slice(0, 20));

            } catch (error: any) {
                console.error('Error fetching recommendations:', error);

                if (error?.code === 'permission-denied') {
                    toast.error('データの取得権限がありません');
                } else {
                    toast.error('おすすめの取得に失敗しました');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [profile]);

    const handleSendInterest = async () => {
        const currentMatch = recommendedUsers[currentIndex];
        if (!currentMatch || !user) return;

        try {
            await addDoc(collection(db, 'interests'), {
                fromUserId: user.uid,
                toUserId: currentMatch.userId,
                createdAt: serverTimestamp()
            });
            toast.success(`${currentMatch.name}さんに「興味あり」を送りました！`);
            // Add points (simplified, ideally via cloud function)
            // await updateDoc(doc(db, 'profiles', user.uid), { rankScore: increment(20) });
        } catch (error) {
            console.error(error);
        }
    };

    const handleSwipe = (direction: 'left' | 'right') => {
        if (direction === 'right') {
            handleSendInterest();
        }
        setCurrentIndex(prev => prev + 1);
    };

    const currentMatch = recommendedUsers[currentIndex];

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

    if (!currentMatch) {
        return (
            <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        おすすめメンバーがいません
                    </h3>
                    <p className="text-gray-400 mb-6">
                        プロフィールを充実させると<br />
                        マッチング精度が上がります
                    </p>
                    <Button
                        variant="gold"
                        onClick={() => router.push('/profile/edit')}
                    >
                        プロフィールを編集
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary pb-20 px-4 py-6 flex flex-col">
            <h1 className="text-center text-xl font-bold text-white mb-6">おすすめのメンバー</h1>

            <div className="flex-1 flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentMatch.userId}
                        initial={{ opacity: 0, x: 100, rotate: 10 }}
                        animate={{ opacity: 1, x: 0, rotate: 0 }}
                        exit={{ opacity: 0, x: -100, rotate: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(e, { offset }) => {
                            if (offset.x > 100) handleSwipe('right');
                            if (offset.x < -100) handleSwipe('left');
                        }}
                        className="w-full max-w-md"
                    >
                        <Card className="border-accent/20 p-6 shadow-2xl bg-surface-elevated/90 backdrop-blur-sm">
                            {/* アバター */}
                            <div className="text-center mb-4">
                                <Avatar src={currentMatch.avatarUrl} alt={currentMatch.name || 'Member'} size="xl" rank={currentMatch.rankBadge} className="mb-4 mx-auto" />
                                <h2 className="text-2xl font-bold text-white">{currentMatch.name}</h2>
                                <p className="text-sm text-gray-400">{currentMatch.companyName}</p>
                                <Badge rank={currentMatch.rankBadge} className="mt-2" />
                            </div>

                            {/* マッチ度 */}
                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-4xl font-extrabold text-accent">{currentMatch.matchResult.score}%</span>
                                    <div className="group relative">
                                        <HelpCircle className="w-5 h-5 text-gray-500 cursor-help" />
                                        <div className="hidden group-hover:block absolute z-50 w-64 p-3 bg-gray-900 border border-white/10 rounded-lg text-xs text-gray-300 left-1/2 -translate-x-1/2 bottom-full mb-2 shadow-xl">
                                            マッチ度は以下の要素で計算されます：
                                            <ul className="mt-2 space-y-1 text-left list-disc list-inside text-gray-400">
                                                <li>Want/Give のマッチング</li>
                                                <li>共通の業界タグ</li>
                                                <li>所属会場の一致</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Match Score</p>
                            </div>

                            {/* Want/Give */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-surface/50 p-3 rounded-lg border border-white/5">
                                    <p className="text-[10px] text-blue-400 font-bold mb-2 uppercase">WANT</p>
                                    <div className="flex flex-wrap gap-1">
                                        {currentMatch.wantTags?.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-xs text-gray-300">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-surface/50 p-3 rounded-lg border border-white/5">
                                    <p className="text-[10px] text-green-400 font-bold mb-2 uppercase">GIVE</p>
                                    <div className="flex flex-wrap gap-1">
                                        {currentMatch.giveTags?.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-xs text-gray-300">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* アクションボタン */}
                            <div className="flex justify-center gap-8 mt-2">
                                <Button
                                    variant="outline"
                                    className="w-16 h-16 rounded-full p-0 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                                    onClick={() => handleSwipe('left')}
                                >
                                    <X className="w-8 h-8" />
                                </Button>
                                <Button
                                    variant="gold"
                                    className="w-16 h-16 rounded-full p-0 shadow-gold-glow"
                                    onClick={() => handleSwipe('right')}
                                >
                                    <Heart className="w-8 h-8" />
                                </Button>
                            </div>

                            {/* 詳細ボタン */}
                            <Button
                                variant="ghost"
                                className="w-full mt-6 text-gray-400 hover:text-white"
                                onClick={() => router.push(`/profile/${currentMatch.userId}`)}
                            >
                                <User className="w-4 h-4 mr-2" />
                                詳細プロフィールを見る
                            </Button>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* 進捗表示 */}
            <p className="text-center text-xs text-gray-600 mt-4">
                Candidate {currentIndex + 1} / {recommendedUsers.length}
            </p>
        </div>
    );
}
