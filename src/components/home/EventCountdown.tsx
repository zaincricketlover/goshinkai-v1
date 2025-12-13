"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Users } from 'lucide-react';

export const EventCountdown = () => {
    const router = useRouter();
    const [nextEvent, setNextEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
        const fetchNextEvent = async () => {
            try {
                const now = Timestamp.now();
                const q = query(
                    collection(db, 'events'),
                    where('dateTime', '>=', now),
                    orderBy('dateTime', 'asc'),
                    limit(1)
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    setNextEvent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Event);
                }
            } catch (error) {
                console.error('Error fetching next event:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNextEvent();
    }, []);

    // カウントダウン計算
    useEffect(() => {
        if (!nextEvent) return;

        const calculateCountdown = () => {
            const now = new Date().getTime();
            const eventTime = nextEvent.dateTime.toDate().getTime();
            const diff = eventTime - now;

            if (diff > 0) {
                setCountdown({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                });
            }
        };

        calculateCountdown();
        const timer = setInterval(calculateCountdown, 60000); // 1分ごとに更新

        return () => clearInterval(timer);
    }, [nextEvent]);

    if (loading) {
        return (
            <Card className="bg-surface-elevated/50 border-white/5">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                    <div className="h-8 bg-gray-700 rounded w-2/3"></div>
                    <div className="h-10 bg-gray-700 rounded"></div>
                </div>
            </Card>
        );
    }

    if (!nextEvent) {
        return (
            <Card className="bg-surface-elevated/50 border-white/5 text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">予定されているイベントはありません</p>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => router.push('/events')}
                >
                    イベント一覧を見る
                </Button>
            </Card>
        );
    }

    const formatDate = (timestamp: Timestamp) => {
        return timestamp.toDate().toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
        });
    };

    const formatTime = (timestamp: Timestamp) => {
        return timestamp.toDate().toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card className="bg-surface-elevated/50 border-white/5">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-400">次回定例会まで</h3>
                <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded">
                    {countdown.days}日 : {String(countdown.hours).padStart(2, '0')}時間 : {String(countdown.minutes).padStart(2, '0')}分
                </span>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-lg font-bold text-white mb-1">{nextEvent.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
                            {formatDate(nextEvent.dateTime)} {formatTime(nextEvent.dateTime)}〜
                        </div>
                        <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1.5 text-gray-500" />
                            {nextEvent.location}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="gold"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/events/${nextEvent.id}`)}
                    >
                        参加表明する
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/events/${nextEvent.id}`)}
                    >
                        詳細を見る
                    </Button>
                </div>
            </div>
        </Card>
    );
};
