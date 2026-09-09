import { model } from "@medusajs/framework/utils"

const Opportunity = model.define("marketplace_opportunity", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  category: model.text().index("IDX_EMBER_OPPORTUNITY_CATEGORY"),
  title: model.text().searchable(),
  summary: model.text().searchable(),
  location_area: model.text().index("IDX_EMBER_OPPORTUNITY_AREA"),
  radius_miles: model.float(),
  request_count: model.number().default(0),
  seller_count: model.number().default(0),
  median_budget: model.bigNumber(),
  currency_code: model.text().default("usd"),
  evidence: model.json<{ label: string; value: string }[]>().nullable(),
  status: model.enum(["emerging", "validated", "inactive"]).default("emerging"),
})

export default Opportunity
