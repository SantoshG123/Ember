import { MedusaService } from "@medusajs/framework/utils"
import Opportunity from "./models/opportunity"

class OpportunityModuleService extends MedusaService({ Opportunity }) {}

export default OpportunityModuleService
