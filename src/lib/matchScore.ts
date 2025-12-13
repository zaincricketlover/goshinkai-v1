import { UserProfile } from './types';

export interface MatchResult {
    score: number;
    reasons: string[];
    canProvide: string[];
    canReceive: string[];
    synergySentence: string;
}

export function calculateMatchScore(current: UserProfile, target: UserProfile): MatchResult {
    let score = 0;
    const reasons: string[] = [];
    const canProvide: string[] = [];
    const canReceive: string[] = [];

    // 1. WantとGiveのマッチング（最大50点）
    const wantGiveMatches = current.wantTags?.filter(w =>
        target.giveTags?.some(g => g.toLowerCase().includes(w.toLowerCase()) || w.toLowerCase().includes(g.toLowerCase()))
    ) || [];

    if (wantGiveMatches.length > 0) {
        score += Math.min(wantGiveMatches.length * 15, 30);
        wantGiveMatches.forEach(tag => {
            canProvide.push(tag);
            reasons.push(`「${tag}」を提供可能`);
        });
    }

    const giveWantMatches = target.wantTags?.filter(w =>
        current.giveTags?.some(g => g.toLowerCase().includes(w.toLowerCase()) || w.toLowerCase().includes(g.toLowerCase()))
    ) || [];

    if (giveWantMatches.length > 0) {
        score += Math.min(giveWantMatches.length * 10, 20);
        giveWantMatches.forEach(tag => {
            canReceive.push(tag);
            reasons.push(`「${tag}」を求めている`);
        });
    }

    // 2. 同じ業界（20点）
    const industryMatch = current.industries?.some(i => target.industries?.includes(i));
    if (industryMatch) {
        score += 20;
        reasons.push('同じ業界');
    }

    // 3. 同じ会場（15点）
    if (current.homeVenueId === target.homeVenueId) {
        score += 15;
        reasons.push('同じ会場');
    }

    // 4. ランクボーナス（GOLD以上で+10）
    const premiumRanks = ['GOLD', 'DIAMOND', 'PLATINUM'];
    if (premiumRanks.includes(target.rankBadge)) {
        score += 10;
        reasons.push('プレミアム会員');
    }

    // 5. 紹介実績（+5）
    if ((target.referralCount || 0) > 5) {
        score += 5;
        reasons.push('紹介実績豊富');
    }

    const synergySentence = generateSynergySentence(current, target, canProvide, canReceive);

    return {
        score: Math.min(score, 100),
        reasons,
        canProvide,
        canReceive,
        synergySentence,
    };
}

function generateSynergySentence(
    current: UserProfile,
    target: UserProfile,
    canProvide: string[],
    canReceive: string[]
): string {
    if (canProvide.length > 0 && canReceive.length > 0) {
        return `${target.name}様の「${canProvide[0]}」が、あなたの課題解決に。あなたの「${canReceive[0]}」が、${target.name}様のお役に。`;
    }
    if (canProvide.length > 0) {
        return `${target.name}様は「${canProvide[0]}」をお持ちです。ビジネスのヒントが見つかるかもしれません。`;
    }
    if (canReceive.length > 0) {
        return `あなたの「${canReceive[0]}」が、${target.name}様のお役に立てるかもしれません。`;
    }
    if (current.homeVenueId === target.homeVenueId) {
        return `同じ会場のメンバーです。直接お会いする機会が多いでしょう。`;
    }
    return `同じ伍心会メンバーとして、きっと共感できる話題があるはずです。`;
}

export function getRecommendedUsers(current: UserProfile, allUsers: UserProfile[], limit: number = 5): (UserProfile & { matchResult: MatchResult })[] {
    return allUsers
        .filter(u => u.userId !== current.userId)
        .map(u => ({
            ...u,
            matchResult: calculateMatchScore(current, u)
        }))
        .sort((a, b) => b.matchResult.score - a.matchResult.score)
        .slice(0, limit);
}
