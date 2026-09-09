import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { decideBidSchema } from "../../../contracts/marketplace-v2"
import { parse, workspace } from "../_shared"
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.json(await service.buyerDashboard(actor))
}
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.json(await service.mutate({ action: "decide-bid", actor, data: parse(decideBidSchema, req.body) }))
}
