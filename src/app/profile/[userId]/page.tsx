"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { canViewProfileDetail, canSendDirectMessage } from '@/lib/permissions';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { ProfileLocked } from '@/components/profile/ProfileLocked';
import { Button } from '@/components/ui/Button';
import { MessageCircle, Heart, Edit, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const resolvedParams = use(params);
    const { user, profile: currentUserProfile } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInterested, setIsInterested] = useState(false);
    const [interestLoading, setInterestLoading] = useState(false);
    const [messageLoading, setMessageLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const docRef = doc(db, 'profiles', resolvedParams.userId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile);
                }

                // Check if current user has already expressed interest
                if (user) {
                    const interestsRef = collection(db, 'interests');
                    const q = query(
                        interestsRef,
                        where('fromUserId', '==', user.uid),
                        where('toUserId', '==', resolvedParams.userId)
                    );
                    const interestSnap = await getDocs(q);
                    setIsInterested(!interestSnap.empty);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [resolvedParams.userId, user]);

    const handleInterest = async () => {
        if (!user || !profile) return;
        setInterestLoading(true);

        try {
            if (isInterested) {
                // Remove interest (Toggle Off)
                const interestsRef = collection(db, 'interests');
                const q = query(
                    interestsRef,
                    where('fromUserId', '==', user.uid),
                    where('toUserId', '==', profile.userId)
                );
                const snapshot = await getDocs(q);

                // There might be duplicates, delete all matching
                const deletePromises = snapshot.docs.map(doc => import('firebase/firestore').then(({ deleteDoc }) => deleteDoc(doc.ref)));
                await Promise.all(deletePromises);

                setIsInterested(false);
                toast.info('興味ありを取り消しました');
            } else {
                // Add interest (Toggle On)
                await addDoc(collection(db, 'interests'), {
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
                        <Button
                            variant="secondary"
                            className="shadow-xl"
                            onClick={() => router.push('/profile/edit')}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            プロフィール編集
                        </Button>
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
        </div>
    );
}

