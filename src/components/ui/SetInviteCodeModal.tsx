"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './Input';
import { Button } from './Button';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface SetInviteCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export const SetInviteCodeModal: React.FC<SetInviteCodeModalProps> = ({ isOpen, onClose, userId }) => {
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        const code = inviteCode.toUpperCase().trim();

        if (!code || code.length < 4) {
            toast.error('4文字以上で入力してください');
            return;
        }

        if (!/^[a-zA-Z0-9]+$/.test(code)) {
            toast.error('英数字のみ使用できます');
            return;
        }

        setLoading(true);
        try {
            const profileRef = doc(db, 'profiles', userId);
            const profileSnap = await getDoc(profileRef);

            // プロフィールが存在しない場合
            if (!profileSnap.exists()) {
                await setDoc(profileRef, {
                    userId,
                    inviteCode: code,
                    inviteCodeSetAt: serverTimestamp()
                }, { merge: true });
                toast.success('招待コードを設定しました');
                onClose();
                return;
            }

            const currentData = profileSnap.data();

            // 既に設定済みの場合
            if (currentData?.inviteCode) {
                toast.error('招待コードは既に設定済みです（変更不可）');
                setLoading(false);
                return;
            }

            // 重複チェック
            const existingQuery = query(
                collection(db, 'profiles'),
                where('inviteCode', '==', code)
            );
            const existing = await getDocs(existingQuery);

            if (!existing.empty) {
                toast.error('このコードは既に使用されています');
                setLoading(false);
                return;
            }

            // 保存（setDoc with merge）
            await setDoc(profileRef, {
                inviteCode: code,
                inviteCodeSetAt: serverTimestamp()
            }, { merge: true });

            toast.success('招待コードを設定しました');
            onClose();
        } catch (error) {
            console.error('Error setting invite code:', error);
            toast.error('設定に失敗しました。再度お試しください。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="bg-surface-elevated rounded-xl p-6 max-w-md w-full border border-accent/20"
                    >
                        <h2 className="text-xl font-bold text-white mb-2">あなたの招待コードを設定</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            他のメンバーを招待する時に使うコードです。<br />
                            <span className="text-orange-400 font-bold block mt-1">※一度設定すると変更できません</span>
                        </p>

                        <div className="mb-2">
                            <Input
                                label="希望の招待コード"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                placeholder="例: TANAKA2024"
                                maxLength={12}
                            />
                        </div>

                        <p className="text-xs text-gray-500 mt-2 mb-6">
                            4〜12文字、英数字のみ
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1"
                            >
                                キャンセル
                            </Button>
                            <Button
                                variant="gold"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? '設定中...' : '設定する'}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
