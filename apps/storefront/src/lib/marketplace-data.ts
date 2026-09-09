"use client"

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import type { CreateMarketplaceBidInput, MarketplaceRequestRecord, SellerMarketplaceBid, SellerWorkspaceData } from "@/lib/marketplace-types"
import type { Opportunity } from "@/lib/opportunity-types"
import type { MarketplaceDataMode } from "@/lib/marketplace-policy"

export const marketplaceModeKey = ["marketplace-mode"] as const
export type MarketplaceMode = { mode: MarketplaceDataMode; localIdentity: boolean }

export async function marketplaceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: "no-store" })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body && typeof body === "object" && "message" in body && typeof body.message === "string"
      ? body.message : "Marketplace data could not be loaded. Please try again.")
  }
  if (!body || typeof body !== "object") throw new Error("The marketplace returned an invalid response.")
  return body as T
}

export function useMarketplaceMode() {
  return useQuery({
    queryKey: marketplaceModeKey,
    queryFn: () => marketplaceFetch<MarketplaceMode>("/api/marketplace/config"),
    staleTime: 60_000,
    retry: 1,
  })
}

export function usesPersistentMarketplace(queryClient: QueryClient) {
  return queryClient.getQueryData<MarketplaceMode>(marketplaceModeKey)?.mode === "medusa"
}

export async function invalidateMarketplace(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["marketplace"] }),
    queryClient.invalidateQueries({ queryKey: ["buyer-dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["messages-workspace"] }),
    queryClient.invalidateQueries({ queryKey: ["opportunity"] }),
  ])
}

export function useMarketplaceRequests(enabled = true) {
  const mode = useMarketplaceMode()
  return useQuery({
    queryKey: ["marketplace", "requests"],
    queryFn: () => marketplaceFetch<{ requests: MarketplaceRequestRecord[] }>("/api/requests"),
    enabled: enabled && mode.data?.mode === "medusa",
    retry: 1,
  })
}

export function useMarketplaceRequest(id: string) {
  const mode = useMarketplaceMode()
  return useQuery({
    queryKey: ["marketplace", "request", id],
    queryFn: () => marketplaceFetch<MarketplaceRequestRecord>(`/api/requests/${encodeURIComponent(id)}`),
    enabled: Boolean(id) && mode.data?.mode === "medusa",
    retry: 1,
  })
}

export function useMarketplaceSeller(enabled = true) {
  const mode = useMarketplaceMode()
  return useQuery({
    queryKey: ["marketplace", "seller"],
    queryFn: () => marketplaceFetch<SellerWorkspaceData>("/api/marketplace/seller"),
    enabled: enabled && mode.data?.mode === "medusa",
    retry: 1,
  })
}

export function useMarketplaceOpportunities(enabled = true) {
  const mode = useMarketplaceMode()
  return useQuery({
    queryKey: ["marketplace", "opportunities"],
    queryFn: () => marketplaceFetch<{ opportunities: Opportunity[] }>("/api/opportunities"),
    enabled: enabled && mode.data?.mode === "medusa",
    retry: 1,
  })
}

export function useCreateMarketplaceBid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMarketplaceBidInput) => marketplaceFetch<{ bid: SellerMarketplaceBid }>("/api/marketplace/bids", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
    }),
    onSuccess: () => invalidateMarketplace(queryClient),
  })
}
