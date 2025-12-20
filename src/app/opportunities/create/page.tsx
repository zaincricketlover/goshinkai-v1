"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Briefcase, HandHeart, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['IT・Web', '製造・メーカー', '営業支援', '資金調達', '人材採用', 'コンサルティング', 'その他'];

export default function CreateOpportunityPage() {
    const { user, profile } = useAuth();
    const router = useRouter();

    const [type, setType] = useState<'want' | 'give'>('want');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [budget, setBudget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleSubmit = async () => {
        if (!user || !profile) return;

        if (!title.trim()) {
            toast.error('タイトルを入力してください');
            return;
        }
        if (!description.trim()) {
            toast.error('詳細を入力してください');
            return;
        }
        if (!category) {
            toast.error('カテゴリを選択してください');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'opportunities'), {
                createdBy: user.uid,
                type,
                title: title.trim(),
                description: description.trim(),
                category,
                budget: budget.trim() || null,
                deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : null,
                tags: tags.length > 0 ? tags : [],
                status: 'open',
                applicants: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success('案件を投稿しました');
            router.push('/opportunities');
        } catch (error) {
            console.error('Error creating opportunity:', error);
            toast.error('投稿に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary pb-24">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">案件を投稿</h1>
                </div>
            </div>

            <div className="px-4 py-6 space-y-4">
                {/* タイプ選択 */}
                <Card className="border-white/5">
                    <h3 className="text-sm font-bold text-gray-400 mb-3">投稿タイプ</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setType('want')}
                            className={`flex-1 py-4 rounded-xl border-2 transition-all ${type === 'want'
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                        >
                            <Briefcase className={`w-8 h-8 mx-auto mb-2 ${type === 'want' ? 'text-blue-400' : 'text-gray-500'}`} />
                            <p className={`text-sm font-medium ${type === 'want' ? 'text-blue-400' : 'text-gray-400'}`}>
                                探してます
                            </p>
                            <p className="text-xs text-gray-500 mt-1">パートナー・サービスを探す</p>
                        </button>
                        <button
                            onClick={() => setType('give')}
                            className={`flex-1 py-4 rounded-xl border-2 transition-all ${type === 'give'
                                    ? 'border-green-500 bg-green-500/10'
                                    : 'border-white/10 hover:border-white/20'
                                }`}
                        >
                            <HandHeart className={`w-8 h-8 mx-auto mb-2 ${type === 'give' ? 'text-green-400' : 'text-gray-500'}`} />
                            <p className={`text-sm font-medium ${type === 'give' ? 'text-green-400' : 'text-gray-400'}`}>
                                提供できます
                            </p>
                            <p className="text-xs text-gray-500 mt-1">サービス・スキルを提供</p>
                        </button>
                    </div>
                </Card>

                {/* 基本情報 */}
                <Card className="border-white/5">
                    <h3 className="text-sm font-bold text-gray-400 mb-3">基本情報</h3>

                    {/* タイトル */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-400 block mb-2">
                            タイトル <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={type === 'want' ? '例: ECサイト制作パートナー募集' : '例: Webマーケティング支援できます'}
                            className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50"
                        />
                    </div>

                    {/* 詳細 */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-400 block mb-2">
                            詳細 <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="具体的な内容、条件、期待することなどを記載してください"
                            rows={5}
                            className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 resize-none"
                        />
                    </div>

                    {/* カテゴリ */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-400 block mb-2">
                            カテゴリ <span className="text-red-400">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${category === cat
                                            ? 'bg-accent text-black'
                                            : 'bg-surface-elevated text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* 追加情報 */}
                <Card className="border-white/5">
                    <h3 className="text-sm font-bold text-gray-400 mb-3">追加情報（任意）</h3>

                    {/* 予算 */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-400 block mb-2">予算感</label>
                        <input
                            type="text"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="例: 100-300万円、要相談"
                            className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50"
                        />
                    </div>

                    {/* 締め切り */}
                    <div className="mb-4">
                        <label className="text-sm text-gray-400 block mb-2">締め切り</label>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full px-4 py-2 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent/50"
                        />
                    </div>

                    {/* タグ */}
                    <div>
                        <label className="text-sm text-gray-400 block mb-2">タグ（最大5つ）</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                placeholder="例: React, マーケティング"
                                className="flex-1 px-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50"
                            />
                            <Button variant="outline" onClick={handleAddTag} disabled={tags.length >= 5}>
                                追加
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full flex items-center gap-1">
                                        {tag}
                                        <button onClick={() => setTags(tags.filter(t => t !== tag))}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* 投稿ボタン */}
                <Button
                    variant="gold"
                    className="w-full py-3"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? '投稿中...' : '案件を投稿する'}
                </Button>
            </div>
        </div>
    );
}
