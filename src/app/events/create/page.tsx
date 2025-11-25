"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { VenueId } from '@/lib/types';

const VENUES: { id: VenueId; name: string }[] = [
    { id: 'osaka', name: '大阪' },
    { id: 'kobe', name: '神戸' },
    { id: 'tokyo', name: '東京' },
];

export default function CreateEventPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [venueId, setVenueId] = useState<VenueId>('osaka');
    const [dateTime, setDateTime] = useState('');
    const [isOpenToAllVenues, setIsOpenToAllVenues] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    if (authLoading) return <div className="p-8">Loading...</div>;

    if (!user) {
        router.push('/');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        try {
            const eventsRef = collection(db, 'events');
            const eventData = {
                venueId,
                title,
                description,
                location,
                dateTime: Timestamp.fromDate(new Date(dateTime)),
                isOpenToAllVenues,
                createdAt: serverTimestamp(),
            };

            await addDoc(eventsRef, eventData);
            alert('イベントを作成しました！');
            router.push('/events');
        } catch (err: any) {
            console.error(err);
            setError('イベント作成中にエラーが発生しました。');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Button
                    variant="outline"
                    onClick={() => router.push('/events')}
                    className="mb-6"
                >
                    ← イベント一覧に戻る
                </Button>

                <Card title="イベント作成">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="イベント名"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="第10回 大阪交流会"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                イベント説明
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={4}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="イベントの詳細を入力してください"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    開催拠点
                                </label>
                                <select
                                    value={venueId}
                                    onChange={(e) => setVenueId(e.target.value as VenueId)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    {VENUES.map((venue) => (
                                        <option key={venue.id} value={venue.id}>
                                            {venue.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isOpenToAllVenues}
                                    onChange={(e) => setIsOpenToAllVenues(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    全拠点オープン
                                </label>
                            </div>
                        </div>

                        <Input
                            label="開催場所"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            placeholder="大阪市北区梅田1-1-1"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                開催日時
                            </label>
                            <input
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex gap-4">
                            <Button type="submit" className="flex-1" isLoading={creating}>
                                イベントを作成
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/events')}
                                className="flex-1"
                            >
                                キャンセル
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
