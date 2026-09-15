import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { parse } from "../../marketplace/_shared"
import { authorizeAccount } from "../_shared"

const querySchema = z.object({ offset: z.coerce.number().int().min(0).max(100_000).default(0) }).strict()
const revokeSchema = z.union([
  z.object({ sessionId: z.string().regex(/^esess_[a-zA-Z0-9]+$/).max(80) }).strict(),
  z.object({ allOthers: z.literal(true) }).strict(),
])

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { token, service } = await authorizeAccount(req, res)
  const query = parse(querySchema, req.query)
  res.json(await service.activeSessions(token, query.offset))
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { token, service } = await authorizeAccount(req, res)
  const input = parse(revokeSchema, req.body)
  res.json(await service.endOtherSessions(token, "sessionId" in input ? input.sessionId : undefined))
}
