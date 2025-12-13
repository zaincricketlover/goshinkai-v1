"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event } from '@/lib/types';
import { EventCard } from '@/components/events/EventCard';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EventsPage() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, [user]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div></div>;

    return (
        <div className="min-h-screen bg-primary pb-20 px-4 py-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">イベント</h1>
                        <p className="text-sm text-gray-400">今後の開催予定</p>
                    </div>
                    {profile?.isAdmin && (
                        <Button onClick={() => router.push('/events/create')} variant="secondary" size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            作成
                        </Button>
                    )}
                </div>

                {events.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-surface-elevated/30 rounded-2xl border border-white/5">
                        <p>現在、開催予定のイベントはありません。</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
