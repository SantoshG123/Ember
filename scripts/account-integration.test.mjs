/** Local account QA. Credentials and session cookies stay in memory; never logged or written. */
import assert from "node:assert/strict"
import { randomBytes, randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import { setTimeout as delay } from "node:timers/promises"

const origin = "http://127.0.0.1:3000"
const backend = "http://127.0.0.1:9000"
const run = randomUUID()
const accounts = []

async function call(path, { method = "GET", cookie, body, headers = {} } = {}) {
  const response = await fetch(origin + path, {
    method, headers: { ...(body ? { "content-type": "application/json" } : {}), ...(method !== "GET" ? { origin } : {}), ...(cookie ? { cookie } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined, redirect: "error", signal: AbortSignal.timeout(25_000),
  })
  return { status: response.status, body: await response.json().catch(() => null), headers: response.headers }
}
function status(result, expected, label) {
  assert.equal(result.status, expected, `${label}: HTTP status mismatch; response content withheld.`)
  assert.match(result.headers.get("cache-control") ?? "", /no-store/i)
}
async function signup(role) {
  const account = { role, email: `ember-qa-${run}-${accounts.length}@example.invalid`, password: randomBytes(32).toString("base64url"), name: `QA ${role}` }
  const created = await call("/api/auth", { method: "POST", body: { action: "authenticate", mode: "create-account", ...account } })
  status(created, 201, "Create account")
  assert.equal(created.body.dataMode, "medusa")
  assert.equal(created.body.role, role)
  for (const field of ["password", "token", "session", "jwt"]) assert.equal(field in created.body, false)
  const header = created.headers.getSetCookie().find(value => value.startsWith("ember-session="))
  assert.ok(header, "An opaque session cookie must be issued.")
  assert.match(header, /HttpOnly/i)
  assert.match(header, /SameSite=Lax/i)
  assert.match(header, /Path=\//i)
  assert.match(header, /Expires=/i)
  account.cookie = header.split(";")[0]
  account.id = created.body.accountId
  accounts.push(account)
  const session = await call("/api/auth", { cookie: account.cookie })
  status(session, 200, "Read signed-in account")
  assert.equal(session.body.account.id, account.id)
  assert.equal(session.body.account.email, account.email)
  assert.deepEqual(session.body.account.roles, role === "both" ? ["buyer", "seller"] : [role])
  console.log(`PASS: ${role} registration, session cookie, and stored roles.`)
  return account
}

async function sessionManagement(buyer, otherBuyer) {
  const path = "/api/auth/sessions"
  const list = cookie => call(path, { cookie })
  const revoke = (cookie, body) => call(path, { cookie, method: "DELETE", body })
  const extraCookies = []
  try {
    status(await list(undefined), 401, "Anonymous session list denied")
    status(await list("ember-session=invalid"), 401, "Invalid session list denied")
    status(await revoke(undefined, { allOthers: true }), 401, "Anonymous revocation denied")
    const initial = await list(buyer.cookie)
    status(initial, 200, "Own session list")
    assert.equal(initial.body.count, 1)
    assert.equal(initial.body.sessions[0].current, true)
    const currentId = initial.body.sessions[0].id
    for (let index = 0; index < 3; index++) {
      const login = await call("/api/auth", { method: "POST", body: { action: "authenticate", mode: "sign-in", email: buyer.email, password: buyer.password } })
      status(login, 200, "Additional session login")
      extraCookies.push(login.headers.getSetCookie().find(value => value.startsWith("ember-session=")).split(";")[0])
    }
    const many = await list(buyer.cookie)
    status(many, 200, "List additional sessions")
    assert.equal(many.body.count, 4)
    assert.equal(many.body.sessions.filter(row => row.current).length, 1)
    for (const row of many.body.sessions) assert.deepEqual(Object.keys(row).sort(), ["createdAt", "current", "expiresAt", "id"].sort(), "Session metadata must omit credentials and internal fields.")
    const foreign = await list(otherBuyer.cookie)
    assert.equal(foreign.body.count, 1)
    const foreignId = foreign.body.sessions[0].id
    status(await revoke(buyer.cookie, { sessionId: foreignId }), 404, "Another account's session cannot be revoked")
    status(await revoke(buyer.cookie, { sessionId: currentId }), 400, "Current session is protected from bulk controls")
    status(await revoke(buyer.cookie, {}), 400, "Empty body must not trigger bulk sign-out")
    status(await revoke(buyer.cookie, { allOthers: false }), 400, "Bulk sign-out needs explicit intent")
    status(await revoke(buyer.cookie, { allOthers: true, customerId: otherBuyer.id }), 400, "Customer identity cannot be supplied by the client")
    status(await call(path, { cookie: buyer.cookie, method: "DELETE", headers: { origin: "https://untrusted.example" }, body: { allOthers: true } }), 403, "Cross-origin session revocation denied")
    status(await call(path + "?offset=-1", { cookie: buyer.cookie }), 400, "Invalid pagination denied")
    status(await call(path + "?offset=0&offset=20", { cookie: buyer.cookie }), 400, "Ambiguous pagination denied")
    const extra = await list(extraCookies[0])
    const extraId = extra.body.sessions.find(row => row.current).id
    const ended = await revoke(buyer.cookie, { sessionId: extraId })
    status(ended, 200, "End selected session")
    assert.equal(ended.body.revoked, 1)
    status(await list(extraCookies[0]), 401, "Ended session cannot inspect sessions")
    status(await call("/api/buyer", { cookie: extraCookies[0] }), 401, "Ended session cannot access workspace")
    status(await revoke(extraCookies[0], { allOthers: true }), 401, "Revoked session cannot revoke others")
    const all = await revoke(buyer.cookie, { allOthers: true })
    status(all, 200, "End all other sessions")
    assert.equal(all.body.revoked, 2)
    for (const cookie of extraCookies) status(await call("/api/buyer", { cookie }), 401, "Bulk-revoked cookie cannot be replayed")
    status(await call("/api/buyer", { cookie: buyer.cookie }), 200, "Current session survives bulk revocation")
    status(await call("/api/buyer", { cookie: otherBuyer.cookie }), 200, "Other account is unaffected")
    assert.equal((await list(buyer.cookie)).body.count, 1)
    assert.equal((await revoke(buyer.cookie, { allOthers: true })).body.revoked, 0)
    console.log("PASS: private session listing, strict inputs, cross-account isolation, individual/bulk revocation, replay rejection, and current-session preservation.")
  } finally {
    for (const cookie of extraCookies) { try { await call("/api/auth", { method: "DELETE", cookie }) } catch { /* Local QA sessions also expire automatically. */ } }
  }
}
const requestInput = () => ({ category: "QA fixtures", title: `EMBER account QA ${run.slice(0, 8)}`, description: "An isolated account-ownership verification request. No actual service or payment is being requested by this test.", budgetMin: 30, budgetMax: 80, frequency: "one-time", timing: "Local QA only", zip: "78704" })

async function test() {
  assert.ok(process.argv.includes("--confirm-local-medusa"), "Local write tests require explicit confirmation.")
  const env = await readFile("apps/backend/.env", "utf8")
  const value = env.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim().replace(/^(["'])(.*)\1$/, "$2")
  let database
  try { database = new URL(value) } catch { throw Error("Configure the isolated local database first.") }
  assert.ok(database.hostname === "127.0.0.1" && database.port === "55432" && database.pathname === "/ember", "Only the dedicated local EMBER database is allowed.")
  assert.notEqual(process.env.NODE_ENV, "production")
  const config = await call("/api/marketplace/config")
  assert.equal(config.body.mode, "medusa")
  assert.equal(config.body.localIdentity, false, "Real-account QA must not enable fixture impersonation.")
  status(await call("/api/buyer"), 401, "Signed-out buyer denied")
  status(await call("/api/buyer", { cookie: "ember-session=invalid" }), 401, "Invalid cookie denied")
  status(await call("/api/auth", { method: "POST", headers: { origin: "https://untrusted.example" }, body: {} }), 403, "Cross-origin login denied")
  const buyer = await signup("buyer")
  const otherBuyer = await signup("buyer")
  const seller = await signup("seller")
  const both = await signup("both")
  await sessionManagement(buyer, otherBuyer)
  status(await call("/api/marketplace/seller", { cookie: buyer.cookie }), 400, "Buyer cannot become seller via URL")
  status(await call("/api/buyer", { cookie: seller.cookie }), 400, "Seller cannot become buyer via URL")
  status(await call("/api/buyer", { cookie: both.cookie }), 200, "Dual-role buyer access")
  status(await call("/api/marketplace/seller", { cookie: both.cookie }), 200, "Dual-role seller access")
  const request = await call("/api/requests", { cookie: buyer.cookie, method: "POST", body: requestInput() })
  status(request, 201, "Authenticated buyer publishes request")
  const page = await fetch(`${origin}/requests/${request.body.id}`, { headers: { cookie: buyer.cookie }, signal: AbortSignal.timeout(25_000) })
  assert.equal(page.status, 200, "Authenticated request page must render.")
  const html = await page.text()
  assert.ok(html.includes(request.body.title), "Server-rendered data must use the signed-in account.")
  assert.ok(!html.includes(buyer.cookie.split("=")[1]) && !html.includes(buyer.password), "Server-rendered HTML must not include credentials.")
  const another = await call("/api/buyer", { cookie: otherBuyer.cookie })
  assert.equal(another.body.requests.some(row => row.id === request.body.id), false, "Another buyer must not see private dashboard records.")
  const bidInput = { requestId: request.body.id, pricePerDelivery: 49.95, deliveryCount: 1, cadence: "QA only", earliestStart: "Local test", proposal: "Isolated QA proposal to verify authenticated account ownership." }
  const bid = await call("/api/marketplace/bids", { cookie: seller.cookie, method: "POST", body: bidInput })
  status(bid, 201, "Authenticated seller submits proposal")
  const conversationId = bid.body.bid.conversationId
  status(await call("/api/buyer", { cookie: otherBuyer.cookie, method: "PATCH", body: { bidId: bid.body.bid.id, action: "accept" } }), 400, "Another buyer cannot accept")
  status(await call("/api/messages", { cookie: otherBuyer.cookie, method: "POST", body: { conversationId, body: "Unauthorized QA message" } }), 400, "Another buyer cannot message")
  status(await call("/api/buyer", { cookie: buyer.cookie, method: "PATCH", body: { bidId: bid.body.bid.id, action: "accept" } }), 200, "Owning buyer can accept")
  status(await call("/api/messages?role=seller", { cookie: seller.cookie, method: "POST", body: { conversationId, body: "Authenticated seller QA reply" } }), 201, "Seller sends with their account")
  const inbox = await call("/api/messages", { cookie: buyer.cookie })
  assert.ok(inbox.body.conversations.some(row => row.id === conversationId && row.messages.some(message => message.body === "Authenticated seller QA reply")))
  const selfRequest = await call("/api/requests", { cookie: both.cookie, method: "POST", body: requestInput() })
  status(selfRequest, 201, "Dual-role request")
  status(await call("/api/marketplace/bids", { cookie: both.cookie, method: "POST", body: { ...bidInput, requestId: selfRequest.body.id } }), 400, "Self bidding across roles is forbidden")
  status(await call("/api/auth", { method: "POST", body: { action: "authenticate", mode: "sign-in", email: buyer.email, password: "deliberately-incorrect-qa-password" } }), 401, "Wrong password denied")
  status(await call("/api/auth", { method: "POST", body: { action: "recover", email: buyer.email } }), 503, "Unconfigured email never claims delivery")
  status(await call("/api/auth", { method: "DELETE", cookie: buyer.cookie, headers: { origin: "https://untrusted.example" } }), 403, "Cross-origin logout denied")
  console.log("PASS: account isolation, stored permissions, proposal/message ownership, self-bid prevention, and negative auth checks.")

  if (process.argv.includes("--restart")) {
    console.log("RESTART READY: stop and restart the local backend; all QA credentials remain only in this process's memory.")
    const reachable = async () => { try { return (await fetch(backend + "/health", { signal: AbortSignal.timeout(1500) })).ok } catch { return false } }
    const deadline = Date.now() + 180_000
    while (await reachable()) { assert.ok(Date.now() < deadline, "Timed out waiting for backend shutdown."); await delay(500) }
    while (!await reachable()) { assert.ok(Date.now() < deadline, "Timed out waiting for backend restart."); await delay(500) }
    for (const account of accounts) {
      const session = await call("/api/auth", { cookie: account.cookie })
      status(session, 200, "Session after restart")
      assert.equal(session.body.account?.id, account.id)
    }
    const persisted = await call("/api/buyer", { cookie: buyer.cookie })
    assert.ok(persisted.body.requests.some(row => row.id === request.body.id && row.status === "matched"))
    console.log("PASS: all four account sessions and the matched request survived a backend restart.")
  }

  const oldCookie = buyer.cookie
  status(await call("/api/auth", { method: "DELETE", cookie: oldCookie }), 200, "Logout")
  status(await call("/api/buyer", { cookie: oldCookie }), 401, "Revoked cookie cannot be replayed")
  const login = await call("/api/auth", { method: "POST", body: { action: "authenticate", mode: "sign-in", email: buyer.email.toUpperCase(), password: buyer.password, role: "seller" } })
  status(login, 200, "Sign back in")
  assert.equal(login.body.role, "buyer", "Sign-in input cannot change stored roles.")
  buyer.cookie = login.headers.getSetCookie().find(value => value.startsWith("ember-session=")).split(";")[0]
  assert.notEqual(buyer.cookie, oldCookie, "A new login must issue a fresh session.")
  status(await call("/api/buyer", { cookie: buyer.cookie }), 200, "New session works")
  const rateEmail = `rate-qa-${run}@example.invalid`
  for (let attempt = 0; attempt < 13; attempt++) {
    status(await call("/api/auth", { method: "POST", body: { action: "authenticate", mode: "sign-in", email: rateEmail, password: "invalid-qa-login-password" } }), attempt < 12 ? 401 : 429, "Authentication attempt limit")
  }
  console.log("PASS: durable login, email normalization, role tampering rejection, logout revocation, and fresh session issuance.")
  console.log("PASS: repeated failed authentication is rate-limited.")
}

try { await test() }
catch (error) {
  // Assertion actual/expected values can contain credentials; never serialize the error.
  console.error(`Account QA failed: ${error instanceof Error ? error.message.split("\n")[0] : "Unexpected failure"}`)
  process.exitCode = 1
} finally {
  for (const account of accounts) {
    try { await call("/api/auth", { method: "DELETE", cookie: account.cookie }) } catch { /* Expiration bounds abandoned local QA sessions. */ }
  }
}
