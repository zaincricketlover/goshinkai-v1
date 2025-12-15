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
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 閉じるボタン */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/50 hover:text-white z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* 二分割表示 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* 左: 名刺画像 or デジタル名刺 */}
                            <div className="bg-surface-elevated rounded-xl p-4 border border-accent/20 flex flex-col justify-center min-h-[250px]">
                                {profile.businessCardUrl ? (
                                    <img
                                        src={profile.businessCardUrl}
                                        alt="名刺"
                                        className="w-full rounded-lg object-contain"
                                    />
                                ) : (
                                    // デジタル名刺
                                    <div className="bg-white text-black p-6 rounded-lg h-full flex flex-col justify-center shadow-lg transform rotate-0 hover:scale-[1.02] transition-transform">
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-1">{profile.companyName || '会社名未設定'}</p>
                                            <h3 className="text-xl font-bold border-b-2 border-black/10 pb-2">{profile.name}</h3>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 mb-4">{profile.title || '役職未設定'}</p>

                                        <div className="mt-auto space-y-1 text-xs text-gray-600">
                                            {profile.businessEmail && <p className="flex items-center gap-2">✉️ {profile.businessEmail}</p>}
                                            {profile.businessPhone && <p className="flex items-center gap-2">📞 {profile.businessPhone}</p>}
                                            {profile.businessAddress && <p className="flex items-center gap-2">📍 {profile.businessAddress}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 右: QRコード */}
                            <div className="bg-surface-elevated rounded-xl p-6 border border-accent/20 flex flex-col items-center justify-center min-h-[250px]">
                                <p className="text-xs text-gray-400 mb-4 font-medium tracking-widest">PROFILE QR</p>
                                <div className="bg-white p-4 rounded-xl shadow-inner">
                                    <QRCodeSVG
                                        value={`https://goshinkai-v1.vercel.app/profile/${profile.userId}`}
                                        size={140}
                                        bgColor="#FFFFFF"
                                        fgColor="#0A0F1C"
                                        level="H"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-4 text-center">スキャンしてプロフィールを見る</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
