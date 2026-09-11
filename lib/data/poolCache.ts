// Small in-process memo for catalogue reads that many pages share — the
// relation pools behind every product page's links, the opportunity product
// list behind the hub pages. A build renders ~3,100 product pages; without
// this each one re-downloaded its brand's whole range.
//
// Module-level, so it spans every page rendered by the same build worker or
// server instance. The short TTL keeps a long-lived server from serving a
// catalogue edit stale for more than a few minutes, and a failed load is
// evicted rather than cached.
const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

export function cachedPool<T>(key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { expires: now + TTL_MS, value });
  value.catch(() => {
    if (cache.get(key)?.value === value) cache.delete(key);
  });
  return value;
}
