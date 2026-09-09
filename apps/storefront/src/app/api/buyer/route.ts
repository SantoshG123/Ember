import { NextResponse } from "next/server"
import { getMarketplaceDataMode, guardMarketplaceMutation, proxyMarketplace } from "@/lib/marketplace-server"
import type { BidDecision, BuyerDashboardData } from "@/lib/buyer-types"

const dashboard: BuyerDashboardData = {
  activeRequests: 4,
  newBids: 12,
  unreadMessages: 3,
  requests: [
    {
      id: "R-8924",
      title: "Weekly homemade Italian dinners for 4",
      category: "Food & meal prep",
      status: "ready",
      statusLabel: "Ready to compare",
      bidCount: 3,
      posted: "Posted 2 days ago",
      deadline: "Respond by Sep 9, 6:00 PM",
      neighborhood: "South Congress · Austin, TX",
      budget: "$120–$180 per delivery",
      bids: [
        {
          id: "bid-maria",
          seller: "Chef Maria L.",
          initials: "ML",
          rating: 4.9,
          reviews: 128,
          pricePerDelivery: 145,
          totalPrice: 1160,
          deliveryCount: 8,
          cadence: "Tuesday / Thursday",
          earliestStart: "September 14",
          distance: 2.1,
          summary: "Sicilian family recipes, grocery sourcing, and cleanup included.",
          proposal: "I’ll create two family-style Italian dinners each week, sized for four adults. Every delivery includes a seasonal salad, main dish, reheating notes, ingredient list, and full grocery sourcing. I can accommodate one vegetarian dinner per week with 48 hours notice.",
          fitReason: "Best balance of rating, proximity, and schedule match.",
          recommended: true,
          status: "active",
        },
        {
          id: "bid-tuscany",
          seller: "Taste of Tuscany",
          initials: "TT",
          rating: 4.7,
          reviews: 84,
          pricePerDelivery: 120,
          totalPrice: 960,
          deliveryCount: 8,
          cadence: "Wednesday / Friday",
          earliestStart: "September 20",
          distance: 5.4,
          summary: "Family-style drop-off meals with simple reheating and minimal prep.",
          proposal: "Our four-week plan includes eight rotating Tuscan-inspired meals with bread and salad. Meals arrive chilled in returnable containers. Our fixed Wednesday and Friday route keeps the price lean, and menu substitutions are available for allergies.",
          status: "active",
        },
        {
          id: "bid-canvas",
          seller: "Culinary Canvas",
          initials: "CC",
          rating: 5,
          reviews: 212,
          pricePerDelivery: 210,
          totalPrice: 1680,
          deliveryCount: 8,
          cadence: "Flexible",
          earliestStart: "September 12",
          distance: 1.2,
          summary: "Highly customized private-chef menus with optional wine pairings.",
          proposal: "I’ll design a bespoke four-week menu after a short preference call. Service includes premium ingredients, reusable packaging, flexible delivery windows, and optional pairing notes. Two menu revisions are included before the first delivery.",
          status: "active",
        },
      ],
    },
    {
      id: "R-8917",
      title: "Biweekly native garden maintenance",
      category: "Home services",
      status: "collecting",
      statusLabel: "Collecting bids",
      bidCount: 2,
      posted: "Posted yesterday",
      deadline: "Bidding closes Sep 11",
      neighborhood: "Bouldin Creek · Austin, TX",
      budget: "$90–$140 per visit",
      bids: [],
    },
    {
      id: "R-8898",
      title: "Algebra II tutor for a tenth grader",
      category: "Tutoring",
      status: "collecting",
      statusLabel: "Collecting bids",
      bidCount: 0,
      posted: "Posted 4 hours ago",
      deadline: "Bidding closes Sep 12",
      neighborhood: "Travis Heights · Austin, TX",
      budget: "$40–$65 per session",
      bids: [],
    },
    {
      id: "R-8821",
      title: "Custom oak entryway bench",
      category: "Furniture",
      status: "completed",
      statusLabel: "Completed",
      bidCount: 5,
      posted: "Posted Aug 12",
      deadline: "Completed Aug 31",
      neighborhood: "Zilker · Austin, TX",
      budget: "$700–$1,100 total",
      acceptedSeller: "Eastside Joinery",
      bids: [],
    },
  ],
}

export async function GET(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "buyer")
  return NextResponse.json(dashboard)
}

export async function PATCH(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "buyer")
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  const body = (await request.json().catch(() => null)) as BidDecision | null
  if (!body || !["accept", "decline"].includes(body.action) || !body.bidId) {
    return NextResponse.json({ message: "Choose a valid bid action." }, { status: 400 })
  }

  const buyerRequest = dashboard.requests.find((item) =>
    item.bids.some((bid) => bid.id === body.bidId),
  )
  const bid = buyerRequest?.bids.find((item) => item.id === body.bidId)
  if (!buyerRequest || !bid) {
    return NextResponse.json({ message: "That bid is no longer available." }, { status: 404 })
  }

  return NextResponse.json({
    action: body.action,
    bidId: bid.id,
    requestId: buyerRequest.id,
    seller: bid.seller,
  })
}
