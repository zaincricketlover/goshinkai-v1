"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserProfile } from '@/lib/types';
import { use } from 'react';
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

function InterestButtons({ fromUserId, toUserId, router, canMessage }: { fromUserId: string; toUserId: string; router: any, canMessage: boolean }) {
    const [hasInterest, setHasInterest] = useState(false);
    const [mutualInterest, setMutualInterest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const checkInterest = async () => {
            try {
                const interestsRef = collection(db, 'interests');

                const fromQuery = query(
                    interestsRef,
                    where('fromUserId', '==', fromUserId),
                    where('toUserId', '==', toUserId)
                );
                const fromSnapshot = await getDocs(fromQuery);
                setHasInterest(!fromSnapshot.empty);

                const toQuery = query(
                    interestsRef,
                    where('fromUserId', '==', toUserId),
                    where('toUserId', '==', fromUserId)
                );
                const toSnapshot = await getDocs(toQuery);

                if (!fromSnapshot.empty && !toSnapshot.empty) {
                    setMutualInterest(true);
                }
            } catch (error) {
                console.error('Error checking interest:', error);
            } finally {
                setLoading(false);
            }
        };

        checkInterest();
    }, [fromUserId, toUserId]);

    const handleInterestToggle = async () => {
        setProcessing(true);
        try {
            const interestsRef = collection(db, 'interests');
            const q = query(
                interestsRef,
                where('fromUserId', '==', fromUserId),
                where('toUserId', '==', toUserId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                await setDoc(doc(interestsRef), {
                    fromUserId,
                    toUserId,
                    createdAt: serverTimestamp(),
                });
                setHasInterest(true);

                // Check for mutual interest again
                const reverseQuery = query(
                    interestsRef,
                    where('fromUserId', '==', toUserId),
                    where('toUserId', '==', fromUserId)
                );
                const reverseSnapshot = await getDocs(reverseQuery);
                if (!reverseSnapshot.empty) {
                    setMutualInterest(true);
                    alert('マッチングしました！メッセージを送ることができます。');
                }
            } else {
                snapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
                setHasInterest(false);
                setMutualInterest(false);
            }
        } catch (error) {
            console.error('Error toggling interest:', error);
            alert('エラーが発生しました');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="border-t border-gray-200 pt-6">
            {mutualInterest && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-medium">✓ マッチしています</p>
                </div>
            )}
            <div className="flex gap-4">
                <Button
                    onClick={handleInterestToggle}
                    className={`flex-1 ${hasInterest ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    isLoading={processing}
                >
                    {hasInterest ? '興味を取り消す' : '興味を持つ'}
                </Button>
                <Button
                    variant={canMessage ? "outline" : "ghost"}
                    className={`flex-1 ${!canMessage ? 'text-gray-400' : ''}`}
                    onClick={async () => {
                        if (!canMessage) {
                            alert('この会員へのメッセージ機能は、ゴールド以上のランクか、この会場のイベントに参加すると解放されます。');
                            return;
                        }
                        // スレッドIDを生成（2人のユーザーIDをソートして連結）
                        const threadId = [fromUserId, toUserId].sort().join('_');

                        try {
                            // スレッドが存在するか確認
                            const threadRef = doc(db, 'threads', threadId);
                            const threadSnap = await getDoc(threadRef);

                            if (!threadSnap.exists()) {
                                // スレッドを作成
                                await setDoc(threadRef, {
                                    participantUserIds: [fromUserId, toUserId],
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
                    }}
                >
                    {canMessage ? 'メッセージ' : '🔒 メッセージ'}
                </Button>
            </div>
        </div>
    );
}

function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const resolvedParams = use(params);
    const { user, profile: currentUserProfile } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileRef = doc(db, 'profiles', resolvedParams.userId);
                const profileSnap = await getDoc(profileRef);

                if (profileSnap.exists()) {
                    setProfile(profileSnap.data() as UserProfile);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [resolvedParams.userId]);

    if (loading) return <div className="p-8">Loading...</div>;

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <Card title="プロフィールが見つかりません">
                    <p className="text-gray-600">指定されたユーザーのプロフィールが見つかりませんでした。</p>
                </Card>
            </div>
        );
    }

    const isOwnProfile = user?.uid === resolvedParams.userId;
    const isUnlocked = isOwnProfile || (currentUserProfile ? canViewProfileDetail(currentUserProfile, profile) : false);
    const canMessage = currentUserProfile ? canSendDirectMessage(currentUserProfile, profile) : false;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                                    {profile.name.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                                    {profile.kana && (
                                        <p className="text-sm text-gray-500">{profile.kana}</p>
                                    )}
                                    <div className="flex items-center mt-2 space-x-2">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {RANK_BADGES[profile.rankBadge]} ({profile.rankScore || 0}pt)
                                        </span>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {VENUES[profile.homeVenueId]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {isOwnProfile && (
                                <Button onClick={() => router.push('/profile/edit')}>
                                    編集
                                </Button>
                            )}
                        </div>

                        {isUnlocked ? (
                            <>
                                {profile.catchCopy && (
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                        <p className="text-blue-900 italic">"{profile.catchCopy}"</p>
                                    </div>
                                )}

                                {(profile.companyName || profile.title) && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">所属</h3>
                                        <div className="space-y-2">
                                            {profile.companyName && (
                                                <p className="text-gray-700">
                                                    <span className="font-medium">会社:</span> {profile.companyName}
                                                </p>
                                            )}
                                            {profile.title && (
                                                <p className="text-gray-700">
                                                    <span className="font-medium">役職:</span> {profile.title}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {profile.bio && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">自己紹介</h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                                    </div>
                                )}

                                {profile.wantTags && profile.wantTags.length > 0 && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">欲しいもの</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.wantTags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {profile.giveTags && profile.giveTags.length > 0 && (
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">提供できるもの</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.giveTags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="border-t border-gray-200 pt-8">
                                <div className="bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl">🔒</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">会員限定コンテンツ</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        この会員の詳細情報とメッセージ機能を利用するには、<br className="hidden sm:block" />
                                        以下のいずれかの条件を満たす必要があります。
                                    </p>

                                    <div className="bg-white p-4 rounded-lg border border-gray-100 max-w-sm mx-auto text-left space-y-3 shadow-inner">
                                        <div className="flex items-center text-sm text-gray-700">
                                            <span className="text-yellow-500 mr-2">●</span>
                                            ゴールドランク以上の会員
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <span className="text-blue-500 mr-2">●</span>
                                            同じ拠点（{VENUES[profile.homeVenueId]}）の会員
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <span className="text-green-500 mr-2">●</span>
                                            この拠点のイベントに参加してロック解除
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isOwnProfile && user && (
                            <InterestButtons
                                fromUserId={user.uid}
                                toUserId={resolvedParams.userId}
                                router={router}
                                canMessage={canMessage}
                            />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default ProfilePage;
