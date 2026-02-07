<script lang="ts">
	import { currentLabel } from '$lib/stores/appState';
	import { createPerformanceReportsByLabelQuery } from '$lib/queries/performanceReportQueries';
	import { createQuery } from '@tanstack/svelte-query';
	import { fetchTracksByLabelId, fetchReleasesByLabelId } from '$lib/api/releases';
	import { fetchArtistsByIds } from '$lib/api/artists';
	import {
		groupByTrack,
		sortByMetric,
		formatCurrency,
		formatNumber,
		formatTrend,
		getDateRange
	} from '$lib/utils/performanceUtils';
	import type { SortMetric } from '$lib/types/performanceReport';
	import PerformanceChart from '$lib/components/PerformanceChart.svelte';
	import Button from '$lib/components/Button.svelte';
	import { goto } from '$app/navigation';

	let selectedMetric: SortMetric = 'revenue';
	let dateRangeDays = 30;
	let searchQuery = '';

	$: labelId = $currentLabel?.id || '';
	$: dateParams = getDateRange(dateRangeDays);

	$: reportsQuery = createPerformanceReportsByLabelQuery(labelId, dateParams);
	$: tracksQuery = createQuery({
		queryKey: ['tracks', 'label', labelId],
		queryFn: () => fetchTracksByLabelId(labelId),
		enabled: !!labelId
	});
	$: releasesQuery = createQuery({
		queryKey: ['releases', 'label', labelId],
		queryFn: () => fetchReleasesByLabelId(labelId),
		enabled: !!labelId
	});

	$: artistIds = $tracksQuery.data
		? Array.from(new Set($tracksQuery.data.flatMap((t) => t.artistId)))
		: [];

	$: artistsQuery = createQuery({
		queryKey: ['artists', 'byIds', artistIds.sort().join(',')],
		queryFn: () => fetchArtistsByIds(artistIds),
		enabled: artistIds.length > 0
	});

	$: artistsMap = new Map(
		($artistsQuery.data || []).map((a) => [
			a.id,
			{ id: a.id, name: `${a.firstName} ${a.lastName}` }
		])
	);

	$: trackPerformances =
		$reportsQuery.data && $tracksQuery.data && $releasesQuery.data
			? sortByMetric(
					groupByTrack($reportsQuery.data, $tracksQuery.data, $releasesQuery.data, artistsMap),
					selectedMetric
				)
			: [];

	$: filteredTracks = trackPerformances.filter((track) => {
		if (!searchQuery) return true;
		const query = searchQuery.toLowerCase();
		return (
			track.trackTitle.toLowerCase().includes(query) ||
			track.artistNames.some((name) => name.toLowerCase().includes(query)) ||
			track.releaseTitle?.toLowerCase().includes(query)
		);
	});

	$: isLoading =
		$reportsQuery.isLoading ||
		$tracksQuery.isLoading ||
		$releasesQuery.isLoading ||
		$artistsQuery.isLoading;

	function getTrendClass(trend?: number): string {
		if (!trend) return '';
		return trend >= 0 ? 'trend-positive' : 'trend-negative';
	}
</script>

