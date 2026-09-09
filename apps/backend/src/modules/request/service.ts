import { MedusaService } from "@medusajs/framework/utils"
import MarketplaceRequest from "./models/marketplace-request"

class RequestModuleService extends MedusaService({ MarketplaceRequest }) {}

export default RequestModuleService
