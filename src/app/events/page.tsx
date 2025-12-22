"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, MapPin, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Event } from '@/lib/types';

export default function EventsPage() {
    const { user, profile } = useAuth();
    const router = useRouter();

    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [showPastEvents, setShowPastEvents] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsRef = collection(db, 'events');
                const snapshot = await getDocs(query(eventsRef, orderBy('dateTime', 'desc')));

                const now = new Date();
                const upcoming: Event[] = [];
                const past: Event[] = [];

                snapshot.docs.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() } as Event;
                    const eventDate = data.dateTime?.toDate ? data.dateTime.toDate() : new Date(data.dateTime as any);

                    // Consider status or date to determine if past
                    if (eventDate >= now || (data as any).status === 'upcoming') {
                        upcoming.push(data);
                    } else {
                        past.push(data);
                    }
                });

                // Sort upcoming by date ascending
                upcoming.sort((a, b) => {
                    const dateA = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime as any);
                    const dateB = b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime as any);
                    return dateA.getTime() - dateB.getTime();
                });

                setUpcomingEvents(upcoming);
                setPastEvents(past);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary pb-24">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-white/5 px-4 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">イベント</h1>
                {profile?.isAdmin && (
                    <Button onClick={() => router.push('/events/create')} variant="secondary" size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        作成
                    </Button>
                )}
            </div>

            <div className="px-4 py-6 space-y-6">
                {/* 今後のイベント */}
                <div>
                    <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">今後のイベント</h2>
                    {upcomingEvents.length === 0 ? (
                        <Card className="border-white/5 text-center py-8">
                            <p className="text-gray-400">予定されているイベントはありません</p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {upcomingEvents.map(event => (
                                <Card
                                    key={event.id}
                                    className="border-accent/20 cursor-pointer hover:border-accent/40 transition-colors bg-surface/50"
                                    onClick={() => router.push(`/events/${event.id}`)}
                                >
                                    <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                        <Calendar className="w-4 h-4 text-accent" />
                                        <span>{formatDate(event.dateTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <MapPin className="w-4 h-4 text-accent" />
                                        <span>{event.location}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* 過去のイベント */}
                <div>
                    <button
                        onClick={() => setShowPastEvents(!showPastEvents)}
                        className="flex items-center justify-between w-full py-3 text-gray-400 border-t border-white/5"
                    >
                        <span className="text-sm font-bold">過去のイベント（{pastEvents.length}件）</span>
                        {showPastEvents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showPastEvents && (
                        <div className="space-y-3 mt-2">
                            {pastEvents.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">過去のイベントはありません</p>
                            ) : (
                                pastEvents.map(event => (
                                    <Card
                                        key={event.id}
                                        className="border-white/5 opacity-60 cursor-pointer hover:opacity-80 transition-opacity bg-black/20"
                                        onClick={() => router.push(`/events/${event.id}`)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-white">{event.title}</h3>
                                                <p className="text-xs text-gray-500">{formatDate(event.dateTime)}</p>
                                            </div>
                                            <span className="text-xs text-gray-500 bg-surface-elevated px-2 py-1 rounded">
                                                終了
                                            </span>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
