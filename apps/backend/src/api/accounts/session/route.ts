import type { AuthenticatedMedusaRequest, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ICustomerModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../modules/marketplace"
import type MarketplaceModuleService from "../../../modules/marketplace/service"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store")
  const customer = await req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER).retrieveCustomer(req.auth_context.actor_id)
  const service = req.scope.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  // Recover a partially completed signup using server-owned customer metadata.
  const role = customer.metadata?.ember_role
  if (role === "buyer" || role === "seller" || role === "both") await service.provisionAccount(customer.id, customer.first_name || "EMBER member", role)
  res.json(await service.createAccountSession(customer.id))
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store")
  const service = req.scope.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  const customerId = await service.customerForSession(req.get("x-ember-session") ?? "")
  const customer = await req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER).retrieveCustomer(customerId)
  if (!customer.has_account) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to continue.")
  res.json({ account: { ...await service.accountSummary(customerId), email: customer.email } })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store")
  await req.scope.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE).revokeAccountSession(req.get("x-ember-session") ?? "")
  res.json({ signedOut: true })
}
