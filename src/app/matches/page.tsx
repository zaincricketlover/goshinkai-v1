"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Heart, MessageCircle, User, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface MatchedUser {
    profile: UserProfile;
    matchedAt: Date;
}

export default function MatchesPage() {
    const { user, profile: currentProfile } = useAuth();
    const router = useRouter();
    const [matches, setMatches] = useState<MatchedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [messageLoading, setMessageLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchMatches = async () => {
            try {
                // 1. 自分が興味ありを送ったユーザーを取得
                const sentQuery = query(
                    collection(db, 'interests'),
                    where('fromUserId', '==', user.uid)
                );
                const sentSnapshot = await getDocs(sentQuery);
                const sentToIds = sentSnapshot.docs.map(d => d.data().toUserId);

                // 2. 自分に興味ありを送ってきたユーザーを取得
                const receivedQuery = query(
                    collection(db, 'interests'),
                    where('toUserId', '==', user.uid)
                );
                const receivedSnapshot = await getDocs(receivedQuery);
                const receivedFromIds = receivedSnapshot.docs.map(d => d.data().fromUserId);

                // 3. 両方に存在するユーザーID = マッチ
                const matchedUserIds = sentToIds.filter(id => receivedFromIds.includes(id));

                // 4. マッチしたユーザーのプロフィールを取得
                const matchedUsers: MatchedUser[] = [];
                for (const userId of matchedUserIds) {
                    const profileDoc = await getDoc(doc(db, 'profiles', userId));
                    if (profileDoc.exists()) {
                        matchedUsers.push({
                            profile: profileDoc.data() as UserProfile,
                            matchedAt: new Date()
                        });
                    }
                }

                setMatches(matchedUsers);
            } catch (error) {
                console.error('Error fetching matches:', error);
                toast.error('マッチの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [user]);

    const handleSendMessage = async (targetProfile: UserProfile) => {
        if (!user || !currentProfile) return;
        setMessageLoading(targetProfile.userId);

        try {
            // Check if thread already exists
            const threadsRef = collection(db, 'threads');
            const q = query(
                threadsRef,
                where('participantUserIds', 'array-contains', user.uid)
            );
            const threadsSnap = await getDocs(q);

            let existingThreadId: string | null = null;
            threadsSnap.forEach((doc) => {
                const data = doc.data();
                if (data.participantUserIds.includes(targetProfile.userId)) {
                    existingThreadId = doc.id;
                }
            });

            if (existingThreadId) {
                router.push(`/messages/${existingThreadId}`);
            } else {
                // Create new thread
                const newThreadRef = await addDoc(collection(db, 'threads'), {
                    participantUserIds: [user.uid, targetProfile.userId],
                    createdAt: serverTimestamp(),
                    lastMessageAt: serverTimestamp(),
                    lastMessageText: '',
                    lastMessageSenderId: ''
                });
                router.push(`/messages/${newThreadRef.id}`);
            }
        } catch (error) {
            console.error('Error creating/finding thread:', error);
            toast.error('エラーが発生しました');
        } finally {
            setMessageLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary pb-24 px-4 py-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Heart className="w-6 h-6 text-pink-500" />
                            マッチ
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            お互いに興味ありを送り合った相手
                        </p>
                    </div>
                    <span className="text-sm text-gray-400 bg-surface-elevated px-3 py-1 rounded-full">
                        {matches.length}人
                    </span>
                </div>

                {matches.length === 0 ? (
                    <Card className="text-center py-12">
                        <Sparkles className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">
                            まだマッチはありません
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                            メンバー一覧から気になる人に「興味あり」を送ってみましょう。
                            お互いに興味ありを送り合うとマッチが成立します。
                        </p>
                        <Button
                            variant="gold"
                            onClick={() => router.push('/members')}
                        >
                            メンバーを探す
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {matches.map((match, index) => (
                            <motion.div
                                key={match.profile.userId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="hover:border-pink-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => router.push(`/profile/${match.profile.userId}`)}
                                            className="flex-shrink-0"
                                        >
                                            <Avatar
                                                src={match.profile.avatarUrl}
                                                alt={match.profile.name}
                                                size="lg"
                                                rank={match.profile.rankBadge}
                                            />
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => router.push(`/profile/${match.profile.userId}`)}
                                                className="text-left w-full"
                                            >
                                                <h3 className="text-lg font-bold text-white truncate hover:text-accent transition-colors">
                                                    {match.profile.name}
                                                </h3>
                                                <p className="text-sm text-gray-400 truncate">
                                                    {match.profile.companyName}
                                                    {match.profile.title && ` / ${match.profile.title}`}
                                                </p>
                                                {match.profile.catchCopy && (
                                                    <p className="text-xs text-gray-500 truncate mt-1">
                                                        {match.profile.catchCopy}
                                                    </p>
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex-shrink-0 flex flex-col gap-2">
                                            <Button
                                                variant="gold"
                                                size="sm"
                                                onClick={() => handleSendMessage(match.profile)}
                                                isLoading={messageLoading === match.profile.userId}
                                            >
                                                <MessageCircle className="w-4 h-4 mr-1" />
                                                トーク
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/profile/${match.profile.userId}`)}
                                            >
                                                <User className="w-4 h-4 mr-1" />
                                                詳細
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {(match.profile.wantTags?.length > 0 || match.profile.giveTags?.length > 0) && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <div className="flex flex-wrap gap-2">
                                                {match.profile.wantTags?.slice(0, 2).map(tag => (
                                                    <span key={tag} className="text-xs px-2 py-1 bg-pink-500/10 text-pink-400 rounded-full border border-pink-500/20">
                                                        求: {tag}
                                                    </span>
                                                ))}
                                                {match.profile.giveTags?.slice(0, 2).map(tag => (
                                                    <span key={tag} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                                                        供: {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
