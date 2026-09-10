"use client"

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  LockKeyhole,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { MarketplaceState } from "@/components/marketplace-state"
import { useMarketplaceMode } from "@/lib/marketplace-data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  Conversation,
  ConversationProposal,
  MessageAttachment,
} from "@/lib/message-types"
import {
  useConfirmDelivery,
  useMessagesWorkspace,
  useSendMessage,
  useMarkConversationRead,
} from "@/lib/messages"
import { cn } from "@/lib/utils"

type ConversationFilter = "all" | "unread"

const draftAttachment: MessageAttachment = {
  id: "attachment-delivery-notes",
  name: "Jordan_delivery_notes.pdf",
  size: "340 KB",
  type: "document",
}

function MessagesLoading() {
  return (
    <main className="min-h-svh bg-background">
      <SiteHeader active="messages" variant="app" />
      <div className="grid min-h-[calc(100svh-var(--app-header-height))] animate-pulse lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_360px]" id="content" tabIndex={-1} aria-busy="true" aria-label="Loading messages">
        <div className="border-r border-divider bg-white p-5"><div className="h-12 rounded-md bg-muted" /></div>
        <div className="bg-white p-8"><div className="h-20 rounded-md bg-muted" /><div className="mt-16 h-32 rounded-xl bg-muted" /></div>
        <div className="hidden border-l border-divider bg-background p-8 2xl:block"><div className="h-72 rounded-xl bg-muted" /></div>
      </div>
    </main>
  )
}

function ParticipantMark({ conversation }: { conversation: Conversation }) {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-foreground font-display text-xs font-semibold text-white">
      {conversation.participant.initials}
      {conversation.participant.verified ? (
        <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border-2 border-white bg-white text-foreground">
          <Check aria-hidden="true" className="size-2.5" strokeWidth={3} />
          <span className="sr-only">Verified</span>
        </span>
      ) : null}
    </span>
  )
}

