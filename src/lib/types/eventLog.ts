// Event log domain models
// Represents notification events returned from /api/v1/event-logs

export type EventPayloadType = 'producing_beats' | 'signing_contract' | 'scouting' | string;

export interface EventLogPayload {
	payload_type: EventPayloadType;
	// Common fields shared across payloads
	success?: boolean;
	workerId?: string;
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
