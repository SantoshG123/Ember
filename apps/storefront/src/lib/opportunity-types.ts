export type TimelineRange = 2 | 4 | 6

export type OpportunityMetric = {
  label: string
  value: string
  detail: string
}

export type TimelinePoint = {
  label: string
  requests: number
}

export type Neighborhood = {
  id: string
  name: string
  share: number
  requests: number
  meals: number
  insight: string
}

export type BuyerExcerpt = {
  id: string
  neighborhoodId: string
  quote: string
  organization: string
  cadence: string
}

export type EvidenceMetric = {
  label: string
  value: string
  detail: string
  explanation: string
}

export type Opportunity = {
  slug: string
  title: string
  category: string
  location: string
  verifiedLabel: string
  requestCount: number
  organizationCount: number
  weeklyValue: string
  description: string
  metrics: OpportunityMetric[]
  timeline: TimelinePoint[]
  neighborhoods: Neighborhood[]
  excerpts: BuyerExcerpt[]
  evidence: EvidenceMetric[]
  requirements: { label: string; value: string }[]
  readiness: string[]
  saved: boolean
  refreshedAt: string
}

export type OfferDraftInput = {
  slug: string
  pricePerMeal: number
  weeklyCapacity: number
  deliveryDays: string
  note: string
}

export type OfferDraftResult = OfferDraftInput & {
  draftId: string
  status: "draft"
}
