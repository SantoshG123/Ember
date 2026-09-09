import type { Metadata } from "next"
import { SellerWorkspace } from "@/components/seller-workspace"

export const metadata: Metadata = { title: "Seller proposal | EMBER" }

export default async function SellerBidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SellerWorkspace view="bid" bidId={id} />
}
