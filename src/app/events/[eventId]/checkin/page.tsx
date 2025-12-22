"use client";

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Check, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function EventCheckinPage({ params }: { params: Promise<{ eventId: string }> }) {
    const resolvedParams = use(params);
    const { user, profile } = useAuth();
    const router = useRouter();

    const [event, setEvent] = useState<any>(null);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !resolvedParams.eventId) return;

            try {
                // イベント情報を取得
                const eventRef = doc(db, 'events', resolvedParams.eventId);
                const eventSnap = await getDoc(eventRef);

                if (eventSnap.exists()) {
                    setEvent({ id: eventSnap.id, ...eventSnap.data() });
                }

                // チェックイン状態を確認
                const participantRef = doc(db, 'events', resolvedParams.eventId, 'participants', user.uid);
                const participantSnap = await getDoc(participantRef);

                if (participantSnap.exists() && participantSnap.data().checkedIn) {
                    setIsCheckedIn(true);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, resolvedParams.eventId]);

    const handleCheckin = async () => {
        if (!user || !event) return;

        try {
            const participantRef = doc(db, 'events', event.id, 'participants', user.uid);

            await setDoc(participantRef, {
                userId: user.uid,
                userName: profile?.name || '',
                status: 'going',
                checkedIn: true,
                checkedInAt: serverTimestamp(),
            }, { merge: true });

            setIsCheckedIn(true);
            toast.success('チェックイン完了！');
        } catch (error) {
            console.error('Error checking in:', error);
            toast.error('チェックインに失敗しました');
        }
    };

    // Use current URL for checkin
    const checkinUrl = typeof window !== 'undefined' ? `${window.location.origin}/events/${resolvedParams.eventId}/checkin?userId=${user?.uid}` : '';

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
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">チェックイン</h1>
                </div>
            </div>

            <div className="px-4 py-6 max-w-md mx-auto">
                {isCheckedIn ? (
                    <Card className="border-green-500/30 text-center py-8">
                        <div className="w-20 h-20 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-10 h-10 text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">チェックイン済み</h2>
                        <p className="text-gray-400">{event?.title}</p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <Card className="border-accent/20 text-center">
                            <h2 className="text-lg font-bold text-white mb-2">{event?.title}</h2>
                            <p className="text-sm text-gray-400 mb-6">受付でこのQRコードを見せてください</p>

                            <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-xl">
                                {checkinUrl && (
                                    <QRCodeSVG
                                        value={checkinUrl}
                                        size={200}
                                        bgColor="#FFFFFF"
                                        fgColor="#0A0F1C"
                                        level="H"
                                    />
                                )}
                            </div>

                            <p className="text-xs text-gray-500">
                                {profile?.name} / {profile?.companyName}
                            </p>
                        </Card>

                        <Button
                            variant="gold"
                            className="w-full h-12 text-lg"
                            onClick={handleCheckin}
                        >
                            <QrCode className="w-5 h-5 mr-3" />
                            手動でチェックイン
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
