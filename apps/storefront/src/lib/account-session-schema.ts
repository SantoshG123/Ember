import { z } from "zod"

export const sessionPageSchema = z.object({ offset: z.coerce.number().int().min(0).max(100_000).default(0) }).strict()
export const revokeSessionSchema = z.union([
  z.object({ sessionId: z.string().regex(/^esess_[a-zA-Z0-9]+$/).max(80) }).strict(),
  z.object({ allOthers: z.literal(true) }).strict(),
])

export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>
export type AccountSession = { id: string; createdAt: string; expiresAt: string; current: boolean }
export type AccountSessions = { sessions: AccountSession[]; count: number; offset: number; limit: number }
