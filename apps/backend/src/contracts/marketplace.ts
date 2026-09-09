import { z } from "zod"

export const createRequestSchema = z
  .object({
    buyer_id: z.string().min(1),
    category: z.string().min(1),
    title: z.string().min(8).max(80),
    description: z.string().min(40).max(1200),
    budget_min: z.number().positive(),
    budget_max: z.number().positive(),
    currency_code: z.string().length(3).default("usd"),
    frequency: z.enum(["one_time", "weekly", "monthly", "flexible"]),
    timing: z.string().min(3),
    location_area: z.string().regex(/^\d{5}$/),
    constraints: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).optional(),
  })
  .refine((value) => value.budget_max >= value.budget_min, {
    path: ["budget_max"],
    message: "Maximum budget must be at least the minimum budget.",
  })

export const createBidSchema = z.object({
  request_id: z.string().min(1),
  seller_id: z.string().min(1),
  amount: z.number().positive(),
  currency_code: z.string().length(3).default("usd"),
  delivery_count: z.number().int().min(1).default(1),
  proposal: z.string().min(20).max(2000),
  availability: z.string().min(3),
})
