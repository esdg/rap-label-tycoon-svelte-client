/**
 * Time and duration utility functions
 */


/**
 * Formats a .NET TimeSpan string (e.g., "9.07:59:59.9999999") into a human-readable duration.
 *
 * @param duration - The duration string in format: [days.]hours:minutes:seconds[.fractional]
 * @returns A formatted string like "9d 7h 59m" or "2h 30m" or "45m"
 */
export function formatDuration(duration: string): string {
    if (!duration) return '';

    // Parse the TimeSpan format: [days.]hours:minutes:seconds[.fractional]
    const parts = duration.split('.');
    let timePart: string;
    let days = 0;

    // Check if there are days (format: days.hours:minutes:seconds)
    if (parts.length >= 2 && parts[0].indexOf(':') === -1) {
        days = parseInt(parts[0], 10);
        timePart = parts[1];
    } else {
        timePart = parts[0];
    }

    // Parse hours:minutes:seconds
    const timeComponents = timePart.split(':');
    const hours = parseInt(timeComponents[0], 10) || 0;
    const minutes = parseInt(timeComponents[1], 10) || 0;
    const seconds = parseInt(timeComponents[2], 10) || 0;

    // Build the formatted string
    const segments: string[] = [];

    if (days > 0) {
        segments.push(`${days}d`);
    }
    if (hours > 0) {
        segments.push(`${hours}h`);
    }
    if (minutes > 0) {
        segments.push(`${minutes}m`);
    }
    // Only show seconds if there are no larger units or if seconds is the only non-zero value
    if (segments.length === 0 && seconds > 0) {
        segments.push(`${seconds}s`);
    }

    return segments.length > 0 ? segments.join(' ') : '0m';
}

export function yearsToTimeSpan(years: number): string {
    const days = Math.max(0, years) * 365;
    return `${days}.00:00:00`;
}

/**
 * Gets the current time adjusted for server time offset
 * Useful for countdown timers and time-sensitive operations
 *
 * @param offset - The offset in milliseconds between client and server time
 * @returns The current timestamp adjusted for server time
 */
export function getServerAdjustedTime(offset: number): number {
    return Date.now() + offset;
}

export function getCurrentServerTime(offset: number = 0): number {
    return getServerAdjustedTime(offset);
}

/**
 * Creates an ISO date string for the current time
 * Convenience function for consistent timestamp creation
 *
 * @returns ISO 8601 formatted date string
 */
export function nowISO(): string {
    return new Date().toISOString();
}

/**
 * Formats milliseconds into a countdown string (e.g., "2h 30m 15s")
 *
 * @param ms - Duration in milliseconds
 * @param includeSeconds - Whether to include seconds in the output
 * @returns Formatted countdown string
 */
export function formatCountdown(ms: number, includeSeconds: boolean = true): string {
    if (ms <= 0) return '0s';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const segments: string[] = [];

    if (days > 0) {
        segments.push(`${days}d`);
    }
    if (hours % 24 > 0) {
        segments.push(`${hours % 24}h`);
    }
    if (minutes % 60 > 0) {
        segments.push(`${minutes % 60}m`);
    }
    if (includeSeconds && seconds % 60 > 0) {
        segments.push(`${seconds % 60}s`);
    }

    return segments.length > 0 ? segments.join(' ') : '0s';
}

/**
 * Calculates the remaining time until a target date
 *
 * @param targetDate - The target date (Date object or ISO string)
 * @param serverOffset - Optional server time offset in milliseconds
 * @returns Remaining time in milliseconds (0 if already passed)
 */
export function getTimeRemaining(
    targetDate: Date | string,
    serverOffset: number = 0
): number {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const now = getServerAdjustedTime(serverOffset);
    return Math.max(0, target.getTime() - now);
}

/**
 * Calculates progress from a start/end window as a percent (0-100).
 * Useful for feeding progress bars with time-based tasks.
 */
export function getProgressPercent(
    startDate: Date | string,
    endDate: Date | string,
    serverOffset: number = 0
): number {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    const total = end.getTime() - start.getTime();
    if (total <= 0) return 100;

    const remaining = getTimeRemaining(end, serverOffset);
    const elapsed = total - remaining;
    const percent = (elapsed / total) * 100;

    return Math.max(0, Math.min(100, percent));
}

export function formatTimeRemaining(
    endTime: string,
    currentTime: number = Date.now(),
    serverOffset: number = 0
): string {
    const end = new Date(endTime).getTime();
    const diff = end - (currentTime + serverOffset);

    if (diff <= 0) return 'Finished';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
}

// Helper to get current server-adjusted time (re-export for convenience)
export function getServerTime(offset: number = 0): number {
    return getServerAdjustedTime(offset);
}
