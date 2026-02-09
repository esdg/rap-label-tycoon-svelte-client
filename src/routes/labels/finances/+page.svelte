<script lang="ts">
	import { currentLabel } from '$lib/stores/appState';
	import { createPerformanceReportsByLabelQuery } from '$lib/queries/performanceReportQueries';
	import { createQuery } from '@tanstack/svelte-query';
	import { fetchTracksByLabelId } from '$lib/api/releases';
	import { fetchReleasesByLabelId } from '$lib/api/releases';
	import bgImage from '$lib/assets/main-bg-finances.png';
	import { fetchArtistsByIds } from '$lib/api/artists';
	import {
		groupByRelease,
		groupByArtist,
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

	$: labelId = $currentLabel?.id || '';

	$: dateParams = getDateRange(dateRangeDays);

	// Fetch all required data
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

	// Get unique artist IDs from tracks
	$: artistIds = $tracksQuery.data
		? Array.from(new Set($tracksQuery.data.flatMap((t) => t.artistId)))
		: [];

	$: artistsQuery = createQuery({
		queryKey: ['artists', 'byIds', artistIds.sort().join(',')],
		queryFn: () => fetchArtistsByIds(artistIds),
		enabled: artistIds.length > 0
	});

	// Create artist map
	$: artistsMap = new Map(
		($artistsQuery.data || []).map((a) => [
			a.id,
			{ id: a.id, name: `${a.firstName} ${a.lastName}` }
		])
	);

	// Group and sort data
	$: releasePerformances =
		$reportsQuery.data && $tracksQuery.data && $releasesQuery.data
			? sortByMetric(
					groupByRelease($reportsQuery.data, $tracksQuery.data, $releasesQuery.data),
					selectedMetric
				)
			: [];

	$: artistPerformances =
		$reportsQuery.data && $tracksQuery.data && artistsMap.size > 0
			? sortByMetric(
					groupByArtist($reportsQuery.data, $tracksQuery.data, artistsMap),
					selectedMetric
				)
			: [];

	$: trackPerformances =
		$reportsQuery.data && $tracksQuery.data && $releasesQuery.data
			? sortByMetric(
					groupByTrack($reportsQuery.data, $tracksQuery.data, $releasesQuery.data, artistsMap),
					selectedMetric
				)
			: [];

	// Calculate totals
	$: totalRevenue = releasePerformances.reduce((sum, r) => sum + r.stats.totalRevenue, 0);
	$: totalStreams = releasePerformances.reduce((sum, r) => sum + r.stats.totalStreams, 0);
	$: totalSales = releasePerformances.reduce((sum, r) => sum + r.stats.totalSales, 0);

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

<div
	class="finances-page min-h-screen overflow-x-hidden p-4 text-white sm:p-8"
	style="background-image: url({bgImage}); background-size: cover; background-position: center;"
>
	<div class="page-header">
		<h1>Financial Dashboard</h1>
		<div class="header-controls">
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

	{#if !labelId}
		<div class="empty-state">
			<p>Please select a label to view financial reports.</p>
		</div>
	{:else if isLoading}
		<div class="loading-state">
			<p>Loading financial data...</p>
		</div>
	{:else if $reportsQuery.error}
		<div class="error-state">
			<p>Error loading financial data: {$reportsQuery.error.message}</p>
		</div>
	{:else}
		<!-- Summary Cards -->
		<div class="summary-cards">
			<div class="summary-card">
				<div class="card-label">Total Revenue</div>
				<div class="card-value">{formatCurrency(totalRevenue)}</div>
				<div class="card-footer">{dateRangeDays} days</div>
			</div>
			<div class="summary-card">
				<div class="card-label">Total Streams</div>
				<div class="card-value">{formatNumber(totalStreams)}</div>
				<div class="card-footer">{dateRangeDays} days</div>
			</div>
			<div class="summary-card">
				<div class="card-label">Total Sales</div>
				<div class="card-value">{formatNumber(totalSales)}</div>
				<div class="card-footer">{dateRangeDays} days</div>
			</div>
		</div>

		<!-- Performance by Release -->
		<section class="performance-section">
			<div class="section-header">
				<h2>Performance by Release</h2>
				<Button style="hollow" color="gray" on:clicked={() => goto('/labels/finances/releases')}>
					View Details
				</Button>
			</div>

			{#if releasePerformances.length === 0}
				<div class="empty-section">No release data available</div>
			{:else}
				<div class="performance-grid">
					{#each releasePerformances.slice(0, 6) as release}
						<div class="performance-card">
							<div class="card-header">
								<h3>{release.releaseTitle}</h3>
								{#if release.trend !== undefined}
									<span class="trend {getTrendClass(release.trend)}">
										{formatTrend(release.trend)}
									</span>
								{/if}
							</div>
							<div class="card-chart">
								<PerformanceChart
									reports={release.reports}
									metric={selectedMetric}
									height={80}
									showLabels={false}
								/>
							</div>
							<div class="card-stats">
								<div class="stat">
									<span class="stat-label">Revenue</span>
									<span class="stat-value">{formatCurrency(release.stats.totalRevenue)}</span>
								</div>
								<div class="stat">
									<span class="stat-label">Streams</span>
									<span class="stat-value">{formatNumber(release.stats.totalStreams)}</span>
								</div>
								<div class="stat">
									<span class="stat-label">Sales</span>
									<span class="stat-value">{formatNumber(release.stats.totalSales)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Performance by Artist -->
		<section class="performance-section">
			<div class="section-header">
				<h2>Performance by Artist</h2>
				<Button style="hollow" color="gray" on:clicked={() => goto('/labels/finances/artists')}>
					View Details
				</Button>
			</div>

			{#if artistPerformances.length === 0}
				<div class="empty-section">No artist data available</div>
			{:else}
				<div class="performance-grid">
					{#each artistPerformances.slice(0, 6) as artist}
						<div class="performance-card">
							<div class="card-header">
								<h3>{artist.artistName}</h3>
								{#if artist.trend !== undefined}
									<span class="trend {getTrendClass(artist.trend)}">
										{formatTrend(artist.trend)}
									</span>
								{/if}
							</div>
							<div class="card-chart">
								<PerformanceChart
									reports={artist.reports}
									metric={selectedMetric}
									height={80}
									showLabels={false}
								/>
							</div>
							<div class="card-stats">
								<div class="stat">
									<span class="stat-label">Revenue</span>
									<span class="stat-value">{formatCurrency(artist.stats.totalRevenue)}</span>
								</div>
								<div class="stat">
									<span class="stat-label">Streams</span>
									<span class="stat-value">{formatNumber(artist.stats.totalStreams)}</span>
								</div>
								<div class="stat">
									<span class="stat-label">Sales</span>
									<span class="stat-value">{formatNumber(artist.stats.totalSales)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Performance by Track -->
		<section class="performance-section">
			<div class="section-header">
				<h2>Top Performing Tracks</h2>
				<Button style="hollow" color="gray" on:clicked={() => goto('/labels/finances/tracks')}>
					View Details
				</Button>
			</div>

			{#if trackPerformances.length === 0}
				<div class="empty-section">No track data available</div>
			{:else}
				<div class="track-list">
					{#each trackPerformances.slice(0, 10) as track, index}
						<div class="track-item">
							<div class="track-rank">{index + 1}</div>
							<div class="track-info">
								<div class="track-title">{track.trackTitle}</div>
								<div class="track-artists">{track.artistNames.join(', ')}</div>
							</div>
							<div class="track-mini-chart">
								<PerformanceChart
									reports={track.reports}
									metric={selectedMetric}
									height={40}
									showLabels={false}
								/>
							</div>
							<div class="track-stats">
								<div class="track-revenue">{formatCurrency(track.stats.totalRevenue)}</div>
								{#if track.trend !== undefined}
									<div class="track-trend {getTrendClass(track.trend)}">
										{formatTrend(track.trend)}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: bold;
		color: #f9fafb;
	}

	.header-controls {
		display: flex;
		gap: 1rem;
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

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.summary-card {
		background: #1f2937;
		border: 1px solid #374151;
		border-radius: 0.75rem;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.summary-card:hover {
		border-color: #4b5563;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.card-label {
		font-size: 0.875rem;
		color: #9ca3af;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.card-value {
		font-size: 2rem;
		font-weight: bold;
		color: #f9fafb;
		margin-bottom: 0.25rem;
	}

	.card-footer {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.performance-section {
		margin-bottom: 3rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #f9fafb;
	}

	.performance-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.performance-card {
		background: #1f2937;
		border: 1px solid #374151;
		border-radius: 0.75rem;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.performance-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
		transform: translateY(-2px);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.card-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #f9fafb;
		flex: 1;
	}

	.trend {
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

	.card-chart {
		margin-bottom: 1rem;
		background: #111827;
		border-radius: 0.5rem;
		padding: 0.5rem;
	}

	.card-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #9ca3af;
		margin-bottom: 0.25rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: #f9fafb;
	}

	.track-list {
		background: #1f2937;
		border: 1px solid #374151;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.track-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #374151;
		transition: background 0.2s;
	}

	.track-item:last-child {
		border-bottom: none;
	}

	.track-item:hover {
		background: #111827;
	}

	.track-rank {
		font-size: 1.25rem;
		font-weight: bold;
		color: #9ca3af;
		min-width: 2rem;
		text-align: center;
	}

	.track-info {
		flex: 1;
		min-width: 0;
	}

	.track-title {
		font-weight: 600;
		color: #f9fafb;
		margin-bottom: 0.25rem;
	}

	.track-artists {
		font-size: 0.875rem;
		color: #9ca3af;
	}

	.track-mini-chart {
		width: 120px;
		height: 40px;
	}

	.track-stats {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
		min-width: 100px;
	}

	.track-revenue {
		font-weight: 600;
		color: #f9fafb;
	}

	.track-trend {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.empty-state,
	.loading-state,
	.error-state,
	.empty-section {
		text-align: center;
		padding: 3rem;
		color: #9ca3af;
	}

	.error-state {
		color: #ef4444;
	}
</style>
