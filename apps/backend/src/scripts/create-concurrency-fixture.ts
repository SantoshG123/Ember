import type { ExecArgs } from "@medusajs/framework/types"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { MARKETPLACE_MODULE } from "../modules/marketplace"
import type MarketplaceModuleService from "../modules/marketplace/service"

// Creates isolated test records without weakening HTTP impersonation restrictions.
export default async function createConcurrencyFixture({ container }: ExecArgs) {
  const target = new URL(process.env.DATABASE_URL ?? "postgres://invalid")
  if (process.env.NODE_ENV === "production" || process.env.EMBER_LOCAL_DATA_ACCESS !== "true" || target.hostname !== "127.0.0.1" || target.port !== "55432" || target.pathname !== "/ember") {
    throw new Error("Concurrency fixtures require the isolated local EMBER database.")
  }
  // Medusa exec runs from apps/backend. Store identifiers only, outside Git.
  const artifactDirectory = resolve(process.cwd(), "../../.local")
  const artifactPath = resolve(artifactDirectory, "qa-concurrency.json")
  if (existsSync(artifactPath)) throw new Error("QA concurrency identifiers already exist. Verify that run before archiving its local identifier file for a new run.")
  const service = container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  const request = await service.mutate({ action: "create-request", actor: "ember-buyer", data: {
    category: "QA fixtures", title: `EMBER QA concurrency ${Date.now()}`, description: "Isolated automated verification request for concurrent proposal acceptance. No real service, delivery, or payment is requested.",
    budgetMin: 20, budgetMax: 100, frequency: "one-time", timing: "Automated local test only", zip: "78704",
  } }) as { id: string }
  const bidIds: string[] = []
  for (const actor of ["ember-seller", "seller-tuscany"]) {
    const result = await service.mutate({ action: "create-bid", actor, data: {
      requestId: request.id, pricePerDelivery: 29.99, deliveryCount: 2, cadence: "QA only", earliestStart: "Local test", proposal: "Automated verification proposal only. No service or payment will occur.",
    } }) as { bid: { id: string } }
    bidIds.push(result.bid.id)
  }
  const outsiderId = `qa-buyer-${request.id}`
  await service.createParticipants({ id: outsiderId, role: "buyer", name: "Isolated QA outsider", initials: "QA", profile: {} })
  const forbidden = (error: unknown) => error instanceof Error && "type" in error && error.type === "not_allowed"
  await assert.rejects(service.mutate({ action: "decide-bid", actor: outsiderId, data: { bidId: bidIds[0], action: "accept" } }), forbidden)
  const [conversation] = await service.listConversations({ request_id: request.id, seller_id: "ember-seller" }, { take: 1 })
  await assert.rejects(service.mutate({ action: "send-message", actor: outsiderId, data: { conversationId: conversation.id, body: "This unauthorized QA message must never be stored." } }), forbidden)
  await assert.rejects(service.mutate({ action: "read-message", actor: outsiderId, data: { conversationId: conversation.id } }), forbidden)
  assert.equal((await service.listMessages({ conversation_id: conversation.id }, { take: 1 })).length, 0)
  assert.equal((await service.retrieveRequest(request.id)).status, "open")
  await mkdir(artifactDirectory, { recursive: true })
  await writeFile(artifactPath, `${JSON.stringify({ requestId: request.id, bidIds }, null, 2)}\n`, { flag: "wx", mode: 0o600 })
  console.log("OWNERSHIP passed: another buyer cannot accept, send, or mark this conversation read. QA identifiers saved locally.")
  console.log(`EMBER_QA_FIXTURE:${JSON.stringify({ requestId: request.id, bidIds })}`)
}
