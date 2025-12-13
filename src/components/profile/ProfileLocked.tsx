import React from 'react';
import { Card } from '@/components/ui/Card';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export const ProfileLocked = () => {
    const router = useRouter();

    return (
        <div className="px-4 pb-8">
            <Card className="border-accent/20 bg-surface-elevated/50 text-center py-8">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-surface rounded-full border border-white/10">
                        <Lock className="w-8 h-8 text-gray-500" />
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                    この会員の詳細を見るには
                </h3>

                <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                    以下のいずれかの条件を満たす必要があります：
                </p>

                <ul className="text-left text-sm text-gray-300 space-y-3 mb-8 max-w-xs mx-auto bg-surface p-4 rounded-xl border border-white/5">
                    <li className="flex items-start">
                        <span className="text-accent mr-2">•</span>
                        同じ会場（エリア）の会員である
                    </li>
                    <li className="flex items-start">
                        <span className="text-accent mr-2">•</span>
                        GOLDランク以上になる
                    </li>
                    <li className="flex items-start">
                        <span className="text-accent mr-2">•</span>
                        対象の会場のイベントに参加してロックを解除する
                    </li>
                </ul>

                <Button
                    variant="gold"
                    onClick={() => router.push('/events')}
                >
                    イベント一覧を見る
                </Button>
            </Card>
        </div>
    );
};
