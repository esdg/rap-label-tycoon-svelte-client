import type { Artist, Beatmaker, Rapper } from '$lib/types/nonPlayingCharacter';

export type SkillEntry = { label: string; value: number };
export type SkillSection = { title: string; colorClass: string; skills: SkillEntry[] };

const rarityLabels = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
const rarityClasses = {
    Common: 'bg-gray-500 text-black',
    Uncommon: 'bg-primary-600 text-white',
    Rare: 'bg-category-1-500 text-white',
    Epic: 'bg-category-2-500 text-white',
    Legendary: 'bg-category-3-500 text-white'
} as const;

export function formatSkillLabel(key: string): string {
    return key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function buildSkillEntries(skillObj: Record<string, number> | undefined): SkillEntry[] {
    if (!skillObj) return [];
    return Object.entries(skillObj).map(([key, value]) => ({
        label: formatSkillLabel(key),
        value: Math.round(value ?? 0)
    }));
}

export function getRarityLabel(rarity: number): string {
    const index = Number.isFinite(rarity) ? Math.trunc(rarity) : -1;
    return rarityLabels[index] ?? 'Unknown';
}

export function getRarityClass(rarity: number): string {
    const label = getRarityLabel(rarity);
    return rarityClasses[label as keyof typeof rarityClasses] ?? 'bg-gray-600 text-white';
}

export function isRapper(artist: Artist): artist is Rapper {
    return Boolean((artist as Rapper).songWritingSkills);
}

export function isBeatmaker(artist: Artist): artist is Beatmaker {
    return Boolean((artist as Beatmaker).beatmakingSkills);
}

export function getArtistSkillSections(artist: Artist): SkillSection[] {
    const sections: SkillSection[] = [];

    if (isRapper(artist)) {
        sections.push({
            title: 'Song writing skills',
            colorClass: 'bg-pink-500',
            skills: buildSkillEntries(artist.songWritingSkills)
        });
        sections.push({
            title: 'Interpretation skills',
            colorClass: 'bg-amber-400',
            skills: buildSkillEntries(artist.interpretationSkills)
        });
    }

    if (isBeatmaker(artist)) {
        sections.push({
            title: 'Beatmaking skills',
            colorClass: 'bg-emerald-400',
            skills: buildSkillEntries(artist.beatmakingSkills)
        });
    }

    sections.push({
        title: 'Personal skills',
        colorClass: 'bg-sky-400',
        skills: buildSkillEntries(artist.personalSkills)
    });

    return sections.filter((section) => section.skills.length > 0);
}