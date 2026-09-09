import type { AuthenticatedMedusaRequest, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type { z } from "zod"
import { MARKETPLACE_MODULE } from "../../modules/marketplace"
import type MarketplaceModuleService from "../../modules/marketplace/service"
export type MarketplaceRequest = MedusaRequest & { marketplaceActor?: string }
export async function workspace(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store")
  const service = req.scope.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  const localActor = (req as MarketplaceRequest).marketplaceActor
  const customerId = (req as AuthenticatedMedusaRequest).auth_context?.actor_id
  const actor = localActor ?? (customerId ? await service.actorForCustomer(customerId) : undefined)
  if (!actor) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to access the marketplace.")
  return { service, actor }
}
export function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success) throw new MedusaError(MedusaError.Types.INVALID_DATA, result.error.issues.map(issue => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; "))
  return result.data
}
