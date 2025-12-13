import React from 'react';
import { Event } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface EventDetailProps {
    event: Event;
}

export const EventDetail: React.FC<EventDetailProps> = ({ event }) => {
    const formatDate = (timestamp: Timestamp) => {
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
        }).format(date);
    };

    const formatTime = (timestamp: Timestamp) => {
        const date = timestamp.toDate();
        return new Intl.DateTimeFormat('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="space-y-6">
            {/* Header Image / Gradient */}
            <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900 to-primary-dark">
                {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="absolute inset-0 bg-accent/5" />
                )}
                <div className="absolute bottom-0 left-0 p-6 bg-gradient-to-t from-primary to-transparent w-full">
                    <Badge rank="GOLD" showLabel={false} className="mb-2" />
                    <h1 className="text-2xl font-bold text-white shadow-sm">{event.title}</h1>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-surface-elevated/50">
                    <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-accent mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-1">開催日時</h3>
                            <p className="text-lg font-bold text-white">{formatDate(event.dateTime)}</p>
                            <div className="flex items-center text-sm text-gray-300 mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(event.dateTime)} 〜 {event.endTime ? formatTime(event.endTime) : '終了未定'}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-surface-elevated/50">
                    <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-accent mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-1">開催場所</h3>
                            <p className="text-lg font-bold text-white">{event.location}</p>
                            {event.locationUrl && (
                                <a
                                    href={event.locationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-xs text-accent mt-1 hover:underline"
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    地図を開く
                                </a>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Description */}
            <Card title="イベント詳細">
                <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap">
                    {event.description}
                </div>
            </Card>
        </div>
    );
};
