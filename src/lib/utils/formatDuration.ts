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
