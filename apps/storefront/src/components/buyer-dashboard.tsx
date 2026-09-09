"use client"

import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  MapPin,
  MessageCircle,
  Pencil,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useBidDecision, useBuyerDashboard } from "@/lib/buyer"
import type { BuyerBid, BuyerRequest, RequestStatus } from "@/lib/buyer-types"
import { cn } from "@/lib/utils"

type RequestFilter = "all" | RequestStatus

const filters: { id: RequestFilter; label: string }[] = [
  { id: "all", label: "All requests" },
  { id: "collecting", label: "Collecting bids" },
  { id: "ready", label: "Ready to compare" },
  { id: "matched", label: "Matched" },
  { id: "completed", label: "Completed" },
]

const noRequests: BuyerRequest[] = []

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function statusDot(status: RequestStatus) {
  if (status === "completed" || status === "matched") return "bg-success"
  if (status === "ready") return "bg-ember"
  return "bg-foreground"
}

function DashboardLoading() {
  return (
    <main className="min-h-svh bg-white">
      <SiteHeader active="buyer" variant="app" />
      <div aria-busy="true" className="mx-auto max-w-[1440px] scroll-mt-32 px-5 py-14 md:px-10 lg:px-16" id="content" tabIndex={-1}>
        <p className="sr-only" role="status">Loading your requests and bids.</p>
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-24 max-w-2xl animate-pulse rounded bg-muted" />
        <div className="mt-14 grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
          <div className="h-[560px] animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </main>
  )
}

