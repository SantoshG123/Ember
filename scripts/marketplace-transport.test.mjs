import assert from "node:assert/strict"
import test from "node:test"
import {
  allowsMarketplaceMutation,
  canUseLocalMarketplaceActor,
  resolveMarketplaceMode,
} from "../apps/storefront/src/lib/marketplace-policy.ts"

test("mode defaults to demo; server override works; unknown values fail closed", () => {
  assert.equal(resolveMarketplaceMode({}), "demo")
  assert.equal(resolveMarketplaceMode({ NEXT_PUBLIC_EMBER_DATA_MODE: "medusa" }), "medusa")
  assert.equal(resolveMarketplaceMode({ EMBER_DATA_MODE: "medusa", NEXT_PUBLIC_EMBER_DATA_MODE: "demo" }), "medusa")
  assert.equal(resolveMarketplaceMode({ EMBER_DATA_MODE: "prod" }), "unavailable")
  assert.equal(resolveMarketplaceMode({ EMBER_DATA_MODE: "" }), "unavailable")
})

test("mutations reject cross-origin and null-origin requests", () => {
  for (const origin of ["https://untrusted.example", "null", "http://localhost:3001"]) {
    assert.equal(allowsMarketplaceMutation(new Request("http://localhost:3000/api/requests", { headers: { origin } })), false)
  }
  assert.equal(allowsMarketplaceMutation(new Request("http://localhost:3000/api/requests", {
    headers: { origin: "http://localhost:3000", "sec-fetch-site": "cross-site" },
  })), false)
})

test("mutations allow same-origin browser writes and origin-less local smoke tests", () => {
  assert.equal(allowsMarketplaceMutation(new Request("https://ember.example/api/requests", {
    headers: { origin: "https://ember.example", "sec-fetch-site": "same-origin" },
  })), true)
  assert.equal(allowsMarketplaceMutation(new Request("http://127.0.0.1:3000/api/requests")), true)
  assert.equal(allowsMarketplaceMutation(new Request("https://ember.example/api/requests")), false)
})

test("local actor bridge needs opt-in, a key, and loopback at both ends; never production", () => {
  const environment = { NODE_ENV: "development", EMBER_LOCAL_DATA_ACCESS: "true", EMBER_LOCAL_API_KEY: "test-key-placeholder-not-a-real-secret" }
  const request = new Request("http://localhost:3000/api/buyer")
  const backend = new URL("http://localhost:9000")
  assert.equal(canUseLocalMarketplaceActor(environment, request, backend), true)
  assert.equal(canUseLocalMarketplaceActor({ ...environment, NODE_ENV: "production" }, request, backend), false)
  assert.equal(canUseLocalMarketplaceActor({ ...environment, EMBER_LOCAL_DATA_ACCESS: "false" }, request, backend), false)
  assert.equal(canUseLocalMarketplaceActor({ ...environment, EMBER_LOCAL_API_KEY: "" }, request, backend), false)
  assert.equal(canUseLocalMarketplaceActor({ ...environment, EMBER_LOCAL_API_KEY: "too-short" }, request, backend), false)
  assert.equal(canUseLocalMarketplaceActor(environment, new Request("https://ember.example/api/buyer"), backend), false)
  assert.equal(canUseLocalMarketplaceActor(environment, request, new URL("https://api.ember.example")), false)
  assert.equal(canUseLocalMarketplaceActor(environment, new Request("http://localhost:3000/api/buyer", {
    headers: { host: "untrusted.example", "x-forwarded-host": "localhost:3000" },
  }), backend), false)
})

test("normalized Next URLs use the actual Host for exact same-origin validation", () => {
  const url = "http://localhost:3000/api/requests"
  assert.equal(allowsMarketplaceMutation(new Request(url, {
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-origin" },
  })), true)
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3001", "https://untrusted.example", "null"]) {
    assert.equal(allowsMarketplaceMutation(new Request(url, {
      headers: { host: "127.0.0.1:3000", origin, "x-forwarded-host": "untrusted.example" },
    })), false)
  }
  for (const host of ["", "localhost:3000/untrusted", "localhost:3000@untrusted.example", "localhost:3000,untrusted.example", "[invalid"]) {
    assert.equal(allowsMarketplaceMutation(new Request(url, { headers: { host, origin: "http://localhost:3000" } })), false)
  }
})
