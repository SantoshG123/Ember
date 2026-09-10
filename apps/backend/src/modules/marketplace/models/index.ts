import { model } from "@medusajs/framework/utils"

// A single module owns these relations, so PostgreSQL can enforce their foreign keys.
export const Participant = model.define("ember_participant", {
  id: model.id({ prefix: "emp" }).primaryKey(),
  customer_id: model.text().unique().nullable(),
  role: model.enum(["buyer", "seller"]),
  name: model.text(),
  initials: model.text(),
  profile: model.json().nullable(),
})

export const Request = model.define("ember_request", {
  id: model.id({ prefix: "req" }).primaryKey(),
  buyer: model.belongsTo(() => Participant),
  category: model.text(),
  title: model.text().searchable(),
  description: model.text(),
  budget_min: model.bigNumber(),
  budget_max: model.bigNumber(),
  frequency: model.enum(["one-time", "weekly", "monthly", "flexible"]),
  timing: model.text(),
  zip: model.text(),
  location_area: model.text(),
  status: model.enum(["open", "matched", "fulfilled", "cancelled"]).default("open"),
  reference_name: model.text().nullable(),
}).checks([
  { name: "ember_request_budget_check", expression: columns => `${columns.budget_min} > 0 AND ${columns.budget_max} >= ${columns.budget_min} AND ${columns.budget_max} <= 1000000 AND ${columns.budget_min} = trunc(${columns.budget_min}, 2) AND ${columns.budget_max} = trunc(${columns.budget_max}, 2)` },
]).indexes([
  { name: "IDX_EMBER_REQUEST_DISCOVERY", on: ["status", "created_at"], where: "deleted_at IS NULL" },
])

export const Bid = model.define("ember_bid", {
  id: model.id({ prefix: "bid" }).primaryKey(),
  request: model.belongsTo(() => Request),
  seller: model.belongsTo(() => Participant),
  price_per_delivery: model.bigNumber(),
  delivery_count: model.number(),
  cadence: model.text(),
  earliest_start: model.text(),
  proposal: model.text(),
  details: model.json().nullable(),
  status: model.enum(["active", "accepted", "declined"]).default("active"),
  accepted_at: model.dateTime().nullable(),
}).indexes([
  { name: "IDX_EMBER_ONE_ACCEPTED_BID", on: ["request_id"], unique: true, where: "status = 'accepted' AND deleted_at IS NULL" },
  { name: "IDX_EMBER_ONE_ACTIVE_BID", on: ["request_id", "seller_id"], unique: true, where: "status = 'active' AND deleted_at IS NULL" },
]).checks([
  { name: "ember_bid_price_check", expression: columns => `${columns.price_per_delivery} > 0 AND ${columns.price_per_delivery} <= 1000000 AND ${columns.price_per_delivery} = trunc(${columns.price_per_delivery}, 2)` },
  { name: "ember_bid_count_check", expression: columns => `${columns.delivery_count} >= 1 AND ${columns.delivery_count} <= 1000` },
])

export const Opportunity = model.define("ember_opportunity", {
  id: model.id({ prefix: "opp" }).primaryKey(),
  slug: model.text().unique(),
  // Editorial cluster evidence is stored once, not recreated on every API request.
  details: model.json(),
})

export const Conversation = model.define("ember_conversation", {
  id: model.id({ prefix: "conv" }).primaryKey(),
  request: model.belongsTo(() => Request),
  buyer: model.belongsTo(() => Participant),
  seller: model.belongsTo(() => Participant),
  proposal: model.json(),
  status: model.enum(["active", "archived"]).default("active"),
  buyer_read_at: model.dateTime().nullable(),
  seller_read_at: model.dateTime().nullable(),
}).indexes([{ name: "IDX_EMBER_CONVERSATION_PARTIES", on: ["request_id", "buyer_id", "seller_id"], unique: true }])

export const Message = model.define("ember_message", {
  id: model.id({ prefix: "msg" }).primaryKey(),
  conversation: model.belongsTo(() => Conversation),
  author: model.belongsTo(() => Participant),
  body: model.text(),
  attachment: model.json().nullable(),
})

export const Bookmark = model.define("ember_bookmark", {
  id: model.id({ prefix: "mark" }).primaryKey(),
  participant: model.belongsTo(() => Participant),
  opportunity: model.belongsTo(() => Opportunity),
}).indexes([{ name: "IDX_EMBER_BOOKMARK_OWNER", on: ["participant_id", "opportunity_id"], unique: true }])

export const OfferDraft = model.define("ember_offer_draft", {
  id: model.id({ prefix: "offer" }).primaryKey(),
  seller: model.belongsTo(() => Participant),
  opportunity: model.belongsTo(() => Opportunity),
  price_per_meal: model.bigNumber(),
  weekly_capacity: model.number(),
  delivery_days: model.text(),
  note: model.text(),
}).checks([
  { name: "ember_offer_price_check", expression: columns => `${columns.price_per_meal} >= 8 AND ${columns.price_per_meal} <= 1000000 AND ${columns.price_per_meal} = trunc(${columns.price_per_meal}, 2)` },
  { name: "ember_offer_capacity_check", expression: columns => `${columns.weekly_capacity} >= 20 AND ${columns.weekly_capacity} <= 100000` },
])
