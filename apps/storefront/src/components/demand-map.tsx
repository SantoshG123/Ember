"use client"

import {
  ArrowRight,
  ChevronDown,
  LocateFixed,
  Minus,
  Plus,
  SlidersHorizontal,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMarketplaceMode } from "@/lib/marketplace-data"
import { MarketplaceState } from "@/components/marketplace-state"
import { PersistentDemand } from "@/components/persistent-demand"

const clusters = [
  {
    id: "meals",
    count: 18,
    title: "Homemade meals",
    area: "South Austin · 78704",
    signal: "$21 avg / meal",
    x: "45%",
    y: "55%",
    size: "h-24 w-24",
  },
  {
    id: "lawn",
    count: 12,
    title: "Recurring lawn care",
    area: "East Austin · 78702",
    signal: "$84 median budget",
    x: "67%",
    y: "34%",
    size: "h-20 w-20",
  },
  {
    id: "tutoring",
    count: 8,
    title: "Calculus tutoring",
    area: "West Campus · 78705",
    signal: "$48 avg / hour",
    x: "31%",
    y: "29%",
    size: "h-16 w-16",
  },
  {
    id: "lunch",
    count: 22,
    title: "Team lunches",
    area: "East Austin · 78702",
    signal: "$620 median budget",
    x: "73%",
    y: "66%",
    size: "h-28 w-28",
  },
]

const individualRequests = [
  ["R-8924", "Weekly Italian dinners", "$55–$75", "South Austin"],
  ["R-8918", "Friday office lunch for 16", "$480–$650", "East Austin"],
  ["R-8907", "Front-yard reset", "$140–$190", "Mueller"],
] as const

export function DemandMap() {
  const config = useMarketplaceMode()
  if (config.isPending) return <MarketplaceState loading title="Opening local demand…" message="Checking the marketplace connection." />
  if (config.isError || config.data?.mode === "unavailable") return <MarketplaceState title="Marketplace unavailable" message="The marketplace connection is not configured." retry={() => void config.refetch()} />
  return config.data?.mode === "medusa" ? <PersistentDemand /> : <DemoDemandMap />
}

