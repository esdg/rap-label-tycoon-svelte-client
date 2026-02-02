export interface SignArtistContractCostRequest {
    labelId: string;
    artistId: string;
    workerId: string;
    numberOfReleases: Record<string, number>;
    duration: string | null;
    signingBonus: number;
    royaltyPercentage: number;
    advance: number;
}
