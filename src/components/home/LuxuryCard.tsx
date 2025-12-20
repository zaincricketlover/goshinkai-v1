"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { MouseEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { RANK_BADGES } from "@/lib/constants";
import { BusinessCardModal } from "./BusinessCardModal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

export const LuxuryCard = () => {
    const { profile } = useAuth();
    const [showBusinessCard, setShowBusinessCard] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    const springConfig = { damping: 25, stiffness: 150 };
    const springRotateX = useSpring(rotateX, springConfig);
    const springRotateY = useSpring(rotateY, springConfig);

    function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(event.clientX - centerX);
        y.set(event.clientY - centerY);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
        setIsPressed(false);
    }

    if (!profile) return null;

    const rankInfo = RANK_BADGES[profile.rankBadge] || RANK_BADGES.WHITE;

    return (
        <div className="perspective-1000 w-full max-w-sm mx-auto">
            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                animate={{
                    rotateY: isPressed ? 5 : 0,
                    rotateX: isPressed ? -5 : 0,
                }}
                style={{
                    rotateX: springRotateX,
                    rotateY: springRotateY,
                    transformStyle: "preserve-3d",
                }}
                className="relative min-h-[16rem] w-full rounded-2xl shadow-2xl border border-accent/20 overflow-hidden cursor-pointer group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
            >
                {/* 背景グラデーション */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5 pointer-events-none" />

                {/* ホログラム光沢エフェクト */}
                <motion.div
                    style={{
                        x: useTransform(x, [-100, 100], [-50, 50]),
                        y: useTransform(y, [-100, 100], [-50, 50])
                    }}
                    className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_50%)] pointer-events-none"
                />

                {/* カードコンテンツ */}
                <div className="relative z-20 h-full p-6 flex flex-col">
                    {/* ロゴ・ブランド */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-accent text-xs font-medium tracking-wider">GOSHINKAI</p>
                            <p className="text-gray-500 text-[10px]">EXECUTIVE MEMBER</p>
                        </div>
                        <Badge rank={profile.rankBadge} size="md" />
                    </div>

                    {/* プロフィール写真と名前 */}
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar
                            src={profile.avatarUrl}
                            alt={profile.name || ''}
                            size="lg"
                            rank={profile.rankBadge}
                            className="border-2 border-accent/30"
                        />
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-white truncate">{profile.name}</h2>
                            <p className="text-sm text-gray-400 truncate">{profile.companyName}</p>
                            <p className="text-xs text-gray-500 truncate">{profile.title}</p>
                        </div>
                    </div>

                    {/* フッター */}
                    <div className="mt-auto flex justify-between items-end">
                        <div>
                            <p className="text-[8px] text-gray-500 mb-1">MEMBER SINCE</p>
                            <p className="text-[10px] text-gray-400 font-mono">
                                {profile.createdAt?.toDate?.()?.getFullYear() || "2024"}
                            </p>
                        </div>

                        {/* QRコードボタン */}
                        <motion.button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowBusinessCard(true);
                            }}
                            className="bg-white p-2 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
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
                </div>

                {/* 装飾ライン */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
            </motion.div>

            <BusinessCardModal
                isOpen={showBusinessCard}
                onClose={() => setShowBusinessCard(false)}
                profile={profile}
            />
        </div>
    );
};
