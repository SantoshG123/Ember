"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { OfferDraftInput, OfferDraftResult, Opportunity } from "@/lib/opportunity-types"
import { invalidateMarketplace, marketplaceFetch, useMarketplaceMode, usesPersistentMarketplace } from "@/lib/marketplace-data"

function opportunityKey(slug: string) {
  return ["opportunity", slug] as const
}

async function getOpportunity(slug: string): Promise<Opportunity> {
  return marketplaceFetch<Opportunity>(`/api/opportunities?slug=${encodeURIComponent(slug)}`)
}

async function saveOpportunity(input: { slug: string; saved: boolean }) {
  const response = await fetch("/api/opportunities", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message ?? "The opportunity could not be saved.")
  }
  return response.json() as Promise<{ slug: string; saved: boolean }>
}

async function createOfferDraft(input: OfferDraftInput): Promise<OfferDraftResult> {
  const response = await fetch("/api/opportunities", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? "Your offer draft could not be created.")
  }
  return response.json() as Promise<OfferDraftResult>
}

export function useOpportunity(slug: string) {
  useMarketplaceMode()
  return useQuery({ queryKey: opportunityKey(slug), queryFn: () => getOpportunity(slug) })
}

export function useSaveOpportunity(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveOpportunity,
    onSuccess: async ({ saved }) => {
      queryClient.setQueryData<Opportunity>(opportunityKey(slug), (current) =>
        current ? { ...current, saved } : current,
      )
      if (usesPersistentMarketplace(queryClient)) await invalidateMarketplace(queryClient)
    },
  })
}

export function useCreateOfferDraft() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: createOfferDraft, onSuccess: () => invalidateMarketplace(queryClient) })
}
