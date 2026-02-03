import type { Contract } from "./contracts";
import type { TaskResults } from "./task";

export interface SignArtistContractRequest {
    labelId: string;
    artistId: string;
    workerId: string;
    numberOfReleases: Record<string, number>;
    duration: string | null;
    signingBonus: number;
    royaltyPercentage: number;
    advance: number;
}

export interface SigningContractResults extends TaskResults {
    contractId?: string;
    contract?: Contract;
}