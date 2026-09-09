export type RequestStatus = "collecting" | "ready" | "matched" | "completed"
export type BidStatus = "active" | "accepted" | "declined"

export type BuyerBid = {
  id: string
  seller: string
  initials: string
  rating: number
  reviews: number
  pricePerDelivery: number
  totalPrice: number
  deliveryCount: number
  cadence: string
  earliestStart: string
  distance: number
  summary: string
  proposal: string
  fitReason?: string
  recommended?: boolean
  conversationId?: string
  status: BidStatus
}

export type BuyerRequest = {
  id: string
  title: string
  category: string
  status: RequestStatus
  statusLabel: string
  bidCount: number
  posted: string
  deadline: string
  neighborhood: string
  budget: string
  bids: BuyerBid[]
  acceptedSeller?: string
}

export type BuyerDashboardData = {
  activeRequests: number
  newBids: number
  unreadMessages: number
  requests: BuyerRequest[]
}

export type BidDecision = {
  bidId: string
  action: "accept" | "decline"
}
