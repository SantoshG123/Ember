import type { ExecArgs } from "@medusajs/framework/types"
import { MARKETPLACE_MODULE } from "../modules/marketplace"
import type MarketplaceModuleService from "../modules/marketplace/service"

// Creates isolated test records without weakening HTTP impersonation restrictions.
export default async function createConcurrencyFixture({ container }: ExecArgs) {
  const target = new URL(process.env.DATABASE_URL ?? "postgres://invalid")
  if (process.env.NODE_ENV === "production" || process.env.EMBER_LOCAL_DATA_ACCESS !== "true" || target.hostname !== "127.0.0.1" || target.port !== "55432" || target.pathname !== "/ember") {
    throw new Error("Concurrency fixtures require the isolated local EMBER database.")
  }
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
  console.log(`EMBER_QA_FIXTURE:${JSON.stringify({ requestId: request.id, bidIds })}`)
}
