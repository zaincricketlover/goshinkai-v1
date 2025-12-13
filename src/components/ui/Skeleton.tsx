import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={cn(
            "animate-pulse bg-surface-elevated rounded-lg",
            className
        )} />
    );
};

export const CardSkeleton = () => (
    <div className="rounded-2xl bg-surface-elevated/50 p-6 space-y-4 border border-white/5">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
        </div>
    </div>
);

export const AvatarSkeleton = () => (
    <Skeleton className="w-10 h-10 rounded-full" />
);
