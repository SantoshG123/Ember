import type { BuyerBid } from "@/lib/buyer-types"
import type { OfferDraftResult, Opportunity } from "@/lib/opportunity-types"

export type MarketplaceRequestRecord = {
  id: string
  buyerId: string
  category: string
  title: string
  description: string
  budgetMin: number
  budgetMax: number
  frequency: "one-time" | "one_time" | "weekly" | "monthly" | "flexible"
  timing: string
  zip: string
  status: "draft" | "open" | "matched" | "fulfilled" | "cancelled"
  createdAt: string
  locationArea: string
  bids: BuyerBid[]
}

export type SellerMarketplaceBid = BuyerBid & {
  requestId: string
  requestTitle: string
  buyer?: { id: string; name: string }
  conversationId?: string
}

export type SellerWorkspaceData = {
  currentUser: { id: string; name: string; initials: string }
  unreadMessages: number
  bids: SellerMarketplaceBid[]
  requests: MarketplaceRequestRecord[]
  savedOpportunities: Opportunity[]
  offerDrafts: OfferDraftResult[]
}

export type CreateMarketplaceBidInput = {
  requestId: string
  pricePerDelivery: number
  deliveryCount: number
  cadence: string
  earliestStart: string
  proposal: string
}
