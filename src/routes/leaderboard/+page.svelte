<script lang="ts">
	import { createAllLabelsQuery } from '$lib/queries/labelQueries';
	import { createPlayersByIdsQuery } from '$lib/queries/playerQueries';
	import { currentLabel } from '$lib/stores/appState';
	import type { Label } from '$lib/types/label';
	import type { Player } from '$lib/types/player';

	// Fetch all labels
	$: labelsQuery = createAllLabelsQuery();

	// Reactive derived data
	$: labels = $labelsQuery.data || [];

	// Sort labels by rating (highest first), then by reputation, then by hype
	$: sortedLabels = [...labels].sort((a, b) => {
		if (b.rating !== a.rating) return b.rating - a.rating;
		if (b.reputation !== a.reputation) return b.reputation - a.reputation;
		return b.hype - a.hype;
	});

	// Extract unique owner player IDs
	$: ownerPlayerIds = [...new Set(labels.map((label) => label.ownerPlayerId))];

	// Fetch all owner players
	$: playersQuery = createPlayersByIdsQuery(ownerPlayerIds.length > 0 ? ownerPlayerIds : null);

	// Create a map of playerId -> Player for easy lookup
	$: playerMap = new Map<string, Player>(
		($playersQuery.data || []).map((player) => [player.id, player])
	);

	// Check if a label belongs to the current user
	function isCurrentUserLabel(label: Label): boolean {
		return !!$currentLabel && $currentLabel.id === label.id;
	}

	// Format bankroll as currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Get position/rank for current user's label
	$: currentLabelPosition = $currentLabel
		? sortedLabels.findIndex((l) => l.id === $currentLabel.id) + 1
		: null;
</script>

<svelte:head>
	<title>Label Leaderboard - Rap Label Tycoon</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="mb-2 text-4xl font-bold text-white">Label Leaderboard</h1>
		<p class="text-gray-400">See how your label stacks up against the competition</p>
		{#if currentLabelPosition && $currentLabel}
			<div
				class="mt-4 inline-flex items-center rounded-lg border border-purple-500/50 bg-purple-900/30 px-4 py-2"
			>
				<span class="font-semibold text-purple-300">Your Label:</span>
				<span class="ml-2 font-bold text-white">{$currentLabel.name}</span>
				<span class="ml-3 text-purple-200">
					Rank: <span class="font-bold text-purple-400">#{currentLabelPosition}</span>
				</span>
			</div>
		{/if}
	</div>

	<!-- Loading State -->
	{#if $labelsQuery.isLoading || $playersQuery.isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500"></div>
			<span class="ml-3 text-gray-400">Loading leaderboard...</span>
		</div>

		<!-- Error State -->
	{:else if $labelsQuery.error}
		<div class="rounded-lg border border-red-500/50 bg-red-900/20 p-6 text-center">
			<p class="text-red-400">Error loading leaderboard: {$labelsQuery.error.message}</p>
		</div>

		<!-- Empty State -->
	{:else if sortedLabels.length === 0}
		<div class="py-20 text-center">
			<p class="text-lg text-gray-400">No labels found yet. Be the first to create one!</p>
		</div>

		<!-- Leaderboard Table -->
	{:else}
		<div class="overflow-hidden rounded-lg border border-gray-700 bg-gray-800/50">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-700 bg-gray-900/50">
							<th
								class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
							>
								Rank
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
							>
								Label
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
							>
								Owner
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
							>
								Rating
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
							>
								Reputation
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
							>
								Hype
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
							>
								Bankroll
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
							>
								Founded
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-700">
						{#each sortedLabels as label, index (label.id)}
							{@const player = playerMap.get(label.ownerPlayerId)}
							{@const isCurrentUser = isCurrentUserLabel(label)}
							<tr
								class="transition-colors hover:bg-gray-700/30 {isCurrentUser
									? 'border-l-4 border-purple-500 bg-purple-900/20'
									: ''}"
							>
								<!-- Rank -->
								<td class="whitespace-nowrap px-6 py-4">
									<div class="flex items-center">
										{#if index === 0}
											<span class="text-2xl">🥇</span>
										{:else if index === 1}
											<span class="text-2xl">🥈</span>
										{:else if index === 2}
											<span class="text-2xl">🥉</span>
										{:else}
											<span class="text-lg font-bold text-gray-300">#{index + 1}</span>
										{/if}
									</div>
								</td>

								<!-- Label Name -->
								<td class="px-6 py-4">
									<div class="flex flex-col">
										<span class="font-semibold text-white {isCurrentUser ? 'text-purple-300' : ''}">
											{label.name}
										</span>
										{#if label.description}
											<span class="mt-1 max-w-xs truncate text-xs text-gray-400">
												{label.description}
											</span>
										{/if}
									</div>
								</td>

								<!-- Owner -->
								<td class="whitespace-nowrap px-6 py-4">
									{#if player}
										<span class="text-gray-300">{player.username}</span>
									{:else}
										<span class="italic text-gray-500">Loading...</span>
									{/if}
								</td>

								<!-- Rating -->
								<td class="whitespace-nowrap px-6 py-4">
									<span class="font-semibold text-yellow-400">{label.rating.toLocaleString()}</span>
								</td>

								<!-- Reputation -->
								<td class="whitespace-nowrap px-6 py-4">
									<span class="font-semibold text-green-400"
										>{label.reputation.toLocaleString()}</span
									>
								</td>

								<!-- Hype -->
								<td class="whitespace-nowrap px-6 py-4">
									<span class="font-semibold text-pink-400">{label.hype.toLocaleString()}</span>
								</td>

								<!-- Bankroll -->
								<td class="whitespace-nowrap px-6 py-4">
									<span class="font-mono text-sm text-emerald-400">
										{formatCurrency(label.bankroll)}
									</span>
								</td>

								<!-- Founded Date -->
								<td class="whitespace-nowrap px-6 py-4">
									<span class="text-sm text-gray-400">{formatDate(label.foundedDate)}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Stats Summary -->
		<div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
			<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
				<div class="mb-1 text-sm text-gray-400">Total Labels</div>
				<div class="text-2xl font-bold text-white">{sortedLabels.length}</div>
			</div>
			<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
				<div class="mb-1 text-sm text-gray-400">Top Rating</div>
				<div class="text-2xl font-bold text-yellow-400">
					{sortedLabels[0]?.rating.toLocaleString() || 0}
				</div>
			</div>
			<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
				<div class="mb-1 text-sm text-gray-400">Your Rank</div>
				<div class="text-2xl font-bold text-purple-400">
					{currentLabelPosition ? `#${currentLabelPosition}` : 'N/A'}
				</div>
			</div>
			<div class="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
				<div class="mb-1 text-sm text-gray-400">Total Players</div>
				<div class="text-2xl font-bold text-white">{ownerPlayerIds.length}</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Custom scrollbar for table */
	.overflow-x-auto::-webkit-scrollbar {
		height: 8px;
	}

	.overflow-x-auto::-webkit-scrollbar-track {
		background: rgba(31, 41, 55, 0.5);
		border-radius: 4px;
	}

	.overflow-x-auto::-webkit-scrollbar-thumb {
		background: rgba(107, 114, 128, 0.5);
		border-radius: 4px;
	}

	.overflow-x-auto::-webkit-scrollbar-thumb:hover {
		background: rgba(107, 114, 128, 0.7);
	}
</style>
