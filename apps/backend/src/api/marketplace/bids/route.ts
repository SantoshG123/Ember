import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createBidSchema } from "../../../contracts/marketplace-v2"
import { parse, workspace } from "../_shared"
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.status(201).json(await service.mutate({ action: "create-bid", actor, data: parse(createBidSchema, req.body) }))
}