function DealContext({
  conversationId,
  proposal,
  onNotice,
  actor,
  persistent,
}: {
  conversationId: string
  proposal: ConversationProposal
  onNotice: (message: string) => void
  actor: "buyer" | "seller"
  persistent: boolean
}) {
  const confirmDelivery = useConfirmDelivery(actor)
  const [rate, ...rateSuffix] = proposal.rate.split(" ")

  function toggleConfirmation() {
    if (!proposal.milestone || confirmDelivery.isPending) return
    confirmDelivery.mutate(
      {
        confirmed: !proposal.milestone.confirmed,
        conversationId,
      },
      {
        onSuccess: (result) => onNotice(result.confirmed ? "Delivery details confirmed." : "Delivery confirmation removed."),
        onError: (error) => onNotice(error.message),
      },
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <div>
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-foreground">
          <CheckCircle2 aria-hidden="true" className="size-4" />
          {proposal.status === "accepted" ? "Accepted proposal" : "Active proposal"}
        </p>
        <h2 className="mt-6 font-display text-3xl font-semibold leading-[1.02] tracking-[-0.045em]">
          {proposal.title}
        </h2>

        <div className="mt-8 border-y border-divider py-7">
          <p className="eyebrow text-subtle">Agreed rate</p>
          <p className="mt-3 font-display text-5xl font-semibold tracking-[-0.06em]">{rate}</p>
          <p className="mt-1 text-sm text-subtle">{rateSuffix.join(" ")}</p>
        </div>

        <dl className="divide-y divide-divider text-sm">
          <div className="flex items-start justify-between gap-5 py-4"><dt className="text-subtle">Quantity</dt><dd className="text-right font-semibold">{proposal.quantity}</dd></div>
          <div className="flex items-start justify-between gap-5 py-4"><dt className="text-subtle">Schedule</dt><dd className="text-right font-semibold">{proposal.schedule}</dd></div>
          <div className="flex items-start justify-between gap-5 py-4"><dt className="text-subtle">Location</dt><dd className="text-right font-semibold">{proposal.location}</dd></div>
          <div className="flex items-start justify-between gap-5 py-4"><dt className="text-subtle">Requirement</dt><dd className="text-right font-semibold">{proposal.dietary}</dd></div>
        </dl>

        {proposal.milestone ? (
          <section className="mt-7 border border-divider bg-white p-5" aria-labelledby="next-delivery-title">
            <p className="eyebrow flex items-center gap-2 text-subtle" id="next-delivery-title">
              <CalendarDays aria-hidden="true" className="size-4" />
              Next delivery
            </p>
            <p className="mt-4 font-display text-3xl font-semibold tracking-[-0.045em]">{proposal.milestone.date}</p>
            <p className="mt-2 text-sm text-subtle">{proposal.milestone.time} · {proposal.milestone.location}</p>
            <button
              aria-pressed={proposal.milestone.confirmed}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[6px] border border-divider bg-white px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              disabled={confirmDelivery.isPending}
              onClick={toggleConfirmation}
              type="button"
            >
              <CheckCircle2 aria-hidden="true" className="size-4" />
              {proposal.milestone.confirmed ? "Details confirmed" : "Confirm delivery details"}
            </button>
          </section>
        ) : null}

        {proposal.status === "accepted" && persistent ? <p className="mt-5 rounded-lg border border-divider p-4 text-sm text-subtle">Payment processing is not enabled yet. Accepting a proposal does not charge either participant.</p> : proposal.status === "accepted" ? (
          <Button asChild className="mt-5 w-full" variant="ember">
            <Link href="/checkout">
              Fund first delivery <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : null}

        <Button asChild className="mt-5 w-full" variant="outline">
          <Link href={`/requests/${proposal.requestId}`}>
            View full request <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-8 flex items-start gap-3 border-t border-divider pt-6 text-sm text-subtle lg:mt-auto">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-foreground" />
        <p>{persistent ? "This conversation is available only to its marketplace participants." : "Contact and payment stay protected through EMBER."}</p>
      </div>
    </div>
  )
}

export function MessagesWorkspace({ actor = "buyer", initialConversationId }: { actor?: "buyer" | "seller"; initialConversationId?: string }) {
  const workspace = useMessagesWorkspace(actor)
  const sendMessage = useSendMessage(actor)
  const markRead = useMarkConversationRead(actor)
  const mode = useMarketplaceMode()
  const persistent = mode.data?.mode !== "demo"
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>("all")
  const [attachedFile, setAttachedFile] = useState<MessageAttachment | null>(null)
  const [composer, setComposer] = useState("")
  const [mobileDealOpen, setMobileDealOpen] = useState(false)
  const [mobileThreadOpen, setMobileThreadOpen] = useState(Boolean(initialConversationId))
  const [notice, setNotice] = useState("")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(initialConversationId ?? "conversation-maria")

  const conversations = useMemo(() => workspace.data?.conversations ?? [], [workspace.data?.conversations])
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0]
  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return conversations.filter((conversation) => {
      const matchesFilter = activeFilter === "all" || conversation.unreadCount > 0
      const matchesQuery = !normalized || [conversation.participant.name, conversation.requestTitle, conversation.preview]
        .some((value) => value.toLowerCase().includes(normalized))
      return matchesFilter && matchesQuery
    })
  }, [activeFilter, conversations, query])

  const visibleUnreadCount = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  )

  const displayedConversationId = selectedConversation?.id
  const displayedUnreadCount = selectedConversation?.unreadCount ?? 0
  const markConversationRead = markRead.mutate
  useEffect(() => {
    if (!displayedConversationId || !displayedUnreadCount) return
    if (!mobileThreadOpen && !window.matchMedia("(min-width: 1024px)").matches) return
    markConversationRead({ conversationId: displayedConversationId }, { onError: (error) => setNotice(error.message) })
  }, [displayedConversationId, displayedUnreadCount, mobileThreadOpen, markConversationRead])

  if (workspace.isLoading) return <MessagesLoading />

  if (workspace.data && !workspace.isError && !conversations.length) return <MarketplaceState title="No conversations yet." message="Send a seller proposal or review bids in your buyer workspace to start a conversation." />

  if (workspace.isError || !workspace.data || !selectedConversation) {
    return (
      <main className="min-h-svh bg-white">
        <SiteHeader active="messages" variant="app" />
        <section className="mx-auto max-w-3xl px-5 py-24 md:px-10" id="content" tabIndex={-1}>
          <p className="eyebrow text-error">Messages unavailable</p>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.05em]">The conversation dropped.</h1>
          <p className="mt-5 text-subtle">{workspace.error?.message ?? "Try loading your messages again."}</p>
          <Button className="mt-8" onClick={() => workspace.refetch()}>Try again</Button>
        </section>
      </main>
    )
  }

  function selectConversation(conversation: Conversation) {
    const unreadCount = conversation.unreadCount
    setSelectedId(conversation.id)
    setMobileThreadOpen(true)
    setComposer("")
    setAttachedFile(null)
    if (unreadCount) {
      setNotice(`${unreadCount} unread message${unreadCount === 1 ? "" : "s"} opened.`)
    } else {
      setNotice("")
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = composer.trim()
    if ((!body && !attachedFile) || sendMessage.isPending) return

    sendMessage.mutate(
      { attachment: attachedFile ?? undefined, body, conversationId: selectedConversation.id },
      {
        onSuccess: () => {
          setComposer("")
          setAttachedFile(null)
          setNotice("Message sent.")
        },
        onError: (error) => setNotice(error.message),
      },
    )
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader active="messages" messageCount={visibleUnreadCount} messageHref={`/messages?role=${actor}`} variant="app" />

      {notice ? (
        <div className="enterprise-panel-raised fixed left-4 right-4 top-[calc(var(--app-header-height)+1rem)] z-30 px-4 py-3 text-sm sm:left-auto sm:max-w-sm" role="status">
          {notice}
          <button className="ml-3 min-h-11 px-2 font-semibold underline underline-offset-4" onClick={() => setNotice("")} type="button">Dismiss</button>
        </div>
      ) : null}

      <main className="mx-auto max-w-[1600px] scroll-mt-32" id="content" tabIndex={-1}>
        <h1 className="sr-only">Messages</h1>
        <div className="grid min-h-[calc(100svh-var(--app-header-height))] bg-white lg:h-[calc(100svh-var(--app-header-height)-40px)] lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className={cn("min-w-0 flex-col border-r border-divider bg-white", mobileThreadOpen ? "hidden lg:flex" : "flex")} aria-label="Conversations">
            <div className="border-b border-divider p-5">
              <label className="relative block">
                <span className="sr-only">Search messages</span>
                <Search aria-hidden="true" className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                <input
                  className="h-12 w-full rounded-lg border border-transparent bg-muted pl-11 pr-4 text-base outline-none transition-colors placeholder:text-subtle focus:border-foreground focus:bg-white focus:ring-2 focus:ring-foreground focus:ring-offset-2 sm:text-sm"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search messages…"
                  type="search"
                  value={query}
                />
              </label>
              <div className="mt-5 flex gap-6" role="group" aria-label="Conversation filter">
                {(["all", "unread"] as const).map((filter) => (
                  <button
                    aria-pressed={activeFilter === filter}
                    className={cn("min-h-11 border-b-2 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2", activeFilter === filter ? "border-ember text-foreground" : "border-transparent text-subtle hover:text-foreground")}
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    type="button"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length ? filteredConversations.map((conversation) => (
                <button
                  aria-current={conversation.id === selectedConversation.id ? "true" : undefined}
                  className={cn("relative flex min-h-28 w-full items-start gap-3 border-b border-divider p-5 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground", conversation.id === selectedConversation.id ? "bg-muted" : "bg-white hover:bg-background")}
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  type="button"
                >
                  {conversation.id === selectedConversation.id ? <span className="absolute inset-y-0 left-0 w-1 bg-ember" /> : null}
                  <ParticipantMark conversation={conversation} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <strong className="truncate text-sm">{conversation.participant.name}</strong>
                      <span className="shrink-0 text-xs text-subtle">{conversation.updatedAt}</span>
                    </span>
                    <span className="mt-1 block truncate text-xs font-semibold text-foreground/70">{conversation.requestTitle}</span>
                    <span className="mt-1 block truncate text-sm text-subtle">{conversation.preview}</span>
                  </span>
                  {conversation.unreadCount ? (
                    <span className="absolute bottom-4 right-5 grid min-w-5 place-items-center rounded-full bg-ember-action px-1.5 py-0.5 text-[10px] font-bold text-white" aria-label={`${conversation.unreadCount} unread`}>
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </button>
              )) : (
                <div className="p-8 text-sm text-subtle">
                  <p className="font-semibold text-foreground">No conversations found.</p>
                  <p className="mt-2">Try another search or show all messages.</p>
                </div>
              )}
            </div>
          </aside>

          <section className={cn("min-w-0 flex-col bg-white", mobileThreadOpen ? "flex" : "hidden lg:flex")} aria-label={`Conversation with ${selectedConversation.participant.name}`}>
            <header className="flex min-h-[88px] items-center gap-3 border-b border-divider px-4 py-3 sm:px-6">
              <button
                aria-label="Back to conversations"
                className="grid size-11 shrink-0 place-items-center rounded-[6px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground lg:hidden"
                onClick={() => setMobileThreadOpen(false)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
              </button>
              <ParticipantMark conversation={selectedConversation} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-display text-lg font-semibold tracking-[-0.025em]">{selectedConversation.participant.name}</h2>
                  {selectedConversation.participant.verified ? <ShieldCheck aria-label="Verified seller" className="size-4 shrink-0" /> : null}
                </div>
                <p className="truncate text-xs text-subtle">{selectedConversation.requestTitle} · {selectedConversation.participant.responseNote}</p>
              </div>
              <Button className="hidden shrink-0 sm:inline-flex 2xl:hidden" onClick={() => setMobileDealOpen(true)} size="sm" variant="outline">Deal details</Button>
              <button
                className="grid size-11 shrink-0 place-items-center rounded-lg border border-divider hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground sm:hidden"
                onClick={() => setMobileDealOpen(true)}
                type="button"
                aria-label="Open deal details"
              >
                <FileText aria-hidden="true" className="size-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8" aria-live="polite">
              <div className="mx-auto max-w-3xl">
                <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">
                  <span className="h-px flex-1 bg-divider" /> Today <span className="h-px flex-1 bg-divider" />
                </div>
                <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-center text-xs text-subtle">
                  <LockKeyhole aria-hidden="true" className="size-3.5" />
                  {selectedConversation.proposal.status === "accepted" ? "Proposal accepted." : "Proposal shared."} Keep delivery details and payment in EMBER.
                </div>

                <div className="mt-8 space-y-7">
                  {selectedConversation.messages.map((message) => {
                    const own = message.author === (workspace.data.currentUser.role ?? "buyer")
                    return (
                      <article className={cn("flex gap-3", own ? "justify-end" : "justify-start")} key={message.id} aria-label={`${own ? "You" : selectedConversation.participant.name} at ${message.sentAt}`}>
                        {!own ? <ParticipantMark conversation={selectedConversation} /> : null}
                        <div className={cn("min-w-0 max-w-[85%] break-words rounded-xl px-5 py-4 sm:max-w-[76%]", own ? "rounded-br-sm bg-foreground text-white" : "rounded-bl-sm bg-muted text-foreground")}>
                          {message.body ? <p className="text-sm leading-relaxed sm:text-[15px]">{message.body}</p> : null}
                          {message.attachment ? (
                            <button
                              className={cn("mt-4 flex min-h-16 w-full items-center gap-3 rounded-[6px] border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember", own ? "border-white/20 bg-white/10" : "border-divider bg-white")}
                              onClick={() => setNotice(`${message.attachment?.name} is ready to review.`)}
                              type="button"
                            >
                              <span className="grid size-10 shrink-0 place-items-center rounded-[6px] bg-ember text-white"><FileText aria-hidden="true" className="size-5" /></span>
                              <span className="min-w-0"><strong className="block truncate text-sm">{message.attachment.name}</strong><span className={cn("mt-0.5 block text-xs", own ? "text-white/60" : "text-subtle")}>{message.attachment.size} · PDF document</span></span>
                            </button>
                          ) : null}
                          <p className={cn("mt-3 flex items-center justify-end gap-1 text-[11px]", own ? "text-white/55" : "text-subtle")}>
                            {message.sentAt}
                            {own ? message.status === "sending" ? " · Sending…" : <Check aria-label="Sent" className="size-3" /> : null}
                          </p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>

            <form className="sticky bottom-0 border-t border-divider bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5" onSubmit={submitMessage}>
              <div className="mx-auto max-w-3xl">
                {attachedFile ? (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-[6px] border border-divider bg-background px-3 py-2 text-xs">
                    <span className="min-w-0 truncate"><strong>{attachedFile.name}</strong> · {attachedFile.size}</span>
                    <button className="min-h-11 shrink-0 px-2 font-semibold underline underline-offset-4" onClick={() => setAttachedFile(null)} type="button">Remove</button>
                  </div>
                ) : null}
                <div className="flex items-end gap-2 rounded-xl border border-divider bg-background p-2 focus-within:border-foreground focus-within:ring-2 focus-within:ring-foreground focus-within:ring-offset-2">
                  <button
                    aria-label={attachedFile ? "Remove attached file" : "Attach a file"}
                    className="grid size-11 shrink-0 place-items-center rounded-[6px] text-subtle hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                    disabled={persistent}
                    title={persistent ? "File storage will be enabled in a later step" : undefined}
                    onClick={() => setAttachedFile(attachedFile ? null : draftAttachment)}
                    type="button"
                  >
                    <Paperclip aria-hidden="true" className="size-5" />
                  </button>
                  <textarea
                    aria-label="Message"
                    className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-3 text-base outline-none placeholder:text-subtle sm:text-sm"
                    maxLength={1000}
                    onChange={(event) => setComposer(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={`Message ${selectedConversation.participant.name}…`}
                    rows={1}
                    value={composer}
                  />
                  <Button aria-label="Send message" className="size-11 min-h-11 shrink-0 px-0" disabled={(!composer.trim() && !attachedFile) || sendMessage.isPending} size="sm" type="submit" variant="ember">
                    <Send aria-hidden="true" className="size-4" />
                  </Button>
                </div>
                <p className="mt-2 hidden text-right text-[11px] text-subtle sm:block">Enter to send · Shift + Enter for a new line</p>
              </div>
            </form>
          </section>

          <aside className="hidden min-w-0 overflow-y-auto border-l border-divider bg-background p-7 2xl:block" aria-label="Deal context">
            <DealContext actor={actor} persistent={persistent} conversationId={selectedConversation.id} onNotice={setNotice} proposal={selectedConversation.proposal} />
          </aside>
        </div>
      </main>

      <footer className="hidden h-10 items-center justify-center bg-black text-[11px] tracking-[0.08em] text-white/55 lg:flex">
        EMBER — Where demand sparks opportunity.
      </footer>

      <Dialog onOpenChange={setMobileDealOpen} open={mobileDealOpen}>
        <DialogContent className="max-h-[88svh] overflow-y-auto">
          <DialogTitle>Deal details</DialogTitle>
          <DialogDescription>Accepted proposal and delivery context for this conversation.</DialogDescription>
          <div className="mt-7"><DealContext actor={actor} persistent={persistent} conversationId={selectedConversation.id} onNotice={setNotice} proposal={selectedConversation.proposal} /></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
