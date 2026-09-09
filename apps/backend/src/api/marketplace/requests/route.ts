import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createRequestSchema } from "../../../contracts/marketplace-v2"
import { parse, workspace } from "../_shared"
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.json(await service.requests(actor))
}
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.status(201).json(await service.mutate({ action: "create-request", actor, data: parse(createRequestSchema, req.body) }))
}
