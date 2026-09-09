import { InjectManager, InjectTransactionManager, MedusaContext, MedusaError, MedusaService } from "@medusajs/framework/utils"
import type { Context, InferTypeOf } from "@medusajs/framework/types"
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { Bid, Bookmark, Conversation, Message, OfferDraft, Opportunity, Participant, Request } from "./models"

type Person = InferTypeOf<typeof Participant>
type RequestRow = InferTypeOf<typeof Request>
type BidRow = InferTypeOf<typeof Bid>
type Json = Record<string, unknown>
type DbContext = Context<EntityManager>
const notFound = () => new MedusaError(MedusaError.Types.NOT_FOUND, "That marketplace record is unavailable.")
const denied = () => new MedusaError(MedusaError.Types.NOT_ALLOWED, "You do not have access to this record.")
const conflict = (message: string) => new MedusaError(MedusaError.Types.CONFLICT, message)
const date = (value: Date | string) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
const time = (value: Date | string) => new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value)

export type Mutation =
  | { action: "create-request"; actor: string; data: { category: string; title: string; description: string; budgetMin: number; budgetMax: number; frequency: "one-time" | "weekly" | "monthly" | "flexible"; timing: string; zip: string; referenceName?: string } }
  | { action: "create-bid"; actor: string; data: { requestId: string; pricePerDelivery: number; deliveryCount: number; cadence: string; earliestStart: string; proposal: string } }
  | { action: "decide-bid"; actor: string; data: { bidId: string; action: "accept" | "decline" } }
  | { action: "send-message"; actor: string; data: { conversationId: string; body: string; attachment?: Json } }
  | { action: "read-message"; actor: string; data: { conversationId: string } }
  | { action: "confirm-milestone"; actor: string; data: { conversationId: string; confirmed: boolean } }
  | { action: "save-opportunity"; actor: string; data: { slug: string; saved: boolean } }
  | { action: "draft-offer"; actor: string; data: { slug: string; pricePerMeal: number; weeklyCapacity: number; deliveryDays: string; note: string } }

class MarketplaceModuleService extends MedusaService({ Participant, Request, Bid, Opportunity, Conversation, Message, Bookmark, OfferDraft }) {
  async actorForCustomer(customerId: string) {
    const [actor] = await this.listParticipants({ customer_id: customerId }, { take: 1 })
    if (!actor) throw denied()
    return actor.id
  }

  async actor(actorId: string, role?: "buyer" | "seller", context?: DbContext) {
    const actor = await this.retrieveParticipant(actorId, {}, context)
    if (role && actor.role !== role) throw denied()
    return actor
  }

  bidDto(bid: BidRow, seller: Person, conversationId?: string) {
    const details = bid.details ?? {}
    const profile = seller.profile ?? {}
    return {
      id: bid.id, seller: seller.name, initials: seller.initials,
      rating: Number(profile.rating ?? 0), reviews: Number(profile.reviews ?? 0),
      pricePerDelivery: bid.price_per_delivery, totalPrice: bid.price_per_delivery * bid.delivery_count,
      deliveryCount: bid.delivery_count, cadence: bid.cadence, earliestStart: bid.earliest_start,
      distance: Number(details.distance ?? 0), summary: String(details.summary ?? bid.proposal.slice(0, 160)),
      proposal: bid.proposal, fitReason: details.fitReason, recommended: details.recommended ?? false,
      status: bid.status, conversationId,
    }
  }

  async requestDto(row: RequestRow, context?: DbContext, viewerId = row.buyer_id) {
    const bids = await this.listBids({ request_id: row.id }, { take: 100, order: { created_at: "ASC" } }, context)
    const conversations = await this.listConversations({ request_id: row.id }, { take: 100 }, context)
    return {
      id: row.id, buyerId: viewerId === row.buyer_id ? row.buyer_id : "", category: row.category, title: row.title, description: row.description,
      budgetMin: row.budget_min, budgetMax: row.budget_max, frequency: row.frequency,
      timing: row.timing, zip: row.zip, locationArea: row.location_area, status: row.status,
      referenceName: viewerId === row.buyer_id ? row.reference_name ?? undefined : undefined, createdAt: row.created_at,
      bidCount: bids.length,
      bids: await Promise.all(bids.filter(bid => viewerId === row.buyer_id || bid.seller_id === viewerId).map(async (bid) => this.bidDto(bid, await this.actor(bid.seller_id, undefined, context), conversations.find(c => c.seller_id === bid.seller_id)?.id))),
    }
  }

