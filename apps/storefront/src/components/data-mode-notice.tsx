"use client"

import { useMarketplaceMode } from "@/lib/marketplace-data"

export function DataModeNotice() {
  const config = useMarketplaceMode()
  if (config.data?.mode !== "medusa") return null
  return <div className="border-b border-divider bg-muted px-5 py-2 text-center text-xs font-semibold text-foreground" role="status">
    {config.data.localIdentity
      ? "Local database test · Buyer and seller test identities · Real sign-in and payments are not enabled."
      : "Database-connected marketplace · Account authentication is required for private data."}
  </div>
}
