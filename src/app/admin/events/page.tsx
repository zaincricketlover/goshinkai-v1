"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { isAdmin } from '@/lib/permissions';
import { Event, VenueId } from '@/lib/types';

export default function AdminEventsPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [location, setLocation] = useState('');
    const [venueId, setVenueId] = useState<VenueId>('osaka');
    const [isOpenToAllVenues, setIsOpenToAllVenues] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        if (!user || !profile || !isAdmin(profile)) {
            router.push('/');
            return;
        }

        fetchEvents();
    }, [user, profile, authLoading, router]);

    const fetchEvents = async () => {
        try {
            const eventsSnap = await getDocs(collection(db, 'events'));
            const eventsList: Event[] = [];
            eventsSnap.forEach(doc => {
                eventsList.push({ id: doc.id, ...doc.data() } as Event);
            });
            // Sort by date desc
            eventsList.sort((a, b) => b.dateTime.seconds - a.dateTime.seconds);
            setEvents(eventsList);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('イベントを作成しますか？')) return;
        setCreating(true);

        try {
            await addDoc(collection(db, 'events'), {
                title,
                description,
                dateTime: Timestamp.fromDate(new Date(dateTime)),
                location,
                venueId,
                isOpenToAllVenues,
                createdBy: user?.uid,
                createdAt: Timestamp.now(),
            });

            alert('イベントを作成しました');
            // Reset form
            setTitle('');
            setDescription('');
            setDateTime('');
            setLocation('');
            setVenueId('osaka');
            setIsOpenToAllVenues(false);

            fetchEvents();
        } catch (error) {
            console.error('Error creating event:', error);
            alert('作成に失敗しました');
        } finally {
            setCreating(false);
        }
    };

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (!user || !profile || !isAdmin(profile)) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">イベント管理</h1>
                    <Button onClick={() => router.push('/admin')} variant="outline">
                        ダッシュボードに戻る
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Event Form */}
                    <div className="lg:col-span-1">
                        <Card title="新規イベント作成">
                            <form onSubmit={handleCreateEvent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">タイトル</label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        placeholder="例: 大阪交流会"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">日時</label>
                                    <Input
                                        type="datetime-local"
                                        value={dateTime}
                                        onChange={(e) => setDateTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">場所</label>
                                    <Input
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        required
                                        placeholder="例: 梅田スカイビル"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">開催拠点</label>
                                    <select
                                        value={venueId}
                                        onChange={(e) => setVenueId(e.target.value as VenueId)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        <option value="osaka">大阪</option>
                                        <option value="kobe">神戸</option>
                                        <option value="tokyo">東京</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">詳細</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        rows={4}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="isOpenToAllVenues"
                                        type="checkbox"
                                        checked={isOpenToAllVenues}
                                        onChange={(e) => setIsOpenToAllVenues(e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isOpenToAllVenues" className="ml-2 block text-sm text-gray-900">
                                        全拠点参加可能にする
                                    </label>
                                </div>
                                <Button type="submit" isLoading={creating} className="w-full">
                                    作成する
                                </Button>
                            </form>
                        </Card>
                    </div>

                    {/* Event List */}
                    <div className="lg:col-span-2">
                        <Card title="イベント一覧">
                            <div className="space-y-4">
                                {events.map((event) => (
                                    <div key={event.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {event.dateTime.toDate().toLocaleString()} @ {event.location} ({event.venueId})
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => router.push(`/events/${event.id}`)}>
                                                詳細
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
