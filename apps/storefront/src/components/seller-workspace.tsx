"use client"

import {
  ArrowRight,
  Bookmark,
  Check,
  CircleDollarSign,
  Clock3,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useMarketplaceMode } from "@/lib/marketplace-data"
import { MarketplaceState } from "@/components/marketplace-state"
import { PersistentSellerWorkspace } from "@/components/persistent-seller-workspace"

type SellerWorkspaceProps = {
  view: "dashboard" | "bid" | "test-plan"
  bidId?: string
}

const bids = [
  { id: "B-184", title: "Weekly family dinners", buyer: "Jordan M.", amount: "$68", status: "Accepted", due: "Wed · 6:30 PM" },
  { id: "B-179", title: "Friday office lunch for 16", buyer: "Nora T.", amount: "$540", status: "Active", due: "Fri · 11:45 AM" },
  { id: "B-171", title: "Birthday focaccia table", buyer: "Ari K.", amount: "$185", status: "Active", due: "Sep 19" },
] as const

export function SellerWorkspace(props: SellerWorkspaceProps) {
  const config = useMarketplaceMode()
  if (config.isPending) return <MarketplaceState loading title="Opening seller workspace…" message="Checking the marketplace connection." />
  if (config.isError || config.data?.mode === "unavailable") return <MarketplaceState title="Marketplace unavailable" message="The marketplace connection is not configured." retry={() => void config.refetch()} />
  return config.data?.mode === "medusa" ? <PersistentSellerWorkspace {...props} /> : <DemoSellerWorkspace {...props} />
}

