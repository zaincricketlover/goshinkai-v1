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
import { Calendar, MapPin } from 'lucide-react';

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
        e.stopPropagation();

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

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!user || !profile || !isAdmin(profile)) return null;

    return (
        <div className="min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">イベント管理</h1>
                        <p className="text-gray-400 mt-1">イベントの作成・編集</p>
                    </div>
                    <Button onClick={() => router.push('/admin')} variant="outline">
                        ダッシュボードに戻る
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Event Form */}
                    <Card title="新規イベント作成" className="lg:col-span-1">
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <Input
                                label="タイトル"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="例: 大阪交流会"
                            />
                            <Input
                                label="日時"
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                required
                            />
                            <Input
                                label="場所"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                                placeholder="例: 梅田スカイビル"
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">開催拠点</label>
                                <select
                                    value={venueId}
                                    onChange={(e) => setVenueId(e.target.value as VenueId)}
                                    className="block w-full bg-surface-elevated border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                                >
                                    <option value="osaka">大阪</option>
                                    <option value="kobe">神戸</option>
                                    <option value="tokyo">東京</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">詳細</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    rows={4}
                                    className="block w-full bg-surface-elevated border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                                    placeholder="イベントの詳細を入力..."
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    id="isOpenToAllVenues"
                                    type="checkbox"
                                    checked={isOpenToAllVenues}
                                    onChange={(e) => setIsOpenToAllVenues(e.target.checked)}
                                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                                />
                                <label htmlFor="isOpenToAllVenues" className="ml-2 block text-sm text-gray-300">
                                    全拠点参加可能にする
                                </label>
                            </div>
                            <Button type="button" onClick={handleCreateEvent} isLoading={creating} variant="gold" className="w-full">
                                作成する
                            </Button>
                        </form>
                    </Card>

                    {/* Event List */}
                    <Card title="イベント一覧" className="lg:col-span-2">
                        <div className="space-y-3">
                            {events.map((event) => (
                                <div key={event.id} className="glass rounded-xl p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-white mb-1">{event.title}</h3>
                                        <div className="flex items-center text-sm text-gray-400 space-x-4">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {event.dateTime.toDate().toLocaleString('ja-JP')}
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {event.location}
                                            </div>
                                            <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                                                {event.venueId}
                                            </span>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => router.push(`/events/${event.id}`)}>
                                        詳細
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
