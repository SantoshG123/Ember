import { Module } from "@medusajs/framework/utils"
import OpportunityModuleService from "./service"

export const OPPORTUNITY_MODULE = "marketplace_opportunity"

export default Module(OPPORTUNITY_MODULE, { service: OpportunityModuleService })
