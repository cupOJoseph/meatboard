/**
 * Parse human-readable deadlines like "4h", "30m", "2d" into unix timestamps.
 */
export function parseDeadline(deadline: string): number {
  const match = deadline.match(/^(\d+(?:\.\d+)?)\s*(m|min|h|hr|d|day|w|week)s?$/i);
  if (!match) {
    // Try as unix timestamp
    const n = Number(deadline);
    if (!isNaN(n) && n > 1_000_000_000) return n;
    throw new Error(`Invalid deadline format: "${deadline}". Use e.g. "4h", "30m", "2d", or a unix timestamp.`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    m: 60, min: 60,
    h: 3600, hr: 3600,
    d: 86400, day: 86400,
    w: 604800, week: 604800,
  };

  return Math.floor(Date.now() / 1000) + Math.floor(value * multipliers[unit]);
}
