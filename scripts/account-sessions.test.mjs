import assert from "node:assert/strict"
import test from "node:test"
import { revokeSessionSchema, sessionPageSchema } from "../apps/storefront/src/lib/account-session-schema.ts"

test("session revocation requires an exact target or explicit all-others confirmation", () => {
  assert.equal(revokeSessionSchema.safeParse({ sessionId: "esess_01TEST" }).success, true)
  assert.equal(revokeSessionSchema.safeParse({ allOthers: true }).success, true)
  for (const input of [{}, null, { allOthers: false }, { allOthers: "true" }, { sessionId: "" }, { sessionId: "../other" }, { sessionId: "esess_01TEST", allOthers: true }, { allOthers: true, customerId: "other" }]) {
    assert.equal(revokeSessionSchema.safeParse(input).success, false)
  }
})

test("session pagination has a bounded, integral offset and rejects unknown fields", () => {
  assert.deepEqual(sessionPageSchema.parse({}), { offset: 0 })
  assert.deepEqual(sessionPageSchema.parse({ offset: "20" }), { offset: 20 })
  for (const input of [{ offset: -1 }, { offset: 1.5 }, { offset: "bad" }, { offset: 100001 }, { customerId: "other" }]) assert.equal(sessionPageSchema.safeParse(input).success, false)
})
