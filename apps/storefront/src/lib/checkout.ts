"use client"

import { useMutation } from "@tanstack/react-query"
import type { CheckoutAuthorizationInput, CheckoutReceipt } from "@/lib/checkout-types"

async function authorizeCheckout(input: CheckoutAuthorizationInput): Promise<CheckoutReceipt> {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? "The authorization could not be completed. Try again.")
  }

  return response.json() as Promise<CheckoutReceipt>
}

export function useAuthorizeCheckout() {
  return useMutation({ mutationFn: authorizeCheckout })
}

