import { proxyMarketplace } from "@/lib/marketplace-server"

export async function GET(request: Request) {
  return proxyMarketplace(request, "bids", "seller")
}

export async function POST(request: Request) {
  return proxyMarketplace(request, "bids", "seller")
}

export async function PATCH(request: Request) {
  return proxyMarketplace(request, "bids", "seller")
}
