import { z } from "zod"

const id = z.string().trim().min(1).max(160)
const amount = z.number().positive().max(1_000_000)
export const createRequestSchema = z.object({
  category: z.string().trim().min(1).max(100),
  title: z.string().trim().min(8).max(80),
  description: z.string().trim().min(40).max(1200),
  budgetMin: amount, budgetMax: amount,
  frequency: z.enum(["one-time", "weekly", "monthly", "flexible"]),
  timing: z.string().trim().min(3).max(200), zip: z.string().regex(/^\d{5}$/),
  referenceName: z.string().trim().max(255).optional(),
}).strict().refine(value => value.budgetMax >= value.budgetMin, {
  path: ["budgetMax"], message: "Maximum budget must be at least the minimum budget.",
})
export const createBidSchema = z.object({
  requestId: id, pricePerDelivery: amount, deliveryCount: z.number().int().min(1).max(1000),
  cadence: z.string().trim().min(3).max(200), earliestStart: z.string().trim().min(3).max(200),
  proposal: z.string().trim().min(20).max(2000),
}).strict()
export const decideBidSchema = z.object({ bidId: id, action: z.enum(["accept", "decline"]) }).strict()
// File uploads need object storage; only real message text is accepted here.
export const sendMessageSchema = z.object({ conversationId: id, body: z.string().trim().min(1).max(1000) }).strict()
export const readMessageSchema = z.object({ action: z.literal("read"), conversationId: id }).strict()
export const confirmMilestoneSchema = z.object({ conversationId: id, confirmed: z.boolean() }).strict()
export const saveOpportunitySchema = z.object({ slug: id, saved: z.boolean() }).strict()
export const draftOfferSchema = z.object({
  slug: id, pricePerMeal: amount.min(8), weeklyCapacity: z.number().int().min(20).max(100000),
  deliveryDays: z.string().trim().min(3).max(200), note: z.string().trim().max(2000),
}).strict()
