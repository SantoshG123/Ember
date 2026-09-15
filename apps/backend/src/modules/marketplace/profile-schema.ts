import { z } from "zod"

const singleLine = (max: number, min = 0) => z.string().trim().min(min).max(max).refine(value => !/[\u0000-\u001f\u007f]/.test(value), "Use a single line without control characters.")
export const sellerProfileSchema = z.object({
  summary: z.string().trim().max(600, "Keep your introduction to 600 characters."),
  serviceArea: singleLine(120),
  capabilities: z.array(singleLine(40, 1)).max(8, "Add no more than 8 capabilities.")
    .refine(values => new Set(values.map(value => value.toLowerCase())).size === values.length, "Use each capability only once."),
}).strict()
export const accountProfileSchema = z.object({
  name: singleLine(80, 2),
  seller: sellerProfileSchema.optional(),
  version: z.string().regex(/^[a-f0-9]{64}$/, "Reload your profile before saving."),
}).strict()

export type SellerProfile = z.infer<typeof sellerProfileSchema>
export type AccountProfileInput = z.infer<typeof accountProfileSchema>
export type AccountProfile = { name: string; seller: SellerProfile | null; version: string }
