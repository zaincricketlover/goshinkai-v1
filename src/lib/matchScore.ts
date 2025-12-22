import { UserProfile } from './types';

export interface MatchResult {
    score: number;
    reasons: string[];
    canProvide: string[];
    canReceive: string[];
    synergySentence?: string;
}

export function calculateMatchScore(myProfile: UserProfile, otherProfile: UserProfile): MatchResult {
    if (!myProfile || !otherProfile) return { score: 0, reasons: [], canProvide: [], canReceive: [] };

    let score = 0;
    let maxScore = 0;
    const reasons: string[] = [];
    const canProvide: string[] = [];
    const canReceive: string[] = [];

    // Want/Give マッチング（最大50点）
    const myWants = myProfile.wantTags || [];
    const myGives = myProfile.giveTags || [];
    const otherWants = otherProfile.wantTags || [];
    const otherGives = otherProfile.giveTags || [];

    // 自分のWantと相手のGiveが一致
    myWants.forEach(want => {
        maxScore += 25;
        const match = otherGives.some(g => g.toLowerCase().includes(want.toLowerCase()) || want.toLowerCase().includes(g.toLowerCase()));
        if (match) {
            score += 25;
            canReceive.push(want);
            reasons.push(`「${want}」を提供可能`);
        }
    });

    // 自分のGiveと相手のWantが一致
    myGives.forEach(give => {
        maxScore += 25;
        const match = otherWants.some(w => w.toLowerCase().includes(give.toLowerCase()) || give.toLowerCase().includes(w.toLowerCase()));
        if (match) {
            score += 25;
            canProvide.push(give);
            reasons.push(`「${give}」を求めている`);
        }
    });

    // 業種が同じ（10点）
    const sameIndustry = myProfile.industries?.some(i => otherProfile.industries?.includes(i));
    if (sameIndustry) {
        score += 10;
        maxScore += 10;
        reasons.push('同じ業界');
    }

    // ランクボーナス（高ランクほど+）
    const rankBonus: Record<string, number> = {
        'PLATINUM': 10,
        'DIAMOND': 10,
        'GOLD': 7,
        'SILVER': 5,
        'BLUE': 3,
        'WHITE': 0,
    };
    const bonus = rankBonus[otherProfile.rankBadge || 'WHITE'] || 0;
    score += bonus;
    maxScore += 10;
    if (bonus > 0) reasons.push('高ランクユーザー');

    // パーセンテージに変換（0-100）
    const finalScore = maxScore === 0 ? 0 : Math.min(100, Math.round((score / maxScore) * 100));

    return {
        score: finalScore,
        reasons,
        canProvide,
        canReceive
    };
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
