import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import type { ExecArgs, ICustomerModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../modules/marketplace"
import type MarketplaceModuleService from "../modules/marketplace/service"

export default async function verifyAccountSessions({ container }: ExecArgs) {
  const target = new URL(process.env.DATABASE_URL ?? "postgres://invalid")
  assert.ok(process.env.NODE_ENV !== "production" && target.hostname === "127.0.0.1" && target.port === "55432" && target.pathname === "/ember", "Session QA requires the isolated local database.")
  const customers = await container.resolve<ICustomerModuleService>(Modules.CUSTOMER).listCustomers({}, { take: 1000 })
  const customer = customers.find(row => row.email.startsWith("ember-qa-") && row.email.endsWith("@example.invalid"))
  assert.ok(customer, "Run local account integration QA first.")
  const service = container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  const session = await service.createAccountSession(customer.id)
  const digest = createHash("sha256").update(session.token).digest("hex")
  try {
    const [row] = await service.listAccountSessions({ token_hash: digest }, { take: 1 })
    assert.ok(row && row.token_hash === digest && row.token_hash !== session.token, "Only a token digest may be stored.")
    assert.equal(await service.customerForSession(session.token), customer.id)
    await service.updateAccountSessions({ id: row.id, expires_at: new Date(Date.now() - 1000) })
    await assert.rejects(service.customerForSession(session.token), error => error instanceof Error && "type" in error && error.type === "unauthorized")
  } finally { await service.revokeAccountSession(session.token) }
  assert.equal((await service.listAccountSessions({ token_hash: digest }, { take: 1 })).length, 0)
  console.log("PASS: session tokens are hashed at rest; expired and revoked sessions are rejected. Only isolated QA session data was changed.")
}
