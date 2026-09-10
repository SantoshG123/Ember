/**
 * Local HTTP integration checks; never point this harness at production.
 *
 * node scripts/marketplace-persistence.test.mjs create --confirm-local-medusa
 * node scripts/marketplace-persistence.test.mjs race --confirm-local-medusa
 * node scripts/marketplace-persistence.test.mjs outage
 * node scripts/marketplace-persistence.test.mjs verify
 *
 * Create leaves uniquely named QA records. Verify and outage never mutate data.
 * Only record identifiers are written to ignored .local/qa-persistence.json.
 * Backend credentials are read privately from apps/backend/.env, never printed.
 */
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { isLoopbackHost, resolveMarketplaceMode } from "../apps/storefront/src/lib/marketplace-policy.ts"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const phase = process.argv[2] ?? "verify"
const writeAllowed = process.argv.includes("--confirm-local-medusa")
const manifestPath = resolve(root, ".local/qa-persistence.json")
const concurrencyPath = resolve(root, ".local/qa-concurrency.json")
const backend = localUrl(process.env.EMBER_TEST_BACKEND_URL ?? "http://127.0.0.1:9000")
const storefront = localUrl(process.env.EMBER_TEST_STOREFRONT_URL ?? "http://127.0.0.1:3000")
let localKey

function localUrl(value) {
  const url = new URL(value)
  assert.ok(isLoopbackHost(url.hostname), "The persistence harness only permits loopback hosts.")
  assert.ok(["http:", "https:"].includes(url.protocol), "Use a local HTTP endpoint.")
  assert.ok(!url.username && !url.password && !url.search && !url.hash && url.pathname === "/", "Use a plain local origin without credentials or paths.")
  return url
}

