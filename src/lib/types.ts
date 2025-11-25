import { Timestamp } from 'firebase/firestore';

export type VenueId = 'osaka' | 'kobe' | 'tokyo';
export type RankBadge = 'WHITE' | 'BLUE' | 'SILVER' | 'GOLD' | 'DIAMOND' | 'PLATINUM';
export type ParticipationStatus = 'going' | 'interested' | 'not_going';

export interface Venue {
    id: VenueId;
    name: string;
    area: string;
}

export interface User {
    id: string; // Auth UID
    email: string;
    createdAt: Timestamp;
}

export interface UserProfile {
    userId: string;
    name: string;
    kana: string;
    avatarUrl: string;
    companyName: string;
    title: string;
    homeVenueId: VenueId;
    industries: string[];
    wantTags: string[];
    giveTags: string[];
    catchCopy: string;
    bio: string;
    rankBadge: RankBadge;
    rankScore: number;
    unlockedVenueIds: string[];
    isAdmin?: boolean;
    createdAt: Timestamp;
}

export interface Event {
    id: string;
    venueId: string;
    title: string;
    description: string;
    location: string;
    dateTime: Timestamp;
    isOpenToAllVenues: boolean;
    createdAt: Timestamp;
}

export interface EventParticipant {
    id: string;
    eventId: string;
    userId: string;
    status: ParticipationStatus;
    checkedInAt?: Timestamp;
}

export interface Interest {
    id: string;
    fromUserId: string;
    toUserId: string;
    createdAt: Timestamp;
}
export interface Thread {
    threadId: string;
    participantUserIds: string[]; // Always 2 participants
    createdAt: Timestamp;
    lastMessageAt?: Timestamp;
    lastMessageText?: string;
}

export interface Message {
    messageId: string;
    threadId: string;
    senderUserId: string;
    text: string;
    createdAt: Timestamp;
    isRead: boolean;
}
