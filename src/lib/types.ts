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
    websiteUrl?: string;
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
    lastActiveAt?: Timestamp;
    referredBy?: string;      // 誰に紹介されたか
    referralCount?: number;    // 紹介した人数（デフォルト0）
    inviteCode?: string;      // 自分の招待コード

    // Stats (Optional)
    eventsAttended?: number;
    interestsReceived?: number;
    messagesCount?: number;

    // Business Card
    businessCardUrl?: string;
    businessEmail?: string;
    businessPhone?: string;
    businessAddress?: string;

    onboardingCompleted?: boolean;
    connectionsCount?: number;

    createdAt: Timestamp;
}

export interface Event {
    id: string;
    venueId: string;
    title: string;
    description: string;
    location: string;
    locationUrl?: string;
    imageUrl?: string;
    dateTime: Timestamp;
    endTime?: Timestamp;
    isOpenToAllVenues: boolean;
    maxParticipants?: number;
    createdAt: Timestamp;
}

export interface EventParticipant {
    id?: string;
    eventId: string;
    userId: string;
    status: ParticipationStatus;
    checkedInAt?: Timestamp;
    pointsAwarded?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Interest {
    id: string;
    fromUserId: string;
    toUserId: string;
    createdAt: Timestamp;
}

export interface Thread {
    threadId: string;
    participantUserIds: string[];
    createdAt: Timestamp;
    lastMessageAt?: Timestamp;
    lastMessageText?: string;
    lastMessageSenderId?: string;
}

export interface Message {
    messageId: string;
    threadId: string;
    senderUserId: string;
    text: string;
    isTemplate: boolean;
    createdAt: Timestamp;
    isRead: boolean;
    readAt?: Timestamp | null;
}

// 招待コード（改善版）
export interface InviteCode {
    code: string;
    createdBy: string;        // 作成者（紹介者）のuserId
    createdAt: Timestamp;
    isActive: boolean;        // 無効化可能
    useCount: number;         // 使用回数
    maxUses?: number | null;  // 最大使用回数（nullなら無制限）
}

// 招待使用履歴
export interface InviteUsage {
    id: string;
    inviteCode: string;
    usedBy: string;           // 使用者のuserId
    referredBy: string;       // 紹介者のuserId
    usedAt: Timestamp;
    pointsAwarded: number;    // 紹介者に付与したポイント
}