function dotenvValue(source, key) {
  const match = source.match(new RegExp(`^${key}=(.*)$`, "m"))
  if (!match) return undefined
  const value = match[1].trim()
  return value.replace(/^(["'])(.*)\1$/, "$2")
}

async function configure() {
  assert.notEqual(process.env.NODE_ENV, "production", "This harness cannot run in production mode.")
  assert.ok(["create", "verify", "outage", "race"].includes(phase), "Choose create, verify, outage, or race.")
  assert.equal(resolveMarketplaceMode({ EMBER_DATA_MODE: "unknown-mode" }), "unavailable", "Unknown modes must not become demo fixtures.")
  if (phase === "create" || phase === "race") assert.ok(writeAllowed, "Writes require --confirm-local-medusa.")
  const config = await call("bff", "/api/marketplace/config")
  expectStatus(config, 200, "Persistent BFF configuration")
  assert.equal(config.body?.mode, "medusa", "The BFF must explicitly run in medusa mode, not demo mode.")
  assert.equal(config.body?.localIdentity, true, "The isolated local identity bridge must be explicitly enabled.")
  if (phase !== "outage") {
    let source
    try { source = await readFile(resolve(root, "apps/backend/.env"), "utf8") }
    catch { throw new Error("Configure the isolated backend .env before running persistence tests.") }
    assert.notEqual(dotenvValue(source, "NODE_ENV"), "production", "The backend must not use production mode.")
    assert.equal(dotenvValue(source, "EMBER_LOCAL_DATA_ACCESS"), "true", "Backend local test identities must be explicitly enabled.")
    localKey = dotenvValue(source, "EMBER_LOCAL_API_KEY")
    assert.ok(typeof localKey === "string" && localKey.length >= 32, "Backend local test key is missing or too short.")
  }
}

async function call(target, path, { method = "GET", actor = "buyer", body, credentials = "valid", origin } = {}) {
  const base = target === "backend" ? backend : storefront
  const headers = { accept: "application/json" }
  if (body !== undefined) headers["content-type"] = "application/json"
  if (target === "backend" && credentials !== "none") {
    headers["x-ember-local-key"] = credentials === "wrong" ? "invalid-local-qa-key-with-no-authority" : localKey
    headers["x-ember-local-actor"] = actor === "unknown" ? "not-an-allowed-local-identity" : `ember-${actor}`
  }
  if (target === "bff" && method !== "GET") headers.origin = origin ?? storefront.origin
  let response
  try {
    response = await fetch(new URL(path, base), {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "error", cache: "no-store", signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new Error(`Could not reach the local ${target} during ${phase}; no response payload or credentials are logged.`)
  }
  const parsed = await response.json().catch(() => null)
  return { status: response.status, body: parsed, headers: response.headers }
}

function expectStatus(result, expected, description) {
  assert.equal(result.status, expected, `${description}: unexpected HTTP status (response content omitted).`)
  if (expected >= 200 && expected < 300) assert.ok(result.body && typeof result.body === "object", `${description}: expected a JSON response.`)
}

function noStore(result) {
  assert.match(result.headers.get("cache-control") ?? "", /no-store/i, "Account data must not be cached.")
}

function id(value, description) {
  assert.ok(typeof value === "string" && /^[A-Za-z0-9_-]{1,160}$/.test(value), `${description}: invalid identifier.`)
  return value
}

async function checkpoint(manifest) {
  // Deliberately reject arbitrary response payloads and credentials in the artifact.
  for (const [key, value] of Object.entries(manifest)) {
    assert.match(key, /^(runId|requestId|bidId|conversationId|buyerMessageId|sellerMessageId|opportunitySlug|offerDraftId|raceRequestId|raceAcceptedBidId|raceDeclinedBidId)$/)
    id(value, key)
  }
  await mkdir(dirname(manifestPath), { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", mode: 0o600 })
}

async function readManifest() {
  let manifest
  try { manifest = JSON.parse(await readFile(manifestPath, "utf8")) }
  catch { throw new Error("No valid QA identifier manifest exists. Complete the create phase first.") }
  for (const field of ["runId", "requestId", "bidId", "conversationId", "buyerMessageId", "sellerMessageId", "opportunitySlug", "offerDraftId"]) id(manifest[field], field)
  return manifest
}

async function securityChecks(requestInput) {
  for (const credentials of ["none", "wrong"]) {
    expectStatus(await call("backend", "/marketplace/buyer", { credentials }), 401, `Backend ${credentials} credential rejection`)
  }
  expectStatus(await call("backend", "/marketplace/buyer", { actor: "unknown" }), 401, "Unknown local actor rejection")
  expectStatus(await call("bff", "/api/requests", {
    method: "POST", body: requestInput, origin: "https://untrusted.example",
  }), 403, "Cross-origin write rejection")
  expectStatus(await call("backend", "/marketplace/requests", {
    method: "POST", body: { ...requestInput, buyerId: "forged-owner" },
  }), 400, "Caller-supplied request ownership rejection")
}

async function create() {
  let existing = false
  try { await readFile(manifestPath); existing = true } catch { /* First run. */ }
  assert.ok(!existing || process.argv.includes("--new-run"), "QA identifiers already exist. Verify them, or explicitly pass --new-run to create another isolated set.")
  const manifest = { runId: randomUUID() }
  const requestInput = {
    category: "Food & meal prep", title: `EMBER QA ${manifest.runId.slice(0, 8)} weekly dinners`,
    description: "Isolated persistence QA request. Two vegetarian dinner deliveries with clear ingredient notes; no real purchase or payment is requested.",
    budgetMin: 60, budgetMax: 90, frequency: "weekly", timing: "Wednesday after 6 PM", zip: "78704",
  }
  await securityChecks(requestInput)
  const created = await call("bff", "/api/requests", { method: "POST", body: requestInput })
  expectStatus(created, 201, "Publish persisted request")
  assert.equal(created.body.dataMode, "medusa", "Request creation must report persistent data mode.")
  assert.equal(created.body.status, "open")
  manifest.requestId = id(created.body.id, "requestId")
  await checkpoint(manifest)
  const listed = await call("backend", "/marketplace/requests", { actor: "seller" })
  expectStatus(listed, 200, "Seller request discovery")
  assert.ok(listed.body.requests.some(row => row.id === manifest.requestId), "The seller must see the newly persisted request.")
  const bidInput = { requestId: manifest.requestId, pricePerDelivery: 72, deliveryCount: 2,
    cadence: "Wednesday evenings", earliestStart: "Next Wednesday", proposal: `Isolated QA proposal ${manifest.runId}. Two carefully labeled vegetarian dinner deliveries.` }
  expectStatus(await call("backend", "/marketplace/bids", { actor: "seller", method: "POST", body: { ...bidInput, sellerId: "forged-owner" } }), 400, "Caller-supplied bid ownership rejection")
  const submitted = await call("bff", "/api/marketplace/bids", { method: "POST", body: bidInput })
  expectStatus(submitted, 201, "Submit persisted seller bid")
  manifest.bidId = id(submitted.body.bid.id, "bidId")
  manifest.conversationId = id(submitted.body.bid.conversationId, "conversationId")
  await checkpoint(manifest)
  expectStatus(await call("backend", "/marketplace/bids", { actor: "seller", method: "POST", body: bidInput }), 409, "Duplicate active proposal rejection")
  expectStatus(await call("backend", "/marketplace/buyer", { actor: "seller", method: "PATCH", body: { bidId: manifest.bidId, action: "accept" } }), 400, "Seller cannot accept a buyer proposal")
  const accepted = await call("bff", "/api/buyer", { method: "PATCH", body: { bidId: manifest.bidId, action: "accept" } })
  expectStatus(accepted, 200, "Accept persisted seller bid")
  assert.equal(accepted.body.requestStatus, "matched", "Selecting a seller must not complete fulfillment.")
  expectStatus(await call("backend", "/marketplace/bids", { actor: "seller", method: "POST", body: bidInput }), 409, "Matched request rejects new bids")
  const buyerMessage = await call("bff", "/api/messages?role=buyer", { method: "POST", body: { conversationId: manifest.conversationId, body: `QA buyer message ${manifest.runId}` } })
  expectStatus(buyerMessage, 201, "Send persisted buyer message")
  assert.equal(buyerMessage.body.message.author, "buyer")
  manifest.buyerMessageId = id(buyerMessage.body.message.id, "buyerMessageId")
  await checkpoint(manifest)
  const sellerInbox = await call("backend", "/marketplace/messages", { actor: "seller" })
  expectStatus(sellerInbox, 200, "Seller receives buyer message")
  assert.ok(sellerInbox.body.conversations.find(row => row.id === manifest.conversationId)?.unreadCount >= 1, "Seller unread state must be persisted.")
  const sellerMessage = await call("bff", "/api/messages?role=seller", { method: "POST", body: { conversationId: manifest.conversationId, body: `QA seller reply ${manifest.runId}` } })
  expectStatus(sellerMessage, 201, "Send persisted seller reply")
  assert.equal(sellerMessage.body.message.author, "seller")
  manifest.sellerMessageId = id(sellerMessage.body.message.id, "sellerMessageId")
  await checkpoint(manifest)
  const buyerInbox = await call("backend", "/marketplace/messages")
  expectStatus(buyerInbox, 200, "Buyer receives seller reply")
  assert.ok(buyerInbox.body.conversations.find(row => row.id === manifest.conversationId)?.unreadCount >= 1, "Buyer unread state must be persisted.")
  expectStatus(await call("bff", "/api/messages?role=buyer", { method: "PATCH", body: { action: "read", conversationId: manifest.conversationId } }), 200, "Persist buyer read marker")
  const opportunities = await call("backend", "/marketplace/opportunities", { actor: "seller" })
  expectStatus(opportunities, 200, "Read persisted opportunities")
  const opportunity = opportunities.body.opportunities.find(row => row.slug === "east-austin-team-lunch")
  assert.ok(opportunity, "Explicit local marketplace seed is required before this test.")
  manifest.opportunitySlug = id(opportunity.slug, "opportunitySlug")
  expectStatus(await call("bff", "/api/opportunities", { method: "PATCH", body: { slug: manifest.opportunitySlug, saved: true } }), 200, "Persist seller opportunity bookmark")
  const draft = await call("bff", "/api/opportunities", { method: "POST", body: {
    slug: manifest.opportunitySlug, pricePerMeal: 17, weeklyCapacity: 25, deliveryDays: "Tuesday and Thursday", note: `Isolated QA draft ${manifest.runId}`,
  } })
  expectStatus(draft, 201, "Persist seller offer draft")
  manifest.offerDraftId = id(draft.body.draftId, "offerDraftId")
  await checkpoint(manifest)
  await verify(manifest)
  console.log("CREATE passed: isolated request, proposal, match, two messages, read marker, bookmark, and draft stored. QA IDs saved locally; no payment was made.")
}

async function verify(manifest) {
  manifest ??= await readManifest()
  const [detail, buyer, seller, messages] = await Promise.all([
    call("backend", `/marketplace/requests/${manifest.requestId}`),
    call("bff", "/api/buyer"),
    call("bff", "/api/marketplace/seller"),
    call("bff", "/api/messages?role=buyer"),
  ])
  for (const result of [detail, buyer, seller, messages]) { expectStatus(result, 200, "Read persisted QA records"); noStore(result) }
  assert.equal(detail.body.id, manifest.requestId)
  assert.equal(detail.body.status, "matched")
  assert.ok(detail.body.title.includes(manifest.runId.slice(0, 8)))
  assert.equal(detail.body.budgetMin, 60)
  assert.equal(detail.body.budgetMax, 90)
  assert.equal(detail.body.frequency, "weekly")
  assert.equal(detail.body.bids.filter(row => row.status === "accepted").length, 1)
  assert.equal(detail.body.bids.find(row => row.id === manifest.bidId)?.status, "accepted")
  assert.equal(detail.body.bids.find(row => row.id === manifest.bidId)?.pricePerDelivery, 72)
  assert.equal(detail.body.bids.find(row => row.id === manifest.bidId)?.deliveryCount, 2)
  assert.equal(buyer.body.requests.find(row => row.id === manifest.requestId)?.status, "matched")
  assert.equal(seller.body.bids.find(row => row.id === manifest.bidId)?.status, "accepted")
  assert.ok(seller.body.savedOpportunities.some(row => row.slug === manifest.opportunitySlug))
  assert.ok(seller.body.offerDrafts.some(row => row.draftId === manifest.offerDraftId))
  assert.equal(seller.body.offerDrafts.find(row => row.draftId === manifest.offerDraftId)?.note, `Isolated QA draft ${manifest.runId}`)
  const conversation = messages.body.conversations.find(row => row.id === manifest.conversationId)
  assert.ok(conversation, "The persisted conversation must remain available.")
  assert.equal(conversation.proposal.status, "accepted")
  assert.equal(conversation.unreadCount, 0, "Read state must survive a backend restart.")
  assert.ok(conversation.messages.some(row => row.id === manifest.buyerMessageId && row.author === "buyer" && row.body === `QA buyer message ${manifest.runId}`))
  assert.ok(conversation.messages.some(row => row.id === manifest.sellerMessageId && row.author === "seller" && row.body === `QA seller reply ${manifest.runId}`))
  if (manifest.raceRequestId) {
    const race = await call("backend", `/marketplace/requests/${manifest.raceRequestId}`)
    expectStatus(race, 200, "Read concurrent acceptance result")
    assert.equal(race.body.status, "matched")
    assert.equal(race.body.bids.filter(row => row.status === "accepted").length, 1)
    assert.equal(race.body.bids.find(row => row.id === manifest.raceAcceptedBidId)?.status, "accepted")
    assert.equal(race.body.bids.find(row => row.id === manifest.raceDeclinedBidId)?.status, "declined")
  }
  if (phase === "verify") console.log("VERIFY passed (read-only): persisted QA identifiers, match, messages, read marker, bookmark, and draft are intact.")
}

async function race() {
  const manifest = await readManifest()
  let fixture
  try { fixture = JSON.parse(await readFile(concurrencyPath, "utf8")) }
  catch { throw new Error("Create the isolated backend QA concurrency fixture first.") }
  const requestId = id(fixture.requestId, "race request")
  assert.ok(Array.isArray(fixture.bidIds) && fixture.bidIds.length === 2, "Concurrency fixture needs exactly two proposal IDs.")
  fixture.bidIds.forEach(value => id(value, "race bid"))
  const before = await call("backend", `/marketplace/requests/${requestId}`)
  expectStatus(before, 200, "Inspect isolated race fixture")
  assert.match(before.body.title, /^EMBER QA concurrency /, "Only the explicitly isolated QA concurrency request may be changed.")
  assert.equal(before.body.status, "open", "Race fixture was already used; create a new isolated fixture.")
  assert.ok(fixture.bidIds.every(value => before.body.bids.some(row => row.id === value && row.status === "active")), "The race fixture must contain two active proposals.")
  const results = await Promise.all(fixture.bidIds.map(bidId => call("backend", "/marketplace/buyer", { method: "PATCH", body: { bidId, action: "accept" } })))
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409], "Exactly one concurrent proposal acceptance must succeed.")
  manifest.raceRequestId = requestId
  manifest.raceAcceptedBidId = fixture.bidIds[results.findIndex(result => result.status === 200)]
  manifest.raceDeclinedBidId = fixture.bidIds[results.findIndex(result => result.status === 409)]
  await checkpoint(manifest)
  await verify(manifest)
  console.log("RACE passed: concurrent accept attempts produced one match and one conflict; no double acceptance.")
}

async function outage() {
  let reachable = false
  try { await fetch(new URL("/health", backend), { signal: AbortSignal.timeout(2_000) }); reachable = true } catch { /* Expected isolated outage. */ }
  assert.equal(reachable, false, "Stop the isolated local backend before the read-only outage phase.")
  const paths = ["/api/buyer", "/api/messages", "/api/requests", "/api/marketplace/seller", "/api/opportunities?slug=east-austin-team-lunch"]
  for (const result of await Promise.all(paths.map(path => call("bff", path)))) {
    expectStatus(result, 503, "Unavailable backend must fail closed")
    noStore(result)
    assert.equal(typeof result.body?.message, "string")
    assert.equal(result.body?.dataMode, "medusa")
    for (const field of ["requests", "conversations", "bids", "opportunities", "currentUser"]) assert.equal(field in result.body, false, "Outage responses must not contain demo fixtures.")
  }
  console.log("OUTAGE passed (read-only): all five marketplace endpoints returned 503 without demo fixture fallback.")
}

try {
  await configure()
  if (phase === "create") await create()
  if (phase === "verify") await verify()
  if (phase === "race") await race()
  if (phase === "outage") await outage()
} catch (error) {
  console.error(`Marketplace ${phase} check failed: ${error instanceof Error ? error.message : "Unexpected test failure"}`)
  process.exitCode = 1
}