function EmptyRequestState({ request }: { request: BuyerRequest }) {
  if (request.status === "completed" || request.status === "matched") {
    return (
      <div className="border-t border-divider py-16">
        <div className="grid size-12 place-items-center rounded-full bg-success text-white">
          <Check aria-hidden="true" className="size-5" />
        </div>
        <p className="eyebrow mt-7 text-success">{request.status === "matched" ? "Bid accepted · fulfillment pending" : "Request completed"}</p>
        <h3 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-[-0.045em]">
          Matched with {request.acceptedSeller}.
        </h3>
        <p className="mt-4 max-w-xl leading-relaxed text-subtle">
          This request is closed to new bids. Its conversation and agreement remain available in your records.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-divider py-16">
      <CircleDot aria-hidden="true" className="size-9 text-ember" />
      <p className="eyebrow mt-7 text-ember-ink">Demand is live</p>
      <h3 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-[-0.045em]">
        {request.bidCount > 0
          ? `${request.bidCount} sellers are preparing offers.`
          : "Your request is reaching nearby sellers."}
      </h3>
      <p className="mt-4 max-w-xl leading-relaxed text-subtle">
        We’ll place qualified bids here as they arrive. You can edit the request before bidding closes without exposing your exact address.
      </p>
      <Button asChild className="mt-8" variant="outline">
        <Link href={`/requests/${request.id}`}>Review public request</Link>
      </Button>
    </div>
  )
}

function BidCard({
  bid,
  selected,
  onProposal,
  onSelect,
}: {
  bid: BuyerBid
  selected: boolean
  onProposal: () => void
  onSelect: () => void
}) {
  const inactive = bid.status !== "active"

  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col border-t px-0 py-7 transition-[border-color,opacity] lg:border lg:p-6 xl:min-h-[590px]",
        selected ? "border-foreground lg:shadow-[inset_0_3px_0_#ff3b30]" : "border-divider",
        inactive && "opacity-55",
      )}
    >
      {bid.recommended ? (
        <span className="absolute -top-3 left-0 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-white lg:left-6">
          Recommended fit
        </span>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold tracking-[-0.03em]">{bid.seller}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            <Star aria-hidden="true" className="size-4 fill-foreground" />
            <strong>{bid.rating.toFixed(1)}</strong>
            <span className="text-subtle">({bid.reviews} reviews)</span>
          </div>
        </div>
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold text-subtle">
          {bid.initials}
        </div>
      </div>

      <dl className="mt-8 divide-y divide-divider border-y border-divider">
        <div className="py-4">
          <dt className="text-xs text-subtle">Four-week total</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tracking-[-0.05em]">
            {money(bid.totalPrice)}
          </dd>
          <p className="mt-1 text-xs text-subtle">
            {money(bid.pricePerDelivery)} × {bid.deliveryCount} deliveries
          </p>
        </div>
        {[
          ["Cadence", bid.cadence],
          ["Earliest start", bid.earliestStart],
          ["Fulfillment radius", `${bid.distance} miles away`],
        ].map(([label, value]) => (
          <div className="grid grid-cols-2 gap-3 py-3 text-sm" key={label}>
            <dt className="text-subtle">{label}</dt>
            <dd className="min-w-0 break-words text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-subtle">Proposal summary</p>
        <p className="mt-3 text-sm leading-relaxed">{bid.summary}</p>
        {bid.fitReason ? (
          <div className="mt-5 border-l-2 border-ember pl-3 text-sm font-semibold leading-relaxed">
            <BadgeCheck aria-hidden="true" className="mr-1.5 inline size-4 text-ember" />
            {bid.fitReason}
          </div>
        ) : null}
      </div>

      <div className="mt-7 grid gap-2">
        <Button disabled={inactive} onClick={onSelect} variant={selected ? "default" : "outline"}>
          {inactive ? (bid.status === "accepted" ? "Accepted" : "Declined") : selected ? "Selected" : "Select bid"}
        </Button>
        <Button disabled={inactive} onClick={onProposal} variant="ghost">
          View full proposal <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </article>
  )
}

export function BuyerDashboard() {
  const router = useRouter()
  const dashboard = useBuyerDashboard()
  const decision = useBidDecision()
  const [filter, setFilter] = useState<RequestFilter>("all")
  const [search, setSearch] = useState("")
  const [selectedRequestId, setSelectedRequestId] = useState("R-8924")
  const [selectedBidId, setSelectedBidId] = useState("bid-maria")
  const [proposalBid, setProposalBid] = useState<BuyerBid | null>(null)
  const [acceptBid, setAcceptBid] = useState<BuyerBid | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const requests = dashboard.data?.requests ?? noRequests
  const selectedRequest = requests.find((request) => request.id === selectedRequestId) ?? requests[0]
  const selectedBid =
    selectedRequest?.bids.find((bid) => bid.id === selectedBidId && bid.status === "active") ??
    selectedRequest?.bids.find((bid) => bid.status === "active")

  const counts = useMemo(
    () => ({
      all: requests.length,
      collecting: requests.filter((request) => request.status === "collecting").length,
      ready: requests.filter((request) => request.status === "ready").length,
      matched: requests.filter((request) => request.status === "matched").length,
      completed: requests.filter((request) => request.status === "completed").length,
    }),
    [requests],
  )

  const visibleRequests = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return requests.filter((request) => {
      const matchesStatus = filter === "all" || request.status === filter
      const matchesSearch =
        !needle || `${request.title} ${request.category} ${request.id}`.toLowerCase().includes(needle)
      return matchesStatus && matchesSearch
    })
  }, [filter, requests, search])

  function chooseRequest(request: BuyerRequest) {
    setSelectedRequestId(request.id)
    setSelectedBidId(request.bids.find((bid) => bid.recommended)?.id ?? request.bids[0]?.id ?? "")
    setNotice(null)
  }

  function messageSeller(bid: BuyerBid) {
    router.push(bid.conversationId ? `/messages?conversation=${encodeURIComponent(bid.conversationId)}` : "/messages")
  }

  async function declineSelected() {
    if (!selectedBid) return
    const result = await decision.mutateAsync({ bidId: selectedBid.id, action: "decline" })
    setNotice(`${result.seller} was declined. The seller will see a courteous closed status.`)
  }

  async function confirmAccept() {
    if (!acceptBid) return
    const result = await decision.mutateAsync({ bidId: acceptBid.id, action: "accept" })
    setAcceptBid(null)
    setNotice(`Matched with ${result.seller}. A private conversation is now open.`)
  }

  if (dashboard.isLoading) return <DashboardLoading />

  if (dashboard.data && !dashboard.isError && !requests.length) {
    return <main className="min-h-svh bg-background"><SiteHeader active="buyer" variant="app" />
      <section className="mx-auto max-w-3xl px-5 py-20" id="content" tabIndex={-1}>
        <p className="eyebrow text-subtle">Buyer workspace</p>
        <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight">Your first request starts here.</h1>
        <p className="mt-5 text-subtle">Published requests and seller responses will appear in this workspace.</p>
        <Button asChild className="mt-8" variant="ember"><Link href="/requests/new">Post a request</Link></Button>
      </section></main>
  }

  if (dashboard.isError || !dashboard.data || !selectedRequest) {
    return (
      <main className="min-h-svh bg-white">
        <SiteHeader active="buyer" variant="app" />
        <div className="mx-auto max-w-3xl scroll-mt-32 px-5 py-24 md:px-10" id="content" tabIndex={-1}>
          <p className="eyebrow text-error">Dashboard unavailable</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.05em]">The signal dropped.</h1>
          <p className="mt-5 text-subtle">{dashboard.error?.message ?? "Try loading your requests again."}</p>
          <Button className="mt-8" onClick={() => dashboard.refetch()}>Try again</Button>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-svh bg-white text-foreground">
      <SiteHeader
        active="buyer"
        messageCount={dashboard.data.unreadMessages}
        variant="app"
      />

      <main className="scroll-mt-32 bg-background" id="content" tabIndex={-1}>
        <section className="border-b border-divider bg-white">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 md:px-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-16 lg:py-12">
            <div>
              <p className="eyebrow text-ember-ink">Buyer command center</p>
              <h1 className="mt-4 max-w-3xl font-display text-[clamp(3rem,5.5vw,5.25rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
                Your demand,<br />organized.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-subtle md:text-lg">
                Review every request, compare qualified offers, and choose the fit you can explain.
              </p>
            </div>
            <dl className="enterprise-panel grid grid-cols-2 divide-x divide-divider overflow-hidden">
              <div className="min-w-0 px-4 py-5 lg:min-w-36 lg:px-6">
                <dt className="eyebrow text-subtle">Active requests</dt>
                <dd className="metric-number mt-2 font-display text-4xl font-semibold">
                  {String(dashboard.data.activeRequests).padStart(2, "0")}
                </dd>
              </div>
              <div className="min-w-0 px-4 py-5 lg:min-w-36 lg:px-6">
                <dt className="eyebrow text-ember-ink">New bids</dt>
                <dd className="metric-number mt-2 font-display text-4xl font-semibold">
                  {String(dashboard.data.newBids).padStart(2, "0")}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {notice ? (
          <div className="border-b border-ember/30 bg-ember/[0.045]" role="status">
            <div className="mx-auto flex min-h-14 max-w-[1440px] items-center justify-between gap-4 px-5 text-sm md:px-10 lg:px-16">
              <span>{notice}</span>
              <button className="min-h-11 px-3 font-semibold text-ember-ink" onClick={() => setNotice(null)} type="button">Dismiss</button>
            </div>
          </div>
        ) : null}

        <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] gap-6 px-5 py-8 md:px-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-16 lg:py-10">
          <aside aria-label="Your requests" className="enterprise-panel min-w-0 self-start p-4 lg:sticky lg:top-24">
            <label className="relative block" htmlFor="request-search">
              <span className="sr-only">Search your requests</span>
              <Search aria-hidden="true" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-subtle" />
              <Input
                className="pl-11"
                id="request-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search requests"
                type="search"
                value={search}
              />
            </label>

            <div aria-label="Filter requests" className="mt-5 grid gap-2 min-[480px]:grid-cols-2 lg:grid-cols-1" role="group">
              {filters.map((item) => (
                <button
                  aria-pressed={filter === item.id}
                  className={cn(
                    "flex min-h-11 min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    filter === item.id ? "bg-muted font-semibold" : "text-subtle hover:bg-muted/60 hover:text-foreground",
                  )}
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  type="button"
                >
                  {item.id !== "all" ? <span className={cn("size-2 rounded-full", statusDot(item.id))} /> : null}
                  <span>{item.label}</span>
                  <span className="ml-auto tabular-nums text-subtle">{counts[item.id]}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 border-t border-divider pt-5">
              <p className="eyebrow mb-3 text-subtle">Requests</p>
              <div className="space-y-1">
                {visibleRequests.map((request) => (
                  <button
                    aria-current={request.id === selectedRequest.id ? "true" : undefined}
                    className={cn(
                      "w-full rounded-[6px] border-l-2 px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                      request.id === selectedRequest.id
                        ? "border-ember bg-muted/70"
                        : "border-transparent hover:bg-muted/50",
                    )}
                    key={request.id}
                    onClick={() => chooseRequest(request)}
                    type="button"
                  >
                    <span className="line-clamp-2 text-sm font-semibold leading-snug">{request.title}</span>
                    <span className="mt-1.5 flex items-center gap-2 text-xs text-subtle">
                      <span className={cn("size-1.5 rounded-full", statusDot(request.status))} />
                      {request.statusLabel} · {request.bidCount} {request.bidCount === 1 ? "bid" : "bids"}
                    </span>
                  </button>
                ))}
                {visibleRequests.length === 0 ? (
                  <p className="px-3 py-6 text-sm leading-relaxed text-subtle">No requests match this filter.</p>
                ) : null}
              </div>
            </div>

            <div className="mt-10 border-t border-divider pt-6 text-xs leading-relaxed text-subtle">
              <ShieldCheck aria-hidden="true" className="mb-3 size-5 text-foreground" />
              Your exact address and contact details stay private until you accept a bid.
            </div>
          </aside>

          <section aria-labelledby="active-request-title" className="enterprise-panel min-w-0 p-5 md:p-7" id="request-summary">
            <div className="flex flex-col justify-between gap-6 border-b border-foreground pb-7 sm:flex-row sm:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("inline-flex min-h-7 items-center gap-2 rounded-full border px-3 text-[11px] font-bold uppercase tracking-[0.09em]", selectedRequest.status === "ready" ? "border-ember/40 text-ember-ink" : "border-divider text-subtle")}>
                    <span className={cn("size-1.5 rounded-full", statusDot(selectedRequest.status))} />
                    {selectedRequest.statusLabel}
                  </span>
                  <span className="text-sm text-subtle">Request #{selectedRequest.id}</span>
                </div>
                <h2 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-[-0.045em] md:text-5xl" id="active-request-title">
                  {selectedRequest.title}
                </h2>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-subtle">
                  <span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" className="size-4" />{selectedRequest.deadline}</span>
                  <span className="inline-flex items-center gap-2"><MapPin aria-hidden="true" className="size-4" />{selectedRequest.neighborhood}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button onClick={() => setNotice("Editing is available while this request is still collecting bids.")} size="sm" variant="ghost">
                  <Pencil aria-hidden="true" className="size-4" /> Edit
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/requests/${selectedRequest.id}`}>Public view <ArrowRight aria-hidden="true" className="size-4" /></Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-b border-divider bg-divider sm:grid-cols-4">
              {[
                ["Category", selectedRequest.category],
                ["Budget", selectedRequest.budget],
                ["Posted", selectedRequest.posted],
                ["Qualified bids", String(selectedRequest.bidCount).padStart(2, "0")],
              ].map(([label, value]) => (
                <div className="bg-white px-4 py-5" key={label}>
                  <p className="eyebrow text-subtle">{label}</p>
                  <p className="mt-2 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>

            {selectedRequest.status === "matched" ? <div className="mt-8 rounded-xl border border-divider bg-muted p-5" role="status">
              <p className="font-semibold">Matched with {selectedRequest.acceptedSeller}. Fulfillment is pending.</p>
              <Button asChild className="mt-4" variant="outline"><Link href={selectedRequest.bids.find((bid) => bid.status === "accepted")?.conversationId ? `/messages?conversation=${encodeURIComponent(selectedRequest.bids.find((bid) => bid.status === "accepted")!.conversationId!)}` : "/messages"}>Open conversation</Link></Button>
            </div> : null}

            {selectedRequest.bids.length > 0 ? (
              <>
                <div className="mt-11 flex items-end justify-between gap-6">
                  <div>
                    <p className="eyebrow text-subtle">Qualified responses</p>
                    <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.045em]">Compare the whole offer.</h3>
                  </div>
                  <p className="hidden max-w-xs text-right text-xs leading-relaxed text-subtle md:block">
                    EMBER’s recommendation weighs schedule, distance, seller history, and stated requirements—not price alone.
                  </p>
                </div>
                <div className="mt-7 grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2 min-[1400px]:grid-cols-3">
                  {selectedRequest.bids.map((bid) => (
                    <BidCard
                      bid={bid}
                      key={bid.id}
                      onProposal={() => setProposalBid(bid)}
                      onSelect={() => setSelectedBidId(bid.id)}
                      selected={bid.id === selectedBidId}
                    />
                  ))}
                </div>

                {selectedBid?.status === "active" ? (
                  <div className="enterprise-panel-raised mt-8 p-3 md:p-4 xl:flex xl:items-center xl:justify-between xl:gap-6">
                    <div className="px-2 py-2">
                      <p className="eyebrow text-subtle">Selected offer</p>
                      <p className="mt-1 font-semibold">{selectedBid.seller} · {money(selectedBid.totalPrice)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <Button onClick={() => messageSeller(selectedBid)} variant="outline">
                        <MessageCircle aria-hidden="true" className="size-4" /> Message
                      </Button>
                      <Button disabled={decision.isPending} onClick={declineSelected} variant="ghost">Decline</Button>
                      <Button className="col-span-2 sm:col-span-1" disabled={decision.isPending} onClick={() => setAcceptBid(selectedBid)} variant="ember">
                        Accept bid
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyRequestState request={selectedRequest} />
            )}

            {decision.error ? (
              <p className="mt-4 rounded-[6px] border border-error bg-error/5 p-4 text-sm font-semibold text-error" role="alert">
                {decision.error.message}
              </p>
            ) : null}
          </section>
        </div>
      </main>

      <footer className="border-t border-divider bg-muted px-5 py-14 md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="font-display text-3xl font-semibold tracking-[-0.05em]">EMBER</p>
            <p className="mt-2 text-sm text-subtle">Where demand sparks opportunity.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-subtle">
            <Link className="hover:text-foreground" href="/">Discover</Link>
            <Link className="hover:text-foreground" href="/buyer">Buyer dashboard</Link>
            <Link className="hover:text-foreground" href="/requests/new">Post a request</Link>
          </nav>
          <p className="text-xs text-subtle">© 2026 EMBER Marketplace.</p>
        </div>
      </footer>

      <Dialog onOpenChange={(open) => !open && setProposalBid(null)} open={Boolean(proposalBid)}>
        <DialogContent>
          <DialogHeader>
            <p className="eyebrow mb-3 text-ember-ink">Full proposal</p>
            <DialogTitle>{proposalBid?.seller}</DialogTitle>
            <DialogDescription>
              Submitted for “{selectedRequest.title}” · {money(proposalBid?.totalPrice ?? 0)} total
            </DialogDescription>
          </DialogHeader>
          <div className="mt-8 border-y border-divider py-6 text-[15px] leading-7">
            {proposalBid?.proposal}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-subtle">Cadence</p><p className="mt-1 font-semibold">{proposalBid?.cadence}</p></div>
            <div><p className="text-subtle">Earliest start</p><p className="mt-1 font-semibold">{proposalBid?.earliestStart}</p></div>
          </div>
          <div className="mt-8 flex flex-wrap justify-end gap-2">
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            {proposalBid ? <Button onClick={() => { setSelectedBidId(proposalBid.id); setProposalBid(null); setAcceptBid(proposalBid) }} variant="ember">Choose this bid</Button> : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => !open && setAcceptBid(null)} open={Boolean(acceptBid)}>
        <DialogContent>
          <DialogHeader>
            <p className="eyebrow mb-3 text-ember-ink">Confirm match</p>
            <DialogTitle>Accept {acceptBid?.seller}’s bid?</DialogTitle>
            <DialogDescription>
              This closes bidding for the request and opens a private conversation with the seller.
            </DialogDescription>
          </DialogHeader>
          <dl className="mt-8 divide-y divide-divider border-y border-divider">
            <div className="flex justify-between gap-5 py-4"><dt className="text-subtle">Four-week total</dt><dd className="font-semibold">{money(acceptBid?.totalPrice ?? 0)}</dd></div>
            <div className="flex justify-between gap-5 py-4"><dt className="text-subtle">Cadence</dt><dd className="text-right font-semibold">{acceptBid?.cadence}</dd></div>
            <div className="flex justify-between gap-5 py-4"><dt className="text-subtle">Earliest start</dt><dd className="text-right font-semibold">{acceptBid?.earliestStart}</dd></div>
          </dl>
          <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild><Button variant="outline">Keep comparing</Button></DialogClose>
            <Button disabled={decision.isPending} onClick={confirmAccept} variant="ember">
              {decision.isPending ? "Accepting…" : "Accept and open chat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
