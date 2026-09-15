import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ICustomerModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../modules/marketplace"
import type MarketplaceModuleService from "../../modules/marketplace/service"

export async function authorizeAccount(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store")
  const token = req.get("x-ember-session") ?? ""
  const service = req.scope.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  const customerId = await service.customerForSession(token)
  const customer = await req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER).retrieveCustomer(customerId)
  if (!customer.has_account) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to continue.")
  return { token, service, customerId }
}
