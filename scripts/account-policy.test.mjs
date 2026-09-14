import assert from "node:assert/strict"
import test from "node:test"
import { createAuthLimiter } from "../apps/backend/src/api/accounts/rate-limit.ts"

test("authentication limiter enforces the window and recovers after expiry", () => {
  const allow = createAuthLimiter(2, 1000)
  assert.equal(allow("same-account", 0), true)
  assert.equal(allow("same-account", 100), true)
  assert.equal(allow("same-account", 200), false)
  assert.equal(allow("different-account", 200), true)
  assert.equal(allow("same-account", 1000), true)
})
test("authentication limiter bounds memory and fails closed at capacity", () => {
  const allow = createAuthLimiter(2, 1000, 1)
  assert.equal(allow("first", 0), true)
  assert.equal(allow("second", 0), false)
  assert.equal(allow("second", 1000), true)
})
