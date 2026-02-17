import type { ScoutingScope } from './scoutingArtistsTask';
import type { RapMusicStyle } from './musicStyles';
import type { RestingType } from './resting';

export type ArtistArchetypeType = 'rapper-archetype' | 'beatmaker-archetype';

interface ArtistArchetypeBase {
	$type: ArtistArchetypeType;
	id: string;
	name: string;
	description: string;
	rarity: number;
	rapMusicStyles: RapMusicStyle[];
}

export interface RapperArchetype extends ArtistArchetypeBase {
	$type: 'rapper-archetype';
}

export interface BeatmakerArchetype extends ArtistArchetypeBase {
	$type: 'beatmaker-archetype';
}

export type ArtistArchetype = RapperArchetype | BeatmakerArchetype;

export type RankType = 'artist-rank' | 'label-rank';

interface RankBase {
	$type: RankType;
	id: string;
	name: string;
	description: string;
	requiredXp: number;
	level: number;
}

export interface ArtistRank extends RankBase {
	$type: 'artist-rank';
	additionalPerks: number;
}

export interface LabelRank extends RankBase {
	$type: 'label-rank';
	additionalUpgradePoints: number;
}

export type Rank = ArtistRank | LabelRank;

export interface ReleaseType {
	id: string;
	name: string;
	description: string;
	minTracks: number;
	maxTracks: number;
	baseDurationMinutes: number;
	minTrackDurationSeconds: number;
	maxTrackDurationSeconds: number;
	baseBudget?: number;
}

export interface AppConfig {
	apiBaseUrl: string;
	artistArchetypes: ArtistArchetype[];
	ranks: Rank[];
	releaseTypes: ReleaseType[];
	scoutingScopes: ScoutingScope[];
	restingTypes: RestingType[];
}