<div class="detail-page">
	<div class="page-header">
		<div class="header-left">
			<Button style="hollow" color="gray" on:clicked={() => goto('/labels/finances')}>
				← Back to Dashboard
			</Button>
			<h1>Performance by Track</h1>
		</div>
		<div class="header-controls">
			<input
				type="text"
				placeholder="Search tracks..."
				bind:value={searchQuery}
				class="search-input"
			/>
			<select bind:value={dateRangeDays} class="date-range-select">
				<option value={7}>Last 7 days</option>
				<option value={30}>Last 30 days</option>
				<option value={90}>Last 90 days</option>
				<option value={180}>Last 6 months</option>
				<option value={365}>Last year</option>
			</select>
			<select bind:value={selectedMetric} class="metric-select">
				<option value="revenue">Sort by Revenue</option>
				<option value="streams">Sort by Streams</option>
				<option value="sales">Sort by Sales</option>
			</select>
		</div>
	</div>

	{#if isLoading}
		<div class="loading-state">Loading...</div>
	{:else if filteredTracks.length === 0}
		<div class="empty-state">
			{searchQuery ? 'No tracks match your search' : 'No track performance data available'}
		</div>
	{:else}
		<div class="tracks-table">
			<div class="table-header">
				<div class="col-rank">#</div>
				<div class="col-track">Track</div>
				<div class="col-chart">Performance</div>
				<div class="col-revenue">Revenue</div>
				<div class="col-streams">Streams</div>
				<div class="col-sales">Sales</div>
				<div class="col-trend">Trend</div>
			</div>
			{#each filteredTracks as track, index}
				<div class="table-row">
					<div class="col-rank">{index + 1}</div>
					<div class="col-track">
						<div class="track-title">{track.trackTitle}</div>
						<div class="track-meta">
							{track.artistNames.join(', ')}
							{#if track.releaseTitle}
								<span class="separator">•</span>
								{track.releaseTitle}
							{/if}
						</div>
					</div>
					<div class="col-chart">
						<PerformanceChart
							reports={track.reports}
							metric={selectedMetric}
							height={50}
							showLabels={false}
						/>
					</div>
					<div class="col-revenue">{formatCurrency(track.stats.totalRevenue)}</div>
					<div class="col-streams">{formatNumber(track.stats.totalStreams)}</div>
					<div class="col-sales">{formatNumber(track.stats.totalSales)}</div>
					<div class="col-trend">
						{#if track.trend !== undefined}
							<span class="trend {getTrendClass(track.trend)}">
								{formatTrend(track.trend)}
							</span>
						{:else}
							<span class="trend-na">N/A</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.detail-page {
		padding: 2rem;
		max-width: 1600px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-left h1 {
		font-size: 2rem;
		font-weight: bold;
		color: #f9fafb;
	}

	.header-controls {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.search-input {
		padding: 0.5rem 1rem;
		border: 1px solid #374151;
		border-radius: 0.5rem;
		background: #1f2937;
		color: #f9fafb;
		font-size: 0.875rem;
		min-width: 200px;
		transition: border-color 0.2s;
	}

	.search-input::placeholder {
		color: #6b7280;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.date-range-select,
	.metric-select {
		padding: 0.5rem 1rem;
		border: 1px solid #374151;
		border-radius: 0.5rem;
		background: #1f2937;
		color: #f9fafb;
		font-size: 0.875rem;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.date-range-select:hover,
	.metric-select:hover {
		border-color: #4b5563;
	}

	.date-range-select:focus,
	.metric-select:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.tracks-table {
		background: #1f2937;
		border: 1px solid #374151;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.table-header {
		display: grid;
		grid-template-columns: 60px 2fr 200px 120px 120px 100px 100px;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: #111827;
		border-bottom: 1px solid #374151;
		font-size: 0.75rem;
		font-weight: 600;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.table-row {
		display: grid;
		grid-template-columns: 60px 2fr 200px 120px 120px 100px 100px;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #374151;
		align-items: center;
		transition: background 0.2s;
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.table-row:hover {
		background: #111827;
	}

	.col-rank {
		font-size: 1rem;
		font-weight: 600;
		color: #9ca3af;
		text-align: center;
	}

	.col-track {
		min-width: 0;
	}

	.track-title {
		font-weight: 600;
		color: #f9fafb;
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.track-meta {
		font-size: 0.875rem;
		color: #9ca3af;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.separator {
		margin: 0 0.5rem;
	}

	.col-chart {
		height: 50px;
	}

	.col-revenue,
	.col-streams,
	.col-sales {
		font-weight: 600;
		color: #f9fafb;
	}

	.col-trend {
		text-align: center;
	}

	.trend {
		display: inline-block;
		font-size: 0.875rem;
		font-weight: 600;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
	}

	.trend-positive {
		color: #10b981;
		background: rgba(16, 185, 129, 0.15);
	}

	.trend-negative {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.15);
	}

	.trend-na {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 4rem;
		color: #9ca3af;
	}

	@media (max-width: 1400px) {
		.table-header,
		.table-row {
			grid-template-columns: 50px 2fr 150px 100px 100px 80px 80px;
			gap: 0.75rem;
			padding: 1rem;
			font-size: 0.875rem;
		}

		.col-chart {
			height: 40px;
		}
	}
</style>
