<script lang="ts">
	import { currentLabel } from '$lib/stores/appState';
	import { createPerformanceReportsByLabelQuery } from '$lib/queries/performanceReportQueries';
	import { createQuery } from '@tanstack/svelte-query';
	import { fetchTracksByLabelId, fetchReleasesByLabelId } from '$lib/api/releases';
	import {
		groupByRelease,
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

	$: releasePerformances =
		$reportsQuery.data && $tracksQuery.data && $releasesQuery.data
			? sortByMetric(
					groupByRelease($reportsQuery.data, $tracksQuery.data, $releasesQuery.data),
					selectedMetric
				)
			: [];

	$: isLoading = $reportsQuery.isLoading || $tracksQuery.isLoading || $releasesQuery.isLoading;

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
			<h1>Performance by Release</h1>
		</div>
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

	{#if isLoading}
		<div class="loading-state">Loading...</div>
	{:else if releasePerformances.length === 0}
		<div class="empty-state">No release performance data available</div>
	{:else}
		<div class="releases-grid">
			{#each releasePerformances as release, index}
				<div class="release-card">
					<div class="card-header">
						<div class="release-rank">#{index + 1}</div>
						<div class="release-info">
							<h3>{release.releaseTitle}</h3>
							<p>{release.reports.length} track{release.reports.length !== 1 ? 's' : ''}</p>
						</div>
						{#if release.trend !== undefined}
							<span class="trend {getTrendClass(release.trend)}">
								{formatTrend(release.trend)}
							</span>
						{/if}
					</div>

					<div class="card-chart">
						<PerformanceChart reports={release.reports} metric={selectedMetric} height={150} />
					</div>

					<div class="card-stats">
						<div class="stat-row">
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
						{#if release.stats.averageDecayFactor !== undefined}
							<div class="decay-info">
								Avg. Decay Factor: {release.stats.averageDecayFactor.toFixed(3)}
							</div>
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
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		gap: 1rem;
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

	.releases-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 1.5rem;
	}

	.release-card {
		background: #1f2937;
		border: 1px solid #374151;
		border-radius: 0.75rem;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.release-card:hover {
		border-color: #3b82f6;
		box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.release-rank {
		font-size: 1.5rem;
		font-weight: bold;
		color: #9ca3af;
		min-width: 3rem;
	}

	.release-info {
		flex: 1;
	}

	.release-info h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #f9fafb;
		margin-bottom: 0.25rem;
	}

	.release-info p {
		font-size: 0.875rem;
		color: #9ca3af;
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
		margin-bottom: 1.5rem;
		background: #111827;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.card-stats {
		border-top: 1px solid #374151;
		padding-top: 1rem;
	}

	.stat-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 0.75rem;
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
		font-size: 1.125rem;
		font-weight: 600;
		color: #f9fafb;
	}

	.decay-info {
		font-size: 0.875rem;
		color: #9ca3af;
		text-align: center;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 4rem;
		color: #9ca3af;
	}
</style>
