import type { EventLog } from '$lib/types/eventLog';
import {
	type DescriptionPart,
	pluralize,
	resolveWorkerParts,
	resolveArtistLabel,
	formatContractLabel,
	formatPayloadLabel
} from '$lib/utils/notificationUtils';

export type { DescriptionPart };

type Template = (event: EventLog, currentPlayerId: string | null | undefined) => DescriptionPart[];

const templates: Record<string, Template> = {
	producing_beats: (event, currentPlayerId) => {
		const data = event.dataPayload;
		const beats = data.producedBeatsCount ?? 0;
		const styles = data.productionStyles?.length ?? 0;
		const success = data.success !== false;
		const worker = resolveWorkerParts(data.workerId, currentPlayerId);

		const parts: DescriptionPart[] = [
			...worker,
			{
				kind: 'text',
				value: ` ${success ? 'produced' : 'did not produce any'} ${pluralize(beats, 'beat')}`
			}
		];

		if (styles > 0) {
			parts.push({ kind: 'text', value: ` in ${pluralize(styles, 'style')}` });
		}

		parts.push({ kind: 'text', value: '.' });
		return parts;
	},
	signing_contract: (event, currentPlayerId) => {
		const data = event.dataPayload;
		const success = data.success !== false;
		const worker = resolveWorkerParts(data.workerId, currentPlayerId);
		let artistLabel: DescriptionPart;
		if (data.artistId) {
			artistLabel = {
				kind: 'link',
				label: resolveArtistLabel(data.artistId),
				href: `/artists/${encodeURIComponent(data.artistId)}`,
				color: 'text-category-2-400'
			};
		} else {
			artistLabel = { kind: 'text', value: 'an artist' };
		}

		const parts: DescriptionPart[] = [
			artistLabel,
			{ kind: 'text', value: ` ${success ? ' accepted ' : ' refused '}` },
			{ kind: 'text', value: 'your ' },
			{
				kind: 'link',
				label: `contract`,
				href: `${success ? '/beats/start' : `/contracts/${encodeURIComponent(data.contractId ?? '')}`}`
			},
			{ kind: 'text', value: ' label offert. You can ' },
			{
				kind: 'link',
				label: ` ${success ? 'start producing' : 'propose a new offer'}`,
				href: `${success ? '/beats/start' : `/contracts/${encodeURIComponent(data.contractId ?? '')}`}`
			}
		];

		parts.push({ kind: 'text', value: '.' });
		return parts;
	},
	scouting: (event, currentPlayerId) => {
		const data = event.dataPayload;
		const success = data.success !== false;
		const discovered = data.numberOfNpcDiscovered ?? 0;
		const worker = resolveWorkerParts(data.workerId, currentPlayerId);

		if (!success) {
			return [
				{ kind: 'text', value: 'Your prospector (' },
				...worker,
				{ kind: 'text', value: ') returned without results.' }
			];
		}

		return [
			{ kind: 'text', value: 'Your prospector (' },
			...worker,
			{
				kind: 'text',
				value: `) discovered `
			},
			{
				kind: 'link',
				label: `${pluralize(discovered, 'new talent')}`,
				href: `${success ? '/beats/start' : `/contracts/${encodeURIComponent(data.contractId ?? '')}`}`
			},
			{
				kind: 'text',
				value: `.`
			}
		];
	},
	daily_income_report: (event) => {
		const data = event.dataPayload;
		const revenue = data.revenue ?? 0;
		const streams = data.streams ?? 0;
		const sales = data.sales ?? 0;
		const tracks = data.tracksCount ?? 0;

		return [
			{ kind: 'text', value: `Daily report: ` },
			{ kind: 'text', value: `$${revenue.toFixed(2)} revenue `, color: 'text-green-400' },
			{ kind: 'text', value: `from ${streams.toLocaleString()} streams and ${sales} sales ` },
			{ kind: 'text', value: `across ${pluralize(tracks, 'track')}.` }
		];
	},
	publishing_release: (event) => {
		const data = event.dataPayload;
		const releaseTitle = data.releaseTitle ?? 'Unknown Release';
		const releaseId = data.releaseId;

		const parts: DescriptionPart[] = [{ kind: 'text', value: 'Your release ' }];

		if (releaseId) {
			parts.push({
				kind: 'link',
				label: releaseTitle,
				href: `/releases/${encodeURIComponent(releaseId)}`
			});
		} else {
			parts.push({ kind: 'text', value: releaseTitle });
		}

		parts.push({ kind: 'text', value: ' has been published and is now available to the public.' });
		return parts;
	},
	resting: (event, currentPlayerId) => {
		const data = event.dataPayload;
		const success = data.success !== false;
		const stamina = data.staminaRestored ?? 0;
		const worker = resolveWorkerParts(data.workerId, currentPlayerId);

		if (!success) {
			return [...worker, { kind: 'text', value: ' was unable to rest properly.' }];
		}

		return [
			...worker,
			{ kind: 'text', value: ` rested and restored ` },
			{ kind: 'text', value: `${stamina} stamina`, color: 'text-success-600' },
			{ kind: 'text', value: '.' }
		];
	},
	recording_release: (event, currentPlayerId) => {
		const data = event.dataPayload;
		const success = data.success !== false;
		const releaseTitle = data.releaseTitle ?? 'Unknown Release';
		const releaseId = data.releaseId;
		const worker = resolveWorkerParts(data.workerId, currentPlayerId);

		const parts: DescriptionPart[] = [...worker];

		if (success) {
			parts.push({ kind: 'text', value: ' finished recording ' });
		} else {
			parts.push({ kind: 'text', value: ' could not complete recording for ' });
		}

		if (releaseId) {
			parts.push({
				kind: 'link',
				label: releaseTitle,
				href: `/releases/${encodeURIComponent(releaseId)}`
			});
		} else {
			parts.push({ kind: 'text', value: releaseTitle });
		}

		parts.push({ kind: 'text', value: '.' });
		return parts;
	}
};

const defaultTemplate: Template = (event, currentPlayerId) => [
	...resolveWorkerParts(event.dataPayload.workerId, currentPlayerId),
	{
		kind: 'text',
		value: ` reported a ${formatPayloadLabel(event.dataPayload.payload_type)}.`
	}
];

/**
 * Generate event description parts for rendering
 * @param event The event log to describe
 * @param currentPlayerId The current player's ID for resolving "You"
 */
export function describeEvent(
	event: EventLog,
	currentPlayerId: string | null | undefined
): DescriptionPart[] {
	const payloadType = event.dataPayload.payload_type;
	return (templates[payloadType] ?? defaultTemplate)(event, currentPlayerId);
}

export { formatPayloadLabel };
