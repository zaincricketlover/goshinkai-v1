"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { MouseEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { RANK_BADGES } from "@/lib/constants";

export const LuxuryCard = () => {
    const { profile } = useAuth();
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
    }

    if (!profile) return null;

    const rankInfo = RANK_BADGES[profile.rankBadge] || RANK_BADGES.WHITE;

    return (
        <div className="perspective-1000 w-full max-w-sm mx-auto">
            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX: springRotateX,
                    rotateY: springRotateY,
                    transformStyle: "preserve-3d",
                }}
                className="relative h-56 w-full rounded-2xl shadow-2xl border border-white/10 overflow-hidden cursor-pointer group"
            >
                {/* 背景グラデーション */}
                <div className="absolute inset-0 bg-gradient-to-br from-surface-elevated via-surface to-primary z-0" />

                {/* シャイン効果 */}
                <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                </div>

                {/* ホログラム光沢エフェクト - 常に表示してマウス追従 */}
                <motion.div
                    style={{
                        x: useTransform(x, [-100, 100], [-50, 50]),
                        y: useTransform(y, [-100, 100], [-50, 50])
                    }}
                    className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_50%)] pointer-events-none"
                />

                {/* カードコンテンツ */}
                <div className="relative z-20 h-full p-6 flex flex-col justify-between">
                    {/* ヘッダー */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gradient-gold tracking-wide">伍心会</h2>
                            <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase">Members Club</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span
                                className="text-xs font-bold tracking-wider px-3 py-1 rounded-full border"
                                style={{
                                    borderColor: rankInfo.color,
                                    color: rankInfo.color,
                                    backgroundColor: `${rankInfo.color}15`
                                }}
                            >
                                {rankInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* メイン情報 */}
                    <div className="space-y-1">
                        <p className="text-[10px] text-accent/70 tracking-widest uppercase">Member</p>
                        <h3 className="text-xl font-bold text-white tracking-wide">
                            {profile.name}
                        </h3>
                        <p className="text-sm text-gray-400">{profile.companyName || profile.title || ""}</p>
                    </div>

                    {/* フッター */}
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[8px] text-gray-500 mb-1">MEMBER SINCE</p>
                            <p className="text-[10px] text-gray-400 font-mono">
                                {profile.createdAt?.toDate?.()?.getFullYear() || "2024"}
                            </p>
                        </div>

                        {/* QRコード */}
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-lg border border-accent/20 p-1.5 flex items-center justify-center">
                            <QRCodeSVG
                                value={`goshinkai://profile/${profile.userId}`}
                                size={44}
                                bgColor="transparent"
                                fgColor="#C9A962"
                                level="L"
                            />
                        </div>
                    </div>
                </div>

                {/* 金属質の枠線 */}
                <div className="absolute inset-0 border border-accent/20 rounded-2xl z-30 pointer-events-none" />
            </motion.div>
        </div>
    );
};
