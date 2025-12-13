"use client";

import React, { useState, useEffect } from 'react';
import { Event } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, MapPin, Users, ChevronRight, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface EventCardProps {
    event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const router = useRouter();
    const [participantCount, setParticipantCount] = useState<number>(0);

    const maxParticipants = event.maxParticipants || 20; // Default 20
    const remainingSeats = Math.max(0, maxParticipants - participantCount);
    const isAlmostFull = remainingSeats <= 5 && remainingSeats > 0;
    const isFull = remainingSeats <= 0;

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const snap = await getDocs(
                    query(
                        collection(db, 'events', event.id, 'participants'),
                        where('status', '==', 'going')
                    )
                );
                setParticipantCount(snap.size);
            } catch (e) {
                console.error(e);
            }
        };
        fetchParticipants();
    }, [event.id]);

    const formatDate = (timestamp: Timestamp) => {
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const shareData = {
            title: `伍心会 - ${event.title}`,
            text: `${event.title}に参加しませんか？`,
            url: `${window.location.origin}/events/${event.id}`,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(shareData.url);
            toast.success('リンクをコピーしました');
        }
    };

    return (
        <Card className="group hover:border-accent/30 transition-all cursor-pointer bg-surface-elevated/50">
            <div onClick={() => router.push(`/events/${event.id}`)}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge rank="GOLD" showLabel={false} className="w-2 h-2 p-0" />
                            <span className="text-xs font-bold text-accent tracking-wider uppercase">
                                {event.isOpenToAllVenues ? 'ALL VENUES' : `${event.venueId.toUpperCase()} VENUE`}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
                            {event.title}
                        </h3>
                    </div>
                    <div className="bg-surface p-2 rounded-lg border border-white/5">
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-300">
                        <Calendar className="w-4 h-4 mr-3 text-gray-500" />
                        {formatDate(event.dateTime)}
                    </div>
                    <div className="flex items-center text-gray-300">
                        <MapPin className="w-4 h-4 mr-3 text-gray-500" />
                        {event.location}
                    </div>

                    {/* 参加状況 */}
                    <div className="space-y-2 mt-3 pt-3 border-t border-white/5">
                        {/* 参加者数と定員 */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-300">
                                <Users className="w-4 h-4 mr-2 text-gray-500" />
                                <span>参加予定 <span className="font-bold text-white">{participantCount}</span>名</span>
                            </div>
                            <span className="text-gray-500 text-xs">定員 {maxParticipants}名</span>
                        </div>

                        {/* 残り席数バー */}
                        <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' :
                                        isAlmostFull ? 'bg-orange-500' :
                                            'bg-accent'
                                    }`}
                                style={{ width: `${Math.min((participantCount / maxParticipants) * 100, 100)}%` }}
                            />
                        </div>

                        {/* 残り席数テキスト */}
                        <div className="flex items-center justify-center">
                            {isFull ? (
                                <span className="text-red-400 text-sm font-bold flex items-center">
                                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2" />
                                    満員御礼
                                </span>
                            ) : isAlmostFull ? (
                                <span className="text-orange-400 text-sm font-bold flex items-center animate-pulse">
                                    <span className="w-2 h-2 bg-orange-400 rounded-full mr-2" />
                                    残り{remainingSeats}席！お早めに
                                </span>
                            ) : (
                                <span className="text-gray-400 text-xs">
                                    残り {remainingSeats}席
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                    >
                        <Share2 className="w-4 h-4" />
                    </Button>

                    {isFull ? (
                        <Button variant="outline" className="flex-1" onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/events/${event.id}`);
                        }}>
                            キャンセル待ち
                        </Button>
                    ) : (
                        <Button variant="gold" className="flex-1" onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/events/${event.id}`);
                        }}>
                            {isAlmostFull ? '今すぐ参加' : '詳細・参加'}
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};
