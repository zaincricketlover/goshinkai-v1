"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MemberCard3D } from '@/components/home/MemberCard3D';
import { BusinessCardModal } from '@/components/home/BusinessCardModal';
import { EventCountdown } from '@/components/home/EventCountdown';
import { ActionCards } from '@/components/home/ActionCards';
import { RecommendedMembers } from '@/components/home/RecommendedMembers';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LogOut, Bell, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { WelcomeModal } from '@/components/ui/WelcomeModal';
import { SetInviteCodeModal } from '@/components/ui/SetInviteCodeModal';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { calculateMatchScore } from '@/lib/matchScore';
import { WelcomeOnboarding } from '@/components/onboarding/WelcomeOnboarding';

export default function HomePage() {
    const { profile, loading } = useAuth();
    const router = useRouter();
    const [showWelcome, setShowWelcome] = useState(false);
    const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showBusinessCardModal, setShowBusinessCardModal] = useState(false);
    const [actionItems, setActionItems] = useState<any[]>([]);
    const [interestedInMe, setInterestedInMe] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!profile?.userId) return;

            try {
                // 1. 今日のアクション
                const connectionsRef = collection(db, 'connections');
                const q = query(
                    connectionsRef,
                    where('ownerUserId', '==', profile.userId),
                    where('status', '==', 'active')
                );

                const snapshot = await getDocs(q);
                const items: any[] = [];
                const now = new Date();

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    if (data.followUpDate) {
                        const followUpDate = data.followUpDate.toDate();
                        if (followUpDate <= now) {
                            const pSnap = await getDoc(doc(db, 'profiles', data.connectedUserId));
                            if (pSnap.exists()) {
                                items.push({ type: 'followUp', connectionId: docSnap.id, profile: pSnap.data(), date: followUpDate });
                            }
                        }
                    }
                }
                setActionItems(items.slice(0, 5));

                // 2. あなたに興味がある人
                const interestedRef = collection(db, 'interests');
                const iq = query(interestedRef, where('toUserId', '==', profile.userId));
                const iSnapshot = await getDocs(iq);
                const interested: any[] = [];
                for (const iDoc of iSnapshot.docs) {
                    const fromUserId = iDoc.data().fromUserId;
                    const pSnap = await getDoc(doc(db, 'profiles', fromUserId));
                    if (pSnap.exists()) interested.push({ userId: fromUserId, ...pSnap.data() });
                }
                setInterestedInMe(interested);

                // 3. おすすめメンバー
                const profilesRef = collection(db, 'profiles');
                const pSnapshot = await getDocs(query(profilesRef, limit(20)));
                const allProfiles: any[] = [];
                pSnapshot.forEach(d => {
                    if (d.id !== profile.userId) {
                        const pData = d.data();
                        const matchResult = calculateMatchScore(profile, pData as any);
                        allProfiles.push({ userId: d.id, ...pData, matchScore: matchResult.score });
                    }
                });
                setRecommendations(allProfiles.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3));

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchData();
    }, [profile?.userId]);

    useEffect(() => {
        if (!profile) return;

        // 招待コードが未設定の場合にモーダルを表示
        if (profile && !profile.inviteCode) {
            // WelcomeModalが閉じた後に表示
            const timer = setTimeout(() => {
                setShowInviteCodeModal(true);
            }, 2000); // WelcomeModal後に表示
            return () => clearTimeout(timer);
        }

        // Welcome Modal Logic
        const hasSeenWelcome = localStorage.getItem('goshinkai_welcome_seen');
        if (!hasSeenWelcome) {
            setShowWelcome(true);
        }

        // オンボーディング未完了の場合に表示
        if (profile && !profile.onboardingCompleted) {
            setShowOnboarding(true);
        }
    }, [profile]);

    const handleCloseWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem('goshinkai_welcome_seen', 'true');
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!profile) return null;

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const slideUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
    };

    return (
        <div className="min-h-screen bg-primary text-white pb-24 overflow-x-hidden">

            {profile && (
                <>
                    <WelcomeModal
                        isOpen={showWelcome}
                        onClose={handleCloseWelcome}
                        name={profile.name}
                        rankBadge={profile.rankBadge}
                    />
                    <SetInviteCodeModal
                        isOpen={showInviteCodeModal}
                        onClose={() => setShowInviteCodeModal(false)}
                        userId={profile.userId}
                    />
                    <WelcomeOnboarding
                        isOpen={showOnboarding}
                        onClose={() => setShowOnboarding(false)}
                        userId={profile.userId}
                        userName={profile.name || ''}
                    />
                </>
            )}
            {/* Header / Top Section */}
            <div className="bg-primary pt-8 pb-6 px-4">
                <div className="max-w-md mx-auto space-y-6">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={container}
                        className="space-y-6"
                    >
                        <motion.section variants={slideUp}>
                            <MemberCard3D
                                profile={profile as any}
                                onQRClick={() => setShowBusinessCardModal(true)}
                            />
                        </motion.section>

                        <motion.section variants={fadeInUp}>
                            <EventCountdown />
                        </motion.section>

                        <motion.section variants={fadeInUp}>
                            <ActionCards />
                        </motion.section>

                        {/* 今日のアクション */}
                        {actionItems.length > 0 && (
                            <motion.section variants={fadeInUp}>
                                <Card className="border-accent/20 mb-6 bg-surface/50 backdrop-blur-sm">
                                    <h3 className="text-sm font-bold text-accent mb-3 flex items-center gap-2">
                                        <Bell className="w-4 h-4" />
                                        今日のアクション
                                    </h3>
                                    <div className="space-y-3">
                                        {actionItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-2 bg-surface rounded-lg cursor-pointer hover:bg-surface-elevated transition-colors border border-white/5"
                                                onClick={() => router.push(`/connections/${item.connectionId}`)}
                                            >
                                                <Avatar
                                                    src={item.profile.avatarUrl}
                                                    alt={item.profile.name || ''}
                                                    size="sm"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">{item.profile.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {item.type === 'followUp'
                                                            ? 'フォローアップ予定日です'
                                                            : `${item.daysSince}日間連絡していません`
                                                        }
                                                    </p>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/messages?userId=${item.profile.userId}`);
                                                }}>
                                                    連絡
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.section>
                        )}

                        {/* あなたに興味がある人 */}
                        {interestedInMe.length > 0 && (
                            <motion.section variants={fadeInUp}>
                                <Card className="border-accent/20 mb-6 bg-surface/50 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-accent flex items-center gap-2">
                                            <Heart className="w-4 h-4 fill-accent" />
                                            あなたに興味がある人
                                        </h3>
                                        <button
                                            onClick={() => router.push('/connections')}
                                            className="text-xs text-accent hover:underline"
                                        >
                                            すべて見る →
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {interestedInMe.slice(0, 3).map(person => (
                                            <div
                                                key={person.userId}
                                                className="flex items-center gap-3 p-2 bg-surface rounded-lg cursor-pointer hover:bg-surface-elevated border border-white/5"
                                                onClick={() => router.push(`/profile/${person.userId}`)}
                                            >
                                                <Avatar src={person.avatarUrl} alt={person.name || ''} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">{person.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{person.companyName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.section>
                        )}

                        {/* あなたにおすすめ */}
                        {recommendations.length > 0 && (
                            <motion.section variants={fadeInUp}>
                                <Card className="border-white/5 mb-6 bg-surface/30">
                                    <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-yellow-500" />
                                        あなたにおすすめ
                                    </h3>
                                    <div className="space-y-3">
                                        {recommendations.slice(0, 3).map((person, index) => (
                                            <div
                                                key={person.userId}
                                                className="flex items-center gap-3 p-3 bg-surface rounded-lg cursor-pointer hover:bg-surface-elevated transition-colors border border-white/5"
                                                onClick={() => router.push(`/profile/${person.userId}`)}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-yellow-500 text-black' :
                                                    index === 1 ? 'bg-gray-400 text-black' :
                                                        'bg-amber-700 text-white'
                                                    }`}>
                                                    {index + 1}
                                                </div>

                                                <Avatar
                                                    src={person.avatarUrl}
                                                    alt={person.name || ''}
                                                    size="md"
                                                    rank={person.rankBadge}
                                                />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-white font-medium truncate">{person.name}</p>
                                                        <Badge rank={person.rankBadge} size="sm" showLabel={false} />
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate">{person.companyName}</p>

                                                    {person.matchScore && (
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-accent rounded-full"
                                                                    style={{ width: `${person.matchScore}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-accent">{person.matchScore}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.section>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="pt-4 flex justify-center"
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-gray-500 hover:text-white"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            ログアウト
                        </Button>
                    </motion.div>
                </div>
            </div>

            <BusinessCardModal
                isOpen={showBusinessCardModal}
                onClose={() => setShowBusinessCardModal(false)}
                profile={profile as any}
            />
        </div>
    );
}
