import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Confetti from 'react-confetti';
import { Card } from '@/components/ui/Card';

interface CheckInButtonProps {
    eventId: string;
    participantDocId?: string;
    isCheckedIn: boolean;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({ eventId, participantDocId, isCheckedIn }) => {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const handleCheckIn = async () => {
        if (!user || !participantDocId) return;
        setLoading(true);

        try {
            // Mock Location Check (Always success for demo)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update Participant Status
            await updateDoc(doc(db, 'events', eventId, 'participants', participantDocId), {
                checkedInAt: serverTimestamp(),
                pointsAwarded: 100
            });

            // Update User Rank Score
            await updateDoc(doc(db, 'profiles', user.uid), {
                rankScore: increment(100)
            });

            // 成功時演出
            setShowConfetti(true);
            setShowSuccessModal(true);

            // 3秒後にConfetti停止
            setTimeout(() => setShowConfetti(false), 3000);
        } catch (error) {
            console.error('Check-in error:', error);
            toast.error('チェックインに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (isCheckedIn && !showSuccessModal) {
        return (
            <Button variant="secondary" disabled className="w-full bg-green-900/20 text-green-400 border-green-900/50">
                <span className="mr-2">✓</span> チェックイン済み
            </Button>
        );
    }

    // Points to next rank (simplified calculation for display)
    const pointsToGold = Math.max(0, 600 - (profile?.rankScore || 0));

    return (
        <>
            {showConfetti && (
                <Confetti
                    width={typeof window !== 'undefined' ? window.innerWidth : 400}
                    height={typeof window !== 'undefined' ? window.innerHeight : 600}
                    recycle={false}
                    numberOfPieces={200}
                    colors={['#C9A962', '#E5D4A1', '#FFD700', '#FFA500']}
                />
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-sm w-full text-center border-accent/50">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-white mb-2">チェックイン完了！</h2>
                        <p className="text-accent text-3xl font-bold mb-4">+100pt 獲得</p>
                        <Button variant="gold" onClick={() => setShowSuccessModal(false)} className="w-full">
                            イベントを楽しむ
                        </Button>
                    </Card>
                </div>
            )}

            <div className="space-y-2">
                <Button
                    variant="gold"
                    className="w-full shadow-xl animate-pulse"
                    onClick={handleCheckIn}
                    isLoading={loading}
                >
                    <QrCode className="w-5 h-5 mr-2" />
                    会場でチェックイン
                </Button>
                <p className="text-xs text-center text-gray-500">
                    ※ 位置情報またはQRコードを使用します
                </p>
            </div>
        </>
    );
};
