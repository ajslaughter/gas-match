type Queue = { last: number; chain: Promise<unknown> };

const queues = new Map<string, Queue>();

export function rateLimited<T>(key: string, intervalMs: number, fn: () => Promise<T>): Promise<T> {
  const q = queues.get(key) ?? { last: 0, chain: Promise.resolve() };
  const next = q.chain.then(async () => {
    const wait = Math.max(0, q.last + intervalMs - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    q.last = Date.now();
    return fn();
  });
  q.chain = next.catch(() => undefined);
  queues.set(key, q);
  return next;
}
