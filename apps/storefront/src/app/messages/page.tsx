import type { Metadata } from "next"
import { MessagesWorkspace } from "@/components/messages-workspace"

export const metadata: Metadata = {
  title: "Messages",
  description: "Coordinate accepted proposals and local fulfillment through EMBER.",
}

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ role?: string; conversation?: string }> }) {
  const query = await searchParams
  return <MessagesWorkspace actor={query.role === "seller" ? "seller" : "buyer"} initialConversationId={typeof query.conversation === "string" ? query.conversation : undefined} />
}
