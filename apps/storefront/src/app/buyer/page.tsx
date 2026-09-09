import type { Metadata } from "next"
import { BuyerDashboard } from "@/components/buyer-dashboard"

export const metadata: Metadata = {
  title: "Buyer dashboard",
  description: "Track requests and compare qualified seller bids on EMBER.",
}

export default function BuyerPage() {
  return <BuyerDashboard />
}
