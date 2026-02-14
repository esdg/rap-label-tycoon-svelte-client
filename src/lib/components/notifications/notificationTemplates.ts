import type { EventLog } from '$lib/types/eventLog';
import { queryClient, queryKeys } from '$lib/queries/queryClient';
import type { AnyArtist } from '$lib/api/artists';
import { get } from 'svelte/store';
import { currentPlayer } from '$lib/stores/appState';
import { getDiscoveredArtist } from '$lib/queries/artistQueries';

export type DescriptionPart =
	| { kind: 'text'; value: string }
	| { kind: 'link'; label: string; href: string };

const payloadLabels: Record<string, string> = {
	producing_beats: 'Beat Production',
	signing_contract: 'Contract',
	scouting: 'Scouting'
};

function pluralize(value: number, word: string) {
	return `${value} ${word}${value === 1 ? '' : 's'}`;
}

function shortId(value?: string) {
	return value ? `#${value.slice(-4)}` : 'unknown';
}

function findArtistInCache(artistId: string): AnyArtist | undefined {
	const direct = queryClient.getQueryData<AnyArtist>(queryKeys.artists.byId(artistId));
	if (direct) return direct;

	// Look through any cached list queries under the artists namespace
	const queries = queryClient.getQueriesData<any>({ queryKey: ['artists'] });
	for (const [, data] of queries) {
		if (Array.isArray(data)) {
			const found = data.find((a: AnyArtist) => a?.id === artistId);
			if (found) return found;
		}
		if (data && typeof data === 'object' && 'id' in data && (data as AnyArtist).id === artistId) {
			return data as AnyArtist;
		}
	}

	const discoveredArtist = getDiscoveredArtist(artistId)?.artist;
	if (discoveredArtist) return discoveredArtist;

	return undefined;
}

function workerParts(event: EventLog): DescriptionPart[] {
	const playerId = get(currentPlayer)?.id;
	if (playerId && event.dataPayload.workerId === playerId) {
		return [{ kind: 'text', value: 'You' }];
	}

	const workerId = event.dataPayload.workerId;
	if (!workerId) return [{ kind: 'text', value: 'Team' }];

	const artist = findArtistInCache(workerId);
	if (artist?.stageName) {
		return [
			{
				kind: 'link',
				label: artist.stageName,
				href: `/artists/${encodeURIComponent(workerId)}`
			}
		];
	}

	return [{ kind: 'text', value: `Worker ${shortId(workerId)}` }];
}

function contractLabel(contractId?: string) {
	return contractId ? `contract ${shortId(contractId)}` : 'contract';
}

function artistLabel(artistId?: string) {
	if (!artistId) return 'artist';
	const cached = queryClient.getQueryData<AnyArtist>(queryKeys.artists.byId(artistId));
	if (cached?.stageName) return cached.stageName;
	return `artist ${shortId(artistId)}`;
}

type Template = (event: EventLog, workerOverride?: DescriptionPart[]) => DescriptionPart[];

const templates: Record<string, Template> = {
	producing_beats: (event, workerOverride) => {
		const data = event.dataPayload;
		const beats = data.producedBeatsCount ?? 0;
		const styles = data.productionStyles?.length ?? 0;
		const success = data.success !== false;
		const worker = workerOverride ?? workerParts(event);

		const parts: DescriptionPart[] = [
			...worker,
			{
				kind: 'text',
				value: ` ${success ? 'delivered' : 'could not finish'} ${pluralize(beats, 'beat')}`
			}
		];

		if (styles > 0) {
			parts.push({ kind: 'text', value: ` in ${pluralize(styles, 'style')}` });
		}

		parts.push({ kind: 'text', value: '.' });
		return parts;
	},
	signing_contract: (event, workerOverride) => {
		const data = event.dataPayload;
		const success = data.success !== false;
		const worker = workerOverride ?? workerParts(event);
		const parts: DescriptionPart[] = [
			...worker,
			{ kind: 'text', value: ` ${success ? 'signed ' : 'could not sign '}` },
			{ kind: 'text', value: contractLabel(data.contractId) },
			{ kind: 'text', value: ' with ' }
		];

		if (data.artistId) {
			parts.push({
				kind: 'link',
				label: artistLabel(data.artistId),
				href: `/artists/${encodeURIComponent(data.artistId)}`
			});
		} else {
			parts.push({ kind: 'text', value: 'an artist' });
		}

		parts.push({ kind: 'text', value: '.' });
		return parts;
	},
	scouting: (event, workerOverride) => {
		const data = event.dataPayload;
		const success = data.success !== false;
		const discovered = data.numberOfNpcDiscovered ?? 0;
		const worker = workerOverride ?? workerParts(event);

		if (!success) {
			return [...worker, { kind: 'text', value: ' returned without results.' }];
		}

		return [
			...worker,
			{
				kind: 'text',
				value: ` discovered ${pluralize(discovered, 'new talent')}.`
			}
		];
	}
};

const defaultTemplate: Template = (event, workerOverride) => [
	...(workerOverride ?? workerParts(event)),
	{
		kind: 'text',
		value: ` reported a ${formatPayloadLabel(event.dataPayload.payload_type)}.`
	}
];

export function describeEvent(
	event: EventLog,
	workerOverride?: DescriptionPart[]
): DescriptionPart[] {
	const payloadType = event.dataPayload.payload_type;
	return (templates[payloadType] ?? defaultTemplate)(event, workerOverride);
}

export function formatPayloadLabel(type?: string) {
	return payloadLabels[type ?? ''] || type || 'Event';
}
