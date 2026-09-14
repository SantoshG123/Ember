import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import type { ExecArgs } from "@medusajs/framework/types"
import { MARKETPLACE_MODULE } from "../modules/marketplace"
import type MarketplaceModuleService from "../modules/marketplace/service"

export default async function verifySessionControls({ container }: ExecArgs) {
  const target = new URL(process.env.DATABASE_URL ?? "postgres://invalid")
  assert.ok(process.env.NODE_ENV !== "production" && target.hostname === "127.0.0.1" && target.port === "55432" && target.pathname === "/ember", "Session QA requires the isolated local database.")
  const service = container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  // Synthetic module-only customers are never exposed through account HTTP APIs.
  // Every participant/session below belongs to this run and is removed in finally.
  const customerIds = [`session-qa-${randomUUID()}`, `session-qa-${randomUUID()}`]
  const tokens: string[] = []
  const create = async (customerId: string) => {
    const session = await service.createAccountSession(customerId)
    tokens.push(session.token)
    return session
  }
  const unauthorized = (error: unknown) => error instanceof Error && "type" in error && error.type === "unauthorized"
  try {
    for (const id of customerIds) await service.provisionAccount(id, "Isolated session QA", "buyer")
    const current = await create(customerIds[0])
    const foreign = await create(customerIds[1])
    const extras = []
    for (let index = 0; index < 22; index++) extras.push(await create(customerIds[0]))
    const expired = extras[21]
    const expiredRow = await service.sessionForToken(expired.token)
    await service.updateAccountSessions({ id: expiredRow.id, expires_at: new Date(Date.now() - 1000) })
    await assert.rejects(service.activeSessions(expired.token), unauthorized)
    await assert.rejects(service.endOtherSessions(expired.token), unauthorized)
    const first = await service.activeSessions(current.token)
    const second = await service.activeSessions(current.token, 20)
    assert.equal(first.count, 22)
    assert.equal(first.sessions.length, 20)
    assert.equal(second.sessions.length, 2)
    const rows = [...first.sessions, ...second.sessions]
    assert.equal(new Set(rows.map(row => row.id)).size, 22)
    assert.equal(rows.filter(row => row.current).length, 1)
    assert.ok(!rows.some(row => row.id === expiredRow.id))
    for (const row of rows) assert.deepEqual(Object.keys(row).sort(), ["createdAt", "current", "expiresAt", "id"].sort())
    const foreignId = (await service.sessionForToken(foreign.token)).id
    await assert.rejects(service.endOtherSessions(current.token, foreignId))
    const selectedId = (await service.sessionForToken(extras[0].token)).id
    assert.equal((await service.endOtherSessions(current.token, selectedId)).revoked, 1)
    await assert.rejects(service.customerForSession(extras[0].token), unauthorized)
    // Same-account bulk requests are serialized; the second is an idempotent no-op.
    const results = await Promise.all([service.endOtherSessions(current.token), service.endOtherSessions(current.token)])
    assert.equal(results.reduce((sum, result) => sum + result.revoked, 0), 20)
    assert.equal((await service.activeSessions(current.token)).count, 1)
    assert.equal(await service.customerForSession(foreign.token), customerIds[1])
    // Two distinct current sessions racing must not both retain authority after
    // one has revoked the other while it waited for the customer lock.
    const contender = await create(customerIds[0])
    const race = await Promise.allSettled([service.endOtherSessions(current.token), service.endOtherSessions(contender.token)])
    assert.equal(race.filter(result => result.status === "fulfilled").length, 1)
    const loser = race.find(result => result.status === "rejected")
    assert.ok(loser?.status === "rejected" && unauthorized(loser.reason))
    console.log("PASS: session pagination, minimal DTOs, expiry filtering, ownership, scoped deletion, concurrent revocation, and authorization recheck.")
  } finally {
    for (const token of tokens) await service.revokeAccountSession(token)
    for (const id of customerIds) {
      const participants = await service.listParticipants({ customer_id: id }, { take: 2 })
      if (participants.length) await service.deleteParticipants(participants.map(row => row.id))
    }
  }
}
