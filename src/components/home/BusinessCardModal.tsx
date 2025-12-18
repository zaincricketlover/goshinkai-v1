"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface BusinessCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
}

export const BusinessCardModal: React.FC<BusinessCardModalProps> = ({ isOpen, onClose, profile }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-lg relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 閉じるボタン */}
                        <button
                            onClick={onClose}
                            className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-surface-elevated rounded-full flex items-center justify-center text-gray-400 hover:text-white border border-white/10"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* モーダルコンテンツ */}
                        <div className="bg-surface-elevated rounded-2xl border border-accent/20 overflow-hidden">
                            {/* 名刺とQRの二分割表示 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                {/* 左: 名刺 */}
                                <div className="bg-surface rounded-xl p-4 border border-white/5">
                                    {profile?.businessCardUrl ? (
                                        <img
                                            src={profile.businessCardUrl}
                                            alt="名刺"
                                            className="w-full rounded-lg object-contain"
                                        />
                                    ) : (
                                        <div className="bg-white text-black p-4 rounded-lg">
                                            <h3 className="text-lg font-bold">{profile?.name}</h3>
                                            <p className="text-sm text-gray-600">{profile?.title || ''}</p>
                                            <p className="text-sm font-medium mt-2">{profile?.companyName || ''}</p>
                                            {(profile?.businessEmail || profile?.businessPhone) && (
                                                <div className="mt-3 pt-3 border-t text-xs text-gray-500 space-y-1">
                                                    {profile?.businessEmail && <p>✉️ {profile.businessEmail}</p>}
                                                    {profile?.businessPhone && <p>📞 {profile.businessPhone}</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 右: QRコード */}
                                <div className="bg-surface rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center">
                                    <p className="text-xs text-gray-400 mb-3">プロフィールQRコード</p>
                                    <div className="bg-white p-3 rounded-xl">
                                        <QRCodeSVG
                                            value={`https://goshinkai-v1.vercel.app/profile/${profile?.userId}`}
                                            size={120}
                                            bgColor="#FFFFFF"
                                            fgColor="#0A0F1C"
                                            level="H"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3">スキャンしてプロフィールを見る</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