function DemoDemandMap() {
  const [mode, setMode] = useState<"opportunities" | "requests">("opportunities")
  const [selectedId, setSelectedId] = useState("meals")
  const [category, setCategory] = useState("All categories")
  const [sort, setSort] = useState("Highest demand")
  const selected = useMemo(
    () => clusters.find((cluster) => cluster.id === selectedId) ?? clusters[0],
    [selectedId],
  )

  return (
    <main className="min-h-svh bg-background text-foreground">
      <SiteHeader active="demand" messageCount={2} variant="app" />

      <section className="mx-auto max-w-[1440px] scroll-mt-32 px-5 pb-8 pt-10 md:px-10 lg:px-16 lg:pt-14" id="content" tabIndex={-1}>
        <div className="flex flex-col justify-between gap-8 border-b border-divider pb-10 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow mb-4 text-subtle">Live marketplace evidence</p>
            <h1 className="font-display text-[clamp(3.1rem,6vw,5.5rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
              Demand across
              <br />
              Austin
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Approximate locations for 186 active requests across 24 local clusters.
              Exact buyer addresses stay private.
            </p>
          </div>
          <div className="flex items-center gap-3 border-t border-divider pt-5 lg:border-0 lg:pt-0">
            <LocateFixed aria-hidden="true" className="size-5" />
            <div>
              <p className="text-sm font-semibold">Austin, Texas</p>
              <p className="text-xs text-subtle">Updated 4 minutes ago</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-5 pb-16 md:px-10 lg:grid-cols-[390px_minmax(0,1fr)] lg:px-16">
        <aside className="enterprise-panel min-w-0 overflow-hidden">
          <div aria-label="Demand view" className="grid grid-cols-2 gap-1 bg-muted p-1.5" role="group">
            {(["opportunities", "requests"] as const).map((item) => (
              <button
                aria-pressed={mode === item}
                className={cn(
                  "min-h-11 rounded-[5px] px-3 text-sm font-semibold capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
                  mode === item ? "bg-white text-black shadow-sm" : "text-subtle hover:text-black",
                )}
                key={item}
                onClick={() => setMode(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid gap-3 border-b border-divider p-4 min-[480px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className="relative">
              <span className="sr-only">Category</span>
              <select
                className="min-h-12 w-full min-w-0 appearance-none rounded-lg border border-divider bg-white px-3 pr-8 text-base font-semibold outline-none focus:border-black focus:ring-2 focus:ring-ring sm:text-sm"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option>All categories</option>
                <option>Food</option>
                <option>Home services</option>
                <option>Learning</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3.5 size-4" />
            </label>
            <label className="relative">
              <span className="sr-only">Sort results</span>
              <select
                className="min-h-12 w-full min-w-0 appearance-none rounded-lg border border-divider bg-white px-3 pr-8 text-base font-semibold outline-none focus:border-black focus:ring-2 focus:ring-ring sm:text-sm"
                onChange={(event) => setSort(event.target.value)}
                value={sort}
              >
                <option>Highest demand</option>
                <option>Nearest first</option>
                <option>Newest first</option>
              </select>
              <SlidersHorizontal className="pointer-events-none absolute right-3 top-3.5 size-4" />
            </label>
          </div>

          <div aria-live="polite" className="divide-y divide-divider">
            {mode === "opportunities"
              ? clusters.slice(0, 3).map((cluster) => (
                  <button
                    aria-pressed={selectedId === cluster.id}
                    className={cn(
                      "w-full border-l-4 p-5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black",
                      selectedId === cluster.id
                        ? "border-ember bg-muted"
                        : "border-transparent bg-white hover:bg-muted/70",
                    )}
                    key={cluster.id}
                    onClick={() => setSelectedId(cluster.id)}
                    type="button"
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <span className="font-display text-4xl font-semibold tracking-[-0.06em]">
                        {cluster.count}
                      </span>
                      <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                        active
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-semibold tracking-[-0.04em]">
                      {cluster.title}
                    </h2>
                    <p className="mt-2 text-sm text-subtle">{cluster.area}</p>
                    <p className="mt-1 text-sm font-semibold">{cluster.signal}</p>
                  </button>
                ))
              : individualRequests.map(([id, title, budget, area]) => (
                  <Link
                    className="block border-l-4 border-transparent p-5 transition-colors hover:border-ember hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-black"
                    href={`/requests/${id}`}
                    key={id}
                  >
                    <p className="eyebrow text-subtle">{id} · {area}</p>
                    <h2 className="mt-2 font-display text-xl font-semibold tracking-[-0.04em]">{title}</h2>
                    <p className="mt-3 text-sm font-semibold">{budget}</p>
                  </Link>
                ))}
          </div>
        </aside>

        <div className="enterprise-panel flex min-w-0 flex-col overflow-hidden bg-[#e8e8ea] lg:min-h-[760px]">
          <div className="relative isolate min-h-[420px] flex-1 sm:min-h-[480px]">
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-70" preserveAspectRatio="none" viewBox="0 0 900 760">
            <path d="M-100 90 980 690M-130 260 760 800M40 -40 960 470M220 -40 980 330M930 -50-80 590M980 150 80 790M710 -40-80 480M430 -40-80 280" fill="none" stroke="white" strokeWidth="3" />
            <path d="M-80 190 880 760M40 -30 940 520M890 -30-30 620M650 -40-60 470" fill="none" stroke="#c7c7cc" strokeWidth="3" />
            <circle cx="510" cy="340" fill="#f7f7f8" r="115" />
          </svg>
          <div aria-label="Demand clusters on an approximate Austin map" className="absolute inset-0">
            {clusters.map((cluster) => (
              <button
                aria-label={`${cluster.count} requests for ${cluster.title}`}
                aria-pressed={selectedId === cluster.id}
                className={cn(
                  "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-sm font-bold shadow-xl transition-transform focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-black",
                  cluster.size,
                  selectedId === cluster.id
                    ? "z-20 scale-110 border-black bg-ember-action text-white"
                    : "z-10 border-white/80 bg-black text-white hover:scale-105",
                )}
                key={cluster.id}
                onClick={() => setSelectedId(cluster.id)}
                style={{ left: cluster.x, top: cluster.y }}
                type="button"
              >
                {cluster.count}
              </button>
            ))}
          </div>

          <div className="absolute left-4 top-4 z-30 flex flex-col overflow-hidden rounded-lg border border-divider bg-white shadow-sm md:left-auto md:right-5 md:top-5">
            <button aria-label="Zoom in" className="grid size-11 place-items-center hover:bg-muted" type="button"><Plus className="size-4" /></button>
            <button aria-label="Zoom out" className="grid size-11 place-items-center border-t border-divider hover:bg-muted" type="button"><Minus className="size-4" /></button>
          </div>
          </div>

          <article aria-live="polite" className="enterprise-panel-raised relative z-30 m-4 mt-0 p-5 md:m-5 md:mt-0 md:p-6">
            <p className="eyebrow text-ember-ink">Selected cluster</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.05em]">
              {selected.count} requests for {selected.title.toLowerCase()}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-subtle">
              {selected.area}. Locations are generalized to protect buyers until they accept an offer.
            </p>
            <div className="mt-5 grid gap-3 min-[480px]:grid-cols-2">
              <Button asChild variant="ember">
                <Link href="/opportunities/east-austin-team-lunch">
                  Explore <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline"><Link href="/requests/R-8924">View requests</Link></Button>
            </div>
          </article>
        </div>
      </section>

      <footer className="border-t border-divider bg-white px-5 py-8 text-center text-sm text-subtle">
        EMBER uses approximate areas—not exact addresses—to reveal viable local opportunity.
      </footer>
    </main>
  )
}
