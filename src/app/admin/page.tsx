"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { isAdmin } from '@/lib/permissions';
import { UserProfile } from '@/lib/types';
import { Users, Calendar, Ticket, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        rankDistribution: {} as Record<string, number>,
        totalEvents: 0,
        totalInviteUsages: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user || !profile || !isAdmin(profile)) {
            router.push('/');
            return;
        }

        const fetchStats = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'profiles'));
                const totalUsers = usersSnap.size;
                const rankDistribution: Record<string, number> = {};

                usersSnap.forEach(doc => {
                    const data = doc.data() as UserProfile;
                    const rank = data.rankBadge || 'WHITE';
                    rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
                });

                const eventsSnap = await getDocs(collection(db, 'events'));
                const inviteUsagesSnap = await getDocs(collection(db, 'inviteUsages'));

                setStats({
                    totalUsers,
                    rankDistribution,
                    totalEvents: eventsSnap.size,
                    totalInviteUsages: inviteUsagesSnap.size,
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, profile, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!user || !profile || !isAdmin(profile)) return null;

    const statCards = [
        { label: '総会員数', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
        { label: '総イベント数', value: stats.totalEvents, icon: Calendar, color: 'text-green-400' },
        { label: '招待使用数', value: stats.totalInviteUsages, icon: Ticket, color: 'text-purple-400' },
        { label: 'プラチナ会員', value: stats.rankDistribution['PLATINUM'] || 0, icon: TrendingUp, color: 'text-accent' },
    ];

    return (
        <div className="min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">管理者ダッシュボード</h1>
                        <p className="text-gray-400 mt-1">伍心会の運営状況を確認</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/home')}>
                        ホームに戻る
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {statCards.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="text-center">
                                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                                <p className="text-3xl font-bold text-white">{stat.value}</p>
                                <p className="text-sm text-gray-400">{stat.label}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'ユーザー管理', path: '/admin/users', desc: 'ランク・権限の変更' },
                        { label: 'イベント管理', path: '/admin/events', desc: 'イベントの作成・編集' },
                        { label: '招待コード管理', path: '/admin/invites', desc: 'コードの発行・停止' },
                        { label: '統計・分析', path: '/admin/analytics', desc: '詳細なデータ分析' },
                    ].map((action) => (
                        <button
                            key={action.path}
                            onClick={() => router.push(action.path)}
                            className="glass glass-hover rounded-2xl p-6 text-left transition-all hover:scale-[1.02]"
                        >
                            <h3 className="text-lg font-bold text-white mb-1">{action.label}</h3>
                            <p className="text-sm text-gray-400">{action.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Rank Distribution */}
                <Card title="ランク分布" className="mt-8">
                    <div className="space-y-4">
                        {['PLATINUM', 'DIAMOND', 'GOLD', 'SILVER', 'BLUE', 'WHITE'].map((rank) => {
                            const count = stats.rankDistribution[rank] || 0;
                            const percentage = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                            return (
                                <div key={rank} className="flex items-center">
                                    <span className="w-24 text-sm font-medium text-gray-300">{rank}</span>
                                    <div className="flex-1 mx-4">
                                        <div className="w-full bg-surface-elevated rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-accent to-accent-light"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-white w-12 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
