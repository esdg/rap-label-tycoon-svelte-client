import type { RapMusicStyle } from './musicStyles';

export interface Label {
	id: string;
	ownerPlayerId: string;
	name: string;
	description: string;
	foundedDate: string;
	bankroll: number;
	productionStyles: RapMusicStyle[];
	taskIds: string[];
	maximumTasksAllowed: number;
	maximumArtistContractsAllowed: number;
	discoveredArtistsIds: string[];
	artistsWatchlistIds: string[];
	rating: number;
	reputation: number;
	hype: number;
	rankId: string;
	xp: number;
}
