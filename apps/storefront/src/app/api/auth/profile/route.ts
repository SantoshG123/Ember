import { AccountError, accountBackend, accountToken } from "@/lib/account-server"
import { accountProfileSchema } from "@/lib/account-profile-schema"
import { getMarketplaceDataMode, guardMarketplaceMutation, marketplaceJson, readJsonBody } from "@/lib/marketplace-server"

function sessionToken(request: Request) {
  if (getMarketplaceDataMode() !== "medusa") throw new AccountError("Profiles require real account mode.", 503)
  const token = accountToken(request)
  if (!token) throw new AccountError("Sign in to edit your profile.", 401)
  return token
}

function failure(error: unknown) {
  const status = error instanceof AccountError ? error.status : 503
  const message = status === 401 ? "Your session has ended. Sign in again."
    : status === 409 ? "Your profile changed in another session. Reload the latest profile before saving."
    : status === 400 ? "Check your profile details. Only sellers can edit seller information."
    : "Your profile could not be saved or loaded. Please try again."
  return marketplaceJson({ message }, status)
}

export async function GET(request: Request) {
  try {
    const token = sessionToken(request)
    if (new URL(request.url).search) return marketplaceJson({ message: "Profile lookup does not accept account identifiers." }, 400)
    return marketplaceJson(await accountBackend("/accounts/profile", { session: token }))
  } catch (error) { return failure(error) }
}

export async function PATCH(request: Request) {
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  try {
    const token = sessionToken(request)
    let body: unknown
    try {
      const raw = await readJsonBody(request)
      if (new TextEncoder().encode(raw).byteLength > 8192) return marketplaceJson({ message: "This profile is too large." }, 413)
      body = JSON.parse(raw)
    } catch { return marketplaceJson({ message: "Send valid profile details." }, 400) }
    const parsed = accountProfileSchema.safeParse(body)
    if (!parsed.success) return marketplaceJson({ message: "Check the name, field lengths, and capabilities, then try again." }, 400)
    return marketplaceJson(await accountBackend("/accounts/profile", { method: "PATCH", session: token, body: parsed.data }))
  } catch (error) { return failure(error) }
}
