import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IAuthModuleService, ICustomerModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows"
import { z } from "zod"
import { MARKETPLACE_MODULE } from "../../modules/marketplace"
import type MarketplaceModuleService from "../../modules/marketplace/service"
import { parse } from "../marketplace/_shared"

const schema = z.object({ name: z.string().trim().min(2).max(80), role: z.enum(["buyer", "seller", "both"]) }).strict()

// Requires a Medusa-verified registration/login token, never a client customer ID.
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "private, no-store")
  const input = parse(schema, req.body)
  const auth = req.scope.resolve<IAuthModuleService>(Modules.AUTH)
  const customers = req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
  const service = req.scope.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE)
  const identity = await auth.retrieveAuthIdentity(req.auth_context.auth_identity_id, { relations: ["provider_identities"] })
  const email = identity.provider_identities?.find(provider => provider.provider === "emailpass")?.entity_id
  if (!email) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Use email and password registration.")
  // Retrieve refreshed metadata too, so retrying a registration token is safe.
  const customerId = req.auth_context.actor_id || identity.app_metadata?.customer_id as string | undefined
  const customer = customerId ? await customers.retrieveCustomer(customerId) : (await createCustomerAccountWorkflow(req.scope).run({ input: {
    authIdentityId: identity.id,
    customerData: { email, first_name: input.name, metadata: { ember_role: input.role } },
  } })).result
  const storedRole = z.enum(["buyer", "seller", "both"]).safeParse(customer.metadata?.ember_role)
  // A non-EMBER commerce account must explicitly opt in before getting a role.
  await service.provisionAccount(customer.id, customer.first_name || input.name, storedRole.success ? storedRole.data : input.role)
  res.json({ account: await service.accountSummary(customer.id) })
}
