"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { BidDecision, BuyerDashboardData } from "@/lib/buyer-types"
import { invalidateMarketplace, marketplaceFetch, useMarketplaceMode, usesPersistentMarketplace } from "@/lib/marketplace-data"

const buyerQueryKey = ["buyer-dashboard"] as const

async function getBuyerDashboard(): Promise<BuyerDashboardData> {
  return marketplaceFetch<BuyerDashboardData>("/api/buyer")
}

async function decideBid(input: BidDecision) {
  const response = await fetch("/api/buyer", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? "The bid could not be updated.")
  }

  return response.json() as Promise<{
    action: BidDecision["action"]
    bidId: string
    requestId: string
    seller: string
    conversationId?: string
    requestStatus?: "matched"
  }>
}

export function useBuyerDashboard() {
  useMarketplaceMode()
  return useQuery({ queryKey: buyerQueryKey, queryFn: getBuyerDashboard })
}

export function useBidDecision() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: decideBid,
    onSuccess: async (result) => {
      if (usesPersistentMarketplace(queryClient)) {
        await invalidateMarketplace(queryClient)
        return
      }
      queryClient.setQueryData<BuyerDashboardData>(buyerQueryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          requests: current.requests.map((request) => {
            if (request.id !== result.requestId) return request
            return {
              ...request,
              acceptedSeller: result.action === "accept" ? result.seller : request.acceptedSeller,
              status: result.action === "accept" ? "matched" : request.status,
              statusLabel: result.action === "accept" ? "Matched" : request.statusLabel,
              bids: request.bids.map((bid) => ({
                ...bid,
                status:
                  bid.id === result.bidId
                    ? result.action === "accept"
                      ? "accepted"
                      : "declined"
                    : result.action === "accept" && bid.status === "active"
                      ? "declined"
                      : bid.status,
              })),
            }
          }),
        }
      })
    },
  })
}
