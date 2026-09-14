"use client"

import Link from "next/link"
import { useAccount, useSignOut } from "@/lib/auth"

export function AccountControl() {
  const session = useAccount()
  const signOut = useSignOut()
  if (session.data?.dataMode === "demo") return null
  const account = session.data?.account
  return <div className="flex flex-wrap items-center gap-2 text-sm">
    {account ? <>
      <Link className="inline-flex min-h-11 items-center rounded-lg px-3 font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" href="/account" aria-label="Account and security" title={account.name}>Account</Link>
      <button className="min-h-11 rounded-lg border border-white/20 px-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60" disabled={signOut.isPending} onClick={() => signOut.mutate()} type="button">
        {signOut.isPending ? "Signing out…" : "Sign out"}
      </button>
    </> : <Link className="inline-flex min-h-11 items-center rounded-lg border border-white/20 px-3 font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" href="/auth">{session.isPending ? "Account…" : "Sign in"}</Link>}
    {signOut.error ? <p className="w-full text-xs text-white" role="alert">Sign-out failed. Check your connection and retry.</p> : null}
  </div>
}
