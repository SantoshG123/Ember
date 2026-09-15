import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import type { ExecArgs } from "@medusajs/framework/types"
import { MARKETPLACE_MODULE } from "../modules/marketplace"
import type MarketplaceModuleService from "../modules/marketplace/service"

export default async function verifyAccountProfile({ container }: ExecArgs) {
  const target = new URL(process.env.DATABASE_URL ?? "postgres://invalid")
  assert.ok(process.env.NODE_ENV !== "production" && target.hostname === "127.0.0.1" && target.port === "55432" && target.pathname === "/ember", "Profile QA requires the isolated local database.")
  const service = container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  const ids = Array.from({ length: 3 }, () => `profile-qa-${randomUUID()}`)
  const tokens: string[] = []
  const unauthorized = (error: unknown) => error instanceof Error && "type" in error && error.type === "unauthorized"
  try {
    await service.provisionAccount(ids[0], "Original Name", "both")
    await service.provisionAccount(ids[1], "Other Buyer", "buyer")
    await service.provisionAccount(ids[2], "Other Buyer", "buyer")
    const initialPeople = await service.listParticipants({ customer_id: ids[0] }, { take: 2 })
    const seller = initialPeople.find(person => person.role === "seller")!
    await service.updateParticipants({ id: seller.id, profile: { rating: 4.8, reviews: 25, verified: true, internalNote: "QA-only server metadata" } })
    for (const id of ids) tokens.push((await service.createAccountSession(id)).token)
    const original = await service.accountProfile(ids[0])
    const otherOriginal = await service.accountProfile(ids[1])
    const identical = await service.accountProfile(ids[2])
    assert.notEqual(otherOriginal.version, identical.version, "Identical profiles in different accounts need distinct revisions.")
    await assert.rejects(service.updateAccountProfile(tokens[1], { version: identical.version, name: "Wrong account draft" }))
    await assert.rejects(service.updateAccountProfile(tokens[0], { version: otherOriginal.version, name: "Wrong account draft" }))
    assert.deepEqual(Object.keys(original).sort(), ["name", "seller", "version"])
    assert.deepEqual(Object.keys(original.seller!).sort(), ["capabilities", "serviceArea", "summary"])
    const details = { summary: "Local QA introduction", serviceArea: "Austin", capabilities: ["Meal prep", "Delivery"] }
    const saved = await service.updateAccountProfile(tokens[0], { version: original.version, name: "Updated Name", seller: details })
    assert.deepEqual(saved.seller, details)
    assert.notEqual(saved.version, original.version)
    const people = await service.listParticipants({ customer_id: ids[0] }, { take: 2 })
    assert.ok(people.every(person => person.name === "Updated Name" && person.initials === "UN"))
    const stored = people.find(person => person.role === "seller")!.profile!
    assert.equal(stored.rating, 4.8)
    assert.equal(stored.reviews, 25)
    assert.equal(stored.verified, true)
    assert.equal(stored.internalNote, "QA-only server metadata")
    assert.equal((await service.accountProfile(ids[1])).name, "Other Buyer")
    const buyer = await service.accountProfile(ids[1])
    await assert.rejects(service.updateAccountProfile(tokens[1], { version: buyer.version, name: "Must not save", seller: details }))
    assert.deepEqual(await service.accountProfile(ids[1]), buyer, "Forbidden seller edits must not partially rename a buyer.")
    await assert.rejects(service.updateAccountProfile(tokens[0], { version: original.version, name: "Stale Name" }), error => error instanceof Error && "type" in error && error.type === "conflict")
    const race = await Promise.allSettled(["First Winner", "Second Winner"].map(name => service.updateAccountProfile(tokens[0], { version: saved.version, name })))
    assert.equal(race.filter(result => result.status === "fulfilled").length, 1)
    const loser = race.find(result => result.status === "rejected")
    assert.ok(loser?.status === "rejected" && loser.reason.type === "conflict")
    const after = await service.accountProfile(ids[0])
    assert.deepEqual(after.seller, details, "Name-only updates preserve seller details.")
    await service.updateAccountProfile(tokens[0], { version: after.version, name: "A 🚀" })
    assert.ok((await service.listParticipants({ customer_id: ids[0] }, { take: 2 })).every(person => person.initials === "A🚀"), "Initials must not split Unicode surrogate pairs.")
    const expired = await service.sessionForToken(tokens[0])
    await service.updateAccountSessions({ id: expired.id, expires_at: new Date(Date.now() - 1000) })
    await assert.rejects(service.updateAccountProfile(tokens[0], { version: after.version, name: "Expired Name" }), unauthorized)
    await service.revokeAccountSession(tokens[1])
    await assert.rejects(service.updateAccountProfile(tokens[1], { version: buyer.version, name: "Revoked Name" }), unauthorized)
    console.log("PASS: atomic dual-role profile updates, protected metadata, buyer restrictions, stale/concurrent revisions, expired/revoked sessions, and account isolation.")
  } finally {
    for (const token of tokens) await service.revokeAccountSession(token)
    for (const id of ids) {
      const people = await service.listParticipants({ customer_id: id }, { take: 2 })
      if (people.length) await service.deleteParticipants(people.map(person => person.id))
    }
  }
}
