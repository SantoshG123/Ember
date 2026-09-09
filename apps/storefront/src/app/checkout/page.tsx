import type { Metadata } from "next"
import { CheckoutExperience } from "@/components/checkout-experience"

export const metadata: Metadata = {
  title: "Protected payment",
  description: "Authorize the first protected delivery milestone with EMBER.",
}

export default function CheckoutPage() {
  return <CheckoutExperience />
}

