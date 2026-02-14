<script lang="ts">
	import {
		BellAlertIcon,
		ArrowPathIcon,
		ExclamationTriangleIcon,
		ClockIcon
	} from 'heroicons-svelte/24/solid';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { currentLabel } from '$lib/stores/appState';
	import { createEventLogsQuery } from '$lib/queries/eventLogQueries';
	import type { EventLog } from '$lib/types/eventLog';
	import { clickOutside } from '$lib/utils/clickOutside';
	import { formatRelativeTime } from '$lib/utils/timeUtils';
	import { get } from 'svelte/store';
	import Chip from '../Chip.svelte';

	let isOpen = false;
	let includeRead = false;
	let limit = 20;

	$: labelId = $currentLabel?.id ?? null;
	$: labelName = $currentLabel?.name ?? 'your label';
	$: eventLogsQuery = createEventLogsQuery(labelId, {
		limit,
		includeRead,
		refetchInterval: 15000
	});
	$: unreadCount = $eventLogsQuery?.data?.filter((event) => !event.isRead).length ?? 0;

	function togglePanel() {
		isOpen = !isOpen;
	}

	function closePanel() {
		isOpen = false;
	}

	function refresh() {
		const query = get(eventLogsQuery);
		query?.refetch?.();
	}

	function handleLimitChange(event: Event) {
		const value = Number((event.target as HTMLSelectElement).value);
		limit = Number.isFinite(value) ? value : limit;
	}

	const payloadLabels: Record<string, string> = {
		producing_beats: 'Beat Production',
		signing_contract: 'Contract',
		scouting: 'Scouting'
	};

	function getEventTitle(event: EventLog): string {
		const { payload_type: payloadType, success } = event.dataPayload;
		switch (payloadType) {
			case 'producing_beats':
				return success === false ? 'Beat production failed' : 'Beat batch finished';
			case 'signing_contract':
				return success === false ? 'Contract signing failed' : 'Contract signed';
			case 'scouting':
				return success === false ? 'Scouting run failed' : 'Scouting complete';
			default:
				return success === false ? 'Event failed' : 'New update';
		}
	}

	function pluralize(value: number, word: string) {
		return `${value} ${word}${value === 1 ? '' : 's'}`;
	}

	function shortId(value?: string) {
		return value ? `#${value.slice(-4)}` : 'unknown';
	}

	function getEventDescription(event: EventLog): string {
		const data = event.dataPayload;
		const workerLabel = data.workerId ? `Worker ${shortId(data.workerId)}` : 'Team';

		switch (data.payload_type) {
			case 'producing_beats': {
				const beats = data.producedBeatsCount ?? 0;
				const styles = data.productionStyles?.length
					? pluralize(data.productionStyles.length, 'style')
					: null;
				const delivered = `${pluralize(beats, 'beat')}`;
				return `${workerLabel} ${data.success === false ? 'could not finish' : 'delivered'} ${delivered}${
					styles ? ` in ${styles}` : ''
				}.`;
			}
			case 'signing_contract': {
				const artist = data.artistId ? `artist ${shortId(data.artistId)}` : 'artist';
				const contract = data.contractId ? `contract ${shortId(data.contractId)}` : 'contract';
				return `${workerLabel} ${data.success === false ? 'could not sign' : 'signed'} ${contract} with ${artist}.`;
			}
			case 'scouting': {
				const discovered = data.numberOfNpcDiscovered ?? 0;
				if (data.success === false) return `${workerLabel} returned without results.`;
				return `${workerLabel} discovered ${pluralize(discovered, 'new talent')}.`;
			}
			default: {
				const label = payloadLabels[data.payload_type] || data.payload_type || 'event';
				return `${workerLabel} reported a ${label}.`;
			}
		}
	}

	function getTone(event: EventLog) {
		if (event.dataPayload.success === false) {
			return {
				dot: 'bg-red-500',
				badge: 'border-red-700/50 bg-red-900/40 text-red-200',
				status: 'Failed'
			};
		}

		if (!event.isRead) {
			return {
				dot: 'bg-secondary-400',
				badge: 'border-secondary-700/60 bg-secondary-900/40 text-secondary-200',
				status: 'New'
			};
		}

		return {
			dot: 'bg-gray-500',
			badge: 'border-gray-700/60 bg-gray-900/50 text-gray-200',
			status: 'Seen'
		};
	}

	$: panelLabel = unreadCount > 0 ? `${unreadCount} new` : 'Up to date';

	function formatPayloadLabel(type?: string) {
		return payloadLabels[type ?? ''] || type || 'Event';
	}
