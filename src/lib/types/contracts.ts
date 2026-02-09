export enum ContractStatus {
	Negotiation = 0,
	Signed = 1,
	Refused = 2,
	Expired = 3
}

export interface ContractIterationTerms {
	numberOfReleases?: Record<string, number | null> | null;
	signingBonus: number;
	royaltyPercentage: number;
	advance: number;
	contractDuration?: string | null;
}

export interface ContractIterationFeedback {
	accepted: boolean;
	message: string | null;
}

export interface ContractIteration {
	iterationNumber?: number;
	offert?: ContractIterationTerms;
	response?: ContractIterationFeedback;
}

export interface Contract {
	id: string | null;
	labelId: string | null;
	artistId: string | null;
	startDate: string;
	endDate?: string | null;
	createdAt: string;
	updatedAt: string;
	status: ContractStatus;
	iterations: ContractIteration[] | null;
	currentTerms?: ContractIterationTerms;
}
