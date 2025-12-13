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
