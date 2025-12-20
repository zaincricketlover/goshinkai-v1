"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter, UserPlus, MessageSquare, Calendar, Heart, X, Sparkles, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { UserProfile, Interest } from '@/lib/types';
import { addDoc, setDoc, deleteDoc, limit, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface ConnectionWithProfile {
    connection: {
        id: string;
        connectedUserId: string;
        connectedAt: any;
        connectedLocation?: string;
        memo?: string;
        tags?: string[];
    };
    profile: UserProfile;
}

export default function ConnectionsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
    const [filteredConnections, setFilteredConnections] = useState<ConnectionWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [recommendedUsers, setRecommendedUsers] = useState<UserProfile[]>([]);
    const [recommendationIndex, setRecommendationIndex] = useState(0);
    const [isListExpanded, setIsListExpanded] = useState(true);
    const [swiping, setSwiping] = useState(false);

    // Drag/Swipe values
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-100, 100], [-30, 30]);
    const opacity = useTransform(x, [-100, -50, 0, 50, 100], [0, 1, 1, 1, 0]);
    const heartScale = useTransform(x, [0, 80], [0, 1.2]);
    const xBorder = useTransform(x, [-80, 0], [1.2, 0]);

    useEffect(() => {
        const fetchConnectionsAndRecs = async () => {
            if (!user) return;

            try {
                // 1. コネクション取得
                const connectionsRef = collection(db, 'connections');
                const qc = query(
                    connectionsRef,
                    where('ownerUserId', '==', user.uid),
                    where('status', '==', 'active'),
                    orderBy('connectedAt', 'desc')
                );

                const connSnapshot = await getDocs(qc);
                const connectionsList: ConnectionWithProfile[] = [];

                for (const docSnap of connSnapshot.docs) {
                    const connectionData = docSnap.data();
                    const profileSnap = await getDoc(doc(db, 'profiles', connectionData.connectedUserId));
                    if (profileSnap.exists()) {
                        connectionsList.push({
                            connection: { id: docSnap.id, ...connectionData } as any,
                            profile: profileSnap.data() as UserProfile,
                        });
                    }
                }
                setConnections(connectionsList);
                setFilteredConnections(connectionsList);

                // 2. おすすめユーザー（未興味のユーザー）取得
                // 自分が既に「興味あり」したユーザーIDを取得
                const interestsRef = collection(db, 'interests');
                const qi = query(interestsRef, where('fromUserId', '==', user.uid));
                const interestSnapshot = await getDocs(qi);
                const interestedUserIds = interestSnapshot.docs.map(d => d.data().toUserId);

                // プロフィール一覧から自分と「興味あり」済みを除外
                const profilesRef = collection(db, 'profiles');
                const qp = query(profilesRef, limit(20)); // とりあえず20件
                const profilesSnapshot = await getDocs(qp);

                const recs: UserProfile[] = [];
                profilesSnapshot.forEach(docSnap => {
                    const p = docSnap.data() as UserProfile;
                    if (p.userId !== user.uid && !interestedUserIds.includes(p.userId)) {
                        recs.push(p);
                    }
                });

                // ランダムにシャッフル
                setRecommendedUsers(recs.sort(() => Math.random() - 0.5));

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConnectionsAndRecs();
    }, [user]);

    const handleSwipe = async (direction: 'left' | 'right', targetUser: UserProfile) => {
        if (!user || swiping) return;
        setSwiping(true);

        if (direction === 'right') {
            // 興味あり登録
            try {
                const interestDocId = `${user.uid}_${targetUser.userId}`;
                await setDoc(doc(db, 'interests', interestDocId), {
                    fromUserId: user.uid,
                    toUserId: targetUser.userId,
                    createdAt: serverTimestamp()
                });
                toast.success(`${targetUser.name}さんに興味ありを送信しました！`);
            } catch (e) {
                console.error(e);
            }
        }

        // 次のカードへ
        setRecommendationIndex(prev => prev + 1);
        setSwiping(false);
        x.set(0);
    };

    // 検索・フィルター処理
    useEffect(() => {
        let filtered = [...connections];

        // 検索クエリでフィルター
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.profile.name?.toLowerCase().includes(query) ||
                c.profile.companyName?.toLowerCase().includes(query) ||
                c.connection.memo?.toLowerCase().includes(query)
            );
        }

        // タグでフィルター
        if (filterTag) {
            filtered = filtered.filter(c =>
                c.connection.tags?.includes(filterTag)
            );
        }

        setFilteredConnections(filtered);
    }, [searchQuery, filterTag, connections]);

    // 全タグを取得
    const allTags = [...new Set(connections.flatMap(c => c.connection.tags || []))];

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
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

    return (
        <div className="min-h-screen bg-primary pb-32">
            {/* 1. おすすめスワイプセクション */}
            <div className="px-4 py-8 overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <h2 className="text-xl font-bold text-white">おすすめのメンバー</h2>
                </div>

                <div className="relative h-[380px] w-full max-w-sm mx-auto">
                    <AnimatePresence>
                        {recommendationIndex < recommendedUsers.length ? (
                            <motion.div
                                key={recommendedUsers[recommendationIndex].userId}
                                style={{ x, rotate, opacity }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x > 100) handleSwipe('right', recommendedUsers[recommendationIndex]);
                                    else if (info.offset.x < -100) handleSwipe('left', recommendedUsers[recommendationIndex]);
                                }}
                                className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
                            >
                                <Card className="h-full border-accent/20 flex flex-col p-0 overflow-hidden bg-gradient-to-b from-surface-elevated to-surface">
                                    <div className="h-48 relative">
                                        <img
                                            src={recommendedUsers[recommendationIndex].avatarUrl || '/default-avatar.png'}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />

                                        {/* Swipe Indicators */}
                                        <motion.div style={{ scale: heartScale }} className="absolute top-4 right-4 bg-pink-500 p-2 rounded-full text-white shadow-lg">
                                            <Heart className="w-6 h-6 fill-current" />
                                        </motion.div>
                                        <motion.div style={{ scale: xBorder }} className="absolute top-4 left-4 bg-gray-500 p-2 rounded-full text-white shadow-lg">
                                            <X className="w-6 h-6" />
                                        </motion.div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold text-white">{recommendedUsers[recommendationIndex].name}</h3>
                                            <Badge rank={recommendedUsers[recommendationIndex].rankBadge} size="sm" />
                                        </div>
                                        <p className="text-sm text-accent font-medium mb-3">{recommendedUsers[recommendationIndex].companyName}</p>
                                        <p className="text-xs text-gray-400 line-clamp-3 mb-4">
                                            {recommendedUsers[recommendationIndex].bio || '自己紹介はまだありません。'}
                                        </p>
                                        <div className="mt-auto flex justify-center gap-8">
                                            <button
                                                onClick={() => handleSwipe('left', recommendedUsers[recommendationIndex])}
                                                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 transition-colors"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={() => handleSwipe('right', recommendedUsers[recommendationIndex])}
                                                className="w-12 h-12 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-500 hover:bg-pink-500/30 transition-colors"
                                            >
                                                <Heart className="w-6 h-6 fill-current" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-surface/50 rounded-2xl border border-white/5">
                                <div className="text-4xl mb-4">✨</div>
                                <h3 className="text-white font-bold mb-2">すべてチェックしました！</h3>
                                <p className="text-gray-500 text-sm">明日また新しいメンバーをチェックしましょう</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 2. コネクションリスト（折りたたみ式） */}
            <div className="mt-8">
                <div
                    className="px-4 py-4 flex items-center justify-between bg-surface-elevated/50 border-y border-white/5 cursor-pointer"
                    onClick={() => setIsListExpanded(!isListExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-bold text-white">
                            マイコネクション
                            <span className="ml-2 text-sm text-gray-500 font-normal">{connections.length}人</span>
                        </h2>
                    </div>
                    {isListExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </div>

                <AnimatePresence>
                    {isListExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="sticky top-0 z-10 bg-primary/80 backdrop-blur-sm px-4 py-4 space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="名前、会社名で検索..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="px-4 space-y-3 pb-8">
                                {filteredConnections.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500 text-sm">見つかりませんでした</p>
                                ) : (
                                    filteredConnections.map(({ connection, profile }) => (
                                        <Card
                                            key={connection.id}
                                            className="border-white/5 hover:border-accent/30 transition-all cursor-pointer bg-surface/30"
                                            onClick={() => router.push(`/connections/${connection.id}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar
                                                    src={profile.avatarUrl}
                                                    alt={profile.name || ''}
                                                    size="sm"
                                                    rank={profile.rankBadge}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-white text-sm truncate">{profile.name}</h3>
                                                        <Badge rank={profile.rankBadge} size="sm" />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 truncate">{profile.companyName}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/messages?userId=${profile.userId}`);
                                                    }}
                                                    className="p-2 rounded-lg bg-surface-elevated hover:bg-accent/20 transition-colors"
                                                >
                                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 浮かんでいるアクションボタン */}
            <div className="fixed bottom-24 right-4 z-30">
                <Button
                    variant="gold"
                    className="shadow-2xl rounded-full w-14 h-14 p-0 flex items-center justify-center"
                    onClick={() => router.push('/connections/add')}
                >
                    <UserPlus className="w-6 h-6" />
                </Button>
            </div>
        </div>
    );
}
