"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { RequestInput } from "@/lib/request-schema"
import { invalidateMarketplace } from "@/lib/marketplace-data"

type PublishedRequest = RequestInput & {
  id: string
  status: "open"
  createdAt: string
}

async function publishRequest(input: RequestInput): Promise<PublishedRequest> {
  const response = await fetch("/api/requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string }
      | null
    throw new Error(body?.message ?? "The request could not be published.")
  }

  return response.json() as Promise<PublishedRequest>
}

export function usePublishRequest() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: publishRequest, onSuccess: () => invalidateMarketplace(queryClient) })
}
