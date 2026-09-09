import { proxyMarketplace } from "@/lib/marketplace-server"

export async function GET(request: Request) {
  return proxyMarketplace(request, "seller", "seller")
}
