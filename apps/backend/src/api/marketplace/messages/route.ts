import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { confirmMilestoneSchema, readMessageSchema, sendMessageSchema } from "../../../contracts/marketplace-v2"
import { parse, workspace } from "../_shared"
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.json(await service.messagesWorkspace(actor))
}
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.status(201).json(await service.mutate({ action: "send-message", actor, data: parse(sendMessageSchema, req.body) }))
}
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  const read = readMessageSchema.safeParse(req.body)
  res.json(await service.mutate(read.success ? { action: "read-message", actor, data: read.data } : { action: "confirm-milestone", actor, data: parse(confirmMilestoneSchema, req.body) }))
}
