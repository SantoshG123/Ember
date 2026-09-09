"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Utensils,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthorizeCheckout } from "@/lib/checkout"
import { checkoutFormSchema, type CheckoutFormInput } from "@/lib/checkout-schema"
import type { CheckoutReceipt, PaymentMethod } from "@/lib/checkout-types"
import { cn } from "@/lib/utils"

const fundsPath = [
  {
    title: "Authorized today",
    value: "$68",
    description: "Only the first delivery is authorized.",
    icon: LockKeyhole,
  },
  {
    title: "Held by EMBER",
    value: "Protected",
    description: "Maria is notified, but funds stay held.",
    icon: Building2,
  },
  {
    title: "Released after confirmation",
    value: "After delivery",
    description: "You confirm the meal arrived as agreed.",
    icon: CheckCircle2,
  },
]

function ErrorText({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-2 text-sm font-semibold text-error" role="alert">
      {message}
    </p>
  )
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim()
}

function formatExpiration(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

function ProposalSummary() {
  return (
    <details className="group">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 border-b border-white/16 pb-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:pointer-events-none">
        <span>
          <span className="eyebrow block text-white/60">Accepted proposal</span>
          <span className="mt-2 block font-display text-2xl font-semibold tracking-[-0.04em] lg:hidden">
            Chef Maria L. · $68
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="size-5 transition-transform group-open:rotate-180 lg:hidden" />
      </summary>

      <div className="pt-7 lg:block">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-full border border-white/22 font-display text-sm font-semibold">
            ML
          </span>
          <div>
            <p className="font-display text-xl font-semibold tracking-[-0.03em]">Chef Maria L.</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-white/55">
              <ShieldCheck aria-hidden="true" className="size-3.5" /> Verified meal-prep seller
            </p>
          </div>
        </div>

        <div className="mt-8 border-y border-white/16 py-7">
          <p className="eyebrow text-white/60">Request R-8924</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.02] tracking-[-0.05em] xl:text-4xl">
            Weekly homemade Italian dinners
          </h2>
        </div>

        <dl className="divide-y divide-white/14 text-sm">
          <div className="flex justify-between gap-5 py-4"><dt className="text-white/60">Portions</dt><dd className="font-semibold">4 portions</dd></div>
          <div className="flex justify-between gap-5 py-4"><dt className="text-white/60">Schedule</dt><dd className="text-right font-semibold">Wednesday · 6:30 PM</dd></div>
          <div className="flex justify-between gap-5 py-4"><dt className="text-white/60">Delivery</dt><dd className="text-right font-semibold">Hyde Park · Austin</dd></div>
          <div className="flex justify-between gap-5 py-4"><dt className="text-white/60">Requirement</dt><dd className="font-semibold">No shellfish</dd></div>
        </dl>

        <div className="mt-8 border-t border-white/16 pt-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-white/60">Authorized today</p>
              <p className="mt-2 text-sm text-white/55">First delivery only</p>
            </div>
            <p className="font-display text-6xl font-semibold tracking-[-0.07em]">$68</p>
          </div>
          <div className="mt-6 flex items-start gap-3 border-l-2 border-ember pl-4 text-sm leading-relaxed text-white/62">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-white" />
            No platform fee. No future delivery is charged today.
          </div>
        </div>
      </div>
    </details>
  )
}

