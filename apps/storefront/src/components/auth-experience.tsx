"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthAction } from "@/lib/auth"
import { authFormSchema, type AuthFormInput } from "@/lib/auth-schema"
import type { AuthMode, AuthResult, AuthRole } from "@/lib/auth-types"
import { cn } from "@/lib/utils"

const trustSignals = [
  {
    title: "Local demand visibility",
    description: "See what people nearby are actively asking for.",
  },
  {
    title: "Verified marketplace activity",
    description: "Build decisions on clear requests and accountable bids.",
  },
  {
    title: "Protected contact & payment",
    description: "Share details only when you are ready to move forward.",
  },
]

const roles: Array<{ value: AuthRole; title: string; description: string }> = [
  {
    value: "buyer",
    title: "I’m looking for something",
    description: "Post needs and compare thoughtful local bids.",
  },
  {
    value: "seller",
    title: "I can fulfill requests",
    description: "Discover proven demand and build offers.",
  },
  {
    value: "both",
    title: "Both",
    description: "Buy and sell from one focused workspace.",
  },
]

type LegalTopic = "privacy" | "terms" | "support" | null

function ErrorText({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-2 text-sm font-semibold text-error" role="alert">
      {message}
    </p>
  )
}

function nextDestination(result: AuthResult) {
  if (result.role === "seller") return "/opportunities/east-austin-team-lunch"
  if (result.role === "buyer") return "/requests/new"
  return "/buyer"
}

function successCopy(result: AuthResult) {
  if (result.action === "magic-link") {
    return {
      eyebrow: "Secure link requested",
      title: "Check your inbox.",
      description: `We prepared a one-time sign-in link for ${result.email}. In production, it expires after 15 minutes.`,
    }
  }

  if (result.action === "recover") {
    return {
      eyebrow: "Password help requested",
      title: "Reset instructions are on the way.",
      description: `We prepared password-reset instructions for ${result.email}. Your current password was not changed.`,
    }
  }

  return {
    eyebrow: result.role ? "Role saved" : "Signed in",
    title: result.role ? "Your account is ready." : "Welcome back to EMBER.",
    description:
      result.role === "seller"
        ? "Next, add your service area and capabilities so relevant demand can find you."
        : result.role === "buyer"
          ? "You can publish a request now and complete the rest of your profile later."
          : result.role === "both"
            ? "Your buyer and seller tools are ready in one workspace."
            : "Your marketplace workspace is ready.",
  }
}

