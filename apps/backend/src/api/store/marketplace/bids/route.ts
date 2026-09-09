import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BID_MODULE } from "../../../../modules/bid"
import type BidModuleService from "../../../../modules/bid/service"
import { createBidSchema } from "../../../../contracts/marketplace"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = createBidSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: "Check the proposal details and try again.",
      issues: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const service = req.scope.resolve<BidModuleService>(BID_MODULE)
  const bid = await service.createBids({ ...parsed.data, status: "submitted" })
  res.status(201).json({ bid })
}
