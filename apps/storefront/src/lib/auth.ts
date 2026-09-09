"use client"

import { useMutation } from "@tanstack/react-query"
import type { AuthApiRequest, AuthResult } from "@/lib/auth-types"

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
  return useMutation({ mutationFn: runAuthAction })
}

