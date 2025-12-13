import React from 'react';
import { UserProfile } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Lock } from 'lucide-react';
import { VENUES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { MatchResult } from '@/lib/matchScore';

interface MemberListItemProps {
    member: UserProfile;
    isLocked: boolean;
    matchResult?: MatchResult;
    matchScore?: number; // Legacy support
}

export const MemberListItem: React.FC<MemberListItemProps> = ({ member, isLocked, matchResult, matchScore }) => {
    const router = useRouter();
    const venueName = VENUES.find(v => v.id === member.homeVenueId)?.name;

    // Prefer matchResult score
    const score = matchResult ? matchResult.score : (matchScore || 0);

    return (
        <div onClick={() => router.push(`/profile/${member.userId}`)} className="group relative block">
            <Card className="h-full hover:bg-surface-elevated/80 cursor-pointer group-hover:border-accent/30 transition-all duration-300">
                <div className="flex items-start space-x-4">
                    <div className="relative">
                        <Avatar
                            src={isLocked ? null : member.avatarUrl}
                            alt={member.name}
                            size="md"
                            rank={member.rankBadge}
                            className={isLocked ? 'opacity-50 blur-sm' : ''}
                        />
                        {isLocked && <div className="absolute inset-0 flex items-center justify-center"><Lock className="w-4 h-4 text-gray-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className={`text-base font-bold truncate ${isLocked ? 'text-gray-500 blur-[2px]' : 'text-white'}`}>
                                    {isLocked ? '会員' : member.name}
                                </h3>
                                <p className={`text-xs truncate ${isLocked ? 'text-gray-600 blur-[2px]' : 'text-gray-400'}`}>
                                    {isLocked ? '非公開' : `${member.companyName} ${member.title}`}
                                </p>
                            </div>
                            {(matchResult || matchScore !== undefined) && (
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-500 block">マッチ度</span>
                                    <span className={`text-sm font-bold ${score > 70 ? 'text-accent' : 'text-gray-400'}`}>
                                        {score}%
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge rank={member.rankBadge} size="sm" showLabel={false} />
                                <span className="flex items-center text-[10px] text-gray-500">
                                    <MapPin className="w-3 h-3 mr-0.5" />{venueName}
                                </span>
                            </div>
                            {!isLocked && member.wantTags?.length > 0 && (
                                <div className="flex gap-1">
                                    {member.wantTags.slice(0, 2).map((t, i) => (
                                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 truncate max-w-[80px]">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {matchResult && matchResult.score > 30 && !isLocked && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                                {matchResult.canProvide.length > 0 ? (
                                    <p className="text-[10px] text-accent truncate">
                                        💡 {matchResult.canProvide[0]}を提供可能
                                    </p>
                                ) : matchResult.reasons.length > 0 ? (
                                    <p className="text-[10px] text-blue-400 truncate">
                                        ✨ {matchResult.reasons[0]}
                                    </p>
                                ) : null}

                                {matchResult.score > 40 && matchResult.synergySentence && (
                                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                                        💡 {matchResult.synergySentence}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
