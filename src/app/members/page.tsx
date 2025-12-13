"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, VenueId, RankBadge } from '@/lib/types';
import { canViewProfileDetail } from '@/lib/permissions';
import { MemberFilter } from '@/components/members/MemberFilter';
import { MemberListItem } from '@/components/members/MemberListItem';
import { calculateMatchScore } from '@/lib/matchScore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function MembersPage() {
    const { user, profile: currentUserProfile } = useAuth();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVenue, setSelectedVenue] = useState<VenueId | 'all'>('all');
    const [selectedRank, setSelectedRank] = useState<RankBadge | 'all'>('all');

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const q = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const membersList: UserProfile[] = [];
                querySnapshot.forEach((doc) => {
                    // Exclude self
                    if (doc.id !== user?.uid) {
                        membersList.push(doc.data() as UserProfile);
                    }
                });
                setMembers(membersList);
            } catch (error) {
                console.error('Error fetching members:', error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchMembers();
        }
    }, [user]);

    const filteredMembers = members.filter(member => {
        // Venue Filter
        if (selectedVenue !== 'all' && member.homeVenueId !== selectedVenue) return false;

        // Rank Filter
        if (selectedRank !== 'all' && member.rankBadge !== selectedRank) return false;

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const nameMatch = member.name.toLowerCase().includes(query);
            const companyMatch = member.companyName?.toLowerCase().includes(query);
            const tagMatch = member.wantTags?.some(t => t.toLowerCase().includes(query)) ||
                member.giveTags?.some(t => t.toLowerCase().includes(query));

            return nameMatch || companyMatch || tagMatch;
        }

        return true;
    });

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div></div>;

    if (error) {
        return (
            <div className="min-h-screen p-4 flex items-center justify-center">
                <Card className="text-center py-8">
                    <p className="text-red-400 mb-4">データの読み込みに失敗しました</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        再読み込み
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary pb-20 px-4 py-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-white">メンバー</h1>
                    <span className="text-sm text-gray-400">{filteredMembers.length}名</span>
                </div>

                <MemberFilter
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedVenue={selectedVenue}
                    setSelectedVenue={setSelectedVenue}
                    selectedRank={selectedRank}
                    setSelectedRank={setSelectedRank}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredMembers.map((member) => {
                        const isLocked = currentUserProfile ? !canViewProfileDetail(currentUserProfile, member) : true;
                        // Use real match score calculation
                        const matchResult = currentUserProfile ? calculateMatchScore(currentUserProfile, member) : undefined;

                        return (
                            <MemberListItem
                                key={member.userId}
                                member={member}
                                isLocked={isLocked}
                                matchResult={matchResult}
                            />
                        );
                    })}
                </div>

                {filteredMembers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        条件に一致するメンバーはいません
                    </div>
                )}
            </div>
        </div>
    );
}
