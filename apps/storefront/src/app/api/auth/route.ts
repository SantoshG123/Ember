import { cookies } from "next/headers"
import { authApiSchema } from "@/lib/auth-schema"
import { AccountError, accountBackend, accountCookieName, accountToken } from "@/lib/account-server"
import { getMarketplaceDataMode, guardMarketplaceMutation, marketplaceJson, readJsonBody } from "@/lib/marketplace-server"

function authFailure(error: unknown) {
  return marketplaceJson({ message: error instanceof AccountError ? error.message : "The account service is unavailable. Please try again." }, error instanceof AccountError ? error.status : 503)
}

export async function GET(request: Request) {
  const dataMode = getMarketplaceDataMode()
  const token = accountToken(request)
  if (dataMode === "demo" || token === undefined) return marketplaceJson({ account: null, dataMode })
  if (dataMode !== "medusa") return authFailure(new AccountError("Account access is not configured."))
  try { return marketplaceJson({ ...await accountBackend("/accounts/session", { session: token }), dataMode }) }
  catch (error) {
    if (error instanceof AccountError && error.status === 401) return marketplaceJson({ account: null, dataMode })
    return authFailure(error)
  }
}

export async function DELETE(request: Request) {
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  const token = accountToken(request)
  try {
    if (token !== undefined) await accountBackend("/accounts/session", { method: "DELETE", session: token })
    ;(await cookies()).set(accountCookieName(), "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 })
    return marketplaceJson({ signedOut: true })
  } catch (error) { return authFailure(error) }
}

export async function POST(request: Request) {
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  let body: unknown
  try {
    const raw = await readJsonBody(request)
    if (raw.length > 8192) return marketplaceJson({ message: "This request is too large." }, 413)
    body = JSON.parse(raw)
  } catch { return marketplaceJson({ message: "Send a valid JSON request." }, 400) }
  const parsed = authApiSchema.safeParse(body)

  if (!parsed.success) {
    return marketplaceJson(
      {
        message: "Check the information you entered and try again.",
        issues: parsed.error.flatten().fieldErrors,
      },
      400,
    )
  }

  const { action, email, mode, role } = parsed.data

  if (getMarketplaceDataMode() !== "demo") {
    if (getMarketplaceDataMode() !== "medusa") return authFailure(new AccountError("Account access is not configured."))
    if (action !== "authenticate") return marketplaceJson({ message: "Email delivery is not configured yet. Password recovery and email links are currently unavailable." }, 503)
    try {
      const credentials = { email: email.toLowerCase(), password: parsed.data.password }
      let login
      if (mode === "create-account") {
        try { login = await accountBackend("/auth/customer/emailpass/register", { method: "POST", body: credentials }) }
        catch (error) {
          if (!(error instanceof AccountError) || ![400, 401, 409].includes(error.status)) throw error
          // An interrupted signup may already have an identity. Only the correct
          // password can recover it; no existing account roles are overwritten.
          login = await accountBackend("/auth/customer/emailpass", { method: "POST", body: credentials })
        }
        if (typeof login.token !== "string") throw new AccountError("Additional authentication is required.", 401)
        await accountBackend("/accounts", { method: "POST", bearer: login.token, body: { name: parsed.data.name, role } })
      }
      login = await accountBackend("/auth/customer/emailpass", { method: "POST", body: credentials })
      if (typeof login.token !== "string") throw new AccountError("Additional authentication is required.", 401)
      const session = await accountBackend("/accounts/session", { method: "POST", bearer: login.token })
      if (!/^[a-f0-9]{64}$/.test(session.token) || !session.account?.id || !Number.isFinite(Date.parse(session.expiresAt))) throw new AccountError("The account session could not be created.")
      const previous = accountToken(request)
      if (previous !== undefined) await accountBackend("/accounts/session", { method: "DELETE", session: previous })
      ;(await cookies()).set(accountCookieName(), session.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: new Date(session.expiresAt) })
      return marketplaceJson({ status: "success", action, email: credentials.email, accountId: session.account.id, role: session.account.role, message: "You are signed in.", dataMode: "medusa" }, mode === "create-account" ? 201 : 200)
    } catch (error) { return authFailure(error) }
  }

  // Demo adapter only. The password is validated above, then intentionally omitted:
  // it is never logged, stored, or returned. Replace this route with Medusa customer
  // authentication and a production email provider before launch.
  const message =
    action === "magic-link"
      ? "A secure sign-in link is ready for your inbox."
      : action === "recover"
        ? "Password reset instructions are ready for your inbox."
        : mode === "create-account"
          ? "Your EMBER account is ready."
          : "You are signed in."

  return marketplaceJson(
    {
      status: "success" as const,
      action,
      email,
      role,
      accountId: action === "authenticate" ? `acct_${crypto.randomUUID()}` : undefined,
      message,
      dataMode: "demo" as const,
    },
    action === "authenticate" && mode === "create-account" ? 201 : 200,
  )
}
