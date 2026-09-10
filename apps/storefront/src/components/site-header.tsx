"use client"

import {
  Compass,
  LayoutDashboard,
  Map,
  Menu,
  MessageCircle,
  Plus,
  Store,
  X,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type NavigationKey =
  | "buyer"
  | "demand"
  | "discover"
  | "messages"
  | "opportunities"
  | "seller"

type SiteHeaderProps = {
  active?: NavigationKey
  messageCount?: number
  messageHref?: string
  variant?: "app" | "exit"
}

const navigation = [
  { href: "/", icon: Compass, key: "discover", label: "Discover" },
  { href: "/demand", icon: Map, key: "demand", label: "Demand" },
  {
    href: "/opportunities/east-austin-team-lunch",
    icon: LayoutDashboard,
    key: "opportunities",
    label: "Opportunities",
  },
  { href: "/buyer", icon: LayoutDashboard, key: "buyer", label: "Buyer" },
  { href: "/seller", icon: Store, key: "seller", label: "Seller" },
] as const

export function SiteHeader({
  active,
  messageCount = 0,
  messageHref = "/messages",
  variant = "exit",
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function dismissOutside(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("pointerdown", dismissOutside)
    return () => document.removeEventListener("pointerdown", dismissOutside)
  }, [menuOpen])

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-white/10 bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          setMenuOpen(false)
          menuButtonRef.current?.focus()
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false)
      }}
    >
      {variant === "app" ? <a className="skip-link" href="#content">Skip to content</a> : null}
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-2 px-4 md:min-h-[72px] md:px-10 xl:px-16">
        <Link
          className="group flex min-h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:gap-3"
          href="/"
        >
          <span className="grid size-7 place-items-center rounded-lg border border-white/15 bg-white/5 transition-colors group-hover:bg-white/10" aria-hidden="true">
            <span className="size-2 rounded-[2px] bg-ember" />
          </span>
          <span>
            <span className="block font-display text-xl font-semibold leading-none tracking-[-0.05em] text-white md:text-2xl">EMBER</span>
            <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.16em] text-white/60 2xl:block">Demand network</span>
          </span>
        </Link>

        {variant === "app" ? (
          <>
            <nav aria-label="Primary" className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 xl:flex">
              {navigation.map((item) => (
                <Link
                  aria-current={active === item.key ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-lg px-3 text-[13px] font-semibold transition-[background-color,color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    active === item.key
                      ? "bg-white text-black shadow-sm"
                      : "text-white/58 hover:bg-white/[0.07] hover:text-white",
                  )}
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-3">
              <Link
                aria-label={messageCount > 0 ? `${messageCount} unread messages` : "Messages"}
                aria-current={active === "messages" ? "page" : undefined}
                className={cn(
                  "relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-3",
                  active === "messages"
                    ? "bg-white/12 text-white"
                    : "text-white/68 hover:bg-white/[0.07] hover:text-white",
                )}
                href={messageHref}
              >
                <MessageCircle aria-hidden="true" className="size-[18px]" />
                <span className="hidden 2xl:inline">Messages</span>
                {messageCount > 0 ? (
                  <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-ember-action px-1 text-[10px] font-bold text-white sm:static sm:min-w-5 sm:px-1.5 sm:py-0.5">
                    {messageCount}
                  </span>
                ) : null}
              </Link>
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ember-action px-3 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-ember-ink hover:shadow-[0_8px_20px_rgba(217,45,32,0.22)] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-4"
                href="/requests/new"
              >
                <Plus aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Post a request</span>
                <span className="sm:hidden">Post</span>
              </Link>
              <button
                aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                className="grid size-11 shrink-0 place-items-center rounded-lg border border-white/15 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white xl:hidden"
                onClick={() => setMenuOpen((open) => !open)}
                ref={menuButtonRef}
                type="button"
              >
                {menuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
              </button>
            </div>
          </>
        ) : (
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white/68 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href="/"
          >
            <X aria-hidden="true" className="size-4" />
            Exit
          </Link>
        )}
      </div>

      {variant === "app" ? (
        <nav
          aria-label="Mobile primary"
          className={cn("absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-b border-white/15 bg-graphite p-4 shadow-xl xl:hidden", !menuOpen && "hidden")}
          id="mobile-navigation"
        >
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                aria-current={active === item.key ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white",
                  active === item.key ? "bg-white text-black" : "text-white/58 hover:bg-white/[0.07] hover:text-white",
                )}
                href={item.href}
                key={item.key}
                onClick={() => setMenuOpen(false)}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      ) : null}
    </header>
  )
}
