"use client"

import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Info,
  MapPin,
  TrendingUp,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { type FormEvent, useMemo, useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateOfferDraft, useOpportunity, useSaveOpportunity } from "@/lib/opportunity"
import type { OfferDraftInput, TimelineRange } from "@/lib/opportunity-types"
import { cn } from "@/lib/utils"

const timelineRanges: TimelineRange[] = [2, 4, 6]

function OpportunityLoading() {
  return (
    <main className="min-h-svh bg-black text-white">
      <SiteHeader active="opportunities" variant="app" />
      <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 lg:px-16" id="content" tabIndex={-1} aria-busy="true" aria-label="Loading opportunity">
        <div className="h-4 w-44 animate-pulse rounded bg-white/15" />
        <div className="mt-8 h-72 max-w-4xl animate-pulse rounded-xl bg-white/10" />
        <div className="mt-12 h-14 w-72 animate-pulse rounded bg-white/10" />
      </div>
    </main>
  )
}

export function OpportunityDetail({ slug }: { slug: string }) {
  const opportunityQuery = useOpportunity(slug)
  const saveOpportunity = useSaveOpportunity(slug)
  const createOffer = useCreateOfferDraft()
  const [range, setRange] = useState<TimelineRange>(6)
  const [neighborhoodId, setNeighborhoodId] = useState("all")
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [readyItems, setReadyItems] = useState<string[]>([])
  const [offerInput, setOfferInput] = useState<Omit<OfferDraftInput, "slug">>({
    pricePerMeal: 17,
    weeklyCapacity: 146,
    deliveryDays: "Tuesday–Thursday",
    note: "",
  })

  const opportunity = opportunityQuery.data
  const timeline = useMemo(
    () => opportunity?.timeline.slice(-range) ?? [],
    [opportunity?.timeline, range],
  )
  const maxRequests = Math.max(...timeline.map((point) => point.requests), 1)
  const activeNeighborhood =
    neighborhoodId === "all"
      ? null
      : opportunity?.neighborhoods.find((item) => item.id === neighborhoodId)

  async function toggleSaved() {
    if (!opportunity) return
    const result = await saveOpportunity.mutateAsync({ slug, saved: !opportunity.saved })
    setNotice(result.saved ? "Opportunity saved to your seller workspace." : "Opportunity removed from saved items.")
  }

  function toggleReadyItem(item: string) {
    setReadyItems((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    )
  }

  async function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await createOffer.mutateAsync({ ...offerInput, slug })
  }

  function openOfferBuilder() {
    createOffer.reset()
    setOfferOpen(true)
  }

  if (opportunityQuery.isLoading) return <OpportunityLoading />

  if (opportunityQuery.isError || !opportunity) {
    return (
      <main className="min-h-svh bg-white">
        <SiteHeader active="opportunities" variant="app" />
        <section className="mx-auto max-w-3xl px-5 py-24 md:px-10" id="content" tabIndex={-1}>
          <p className="eyebrow text-error">Opportunity unavailable</p>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.05em]">The demand signal dropped.</h1>
          <p className="mt-5 text-subtle">{opportunityQuery.error?.message}</p>
          <Button className="mt-8" onClick={() => opportunityQuery.refetch()}>Try again</Button>
        </section>
      </main>
    )
  }

  return (
    <div className="min-h-svh bg-white text-foreground">
      <SiteHeader
        active="opportunities"
        variant="app"
      />

      {notice ? (
        <div className="fixed inset-x-0 top-[var(--app-header-height)] z-30 border-b border-ember/30 bg-white/95 backdrop-blur" role="status">
          <div className="mx-auto flex min-h-14 max-w-[1440px] items-center justify-between gap-4 px-5 text-sm md:px-10 lg:px-16">
            <span>{notice}</span>
            <button className="min-h-11 px-3 font-semibold text-ember-ink" onClick={() => setNotice(null)} type="button">Dismiss</button>
          </div>
        </div>
      ) : null}

      <main>
        <section className="relative isolate scroll-mt-32 overflow-hidden bg-black text-white" id="content" tabIndex={-1}>
          <Image
            alt="Creative teams sharing a weekday lunch in an East Austin studio"
            className="-z-20 object-cover object-center opacity-45 grayscale"
            fill
            priority
            sizes="100vw"
            src="/stitch/east-austin-office-lunch.jpg"
          />
          <div className="absolute inset-0 -z-10 bg-black/50" />
          <div className="mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-12 px-5 py-20 md:px-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,.55fr)] lg:px-16 lg:py-28">
            <div>
              <p className="eyebrow flex items-center gap-3 text-ember">
                <span className="size-2 rounded-full bg-ember" /> {opportunity.verifiedLabel}
              </p>
              <h1 className="mt-8 max-w-5xl font-display text-[clamp(3.3rem,7.5vw,7rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
                {opportunity.title}
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/62">{opportunity.description}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button onClick={openOfferBuilder} size="lg" variant="ember">
                  Build an offer <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  aria-pressed={opportunity.saved}
                  className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white focus-visible:ring-white focus-visible:ring-offset-black"
                  disabled={saveOpportunity.isPending}
                  onClick={toggleSaved}
                  size="lg"
                  variant="outline"
                >
                  {opportunity.saved ? <Check aria-hidden="true" className="size-4" /> : <Bookmark aria-hidden="true" className="size-4" />}
                  {opportunity.saved ? "Opportunity saved" : "Save opportunity"}
                </Button>
              </div>
            </div>

            <aside className="border border-white/16 bg-black/65 p-7 backdrop-blur-md md:p-10" aria-label="Opportunity headline metrics">
              <p className="eyebrow text-white/50">Active requests</p>
              <p className="mt-4 font-display text-8xl font-semibold leading-none tracking-[-0.065em]">{opportunity.requestCount}</p>
              <p className="mt-4 text-sm text-ember">Across {opportunity.organizationCount} local teams</p>
              <div className="my-9 h-px bg-white/15" />
              <p className="eyebrow text-white/50">Estimated weekly value</p>
              <p className="mt-4 font-display text-6xl font-semibold tracking-[-0.055em]">{opportunity.weeklyValue}</p>
              <div className="mt-9 flex items-center gap-2 text-sm text-white/55">
                <Clock3 aria-hidden="true" className="size-4" /> {opportunity.refreshedAt}
              </div>
            </aside>
          </div>
        </section>

        <section aria-label="Opportunity specifications" className="border-b border-divider bg-white">
          <dl className="mx-auto grid max-w-[1440px] grid-cols-2 px-5 md:px-10 lg:grid-cols-5 lg:px-16">
            {opportunity.metrics.map((metric, index) => (
              <div className={cn("border-divider py-8", index % 2 === 0 ? "pr-5" : "border-l pl-5", index > 1 && "border-t lg:border-t-0", index > 0 && "lg:border-l lg:px-8", index === 0 && "lg:pl-0")} key={metric.label}>
                <dt className="eyebrow text-subtle">{metric.label}</dt>
                <dd className="mt-3 font-display text-5xl font-semibold tracking-[-0.055em]">{metric.value}</dd>
                <p className="mt-2 text-xs text-subtle">{metric.detail}</p>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-background px-5 py-20 md:px-10 md:py-28 lg:px-16 lg:py-36">
          <div className="mx-auto grid max-w-[1440px] min-w-0 gap-14 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
            <aside className="min-w-0">
              <p className="eyebrow text-ember-ink">Buyer analysis</p>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-5xl">Where demand concentrates.</h2>
              <p className="mt-5 leading-relaxed text-subtle">Select a neighborhood to inspect its contribution to the cluster.</p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:block lg:space-y-2" role="group" aria-label="Neighborhood focus">
                <button
                  aria-pressed={neighborhoodId === "all"}
                  className={cn("flex min-h-14 min-w-48 items-center justify-between gap-4 rounded-[6px] border px-4 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember lg:w-full", neighborhoodId === "all" ? "border-foreground bg-foreground text-white" : "border-divider bg-white")}
                  onClick={() => setNeighborhoodId("all")}
                  type="button"
                >
                  <span><strong>All East Austin</strong><span className="mt-1 block text-xs opacity-65">100% of volume</span></span>
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
                {opportunity.neighborhoods.map((neighborhood) => (
                  <button
                    aria-pressed={neighborhoodId === neighborhood.id}
                    className={cn("flex min-h-14 min-w-48 items-center justify-between gap-4 rounded-[6px] border px-4 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember lg:w-full", neighborhoodId === neighborhood.id ? "border-foreground bg-foreground text-white" : "border-divider bg-white hover:border-subtle")}
                    key={neighborhood.id}
                    onClick={() => setNeighborhoodId(neighborhood.id)}
                    type="button"
                  >
                    <span><strong>{neighborhood.name}</strong><span className="mt-1 block text-xs opacity-65">{neighborhood.share}% of volume</span></span>
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </button>
                ))}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <div>
                  <p className="eyebrow text-subtle">Demand velocity</p>
                  <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] md:text-5xl">Momentum, week by week.</h2>
                </div>
                <div className="inline-flex w-fit rounded-[6px] border border-divider bg-muted p-1" role="group" aria-label="Timeline range">
                  {timelineRanges.map((value) => (
                    <button
                      aria-pressed={range === value}
                      className={cn("min-h-11 min-w-14 rounded-[4px] px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember", range === value ? "bg-white text-foreground shadow-sm" : "text-subtle")}
                      key={value}
                      onClick={() => setRange(value)}
                      type="button"
                    >
                      {value}W
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-9 border border-divider bg-white p-5 md:p-8">
                <div className="flex items-start justify-between gap-6 border-b border-divider pb-6" aria-live="polite">
                  <div>
                    <p className="eyebrow text-subtle">Current focus</p>
                    <p className="mt-2 font-semibold">{activeNeighborhood?.name ?? "All East Austin"}</p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-subtle">
                      {activeNeighborhood?.insight ?? "Twenty-eight overlapping requests across four neighborhoods create a practical shared delivery route."}
                    </p>
                  </div>
                  {activeNeighborhood ? (
                    <div className="shrink-0 text-right"><p className="font-display text-3xl font-semibold">{activeNeighborhood.meals}</p><p className="text-xs text-subtle">weekly meals</p></div>
                  ) : null}
                </div>
                <figure className="mt-8" aria-label={`${range}-week request volume timeline`}>
                  <div className="grid h-72 items-end gap-3 border-b border-divider sm:gap-6" style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))` }}>
                    {timeline.map((point, index) => (
                      <div className="flex h-full min-w-0 flex-col justify-end" key={point.label}>
                        <span className="mb-2 text-center text-xs font-semibold tabular-nums">{point.requests}</span>
                        <div
                          className={cn("mx-auto w-full max-w-16 bg-foreground/16 transition-[height,background-color] duration-300", index === timeline.length - 1 && "bg-ember")}
                          style={{ height: `${Math.max((point.requests / maxRequests) * 84, 8)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <figcaption className="mt-4 grid gap-3 text-center text-[11px] text-subtle" style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))` }}>
                    {timeline.map((point) => <span key={point.label}>{point.label}</span>)}
                  </figcaption>
                </figure>
                <div className="mt-8 flex items-center gap-3 border-t border-divider pt-6 text-sm">
                  <TrendingUp aria-hidden="true" className="size-5 text-ember" />
                  <span><strong>5× growth</strong> from the first observed week to the current period.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 md:px-10 md:py-28 lg:px-16 lg:py-36">
          <div className="mx-auto grid max-w-[1440px] gap-20 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="eyebrow text-ember-ink">Buyer evidence</p>
              <h2 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.055em]">What buyers are asking for.</h2>
              <div className="mt-10 divide-y divide-divider border-y border-divider">
                {opportunity.excerpts.map((excerpt) => (
                  <blockquote className="py-6" key={excerpt.id}>
                    <p className="text-lg leading-relaxed">“{excerpt.quote}”</p>
                    <footer className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
                      <span>{excerpt.organization}</span><span>{excerpt.cadence}</span>
                    </footer>
                  </blockquote>
                ))}
              </div>
              <dl className="mt-10 divide-y divide-divider">
                {opportunity.requirements.map((item) => (
                  <div className="grid gap-2 py-4 text-sm sm:grid-cols-[180px_1fr]" key={item.label}>
                    <dt className="text-subtle">{item.label}</dt>
                    <dd className="font-semibold sm:text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <p className="eyebrow text-ember">Transparent methodology</p>
              <h2 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.055em]">Why this signal is credible.</h2>
              <dl className="mt-10 grid grid-cols-2 gap-px bg-divider">
                {opportunity.evidence.map((item) => (
                  <div className="bg-white p-5 md:p-7" key={item.label}>
                    <dt className="eyebrow text-subtle">{item.label}</dt>
                    <dd className="mt-3 font-display text-4xl font-semibold tracking-[-0.055em]">{item.value}</dd>
                    <p className="mt-2 text-xs text-subtle">{item.detail}</p>
                  </div>
                ))}
              </dl>
              <Button className="mt-6" onClick={() => setMethodologyOpen(true)} variant="outline">
                <Info aria-hidden="true" className="size-4" /> See how EMBER calculates this
              </Button>

              <div className="mt-12 border border-divider bg-background p-6 md:p-8">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="eyebrow text-subtle">Seller readiness</p>
                    <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em]">Can your operation cover the pattern?</h3>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{readyItems.length}/{opportunity.readiness.length}</span>
                </div>
                <div className="mt-6 space-y-2">
                  {opportunity.readiness.map((item) => {
                    const checked = readyItems.includes(item)
                    return (
                      <button
                        aria-pressed={checked}
                        className="flex min-h-12 w-full items-center gap-3 rounded-[6px] px-2 text-left text-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
                        key={item}
                        onClick={() => toggleReadyItem(item)}
                        type="button"
                      >
                        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border", checked ? "border-ember bg-ember text-white" : "border-subtle")}>
                          {checked ? <Check aria-hidden="true" className="size-3.5" /> : null}
                        </span>
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-black px-5 py-24 text-white md:px-10 md:py-32 lg:px-16 lg:py-40">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <p className="eyebrow text-ember">Demand is already visible</p>
            <h2 className="mt-7 font-display text-[clamp(3.3rem,7vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.06em]">Ready to fulfill this demand?</h2>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/58">Turn the shared buyer pattern into one clear offer. EMBER will show it to the teams whose timing, budget, and location already align.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button onClick={openOfferBuilder} size="lg" variant="ember">Build an offer <ArrowRight aria-hidden="true" className="size-4" /></Button>
              <Button
                aria-pressed={opportunity.saved}
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white focus-visible:ring-white focus-visible:ring-offset-black"
                disabled={saveOpportunity.isPending}
                onClick={toggleSaved}
                size="lg"
                variant="outline"
              >
                {opportunity.saved ? <Check aria-hidden="true" className="size-4" /> : <Bookmark aria-hidden="true" className="size-4" />}
                {opportunity.saved ? "Saved" : "Save opportunity"}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/15 bg-black px-5 py-12 text-white md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 md:flex-row md:items-end">
          <div><p className="font-display text-3xl font-semibold tracking-[-0.05em]">EMBER</p><p className="mt-2 text-sm text-white/50">Where demand sparks opportunity.</p></div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/50">
            <Link className="hover:text-white" href="/">Discover</Link>
            <Link className="hover:text-white" href="/buyer">Buyer dashboard</Link>
            <Link className="hover:text-white" href="/requests/new">Post a request</Link>
          </nav>
          <p className="text-xs text-white/55">© 2026 EMBER Marketplace.</p>
        </div>
      </footer>

      <Dialog onOpenChange={setMethodologyOpen} open={methodologyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <p className="eyebrow mb-3 text-ember">Evidence methodology</p>
            <DialogTitle>How EMBER forms a demand cluster</DialogTitle>
            <DialogDescription>We group compatible buyer intent without revealing any buyer’s identity or precise address.</DialogDescription>
          </DialogHeader>
          <div className="mt-8 divide-y divide-divider border-y border-divider">
            {opportunity.evidence.map((item) => (
              <div className="grid gap-3 py-5 sm:grid-cols-[150px_1fr]" key={item.label}>
                <div><p className="font-display text-2xl font-semibold">{item.value}</p><p className="mt-1 text-xs text-subtle">{item.label}</p></div>
                <p className="text-sm leading-relaxed text-subtle">{item.explanation}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 flex gap-3 text-sm leading-relaxed text-subtle"><MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0" />Location is softened to neighborhood-level evidence until a buyer accepts an offer.</p>
          <div className="mt-8 flex justify-end"><DialogClose asChild><Button variant="outline">Close methodology</Button></DialogClose></div>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={(open) => { setOfferOpen(open); if (!open) createOffer.reset() }} open={offerOpen}>
        <DialogContent className="max-w-2xl">
          {createOffer.data ? (
            <div>
              <div className="grid size-12 place-items-center rounded-full bg-success text-white"><CircleCheck aria-hidden="true" className="size-6" /></div>
              <p className="eyebrow mt-7 text-success">Offer draft created · {createOffer.data.draftId}</p>
              <DialogTitle className="mt-3">Your launch point is ready.</DialogTitle>
              <DialogDescription>EMBER saved the capacity, schedule, and pricing assumptions. You can refine proof, menus, and fulfillment terms before publishing.</DialogDescription>
              <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogClose asChild><Button variant="outline">Return to opportunity</Button></DialogClose>
                <Button
                  onClick={() => {
                    setNotice(`Offer ${createOffer.data?.draftId} is saved as a private draft.`)
                    setOfferOpen(false)
                  }}
                >
                  Save and continue later
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submitOffer}>
              <DialogHeader>
                <p className="eyebrow mb-3 text-ember">Build from verified demand</p>
                <DialogTitle>Shape an offer for 28 teams.</DialogTitle>
                <DialogDescription>Start with the operating assumptions. Nothing is published from this step.</DialogDescription>
              </DialogHeader>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div><Label htmlFor="offer-price">Price per meal</Label><Input className="mt-2" id="offer-price" min="8" onChange={(event) => setOfferInput((current) => ({ ...current, pricePerMeal: Number(event.target.value) }))} required type="number" value={offerInput.pricePerMeal} /></div>
                <div><Label htmlFor="offer-capacity">Weekly meal capacity</Label><Input className="mt-2" id="offer-capacity" min="20" onChange={(event) => setOfferInput((current) => ({ ...current, weeklyCapacity: Number(event.target.value) }))} required type="number" value={offerInput.weeklyCapacity} /></div>
                <div className="sm:col-span-2"><Label htmlFor="offer-days">Delivery schedule</Label><select className="mt-2 min-h-12 w-full rounded-[6px] border border-divider bg-white px-4 focus:outline-none focus:ring-2 focus:ring-ember/35" id="offer-days" onChange={(event) => setOfferInput((current) => ({ ...current, deliveryDays: event.target.value }))} value={offerInput.deliveryDays}><option>Tuesday–Thursday</option><option>Monday–Friday</option><option>Wednesday only</option></select></div>
                <div className="sm:col-span-2"><Label htmlFor="offer-note">Fulfillment note (optional)</Label><Textarea className="mt-2" id="offer-note" onChange={(event) => setOfferInput((current) => ({ ...current, note: event.target.value }))} placeholder="Explain packaging, dietary coverage, or delivery logistics…" value={offerInput.note} /></div>
              </div>
              {createOffer.error ? <p className="mt-5 rounded-[6px] border border-error bg-error/5 p-4 text-sm font-semibold text-error" role="alert">{createOffer.error.message}</p> : null}
              <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button disabled={createOffer.isPending} type="submit" variant="ember">{createOffer.isPending ? "Creating draft…" : "Create offer draft"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
