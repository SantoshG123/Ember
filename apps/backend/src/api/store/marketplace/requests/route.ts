import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REQUEST_MODULE } from "../../../../modules/request"
import type RequestModuleService from "../../../../modules/request/service"
import { createRequestSchema } from "../../../../contracts/marketplace"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<RequestModuleService>(REQUEST_MODULE)
  const requests = await service.listMarketplaceRequests(
    { status: "open" },
    { order: { created_at: "DESC" }, take: 50 },
  )
  res.json({ requests })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = createRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: "Check the request details and try again.",
      issues: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const service = req.scope.resolve<RequestModuleService>(REQUEST_MODULE)
  const request = await service.createMarketplaceRequests({
    ...parsed.data,
    status: "open",
  })
  res.status(201).json({ request })
}
