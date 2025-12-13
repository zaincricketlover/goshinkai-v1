import React from 'react';
import { cn } from '@/lib/utils';
import { RankBadge } from '@/lib/types';

interface AvatarProps {
    src?: string | null;
    alt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    rank?: RankBadge;
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    alt,
    size = 'md',
    rank,
    className
}) => {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-14 w-14',
        xl: 'h-20 w-20',
        '2xl': 'h-32 w-32',
    };

    const getBorderColor = (rank?: RankBadge) => {
        if (!rank) return 'border-white/10';
        switch (rank) {
            case 'GOLD': return 'border-[#C9A962]';
            case 'DIAMOND': return 'border-[#38BDF8]';
            case 'PLATINUM': return 'border-[#A78BFA]';
            default: return 'border-white/10';
        }
    };

    return (
        <div className={cn(
            "relative rounded-full overflow-hidden bg-surface-elevated flex items-center justify-center border-2",
            sizeClasses[size],
            getBorderColor(rank),
            className
        )}>
            {src ? (
                <img src={src} alt={alt} className="h-full w-full object-cover" />
            ) : (
                <span className={cn(
                    "font-bold text-gray-400",
                    size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-xl'
                )}>
                    {alt.charAt(0)}
                </span>
            )}
        </div>
    );
};
