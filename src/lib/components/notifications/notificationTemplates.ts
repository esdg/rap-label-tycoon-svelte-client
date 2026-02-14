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
				href: `/artists/${encodeURIComponent(data.artistId)}`
			};
		} else {
			artistLabel = { kind: 'text', value: 'an artist' };
		}

		const parts: DescriptionPart[] = [
			artistLabel,
			{ kind: 'text', value: ` ${success ? ' accepted ' : ' refused '}` },
			{ kind: 'text', value: 'your label offer ' },
			{ kind: 'text', value: `(${formatContractLabel(data.contractId)}). ` },
			{ kind: 'text', value: ' You can ' },
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
