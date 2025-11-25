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
