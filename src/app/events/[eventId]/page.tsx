"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Event, UserProfile, EventParticipant, ParticipationStatus } from '@/lib/types';
import { EventDetail } from '@/components/events/EventDetail';
import { ParticipantList } from '@/components/events/ParticipantList';
import { CheckInButton } from '@/components/events/CheckInButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { use } from 'react';
import { Check, Star, X } from 'lucide-react';

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
    const resolvedParams = use(params);
    const { user, profile } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [participants, setParticipants] = useState<UserProfile[]>([]);
    const [myStatus, setMyStatus] = useState<ParticipationStatus | null>(null);
    const [myParticipantDocId, setMyParticipantDocId] = useState<string | undefined>(undefined);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<ParticipationStatus | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Event
                const eventDoc = await getDoc(doc(db, 'events', resolvedParams.eventId));
                if (eventDoc.exists()) {
                    setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
                }

                // Fetch All Participants to find current user's status
                const allParticipantsRef = collection(db, 'events', resolvedParams.eventId, 'participants');
                const allParticipantsQuery = await getDocs(allParticipantsRef);

                allParticipantsQuery.forEach((docSnap) => {
                    const data = docSnap.data() as EventParticipant;
                    if (user && data.userId === user.uid) {
                        setMyStatus(data.status);
                        setMyParticipantDocId(docSnap.id);
                        if (data.checkedInAt) setIsCheckedIn(true);
                    }
                });

                // Fetch Participants with status 'going'
                const goingParticipantsRef = collection(db, 'events', resolvedParams.eventId, 'participants');
                const q = query(goingParticipantsRef, where('status', '==', 'going'));
                const querySnapshot = await getDocs(q);

                const participantUserIds: string[] = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data() as EventParticipant;
                    participantUserIds.push(data.userId);
                });

                // Fetch User Profiles for participants
                if (participantUserIds.length > 0) {
                    const profiles: UserProfile[] = [];
                    for (const uid of participantUserIds) {
                        const pDoc = await getDoc(doc(db, 'profiles', uid));
                        if (pDoc.exists()) {
                            profiles.push(pDoc.data() as UserProfile);
                        }
                    }
                    setParticipants(profiles);
                }

            } catch (error) {
                console.error('Error fetching event details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user, resolvedParams.eventId]);

    const handleStatusChange = async (newStatus: ParticipationStatus) => {
        if (!user || !profile) return;
        setActionLoading(newStatus);

        try {
            const participantsRef = collection(db, 'events', resolvedParams.eventId, 'participants');

            // Check if already exists
            const q = query(participantsRef, where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Update
                const docId = querySnapshot.docs[0].id;
                await updateDoc(doc(db, 'events', resolvedParams.eventId, 'participants', docId), {
                    status: newStatus,
                    updatedAt: serverTimestamp()
                });
                setMyParticipantDocId(docId);
            } else {
                // Create
                const docRef = await addDoc(participantsRef, {
                    eventId: resolvedParams.eventId,
                    userId: user.uid,
                    status: newStatus,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                setMyParticipantDocId(docRef.id);
            }

            setMyStatus(newStatus);

            // Update participants list
            if (newStatus === 'going') {
                if (!participants.find(p => p.userId === user.uid)) {
                    setParticipants([...participants, profile]);
                }
                toast.success('参加表明しました！');
            } else if (newStatus === 'interested') {
                setParticipants(participants.filter(p => p.userId !== user.uid));
                toast.success('興味ありに変更しました');
            } else {
                setParticipants(participants.filter(p => p.userId !== user.uid));
                toast.success('不参加に変更しました');
            }

        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('エラーが発生しました');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div></div>;
    if (!event) return <div className="text-center p-8 text-white">イベントが見つかりません</div>;

    // Check if event is today (for demo purposes, assume it is if user is 'going')
    const isEventToday = true;

    return (
        <div className="min-h-screen bg-primary pb-32 px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-8">
                <EventDetail event={event} />

                {myStatus === 'going' && isEventToday && (
                    <Card className="border-accent/50 bg-accent/5">
                        <h3 className="text-center font-bold text-white mb-4">イベント当日</h3>
                        <CheckInButton
                            eventId={event.id}
                            participantDocId={myParticipantDocId}
                            isCheckedIn={isCheckedIn}
                        />
                    </Card>
                )}

                <ParticipantList participants={participants} currentUserProfile={profile} />
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/90 backdrop-blur-lg border-t border-white/5 z-40">
                <div className="max-w-3xl mx-auto">
                    <p className="text-xs text-center text-gray-400 mb-3">参加ステータスを選択</p>
                    <div className="flex gap-2">
                        <Button
                            className={`flex-1 ${myStatus === 'going' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                            variant={myStatus === 'going' ? 'primary' : 'outline'}
                            onClick={() => handleStatusChange('going')}
                            isLoading={actionLoading === 'going'}
                            disabled={myStatus === 'going'}
                        >
                            <Check className="w-4 h-4 mr-1" />
                            参加
                        </Button>
                        <Button
                            className={`flex-1 ${myStatus === 'interested' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}`}
                            variant={myStatus === 'interested' ? 'primary' : 'outline'}
                            onClick={() => handleStatusChange('interested')}
                            isLoading={actionLoading === 'interested'}
                            disabled={myStatus === 'interested'}
                        >
                            <Star className="w-4 h-4 mr-1" />
                            興味あり
                        </Button>
                        <Button
                            className={`flex-1 ${myStatus === 'not_going' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                            variant={myStatus === 'not_going' ? 'primary' : 'outline'}
                            onClick={() => handleStatusChange('not_going')}
                            isLoading={actionLoading === 'not_going'}
                            disabled={myStatus === 'not_going'}
                        >
                            <X className="w-4 h-4 mr-1" />
                            不参加
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
