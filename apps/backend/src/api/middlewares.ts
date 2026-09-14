import { createHash, timingSafeEqual } from "node:crypto"
import { authenticate, defineMiddlewares, type MedusaNextFunction, type MedusaRequest, type MedusaResponse } from "@medusajs/framework/http"
import type { MarketplaceRequest } from "./marketplace/_shared"
import { MARKETPLACE_MODULE } from "../modules/marketplace"
import type MarketplaceModuleService from "../modules/marketplace/service"
import type { ICustomerModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createAuthLimiter } from "./accounts/rate-limit"
const peerLimiter = createAuthLimiter(120, 15 * 60_000)
const identityLimiter = createAuthLimiter(12, 15 * 60_000)
function authRateLimit(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const credentials = req.body as { email?: unknown; password?: unknown } | undefined
  if (typeof credentials?.email === "string") credentials.email = credentials.email.trim().toLowerCase()
  const registering = req.path.endsWith("/register")
  if (typeof credentials?.password !== "string" || credentials.password.length > 128 || (registering && credentials.password.length < 12)) {
    res.setHeader("Cache-Control", "no-store")
    res.status(400).json({ message: "Use a valid password; new accounts require 12 to 128 characters." })
    return
  }
  const peer = req.socket.remoteAddress ?? "unknown" // Never trust arbitrary forwarded IPs.
  const email = typeof (req.body as { email?: unknown })?.email === "string" ? (req.body as { email: string }).email.trim().toLowerCase() : "unknown"
  const key = createHash("sha256").update(`${peer}:${email}`).digest("hex")
  if (!peerLimiter(peer) || !identityLimiter(key)) {
    res.setHeader("Retry-After", "900")
    res.setHeader("Cache-Control", "no-store")
    res.status(429).json({ message: "Too many authentication attempts. Please try again later." })
    return
  }
  next()
}
const customerAuth = authenticate("customer", ["session", "bearer"])
async function marketplaceAuth(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (req.get("x-ember-session") !== undefined) {
    try {
      const customerId = await req.scope.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE).customerForSession(req.get("x-ember-session")!)
      const customer = await req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER).retrieveCustomer(customerId)
      if (!customer.has_account) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to continue.")
      ;(req as MarketplaceRequest).marketplaceCustomer = customerId
      return next()
    } catch (error) { return next(error) }
  }
  if (req.get("authorization")) return customerAuth(req, res, next)
  const remote = req.socket.remoteAddress
  const local = remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1"
  const expected = Buffer.from(process.env.EMBER_LOCAL_API_KEY ?? "")
  const actual = Buffer.from(req.get("x-ember-local-key") ?? "")
  const actor = req.get("x-ember-local-actor")
  // Never trust forwarded IP headers, arbitrary actor IDs, or test keys in production.
  if (process.env.NODE_ENV !== "production" && process.env.EMBER_AUTH_MODE === "local" && process.env.EMBER_LOCAL_DATA_ACCESS === "true" && local && expected.length >= 32 && expected.length === actual.length && timingSafeEqual(expected, actual) && (actor === "ember-buyer" || actor === "ember-seller")) {
    (req as MarketplaceRequest).marketplaceActor = actor
    next()
    return
  }
  return customerAuth(req, res, next)
}
export default defineMiddlewares({ routes: [
  { matcher: "/auth/customer/emailpass*", method: ["POST"], bodyParser: { sizeLimit: "8kb" }, middlewares: [authRateLimit] },
  { matcher: "/accounts", method: ["POST"], bodyParser: { sizeLimit: "8kb" }, middlewares: [authenticate("customer", ["bearer"], { allowUnregistered: true })] },
  { matcher: "/accounts/session", method: ["POST"], middlewares: [authenticate("customer", ["bearer"])] },
  { matcher: "/marketplace/*", bodyParser: { sizeLimit: "32kb" }, middlewares: [marketplaceAuth] },
  { matcher: "/store/marketplace/*", middlewares: [(_req: MedusaRequest, res: MedusaResponse) => { res.status(410).json({ message: "This legacy endpoint is retired. Use authenticated /marketplace endpoints." }) }] },
] })
