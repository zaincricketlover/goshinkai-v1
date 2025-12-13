# Goshinkai V2 - Complete Code Export for Review

**Generated**: 2025-12-04
**Purpose**: External engineer code review

---

## ファイル一覧

```
goshinkai_v1/
├── firestore.rules
├── package.json
├── tsconfig.json
├── next.config.ts
├── src/
│   ├── lib/
│   │   ├── types.ts
│   │   ├── firebase.ts
│   │   ├── constants.ts
│   │   ├── permissions.ts
│   │   ├── utils.ts
│   │   └── animations.ts
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── home/page.tsx
│   │   ├── members/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── [eventId]/page.tsx
│   │   │   └── create/page.tsx
│   │   ├── messages/
│   │   │   ├── page.tsx
│   │   │   └── [threadId]/page.tsx
│   │   ├── profile/
│   │   │   ├── [userId]/page.tsx
│   │   │   └── edit/page.tsx
│   │   ├── setup/page.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── events/page.tsx
│   │       ├── users/page.tsx
│   │       └── admin-setup/page.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useMessages.ts
│   └── components/
│       ├── ui/
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Input.tsx
│       │   ├── Avatar.tsx
│       │   ├── Badge.tsx
│       │   ├── Navbar.tsx
│       │   ├── BottomNavigation.tsx
│       │   ├── Skeleton.tsx
│       │   └── MessageNotification.tsx
│       ├── auth/
│       │   ├── LoginForm.tsx
│       │   └── RegisterForm.tsx
│       ├── home/
│       │   ├── MemberCard.tsx
│       │   ├── EventCountdown.tsx
│       │   └── ActionCards.tsx
│       ├── members/
│       │   ├── MemberFilter.tsx
│       │   └── MemberListItem.tsx
│       ├── events/
│       │   ├── EventCard.tsx
│       │   ├── EventDetail.tsx
│       │   ├── ParticipantList.tsx
│       │   └── CheckInButton.tsx
│       ├── messages/
│       │   ├── ThreadList.tsx
│       │   ├── ChatBubble.tsx
│       │   └── MessageInput.tsx
│       └── profile/
│           ├── ProfileHeader.tsx
│           ├── ProfileInfo.tsx
│           └── ProfileLocked.tsx
```

---

## 1. 設定・型定義

### `firestore.rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- Helper Functions ---

    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function getProfile(userId) {
      return get(/databases/$(database)/documents/profiles/$(userId)).data;
    }

    function isAdmin() {
      return getProfile(request.auth.uid).isAdmin == true;
    }

    // Check if user has Gold rank or higher
    function isGoldOrHigher(profile) {
      return profile.rankScore >= 100; // Assuming 100 is Gold threshold (sync with client logic)
      // Or check rankBadge string if reliable:
      // return profile.rankBadge in ['GOLD', 'PLATINUM', 'DIAMOND'];
    }

    // Check messaging permission
    function canMessage(targetUserId) {
      // TEMPORARY: Allow all authenticated users to message for testing
      // TODO: Re-enable strict permissions for production
      return true;
      
      /* ORIGINAL LOGIC (commented out for testing):
      let sender = getProfile(request.auth.uid);
      let target = getProfile(targetUserId);
      
      return sender.isAdmin == true 
          || sender.homeVenueId == target.homeVenueId
          || isGoldOrHigher(sender)
          || (sender.unlockedVenueIds != null && target.homeVenueId in sender.unlockedVenueIds);
      */
    }

    // --- Rules ---

    // Profiles
    match /profiles/{userId} {
      allow read: if isAuthenticated();
      
      // Create: Allow if authenticated and owner. 
      // Validate: isAdmin must be false (unless created by admin, but admin uses different flow usually)
      allow create: if isAuthenticated() && isOwner(userId) 
          && (!('isAdmin' in request.resource.data) || request.resource.data.isAdmin == false);
      
      // Update: 
      // 1. Admin can update anything.
      // 2. Owner can update, BUT cannot change 'isAdmin' status.
      allow update: if isAuthenticated() && (
        isAdmin() || 
        (isOwner(userId) && request.resource.data.isAdmin == resource.data.isAdmin)
      );
      
      allow delete: if isAdmin();
    }

    // Invites
    match /invites/{inviteId} {
      allow read: if true; // Needed for signup validation
      allow create: if isAdmin(); // Only admins create invites
      allow update: if isAuthenticated(); // For marking as used (should restrict fields)
    }

    // Events
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin() || (
        // Allow participants to update specific fields (e.g. check-in) - simplified for now
        isAuthenticated() && resource.data.participants[request.auth.uid] != null
      ); 
      allow delete: if isAdmin();
    }

    // Threads
    match /threads/{threadId} {
      // Read/Update: Must be a participant
      allow read: if isAuthenticated() && (request.auth.uid in resource.data.participantUserIds);
      allow update: if isAuthenticated() && (request.auth.uid in resource.data.participantUserIds);
      
      // Create: 
      // 1. Must be authenticated
      // 2. Must include self in participants
      // 3. Must have permission to message the other user
      allow create: if isAuthenticated() 
          && request.resource.data.participantUserIds.hasAll([request.auth.uid])
          && canMessage(request.resource.data.participantUserIds[1] == request.auth.uid ? request.resource.data.participantUserIds[0] : request.resource.data.participantUserIds[1]);
    }

    // Interests
    match /interests/{interestId} {
      // Read: Anyone authenticated can read interests
      allow read: if isAuthenticated();
      
      // Create: Must be authenticated and owner
      allow create: if isAuthenticated() && request.resource.data.fromUserId == request.auth.uid;
      
      // Delete: Only the person who created it can delete
      allow delete: if isAuthenticated() && resource.data.fromUserId == request.auth.uid;
    }

    // Messages (Subcollection of Threads)
    match /messages/{messageId} {
      // Parent thread must exist and user must be participant
      function getThread() {
        return get(/databases/$(database)/documents/threads/$(request.resource.data.threadId)).data;
      }

      allow read: if isAuthenticated(); // Simplified, ideally check thread participation
      
      // Create:
      // 1. Authenticated
      // 2. Sender must be self
      // 3. Must be participant of the thread
      allow create: if isAuthenticated() 
          && request.resource.data.senderUserId == request.auth.uid;
          // && request.auth.uid in getThread().participantUserIds; // This costs extra read
    }

    // Notifications
    match /notifications/{notificationId} {
      // Read: Only the target user can read their notifications
      allow read: if isAuthenticated() && resource.data.targetUserId == request.auth.uid;
      
      // Create: Anyone can create notifications (typically triggered by messages, etc.)
      allow create: if isAuthenticated();
      
      // Update: Only the target user can mark as read
      allow update: if isAuthenticated() && resource.data.targetUserId == request.auth.uid;
      
      // Delete: Target user or admin
      allow delete: if isAuthenticated() && (resource.data.targetUserId == request.auth.uid || isAdmin());
    }

    // Event Participants
    match /eventParticipants/{participantId} {
      // Read: Any authenticated user
      allow read: if isAuthenticated();
      
      // Create/Update: Owner or admin
      allow create, update: if isAuthenticated() && (request.resource.data.userId == request.auth.uid || isAdmin());
      
      // Delete: Owner or admin
      allow delete: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
    }
  }
}
```

### `src/lib/types.ts`
```typescript
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
    readAt?: Timestamp | null;
}
```

### `src/lib/firebase.ts`
```typescript
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
import { getStorage } from "firebase/storage";

