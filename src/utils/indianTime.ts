/**
 * Indian Standard Time (IST - Asia/Kolkata) Utility
 * Prefers source-provided timing (e.g. exchange source Unix timestamp / ISO string) over system time.
 */

/**
 * Formats a timestamp into Indian Standard Time (hh:mm:ss A IST)
 */
export function formatIndianTime(sourceTime?: number | string | Date): string {
  if (!sourceTime) return 'IST --:--:--';
  try {
    const d = new Date(sourceTime);
    if (isNaN(d.getTime())) return 'IST --:--:--';
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' IST';
  } catch {
    return 'IST --:--:--';
  }
}

/**
 * Formats a timestamp into Indian Standard Date and Time (DD MMM YYYY, hh:mm:ss A IST)
 */
export function formatIndianDateTime(sourceTime?: number | string | Date): string {
  if (!sourceTime) return 'IST --:--:--';
  try {
    const d = new Date(sourceTime);
    if (isNaN(d.getTime())) return 'IST --:--:--';
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' IST';
  } catch {
    return 'IST --:--:--';
  }
}

/**
 * Parses and extracts source provided timestamp from payload objects
 */
export function extractSourceTimestamp(payload: any): number {
  if (!payload) return Date.now();

  if (typeof payload.dataTimestamp === 'number' && payload.dataTimestamp > 0) {
    return payload.dataTimestamp;
  }
  if (typeof payload.sourceTimestamp === 'number' && payload.sourceTimestamp > 0) {
    return payload.sourceTimestamp;
  }
  if (typeof payload.closeTime === 'number' && payload.closeTime > 0) {
    return payload.closeTime;
  }
  if (typeof payload.eventTime === 'number' && payload.eventTime > 0) {
    return payload.eventTime;
  }
  if (typeof payload.E === 'number' && payload.E > 0) {
    return payload.E;
  }
  if (typeof payload.T === 'number' && payload.T > 0) {
    return payload.T;
  }
  if (typeof payload.C === 'number' && payload.C > 0) {
    return payload.C;
  }
  if (typeof payload.updatedAtMs === 'number' && payload.updatedAtMs > 0) {
    return payload.updatedAtMs;
  }
  if (typeof payload.updatedAt === 'string' && payload.updatedAt) {
    const parsed = new Date(payload.updatedAt).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return Date.now();
}
