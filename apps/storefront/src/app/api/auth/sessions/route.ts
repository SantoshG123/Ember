import { AccountError, accountBackend, accountToken } from "@/lib/account-server"
import { revokeSessionSchema, sessionPageSchema } from "@/lib/account-session-schema"
import { getMarketplaceDataMode, guardMarketplaceMutation, marketplaceJson, readJsonBody } from "@/lib/marketplace-server"

function sessionToken(request: Request) {
  if (getMarketplaceDataMode() !== "medusa") throw new AccountError("Session management requires real account mode.", 503)
  const token = accountToken(request)
  if (!token) throw new AccountError("Sign in to manage your sessions.", 401)
  return token
}

function failure(error: unknown) {
  const status = error instanceof AccountError ? error.status : 503
  const message = status === 401 ? "Your session has ended. Sign in again." : status === 404 ? "That session is no longer available. Refresh the list." : "Session management is unavailable. Please try again."
  return marketplaceJson({ message }, status)
}

export async function GET(request: Request) {
  try {
    const token = sessionToken(request)
    const search = new URL(request.url).searchParams
    const parsed = sessionPageSchema.safeParse(Object.fromEntries(search))
    if (!parsed.success || search.getAll("offset").length > 1) return marketplaceJson({ message: "Choose a valid session page." }, 400)
    return marketplaceJson(await accountBackend(`/accounts/sessions?offset=${parsed.data.offset}`, { session: token }))
  } catch (error) { return failure(error) }
}

export async function DELETE(request: Request) {
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  try {
    const token = sessionToken(request)
    let body: unknown
    try {
      const raw = await readJsonBody(request)
      if (raw.length > 4096) return marketplaceJson({ message: "This request is too large." }, 413)
      body = JSON.parse(raw)
    } catch { return marketplaceJson({ message: "Send a valid session request." }, 400) }
    const parsed = revokeSessionSchema.safeParse(body)
    if (!parsed.success) return marketplaceJson({ message: "Choose a session or explicitly confirm all other sessions." }, 400)
    return marketplaceJson(await accountBackend("/accounts/sessions", { method: "DELETE", session: token, body: parsed.data }))
  } catch (error) { return failure(error) }
}
