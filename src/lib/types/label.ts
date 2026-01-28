export interface Label {
    id: string;
    ownerPlayerId: string;
    name: string;
    description: string;
    foundedDate: string;
    bankroll: number;
    productionStyles: number[];
    taskIds: string[];
    maximumTasksAllowed: number;
    maximumArtistContractsAllowed: number;
    discoveredArtistsIds: string[];
    artistsWatchlistIds: string[];
    rating: number;
    reputation: number;
    hype: number;
}
