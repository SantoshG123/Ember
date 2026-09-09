import Medusa from "@medusajs/js-sdk"

const baseUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"

export const isMedusaConfigured = Boolean(
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
)

export const medusa = new Medusa({
  baseUrl,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})
