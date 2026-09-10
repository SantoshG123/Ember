export type MarketplaceDataMode = "demo" | "medusa" | "unavailable"

type Environment = Record<string, string | undefined>

/** Unknown values fail closed instead of silently displaying demo fixtures. */
export function resolveMarketplaceMode(environment: Environment): MarketplaceDataMode {
  const value = environment.EMBER_DATA_MODE ?? environment.NEXT_PUBLIC_EMBER_DATA_MODE ?? "demo"
  return value === "demo" || value === "medusa" ? value : "unavailable"
}

export function isLoopbackHost(hostname: string) {
  return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname)
}

function requestOrigin(request: Request) {
  const target = new URL(request.url)
  const host = request.headers.get("host")
  if (host === null) return target
  // Next can normalize 127.0.0.1 to localhost in request.url. The browser's
  // actual authority is Host; never substitute caller-supplied forwarded hosts.
  if (!host || /[\s/\\?#@,]/.test(host)) return null
  try {
    return new URL(`${target.protocol}//${host}`)
  } catch {
    return null
  }
}

export function allowsMarketplaceMutation(request: Request) {
  const target = requestOrigin(request)
  if (!target) return false
  const origin = request.headers.get("origin")
  const site = request.headers.get("sec-fetch-site")
  if (site === "cross-site") return false
  if (origin) {
    try {
      return new URL(origin).origin === target.origin
    } catch {
      return false
    }
  }
  // Browser writes include Origin. Permit non-browser local smoke tests only.
  return isLoopbackHost(target.hostname) && !site
}

export function canUseLocalMarketplaceActor(environment: Environment, request: Request, backend: URL) {
  const target = requestOrigin(request)
  return environment.NODE_ENV !== "production" &&
    environment.EMBER_LOCAL_DATA_ACCESS === "true" &&
    (environment.EMBER_LOCAL_API_KEY?.length ?? 0) >= 32 &&
    isLoopbackHost(new URL(request.url).hostname) &&
    target !== null && isLoopbackHost(target.hostname) &&
    isLoopbackHost(backend.hostname)
}
