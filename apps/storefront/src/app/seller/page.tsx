import type { Metadata } from "next"
import { SellerWorkspace } from "@/components/seller-workspace"

export const metadata: Metadata = { title: "Seller workspace | EMBER" }

export default function SellerPage() {
  return <SellerWorkspace view="dashboard" />
}
