// Performance report utility functions
import type {
    TrackPerformanceReport,
    AggregatedStats,
    ReleasePerformance,
    ArtistPerformance,
    TrackPerformance,
    SortMetric
} from '$lib/types/performanceReport';
import type { Release, Track } from '$lib/types/release';

// Aggregate performance stats from multiple reports
export function aggregateStats(reports: TrackPerformanceReport[]): AggregatedStats {
    if (reports.length === 0) {
        return {
            totalStreams: 0,
            totalSales: 0,
            totalRevenue: 0,
            reportCount: 0,
            averageDecayFactor: 0
        };
    }

    const totals = reports.reduce(
        (acc, report) => ({
            streams: acc.streams + report.performanceStatsForThePeriod.streams,
            sales: acc.sales + report.performanceStatsForThePeriod.sales,
            revenue: acc.revenue + report.performanceStatsForThePeriod.revenue,
            decayFactor: acc.decayFactor + report.decayFactor
        }),
        { streams: 0, sales: 0, revenue: 0, decayFactor: 0 }
    );

    return {
        totalStreams: totals.streams,
        totalSales: totals.sales,
        totalRevenue: totals.revenue,
        reportCount: reports.length,
        averageDecayFactor: totals.decayFactor / reports.length
    };
}

// Calculate trend percentage (comparing latest report vs previous)
export function calculateTrend(reports: TrackPerformanceReport[], metric: SortMetric = 'revenue'): number {
    if (reports.length < 2) return 0;

    // Sort by report date descending
    const sorted = [...reports].sort((a, b) =>
        new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
    );

    const latest = sorted[0].performanceStatsForThePeriod[metric];
    const previous = sorted[1].performanceStatsForThePeriod[metric];

    if (previous === 0) return latest > 0 ? 100 : 0;

    return ((latest - previous) / previous) * 100;
}

// Group reports by release
export function groupByRelease(
    reports: TrackPerformanceReport[],
    tracks: Track[],
    releases: Release[]
): ReleasePerformance[] {
    const trackMap = new Map(tracks.map(t => [t.id, t]));
    const releaseMap = new Map(releases.map(r => [r.id, r]));
    const releaseReportsMap = new Map<string, TrackPerformanceReport[]>();

    // Group reports by release
    reports.forEach(report => {
        const track = trackMap.get(report.trackId);
        if (!track) return;

        // Find release containing this track
        const release = releases.find(r => r.trackIds.includes(track.id));
        if (!release) return;

        if (!releaseReportsMap.has(release.id)) {
            releaseReportsMap.set(release.id, []);
        }
        releaseReportsMap.get(release.id)!.push(report);
    });

    // Create ReleasePerformance objects
    return Array.from(releaseReportsMap.entries()).map(([releaseId, releaseReports]) => {
        const release = releaseMap.get(releaseId)!;
        return {
            releaseId,
            releaseTitle: release.title,
            stats: aggregateStats(releaseReports),
            reports: releaseReports,
            trend: calculateTrend(releaseReports)
        };
    });
}

// Group reports by artist
export function groupByArtist(
    reports: TrackPerformanceReport[],
    tracks: Track[],
    artistsMap: Map<string, { id: string; name: string }>
): ArtistPerformance[] {
    const trackMap = new Map(tracks.map(t => [t.id, t]));
    const artistReportsMap = new Map<string, TrackPerformanceReport[]>();

    // Group reports by artist
    reports.forEach(report => {
        const track = trackMap.get(report.trackId);
        if (!track) return;

        // A track can have multiple artists
        track.artistId.forEach(artistId => {
            if (!artistReportsMap.has(artistId)) {
                artistReportsMap.set(artistId, []);
            }
            artistReportsMap.get(artistId)!.push(report);
        });
    });

    // Create ArtistPerformance objects
    return Array.from(artistReportsMap.entries()).map(([artistId, artistReports]) => {
        const artist = artistsMap.get(artistId);
        return {
            artistId,
            artistName: artist?.name || 'Unknown Artist',
            stats: aggregateStats(artistReports),
            reports: artistReports,
            trend: calculateTrend(artistReports)
        };
    });
}

// Group reports by track
export function groupByTrack(
    reports: TrackPerformanceReport[],
    tracks: Track[],
    releases: Release[],
    artistsMap: Map<string, { id: string; name: string }>
): TrackPerformance[] {
    const trackMap = new Map(tracks.map(t => [t.id, t]));
    const trackReportsMap = new Map<string, TrackPerformanceReport[]>();

    // Group reports by track
    reports.forEach(report => {
        if (!trackReportsMap.has(report.trackId)) {
            trackReportsMap.set(report.trackId, []);
        }
        trackReportsMap.get(report.trackId)!.push(report);
    });

    // Create TrackPerformance objects
    return Array.from(trackReportsMap.entries()).map(([trackId, trackReports]) => {
        const track = trackMap.get(trackId);
        if (!track) {
            return {
                trackId,
                trackTitle: 'Unknown Track',
                artistNames: [],
                stats: aggregateStats(trackReports),
                reports: trackReports,
                trend: calculateTrend(trackReports)
            };
        }

        const artistNames = track.artistId
            .map(id => artistsMap.get(id)?.name)
            .filter(Boolean) as string[];

        const release = releases.find(r => r.trackIds.includes(trackId));

        return {
            trackId,
            trackTitle: track.title,
            artistNames,
            releaseTitle: release?.title,
            stats: aggregateStats(trackReports),
            reports: trackReports,
            trend: calculateTrend(trackReports)
        };
    });
}

// Sort performance data by metric
export function sortByMetric<T extends { stats: AggregatedStats }>(
    items: T[],
    metric: SortMetric,
    ascending = false
): T[] {
    const sorted = [...items].sort((a, b) => {
        let aValue = 0;
        let bValue = 0;

        switch (metric) {
            case 'revenue':
                aValue = a.stats.totalRevenue;
                bValue = b.stats.totalRevenue;
                break;
            case 'streams':
                aValue = a.stats.totalStreams;
                bValue = b.stats.totalStreams;
                break;
            case 'sales':
                aValue = a.stats.totalSales;
                bValue = b.stats.totalSales;
                break;
        }

        return ascending ? aValue - bValue : bValue - aValue;
    });

    return sorted;
}

// Format currency
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format large numbers (streams, sales)
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
}

// Format trend percentage
export function formatTrend(trend: number): string {
    const sign = trend >= 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
}

// Get date range for last N days
export function getDateRange(days: number): { fromDate: string; toDate: string } {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
    };
}