  async requests(actorId: string, id?: string) {
    const actor = await this.actor(actorId)
    const rows = id ? [await this.retrieveRequest(id)] : await this.listRequests({ status: "open" }, { take: 200, order: { created_at: "DESC" } })
    // Sellers can browse open requests. Closed requests stay visible to their buyer or a participating seller.
    for (const row of rows) {
      if (row.status !== "open" && row.buyer_id !== actor.id && !(await this.listBids({ request_id: row.id, seller_id: actor.id }, { take: 1 })).length) throw denied()
    }
    const result = await Promise.all(rows.map(row => this.requestDto(row, undefined, actor.id)))
    return id ? result[0] : { requests: result }
  }

  async buyerDashboard(actorId: string) {
    await this.actor(actorId, "buyer")
    const requests = await this.listRequests({ buyer_id: actorId }, { take: 200, order: { created_at: "DESC" } })
    const rows = await Promise.all(requests.map(async row => {
      const request = await this.requestDto(row)
      const accepted = request.bids.find(bid => bid.status === "accepted")
      const status = row.status === "fulfilled" ? "completed" : row.status === "matched" ? "matched" : request.bids.some(bid => bid.status === "active") ? "ready" : "collecting"
      return {
        id: row.id, title: row.title, category: row.category, status,
        statusLabel: status === "completed" ? "Completed" : status === "matched" ? "Seller selected" : status === "ready" ? "Ready to compare" : "Collecting bids",
        bidCount: request.bidCount, posted: `Posted ${date(row.created_at)}`, deadline: row.timing,
        neighborhood: row.location_area, budget: `${money(row.budget_min)}–${money(row.budget_max)} · ${row.frequency}`,
        bids: request.bids, acceptedSeller: accepted?.seller,
      }
    }))
    const workspace = await this.messagesWorkspace(actorId)
    return { activeRequests: requests.filter(row => row.status === "open" || row.status === "matched").length, newBids: rows.flatMap(row => row.bids).filter(bid => bid.status === "active").length, unreadMessages: workspace.unreadCount, requests: rows }
  }

  async messagesWorkspace(actorId: string) {
    const actor = await this.actor(actorId)
    const conversations = await this.listConversations(actor.role === "buyer" ? { buyer_id: actorId } : { seller_id: actorId }, { take: 200, order: { updated_at: "DESC" } })
    const rows = await Promise.all(conversations.map(async conversation => {
      const other = await this.actor(actor.role === "buyer" ? conversation.seller_id : conversation.buyer_id)
      const request = await this.retrieveRequest(conversation.request_id)
      const messages = await this.listMessages({ conversation_id: conversation.id }, { take: 1000, order: { created_at: "ASC", id: "ASC" } })
      const readAt = actor.role === "buyer" ? conversation.buyer_read_at : conversation.seller_read_at
      const unreadCount = messages.filter(message => message.author_id !== actorId && (!readAt || new Date(message.created_at) > new Date(readAt))).length
      return {
        id: conversation.id, participant: { id: other.id, initials: other.initials, name: other.name, responseNote: String(other.profile?.responseNote ?? "Response time not yet available"), role: String(other.profile?.role ?? other.role), verified: other.profile?.verified === true },
        requestTitle: request.title, preview: messages.at(-1)?.body ?? "Start a conversation", updatedAt: time(messages.at(-1)?.created_at ?? conversation.created_at), unreadCount,
        status: conversation.status, proposal: conversation.proposal,
        messages: messages.map(message => ({ id: message.id, author: message.author_id === conversation.buyer_id ? "buyer" : "seller", body: message.body, sentAt: time(message.created_at), status: "sent", attachment: message.attachment ?? undefined })),
      }
    }))
    return { currentUser: { id: actor.id, initials: actor.initials, name: actor.name, role: actor.role }, unreadCount: rows.reduce((total, row) => total + row.unreadCount, 0), conversations: rows }
  }

  async opportunities(actorId: string, slug?: string) {
    await this.actor(actorId)
    const opportunities = await this.listOpportunities(slug ? { slug } : {}, { take: 200 })
    if (slug && !opportunities.length) throw notFound()
    const bookmarks = await this.listBookmarks({ participant_id: actorId }, { take: 200 })
    const rows = opportunities.map(opportunity => ({ ...opportunity.details, slug: opportunity.slug, saved: bookmarks.some(mark => mark.opportunity_id === opportunity.id), refreshedAt: `Updated ${date(opportunity.updated_at)}` }))
    return slug ? rows[0] : { opportunities: rows }
  }

