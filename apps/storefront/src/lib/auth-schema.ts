import { z } from "zod"

export const authRoleSchema = z.enum(["buyer", "seller", "both"])

export const authFormSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  name: z.string().trim().max(80, "Use 80 characters or fewer."),
  role: authRoleSchema,
})

export type AuthFormInput = z.infer<typeof authFormSchema>

export const authApiSchema = z
  .object({
    action: z.enum(["authenticate", "magic-link", "recover"]),
    mode: z.enum(["sign-in", "create-account"]).optional(),
    email: z.string().trim().email().max(254),
    password: z.string().max(128).optional(),
    name: z.string().trim().min(2).max(80).optional(),
    role: authRoleSchema.optional(),
  }).strict()
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
    if (value.mode === "create-account" && !value.name) context.addIssue({ code: "custom", path: ["name"], message: "Enter your display name." })
    if (value.mode === "create-account" && (value.password?.length ?? 0) < 12) context.addIssue({ code: "custom", path: ["password"], message: "Use a passphrase with at least 12 characters." })
  })
