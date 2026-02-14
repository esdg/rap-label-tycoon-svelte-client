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
	import Chip from '../Chip.svelte';
	import { describeEvent, formatPayloadLabel, type DescriptionPart } from './notificationTemplates';
	import { writable, get as getStore } from 'svelte/store';
	import { currentPlayer } from '$lib/stores/appState';
	import { fetchArtistById } from '$lib/api/artists';
	import { queryClient, queryKeys } from '$lib/queries/queryClient';
	import { getDiscoveredArtist } from '$lib/queries/artistQueries';

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

	const workerPartsMap = writable<Record<string, DescriptionPart[]>>({});

	function shortId(value?: string) {
		return value ? `#${value.slice(-4)}` : 'unknown';
	}

	function setWorkerParts(id: string | null | undefined, parts: DescriptionPart[]) {
		if (!id) return;
		workerPartsMap.update((map) => ({ ...map, [id]: parts }));
	}

	function resolveFromCaches(workerId: string): DescriptionPart[] | null {
		const cached = queryClient.getQueryData<any>(queryKeys.artists.byId(workerId));
		if (cached?.stageName) {
			return [
				{ kind: 'link', label: cached.stageName, href: `/artists/${encodeURIComponent(workerId)}` }
			];
		}

		const discovered = getDiscoveredArtist(workerId)?.artist;
		if (discovered?.stageName) {
			return [
				{
					kind: 'link',
					label: discovered.stageName,
					href: `/artists/${encodeURIComponent(workerId)}`
				}
			];
		}

		// Check list caches under artists
		const queries = queryClient.getQueriesData<any>({ queryKey: ['artists'] });
		for (const [, data] of queries) {
			if (Array.isArray(data)) {
				const found = data.find((a: any) => a?.id === workerId);
				if (found?.stageName) {
					return [
						{
							kind: 'link',
							label: found.stageName,
							href: `/artists/${encodeURIComponent(workerId)}`
						}
					];
				}
			}
		}

		return null;
	}

	async function ensureWorkerParts(workerId: string | null | undefined) {
		if (!workerId) return;

		const map = getStore(workerPartsMap);
		if (map[workerId]) return;

		const playerId = getStore(currentPlayer)?.id;
		if (playerId && workerId === playerId) {
			setWorkerParts(workerId, [{ kind: 'text', value: 'You' }]);
			return;
		}

		const cached = resolveFromCaches(workerId);
		if (cached) {
			setWorkerParts(workerId, cached);
			return;
		}

		try {
			const artist = await fetchArtistById(workerId);
			queryClient.setQueryData(queryKeys.artists.byId(workerId), artist);
			setWorkerParts(workerId, [
				{
					kind: 'link',
					label: artist.stageName ?? `Artist ${shortId(workerId)}`,
					href: `/artists/${encodeURIComponent(workerId)}`
				}
			]);
		} catch (err) {
			setWorkerParts(workerId, [{ kind: 'text', value: `Worker ${shortId(workerId)}` }]);
		}
	}

	$: if ($eventLogsQuery.data) {
		const ids = Array.from(
			new Set(
				$eventLogsQuery.data.map((e) => e.dataPayload.workerId).filter((id): id is string => !!id)
			)
		);
		ids.forEach((id) => {
			ensureWorkerParts(id);
		});
	}

	function togglePanel() {
		isOpen = !isOpen;
	}

	function closePanel() {
		isOpen = false;
	}

	function handleLimitChange(event: Event) {
		const value = Number((event.target as HTMLSelectElement).value);
		limit = Number.isFinite(value) ? value : limit;
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
			class="absolute right-11 top-0 z-50 w-[26rem] max-w-[80vw] select-none overflow-hidden rounded-md border border-gray-600/70 bg-primary-950/95 shadow-2xl backdrop-blur"
			use:clickOutside
			on:click_outside={closePanel}
		>
			<!-- 			<header
				class="flex items-start justify-between gap-3 border-b border-gray-800/60 px-4 py-3"
			>
				<div class="flex items-center gap-2 text-xs text-gray-200">
					<button
						type="button"
						on:click={refresh}
						title="Refresh"
						class="rounded-full border border-gray-800/70 bg-primary-950 p-2 text-gray-100 transition hover:border-gray-500 hover:text-gray-300"
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
						{@const workerParts = $workerPartsMap[event.dataPayload.workerId ?? '']}
						<article class="flex gap-3 border-b border-gray-700/40 px-4 py-3 last:border-b-0">
							<!-- <div class={`mt-1 h-3 w-3 rounded-full ${tone.dot}`}></div> -->
							<div class="flex flex-1 flex-col gap-1">
								<div class="flex flex-wrap items-center gap-2 text-sm font-thin text-white">
									<Chip class={`${tone.badge} rounded-none text-xs`}>
										{formatPayloadLabel(event.dataPayload.payload_type)}
									</Chip>
									<div class="flex flex-wrap items-center gap-1 text-[11px] text-gray-400">
										<ClockIcon class="h-3 w-3 text-gray-600" />
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
								<p class="text-xs text-gray-300">
									{#each describeEvent(event, workerParts) as part, index (index)}
										{#if part.kind === 'link'}
											<a href={part.href} class="text-secondary-400 hover:underline">{part.label}</a
											>
										{:else}
											<span>{part.value}</span>
										{/if}
									{/each}
								</p>
							</div>
						</article>
					{/each}
				{/if}
			</section>
		</div>
	{/if}
</div>