  async sellerWorkspace(actorId: string) {
    const actor = await this.actor(actorId, "seller")
    const bids = await this.listBids({ seller_id: actorId }, { take: 200, order: { created_at: "DESC" } })
    const conversations = await this.listConversations({ seller_id: actorId }, { take: 200 })
    const rows = await Promise.all(bids.map(async bid => {
      const request = await this.retrieveRequest(bid.request_id)
      const buyer = await this.actor(request.buyer_id)
      return { ...this.bidDto(bid, actor, conversations.find(row => row.request_id === request.id)?.id), requestId: request.id, requestTitle: request.title, buyer: { id: buyer.id, name: buyer.name } }
    }))
    const requestList = await this.requests(actorId) as { requests: unknown[] }
    const opportunities = await this.opportunities(actorId) as { opportunities: Array<Json> }
    const drafts = await this.listOfferDrafts({ seller_id: actorId }, { take: 200, order: { created_at: "DESC" } })
    return {
      currentUser: { id: actor.id, name: actor.name, initials: actor.initials }, unreadMessages: (await this.messagesWorkspace(actorId)).unreadCount,
      bids: rows, requests: requestList.requests, savedOpportunities: opportunities.opportunities.filter(row => row.saved),
      offerDrafts: await Promise.all(drafts.map(async draft => ({ draftId: draft.id, slug: (await this.retrieveOpportunity(draft.opportunity_id)).slug, pricePerMeal: draft.price_per_meal, weeklyCapacity: draft.weekly_capacity, deliveryDays: draft.delivery_days, note: draft.note, status: "draft" }))),
    }
  }

  @InjectManager()
  async mutate(input: Mutation, @MedusaContext() context?: DbContext): Promise<unknown> {
    return this.mutate_(input, context)
  }

