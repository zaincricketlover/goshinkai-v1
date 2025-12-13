import React from 'react';
import { UserProfile } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileInfoProps {
    profile: UserProfile;
    isOwnProfile: boolean;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile, isOwnProfile }) => {
    return (
        <div className="space-y-6">
            {/* Catch Copy & Bio */}
            <Card>
                {profile.catchCopy && (
                    <div className="mb-4 text-center">
                        <h3 className="text-lg font-bold text-accent italic">"{profile.catchCopy}"</h3>
                    </div>
                )}
                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {profile.bio || '自己紹介はまだありません。'}
                </p>
            </Card>

            {/* Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="WANT (求めているもの)">
                    <div className="flex flex-wrap gap-2">
                        {profile.wantTags && profile.wantTags.length > 0 ? (
                            profile.wantTags.map((tag, i) => (
                                <span key={i} className="bg-pink-500/10 text-pink-400 border border-pink-500/20 px-3 py-1 rounded-full text-xs font-medium">
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 text-sm">未設定</span>
                        )}
                    </div>
                </Card>
                <Card title="GIVE (提供できるもの)">
                    <div className="flex flex-wrap gap-2">
                        {profile.giveTags && profile.giveTags.length > 0 ? (
                            profile.giveTags.map((tag, i) => (
                                <span key={i} className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-medium">
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 text-sm">未設定</span>
                        )}
                    </div>
                </Card>
            </div>

            {/* ゴールデンチケット */}
            {isOwnProfile && (
                <Card className="border-accent/30 bg-gradient-to-br from-accent/10 via-surface-elevated to-surface overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="text-center mb-6">
                            <p className="text-xs text-accent tracking-widest uppercase mb-2">Golden Ticket</p>
                            <p className="text-[10px] text-gray-400 mb-4">
                                信頼できる仲間を、伍心会へ招待できます
                            </p>
                            <div className="bg-surface/50 rounded-xl p-4 border border-accent/20">
                                <p className="text-3xl font-mono font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent tracking-[0.3em]">
                                    {profile.inviteCode || 'コード未生成'}
                                </p>
                            </div>
                        </div>

                        {profile.inviteCode && (
                            <Button variant="gold" onClick={() => {
                                navigator.clipboard.writeText(profile.inviteCode || '');
                                toast.success('招待コードをコピーしました');
                            }} className="w-full mb-4">
                                <Copy className="w-4 h-4 mr-2" />
                                招待コードをコピー
                            </Button>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">{profile.referralCount || 0}</p>
                                <p className="text-[10px] text-gray-400">招待したメンバー</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-accent">+{(profile.referralCount || 0) * 50}</p>
                                <p className="text-[10px] text-gray-400">獲得ポイント</p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/10 text-center">
                            <p className="text-[10px] text-accent">
                                🎫 1名招待するごとに <span className="font-bold">+50pt</span> 獲得
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Industries */}
            {profile.industries && profile.industries.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                    {profile.industries.map((ind, i) => (
                        <span key={i} className="text-xs text-gray-500 bg-surface-elevated px-2 py-1 rounded">
                            #{ind}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
