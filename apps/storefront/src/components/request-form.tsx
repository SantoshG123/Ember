"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CloudUpload,
  GraduationCap,
  Home,
  Laptop,
  MoreHorizontal,
  ShieldCheck,
  Utensils,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requestSchema, type RequestInput } from "@/lib/request-schema"
import { usePublishRequest } from "@/lib/requests"
import { cn } from "@/lib/utils"

const steps = ["Describe your need", "Set criteria", "Location & privacy", "Review & publish"]

const categories = [
  { label: "Food & Meal Prep", icon: Utensils },
  { label: "Home Services", icon: BriefcaseBusiness },
  { label: "Tutoring", icon: GraduationCap },
  { label: "Design", icon: Home },
  { label: "Tech Support", icon: Laptop },
  { label: "Other", icon: MoreHorizontal },
]

const stepFields: Record<number, (keyof RequestInput)[]> = {
  1: ["category", "title", "description"],
  2: ["budgetMin", "budgetMax", "frequency", "timing"],
  3: ["zip"],
  4: [],
}

function ErrorText({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p className="mt-2 text-sm font-medium text-error" id={id} role="alert">
      {message}
    </p>
  )
}

export function RequestForm() {
  const [step, setStep] = useState(1)
  const [draftSaved, setDraftSaved] = useState(false)
  const [publishedId, setPublishedId] = useState<string>()
  const stepPanel = useRef<HTMLElement>(null)
  const previousStep = useRef(step)
  const publish = usePublishRequest()
  const form = useForm<RequestInput>({
    resolver: zodResolver(requestSchema),
    mode: "onBlur",
    defaultValues: {
      category: "Food & Meal Prep",
      title: "Weekly homemade Italian dinners for 4",
      description: "",
      referenceName: "",
      budgetMin: 60,
      budgetMax: 100,
      frequency: "weekly",
      timing: "Starting next month",
      zip: "78704",
    },
  })

  // React Hook Form intentionally owns this subscription; the compiler should leave it unmemoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const values = form.watch()
  const completion = useMemo(() => `${step * 25}%`, [step])

  useEffect(() => {
    const saved = window.localStorage.getItem("ember-request-draft")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Partial<RequestInput>
      Object.entries(parsed).forEach(([key, value]) => {
        form.setValue(key as keyof RequestInput, value as never)
      })
    } catch {
      window.localStorage.removeItem("ember-request-draft")
    }
  }, [form])

  useEffect(() => {
    if (previousStep.current === step) return
    previousStep.current = step
    stepPanel.current?.focus({ preventScroll: true })
    stepPanel.current?.scrollIntoView({ block: "start", behavior: "instant" })
  }, [step])

  async function continueFlow() {
    const valid = await form.trigger(stepFields[step], { shouldFocus: true })
    if (valid) setStep((current) => Math.min(4, current + 1))
  }

  function saveDraft() {
    window.localStorage.setItem("ember-request-draft", JSON.stringify(form.getValues()))
    setDraftSaved(true)
    window.setTimeout(() => setDraftSaved(false), 2400)
  }

  async function onSubmit(input: RequestInput) {
    const result = await publish.mutateAsync(input)
    window.localStorage.removeItem("ember-request-draft")
    setPublishedId(result.id)
  }

  if (publishedId) {
    return (
      <section className="mx-auto grid min-h-[calc(100svh-72px)] max-w-[1440px] scroll-mt-32 place-items-center px-5 py-20 md:px-10 lg:px-16" id="content" tabIndex={-1}>
        <div className="w-full max-w-2xl border-t-4 border-ember pt-8">
          <div className="mb-8 grid size-14 place-items-center rounded-full bg-success text-white">
            <Check aria-hidden="true" className="size-7" />
          </div>
          <p className="eyebrow mb-4">Request published · {publishedId}</p>
          <h1 className="font-display text-5xl font-semibold tracking-[-0.05em] md:text-7xl">
            Demand is now visible.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-subtle">
            Sellers can now respond with price, timing, and a clear plan. Review responses in your buyer workspace.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild variant="ember"><Link href={`/requests/${publishedId}`}>View published request</Link></Button>
            <Button asChild variant="outline"><Link href="/buyer">Open buyer workspace</Link></Button>
            <Button variant="outline" onClick={() => { setPublishedId(undefined); setStep(1); form.reset() }}>Post another request</Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <form className="scroll-mt-32" id="content" onSubmit={form.handleSubmit(onSubmit)} tabIndex={-1}>
      <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] gap-8 px-5 py-10 md:px-10 lg:grid-cols-12 lg:gap-10 lg:px-16 lg:py-16">
        <aside className="min-w-0 lg:col-span-4">
          <p className="eyebrow mb-5">Create local demand</p>
          <h1 className="max-w-md font-display text-5xl font-semibold leading-[0.95] tracking-[-0.055em] md:text-6xl">
            Tell sellers exactly what would help.
          </h1>
          <p className="mt-5 max-w-sm leading-relaxed text-subtle">
            Clear requests attract useful bids. You can refine every detail before publishing.
          </p>

          <ol className="mt-8 grid grid-cols-2 gap-4 lg:mt-12 lg:block lg:space-y-0" aria-label="Request progress">
            {steps.map((label, index) => {
              const number = index + 1
              const active = step === number
              const complete = step > number
              return (
                <li className="relative flex min-w-0 flex-col gap-2 lg:min-h-20 lg:flex-row lg:gap-4" key={label}>
                  {index < steps.length - 1 ? <span aria-hidden="true" className="absolute left-[21px] top-11 hidden h-full w-px bg-divider lg:block" /> : null}
                  <button
                    aria-current={active ? "step" : undefined}
                    aria-label={`${complete ? "Return to" : ""} Step ${number}: ${label}`.trim()}
                    className={cn(
                      "relative z-10 grid size-11 shrink-0 place-items-center rounded-full border bg-background text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      active && "border-ember text-ember-ink",
                      complete && "border-foreground bg-foreground text-white",
                      !active && !complete && "border-divider text-subtle",
                    )}
                    disabled={!complete}
                    onClick={() => complete && setStep(number)}
                    type="button"
                  >
                    {complete ? <Check aria-hidden="true" className="size-4" /> : number}
                  </button>
                  <div className="pt-0.5">
                    <span className={cn("eyebrow", active ? "text-ember-ink" : "text-subtle")}>Step {number}</span>
                    <p className={cn("mt-1 text-base font-semibold", !active && "text-subtle")}>{label}</p>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-8 rounded-xl border border-divider bg-white p-6">
            <div className="flex items-center gap-3 font-semibold"><ShieldCheck aria-hidden="true" className="size-5" /> Trust & privacy</div>
            <p className="mt-3 text-sm leading-relaxed text-subtle">
              Only your approximate location is visible to sellers until a bid is accepted. Your full details remain private.
            </p>
          </div>
        </aside>

        <section aria-label={`Step ${step} of 4: ${steps[step - 1]}`} className="min-w-0 scroll-mt-32 focus:outline-none lg:col-span-8" ref={stepPanel} tabIndex={-1}>
          <div className="overflow-hidden rounded-xl border border-divider bg-white">
            <div className="h-1 bg-muted"><div className="h-full bg-ember transition-[width] duration-300" style={{ width: completion }} /></div>
            <div className="p-6 md:p-10 lg:p-12">
              {step === 1 ? (
                <div className="space-y-9">
                  <div>
                    <p className="eyebrow mb-3">Step 1 of 4</p>
                    <h2 className="font-display text-4xl font-semibold tracking-[-0.04em]">Describe your need</h2>
                  </div>
                  <fieldset>
                    <legend className="mb-4 text-lg font-semibold">Select a category</legend>
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                      {categories.map(({ label, icon: Icon }) => {
                        const selected = values.category === label
                        return (
                          <button
                            aria-pressed={selected}
                            className={cn(
                              "flex min-h-28 flex-col items-center justify-center gap-3 rounded-xl border px-4 text-sm font-medium transition-[border-color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 motion-safe:hover:-translate-y-0.5",
                              selected ? "border-foreground bg-muted/45" : "border-divider hover:border-subtle",
                            )}
                            key={label}
                            onClick={() => form.setValue("category", label, { shouldValidate: true })}
                            type="button"
                          >
                            <Icon aria-hidden="true" className="size-6" /> {label}
                          </button>
                        )
                      })}
                    </div>
                    <ErrorText message={form.formState.errors.category?.message} />
                  </fieldset>
                  <div>
                    <Label htmlFor="title">What do you need?</Label>
                    <Input aria-describedby={form.formState.errors.title ? "title-error" : undefined} aria-invalid={Boolean(form.formState.errors.title)} className="mt-2" id="title" {...form.register("title")} />
                    <ErrorText id="title-error" message={form.formState.errors.title?.message} />
                  </div>
                  <div>
                    <Label htmlFor="description">Describe the details</Label>
                    <Textarea aria-describedby={`description-hint${form.formState.errors.description ? " description-error" : ""}`} aria-invalid={Boolean(form.formState.errors.description)} className="mt-2" id="description" placeholder="Mention preferences, quantities, accessibility needs, or special requirements…" {...form.register("description")} />
                    <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-subtle" id="description-hint"><span>Specific details help qualified sellers respond.</span><span>{values.description?.length ?? 0}/1,200</span></div>
                    <ErrorText id="description-error" message={form.formState.errors.description?.message} />
                  </div>
                  <div>
                    <Label htmlFor="reference">Reference images (optional)</Label>
                    <label className="relative mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-divider bg-background px-6 text-center transition-colors hover:border-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" htmlFor="reference">
                      <input aria-label="Reference image (optional)" className="sr-only" id="reference" accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => form.setValue("referenceName", event.target.files?.[0]?.name ?? "")} />
                      <CloudUpload aria-hidden="true" className="mb-3 size-7" />
                      <span className="font-semibold">Upload a file or drag and drop</span>
                      <span className="mt-1 text-xs text-subtle">PNG, JPG, or WEBP up to 10MB</span>
                      {values.referenceName ? <span className="mt-3 max-w-full break-all text-sm text-ember-ink">{values.referenceName}</span> : null}
                    </label>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-8">
                  <div><p className="eyebrow mb-3">Step 2 of 4</p><h2 className="font-display text-4xl font-semibold tracking-[-0.04em]">Set useful criteria</h2><p className="mt-3 text-subtle">Give sellers enough context to price and schedule a realistic offer.</p></div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div><Label htmlFor="budget-min">Minimum budget</Label><Input aria-describedby={form.formState.errors.budgetMin ? "budget-min-error" : undefined} aria-invalid={Boolean(form.formState.errors.budgetMin)} className="mt-2" id="budget-min" min="1" type="number" {...form.register("budgetMin", { valueAsNumber: true })} /><ErrorText id="budget-min-error" message={form.formState.errors.budgetMin?.message} /></div>
                    <div><Label htmlFor="budget-max">Maximum budget</Label><Input aria-describedby={form.formState.errors.budgetMax ? "budget-max-error" : undefined} aria-invalid={Boolean(form.formState.errors.budgetMax)} className="mt-2" id="budget-max" min="1" type="number" {...form.register("budgetMax", { valueAsNumber: true })} /><ErrorText id="budget-max-error" message={form.formState.errors.budgetMax?.message} /></div>
                    <div><Label htmlFor="frequency">Frequency</Label><select className="mt-2 min-h-12 w-full rounded-lg border border-divider bg-white px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring" id="frequency" {...form.register("frequency")}><option value="one-time">One-time</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="flexible">Flexible</option></select></div>
                    <div><Label htmlFor="timing">When do you need it?</Label><Input aria-describedby={form.formState.errors.timing ? "timing-error" : undefined} aria-invalid={Boolean(form.formState.errors.timing)} className="mt-2" id="timing" placeholder="Starting next month" {...form.register("timing")} /><ErrorText id="timing-error" message={form.formState.errors.timing?.message} /></div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-8">
                  <div><p className="eyebrow mb-3">Step 3 of 4</p><h2 className="font-display text-4xl font-semibold tracking-[-0.04em]">Place demand, privately</h2><p className="mt-3 max-w-xl text-subtle">EMBER uses your ZIP code to group nearby needs. Sellers see an approximate area—not your address.</p></div>
                  <div className="max-w-sm"><Label htmlFor="zip">ZIP code</Label><Input aria-describedby={form.formState.errors.zip ? "zip-error" : undefined} aria-invalid={Boolean(form.formState.errors.zip)} autoComplete="postal-code" className="mt-2" id="zip" inputMode="numeric" maxLength={5} {...form.register("zip")} /><ErrorText id="zip-error" message={form.formState.errors.zip?.message} /></div>
                  <div className="rounded-xl border border-divider bg-background p-6"><div className="flex gap-4"><ShieldCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0" /><div><h3 className="font-semibold">Your precise location stays private</h3><p className="mt-2 text-sm leading-relaxed text-subtle">The public demand map uses a softened area marker. Contact details unlock only after you accept a seller’s bid.</p></div></div></div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-8">
                  <div><p className="eyebrow mb-3">Step 4 of 4</p><h2 className="font-display text-4xl font-semibold tracking-[-0.04em]">Review & publish</h2><p className="mt-3 text-subtle">This is what qualified sellers will see.</p></div>
                  <dl className="divide-y divide-divider border-y border-divider">
                    {[["Category", values.category], ["Request", values.title], ["Details", values.description], ["Budget", `$${values.budgetMin}–$${values.budgetMax}`], ["Timing", `${values.frequency} · ${values.timing}`], ["Approximate area", values.zip]].map(([term, value]) => <div className="grid gap-2 py-5 sm:grid-cols-[140px_minmax(0,1fr)]" key={term}><dt className="eyebrow text-subtle">{term}</dt><dd className="min-w-0 break-words leading-relaxed">{value}</dd></div>)}
                  </dl>
                  {publish.error ? <div className="rounded-[6px] border border-error bg-error/5 p-4 text-sm font-medium text-error" role="alert">{publish.error.message}</div> : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-30 border-t border-divider bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex min-h-24 max-w-[1440px] flex-col-reverse items-stretch justify-between gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-4 md:px-10 lg:px-16">
          <Button aria-live="polite" onClick={saveDraft} type="button" variant="ghost">{draftSaved ? "Draft saved" : "Save draft"}</Button>
          <div className={cn("grid gap-3 sm:flex", step > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {step > 1 ? <Button className="min-w-0 px-3 sm:px-5" onClick={() => setStep((current) => current - 1)} type="button" variant="outline"><ArrowLeft aria-hidden="true" className="size-4" /> Back</Button> : null}
            {step < 4 ? <Button className="min-w-0 px-3 sm:px-5" key="continue" onClick={continueFlow} type="button" variant="ember">Continue <ArrowRight aria-hidden="true" className="size-4" /></Button> : <Button aria-label={publish.isPending ? "Publishing request" : "Publish request"} className="min-w-0 px-3 sm:px-5" key="publish" disabled={publish.isPending} type="submit" variant="ember">{publish.isPending ? "Publishing…" : <><span className="sm:hidden">Publish</span><span className="hidden sm:inline">Publish request</span></>}<ArrowRight aria-hidden="true" className="size-4" /></Button>}
          </div>
        </div>
      </div>

      <footer className="border-t border-divider bg-muted px-5 py-16 md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-10 md:flex-row md:items-end">
          <div><p className="font-display text-3xl font-semibold tracking-[-0.05em]">EMBER</p><p className="mt-3 text-sm text-subtle">Where demand sparks opportunity.</p></div>
          <p className="text-xs text-subtle">© 2026 EMBER Marketplace.</p>
        </div>
      </footer>
    </form>
  )
}
