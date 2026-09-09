import assert from "node:assert/strict"

const baseUrl = process.env.EMBER_SMOKE_BASE_URL ?? "http://127.0.0.1:3000"

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init)
  const contentType = response.headers.get("content-type") ?? ""
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text()
  return { response, body }
}

const pages = [
  ["/", "Where demand"],
  ["/demand", "Demand across"],
  ["/requests/R-8924", "Italian"],
  ["/requests/new", "request"],
  ["/buyer", "buyer"],
  ["/seller", "Good morning"],
  ["/seller/bids/B-184", "Weekly family dinners"],
  // Radix portals mount after hydration; HTTP checks the route title, while
  // browser QA verifies the actual dialog, keyboard trap, and dismissal.
  ["/seller/test-plan", "Demand test plan"],
  ["/opportunities/east-austin-team-lunch", "lunch"],
  ["/messages", "Messages"],
  ["/auth", "EMBER"],
  ["/checkout", "Protected payment"],
]

for (const [path, marker] of pages) {
  const { response, body } = await request(path)
  assert.equal(response.status, 200, `${path} should render`)
  assert.match(body, new RegExp(marker, "i"), `${path} should contain ${marker}`)
}

const invalidRequest = await request("/api/requests", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ title: "too short" }),
})
assert.equal(invalidRequest.response.status, 400)

const publishedRequest = await request("/api/requests", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    category: "Food & drink",
    title: "Weekly vegetarian family dinners",
    description:
      "Four vegetarian portions each Wednesday evening, with ingredient notes and reusable containers.",
    budgetMin: 55,
    budgetMax: 75,
    frequency: "weekly",
    timing: "Wednesday around 6:30 PM",
    zip: "78704",
  }),
})
assert.equal(publishedRequest.response.status, 201)
assert.match(publishedRequest.body.id, /^req_/)
assert.equal(publishedRequest.body.status, "open")

const auth = await request("/api/auth", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    action: "authenticate",
    mode: "create-account",
    email: "jordan@example.com",
    password: "not-persisted-123",
    role: "both",
  }),
})
assert.equal(auth.response.status, 201)
assert.equal(auth.body.email, "jordan@example.com")
assert.equal("password" in auth.body, false, "auth response must not echo passwords")

const messages = await request("/api/messages")
assert.equal(messages.response.status, 200)
assert.ok(messages.body.conversations.length >= 3)

const authorization = await request("/api/checkout", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    billingName: "Jordan Lee",
    billingZip: "78704",
    cardLast4: "4242",
    paymentMethod: "new",
  }),
})
assert.equal(authorization.response.status, 200)
assert.equal(authorization.body.status, "held")
assert.equal(authorization.body.cardLast4, "4242")

const declined = await request("/api/checkout", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    billingName: "Jordan Lee",
    billingZip: "78704",
    cardLast4: "0002",
    paymentMethod: "new",
  }),
})
assert.equal(declined.response.status, 402)

console.log(`EMBER smoke test passed: ${pages.length} pages and 6 API assertions.`)
