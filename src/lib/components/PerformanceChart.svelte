<script lang="ts">
	import type { TrackPerformanceReport } from '$lib/types/performanceReport';
	import { formatCurrency, formatNumber } from '$lib/utils/performanceUtils';

	export let reports: TrackPerformanceReport[] = [];
	export let metric: 'revenue' | 'streams' | 'sales' = 'revenue';
	export let height = 200;
	export let showLabels = true;

	$: sortedReports = [...reports].sort(
		(a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
	);

	$: dataPoints = sortedReports.map((r) => r.performanceStatsForThePeriod[metric]);

	$: maxValue = Math.max(...dataPoints, 1);

	// Calculate points for SVG path
	$: chartPoints = dataPoints.map((value, index) => {
		const x = (index / Math.max(dataPoints.length - 1, 1)) * 100;
		const y = 100 - (value / maxValue) * 100;
		return { x, y, value, date: sortedReports[index]?.reportDate };
	});

	$: pathData = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

	$: areaData = `${pathData} L 100 100 L 0 100 Z`;

	function formatValue(value: number): string {
		return metric === 'revenue' ? formatCurrency(value) : formatNumber(value);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<div class="chart-container" style="height: {height}px;">
	{#if dataPoints.length === 0}
		<div class="no-data">No data available</div>
	{:else}
		<svg viewBox="0 0 100 100" preserveAspectRatio="none" class="chart-svg">
			<!-- Area fill -->
			<path d={areaData} class="chart-area" />

			<!-- Line -->
			<path d={pathData} class="chart-line" />

			<!-- Data points -->
			{#each chartPoints as point}
				<circle cx={point.x} cy={point.y} r="1" class="chart-point" />
			{/each}
		</svg>

		{#if showLabels && chartPoints.length > 0}
			<div class="chart-labels">
				<div class="label-start">
					<div class="label-date">{formatDate(chartPoints[0].date)}</div>
					<div class="label-value">{formatValue(chartPoints[0].value)}</div>
				</div>
				<div class="label-end">
					<div class="label-date">
						{formatDate(chartPoints[chartPoints.length - 1].date)}
					</div>
					<div class="label-value">
						{formatValue(chartPoints[chartPoints.length - 1].value)}
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
	}

	.chart-svg {
		width: 100%;
		height: 100%;
	}

	.chart-area {
		fill: rgba(59, 130, 246, 0.15);
		stroke: none;
	}

	.chart-line {
		fill: none;
		stroke: rgb(96, 165, 250);
		stroke-width: 0.5;
		vector-effect: non-scaling-stroke;
	}

	.chart-point {
		fill: rgb(96, 165, 250);
	}

	.chart-labels {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: 8px;
		pointer-events: none;
	}

	.label-start,
	.label-end {
		font-size: 0.75rem;
	}

	.label-end {
		text-align: right;
	}

	.label-date {
		color: #9ca3af;
		margin-bottom: 2px;
	}

	.label-value {
		color: #f9fafb;
		font-weight: 600;
	}

	.no-data {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #9ca3af;
		font-size: 0.875rem;
	}
</style>
