import type { ExecArgs } from "@medusajs/framework/types"
import { MARKETPLACE_MODULE } from "../modules/marketplace"
import type MarketplaceModuleService from "../modules/marketplace/service"
import { seedDashboard, seedOpportunity, seedWorkspace } from "./marketplace-seed-data"

// Explicit test data, never an automatic startup fallback or a production initializer.
// Every insert checks its stable ID; rerunning does not reset user decisions or messages.
export default async function seedMarketplace({ container }: ExecArgs) {
  if (process.env.NODE_ENV === "production" || process.env.EMBER_LOCAL_DATA_ACCESS !== "true") {
    throw new Error("Marketplace fixtures require explicit local development mode.")
  }
  const service = container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  const people = [
    { id: "ember-buyer", role: "buyer" as const, name: "Jordan Lee", initials: "JL", profile: {} },
    ...seedDashboard.requests[0].bids.map(bid => ({
      id: bid.id === "bid-maria" ? "ember-seller" : `seller-${bid.id.slice(4)}`,
      role: "seller" as const, name: bid.seller, initials: bid.initials,
      profile: { rating: bid.rating, reviews: bid.reviews, role: "Local test seller", verified: false },
    })),
    ...seedWorkspace.conversations.filter(row => row.id !== "conversation-maria").map(row => ({
      id: row.participant.id, role: "seller" as const, name: row.participant.name, initials: row.participant.initials,
      profile: { role: "Local test seller", verified: false },
    })),
    { id: "seller-joinery", role: "seller" as const, name: "Eastside Joinery", initials: "EJ", profile: {} },
  ]
  for (const person of people) {
    if (!(await service.listParticipants({ id: person.id }, { take: 1 })).length) await service.createParticipants(person)
  }
  const budgets = [[120, 180], [90, 140], [40, 65], [700, 1100]]
  for (const [index, request] of seedDashboard.requests.entries()) {
    if (!(await service.listRequests({ id: request.id }, { take: 1 })).length) {
      await service.createRequests({
        id: request.id, buyer_id: "ember-buyer", title: request.title, category: request.category,
        description: `${request.title}. This is a clearly labeled local development request. Please propose your availability, approach, and total service price before any agreement.`,
        budget_min: budgets[index][0], budget_max: budgets[index][1],
        frequency: index === 3 ? "one-time" : "weekly", timing: request.deadline,
        zip: "78704", location_area: request.neighborhood, status: index === 3 ? "fulfilled" : "open",
      })
    }
    for (const bid of request.bids) {
      if (!(await service.listBids({ id: bid.id }, { take: 1 })).length) {
        await service.createBids({
          id: bid.id, request_id: request.id, seller_id: bid.id === "bid-maria" ? "ember-seller" : `seller-${bid.id.slice(4)}`,
          price_per_delivery: bid.pricePerDelivery, delivery_count: bid.deliveryCount, cadence: bid.cadence,
          earliest_start: bid.earliestStart, proposal: bid.proposal, status: "active",
          details: { summary: bid.summary, distance: bid.distance, recommended: "recommended" in bid && bid.recommended, fitReason: "fitReason" in bid ? bid.fitReason : undefined },
        })
      }
    }
  }
  // Conversations and bids refer to the same request and price; no fictional accepted deal.
  for (const row of seedWorkspace.conversations) {
    const sellerId = row.id === "conversation-maria" ? "ember-seller" : row.participant.id
    const bidId = row.id === "conversation-maria" ? "bid-maria" : `bid-${row.id.slice(13)}`
    const request = await service.retrieveRequest(row.proposal.requestId)
    if (!(await service.listBids({ id: bidId }, { take: 1 })).length) {
      await service.createBids({ id: bidId, request_id: request.id, seller_id: sellerId,
        price_per_delivery: row.id === "conversation-lawn" ? 112 : 58, delivery_count: 1,
        cadence: row.proposal.schedule, earliest_start: "To be agreed", proposal: row.messages[0].body, status: "active" })
    }
    const bid = await service.retrieveBid(bidId)
    const existed = (await service.listConversations({ id: row.id }, { take: 1 })).length > 0
    if (!existed) await service.createConversations({ id: row.id, request_id: request.id, buyer_id: "ember-buyer", seller_id: sellerId,
      proposal: { ...row.proposal, id: bidId, title: request.title, status: "active", rate: `$${bid.price_per_delivery} per delivery`, quantity: `${bid.delivery_count} deliveries`, location: request.location_area, schedule: bid.cadence } })
    for (const message of row.messages) {
      if (!(await service.listMessages({ id: message.id }, { take: 1 })).length) await service.createMessages({
        id: message.id, conversation_id: row.id, author_id: message.author === "buyer" ? "ember-buyer" : sellerId, body: message.body,
      })
    }
    if (!existed && row.unreadCount === 0) await service.updateConversations({ id: row.id, buyer_read_at: new Date(), seller_read_at: new Date() })
  }
  // Other existing proposals need a real conversation for the message-seller action.
  for (const bid of await service.listBids({}, { take: 1000 })) {
    if ((await service.listConversations({ request_id: bid.request_id, seller_id: bid.seller_id }, { take: 1 })).length) continue
    const request = await service.retrieveRequest(bid.request_id)
    await service.createConversations({ id: `conversation-${bid.id}`, request_id: request.id, buyer_id: request.buyer_id, seller_id: bid.seller_id,
      proposal: { id: bid.id, requestId: request.id, title: request.title, status: bid.status === "accepted" ? "accepted" : "active", rate: `$${bid.price_per_delivery} per delivery`, quantity: `${bid.delivery_count} deliveries`, schedule: bid.cadence, location: request.location_area, dietary: "See request requirements" } })
  }
  if (!(await service.listOpportunities({ slug: seedOpportunity.slug }, { take: 1 })).length) {
    await service.createOpportunities({ id: "opportunity-east-austin-team-lunch", slug: seedOpportunity.slug,
      details: { ...seedOpportunity, verifiedLabel: "Seeded research example", description: `Local development example, not measured live demand. ${seedOpportunity.description}` } })
  }
  container.resolve("logger").info("EMBER local fixtures ready; existing marketplace records were preserved.")
}
