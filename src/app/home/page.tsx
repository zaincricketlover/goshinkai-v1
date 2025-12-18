"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LuxuryCard } from '@/components/home/LuxuryCard';
import { EventCountdown } from '@/components/home/EventCountdown';
import { ActionCards } from '@/components/home/ActionCards';
import { RecommendedMembers } from '@/components/home/RecommendedMembers';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LogOut, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { WelcomeModal } from '@/components/ui/WelcomeModal';
import { SetInviteCodeModal } from '@/components/ui/SetInviteCodeModal';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';

export default function HomePage() {
    const { profile, loading } = useAuth();
    const router = useRouter();
    const [showWelcome, setShowWelcome] = useState(false);
    const [showInviteCodeModal, setShowInviteCodeModal] = useState(false);
    const [actionItems, setActionItems] = useState<any[]>([]);

    useEffect(() => {
        const fetchActionItems = async () => {
            if (!profile?.userId) return;

            try {
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

                    // フォローアップ日が今日以前
                    if (data.followUpDate) {
                        const followUpDate = data.followUpDate.toDate();
                        if (followUpDate <= now) {
                            const profileSnap = await getDoc(doc(db, 'profiles', data.connectedUserId));
                            if (profileSnap.exists()) {
                                items.push({
                                    type: 'followUp',
                                    connectionId: docSnap.id,
                                    profile: profileSnap.data(),
                                    date: followUpDate,
                                });
                            }
                        }
                    }

                    // 30日以上連絡していない
                    if (data.lastContactedAt) {
                        const lastContact = data.lastContactedAt.toDate();
                        const daysSince = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
                        if (daysSince >= 30) {
                            const profileSnap = await getDoc(doc(db, 'profiles', data.connectedUserId));
                            if (profileSnap.exists()) {
                                items.push({
                                    type: 'noContact',
                                    connectionId: docSnap.id,
                                    profile: profileSnap.data(),
                                    daysSince,
                                });
                            }
                        }
                    }
                }

                setActionItems(items.slice(0, 5)); // 最大5件
            } catch (error) {
                console.error('Error fetching action items:', error);
            }
        };

        fetchActionItems();
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
                            <LuxuryCard />
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

                        <motion.section variants={fadeInUp}>
                            <RecommendedMembers />
                        </motion.section>
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
        </div>
    );
}
