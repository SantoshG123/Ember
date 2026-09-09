import { ArrowLeft, Clock3, MapPin, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { MarketplaceState } from "@/components/marketplace-state"
import { RequestBidForm } from "@/components/request-bid-form"
import { fetchMarketplaceData, getMarketplaceMode } from "@/lib/marketplace-server"
import type { MarketplaceRequestRecord } from "@/lib/marketplace-types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Public request",
}

export default async function PublicRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (getMarketplaceMode() !== "demo") {
    let record: MarketplaceRequestRecord
    try { record = await fetchMarketplaceData<MarketplaceRequestRecord>(`requests/${encodeURIComponent(id)}`, { actor: "seller" }) }
    catch { return <MarketplaceState title="Request unavailable" message="This request could not be loaded. Check the address and your connection, then refresh. No example request has been substituted." /> }
    return <main className="min-h-svh bg-background"><SiteHeader variant="app" />
      <section className="mx-auto max-w-[1120px] px-5 py-12 md:px-10 md:py-20" id="content" tabIndex={-1}>
        <Button asChild variant="ghost"><Link href="/demand"><ArrowLeft aria-hidden="true" className="size-4" />Browse requests</Link></Button>
        <div className="mt-10 border-t-4 border-ember pt-8"><p className="eyebrow text-ember-ink">{record.status === "open" ? "Accepting bids" : record.status} · {record.category}</p><h1 className="mt-6 break-words font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-tight tracking-[-0.05em]">{record.title}</h1><p className="mt-5 flex items-center gap-2 text-subtle"><MapPin className="size-4" aria-hidden="true" />{record.locationArea} · ZIP {record.zip}</p></div>
        <div className="my-10 grid gap-8 border-y border-divider py-8 md:grid-cols-[1fr_260px]"><div><h2 className="eyebrow text-subtle">What the buyer needs</h2><p className="mt-5 whitespace-pre-wrap break-words text-lg leading-8">{record.description}</p></div><dl className="space-y-5 text-sm"><div><dt className="text-subtle">Budget per delivery</dt><dd className="mt-1 text-xl font-semibold">${record.budgetMin.toLocaleString()}–${record.budgetMax.toLocaleString()}</dd></div><div><dt className="text-subtle">Frequency</dt><dd className="mt-1 font-semibold">{record.frequency.replaceAll("_", " ")}</dd></div><div><dt className="text-subtle">Timing</dt><dd className="mt-1 font-semibold">{record.timing}</dd></div><div><dt className="text-subtle">Request reference</dt><dd className="mt-1 break-all font-semibold">{record.id}</dd></div></dl></div>
        <RequestBidForm requestId={record.id} open={record.status === "open"} />
      </section></main>
  }
  const italian = id === "R-8924"

  return (
    <main className="min-h-svh bg-white">
      <SiteHeader />
      <section className="mx-auto max-w-[1120px] px-5 py-12 md:px-10 md:py-20">
        <Button asChild variant="ghost"><Link href="/buyer"><ArrowLeft aria-hidden="true" className="size-4" />Back to dashboard</Link></Button>
        <div className="mt-12 border-t-4 border-ember pt-8">
          <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.1em]">
            <span className="rounded-full border border-ember/40 px-3 py-2 text-ember-ink">Accepting bids</span>
            <span className="rounded-full border border-divider px-3 py-2 text-subtle">Request #{id}</span>
          </div>
          <h1 className="mt-8 max-w-4xl font-display text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
            {italian ? "Weekly homemade Italian dinners for 4" : "Local request"}
          </h1>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-subtle">
            <span className="inline-flex items-center gap-2"><MapPin aria-hidden="true" className="size-4" />South Congress · Austin, TX</span>
            <span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" className="size-4" />Respond by Sep 9, 6:00 PM</span>
          </div>
        </div>
        <div className="mt-12 grid gap-10 border-t border-divider pt-10 md:grid-cols-[1fr_280px]">
          <div>
            <p className="eyebrow text-subtle">What the buyer needs</p>
            <p className="mt-5 max-w-2xl text-lg leading-8">
              Two prepared Italian dinners each week for a household of four, with grocery sourcing and clear reheating instructions included. The buyer values dependable scheduling, seasonal ingredients, and one vegetarian-friendly meal each week.
            </p>
          </div>
          <dl className="divide-y divide-divider border-y border-divider text-sm">
            <div className="py-4"><dt className="text-subtle">Budget</dt><dd className="mt-1 font-semibold">$120–$180 per delivery</dd></div>
            <div className="py-4"><dt className="text-subtle">Frequency</dt><dd className="mt-1 font-semibold">Twice weekly · 4 weeks</dd></div>
            <div className="py-4"><dt className="text-subtle">Qualified bids</dt><dd className="mt-1 font-semibold">3 received</dd></div>
          </dl>
        </div>
        <div className="mt-14 flex gap-4 border border-divider bg-background p-6 text-sm leading-relaxed text-subtle">
          <ShieldCheck aria-hidden="true" className="size-6 shrink-0 text-foreground" />
          This public view uses an approximate neighborhood. EMBER reveals direct contact information only after a bid is accepted.
        </div>
      </section>
    </main>
  )
}
