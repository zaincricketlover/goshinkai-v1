import React from 'react';
import { VenueId, RankBadge } from '@/lib/types';
import { VENUES, RANK_BADGES } from '@/lib/constants';
import { Search, Filter } from 'lucide-react';

interface MemberFilterProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedVenue: VenueId | 'all';
    setSelectedVenue: (venue: VenueId | 'all') => void;
    selectedRank: RankBadge | 'all';
    setSelectedRank: (rank: RankBadge | 'all') => void;
}

export const MemberFilter: React.FC<MemberFilterProps> = ({
    searchQuery,
    setSearchQuery,
    selectedVenue,
    setSelectedVenue,
    selectedRank,
    setSelectedRank,
}) => {
    return (
        <div className="space-y-4 mb-6">
            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-surface-elevated text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm transition-all"
                    placeholder="名前、会社名、タグで検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <select
                    value={selectedVenue}
                    onChange={(e) => setSelectedVenue(e.target.value as VenueId | 'all')}
                    className="bg-surface-elevated text-sm text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                >
                    <option value="all">全会場</option>
                    {VENUES.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                            {venue.name}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(e.target.value as RankBadge | 'all')}
                    className="bg-surface-elevated text-sm text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
                >
                    <option value="all">全ランク</option>
                    {Object.entries(RANK_BADGES).map(([key, config]) => (
                        <option key={key} value={key}>
                            {config.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};
