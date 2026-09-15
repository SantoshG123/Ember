import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { accountProfileSchema } from "../../../modules/marketplace/profile-schema"
import { parse } from "../../marketplace/_shared"
import { authorizeAccount } from "../_shared"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { service, customerId } = await authorizeAccount(req, res)
  parse(z.object({}).strict(), req.query)
  res.json(await service.accountProfile(customerId))
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { token, service } = await authorizeAccount(req, res)
  const input = parse(accountProfileSchema, req.body)
  res.json(await service.updateAccountProfile(token, input))
}
