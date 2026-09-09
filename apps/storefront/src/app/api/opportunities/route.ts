import { NextResponse } from "next/server"
import { getMarketplaceDataMode, guardMarketplaceMutation, proxyMarketplace } from "@/lib/marketplace-server"
import type { OfferDraftInput, Opportunity } from "@/lib/opportunity-types"

const opportunity: Opportunity = {
  slug: "east-austin-team-lunch",
  title: "Weekday lunch delivery for creative offices in East Austin.",
  category: "Food & meal prep",
  location: "East Austin · within 3.1 miles",
  verifiedLabel: "Verified demand cluster",
  requestCount: 28,
  organizationCount: 14,
  weeklyValue: "$2.4k",
  description:
    "Aggregated demand from 14 independent studios, agencies, and technology teams seeking dependable, high-quality, sustainably packaged weekday lunches.",
  metrics: [
    { label: "Volume", value: "146", detail: "meals per week" },
    { label: "Median budget", value: "$17", detail: "per meal" },
    { label: "Service area", value: "3.1", detail: "mile radius" },
    { label: "Peak days", value: "T–Th", detail: "highest volume" },
    { label: "Schedule overlap", value: "82%", detail: "delivery windows" },
  ],
  timeline: [
    { label: "Week 1", requests: 5 },
    { label: "Week 2", requests: 9 },
    { label: "Week 3", requests: 11 },
    { label: "Week 4", requests: 21 },
    { label: "Week 5", requests: 16 },
    { label: "Current", requests: 25 },
  ],
  neighborhoods: [
    { id: "east-cesar-chavez", name: "East Cesar Chavez", share: 42, requests: 12, meals: 62, insight: "The densest cluster, led by teams of 8–16 ordering twice weekly." },
    { id: "holly", name: "Holly", share: 28, requests: 8, meals: 41, insight: "Strong reusable-packaging preference and the tightest noon delivery window." },
    { id: "govalle", name: "Govalle", share: 18, requests: 5, meals: 27, insight: "Smaller teams with the highest vegetarian and gluten-free overlap." },
    { id: "mueller", name: "Mueller", share: 12, requests: 3, meals: 16, insight: "Emerging demand from hybrid teams concentrated on Wednesdays." },
  ],
  excerpts: [
    { id: "excerpt-1", neighborhoodId: "east-cesar-chavez", quote: "A healthy office lunch for 12 that arrives ready to serve every Tuesday and Thursday.", organization: "Independent design studio", cadence: "2× weekly" },
    { id: "excerpt-2", neighborhoodId: "holly", quote: "Gluten-free and vegetarian choices in returnable containers for our product team.", organization: "Technology agency", cadence: "Weekly" },
    { id: "excerpt-3", neighborhoodId: "govalle", quote: "Fresh salads and one warm option for a rotating studio team of eight to fourteen.", organization: "Architecture practice", cadence: "3× weekly" },
  ],
  evidence: [
    { label: "Sample size", value: "28", detail: "matched requests", explanation: "Only active requests sharing category, service radius, quantity, and delivery timing are included." },
    { label: "Freshness", value: "24", detail: "in the last 21 days", explanation: "Recent requests receive more weight so sellers see current purchasing intent." },
    { label: "Repeat intent", value: "71%", detail: "recurring potential", explanation: "Twenty buyers explicitly asked for a weekly or multi-week arrangement." },
    { label: "Schedule overlap", value: "82%", detail: "delivery alignment", explanation: "Most requested windows overlap between 11:30 AM and 12:30 PM Tuesday through Thursday." },
  ],
  requirements: [
    { label: "Dietary requirements", value: "Vegetarian, nut-free, gluten-free" },
    { label: "Packaging preference", value: "Reusable or returnable containers" },
    { label: "Delivery window", value: "11:30 AM–12:30 PM" },
  ],
  readiness: [
    "Weekday production capacity",
    "Delivery within 3.1 miles",
    "Reusable container logistics",
    "Dietary labeling capability",
  ],
  saved: false,
  refreshedAt: "Updated 18 minutes ago",
}

export async function GET(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "opportunities", "seller")
  const slug = new URL(request.url).searchParams.get("slug")
  if (!slug) return NextResponse.json({ opportunities: [opportunity] })
  if (slug !== opportunity.slug) {
    return NextResponse.json({ message: "Opportunity not found." }, { status: 404 })
  }
  return NextResponse.json(opportunity)
}

export async function PATCH(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "opportunities", "seller")
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  const body = (await request.json().catch(() => null)) as { slug?: string; saved?: boolean } | null
  if (!body || body.slug !== opportunity.slug || typeof body.saved !== "boolean") {
    return NextResponse.json({ message: "Choose a valid save state." }, { status: 400 })
  }
  return NextResponse.json({ slug: body.slug, saved: body.saved })
}

export async function POST(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "opportunities", "seller")
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  const body = (await request.json().catch(() => null)) as OfferDraftInput | null
  if (
    !body ||
    body.slug !== opportunity.slug ||
    !Number.isFinite(body.pricePerMeal) ||
    body.pricePerMeal < 8 ||
    !Number.isFinite(body.weeklyCapacity) ||
    body.weeklyCapacity < 20 ||
    !body.deliveryDays
  ) {
    return NextResponse.json(
      { message: "Add a realistic price, weekly capacity, and delivery schedule." },
      { status: 400 },
    )
  }

  return NextResponse.json({
    ...body,
    draftId: `OFFER-${Date.now().toString().slice(-6)}`,
    status: "draft",
  })
}
