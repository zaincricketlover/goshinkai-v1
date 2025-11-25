"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserProfile } from '@/lib/types';
import { canViewProfileDetail, canSendDirectMessage } from '@/lib/permissions';

const VENUES: Record<string, string> = {
    osaka: '大阪',
    kobe: '神戸',
    tokyo: '東京',
};

const RANK_BADGES: Record<string, string> = {
    WHITE: 'ホワイト',
    BLUE: 'ブルー',
    SILVER: 'シルバー',
    GOLD: 'ゴールド',
    DIAMOND: 'ダイヤモンド',
    PLATINUM: 'プラチナ',
};

export default function MembersPage() {
    const { user, profile: currentUserProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [venueFilter, setVenueFilter] = useState<string>('all');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        const fetchMembers = async () => {
            try {
                const profilesRef = collection(db, 'profiles');
                const q = query(profilesRef);
                const querySnapshot = await getDocs(q);

                const membersList: UserProfile[] = [];
                querySnapshot.forEach((doc) => {
                    const profile = doc.data() as UserProfile;
                    // Exclude current user
                    if (profile.userId !== user?.uid) {
                        membersList.push(profile);
                    }
                });

                setMembers(membersList);
                setFilteredMembers(membersList);
            } catch (error) {
                console.error('Error fetching members:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchMembers();
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        let filtered = members;

        // Filter by venue
        if (venueFilter !== 'all') {
            filtered = filtered.filter(m => m.homeVenueId === venueFilter);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                m =>
                    m.name.toLowerCase().includes(query) ||
                    m.companyName?.toLowerCase().includes(query) ||
                    m.catchCopy?.toLowerCase().includes(query)
            );
        }

        setFilteredMembers(filtered);
    }, [searchQuery, venueFilter, members]);

    const handleMessage = async (memberId: string) => {
        if (!user) return;

        try {
            // スレッドIDを生成（2人のユーザーIDをソートして連結）
            const threadId = [user.uid, memberId].sort().join('_');

            // スレッドが存在するか確認
            const threadRef = doc(db, 'threads', threadId);
            const threadSnap = await getDoc(threadRef);

            if (!threadSnap.exists()) {
                // スレッドを作成
                await setDoc(threadRef, {
                    participantUserIds: [user.uid, memberId],
                    lastMessageAt: serverTimestamp(),
                    lastMessageText: '',
                    createdAt: serverTimestamp(),
                });
            }

            // チャット画面へ遷移
            router.push(`/messages/${threadId}`);
        } catch (error) {
            console.error('Error creating/accessing thread:', error);
            alert('エラーが発生しました');
        }
    };

    if (authLoading || loading) return <div className="p-8">Loading...</div>;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">メンバー</h1>
                </div>

                {/* Filters */}
                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                検索
                            </label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="名前、会社名、キャッチコピーで検索"
                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                拠点フィルター
                            </label>
                            <select
                                value={venueFilter}
                                onChange={(e) => setVenueFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="all">すべて</option>
                                <option value="osaka">大阪</option>
                                <option value="kobe">神戸</option>
                                <option value="tokyo">東京</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Members List */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.length === 0 ? (
                        <div className="col-span-full">
                            <Card>
                                <p className="text-gray-600 text-center">
                                    条件に一致するメンバーが見つかりませんでした。
                                </p>
                            </Card>
                        </div>
                    ) : (
                        filteredMembers.map((member) => {
                            const isUnlocked = currentUserProfile ? canViewProfileDetail(currentUserProfile, member) : false;
                            const canMessage = currentUserProfile ? canSendDirectMessage(currentUserProfile, member) : false;

                            return (
                                <Card key={member.userId}>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                    {member.name}
                                                </h3>
                                                {isUnlocked && member.companyName && (
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {member.companyName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {RANK_BADGES[member.rankBadge]}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {VENUES[member.homeVenueId]}
                                            </span>
                                        </div>

                                        {isUnlocked ? (
                                            member.catchCopy && (
                                                <p className="text-sm text-gray-700 italic line-clamp-2">
                                                    "{member.catchCopy}"
                                                </p>
                                            )
                                        ) : (
                                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 flex flex-col items-center justify-center text-center space-y-1">
                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mb-1">
                                                    <span className="text-lg">🔒</span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-700">会員限定情報</p>
                                                <p className="text-[10px] text-gray-500 leading-tight">
                                                    詳細閲覧には条件達成が必要です
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => router.push(`/profile/${member.userId}`)}
                                                className="flex-1"
                                                size="sm"
                                            >
                                                プロフィール
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    if (canMessage) {
                                                        handleMessage(member.userId);
                                                    } else {
                                                        alert('この会員へのメッセージ機能は、ゴールド以上のランクか、この会場のイベントに参加すると解放されます。');
                                                    }
                                                }}
                                                variant={canMessage ? "outline" : "ghost"}
                                                className={`flex-1 ${!canMessage ? 'text-gray-400' : ''}`}
                                                size="sm"
                                            >
                                                {canMessage ? 'メッセージ' : '🔒 メッセージ'}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
