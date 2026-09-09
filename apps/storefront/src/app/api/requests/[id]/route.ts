import { getMarketplaceDataMode, marketplaceJson, proxyMarketplace } from "@/lib/marketplace-server"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, `requests/${encodeURIComponent(id)}`)
  return marketplaceJson({ message: "This request is not persisted in demo mode." }, 404)
}
