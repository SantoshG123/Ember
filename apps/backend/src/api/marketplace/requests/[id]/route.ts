import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { workspace } from "../../_shared"
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { service, actor } = await workspace(req, res)
  res.json(await service.requests(actor, req.params.id))
}