  @InjectTransactionManager()
  protected async mutate_(input: Mutation, @MedusaContext() context?: DbContext): Promise<unknown> {
    const manager = context?.transactionManager
    if (!manager) throw new Error("A marketplace database transaction is required.")
    const actor = await this.actor(input.actor, undefined, context)
    if (input.action === "create-request") {
      if (actor.role !== "buyer") throw denied()
      const data = input.data
      const row = await this.createRequests({ buyer_id: actor.id, title: data.title, category: data.category, description: data.description, budget_min: data.budgetMin, budget_max: data.budgetMax, frequency: data.frequency, timing: data.timing, zip: data.zip, location_area: `ZIP ${data.zip}`, reference_name: data.referenceName ?? null, status: "open" }, context)
      return { ...await this.requestDto(row, context), dataMode: "medusa" }
    }
    if (input.action === "create-bid") {
      if (actor.role !== "seller") throw denied()
      const data = input.data
      await manager.execute("SELECT id FROM ember_request WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [data.requestId])
      const request = await this.retrieveRequest(data.requestId, {}, context)
      if (request.buyer_id === actor.id) throw denied()
      if (request.status !== "open") throw conflict("This request is no longer accepting proposals.")
      if ((await this.listBids({ request_id: request.id, seller_id: actor.id, status: "active" }, { take: 1 }, context)).length) throw conflict("You already have an active proposal for this request.")
      const bid = await this.createBids({ request_id: request.id, seller_id: actor.id, price_per_delivery: data.pricePerDelivery, delivery_count: data.deliveryCount, cadence: data.cadence, earliest_start: data.earliestStart, proposal: data.proposal, status: "active" }, context)
      const [existing] = await this.listConversations({ request_id: request.id, seller_id: actor.id }, { take: 1 }, context)
      const proposal = { id: bid.id, requestId: request.id, title: request.title, status: "active", rate: `${money(bid.price_per_delivery)} per delivery`, quantity: `${bid.delivery_count} deliveries`, schedule: bid.cadence, location: request.location_area, dietary: "See request requirements" }
      const conversation = existing
        ? await this.updateConversations({ id: existing.id, proposal }, context)
        : await this.createConversations({ request_id: request.id, buyer_id: request.buyer_id, seller_id: actor.id, proposal }, context)
      const buyer = await this.actor(request.buyer_id, undefined, context)
      return { bid: { ...this.bidDto(bid, actor, conversation.id), requestId: request.id, requestTitle: request.title, buyer: { id: buyer.id, name: buyer.name } } }
    }
    if (input.action === "decide-bid") {
      if (actor.role !== "buyer") throw denied()
      const initialBid = await this.retrieveBid(input.data.bidId, {}, context)
      await manager.execute("SELECT id FROM ember_request WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [initialBid.request_id])
      const request = await this.retrieveRequest(initialBid.request_id, {}, context)
      if (request.buyer_id !== actor.id) throw denied()
      const bid = await this.retrieveBid(input.data.bidId, {}, context)
      const wanted = input.data.action === "accept" ? "accepted" : "declined"
      if (bid.status !== wanted) {
        if (request.status !== "open" || bid.status !== "active") throw conflict("This bid cannot be changed after a seller has been selected or the bid has been declined.")
        await this.updateBids({ id: bid.id, status: wanted, accepted_at: wanted === "accepted" ? new Date() : null }, context)
        if (wanted === "accepted") {
          await this.updateRequests({ id: request.id, status: "matched" }, context)
          const others = await this.listBids({ request_id: request.id, status: "active" }, { take: 1000 }, context)
          if (others.length) await this.updateBids(others.map(other => ({ id: other.id, status: "declined" as const })), context)
          const [conversation] = await this.listConversations({ request_id: request.id, seller_id: bid.seller_id }, { take: 1 }, context)
          if (conversation) await this.updateConversations({ id: conversation.id, proposal: { ...conversation.proposal, status: "accepted" } }, context)
        }
      }
      const seller = await this.actor(bid.seller_id, undefined, context)
      return { action: input.data.action, bidId: bid.id, requestId: request.id, seller: seller.name, requestStatus: wanted === "accepted" ? "matched" : request.status }
    }
    if (input.action === "send-message" || input.action === "read-message" || input.action === "confirm-milestone") {
      await manager.execute("SELECT id FROM ember_conversation WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [input.data.conversationId])
      const conversation = await this.retrieveConversation(input.data.conversationId, {}, context)
      if (actor.id !== conversation.buyer_id && actor.id !== conversation.seller_id) throw denied()
      if (input.action === "read-message") {
        await this.updateConversations({ id: conversation.id, ...(actor.role === "buyer" ? { buyer_read_at: new Date() } : { seller_read_at: new Date() }) }, context)
        return { action: "read", conversationId: conversation.id }
      }
      if (conversation.status !== "active") throw conflict("This conversation is archived.")
      if (input.action === "confirm-milestone") {
        if (actor.id !== conversation.buyer_id) throw denied()
        const milestone = conversation.proposal.milestone as Json | undefined
        if (!milestone) throw notFound()
        await this.updateConversations({ id: conversation.id, proposal: { ...conversation.proposal, milestone: { ...milestone, confirmed: input.data.confirmed } } }, context)
        return { conversationId: conversation.id, confirmed: input.data.confirmed }
      }
      const message = await this.createMessages({ conversation_id: conversation.id, author_id: actor.id, body: input.data.body.trim(), attachment: input.data.attachment ?? null }, context)
      await this.updateConversations({ id: conversation.id, ...(actor.role === "buyer" ? { buyer_read_at: new Date() } : { seller_read_at: new Date() }) }, context)
      return { message: { id: message.id, author: actor.role, body: message.body, sentAt: time(message.created_at), status: "sent", attachment: message.attachment ?? undefined } }
    }
    const [opportunity] = await this.listOpportunities({ slug: input.data.slug }, { take: 1 }, context)
    if (!opportunity) throw notFound()
    await manager.execute("SELECT id FROM ember_opportunity WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [opportunity.id])
    if (input.action === "save-opportunity") {
      const bookmarks = await this.listBookmarks({ participant_id: actor.id, opportunity_id: opportunity.id }, { take: 1 }, context)
      if (input.data.saved && !bookmarks.length) await this.createBookmarks({ participant_id: actor.id, opportunity_id: opportunity.id }, context)
      if (!input.data.saved && bookmarks.length) await this.deleteBookmarks(bookmarks.map(row => row.id), context)
      return { slug: input.data.slug, saved: input.data.saved }
    }
    if (actor.role !== "seller") throw denied()
    const data = input.data
    const draft = await this.createOfferDrafts({ seller_id: actor.id, opportunity_id: opportunity.id, price_per_meal: data.pricePerMeal, weekly_capacity: data.weeklyCapacity, delivery_days: data.deliveryDays, note: data.note }, context)
    return { ...data, draftId: draft.id, status: "draft" }
  }
}

export default MarketplaceModuleService