function FundsPath({ receipt = false }: { receipt?: boolean }) {
  return (
    <ol className="relative grid gap-6 md:grid-cols-3 md:gap-0" aria-label="Payment protection path">
      <span className="absolute left-[21px] top-5 h-[calc(100%-40px)] w-px bg-divider md:left-5 md:right-5 md:top-5 md:h-px md:w-auto" aria-hidden="true" />
      {fundsPath.map((step, index) => {
        const Icon = step.icon
        const active = !receipt ? index === 0 : index < 2
        return (
          <li className="relative grid grid-cols-[44px_1fr] gap-4 md:block md:pr-7" key={step.title}>
            <span
              className={cn(
                "relative z-10 grid size-11 place-items-center rounded-full border bg-white",
                active ? "border-foreground text-foreground" : "border-divider text-subtle",
                index === 0 && !receipt && "border-ember-action bg-ember-action text-white",
              )}
            >
              {receipt && index === 0 ? <Check aria-hidden="true" className="size-5" /> : <Icon aria-hidden="true" className="size-5" />}
            </span>
            <div className="md:mt-5">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-1 font-display text-lg font-semibold tracking-[-0.03em]">{step.value}</p>
              <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-subtle">{step.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function CheckoutHeader() {
  return (
    <header className="border-b border-white/12 bg-black text-white">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center justify-between gap-4 px-5 md:px-10 lg:px-16">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            className="font-display text-2xl font-semibold tracking-[-0.055em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            href="/"
          >
            EMBER
          </Link>
          <span className="hidden h-7 w-px bg-white/22 sm:block" aria-hidden="true" />
          <span className="hidden items-center gap-2 text-xs font-semibold tracking-[0.04em] text-white/58 sm:flex">
            <ShieldCheck aria-hidden="true" className="size-4" /> Protected payment
          </span>
        </div>
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-white/62 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-sm"
          href="/messages"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Return to Chef Maria conversation</span>
          <span className="sm:hidden">Messages</span>
        </Link>
      </div>
    </header>
  )
}

function ReceiptView({ receipt }: { receipt: CheckoutReceipt }) {
  function downloadReceipt() {
    const lines = [
      "EMBER PAYMENT AUTHORIZATION",
      `Receipt: ${receipt.receiptId}`,
      "Weekly homemade Italian dinners",
      `Seller: ${receipt.seller}`,
      "Authorized: $68.00 USD",
      `Payment method: Visa ending in ${receipt.cardLast4}`,
      `Delivery: ${receipt.delivery.date} at ${receipt.delivery.time}`,
      `Location: ${receipt.delivery.location}`,
      "Status: Held by EMBER until delivery confirmation",
      "Demo receipt — no real payment was processed.",
    ]
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `${receipt.receiptId}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <CheckoutHeader />
      <main className="min-h-[calc(100svh-72px)] bg-background px-5 py-12 sm:px-10 lg:px-16 lg:py-20">
        <section className="mx-auto max-w-5xl border-t-4 border-ember pt-8" aria-live="polite">
          <div className="grid size-14 place-items-center rounded-full bg-black text-white">
            <Check aria-hidden="true" className="size-7" />
          </div>
          <p className="eyebrow mt-8 text-ember-ink">Payment authorized · Demo</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-7xl">
            Your first delivery is funded.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-subtle">
            The $68 authorization is now held by EMBER. Chef Maria has been notified, and the funds release only after you confirm delivery.
          </p>

          <div className="mt-12 grid min-w-0 overflow-hidden border border-divider bg-white lg:grid-cols-[1.1fr_0.9fr]">
            <div className="min-w-0 p-6 sm:p-9">
              <p className="eyebrow text-subtle">Authorized request</p>
              <h2 className="mt-5 max-w-lg font-display text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                Weekly homemade Italian dinners
              </h2>
              <div className="mt-8 flex items-center gap-4 border-t border-divider pt-6">
                <span className="grid size-11 place-items-center rounded-full bg-black text-xs font-semibold text-white">ML</span>
                <div><p className="font-semibold">Chef Maria L.</p><p className="mt-1 text-xs text-subtle">Verified seller · Notified</p></div>
              </div>
            </div>
            <div className="min-w-0 border-t border-divider bg-muted/55 p-6 sm:p-9 lg:border-l lg:border-t-0">
              <p className="eyebrow text-subtle">Milestone 1</p>
              <p className="mt-4 font-display text-6xl font-semibold tracking-[-0.07em] sm:text-7xl">$68</p>
              <p className="mt-4 inline-flex min-h-8 items-center gap-2 rounded-full border border-divider bg-white px-3 text-xs font-semibold">
                <span className="size-2 rounded-full bg-ember" /> Held by EMBER
              </p>
              <dl className="mt-8 space-y-3 border-t border-divider pt-6 text-sm">
                <div className="flex min-w-0 justify-between gap-4"><dt className="shrink-0 text-subtle">Receipt</dt><dd className="min-w-0 truncate font-semibold">{receipt.receiptId}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-subtle">Payment</dt><dd className="font-semibold">Visa ···· {receipt.cardLast4}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-subtle">Delivery</dt><dd className="text-right font-semibold">Wednesday · 6:30 PM</dd></div>
              </dl>
            </div>
          </div>

          <div className="mt-12 border-y border-divider py-9">
            <p className="eyebrow mb-7 text-subtle">Transaction progress</p>
            <FundsPath receipt />
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/messages"><MessageCircle aria-hidden="true" className="size-4" /> Return to messages</Link>
            </Button>
            <Button onClick={downloadReceipt} size="lg" variant="outline">
              <Download aria-hidden="true" className="size-4" /> Download demo receipt
            </Button>
            <Button asChild size="lg" variant="ghost"><Link href="/buyer">View buyer workspace</Link></Button>
          </div>
          <p className="mt-8 text-xs text-subtle">Demo confirmation only · No real payment was processed.</p>
        </section>
      </main>
    </>
  )
}

export function CheckoutExperience() {
  const [receipt, setReceipt] = useState<CheckoutReceipt>()
  const authorize = useAuthorizeCheckout()
  const form = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onBlur",
    defaultValues: {
      paymentMethod: "saved",
      cardNumber: "",
      expiration: "",
      cvc: "",
      billingName: "Jordan Lee",
      billingZip: "78704",
      authorizationAccepted: false,
    },
  })
  const [paymentMethod, cardNumber, expiration, cvc] = useWatch({
    control: form.control,
    name: ["paymentMethod", "cardNumber", "expiration", "cvc"],
  })

  async function submit(input: CheckoutFormInput) {
    const cardDigits = input.cardNumber.replace(/\s/g, "")
    try {
      const response = await authorize.mutateAsync({
        billingName: input.billingName,
        billingZip: input.billingZip,
        cardLast4: input.paymentMethod === "saved" ? "4242" : cardDigits.slice(-4),
        paymentMethod: input.paymentMethod,
      })
      setReceipt(response)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      // The mutation retains the typed failure for the inline recovery panel.
    }
  }

  if (receipt) return <ReceiptView receipt={receipt} />

  return (
    <div className="min-h-svh bg-background">
      <CheckoutHeader />
      <main className="mx-auto grid max-w-[1440px] lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <aside className="order-1 bg-black px-5 py-8 text-white sm:px-10 lg:order-2 lg:px-10 lg:py-14 xl:px-14">
          <div className="lg:sticky lg:top-8"><ProposalSummary /></div>
        </aside>

        <section className="order-2 bg-white px-5 py-12 sm:px-10 lg:order-1 lg:px-14 lg:py-20 xl:px-20">
          <div className="max-w-4xl">
            <p className="eyebrow text-ember-ink">Protected milestone · 01</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[0.93] tracking-[-0.06em] sm:text-7xl">
              Fund the first delivery.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-subtle sm:text-lg">
              Authorize $68 today. Future deliveries are charged only after you confirm the previous delivery has arrived.
            </p>

            <section className="mt-12 border-y border-divider py-9" aria-labelledby="funds-path-title">
              <p className="eyebrow mb-8 text-subtle" id="funds-path-title">How funds move</p>
              <FundsPath />
            </section>

            <form className="mt-12" onSubmit={form.handleSubmit(submit)}>
              <fieldset>
                <legend className="font-display text-2xl font-semibold tracking-[-0.04em]">Payment method</legend>
                <div className="mt-5 grid gap-3">
                  {(["saved", "new"] as PaymentMethod[]).map((method) => (
                    <label
                      className="grid min-h-[82px] cursor-pointer grid-cols-[22px_1fr] items-center gap-4 border border-divider px-5 py-4 has-[:checked]:border-black has-[:checked]:bg-muted/35 hover:border-subtle focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ember"
                      key={method}
                    >
                      <input {...form.register("paymentMethod")} className="size-5 accent-black" type="radio" value={method} />
                      <span className="flex items-center gap-4">
                        <CreditCard aria-hidden="true" className="size-6 shrink-0" />
                        <span>
                          <span className="block text-sm font-semibold">{method === "saved" ? "Visa ending in 4242" : "Use a new test card"}</span>
                          <span className="mt-1 block text-xs text-subtle">{method === "saved" ? "Expires 12/29 · Demo method" : "Test details remain in this browser only"}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {paymentMethod === "new" ? (
                <section className="mt-8 border-t border-divider pt-8" aria-labelledby="new-card-title">
                  <div className="flex items-center justify-between gap-5">
                    <h2 className="font-display text-2xl font-semibold tracking-[-0.04em]" id="new-card-title">New test card</h2>
                    <span className="text-xs font-semibold text-subtle">Stripe-ready demo</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-subtle">
                    Use 4242 4242 4242 4242 for success or 4000 0000 0000 0002 to test recovery.
                  </p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="card-number">Card number</Label>
                      <Input
                        {...form.register("cardNumber")}
                        aria-invalid={Boolean(form.formState.errors.cardNumber)}
                        autoComplete="cc-number"
                        className="mt-2"
                        id="card-number"
                        inputMode="numeric"
                        onChange={(event) => form.setValue("cardNumber", formatCardNumber(event.target.value), { shouldDirty: true, shouldValidate: true })}
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                      />
                      <ErrorText message={form.formState.errors.cardNumber?.message} />
                    </div>
                    <div>
                      <Label htmlFor="expiration">Expiration</Label>
                      <Input
                        {...form.register("expiration")}
                        aria-invalid={Boolean(form.formState.errors.expiration)}
                        autoComplete="cc-exp"
                        className="mt-2"
                        id="expiration"
                        inputMode="numeric"
                        onChange={(event) => form.setValue("expiration", formatExpiration(event.target.value), { shouldDirty: true, shouldValidate: true })}
                        placeholder="MM/YY"
                        value={expiration}
                      />
                      <ErrorText message={form.formState.errors.expiration?.message} />
                    </div>
                    <div>
                      <Label htmlFor="cvc">Security code</Label>
                      <Input
                        {...form.register("cvc")}
                        aria-invalid={Boolean(form.formState.errors.cvc)}
                        autoComplete="cc-csc"
                        className="mt-2"
                        id="cvc"
                        inputMode="numeric"
                        onChange={(event) => form.setValue("cvc", event.target.value.replace(/\D/g, "").slice(0, 4), { shouldDirty: true, shouldValidate: true })}
                        placeholder="CVC"
                        value={cvc}
                      />
                      <ErrorText message={form.formState.errors.cvc?.message} />
                    </div>
                  </div>
                </section>
              ) : null}

              <section className="mt-8 grid gap-5 border-t border-divider pt-8 sm:grid-cols-2" aria-labelledby="billing-title">
                <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] sm:col-span-2" id="billing-title">Billing confirmation</h2>
                <div>
                  <Label htmlFor="billing-name">Name on card</Label>
                  <Input {...form.register("billingName")} aria-invalid={Boolean(form.formState.errors.billingName)} autoComplete="cc-name" className="mt-2" id="billing-name" />
                  <ErrorText message={form.formState.errors.billingName?.message} />
                </div>
                <div>
                  <Label htmlFor="billing-zip">Billing ZIP</Label>
                  <Input
                    {...form.register("billingZip")}
                    aria-invalid={Boolean(form.formState.errors.billingZip)}
                    autoComplete="postal-code"
                    className="mt-2"
                    id="billing-zip"
                    inputMode="numeric"
                    maxLength={5}
                  />
                  <ErrorText message={form.formState.errors.billingZip?.message} />
                </div>
              </section>

              <label className="mt-8 grid cursor-pointer grid-cols-[20px_1fr] gap-3 border border-divider bg-background p-5 text-sm leading-relaxed focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ember">
                <input {...form.register("authorizationAccepted")} className="mt-0.5 size-5 accent-black" type="checkbox" />
                <span>
                  <strong className="block text-foreground">I authorize $68 for the first delivery.</strong>
                  <span className="mt-1 block text-subtle">Funds stay held until delivery confirmation. Cancel at least 24 hours before Wednesday at 6:30 PM for a full reversal.</span>
                </span>
              </label>
              <ErrorText message={form.formState.errors.authorizationAccepted?.message} />

              {authorize.error ? (
                <div className="mt-7 border-l-2 border-error bg-error/5 px-5 py-4" role="alert">
                  <p className="font-semibold text-error">Authorization declined</p>
                  <p className="mt-1 text-sm leading-relaxed text-error">{authorize.error.message}</p>
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-4 border-t border-divider pt-8 sm:flex-row sm:items-center">
                <Button className="sm:min-w-52" disabled={authorize.isPending} size="lg" type="submit" variant="ember">
                  {authorize.isPending ? "Authorizing securely…" : "Authorize $68"}
                  {!authorize.isPending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
                </Button>
                <p className="flex items-start gap-2 text-xs leading-relaxed text-subtle">
                  <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
                  Demo authorization. No real payment is processed or stored.
                </p>
              </div>
            </form>

            <section className="mt-10 grid gap-4 border-t border-divider pt-8 sm:grid-cols-2" aria-label="Payment protections">
              <div className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><div><p className="text-sm font-semibold">Release requires confirmation</p><p className="mt-1 text-xs leading-relaxed text-subtle">Maria receives funds after you confirm delivery.</p></div></div>
              <div className="flex items-start gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><div><p className="text-sm font-semibold">24-hour cancellation cutoff</p><p className="mt-1 text-xs leading-relaxed text-subtle">Cancel before Tuesday at 6:30 PM for a full reversal.</p></div></div>
            </section>

            <p className="mt-10 flex items-center gap-2 text-xs font-semibold text-subtle">
              <Utensils aria-hidden="true" className="size-4" /> Wednesday delivery · Four portions · No shellfish
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
