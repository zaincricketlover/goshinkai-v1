"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Camera, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function EditProfilePage() {
    const { profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form States
    const [name, setName] = useState(profile?.name || '');
    const [companyName, setCompanyName] = useState(profile?.companyName || '');
    const [title, setTitle] = useState(profile?.title || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [catchCopy, setCatchCopy] = useState(profile?.catchCopy || '');
    const [wantTags, setWantTags] = useState(profile?.wantTags?.join(', ') || '');
    const [giveTags, setGiveTags] = useState(profile?.giveTags?.join(', ') || '');
    const [industries, setIndustries] = useState(profile?.industries?.join(', ') || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatarUrl || null);

    // Business Card Fields
    const [businessCardFile, setBusinessCardFile] = useState<File | null>(null);
    const [businessEmail, setBusinessEmail] = useState(profile?.businessEmail || '');
    const [businessPhone, setBusinessPhone] = useState(profile?.businessPhone || '');
    const [businessAddress, setBusinessAddress] = useState(profile?.businessAddress || '');

    // Update state when profile loads
    React.useEffect(() => {
        if (profile) {
            setName(profile.name);
            setCompanyName(profile.companyName);
            setTitle(profile.title);
            setBio(profile.bio || '');
            setCatchCopy(profile.catchCopy || '');
            setWantTags(profile.wantTags?.join(', ') || '');
            setGiveTags(profile.giveTags?.join(', ') || '');
            setIndustries(profile.industries?.join(', ') || '');
            setAvatarPreview(profile.avatarUrl || null);
            setBusinessEmail(profile.businessEmail || '');
            setBusinessPhone(profile.businessPhone || '');
            setBusinessAddress(profile.businessAddress || '');
        }
    }, [profile]);

    if (authLoading) return <div className="min-h-screen bg-primary flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div></div>;
    if (!profile) { router.push('/'); return null; }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { toast.error('画像サイズは5MB以下にしてください'); return; }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleBusinessCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { toast.error('画像サイズは5MB以下にしてください'); return; }
            setBusinessCardFile(file);
            toast.success('名刺画像を選択しました');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let avatarUrl = profile.avatarUrl;
            if (avatarFile) {
                const storageRef = ref(storage, `avatars/${profile.userId}`);
                await uploadBytes(storageRef, avatarFile);
                avatarUrl = await getDownloadURL(storageRef);
            }

            if (businessCardFile) {
                const storageRef = ref(storage, `businessCards/${profile.userId}`);
                await uploadBytes(storageRef, businessCardFile);
                const businessCardUrl = await getDownloadURL(storageRef);
                // We need to add this to the update object
                // But TypeScript might complain if 'businessCardUrl' isn't in scope or 'updateDoc' usage is rigid.
                // Let's create a robust update object.
                await updateDoc(doc(db, 'profiles', profile.userId), {
                    businessCardUrl
                });
            }

            const splitTags = (str: string) => str.split(',').map(s => s.trim()).filter(s => s);

            await updateDoc(doc(db, 'profiles', profile.userId), {
                name, companyName, title, bio, catchCopy, avatarUrl,
                businessEmail, businessPhone, businessAddress,
                wantTags: splitTags(wantTags),
                giveTags: splitTags(giveTags),
                industries: splitTags(industries),
                updatedAt: new Date()
            });

            toast.success('プロフィールを更新しました');
            router.push(`/profile/${profile.userId}`);
        } catch (error) {
            console.error(error);
            toast.error('更新に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary pb-24 px-4 py-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center mb-6">
                    <button onClick={() => router.back()} className="mr-4 p-2 rounded-full hover:bg-white/5 text-gray-300"><ArrowLeft className="w-6 h-6" /></button>
                    <h1 className="text-2xl font-bold text-white">プロフィール編集</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <Avatar src={avatarPreview} alt={name} size="xl" />
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
                            <label className="cursor-pointer bg-surface-elevated border border-white/10 py-2 px-4 rounded-xl text-sm text-gray-300 hover:bg-white/5 transition-colors">
                                画像を変更
                            </label>
                        </div>

                        <div className="space-y-4">
                            <Input label="氏名" value={name} onChange={(e) => setName(e.target.value)} required />
                            <Input label="会社名" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                            <Input label="役職" value={title} onChange={(e) => setTitle(e.target.value)} required />
                            <Input label="キャッチコピー" value={catchCopy} onChange={(e) => setCatchCopy(e.target.value)} placeholder="一言で自分を表すと..." />

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">自己紹介</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={4}
                                    className="w-full bg-surface-elevated border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
                                    placeholder="経歴や事業内容など"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card title="名刺情報">
                        <div className="mb-6 pb-6 border-b border-white/10">
                            <label className="block text-sm font-medium text-gray-300 mb-2">名刺画像（任意）</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBusinessCardUpload}
                                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                            />
                        </div>

                        <p className="text-xs text-gray-500 mb-4">または、以下を入力するとデジタル名刺が生成されます</p>
                        <div className="space-y-4">
                            <Input label="ビジネスメール" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder="contact@example.com" />
                            <Input label="電話番号" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="03-1234-5678" />
                            <Input label="住所" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder="東京都..." />
                        </div>
                    </Card>

                    <Card title="タグ設定">
                        <div className="space-y-4">
                            <Input label="業界（カンマ区切り）" value={industries} onChange={(e) => setIndustries(e.target.value)} placeholder="IT, 不動産, 金融" />
                            <Input label="WANT（求めていること・人）" value={wantTags} onChange={(e) => setWantTags(e.target.value)} placeholder="エンジニア採用, 資金調達, 販路拡大" />
                            <Input label="GIVE（提供できること）" value={giveTags} onChange={(e) => setGiveTags(e.target.value)} placeholder="技術支援, 経営アドバイス, 人脈紹介" />
                        </div>
                    </Card>

                    <div className="flex gap-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>キャンセル</Button>
                        <Button type="submit" variant="gold" className="flex-1" isLoading={saving}><Save className="w-4 h-4 mr-2" />保存する</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
