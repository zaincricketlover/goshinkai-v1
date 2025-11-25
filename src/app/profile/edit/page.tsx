"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { VenueId } from '@/lib/types';

const VENUES: { id: VenueId; name: string }[] = [
    { id: 'osaka', name: '大阪' },
    { id: 'kobe', name: '神戸' },
    { id: 'tokyo', name: '東京' },
];

export default function ProfileEditPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [kana, setKana] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [title, setTitle] = useState('');
    const [homeVenueId, setHomeVenueId] = useState<VenueId>('osaka');
    const [catchCopy, setCatchCopy] = useState('');
    const [bio, setBio] = useState('');
    const [wantTags, setWantTags] = useState('');
    const [giveTags, setGiveTags] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);

    // Fetch fresh profile data from Firestore
    useEffect(() => {
        const fetchLatestProfile = async () => {
            if (user && !dataLoaded) {
                try {
                    const profileRef = doc(db, 'profiles', user.uid);
                    const profileSnap = await getDoc(profileRef);

                    if (profileSnap.exists()) {
                        const latestProfile = profileSnap.data();
                        setName(latestProfile.name || '');
                        setKana(latestProfile.kana || '');
                        setCompanyName(latestProfile.companyName || '');
                        setTitle(latestProfile.title || '');
                        setHomeVenueId(latestProfile.homeVenueId || 'osaka');
                        setCatchCopy(latestProfile.catchCopy || '');
                        setBio(latestProfile.bio || '');
                        setWantTags(latestProfile.wantTags?.join(', ') || '');
                        setGiveTags(latestProfile.giveTags?.join(', ') || '');
                        setDataLoaded(true);
                    }
                } catch (error) {
                    console.error('Error fetching latest profile:', error);
                }
            }
        };

        fetchLatestProfile();
    }, [user, dataLoaded]);

    if (loading) return <div className="p-8">Loading...</div>;

    if (!user) {
        router.push('/');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const profileRef = doc(db, 'profiles', user.uid);
            await updateDoc(profileRef, {
                name,
                kana,
                companyName,
                title,
                homeVenueId,
                catchCopy,
                bio,
                wantTags: wantTags.split(',').map(tag => tag.trim()).filter(tag => tag),
                giveTags: giveTags.split(',').map(tag => tag.trim()).filter(tag => tag),
            });

            router.push(`/profile/${user.uid}`);
        } catch (err: any) {
            console.error(err);
            setError('保存中にエラーが発生しました。');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <Card title="プロフィール編集">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Input
                                label="お名前"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="山田 太郎"
                            />
                            <Input
                                label="ふりがな"
                                value={kana}
                                onChange={(e) => setKana(e.target.value)}
                                placeholder="やまだ たろう"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Input
                                label="会社名"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="株式会社サンプル"
                            />
                            <Input
                                label="役職"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="代表取締役"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ホーム拠点
                            </label>
                            <select
                                value={homeVenueId}
                                onChange={(e) => setHomeVenueId(e.target.value as VenueId)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                            >
                                {VENUES.map((venue) => (
                                    <option key={venue.id} value={venue.id}>
                                        {venue.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="キャッチコピー"
                            value={catchCopy}
                            onChange={(e) => setCatchCopy(e.target.value)}
                            placeholder="一言で自分を表現"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                自己紹介
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="自己紹介文を入力してください"
                            />
                        </div>

                        <Input
                            label="欲しいもの（タグ、カンマ区切り）"
                            value={wantTags}
                            onChange={(e) => setWantTags(e.target.value)}
                            placeholder="資金調達, マーケティング支援, エンジニア採用"
                        />

                        <Input
                            label="提供できるもの（タグ、カンマ区切り）"
                            value={giveTags}
                            onChange={(e) => setGiveTags(e.target.value)}
                            placeholder="技術顧問, 営業支援, デザインレビュー"
                        />

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <div className="flex gap-4">
                            <Button type="submit" className="flex-1" isLoading={saving}>
                                保存
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                className="flex-1"
                            >
                                キャンセル
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
