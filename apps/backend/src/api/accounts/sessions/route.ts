import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ICustomerModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import type MarketplaceModuleService from "../../../modules/marketplace/service"
import { parse } from "../../marketplace/_shared"

const querySchema = z.object({ offset: z.coerce.number().int().min(0).max(100_000).default(0) }).strict()
const revokeSchema = z.union([
  z.object({ sessionId: z.string().regex(/^esess_[a-zA-Z0-9]+$/).max(80) }).strict(),
  z.object({ allOthers: z.literal(true) }).strict(),
])

async function authorize(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store")
  const token = req.get("x-ember-session") ?? ""
  const service = req.scope.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  const customerId = await service.customerForSession(token)
  const customer = await req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER).retrieveCustomer(customerId)
  if (!customer.has_account) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to continue.")
  return { token, service }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { token, service } = await authorize(req, res)
  const query = parse(querySchema, req.query)
  res.json(await service.activeSessions(token, query.offset))
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { token, service } = await authorize(req, res)
  const input = parse(revokeSchema, req.body)
  res.json(await service.endOtherSessions(token, "sessionId" in input ? input.sessionId : undefined))
}
