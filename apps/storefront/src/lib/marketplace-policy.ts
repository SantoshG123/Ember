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

export function allowsMarketplaceMutation(request: Request) {
  const target = new URL(request.url)
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
  return environment.NODE_ENV !== "production" &&
    environment.EMBER_LOCAL_DATA_ACCESS === "true" &&
    (environment.EMBER_LOCAL_API_KEY?.length ?? 0) >= 32 &&
    isLoopbackHost(new URL(request.url).hostname) &&
    isLoopbackHost(backend.hostname)
}
