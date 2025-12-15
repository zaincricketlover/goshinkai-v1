"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import {
    Users, Calendar, MessageSquare, Star, TrendingUp,
    Award, Target, Gift, ArrowLeft
} from 'lucide-react';

export default function UserDashboardPage() {
    const { profile, loading } = useAuth();
    const router = useRouter();

    if (loading) return <div className="min-h-screen bg-primary flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div></div>;
    if (!profile) return null;

    const rankProgress = Math.min((profile.rankScore / 2000) * 100, 100); // Using Platinum limit for scale visual

    return (
        <div className="min-h-screen bg-primary pb-20 px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-6">

                <div className="flex items-center mb-4">
                    <button onClick={() => router.back()} className="mr-4 p-2 rounded-full hover:bg-white/5 text-gray-300">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold text-white">マイダッシュボード</h1>
                </div>

                {/* ランク進捗 */}
                <Card className="border-accent/20 bg-gradient-to-br from-surface-elevated to-surface">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="font-bold text-white text-lg">現在のランク</h2>
                            <Badge rank={profile.rankBadge} />
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-accent">{profile.rankScore}</span>
                            <span className="text-xs text-gray-400 ml-1">pt</span>
                        </div>
                    </div>

                    <div className="relative pt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>0pt</span>
                            <span>Next Rank Goal</span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-3 mb-2 overflow-hidden border border-white/5">
                            <div
                                className="bg-gradient-to-r from-accent to-accent-light h-full rounded-full transition-all duration-1000"
                                style={{ width: `${rankProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-right text-gray-400">
                            (総合スコアに基づく進捗)
                        </p>
                    </div>
                </Card>

                {/* 統計 */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="border-accent/20 text-center hover:bg-white/5 transition-colors">
                        <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{profile.eventsAttended || 0}</p>
                        <p className="text-xs text-gray-400">参加イベント</p>
                    </Card>
                    <Card className="border-accent/20 text-center hover:bg-white/5 transition-colors">
                        <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{profile.referralCount || 0}</p>
                        <p className="text-xs text-gray-400">招待したメンバー</p>
                    </Card>
                    <Card className="border-accent/20 text-center hover:bg-white/5 transition-colors">
                        <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{profile.interestsReceived || 0}</p>
                        <p className="text-xs text-gray-400">興味あり獲得数</p>
                    </Card>
                    <Card className="border-accent/20 text-center hover:bg-white/5 transition-colors">
                        <MessageSquare className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{profile.messagesCount || 0}</p>
                        <p className="text-xs text-gray-400">メッセージ数</p>
                    </Card>
                </div>

                {/* ポイント獲得ルール */}
                <Card className="border-accent/20">
                    <h2 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                        <Gift className="w-5 h-5 text-accent" />
                        ポイント獲得ルール
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-white/5">
                            <span className="text-gray-300 flex items-center gap-2"><Target className="w-4 h-4 text-gray-500" />イベント参加</span>
                            <span className="text-accent font-bold">+50pt</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-white/5">
                            <span className="text-gray-300 flex items-center gap-2"><Award className="w-4 h-4 text-gray-500" />イベントチェックイン</span>
                            <span className="text-accent font-bold">+100pt</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-white/5">
                            <span className="text-gray-300 flex items-center gap-2"><Users className="w-4 h-4 text-gray-500" />メンバー招待</span>
                            <span className="text-accent font-bold">+50pt</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-white/5">
                            <span className="text-gray-300 flex items-center gap-2"><User className="w-4 h-4 text-gray-500" />プロフィール完成</span>
                            <span className="text-accent font-bold">+30pt</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-surface rounded-lg border border-white/5">
                            <span className="text-gray-300 flex items-center gap-2"><Star className="w-4 h-4 text-gray-500" />興味ありマッチ成立</span>
                            <span className="text-accent font-bold">+20pt</span>
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
}

// Helper component since 'User' was used in icon list but not imported or used
function User(props: any) {
    return <Users {...props} />;
}
