import React from 'react';
import { UserProfile } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { canViewProfileDetail } from '@/lib/permissions';

interface ParticipantListProps {
    participants: UserProfile[];
    currentUserProfile: UserProfile | null;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({ participants, currentUserProfile }) => {
    const router = useRouter();

    if (participants.length === 0) {
        return (
            <Card title={"参加予定のメンバー"}>
                <p className="text-gray-500 text-sm">まだ参加予定者はいません。</p>
            </Card>
        );
    }

    const vipCount = participants.filter(p => ['PLATINUM', 'DIAMOND', 'GOLD'].includes(p.rankBadge)).length;

    // ランク順にソート (VIP first)
    const sortedParticipants = [...participants].sort((a, b) => {
        const rankOrder = ['PLATINUM', 'DIAMOND', 'GOLD', 'SILVER', 'BLUE', 'WHITE'];
        return rankOrder.indexOf(a.rankBadge) - rankOrder.indexOf(b.rankBadge);
    });

    const isParticipating = currentUserProfile && participants.some(p => p.userId === currentUserProfile.userId);

    return (
        <Card title={`参加予定のメンバー (${participants.length}名)`}>
            {vipCount > 0 && (
                <p className="text-xs text-accent mb-4">
                    👑 プレミアム会員{vipCount}名が参加予定
                </p>
            )}

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {sortedParticipants.map((participant) => {
                    const isLocked = currentUserProfile ? !canViewProfileDetail(currentUserProfile, participant) : true;
                    const isVip = ['PLATINUM', 'DIAMOND', 'GOLD'].includes(participant.rankBadge);

                    return (
                        <div
                            key={participant.userId}
                            className="flex flex-col items-center cursor-pointer group relative"
                            onClick={() => router.push(`/profile/${participant.userId}`)}
                        >
                            <div className="relative mb-2">
                                <Avatar
                                    src={isLocked ? null : participant.avatarUrl}
                                    alt={participant.name}
                                    size="md"
                                    rank={participant.rankBadge}
                                    className={`transition-transform group-hover:scale-105 ${isLocked ? 'opacity-50 blur-[1px]' : ''}`}
                                />
                                {isVip && !isLocked && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center border border-surface shadow-sm">
                                        <span className="text-[8px]">👑</span>
                                    </div>
                                )}
                            </div>
                            <span className={`text-[10px] text-center truncate w-full ${isLocked ? 'text-gray-600 blur-[1px]' : 'text-gray-300 group-hover:text-white'}`}>
                                {isLocked ? '会員' : participant.name}
                            </span>
                        </div>
                    );
                })}

                {/* 「あなたの席」プレースホルダー */}
                {currentUserProfile && !isParticipating && (
                    <div
                        className="flex flex-col items-center cursor-pointer group opacity-80 hover:opacity-100"
                        onClick={() => document.getElementById('join-button')?.click()}
                    >
                        <div className="relative mb-2">
                            <div className="w-10 h-10 rounded-full bg-accent/10 border-2 border-dashed border-accent/50 flex items-center justify-center animate-pulse">
                                <span className="text-accent text-lg font-bold">?</span>
                            </div>
                        </div>
                        <span className="text-[10px] text-accent font-medium">
                            あなたの席
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
};
