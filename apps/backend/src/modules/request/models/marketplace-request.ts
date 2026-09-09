import { model } from "@medusajs/framework/utils"

const MarketplaceRequest = model.define("marketplace_request", {
  id: model.id().primaryKey(),
  buyer_id: model.text().index("IDX_EMBER_REQUEST_BUYER"),
  category: model.text().index("IDX_EMBER_REQUEST_CATEGORY"),
  title: model.text().searchable(),
  description: model.text().searchable(),
  budget_min: model.bigNumber(),
  budget_max: model.bigNumber(),
  currency_code: model.text().default("usd"),
  frequency: model
    .enum(["one_time", "weekly", "monthly", "flexible"])
    .default("one_time"),
  timing: model.text(),
  location_area: model.text().index("IDX_EMBER_REQUEST_AREA"),
  constraints: model.json<Record<string, string | boolean | number>>().nullable(),
  status: model
    .enum(["draft", "open", "matched", "fulfilled", "cancelled"])
    .default("open"),
  expires_at: model.dateTime().nullable(),
})

export default MarketplaceRequest
