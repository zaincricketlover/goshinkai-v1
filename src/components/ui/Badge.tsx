import React from 'react';
import { RankBadge as RankBadgeType } from '@/lib/types';
import { RANK_BADGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BadgeProps {
    rank: RankBadgeType;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
    rank,
    className,
    size = 'md',
    showLabel = true
}) => {
    const config = RANK_BADGES[rank];

    const sizeClasses = {
        sm: 'h-5 px-2 text-[10px]',
        md: 'h-6 px-2.5 text-xs',
        lg: 'h-8 px-3 text-sm',
    };

    // Special effects for high ranks
    const isPremium = ['GOLD', 'DIAMOND', 'PLATINUM'].includes(rank);

    return (
        <span
            className={cn(
                "inline-flex items-center justify-center rounded-full font-bold tracking-wide transition-all",
                sizeClasses[size],
                isPremium ? "shadow-lg" : "bg-surface-elevated border border-white/10 text-gray-300",
                className
            )}
            style={isPremium ? {
                background: rank === 'GOLD' ? 'linear-gradient(135deg, #E5D4A1, #C9A962)' :
                    rank === 'DIAMOND' ? 'linear-gradient(135deg, #38BDF8, #0EA5E9)' :
                        rank === 'PLATINUM' ? 'linear-gradient(135deg, #A78BFA, #8B5CF6)' : undefined,
                color: '#0A0F1C',
                boxShadow: `0 2px 10px ${config.color}40`
            } : undefined}
        >
            {rank === 'DIAMOND' && <span className="mr-1">💎</span>}
            {rank === 'PLATINUM' && <span className="mr-1">👑</span>}
            {showLabel ? config.label : rank}
        </span>
    );
};
