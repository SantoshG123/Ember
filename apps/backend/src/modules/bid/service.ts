import { MedusaService } from "@medusajs/framework/utils"
import Bid from "./models/bid"

class BidModuleService extends MedusaService({ Bid }) {}

export default BidModuleService
