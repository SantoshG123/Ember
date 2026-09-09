import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { draftOfferSchema, saveOpportunitySchema } from "../../../contracts/marketplace-v2"
import { parse, workspace } from "../_shared"
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.json(await service.opportunities(actor, typeof req.query.slug === "string" ? req.query.slug : undefined))
}
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.json(await service.mutate({ action: "save-opportunity", actor, data: parse(saveOpportunitySchema, req.body) }))
}
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.status(201).json(await service.mutate({ action: "draft-offer", actor, data: parse(draftOfferSchema, req.body) }))
}
