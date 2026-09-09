import {
  ArrowRight,
  CircleCheck,
  Eye,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { fetchMarketplaceData, getMarketplaceMode } from "@/lib/marketplace-server"
import type { MarketplaceRequestRecord } from "@/lib/marketplace-types"

export const dynamic = "force-dynamic"

const nearby = [
  {
    count: "12 requests",
    title: "Weekly lawn care",
    area: "South Austin · 3.1 mi",
    budget: "$74–$110 / visit",
  },
  {
    count: "8 requests",
    title: "Calculus tutoring",
    area: "West Campus · 2.4 mi",
    budget: "$42–$65 / hour",
  },
  {
    count: "6 requests",
    title: "Custom floating shelves",
    area: "Central Austin · 4.7 mi",
    budget: "$280–$460",
  },
]

export default async function HomePage() {
  const persistent = getMarketplaceMode() !== "demo"
  let requests: MarketplaceRequestRecord[] = []
  let unavailable = false
  if (persistent) {
    try { requests = (await fetchMarketplaceData<{ requests: MarketplaceRequestRecord[] }>("requests", { actor: "seller" })).requests }
    catch { unavailable = true }
  }
  const areas = new Set(requests.map((request) => request.zip)).size
  const categories = new Set(requests.map((request) => request.category)).size
  const highestBudget = Math.max(0, ...requests.map((request) => request.budgetMax))
  const listings = persistent ? requests.slice(0, 3).map((request) => ({ id: request.id, count: request.category, title: request.title, area: `${request.locationArea} · ${request.zip}`, budget: `$${request.budgetMin.toLocaleString()}–$${request.budgetMax.toLocaleString()}` })) : nearby.map((request) => ({ ...request, id: "R-8924" }))
  const metrics = persistent ? [[String(requests.length), "Open requests"], [String(areas), "ZIP-code areas"], [String(categories), "Categories"], [`$${highestBudget.toLocaleString()}`, "Highest listed budget"]] : [["186", "Active requests"], ["24", "Local clusters"], ["62", "Verified sellers"], ["91%", "Requests answered"]]
  return (
    <main className="min-h-svh overflow-x-clip bg-background text-foreground">
      <SiteHeader active="discover" messageCount={persistent ? 0 : 2} variant="app" />

      <section className="mx-auto grid min-h-[760px] max-w-[1440px] scroll-mt-32 lg:grid-cols-[1.2fr_0.8fr]" id="content" tabIndex={-1}>
        <div className="flex flex-col justify-between px-5 py-14 md:px-10 lg:px-16 lg:py-20">
          <div>
            <p className="eyebrow mb-7 text-subtle">Austin · Demand-first marketplace</p>
            <h1 className="max-w-5xl font-display text-[clamp(4rem,8.3vw,8.2rem)] font-semibold leading-[0.86] tracking-[-0.07em]">
              Where demand
              <br />
              sparks opportunity.
            </h1>
          </div>
          <div className="mt-16 border-t border-divider pt-7">
            <p className="max-w-xl text-lg leading-relaxed text-subtle md:text-xl">
              Ask for what you need. Trusted local sellers respond with clear offers—while aggregated requests reveal where the next opportunity is forming.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="ember">
                <Link href="/requests/new">Post a request <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline"><Link href="/demand">Explore local demand</Link></Button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[620px] overflow-hidden bg-black text-white lg:min-h-0">
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-25" preserveAspectRatio="none" viewBox="0 0 600 760">
            <path d="M-80 130 680 610M-120 310 560 740M80 -40 680 340M620 -20-40 530M680 170 80 690M430 -40-40 340" fill="none" stroke="white" strokeWidth="2" />
          </svg>
          <div className="absolute left-[14%] top-[19%] size-16 rounded-full border border-white/50 bg-white/10" />
          <div aria-hidden="true" className="absolute right-[16%] top-[25%] grid size-28 place-items-center rounded-full border border-white bg-ember text-3xl font-bold shadow-[0_0_0_24px_rgba(255,59,48,0.13)]">{persistent ? unavailable ? "—" : requests.length : 18}</div>
          <div aria-hidden="true" className="absolute left-[25%] top-[48%] grid size-20 place-items-center rounded-full border border-white/60 bg-white text-xl font-bold text-black">{persistent ? unavailable ? "—" : areas : 12}</div>
          <div aria-hidden="true" className="absolute right-[23%] top-[58%] grid size-14 place-items-center rounded-full border border-white/60 bg-black text-sm font-bold">{persistent ? unavailable ? "—" : categories : 8}</div>
          <div className="absolute inset-x-5 bottom-5 border border-white/20 bg-black/85 p-6 backdrop-blur md:inset-x-8 md:bottom-8 md:p-8">
            <div className="flex items-center justify-between gap-5">
              <div><p className="eyebrow text-white/60">{persistent ? "Demand overview · schematic" : "Demand aperture · live"}</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em]">Austin is asking.</h2></div>
              <TrendingUp className="size-7 text-ember" />
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/58">{persistent ? unavailable ? "Marketplace data is temporarily unavailable. Open demand to retry the connection." : `${requests.length} open requests across ${areas} ZIP-code areas and ${categories} categories. Explore the published requests behind the signal.` : "186 active requests across 24 privacy-safe clusters. Explore the signal before you browse a listing."}</p>
            <Link className="mt-6 inline-flex min-h-11 items-center gap-2 border-b border-white text-sm font-semibold" href="/demand">Open demand map <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="border-y border-divider bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-divider md:grid-cols-4">
          {metrics.map(([value, label]) => (
            <div className="px-5 py-8 md:px-8 lg:px-16 lg:py-10" key={label}>
              <p className="font-display text-4xl font-semibold tracking-[-0.055em] lg:text-5xl">{unavailable ? "—" : value}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.08em] text-subtle">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {!persistent ? <section className="mx-auto grid max-w-[1440px] border-b border-divider bg-white lg:grid-cols-2">
        <div className="relative min-h-[520px] overflow-hidden bg-black">
          <Image
            alt="A local team lunch prepared for an EMBER demand cluster"
            className="object-cover grayscale"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            src="/stitch/east-austin-office-lunch.jpg"
          />
          <div className="absolute inset-0 bg-black/20" />
          <span className="absolute left-5 top-5 rounded-full bg-ember-action px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-white md:left-8 md:top-8">Surging demand</span>
        </div>
        <div className="flex flex-col justify-between p-6 md:p-10 lg:p-14">
          <div>
            <p className="eyebrow text-subtle">Featured opportunity · 78702</p>
            <h2 className="mt-5 font-display text-[clamp(2.7rem,5vw,5.4rem)] font-semibold leading-[0.9] tracking-[-0.065em]">East Austin teams need better lunch.</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-subtle">A verified cluster of 22 recurring office-lunch requests within 2.8 miles—enough evidence to launch a focused offer.</p>
          </div>
          <div className="mt-12">
            <div className="grid grid-cols-3 divide-x divide-divider border-y border-divider py-5">
              <HomeMetric value="22" label="requests" />
              <HomeMetric value="$620" label="median" />
              <HomeMetric value="4" label="sellers" />
            </div>
            <Button asChild className="mt-7" variant="ember"><Link href="/opportunities/east-austin-team-lunch">Inspect opportunity <ArrowRight className="size-4" /></Link></Button>
          </div>
        </div>
      </section> : null}

      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 lg:px-16 lg:py-24">
        <div className="flex flex-col justify-between gap-6 border-b border-black pb-7 md:flex-row md:items-end">
          <div><p className="eyebrow text-subtle">{persistent ? "Published demand" : "Near you now"}</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.055em] md:text-6xl">{persistent ? "Latest requests." : "Most requested."}</h2></div>
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4" href="/demand">View all demand <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid divide-y divide-divider md:grid-cols-3 md:divide-x md:divide-y-0">
          {listings.map((request, index) => (
            <Link className="group py-8 md:px-7 md:first:pl-0 md:last:pr-0" href={`/requests/${request.id}`} key={request.id + index}>
              <div className="flex items-center justify-between gap-4"><span className="eyebrow text-ember-ink">0{index + 1}</span><span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">{request.count}</span></div>
              <h3 className="mt-12 font-display text-3xl font-semibold tracking-[-0.05em] transition-transform group-hover:translate-x-1">{request.title}</h3>
              <p className="mt-5 flex items-center gap-2 text-sm text-subtle"><MapPin className="size-4" /> {request.area}</p>
              <p className="mt-2 text-sm font-semibold">{request.budget}</p>
            </Link>
          ))}
        </div>
        {persistent && !listings.length ? <p className="py-10 text-subtle">{unavailable ? "Requests could not be loaded. Open demand to retry." : "No requests have been published yet. Post the first one to spark an opportunity."}</p> : null}
      </section>

      <section className="bg-black text-white">
        <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 lg:px-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.4fr]">
            <div><p className="eyebrow text-white/60">How EMBER works</p><h2 className="mt-5 font-display text-5xl font-semibold leading-[0.92] tracking-[-0.06em] md:text-7xl">A market that starts with the ask.</h2></div>
            <ol className="divide-y divide-white/16 border-y border-white/16">
              <ProcessStep icon={<Eye className="size-6" />} number="01" title="Post what you need">Share the outcome, budget, timing, and approximate area. Your exact address stays private.</ProcessStep>
              <ProcessStep icon={<Sparkles className="size-6" />} number="02" title="Sellers respond to signal">Qualified local providers see individual asks and aggregated opportunity before they invest.</ProcessStep>
              <ProcessStep icon={<ShieldCheck className="size-6" />} number="03" title="Choose, fund, and complete">Compare transparent proposals, message the seller, and authorize protected delivery milestones.</ProcessStep>
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
        <div className="border-b border-divider bg-white p-6 md:p-12 lg:border-b-0 lg:border-r lg:p-16">
          <p className="eyebrow text-subtle">For buyers</p>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.055em] md:text-6xl">Stop searching. Start asking.</h2>
          <ul className="mt-8 space-y-4 text-sm text-subtle">
            {["One clear request instead of dozens of tabs", "Comparable offers from sellers who can deliver", "Protected payment for accepted milestones"].map((item) => <li className="flex gap-3" key={item}><CircleCheck className="size-5 shrink-0 text-black" /> {item}</li>)}
          </ul>
          <Button asChild className="mt-9" variant="ember"><Link href="/requests/new">Post your request</Link></Button>
        </div>
        <div className="bg-muted p-6 md:p-12 lg:p-16">
          <p className="eyebrow text-subtle">For sellers</p>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.055em] md:text-6xl">See demand before you build.</h2>
          <ul className="mt-8 space-y-4 text-sm text-subtle">
            {["Privacy-safe clusters reveal viable opportunity", "Focused test plans reduce launch risk", "One workspace for bids, messages, and outcomes"].map((item) => <li className="flex gap-3" key={item}><CircleCheck className="size-5 shrink-0 text-black" /> {item}</li>)}
          </ul>
          <Button asChild className="mt-9"><Link href="/seller">Open seller workspace</Link></Button>
        </div>
      </section>

      <section className="bg-ember-action px-5 py-16 text-white md:px-10 lg:px-16 lg:py-24">
        <div className="mx-auto flex max-w-[1312px] flex-col justify-between gap-10 md:flex-row md:items-end">
          <div><p className="eyebrow text-white">Your next local connection</p><h2 className="mt-4 max-w-4xl font-display text-[clamp(3rem,7vw,7rem)] font-semibold leading-[0.88] tracking-[-0.07em]">Make the need visible.</h2></div>
          <Button asChild className="shrink-0 bg-white text-black hover:bg-white/90" size="lg"><Link href="/requests/new">Spark a request <ArrowRight className="size-4" /></Link></Button>
        </div>
      </section>

      <footer className="bg-black px-5 py-10 text-white md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1312px] flex-col justify-between gap-7 border-b border-white/15 pb-8 md:flex-row md:items-center">
          <div><p className="font-display text-3xl font-semibold tracking-[-0.055em]">EMBER</p><p className="mt-2 text-sm italic text-white/60">Where demand sparks opportunity.</p></div>
          <nav className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/58" aria-label="Footer"><Link className="hover:text-white" href="/demand">Demand</Link><Link className="hover:text-white" href="/seller">Sellers</Link><Link className="hover:text-white" href="/buyer">Buyers</Link><Link className="hover:text-white" href="/auth">Sign in</Link></nav>
        </div>
        <p className="mx-auto mt-6 max-w-[1312px] text-xs text-white/55">© 2026 EMBER. Approximate location signals protect marketplace participants.</p>
      </footer>
    </main>
  )
}

function HomeMetric({ value, label }: { value: string; label: string }) {
  return <div className="px-3 first:pl-0"><p className="font-display text-2xl font-semibold tracking-[-0.04em] md:text-3xl">{value}</p><p className="mt-1 text-xs text-subtle">{label}</p></div>
}

function ProcessStep({ children, icon, number, title }: { children: React.ReactNode; icon: React.ReactNode; number: string; title: string }) {
  return <li className="grid gap-5 py-7 sm:grid-cols-[64px_1fr_auto] sm:items-start"><span className="eyebrow text-white/55">{number}</span><div><h3 className="font-display text-2xl font-semibold tracking-[-0.04em]">{title}</h3><p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">{children}</p></div><span className="hidden size-12 place-items-center rounded-full border border-white/20 sm:grid">{icon}</span></li>
}
