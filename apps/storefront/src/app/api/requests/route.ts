import { NextResponse } from "next/server"
import { requestSchema } from "@/lib/request-schema"
import { getMarketplaceDataMode, guardMarketplaceMutation, marketplaceJson, proxyMarketplace } from "@/lib/marketplace-server"

export async function GET(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "requests")
  return marketplaceJson({ requests: [], dataMode: "demo" })
}

export async function POST(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "requests")
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Check the highlighted fields and try again.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  return NextResponse.json(
    {
      ...parsed.data,
      id: `req_${crypto.randomUUID()}`,
      status: "open" as const,
      createdAt: new Date().toISOString(),
      dataMode: "demo",
    },
    { status: 201 },
  )
}
