"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AccountProfile, AccountProfileInput } from "@/lib/account-profile-schema"
import { invalidateMarketplace } from "@/lib/marketplace-data"

export class ProfileError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

async function profileRequest(input?: AccountProfileInput): Promise<AccountProfile> {
  const response = await fetch("/api/auth/profile", {
    method: input ? "PATCH" : "GET", cache: "no-store",
    ...(input ? { headers: { "content-type": "application/json" }, body: JSON.stringify(input) } : {}),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new ProfileError(body?.message ?? "Profile unavailable. Please try again.", response.status)
  return body
}

export function useAccountProfile(accountId: string) {
  // Never replace an in-progress form with background refetch data.
  return useQuery({ queryKey: ["account-profile", accountId], queryFn: () => profileRequest(), retry: false, gcTime: 0, staleTime: Infinity, refetchOnWindowFocus: false })
}

export function useSaveAccountProfile(accountId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: AccountProfileInput) => profileRequest(input),
    onSuccess: async profile => {
      client.setQueryData(["account-profile", accountId], profile)
      await Promise.all([client.invalidateQueries({ queryKey: ["account"] }), invalidateMarketplace(client)])
    },
  })
}
