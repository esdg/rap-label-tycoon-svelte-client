import type { RapMusicStyle } from './musicStyles';

export interface Release {
    id: string;
    labelId: string;
    title: string;
    finishedDate: string;
    releaseDate: string;
    releaseTypeId: string;
    trackIds: string[];
    rating: number;
    hype: number;
    albumCoverUrl: string;
}

export interface Track {
    id: string;
    labelId: string;
    artistId: string[];
    beatId: string;
    title: string;
    durationSeconds: number;
    productionStyle: RapMusicStyle;
    isExplicit: boolean;
    rating: number;
    hype: number;
    performanceStats: {
        streams: number;
        sales: number;
        revenue: number;
    };
}
