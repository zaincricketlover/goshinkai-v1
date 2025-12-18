"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp, or, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { canViewProfileDetail, canSendDirectMessage } from '@/lib/permissions';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { ProfileLocked } from '@/components/profile/ProfileLocked';
import { Button } from '@/components/ui/Button';
import { MessageCircle, Heart, Edit, Check, LogOut, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const resolvedParams = use(params);
    const { user, profile: currentUserProfile } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInterested, setIsInterested] = useState(false);
    const [interestLoading, setInterestLoading] = useState(false);
    const [messageLoading, setMessageLoading] = useState(false);

    const fetchProfile = async () => {
        try {
            const docRef = doc(db, 'profiles', resolvedParams.userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [resolvedParams.userId]);

    // Separate effect for checking interest status to ensure persistence
    useEffect(() => {
        const checkInterestStatus = async () => {
            if (!user || !resolvedParams.userId) return;

            try {
                const interestDocId = `${user.uid}_${resolvedParams.userId}`;
                const interestRef = doc(db, 'interests', interestDocId);
                const interestSnap = await getDoc(interestRef);
                setIsInterested(interestSnap.exists());
            } catch (err) {
                console.error('Error checking interest:', err);
            }
        };

        checkInterestStatus();
    }, [user, resolvedParams.userId]);

    const handleInterest = async () => {
        if (!user || !profile) return;
        setInterestLoading(true);

        try {
            const interestDocId = `${user.uid}_${profile.userId}`;
            const interestRef = doc(db, 'interests', interestDocId);

            if (isInterested) {
                // Remove interest (Toggle Off)
                await deleteDoc(interestRef);
                setIsInterested(false);
                toast.info('興味ありを取り消しました');
            } else {
                // Add interest (Toggle On) - setDoc with deterministic ID
                await setDoc(interestRef, {
                    fromUserId: user.uid,
                    toUserId: profile.userId,
                    createdAt: serverTimestamp()
                });
                setIsInterested(true);
                toast.success('興味ありを送信しました！');

                // Check if mutual interest (match)
                const mutualQuery = query(
                    collection(db, 'interests'),
                    where('fromUserId', '==', profile.userId),
                    where('toUserId', '==', user.uid)
                );
                const mutualSnap = await getDocs(mutualQuery);
                if (!mutualSnap.empty) {
                    toast.success('🎉 マッチしました！メッセージを送ってみましょう', { duration: 5000 });
                }
            }
        } catch (error) {
            console.error('Error toggling interest:', error);
            toast.error('エラーが発生しました');
        } finally {
            setInterestLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!user || !profile) return;
        setMessageLoading(true);

        try {
            // Check if thread already exists
            const threadsRef = collection(db, 'threads');
            const q = query(
                threadsRef,
                where('participantUserIds', 'array-contains', user.uid)
            );
            const threadsSnap = await getDocs(q);

            let existingThreadId: string | null = null;
            threadsSnap.forEach((doc) => {
                const data = doc.data();
                if (data.participantUserIds.includes(profile.userId)) {
                    existingThreadId = doc.id;
                }
            });

            if (existingThreadId) {
                // Thread exists, navigate to it
                router.push(`/messages/${existingThreadId}`);
            } else {
                // Create new thread
                const newThreadRef = await addDoc(collection(db, 'threads'), {
                    participantUserIds: [user.uid, profile.userId],
                    createdAt: serverTimestamp(),
                    lastMessageAt: serverTimestamp(),
                    lastMessageText: '',
                    lastMessageSenderId: ''
                });
                router.push(`/messages/${newThreadRef.id}`);
            }
        } catch (error) {
            console.error('Error creating/finding thread:', error);
            toast.error('エラーが発生しました');
        } finally {
            setMessageLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
            toast.success('ログアウトしました');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('ログアウトに失敗しました');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div></div>;
    if (!profile) return <div className="text-center p-8 text-white">ユーザーが見つかりません</div>;

    const isOwnProfile = user?.uid === profile.userId;
    const canView = currentUserProfile ? canViewProfileDetail(currentUserProfile, profile) : false;
    const canMessage = currentUserProfile ? canSendDirectMessage(currentUserProfile, profile) : false;

    return (
        <div className="min-h-screen bg-primary pb-20">
            <ProfileHeader profile={profile} />

            {canView ? (
                <ProfileInfo profile={profile} isOwnProfile={isOwnProfile} />
            ) : (
                <ProfileLocked />
            )}

            {/* Floating Action Bar */}
            <div className="fixed bottom-20 left-0 right-0 px-4 flex justify-center gap-4 z-40 pointer-events-none">
                <div className="flex gap-3 pointer-events-auto">
                    {isOwnProfile ? (
                        <>
                            <Button
                                variant="secondary"
                                className="shadow-xl"
                                onClick={() => router.push('/profile/edit')}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                プロフィール編集
                            </Button>
                            <Button
                                variant="outline"
                                className="shadow-xl text-red-400 border-red-400/50 bg-surface-elevated"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                ログアウト
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant={isInterested ? "secondary" : "secondary"}
                                className={`shadow-xl ${isInterested ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 hover:bg-pink-500/20' : ''}`}
                                onClick={handleInterest}
                                isLoading={interestLoading}
                            >
                                {isInterested ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        興味あり（解除）
                                    </>
                                ) : (
                                    <>
                                        <Heart className="w-4 h-4 mr-2" />
                                        興味あり
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="shadow-xl bg-surface-elevated border-white/10"
                                onClick={() => router.push(`/connections/add?userId=${profile.userId}`)}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                コネクション追加
                            </Button>
                            {canMessage && (
                                <Button
                                    variant="gold"
                                    className="shadow-xl"
                                    onClick={handleSendMessage}
                                    isLoading={messageLoading}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    メッセージを送る
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div >
    );
}

