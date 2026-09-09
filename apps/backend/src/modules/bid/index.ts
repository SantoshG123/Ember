import { Module } from "@medusajs/framework/utils"
import BidModuleService from "./service"

export const BID_MODULE = "marketplace_bid"

export default Module(BID_MODULE, { service: BidModuleService })
