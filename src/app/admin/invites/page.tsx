"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    collection, getDocs, addDoc, updateDoc, doc,
    serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { isAdmin } from '@/lib/permissions';
import { InviteCode, InviteUsage, UserProfile } from '@/lib/types';
import { Copy, Check, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminInvitesPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [invites, setInvites] = useState<(InviteCode & { id: string })[]>([]);
    const [usages, setUsages] = useState<InviteUsage[]>([]);
    const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [maxUses, setMaxUses] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user || !profile || !isAdmin(profile)) {
            router.push('/');
            return;
        }
        fetchData();
    }, [user, profile, authLoading, router]);

    const fetchData = async () => {
        try {
            // Fetch invites
            const invitesSnap = await getDocs(collection(db, 'invites'));
            const invitesList: (InviteCode & { id: string })[] = [];
            invitesSnap.forEach(doc => {
                invitesList.push({ id: doc.id, ...doc.data() } as InviteCode & { id: string });
            });
            invitesList.sort((a, b) => {
                const timeA = a.createdAt instanceof Timestamp ? a.createdAt.seconds : 0;
                const timeB = b.createdAt instanceof Timestamp ? b.createdAt.seconds : 0;
                return timeB - timeA;
            });
            setInvites(invitesList);

            // Fetch usages
            const usagesSnap = await getDocs(collection(db, 'inviteUsages'));
            const usagesList: InviteUsage[] = [];
            usagesSnap.forEach(doc => {
                usagesList.push({ id: doc.id, ...doc.data() } as InviteUsage);
            });
            setUsages(usagesList);

            // Fetch profiles
            const profilesSnap = await getDocs(collection(db, 'profiles'));
            const profilesMap: Record<string, UserProfile> = {};
            profilesSnap.forEach(doc => {
                profilesMap[doc.id] = doc.data() as UserProfile;
            });
            setProfiles(profilesMap);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateCode = (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleCreateInvite = async () => {
        const code = newCode.trim().toUpperCase() || generateCode();
        setCreating(true);

        try {
            await addDoc(collection(db, 'invites'), {
                code,
                createdBy: user?.uid,
                createdAt: serverTimestamp(),
                isActive: true,
                useCount: 0,
                maxUses: maxUses ? parseInt(maxUses) : null,
            });

            toast.success(`招待コード "${code}" を作成しました`);
            setNewCode('');
            setMaxUses('');
            fetchData();
        } catch (error) {
            console.error('Error creating invite:', error);
            toast.error('作成に失敗しました');
        } finally {
            setCreating(false);
        }
    };

    const handleToggleActive = async (invite: InviteCode & { id: string }) => {
        try {
            await updateDoc(doc(db, 'invites', invite.id), {
                isActive: !invite.isActive
            });
            toast.success(invite.isActive ? 'コードを無効化しました' : 'コードを有効化しました');
            fetchData();
        } catch (error) {
            console.error('Error toggling invite:', error);
            toast.error('更新に失敗しました');
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success('コピーしました');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!user || !profile || !isAdmin(profile)) return null;

    return (
        <div className="min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">招待コード管理</h1>
                        <p className="text-gray-400 mt-1">招待コードの発行・管理</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push('/admin')}>
                        ダッシュボードに戻る
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create New Invite */}
                    <Card title="新規招待コード発行" className="lg:col-span-1">
                        <div className="space-y-4">
                            <Input
                                label="コード（空欄で自動生成）"
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                placeholder="ABC12345"
                            />
                            <Input
                                label="最大使用回数（空欄で無制限）"
                                type="number"
                                value={maxUses}
                                onChange={(e) => setMaxUses(e.target.value)}
                                placeholder="10"
                            />
                            <Button
                                onClick={handleCreateInvite}
                                isLoading={creating}
                                variant="gold"
                                className="w-full"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                コードを発行
                            </Button>
                        </div>
                    </Card>

                    {/* Invite List */}
                    <Card title="招待コード一覧" className="lg:col-span-2">
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {invites.map((invite) => (
                                <div
                                    key={invite.id}
                                    className={`flex items-center justify-between p-4 rounded-xl border ${invite.isActive
                                            ? 'bg-surface-elevated border-white/10'
                                            : 'bg-red-900/20 border-red-500/20'
                                        }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => copyToClipboard(invite.code)}
                                            className="flex items-center space-x-2 font-mono text-lg text-white hover:text-accent transition-colors"
                                        >
                                            <span>{invite.code}</span>
                                            {copiedCode === invite.code ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                        <div className="flex items-center text-sm text-gray-400">
                                            <Users className="w-4 h-4 mr-1" />
                                            {invite.useCount}{invite.maxUses ? `/${invite.maxUses}` : ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">
                                            by {profiles[invite.createdBy]?.name || 'System'}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant={invite.isActive ? 'outline' : 'primary'}
                                            onClick={() => handleToggleActive(invite)}
                                        >
                                            {invite.isActive ? '無効化' : '有効化'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Usage History */}
                <Card title="招待使用履歴" className="mt-8">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">日時</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">コード</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">紹介者</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">新規会員</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">付与ポイント</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usages.slice(0, 20).map((usage) => (
                                    <tr key={usage.id} className="border-b border-white/5">
                                        <td className="py-3 px-4 text-sm text-gray-300">
                                            {usage.usedAt instanceof Timestamp
                                                ? usage.usedAt.toDate().toLocaleDateString('ja-JP')
                                                : '-'
                                            }
                                        </td>
                                        <td className="py-3 px-4 font-mono text-sm text-white">{usage.inviteCode}</td>
                                        <td className="py-3 px-4 text-sm text-white">
                                            {profiles[usage.referredBy]?.name || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-white">
                                            {profiles[usage.usedBy]?.name || '-'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-accent font-bold">
                                            +{usage.pointsAwarded}pt
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
