import { getMarketplaceDataMode, marketplaceJson } from "@/lib/marketplace-server"
import { canUseLocalMarketplaceActor } from "@/lib/marketplace-policy"

export async function GET(request: Request) {
  let localIdentity = false
  try {
    localIdentity = canUseLocalMarketplaceActor(process.env, request, new URL(process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"))
  } catch { /* Invalid configuration is reported by data endpoints. */ }
  return marketplaceJson({ mode: getMarketplaceDataMode(), localIdentity })
}
