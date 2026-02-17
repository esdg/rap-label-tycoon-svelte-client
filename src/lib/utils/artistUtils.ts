import type { Artist, Beatmaker, Rapper } from '$lib/types/nonPlayingCharacter';
import type { AppConfig, Rank } from '$lib/types/config';

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

/**
 * Convert a number to Roman numerals
 */
export function toRomanNumeral(num: number): string {
	if (num < 1 || num > 3999) return num.toString();

	const romanNumerals: [number, string][] = [
		[1000, 'M'],
		[900, 'CM'],
		[500, 'D'],
		[400, 'CD'],
		[100, 'C'],
		[90, 'XC'],
		[50, 'L'],
		[40, 'XL'],
		[10, 'X'],
		[9, 'IX'],
		[5, 'V'],
		[4, 'IV'],
		[1, 'I']
	];

	let result = '';
	let remaining = num;

	for (const [value, numeral] of romanNumerals) {
		while (remaining >= value) {
			result += numeral;
			remaining -= value;
		}
	}

	return result;
}

/**
 * Get artist rank label in format "Rank I", "Rank II", etc.
 */
export function getArtistRankLabel(rankId: string, config: AppConfig | null): string {
	if (!rankId) return '';
	if (!config) return '';

	const rank = config.ranks.find((r) => r.id === rankId && r.$type === 'artist-rank');

	if (!rank) {
		console.warn(`Artist rank not found for rankId: ${rankId}`, {
			availableRanks: config.ranks
				.filter((r) => r.$type === 'artist-rank')
				.map((r) => ({ id: r.id, level: r.level }))
		});
		return '';
	}

	return `rank ${toRomanNumeral(rank.level)}`;
}

/**
 * Get label rank label in format "Rank I", "Rank II", etc.
 */
export function getLabelRankLabel(rankId: string, config: AppConfig | null): string {
	if (!rankId) return '';
	if (!config) return '';

	const rank = config.ranks.find((r) => r.id === rankId && r.$type === 'label-rank');

	if (!rank) {
		console.warn(`Label rank not found for rankId: ${rankId}`, {
			availableRanks: config.ranks
				.filter((r) => r.$type === 'label-rank')
				.map((r) => ({ id: r.id, level: r.level }))
		});
		return '';
	}

	return `rank ${toRomanNumeral(rank.level)}`;
}

/**
 * Get label rank info including current rank and next rank target XP
 */
export function getLabelRankInfo(
	rankId: string,
	currentXp: number,
	config: AppConfig | null
): {
	currentRank: string;
	currentXp: number;
	nextRankXp: number | null;
	isMaxRank: boolean;
} | null {
	if (!rankId || !config) return null;

	const currentRank = config.ranks.find((r) => r.id === rankId && r.$type === 'label-rank');
	if (!currentRank) return null;

	// Get all label ranks sorted by level
	const labelRanks = config.ranks
		.filter((r) => r.$type === 'label-rank')
		.sort((a, b) => a.level - b.level);

	// Find next rank
	const nextRank = labelRanks.find((r) => r.level > currentRank.level);

	return {
		currentRank: `rank ${toRomanNumeral(currentRank.level)}`,
		currentXp,
		nextRankXp: nextRank ? nextRank.requiredXp : null,
		isMaxRank: !nextRank
	};
}
