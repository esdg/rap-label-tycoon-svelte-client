// Event log domain models
// Represents notification events returned from /api/v1/event-logs

export type EventPayloadType =
	| 'producing_beats'
	| 'signing_contract'
	| 'scouting'
	| 'daily_income_report'
	| 'publishing_release'
	| 'resting'
	| 'recording_release'
	| 'artist_rank_up'
	| 'label_rank_up'
	| string;

export interface EventLogPayload {
	payload_type: EventPayloadType;
	// Common fields shared across payloads
	success?: boolean;
	workerId?: string;
	taskId?: string;
	// Producing beats
	producedBeatsCount?: number;
	productionStyles?: number[];
	// Signing contract
	artistId?: string;
	contractId?: string;
	// Scouting
	numberOfNpcDiscovered?: number;
	scopeId?: string;
	scoutingType?: number;
	// Daily income report
	fromDate?: string;
	toDate?: string;
	streams?: number;
	sales?: number;
	revenue?: number;
	tracksCount?: number;
	// Publishing/Recording release
	releaseId?: string;
	releaseTitle?: string;
	releaseTypeId?: string;
	releaseDate?: string;
	// Resting
	restingTypeId?: string;
	staminaRestored?: number;
	// Artist rank up
	artistName?: string;
	rankName?: string;
	rankLevel?: number;
	totalXp?: number;
	// Allow backend to add additional fields without breaking the UI
	[key: string]: unknown;
}

export interface EventLog {
	id: string;
	labelId: string;
	type: number;
	priority: number;
	dataPayload: EventLogPayload;
	isRead: boolean;
	createdAt: string;
	readAt: string | null;
}
