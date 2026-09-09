import "server-only"
import { headers as requestHeaders } from "next/headers"

import {
  allowsMarketplaceMutation,
  canUseLocalMarketplaceActor,
  isLoopbackHost,
  resolveMarketplaceMode,
} from "@/lib/marketplace-policy"

export const getMarketplaceDataMode = () => resolveMarketplaceMode(process.env)
export const getMarketplaceMode = getMarketplaceDataMode

export async function fetchMarketplaceData<T>(path: string, options: { actor?: "buyer" | "seller" } = {}): Promise<T> {
  const incoming = await requestHeaders()
  const host = incoming.get("host") ?? "localhost:3000"
  const protocol = isLoopbackHost(host.split(":")[0]) ? "http" : "https"
  const request = new Request(`${protocol}://${host}/api/${path}`, {
    headers: incoming.get("authorization") ? { authorization: incoming.get("authorization")! } : undefined,
  })
  const response = await proxyMarketplace(request, path.split("?")[0], options.actor)
  const result = await response.json()
  if (!response.ok) throw new Error(result.message ?? "Marketplace data could not be loaded.")
  return result as T
}

export function marketplaceJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  })
}

function failure(message: string, status = 503) {
  return marketplaceJson({ message, dataMode: getMarketplaceDataMode() }, status)
}

export function guardMarketplaceMutation(request: Request) {
  return allowsMarketplaceMutation(request)
    ? null
    : failure("This action must be submitted from the EMBER application.", 403)
}

async function readJsonBody(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new Error("content-type")
  }
  const reader = request.body?.getReader()
  if (!reader) throw new Error("json")
  const decoder = new TextDecoder()
  let bytes = 0
  let body = ""
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > 64 * 1024) {
        await reader.cancel()
        throw new Error("too-large")
      }
      body += decoder.decode(chunk.value, { stream: true })
    }
    body += decoder.decode()
    JSON.parse(body)
    return body
  } finally {
    reader.releaseLock()
  }
}

/** Server-only bridge. No credentials or caller-selected local actors reach the browser. */
export async function proxyMarketplace(
  request: Request,
  path: string,
  actor: "buyer" | "seller" = "buyer",
) {
  if (getMarketplaceDataMode() !== "medusa") {
    return failure("Persistent marketplace data is not configured. Check the EMBER data mode.")
  }
  const mutating = !["GET", "HEAD"].includes(request.method)
  if (mutating) {
    const blocked = guardMarketplaceMutation(request)
    if (blocked) return blocked
  }

  let backend: URL
  try {
    backend = new URL(process.env.MEDUSA_BACKEND_URL ?? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000")
    if (backend.username || backend.password ||
      (backend.protocol !== "https:" && !(backend.protocol === "http:" && isLoopbackHost(backend.hostname)))) {
      throw new Error("unsafe-backend-url")
    }
  } catch {
    return failure("The marketplace backend URL is not configured correctly.")
  }

  const headers = new Headers({ Accept: "application/json" })
  const authorization = request.headers.get("authorization")
  if (authorization?.match(/^Bearer [^\s]+$/i)) {
    headers.set("authorization", authorization)
  } else if (!authorization && canUseLocalMarketplaceActor(process.env, request, backend)) {
    headers.set("x-ember-local-key", process.env.EMBER_LOCAL_API_KEY!)
    headers.set("x-ember-local-actor", `ember-${actor}`)
  }

  let body: string | undefined
  if (mutating) {
    try {
      body = await readJsonBody(request)
      headers.set("content-type", "application/json")
    } catch (error) {
      const reason = error instanceof Error ? error.message : "json"
      return failure(
        reason === "too-large" ? "This request is too large." : "Send a valid JSON request.",
        reason === "too-large" ? 413 : 400,
      )
    }
  }

  const target = new URL(`/marketplace/${path}`, backend)
  // Route callers supply fixed paths or encoded IDs; only query values come from the browser.
  target.search = new URL(request.url).search
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    })
    const result: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      if (response.status >= 500) return failure("Marketplace data is temporarily unavailable. Please try again.")
      const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
        ? result.message.slice(0, 300)
        : response.status === 401 ? "Sign in to access your marketplace data." : "The marketplace action could not be completed."
      return failure(message, response.status)
    }
    if (!result || typeof result !== "object") return failure("The marketplace returned an invalid response.", 502)
    return marketplaceJson(result, response.status)
  } catch {
    return failure("The marketplace backend is unavailable. Your changes have not been confirmed; refresh before trying again.")
  }
}
