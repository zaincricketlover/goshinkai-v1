"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { isAdmin } from '@/lib/permissions';
import { UserProfile } from '@/lib/types';

export default function AdminDashboard() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalUsers: 0,
        rankDistribution: {} as Record<string, number>,
        totalEvents: 0,
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
                // Fetch Users
                const usersSnap = await getDocs(collection(db, 'profiles'));
                const totalUsers = usersSnap.size;
                const rankDistribution: Record<string, number> = {};

                usersSnap.forEach(doc => {
                    const data = doc.data() as UserProfile;
                    const rank = data.rankBadge || 'WHITE';
                    rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
                });

                // Fetch Events
                const eventsSnap = await getDocs(collection(db, 'events'));
                const totalEvents = eventsSnap.size;

                setStats({
                    totalUsers,
                    rankDistribution,
                    totalEvents,
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, profile, authLoading, router]);

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (!user || !profile || !isAdmin(profile)) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">管理者ダッシュボード</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-500">総会員数</h3>
                            <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalUsers}</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-500">総イベント数</h3>
                            <p className="text-4xl font-bold text-green-600 mt-2">{stats.totalEvents}</p>
                        </div>
                    </Card>
                    <Card>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-500">プラチナ会員</h3>
                            <p className="text-4xl font-bold text-purple-600 mt-2">
                                {stats.rankDistribution['PLATINUM'] || 0}
                            </p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="ランク分布">
                        <div className="space-y-4">
                            {Object.entries(stats.rankDistribution).map(([rank, count]) => (
                                <div key={rank} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">{rank}</span>
                                    <div className="flex items-center flex-1 mx-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="クイックアクション">
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-medium text-gray-900">ユーザー管理</span>
                                <span className="text-gray-400">→</span>
                            </button>
                            <button
                                onClick={() => router.push('/admin/events')}
                                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-medium text-gray-900">イベント管理</span>
                                <span className="text-gray-400">→</span>
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
