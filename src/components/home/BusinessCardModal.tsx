"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { UserProfile } from '@/lib/types';

import { Avatar } from '@/components/ui/Avatar';

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
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-md relative my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 閉じるボタン */}
                        <button
                            onClick={onClose}
                            className="absolute -top-12 right-0 z-10 w-10 h-10 bg-surface-elevated rounded-full flex items-center justify-center text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="bg-surface-elevated rounded-2xl border border-accent/20 overflow-hidden shadow-2xl">
                            {/* スマホ: 縦並び */}
                            <div className="flex flex-col gap-4 p-4">

                                {/* 名刺部分 */}
                                <div className="bg-white text-black p-5 rounded-xl shadow-lg">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar
                                            src={profile?.avatarUrl}
                                            alt={profile?.name || ''}
                                            size="md"
                                        />
                                        <div>
                                            <h3 className="text-lg font-bold">{profile?.name}</h3>
                                            <p className="text-sm text-gray-600">{profile?.title || ''}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800">{profile?.companyName || ''}</p>

                                    {(profile?.businessEmail || profile?.businessPhone || profile?.businessAddress) && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                                            {profile?.businessEmail && <p>✉️ {profile.businessEmail}</p>}
                                            {profile?.businessPhone && <p>📞 {profile.businessPhone}</p>}
                                            {profile?.businessAddress && <p>📍 {profile.businessAddress}</p>}
                                        </div>
                                    )}
                                </div>

                                {/* QRコード部分 */}
                                <div className="bg-surface rounded-xl p-6 flex flex-col items-center">
                                    <p className="text-xs text-gray-400 mb-3 font-medium tracking-wider">プロフィールQRコード</p>
                                    <div className="bg-white p-4 rounded-xl shadow-inner">
                                        <QRCodeSVG
                                            value={`https://goshinkai-v1.vercel.app/profile/${profile?.userId}`}
                                            size={150}
                                            bgColor="#FFFFFF"
                                            fgColor="#0A0F1C"
                                            level="H"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-4 text-center">
                                        スキャンしてプロフィールを見る
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
