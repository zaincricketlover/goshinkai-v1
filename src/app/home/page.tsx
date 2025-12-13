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
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { WelcomeModal } from '@/components/ui/WelcomeModal';

export default function HomePage() {
    const { profile, loading } = useAuth();
    const router = useRouter();
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // 初回表示チェック（localStorageで管理）
        const hasSeenWelcome = localStorage.getItem('goshinkai_welcome_seen');
        if (!hasSeenWelcome && profile) {
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
                <WelcomeModal
                    isOpen={showWelcome}
                    onClose={handleCloseWelcome}
                    name={profile.name}
                    rankBadge={profile.rankBadge}
                />
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
