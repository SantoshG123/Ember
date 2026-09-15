"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Clock3, KeyRound, LogOut, ShieldCheck } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { MarketplaceState } from "@/components/marketplace-state"
import { AccountProfileEditor } from "@/components/account-profile-editor"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAccount, useAccountSessions, useRevokeSession, useSignOut } from "@/lib/auth"
import type { RevokeSessionInput } from "@/lib/account-session-schema"

function sessionTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

export function AccountWorkspace() {
  const accountQuery = useAccount()
  const account = accountQuery.data?.account
  const [offset, setOffset] = useState(0)
  const sessions = useAccountSessions(account?.id, offset)
  const revoke = useRevokeSession()
  const signOut = useSignOut()
  const [selection, setSelection] = useState<RevokeSessionInput | null>(null)
  const [notice, setNotice] = useState("")
  const cancelButton = useRef<HTMLButtonElement>(null)
  const sessionsHeading = useRef<HTMLHeadingElement>(null)

  async function confirmRevocation() {
    if (!selection) return
    try {
      const result = await revoke.mutateAsync(selection)
      setNotice(result.revoked ? `${result.revoked} ${result.revoked === 1 ? "session ended" : "sessions ended"}. This browser is still signed in.` : "There were no other sessions to end. This browser is still signed in.")
      setOffset(0)
      setSelection(null)
    } catch { /* Keep the confirmation open and announce the actionable error. */ }
  }

  if (accountQuery.isPending) return <MarketplaceState loading title="Opening your account…" message="Checking your sign-in session." />
  if (accountQuery.isError) return <MarketplaceState title="Account unavailable" message="We could not check your account. Check your connection and try again." retry={() => void accountQuery.refetch()} />
  if (!account) return <MarketplaceState title={accountQuery.data?.dataMode === "demo" ? "Session controls require a real account" : "Sign in to manage your account"} message={accountQuery.data?.dataMode === "demo" ? "Demo mode does not create accounts or browser sessions. Session management is available in the Medusa-backed application." : "Your session may have ended. Sign in again to review your account and active sessions."} />

  const data = sessions.data
  const busy = revoke.isPending || signOut.isPending
  const otherSessions = Math.max(0, (data?.count ?? 1) - 1)

  return <main className="min-h-svh bg-background text-foreground">
    <SiteHeader variant="app" />
    <section className="border-b border-divider bg-white" id="content" tabIndex={-1}>
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-14">
        <Link href={account.role === "seller" ? "/seller" : "/buyer"} className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-subtle transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"><ArrowLeft aria-hidden="true" className="size-4" />Back to workspace</Link>
        <p className="eyebrow mt-7 text-ember-ink">Your EMBER account</p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.05em] md:text-6xl">Account &amp; security.</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-subtle">Know where you’re signed in. Keep control of access to your marketplace workspace.</p>
      </div>
    </section>

    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-10 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-6">
        <section className="enterprise-panel p-6" aria-labelledby="account-details-heading">
          <KeyRound aria-hidden="true" className="size-5 text-ember-ink" />
          <h2 id="account-details-heading" className="mt-4 font-display text-xl font-semibold tracking-tight">Account details</h2>
          <dl className="mt-6 space-y-5 text-sm">
            <div><dt className="text-subtle">Display name</dt><dd className="mt-1 break-words font-semibold">{account.name}</dd></div>
            <div><dt className="text-subtle">Email address</dt><dd className="mt-1 break-all font-semibold">{account.email}</dd></div>
            <div><dt className="text-subtle">Workspace access</dt><dd className="mt-2 flex flex-wrap gap-2">{account.roles.map(role => <span key={role} className="rounded-md border border-divider bg-muted px-2.5 py-1 font-semibold capitalize">{role}</span>)}</dd></div>
          </dl>
          <AccountProfileEditor key={account.id} accountId={account.id} />
          <p className="mt-6 border-t border-divider pt-5 text-sm leading-relaxed text-subtle">Email ownership is not verified yet. Email changes and password recovery are not available in this local release.</p>
        </section>
        <section className="rounded-xl bg-graphite p-6 text-white" aria-labelledby="session-info-heading">
          <ShieldCheck aria-hidden="true" className="size-5 text-white/80" />
          <h2 className="mt-4 font-semibold" id="session-info-heading">A clear access boundary</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">Sessions expire after 24 hours. Ending a session blocks its next protected request; already loaded information may remain visible.</p>
        </section>
      </aside>

      <section className="enterprise-panel min-w-0 self-start" aria-labelledby="active-sessions-heading">
        <div className="border-b border-divider p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="eyebrow text-subtle">Sign-in activity</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember" id="active-sessions-heading" ref={sessionsHeading} tabIndex={-1}>Active sessions</h2></div>
            <Button variant="outline" disabled={busy || sessions.isFetching} onClick={() => { setNotice(""); void sessions.refetch(); void accountQuery.refetch() }}>Refresh</Button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-subtle">Each sign-in through this storefront creates a separate session. Times use your local timezone. We do not collect device names or locations for this list.</p>
          <p aria-live="polite" role="status" className="mt-4 text-sm font-medium">{notice}</p>
        </div>

        {sessions.isPending ? <p role="status" className="p-8 text-subtle">Loading your active sessions…</p> : sessions.isError ? <div className="p-8"><p role="alert" className="text-sm leading-relaxed">{sessions.error.message}</p><Button className="mt-4" variant="outline" onClick={() => { void sessions.refetch(); void accountQuery.refetch() }}>Try again</Button></div> : <>
          <ul className="divide-y divide-divider" aria-label="Active sign-in sessions">
            {data?.sessions.map(session => <li key={session.id} className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center md:px-8">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-divider bg-muted"><KeyRound aria-hidden="true" className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">{session.current ? "This browser session" : "Other session"}{session.current ? <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium"><Check className="size-3" aria-hidden="true" />Current</span> : null}</p>
                <p className="mt-2 text-sm leading-relaxed text-subtle">Started <time dateTime={session.createdAt}>{sessionTime(session.createdAt)}</time></p>
                <p className="mt-1 flex items-start gap-1.5 text-sm leading-relaxed text-subtle"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>Expires <time dateTime={session.expiresAt}>{sessionTime(session.expiresAt)}</time></span></p>
              </div>
              {!session.current ? <Button variant="outline" className="self-start sm:self-center" disabled={busy} aria-label={`End session started ${sessionTime(session.createdAt)}`} onClick={() => { revoke.reset(); setSelection({ sessionId: session.id }) }}>End session</Button> : null}
            </li>)}
          </ul>
          {data?.sessions.length === 0 ? <p className="p-8 text-sm text-subtle">No active sessions on this page. Refresh or return to the previous page.</p> : null}
          {data && (offset > 0 || offset + data.limit < data.count) ? <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-divider px-6 py-5" aria-label="Session pages">
            <Button variant="outline" disabled={offset === 0 || busy} onClick={() => setOffset(Math.max(0, offset - data.limit))}><ArrowLeft className="size-4" aria-hidden="true" />Previous</Button>
            <span className="text-sm tabular-nums text-subtle">Page {Math.floor(offset / data.limit) + 1}</span>
            <Button variant="outline" disabled={offset + data.limit >= data.count || busy} onClick={() => setOffset(offset + data.limit)}>Next<ArrowRight className="size-4" aria-hidden="true" /></Button>
          </nav> : null}
        </>}

        <div className="space-y-5 border-t border-divider bg-muted/40 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h3 className="font-semibold">Sign out other sessions</h3><p className="mt-1 text-sm leading-relaxed text-subtle">Keep this browser signed in. End other EMBER browser sessions.</p></div><Button variant="outline" disabled={busy || sessions.isError || !data || otherSessions === 0} onClick={() => { revoke.reset(); setSelection({ allOthers: true }) }}>End other sessions</Button></div>
          <div className="flex flex-col justify-between gap-4 border-t border-divider pt-5 sm:flex-row sm:items-center"><div><h3 className="font-semibold">Done on this browser?</h3><p className="mt-1 text-sm text-subtle">Sign out when using a shared device.</p></div><Button variant="ember" disabled={busy} onClick={() => signOut.mutate()}><LogOut aria-hidden="true" className="size-4" />{signOut.isPending ? "Signing out…" : "Sign out"}</Button></div>
          {signOut.error ? <p role="alert" className="text-sm">Sign-out failed. Check your connection and try again.</p> : null}
        </div>
      </section>
    </div>

    <Dialog open={selection !== null} onOpenChange={open => { if (!open && !revoke.isPending) setSelection(null) }}>
      <DialogContent onOpenAutoFocus={event => { event.preventDefault(); cancelButton.current?.focus() }} onCloseAutoFocus={event => { event.preventDefault(); sessionsHeading.current?.focus() }}>
        <DialogHeader><DialogTitle>{selection && "allOthers" in selection ? "End all other sessions?" : "End this other session?"}</DialogTitle><DialogDescription>This browser will stay signed in. The selected sessions will need to sign in again. This does not change your password or remove any marketplace data.</DialogDescription></DialogHeader>
        {revoke.error ? <p role="alert" className="mt-5 text-sm leading-relaxed text-ember-ink">{revoke.error.message}</p> : null}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button asChild variant="outline" disabled={revoke.isPending} onClick={() => setSelection(null)}><button ref={cancelButton} type="button">Cancel</button></Button><Button variant="ember" disabled={revoke.isPending} onClick={() => void confirmRevocation()}>{revoke.isPending ? "Ending sessions…" : "Confirm sign-out"}</Button></div>
      </DialogContent>
    </Dialog>
  </main>
}
