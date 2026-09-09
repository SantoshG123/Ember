import { z } from "zod"

export const authRoleSchema = z.enum(["buyer", "seller", "both"])

export const authFormSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  role: authRoleSchema,
})

export type AuthFormInput = z.infer<typeof authFormSchema>

export const authApiSchema = z
  .object({
    action: z.enum(["authenticate", "magic-link", "recover"]),
    mode: z.enum(["sign-in", "create-account"]).optional(),
    email: z.string().trim().email(),
    password: z.string().optional(),
    role: authRoleSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.action !== "authenticate") return

    if (!value.mode) {
      context.addIssue({ code: "custom", path: ["mode"], message: "Choose an account mode." })
    }

    if (!value.password || value.password.length < 8) {
      context.addIssue({ code: "custom", path: ["password"], message: "Use at least 8 characters." })
    }

    if (value.mode === "create-account" && !value.role) {
      context.addIssue({ code: "custom", path: ["role"], message: "Choose how you will use EMBER." })
    }
  })

