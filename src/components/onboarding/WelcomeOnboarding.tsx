"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import Confetti from 'react-confetti';
import { X, ArrowRight, Check } from 'lucide-react';

interface WelcomeOnboardingProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

const WANT_OPTIONS = ['資金調達', '人材採用', '営業支援', '業務提携', 'IT支援', 'コンサルティング', '海外展開', 'その他'];
const GIVE_OPTIONS = ['投資・出資', '人材紹介', '営業代行', '技術支援', 'コンサルティング', '製造・OEM', '海外ネットワーク', 'その他'];
const INDUSTRY_OPTIONS = ['IT・Web', '製造', '不動産', '飲食', '小売', 'サービス', '金融', '医療・ヘルスケア', 'その他'];

export const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({
    isOpen,
    onClose,
    userId,
    userName,
}) => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [showConfetti, setShowConfetti] = useState(true);

    // フォームデータ
    const [companyName, setCompanyName] = useState('');
    const [title, setTitle] = useState('');
    const [industry, setIndustry] = useState('');
    const [selectedWants, setSelectedWants] = useState<string[]>([]);
    const [selectedGives, setSelectedGives] = useState<string[]>([]);
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleWant = (want: string) => {
        if (selectedWants.includes(want)) {
            setSelectedWants(selectedWants.filter(w => w !== want));
        } else if (selectedWants.length < 3) {
            setSelectedWants([...selectedWants, want]);
        }
    };

    const toggleGive = (give: string) => {
        if (selectedGives.includes(give)) {
            setSelectedGives(selectedGives.filter(g => g !== give));
        } else if (selectedGives.length < 3) {
            setSelectedGives([...selectedGives, give]);
        }
    };

    const handleComplete = async () => {
        if (!companyName || !title || !industry || selectedWants.length === 0 || selectedGives.length === 0) {
            toast.error('必須項目を入力してください');
            return;
        }

        setLoading(true);
        try {
            await updateDoc(doc(db, 'profiles', userId), {
                companyName,
                title,
                industry,
                wantTags: selectedWants,
                giveTags: selectedGives,
                bio: bio || null,
                onboardingCompleted: true,
                updatedAt: serverTimestamp(),
            });

            toast.success('プロフィールを設定しました！');
            onClose();
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('保存に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-y-auto">
            {/* Confetti */}
            {showConfetti && step === 1 && (
                <Confetti
                    width={typeof window !== 'undefined' ? window.innerWidth : 1920}
                    height={typeof window !== 'undefined' ? window.innerHeight : 1080}
                    recycle={false}
                    numberOfPieces={200}
                    colors={['#D4AF37', '#FFD700', '#FFA500', '#FFFFFF']}
                    onConfettiComplete={() => setShowConfetti(false)}
                />
            )}

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md"
            >
                {/* Step 1: お祝い */}
                {step === 1 && (
                    <Card className="border-accent/30 text-center py-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="text-6xl mb-4"
                        >
                            🎉
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-2xl font-bold text-white mb-2"
                        >
                            ようこそ、{userName}さん！
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-gray-400 mb-6"
                        >
                            伍心会へのご入会<br />おめでとうございます
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <p className="text-sm text-gray-500 mb-4">
                                まずは簡単なプロフィール設定をしましょう
                            </p>
                            <Button variant="gold" onClick={() => setStep(2)}>
                                プロフィールを設定する
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </motion.div>
                    </Card>
                )}

                {/* Step 2: 基本情報 */}
                {step === 2 && (
                    <Card className="border-accent/30">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">基本情報</h2>
                            <span className="text-xs text-gray-500">1/3</span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">会社名 <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="例: 株式会社〇〇"
                                    className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">役職 <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="例: 代表取締役"
                                    className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">業種 <span className="text-red-400">*</span></label>
                                <div className="flex flex-wrap gap-2">
                                    {INDUSTRY_OPTIONS.map(ind => (
                                        <button
                                            key={ind}
                                            onClick={() => setIndustry(ind)}
                                            className={`px-3 py-1 rounded-full text-sm ${industry === ind
                                                    ? 'bg-accent text-black'
                                                    : 'bg-surface-elevated text-gray-400'
                                                }`}
                                        >
                                            {ind}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                                戻る
                            </Button>
                            <Button
                                variant="gold"
                                className="flex-1"
                                onClick={() => setStep(3)}
                                disabled={!companyName || !title || !industry}
                            >
                                次へ
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Step 3: Want/Give */}
                {step === 3 && (
                    <Card className="border-accent/30">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">マッチング設定</h2>
                            <span className="text-xs text-gray-500">2/3</span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">
                                    求めているもの（最大3つ）<span className="text-red-400">*</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {WANT_OPTIONS.map(want => (
                                        <button
                                            key={want}
                                            onClick={() => toggleWant(want)}
                                            className={`px-3 py-1 rounded-full text-sm ${selectedWants.includes(want)
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-surface-elevated text-gray-400'
                                                }`}
                                        >
                                            {want}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 block mb-2">
                                    提供できるもの（最大3つ）<span className="text-red-400">*</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {GIVE_OPTIONS.map(give => (
                                        <button
                                            key={give}
                                            onClick={() => toggleGive(give)}
                                            className={`px-3 py-1 rounded-full text-sm ${selectedGives.includes(give)
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-surface-elevated text-gray-400'
                                                }`}
                                        >
                                            {give}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                                戻る
                            </Button>
                            <Button
                                variant="gold"
                                className="flex-1"
                                onClick={() => setStep(4)}
                                disabled={selectedWants.length === 0 || selectedGives.length === 0}
                            >
                                次へ
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Step 4: 自己紹介 */}
                {step === 4 && (
                    <Card className="border-accent/30">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white">自己紹介</h2>
                            <span className="text-xs text-gray-500">3/3</span>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 block mb-2">
                                自己紹介（任意）
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="あなたのビジネスや、この会で実現したいことを書いてください"
                                rows={4}
                                className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-white resize-none"
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                                戻る
                            </Button>
                            <Button
                                variant="gold"
                                className="flex-1"
                                onClick={handleComplete}
                                disabled={loading}
                            >
                                {loading ? '保存中...' : '完了'}
                                <Check className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </Card>
                )}
            </motion.div>
        </div>
    );
};
