"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter, UserPlus, MessageSquare, Calendar } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface ConnectionWithProfile {
    connection: {
        id: string;
        connectedUserId: string;
        connectedAt: any;
        connectedLocation?: string;
        memo?: string;
        tags?: string[];
    };
    profile: UserProfile;
}

export default function ConnectionsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
    const [filteredConnections, setFilteredConnections] = useState<ConnectionWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState<string | null>(null);

    useEffect(() => {
        const fetchConnections = async () => {
            if (!user) return;

            try {
                const connectionsRef = collection(db, 'connections');
                const q = query(
                    connectionsRef,
                    where('ownerUserId', '==', user.uid),
                    where('status', '==', 'active'),
                    orderBy('connectedAt', 'desc')
                );

                const snapshot = await getDocs(q);
                const connectionsList: ConnectionWithProfile[] = [];

                for (const docSnap of snapshot.docs) {
                    const connectionData = docSnap.data();

                    // 相手のプロフィールを取得
                    const profileRef = doc(db, 'profiles', connectionData.connectedUserId);
                    const profileSnap = await getDoc(profileRef);

                    if (profileSnap.exists()) {
                        connectionsList.push({
                            connection: {
                                id: docSnap.id,
                                connectedUserId: connectionData.connectedUserId,
                                connectedAt: connectionData.connectedAt,
                                connectedLocation: connectionData.connectedLocation,
                                memo: connectionData.memo,
                                tags: connectionData.tags,
                            },
                            profile: profileSnap.data() as UserProfile,
                        });
                    }
                }

                setConnections(connectionsList);
                setFilteredConnections(connectionsList);
            } catch (error) {
                console.error('Error fetching connections:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
    }, [user]);

    // 検索・フィルター処理
    useEffect(() => {
        let filtered = [...connections];

        // 検索クエリでフィルター
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.profile.name?.toLowerCase().includes(query) ||
                c.profile.companyName?.toLowerCase().includes(query) ||
                c.connection.memo?.toLowerCase().includes(query)
            );
        }

        // タグでフィルター
        if (filterTag) {
            filtered = filtered.filter(c =>
                c.connection.tags?.includes(filterTag)
            );
        }

        setFilteredConnections(filtered);
    }, [searchQuery, filterTag, connections]);

    // 全タグを取得
    const allTags = [...new Set(connections.flatMap(c => c.connection.tags || []))];

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-accent rounded-full border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary pb-24">
            {/* ヘッダー */}
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-white">コネクション</h1>
                    <Button
                        variant="gold"
                        size="sm"
                        onClick={() => router.push('/connections/add')}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        追加
                    </Button>
                </div>

                {/* 検索 */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="名前、会社名、メモで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent/50"
                    />
                </div>

                {/* タグフィルター */}
                {allTags.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        <button
                            onClick={() => setFilterTag(null)}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${filterTag === null
                                ? 'bg-accent text-black'
                                : 'bg-surface-elevated text-gray-400 hover:text-white'
                                }`}
                        >
                            すべて
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(tag)}
                                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${filterTag === tag
                                    ? 'bg-accent text-black'
                                    : 'bg-surface-elevated text-gray-400 hover:text-white'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* コネクション一覧 */}
            <div className="px-4 py-4 space-y-3">
                {filteredConnections.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">🤝</div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            まだコネクションがありません
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            イベントで出会った人をQRコードで追加しましょう
                        </p>
                        <Button
                            variant="gold"
                            onClick={() => router.push('/connections/add')}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            コネクションを追加
                        </Button>
                    </div>
                ) : (
                    filteredConnections.map(({ connection, profile }) => (
                        <Card
                            key={connection.id}
                            className="border-white/5 hover:border-accent/30 transition-all cursor-pointer"
                            onClick={() => router.push(`/connections/${connection.id}`)}
                        >
                            <div className="flex items-start gap-4">
                                <Avatar
                                    src={profile.avatarUrl}
                                    alt={profile.name || ''}
                                    size="md"
                                    rank={profile.rankBadge}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white truncate">{profile.name}</h3>
                                        <Badge rank={profile.rankBadge} size="sm" />
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">{profile.companyName}</p>

                                    {/* メモ */}
                                    {connection.memo && (
                                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                            📝 {connection.memo}
                                        </p>
                                    )}

                                    {/* タグ */}
                                    {connection.tags && connection.tags.length > 0 && (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {connection.tags.map(tag => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* 交換日時・場所 */}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        <span>{formatDate(connection.connectedAt)}</span>
                                        {connection.connectedLocation && (
                                            <span>📍 {connection.connectedLocation}</span>
                                        )}
                                    </div>
                                </div>

                                {/* アクションボタン */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/messages?userId=${profile.userId}`);
                                        }}
                                        className="p-2 rounded-lg bg-surface-elevated hover:bg-accent/20 transition-colors"
                                    >
                                        <MessageSquare className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
