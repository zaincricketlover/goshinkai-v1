"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Users, Calendar, TrendingUp, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function AnalyticsPage() {
    // 統計データを取得（実装）
    const router = useRouter();

    return (
        <div className="min-h-screen bg-primary pb-20 px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">統計・分析</h1>
                <Button variant="outline" onClick={() => router.push('/admin')}>戻る</Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="text-center p-4">
                    <Users className="w-8 h-8 text-accent mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">--</p>
                    <p className="text-xs text-gray-400">総メンバー数</p>
                </Card>
                <Card className="text-center p-4">
                    <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">--</p>
                    <p className="text-xs text-gray-400">開催イベント数</p>
                </Card>
                <Card className="text-center p-4">
                    <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">--</p>
                    <p className="text-xs text-gray-400">マッチング成立数</p>
                </Card>
                <Card className="text-center p-4">
                    <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-white">--</p>
                    <p className="text-xs text-gray-400">平均ランクスコア</p>
                </Card>
            </div>

            <p className="text-gray-500 text-center">詳細な統計機能は開発中です</p>
        </div>
    );
}