export function AuthExperience() {
  const [mode, setMode] = useState<AuthMode>("create-account")
  const [view, setView] = useState<"main" | "recover">("main")
  const [showPassword, setShowPassword] = useState(false)
  const [result, setResult] = useState<AuthResult>()
  const [legalTopic, setLegalTopic] = useState<LegalTopic>(null)
  const authAction = useAuthAction()
  const form = useForm<AuthFormInput>({
    resolver: zodResolver(authFormSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      role: "buyer",
    },
  })

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setView("main")
    setResult(undefined)
    authAction.reset()
    form.clearErrors()
  }

  async function submitCredentials(input: AuthFormInput) {
    const response = await authAction.mutateAsync({
      action: "authenticate",
      mode,
      email: input.email,
      password: input.password,
      role: mode === "create-account" ? input.role : undefined,
    })
    setResult(response)
  }

  async function requestEmailAction(action: "magic-link" | "recover") {
    const valid = await form.trigger("email", { shouldFocus: true })
    if (!valid) return

    const response = await authAction.mutateAsync({
      action,
      email: form.getValues("email"),
    })
    setResult(response)
  }

  const copy = result ? successCopy(result) : null

  return (
    <main className="min-h-svh bg-white lg:grid lg:grid-cols-[minmax(360px,0.82fr)_minmax(560px,1.18fr)]">
      <section className="relative flex min-h-[390px] overflow-hidden bg-black px-5 py-7 text-white sm:px-10 sm:py-10 lg:min-h-svh lg:px-12 lg:py-12 xl:px-16">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-28 top-24 size-72 rounded-full border border-white/10 xl:size-96" />
          <div className="absolute -right-2 top-[12.5rem] h-px w-3/4 rotate-[-19deg] bg-ember" />
          <div className="absolute bottom-28 right-12 size-2 rounded-full bg-ember" />
        </div>

        <div className="relative z-10 flex w-full flex-col">
          <Link
            className="w-fit font-display text-2xl font-semibold tracking-[-0.055em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:text-3xl"
            href="/"
          >
            EMBER
          </Link>

          <div className="mt-14 max-w-xl lg:mt-24 xl:mt-32">
            <p className="eyebrow text-white/60">A demand-first marketplace</p>
            <h1 className="mt-5 font-display text-[clamp(2.7rem,5.7vw,6.8rem)] font-semibold leading-[0.88] tracking-[-0.068em]">
              Where demand sparks opportunity.
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-white/58 lg:text-lg">
              Ask clearly. Respond confidently. Let visible local need guide what gets built next.
            </p>
          </div>

          <div className="mt-auto hidden max-w-lg pt-16 lg:block">
            <ol className="relative space-y-7" aria-label="Marketplace protections">
              <span className="absolute bottom-5 left-[5px] top-5 w-px bg-white/18" aria-hidden="true" />
              {trustSignals.map((signal) => (
                <li className="relative grid grid-cols-[12px_1fr] gap-5" key={signal.title}>
                  <span className="relative z-10 mt-1.5 size-3 rounded-full border border-white/35 bg-black before:absolute before:inset-[3px] before:rounded-full before:bg-white" />
                  <div>
                    <p className="text-sm font-semibold tracking-[0.02em]">{signal.title}</p>
                    <p className="mt-1 max-w-sm text-sm leading-relaxed text-white/60">{signal.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55 lg:mt-16">
            Austin pilot · Demo environment
          </p>
        </div>
      </section>

      <section className="flex min-h-[720px] items-center bg-white px-5 py-12 sm:px-10 lg:min-h-svh lg:px-14 lg:py-16 xl:px-24">
        <div className="mx-auto w-full max-w-[620px]">
          {result && copy ? (
            <section aria-live="polite" className="border-t-4 border-ember pt-8">
              <div className="grid size-14 place-items-center rounded-full bg-black text-white">
                <Check aria-hidden="true" className="size-7" />
              </div>
              <p className="eyebrow mt-9 text-ember-ink">{copy.eyebrow}</p>
              <h2 className="mt-4 max-w-xl font-display text-5xl font-semibold leading-[0.96] tracking-[-0.06em] sm:text-6xl">
                {copy.title}
              </h2>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-subtle">{copy.description}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                {result.action === "authenticate" ? (
                  <Button asChild size="lg" variant="ember">
                    <Link href={nextDestination(result)}>
                      Continue to EMBER <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </Button>
                ) : null}
                <Button
                  onClick={() => {
                    setResult(undefined)
                    setMode("sign-in")
                    setView("main")
                    authAction.reset()
                  }}
                  size="lg"
                  variant="outline"
                >
                  <ArrowLeft aria-hidden="true" className="size-4" /> Back to sign in
                </Button>
              </div>
              <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-subtle">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
                This prototype confirms the flow locally. No account or email was created.
              </p>
            </section>
          ) : (
            <>
              {view === "recover" ? (
                <div className="mb-10">
                  <button
                    className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-subtle transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
                    onClick={() => {
                      setView("main")
                      authAction.reset()
                    }}
                    type="button"
                  >
                    <ArrowLeft aria-hidden="true" className="size-4" /> Back to sign in
                  </button>
                  <p className="eyebrow text-ember-ink">Account recovery</p>
                  <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                    Reset your password.
                  </h2>
                  <p className="mt-4 max-w-lg leading-relaxed text-subtle">
                    Enter the email attached to your account. We’ll prepare a secure reset link.
                  </p>
                </div>
              ) : (
                <div className="mb-10">
                  <p className="eyebrow text-subtle">Enter the marketplace</p>
                  <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                    {mode === "create-account" ? "Start with your intent." : "Good to see you again."}
                  </h2>
                </div>
              )}

              {view === "main" ? (
                <div className="mb-9 grid grid-cols-2 border-b border-divider" role="tablist" aria-label="Authentication mode">
                  {(["sign-in", "create-account"] as const).map((tabMode) => (
                    <button
                      aria-controls="auth-panel"
                      aria-selected={mode === tabMode}
                      className={cn(
                        "relative min-h-12 px-3 pb-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember",
                        mode === tabMode ? "text-foreground" : "text-subtle hover:text-foreground",
                      )}
                      key={tabMode}
                      onClick={() => changeMode(tabMode)}
                      role="tab"
                      type="button"
                    >
                      {tabMode === "sign-in" ? "Sign in" : "Create account"}
                      {mode === tabMode ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-black" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}

              <form id="auth-panel" onSubmit={form.handleSubmit(submitCredentials)}>
                <div>
                  <Label htmlFor="auth-email">Email address</Label>
                  <Input
                    {...form.register("email")}
                    aria-invalid={Boolean(form.formState.errors.email)}
                    autoComplete="email"
                    className="mt-2 min-h-14 rounded-none border-x-0 border-t-0 bg-muted/70 px-0 focus:border-ember focus:ring-0"
                    id="auth-email"
                    placeholder="name@company.com"
                    type="email"
                  />
                  <ErrorText message={form.formState.errors.email?.message} />
                </div>

                {view === "main" ? (
                  <div className="mt-7">
                    <div className="flex items-end justify-between gap-4">
                      <Label htmlFor="auth-password">Password</Label>
                      {mode === "sign-in" ? (
                        <button
                          className="min-h-11 text-sm font-semibold text-subtle underline-offset-4 hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                          onClick={() => {
                            setView("recover")
                            authAction.reset()
                            form.clearErrors()
                          }}
                          type="button"
                        >
                          Forgot password?
                        </button>
                      ) : null}
                    </div>
                    <div className="relative mt-2">
                      <Input
                        {...form.register("password")}
                        aria-invalid={Boolean(form.formState.errors.password)}
                        autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                        className="min-h-14 rounded-none border-x-0 border-t-0 bg-muted/70 px-0 pr-14 focus:border-ember focus:ring-0"
                        id="auth-password"
                        placeholder="8 characters minimum"
                        type={showPassword ? "text" : "password"}
                      />
                      <button
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-0 top-1/2 grid size-12 -translate-y-1/2 place-items-center text-subtle transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember"
                        onClick={() => setShowPassword((shown) => !shown)}
                        type="button"
                      >
                        {showPassword ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
                      </button>
                    </div>
                    <ErrorText message={form.formState.errors.password?.message} />
                  </div>
                ) : null}

                {view === "main" && mode === "create-account" ? (
                  <fieldset className="mt-9">
                    <legend className="text-sm font-semibold">How will you use EMBER?</legend>
                    <div className="mt-3 space-y-3">
                      {roles.map((role) => (
                        <label
                          className="group grid min-h-[82px] cursor-pointer grid-cols-[22px_1fr] items-start gap-4 border border-divider px-4 py-4 transition-[border-color,background-color] has-[:checked]:border-black has-[:checked]:bg-muted/35 hover:border-subtle focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ember sm:px-5"
                          key={role.value}
                        >
                          <input
                            {...form.register("role")}
                            className="mt-0.5 size-5 accent-black"
                            type="radio"
                            value={role.value}
                          />
                          <span>
                            <span className="block text-sm font-semibold">{role.title}</span>
                            <span className="mt-1 block text-sm leading-relaxed text-subtle">{role.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <ErrorText message={form.formState.errors.role?.message} />
                  </fieldset>
                ) : null}

                {authAction.error ? (
                  <p className="mt-6 border-l-2 border-error pl-4 text-sm font-semibold text-error" role="alert">
                    {authAction.error.message}
                  </p>
                ) : null}

                {view === "recover" ? (
                  <Button
                    className="mt-8 w-full"
                    disabled={authAction.isPending}
                    onClick={() => requestEmailAction("recover")}
                    size="lg"
                    type="button"
                    variant="ember"
                  >
                    {authAction.isPending ? "Preparing reset…" : "Send reset link"}
                    {!authAction.isPending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
                  </Button>
                ) : (
                  <>
                    <Button className="mt-9 w-full" disabled={authAction.isPending} size="lg" type="submit" variant="ember">
                      {authAction.isPending ? "Checking securely…" : mode === "create-account" ? "Continue" : "Sign in"}
                      {!authAction.isPending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
                    </Button>

                    <div className="my-7 flex items-center gap-4 text-xs font-semibold text-subtle" aria-hidden="true">
                      <span className="h-px flex-1 bg-divider" /> or <span className="h-px flex-1 bg-divider" />
                    </div>

                    <Button
                      className="w-full"
                      disabled={authAction.isPending}
                      onClick={() => requestEmailAction("magic-link")}
                      size="lg"
                      type="button"
                      variant="outline"
                    >
                      <LockKeyhole aria-hidden="true" className="size-4" />
                      Email me a secure link
                    </Button>
                  </>
                )}
              </form>

              {view === "main" ? (
                <div className="mt-8 border-t border-divider pt-6">
                  <p className="text-center text-sm leading-relaxed text-subtle">
                    Buyers can post before completing a full profile. Sellers add service area, capabilities, and verification after account creation.
                  </p>
                  <nav aria-label="Account help" className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1">
                    {(["privacy", "terms", "support"] as const).map((topic) => (
                      <button
                        className="min-h-11 text-xs font-semibold capitalize text-subtle transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
                        key={topic}
                        onClick={() => setLegalTopic(topic)}
                        type="button"
                      >
                        {topic}
                      </button>
                    ))}
                  </nav>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <Dialog open={legalTopic !== null} onOpenChange={(open) => !open && setLegalTopic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {legalTopic === "privacy" ? "Privacy at EMBER" : legalTopic === "terms" ? "Marketplace terms" : "EMBER support"}
            </DialogTitle>
            <DialogDescription>
              {legalTopic === "privacy"
                ? "Your exact contact details stay private until you choose to move forward. This prototype does not create or retain an account."
                : legalTopic === "terms"
                  ? "Every request and bid should be accurate, lawful, and respectful. Final payment and cancellation terms will be shown before checkout."
                  : "For this prototype, return to the account form and use any valid demo credentials. Live support will be connected before launch."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-7 flex items-start gap-3 border-t border-divider pt-6 text-sm leading-relaxed text-subtle">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-foreground" />
            EMBER will always explain what is shared, who can see it, and when payment is authorized.
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
