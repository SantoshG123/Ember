"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreateMarketplaceBid } from "@/lib/marketplace-data"

export function RequestBidForm({ requestId, open }: { requestId: string; open: boolean }) {
  const mutation = useCreateMarketplaceBid()
  const [submitted, setSubmitted] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    try {
      await mutation.mutateAsync({ requestId, pricePerDelivery: Number(fields.get("price")), deliveryCount: Number(fields.get("count")), cadence: String(fields.get("cadence")), earliestStart: String(fields.get("start")), proposal: String(fields.get("proposal")) })
      setSubmitted(true)
    } catch { /* The mutation error is shown next to the form. */ }
  }
  if (!open) return <p className="rounded-xl border border-divider bg-muted p-6 text-sm text-subtle">This request is no longer accepting bids. Existing proposals are available in your workspace.</p>
  if (submitted) return <section className="rounded-xl border border-divider bg-muted p-6" role="status"><h2 className="font-display text-2xl font-semibold">Your proposal is saved.</h2><p className="mt-3 text-subtle">The buyer can review it in their workspace. Follow its status from your seller dashboard.</p><Button asChild className="mt-5"><Link href="/seller">Open seller workspace</Link></Button></section>
  return <section className="enterprise-panel p-6 md:p-8">
    <p className="eyebrow text-ember-ink">Seller proposal</p><h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">Make a clear offer.</h2>
    <p className="mt-3 text-sm text-subtle">Your price and proposal are saved to this request. No payment is taken.</p>
    <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="bid-price">Price per delivery (USD)<Input id="bid-price" name="price" type="number" required min="0.01" max="1000000" step="0.01" /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="bid-count">Number of deliveries<Input id="bid-count" name="count" type="number" required min="1" max="1000" step="1" defaultValue="1" /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="bid-cadence">Schedule<Input id="bid-cadence" name="cadence" required maxLength={120} placeholder="e.g. Weekly on Tuesdays" /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="bid-start">Earliest start<Input id="bid-start" name="start" type="date" required /></label>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2" htmlFor="bid-proposal">Your proposal<textarea className="min-h-36 rounded-lg border border-divider bg-white p-4 text-base font-normal outline-none focus:border-foreground focus:ring-2 focus:ring-ring/15" id="bid-proposal" name="proposal" required minLength={20} maxLength={5000} placeholder="Describe what is included, your experience, and how you will meet the request." /></label>
      {mutation.isError ? <p className="text-sm text-error sm:col-span-2" role="alert">{mutation.error.message}</p> : null}
      <Button className="justify-self-start" disabled={mutation.isPending} type="submit" variant="ember">{mutation.isPending ? "Saving proposal…" : "Send proposal"}</Button>
    </form>
  </section>
}