</script>

<div class="relative flex flex-col items-center">
	<Tooltip position="right">
		<button
			slot="trigger"
			type="button"
			on:click={togglePanel}
			class="relative rounded-full p-2 text-white transition hover:text-secondary-500 focus:outline-none"
			aria-expanded={isOpen}
			aria-label="Toggle notifications"
		>
			<BellAlertIcon class="h-6 w-6" />
			{#if unreadCount > 0}
				<span
					class="absolute -right-0 -top-0 mr-1 mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-secondary-500 text-[10px] font-semibold text-black shadow-lg"
				>
					{unreadCount}
				</span>
			{/if}
		</button>
		Notifications
	</Tooltip>

	{#if isOpen}
		<div
			class="absolute right-11 top-0 z-50 w-[26rem] max-w-[80vw] overflow-hidden rounded-md border border-secondary-800/70 bg-primary-950/95 shadow-2xl backdrop-blur"
			use:clickOutside
			on:click_outside={closePanel}
		>
			<!-- 			<header
				class="flex items-start justify-between gap-3 border-b border-secondary-800/60 px-4 py-3"
			>
				<div class="flex items-center gap-2 text-xs text-gray-200">
					<button
						type="button"
						on:click={refresh}
						title="Refresh"
						class="rounded-full border border-secondary-800/70 bg-primary-950 p-2 text-gray-100 transition hover:border-secondary-500 hover:text-secondary-300"
					>
						<ArrowPathIcon class="h-4 w-4" />
					</button>
				</div>
			</header> -->

			<section class="max-h-[70vh] overflow-y-auto">
				{#if $eventLogsQuery.isLoading}
					<div class="flex items-center gap-3 px-4 py-6 text-gray-300">
						<ArrowPathIcon class="h-5 w-5 animate-spin text-secondary-400" />
						<span>Loading the latest updates...</span>
					</div>
				{:else if $eventLogsQuery.isError}
					<div class="flex items-start gap-3 px-4 py-5 text-red-200">
						<ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
						<div>
							<p class="text-sm font-semibold">Could not fetch notifications</p>
							<p class="text-xs text-red-200/80">{$eventLogsQuery.error?.message}</p>
						</div>
					</div>
				{:else if !$eventLogsQuery.data || $eventLogsQuery.data.length === 0}
					<div class="flex items-center gap-3 px-4 py-6 text-gray-300">
						<ClockIcon class="h-5 w-5 text-secondary-400" />
						<span>No {includeRead ? '' : 'unread '}notifications yet.</span>
					</div>
				{:else}
					{#each $eventLogsQuery.data as event (event.id)}
						{@const tone = getTone(event)}
						<article class="flex gap-3 border-b border-secondary-900/40 px-4 py-3 last:border-b-0">
							<div class={`mt-1 h-3 w-3 rounded-full ${tone.dot}`}></div>
							<div class="flex flex-1 flex-col gap-1">
								<div class="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
									<!-- <span>{getEventTitle(event)}</span> -->
									<!-- <span
										class={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${tone.badge}`}
									>
										{tone.status}
									</span> -->
									<Chip class="{tone.badge}text-xs">
										{formatPayloadLabel(event.dataPayload.payload_type)}
									</Chip>
								</div>
								<p class="text-xs text-gray-300">{getEventDescription(event)}</p>
								<div class="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
									<ClockIcon class="h-4 w-4 text-secondary-400" />
									<span>{formatRelativeTime(event.createdAt)}</span>
									<!-- 									{#if event.priority}
										<span
											class="rounded-full border border-secondary-800 px-2 py-0.5 text-secondary-300"
											>Priority {event.priority}</span
										>
									{/if} -->
									{#if event.readAt}
										<span
											class="rounded-full border border-secondary-800 px-2 py-0.5 text-gray-300"
										>
											Read {formatRelativeTime(event.readAt)}
										</span>
									{/if}
								</div>
							</div>
						</article>
					{/each}
				{/if}
			</section>
		</div>
	{/if}
</div>
