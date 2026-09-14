import type { Metadata } from "next"
import { MessagesWorkspace } from "@/components/messages-workspace"
import { cookies } from "next/headers"
import { accountBackend, accountCookieName } from "@/lib/account-server"

export const metadata: Metadata = {
  title: "Messages",
  description: "Coordinate accepted proposals and local fulfillment through EMBER.",
}

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ role?: string; conversation?: string }> }) {
  const query = await searchParams
  let actor: "buyer" | "seller" = query.role === "seller" ? "seller" : "buyer"
  const token = (await cookies()).get(accountCookieName())?.value
  if (!query.role && token) {
    try {
      const current = await accountBackend("/accounts/session", { session: token })
      if (current.account?.role === "seller") actor = "seller"
    } catch { /* The workspace renders the authorization/service error. */ }
  }
  return <MessagesWorkspace actor={actor} initialConversationId={typeof query.conversation === "string" ? query.conversation : undefined} />
}
