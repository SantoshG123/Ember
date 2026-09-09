import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    status: "ok",
    service: "ember-backend",
    providers: {
      postgres: Boolean(process.env.DATABASE_URL),
      redis: Boolean(process.env.REDIS_URL),
      stripe: Boolean(process.env.STRIPE_API_KEY),
    },
  })
}
