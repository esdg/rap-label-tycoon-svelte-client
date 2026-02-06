import type { RapMusicStyle } from "./musicStyles";

export interface Beat {
    id: string;
    title: string;
    beatmakerId: string;
    labelId: string;
    bpm: number;
    rating: number;
    genre: RapMusicStyle;
    rarity: number;
    isExclusive: boolean;
    isSold: boolean;
    createdAt: string;
    soldAt: string | null;
    trackId: string;
}


