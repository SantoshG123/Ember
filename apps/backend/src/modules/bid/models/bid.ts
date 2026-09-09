import { model } from "@medusajs/framework/utils"

const Bid = model.define("marketplace_bid", {
  id: model.id().primaryKey(),
  request_id: model.text().index("IDX_EMBER_BID_REQUEST"),
  seller_id: model.text().index("IDX_EMBER_BID_SELLER"),
  amount: model.bigNumber(),
  currency_code: model.text().default("usd"),
  delivery_count: model.number().default(1),
  proposal: model.text(),
  availability: model.text(),
  status: model
    .enum(["submitted", "accepted", "declined", "withdrawn", "fulfilled"])
    .default("submitted"),
  accepted_at: model.dateTime().nullable(),
})

export default Bid
