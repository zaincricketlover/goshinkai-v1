"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { isAdmin } from '@/lib/permissions';
import { UserProfile, RankBadge } from '@/lib/types';

const RANK_OPTIONS: RankBadge[] = ['WHITE', 'BLUE', 'SILVER', 'GOLD', 'DIAMOND', 'PLATINUM'];
const SUPER_ADMIN_EMAIL = 'info@sandudm.com';

export default function AdminUsersPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user || !profile || !isAdmin(profile)) {
            router.push('/');
            return;
        }

        const fetchUsers = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'profiles'));
                const usersList: UserProfile[] = [];
                usersSnap.forEach(doc => {
                    usersList.push(doc.data() as UserProfile);
                });
                setUsers(usersList);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user, profile, authLoading, router]);

    const handleRankChange = async (userId: string, newRank: RankBadge) => {
        if (!confirm(`ユーザーのランクを ${newRank} に変更しますか？`)) return;
        setUpdating(userId);
        try {
            const userRef = doc(db, 'profiles', userId);
            await updateDoc(userRef, { rankBadge: newRank });

            setUsers(users.map(u => u.userId === userId ? { ...u, rankBadge: newRank } : u));
            alert('ランクを更新しました');
        } catch (error) {
            console.error('Error updating rank:', error);
            alert('更新に失敗しました');
        } finally {
            setUpdating(null);
        }
    };

    const handleToggleAdmin = async (targetUser: UserProfile) => {
        if (user?.email !== SUPER_ADMIN_EMAIL) {
            alert('管理者権限の変更はスーパー管理者のみ可能です。');
            return;
        }

        const newStatus = !targetUser.isAdmin;
        const message = newStatus
            ? `${targetUser.name} を管理者に設定しますか？`
            : `${targetUser.name} の管理者権限を解除しますか？`;

        if (!confirm(message)) return;

        setUpdating(targetUser.userId);
        try {
            const userRef = doc(db, 'profiles', targetUser.userId);
            await updateDoc(userRef, { isAdmin: newStatus });

            setUsers(users.map(u => u.userId === targetUser.userId ? { ...u, isAdmin: newStatus } : u));
            alert('権限を更新しました');
        } catch (error) {
            console.error('Error updating admin status:', error);
            alert('更新に失敗しました');
        } finally {
            setUpdating(null);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        const confirmed = window.confirm(`${userName}さんを退会させますか？この操作は取り消せません。`);

        if (!confirmed) return;

        try {
            // プロフィールを削除（または非アクティブ化）
            // For now, we just mark as deleted or actually delete? 
            // Request said: isActive: false, deletedAt: serverTimestamp()
            // We need to import serverTimestamp
            const { serverTimestamp } = await import('firebase/firestore');

            await updateDoc(doc(db, 'profiles', userId), {
                isActive: false,
                deletedAt: serverTimestamp()
            });

            // Remove from local list
            setUsers(users.filter(u => u.userId !== userId));
            alert(`${userName}さんを退会処理しました`);
        } catch (error) {
            console.error(error);
            alert('退会処理に失敗しました');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!user || !profile || !isAdmin(profile)) return null;

    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;

    return (
        <div className="min-h-screen bg-primary py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">ユーザー管理</h1>
                        <p className="text-gray-400 mt-1">ランク・権限の変更</p>
                    </div>
                    <Button onClick={() => router.push('/admin')} variant="outline">
                        ダッシュボードに戻る
                    </Button>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ユーザー</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">会社・役職</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">拠点</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ランク</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">権限</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((u) => (
                                    <tr key={u.userId}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-surface-elevated flex items-center justify-center text-accent font-bold mr-3">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{u.name}</div>
                                                    <div className="text-sm text-gray-500">{u.userId.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-white">{u.companyName || '-'}</div>
                                            <div className="text-sm text-gray-400">{u.title || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {u.homeVenueId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.rankBadge === 'PLATINUM' ? 'bg-purple-900/50 text-purple-300' :
                                                u.rankBadge === 'DIAMOND' ? 'bg-blue-900/50 text-blue-300' :
                                                    u.rankBadge === 'GOLD' ? 'bg-yellow-900/50 text-yellow-300' :
                                                        'bg-surface-elevated text-gray-300'
                                                }`}>
                                                {u.rankBadge}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.isAdmin ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-accent/20 text-accent">
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-xs">User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-2">
                                            <select
                                                value={u.rankBadge}
                                                onChange={(e) => handleRankChange(u.userId, e.target.value as RankBadge)}
                                                disabled={updating === u.userId}
                                                className="block w-full pl-3 pr-10 py-2 text-base bg-surface-elevated border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm"
                                            >
                                                {RANK_OPTIONS.map(rank => (
                                                    <option key={rank} value={rank}>{rank}</option>
                                                ))}
                                            </select>

                                            {isSuperAdmin && u.userId !== user.uid && (
                                                <Button
                                                    size="sm"
                                                    variant={u.isAdmin ? "outline" : "primary"}
                                                    onClick={() => handleToggleAdmin(u)}
                                                    isLoading={updating === u.userId}
                                                    className="w-full"
                                                >
                                                    {u.isAdmin ? '管理者解除' : '管理者にする'}
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full text-red-400 border-red-400/50 hover:bg-red-400/10"
                                                onClick={() => handleDeleteUser(u.userId, u.name)}
                                            >
                                                退会
                                            </Button>
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
