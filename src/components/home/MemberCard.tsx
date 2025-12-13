import React from 'react';
import { UserProfile } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { RANK_BADGES, VENUES } from '@/lib/constants';
import { MapPin } from 'lucide-react';

interface MemberCardProps {
    profile: UserProfile;
}

const RANK_THRESHOLDS = {
    WHITE: 0,
    BLUE: 100,
    SILVER: 300,
    GOLD: 600,
    DIAMOND: 1000,
    PLATINUM: 2000,
};

const RANK_ORDER = ['WHITE', 'BLUE', 'SILVER', 'GOLD', 'DIAMOND', 'PLATINUM'];

export const MemberCard: React.FC<MemberCardProps> = ({ profile }) => {
    const venueName = VENUES.find(v => v.id === profile.homeVenueId)?.name;

    const currentRankIndex = RANK_ORDER.indexOf(profile.rankBadge);
    const nextRank = currentRankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[currentRankIndex + 1] : null;
    const currentThreshold = RANK_THRESHOLDS[profile.rankBadge as keyof typeof RANK_THRESHOLDS];
    const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank as keyof typeof RANK_THRESHOLDS] : profile.rankScore;
    const progress = nextRank
        ? ((profile.rankScore - currentThreshold) / (nextThreshold - currentThreshold)) * 100
        : 100;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-elevated to-surface border border-white/10 shadow-xl group">
            {/* シャイン効果 */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </div>

            <div className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <Avatar
                            src={profile.avatarUrl}
                            alt={profile.name}
                            size="lg"
                            rank={profile.rankBadge}
                            className="ring-4 ring-surface shadow-2xl"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
                            <p className="text-sm text-gray-400">{profile.companyName} {profile.title}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <Badge rank={profile.rankBadge} size="md" />
                        {nextRank && (
                            <div className="mt-3 w-32">
                                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                    <span>{profile.rankScore}pt</span>
                                    <span>あと {nextThreshold - profile.rankScore}pt</span>
                                </div>
                                <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center text-sm text-gray-400">
                        <MapPin className="w-4 h-4 mr-2 text-accent" />
                        {venueName}
                        <span className="ml-4 text-xs bg-white/5 px-2 py-0.5 rounded text-gray-500">
                            会員ID: {profile.userId.slice(0, 8).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
