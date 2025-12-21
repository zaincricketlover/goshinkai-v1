"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { QRCodeSVG } from 'qrcode.react';

interface MemberCard3DProps {
    profile: {
        userId: string;
        name?: string;
        companyName?: string;
        title?: string;
        avatarUrl?: string;
        rankBadge?: string;
    };
    onQRClick: () => void;
}

export const MemberCard3D: React.FC<MemberCard3DProps> = ({ profile, onQRClick }) => {
    return (
        <div className="relative w-full max-w-sm mx-auto">
            <motion.div
                className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border border-accent/30 shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                }}
            >
                {/* 背景のゴールドグラデーション */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5 pointer-events-none" />

                {/* キラキラエフェクト */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/20 to-transparent rounded-bl-full pointer-events-none" />

                {/* ロゴ・ブランド */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <p className="text-accent text-xs font-medium tracking-wider">GOSHINKAI</p>
                        <p className="text-gray-500 text-[10px]">EXECUTIVE MEMBER</p>
                    </div>
                    <Badge rank={profile.rankBadge as any} size="md" />
                </div>

                {/* プロフィール写真と名前 */}
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="relative">
                        <Avatar
                            src={profile.avatarUrl}
                            alt={profile.name || ''}
                            size="lg"
                            className="border-2 border-accent/50 shadow-lg"
                        />
                        {/* ランクインジケーター */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                            <span className="text-[10px] text-black font-bold">
                                {profile.rankBadge?.charAt(0) || 'W'}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-white truncate">{profile.name || '名前未設定'}</h2>
                        <p className="text-sm text-gray-400 truncate">{profile.companyName || '会社名未設定'}</p>
                        <p className="text-xs text-gray-500 truncate">{profile.title || ''}</p>
                    </div>
                </div>

                {/* QRコード（右下） */}
                <div className="flex justify-end relative z-10">
                    <motion.button
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onQRClick();
                        }}
                        className="bg-white p-2 rounded-lg shadow-md"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                        <QRCodeSVG
                            value={`https://goshinkai-v1.vercel.app/profile/${profile.userId}`}
                            size={48}
                            bgColor="#FFFFFF"
                            fgColor="#0A0F1C"
                            level="L"
                        />
                    </motion.button>
                </div>

                {/* 底部の装飾ライン */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
            </motion.div>
        </div>
    );
};

export default MemberCard3D;
