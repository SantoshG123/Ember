"use client"

import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"

export function MarketplaceState({ title, message, retry, loading = false }: {
  title: string; message: string; retry?: () => void; loading?: boolean
}) {
  return <main className="min-h-svh bg-background">
    <SiteHeader variant="app" />
    <section className="mx-auto max-w-3xl px-5 py-20" id="content" tabIndex={-1} aria-busy={loading}>
      <p className="eyebrow text-subtle">EMBER marketplace</p>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-5 text-subtle" role={loading ? "status" : undefined}>{message}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        {retry ? <Button onClick={retry}>Try again</Button> : null}
        {!loading ? <Button asChild variant="outline"><Link href="/requests/new">Post a request</Link></Button> : null}
      </div>
    </section>
  </main>
}
