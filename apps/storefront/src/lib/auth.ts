"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AuthRole } from "@/lib/auth-types"
import { marketplaceFetch } from "@/lib/marketplace-data"
import type { AuthApiRequest, AuthResult } from "@/lib/auth-types"
import type { AccountSessions, RevokeSessionInput } from "@/lib/account-session-schema"

async function runAuthAction(input: AuthApiRequest): Promise<AuthResult> {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? "We could not complete that request. Try again.")
  }

  return response.json() as Promise<AuthResult>
}

export function useAuthAction() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: runAuthAction, onSuccess: async result => {
    if (result.dataMode !== "medusa") return
    await queryClient.cancelQueries()
    queryClient.clear()
    try { window.localStorage.removeItem("ember-request-draft") } catch { /* Storage may be disabled. */ }
    // A full navigation discards the previous account's Router Cache and component state.
    window.location.assign(result.role === "seller" ? "/seller" : "/buyer")
  } })
}

export type Account = { id: string; name: string; email: string; role: AuthRole; roles: Array<"buyer" | "seller"> }
export function useAccount() {
  return useQuery({ queryKey: ["account"], queryFn: () => marketplaceFetch<{ account: Account | null; dataMode: string }>("/api/auth"), retry: false, staleTime: 0, refetchOnWindowFocus: true })
}

export function useAccountSessions(accountId: string | undefined, offset: number) {
  return useQuery({
    queryKey: ["account-sessions", accountId, offset],
    queryFn: () => marketplaceFetch<AccountSessions>(`/api/auth/sessions?offset=${offset}`),
    enabled: Boolean(accountId), retry: false, staleTime: 0,
    refetchOnWindowFocus: true, refetchInterval: 30_000,
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RevokeSessionInput) => marketplaceFetch<{ revoked: number }>("/api/auth/sessions", {
      method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["account-sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["account"] }),
      ])
    },
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: () => marketplaceFetch("/api/auth", { method: "DELETE" }), onSuccess: async () => {
    await queryClient.cancelQueries()
    queryClient.clear()
    try { window.localStorage.removeItem("ember-request-draft") } catch { /* Storage may be disabled. */ }
    // A full navigation discards private Router Cache entries as well as query data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/auth")
  } })
}
