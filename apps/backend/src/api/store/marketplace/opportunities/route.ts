import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { OPPORTUNITY_MODULE } from "../../../../modules/opportunity"
import type OpportunityModuleService from "../../../../modules/opportunity/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<OpportunityModuleService>(OPPORTUNITY_MODULE)
  const opportunities = await service.listOpportunities(
    { status: ["emerging", "validated"] },
    { order: { request_count: "DESC" }, take: 50 },
  )
  res.json({ opportunities })
}
