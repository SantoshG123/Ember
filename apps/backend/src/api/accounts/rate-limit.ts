// Single-process development protection. A shared deployment needs a Redis/edge limiter.
export function createAuthLimiter(limit: number, windowMs: number, maxKeys = 5000) {
  const entries = new Map<string, { count: number; expires: number }>()
  return (key: string, now = Date.now()) => {
    for (const [id, entry] of entries) if (entry.expires <= now) entries.delete(id)
    let entry = entries.get(key)
    if (!entry) {
      if (entries.size >= maxKeys) return false // Fail closed, not an unbounded allocation.
      entry = { count: 0, expires: now + windowMs }
      entries.set(key, entry)
    }
    entry.count += 1
    return entry.count <= limit
  }
}
