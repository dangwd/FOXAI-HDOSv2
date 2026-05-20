/**
 * Shared EventSource pool.
 *
 * Multiple useSSE subscribers that share the same URL (e.g. all dashboard
 * widgets pointing at /api/sse/dashboard) reuse ONE EventSource instead of
 * opening separate connections. This avoids hitting the browser's 6
 * concurrent HTTP/1.1 connections-per-origin limit.
 */

type DataCallback   = (data: unknown) => void;
type StatusCallback = (status: "connected" | "reconnecting" | "disconnected") => void;

interface PoolEntry {
  es:         EventSource;
  dataSubs:   Map<string, Set<DataCallback>>;
  statusSubs: Set<StatusCallback>;
  refCount:   number;
}

const pool = new Map<string, PoolEntry>();

export function poolSubscribe(
  fullUrl:  string,
  event:    string,
  onData:   DataCallback,
  onStatus: StatusCallback,
): () => void {
  let entry = pool.get(fullUrl);

  if (!entry) {
    const es: EventSource = new EventSource(fullUrl);
    entry = { es, dataSubs: new Map(), statusSubs: new Set(), refCount: 0 };
    pool.set(fullUrl, entry);

    es.onopen = () => {
      pool.get(fullUrl)?.statusSubs.forEach((cb) => cb("connected"));
    };
    es.onerror = () => {
      const status =
        es.readyState === EventSource.CLOSED ? "disconnected" : "reconnecting";
      pool.get(fullUrl)?.statusSubs.forEach((cb) => cb(status));
    };
  }

  entry.refCount++;
  entry.statusSubs.add(onStatus);

  // If the connection is already open, notify the new subscriber immediately
  if (entry.es.readyState === EventSource.OPEN) {
    queueMicrotask(() => onStatus("connected"));
  }

  // Register the event listener once per event name per connection
  if (!entry.dataSubs.has(event)) {
    entry.dataSubs.set(event, new Set());
    entry.es.addEventListener(event, (e: MessageEvent) => {
      try {
        const data: unknown = JSON.parse((e as MessageEvent).data);
        pool.get(fullUrl)?.dataSubs.get(event)?.forEach((cb) => cb(data));
      } catch { /* ignore malformed frames */ }
    });
  }

  entry.dataSubs.get(event)!.add(onData);

  return () => {
    const e = pool.get(fullUrl);
    if (!e) return;
    e.dataSubs.get(event)?.delete(onData);
    e.statusSubs.delete(onStatus);
    e.refCount--;
    if (e.refCount <= 0) {
      e.es.close();
      pool.delete(fullUrl);
    }
  };
}
