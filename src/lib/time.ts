export function relativeTime(ts: string): string {
  const seconds = Math.floor(Date.now() / 1000 - parseFloat(ts));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(parseFloat(ts) * 1000).toLocaleDateString();
}

export function exactTime(ts: string): string {
  return new Date(parseFloat(ts) * 1000).toLocaleString();
}