function DemoSellerWorkspace({ view }: SellerWorkspaceProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<"All" | "Active" | "Accepted">("All")
  const [saved, setSaved] = useState(true)
  const visibleBids = bids.filter((bid) => filter === "All" || bid.status === filter)

  return (
    <main className="min-h-svh bg-background text-foreground">
      <SiteHeader active="seller" messageCount={2} variant="app" />

      <section className="scroll-mt-32 border-b border-divider bg-white" id="content" tabIndex={-1}>
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-7 px-5 py-9 md:flex-row md:items-end md:px-10 lg:px-16 lg:py-11">
          <div>
            <p className="eyebrow mb-3 text-subtle">Seller workspace · Austin</p>
            <h1 className="font-display text-[clamp(2.6rem,4.6vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.06em]">Good morning, Sofia.</h1>
            <p className="mt-4 text-subtle">Three live proposals. One new local demand signal.</p>
          </div>
          <div className="flex shrink-0 self-start rounded-full bg-muted p-1 md:self-auto">
            <Link className="min-h-11 rounded-full px-5 py-3 text-sm text-subtle" href="/buyer">Buying</Link>
            <span className="min-h-11 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">Selling</span>
          </div>
        </div>
      </section>

      <section className="border-b border-divider bg-black text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-white/15 md:grid-cols-4 lg:px-16">
          {[
            ["$793", "Open proposal value"],
            ["3", "Active bids"],
            ["67%", "Reply rate"],
            ["4.9", "Buyer rating"],
          ].map(([value, label]) => (
            <div className="px-5 py-8 md:px-7" key={label}>
              <p className="font-display text-4xl font-semibold tracking-[-0.055em]">{value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.08em] text-white/55">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 lg:px-16 lg:py-14">
        <section className="enterprise-panel grid overflow-hidden lg:grid-cols-[1.55fr_0.8fr]">
          <div className="p-6 md:p-10">
            <p className="eyebrow text-ember-ink">Featured opportunity</p>
            <h2 className="mt-4 max-w-3xl font-display text-[clamp(2.25rem,4vw,4.5rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
              Homemade meals are surging near South Austin.
            </h2>
            <div className="mt-8 grid grid-cols-3 divide-x divide-divider border-y border-divider py-5">
              <Metric value="18" label="requests" />
              <Metric value="$21" label="avg / meal" />
              <Metric value="2.4 mi" label="radius" />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="ember"><Link href="/requests/R-8924">Review requests <ArrowRight className="size-4" /></Link></Button>
              <Button asChild variant="outline"><Link href="/demand">Open demand map</Link></Button>
            </div>
          </div>
          <aside className="border-t border-divider bg-muted p-6 md:p-8 lg:border-l lg:border-t-0">
            <Sparkles className="size-7" />
            <p className="eyebrow mt-6 text-subtle">EMBER signal</p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em]">Run a five-buyer test.</h3>
            <p className="mt-4 text-sm leading-relaxed text-subtle">
              Group five similar 78704 requests and offer a fixed pickup window before expanding delivery.
            </p>
            <Button asChild className="mt-7 w-full"><Link href="/seller/test-plan">Build a test plan</Link></Button>
          </aside>
        </section>

        <section className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.4fr)_420px]">
          <div className="min-w-0">
            <div className="flex flex-col justify-between gap-5 border-b border-black pb-5 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow text-subtle">Pipeline</p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em]">Active bids</h2>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter bids">
                {(["All", "Active", "Accepted"] as const).map((item) => (
                  <button
                    aria-pressed={filter === item}
                    className={cn("min-h-11 border-b-2 px-3 text-sm font-semibold", filter === item ? "border-black" : "border-transparent text-subtle hover:text-black")}
                    key={item}
                    onClick={() => setFilter(item)}
                    type="button"
                  >{item}</button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-divider border-b border-divider" aria-live="polite">
              {visibleBids.map((bid) => (
                <Link className="group grid gap-4 bg-white px-4 py-6 transition-colors hover:bg-muted sm:grid-cols-[1fr_auto] sm:px-6" href={`/seller/bids/${bid.id}`} key={bid.id}>
                  <div>
                    <p className="eyebrow text-subtle">{bid.id} · {bid.buyer}</p>
                    <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.035em]">{bid.title}</h3>
                    <p className="mt-2 flex items-center gap-2 text-sm text-subtle"><Clock3 className="size-4" /> {bid.due}</p>
                  </div>
                  <div className="flex items-end justify-between gap-5 sm:flex-col sm:items-end">
                    <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]", bid.status === "Accepted" ? "bg-black text-white" : "bg-muted text-black")}>{bid.status}</span>
                    <span className="font-display text-2xl font-semibold tracking-[-0.04em]">{bid.amount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside>
            <div className="enterprise-panel p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="eyebrow text-subtle">Saved request</p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.045em]">Homemade focaccia, weekly</h2>
                </div>
                <button aria-label={saved ? "Remove bookmark" : "Save request"} aria-pressed={saved} className="grid size-11 shrink-0 place-items-center rounded-lg border border-divider transition-colors hover:bg-muted" onClick={() => setSaved((value) => !value)} type="button">
                  <Bookmark className={cn("size-5", saved && "fill-ember text-ember")} />
                </button>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-subtle"><MapPin className="size-4" /> Bouldin Creek · 1.7 miles</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-subtle"><CircleDollarSign className="size-4" /> $38–$52 each week</p>
              <Button asChild className="mt-6 w-full" variant="ember"><Link href="/requests/R-8924">Prepare bid</Link></Button>
            </div>
            <div className="enterprise-panel mt-5 p-6">
              <p className="eyebrow text-subtle">Recent message</p>
              <div className="mt-4 flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-black text-sm font-bold text-white">JM</div>
                <div>
                  <p className="font-semibold">Jordan M.</p>
                  <p className="mt-1 text-sm leading-relaxed text-subtle">The Wednesday timing works. Is the no-shellfish note okay?</p>
                </div>
              </div>
              <Button asChild className="mt-5 w-full" variant="outline"><Link href="/messages"><MessageCircle className="size-4" /> Reply</Link></Button>
            </div>
          </aside>
        </section>
      </div>

      {view === "bid" ? <BidPanel onClose={() => router.replace("/seller", { scroll: false })} /> : null}
      {view === "test-plan" ? <TestPlan onClose={() => router.replace("/seller", { scroll: false })} /> : null}
    </main>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="min-w-0 px-2 first:pl-0 sm:px-3"><p className="metric-number font-display text-xl font-semibold tracking-[-0.04em] sm:text-2xl md:text-3xl">{value}</p><p className="mt-1 text-xs text-subtle">{label}</p></div>
}

function BidPanel({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="left-auto right-0 top-0 flex h-dvh max-h-dvh w-full max-w-2xl translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none p-0 sm:p-0 md:right-6 md:top-6 md:h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:w-[calc(100%-3rem)] md:rounded-2xl">
        <DialogHeader className="shrink-0 border-b border-divider px-5 py-5 pr-20 md:pl-8">
          <p className="eyebrow text-subtle">Accepted proposal · B-184</p>
          <DialogTitle className="mt-2 text-2xl">Weekly family dinners</DialogTitle>
          <DialogDescription className="sr-only">Review the proposal, delivery details, and payment status for Jordan M.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-8 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8">
          <section className="rounded-xl bg-black p-6 text-white">
            <p className="eyebrow text-white/50">Current state</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><p className="metric-number font-display text-4xl font-semibold">$68</p><p className="mt-1 text-sm text-white/60">First delivery authorized</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-black">Accepted</span></div>
          </section>
          <section><p className="eyebrow text-subtle">Your proposal</p><h3 className="mt-3 font-display text-2xl font-semibold">Four portions, delivered Wednesday</h3><p className="mt-4 leading-relaxed text-subtle">Rotating Italian menu, insulated delivery, ingredient list included, and no shellfish used.</p></section>
          <dl className="divide-y divide-divider border-y border-divider">
            {[["Buyer", "Jordan M."], ["Area", "Hyde Park · exact address after funding"], ["Delivery", "Wednesday · 6:30 PM"], ["Payment", "Authorized · held until delivery"]].map(([term, value]) => <div className="grid gap-2 py-4 sm:grid-cols-[140px_1fr]" key={term}><dt className="text-sm text-subtle">{term}</dt><dd className="font-semibold">{value}</dd></div>)}
          </dl>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Button asChild variant="ember"><Link href="/messages">Message Jordan</Link></Button><Button asChild variant="outline"><Link href="/checkout">View funding receipt</Link></Button></div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TestPlan({ onClose }: { onClose: () => void }) {
  const steps = ["Confirm five matching households", "Offer one fixed Wednesday pickup window", "Measure prep time and pickup completion", "Ask buyers before expanding delivery"]
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl p-5 sm:p-9">
        <DialogHeader className="pr-12">
          <p className="eyebrow text-ember-ink">EMBER signal · draft plan</p>
          <DialogTitle className="mt-3 text-3xl leading-tight md:text-5xl">Test demand before you scale.</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mt-5 max-w-2xl text-base">A low-risk one-week experiment for the South Austin homemade-meals cluster. EMBER uses aggregated signals; no buyer contact details are shared until they accept.</DialogDescription>
        <ol className="mt-8 divide-y divide-divider border-y border-divider">
          {steps.map((step, index) => <li className="flex gap-4 py-5" key={step}><span className="grid size-8 shrink-0 place-items-center rounded-full bg-black text-sm font-bold text-white">{index + 1}</span><div><p className="font-semibold">{step}</p><p className="mt-1 text-sm text-subtle">Recommended for a clear go / revise decision.</p></div></li>)}
        </ol>
        <div className="mt-8 grid gap-3 border border-divider bg-muted p-5 sm:grid-cols-3"><Metric value="5" label="buyers" /><Metric value="7 days" label="test window" /><Metric value="$0" label="platform fee" /></div>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end"><Button asChild variant="outline"><Link href="/seller">Save draft</Link></Button><Button asChild className="h-auto py-3" variant="ember"><Link href="/requests/R-8924"><Check className="size-4 shrink-0" /> Review matching requests</Link></Button></div>
      </DialogContent>
    </Dialog>
  )
}
