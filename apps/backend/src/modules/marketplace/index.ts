import { Module } from "@medusajs/framework/utils"
import MarketplaceModuleService from "./service"

export const MARKETPLACE_MODULE = "emberMarketplace"
export default Module(MARKETPLACE_MODULE, { service: MarketplaceModuleService })
