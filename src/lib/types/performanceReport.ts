// Track Performance Report types

export interface PerformanceStats {
    streams: number;
    sales: number;
    revenue: number;
}

export interface TrackPerformanceReport {
    id: string;
    trackId: string;
    reportDate: string; // ISO date string
    fromDate: string; // ISO date string
    toDate: string; // ISO date string
    performanceStatsForThePeriod: PerformanceStats;
    decayFactor: number;
    trackAgeDays: number;
}

// Aggregated statistics for grouping
export interface AggregatedStats {
    totalStreams: number;
    totalSales: number;
    totalRevenue: number;
    reportCount: number;
    averageDecayFactor?: number;
}

// For displaying grouped data
export interface ReleasePerformance {
    releaseId: string;
    releaseTitle: string;
    stats: AggregatedStats;
    reports: TrackPerformanceReport[];
    trend?: number; // percentage change
}

export interface ArtistPerformance {
    artistId: string;
    artistName: string;
    stats: AggregatedStats;
    reports: TrackPerformanceReport[];
    trend?: number;
}

export interface TrackPerformance {
    trackId: string;
    trackTitle: string;
    artistNames: string[];
    releaseTitle?: string;
    stats: AggregatedStats;
    reports: TrackPerformanceReport[];
    trend?: number;
}

export type SortMetric = 'revenue' | 'streams' | 'sales';
export type ViewMode = 'releases' | 'artists' | 'tracks';