// Initialize Firebase
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// Initialize Firestore with settings to avoid connection timeouts
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});
const storage = getStorage(app);

export { app, auth, db, storage };
```

### `src/lib/constants.ts`
```typescript
import { RankBadge, VenueId } from "./types";

export const VENUES: { id: VenueId; name: string; area: string }[] = [
    { id: 'osaka', name: '大阪', area: '関西' },
    { id: 'kobe', name: '神戸', area: '関西' },
    { id: 'tokyo', name: '東京', area: '関東' },
];

export const RANK_BADGES: Record<RankBadge, { label: string; color: string }> = {
    WHITE: { label: 'ホワイト', color: 'var(--rank-white)' },
    BLUE: { label: 'ブルー', color: 'var(--rank-blue)' },
    SILVER: { label: 'シルバー', color: 'var(--rank-silver)' },
    GOLD: { label: 'ゴールド', color: 'var(--rank-gold)' },
    DIAMOND: { label: 'ダイヤモンド', color: 'var(--rank-diamond)' },
    PLATINUM: { label: 'プラチナ', color: 'var(--rank-platinum)' },
};

export const INDUSTRIES = [
    'IT・通信', '不動産', '建設', '金融', 'コンサルティング',
    '人材', '広告・マーケティング', '製造', '小売', '飲食',
    '医療・福祉', '教育', '士業', 'その他'
];

export const TAGS_WANT = [
    '資金調達', 'エンジニア採用', '営業パートナー', '新規事業',
    'M&A', '顧問', '広報', 'マーケティング', '海外進出'
];

export const TAGS_GIVE = [
    '営業代行', 'システム開発', 'Web制作', 'SNS運用',
    '補助金申請', '税務相談', '法務相談', 'オフィス仲介', '人材紹介'
];
```

### `src/lib/permissions.ts`
```typescript
import { UserProfile, RankBadge } from "./types";

const badgeOrder: RankBadge[] = [
    "WHITE",
    "BLUE",
    "SILVER",
    "GOLD",
    "DIAMOND",
    "PLATINUM",
];

export function isGoldOrHigher(badge: RankBadge): boolean {
    return badgeOrder.indexOf(badge) >= badgeOrder.indexOf("GOLD");
}

export function isAdmin(profile: UserProfile): boolean {
    return !!profile.isAdmin;
}

export function canViewProfileDetail(
    current: UserProfile,
    target: UserProfile
): boolean {
    if (!current || !target) return false;
    if (current.userId === target.userId) return true;
    if (isAdmin(current)) return true; // Admin can view all
    if (current.homeVenueId === target.homeVenueId) return true;
    if (isGoldOrHigher(current.rankBadge)) return true;
    if (current.unlockedVenueIds?.includes(target.homeVenueId)) return true;
    return false;
}

export function canSendDirectMessage(
    current: UserProfile,
    target: UserProfile
): boolean {
    return canViewProfileDetail(current, target);
}

export function canViewWebsite(
    current: UserProfile,
    target: UserProfile
): boolean {
    if (!target.websiteUrl) return false;
    if (current.userId === target.userId) return true;
    if (isAdmin(current)) return true;

    // Silver or higher can view website
    const visibleBadges: RankBadge[] = ["SILVER", "GOLD", "DIAMOND", "PLATINUM"];
    return visibleBadges.includes(target.rankBadge);
}
```

### ` src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

### `src/lib/animations.ts`
```typescript
export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
};

export const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
};

export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.05
        }
    }
};

export const scaleIn = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.2 }
};
```

---

**出力状況**: 設定・型定義 (完了)
**次回**: スタイル、コンテキスト・フック、UIコンポーネント...

続きは「続きを出力して」とお伝えください。
