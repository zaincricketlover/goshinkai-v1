import React from 'react';
import { UserProfile } from '@/lib/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Building2, Link as LinkIcon } from 'lucide-react';
import { VENUES } from '@/lib/constants';

interface ProfileHeaderProps {
    profile: UserProfile;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
    const venueName = VENUES.find(v => v.id === profile.homeVenueId)?.name || profile.homeVenueId;

    return (
        <div className="relative mb-6">
            {/* Cover / Background Effect */}
            <div className="h-32 bg-gradient-to-r from-surface-elevated to-surface border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20" />
            </div>

            <div className="px-4 -mt-12 flex flex-col items-center text-center relative z-10">
                <Avatar
                    src={profile.avatarUrl}
                    alt={profile.name}
                    size="2xl"
                    rank={profile.rankBadge}
                    className="shadow-2xl mb-4 bg-surface"
                />

                <h1 className="text-2xl font-bold text-white mb-1">{profile.name}</h1>
                <p className="text-gray-400 text-sm mb-3">
                    {profile.companyName} {profile.title}
                </p>

                <div className="flex items-center gap-2 mb-4">
                    <Badge rank={profile.rankBadge} />
                    <span className="flex items-center text-xs text-gray-500 bg-surface-elevated px-2 py-1 rounded-full border border-white/5">
                        <MapPin className="w-3 h-3 mr-1" />
                        {venueName}
                    </span>
                </div>

                {profile.websiteUrl && (
                    <a
                        href={profile.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-accent hover:text-accent-light transition-colors"
                    >
                        <LinkIcon className="w-3 h-3 mr-1" />
                        Company Website
                    </a>
                )}
            </div>
        </div>
    );
};
