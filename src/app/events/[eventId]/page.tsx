"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Event, EventParticipant, ParticipationStatus, UserProfile } from '@/lib/types';
import { canViewProfileDetail } from '@/lib/permissions';

const RANK_BADGES: Record<string, string> = {
    WHITE: 'ホワイト',
    BLUE: 'ブルー',
    SILVER: 'シルバー',
    GOLD: 'ゴールド',
    DIAMOND: 'ダイヤモンド',
    PLATINUM: 'プラチナ',
};

export default function EventDetailPage({ params }: { params: { eventId: string } }) {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [participation, setParticipation] = useState<EventParticipant | null>(null);
    const [participants, setParticipants] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [checkInSuccess, setCheckInSuccess] = useState<{ score: number; bonus: string } | null>(null);

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }

        const fetchEventData = async () => {
            try {
                // Fetch event
                const eventRef = doc(db, 'events', params.eventId);
                const eventSnap = await getDoc(eventRef);

                if (eventSnap.exists()) {
                    setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);
                }

                // Fetch user's participation status
                const participantsRef = collection(db, 'eventParticipants');
                const q = query(
                    participantsRef,
                    where('eventId', '==', params.eventId),
                    where('userId', '==', user.uid)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    setParticipation({ id: doc.id, ...doc.data() } as EventParticipant);
                }

                // Fetch all participants (going)
                const allParticipantsQuery = query(
                    participantsRef,
                    where('eventId', '==', params.eventId),
                    where('status', '==', 'going')
                );
                const allParticipantsSnap = await getDocs(allParticipantsQuery);
                const participantUserIds = allParticipantsSnap.docs.map(doc => doc.data().userId);

                if (participantUserIds.length > 0) {
                    const profiles: UserProfile[] = [];
                    for (const uid of participantUserIds) {
                        const pRef = doc(db, 'profiles', uid);
                        const pSnap = await getDoc(pRef);
                        if (pSnap.exists()) {
                            profiles.push(pSnap.data() as UserProfile);
                        }
                    }
                    setParticipants(profiles);
                }

            } catch (error) {
                console.error('Error fetching event:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventData();
    }, [params.eventId, user, router]);

    const handleStatusChange = async (status: ParticipationStatus) => {
        if (!user) return;
        setUpdating(true);

        try {
            if (participation) {
                const participantRef = doc(db, 'eventParticipants', participation.id);
                await updateDoc(participantRef, { status });
                setParticipation({ ...participation, status });
            } else {
                const participantsRef = collection(db, 'eventParticipants');
                const newDoc = await addDoc(participantsRef, {
                    eventId: params.eventId,
                    userId: user.uid,
                    status,
                    checkedInAt: null,
                });
                setParticipation({
                    id: newDoc.id,
                    eventId: params.eventId,
                    userId: user.uid,
                    status,
                });
            }
        } catch (error) {
            console.error('Error updating participation:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleCheckIn = async () => {
        if (!user || !participation || !profile || !event) return;
        setUpdating(true);

        try {
            const participantRef = doc(db, 'eventParticipants', participation.id);
            await updateDoc(participantRef, {
                checkedInAt: serverTimestamp(),
            });

            const profileRef = doc(db, 'profiles', user.uid);
            let newScore = (profile.rankScore || 0) + 10;
            let newUnlocked = [...(profile.unlockedVenueIds || [])];
            let bonusMessage = '';

            if (profile.homeVenueId !== event.venueId) {
                newScore += 5;
                bonusMessage = '他会場ボーナス +5pt';
                if (!newUnlocked.includes(event.venueId)) {
                    newUnlocked.push(event.venueId);
                    bonusMessage += ` & ${event.location}ロック解除！`;
                }
            }

            await updateDoc(profileRef, {
                rankScore: newScore,
                unlockedVenueIds: newUnlocked
            });

            setParticipation({ ...participation, checkedInAt: serverTimestamp() as any });
            setCheckInSuccess({ score: 10 + (profile.homeVenueId !== event.venueId ? 5 : 0), bonus: bonusMessage });

            // 3秒後にリロードして最新状態にする
            setTimeout(() => {
                window.location.reload();
            }, 3000);

        } catch (error) {
            console.error('Error checking in:', error);
            alert('チェックインに失敗しました。');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Card title="イベントが見つかりません">
                    <p className="text-gray-600">指定されたイベントが見つかりませんでした。</p>
                    <Button className="mt-4" onClick={() => router.push('/events')}>
                        イベント一覧に戻る
                    </Button>
                </Card>
            </div>
        );
    }

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

    const getStatusLabel = (status: ParticipationStatus) => {
        switch (status) {
            case 'going': return '参加';
            case 'interested': return '興味あり';
            case 'not_going': return '不参加';
        }
    };

    const getStatusColor = (status: ParticipationStatus) => {
        switch (status) {
            case 'going': return 'bg-green-600 hover:bg-green-700';
            case 'interested': return 'bg-yellow-600 hover:bg-yellow-700';
            case 'not_going': return 'bg-gray-600 hover:bg-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="outline"
                    onClick={() => router.push('/events')}
                    className="mb-6"
                >
                    ← イベント一覧に戻る
                </Button>

                {checkInSuccess && (
                    <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative shadow-md animate-bounce" role="alert">
                        <strong className="font-bold text-lg">チェックイン完了！</strong>
                        <span className="block sm:inline ml-2">ランクスコア +{checkInSuccess.score}pt GET！ {checkInSuccess.bonus}</span>
                    </div>
                )}

                <Card>
                    <div className="space-y-6">
                        {/* Event Header */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {event.title}
                            </h1>
                            {event.isOpenToAllVenues && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    全拠点参加可能
                                </span>
                            )}
                        </div>

                        {/* Event Details */}
                        <div className="border-t border-gray-200 pt-6 space-y-4">
                            <div className="flex items-start">
                                <svg className="h-6 w-6 mr-3 text-gray-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">日時</p>
                                    <p className="text-lg text-gray-900">{formatDate(event.dateTime)}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <svg className="h-6 w-6 mr-3 text-gray-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">場所</p>
                                    <p className="text-lg text-gray-900">{event.location}</p>
                                </div>
                            </div>
                        </div>

                        {/* Event Description */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">詳細</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                        </div>

                        {/* Participation Status */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">参加ステータス</h3>
                            <div className="flex gap-3">
                                {(['going', 'interested', 'not_going'] as ParticipationStatus[]).map((status) => (
                                    <Button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className={`flex-1 ${participation?.status === status
                                            ? getStatusColor(status)
                                            : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                            }`}
                                        isLoading={updating}
                                    >
                                        {getStatusLabel(status)}
                                        {participation?.status === status && ' ✓'}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Check-in Button */}
                        {participation?.status === 'going' && (
                            <div className="border-t border-gray-200 pt-6">
                                {participation.checkedInAt ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                        <p className="text-green-800 font-bold text-lg">
                                            ✓ チェックイン済み
                                        </p>
                                        <p className="text-green-600 text-sm mt-1">
                                            ご参加ありがとうございます！
                                        </p>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleCheckIn}
                                        className="w-full py-4 text-lg font-bold shadow-lg"
                                        isLoading={updating}
                                    >
                                        チェックインする
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Participants List */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">参加予定者 ({participants.length}名)</h3>
                            {participants.length === 0 ? (
                                <p className="text-gray-500">まだ参加予定者はいません。</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {participants.map((participant) => {
                                        const isUnlocked = profile ? canViewProfileDetail(profile, participant) : false;
                                        return (
                                            <div key={participant.userId} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg mb-2 shadow-sm">
                                                    {participant.name.charAt(0)}
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 truncate w-full">
                                                    {participant.name}
                                                </p>
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-700 mt-1">
                                                    {RANK_BADGES[participant.rankBadge]}
                                                </span>
                                                {isUnlocked ? (
                                                    <p className="text-xs text-gray-500 truncate w-full mt-1">
                                                        {participant.companyName}
                                                    </p>
                                                ) : (
                                                    <p className="text-[10px] text-gray-400 mt-1">🔒 詳細ロック</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
