import { z } from "zod"

export const requestSchema = z
  .object({
    category: z.string().min(1, "Choose a category."),
    title: z
      .string()
      .min(8, "Use at least 8 characters so sellers understand the need.")
      .max(80, "Keep the title under 80 characters."),
    description: z
      .string()
      .min(40, "Add a little more detail—at least 40 characters.")
      .max(1200, "Keep the description under 1,200 characters."),
    referenceName: z.string().optional(),
    budgetMin: z.number().positive("Enter a minimum budget."),
    budgetMax: z.number().positive("Enter a maximum budget."),
    frequency: z.enum(["one-time", "weekly", "monthly", "flexible"]),
    timing: z.string().min(3, "Tell sellers when you need this."),
    zip: z.string().regex(/^\d{5}$/, "Enter a valid 5-digit ZIP code."),
  })
  .refine((value) => value.budgetMax >= value.budgetMin, {
    path: ["budgetMax"],
    message: "Maximum budget must be at least the minimum.",
  })

export type RequestInput = z.infer<typeof requestSchema>
