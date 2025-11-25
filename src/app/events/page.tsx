"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Event } from '@/lib/types';

export default function EventsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        const fetchEvents = async () => {
            try {
                const eventsRef = collection(db, 'events');
                const q = query(eventsRef, orderBy('dateTime', 'asc'));
                const querySnapshot = await getDocs(q);

                const eventsList: Event[] = [];
                querySnapshot.forEach((doc) => {
                    eventsList.push({ id: doc.id, ...doc.data() } as Event);
                });

                setEvents(eventsList);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchEvents();
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (!user) return null;

    const formatDate = (timestamp: Timestamp) => {
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">イベント一覧</h1>
                    <div className="flex gap-3">
                        <Button onClick={() => router.push('/events/create')}>
                            イベントを作成
                        </Button>
                        <Button onClick={() => router.push('/home')} variant="outline">
                            ホームに戻る
                        </Button>
                    </div>
                </div>

                {events.length === 0 ? (
                    <Card title="イベントがありません">
                        <p className="text-gray-600">現在、開催予定のイベントはありません。</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {events.map((event) => (
                            <Card key={event.id}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {event.title}
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {formatDate(event.dateTime)}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {event.location}
                                            </div>
                                        </div>
                                        <p className="mt-3 text-gray-700">{event.description}</p>
                                        {event.isOpenToAllVenues && (
                                            <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                全拠点参加可能
                                            </span>
                                        )}
                                    </div>
                                    <div className="ml-6">
                                        <Button
                                            onClick={() => router.push(`/events/${event.id}`)}
                                        >
                                            詳細を見る
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
