import { timingSafeEqual } from "node:crypto"
import { authenticate, defineMiddlewares, type MedusaNextFunction, type MedusaRequest, type MedusaResponse } from "@medusajs/framework/http"
import type { MarketplaceRequest } from "./marketplace/_shared"
const customerAuth = authenticate("customer", ["session", "bearer"])
function marketplaceAuth(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const remote = req.socket.remoteAddress
  const local = remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1"
  const expected = Buffer.from(process.env.EMBER_LOCAL_API_KEY ?? "")
  const actual = Buffer.from(req.get("x-ember-local-key") ?? "")
  const actor = req.get("x-ember-local-actor")
  // Never trust forwarded IP headers, arbitrary actor IDs, or test keys in production.
  if (process.env.NODE_ENV !== "production" && process.env.EMBER_LOCAL_DATA_ACCESS === "true" && local && expected.length >= 32 && expected.length === actual.length && timingSafeEqual(expected, actual) && (actor === "ember-buyer" || actor === "ember-seller")) {
    (req as MarketplaceRequest).marketplaceActor = actor
    next()
    return
  }
  return customerAuth(req, res, next)
}
export default defineMiddlewares({ routes: [
  { matcher: "/marketplace/*", bodyParser: { sizeLimit: "32kb" }, middlewares: [marketplaceAuth] },
  { matcher: "/store/marketplace/*", middlewares: [(_req: MedusaRequest, res: MedusaResponse) => { res.status(410).json({ message: "This legacy endpoint is retired. Use authenticated /marketplace endpoints." }) }] },
] })
