import assert from "node:assert/strict"
import test from "node:test"
import { accountProfileSchema as frontend } from "../apps/storefront/src/lib/account-profile-schema.ts"
import { accountProfileSchema as backend } from "../apps/backend/src/modules/marketplace/profile-schema.ts"

const version = "a".repeat(64) // Public content revision, not a session credential.
const seller = { summary: "Local services", serviceArea: "Austin", capabilities: ["Meal prep"] }
const valid = { name: "Example Seller", seller, version }

test("both profile boundaries normalize only allowlisted editable fields", () => {
  for (const schema of [frontend, backend]) {
    assert.deepEqual(schema.parse({ ...valid, name: "  Example Seller  ", seller: { ...seller, summary: " Local services " } }), valid)
    assert.equal(schema.safeParse({ name: "Buyer Name", version }).success, true)
    for (const field of ["email", "role", "roles", "customerId", "id", "initials", "profile"]) {
      assert.equal(schema.safeParse({ ...valid, [field]: "injected" }).success, false)
    }
    for (const field of ["rating", "reviews", "verified", "id"]) {
      assert.equal(schema.safeParse({ ...valid, seller: { ...seller, [field]: true } }).success, false)
    }
  }
})

test("profile limits, content revisions, and capability uniqueness are enforced at both boundaries", () => {
  const invalid = [
    {}, null, { ...valid, name: " " }, { ...valid, name: "a" }, { ...valid, name: "x".repeat(81) },
    { ...valid, name: "Line\nbreak" }, { ...valid, version: "" }, { ...valid, version: "g".repeat(64) },
    { ...valid, seller: { ...seller, summary: "x".repeat(601) } },
    { ...valid, seller: { ...seller, serviceArea: "x".repeat(121) } },
    { ...valid, seller: { ...seller, capabilities: Array.from({ length: 9 }, (_, i) => String(i)) } },
    { ...valid, seller: { ...seller, capabilities: ["Meal prep", " meal PREP "] } },
    { ...valid, seller: { ...seller, capabilities: [""] } },
    { ...valid, seller: { ...seller, capabilities: ["x".repeat(41)] } },
    { ...valid, seller: { ...seller, capabilities: ["Line\nbreak"] } },
  ]
  for (const input of invalid) for (const schema of [frontend, backend]) assert.equal(schema.safeParse(input).success, false)
  for (const schema of [frontend, backend]) assert.equal(schema.safeParse({ name: "x".repeat(80), version, seller: { summary: "x".repeat(600), serviceArea: "x".repeat(120), capabilities: ["x".repeat(40)] } }).success, true)
})
