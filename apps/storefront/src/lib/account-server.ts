import "server-only"

export const accountCookieName = () => process.env.NODE_ENV === "production" ? "__Host-ember-session" : "ember-session"
export function accountToken(request: Request) {
  const prefix = `${accountCookieName()}=`
  return request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(prefix))?.slice(prefix.length)
}

export class AccountError extends Error {
  constructor(message: string, public status = 503) { super(message) }
}

export async function accountBackend(path: string, options: { method?: string; body?: unknown; bearer?: string; session?: string } = {}) {
  let target: URL
  try {
    const base = new URL(process.env.MEDUSA_BACKEND_URL ?? "http://127.0.0.1:9000")
    if (base.username || base.password || !(base.protocol === "https:" || (base.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)))) throw new Error()
    target = new URL(path, base)
  } catch { throw new AccountError("The account service is not configured correctly.") }
  const headers = new Headers({ accept: "application/json" })
  if (options.body !== undefined) headers.set("content-type", "application/json")
  if (options.bearer) headers.set("authorization", `Bearer ${options.bearer}`)
  if (options.session !== undefined) headers.set("x-ember-session", options.session || "invalid")
  let response: Response
  try {
    response = await fetch(target, { method: options.method ?? "GET", headers, body: options.body === undefined ? undefined : JSON.stringify(options.body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000) })
  } catch { throw new AccountError("The account service is unavailable. Please try again.") }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const status = response.status >= 500 ? 503 : response.status
    // Never expose Medusa responses that might contain identity or provider details.
    throw new AccountError(status === 429 ? "Too many attempts. Please wait before trying again." : status >= 500 ? "The account service is unavailable. Please try again." : "We could not sign you in. Check your details and try again.", status)
  }
  if (!body || typeof body !== "object") throw new AccountError("The account service returned an invalid response.")
  return body
}
